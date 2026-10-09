import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { Send, User as UserIcon, Shield, Image as ImageIcon, X } from "lucide-react";

interface ChatWidgetProps {
  claimId: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ claimId }) => {
  const { user } = useApp();
  const [thread, setThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchChat = async () => {
    try {
      const res = await fetch(`/api/claims/${claimId}/chat`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setThread(data);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChat();
    // In a real app we'd use websockets or polling here.
    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [claimId, user?.token]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageUrl) || !thread) return;
    
    const body = newMessage.trim();
    const currentImageUrl = imageUrl;
    
    setNewMessage(""); // optimistic clear
    setImageUrl("");

    try {
      const res = await fetch(`/api/chats/${thread.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify({ body, imageUrl: currentImageUrl || undefined })
      });
      if (res.ok) {
        fetchChat();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !thread) return <div className="text-center py-4 text-xs text-stone-500">Loading secure chat...</div>;
  if (!thread) return <div className="text-center py-4 text-xs text-stone-500">Chat not available.</div>;

  return (
    <div className="flex flex-col h-full bg-stone-50 border border-stone-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-900">Encrypted Chat</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
          {thread.status}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-stone-500 my-10">
            Chat opened. You can now securely message the other party. LGU staff may monitor this chat.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-center space-x-1.5 mb-1">
                  {msg.isStaff ? (
                    <Shield className="w-3 h-3 text-indigo-600" />
                  ) : (
                    <UserIcon className="w-3 h-3 text-stone-400" />
                  )}
                  <span className={`text-[10px] font-bold ${msg.isStaff ? 'text-indigo-600' : 'text-stone-500'}`}>
                    {msg.sender.fullName} {msg.isStaff ? "(LGU Staff)" : ""}
                  </span>
                </div>
                <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${
                  isMe 
                    ? "bg-emerald-800 text-white rounded-tr-none" 
                    : msg.isStaff
                      ? "bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-tl-none"
                      : "bg-white border border-stone-200 text-stone-800 rounded-tl-none"
                }`}>
                  {msg.imageUrl && (
                    <img 
                      src={msg.imageUrl} 
                      alt="Chat attachment" 
                      className="max-w-full rounded-lg mb-2 border border-black/10" 
                      style={{ maxHeight: "200px", objectFit: "contain" }}
                    />
                  )}
                  {msg.body && <span>{msg.body}</span>}
                </div>
                <span className="text-[9px] text-stone-400 mt-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      {thread.status === "open" ? (
        <div className="bg-white border-t border-stone-200 flex flex-col">
          {imageUrl && (
            <div className="px-3 pt-3 pb-1 flex items-start space-x-2">
              <div className="relative">
                <img src={imageUrl} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-stone-200 shadow-sm" />
                <button 
                  type="button" 
                  onClick={() => setImageUrl("")} 
                  className="absolute -top-1.5 -right-1.5 bg-stone-800 text-white rounded-full p-0.5 shadow-md hover:bg-stone-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
          <form onSubmit={sendMessage} className="p-3 flex items-center space-x-2">
            <label
              className="p-2 text-stone-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
              title="Attach Image"
            >
              <ImageIcon className="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImageUrl(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                  // Reset input value so the same file can be selected again
                  e.target.value = '';
                }}
              />
            </label>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={imageUrl ? "Add a caption..." : "Type a message..."}
              className="flex-1 px-3 py-2 bg-stone-100 border border-stone-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() && !imageUrl}
              className="p-2 bg-emerald-800 text-white rounded-lg hover:bg-emerald-900 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-stone-100 border-t border-stone-200 p-3 text-center text-xs text-stone-500">
          This chat thread is closed.
        </div>
      )}
    </div>
  );
};
