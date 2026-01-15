
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Image as ImageIcon, MessageCircle, Repeat, Heart, BarChart2, X } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type HistoryItem = {
  id: number;
  question: string;
  answer: string;
  created_at: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Initial fetch (keep it simple, actual history fetch can be added back if needed, but prioritizing layout fix)
  useEffect(() => {
    fetch("/api/history")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Optional: load history? For now let's start fresh or load last conversation
          // setMessages([]) 
        }
      })
      .catch(console.error);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      image: selectedImage
    } as any; // Type hack for quick implementation, ideally update Message type

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => {
            const content: any = [];
            if ((m as any).image) {
              content.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: (m as any).image.split(';')[0].split(':')[1],
                  data: (m as any).image.split(',')[1]
                }
              });
            }
            if (m.content) {
              content.push({ type: "text", text: m.content });
            }
            return { role: m.role, content: content.length === 1 && content[0].type === 'text' ? content[0].text : content };
          })
        }),
      });

      if (!response.ok) throw new Error(response.statusText);

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === "assistant") lastMsg.content = accumulatedText;
          return newMessages;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error: Failed to get response." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex justify-center">

      {/* Main Container - Centered & Constrained Width */}
      <div className="w-full max-w-[600px] border-x border-[#2f3336] flex flex-col h-screen bg-black">

        {/* Header */}
        <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3 cursor-pointer">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white">Home</h1>
            <span className="text-xs text-gray-500">Claude's Timeline</span>
          </div>
        </header>

        {/* Timeline Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white">Welcome to Claude-X</h2>
              <p className="text-gray-500 max-w-sm">
                This is a centered, clean timeline. Start a conversation to see it flow.
              </p>
            </div>
          ) : (
            <div>
              {messages.map((msg, idx) => (
                <article key={idx} className="p-5 border-b border-[#2f3336] hover:bg-white/[0.03] transition-colors cursor-default grid grid-cols-[48px_1fr] gap-4">
                  {/* Avatar Column */}
                  <div className="shrink-0 pt-1">
                    {msg.role === "user" ? (
                      <div className="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center font-bold text-white text-lg">U</div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#1d9bf0] flex items-center justify-center font-bold text-white text-lg p-1">
                        AI
                      </div>
                    )}
                  </div>

                  {/* Content Column */}
                  <div className="min-w-0 pt-1">
                    {/* Header: Name, ID, Time */}
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="font-bold text-[16px] text-white tracking-wide">
                        {msg.role === "user" ? "User" : "Claude"}
                      </span>
                      <span className="text-[#71767b] text-[15px] truncate tracking-wide">
                        @{msg.role === "user" ? "user" : "assistant"} · 1m
                      </span>
                    </div>

                    {/* Message Body */}

                    <div className="text-[16px] leading-relaxed text-[#e7e9ea] whitespace-pre-wrap font-medium break-words tracking-wide">
                      {msg.content}
                      {(msg as any).image && (
                        <div className="mt-3">
                          <img src={(msg as any).image} alt="User upload" className="rounded-2xl border border-[#2f3336] max-h-[300px] w-auto object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </main>

        <div className="p-3 border-t border-[#2f3336] bg-black">
          <form onSubmit={handleSubmit} className="flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full bg-slate-600 hidden sm:flex items-center justify-center font-bold text-white shrink-0">U</div>
            <div className="flex-1 relative bg-[#202327] rounded-2xl focus-within:ring-1 focus-within:ring-[#1d9bf0] border border-transparent focus-within:bg-black focus-within:border-[#1d9bf0]">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && (input.trim() || selectedImage)) handleSubmit(e);
                  }
                }}
                className="w-full bg-transparent text-white placeholder-[#71767b] outline-none py-3 px-3 resize-none min-h-[56px] text-[19px] font-bold"
                placeholder="Post your reply"
                rows={1}
                disabled={loading}
                style={{ fieldSizing: "content" } as any}
              />
              {selectedImage && (
                <div className="px-3 pb-2">
                  <div className="relative inline-block mt-2">
                    <img src={selectedImage} alt="Preview" className="h-12 w-12 object-cover rounded-xl border border-[#2f3336]" />
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 border border-[#2f3336] hover:bg-gray-800 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-[#2f3336] mx-3 py-2">
                <div className="flex gap-2 text-[#1d9bf0]">
                  <label className="cursor-pointer p-1.5 hover:bg-[#1d9bf0]/10 rounded-full transition-colors relative">
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                    <ImageIcon className="w-5 h-5" />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={loading || (!input.trim() && !selectedImage)}
                  className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold px-4 py-1.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  Reply
                </button>
              </div>
            </div>
          </form>
        </div>

      </div >
    </div >
  );
}
