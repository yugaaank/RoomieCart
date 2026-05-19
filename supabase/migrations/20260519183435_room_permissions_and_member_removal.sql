CREATE OR REPLACE FUNCTION public.is_room_owner(room_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.rooms
    WHERE id = room_id_param
      AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Members can delete items." ON public.shopping_items;

CREATE POLICY "Item creators or room owners can delete items."
ON public.shopping_items
FOR DELETE
USING (
  added_by = auth.uid()
  OR public.is_room_owner(room_id)
);

CREATE OR REPLACE FUNCTION public.remove_room_member(
  room_id_param UUID,
  member_user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  room_row public.rooms%ROWTYPE;
BEGIN
  SELECT *
  INTO room_row
  FROM public.rooms
  WHERE id = room_id_param;

  IF room_row.id IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF room_row.owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the room owner can remove members';
  END IF;

  IF member_user_id_param = auth.uid() THEN
    RAISE EXCEPTION 'Room owner cannot remove themselves';
  END IF;

  IF member_user_id_param = room_row.owner_id THEN
    RAISE EXCEPTION 'Room owner cannot be removed';
  END IF;

  DELETE FROM public.room_members
  WHERE room_id = room_id_param
    AND user_id = member_user_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found in this room';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
