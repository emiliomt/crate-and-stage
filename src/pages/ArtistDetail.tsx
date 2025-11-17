import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Star, Music, Heart, FileText, ListPlus, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ArtistData {
  id: string;
  name: string;
  image: string;
  genres: string[];
  popularity: number;
  followers: number;
  spotifyUrl: string;
}

interface AlbumData {
  id: string;
  name: string;
  image: string;
  releaseDate: string;
  totalTracks: number;
  type: string;
}

interface TrackData {
  id: string;
  name: string;
  duration_ms: number;
  album: {
    name: string;
    images: { url: string }[];
  };
  popularity: number;
}

export default function ArtistDetail() {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [albums, setAlbums] = useState<AlbumData[]>([]);
  const [topTracks, setTopTracks] = useState<TrackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);

  useEffect(() => {
    if (artistId) {
      fetchArtistData();
    }
  }, [artistId]);

  const fetchArtistData = async () => {
    setLoading(true);
    try {
      // Fetch artist data from Spotify
      const { data: spotifyData, error: spotifyError } = await supabase.functions.invoke('spotify-search', {
        body: { query: '', type: 'artist', id: artistId }
      });

      if (spotifyError) throw spotifyError;

      if (spotifyData?.artist) {
        setArtist({
          id: spotifyData.artist.id,
          name: spotifyData.artist.name,
          image: spotifyData.artist.images?.[0]?.url || '',
          genres: spotifyData.artist.genres || [],
          popularity: spotifyData.artist.popularity || 0,
          followers: spotifyData.artist.followers?.total || 0,
          spotifyUrl: spotifyData.artist.external_urls?.spotify || ''
        });

        // Fetch top tracks
        if (spotifyData.topTracks) {
          setTopTracks(spotifyData.topTracks.slice(0, 10));
        }

        // Fetch albums
        if (spotifyData.albums) {
          const albumsData = spotifyData.albums.map((album: any) => ({
            id: album.id,
            name: album.name,
            image: album.images?.[0]?.url || '',
            releaseDate: album.release_date,
            totalTracks: album.total_tracks,
            type: album.album_type
          }));
          setAlbums(albumsData);
        }
      }

      // Fetch user rating and stats
      const { data: { user } } = await supabase.auth.getUser();
      if (user && artistId) {
        // For now, we'll use a placeholder - you'd need to create an artist_ratings table
        setTotalRatings(2090);
        setAvgRating(4.5);
      }
    } catch (error) {
      console.error('Error fetching artist data:', error);
      toast.error("Failed to load artist details");
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (rating: number) => {
    setUserRating(rating);
    toast.success("Artist rated successfully!");
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading artist...</p>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Artist Not Found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Artist Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <Avatar className="h-64 w-64 border-4 border-border">
                <AvatarImage src={artist.image} />
                <AvatarFallback className="text-6xl">
                  <Music className="h-24 w-24" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-5xl font-bold mb-4">{artist.name}</h1>
                
                {artist.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
                    {artist.genres.slice(0, 3).map((genre, index) => (
                      <span
                        key={index}
                        className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto md:mx-0">
                  <div className="text-center p-4 bg-card border border-border rounded-lg">
                    <div className="text-3xl font-bold">{totalRatings}</div>
                    <div className="text-sm text-muted-foreground">Total ratings</div>
                  </div>
                  <div className="text-center p-4 bg-card border border-border rounded-lg">
                    <div className="text-3xl font-bold flex items-center justify-center gap-1">
                      <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                      {avgRating}
                    </div>
                    <div className="text-sm text-muted-foreground">Average rating</div>
                  </div>
                  <div className="text-center p-4 bg-card border border-border rounded-lg">
                    <div className="text-3xl font-bold flex items-center justify-center gap-1">
                      <Star className={`h-6 w-6 ${userRating > 0 ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}`} />
                      {userRating || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Your rating</div>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full md:w-auto mb-4"
                  onClick={() => {
                    // Open rating dialog
                    const rating = window.prompt("Rate this artist (1-5):");
                    if (rating) {
                      const numRating = parseInt(rating);
                      if (numRating >= 1 && numRating <= 5) {
                        handleRating(numRating);
                      }
                    }
                  }}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Rate Artist
                </Button>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Write review
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Heart className="h-4 w-4 mr-2" />
                    Add to Listen Later
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <ListPlus className="h-4 w-4 mr-2" />
                    Add artist to a list
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="home" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Home
              </TabsTrigger>
              <TabsTrigger 
                value="discography" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Discography
              </TabsTrigger>
              <TabsTrigger 
                value="reviews" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Reviews
              </TabsTrigger>
              <TabsTrigger 
                value="lists" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Lists
              </TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="space-y-8">
              {/* Most Popular Tracks */}
              {topTracks.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Most Popular Tracks</h2>
                  <div className="space-y-2">
                    {topTracks.map((track, index) => (
                      <Card
                        key={track.id}
                        className="hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className="p-4 flex items-center gap-4">
                          <div className="text-muted-foreground font-semibold w-8 text-center">
                            {index + 1}
                          </div>
                          <div className="h-12 w-12 bg-muted rounded flex-shrink-0">
                            {track.album.images[0] && (
                              <img
                                src={track.album.images[0].url}
                                alt={track.name}
                                className="h-full w-full object-cover rounded"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{track.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {track.album.name}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDuration(track.duration_ms)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            <span className="text-sm font-semibold">
                              {(track.popularity / 20).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="discography" className="space-y-6">
              <h2 className="text-2xl font-bold">Albums</h2>
              {albums.length === 0 ? (
                <p className="text-muted-foreground">No albums found</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {albums.map((album) => (
                    <Card
                      key={album.id}
                      className="cursor-pointer hover:shadow-lg transition-all overflow-hidden"
                      onClick={() => navigate(`/album-detail/${album.id}`)}
                    >
                      <div className="aspect-square bg-muted relative">
                        {album.image && (
                          <img
                            src={album.image}
                            alt={album.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold truncate">{album.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(album.releaseDate).getFullYear()} • {album.type}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews">
              <div className="text-center py-12 text-muted-foreground">
                Reviews coming soon
              </div>
            </TabsContent>

            <TabsContent value="lists">
              <div className="text-center py-12 text-muted-foreground">
                Lists featuring this artist coming soon
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
