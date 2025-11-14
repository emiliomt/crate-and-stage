import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Disc3, Users, Heart, Disc } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex items-center gap-3">
              <Disc3 className="h-16 w-16 text-primary-foreground animate-spin" style={{ animationDuration: "4s" }} />
              <Music className="h-12 w-12 text-accent-foreground" />
            </div>
            <h1 className="mb-6 text-5xl md:text-7xl font-bold text-primary-foreground">
              Discover Music Through People
            </h1>
            <p className="mb-8 max-w-2xl text-xl text-primary-foreground/90">
              A unified platform for your streaming, vinyl collection, and concert experiences.
              Share with friends, not algorithms.
            </p>
            <div className="flex gap-4">
              <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => navigate("/lists")}>
                Browse Lists
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => navigate("/boards")}>
                Community Boards
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Music, Unified</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stop using fragmented tools. One place for everything music.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/lists")}>
              <CardHeader>
                <Disc className="h-12 w-12 text-vinyl-red mb-4" />
                <CardTitle>Music Lists</CardTitle>
                <CardDescription>
                  Create narrative-driven playlists with stories and discover curated collections
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/boards")}>
              <CardHeader>
                <Users className="h-12 w-12 text-teal mb-4" />
                <CardTitle>Community Boards</CardTitle>
                <CardDescription>
                  Join themed boards and discover music through community curation
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate("/feed")}>
              <CardHeader>
                <Music className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Social Feed</CardTitle>
                <CardDescription>
                  See what friends are listening to, rating, and adding to their collections
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Human-First Discovery</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Tired of cold algorithms? Discover music through people you trust.
                Follow friends, taste-makers, and fellow collectors to see what they're listening to,
                buying, and experiencing.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Heart className="h-6 w-6 text-vinyl-red mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Curated Boards</h3>
                    <p className="text-muted-foreground">
                      Create and share themed collections of your favorite music
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-6 w-6 text-teal mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Social Feed</h3>
                    <p className="text-muted-foreground">
                      See what people you follow are adding to their collections
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Disc3 className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Smart Recommendations</h3>
                    <p className="text-muted-foreground">
                      Discover new music based on your friends' taste, not just data
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-card rounded-lg p-8 shadow-album">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="text-2xl">Ready to dive in?</CardTitle>
                  <CardDescription>
                    Join music lovers who value human curation over algorithms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="lg" className="w-full" onClick={() => navigate("/auth")}>
                    Create Free Account
                  </Button>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    No credit card required. Start sharing in seconds.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>© 2025 Vinyl Social. Music simplified and humane.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
