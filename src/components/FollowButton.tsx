import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";

interface FollowButtonProps {
  userId: string;
  onFollowChange?: () => void;
}

export const FollowButton = ({ userId, onFollowChange }: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkFollowStatus();
  }, [userId]);

  const checkFollowStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      if (user.id === userId) return; // Don't check if viewing own profile

      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", userId)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error: any) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", userId);

        if (error) throw error;
        setIsFollowing(false);
        toast.success("Unfollowed");
      } else {
        // Follow
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: currentUserId,
            following_id: userId
          });

        if (error) throw error;
        setIsFollowing(true);
        toast.success("Following");
      }

      onFollowChange?.();
    } catch (error: any) {
      toast.error("Failed to update follow status");
    } finally {
      setLoading(false);
    }
  };

  // Don't show button for own profile
  if (currentUserId === userId) return null;

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleFollow}
      disabled={loading}
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
};
