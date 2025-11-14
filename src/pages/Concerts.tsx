import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Music, Calendar, MapPin, ExternalLink, Users, Heart, ArrowLeft, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BandsintownArtist, BandsintownEvent, DateFilter } from "@/types/bandsintown";
import { format } from "date-fns";

export default function Concerts() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [artist, setArtist] = useState<BandsintownArtist | null>(null);
  const [events, setEvents] = useState<BandsintownEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setArtist(null);
    setEvents([]);

    try {
      const { data: artistData, error: artistError } = await supabase.functions.invoke('bandsintown-api', {
        body: { action: 'getArtist', artistName: searchQuery }
      });

      if (artistError) throw artistError;

      if (artistData.error) {
        toast.error("Artist not found");
        return;
      }

      setArtist(artistData);
      
      // Fetch events
      await fetchEvents(searchQuery, dateFilter);

    } catch (error) {
      console.error('Search error:', error);
      toast.error("Failed to search artist");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (artistName: string, filter: DateFilter) => {
    setEventsLoading(true);
    try {
      let dateRange = '';
      const today = new Date();

      switch (filter) {
        case 'week':
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          dateRange = `${format(today, 'yyyy-MM-dd')},${format(nextWeek, 'yyyy-MM-dd')}`;
          break;
        case 'month':
          const nextMonth = new Date(today);
          nextMonth.setMonth(today.getMonth() + 1);
          dateRange = `${format(today, 'yyyy-MM-dd')},${format(nextMonth, 'yyyy-MM-dd')}`;
          break;
        case 'three_months':
          const threeMonths = new Date(today);
          threeMonths.setMonth(today.getMonth() + 3);
          dateRange = `${format(today, 'yyyy-MM-dd')},${format(threeMonths, 'yyyy-MM-dd')}`;
          break;
        case 'all':
        default:
          dateRange = 'upcoming';
          break;
      }

      const { data: eventsData, error: eventsError } = await supabase.functions.invoke('bandsintown-api', {
        body: { action: 'getEvents', artistName, dateRange }
      });

      if (eventsError) throw eventsError;

      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch (error) {
      console.error('Events error:', error);
      toast.error("Failed to load events");
    } finally {
      setEventsLoading(false);
    }
  };

  const handleDateFilterChange = (value: DateFilter) => {
    setDateFilter(value);
    if (artist) {
      fetchEvents(artist.name, value);
    }
  };

  const formatEventDate = (datetime: string) => {
    try {
      const date = new Date(datetime);
      return format(date, "EEE, MMM d, yyyy 'at' h:mm a");
    } catch {
      return datetime;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/feed')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feed
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Concert Tracker</h1>
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-48 w-full mb-6" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : artist ? (
          <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Artist Card */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex gap-6">
                  <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {artist.image_url ? (
                      <img
                        src={artist.image_url}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">{artist.name}</h2>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <Badge variant="secondary" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          {artist.upcoming_event_count} Upcoming Events
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" />
                          {artist.tracker_count.toLocaleString()} Trackers
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="default" size="sm" asChild>
                        <a href={artist.url} target="_blank" rel="noopener noreferrer">
                          <Heart className="h-4 w-4 mr-2" />
                          Track on Bandsintown
                          <ExternalLink className="h-3 w-3 ml-2" />
                        </a>
                      </Button>
                      {artist.facebook_page_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={artist.facebook_page_url} target="_blank" rel="noopener noreferrer">
                            Facebook
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Separator className="my-8" />

            {/* Events Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Upcoming Events</h3>
                <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Upcoming</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="three_months">Next 3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {eventsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : events.length > 0 ? (
                <div className="space-y-4 animate-fade-in">
                  {events.map((event) => (
                    <Card key={event.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <CardTitle className="text-xl">{event.venue.name}</CardTitle>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{formatEventDate(event.datetime)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>
                                {event.venue.city}
                                {event.venue.region && `, ${event.venue.region}`}
                                {event.venue.country && `, ${event.venue.country}`}
                              </span>
                            </div>
                          </div>
                          
                          {event.offers && event.offers.length > 0 && (
                            <Badge variant={event.offers[0].status === 'available' ? 'default' : 'secondary'}>
                              {event.offers[0].status}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {event.lineup && event.lineup.length > 1 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Lineup:</p>
                            <p className="text-sm text-muted-foreground">
                              {event.lineup.join(', ')}
                            </p>
                          </div>
                        )}

                        {event.description && (
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        )}

                        <div className="flex gap-2">
                          <Button variant="default" size="sm" asChild>
                            <a href={event.url} target="_blank" rel="noopener noreferrer">
                              RSVP
                              <ExternalLink className="h-3 w-3 ml-2" />
                            </a>
                          </Button>
                          {event.offers && event.offers.length > 0 && event.offers[0].url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={event.offers[0].url} target="_blank" rel="noopener noreferrer">
                                <Ticket className="h-4 w-4 mr-2" />
                                Get Tickets
                                <ExternalLink className="h-3 w-3 ml-2" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Upcoming Events</h3>
                  <p className="text-muted-foreground mb-4">
                    {artist.name} doesn't have any upcoming events scheduled at the moment.
                  </p>
                  <Button variant="outline" asChild>
                    <a href={artist.url} target="_blank" rel="noopener noreferrer">
                      <Heart className="h-4 w-4 mr-2" />
                      Track Artist for Updates
                    </a>
                  </Button>
                </Card>
              )}
            </div>
          </div>
        ) : searchQuery && !loading ? (
          <div className="text-center py-12">
            <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Artist Not Found</h3>
            <p className="text-muted-foreground">Try searching for a different artist</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Find Concert Dates</h3>
            <p className="text-muted-foreground">Search for your favorite artists to see their upcoming concerts</p>
          </div>
        )}
      </main>
    </div>
  );
}
