-- Add engagement metrics to boards table
ALTER TABLE boards 
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Create board_likes table
CREATE TABLE IF NOT EXISTS board_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_board_likes_board ON board_likes(board_id);
CREATE INDEX IF NOT EXISTS idx_board_likes_user ON board_likes(user_id);

-- Enable RLS on board_likes
ALTER TABLE board_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for board_likes
CREATE POLICY "Board likes viewable by everyone"
  ON board_likes FOR SELECT 
  USING (true);

CREATE POLICY "Users can manage own likes"
  ON board_likes FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);