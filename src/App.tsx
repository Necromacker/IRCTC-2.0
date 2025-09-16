import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import BookTickets from "./pages/BookTickets";
import TrainSearch from "./pages/TrainSearch";
import PNRStatus from "./pages/PNRStatus";
import LiveStatus from "./pages/LiveStatus";
import AtStation from "./pages/AtStation";
import PantryCart from "./pages/PantryCart";
import AskDisha from "./pages/AskDisha";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import AskDishaFab from "./components/AskDishaFab";
import ViewStation from "./pages/ViewStation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book-tickets" element={<BookTickets />} />
          <Route path="/train-search" element={<TrainSearch />} />
          <Route path="/pnr-status" element={<PNRStatus />} />
          <Route path="/live-status" element={<LiveStatus />} />
          <Route path="/at-station" element={<AtStation />} />
          <Route path="/pantry-cart" element={<PantryCart />} />
          <Route path="/ask-disha" element={<AskDisha />} />
          <Route path="/view-station" element={<ViewStation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AskDishaFab />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
