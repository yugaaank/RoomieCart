CREATE TABLE public.item_change_request_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES public.item_change_requests(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('yes', 'no')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(request_id, voter_id)
);

ALTER TABLE public.item_change_request_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view change request votes."
ON public.item_change_request_votes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.item_change_requests icr
    JOIN public.shopping_items si ON si.id = icr.item_id
    WHERE icr.id = public.item_change_request_votes.request_id
    AND public.is_room_member(si.room_id)
  )
);

CREATE POLICY "Users can create their own change request votes."
ON public.item_change_request_votes
FOR INSERT
WITH CHECK (
  voter_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.item_change_requests icr
    JOIN public.shopping_items si ON si.id = icr.item_id
    WHERE icr.id = public.item_change_request_votes.request_id
    AND public.is_room_member(si.room_id)
  )
);

CREATE POLICY "Users can update their own change request votes."
ON public.item_change_request_votes
FOR UPDATE
USING (voter_id = auth.uid())
WITH CHECK (voter_id = auth.uid());

CREATE TRIGGER update_item_change_request_votes_updated_at
  BEFORE UPDATE ON public.item_change_request_votes
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.apply_approved_change_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE public.shopping_items
    SET
      quantity = NEW.new_quantity,
      status = 'active',
      updated_at = NOW()
    WHERE id = NEW.item_id;
    NEW.resolved_at = NOW();
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    UPDATE public.shopping_items
    SET
      status = 'active',
      updated_at = NOW()
    WHERE id = NEW.item_id;
    NEW.resolved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.submit_change_request_vote(
  request_id_param UUID,
  vote_param TEXT
)
RETURNS public.item_change_requests AS $$
DECLARE
  request_row public.item_change_requests%ROWTYPE;
  room_id_param UUID;
  eligible_voter_count INTEGER;
  yes_vote_count INTEGER;
  no_vote_count INTEGER;
BEGIN
  IF vote_param NOT IN ('yes', 'no') THEN
    RAISE EXCEPTION 'Vote must be yes or no';
  END IF;

  SELECT icr.*
  INTO request_row
  FROM public.item_change_requests icr
  WHERE icr.id = request_id_param;

  IF request_row.id IS NULL THEN
    RAISE EXCEPTION 'Change request not found';
  END IF;

  IF request_row.status <> 'pending' THEN
    RAISE EXCEPTION 'This change request has already been resolved';
  END IF;

  IF request_row.requested_by = auth.uid() THEN
    RAISE EXCEPTION 'Request creator cannot vote on their own request';
  END IF;

  SELECT si.room_id
  INTO room_id_param
  FROM public.shopping_items si
  WHERE si.id = request_row.item_id;

  IF room_id_param IS NULL OR NOT public.is_room_member(room_id_param) THEN
    RAISE EXCEPTION 'You are not allowed to vote on this request';
  END IF;

  INSERT INTO public.item_change_request_votes (request_id, voter_id, vote)
  VALUES (request_id_param, auth.uid(), vote_param)
  ON CONFLICT (request_id, voter_id)
  DO UPDATE SET
    vote = EXCLUDED.vote,
    updated_at = NOW();

  SELECT COUNT(*)
  INTO eligible_voter_count
  FROM public.room_members rm
  WHERE rm.room_id = room_id_param
    AND rm.status = 'active'
    AND rm.user_id <> request_row.requested_by;

  SELECT COUNT(*)
  INTO yes_vote_count
  FROM public.item_change_request_votes icrv
  WHERE icrv.request_id = request_id_param
    AND icrv.vote = 'yes';

  SELECT COUNT(*)
  INTO no_vote_count
  FROM public.item_change_request_votes icrv
  WHERE icrv.request_id = request_id_param
    AND icrv.vote = 'no';

  IF no_vote_count > 0 THEN
    UPDATE public.item_change_requests
    SET
      status = 'rejected',
      resolved_by = auth.uid()
    WHERE id = request_id_param
    RETURNING * INTO request_row;
  ELSIF eligible_voter_count = 0 OR yes_vote_count >= eligible_voter_count THEN
    UPDATE public.item_change_requests
    SET
      status = 'approved',
      resolved_by = auth.uid()
    WHERE id = request_id_param
    RETURNING * INTO request_row;
  ELSE
    SELECT icr.*
    INTO request_row
    FROM public.item_change_requests icr
    WHERE icr.id = request_id_param;
  END IF;

  RETURN request_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
