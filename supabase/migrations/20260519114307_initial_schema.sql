-- 1. Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Rooms table
CREATE TABLE public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) NOT NULL,
  max_members INTEGER DEFAULT 10,
  settings_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Room Members table
CREATE TABLE public.room_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'left', 'removed')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- 4. Shopping Items table
CREATE TABLE public.shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  quantity TEXT DEFAULT '1',
  unit TEXT,
  added_by UUID REFERENCES public.profiles(id) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'purchased', 'archived', 'discussion_pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Row Level Security (RLS)

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view rooms they are members of." ON public.rooms FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = public.rooms.id AND user_id = auth.uid()
  )
);
CREATE POLICY "Users can create rooms." ON public.rooms FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update rooms." ON public.rooms FOR UPDATE USING (auth.uid() = owner_id);

-- Room Members
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view other members in the same room." ON public.room_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.room_members AS my_membership
    WHERE my_membership.room_id = public.room_members.room_id AND my_membership.user_id = auth.uid()
  )
);
CREATE POLICY "Users can join rooms." ON public.room_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shopping Items
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view items in their rooms." ON public.shopping_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = public.shopping_items.room_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Members can add items to their rooms." ON public.shopping_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = public.shopping_items.room_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Members can update items in their rooms." ON public.shopping_items FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = public.shopping_items.room_id AND user_id = auth.uid()
  )
);
CREATE POLICY "Members can delete items in their rooms." ON public.shopping_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = public.shopping_items.room_id AND user_id = auth.uid()
  )
);

-- 6. Functions and Triggers

-- Automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email, new.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update room updated_at on change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER update_shopping_items_updated_at
  BEFORE UPDATE ON public.shopping_items
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
