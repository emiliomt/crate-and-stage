-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  spotify_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create follows table
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own follows"
  ON public.follows FOR ALL
  USING (auth.uid() = follower_id);

-- Create board_type enum
CREATE TYPE public.board_type AS ENUM ('album', 'artist', 'vinyl', 'concert', 'mixed');

-- Create boards table
CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  board_type public.board_type NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public boards viewable by everyone"
  ON public.boards FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own boards"
  ON public.boards FOR ALL
  USING (auth.uid() = user_id);

-- Create board_items table
CREATE TABLE public.board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE NOT NULL,
  spotify_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  image_url TEXT,
  release_date TEXT,
  notes TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.board_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Board items viewable with board"
  ON public.board_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_items.board_id
      AND (boards.is_public = true OR boards.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage items in own boards"
  ON public.board_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = board_items.board_id
      AND boards.user_id = auth.uid()
    )
  );

-- Create user_media table (vinyl collection/wishlist)
CREATE TABLE public.user_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  spotify_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'wishlist' CHECK (status IN ('owned', 'wishlist')),
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, spotify_id)
);

ALTER TABLE public.user_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User media viewable by everyone"
  ON public.user_media FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own media"
  ON public.user_media FOR ALL
  USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();