import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Sparkles, X, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import "./VoiceAssistant.css";

interface ParsedBookingData {
  fromStation?: string;
  toStation?: string;
  fromCode?: string;
  toCode?: string;
  date?: string;
  passengers?: Array<{ name: string; age: string; gender: string }>;
  trainName?: string;
  class?: string;
  error?: string;
}

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedBookingData | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const isProcessingRef = useRef(false);
  const navigate = useNavigate();

  // Process voice through AI
  const handleProcessVoice = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setIsProcessing(true);
    setStatusMessage("🤖 AI is analyzing your request...");

    try {
      const response = await fetch("http://localhost:5001/api/ai/parse-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data: ParsedBookingData = await response.json();

      if (data.error) {
        const errMsg = data.error || "Unknown error";
        toast.error("AI Error: " + errMsg);
        setStatusMessage("❌ " + errMsg);
        setParsedData(null);
      } else {
        setParsedData(data);
        setStatusMessage("✅ Details captured! Filling form...");

        // Speak confirmation
        speakConfirmation(data);

        // Auto-fill after short delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("ai-booking-data", { detail: data }));

          if (window.location.pathname !== "/book-tickets") {
            navigate("/book-tickets");
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent("ai-booking-data", { detail: data }));
            }, 500);
          }

          toast.success("Booking form auto-filled with your voice request!");

          // Close panel after a moment
          setTimeout(() => {
            setIsOpen(false);
            setParsedData(null);
            setTranscript("");
            setInterimTranscript("");
            setStatusMessage("");
          }, 3000);
        }, 1500);
      }
    } catch (error) {
      console.error("AI Error:", error);
      toast.error("Failed to connect to AI server. Make sure the backend is running on port 5001.");
      setStatusMessage("❌ Connection failed");
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }, [navigate]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition API not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;   // Stop after user pauses speaking
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      if (final) {
        transcriptRef.current = final.trim();
        setTranscript(final.trim());
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "aborted") {
        toast.error("Microphone error: " + event.error);
      }
      setIsListening(false);
    };

    // Auto-process when recognition ends (user stopped speaking)
    recognition.onend = () => {
      setIsListening(false);
      const finalText = transcriptRef.current;
      if (finalText && !isProcessingRef.current) {
        // Auto-send to AI immediately after speech ends
        handleProcessVoice(finalText);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [handleProcessVoice]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in your browser. Try Chrome.");
      return;
    }
    transcriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setParsedData(null);
    setStatusMessage("🎙️ Listening... Speak your booking request");
    setIsOpen(true);
    isProcessingRef.current = false;

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    // onend handler will auto-trigger processing
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    const handleToggle = () => toggleListening();
    window.addEventListener("toggle-voice-assistant", handleToggle);
    return () => window.removeEventListener("toggle-voice-assistant", handleToggle);
  }, [toggleListening]);

  const speakConfirmation = (data: ParsedBookingData) => {
    if (!("speechSynthesis" in window)) return;
    const parts: string[] = [];
    if (data.fromStation) parts.push(`from ${data.fromStation}`);
    if (data.toStation) parts.push(`to ${data.toStation}`);
    if (data.date) parts.push(`on ${new Date(data.date).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}`);
    if (data.passengers && data.passengers.length > 0) {
      parts.push(`for ${data.passengers.length} passenger${data.passengers.length > 1 ? "s" : ""}`);
    }

    if (parts.length > 0) {
      const utterance = new SpeechSynthesisUtterance(`Booking ${parts.join(", ")}. Filling the form now.`);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.lang = "en-IN";
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      {/* Voice Assistant Panel */}
      <div className={`voice-panel ${isOpen ? "voice-panel--open" : ""}`}>
        <div className="voice-panel__inner">
          {/* Header */}
          <div className="voice-panel__header">
            <div className="voice-panel__title">
              <Sparkles className="h-4 w-4 voice-sparkle" />
              <span>AI Voice Booking</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => {
                setIsOpen(false);
                stopListening();
                setParsedData(null);
                setTranscript("");
                setInterimTranscript("");
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Status */}
          <div className="voice-panel__status">
            <p className="text-xs font-medium">{statusMessage}</p>
          </div>

          {/* Waveform */}
          {isListening && (
            <div className="voice-panel__waveform">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="voice-bar"
                  style={{ animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
          )}

          {/* Processing Spinner */}
          {isProcessing && (
            <div className="voice-panel__processing">
              <div className="voice-panel__spinner">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Analyzing with Gemini AI...</p>
            </div>
          )}

          {/* Transcript */}
          {(transcript || interimTranscript) && (
            <div className="voice-panel__transcript">
              <p className="text-xs text-muted-foreground mb-1">You said:</p>
              <p className="text-sm font-medium">
                {transcript}
                {interimTranscript && (
                  <span className="text-muted-foreground italic"> {interimTranscript}</span>
                )}
              </p>
            </div>
          )}

          {/* Parsed Preview */}
          {parsedData && !parsedData.error && (
            <div className="voice-panel__parsed">
              <p className="text-xs text-muted-foreground mb-2 font-semibold">Extracted Details:</p>
              <div className="voice-panel__parsed-grid">
                {parsedData.fromStation && (
                  <div className="voice-tag">
                    <span className="voice-tag__label">From</span>
                    <span className="voice-tag__value">{parsedData.fromStation} {parsedData.fromCode ? `(${parsedData.fromCode})` : ""}</span>
                  </div>
                )}
                {parsedData.toStation && (
                  <div className="voice-tag">
                    <span className="voice-tag__label">To</span>
                    <span className="voice-tag__value">{parsedData.toStation} {parsedData.toCode ? `(${parsedData.toCode})` : ""}</span>
                  </div>
                )}
                {parsedData.date && (
                  <div className="voice-tag">
                    <span className="voice-tag__label">Date</span>
                    <span className="voice-tag__value">{parsedData.date}</span>
                  </div>
                )}
                {parsedData.passengers && parsedData.passengers.length > 0 && (
                  <div className="voice-tag">
                    <span className="voice-tag__label">Passengers</span>
                    <span className="voice-tag__value">
                      {parsedData.passengers.map((p) => p.name || "Unnamed").join(", ")}
                    </span>
                  </div>
                )}
                {parsedData.class && (
                  <div className="voice-tag">
                    <span className="voice-tag__label">Class</span>
                    <span className="voice-tag__value">{parsedData.class}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hint — only when idle with no transcript */}
          {!isListening && !isProcessing && !parsedData && !transcript && (
            <div className="voice-panel__hint">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium mb-1">Try saying:</p>
                <p className="text-[11px] text-muted-foreground italic">
                  "Book a ticket from New Delhi to Mumbai for tomorrow, passenger name Rahul age 25 male"
                </p>
              </div>
            </div>
          )}

          {/* Manual retry button — only if processing failed */}
          {transcript && !isListening && !isProcessing && !parsedData && (
            <Button
              onClick={() => handleProcessVoice(transcript)}
              className="w-full bg-gradient-primary text-sm h-9 mt-2"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Retry with AI
            </Button>
          )}
        </div>
      </div>

    </>
  );
};

export default VoiceAssistant;
