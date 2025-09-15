import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Clock, MapPin, ShoppingCart, MessageCircle, Building, Calendar, Train } from "lucide-react";
import heroTrain from "@/assets/hero-train.jpg";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import StationSelect from "@/components/StationSelect";

const Home = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { toast } = useToast();

  const initialFrom = params.get("from") || "";
  const initialTo = params.get("to") || "";
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  }, []);
  const toInputDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [date, setDate] = useState<string>(toInputDate(today));

  const setTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDate(toInputDate(d));
  };

  const handleSearch = () => {
    if (!from || !to || !date) {
      toast({
        title: "Missing Information",
        description: "Please enter From, To and Date of Journey",
        variant: "destructive",
      });
      return;
    }
    navigate(`/book-tickets?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`);
  };

  const onKeyEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const quickActions = [
    {
      icon: Search,
      title: "Book Tickets",
      description: "Find and book train tickets",
      href: "/book-tickets",
      color: "bg-primary text-primary-foreground"
    },
    {
      icon: MapPin,
      title: "PNR Status",
      description: "Check your booking status",
      href: "/pnr-status",
      color: "bg-railway-orange text-railway-orange-foreground"
    },
    {
      icon: Clock,
      title: "Live Status",
      description: "Track trains in real-time",
      href: "/live-status",
      color: "bg-success text-success-foreground"
    },
    {
      icon: Building,
      title: "At Station",
      description: "Station arrivals & departures",
      href: "/at-station",
      color: "bg-muted text-muted-foreground"
    },
    {
      icon: ShoppingCart,
      title: "Pantry Cart",
      description: "Order food in train",
      href: "/pantry-cart",
      color: "bg-accent text-accent-foreground"
    },
    {
      icon: MessageCircle,
      title: "Ask Disha 2.0",
      description: "AI assistant for queries",
      href: "/ask-disha",
      color: "bg-secondary text-secondary-foreground"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-hero bg-clip-text text-transparent">
                    Book Train Tickets
                  </span>
                  <br />
                  <span className="text-foreground">Made Simple</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  Fast, reliable, and secure train booking experience across India
                </p>
              </div>

              {/* Booking Widget */}
              <div className="bg-background border rounded-2xl shadow-railway/20 p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                  {/* From */}
                  <div className="lg:col-span-3">
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <StationSelect
                      label=""
                      placeholder="Type name or code"
                      valueCode={from}
                      onChangeCode={setFrom}
                    />
                  </div>

                  {/* To */}
                  <div className="lg:col-span-3">
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <StationSelect
                      label=""
                      placeholder="Type name or code"
                      valueCode={to}
                      onChangeCode={setTo}
                    />
                  </div>

                  {/* Date of Journey */}
                  <div className="lg:col-span-6">
                    <Label className="text-xs text-muted-foreground">Date of Journey</Label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-2 border rounded-lg px-3 py-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          onKeyDown={onKeyEnter}
                          className="border-0 focus-visible:ring-0 px-0"
                        />
                      </div>
                      <Button variant="outline" className="rounded-full" onClick={setTomorrow}>Tomorrow</Button>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="lg:col-span-9">
                    <Button onClick={handleSearch} className="w-full h-12 bg-[#d94b4b] hover:bg-[#c83f3f] text-white">
                      <Search className="h-5 w-5 mr-2" />
                      Search Trains
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src={heroTrain} 
                alt="Indian Railway Train"
                className="w-full h-auto rounded-2xl shadow-railway"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Everything You Need
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Complete railway services at your fingertips
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} to={action.href} className="group">
                <Card className="p-6 h-full hover:shadow-card transition-all duration-300 group-hover:-translate-y-1">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${action.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
                      <p className="text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Features */}
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <Search className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Easy Booking</h3>
              <p className="text-muted-foreground">Simple and intuitive ticket booking process</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-railway-orange rounded-full flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-railway-orange-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Real-time Updates</h3>
              <p className="text-muted-foreground">Live train status and delay information</p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto">
                <MapPin className="h-8 w-8 text-success-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Track Journey</h3>
              <p className="text-muted-foreground">Monitor your train's progress throughout the journey</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;