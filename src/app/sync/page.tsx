"use client";

import { AuthGuard } from "@/components/auth-guard";
import { SyncContent } from "@/components/sync-content";

export default function SyncPage() {
  return (
    <AuthGuard>
      <SyncContent />
    </AuthGuard>
  );
}
