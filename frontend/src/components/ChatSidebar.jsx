import { useEffect, useState } from "react";

export default function ChatSidebar({ designMetadata, validationResult }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMessages([]);
    setError("");
    setInput("");
  }, [designMetadata, validationResult]);

  async function handleSend() {
    const message = input.trim();
    if (!message || !validationResult || !designMetadata || isSending) {
      return;
    }

    const nextHistory = [...messages, { role: "user", content: message }];
    setMessages(nextHistory);
    setInput("");
    setIsSending(true);
    setError("");

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
          conversation_history: messages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Chat request failed");
      }

      setMessages(data.conversation_history || nextHistory);
    } catch (requestError) {
      setMessages(messages);
      setError(requestError.message || "Unable to send chat message.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="flex min-h-[420px] flex-col rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200">Engineer Chat</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Ask CAD-IQ</h2>
        </div>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
          {messages.filter((message) => message.role === "model").length} replies
        </span>
      </div>

      <div className="mt-5 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-[#111722] p-4">
        {!validationResult ? (
          <div className="rounded-2xl bg-white/5 p-4 text-sm leading-6 text-slate-400">
            Upload and validate a design first. Once results are available, you can ask follow-up engineering questions here.
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl bg-white/5 p-4 text-sm leading-6 text-slate-400">
            Ask about the biggest risk, required geometry changes, or how to improve the compliance score.
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-[#1c2330] text-slate-200"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
      </div>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

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
          className="flex-1 rounded-2xl border border-white/10 bg-[#111722] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!validationResult || isSending || !input.trim()}
          className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </section>
  );
}
