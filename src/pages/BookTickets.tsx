import { useState, useEffect, useMemo } from "react";
import "./BookTickets.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, Calendar, Clock, Train, Users, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StationSelect from "@/components/StationSelect";

type BookingStep = 'search' | 'trains' | 'seats' | 'passenger' | 'payment';

type SelectedContext = {
  classCode?: string;
};

const BookTickets = () => {
  const [step, setStep] = useState<BookingStep>('search');
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: '',
    class: '',
    selectedTrain: null as any,
    selectedSeats: [] as string[],
    passengers: [{ name: '', age: '', gender: '' }],
  });
  const [selectedContext, setSelectedContext] = useState<SelectedContext>({});
  const [trains, setTrains] = useState<any[]>([]);
  const [loadingTrains, setLoadingTrains] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Stable booked seats generated once per train/class/date
  const [bookedSeats, setBookedSeats] = useState<Set<string> | null>(null);

  // Seeded PRNG (xorshift32-like) based on string seed
  const seededRandom = (seedString: string) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seedString.length; i++) {
      h ^= seedString.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    let state = h || 1;
    return () => {
      state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
      // Convert to [0,1)
      return ((state >>> 0) % 1000000) / 1000000;
    };
  };

  const initializeBookedSeats = (totalSeats: number) => {
    const trainNo = formData.selectedTrain?.number || formData.selectedTrain?.id || '0';
    const classCode = selectedContext.classCode || 'GEN';
    const seed = `${trainNo}-${classCode}-${formData.date}`;
    const rand = seededRandom(seed);
    const numBooked = Math.floor(totalSeats * 0.25); // 25% booked for visualization
    const chosen = new Set<number>();
    while (chosen.size < numBooked) {
      const seatIndex = Math.floor(rand() * totalSeats) + 1; // 1..totalSeats
      chosen.add(seatIndex);
    }
    const asIds = new Set<string>(Array.from(chosen).map((n) => `S${n}`));
    setBookedSeats(asIds);
  };

  useEffect(() => {
    // Initialize booked seats when entering seats view or when dependencies change
    if (step === 'seats') {
      if (!bookedSeats) {
        initializeBookedSeats(72); // SL-like layout uses 72 seats
      }
    } else if (bookedSeats) {
      // Reset when leaving seats to avoid leaking previous state for a new selection
      setBookedSeats(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, formData.selectedTrain, selectedContext.classCode, formData.date]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') || '';
    const to = params.get('to') || '';
    const date = params.get('date') || '';

    if (from || to || date) {
      setFormData((prev) => ({ ...prev, from, to, date }));
      if (from && to && date) {
        setStep('trains');
        fetchTrains(from, to, date);
      }
    }
  }, []);

  const isStationCode = (s: string) => /^[A-Z]{2,4}$/.test(s.trim().toUpperCase());

  const fetchTrains = async (fromCode: string, toCode: string, dateISO: string) => {
    setLoadingTrains(true);
    setError(null);
    setTrains([]);

    try {
      const date = new Date(dateISO);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const indianFormatDate = `${day}-${month}-${year}`;

      const apiUrl = `https://cttrainsapi.confirmtkt.com/api/v1/trains/search?sourceStationCode=${fromCode}&destinationStationCode=${toCode}&addAvailabilityCache=true&excludeMultiTicketAlternates=false&excludeBoostAlternates=false&sortBy=DEFAULT&dateOfJourney=${indianFormatDate}&enableNearby=true&enableTG=true&tGPlan=CTG-3&showTGPrediction=false&tgColor=DEFAULT&showPredictionGlobal=true`;
      const res = await fetch(apiUrl);
      const json = await res.json();
      const list = json?.data?.trainList || [];

      const mapped = list.map((t: any) => {
        const allClasses = t.avlClassesSorted || Object.keys(t.availabilityCache || {});
        const classes = allClasses.map((classType: string) => {
          const classKey = classType.replace("_TQ", "");
          const isTatkal = classType.includes("_TQ");
          const data = isTatkal ? (t.availabilityCacheTatkal?.[classKey] || {}) : (t.availabilityCache?.[classKey] || {});
          return {
            code: classType,
            fare: data.fare || '-',
            availability: data.availabilityDisplayName || 'Check',
            prediction: data.prediction || '--%'
          };
        });
        return {
          id: t.trainNumber,
          name: t.trainName,
          number: t.trainNumber,
          departure: t.departureTime,
          arrival: t.arrivalTime,
          duration: `${Math.floor((t.duration||0)/60)}h ${(t.duration||0)%60}m`,
          hasPantry: t.hasPantry,
          classes,
          raw: t,
        };
      });

      setTrains(mapped);
    } catch (e: any) {
      setError(e?.message || 'Unable to fetch trains.');
    } finally {
      setLoadingTrains(false);
    }
  };

  const handleSearch = () => {
    if (!formData.from || !formData.to || !formData.date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const fromCode = formData.from.trim().toUpperCase();
    const toCode = formData.to.trim().toUpperCase();

    if (!isStationCode(fromCode) || !isStationCode(toCode)) {
      toast({
        title: "Invalid station code",
        description: "Please enter valid station codes (e.g., NDLS, BCT)",
        variant: "destructive"
      });
      return;
    }

    setStep('trains');
    fetchTrains(fromCode, toCode, formData.date);
  };

  const handleClassClick = (train: any, classCode: string) => {
    setSelectedContext({ classCode });
    setFormData({ ...formData, selectedTrain: train });
    setStep('seats');
  };

  const renderSearchForm = () => (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Train className="h-5 w-5 text-primary" />
          <span>Book Train Tickets</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <StationSelect
            label="From Station"
            placeholder="Type name or code (e.g., New Delhi or NDLS)"
            valueCode={formData.from}
            onChangeCode={(code) => setFormData({ ...formData, from: code })}
          />
          <StationSelect
            label="To Station"
            placeholder="Type name or code (e.g., Mumbai Central or BCT)"
            valueCode={formData.to}
            onChangeCode={(code) => setFormData({ ...formData, to: code })}
          />
        </div>

        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setFormData(prev => ({...prev, from: prev.to, to: prev.from}))}>
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Journey Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <div className="text-sm text-muted-foreground">All classes will be shown after search</div>
          </div>
        </div>

        <Button onClick={handleSearch} className="w-full bg-gradient-primary">
          Search Trains
        </Button>
      </CardContent>
    </Card>
  );

  const renderTrainList = () => (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep('search')}>
          ← Back to Search
        </Button>
        <p className="text-muted-foreground">
          {formData.from} → {formData.to} • {formData.date}
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="space-y-4">
        {loadingTrains && (
          <Card>
            <CardContent className="p-6">Loading trains...</CardContent>
          </Card>
        )}
        {!loadingTrains && trains.length === 0 && !error && (
          <Card>
            <CardContent className="p-6">No trains found.</CardContent>
          </Card>
        )}
        {trains.map((train) => (
          <Card key={train.id} className="hover:shadow-card transition-all duration-300">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4 items-start">
                  <div>
                    <h3 className="font-semibold">{train.name}</h3>
                    <p className="text-sm text-muted-foreground">#{train.number}</p>
                    {train.hasPantry && (
                      <p className="text-xs mt-1">🍽️ Pantry Available</p>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{train.departure} - {train.arrival}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{train.duration}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Select a class to continue</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  {train.classes.map((cls: any) => (
                    <button
                      key={cls.code}
                      className={`w-full border rounded-md p-3 text-left transition transform will-change-transform hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-primary/30 ${
                        (cls.availability || '').toLowerCase().includes('wl') || (cls.availability || '').toLowerCase().includes('not')
                                                     ? 'border-railway-orange hover:bg-railway-orange/15'
                           : 'border-success hover:bg-success/15'
                      }`}
                      onClick={() => handleClassClick(train, cls.code)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{cls.code}</div>
                        <div className="text-sm">₹{cls.fare}</div>
                      </div>
                      <div className="text-sm mt-1">{cls.availability}</div>
                      <div className="text-xs text-muted-foreground">Chance: {cls.prediction}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSeatSelection = () => (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Select Seats - {formData.selectedTrain?.name}{selectedContext.classCode ? ` • ${selectedContext.classCode}` : ''}</CardTitle>
          <Button variant="outline" onClick={() => setStep('trains')}>
            ← Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* Coach left */}
          <div className="p-4 bg-muted/30 rounded-lg border border-slate-400 md:max-w-none max-w-[330px] md:mx-0 mx-auto">
            <div className="flex items-center justify-between mb-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="border rounded px-2 py-1 bg-white">TOILET</div>
                <span>COACH ENTRY/EXIT</span>
              </div>
              <div className="flex items-center gap-2">
                <span>COACH ENTRY/EXIT</span>
                <div className="border rounded px-2 py-1 bg-white">TOILET</div>
              </div>
            </div>
            <div className="coach-layout flex flex-col gap-0 mx-auto max-w-[320px] border border-slate-500 rounded-md p-2 overflow-hidden">
              {Array.from({ length: 9 }, (_, bayIndex) => {
                const base = bayIndex * 8;
                const rightSide = [
                  { n: base + 7, t: 'SL' },
                  { n: base + 8, t: 'SU' },
                ];
                const isBooked = (seatId: string) => bookedSeats?.has(seatId) ?? false;
                const renderSeat = (seat: { n: number; t: string }, options?: { rotate?: boolean }) => {
                  const seatId = `S${seat.n}`;
                  const selected = formData.selectedSeats.includes(seatId);
                  return (
                    <Button
                      key={seatId}
                      variant="ghost"
                      size="sm"
                      className={`seat-btn h-12 w-12 p-0 bg-transparent border-0 shadow-none`}
                      disabled={isBooked(seatId)}
                      onClick={() => {
                        if (selected) {
                          setFormData({
                            ...formData,
                            selectedSeats: formData.selectedSeats.filter((s) => s !== seatId),
                          });
                        } else {
                          setFormData({
                            ...formData,
                            selectedSeats: [...formData.selectedSeats, seatId],
                          });
                        }
                      }}
                    >
                      <div className={`seat ${options?.rotate ? 'seat--rotated' : ''} ${selected ? 'seat--selected' : ''} ${isBooked(seatId) ? 'seat--booked' : ''}`}>
                        <span className={`seat-number ${selected ? 'seat-number--on-dark' : ''}`}>{seat.n}</span>
                      </div>
                    </Button>
                  );
                };
                return (
                  <div key={bayIndex} className="grid grid-cols-[1fr_auto_auto] gap-3 items-stretch">
                    <div className="grid grid-rows-2 gap-8">
                      <div className="grid grid-cols-3 gap-0 items-center justify-center">
                        {renderSeat({ n: base + 1, t: 'LB' }, { rotate: true })}
                        {renderSeat({ n: base + 2, t: 'MB' }, { rotate: true })}
                        {renderSeat({ n: base + 3, t: 'UB' }, { rotate: true })}
                      </div>
                      <div className="grid grid-cols-3 gap-0 items-center justify-center">
                        {renderSeat({ n: base + 4, t: 'LB' })}
                        {renderSeat({ n: base + 5, t: 'MB' })}
                        {renderSeat({ n: base + 6, t: 'UB' })}
                      </div>
                    </div>
                    <div className="bg-border w-12 md:w-16 rounded-none my-0 self-stretch" aria-label="Corridor" />
                    <div className="grid grid-rows-2 gap-8">
                      {renderSeat(rightSide[0], { rotate: true })}
                      {renderSeat(rightSide[1])}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="border rounded px-2 py-1 bg-white">TOILET</div>
                <span>COACH ENTRY/EXIT</span>
              </div>
              <div className="flex items-center gap-2">
                <span>COACH ENTRY/EXIT</span>
                <div className="border rounded px-2 py-1 bg-white">TOILET</div>
              </div>
            </div>
          </div>

          {/* Right panel: legend and actions */}
          <div className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg bg-background">
              <div className="font-semibold">Details</div>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <span>Selected</span>
                  </div>
                  <span className="text-muted-foreground">{formData.selectedSeats.length > 0 ? formData.selectedSeats.join(', ') : '-'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-slate-500 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-slate-400 rounded"></div>
                  <span>Booked</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="font-semibold">Selected: {formData.selectedSeats.length} seat(s)</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setStep('passenger')} 
              className="w-full"
              disabled={formData.selectedSeats.length === 0}
            >
              Continue to Passenger Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderPassengerDetails = () => (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Passenger Details</span>
          </CardTitle>
          <Button variant="outline" onClick={() => setStep('seats')}>
            ← Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {formData.passengers.map((passenger, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-4">
            <h4 className="font-semibold">Passenger {index + 1}</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="Enter full name"
                  value={passenger.name}
                  onChange={(e) => {
                    const newPassengers = [...formData.passengers];
                    newPassengers[index].name = e.target.value;
                    setFormData({ ...formData, passengers: newPassengers });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  type="number"
                  placeholder="Age"
                  value={passenger.age}
                  onChange={(e) => {
                    const newPassengers = [...formData.passengers];
                    newPassengers[index].age = e.target.value;
                    setFormData({ ...formData, passengers: newPassengers });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select 
                  value={passenger.gender}
                  onValueChange={(value) => {
                    const newPassengers = [...formData.passengers];
                    newPassengers[index].gender = value;
                    setFormData({ ...formData, passengers: newPassengers });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}

        <Button onClick={() => setStep('payment')} className="w-full">
          Continue to Payment
        </Button>
      </CardContent>
    </Card>
  );

  const renderPayment = () => (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment</span>
          </CardTitle>
          <Button variant="outline" onClick={() => setStep('passenger')}>
            ← Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-4">Booking Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Train:</span>
              <span>{formData.selectedTrain?.name} (#{formData.selectedTrain?.number})</span>
            </div>
            <div className="flex justify-between">
              <span>Route:</span>
              <span>{formData.from} → {formData.to}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formData.date}</span>
            </div>
            <div className="flex justify-between">
              <span>Class:</span>
              <span>{selectedContext.classCode || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span>Seats:</span>
              <span>{formData.selectedSeats.join(', ')}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total Amount:</span>
              <span>₹{(formData.selectedTrain?.price * formData.selectedSeats.length) || 0}</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Button className="w-full bg-gradient-primary">
            Pay with UPI
          </Button>
          <Button variant="outline" className="w-full">
            Debit/Credit Card
          </Button>
          <Button variant="outline" className="w-full">
            Net Banking
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-100 py-8">
      <div className="container mx-auto px-4">
        {step === 'search' && renderSearchForm()}
        {step === 'trains' && renderTrainList()}
        {step === 'seats' && renderSeatSelection()}
        {step === 'passenger' && renderPassengerDetails()}
        {step === 'payment' && renderPayment()}
      </div>
    </div>
  );
};

export default BookTickets;