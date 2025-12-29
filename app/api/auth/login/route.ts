import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId, password } = await req.json();

    if (!userId || !password) {
      return NextResponse.json(
        { success: false, message: "missing credentials" },
        { status: 400 }
      );
    }

    const res = await fetch(process.env.GAS_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "login",
        userId,
        password,
        secret: process.env.GAS_SECRET_KEY,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { success: false, message: "server error" },
      { status: 500 }
    );
  }
}
