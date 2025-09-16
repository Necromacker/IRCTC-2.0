import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Train, Clock, MapPin } from "lucide-react";
import trainsFile from "../../Backend/trains.json";

const TrainSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localTrains: any[] = useMemo(() => {
    const raw = Array.isArray((trainsFile as any)) ? (trainsFile as any) : ((trainsFile as any).trains || []);
    return raw;
  }, []);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setError(null);
    setIsSearching(true);
    setSearchResults([]);

    if (/^\d{3,5}$/.test(q)) {
      try {
        const res = await fetch(`https://erail.in/rail/getTrains.aspx?TrainNo=${q}&DataSource=0&Language=0&Cache=true`);
        const raw = await res.text();
        const data = raw.split("~~~~~~~~");
        if (data[0] === "~~~~~Please try again after some time." || data[0] === "~~~~~Train not found") {
          throw new Error(data[0].split("~").join(""));
        }
        let data1 = data[0].split("~").filter((el: string) => el !== "");
        if (data1[1]?.length > 6) data1.shift();

        const train = {
          name: data1[2],
          number: data1[1]?.replace("^", ""),
          route: `${data1[3]} - ${data1[5]}`,
          runningDaysBits: data1[14] || "0000000",
          departureTime: (data1[11] || "-").replace(".", ":"),
          arrivalTime: (data1[12] || "-").replace(".", ":"),
          duration: ((data1[13] || "-").replace(".", ":")) + " hrs",
          type: (data[1]?.split("~").filter((el: string) => el !== "")[11]) || 'Train'
        };
        const weekdays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
        const runningDays = train.runningDaysBits.split("").map((b: string, i: number) => b === "1" ? weekdays[i] : null).filter(Boolean);

        setSearchResults([{ 
          name: train.name,
          number: train.number,
          route: train.route,
          runningDays,
          departureTime: train.departureTime,
          arrivalTime: train.arrivalTime,
          duration: train.duration,
          type: train.type,
        }]);
      } catch (e: any) {
        setError(e?.message || "Unable to fetch train details");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
      return;
    }

    // Non-numeric query: use local file suggestions
    const ql = q.toLowerCase();
    const filtered = localTrains.filter((t: any) =>
      (t.trainName || t.name || "").toLowerCase().includes(ql) ||
      (t.trainno || t.number || "").toString().toLowerCase().includes(ql)
    ).slice(0, 20).map((t: any) => ({
      name: t.trainName || t.name || '-',
      number: t.trainno || t.number || '-',
      route: `${t.fromName || t.source || '-'} - ${t.toName || t.dest || '-'}`,
      runningDays: [],
      departureTime: t.fromTime || t.depart || '-',
      arrivalTime: t.toTime || t.arrive || '-',
      duration: t.travelTime || '-',
      type: t.type || 'Train'
    }));

    setSearchResults(filtered);
    setIsSearching(false);
  };

  const getDayColor = (day: string) => {
    const colors: Record<string, string> = {
      "Mon": "bg-blue-100 text-blue-800",
      "Tue": "bg-green-100 text-green-800",
      "Wed": "bg-yellow-100 text-yellow-800",
      "Thu": "bg-purple-100 text-purple-800",
      "Fri": "bg-pink-100 text-pink-800",
      "Sat": "bg-indigo-100 text-indigo-800",
      "Sun": "bg-red-100 text-red-800"
    };
    return colors[day] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary" />
              <span>Train Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search by Train Number or Name</Label>
                <div className="flex space-x-2">
                  <Input
                    id="search"
                    placeholder="e.g., 12301 or Rajdhani"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Search Results</h3>
                {searchResults.map((train, index) => (
                  <Card key={index} className="hover:shadow-card transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Train className="h-4 w-4 text-primary" />
                              <h4 className="font-semibold">{train.name}</h4>
                              <Badge variant="secondary">{train.number}</Badge>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{train.route}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className={
                            train.type === 'Superfast' ? 'border-railway-orange text-railway-orange' :
                            train.type === 'Duronto' ? 'border-primary text-primary' :
                            'border-muted-foreground text-muted-foreground'
                          }>
                            {train.type}
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">DEPARTURE - ARRIVAL</Label>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono">{train.departureTime} - {train.arrivalTime}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">Duration: {train.duration}</p>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">RUNNING DAYS</Label>
                            <div className="flex flex-wrap gap-1">
                              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                                <Badge
                                  key={day}
                                  variant={train.runningDays?.includes(day) ? "default" : "outline"}
                                  className={`text-xs ${train.runningDays?.includes(day) ? '' : 'opacity-50'}`}
                                >
                                  {day}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-end">
                            <Button className="w-full" size="sm">
                              Book Tickets
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !isSearching && !error && (
              <div className="text-center py-8">
                <Train className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No trains found for "{searchQuery}"</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try searching with train number or a different name
                </p>
              </div>
            )}

            {!searchQuery && searchResults.length === 0 && !error && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Enter train number or name to search</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrainSearch;