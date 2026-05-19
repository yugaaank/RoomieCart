-- 1. Add new columns to item_change_requests
ALTER TABLE public.item_change_requests
ADD COLUMN new_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN old_data JSONB DEFAULT '{}'::jsonb;

-- 2. Migrate existing quantity data to new_data/old_data
UPDATE public.item_change_requests
SET 
  new_data = jsonb_build_object('quantity', new_quantity),
  old_data = jsonb_build_object('quantity', old_quantity);

-- 3. Update the trigger function to apply generic changes
CREATE OR REPLACE FUNCTION public.apply_approved_change_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE public.shopping_items
    SET
      name = COALESCE((NEW.new_data->>'name'), name),
      normalized_name = COALESCE(LOWER(NEW.new_data->>'name'), normalized_name),
      quantity = COALESCE((NEW.new_data->>'quantity'), quantity),
      unit = CASE WHEN NEW.new_data ? 'unit' THEN (NEW.new_data->>'unit') ELSE unit END,
      target_member_ids = CASE 
        WHEN NEW.new_data ? 'target_member_ids' THEN 
          ARRAY(SELECT jsonb_array_elements_text(NEW.new_data->'target_member_ids'))::UUID[]
        ELSE target_member_ids 
      END,
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
