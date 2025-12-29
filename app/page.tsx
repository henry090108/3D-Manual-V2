"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Msg = { role: "user" | "assistant"; text: string };

export default function Page() {
  const router = useRouter();

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "안녕하세요! 3D 매뉴얼 기반으로만 답변해요. 무엇을 도와드릴까요?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement | null>(null);

  /**
   * 스크롤 자동 이동 (기존 유지)
   */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /**
   * 로그인 여부 확인 + 이전 대화 로드
   */
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      router.push("/login");
      return;
    }

    const { userId } = JSON.parse(raw);
    loadPreviousChats(userId);
  }, []);

  /**
   * 이전 대화 불러오기 (GAS)
   */
  async function loadPreviousChats(userId: string) {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_GAS_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "loadChat",
          userId,
          secret: process.env.NEXT_PUBLIC_GAS_SECRET_KEY,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.chats)) {
        setMessages((prev) => [
          prev[0], // 초기 안내 메시지 유지
          ...data.chats.map((c: any) => ({
            role: c.role,
            text: c.message,
          })),
        ]);
      }
    } catch {
      // 이전 대화 로드 실패는 치명적이지 않으므로 무시
    }
  }

  /**
   * 질문 전송
   */
  async function send() {
    const q = input.trim();
    if (!q || loading) return;

    setInput("");
    setError(null);

    const raw = localStorage.getItem("user");
    if (!raw) {
      router.push("/login");
      return;
    }

    const { userId } = JSON.parse(raw);

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "API error");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data?.answer ?? "(응답이 비어 있습니다)",
        },
      ]);

      if (typeof data.remaining === "number") {
        setRemaining(data.remaining);
      }
    } catch (e: any) {
      setError(e?.message || String(e));
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `오류: ${e?.message || e}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>3D Manual Chat</h1>
        <p style={{ opacity: 0.75, marginTop: 6 }}>
          매뉴얼 내용으로만 답변합니다.
        </p>
        {remaining !== null && (
          <p style={{ marginTop: 6, fontSize: 14 }}>
            남은 질문 수:{" "}
            <b>{remaining === -1 ? "무제한" : remaining}</b>
          </p>
        )}
        {error && (
          <p style={{ color: "red", marginTop: 6 }}>
            {error}
          </p>
        )}
      </header>

      {/* ===== 채팅 영역 (기존 UI 유지) ===== */}
      <section
        style={{
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 12,
          padding: 12,
          height: "65vh",
          overflow: "auto",
          background: "white",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              margin: "10px 0",
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "10px 12px",
                borderRadius: 12,
                whiteSpace: "pre-wrap",
                border: "1px solid rgba(0,0,0,0.10)",
                background:
                  m.role === "user" ? "rgba(0,0,0,0.04)" : "white",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ opacity: 0.6, padding: "6px 2px" }}>
            답변 생성 중…
          </div>
        )}
        <div ref={endRef} />
      </section>

      {/* ===== 입력 영역 ===== */}
      <footer style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="질문을 입력하고 Enter"
          style={{
            flex: 1,
            padding: "12px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.2)",
            outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.2)",
            background: loading ? "rgba(0,0,0,0.06)" : "white",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          보내기
        </button>
      </footer>
    </main>
  );
}
