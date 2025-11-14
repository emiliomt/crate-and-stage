import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Heart } from "lucide-react";

export default function Boards() {
  const navigate = useNavigate();

  const { data: boards, isLoading } = useQuery({
    queryKey: ['community-boards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('boards')
        .select(`
          *,
          profiles!boards_user_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    }
  });

  const getBoardTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      album: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
      artist: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
      vinyl: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
      concert: "bg-pink-500/20 text-pink-700 dark:text-pink-300",
      mixed: "bg-green-500/20 text-green-700 dark:text-green-300",
    };
    return colors[type] || "bg-gray-500/20 text-gray-700 dark:text-gray-300";
  };

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
                  onClick={() => navigate("/lists")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Lists
                </button>
                <button
                  className="text-foreground font-medium border-b-2 border-primary pb-1"
                >
                  Boards
                </button>
                <button
                  onClick={() => navigate("/discover")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Discover
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
              <button
                onClick={() => navigate("/feed")}
                className="hidden md:block text-muted-foreground hover:text-foreground transition-colors"
              >
                Feed
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Community Boards</h1>
          <p className="text-muted-foreground">
            Discover music through boards curated by the community
          </p>
        </div>

        {/* Boards list */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-6 w-64" />
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : boards && boards.length > 0 ? (
            boards.map((board) => (
              <Card 
                key={board.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/boards/${board.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={board.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {(board.profiles?.display_name || board.profiles?.username || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold mb-1 truncate">
                            {board.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            by {board.profiles?.display_name || board.profiles?.username}
                          </p>
                        </div>
                        <Badge 
                          variant="secondary"
                          className={getBoardTypeColor(board.board_type)}
                        >
                          {board.board_type}
                        </Badge>
                      </div>

                      {board.description && (
                        <p className="text-muted-foreground line-clamp-2 mb-3">
                          {board.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{board.likes_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-16">
              <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
              <p className="text-muted-foreground">
                Be the first to create a board!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
