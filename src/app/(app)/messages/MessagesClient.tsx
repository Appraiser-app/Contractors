"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

type OtherUser = { id: string; name: string; avatarUrl?: string | null; trade?: string | null; userRole: string } | null;
type Conversation = { id: string; participant1: string; participant2: string; lastMessageAt: string; other: OtherUser; lastMessage: { content: string; senderId: string } | null };
type Message = { id: string; senderId: string; content: string; isRead: boolean; createdAt: string };

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function MessagesClient({ currentUserId, currentUserName }: { currentUserId: string; currentUserName: string }) {
  const searchParams = useSearchParams();
  const initUserId = searchParams.get("userId");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function loadConversations() {
    const res = await fetch("/api/conversations");
    if (res.ok) { const d = await res.json(); setConversations(d.conversations); }
    setLoadingConvos(false);
  }

  async function openOrCreateConversation(userId: string) {
    const res = await fetch("/api/conversations", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otherUserId: userId }),
    });
    if (res.ok) {
      const d = await res.json();
      setActiveConvoId(d.conversation.id);
      await loadConversations();
    }
  }

  useEffect(() => {
    loadConversations().then(() => {
      if (initUserId) openOrCreateConversation(initUserId);
    });
  }, []);

  useEffect(() => {
    if (!activeConvoId) return;
    setLoadingMsgs(true);
    fetch(`/api/conversations/${activeConvoId}/messages`)
      .then(r => r.json())
      .then(d => { setMessages(d.messages || []); setLoadingMsgs(false); });
  }, [activeConvoId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !activeConvoId) return;
    setSending(true);
    const res = await fetch(`/api/conversations/${activeConvoId}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: newMsg }),
    });
    if (res.ok) {
      const d = await res.json();
      setMessages(prev => [...prev, d.message]);
      setNewMsg("");
      await loadConversations();
    }
    setSending(false);
  }

  const activeConvo = conversations.find(c => c.id === activeConvoId);

  return (
    <div className="flex h-[calc(100vh-56px)] lg:h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`w-full lg:w-80 bg-white border-l border-gray-100 flex flex-col flex-shrink-0 ${activeConvoId ? "hidden lg:flex" : "flex"}`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <div className="space-y-3 p-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <p>No conversations yet</p>
              <p className="mt-1">Find professionals in the Directory to start chatting</p>
            </div>
          ) : (
            conversations.map(convo => (
              <button
                key={convo.id}
                onClick={() => setActiveConvoId(convo.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-gray-50 text-right ${activeConvoId === convo.id ? "bg-green-50" : ""}`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">{convo.other?.name?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 text-sm">{convo.other?.name}</p>
                    <p className="text-[10px] text-gray-400">{timeAgo(convo.lastMessageAt)}</p>
                  </div>
                  {convo.lastMessage && (
                    <p className="text-xs text-gray-500 truncate">
                      {convo.lastMessage.senderId === currentUserId ? "You: " : ""}{convo.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat */}
      <div className={`flex-1 flex flex-col ${!activeConvoId ? "hidden lg:flex" : "flex"}`}>
        {!activeConvoId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
              <p className="font-medium text-gray-500">Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
              <button onClick={() => setActiveConvoId(null)} className="lg:hidden text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                <span className="text-white text-sm font-bold">{activeConvo?.other?.name?.charAt(0)}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{activeConvo?.other?.name}</p>
                {activeConvo?.other?.trade && <p className="text-xs text-gray-400">{activeConvo.other.trade}</p>}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">Say hello! 👋</div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.senderId === currentUserId ? "bg-green-600 text-white rounded-br-sm" : "bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-100 p-4">
              <form onSubmit={sendMessage} className="flex gap-3">
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-green-400"
                />
                <button type="submit" disabled={sending || !newMsg.trim()} className="w-10 h-10 bg-green-600 text-white rounded-2xl flex items-center justify-center hover:bg-green-700 disabled:opacity-50 flex-shrink-0">
                  <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
