ALTER TABLE public.shopping_items
  ADD COLUMN target_member_ids UUID[] DEFAULT '{}'::uuid[];

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
  item_target_member_ids UUID[];
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

  SELECT
    si.room_id,
    si.target_member_ids
  INTO
    room_id_param,
    item_target_member_ids
  FROM public.shopping_items si
  WHERE si.id = request_row.item_id;

  IF room_id_param IS NULL OR NOT public.is_room_member(room_id_param) THEN
    RAISE EXCEPTION 'You are not allowed to vote on this request';
  END IF;

  IF coalesce(array_length(item_target_member_ids, 1), 0) > 0
     AND NOT auth.uid() = ANY(item_target_member_ids) THEN
    RAISE EXCEPTION 'Only selected roommates can vote on this request';
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
    AND rm.user_id <> request_row.requested_by
    AND (
      coalesce(array_length(item_target_member_ids, 1), 0) = 0
      OR rm.user_id = ANY(item_target_member_ids)
    );

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
