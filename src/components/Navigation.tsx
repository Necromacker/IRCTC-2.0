import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, Train, Search, MapPin, Clock, Building, ShoppingCart, MessageCircle, User } from "lucide-react";
import railwaysLogo from "@/assets/railways-logo.jpg";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Train },
    // Removed Book menu item; booking is now handled from Home page
    { href: "/train-search", label: "Search", icon: Search },
    { href: "/pnr-status", label: "PNR", icon: MapPin },
    { href: "/live-status", label: "Live", icon: Clock },
    { href: "/at-station", label: "Station", icon: Building },
    { href: "/pantry-cart", label: "Pantry", icon: ShoppingCart },
    { href: "/view-station", label: "View Station", icon: Building },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-primary to-railway-orange text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img src={railwaysLogo} alt="Indian Railways" className="h-8 w-8 rounded-full" />
            <span className="text-xl font-bold">
              Indian Railways
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-5">
            {navItems
              .filter((item) => !["/train-search", "/pnr-status", "/at-station"].includes(item.href))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 flex items-center px-2 text-white hover:bg-white/10 ${isActive(item.href) ? 'bg-white/15' : ''}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden lg:inline">{item.label}</span>
                    </Button>
                  </Link>
                );
              })}

            {/* Grouped menu to reduce overflow */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="sm" className={`h-8 flex items-center px-2 text-white hover:bg-white/10 ${["/train-search", "/pnr-status", "/at-station"].some((p) => isActive(p as string)) ? 'bg-white/15' : ''}`}>
                  <Search className="h-4 w-4" />
                  <span className="hidden lg:inline">Enquiries</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <Link to="/train-search">
                  <DropdownMenuItem className="cursor-pointer">
                    Train Search
                  </DropdownMenuItem>
                </Link>
                <Link to="/pnr-status">
                  <DropdownMenuItem className="cursor-pointer">
                    PNR Status
                  </DropdownMenuItem>
                </Link>
                <Link to="/at-station">
                  <DropdownMenuItem className="cursor-pointer">
                    At Station
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <User className="h-4 w-4 mr-2" />
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-white text-primary hover:bg-white/90">
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-2">
                  <img src={railwaysLogo} alt="Indian Railways" className="h-6 w-6 rounded-full" />
                  <span>Indian Railways</span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className="block"
                    >
                                          <Button
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className="w-full justify-start space-x-2 text-white hover:bg-white/10"
                    >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
                <div className="pt-4 border-t space-y-2">
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-railway-orange hover:bg-railway-orange/90">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;