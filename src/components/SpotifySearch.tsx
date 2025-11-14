import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, Music, Disc3, Mic2 } from "lucide-react";
import { toast } from "sonner";

interface SpotifyItem {
  id: string;
  name: string;
  artist?: string;
  image?: string;
  releaseDate?: string;
  type: 'album' | 'track' | 'artist';
}

interface SpotifySearchProps {
  onSelectItem: (item: SpotifyItem) => void;
}

const SpotifySearch = ({ onSelectItem }: SpotifySearchProps) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    albums: SpotifyItem[];
    tracks: SpotifyItem[];
    artists: SpotifyItem[];
  }>({ albums: [], tracks: [], artists: [] });

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-search', {
        body: { query },
      });

      if (error) throw error;
      setResults(data);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error("Failed to search Spotify");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const ItemCard = ({ item }: { item: SpotifyItem }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onSelectItem(item)}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {item.image ? (
            <img 
              src={item.image} 
              alt={item.name}
              className="w-16 h-16 rounded object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded bg-secondary flex items-center justify-center">
              {item.type === 'album' && <Disc3 className="h-8 w-8 text-muted-foreground" />}
              {item.type === 'track' && <Music className="h-8 w-8 text-muted-foreground" />}
              {item.type === 'artist' && <Mic2 className="h-8 w-8 text-muted-foreground" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{item.name}</p>
            {item.artist && (
              <p className="text-sm text-muted-foreground truncate">{item.artist}</p>
            )}
            {item.releaseDate && (
              <p className="text-xs text-muted-foreground">{item.releaseDate}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search for albums, tracks, or artists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {(results.albums.length > 0 || results.tracks.length > 0 || results.artists.length > 0) && (
        <Tabs defaultValue="albums" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="albums">
              Albums ({results.albums.length})
            </TabsTrigger>
            <TabsTrigger value="tracks">
              Tracks ({results.tracks.length})
            </TabsTrigger>
            <TabsTrigger value="artists">
              Artists ({results.artists.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="albums" className="space-y-2 mt-4">
            {results.albums.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </TabsContent>

          <TabsContent value="tracks" className="space-y-2 mt-4">
            {results.tracks.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </TabsContent>

          <TabsContent value="artists" className="space-y-2 mt-4">
            {results.artists.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default SpotifySearch;
