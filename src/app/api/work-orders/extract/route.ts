import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getUser } from "@/lib/auth";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL || "https://www.clickclickclaude.dev/api/proxy",
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "לא נמצא קובץ" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mediaType = (file.type || "application/pdf") as "application/pdf";

  let message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `זוהי הזמנת עבודה/רכש. חלץ ממנה את הפרטים הבאים והחזר JSON בלבד (ללא markdown, ללא הסברים):
{
  "orderNumber": "מספר ההזמנה",
  "clientName": "שם החברה/הלקוח שהזמין את העבודה (המוציא את ההזמנה, לא הקבלן)",
  "projectName": "שם הפרויקט (מה שכתוב בתיאור/שם הפריט)",
  "location": "מיקום הפרויקט אם ניתן לזהות",
  "description": "תיאור מלא של העבודה",
  "contractValueBeforeVat": מספר (ערך לפני מע"מ, ללא פסיקים),
  "contractValueWithVat": מספר (סה"כ לתשלום כולל מע"מ, ללא פסיקים),
  "date": "תאריך ההזמנה בפורמט YYYY-MM-DD",
  "clientPhone": "טלפון הלקוח אם מופיע, אחרת null",
  "orderDate": "תאריך ביצוע העבודה אם שונה מתאריך ההזמנה, אחרת null"
}
החזר JSON בלבד.`,
            },
          ],
        },
      ],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Anthropic API error:", msg);
    return NextResponse.json({ error: "שגיאה בקריאת ה-AI", detail: msg }, { status: 502 });
  }

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const data = JSON.parse(cleaned);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "שגיאה בעיבוד הקובץ", raw: text }, { status: 422 });
  }
}
