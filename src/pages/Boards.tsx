import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, List } from "lucide-react";

interface Board {
  id: number;
  name: string;
  creator: string;
  genre: string;
  avatar: string;
  members: number;
  lists: number;
}

export default function Boards() {
  const boards: Board[] = [
    {
      id: 1,
      name: "XXXS",
      creator: "Emilio Montemayor",
      genre: "mixed",
      avatar: "EM",
      members: 1245,
      lists: 89,
    },
    {
      id: 2,
      name: "Indie Discoveries",
      creator: "Sarah Chen",
      genre: "indie",
      avatar: "SC",
      members: 3456,
      lists: 234,
    },
    {
      id: 3,
      name: "Jazz Classics & Deep Cuts",
      creator: "Marcus Williams",
      genre: "jazz",
      avatar: "MW",
      members: 2134,
      lists: 156,
    },
    {
      id: 4,
      name: "Electronic Evolution",
      creator: "Alex Rivera",
      genre: "electronic",
      avatar: "AR",
      members: 4567,
      lists: 312,
    },
    {
      id: 5,
      name: "Hip Hop Golden Era",
      creator: "Jordan Lee",
      genre: "hip-hop",
      avatar: "JL",
      members: 5678,
      lists: 423,
    },
    {
      id: 6,
      name: "Rock Through the Decades",
      creator: "Emma Thompson",
      genre: "rock",
      avatar: "ET",
      members: 3890,
      lists: 267,
    },
  ];

  const getGenreColor = (genre: string) => {
    const colors: Record<string, string> = {
      mixed: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
      indie: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
      jazz: "bg-amber-500/20 text-amber-700 dark:text-amber-300",
      electronic: "bg-pink-500/20 text-pink-700 dark:text-pink-300",
      "hip-hop": "bg-green-500/20 text-green-700 dark:text-green-300",
      rock: "bg-red-500/20 text-red-700 dark:text-red-300",
    };
    return colors[genre] || "bg-gray-500/20 text-gray-700 dark:text-gray-300";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold">Community Boards</h1>
          <p className="text-xl text-muted-foreground">
            Discover music through boards curated by the community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <Card
              key={board.id}
              className="bg-white dark:bg-card border-gray-200 dark:border-border hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold group-hover:bg-primary/30 transition-colors">
                      {board.avatar}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                        {board.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {board.creator}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className={getGenreColor(board.genre)}>
                    {board.genre}
                  </Badge>
                </div>

                <div className="flex items-center gap-6 pt-4 border-t border-gray-200 dark:border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{board.members.toLocaleString()} members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <List className="h-4 w-4" />
                    <span>{board.lists} lists</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
