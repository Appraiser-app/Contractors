import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getProfileById } from "@/lib/db";

async function getAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error("לא ניתן לקבל access token מ-Google");
  }
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await getProfileById(user.id);
    if (!profile?.googleRefreshToken) {
      return NextResponse.json({ error: "יומן Google לא מחובר" }, { status: 400 });
    }

    const { title, description, dueDate } = await request.json();
    if (!title) return NextResponse.json({ error: "כותרת חסרה" }, { status: 400 });

    const accessToken = await getAccessToken(profile.googleRefreshToken);

    // Build event — if dueDate exists use it as an all-day event, otherwise use today
    const eventDate = dueDate
      ? dueDate.split("T")[0]
      : new Date().toISOString().split("T")[0];

    const event = {
      summary: title,
      description: description || "",
      start: { date: eventDate },
      end: { date: eventDate },
      reminders: {
        useDefault: false,
        overrides: [{ method: "popup", minutes: 60 }],
      },
    };

    const calRes = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    const calData = await calRes.json();
    if (!calRes.ok) {
      return NextResponse.json({ error: calData.error?.message || "שגיאה ביצירת האירוע" }, { status: 502 });
    }

    return NextResponse.json({ success: true, eventId: calData.id, htmlLink: calData.htmlLink });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
