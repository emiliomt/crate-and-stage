-- Create album_reviews table for user reviews
CREATE TABLE IF NOT EXISTS public.album_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  spotify_album_id TEXT NOT NULL,
  album_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_image TEXT,
  rating NUMERIC NOT NULL CHECK (rating >= 0.5 AND rating <= 5),
  review_text TEXT NOT NULL CHECK (char_length(review_text) >= 10 AND char_length(review_text) <= 5000),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, spotify_album_id)
);

-- Enable RLS
ALTER TABLE public.album_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view album reviews"
  ON public.album_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own album reviews"
  ON public.album_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own album reviews"
  ON public.album_reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own album reviews"
  ON public.album_reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX idx_album_reviews_spotify_album_id ON public.album_reviews(spotify_album_id);
CREATE INDEX idx_album_reviews_user_id ON public.album_reviews(user_id);
CREATE INDEX idx_album_reviews_created_at ON public.album_reviews(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_album_reviews_updated_at
  BEFORE UPDATE ON public.album_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();