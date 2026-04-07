"use client";

import { useState } from "react";
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { ensureUserProfile } from "@/lib/firebase/seed";
import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  // Handle magic link callback
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const savedEmail = window.localStorage.getItem("emailForSignIn") || "";
      if (savedEmail) {
        signInWithEmailLink(auth, savedEmail, window.location.href)
          .then(async (result) => {
            window.localStorage.removeItem("emailForSignIn");
            await ensureUserProfile(result.user.uid, result.user.email || savedEmail);
            router.push("/");
          })
          .catch((err) => setError(err.message));
      }
    }
  }, [router]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      });
      window.localStorage.setItem("emailForSignIn", email);
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">AMC Tracker</h1>
        <p className="text-gray-500 text-center text-sm mb-8">Track your A-List savings</p>

        {sent ? (
          <div className="bg-card rounded-xl p-6 text-center">
            <p className="text-accent font-semibold mb-2">Check your email</p>
            <p className="text-gray-400 text-sm">We sent a login link to {email}</p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com" required
              className="w-full bg-card border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent" />
            {error && <p className="text-accent-red text-sm">{error}</p>}
            <button type="submit" className="w-full bg-accent text-black font-bold py-3 rounded-xl">
              Send Magic Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
