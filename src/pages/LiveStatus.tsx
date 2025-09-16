import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Train, Clock, MapPin, AlertTriangle, CheckCircle, Circle } from "lucide-react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";

// Google Maps component
const MapComponent = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current) {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 20.5937, lng: 78.9629 }, // Center of India
        zoom: 6,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });
    }
  }, []);

  return <div ref={mapRef} className="w-full h-96 rounded-lg" />;
};

const render = (status: Status) => {
  if (status === Status.LOADING) {
    return (
      <div className="w-full h-96 rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }
  if (status === Status.FAILURE) {
    return (
      <div className="w-full h-96 rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Map unavailable</p>
        </div>
      </div>
    );
  }
  return <MapComponent />;
};

const LiveStatus = () => {
  const [trainQuery, setTrainQuery] = useState("");
  const [journeyDate, setJourneyDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [trainStatus, setTrainStatus] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    const query = trainQuery.trim();
    if (!query) return;

    if (!/^[0-9]{5}$/.test(query)) {
      setError("Enter a valid 5-digit train number");
      return;
    }

    setError(null);
    setIsSearching(true);

    try {
      const response = await fetch("https://easy-rail.onrender.com/fetch-train-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainNumber: query, dates: journeyDate })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch train status");
      }

      // Backend returns an array of station status objects
      // Build a summary header and a stations array for the timeline UI
      const currentIndex = data.findIndex((s: any) => s.current === "true");
      const first = data[0] || {};
      const last = data[data.length - 1] || {};
      const distanceCovered = currentIndex >= 0 ? currentIndex * 10 : 0; // unknown - placeholder
      const totalDistance = data.length * 10; // placeholder for progress bar scaling

      const mapped = {
        trainName: first.trainname || `Train ${query}`,
        trainNumber: query,
        date: journeyDate,
        source: first.source || "-",
        destination: last.dest || "-",
        departureTime: first.dep || "-",
        arrivalTime: last.arr || "-",
        status: currentIndex >= 0 ? "Running" : "Scheduled",
        delay: data[currentIndex]?.delay || "On Time",
        currentStation: data[currentIndex]?.station || first.station || "-",
        currentStationTime: data[currentIndex]?.arr || data[currentIndex]?.dep || "-",
        nextStation: data[currentIndex + 1]?.station || "-",
        nextStationTime: data[currentIndex + 1]?.arr || "-",
        distanceCovered,
        totalDistance,
        avgSpeed: "-",
        stations: data.map((s: any) => ({
          name: s.station,
          code: s.code || "",
          arrivalTime: s.arr || "-",
          departureTime: s.dep || "-",
          platform: s.platform || "-",
          status: s.current === "true" ? "current" : (s.status === "crossed" ? "departed" : "upcoming"),
          delay: s.delay || "On Time",
          distance: s.distance || "-",
        }))
      };

      setTrainStatus(mapped);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
      setTrainStatus(null);
    } finally {
      setIsSearching(false);
    }
  };

  const getStationIcon = (status: string) => {
    switch (status) {
      case 'departed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'current':
        return <Train className="h-5 w-5 text-primary animate-pulse" />;
      case 'upcoming':
        return <Circle className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getDelayColor = (delay: string) => {
    if (delay === "On Time") return "text-success";
    if (delay.includes("min")) {
      const minutes = parseInt(delay);
      if (minutes <= 15) return "text-railway-orange";
      return "text-destructive";
    }
    return "text-muted-foreground";
  };

  const progressPercentage = trainStatus 
    ? (trainStatus.distanceCovered / (trainStatus.totalDistance || 1)) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Live Train Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="train">Train Number</Label>
                <div className="flex space-x-2">
                  <Input
                    id="train"
                    placeholder="e.g., 12301"
                    value={trainQuery}
                    onChange={(e) => setTrainQuery(e.target.value.replace(/\D/g, '').slice(0,5))}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Input
                    type="date"
                    value={journeyDate}
                    onChange={(e) => setJourneyDate(e.target.value)}
                    className="w-[11.5rem]"
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? "Searching..." : "Track"}
                  </Button>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
            </div>

            {trainStatus && (
              <div className="space-y-6">
                {/* Train Info Header */}
                <Card className="border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Train className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-lg">{trainStatus.trainName}</span>
                        <Badge variant="secondary">{trainStatus.trainNumber}</Badge>
                      </div>
                      <Badge 
                        variant="outline"
                        className={`${trainStatus.status === 'Running' ? 'border-success text-success' : 'border-muted-foreground text-muted-foreground'}`}
                      >
                        {trainStatus.status}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="font-medium">{trainStatus.source}</span> → <span className="font-medium">{trainStatus.destination}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{trainStatus.date}</span>
                      </div>
                    </div>

                    {trainStatus.delay !== "On Time" && (
                      <div className="bg-railway-orange/10 border border-railway-orange/20 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-railway-orange" />
                          <span className="text-railway-orange font-medium">Running Late by {trainStatus.delay}</span>
                        </div>
                      </div>
                    )}

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Journey Progress</span>
                        <span>{Math.round(progressPercentage)}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{trainStatus.distanceCovered} km</span>
                        <span>{trainStatus.totalDistance} km</span>
                      </div>
                    </div>

                    {/* Current Status */}
                    <div className="grid md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                      <div>
                        <Label className="text-xs text-muted-foreground">CURRENT STATION</Label>
                        <p className="font-medium">{trainStatus.currentStation}</p>
                        <p className="text-sm text-muted-foreground">{trainStatus.currentStationTime}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">NEXT STATION</Label>
                        <p className="font-medium">{trainStatus.nextStation}</p>
                        <p className="text-sm text-muted-foreground">{trainStatus.nextStationTime}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">AVERAGE SPEED</Label>
                        <p className="font-medium text-primary">{trainStatus.avgSpeed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Google Map */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span>Route Map</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Wrapper apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} render={render} />
                  </CardContent>
                </Card>

                {/* Station Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Station Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {trainStatus.stations.map((station: any, index: number) => (
                        <div key={index} className="relative">
                          {index < trainStatus.stations.length - 1 && (
                            <div 
                              className={`absolute left-2.5 top-8 w-0.5 h-12 ${
                                station.status === 'departed' ? 'bg-success' : 'bg-border'
                              }`}
                            />
                          )}
                          <div className="flex items-start space-x-4">
                            {getStationIcon(station.status)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{station.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Platform {station.platform} • {station.code}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-mono">
                                      {station.arrivalTime}
                                      {station.departureTime && station.departureTime !== station.arrivalTime && ` - ${station.departureTime}`}
                                    </span>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${getDelayColor(station.delay)}`}
                                    >
                                      {station.delay}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{station.distance} km</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!trainStatus && !isSearching && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Enter train number or name to track live status</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Get real-time updates on train location and delays
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveStatus;