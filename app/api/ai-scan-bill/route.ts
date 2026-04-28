import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ ok: false, message: "GEMINI_API_KEY not configured in .env.local" }, { status: 500 });

    const body = await req.json();
    const { billData, billType } = body;
    if (!billData) return NextResponse.json({ ok: false, message: "billData required" }, { status: 400 });

    // billData is a data URL like "data:image/jpeg;base64,...."
    const match = /^data:([^;]+);base64,(.+)$/.exec(billData);
    if (!match) return NextResponse.json({ ok: false, message: "Invalid billData format" }, { status: 400 });
    const mimeType = match[1];
    const base64 = match[2];

    const prompt = `You are a receipt/bill data extractor. Extract ONLY the following fields from the bill image as JSON:
{
  "vendor": "vendor/merchant/company name exactly as printed",
  "amount": "total amount as a number string e.g. '123.45' (total incl. VAT if VAT is shown)",
  "date": "date on the bill in YYYY-MM-DD format",
  "description": "brief description of items/services purchased (max 10 words)",
  "currency": "currency code e.g. AED, USD, EUR"
}
Rules:
- If a field is not clearly visible in the bill, use empty string "".
- Do NOT invent or infer information not on the bill.
- Return ONLY valid JSON, no markdown, no code fences, no explanation.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 500,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return NextResponse.json({ ok: false, message: `Gemini API error (${response.status}). ${errText.slice(0, 200)}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let parsed: any = {};
    try {
      parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim());
    } catch {
      return NextResponse.json({ ok: false, message: "AI returned unparseable output.", raw: text }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      extracted: {
        vendor: parsed.vendor || "",
        amount: parsed.amount || "",
        date: parsed.date || "",
        description: parsed.description || "",
        currency: parsed.currency || "",
      },
    });
  } catch (err: any) {
    console.error("ai-scan-bill error:", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}