import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Building, Clock, Train, ArrowUp, ArrowDown } from "lucide-react";

const AtStation = () => {
  const [stationQuery, setStationQuery] = useState("");
  const [stationData, setStationData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!stationQuery.trim()) return;

    const code = stationQuery.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
    if (code.length < 3) {
      setError("Enter a valid station code (3-4 letters)");
      return;
    }

    setError(null);
    setIsSearching(true);

    try {
      const response = await fetch("https://easy-rail.onrender.com/at-station", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stnCode: code })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch station data");
      }

      // data is an array of trains with fields like: trainname, trainno, source, dest, timeat
      const mapped = {
        stationName: code, // API does not return station name; keep code
        stationCode: code,
        arrivals: data.map((t: any) => ({
          trainName: t.trainname || "-",
          trainNumber: t.trainno || "-",
          from: t.source || "-",
          to: t.dest || "-",
          scheduledTime: (t.timeat || "-").toString().replace(".", ":"),
          expectedTime: (t.timeat || "-").toString().replace(".", ":"),
          platform: t.platform || "-",
          status: "On Time",
          delay: "On Time",
        })),
        departures: data.map((t: any) => ({
          trainName: t.trainname || "-",
          trainNumber: t.trainno || "-",
          to: t.dest || "-",
          from: t.source || "-",
          scheduledTime: (t.timeat || "-").toString().replace(".", ":"),
          expectedTime: (t.timeat || "-").toString().replace(".", ":"),
          platform: t.platform || "-",
          status: "On Time",
          delay: "On Time",
        })),
      };

      setStationData(mapped);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
      setStationData(null);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on time':
        return 'bg-success/10 text-success border-success';
      case 'delayed':
        return 'bg-railway-orange/10 text-railway-orange border-railway-orange';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const TrainCard = ({ train, type }: { train: any, type: 'arrival' | 'departure' }) => (
    <Card className="hover:shadow-card transition-all duration-300">
      <CardContent className="p-4">
        <div className="grid md:grid-cols-5 gap-4 items-center">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Train className="h-4 w-4 text-primary" />
              <span className="font-semibold">{train.trainName}</span>
            </div>
            <p className="text-sm text-muted-foreground">#{train.trainNumber}</p>
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground">
              {type === 'arrival' ? 'FROM' : 'TO'}
            </Label>
            <p className="font-medium">{type === 'arrival' ? train.from : train.to}</p>
          </div>

          <div className="text-center">
            <Label className="text-xs text-muted-foreground">PLATFORM</Label>
            <p className="font-bold text-primary text-lg">{train.platform || '-'}</p>
          </div>

          <div className="text-center">
            <Label className="text-xs text-muted-foreground">TIME</Label>
            <div className="space-y-1">
              <p className="font-mono text-sm">
                <span className={train.scheduledTime !== train.expectedTime ? 'line-through text-muted-foreground' : 'font-semibold'}>
                  {train.scheduledTime}
                </span>
              </p>
              {train.scheduledTime !== train.expectedTime && (
                <p className="font-mono text-sm font-semibold text-railway-orange">
                  {train.expectedTime}
                </p>
              )}
            </div>
          </div>

          <div className="text-center">
            <Badge 
              variant="outline"
              className={getStatusColor(train.status)}
            >
              {train.delay}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-primary" />
              <span>Station Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="station">Station Name or Code</Label>
                <div className="flex space-x-2">
                  <Input
                    id="station"
                    placeholder="e.g., New Delhi, NDLS"
                    value={stationQuery}
                    onChange={(e) => setStationQuery(e.target.value)}
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

            {stationData && (
              <div className="space-y-6">
                <Card className="border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{stationData.stationName}</h2>
                        <p className="text-muted-foreground">Station Code: {stationData.stationCode}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Live Updates</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="arrivals" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="arrivals" className="flex items-center space-x-2">
                      <ArrowDown className="h-4 w-4" />
                      <span>Arrivals ({stationData.arrivals.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="departures" className="flex items-center space-x-2">
                      <ArrowUp className="h-4 w-4" />
                      <span>Departures ({stationData.departures.length})</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="arrivals" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      {stationData.arrivals.map((train: any, index: number) => (
                        <TrainCard key={index} train={train} type="arrival" />
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="departures" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      {stationData.departures.map((train: any, index: number) => (
                        <TrainCard key={index} train={train} type="departure" />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-center space-x-8 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-success rounded-full"></div>
                        <span>On Time</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-railway-orange rounded-full"></div>
                        <span>Delayed</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-destructive rounded-full"></div>
                        <span>Cancelled</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!stationData && !isSearching && (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Enter station name or code to view arrivals and departures</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Get real-time information about trains at the station
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AtStation;