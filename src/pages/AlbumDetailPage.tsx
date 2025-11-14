import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ArrowLeft, Star, Music, Calendar, Clock, Globe, 
  FileText, ListMusic, Share2, Copy, Heart, Ticket 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

interface TrackData {
  id: string;
  name: string;
  duration_ms: number;
  track_number: number;
  artists: string[];
  explicit?: boolean;
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

  useEffect(() => {
    if (albumId) {
      fetchAlbumData();
      fetchRatings();
      fetchFriendsRatings();
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
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                <span className="text-sm">4.3</span>
                              </div>
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

              <TabsContent value="reviews">
                <p className="text-muted-foreground">Reviews coming soon...</p>
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
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Write review
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
                  <p className="text-sm font-medium mb-1">Languages</p>
                  <p className="text-sm text-muted-foreground">Spanish</p>
                </div>
              </CardContent>
            </Card>

            {/* Vinyl Availability Placeholder */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">Vinyl & Physical Formats</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Check availability on various platforms
                </p>
                <Button variant="outline" className="w-full" disabled>
                  <Globe className="h-4 w-4 mr-2" />
                  Check Availability (Coming Soon)
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
    </div>
  );
}
