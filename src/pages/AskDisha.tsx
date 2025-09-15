import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Bot, User, Clock, Train, Search, CreditCard } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'disha';
  timestamp: Date;
}

const AskDisha = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m Disha 2.0, your AI assistant for Indian Railways. How can I help you today?',
      sender: 'disha',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const quickQuestions = [
    { text: "Check PNR status", icon: Search },
    { text: "Train running status", icon: Train },
    { text: "Booking help", icon: CreditCard },
    { text: "Refund process", icon: CreditCard },
    { text: "Station facilities", icon: Train },
    { text: "Food ordering", icon: MessageCircle }
  ];

  const sampleResponses = {
    "pnr": "To check your PNR status, you can:\n\n1. Visit the PNR Status page from the navigation menu\n2. Enter your 10-digit PNR number\n3. Get real-time updates on your booking status\n\nYour PNR number is printed on your ticket. It's a 10-digit number that helps track your reservation.",
    "train": "For live train status:\n\n1. Go to Live Status page\n2. Enter train number or name\n3. View real-time location and delay information\n\nYou'll get updates on:\n• Current station\n• Expected arrival/departure times\n• Delay information\n• Platform numbers",
    "booking": "To book train tickets:\n\n1. Click 'Book Tickets' from the home page\n2. Enter source and destination stations\n3. Select travel date and class\n4. Choose from available trains\n5. Select seats and enter passenger details\n6. Make payment\n\nFor best availability, book in advance. Tatkal booking opens 1 day before journey.",
    "refund": "For ticket refunds:\n\n1. Cancellation charges apply based on time before departure\n2. Online cancellation is available up to 4 hours before departure\n3. Refund amount depends on ticket type and cancellation time\n4. Money is refunded to original payment source\n\nFor e-tickets, cancellation can be done online. For counter tickets, visit the station.",
    "station": "Station facilities include:\n\n• Waiting rooms\n• Food courts and vendors\n• ATMs and banking services\n• Parking facilities\n• WiFi in major stations\n• Wheelchair accessibility\n• Enquiry counters\n\nUse 'At Station' feature to check arrivals and departures at any station.",
    "food": "For ordering food in trains:\n\n1. Use Pantry Cart feature\n2. Enter your train number and seat\n3. Browse menu categories (Meals, Snacks, Beverages)\n4. Add items to cart\n5. Place order for delivery at seat\n\nFood is delivered within 30-45 minutes at the next major station."
  };

  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('pnr') || message.includes('status')) {
      return sampleResponses.pnr;
    } else if (message.includes('train') && (message.includes('status') || message.includes('live') || message.includes('running'))) {
      return sampleResponses.train;
    } else if (message.includes('book') || message.includes('ticket') || message.includes('reservation')) {
      return sampleResponses.booking;
    } else if (message.includes('refund') || message.includes('cancel') || message.includes('return')) {
      return sampleResponses.refund;
    } else if (message.includes('station') || message.includes('facility') || message.includes('amenity')) {
      return sampleResponses.station;
    } else if (message.includes('food') || message.includes('pantry') || message.includes('meal')) {
      return sampleResponses.food;
    } else if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return "Hello! I'm here to help you with all your railway-related queries. You can ask me about:\n\n• Ticket booking and PNR status\n• Train schedules and live status\n• Station information\n• Food ordering\n• Refunds and cancellations\n\nWhat would you like to know?";
    } else {
      return "I can help you with various railway services including:\n\n• Checking PNR status and train schedules\n• Booking tickets and seat selection\n• Station information and facilities\n• Food ordering in trains\n• Refund and cancellation policies\n\nPlease let me know what specific information you need, and I'll be happy to assist you!";
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(inputText);
      const dishaMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'disha',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, dishaMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="h-[80vh] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <span>Ask Disha 2.0</span>
              <Badge variant="secondary" className="bg-success/10 text-success">
                Online
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] ${
                      message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.sender === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-gradient-primary text-primary-foreground'
                      }`}>
                        {message.sender === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>
                      <div className={`rounded-lg p-3 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                        <p className={`text-xs mt-2 ${
                          message.sender === 'user'
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="p-4 border-t bg-muted/30">
                <p className="text-sm text-muted-foreground mb-3">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((question, index) => {
                    const Icon = question.icon;
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickQuestion(question.text)}
                        className="flex items-center space-x-2"
                      >
                        <Icon className="h-3 w-3" />
                        <span>{question.text}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type your question here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isTyping}
                  className="bg-gradient-primary"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift + Enter for new line
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AskDisha;