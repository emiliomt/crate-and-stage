import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Star } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Profile {
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
}

interface AlbumRating {
  id: string;
  album_name: string;
  artist_name: string;
  album_image: string | null;
  rating: number;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [recentRatings, setRecentRatings] = useState<AlbumRating[]>([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch user's boards
      const { data: boardsData, error: boardsError } = await supabase
        .from("boards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (boardsError) throw boardsError;
      setBoards(boardsData || []);

      // Fetch recent ratings
      const { data: ratingsData } = await supabase
        .from("album_ratings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6);

      setRecentRatings(ratingsData || []);

      // Fetch reviews count
      const { count: reviewsCount } = await supabase
        .from("album_reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setReviewsCount(reviewsCount || 0);

      // Fetch followers count
      const { count: followersCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id);

      setFollowersCount(followersCount || 0);

      // Fetch following count
      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id);

      setFollowingCount(followingCount || 0);
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const listenedCount = recentRatings.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/feed")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feed
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="mb-8">
            <div className="flex items-start gap-8">
              <Avatar className="h-40 w-40 border-4 border-border">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-4xl">
                  {profile.display_name?.[0] || profile.username[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="mb-4">
                  <h1 className="text-4xl font-bold mb-2">
                    {profile.display_name || profile.username}
                  </h1>
                  {profile.bio && (
                    <p className="text-muted-foreground">{profile.bio}</p>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-card border border-border rounded-lg">
                    <div className="text-3xl font-bold">{reviewsCount}</div>
                    <div className="text-sm text-muted-foreground">Reviews</div>
                  </div>
                  <div className="text-center p-4 bg-card border border-border rounded-lg">
                    <div className="text-3xl font-bold">{listenedCount}</div>
                    <div className="text-sm text-muted-foreground">Listened</div>
                  </div>
                  <div className="text-center p-4 bg-card border border-border rounded-lg">
                    <div className="text-3xl font-bold">{followingCount}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                  <div className="text-center p-4 bg-card border border-border rounded-lg">
                    <div className="text-3xl font-bold">{followersCount}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => navigate("/profile/edit")}
                  className="w-full"
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger 
                value="home" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Home
              </TabsTrigger>
              <TabsTrigger 
                value="collection" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Collection
              </TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="space-y-8">
              {/* Recent Activity */}
              {recentRatings.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Recent Activity</h2>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/albums")}>
                      View All
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {recentRatings.map((rating) => (
                      <Card 
                        key={rating.id} 
                        className="cursor-pointer hover:shadow-md transition-all overflow-hidden"
                        onClick={() => navigate(`/albums/${rating.id}`)}
                      >
                        <div className="aspect-square bg-muted relative">
                          {rating.album_image && (
                            <img 
                              src={rating.album_image} 
                              alt={rating.album_name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-sm truncate">{rating.album_name}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < rating.rating
                                    ? "fill-yellow-500 text-yellow-500"
                                    : "fill-muted text-muted"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Boards */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Your Boards</h2>
                  <Button onClick={() => navigate("/boards/create")}>
                    Create Board
                  </Button>
                </div>

                {boards.length === 0 ? (
                  <Card className="text-center py-12">
                    <div className="space-y-4">
                      <p className="text-muted-foreground">You haven't created any boards yet</p>
                      <Button onClick={() => navigate("/boards/create")}>
                        Create Your First Board
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {boards.map((board) => (
                      <Card
                        key={board.id}
                        className="cursor-pointer hover:shadow-md transition-all"
                        onClick={() => navigate(`/boards/${board.id}`)}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg">{board.title}</h3>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {board.board_type}
                            </span>
                          </div>
                          {board.description && (
                            <p className="text-sm text-muted-foreground">{board.description}</p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="collection">
              <div className="text-center py-12 text-muted-foreground">
                Collection view coming soon
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;