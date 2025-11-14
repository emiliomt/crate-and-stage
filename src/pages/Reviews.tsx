import { useState } from "react";
import { Music, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const Reviews = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("reviews");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                <Music className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">Musicboard</span>
              </div>
              
              <nav className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => navigate("/lists")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Lists
                </button>
                <button
                  onClick={() => navigate("/boards")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Boards
                </button>
                <button
                  onClick={() => navigate("/discover")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Discover
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className="text-foreground font-medium border-b-2 border-primary pb-1"
                >
                  Reviews
                </button>
                <button
                  onClick={() => navigate("/albums")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Albums
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="search"
                  placeholder="Search music..."
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <Music className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
          <h1 className="text-4xl font-bold mb-4">Reviews</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover what people are saying about their favorite albums
          </p>
          <div className="bg-secondary/30 rounded-lg p-12 border-2 border-dashed border-border">
            <p className="text-lg text-muted-foreground mb-4">
              This feature is coming soon! We're building a comprehensive review system where you can:
            </p>
            <ul className="text-left max-w-md mx-auto space-y-2 text-muted-foreground">
              <li>• Browse reviews from the community</li>
              <li>• Filter reviews by genre, rating, and popularity</li>
              <li>• Follow your favorite reviewers</li>
              <li>• Engage with reviews through likes and comments</li>
            </ul>
            <Button 
              className="mt-8"
              onClick={() => navigate("/music-search")}
            >
              Search Albums to Review
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reviews;
