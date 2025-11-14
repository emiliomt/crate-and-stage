import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Music, Send, Sparkles, User, Star } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: Date;
  recommendations?: Array<{
    albumTitle: string;
    artist: string;
    cover: string;
    matchPercentage: number;
    genres: string[];
    reasoning: string;
  }>;
}

export default function Discover() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      content:
        "Hey there! 👋 I'm your AI music discovery assistant. I analyze what millions of music lovers with similar tastes enjoy and recommend albums you'll love.\n\nTell me about your music preferences, or try one of these:",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const quickActions = [
    "🎸 I love indie rock",
    "🎹 Show me jazz recommendations",
    "🎤 Help me discover new artists",
    "📝 Create a playlist for me",
  ];

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputMessage;
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke("music-chat", {
        body: {
          messages: [
            ...messages.map((m) => ({
              role: m.sender === "ai" ? "assistant" : "user",
              content: m.content,
            })),
            { role: "user", content: text },
          ],
        },
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        content: data.content,
        timestamp: new Date(),
        recommendations: data.recommendations,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => navigate("/")}
              >
                <Music className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">Musicboard</span>
              </div>

              <nav className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => navigate("/lists")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Lists
                </button>
                <button
                  onClick={() => navigate("/boards")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Boards
                </button>
                <button className="text-foreground font-medium border-b-2 border-primary pb-1">
                  Discover
                </button>
                <button
                  onClick={() => navigate("/reviews")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reviews
                </button>
                <button
                  onClick={() => navigate("/albums")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Albums
                </button>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/feed")}
                className="hidden md:block text-muted-foreground hover:text-foreground transition-colors"
              >
                Feed
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-purple-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              AI Music Discovery
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Chat with AI to find your next favorite album
          </p>
        </div>

        {/* Chat Messages */}
        <div className="bg-card rounded-lg border border-border shadow-soft mb-4 p-6 min-h-[500px] max-h-[600px] overflow-y-auto">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.sender === "user" ? "justify-end" : ""
                }`}
              >
                {message.sender === "ai" && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="text-white" size={20} />
                  </div>
                )}

                <div
                  className={`flex-1 ${
                    message.sender === "user" ? "flex flex-col items-end" : ""
                  }`}
                >
                  <div
                    className={`rounded-2xl p-4 max-w-2xl ${
                      message.sender === "ai"
                        ? "bg-secondary rounded-tl-none"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {/* Quick action buttons for initial message */}
                    {message.id === "1" && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {quickActions.map((action) => (
                          <Button
                            key={action}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendMessage(action)}
                            className="text-sm"
                          >
                            {action}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Recommendation Cards */}
                    {message.recommendations &&
                      message.recommendations.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          {message.recommendations.map((rec, idx) => (
                            <Card
                              key={idx}
                              className="p-3 hover:bg-accent transition-all cursor-pointer"
                            >
                              <div className="w-full aspect-square bg-gradient-to-br from-muted to-muted/50 rounded mb-2 flex items-center justify-center text-3xl">
                                {rec.cover}
                              </div>
                              <h4 className="font-semibold text-sm mb-1 truncate">
                                {rec.albumTitle}
                              </h4>
                              <p className="text-xs text-muted-foreground truncate">
                                {rec.artist}
                              </p>
                              <div className="flex items-center gap-1 mt-2">
                                <Star
                                  className="text-yellow-500"
                                  size={12}
                                  fill="currentColor"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {rec.matchPercentage}% match
                                </span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                  </div>
                  <span
                    className={`text-xs text-muted-foreground mt-1 ${
                      message.sender === "user" ? "mr-2" : "ml-2"
                    }`}
                  >
                    Just now
                  </span>
                </div>

                {message.sender === "user" && (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <User className="text-muted-foreground" size={20} />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Sparkles className="text-white" size={20} />
                </div>
                <div className="bg-secondary rounded-2xl rounded-tl-none p-4">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-soft">
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Tell me what music you like..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
              disabled={isTyping}
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isTyping || !inputMessage.trim()}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
