CREATE OR REPLACE FUNCTION public.cancel_change_request(request_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  request_row public.item_change_requests%ROWTYPE;
BEGIN
  SELECT *
  INTO request_row
  FROM public.item_change_requests
  WHERE id = request_id_param;

  IF request_row.id IS NULL THEN
    RAISE EXCEPTION 'Change request not found';
  END IF;

  IF request_row.requested_by <> auth.uid() THEN
    RAISE EXCEPTION 'Only the request creator can cancel this request';
  END IF;

  IF request_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending requests can be cancelled';
  END IF;

  UPDATE public.shopping_items
  SET
    status = 'active',
    updated_at = NOW()
  WHERE id = request_row.item_id;

  DELETE FROM public.item_change_requests
  WHERE id = request_id_param;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
