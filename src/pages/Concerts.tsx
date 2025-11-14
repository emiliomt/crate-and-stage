import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Music, Calendar, MapPin, ExternalLink, Users, ArrowLeft, Ticket } from "lucide-react";
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
      setEvents(Array.isArray(eventsData.events) ? eventsData.events : []);
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
    <div className="min-h-screen bg-black">
      <header className="border-b border-gray-800 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/feed")}
            className="text-white hover:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Feed
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-8 w-8 text-red-600" />
            <div>
              <h2 className="text-4xl font-bold text-white">Concert Tracker</h2>
              <p className="text-gray-400 text-lg">Find upcoming concerts and get tickets</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search for an artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-12 h-12 bg-white text-black border-2 border-gray-200 focus:border-red-600 text-lg"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading || !searchQuery.trim()}
              className="h-12 px-8 bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        {artist && (
          <Card className="mb-6 bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {artist.image_url && (
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2 text-white">{artist.name}</h2>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{artist.tracker_count?.toLocaleString() || 0} followers</span>
                    </div>
                    {artist.upcoming_event_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{artist.upcoming_event_count} upcoming events</span>
                      </div>
                    )}
                  </div>
                  {artist.url && (
                    <a
                      href={artist.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-red-500 hover:text-red-400 hover:underline"
                    >
                      View on Bandsintown
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {artist && events.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">
                Upcoming concerts for {artist.name}
              </h3>
              <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">All Upcoming</SelectItem>
                  <SelectItem value="week">Next 7 Days</SelectItem>
                  <SelectItem value="month">Next Month</SelectItem>
                  <SelectItem value="three_months">Next 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {eventsLoading ? (
              <div className="text-center py-8 text-gray-400">Loading events...</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {events.map((event) => (
                  <Card key={event.id} className="bg-gray-900 border-gray-800 hover:border-red-600 transition-all">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl text-white">{artist.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-sm text-gray-300">
                        <Calendar className="h-4 w-4 text-red-500 mt-0.5" />
                        <span>{formatEventDate(event.datetime)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
                        <div>
                          <div className="font-medium text-white">{event.venue.name}</div>
                          <div className="text-gray-400">
                            {event.venue.city}, {event.venue.region || event.venue.country}
                          </div>
                        </div>
                      </div>
                      {event.lineup && event.lineup.length > 1 && (
                        <div className="flex items-start gap-2 text-sm">
                          <Users className="h-4 w-4 text-red-500 mt-0.5" />
                          <div>
                            <div className="font-medium text-white">Lineup:</div>
                            <div className="text-gray-400">{event.lineup.join(", ")}</div>
                          </div>
                        </div>
                      )}
                      <Separator className="bg-gray-800" />
                      {event.offers && event.offers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {event.offers.map((offer, idx) => (
                            <Button
                              key={idx}
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              asChild
                            >
                              <a
                                href={offer.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                              >
                                <Ticket className="h-4 w-4" />
                                Get Tickets
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          ))}
                        </div>
                      )}
                      {(!event.offers || event.offers.length === 0) && event.url && (
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" asChild>
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            View Event
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && !artist && searchQuery && (
          <Card className="text-center py-12 bg-gray-900 border-gray-800">
            <CardContent>
              <Music className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-2xl font-bold mb-2 text-white">Artist Not Found</h3>
              <p className="text-gray-400 mb-4">
                We couldn't find any concerts for "{searchQuery}". Try searching for a different artist.
              </p>
              <p className="text-sm text-gray-500">Try: Dua Lipa, Taylor Swift, or The Weeknd</p>
            </CardContent>
          </Card>
        )}

        {!eventsLoading && artist && events.length === 0 && (
          <Card className="text-center py-12 bg-gray-900 border-gray-800">
            <CardContent>
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-2xl font-bold mb-2 text-white">No Upcoming Events</h3>
              <p className="text-gray-400">
                {artist.name} doesn't have any upcoming concerts at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
