"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card, CardContent, CardTitle, CardDescription, Header, Footer } from "@/components/ui";
import { Mail, Lock, Eye, EyeOff, User, Chrome, CheckCircle, UserPlus } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  const { t } = useLocale();

  const passwordRequirements = [
    { label: t("auth.minChars"), met: password.length >= 8 },
    { label: t("auth.hasNumber"), met: /\d/.test(password) },
    { label: t("auth.hasUppercase"), met: /[A-Z]/.test(password) },
    { label: t("auth.passwordsMatch"), met: password === confirmPassword && password.length > 0 },
  ];

  const allRequirementsMet = passwordRequirements.every((req) => req.met);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      setError(t("auth.passwordRequirements"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.failedSignUp"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.failedGoogle"));
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <Card padding="none" className="w-full max-w-md shadow-xl border border-gray-100">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-aura-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-aura-primary" />
              </div>
              <CardTitle className="text-2xl mb-2">{t("auth.checkEmail")}</CardTitle>
              <CardDescription className="mb-6 text-gray-500">
                {t("auth.confirmMessage")} <strong className="text-gray-700">{email}</strong>.
                {" "}{t("auth.confirmAction")}
              </CardDescription>
              <Button variant="secondary" onClick={() => router.push("/auth/login")}>
                {t("auth.backToSignIn")}
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* Brand mark above card */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-aura-primary to-aura-secondary shadow-lg shadow-aura-primary/25 mb-4">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{t("auth.createAccount")}</h1>
            <p className="mt-2 text-gray-500">
              {t("auth.createAccountSubtitle")}
            </p>
          </div>

          <Card padding="none" className="shadow-xl border border-gray-100">
            <CardContent className="p-8">
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              {/* Google Sign Up */}
              <Button
                variant="outline"
                className="w-full mb-6 py-3 text-gray-700 font-medium border-gray-200 hover:bg-gray-50"
                onClick={handleGoogleSignup}
                disabled={isLoading}
                leftIcon={<Chrome className="w-5 h-5" />}
              >
                {t("auth.continueGoogle")}
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-400">
                    {t("auth.orSignUpEmail")}
                  </span>
                </div>
              </div>

              <form onSubmit={handleEmailSignup} className="space-y-5">
                <Input
                  label={t("auth.fullName")}
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  leftIcon={<User className="w-5 h-5" />}
                  required
                />

                <Input
                  label={t("auth.email")}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  leftIcon={<Mail className="w-5 h-5" />}
                  required
                />

                <Input
                  label={t("auth.password")}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
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

                <Input
                  label={t("auth.confirmPassword")}
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  leftIcon={<Lock className="w-5 h-5" />}
                  required
                />

                {/* Password Requirements */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
                  {passwordRequirements.map((req) => (
                    <div
                      key={req.label}
                      className={`flex items-center text-sm ${
                        req.met ? "text-aura-primary" : "text-gray-400"
                      }`}
                    >
                      <CheckCircle
                        className={`w-4 h-4 mr-2 flex-shrink-0 ${
                          req.met ? "fill-current" : ""
                        }`}
                      />
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>

                <label className="flex items-start text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 rounded border-gray-300 text-aura-primary focus:ring-aura-primary"
                    required
                  />
                  <span className="ml-2 text-gray-600">
                    {t("auth.agreeTerms")}{" "}
                    <Link href="/terms" className="text-aura-primary hover:underline font-medium">
                      {t("auth.termsOfService")}
                    </Link>{" "}
                    {t("auth.and")}{" "}
                    <Link href="/privacy" className="text-aura-primary hover:underline font-medium">
                      {t("auth.privacyPolicy")}
                    </Link>
                  </span>
                </label>

                <Button
                  type="submit"
                  className="w-full py-3"
                  isLoading={isLoading}
                  disabled={!allRequirementsMet}
                >
                  {t("auth.createAccount")}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                {t("auth.alreadyHaveAccount")}{" "}
                <Link
                  href="/auth/login"
                  className="text-aura-primary hover:text-aura-secondary font-semibold transition-colors"
                >
                  {t("auth.signIn")}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
