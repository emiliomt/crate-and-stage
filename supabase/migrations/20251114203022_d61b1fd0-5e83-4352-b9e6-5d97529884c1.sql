-- Drop constraints if they exist (silently)
ALTER TABLE album_ratings DROP CONSTRAINT IF EXISTS album_ratings_user_id_fkey;
ALTER TABLE album_reviews DROP CONSTRAINT IF EXISTS album_reviews_user_id_fkey;

-- Add foreign key relationships to profiles table
ALTER TABLE album_ratings
ADD CONSTRAINT album_ratings_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

ALTER TABLE album_reviews
ADD CONSTRAINT album_reviews_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;