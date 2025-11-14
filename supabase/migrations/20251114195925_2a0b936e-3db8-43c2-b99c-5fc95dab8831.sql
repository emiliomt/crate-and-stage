-- Create album_ratings table for user album ratings
CREATE TABLE IF NOT EXISTS public.album_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spotify_album_id TEXT NOT NULL,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  album_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, spotify_album_id)
);

-- Enable RLS
ALTER TABLE public.album_ratings ENABLE ROW LEVEL SECURITY;

-- Policies for album_ratings
CREATE POLICY "Users can view all album ratings"
  ON public.album_ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own album ratings"
  ON public.album_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own album ratings"
  ON public.album_ratings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own album ratings"
  ON public.album_ratings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_album_ratings_spotify_id ON public.album_ratings(spotify_album_id);
CREATE INDEX idx_album_ratings_user_id ON public.album_ratings(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_album_ratings_updated_at
  BEFORE UPDATE ON public.album_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create listen_later table for user's listen later queue
CREATE TABLE IF NOT EXISTS public.listen_later (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spotify_album_id TEXT NOT NULL,
  album_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_image TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, spotify_album_id)
);

-- Enable RLS
ALTER TABLE public.listen_later ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own listen later"
  ON public.listen_later
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_listen_later_user_id ON public.listen_later(user_id);