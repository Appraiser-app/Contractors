import { requireAuth } from "@/lib/auth";
import DirectoryClient from "./DirectoryClient";

export default async function DirectoryPage() {
  await requireAuth();
  return <DirectoryClient />;
}
