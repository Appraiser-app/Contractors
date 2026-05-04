import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

function getAdminApp(): App {
  const existing = getApps().find((a) => a.name === "admin");
  if (existing) return existing;

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

  return initializeApp(
    {
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket,
    },
    "admin"
  );
}

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    return getAuth(getAdminApp())[prop as keyof Auth];
  },
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    return getFirestore(getAdminApp())[prop as keyof Firestore];
  },
});

export const adminStorage: Storage = new Proxy({} as Storage, {
  get(_, prop) {
    return getStorage(getAdminApp())[prop as keyof Storage];
  },
});
