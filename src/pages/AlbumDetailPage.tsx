import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Star, Music, Calendar, Clock, Globe, 
  FileText, ListMusic, Share2, Copy, Heart, Ticket, ExternalLink, Disc3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { DiscogsVinylResult } from "@/types/discogs";

interface AlbumData {
  id: string;
  name: string;
  artist: string;
  artists: any[];
  image: string;
  releaseDate: string;
  type: string;
  totalTracks?: number;
  duration?: number;
  label?: string;
  spotifyUrl?: string;
  popularity?: number;
  genres?: string[];
  copyrights?: Array<{ text: string; type: string }>;
  availableMarkets?: number;
}

interface TrackData {
  id: string;
  name: string;
  duration_ms: number;
  track_number: number;
  artists: string[];
  explicit?: boolean;
}

interface TrackRatingData {
  spotify_track_id: string;
  user_rating: number;
  avg_rating: number;
  total_ratings: number;
}

interface RatingData {
  user_id: string;
  rating: number;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

interface ReviewData {
  id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export default function AlbumDetailPage() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [friendsRatings, setFriendsRatings] = useState<RatingData[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [selectedLyrics, setSelectedLyrics] = useState<{ track: string; url: string } | null>(null);
  const [concerts, setConcerts] = useState<any[]>([]);
  const [concertsLoading, setConcertsLoading] = useState(false);
  const [trackRatings, setTrackRatings] = useState<Map<string, TrackRatingData>>(new Map());
  const [trackRatingDialog, setTrackRatingDialog] = useState<{ open: boolean; track: TrackData | null }>({ open: false, track: null });
  const [trackHoverRating, setTrackHoverRating] = useState<number>(0);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [userReview, setUserReview] = useState<ReviewData | null>(null);
  const [vinylResults, setVinylResults] = useState<DiscogsVinylResult[]>([]);
  const [vinylLoading, setVinylLoading] = useState(false);
  const [vinylDialogOpen, setVinylDialogOpen] = useState(false);

  useEffect(() => {
    if (albumId) {
      fetchAlbumData();
      fetchRatings();
      fetchFriendsRatings();
      fetchTrackRatings();
      fetchReviews();
    }
  }, [albumId]);

  const fetchAlbumData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-album-details', {
        body: { albumId },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setAlbum(data);
      setTracks(data.tracks || []);

      // Fetch concerts for the artist
      if (data.artist) {
        fetchConcerts(data.artist);
      }
    } catch (error) {
      console.error('Error fetching album:', error);
      toast.error("Failed to load album");
    } finally {
      setLoading(false);
    }
  };

