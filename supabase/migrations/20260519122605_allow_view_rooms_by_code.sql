-- Allow any authenticated user to SELECT from the rooms table.
-- This is necessary so they can find a room by its invite_code before joining it.
-- Since rooms don't contain sensitive data (only names and codes), this is acceptable.
-- Shopping items and members are still protected by their own strict policies.

DROP POLICY IF EXISTS "Users can view rooms they are members of." ON public.rooms;

CREATE POLICY "Anyone can view rooms (to support joining via code)." 
ON public.rooms 
FOR SELECT 
USING (auth.uid() IS NOT NULL);
