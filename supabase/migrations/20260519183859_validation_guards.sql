UPDATE public.shopping_items
SET
  name = CASE
    WHEN char_length(btrim(regexp_replace(name, '\s+', ' ', 'g'))) = 0 THEN 'Untitled item'
    ELSE left(btrim(regexp_replace(name, '\s+', ' ', 'g')), 80)
  END,
  quantity = CASE
    WHEN coalesce(substring(btrim(quantity) from '([0-9]+(\.[0-9]+)?)'), '') = '' THEN '1'
    ELSE least(
      999::numeric,
      greatest(
        0.01::numeric,
        (substring(btrim(quantity) from '([0-9]+(\.[0-9]+)?)'))::numeric
      )
    )::text
  END;

UPDATE public.item_change_requests
SET
  old_quantity = CASE
    WHEN old_quantity IS NULL THEN NULL
    WHEN coalesce(substring(btrim(old_quantity) from '([0-9]+(\.[0-9]+)?)'), '') = '' THEN '1'
    ELSE least(
      999::numeric,
      greatest(
        0.01::numeric,
        (substring(btrim(old_quantity) from '([0-9]+(\.[0-9]+)?)'))::numeric
      )
    )::text
  END,
  new_quantity = CASE
    WHEN coalesce(substring(btrim(new_quantity) from '([0-9]+(\.[0-9]+)?)'), '') = '' THEN '1'
    ELSE least(
      999::numeric,
      greatest(
        0.01::numeric,
        (substring(btrim(new_quantity) from '([0-9]+(\.[0-9]+)?)'))::numeric
      )
    )::text
  END;

UPDATE public.rooms
SET
  name = CASE
    WHEN char_length(btrim(regexp_replace(name, '\s+', ' ', 'g'))) = 0 THEN 'Untitled room'
    ELSE left(btrim(regexp_replace(name, '\s+', ' ', 'g')), 60)
  END;

UPDATE public.profiles
SET
  name = CASE
    WHEN name IS NULL THEN NULL
    WHEN char_length(btrim(regexp_replace(name, '\s+', ' ', 'g'))) = 0 THEN NULL
    ELSE left(btrim(regexp_replace(name, '\s+', ' ', 'g')), 40)
  END;

ALTER TABLE public.shopping_items
  ADD CONSTRAINT shopping_items_name_length_check
  CHECK (char_length(btrim(name)) BETWEEN 1 AND 80);

ALTER TABLE public.shopping_items
  ADD CONSTRAINT shopping_items_quantity_format_check
  CHECK (
    btrim(quantity) ~ '^\d+(\.\d+)?$'
    AND (btrim(quantity))::numeric > 0
    AND (btrim(quantity))::numeric <= 999
  );

ALTER TABLE public.item_change_requests
  ADD CONSTRAINT item_change_requests_new_quantity_format_check
  CHECK (
    btrim(new_quantity) ~ '^\d+(\.\d+)?$'
    AND (btrim(new_quantity))::numeric > 0
    AND (btrim(new_quantity))::numeric <= 999
  );

ALTER TABLE public.rooms
  ADD CONSTRAINT rooms_name_length_check
  CHECK (char_length(btrim(name)) BETWEEN 1 AND 60);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_name_length_check
  CHECK (name IS NULL OR char_length(btrim(name)) BETWEEN 1 AND 40);
