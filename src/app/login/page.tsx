"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">AMC Tracker</h1>
        <p className="text-gray-500 text-center text-sm mb-8">
          Track your A-List savings
        </p>

        {sent ? (
          <div className="bg-card rounded-xl p-6 text-center">
            <p className="text-accent font-semibold mb-2">Check your email</p>
            <p className="text-gray-400 text-sm">
              We sent a login link to {email}
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full bg-card border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent"
            />
            {error && <p className="text-accent-red text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-accent text-black font-bold py-3 rounded-xl"
            >
              Send Magic Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
