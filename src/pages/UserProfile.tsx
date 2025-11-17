import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Star } from "lucide-react";
import { toast } from "sonner";
import { FollowButton } from "@/components/FollowButton";
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

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [recentRatings, setRecentRatings] = useState<AlbumRating[]>([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      // Fetch profile by username
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", userId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        toast.error("Profile not found");
        setLoading(false);
        return;
      }
      
      setProfile(profileData);

      // Fetch user's public boards
      const { data: boardsData, error: boardsError } = await supabase
        .from("boards")
        .select("*")
        .eq("user_id", profileData.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (boardsError) throw boardsError;
      setBoards(boardsData || []);

      // Fetch recent ratings
      const { data: ratingsData } = await supabase
        .from("album_ratings")
        .select("*")
        .eq("user_id", profileData.id)
        .order("created_at", { ascending: false })
        .limit(6);

      setRecentRatings(ratingsData || []);

      // Fetch reviews count
      const { count: reviewsCount } = await supabase
        .from("album_reviews")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profileData.id);

      setReviewsCount(reviewsCount || 0);

      // Fetch followers count
      const { count: followersCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profileData.id);

      setFollowersCount(followersCount || 0);

      // Fetch following count
      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profileData.id);

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

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center py-12">
            <div className="space-y-4">
              <User className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">Profile Not Found</h3>
              <p className="text-muted-foreground">
                The user you're looking for doesn't exist or has been deleted.
              </p>
              <Button onClick={() => navigate("/feed")}>
                Back to Feed
              </Button>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const listenedCount = recentRatings.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
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

                <FollowButton userId={profile.id} />
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
                  <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
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
                <h2 className="text-2xl font-bold mb-4">Public Boards</h2>
                {boards.length === 0 ? (
                  <Card className="text-center py-12">
                    <p className="text-muted-foreground">No public boards yet</p>
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

export default UserProfile;
