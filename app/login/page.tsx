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

    /* ===== 🔍 4번 문제 확인용 디버그 ===== */
    console.log("DEBUG ENV CHECK", {
      NEXT_PUBLIC_GAS_URL: process.env.NEXT_PUBLIC_GAS_URL,
      NEXT_PUBLIC_GAS_SECRET_KEY: process.env.NEXT_PUBLIC_GAS_SECRET_KEY,
    });

    if (!process.env.NEXT_PUBLIC_GAS_URL) {
      alert("❌ NEXT_PUBLIC_GAS_URL 이 브라우저에서 undefined 입니다");
      return;
    }

    if (!process.env.NEXT_PUBLIC_GAS_SECRET_KEY) {
      alert("❌ NEXT_PUBLIC_GAS_SECRET_KEY 이 브라우저에서 undefined 입니다");
      return;
    }
    /* =================================== */

    if (!userId || !password) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          userId,
          password,
          secret: process.env.NEXT_PUBLIC_GAS_SECRET_KEY,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error("GAS 응답이 JSON이 아닙니다");
      }

      console.log("LOGIN RESPONSE", data);

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
    } catch (err: any) {
      console.error("LOGIN ERROR", err);
      setError(err?.message || "로그인 중 오류 발생");
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
