-- 1. Create a security definer function to check room membership
-- This bypasses RLS recursion because it runs with the privileges of the creator (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_room_member(room_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = room_id_param
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view rooms they are members of." ON public.rooms;
DROP POLICY IF EXISTS "Members can view other members in the same room." ON public.room_members;
DROP POLICY IF EXISTS "Members can view items in their rooms." ON public.shopping_items;
DROP POLICY IF EXISTS "Members can add items to their rooms." ON public.shopping_items;
DROP POLICY IF EXISTS "Members can update items in their rooms." ON public.shopping_items;
DROP POLICY IF EXISTS "Members can delete items in their rooms." ON public.shopping_items;
DROP POLICY IF EXISTS "Members can view change requests in their rooms." ON public.item_change_requests;
DROP POLICY IF EXISTS "Members can create change requests." ON public.item_change_requests;

-- 3. Re-create policies using the helper function

-- Rooms
CREATE POLICY "Users can view rooms they are members of." ON public.rooms 
FOR SELECT USING (owner_id = auth.uid() OR public.is_room_member(id));

-- Room Members
CREATE POLICY "Members can view room members." ON public.room_members 
FOR SELECT USING (user_id = auth.uid() OR public.is_room_member(room_id));

-- Shopping Items
CREATE POLICY "Members can view items." ON public.shopping_items 
FOR SELECT USING (public.is_room_member(room_id));

CREATE POLICY "Members can add items." ON public.shopping_items 
FOR INSERT WITH CHECK (public.is_room_member(room_id));

CREATE POLICY "Members can update items." ON public.shopping_items 
FOR UPDATE USING (public.is_room_member(room_id));

CREATE POLICY "Members can delete items." ON public.shopping_items 
FOR DELETE USING (public.is_room_member(room_id));

-- Change Requests
CREATE POLICY "Members can view change requests." ON public.item_change_requests 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.shopping_items si
    WHERE si.id = public.item_change_requests.item_id 
    AND public.is_room_member(si.room_id)
  )
);

CREATE POLICY "Members can create change requests." ON public.item_change_requests 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shopping_items si
    WHERE si.id = public.item_change_requests.item_id 
    AND public.is_room_member(si.room_id)
  )
);
