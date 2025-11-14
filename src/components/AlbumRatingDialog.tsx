import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Album {
  id: string;
  name: string;
  artist: string;
  image: string;
  releaseDate: string;
  type: string;
}

interface AlbumRatingDialogProps {
  album: Album | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlbumRatingDialog({ album, open, onOpenChange }: AlbumRatingDialogProps) {
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (album && open) {
      fetchRatings();
    }
  }, [album, open]);

  const fetchRatings = async () => {
    if (!album) return;

    try {
      // Fetch user's rating
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userRatingData } = await supabase
          .from("ratings")
          .select("rating")
          .eq("spotify_id", album.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (userRatingData) {
          setUserRating(userRatingData.rating);
        } else {
          setUserRating(0);
        }
      }

      // Fetch average rating and count
      const { data: allRatings } = await supabase
        .from("ratings")
        .select("rating")
        .eq("spotify_id", album.id);

      if (allRatings && allRatings.length > 0) {
        const sum = allRatings.reduce((acc, r) => acc + Number(r.rating), 0);
        setAvgRating(sum / allRatings.length);
        setTotalRatings(allRatings.length);
      } else {
        setAvgRating(0);
        setTotalRatings(0);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  const handleRating = async (rating: number) => {
    if (!album) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to rate albums",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("ratings")
        .upsert({
          user_id: user.id,
          spotify_id: album.id,
          rating: rating,
          album_name: album.name,
          artist_name: album.artist,
          image_url: album.image,
        });

      if (error) throw error;

      setUserRating(rating);
      await fetchRatings();

      toast({
        title: "Rating saved",
        description: `You rated ${album.name} ${rating} stars`,
      });
    } catch (error) {
      console.error("Error saving rating:", error);
      toast({
        title: "Error",
        description: "Failed to save rating",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!album) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background border-border">
        <DialogHeader>
          <div className="flex gap-6">
            <img
              src={album.image}
              alt={album.name}
              className="w-48 h-48 rounded-lg object-cover"
            />
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-3xl font-bold text-foreground">{album.name}</h2>
                <p className="text-muted-foreground mt-1">
                  {album.type} • {album.releaseDate}
                </p>
                <p className="text-foreground font-medium mt-2">{album.artist}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{totalRatings}</div>
                  <div className="text-sm text-muted-foreground">Total ratings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    {avgRating > 0 ? avgRating.toFixed(1) : "0.0"} / 5
                  </div>
                  <div className="text-sm text-muted-foreground">Average rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                    <Star className="w-5 h-5 fill-muted text-muted" />
                    {userRating > 0 ? userRating.toFixed(1) : "0"} / 5
                  </div>
                  <div className="text-sm text-muted-foreground">Your rating</div>
                </div>
              </div>

              <div>
                <Button
                  onClick={() => {}}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Rate Album
                </Button>
                <div className="flex justify-center gap-2 mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      disabled={loading}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || userRating)
                            ? "fill-yellow-500 text-yellow-500"
                            : "fill-muted text-muted"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