  const fetchConcerts = async (artistName: string) => {
    setConcertsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bandsintown-api', {
        body: { action: 'getEvents', artistName, dateRange: 'upcoming' }
      });

      if (data?.error) {
        console.log('Concerts unavailable:', data.error);
        setConcerts([]);
        return;
      }

      if (!error && Array.isArray(data)) {
        setConcerts(data.slice(0, 5)); // Show first 5 concerts
      } else if (!error && data?.events && Array.isArray(data.events)) {
        setConcerts(data.events.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching concerts:', error);
      setConcerts([]);
    } finally {
      setConcertsLoading(false);
    }
  };

  const fetchRatings = async () => {
    if (!albumId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch user's rating
      if (user) {
        const { data: userRatingData } = await supabase
          .from("album_ratings")
          .select("rating")
          .eq("spotify_album_id", albumId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (userRatingData) {
          setUserRating(userRatingData.rating);
        }
      }

      // Fetch all ratings for stats
      const { data: allRatings } = await supabase
        .from("album_ratings")
        .select("rating")
        .eq("spotify_album_id", albumId);

      if (allRatings && allRatings.length > 0) {
        const sum = allRatings.reduce((acc, r) => acc + Number(r.rating), 0);
        setAvgRating(sum / allRatings.length);
        setTotalRatings(allRatings.length);

        // Calculate distribution
        const dist = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        allRatings.forEach(r => {
          const index = Math.floor(Number(r.rating) * 2) - 1;
          if (index >= 0 && index < 10) dist[index]++;
        });
        setRatingDistribution(dist);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  const fetchFriendsRatings = async () => {
    if (!albumId) return;

    try {
      const { data } = await supabase
        .from("album_ratings")
        .select("user_id, rating, profiles(username, display_name, avatar_url)")
        .eq("spotify_album_id", albumId)
        .limit(10);

      if (data) {
        setFriendsRatings(data as any);
      }
    } catch (error) {
      console.error("Error fetching friends ratings:", error);
    }
  };

  const fetchTrackRatings = async () => {
    if (!albumId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch all track ratings for this album
      const { data: allRatings } = await supabase
        .from("track_ratings")
        .select("spotify_track_id, rating, user_id")
        .eq("spotify_album_id", albumId);

      if (allRatings) {
        const ratingsMap = new Map<string, TrackRatingData>();
        
        // Calculate average ratings and user ratings per track
        allRatings.forEach((rating: any) => {
          const trackId = rating.spotify_track_id;
          const existing = ratingsMap.get(trackId);
          
          if (existing) {
            existing.total_ratings += 1;
            existing.avg_rating = ((existing.avg_rating * (existing.total_ratings - 1)) + rating.rating) / existing.total_ratings;
            if (user && rating.user_id === user.id) {
              existing.user_rating = rating.rating;
            }
          } else {
            ratingsMap.set(trackId, {
              spotify_track_id: trackId,
              user_rating: (user && rating.user_id === user.id) ? rating.rating : 0,
              avg_rating: rating.rating,
              total_ratings: 1,
            });
          }
        });
        
        setTrackRatings(ratingsMap);
      }
    } catch (error) {
      console.error("Error fetching track ratings:", error);
    }
  };

  const handleTrackRating = async (track: TrackData, rating: number) => {
    if (!album) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to rate");
        return;
      }

      const { error } = await supabase
        .from("track_ratings")
        .upsert({
          user_id: user.id,
          spotify_track_id: track.id,
          spotify_album_id: albumId!,
          track_name: track.name,
          artist_name: track.artists.join(", "),
          rating: rating,
        });

      if (error) throw error;

      await fetchTrackRatings();
      setTrackRatingDialog({ open: false, track: null });
      setTrackHoverRating(0);

      toast.success(`Rated ${track.name} ${rating} stars`);
    } catch (error) {
      console.error("Error saving track rating:", error);
      toast.error("Failed to save rating");
    }
  };

  const fetchVinylAvailability = async () => {
    if (!album) return;

    setVinylLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('discogs-vinyl', {
        body: { 
          artist: album.artist,
          album: album.name 
        }
      });

      if (error) throw error;

      if (data?.results) {
        setVinylResults(data.results);
      }
    } catch (error) {
      console.error('Error fetching vinyl availability:', error);
    } finally {
      setVinylLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!albumId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch all reviews for this album with user profiles
      const { data: allReviews, error } = await supabase
        .from("album_reviews")
        .select("*, profiles(username, display_name, avatar_url)")
        .eq("spotify_album_id", albumId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (allReviews) {
        setReviews(allReviews as any);
        
        // Find user's review if exists
        const userReviewData = allReviews.find((r: any) => r.user_id === user?.id);
        if (userReviewData) {
          setUserReview(userReviewData as any);
          setReviewText(userReviewData.review_text);
          setReviewRating(userReviewData.rating);
        }
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleOpenReviewDialog = () => {
    if (userReview) {
      setReviewText(userReview.review_text);
      setReviewRating(userReview.rating);
    } else {
      setReviewText("");
      setReviewRating(userRating || 0);
    }
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!album) return;

    if (!reviewText || reviewText.length < 10) {
      toast.error("Review must be at least 10 characters long");
      return;
    }

    if (!reviewRating) {
      toast.error("Please select a rating");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to write a review");
        return;
      }

      const reviewData = {
        user_id: user.id,
        spotify_album_id: albumId!,
        album_name: album.name,
        artist_name: album.artist,
        album_image: album.image,
        rating: reviewRating,
        review_text: reviewText,
      };

      const { error } = await supabase
        .from("album_reviews")
        .upsert(reviewData);

      if (error) throw error;

      await fetchReviews();
      setReviewDialogOpen(false);
      setReviewHoverRating(0);

      toast.success(userReview ? "Review updated successfully" : "Review published successfully");
    } catch (error) {
      console.error("Error saving review:", error);
      toast.error("Failed to save review");
    }
  };

  const handleRating = async (rating: number) => {
    if (!album) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to rate");
        return;
      }

      const { error } = await supabase
        .from("album_ratings")
        .upsert({
          user_id: user.id,
          spotify_album_id: album.id,
          rating: rating,
          album_name: album.name,
          artist_name: album.artist,
          album_image: album.image,
        });

      if (error) throw error;

      setUserRating(rating);
      await fetchRatings();
      setRatingDialogOpen(false);

      toast.success(`Rated ${album.name} ${rating} stars`);
    } catch (error) {
      console.error("Error saving rating:", error);
      toast.error("Failed to save rating");
    }
  };

  const handleAddToListenLater = async () => {
    if (!album) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in");
        return;
      }

      const { error } = await supabase
        .from("listen_later")
        .upsert({
          user_id: user.id,
          spotify_album_id: album.id,
          album_name: album.name,
          artist_name: album.artist,
          album_image: album.image,
        });

      if (error) throw error;

      toast.success("Added to Listen Later");
    } catch (error: any) {
      if (error.code === '23505') {
        toast.info("Already in Listen Later");
      } else {
        toast.error("Failed to add to Listen Later");
      }
    }
  };

  const handleViewLyrics = async (trackName: string) => {
    try {
      const { data } = await supabase.functions.invoke('genius-lyrics', {
        body: { action: 'search', query: `${trackName} ${album?.artist}` }
      });

      if (data?.error) {
        toast.info(data.error);
        return;
      }

      if (data?.response?.hits && data.response.hits.length > 0) {
        const song = data.response.hits[0].result;
        setSelectedLyrics({
          track: trackName,
          url: song.url
        });
      } else {
        toast.info("Lyrics not found for this track");
      }
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      toast.error("Lyrics service temporarily unavailable");
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    const total = tracks.reduce((sum, track) => sum + track.duration_ms, 0);
    const minutes = Math.floor(total / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    return `${minutes} minutes ${seconds} seconds`;
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("URL copied to clipboard");
  };

  const shareToX = () => {
    const text = `Check out ${album?.name} by ${album?.artist}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  if (loading || !album) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading album...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card p-4 sticky top-0 z-10">
        <div className="container mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate('/feed')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feed
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Album Art and Info */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="md:col-span-1">
                <img
                  src={album.image}
                  alt={album.name}
                  className="w-full rounded-lg shadow-lg"
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{album.name}</h1>
                  <p className="text-xl text-muted-foreground mb-1">{album.artist}</p>
                  <p className="text-sm text-muted-foreground">
                    {album.type} • {album.releaseDate} • {album.totalTracks} Tracks
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{totalRatings}</div>
                    <div className="text-sm text-muted-foreground">Total ratings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold flex items-center justify-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                      {avgRating > 0 ? avgRating.toFixed(1) : "0.0"} / 5
                    </div>
                    <div className="text-sm text-muted-foreground">Average rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold flex items-center justify-center gap-1">
                      <Star className="w-5 h-5 fill-muted text-muted" />
                      {userRating > 0 ? userRating.toFixed(1) : "0"} / 5
                    </div>
                    <div className="text-sm text-muted-foreground">Your rating</div>
                  </div>
                </div>

                <Button
                  onClick={() => setRatingDialogOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Rate Album
                </Button>
              </div>
            </div>

            <Tabs defaultValue="home" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="home">Home</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="lists">Lists</TabsTrigger>
                <TabsTrigger value="ratings">Ratings</TabsTrigger>
              </TabsList>

              <TabsContent value="home" className="space-y-6 mt-6">
                {/* Tracklist */}
                <div>
                  <h2 className="text-2xl font-bold mb-4">Tracklist</h2>
                  <div className="space-y-2">
                    {tracks.map((track) => (
                      <Card key={track.id} className="hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <span className="text-muted-foreground font-medium w-8">
                                {track.track_number}
                              </span>
                              <div className="flex-1">
                                <h3 className="font-semibold">{track.name}</h3>
                                <p className="text-sm text-muted-foreground">{track.artists.join(", ")}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewLyrics(track.name)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Lyrics
                              </Button>
                              <span className="text-sm text-muted-foreground">
                                {formatDuration(track.duration_ms)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => setTrackRatingDialog({ open: true, track })}
                              >
                                <Star 
                                  className={`h-4 w-4 ${
                                    trackRatings.get(track.id)?.user_rating 
                                      ? "fill-yellow-500 text-yellow-500" 
                                      : "text-muted"
                                  }`}
                                />
                                <span className="text-sm">
                                  {trackRatings.get(track.id)?.avg_rating?.toFixed(1) || "—"}
                                </span>
                                {trackRatings.get(track.id)?.total_ratings > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    ({trackRatings.get(track.id)?.total_ratings})
                                  </span>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Friends Ratings */}
                {friendsRatings.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Friends Ratings</h2>
                    <div className="flex gap-4 overflow-x-auto pb-4">
                      {friendsRatings.map((rating) => (
                        <div key={rating.user_id} className="flex flex-col items-center min-w-[80px]">
                          <Avatar className="h-16 w-16 mb-2">
                            <AvatarImage src={rating.profiles.avatar_url || undefined} />
                            <AvatarFallback>{rating.profiles.display_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <p className="text-sm font-medium truncate w-full text-center">
                            {rating.profiles.display_name || rating.profiles.username}
                          </p>
                          <div className="flex gap-0.5 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(rating.rating)
                                    ? "fill-yellow-500 text-yellow-500"
                                    : "fill-muted text-muted"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Concerts Section */}
                {concerts.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Ticket className="h-6 w-6" />
                        Upcoming Concerts
                      </h2>
                      <div className="space-y-3">
                        {concerts.map((concert) => (
                          <Card key={concert.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold">{concert.venue.name}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {concert.venue.city}, {concert.venue.country}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {new Date(concert.datetime).toLocaleDateString()}
                                  </p>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                  <a href={concert.url} target="_blank" rel="noopener noreferrer">
                                    View
                                  </a>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => navigate('/concerts')}
                      >
                        View All Concerts
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-6">
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={review.profiles?.avatar_url || undefined} />
                              <AvatarFallback>
                                {review.profiles?.display_name?.[0] || review.profiles?.username?.[0] || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold">
                                    {review.profiles?.display_name || review.profiles?.username || "Anonymous"}
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="flex gap-0.5">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < Math.floor(review.rating)
                                              ? "fill-yellow-500 text-yellow-500"
                                              : "fill-muted text-muted"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span>•</span>
                                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {review.review_text}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No reviews yet</p>
                    <Button onClick={handleOpenReviewDialog}>
                      Be the first to write a review
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="lists">
                <p className="text-muted-foreground">Lists coming soon...</p>
              </TabsContent>

              <TabsContent value="ratings">
                <p className="text-muted-foreground">Detailed ratings coming soon...</p>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Actions and Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={handleOpenReviewDialog}>
                  <FileText className="h-4 w-4 mr-2" />
                  {userReview ? "Edit review" : "Write review"}
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleAddToListenLater}>
                  <Heart className="h-4 w-4 mr-2" />
                  Add to Listen Later
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ListMusic className="h-4 w-4 mr-2" />
                  Add album to a list
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" />
                  Send on Musicboard
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={album.spotifyUrl || `https://open.spotify.com/album/${album.id}`} target="_blank" rel="noopener noreferrer">
                    <Music className="h-4 w-4 mr-2" />
                    Listen on Streaming
                  </a>
                </Button>
                <div className="flex gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={copyUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={shareToX}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-bold">Information</h3>
                
                {/* Rating Distribution */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">0.5 ★</span>
                    <span className="text-sm text-muted-foreground">5 ★</span>
                  </div>
                  <div className="flex gap-1 h-12 items-end">
                    {ratingDistribution.map((count, i) => {
                      const maxCount = Math.max(...ratingDistribution, 1);
                      const height = (count / maxCount) * 100;
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-yellow-500 rounded-t"
                          style={{ height: `${height}%` }}
                          title={`${(i + 1) * 0.5} stars: ${count} ratings`}
                        />
                      );
                    })}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium mb-1">Release Date</p>
                  <p className="text-sm text-muted-foreground">{new Date(album.releaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Duration</p>
                  <p className="text-sm text-muted-foreground">{getTotalDuration()}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Label</p>
                  <p className="text-sm text-muted-foreground">{album.label || 'Unknown'}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Type</p>
                  <p className="text-sm text-muted-foreground capitalize">{album.type?.replace('_', ' ') || 'Album'}</p>
                </div>

                {album.genres && album.genres.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Genres</p>
                    <p className="text-sm text-muted-foreground capitalize">{album.genres.join(', ')}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-1">Tracks</p>
                  <p className="text-sm text-muted-foreground">{album.totalTracks} tracks</p>
                </div>

                {album.popularity !== undefined && (
                  <div>
                    <p className="text-sm font-medium mb-1">Popularity</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all" 
                          style={{ width: `${album.popularity}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{album.popularity}/100</span>
                    </div>
                  </div>
                )}

                {album.availableMarkets !== undefined && (
                  <div>
                    <p className="text-sm font-medium mb-1">Availability</p>
                    <p className="text-sm text-muted-foreground">Available in {album.availableMarkets} markets</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vinyl Availability */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Vinyl & Physical Formats</h3>
                  <Disc3 className="h-5 w-5 text-vinyl-red" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Check vinyl availability on Discogs
                </p>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    fetchVinylAvailability();
                    setVinylDialogOpen(true);
                  }}
                  disabled={!album}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Check Vinyl Availability
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate {album.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-8">
            {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((rating) => (
              <button
                key={rating}
                onClick={() => handleRating(rating)}
                onMouseEnter={() => setHoverRating(rating)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    rating <= (hoverRating || userRating)
                      ? "fill-yellow-500 text-yellow-500"
                      : "fill-muted text-muted"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Click a star to rate (0.5 to 5 stars)
          </p>
        </DialogContent>
      </Dialog>

      {/* Track Rating Dialog */}
      <Dialog open={trackRatingDialog.open} onOpenChange={(open) => {
        setTrackRatingDialog({ open, track: trackRatingDialog.track });
        if (!open) setTrackHoverRating(0);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate {trackRatingDialog.track?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-8">
            {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((rating) => {
              const currentRating = trackRatings.get(trackRatingDialog.track?.id || "")?.user_rating || 0;
              return (
                <button
                  key={rating}
                  onClick={() => trackRatingDialog.track && handleTrackRating(trackRatingDialog.track, rating)}
                  onMouseEnter={() => setTrackHoverRating(rating)}
                  onMouseLeave={() => setTrackHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      rating <= (trackHoverRating || currentRating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "fill-muted text-muted"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Click a star to rate (0.5 to 5 stars)
          </p>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={(open) => {
        setReviewDialogOpen(open);
        if (!open) setReviewHoverRating(0);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{userReview ? "Edit Your Review" : "Write a Review"} for {album?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Rating</label>
              <div className="flex justify-center gap-2">
                {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setReviewRating(rating)}
                    onMouseEnter={() => setReviewHoverRating(rating)}
                    onMouseLeave={() => setReviewHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        rating <= (reviewHoverRating || reviewRating)
                          ? "fill-yellow-500 text-yellow-500"
                          : "fill-muted text-muted"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Your Review</label>
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your thoughts about this album... (minimum 10 characters)"
                className="min-h-[200px]"
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {reviewText.length}/5000 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={!reviewText || reviewText.length < 10 || !reviewRating}
            >
              {userReview ? "Update Review" : "Publish Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lyrics Dialog */}
      <Dialog open={!!selectedLyrics} onOpenChange={() => setSelectedLyrics(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lyrics: {selectedLyrics?.track}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              View full lyrics on Genius.com
            </p>
            <Button asChild className="w-full">
              <a href={selectedLyrics?.url} target="_blank" rel="noopener noreferrer">
                View on Genius
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vinyl Availability Dialog */}
      <Dialog open={vinylDialogOpen} onOpenChange={setVinylDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vinyl Availability for {album?.name}</DialogTitle>
          </DialogHeader>
          
          {vinylLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : vinylResults.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {vinylResults.length} vinyl pressings on Discogs
              </p>
              {vinylResults.map((vinyl) => (
                <Card key={vinyl.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {vinyl.coverImage && (
                        <img 
                          src={vinyl.coverImage} 
                          alt={vinyl.title}
                          className="w-24 h-24 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 truncate">{vinyl.title}</h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {vinyl.year && <p>Year: {vinyl.year}</p>}
                          {vinyl.country && <p>Country: {vinyl.country}</p>}
                          <p>Format: {vinyl.format}</p>
                          <p>Label: {vinyl.label}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => window.open(`https://www.discogs.com${vinyl.uri}`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View on Discogs
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Disc3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No vinyl pressings found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try searching directly on{' '}
                <a 
                  href={`https://www.discogs.com/search/?q=${encodeURIComponent(album?.name || '')}&type=release`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Discogs
                </a>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
