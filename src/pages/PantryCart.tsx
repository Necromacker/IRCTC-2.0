import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Plus, Minus, Clock, Check, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

const PantryCart = () => {
  const [trainNumber, setTrainNumber] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const { toast } = useToast();
  const confirmationRef = useRef<HTMLDivElement | null>(null);

  const VEG_BADGE = (
    <span className="inline-flex items-center rounded-md bg-green-600 text-white text-xs px-3 py-1">VEG</span>
  );
  const NONVEG_BADGE = (
    <span className="inline-flex items-center rounded-md bg-red-600 text-white text-xs px-3 py-1">NON-VEG</span>
  );

  const placeholder = "/placeholder.svg";

  const menuItems = {
    meals: [
      { id: "veg-meal", name: "Vegetarian Thali", price: 180, description: "Complete meal with rice, dal, vegetables, roti, pickle & papad", veg: true, image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop" },
      { id: "chicken-meal", name: "Chicken Thali", price: 220, description: "Rice, chicken curry, dal, roti", veg: false, image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop" },
      { id: "biryani", name: "Veg Biryani", price: 150, description: "Aromatic basmati rice with mixed vegetables and spices", veg: true, image: "https://www.madhuseverydayindian.com/wp-content/uploads/2022/11/easy-vegetable-biryani.jpg" },
      { id: "chicken-biryani", name: "Chicken Biryani", price: 260, description: "Fragrant rice layered with marinated chicken", veg: false, image: "https://www.thespruceeats.com/thmb/XDBL9gA6A6nYWUdsRZ3QwH084rk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/SES-chicken-biryani-recipe-7367850-hero-A-ed211926bb0e4ca1be510695c15ce111.jpg" }
    ],
    snacks: [
      { id: "samosa", name: "Samosa (2 pcs)", price: 30, description: "Crispy fried pastry with potato filling", veg: true, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRUU4BdyVmeXxPtiSbUp03lnkD6BwjgHLKXpQ&s" },
      { id: "sandwich", name: "Veg Sandwich", price: 50, description: "Grilled sandwich with vegetables", veg: true, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDatWDLCQMSnJpAg0bIVFeoo-9oDOkp99OIw&s" },
      { id: "pakoda", name: "Onion Pakoda", price: 40, description: "Assorted onion fritters, crispy and spicy", veg: true, image: "https://cdn2.foodviva.com/static-content/food-images/snacks-recipes/onion-pakoda/onion-pakoda.jpg" },
      { id: "chips", name: "Chips", price: 20, description: "Crispy potato chips", veg: true, image: "https://www.bbassets.com/media/uploads/p/l/40053582_2-balaji-simply-salted-chips.jpg" }
    ],
    beverages: [
      { id: "tea", name: "Masala Tea", price: 15, description: "Hot spiced milk tea", veg: true, image: "https://static.vecteezy.com/system/resources/thumbnails/051/200/639/small/creamy-cup-of-masala-chai-tea-rich-and-creamy-cup-of-masala-chai-tea-full-of-spices-and-flavor-beautifully-set-in-a-simple-backdrop-photo.jpg" },
      { id: "coffee", name: "Coffee", price: 20, description: "Freshly brewed coffee", veg: true, image: "https://cdn.shopify.com/s/files/1/0551/0981/2291/files/Flat_White_480x480.jpg?v=1719815848" },
      { id: "cold-drink", name: "Cold Drink", price: 25, description: "Chilled soft drink", veg: true, image: "https://www.shutterstock.com/image-photo/poznan-poland-oct-28-2021-260nw-2071581119.jpg" },
      { id: "water", name: "Water Bottle", price: 15, description: "500ml packaged drinking water", veg: true, image: "https://i.pinimg.com/736x/11/66/35/116635cd3373a3bc15fd060b9fe9c7f3.jpg" }
    ]
  } as unknown as {
    meals: any[];
    snacks: any[];
    beverages: any[];
  };

  // Tabs + slide animation control with height lock
  const tabOrder: Array<'meals' | 'snacks' | 'beverages'> = ['meals', 'snacks', 'beverages'];
  const [activeTab, setActiveTab] = useState<'meals' | 'snacks' | 'beverages'>('meals');
  const [displayedTab, setDisplayedTab] = useState<'meals' | 'snacks' | 'beverages'>('meals');
  const [nextTab, setNextTab] = useState<'meals' | 'snacks' | 'beverages' | null>(null);
  const [isSliding, setIsSliding] = useState(false);
  const [slideDir, setSlideDir] = useState<'forward' | 'backward'>('forward');
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);

  const handleTabChange = (value: string) => {
    const target = value as 'meals' | 'snacks' | 'beverages';
    if (target === activeTab) return;
    const dir = tabOrder.indexOf(target) > tabOrder.indexOf(activeTab) ? 'forward' : 'backward';
    setSlideDir(dir);
    setActiveTab(target); // highlights the tab immediately
    setNextTab(target);
    // lock height before starting animation
    if (panelRef.current) setPanelHeight(panelRef.current.offsetHeight);
    setIsSliding(true);
  };

  useEffect(() => {
    if (!isSliding || !nextTab) return;
    const t = setTimeout(() => {
      setDisplayedTab(nextTab);
      setNextTab(null);
      setIsSliding(false);
      // release height lock after DOM paints new content
      requestAnimationFrame(() => setPanelHeight(null));
    }, 300);
    return () => clearTimeout(t);
  }, [isSliding, nextTab]);

  // Smooth scroll to confirmation when order placed
  useEffect(() => {
    if (orderPlaced && confirmationRef.current) {
      confirmationRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [orderPlaced]);

  const handleAddToCart = (item: any) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1, category: getCategoryForItem(item.id) }]);
    }
    
    toast({
      title: "Added to Cart",
      description: `${item.name} added to your cart`
    });
  };

  const handleUpdateQuantity = (id: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getCategoryForItem = (id: string) => {
    for (const [category, items] of Object.entries(menuItems)) {
      if ((items as any[]).some((item) => item.id === id)) {
        return category as string;
      }
    }
    return '';
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleProceedToMenu = () => {
    if (!trainNumber || !seatNumber) {
      toast({
        title: "Missing Information",
        description: "Please enter both train number and seat number",
        variant: "destructive"
      });
      return;
    }
    setShowMenu(true);
    setOrderPlaced(false);
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before placing order",
        variant: "destructive"
      });
      return;
    }
    
    setOrderPlaced(true);
    toast({
      title: "Order Placed Successfully!",
      description: "Your food will be delivered to your seat shortly"
    });
  };

  const MenuItemCard = ({ item, category }: { item: any, category: string }) => {
    const cartItem = cart.find(cartItem => cartItem.id === item.id);
    const isVeg = !!item.veg;
    const typeBadge = (
      <span className="inline-flex items-center rounded-md bg-muted text-foreground text-xs px-3 py-1 border">
        {category === 'meals' ? 'COMPLETE MEAL' : category === 'snacks' ? 'SNACK' : 'BEVERAGE'}
      </span>
    );
    
    return (
      <Card className="hover:shadow-card transition-all duration-300 overflow-hidden">
        <img src={item.image || placeholder} alt={item.name} className="w-full h-44 object-cover" />
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-lg">{item.name}</h4>
            <span className="text-[#0b63ce] font-bold">₹{item.price}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {item.description}
          </p>
          <div className="flex items-center gap-2">
            {isVeg ? VEG_BADGE : NONVEG_BADGE}
            {typeBadge}
          </div>
          {cartItem ? (
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleUpdateQuantity(item.id, -1)}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="font-medium w-8 text-center">{cartItem.quantity}</span>
              <Button size="sm" variant="outline" onClick={() => handleUpdateQuantity(item.id, 1)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button onClick={() => handleAddToCart(item)} className="w-full h-11 text-base">
              <Plus className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderItemsGrid = (category: 'meals' | 'snacks' | 'beverages') => (
    <div className="grid md:grid-cols-2 gap-4">
      {(menuItems[category] as any[]).map((item) => (
        <MenuItemCard key={item.id} item={item} category={category} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span>Pantry Cart - Order Food</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="train">Train Number</Label>
                <Input
                  id="train"
                  placeholder="e.g., 12301"
                  value={trainNumber}
                  onChange={(e) => setTrainNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seat">Seat Number</Label>
                <Input
                  id="seat"
                  placeholder="e.g., A1/15"
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium mb-2">Delivery Information</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Food will be delivered to your seat</li>
                    <li>• Delivery time: 30-45 minutes</li>
                    <li>• Payment on delivery available</li>
                    <li>• Order tracking via SMS</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={handleProceedToMenu} className="w-full bg-gradient-primary">
              View Menu & Order Food
            </Button>

            {showMenu && (
              <div className="pt-6 space-y-6">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <ShoppingCart className="h-5 w-5 text-primary" />
                          <span>Pantry Menu</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Tabs value={activeTab} className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="meals" onClick={() => handleTabChange('meals')}>Meals</TabsTrigger>
                            <TabsTrigger value="snacks" onClick={() => handleTabChange('snacks')}>Snacks</TabsTrigger>
                            <TabsTrigger value="beverages" onClick={() => handleTabChange('beverages')}>Beverages</TabsTrigger>
                          </TabsList>
                        </Tabs>

                        <div ref={panelRef} className="relative overflow-hidden mt-6" style={{ height: panelHeight ?? 'auto' }}>
                          {!isSliding && (
                            <div className="relative">
                              {renderItemsGrid(displayedTab)}
                            </div>
                          )}

                          {isSliding && (
                            <>
                              <div className={`absolute inset-0 ${slideDir === 'forward' ? 'animate-out slide-out-to-left duration-300' : 'animate-out slide-out-to-right duration-300'}`}>
                                {renderItemsGrid(displayedTab)}
                              </div>
                              {nextTab && (
                                <div className={`absolute inset-0 ${slideDir === 'forward' ? 'animate-in slide-in-from-right duration-300' : 'animate-in slide-in-from-left duration-300'}`}>
                                  {renderItemsGrid(nextTab)}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="lg:col-span-1">
                    <Card className="sticky top-8">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <ShoppingCart className="h-5 w-5 text-primary" />
                          <span>Your Cart</span>
                          {cart.length > 0 && (
                            <Badge className="bg-railway-orange">{cart.length}</Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {cart.length === 0 ? (
                          <div className="text-center py-8">
                            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">Your cart is empty</p>
                            <p className="text-sm text-muted-foreground">Add items from the menu</p>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {cart.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                  <div className="flex-1">
                                    <h5 className="font-medium">{item.name}</h5>
                                    <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleUpdateQuantity(item.id, -1)}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="font-medium w-8 text-center">{item.quantity}</span>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleUpdateQuantity(item.id, 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => handleRemoveFromCart(item.id)}
                                      className="text-destructive hover:text-destructive"
                                      title="Remove"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="border-t pt-4">
                              <div className="flex justify-between items-center mb-4">
                                <span className="font-semibold">Total Amount:</span>
                                <span className="text-xl font-bold text-primary">₹{getTotalPrice()}</span>
                              </div>
                              
                              <div className="space-y-2">
                                <Button onClick={handlePlaceOrder} className="w-full bg-gradient-primary">
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Place Order
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                  Delivery in 30-45 minutes at next station
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {orderPlaced && (
                  <div ref={confirmationRef}>
                    <Card className="text-center">
                      <CardContent className="p-8">
                        <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6">
                          <Check className="h-10 w-10 text-success-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold text-success mb-4">Order Placed Successfully!</h2>
                        <div className="space-y-2 mb-6">
                          <p className="text-muted-foreground">Train: {trainNumber}</p>
                          <p className="text-muted-foreground">Seat: {seatNumber}</p>
                          <p className="text-muted-foreground">Total Amount: ₹{getTotalPrice()}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4 mb-6">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-medium">Estimated Delivery: 30–45 minutes</span>
                          </div>
                        </div>
                        <Button onClick={() => {
                          setShowMenu(true);
                          setOrderPlaced(false);
                          setCart([]);
                          setTrainNumber("");
                          setSeatNumber("");
                        }}>
                          Place Another Order
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PantryCart;