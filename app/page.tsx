"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Chat = { role: string; message: string };

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [input, setInput] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(u));
    loadChats(JSON.parse(u).userId);
  }, []);

  async function loadChats(userId: string) {
    const res = await fetch(process.env.NEXT_PUBLIC_GAS_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "loadChat",
        userId,
        secret: process.env.NEXT_PUBLIC_GAS_SECRET_KEY
      })
    });
    const data = await res.json();
    if (data.success) setChats(data.chats);
  }

  async function send() {
    setError("");
    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setChats(prev => [
      ...prev,
      { role: "user", message: input },
      { role: "assistant", message: data.reply }
    ]);
    setRemaining(data.remaining);
    setInput("");
  }

  return (
    <div>
      <h3>3D Manual AI</h3>
      {remaining !== null && <p>남은 질문 수: {remaining}</p>}
      {chats.map((c, i) => (
        <p key={i}>
          <b>{c.role}:</b> {c.message}
        </p>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={send}>Send</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
