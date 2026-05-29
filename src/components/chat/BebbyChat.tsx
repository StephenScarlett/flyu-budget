"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Sparkles, RotateCcw, X, Check, AlertCircle, MessageSquare, Trash2, ChevronLeft, Plus } from "lucide-react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import type { Chat, ChatMessage } from "../../lib/supabase/types";

interface BebbyChatProps {
  open: boolean;
  onClose: () => void;
  chats: Chat[];
  activeChat: Chat | null;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  createChat: () => Promise<Chat | null>;
  updateChat: (chatId: string, updates: { title?: string; messages?: ChatMessage[] }) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
}

type Message = ChatMessage;

const GREETINGS = [
  "*flicks tail* Ugh, fine. I'm Bebby. What do you want to know about the Orlando trip? Make it good.",
  "Oh, you again. I guess I'll help you with this trip thing. What's the question?",
  "*yawns dramatically* Bebby here. I know everything about this trip, probably more than you. Ask away.",
];

const SUGGESTIONS = [
  "What's the price difference between tiers?",
  "Break down the budget tier for me",
  "What's included in the premium tier?",
  "How much should I save per month?",
  "Give me some money-saving tips",
  "Tell me about the itinerary",
];

function BebbyAvatar() {
  return (
    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
      <Image
        src="/bebby.png"
        alt="Bebby"
        width={56}
        height={56}
        className="w-full h-full object-cover object-[50%_15%] scale-[2.2]"
      />
    </div>
  );
}

