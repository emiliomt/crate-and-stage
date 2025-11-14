import { Music } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AlbumCover } from "./AlbumCover";

interface BoardItem {
  id: string;
  title: string;
  artist?: string;
  image_url?: string;
  spotify_id: string;
}

interface AlbumGridProps {
  items: BoardItem[];
}

export function AlbumGrid({ items }: AlbumGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 px-4 border-2 border-dashed border-border rounded-lg">
        <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No items added to this board yet</p>
      </div>
    );
  }

  return (
    <>
      {/* Horizontal scroll on mobile */}
      <div className="md:hidden">
        <ScrollArea>
          <div className="flex gap-2 pb-4">
            {items.map((item) => (
              <AlbumCover 
                key={item.id}
                imageUrl={item.image_url}
                title={item.title}
                artist={item.artist}
                spotifyId={item.spotify_id}
                className="w-32 h-32 flex-shrink-0"
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Grid on desktop */}
      <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {items.map((item) => (
          <AlbumCover 
            key={item.id}
            imageUrl={item.image_url}
            title={item.title}
            artist={item.artist}
            spotifyId={item.spotify_id}
            className="aspect-square"
          />
        ))}
      </div>
    </>
  );
}
