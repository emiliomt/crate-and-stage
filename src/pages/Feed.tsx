import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Music, LogOut, User, Plus, Disc3, Search, Calendar } from "lucide-react";
import { toast } from "sonner";
import { AlbumRatingDialog } from "@/components/AlbumRatingDialog";

interface Album {
  id: string;
  name: string;
  artist: string;
  image: string;
  releaseDate: string;
  type: string;
}

interface Board {
  id: string;
  title: string;
  description: string | null;
  board_type: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const Feed = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState<Board[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Album[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);

  useEffect(() => {
    checkUser();
    fetchBoards();
    fetchRecommendations();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };

  const fetchBoards = async () => {
    try {
      const { data, error } = await supabase
        .from("boards")
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setBoards(data || []);
    } catch (error: any) {
      toast.error("Failed to load feed");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('spotify-recommendations');
      
      if (error) throw error;
      setAlbums(data.albums || []);
    } catch (error: any) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setAlbumsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-search', {
        body: { query: searchQuery, type: 'album' }
      });

      if (error) throw error;
      setSearchResults(data?.albums || []);
    } catch (error: any) {
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAlbumClick = (album: Album) => {
    setSelectedAlbum(album);
    setRatingDialogOpen(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Disc3 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Vinyl Social</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/music-search")}>
                <Music className="h-4 w-4 mr-2" />
                Music DB
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/concerts")}>
                <Calendar className="h-4 w-4 mr-2" />
                Concerts
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/create-board")}>
                <Plus className="h-4 w-4 mr-2" />
                New Board
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/profile")}>
                <User className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for albums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              Search
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {searchResults.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Search Results</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {searchResults.map((album) => (
                  <div
                    key={album.id}
                    className="group cursor-pointer"
                    onClick={() => handleAlbumClick(album)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-muted hover:shadow-lg transition-all">
                      <img
                        src={album.image}
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground truncate">{album.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Popular This Week</h2>
                <p className="text-sm text-muted-foreground">New releases and trending albums</p>
              </div>
            </div>
            
            {albumsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-lg mb-2" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    className="group cursor-pointer"
                    onClick={() => handleAlbumClick(album)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-2 shadow-medium transition-transform group-hover:scale-105">
                      <img
                        src={album.image}
                        alt={album.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {album.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Community Boards</h2>
              <p className="text-muted-foreground">
                Discover music through boards curated by the community
              </p>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : boards.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to create a board and share your music taste!
                  </p>
                  <Button onClick={() => navigate("/create-board")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Board
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {boards.map((board) => (
                  <Card key={board.id} className="hover:shadow-medium transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={board.profiles.avatar_url || undefined} />
                            <AvatarFallback>
                              {board.profiles.display_name?.[0] || board.profiles.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{board.title}</CardTitle>
                            <CardDescription>
                              by {board.profiles.display_name || board.profiles.username}
                            </CardDescription>
                          </div>
                        </div>
                        <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                          {board.board_type}
                        </span>
                      </div>
                    </CardHeader>
                    {board.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{board.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <AlbumRatingDialog
        album={selectedAlbum}
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
      />
    </div>
  );
};

export default Feed;
