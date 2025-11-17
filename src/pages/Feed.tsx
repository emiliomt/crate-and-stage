import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Music, LogOut, User, Plus, Disc3, Search, Calendar, Users, ListMusic, Heart } from "lucide-react";
import { toast } from "sonner";
interface Album {
  id: string;
  name: string;
  artist: string;
  image: string;
  releaseDate: string;
  type: string;
}

interface Song {
  id: string;
  name: string;
  artist: string;
  album?: string;
  albumId?: string;
  image: string;
  duration?: number;
  releaseDate?: string;
  type: string;
}

interface List {
  id: string;
  title: string;
  description: string;
  genre: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface UserProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
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
  const [searchType, setSearchType] = useState<'albums' | 'songs' | 'lists' | 'users'>('albums');
  const [albumResults, setAlbumResults] = useState<Album[]>([]);
  const [songResults, setSongResults] = useState<Song[]>([]);
  const [listResults, setListResults] = useState<List[]>([]);
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [listenLater, setListenLater] = useState<any[]>([]);
  useEffect(() => {
    checkUser();
    fetchBoards();
    fetchRecommendations();
    fetchListenLater();
  }, []);
  const checkUser = async () => {
    const {
      data: {
        session
      }
    } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
  };
  const fetchBoards = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("boards").select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `).eq("is_public", true).order("created_at", {
        ascending: false
      }).limit(20);
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
      const {
        data,
        error
      } = await supabase.functions.invoke('spotify-recommendations');
      if (error) throw error;
      setAlbums(data.albums || []);
    } catch (error: any) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setAlbumsLoading(false);
    }
  };

  const fetchListenLater = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('listen_later')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setListenLater(data || []);
    } catch (error) {
      console.error('Failed to load listen later:', error);
    }
  };

  const handleAddToListenLater = async (albumId: string, albumName: string, artistName: string, albumImage: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('listen_later')
        .insert({
          user_id: user.id,
          spotify_album_id: albumId,
          album_name: albumName,
          artist_name: artistName,
          album_image: albumImage,
        });
      
      if (error) throw error;
      toast.success('Added to Listen Later');
      fetchListenLater();
    } catch (error) {
      toast.error('Failed to add to Listen Later');
    }
  };

  const handleRemoveFromListenLater = async (albumId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('listen_later')
        .delete()
        .eq('user_id', user.id)
        .eq('spotify_album_id', albumId);
      
      if (error) throw error;
      toast.success('Removed from Listen Later');
      fetchListenLater();
    } catch (error) {
      toast.error('Failed to remove from Listen Later');
    }
  };
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setAlbumResults([]);
      setSongResults([]);
      setListResults([]);
      setUserResults([]);
      return;
    }
    setIsSearching(true);
    try {
      if (searchType === 'albums') {
        const { data, error } = await supabase.functions.invoke('spotify-search', {
          body: { query: searchQuery, type: 'album' }
        });
        if (error) throw error;
        setAlbumResults(data?.albums || []);
        setSongResults([]);
        setListResults([]);
        setUserResults([]);
      } else if (searchType === 'songs') {
        const { data, error } = await supabase.functions.invoke('spotify-search', {
          body: { query: searchQuery, type: 'track' }
        });
        if (error) throw error;
        setSongResults(data?.tracks || []);
        setAlbumResults([]);
        setListResults([]);
        setUserResults([]);
      } else if (searchType === 'lists') {
        const { data, error } = await supabase
          .from("lists")
          .select(`
            *,
            profiles (
              username,
              display_name,
              avatar_url
            )
          `)
          .eq("is_public", true)
          .ilike("title", `%${searchQuery}%`)
          .limit(20);
        if (error) throw error;
        setListResults(data || []);
        setAlbumResults([]);
        setSongResults([]);
        setUserResults([]);
      } else if (searchType === 'users') {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
          .limit(20);
        if (error) throw error;
        setUserResults(data || []);
        setAlbumResults([]);
        setSongResults([]);
        setListResults([]);
      }
    } catch (error: any) {
      toast.error("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };
  const handleAlbumClick = (album: Album) => {
    navigate(`/album-detail/${album.id}`);
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  return <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Disc3 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Eu-ter-pe</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/following")}>
                <Users className="h-4 w-4 mr-2" />
                Following
              </Button>
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
          
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 mb-3">
              <Tabs value={searchType} onValueChange={(value) => setSearchType(value as any)} className="flex-1">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="albums">Albums</TabsTrigger>
                  <TabsTrigger value="songs">Songs</TabsTrigger>
                  <TabsTrigger value="lists">Lists</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder={`Search for ${searchType}...`} 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  onKeyPress={e => e.key === 'Enter' && handleSearch()} 
                  className="pl-10" 
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                Search
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Album Results */}
          {albumResults.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Album Results</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {albumResults.map(album => (
                  <div key={album.id} className="group cursor-pointer" onClick={() => handleAlbumClick(album)}>
                    <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-muted hover:shadow-lg transition-all">
                      <img src={album.image} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground truncate">{album.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Song Results */}
          {songResults.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Song Results</h2>
              <div className="grid gap-3">
                {songResults.map(song => (
                  <HoverCard key={song.id} openDelay={200}>
                    <HoverCardTrigger asChild>
                      <Card 
                        className="hover:shadow-medium transition-shadow cursor-pointer"
                        onClick={() => song.albumId && navigate(`/album-detail/${song.albumId}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <img src={song.image} alt={song.name} className="w-16 h-16 rounded" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{song.name}</h3>
                              <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                              {song.album && (
                                <p className="text-xs text-muted-foreground truncate">{song.album}</p>
                              )}
                            </div>
                            <Music className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80" side="right" align="start">
                      <div className="space-y-3">
                        <div className="aspect-square rounded-lg overflow-hidden shadow-lg">
                          <img 
                            src={song.image} 
                            alt={song.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-lg leading-tight">{song.name}</h4>
                              <p className="text-sm text-muted-foreground">{song.artist}</p>
                            </div>
                            {song.albumId && (() => {
                              const isInListenLater = listenLater.some(
                                item => item.spotify_album_id === song.albumId
                              );
                              return (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isInListenLater) {
                                      handleRemoveFromListenLater(song.albumId!);
                                    } else {
                                      handleAddToListenLater(
                                        song.albumId!,
                                        song.album || song.name,
                                        song.artist,
                                        song.image
                                      );
                                    }
                                  }}
                                  className="flex-shrink-0"
                                >
                                  <Heart
                                    className={`h-5 w-5 ${
                                      isInListenLater ? 'fill-primary text-primary' : ''
                                    }`}
                                  />
                                </Button>
                              );
                            })()}
                          </div>
                          {song.album && (
                            <div className="flex items-start gap-2 text-sm">
                              <Disc3 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{song.album}</span>
                            </div>
                          )}
                          {song.releaseDate && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground">
                                {new Date(song.releaseDate).getFullYear()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            </div>
          )}

          {/* List Results */}
          {listResults.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">List Results</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {listResults.map(list => (
                  <Card key={list.id} className="hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate(`/lists`)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={list.profiles.avatar_url || undefined} />
                            <AvatarFallback>
                              {list.profiles.display_name?.[0] || list.profiles.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{list.title}</CardTitle>
                            <CardDescription>
                              by {list.profiles.display_name || list.profiles.username}
                            </CardDescription>
                          </div>
                        </div>
                        <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                          {list.genre}
                        </span>
                      </div>
                    </CardHeader>
                    {list.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">{list.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* User Results */}
          {userResults.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">User Results</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {userResults.map(userProfile => (
                  <Card key={userProfile.id} className="hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate(`/user/${userProfile.username}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={userProfile.avatar_url || undefined} />
                          <AvatarFallback>
                            {userProfile.display_name?.[0] || userProfile.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {userProfile.display_name || userProfile.username}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">@{userProfile.username}</p>
                          {userProfile.bio && (
                            <p className="text-xs text-muted-foreground truncate mt-1">{userProfile.bio}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
            
            {albumsLoading ? <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-lg mb-2" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-1" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>)}
              </div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {albums.map(album => <div key={album.id} className="group cursor-pointer" onClick={() => handleAlbumClick(album)}>
                    <div className="aspect-square rounded-lg overflow-hidden mb-2 shadow-medium transition-transform group-hover:scale-105">
                      <img src={album.image} alt={album.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {album.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
                  </div>)}
              </div>}
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">Community Boards</h2>
              <p className="text-muted-foreground">
                Discover music through boards curated by the community
              </p>
            </div>

            {loading ? <div className="space-y-4">
                {[1, 2, 3].map(i => <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-muted rounded" />
                    </CardContent>
                  </Card>)}
              </div> : boards.length === 0 ? <Card className="text-center py-12">
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
              </Card> : <div className="space-y-6">
                {boards.map(board => <Card key={board.id} className="hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate(`/boards/${board.id}`)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/user/${board.profiles.username}`);
                            }}
                          >
                            <AvatarImage src={board.profiles.avatar_url || undefined} />
                            <AvatarFallback>
                              {board.profiles.display_name?.[0] || board.profiles.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{board.title}</CardTitle>
                            <CardDescription
                              className="cursor-pointer hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/user/${board.profiles.username}`);
                              }}
                            >
                              by {board.profiles.display_name || board.profiles.username}
                            </CardDescription>
                          </div>
                        </div>
                        <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                          {board.board_type}
                        </span>
                      </div>
                    </CardHeader>
                    {board.description && <CardContent>
                        <p className="text-sm text-muted-foreground">{board.description}</p>
                      </CardContent>}
                  </Card>)}
              </div>}
          </div>
        </div>
      </main>
    </div>;
};
export default Feed;