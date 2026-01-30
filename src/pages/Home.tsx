import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, MapPin, Calendar as CalendarIcon, TrainFront, MoreHorizontal, Plane, Hotel, MessageSquare, Train } from "lucide-react";
import heroTrain from "@/assets/hero-train.jpg";
import { useMemo, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import stationsFile from "../../Backend/stations.json";

interface Station {
  stnName: string;
  stnCode: string;
  stnCity?: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [from, setFrom] = useState("");
  const [fromQuery, setFromQuery] = useState("");
  const [to, setTo] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState("Train");

  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  // Load stations
  const allStations: Station[] = useMemo(() => {
    const raw = (Array.isArray((stationsFile as any)?.stations) ? (stationsFile as any).stations : (stationsFile as any)) as any[];
    return raw.map((s: any) => ({
      stnName: s.stnName || s.name || s.station_name || "",
      stnCode: s.stnCode || s.code || s.station_code || "",
      stnCity: s.stnCity || s.city || s.district || "",
    })).filter((s: Station) => s.stnCode && s.stnName);
  }, []);

  const getSuggestions = (query: string) => {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return [];
    return allStations.filter(s =>
      s.stnName.toLowerCase().includes(q) ||
      s.stnCode.toLowerCase().includes(q)
    ).slice(0, 8);
  };

  const fromSuggestions = useMemo(() => getSuggestions(fromQuery), [fromQuery]);
  const toSuggestions = useMemo(() => getSuggestions(toQuery), [toQuery]);

  const handleSearch = () => {
    if (!from || !to || !date) {
      toast({
        title: "Information Required",
        description: "Please select origin, destination and journey date",
        variant: "destructive",
      });
      return;
    }
    const dateStr = format(date, "yyyy-MM-dd");
    navigate(`/book-tickets?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${dateStr}`);
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-white relative overflow-hidden font-sans">
      <div className="relative z-10 h-full flex flex-col">
        {/* Indian Railways Title Header - Compact size for visibility */}
        <div className="text-center pt-2 md:pt-7 pb-7">
          <h1 className="text-2xl md:text-5xl font-light py-1 px-4 inline-flex items-center justify-center gap-3 tracking-[-0.01em] text-gray-800"
            style={{ fontFamily: "'Outfit', sans-serif" }}>
            INDIAN RAILWAYS <Train className="h-10 w-10 text-blue-500/80" />
          </h1>
          <div className="flex items-center justify-center gap-3 md:gap-6 mt-1 text-[10px] md:text-[12px] text-gray-400 font-bold uppercase tracking-[0.2em]">
            <span>Safety</span>
            <div className="h-3 w-[1px] bg-gray-200"></div>
            <span>Security</span>
            <div className="h-3 w-[1px] bg-gray-200"></div>
            <span>Punctuality</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative w-full flex-1 max-h-[350px] px-8 md:px-16">
          {/* Main Hero Container */}
          <div className="w-full h-full relative">
            {/* Darker Rotated Background (Matches reference) */}
            <div className="absolute inset-0 bg-blue-950/20 rounded-[40px] -rotate-2 scale-[1.02] pointer-events-none z-0"></div>

            {/* Main Hero Image with Wave Clip */}
            <div className="w-full h-full overflow-hidden rounded-[50px] shadow-2xl relative z-10"
              style={{
                clipPath: "path('M0 0 H100% V85% C75% 95%, 50% 75%, 25% 95% S0 85% V0 Z')",
              }}>
              <img
                src={heroTrain}
                alt="Scenic Train Journey"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            {/* Floating Search Widget - Moved Upwards to be inside image area */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[10%] w-full max-w-5xl px-4 z-30">
              {/* Tabs */}
              <div className="flex justify-center mb-[-24px] relative z-40">
                <div className="bg-white rounded-[20px] shadow-2xl border border-gray-100 p-1 flex items-center overflow-hidden h-12">
                  {[
                    { name: "Train", icon: TrainFront },
                    { name: "Flights", icon: Plane },
                    { name: "Hotels", icon: Hotel },
                    { name: "More..", icon: MoreHorizontal }
                  ].map((tab, idx, arr) => (
                    <button
                      key={tab.name}
                      onClick={() => setActiveTab(tab.name)}
                      className={`flex items-center gap-2 px-6 py-2 transition-all font-bold text-[13px] ${activeTab === tab.name
                        ? "text-[#3b82f6]"
                        : "text-black-550 hover:bg-gray-50"
                        } ${idx !== arr.length - 1 ? "border-r border-gray-100" : ""}`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Search Panel */}
              <div className="bg-white rounded-[32px] shadow-[0_24px_48px_-8px_rgba(0,0,0,0.12)] p-4 md:p-8 flex flex-col md:flex-row items-center gap-4 border border-gray-50/50 backdrop-blur-sm">
                {/* From Input */}
                <div className="flex-1 w-full relative">
                  <div className="flex items-center gap-2 text-gray-400 mb-1 pl-1">
                    <MapPin className="h-3 w-3" />
                    <span className="text-[9px] uppercase tracking-widest font-black">From</span>
                  </div>
                  <Input
                    value={fromQuery}
                    onChange={(e) => {
                      setFromQuery(e.target.value);
                      setShowFromSuggestions(true);
                    }}
                    onFocus={() => {
                      setShowFromSuggestions(true);
                    }}
                    className="border-none p-0 h-auto text-xl font-bold focus-visible:ring-0 placeholder:text-gray-300 text-gray-800"
                    placeholder="NDLS - Delhi"
                  />
                  {showFromSuggestions && fromSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] max-h-48 overflow-auto py-1">
                      {fromSuggestions.map(s => (
                        <div
                          key={s.stnCode}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b last:border-0 border-gray-50"
                          onClick={() => {
                            setFrom(s.stnCode);
                            setFromQuery(`${s.stnName} (${s.stnCode})`);
                            setShowFromSuggestions(false);
                          }}
                        >
                          <p className="font-bold text-gray-800 text-sm">{s.stnName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{s.stnCode}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="hidden md:block h-10 w-[1.5px] bg-gray-100 mx-1"></div>

                {/* To Input */}
                <div className="flex-1 w-full relative">
                  <div className="flex items-center gap-2 text-gray-400 mb-1 pl-1">
                    <MapPin className="h-3 w-3" />
                    <span className="text-[9px] uppercase tracking-widest font-black">To</span>
                  </div>
                  <Input
                    value={toQuery}
                    onChange={(e) => {
                      setToQuery(e.target.value);
                      setShowToSuggestions(true);
                    }}
                    onFocus={() => {
                      setShowToSuggestions(true);
                    }}
                    className="border-none p-0 h-auto text-xl font-bold focus-visible:ring-0 placeholder:text-gray-300 text-gray-800"
                    placeholder="MMCT - Agra"
                  />
                  {showToSuggestions && toSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] max-h-48 overflow-auto py-1">
                      {toSuggestions.map(s => (
                        <div
                          key={s.stnCode}
                          className="px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b last:border-0 border-gray-50"
                          onClick={() => {
                            setTo(s.stnCode);
                            setToQuery(`${s.stnName} (${s.stnCode})`);
                            setShowToSuggestions(false);
                          }}
                        >
                          <p className="font-bold text-gray-800 text-sm">{s.stnName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{s.stnCode}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="hidden md:block h-10 w-[1.5px] bg-gray-100 mx-1"></div>

                {/* Date Picker */}
                <div className="flex-[1.1] w-full">
                  <div className="flex items-center gap-2 text-gray-400 mb-1 pl-1">
                    <CalendarIcon className="h-3 w-3" />
                    <span className="text-[9px] uppercase tracking-widest font-black">Departure Date</span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-4 cursor-pointer hover:opacity-70 transition-opacity">
                        <span className="text-xl font-bold text-gray-800 whitespace-nowrap">
                          {date ? format(date, "d MMM, EEE") : "Select Date"}
                        </span>
                        <div className="p-2 border border-blue-100 rounded-xl bg-blue-50/30 text-blue-500 hover:bg-blue-100 transition-colors">
                          <CalendarIcon className="h-5 w-5" />
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-gray-100 shadow-2xl" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className="rounded-2xl"
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button
                  onClick={handleSearch}
                  className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-[20px] h-[64px] px-10 text-lg font-black shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Search Trains
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* AskDISHA Feature Section - Reduced margin for visibility */}
        <div className="container mx-auto px-4 mt-16 mb-4 ">
          <div className="bg-[#f8fafc] rounded-[32px] p-6 md:p-8 border border-blue-50/50 flex flex-col md:flex-row items-center justify-between gap-6 group transition-all duration-500 hover:shadow-xl hover:bg-white text-sm md:text-base">
            <div className="max-w-2xl text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-black mb-2 text-gray-900 leading-tight flex items-center gap-2 justify-center md:justify-start underline decoration-orange-200 underline-offset-4 decoration-2">
                AskDISHA <MessageSquare className="h-5 w-5 text-orange-400 fill-orange-50" />
              </h2>
              <p className="text-gray-500 text-[13px] md:text-[15px] font-semibold leading-relaxed">
                Connect with our AI assistant for fast, simple, and hassle-free ticket bookings and queries.
                Experience the next generation of Indian Railway services.
              </p>
            </div>
            <Button
              onClick={() => navigate("/ask-disha")}
              className="bg-[#da8e24] hover:bg-[#c67d1d] text-white rounded-[16px] h-12 px-10 text-base font-black shadow-lg shadow-orange-100 hover:scale-[1.05] active:scale-[0.95] transition-all min-w-[180px]"
            >
              Start Chatting
            </Button>
          </div>
        </div>
      </div>

      {/* Close suggestions on click outside */}
      <div
        className={`fixed inset-0 z-0 ${showFromSuggestions || showToSuggestions ? 'block' : 'hidden'}`}
        onClick={() => { setShowFromSuggestions(false); setShowToSuggestions(false); }}
      />
    </div>
  );
};

export default Home;