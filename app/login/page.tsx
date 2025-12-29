"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function login() {
    setError("");

    const res = await fetch(process.env.NEXT_PUBLIC_GAS_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "login",
        userId,
        password,
        secret: process.env.NEXT_PUBLIC_GAS_SECRET_KEY
      })
    });

    const data = await res.json();

    if (!data.success) {
      setError(data.message);
      return;
    }

    localStorage.setItem(
      "user",
      JSON.stringify({ userId, role: data.role })
    );

    router.push("/");
  }

  return (
    <div style={{ maxWidth: 400, margin: "80px auto" }}>
      <h2>로그인</h2>
      <input placeholder="ID" onChange={e => setUserId(e.target.value)} />
      <input
        type="password"
        placeholder="Password"
        onChange={e => setPassword(e.target.value)}
      />
      <button onClick={login}>Login</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
