import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Music, Calendar, Star, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Track } from "@/types/audiodb";

export default function AlbumDetail() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [albumInfo, setAlbumInfo] = useState<{
    name: string;
    artist: string;
    year?: string;
    genre?: string;
    image?: string;
  } | null>(null);

  useEffect(() => {
    if (albumId) {
      fetchTracks();
    }
  }, [albumId]);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('audiodb-search', {
        body: { action: 'getTracksByAlbum', albumId }
      });

      if (error) throw error;

      const tracksData = data?.track || [];
      setTracks(tracksData);

      // Extract album info from first track
      if (tracksData.length > 0) {
        const firstTrack = tracksData[0];
        setAlbumInfo({
          name: firstTrack.strAlbum,
          artist: firstTrack.strArtist,
          genre: firstTrack.strGenre,
          image: firstTrack.strTrackThumb,
        });
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
      toast.error("Failed to load album details");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: string | null) => {
    if (!ms) return '';
    const minutes = Math.floor(parseInt(ms) / 60000);
    const seconds = Math.floor((parseInt(ms) % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card p-4">
          <Skeleton className="h-8 w-32" />
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-8 w-3/4 mb-4" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card p-4">
        <div className="container mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {albumInfo && (
          <div className="mb-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                {albumInfo.image ? (
                  <img
                    src={albumInfo.image}
                    alt={albumInfo.name}
                    className="w-full rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <Music className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{albumInfo.name}</h1>
                  <p className="text-xl text-muted-foreground mb-4">{albumInfo.artist}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {albumInfo.genre && (
                      <Badge variant="secondary">{albumInfo.genre}</Badge>
                    )}
                    {tracks.length > 0 && (
                      <Badge variant="outline">{tracks.length} Tracks</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <Separator className="my-8" />

        {/* Tracklist */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Tracklist</h2>

          {tracks.length > 0 ? (
            <div className="space-y-2 animate-fade-in">
              {tracks
                .sort((a, b) => parseInt(a.intTrackNumber || '0') - parseInt(b.intTrackNumber || '0'))
                .map((track, index) => (
                  <Card key={track.idTrack} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground font-medium w-8 text-center">
                          {track.intTrackNumber || index + 1}
                        </span>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold">{track.strTrack}</h3>
                          {track.strGenre && (
                            <p className="text-sm text-muted-foreground">{track.strGenre}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          {track.intScore && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              <span>{(parseInt(track.intScore) / 2).toFixed(1)}</span>
                            </div>
                          )}
                          {track.intDuration && (
                            <span className="text-sm text-muted-foreground">
                              {formatDuration(track.intDuration)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tracks found for this album</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
