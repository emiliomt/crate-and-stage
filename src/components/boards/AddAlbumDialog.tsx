import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, Plus, Music } from "lucide-react";
import { toast } from "sonner";

interface Album {
  id: string;
  name: string;
  artist: string;
  image: string;
  releaseDate?: string;
}

interface AddAlbumDialogProps {
  boardId: string;
  onAlbumAdded: () => void;
}

export function AddAlbumDialog({ boardId, onAlbumAdded }: AddAlbumDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-search', {
        body: { query, type: 'album' },
      });

      if (error) throw error;
      setAlbums(data?.albums || []);
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Failed to search for albums");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAlbum = async (album: Album) => {
    try {
      // Get current max position
      const { data: items } = await supabase
        .from('board_items')
        .select('position')
        .eq('board_id', boardId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = items && items.length > 0 ? items[0].position + 1 : 0;

      const { error } = await supabase
        .from('board_items')
        .insert({
          board_id: boardId,
          spotify_id: album.id,
          title: album.name,
          artist: album.artist,
          image_url: album.image,
          release_date: album.releaseDate,
          item_type: 'album',
          position: nextPosition,
        });

      if (error) throw error;

      toast.success(`Added "${album.name}" to board`);
      onAlbumAdded();
      setOpen(false);
      setQuery("");
      setAlbums([]);
    } catch (error) {
      console.error('Error adding album:', error);
      toast.error("Failed to add album to board");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Albums
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Albums to Board</DialogTitle>
          <DialogDescription>
            Search for albums to add to your board
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex gap-2">
            <Input
              placeholder="Search for albums..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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

          <div className="flex-1 overflow-y-auto space-y-2">
            {albums.length > 0 ? (
              albums.map((album) => (
                <Card key={album.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex gap-3 items-center">
                      {album.image ? (
                        <img 
                          src={album.image} 
                          alt={album.name}
                          className="w-16 h-16 rounded object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                          <Music className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{album.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{album.artist}</p>
                        {album.releaseDate && (
                          <p className="text-xs text-muted-foreground">{album.releaseDate}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddAlbum(album)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Music className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Search for albums to add to your board</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
