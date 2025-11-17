import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Heart, MessageCircle, Share2, Music as MusicIcon } from "lucide-react";
import { toast } from "sonner";

// Mock data interface (will be replaced with real data later)
interface Album {
  id: number;
  title: string;
  artist: string;
  genre: string;
  cover: string;
  spotifyId?: string;
  image?: string;
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

export default function ListDetail() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState<MusicList | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockList: MusicList = {
      id: parseInt(listId || "1"),
      title: "A Guide to Experimental Music",
      description: "Journey through the avant-garde sounds that shaped modern music",
      story: "This collection traces the evolution of experimental music from its early pioneers to contemporary innovators. Each album represents a pivotal moment in pushing musical boundaries.",
      genre: "Avant-Jazz",
      albums: Array(12).fill(null).map((_, i) => ({
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
    };
    setList(mockList);
    document.title = `${mockList.title} | Musicboard`;
  }, [listId]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (list) {
      setList({
        ...list,
        likes: isLiked ? list.likes - 1 : list.likes + 1
      });
    }
    toast.success(isLiked ? "Removed from favorites" : "Added to favorites");
  };

  if (!list) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <MusicIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/lists")}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lists
        </Button>

        {/* Header Section */}
        <div className="space-y-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold">{list.title}</h1>
                <Badge variant="secondary">{list.genre}</Badge>
              </div>
              <p className="text-lg text-muted-foreground max-w-3xl">
                {list.description}
              </p>
              {list.story && (
                <p className="text-muted-foreground italic max-w-3xl">
                  {list.story}
                </p>
              )}
            </div>
          </div>

          {/* Creator and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {list.avatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{list.creator}</p>
                <p className="text-sm text-muted-foreground">{list.albums.length} albums</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                {list.likes}
              </Button>
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                {list.comments}
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Albums Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Albums in This List</h2>
          <div className="grid gap-4">
            {list.albums.map((album, index) => (
              <Card key={album.id} className="bg-card border-border hover:border-primary transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-muted rounded text-lg font-bold text-muted-foreground">
                      {index + 1}
                    </div>
                    {album.image ? (
                      <img 
                        src={album.image} 
                        alt={album.title}
                        className="w-16 h-16 rounded object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-3xl">
                        {album.cover}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{album.title}</h3>
                      <p className="text-muted-foreground">{album.artist}</p>
                      <Badge variant="outline" className="mt-1">{album.genre}</Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MusicIcon className="h-4 w-4 mr-2" />
                      View Album
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
