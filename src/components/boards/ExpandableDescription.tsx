import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ExpandableDescriptionProps {
  description: string;
  maxLength?: number;
}

export function ExpandableDescription({ 
  description, 
  maxLength = 300 
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = description.length > maxLength;
  
  const displayText = isExpanded || !shouldTruncate
    ? description 
    : description.slice(0, maxLength);

  return (
    <div className="space-y-2">
      <p className="text-foreground whitespace-pre-wrap leading-relaxed">
        {displayText}
        {!isExpanded && shouldTruncate && "..."}
      </p>
      
      {shouldTruncate && (
        <Button 
          variant="link" 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-0 h-auto font-semibold"
        >
          {isExpanded ? "Read less" : "Read more..."}
        </Button>
      )}
    </div>
  );
}
