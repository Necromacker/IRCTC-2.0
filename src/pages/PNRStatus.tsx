import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Train, Clock, MapPin, User, CheckCircle, AlertCircle } from "lucide-react";

const PNRStatus = () => {
  const [pnr, setPnr] = useState("");
  const [pnrData, setPnrData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!pnr.trim() || pnr.length !== 10) return;

    setIsSearching(true);
    setError(null);

    try {
      const url = `https://irctc-indian-railway-pnr-status.p.rapidapi.com/getPNRStatus/${pnr}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': 'b0075d9fa8msh81b2609e08877a8p14ff09jsn738ea7672cad',
          'x-rapidapi-host': 'irctc-indian-railway-pnr-status.p.rapidapi.com'
        }
      });
      const json = await response.json();
      if (!json.success || !json.data) {
        throw new Error('Invalid PNR number or no data found');
      }

      const d = json.data;
      const passengers = (d.passengerList || []).map((p: any, idx: number) => ({
        name: `Passenger ${idx + 1}`,
        age: p.age || '-',
        gender: p.gender || '-',
        seatNumber: p.seatNumber || p.currentStatusDetails || '-',
        status: p.currentStatusDetails || '-',
        coach: p.coach || '-',
      }));

      const mapped = {
        pnr: d.pnrNumber || pnr,
        trainName: d.trainName || '-',
        trainNumber: d.trainNumber || '-',
        from: d.sourceStation || '-',
        to: d.destinationStation || '-',
        dateOfJourney: d.dateOfJourney || '-',
        class: d.journeyClass || '-',
        status: d.chartStatus || '-',
        passengers,
        bookingStatus: d.chartStatus || '-',
        chartPrepared: (d.chartStatus || '').toUpperCase() === 'CHART PREPARED',
        boardingStation: d.boardingPoint || '-',
        reservationUpto: d.destinationStation || '-',
        ticketFare: d.bookingFare || '-',
      };

      setPnrData(mapped);
    } catch (e: any) {
      setError(e?.message || 'Unable to fetch PNR details. Please try again later.');
      setPnrData(null);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'confirmed':
      case 'chart prepared':
        return 'bg-success/10 text-success border-success';
      case 'rac':
        return 'bg-railway-orange/10 text-railway-orange border-railway-orange';
      case 'waiting list':
      case 'wl':
        return 'bg-destructive/10 text-destructive border-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'confirmed':
      case 'chart prepared':
        return <CheckCircle className="h-4 w-4" />;
      case 'rac':
      case 'waiting list':
      case 'wl':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-primary" />
              <span>PNR Status Check</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pnr">Enter 10-digit PNR Number</Label>
                <div className="flex space-x-2">
                  <Input
                    id="pnr"
                    placeholder="e.g., 4567891234"
                    value={pnr}
                    onChange={(e) => setPnr(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 font-mono"
                    maxLength={10}
                  />
                  <Button 
                    onClick={handleSearch} 
                    disabled={isSearching || pnr.length !== 10}
                  >
                    {isSearching ? "Checking..." : "Check Status"}
                  </Button>
                </div>
                {pnr.length > 0 && pnr.length !== 10 && (
                  <p className="text-sm text-muted-foreground">
                    PNR must be exactly 10 digits
                  </p>
                )}
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
            </div>

            {pnrData && (
              <div className="space-y-6">
                <Card className="border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Train className="h-5 w-5 text-primary" />
                        <span className="font-semibold">{pnrData.trainName}</span>
                        <Badge variant="secondary">{pnrData.trainNumber}</Badge>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(pnrData.bookingStatus)} flex items-center space-x-1`}
                      >
                        {getStatusIcon(pnrData.bookingStatus)}
                        <span>{pnrData.bookingStatus}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            <span className="font-medium">{pnrData.from}</span> → <span className="font-medium">{pnrData.to}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{pnrData.dateOfJourney}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Class:</span> <span className="font-medium">{pnrData.class}</span>
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">PNR:</span> <span className="font-mono font-medium">{pnrData.pnr}</span>
                        </p>
                      </div>
                    </div>

                    {pnrData.chartPrepared && (
                      <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-success font-medium">Chart Prepared</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-primary" />
                      <span>Passenger Details</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pnrData.passengers.map((passenger: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="grid md:grid-cols-4 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">PASSENGER {index + 1}</Label>
                              <p className="font-medium">{passenger.name}</p>
                              <p className="text-sm text-muted-foreground">{passenger.age}Y, {passenger.gender}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">SEAT/BERTH</Label>
                              <p className="font-mono font-medium">{passenger.seatNumber}</p>
                              <p className="text-sm text-muted-foreground">Coach {passenger.coach}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">STATUS</Label>
                              <Badge 
                                variant="outline"
                                className={`${getStatusColor(passenger.status)} flex items-center space-x-1 w-fit`}
                              >
                                {getStatusIcon(passenger.status)}
                                <span>{passenger.status}</span>
                              </Badge>
                            </div>
                            <div className="md:text-right">
                              <Label className="text-xs text-muted-foreground">BOOKING STATUS</Label>
                              <p className="font-medium">{passenger.bookingStatus || '-'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">BOARDING STATION</Label>
                        <p className="font-medium">{pnrData.boardingStation}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">RESERVATION UPTO</Label>
                        <p className="font-medium">{pnrData.reservationUpto}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">TICKET FARE</Label>
                        <p className="font-medium text-primary">₹{pnrData.ticketFare}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!pnrData && !isSearching && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Enter your PNR number to check booking status</p>
                <p className="text-sm text-muted-foreground mt-2">
                  PNR is a 10-digit number found on your ticket
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PNRStatus;