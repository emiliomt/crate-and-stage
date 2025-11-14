import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Music, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Artist } from "@/types/audiodb";

export default function MusicSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('audiodb-search', {
        body: { action: 'searchArtist', query: searchQuery }
      });

      if (error) throw error;

      if (data?.artists) {
        setArtists(data.artists);
      } else {
        setArtists([]);
        toast.info("No artists found");
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Failed to search artists");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/feed')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feed
            </Button>
            <div className="flex items-center gap-2">
              <Music className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Music Database</h1>
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : artists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {artists.map((artist) => (
              <Card 
                key={artist.idArtist}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => navigate(`/artist/${artist.idArtist}`)}
              >
                <div className="h-48 bg-muted relative overflow-hidden">
                  {artist.strArtistThumb ? (
                    <img
                      src={artist.strArtistThumb}
                      alt={artist.strArtist}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="text-xl font-bold mb-2 truncate">{artist.strArtist}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {artist.strGenre && (
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Genre:</span> {artist.strGenre}
                      </p>
                    )}
                    {artist.strCountry && (
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Country:</span> {artist.strCountry}
                      </p>
                    )}
                    {artist.intFormedYear && (
                      <p className="flex items-center gap-2">
                        <span className="font-medium">Formed:</span> {artist.intFormedYear}
                      </p>
                    )}
                  </div>
                  {artist.strBiographyEN && (
                    <p className="mt-3 text-sm line-clamp-3 text-muted-foreground">
                      {artist.strBiographyEN}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : searchQuery && !loading ? (
          <div className="text-center py-12">
            <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Artists Found</h3>
            <p className="text-muted-foreground">Try searching for a different artist</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Search for Artists</h3>
            <p className="text-muted-foreground">Enter an artist name to explore their music</p>
          </div>
        )}
      </main>
    </div>
  );
}
