import { useState } from "react";
import { Music, Search, TrendingUp, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Albums = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("albums");

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
                  onClick={() => navigate("/reviews")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reviews
                </button>
                <button
                  onClick={() => setActiveTab("albums")}
                  className="text-foreground font-medium border-b-2 border-primary pb-1"
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
                  placeholder="Search albums..."
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
        {/* Header with filters */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Albums</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Explore, rate, and review albums from across the music universe
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Select defaultValue="trending">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Trending
                  </div>
                </SelectItem>
                <SelectItem value="recent">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Most Recent
                  </div>
                </SelectItem>
                <SelectItem value="rated">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Top Rated
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                <SelectItem value="rock">Rock</SelectItem>
                <SelectItem value="jazz">Jazz</SelectItem>
                <SelectItem value="electronic">Electronic</SelectItem>
                <SelectItem value="hip-hop">Hip Hop</SelectItem>
                <SelectItem value="indie">Indie</SelectItem>
                <SelectItem value="classical">Classical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Placeholder content */}
        <div className="max-w-4xl mx-auto text-center mt-16">
          <Music className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
          <h2 className="text-3xl font-bold mb-4">Album Database Coming Soon</h2>
          <p className="text-xl text-muted-foreground mb-8">
            We're building a comprehensive album browsing experience with:
          </p>
          <div className="bg-secondary/30 rounded-lg p-12 border-2 border-dashed border-border">
            <ul className="text-left max-w-md mx-auto space-y-3 text-muted-foreground text-lg">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Advanced filtering by genre, decade, and popularity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Personalized recommendations based on your taste</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Integration with Spotify, Apple Music, and more</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Complete album metadata and liner notes</span>
              </li>
            </ul>
            <Button 
              className="mt-8"
              size="lg"
              onClick={() => navigate("/music-search")}
            >
              Search Albums Now
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Albums;
