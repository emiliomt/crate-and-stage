import { Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AlbumCoverProps {
  imageUrl?: string;
  title: string;
  artist?: string;
  spotifyId: string;
  className?: string;
}

export function AlbumCover({ 
  imageUrl, 
  title, 
  artist, 
  spotifyId,
  className
}: AlbumCoverProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/album-detail/${spotifyId}`);
  };

  return (
    <div 
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-lg",
        "transition-transform hover:scale-105",
        className
      )}
      onClick={handleClick}
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={`${title} by ${artist || 'Unknown Artist'}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <Music className="h-8 w-8 text-muted-foreground" />
        </div>
      )}

      {/* Hover overlay with title */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
        <p className="text-white text-xs font-semibold truncate">{title}</p>
        {artist && (
          <p className="text-white/80 text-xs truncate">{artist}</p>
        )}
      </div>
    </div>
  );
}
