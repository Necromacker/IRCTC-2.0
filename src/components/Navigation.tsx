import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, ChevronDown, Search, MapPin, Clock, Building, ShoppingCart, MessageCircle, Info, Gift, HelpCircle } from "lucide-react";
import railwaysLogo from "@/assets/railways-logo.jpg";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/live-status", label: "Live Status" },
    { href: "/pantry-cart", label: "Pantry" },
    { href: "/support", label: "Help & Support" },
  ];

  const enquiryItems = [
    { href: "/train-search", label: "Train Search", icon: Search },
    { href: "/pnr-status", label: "PNR Status", icon: MapPin },
    { href: "/at-station", label: "At Station", icon: Building },
    { href: "/view-station", label: "View Station", icon: Building },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 py-1 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo - Fixed Width Container for alignment */}
          <div className="w-[180px] md:w-[220px] flex justify-start">
            <Link to="/" className="flex items-center">
              <img src={railwaysLogo} alt="IRCTC" className="h-10 md:h-12 w-auto" />
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden lg:flex flex-1 items-center justify-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-[14px] font-semibold transition-colors hover:text-[#3b82f6] ${isActive(item.href) ? "text-[#3b82f6]" : "text-gray-600"
                  }`}
              >
                {item.label}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-[14px] font-semibold text-gray-600 hover:text-[#3b82f6] outline-none">
                Enquiries <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-gray-100 shadow-xl">
                {enquiryItems.map((item) => (
                  <Link key={item.href} to={item.href}>
                    <DropdownMenuItem className="flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer hover:bg-gray-50 focus:bg-gray-50">
                      <item.icon className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-700">{item.label}</span>
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Auth Buttons - Fixed Width Container for alignment */}
          <div className="hidden lg:flex w-[180px] md:w-[220px] justify-end">
            <div className="flex items-center border border-gray-200 rounded-full bg-white px-1 py-1">
              <Link to="/login">
                <Button
                  className="rounded-full bg-[#3b82f6] text-white hover:bg-[#2563eb] h-8 px-5 text-sm font-bold shadow-sm"
                >
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  variant="ghost"
                  className="rounded-full text-gray-700 hover:bg-gray-50 h-8 px-5 text-sm font-bold"
                >
                  Sign up
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="sm" className="text-gray-700">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-2">
                  <img src={railwaysLogo} alt="IRCTC" className="h-8 w-auto" />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 space-y-4">
                {navItems.concat(enquiryItems.map(i => ({ href: i.href, label: i.label }))).map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`block text-lg font-bold ${isActive(item.href) ? "text-[#3b82f6]" : "text-gray-700"
                      }`}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 border-t space-y-3">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="block">
                    <Button className="w-full bg-[#3b82f6] text-white rounded-full font-bold">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsOpen(false)} className="block">
                    <Button variant="outline" className="w-full rounded-full font-bold border-gray-200">
                      Sign up
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