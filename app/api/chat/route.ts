import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { NextResponse } from "next/server";

/**
 * ===== 설정값 =====
 */
const TOP_K = 5;
const EMBEDDING_MODEL = "text-embedding-3-small";
const CHAT_MODEL = "gpt-4.1-mini";

const GAS_URL = process.env.GAS_URL!;
const GAS_SECRET = process.env.GAS_SECRET_KEY!;

/**
 * OpenAI 클라이언트
 */
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * 코사인 유사도
 */
function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * POST /api/chat
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, userId } = body;

    if (!question || !userId) {
      return NextResponse.json(
        { error: "question and userId are required" },
        { status: 400 }
      );
    }

    /**
     * ===== 1️⃣ 계정 상태 / 사용량 확인 =====
     */
    const checkRes = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "checkUser",
        userId,
        secret: GAS_SECRET,
      }),
    });

    const check = await checkRes.json();

    if (!check.success) {
      return NextResponse.json(
        { error: check.message },
        { status: 403 }
      );
    }

    /**
     * ===== 2️⃣ 질문 임베딩 =====
     */
    const queryEmbeddingRes = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: question,
    });

    const queryEmbedding = queryEmbeddingRes.data[0].embedding;

    /**
     * ===== 3️⃣ embeddings.json 로드 =====
     */
    const dataPath = path.join(
      process.cwd(),
      "data",
      "embeddings.json"
    );

    const raw = fs.readFileSync(dataPath, "utf-8");
    const documents = JSON.parse(raw);

    /**
     * ===== 4️⃣ 유사도 계산 =====
     */
    const scored = documents.map((doc: any) => ({
      ...doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    scored.sort((a: any, b: any) => b.score - a.score);
    const topDocs = scored.slice(0, TOP_K);

    /**
     * ===== 5️⃣ 컨텍스트 구성 =====
     */
    const context = topDocs
      .map(
        (d: any, i: number) =>
          `[출처 ${i + 1}] (${d.manual})\n${d.text}`
      )
      .join("\n\n");

    /**
     * ===== 6️⃣ GPT 호출 =====
     */
    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
너는 3D 프린터 매뉴얼 전용 AI 챗봇이다.
아래 제공된 매뉴얼 내용만 근거로 답변해라.

- 매뉴얼에 없는 내용은 일반적인 지식으로 답변해라
- 답변 마지막에 반드시 출처 번호를 명시해라
          `.trim(),
        },
        {
          role: "user",
          content: `
[매뉴얼 발췌]
${context}

[질문]
${question}
          `.trim(),
        },
      ],
    });

    const answer = completion.choices[0].message.content;

    /**
     * ===== 7️⃣ 사용량 +1 =====
     */
    await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "increaseUsage",
        userId,
        secret: GAS_SECRET,
      }),
    });

    /**
     * ===== 8️⃣ 대화 저장 =====
     */
    await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveChat",
        userId,
        role: "user",
        message: question,
        secret: GAS_SECRET,
      }),
    });

    await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveChat",
        userId,
        role: "assistant",
        message: answer,
        secret: GAS_SECRET,
      }),
    });

    /**
     * ===== 9️⃣ 응답 =====
     */
    return NextResponse.json({
      answer,
      remaining: check.remaining,
      sources: topDocs.map((d: any) => ({
        id: d.id,
        manual: d.manual,
        section: d.section,
      })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500 }
    );
  }
}
