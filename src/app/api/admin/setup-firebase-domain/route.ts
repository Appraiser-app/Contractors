import { requireAdmin } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await requireAdmin();
    // Get access token from Firebase Admin
    const app = (adminAuth as unknown as { app: { options: { credential: { getAccessToken: () => Promise<{ access_token: string }> } } } }).app;
    const credential = app.options.credential;
    const tokenResult = await credential.getAccessToken();
    const accessToken = tokenResult.access_token;

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const newDomains = [
      "contractors-six.vercel.app",
      "contractors-aj8s02rtr-appraiser-apps-projects.vercel.app",
    ];

    // Get current authorized domains
    const getResp = await fetch(
      `https://identitytoolkit.googleapis.com/v2/projects/${projectId}/config`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const config = await getResp.json();
    const domains: string[] = config.authorizedDomains || [];

    for (const d of newDomains) {
      if (!domains.includes(d)) domains.push(d);
    }

    // Update authorized domains
    const patchResp = await fetch(
      `https://identitytoolkit.googleapis.com/v2/projects/${projectId}/config?updateMask=authorizedDomains`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ authorizedDomains: domains }),
      }
    );
    const result = await patchResp.json();

    return NextResponse.json({
      success: true,
      domains: result.authorizedDomains,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
