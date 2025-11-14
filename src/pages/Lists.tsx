import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Plus, Save, Trash2, GripVertical, Music, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface Album {
  id: string;
  title: string;
  artist: string;
  genre: string;
  cover_emoji: string;
  position: number;
}

interface MusicList {
  id: string;
  title: string;
  description: string;
  story?: string;
  genre: string;
  likes_count: number;
  comments_count: number;
  is_public: boolean;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  list_items: Album[];
}

export default function Lists() {
  const navigate = useNavigate();
  const [view, setView] = useState<"browse" | "create">("browse");
  const [sortBy, setSortBy] = useState("recent");
  const [newList, setNewList] = useState({
    title: "",
    description: "",
    story: "",
    genre: "Indie",
    visibility: "public",
  });
  const [currentAlbum, setCurrentAlbum] = useState({
    title: "",
    artist: "",
    genre: "Indie",
    cover_emoji: "🎵",
  });
  const [albumsInList, setAlbumsInList] = useState<Omit<Album, 'id'>[]>([]);

  const genres = [
    "Avant-Jazz", "Avant-Folk", "Avant-Prog", "Avant-Metal", "Avant-Rock",
    "Hip Hop", "R&B", "Indie", "Electronic", "Rock", "Jazz", "Classical"
  ];

  const { data: lists, isLoading, refetch } = useQuery({
    queryKey: ['lists', sortBy],
    queryFn: async () => {
      let query = supabase
        .from('lists')
        .select(`
          *,
          profiles:user_id (username, display_name, avatar_url),
          list_items (*)
        `)
        .eq('is_public', true);

      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'popular' || sortBy === 'liked') {
        query = query.order('likes_count', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MusicList[];
    },
  });

  const handleAddAlbum = () => {
    if (!currentAlbum.title || !currentAlbum.artist) {
      toast.error("Please fill in album title and artist");
      return;
    }

    setAlbumsInList([...albumsInList, { ...currentAlbum, position: albumsInList.length }]);
    setCurrentAlbum({ title: "", artist: "", genre: "Indie", cover_emoji: "🎵" });
    toast.success("Album added to list");
  };

  const handleRemoveAlbum = (position: number) => {
    setAlbumsInList(albumsInList.filter((_, i) => i !== position));
    toast.success("Album removed from list");
  };

  const handlePublishList = async () => {
    if (!newList.title || albumsInList.length === 0) {
      toast.error("Please add a title and at least one album");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to create lists");
        return;
      }

      const { data: list, error: listError } = await supabase
        .from('lists')
        .insert([{
          user_id: user.id,
          title: newList.title,
          description: newList.description,
          story: newList.story || null,
          genre: newList.genre,
          is_public: newList.visibility === "public",
        }])
        .select()
        .single();

      if (listError) throw listError;

      const items = albumsInList.map((album, index) => ({
        list_id: list.id,
        title: album.title,
        artist: album.artist,
        genre: album.genre,
        cover_emoji: album.cover_emoji,
        position: index,
      }));

      const { error: itemsError } = await supabase.from('list_items').insert(items);
      if (itemsError) throw itemsError;

      toast.success("List published successfully!");
      setView("browse");
      setNewList({ title: "", description: "", story: "", genre: "Indie", visibility: "public" });
      setAlbumsInList([]);
      refetch();
    } catch (error) {
      console.error('Error publishing list:', error);
      toast.error("Failed to publish list");
    }
  };

  const canPublish = newList.title && albumsInList.length > 0;

  if (view === "create") {
    return (
      <div className="min-h-screen bg-black">
        <header className="border-b border-gray-800 bg-black sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" size="sm" onClick={() => setView("browse")} className="text-white hover:text-gray-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lists
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-4xl font-bold mb-8 text-white">Create New List</h1>

          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">List Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., A Guide to Experimental Music"
                    value={newList.title}
                    onChange={(e) => setNewList({ ...newList, title: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your list..."
                    value={newList.description}
                    onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                    rows={3}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="story" className="text-white">The Story (Optional)</Label>
                  <Textarea
                    id="story"
                    placeholder="Tell the story behind this collection..."
                    value={newList.story}
                    onChange={(e) => setNewList({ ...newList, story: e.target.value })}
                    rows={5}
                    className="bg-gray-800 border-gray-700 text-white italic"
                  />
                  <p className="text-xs text-gray-500">Add a narrative arc to make your list more engaging</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="genre" className="text-white">Primary Genre</Label>
                    <Select value={newList.genre} onValueChange={(val) => setNewList({ ...newList, genre: val })}>
                      <SelectTrigger id="genre" className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {genres.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visibility" className="text-white">Visibility</Label>
                    <Select value={newList.visibility} onValueChange={(val) => setNewList({ ...newList, visibility: val })}>
                      <SelectTrigger id="visibility" className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-white">Add Albums</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Album Title"
                    value={currentAlbum.title}
                    onChange={(e) => setCurrentAlbum({ ...currentAlbum, title: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <Input
                    placeholder="Artist"
                    value={currentAlbum.artist}
                    onChange={(e) => setCurrentAlbum({ ...currentAlbum, artist: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select value={currentAlbum.genre} onValueChange={(val) => setCurrentAlbum({ ...currentAlbum, genre: val })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      {genres.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Emoji 🎵"
                    value={currentAlbum.cover_emoji}
                    onChange={(e) => setCurrentAlbum({ ...currentAlbum, cover_emoji: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <Button onClick={handleAddAlbum} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Album to List
                </Button>
              </CardContent>
            </Card>

            {albumsInList.length > 0 && (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 text-white">
                    Albums in Your List ({albumsInList.length})
                  </h2>
                  <div className="space-y-2">
                    {albumsInList.map((album, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700">
                        <GripVertical className="h-4 w-4 text-gray-500" />
                        <span className="text-2xl">{album.cover_emoji}</span>
                        <div className="flex-1">
                          <div className="font-medium text-white">{album.title}</div>
                          <div className="text-sm text-gray-400">{album.artist} • {album.genre}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAlbum(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button onClick={handlePublishList} disabled={!canPublish} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Publish List
              </Button>
              <Button variant="outline" onClick={() => setView("browse")} className="border-gray-700 text-white hover:bg-gray-800">
                Cancel
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/feed")} className="text-white hover:text-gray-300">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feed
          </Button>
          <Button onClick={() => setView("create")} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create List
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Music Lists</h1>
            <p className="text-gray-400 text-lg">Discover narrative-driven playlists</p>
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="liked">Most Liked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading lists...</div>
        ) : lists && lists.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <Card key={list.id} className="bg-gray-900 border-gray-800 hover:border-blue-600 transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="grid grid-cols-4 gap-1 mb-4">
                    {list.list_items.slice(0, 8).map((item, idx) => (
                      <div key={idx} className="aspect-square rounded bg-gray-800 flex items-center justify-center text-2xl">
                        {item.cover_emoji}
                      </div>
                    ))}
                  </div>

                  <h3 className="font-bold text-lg mb-2 text-white line-clamp-2">
                    {list.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {list.description}
                  </p>
                  {list.story && (
                    <p className="text-sm text-gray-500 italic mb-3 line-clamp-2">
                      {list.story}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-gray-700 text-white">
                        {list.profiles.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-400">{list.profiles.display_name || list.profiles.username}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <button className="flex items-center gap-1 hover:text-red-400">
                      <Heart className="h-4 w-4" />
                      {list.likes_count}
                    </button>
                    <button className="flex items-center gap-1 hover:text-blue-400">
                      <MessageCircle className="h-4 w-4" />
                      {list.comments_count}
                    </button>
                    <button className="flex items-center gap-1 hover:text-green-400">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12 bg-gray-900 border-gray-800">
            <CardContent>
              <Music className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-2xl font-bold mb-2 text-white">No Lists Yet</h3>
              <p className="text-gray-400 mb-4">Be the first to create a music list!</p>
              <Button onClick={() => setView("create")} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First List
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
