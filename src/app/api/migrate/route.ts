import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";

// One-time migration: backfill new fields added throughout development
// GET /api/migrate — runs all migrations, returns summary
export async function GET() {
  try {
    await requireAdmin();
    const results: Record<string, { updated: number; skipped: number }> = {};

    // ── 1. Transactions: backfill archiveId: null ─────────────────────────
    {
      const snap = await adminDb.collection("transactions").get();
      let updated = 0, skipped = 0;
      const batchSize = 400;
      const docs = snap.docs.filter(d => d.data().archiveId === undefined);
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = adminDb.batch();
        docs.slice(i, i + batchSize).forEach(d => {
          batch.update(d.ref, { archiveId: null });
          updated++;
        });
        await batch.commit();
      }
      skipped = snap.size - updated;
      results.transactions = { updated, skipped };
    }

    // ── 2. Expenses: backfill archiveId: null ────────────────────────────
    {
      const snap = await adminDb.collection("expenses").get();
      let updated = 0, skipped = 0;
      const batchSize = 400;
      const docs = snap.docs.filter(d => d.data().archiveId === undefined);
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = adminDb.batch();
        docs.slice(i, i + batchSize).forEach(d => {
          batch.update(d.ref, { archiveId: null });
          updated++;
        });
        await batch.commit();
      }
      skipped = snap.size - updated;
      results.expenses = { updated, skipped };
    }

    // ── 3. Equipment: backfill currentMileage + nextServiceMileage ────────
    {
      const snap = await adminDb.collection("equipment").get();
      let updated = 0, skipped = 0;
      const batchSize = 400;
      const docs = snap.docs.filter(d => {
        const data = d.data();
        return data.currentMileage === undefined || data.nextServiceMileage === undefined || data.testLastDate === undefined || data.testDate === undefined || data.testCost === undefined;
      });
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = adminDb.batch();
        docs.slice(i, i + batchSize).forEach(d => {
          const data = d.data();
          const updates: Record<string, null> = {};
          if (data.currentMileage === undefined) updates.currentMileage = null;
          if (data.nextServiceMileage === undefined) updates.nextServiceMileage = null;
          if (data.testLastDate === undefined) updates.testLastDate = null;
          if (data.testDate === undefined) updates.testDate = null;
          if (data.testCost === undefined) updates.testCost = null;
          batch.update(d.ref, updates);
          updated++;
        });
        await batch.commit();
      }
      skipped = snap.size - updated;
      results.equipment = { updated, skipped };
    }

    // ── 4. Subscriptions: backfill startDate: null ────────────────────────
    {
      const snap = await adminDb.collection("subscriptions").get();
      let updated = 0, skipped = 0;
      const batchSize = 400;
      const docs = snap.docs.filter(d => d.data().startDate === undefined);
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = adminDb.batch();
        docs.slice(i, i + batchSize).forEach(d => {
          batch.update(d.ref, { startDate: null });
          updated++;
        });
        await batch.commit();
      }
      skipped = snap.size - updated;
      results.subscriptions = { updated, skipped };
    }

    // ── 5. Insurance: normalize cost (null where missing) ─────────────────
    {
      const snap = await adminDb.collection("insurances").get();
      let updated = 0, skipped = 0;
      const batchSize = 400;
      const docs = snap.docs.filter(d => d.data().cost === undefined);
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = adminDb.batch();
        docs.slice(i, i + batchSize).forEach(d => {
          batch.update(d.ref, { cost: null });
          updated++;
        });
        await batch.commit();
      }
      skipped = snap.size - updated;
      results.insurance = { updated, skipped };
    }

    // ── 6. Sites: backfill lat/lng ────────────────────────────────────────
    {
      const snap = await adminDb.collection("sites").get();
      let updated = 0, skipped = 0;
      const batchSize = 400;
      const docs = snap.docs.filter(d => {
        const data = d.data();
        return data.lat === undefined || data.lng === undefined;
      });
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = adminDb.batch();
        docs.slice(i, i + batchSize).forEach(d => {
          const data = d.data();
          const updates: Record<string, null> = {};
          if (data.lat === undefined) updates.lat = null;
          if (data.lng === undefined) updates.lng = null;
          batch.update(d.ref, updates);
          updated++;
        });
        await batch.commit();
      }
      skipped = snap.size - updated;
      results.sites = { updated, skipped };
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
