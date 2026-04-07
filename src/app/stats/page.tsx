"use client";

import { AuthGuard } from "@/components/auth-guard";
import { StatsContent } from "@/components/stats-content";

export default function StatsPage() {
  return (
    <AuthGuard>
      <StatsContent />
    </AuthGuard>
  );
}
