import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ChatSidebar({ designMetadata, validationResult }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [designMetadata, validationResult]);

  async function handleSend() {
    const message = input.trim();
    if (!message || !validationResult || !designMetadata || isSending) {
      return;
    }

    const previousMessages = messages;
    const nextHistory = [...previousMessages, { role: "user", content: message }];
    setMessages(nextHistory);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          design_metadata: designMetadata,
          validation_result: validationResult,
          conversation_history: previousMessages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "AI chat is unavailable right now.");
      }

      setMessages(data.conversation_history || nextHistory);
    } catch (error) {
      setMessages(previousMessages);
      toast.error(error.message || "AI chat is unavailable right now.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="flex min-h-[420px] flex-col rounded-3xl border border-[#4f8ef7]/20 bg-[#1a1d27] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-[#4f8ef7]">Engineer Chat</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Ask CAD-IQ</h2>
        </div>
        <span className="rounded-full border border-[#4f8ef7]/30 bg-[#4f8ef7]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
          {messages.filter((message) => message.role === "model").length} replies
        </span>
      </div>

      <div className="mt-5 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[#4f8ef7]/15 bg-[#0f1117] p-4">
        {!validationResult ? (
          <div className="rounded-2xl bg-[#1a1d27] p-4 text-sm leading-6 text-[#9ca3af]">
            Upload and validate a design first. Once results are available, you can ask follow-up engineering questions here.
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl bg-[#1a1d27] p-4 text-sm leading-6 text-[#9ca3af]">
            Ask about the biggest risk, required geometry changes, or how to improve the compliance score.
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user" ? "bg-[#4f8ef7] text-white" : "bg-[#1a1d27] text-white"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {isSending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-[#1a1d27] px-4 py-3 text-sm text-[#9ca3af]">Thinking...</div>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex gap-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder={validationResult ? "Ask a question about this design..." : "Validate a design to enable chat"}
          disabled={!validationResult || isSending}
          className="flex-1 rounded-2xl border border-[#4f8ef7]/20 bg-[#0f1117] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#9ca3af] focus:border-[#4f8ef7]"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!validationResult || isSending || !input.trim()}
          className="rounded-2xl bg-[#4f8ef7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6aa0f8] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-[#9ca3af]"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </section>
  );
}
