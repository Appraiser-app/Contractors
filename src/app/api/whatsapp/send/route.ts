import { getUser, requireAuth } from "@/lib/auth";
import { saveWhatsAppMessage } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await requireAuth();
    const user = await getUser();
    const { to, toName, body, siteId } = await request.json();

    if (!to || !body) {
      return NextResponse.json({ error: "מספר טלפון והודעה נדרשים" }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !from) {
      return NextResponse.json({ error: "WhatsApp לא מוגדר — הוסף TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ו-TWILIO_WHATSAPP_FROM ל-Vercel" }, { status: 503 });
    }

    // Normalize number to whatsapp: format
    const normalizedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to.startsWith("+") ? to : `+972${to.replace(/^0/, "")}`}`;

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          From: from,
          To: normalizedTo,
          Body: body,
        }).toString(),
      }
    );

    const twilioData = await twilioRes.json();

    if (!twilioRes.ok) {
      const errMsg = twilioData.message || "שגיאה בשליחה";
      return NextResponse.json({ error: errMsg }, { status: 502 });
    }

    // Save to DB
    const saved = await saveWhatsAppMessage({
      to: normalizedTo,
      toName: toName || null,
      body,
      status: twilioData.status || "sent",
      siteId: siteId || null,
      sentBy: user?.id || null,
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
