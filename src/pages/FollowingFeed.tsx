import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Heart, Users } from "lucide-react";
import { toast } from "sonner";

interface LikedBoard {
  id: string;
  created_at: string;
  board: {
    id: string;
    title: string;
    description: string | null;
    board_type: string;
  };
  user: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface LikedList {
  id: string;
  created_at: string;
  list: {
    id: string;
    title: string;
    description: string;
    genre: string;
  };
  user: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const FollowingFeed = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [likedBoards, setLikedBoards] = useState<LikedBoard[]>([]);
  const [likedLists, setLikedLists] = useState<LikedList[]>([]);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    checkUser();
    fetchFollowingActivity();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
  };

  const fetchFollowingActivity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get users that current user follows
      const { data: followingData, error: followingError } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followingError) throw followingError;

      const followingIds = followingData?.map(f => f.following_id) || [];
      setFollowingCount(followingIds.length);

      if (followingIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch board likes from followed users
      const { data: boardLikesData, error: boardLikesError } = await supabase
        .from("board_likes")
        .select(`
          id,
          created_at,
          user_id,
          board_id,
          boards!inner (
            id,
            title,
            description,
            board_type
          )
        `)
        .in("user_id", followingIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (boardLikesError) throw boardLikesError;

      // Fetch profiles for board likes
      const boardLikesWithProfiles = await Promise.all(
        (boardLikesData || []).map(async (like: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url")
            .eq("id", like.user_id)
            .single();

          return {
            id: like.id,
            created_at: like.created_at,
            board: like.boards,
            user: profile || { username: "Unknown", display_name: null, avatar_url: null }
          };
        })
      );

      setLikedBoards(boardLikesWithProfiles);

      // Fetch list likes from followed users
      const { data: listLikesData, error: listLikesError } = await supabase
        .from("list_likes")
        .select(`
          id,
          created_at,
          user_id,
          list_id,
          lists!inner (
            id,
            title,
            description,
            genre
          )
        `)
        .in("user_id", followingIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (listLikesError) throw listLikesError;

      // Fetch profiles for list likes
      const listLikesWithProfiles = await Promise.all(
        (listLikesData || []).map(async (like: any) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url")
            .eq("id", like.user_id)
            .single();

          return {
            id: like.id,
            created_at: like.created_at,
            list: like.lists,
            user: profile || { username: "Unknown", display_name: null, avatar_url: null }
          };
        })
      );

      setLikedLists(listLikesWithProfiles);
    } catch (error: any) {
      toast.error("Failed to load following activity");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      if (hours < 1) return "Just now";
      return `${hours}h ago`;
    }
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const allActivity = [
    ...likedBoards.map(item => ({ ...item, type: 'board' as const })),
    ...likedLists.map(item => ({ ...item, type: 'list' as const }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/feed")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Following Activity</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">What Your Connections Like</h2>
            </div>
            <p className="text-muted-foreground">
              Following {followingCount} {followingCount === 1 ? 'person' : 'people'}
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
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
          ) : followingCount === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Following Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start following people to see their liked boards and lists here
                </p>
                <Button onClick={() => navigate("/feed")}>
                  Explore Community
                </Button>
              </CardContent>
            </Card>
          ) : allActivity.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
                <p className="text-muted-foreground">
                  The people you follow haven't liked anything yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {allActivity.map(item => (
                <Card 
                  key={`${item.type}-${item.id}`} 
                  className="hover:shadow-medium transition-shadow cursor-pointer"
                  onClick={() => navigate(item.type === 'board' ? `/boards/${'board' in item ? item.board?.id : ''}` : `/lists`)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={item.user.avatar_url || undefined} />
                        <AvatarFallback>
                          {item.user.display_name?.[0] || item.user.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {item.user.display_name || item.user.username}
                          </span>
                          <span className="text-muted-foreground text-sm">liked a {item.type}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                      <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                    </div>
                    <CardTitle className="text-lg">
                      {'board' in item ? item.board?.title : 'list' in item ? item.list?.title : ''}
                    </CardTitle>
                    {'board' in item ? (
                      <CardDescription className="flex items-center gap-2">
                        <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                          {item.board?.board_type}
                        </span>
                      </CardDescription>
                    ) : 'list' in item ? (
                      <CardDescription className="flex items-center gap-2">
                        <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                          {item.list?.genre}
                        </span>
                      </CardDescription>
                    ) : null}
                  </CardHeader>
                  {(('board' in item && item.board?.description) || 
                    ('list' in item && item.list?.description)) && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {'board' in item ? item.board?.description : 'list' in item ? item.list?.description : ''}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FollowingFeed;
