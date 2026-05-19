-- 1. Item Change Requests (Quantity Negotiation)
CREATE TABLE public.item_change_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.shopping_items(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES public.profiles(id) NOT NULL,
  old_quantity TEXT,
  new_quantity TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ
);

-- 2. Discussions
CREATE TABLE public.discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.shopping_items(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Discussion Messages
CREATE TABLE public.discussion_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS Policies

ALTER TABLE public.item_change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view change requests in their rooms." ON public.item_change_requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.shopping_items si
    JOIN public.room_members rm ON si.room_id = rm.room_id
    WHERE si.id = public.item_change_requests.item_id AND rm.user_id = auth.uid()
  )
);
CREATE POLICY "Members can create change requests." ON public.item_change_requests FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shopping_items si
    JOIN public.room_members rm ON si.room_id = rm.room_id
    WHERE si.id = public.item_change_requests.item_id AND rm.user_id = auth.uid()
  )
);

ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view discussions." ON public.discussions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = public.discussions.room_id AND user_id = auth.uid()
  )
);

ALTER TABLE public.discussion_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view discussion messages." ON public.discussion_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.discussions d
    JOIN public.room_members rm ON d.room_id = rm.room_id
    WHERE d.id = public.discussion_messages.discussion_id AND rm.user_id = auth.uid()
  )
);
CREATE POLICY "Members can send messages." ON public.discussion_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.discussions d
    JOIN public.room_members rm ON d.room_id = rm.room_id
    WHERE d.id = public.discussion_messages.discussion_id AND rm.user_id = auth.uid()
  )
);

-- 5. Logic to apply approved change requests
CREATE OR REPLACE FUNCTION public.apply_approved_change_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE public.shopping_items
    SET quantity = NEW.new_quantity, updated_at = NOW()
    WHERE id = NEW.item_id;
    NEW.resolved_at = NOW();
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    NEW.resolved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_change_request_status_update
  BEFORE UPDATE ON public.item_change_requests
  FOR EACH ROW EXECUTE PROCEDURE public.apply_approved_change_request();
