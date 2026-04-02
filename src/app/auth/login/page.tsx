"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Header, Footer } from "@/components/ui";
import { Mail, Lock, Eye, EyeOff, Chrome, Loader2, ShieldCheck } from "lucide-react";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Brand mark above card */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-aura-primary to-aura-secondary shadow-lg shadow-aura-primary/25 mb-4">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="mt-2 text-gray-500">
              Sign in to your Aura account to continue
            </p>
          </div>

          <Card padding="none" className="shadow-xl border border-gray-100">
            <CardContent className="p-8">
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Google Sign In */}
              <Button
                variant="outline"
                className="w-full mb-6 py-3 text-gray-700 font-medium border-gray-200 hover:bg-gray-50"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                leftIcon={<Chrome className="w-5 h-5" />}
              >
                Continue with Google
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-400">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-5">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  leftIcon={<Mail className="w-5 h-5" />}
                  autoComplete="email"
                  required
                />

                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  leftIcon={<Lock className="w-5 h-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  }
                  required
                />

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                    />
                    <span className="ml-2 text-gray-600">Remember me</span>
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-aura-primary hover:text-aura-secondary font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full py-3"
                  isLoading={isLoading}
                >
                  Sign In
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-aura-primary hover:text-aura-secondary font-semibold transition-colors"
                >
                  Sign up for free
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* Trust indicators */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              256-bit encryption
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>Secure login</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>Privacy protected</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
        <Loader2 className="w-8 h-8 animate-spin text-aura-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
