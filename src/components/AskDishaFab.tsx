import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import AskDisha from "@/pages/AskDisha";
import { MessageCircle } from "lucide-react";

const AskDishaFab = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setOpen(true)}
          className="h-12 w-12 rounded-full shadow-lg bg-gradient-primary p-0"
          aria-label="Open Ask Disha chatbot"
        >
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="p-0 w-[90vw] sm:w-[28rem] max-w-[100vw]">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle>Ask Disha 2.0</SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100vh-3.5rem)] overflow-hidden">
            <AskDisha />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AskDishaFab;


