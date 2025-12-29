import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId required" },
        { status: 400 }
      );
    }

    const res = await fetch(process.env.GAS_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "loadChat",
        userId,
        secret: process.env.GAS_SECRET_KEY,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { success: false, message: "server error" },
      { status: 500 }
    );
  }
}
