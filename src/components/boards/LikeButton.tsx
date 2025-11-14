import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  boardId: string;
  initialLikes: number;
  initialIsLiked: boolean;
}

export function LikeButton({ boardId, initialLikes, initialIsLiked }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to like boards",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('board_likes')
          .delete()
          .eq('board_id', boardId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update likes count in boards table
        await supabase
          .from('boards')
          .update({ likes_count: Math.max(0, likesCount - 1) })
          .eq('id', boardId);
        
        setLikesCount(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        // Like
        const { error } = await supabase
          .from('board_likes')
          .insert({
            board_id: boardId,
            user_id: user.id
          });

        if (error) throw error;

        // Update likes count in boards table
        await supabase
          .from('boards')
          .update({ likes_count: likesCount + 1 })
          .eq('id', boardId);
        
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={handleLike}
      disabled={isLoading}
      className="gap-2"
    >
      <Heart 
        className={cn(
          "h-5 w-5 transition-colors",
          isLiked && "fill-vinyl-red text-vinyl-red"
        )}
      />
      <span>{likesCount}</span>
    </Button>
  );
}
