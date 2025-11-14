-- Create track_ratings table for individual song ratings
CREATE TABLE IF NOT EXISTS public.track_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  spotify_track_id TEXT NOT NULL,
  spotify_album_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  rating NUMERIC NOT NULL CHECK (rating >= 0.5 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, spotify_track_id)
);

-- Enable RLS
ALTER TABLE public.track_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all track ratings"
  ON public.track_ratings
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own track ratings"
  ON public.track_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own track ratings"
  ON public.track_ratings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own track ratings"
  ON public.track_ratings
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_track_ratings_spotify_track_id ON public.track_ratings(spotify_track_id);
CREATE INDEX idx_track_ratings_user_track ON public.track_ratings(user_id, spotify_track_id);

-- Create trigger for updated_at
CREATE TRIGGER update_track_ratings_updated_at
  BEFORE UPDATE ON public.track_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();