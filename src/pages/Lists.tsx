import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MessageCircle, Share2, Plus, Save, Trash2, GripVertical, Music, Search } from "lucide-react";
import { toast } from "sonner";

interface Album {
  id: number;
  title: string;
  artist: string;
  genre: string;
  cover: string;
}

interface MusicList {
  id: number;
  title: string;
  description: string;
  story?: string;
  genre: string;
  albums: Album[];
  creator: string;
  avatar: string;
  likes: number;
  comments: number;
  isPublic: boolean;
}

export default function Lists() {
  const navigate = useNavigate();
  const [view, setView] = useState<"browse" | "create">("browse");
  const [sortBy, setSortBy] = useState("popular");
  const [lists, setLists] = useState<MusicList[]>([
    {
      id: 1,
      title: "A Guide to Experimental Music",
      description: "Journey through the avant-garde sounds that shaped modern music",
      story: "This collection traces the evolution of experimental music from its early pioneers to contemporary innovators. Each album represents a pivotal moment in pushing musical boundaries.",
      genre: "Avant-Jazz",
      albums: Array(8).fill(null).map((_, i) => ({
        id: i,
        title: `Album ${i + 1}`,
        artist: "Artist",
        genre: "Avant-Jazz",
        cover: "🎵"
      })),
      creator: "Emilio Montemayor",
      avatar: "EM",
      likes: 245,
      comments: 32,
      isPublic: true,
    }
  ]);

  // Create list form state
  const [newList, setNewList] = useState({
    title: "",
    description: "",
    story: "",
    genre: "Avant-Jazz",
    visibility: "public",
  });
  const [currentAlbum, setCurrentAlbum] = useState({
    title: "",
    artist: "",
    genre: "Avant-Jazz",
    cover: "🎵",
  });
  const [albumsInList, setAlbumsInList] = useState<Album[]>([]);

  const genres = [
    "Avant-Jazz", "Avant-Folk", "Avant-Prog", "Avant-Metal", "Avant-Rock",
    "Hip Hop", "R&B", "Indie", "Electronic", "Rock", "Jazz", "Classical"
  ];

  const handleAddAlbum = () => {
    if (!currentAlbum.title || !currentAlbum.artist) {
      toast.error("Please fill in album title and artist");
      return;
    }

    const newAlbum: Album = {
      id: Date.now(),
      ...currentAlbum,
    };

    setAlbumsInList([...albumsInList, newAlbum]);
    setCurrentAlbum({ title: "", artist: "", genre: "Avant-Jazz", cover: "🎵" });
    toast.success("Album added to list");
  };

  const handleRemoveAlbum = (id: number) => {
    setAlbumsInList(albumsInList.filter(a => a.id !== id));
    toast.success("Album removed from list");
  };

  const handlePublishList = () => {
    if (!newList.title || albumsInList.length === 0) {
      toast.error("Please add a title and at least one album");
      return;
    }

    const list: MusicList = {
      id: Date.now(),
      ...newList,
      albums: albumsInList,
      creator: "You",
      avatar: "YO",
      likes: 0,
      comments: 0,
      isPublic: newList.visibility === "public",
    };

    setLists([list, ...lists]);
    setView("browse");
    setNewList({ title: "", description: "", story: "", genre: "Avant-Jazz", visibility: "public" });
    setAlbumsInList([]);
    toast.success("List published successfully!");
  };

  const canPublish = newList.title && albumsInList.length > 0;

  if (view === "create") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold">Create New List</h1>
            <Button variant="ghost" onClick={() => setView("browse")}>
              Cancel
            </Button>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">List Title *</label>
                <Input
                  value={newList.title}
                  onChange={(e) => setNewList({ ...newList, title: e.target.value })}
                  placeholder="e.g., A Guide to Experimental Music"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  value={newList.description}
                  onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                  placeholder="Brief description of your list"
                  className="bg-background min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">The Story (Optional)</label>
                <Textarea
                  value={newList.story}
                  onChange={(e) => setNewList({ ...newList, story: e.target.value })}
                  placeholder="Tell the narrative arc of this musical journey..."
                  className="bg-background min-h-[150px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Primary Genre</label>
                  <Select value={newList.genre} onValueChange={(value) => setNewList({ ...newList, genre: value })}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map(genre => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Visibility</label>
                  <Select value={newList.visibility} onValueChange={(value) => setNewList({ ...newList, visibility: value })}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-6">
              <h2 className="text-2xl font-bold">Add Albums</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Album Title</label>
                  <Input
                    value={currentAlbum.title}
                    onChange={(e) => setCurrentAlbum({ ...currentAlbum, title: e.target.value })}
                    placeholder="Album name"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Artist</label>
                  <Input
                    value={currentAlbum.artist}
                    onChange={(e) => setCurrentAlbum({ ...currentAlbum, artist: e.target.value })}
                    placeholder="Artist name"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Genre</label>
                  <Select value={currentAlbum.genre} onValueChange={(value) => setCurrentAlbum({ ...currentAlbum, genre: value })}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map(genre => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Cover Emoji</label>
                  <Input
                    value={currentAlbum.cover}
                    onChange={(e) => setCurrentAlbum({ ...currentAlbum, cover: e.target.value })}
                    placeholder="🎵"
                    className="bg-background"
                    maxLength={2}
                  />
                </div>
              </div>

              <Button onClick={handleAddAlbum} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Album to List
              </Button>
            </CardContent>
          </Card>

          {albumsInList.length > 0 && (
            <Card className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Albums in Your List</h2>
                  <span className="text-sm text-muted-foreground">{albumsInList.length} albums</span>
                </div>

                <div className="space-y-2">
                  {albumsInList.map((album) => (
                    <div key={album.id} className="flex items-center gap-4 p-4 bg-background rounded-lg border border-border">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <span className="text-2xl">{album.cover}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{album.title}</p>
                        <p className="text-sm text-muted-foreground">{album.artist} • {album.genre}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveAlbum(album.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button 
              onClick={handlePublishList} 
              disabled={!canPublish}
              className="flex-1"
              size="lg"
            >
              <Save className="h-4 w-4 mr-2" />
              Publish List
            </Button>
            <Button variant="outline" onClick={() => setView("browse")} size="lg">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                <Music className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">Musicboard</span>
              </div>
              
              <nav className="hidden md:flex items-center gap-6">
                <button
                  className="text-foreground font-medium border-b-2 border-primary pb-1"
                >
                  Lists
                </button>
                <button
                  onClick={() => navigate("/boards")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Boards
                </button>
                <button
                  onClick={() => navigate("/reviews")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reviews
                </button>
                <button
                  onClick={() => navigate("/albums")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Albums
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search music..."
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Music Lists</h1>
            <p className="text-muted-foreground">Discover curated playlists with stories</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="liked">Most Liked</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setView("create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create List
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <Card 
              key={list.id} 
              className="bg-card border-border hover:border-primary transition-all cursor-pointer group overflow-hidden"
            >
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {list.albums.slice(0, 8).map((album, idx) => (
                    <div key={idx} className="aspect-square bg-muted rounded flex items-center justify-center text-2xl">
                      {album.cover}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {list.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {list.description}
                  </p>
                  {list.story && (
                    <p className="text-xs text-muted-foreground italic line-clamp-2">
                      {list.story}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    {list.avatar}
                  </div>
                  <span className="text-sm text-muted-foreground">{list.creator}</span>
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Heart className="h-4 w-4" />
                    {list.likes}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    {list.comments}
                  </button>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
