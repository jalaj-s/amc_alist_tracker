"use client";

import { AuthGuard } from "@/components/auth-guard";
import { HomeDashboard } from "@/components/home-dashboard";

export default function Home() {
  return (
    <AuthGuard>
      <HomeDashboard />
    </AuthGuard>
  );
}
