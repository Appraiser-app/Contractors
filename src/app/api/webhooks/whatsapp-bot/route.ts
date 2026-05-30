import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { createExpense } from "@/lib/db";
import type { ExpenseEntity } from "@/lib/db";

export const maxDuration = 30;

// ----- Expense message parser -----
const CATEGORY_MAP: Record<string, string[]> = {
  "דלק": ["דלק", "תדלוק", "בנזין", "סולר", "גז"],
  "תיקון": ["תיקון", "חלפים", "מכניקה", "מוסך", "שמן", "פנצ'ר", "גלגל"],
  "אוכל": ["אוכל", "מזון", "קפה", "ארוחה", "מסעדה", "סופר", "מאפייה", "שוורמה", "פלאפל"],
  "ציוד וחומרים": ["ציוד", "כלים", "חומרים", "ברזל", "בטון", "חצץ", "עפר", "חול"],
  "עובדים": ["שכר", "עובד", "פועל", "משכורת", "יומי"],
  "חניה ועמלות": ["חניה", "קנס", "טולל", "אגרה"],
};

function detectCategory(text: string): string {
  for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some(kw => text.includes(kw))) return cat;
  }
  return "אחר";
}

function parseExpense(text: string): { amount: number; description: string; category: string } | null {
  const clean = text.trim().replace(/₪/g, "").replace(/,/g, "");

  // Pattern: "שילמתי X על Y" or "שילמתי X Y"
  const paidPattern = /שילמתי\s+(\d+(?:\.\d+)?)\s+(?:על\s+)?(.+)/;
  const paidMatch = clean.match(paidPattern);
  if (paidMatch) {
    const amount = parseFloat(paidMatch[1]);
    const desc = paidMatch[2].trim();
    return { amount, description: desc, category: detectCategory(desc) };
  }

  // Pattern: "הוצאה:? X - Y" or "הוצאה X Y"
  const expPattern = /הוצאה[:\s]+(\d+(?:\.\d+)?)\s*[-–]?\s*(.+)/;
  const expMatch = clean.match(expPattern);
  if (expMatch) {
    const amount = parseFloat(expMatch[1]);
    const desc = expMatch[2].trim();
    return { amount, description: desc, category: detectCategory(desc) };
  }

  // Pattern: number at start "500 דלק" or "500.5 קפה"
  const startNum = clean.match(/^(\d+(?:\.\d+)?)\s+(.{2,})/);
  if (startNum) {
    const amount = parseFloat(startNum[1]);
    const desc = startNum[2].trim();
    if (amount > 0 && amount < 1000000) {
      return { amount, description: desc, category: detectCategory(desc) };
    }
  }

  // Pattern: number at end "דלק 500" or "אוכל עובדים 300"
  const endNum = clean.match(/^(.{2,})\s+(\d+(?:\.\d+)?)$/);
  if (endNum) {
    const amount = parseFloat(endNum[2]);
    const desc = endNum[1].trim();
    if (amount > 0 && amount < 1000000) {
      return { amount, description: desc, category: detectCategory(desc) };
    }
  }

  return null;
}

// ----- Webhook handler -----
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Only handle incoming text messages
    if (body.typeWebhook !== "incomingMessageReceived") {
      return NextResponse.json({ ok: true, skipped: "not incomingMessage" });
    }
    if (body.messageData?.typeMessage !== "textMessage") {
      return NextResponse.json({ ok: true, skipped: "not textMessage" });
    }

    const instanceId = body.instanceData?.idInstance?.toString();
    const chatId: string = body.senderData?.chatId || "";
    const senderName: string = body.senderData?.senderName || "לא ידוע";
    const text: string = body.messageData?.textMessageData?.textMessage || "";

    if (!text.trim()) return NextResponse.json({ ok: true, skipped: "empty text" });

    // Load bot config
    const configDoc = await adminDb.collection("settings").doc("whatsappBot").get();
    if (!configDoc.exists) {
      return NextResponse.json({ ok: true, skipped: "bot not configured" });
    }
    const config = configDoc.data() as {
      instanceId: string;
      groupId: string;
      defaultEntity: ExpenseEntity;
      requireKeyword: boolean;
      keyword: string;
      enabled: boolean;
    };

    if (!config.enabled) return NextResponse.json({ ok: true, skipped: "bot disabled" });

    // Validate instance
    if (instanceId && config.instanceId && instanceId !== config.instanceId.toString()) {
      return NextResponse.json({ ok: true, skipped: "wrong instance" });
    }

    // Validate group
    if (config.groupId && chatId !== config.groupId) {
      return NextResponse.json({ ok: true, skipped: "wrong group" });
    }

    // Keyword filter
    if (config.requireKeyword && config.keyword) {
      if (!text.includes(config.keyword)) {
        return NextResponse.json({ ok: true, skipped: "keyword not found" });
      }
    }

    // Parse expense
    const parsed = parseExpense(text);

    // Save log entry
    const logId = crypto.randomUUID();
    const logData = {
      id: logId,
      sender: senderName,
      rawText: text,
      amount: parsed?.amount ?? null,
      description: parsed?.description ?? null,
      category: parsed?.category ?? null,
      status: parsed ? "created" : "skipped",
      expenseId: null as string | null,
      createdAt: new Date().toISOString(),
    };

    if (!parsed) {
      logData.status = "skipped";
      await adminDb.collection("whatsappBotLogs").doc(logId).set(logData);
      return NextResponse.json({ ok: true, skipped: "could not parse expense" });
    }

    // Create expense
    const expense = await createExpense({
      entity: config.defaultEntity || "חברה של דור",
      amount: parsed.amount,
      description: `${parsed.description} (WhatsApp: ${senderName})`,
      category: parsed.category,
      paymentMethod: "מזומן",
      vatIncluded: false,
      expenseType: "CASH",
      invoiceUrl: null,
      date: new Date().toISOString().split("T")[0],
      receiptUrl: null,
      notes: `נוצר אוטומטית מהודעת WhatsApp: "${text}"`,
      createdById: "whatsapp-bot",
      archiveId: null,
    });

    logData.expenseId = expense.id;
    logData.status = "created";
    await adminDb.collection("whatsappBotLogs").doc(logId).set(logData);

    return NextResponse.json({ ok: true, expenseId: expense.id, amount: parsed.amount, description: parsed.description });
  } catch (err) {
    console.error("WhatsApp bot webhook error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