export default function BebbyChat({
  open,
  onClose,
  chats,
  activeChat,
  activeChatId,
  setActiveChatId,
  createChat,
  updateChat,
  deleteChat,
}: BebbyChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync messages from active chat
  useEffect(() => {
    if (activeChat) {
      setMessages(activeChat.messages);
      setShowHistory(false);
    } else {
      setMessages([]);
    }
  }, [activeChatId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Lock body scroll when chat is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const saveMessages = useCallback(
    async (chatId: string, msgs: Message[], isFirst: boolean) => {
      const title = isFirst && msgs.length > 0
        ? msgs[0].content.slice(0, 60) + (msgs[0].content.length > 60 ? "..." : "")
        : undefined;
      await updateChat(chatId, { messages: msgs, ...(title ? { title } : {}) });
    },
    [updateChat]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      // Auto-create a chat if none active
      let chatId = activeChatId;
      if (!chatId) {
        const chat = await createChat();
        if (!chat) return;
        chatId = chat.id;
      }

      const userMsg: Message = { role: "user", content: trimmed };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setLoading(true);

      // Save user message immediately
      const isFirst = messages.length === 0;
      await saveMessages(chatId, newMessages, isFirst);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages.map((m) => ({ role: m.role, content: m.content })) }),
        });

        const data = await res.json();
        let assistantMsg: Message;
        if (data.error) {
          assistantMsg = { role: "assistant", content: `Hiss! Something went wrong: ${data.error}` };
        } else {
          assistantMsg = {
            role: "assistant",
            content: data.reply,
            action: data.action ?? null,
            actionStatus: data.action ? "pending" : undefined,
          };
        }
        const finalMessages = [...newMessages, assistantMsg];
        setMessages(finalMessages);
        await saveMessages(chatId, finalMessages, false);
      } catch {
        const errMsg: Message = { role: "assistant", content: "*knocks glass off table* Oops, couldn't reach the server. Try again?" };
        const finalMessages = [...newMessages, errMsg];
        setMessages(finalMessages);
        await saveMessages(chatId, finalMessages, false);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [messages, loading, activeChatId, createChat, saveMessages]
  );

  const handleAction = useCallback(
    async (msgIndex: number, confirmed: boolean) => {
      const updated = [...messages];
      updated[msgIndex] = { ...updated[msgIndex], actionStatus: confirmed ? "confirmed" : "cancelled" };
      setMessages(updated);

      if (activeChatId) {
        await saveMessages(activeChatId, updated, false);
      }

      if (!confirmed) return;

      const action = messages[msgIndex]?.action;
      if (!action) return;

      try {
        const res = await fetch("/api/chat/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });

        const data = await res.json();
        if (data.error) {
          const errUpdated = [...updated];
          errUpdated[msgIndex] = { ...errUpdated[msgIndex], actionStatus: "error" };
          setMessages(errUpdated);
          if (activeChatId) await saveMessages(activeChatId, errUpdated, false);
        }
      } catch {
        const errUpdated = [...updated];
        errUpdated[msgIndex] = { ...errUpdated[msgIndex], actionStatus: "error" };
        setMessages(errUpdated);
        if (activeChatId) await saveMessages(activeChatId, errUpdated, false);
      }
    },
    [messages, activeChatId, saveMessages]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleNewChat = async () => {
    setActiveChatId(null);
    setMessages([]);
    setShowHistory(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40 animate-backdrop" onClick={onClose} />

      {/* Chat Panel — fixed right side */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#111] border-l border-gray-800 z-50 flex flex-col shadow-2xl animate-slide-right">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between flex-shrink-0 bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full overflow-hidden">
                <Image
                  src="/bebby.png"
                  alt="Bebby"
                  width={72}
                  height={72}
                  className="w-full h-full object-cover object-[50%_15%] scale-[2.2]"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0a] rounded-full" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm flex items-center gap-1.5">
                Bebby
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-xs text-gray-500">FLYU Trip Assistant &bull; GPT-4o</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-1.5 rounded hover:bg-[#222] transition-colors ${showHistory ? "text-sky-400" : "text-gray-500 hover:text-gray-300"}`}
              title="Chat history"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={handleNewChat}
              className="p-1.5 rounded hover:bg-[#222] text-gray-500 hover:text-gray-300 transition-colors"
              title="New chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#222] text-gray-500 hover:text-gray-300 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="border-b border-gray-800 bg-[#0d0d0d] max-h-[40%] overflow-y-auto animate-fade-down">
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Saved Chats</span>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1 rounded hover:bg-[#222] text-gray-600 hover:text-gray-400"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
            {chats.length === 0 ? (
              <div className="px-4 py-4 text-xs text-gray-600 text-center">No saved chats yet</div>
            ) : (
              <div className="pb-1">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer group transition-colors ${
                      chat.id === activeChatId ? "bg-sky-950/40 border-l-2 border-sky-500" : "hover:bg-[#161616] border-l-2 border-transparent"
                    }`}
                  >
                    <button
                      onClick={() => { setActiveChatId(chat.id); setShowHistory(false); }}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="text-sm text-gray-300 truncate">{chat.title}</p>
                      <p className="text-xs text-gray-600">
                        {chat.messages.length} messages &bull; {new Date(chat.updated_at).toLocaleDateString()}
                      </p>
                    </button>
                    {confirmDeleteId === chat.id ? (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => { deleteChat(chat.id); setConfirmDeleteId(null); }}
                          className="px-1.5 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-500"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-0.5 text-xs bg-[#222] text-gray-400 rounded hover:bg-[#333]"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(chat.id)}
                        className="p-1 rounded hover:bg-[#222] text-gray-700 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {/* Greeting */}
          <div className="flex gap-3 animate-fade-up">
            <BebbyAvatar />
            <div className="bg-[#1a1a1a] rounded-xl rounded-tl-sm px-4 py-3 max-w-[85%]">
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{greeting}</p>
            </div>
          </div>

          {/* Suggestion chips */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 pl-10 animate-fade-up" style={{ animationDelay: '150ms' }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="px-3 py-1.5 rounded-full text-xs bg-[#1a1a1a] text-sky-400 hover:bg-[#222] hover:text-sky-300 border border-gray-800 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 animate-fade-up ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && <BebbyAvatar />}
              <div className="max-w-[85%] space-y-2">
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-sky-600 text-white rounded-tr-sm"
                      : "bg-[#1a1a1a] text-gray-300 rounded-tl-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-gray-200 prose-strong:text-gray-200 prose-a:text-sky-400 prose-a:no-underline hover:prose-a:underline prose-code:text-sky-300 prose-code:bg-[#111] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>

                {/* Action confirmation card */}
                {msg.action && msg.actionStatus === "pending" && (
                  <div className="bg-sky-950/60 border border-sky-800/50 rounded-xl px-4 py-3">
                    <p className="text-xs text-sky-300 font-medium mb-2">
                      Proposed change: {msg.action.description}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(i, true)}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-500 transition-colors inline-flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Confirm
                      </button>
                      <button
                        onClick={() => handleAction(i, false)}
                        className="px-3 py-1.5 bg-[#222] text-gray-400 text-xs rounded-lg hover:bg-[#333] transition-colors inline-flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                )}

                {msg.action && msg.actionStatus === "confirmed" && (
                  <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl px-4 py-2 text-xs text-emerald-400 inline-flex items-center gap-1.5">
                    <Check className="w-3 h-3" /> Done! Change applied.
                  </div>
                )}

                {msg.action && msg.actionStatus === "cancelled" && (
                  <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-500">
                    Change cancelled.
                  </div>
                )}

                {msg.action && msg.actionStatus === "error" && (
                  <div className="bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-2 text-xs text-red-400 inline-flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3" /> Failed to apply change.
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex gap-3 animate-fade-up">
              <BebbyAvatar />
              <div className="bg-[#1a1a1a] rounded-xl rounded-tl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-gray-800 flex-shrink-0 bg-[#0a0a0a]">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Bebby anything about the trip..."
              disabled={loading}
              className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
