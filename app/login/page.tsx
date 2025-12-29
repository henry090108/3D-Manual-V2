"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    setError("");

    if (!userId || !password) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data?.message || "로그인 실패");
        return;
      }

      // ✅ 로그인 성공
      localStorage.setItem(
        "user",
        JSON.stringify({
          userId,
          role: data.role,
        })
      );

      router.push("/");
    } catch (err) {
      setError("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto" }}>
      <h2>로그인</h2>

      <input
        placeholder="ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{ width: "100%", marginBottom: 8, padding: 8 }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", marginBottom: 12, padding: 8 }}
      />

      <button
        onClick={login}
        disabled={loading}
        style={{
          width: "100%",
          padding: 10,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "로그인 중..." : "Login"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: 12 }}>
          {error}
        </p>
      )}
    </div>
  );
}
