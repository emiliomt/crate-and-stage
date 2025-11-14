import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ExternalLink, Disc, Calendar, MapPin, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Artist, Album } from "@/types/audiodb";

export default function ArtistDetail() {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (artistId) {
      fetchArtistData();
    }
  }, [artistId]);

  const fetchArtistData = async () => {
    setLoading(true);
    try {
      // Fetch artist details and albums in parallel
      const [artistResponse, albumsResponse] = await Promise.all([
        supabase.functions.invoke('audiodb-search', {
          body: { action: 'searchArtist', query: '' }
        }),
        supabase.functions.invoke('audiodb-search', {
          body: { action: 'getAlbumsByArtist', artistId }
        })
      ]);

      if (artistResponse.error) throw artistResponse.error;
      if (albumsResponse.error) throw albumsResponse.error;

      // Find the specific artist from search results
      const artistData = artistResponse.data?.artists?.find(
        (a: Artist) => a.idArtist === artistId
      );
      
      setArtist(artistData || null);
      setAlbums(albumsResponse.data?.album || []);
    } catch (error) {
      console.error('Error fetching artist data:', error);
      toast.error("Failed to load artist details");
    } finally {
      setLoading(false);
    }
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
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
        </main>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Artist Not Found</h2>
          <Button onClick={() => navigate('/music-search')}>Back to Search</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card p-4">
        <div className="container mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate('/music-search')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Artist Header */}
        <div className="mb-12 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-1">
              {artist.strArtistThumb && (
                <img
                  src={artist.strArtistThumb}
                  alt={artist.strArtist}
                  className="w-full rounded-lg shadow-lg"
                />
              )}
            </div>
            
            <div className="md:col-span-2 space-y-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{artist.strArtist}</h1>
                {artist.strGenre && (
                  <p className="text-lg text-muted-foreground">{artist.strGenre} • {artist.strStyle}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                {artist.intFormedYear && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Formed {artist.intFormedYear}</span>
                  </div>
                )}
                {artist.strCountry && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{artist.strCountry}</span>
                  </div>
                )}
              </div>

              {artist.strWebsite && (
                <Button variant="outline" size="sm" asChild>
                  <a href={artist.strWebsite} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    Official Website
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              )}

              {artist.strBiographyEN && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Biography</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {artist.strBiographyEN}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Albums Section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Disc className="h-6 w-6" />
            <h2 className="text-2xl font-bold">Albums</h2>
          </div>

          {albums.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-fade-in">
              {albums.map((album) => (
                <Card
                  key={album.idAlbum}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                  onClick={() => navigate(`/album/${album.idAlbum}`)}
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {album.strAlbumThumb ? (
                      <img
                        src={album.strAlbumThumb}
                        alt={album.strAlbum}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm truncate mb-1">{album.strAlbum}</h3>
                    {album.intYearReleased && (
                      <p className="text-xs text-muted-foreground">{album.intYearReleased}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Disc className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No albums found for this artist</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
