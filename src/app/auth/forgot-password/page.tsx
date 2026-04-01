"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card, CardContent, CardTitle, CardDescription, Header, Footer } from "@/components/ui";
import { Mail, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();
  const { t } = useLocale();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.failedReset"));
    } finally {
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
                {t("auth.resetSent")} <strong className="text-gray-700">{email}</strong>{t("auth.resetSentSuffix")}
              </CardDescription>
              <Link href="/auth/login">
                <Button variant="secondary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("auth.backToSignIn")}
                </Button>
              </Link>
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
              <KeyRound className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{t("auth.resetPassword")}</h1>
            <p className="mt-2 text-gray-500">
              {t("auth.resetSubtitle")}
            </p>
          </div>

          <Card padding="none" className="shadow-xl border border-gray-100">
            <CardContent className="p-8">
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label={t("auth.email")}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  leftIcon={<Mail className="w-5 h-5" />}
                  required
                />

                <Button type="submit" className="w-full py-3" isLoading={isLoading}>
                  {t("auth.sendResetLink")}
                </Button>
              </form>

              <p className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-aura-primary hover:text-aura-secondary font-medium inline-flex items-center transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  {t("auth.backToSignIn")}
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
