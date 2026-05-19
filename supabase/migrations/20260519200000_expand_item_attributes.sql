-- 1. Add new columns to shopping_items
ALTER TABLE public.shopping_items
ADD COLUMN category TEXT,
ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
ADD COLUMN notes TEXT,
ADD COLUMN estimated_price NUMERIC(10, 2),
ADD COLUMN store TEXT;

-- 2. Update the apply_approved_change_request function to handle all new attributes
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
      category = CASE WHEN NEW.new_data ? 'category' THEN (NEW.new_data->>'category') ELSE category END,
      priority = CASE WHEN NEW.new_data ? 'priority' THEN (NEW.new_data->>'priority') ELSE priority END,
      notes = CASE WHEN NEW.new_data ? 'notes' THEN (NEW.new_data->>'notes') ELSE notes END,
      estimated_price = CASE WHEN NEW.new_data ? 'estimated_price' THEN (NEW.new_data->>'estimated_price')::NUMERIC ELSE estimated_price END,
      store = CASE WHEN NEW.new_data ? 'store' THEN (NEW.new_data->>'store') ELSE store END,
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
