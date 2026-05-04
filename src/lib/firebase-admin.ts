import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

const FALLBACK_CLIENT_EMAIL = "firebase-adminsdk-fbsvc@contracturs.iam.gserviceaccount.com";
const FALLBACK_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEugIBADANBgkqhkiG9w0BAQEFAASCBKQwggSgAgEAAoIBAQDDxDSmtXyFy7l6\nZQag1iSE5/pvojQDJFzIHGfHqK2ZWoYUZ+keo4ru1RKlEHMPivUQxnO6msIulxHe\nGOb3bQPfJYkiFA/43i3EyxwRL/AHD1rdQlU6vnfuQ6sbQbrC4//umgzD4YVxV9vp\nYXYACnrCHkKLTDHCFQexy1Q1hpM8Wgy0CXcXtsJhR8txMpyS4fSNkuoK+iMCebLh\nu1q21UJ0mKhZ4aYUHomu++jcb9f2sGKcN5a/wyJ2+PCPyPj7z2eHHMu1YnDmxRLr\nReELMSa4EYw0vkzEJ71AnOhoj/P2tYipeMUA924qNn819CZuhmFt7/2KcwfWGB5t\n4AlaMWoRAgMBAAECgf8m130PNVRsjkMBcbu42zIw9Y4Rr3PoPrqgckgtg7g8PqJ9\nlE7wVS3tahFXxhpLk4HGYimJhf7BsfYQmfNOxzK73r8oKeGu4pka4LcJxQCMh+cR\nYt7DlCayP0q6IfeiOM+Mup5uj2vu0a5iXBw1t1LwJmeZO8ze0tbiiUavKYVsSWJZ\nAG7zgVRyuWDVY2HpGQGnQVtHGD/u1lBJ2K5cR1AdakVXKeDDNLlw3s5c3miZrvb2\nENYvjeolOx3F8Z57MEApG0Mvwfw4r78X4nFvpLkobUP1wjBdQXKFRTpNuKpU7D0J\nTblVvOz3umKGSaAB7LuFT5zKK9EJFZisJr0G+qkCgYEA+QzDVvNqhP6YfCDNO9HK\nmA/xjlfNsZMiSkhiw1FJIXEvLOB8S/O0uxrKeX7W61i6fGBUPgWAfTXOhmgfVFif\nPcBL9Fs7e2/tcr6BqSihagGuHwAx2CH2VygqXxlYNWELqP5GALFn2eAQU2WwrM43\n3nOqfcRJrqXwiaivsPIEvMMCgYEAyTrHz+fLMrUiuxeiL45FOSHsfgBfjxPO4GKO\nmi+kryZliej1/sdk5ToZXTzp7PXNGwzKn6+1hMdYtHwfqyi9bXQAJsP5ZjL6RrsU\nnNxLNLdsSgQ8Jco67cNF5y0xnH6p/8fqH7p9GtrOYXBniuH4zv+iQXQHeC2HspHk\n7GquYJsCgYAdHOXUyz2fcFeI4xi6rmp9XhfBqPftkyKGBnItHNpso1t9ZnyBMGrn\nGFmk3DPpbQTXtzcBzQjZGiobQh6vcHCk+k6msOeCJXJfYG+tw4ci6jFdhFtPRaET\nTSmu1jqeesqvJZIvUI2wRWYDKbb+bFjRkznR29k1Jka5ANQQ3im5mwKBgChmutNN\nMIjfwTdbCV8O62sLGpY5sPXi/jgi0Yq3YhMgXGaR9UHP+rvjLFCB+F1xBFsX+F6T\nQpiEBZVHDnyo0090aMtfsWUJeyJUUVElEZxl70H1E7ZqoeY2vIQrmLhY3fzSwHja\nUl/f6mu5y7Agqnm07XjCuPUx/vqlPBcTXCtdAoGAWfuNU7VTgzuw6ixRz6kbemZa\nfQJFoNtx/zM4Ql2F5+368giHsg7NYeePAOD0tX6/PqZei6whfDQsNO8U9KhL4PV4\ntcwOppnFaIMo3bY4JoCWUai8+b/7kv8wn2iZuLvF2E+5fp6tEuo9RC5/R7voFlpj\nRIvfekPJkhW8HVs7rVY=\n-----END PRIVATE KEY-----\n";

function getAdminApp(): App {
  const existing = getApps().find((a) => a.name === "admin");
  if (existing) return existing;

  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n")) || FALLBACK_PRIVATE_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "contracturs";
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "contracturs.firebasestorage.app";
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || FALLBACK_CLIENT_EMAIL;

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
