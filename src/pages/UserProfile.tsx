import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";
import { FollowButton } from "@/components/FollowButton";

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

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

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
            <CardContent>
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
              <p className="text-muted-foreground mb-4">
                This user doesn't exist or may have been removed.
              </p>
              <Button onClick={() => navigate("/feed")}>
                Back to Feed
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8 shadow-medium">
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile.display_name?.[0] || profile.username[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h1 className="text-3xl font-bold">
                        {profile.display_name || profile.username}
                      </h1>
                      <p className="text-muted-foreground">@{profile.username}</p>
                    </div>
                    <FollowButton userId={profile.id} onFollowChange={fetchProfile} />
                  </div>
                  <div className="flex gap-4 mb-3">
                    <div className="text-sm">
                      <span className="font-semibold">{followersCount}</span>
                      <span className="text-muted-foreground"> followers</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold">{followingCount}</span>
                      <span className="text-muted-foreground"> following</span>
                    </div>
                  </div>
                  {profile.bio && (
                    <p className="text-muted-foreground mt-3">{profile.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boards Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Public Boards</h2>
            {boards.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">No public boards yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {boards.map((board) => (
                  <Card
                    key={board.id}
                    className="cursor-pointer hover:shadow-medium transition-shadow"
                    onClick={() => navigate(`/boards/${board.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{board.title}</CardTitle>
                        <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                          {board.board_type}
                        </span>
                      </div>
                      {board.description && (
                        <CardDescription>{board.description}</CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
