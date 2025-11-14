import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, AlertCircle, Music } from "lucide-react";
import { AlbumGrid } from "@/components/boards/AlbumGrid";
import { ExpandableDescription } from "@/components/boards/ExpandableDescription";
import { LikeButton } from "@/components/boards/LikeButton";

export default function BoardDetail() {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['board-detail', boardId],
    queryFn: async () => {
      // Fetch board with creator profile
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .select(`
          *,
          profiles!boards_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('id', boardId)
        .maybeSingle();

      if (boardError) throw boardError;
      if (!board) throw new Error('Board not found');

      // Fetch board items
      const { data: items, error: itemsError } = await supabase
        .from('board_items')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (itemsError) throw itemsError;

      // Check if current user has liked
      const { data: { user } } = await supabase.auth.getUser();
      let isLikedByUser = false;
      
      if (user) {
        const { data: userLike } = await supabase
          .from('board_likes')
          .select('id')
          .eq('board_id', boardId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        isLikedByUser = !!userLike;
      }

      return {
        board,
        items: items || [],
        isLikedByUser,
        creator: board.profiles
      };
    },
    enabled: !!boardId
  });

  // Update page title
  useEffect(() => {
    if (data?.board && data?.creator) {
      document.title = `${data.board.title} by ${data.creator.display_name || data.creator.username} | Musicboard`;
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-96 mb-4" />
          <Skeleton className="h-6 w-24 mb-8" />
          <div className="grid grid-cols-8 gap-2 mb-8">
            {Array.from({ length: 16 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-24 w-full mb-4" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Board Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This board doesn't exist or has been deleted.
          </p>
          <Button onClick={() => navigate('/boards')}>
            Back to Community Boards
          </Button>
        </div>
      </div>
    );
  }

  const { board, items, isLikedByUser, creator } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/boards')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Community Boards
        </Button>

        {/* Board header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-4xl font-bold">{board.title}</h1>
            <Badge variant="secondary" className="capitalize">
              {board.board_type}
            </Badge>
          </div>
        </div>

        {/* Album grid */}
        <div className="mb-8">
          <AlbumGrid items={items} />
        </div>

        {/* Board description */}
        {board.description && (
          <div className="mb-8">
            <ExpandableDescription description={board.description} maxLength={300} />
          </div>
        )}

        {/* Creator info */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-12 w-12">
            <AvatarImage src={creator?.avatar_url || undefined} />
            <AvatarFallback>
              {(creator?.display_name || creator?.username || 'U')[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <button
              onClick={() => navigate(`/profile`)}
              className="font-semibold hover:underline"
            >
              {creator?.display_name || creator?.username}
            </button>
            <p className="text-sm text-muted-foreground">
              Created {new Date(board.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Engagement metrics */}
        <div className="flex items-center gap-6 pt-6 border-t">
          <LikeButton 
            boardId={board.id} 
            initialLikes={board.likes_count || 0}
            initialIsLiked={isLikedByUser}
          />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Music className="h-5 w-5" />
            <span className="text-sm">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
