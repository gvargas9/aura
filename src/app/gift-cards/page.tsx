"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header, Footer, Button, Input, Card } from "@/components/ui";
import { useAuth } from "@/hooks";
import { formatCurrency } from "@/lib/utils";
import {
  Gift,
  Send,
  Calendar,
  Lock,
  CheckCircle,
  Loader2,
  Sparkles,
  Heart,
  ShieldCheck,
  Zap,
  Mail,
  User,
  MessageSquare,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";

const PRESET_AMOUNTS = [25, 50, 75, 100];
const MIN_AMOUNT = 10;
const MAX_AMOUNT = 500;

type DeliveryOption = "now" | "scheduled";

interface PurchaseSuccess {
  code: string;
  amount: number;
  recipientName: string;
}

export default function GiftCardsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Form state
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("now");
  const [scheduledDate, setScheduledDate] = useState("");

  // Submit state
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PurchaseSuccess | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const activeAmount = isCustom ? parseFloat(customAmount) || 0 : selectedAmount;
  const isValidAmount = activeAmount >= MIN_AMOUNT && activeAmount <= MAX_AMOUNT;

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setIsCustom(true);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirectTo=/gift-cards");
      return;
    }

    if (!isValidAmount) {
      setError(`Please enter an amount between ${formatCurrency(MIN_AMOUNT)} and ${formatCurrency(MAX_AMOUNT)}`);
      return;
    }

    if (!recipientName.trim()) {
      setError("Please enter the recipient's name");
      return;
    }

    if (!recipientEmail.trim()) {
      setError("Please enter the recipient's email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    if (deliveryOption === "scheduled" && !scheduledDate) {
      setError("Please select a delivery date");
      return;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      const response = await fetch("/api/gift-cards/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: activeAmount,
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim(),
          message: message.trim() || undefined,
          scheduledDate: deliveryOption === "scheduled" ? scheduledDate : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to purchase gift card");
      }

      setSuccess(data.giftCard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsPurchasing(false);
    }
  };

  // Minimum date for scheduling (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12 px-4 bg-gradient-to-b from-emerald-50 to-white">
          <Card className="max-w-lg w-full text-center p-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gift Card Created
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              A {formatCurrency(success.amount)} gift card for {success.recipientName} is on its way.
            </p>

            {/* Gift Card Code Display */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 mb-6 text-white shadow-lg">
              <p className="text-sm text-emerald-200 mb-2">Gift Card Code</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-2xl font-mono font-bold tracking-wider">
                  {success.code}
                </p>
                <button
                  onClick={() => handleCopyCode(success.code)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  aria-label="Copy gift card code"
                >
                  {codeCopied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-sm text-emerald-200 mt-3">
                {formatCurrency(success.amount)} Balance
              </p>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              {deliveryOption === "scheduled"
                ? `The gift card will be emailed to ${recipientEmail} on ${new Date(scheduledDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
                : `An email with the gift card has been sent to ${recipientEmail}.`}
            </p>

            <div className="space-y-3">
              <Button
                className="w-full"
                onClick={() => {
                  setSuccess(null);
                  setRecipientName("");
                  setRecipientEmail("");
                  setMessage("");
                  setCustomAmount("");
                  setIsCustom(false);
                  setSelectedAmount(50);
                  setDeliveryOption("now");
                  setScheduledDate("");
                }}
              >
                Send Another Gift Card
              </Button>
              <Link href="/dashboard">
                <Button variant="secondary" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white py-20 px-4">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-sm font-medium text-emerald-100">Perfect for any occasion</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Give the Gift of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-400">
                Aura
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto mb-8">
              Let them choose their own adventure with an Aura gift card.
              Premium meals, delivered to their door.
            </p>

            <div className="flex items-center justify-center gap-8 text-sm text-emerald-200">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-300" />
                Instant Delivery
              </span>
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-amber-300" />
                Never Expires*
              </span>
              <span className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-300" />
                Any Amount
              </span>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-3 space-y-6">
                {/* Amount Selection */}
                <Card padding="lg">
                  <h2 className="text-xl font-semibold mb-1">Choose an Amount</h2>
                  <p className="text-sm text-gray-500 mb-5">
                    Select a preset or enter a custom amount ({formatCurrency(MIN_AMOUNT)} - {formatCurrency(MAX_AMOUNT)})
                  </p>

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => handlePresetClick(amt)}
                        className={`py-3 px-4 rounded-xl border-2 font-semibold text-lg transition-all ${
                          !isCustom && selectedAmount === amt
                            ? "border-aura-primary bg-aura-primary/5 text-aura-primary ring-2 ring-aura-primary/20"
                            : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-lg">$</span>
                    <input
                      type="number"
                      min={MIN_AMOUNT}
                      max={MAX_AMOUNT}
                      step={1}
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      onFocus={() => setIsCustom(true)}
                      className={`w-full pl-8 pr-4 py-3 border-2 rounded-xl transition-all text-lg font-medium outline-none ${
                        isCustom
                          ? "border-aura-primary bg-aura-primary/5 ring-2 ring-aura-primary/20"
                          : "border-gray-200 hover:border-gray-300"
                      } focus:border-aura-primary focus:ring-2 focus:ring-aura-primary/20`}
                    />
                  </div>

                  {isCustom && customAmount && !isValidAmount && (
                    <p className="text-sm text-red-500 mt-2">
                      Amount must be between {formatCurrency(MIN_AMOUNT)} and {formatCurrency(MAX_AMOUNT)}
                    </p>
                  )}
                </Card>

                {/* Recipient Details */}
                <Card padding="lg">
                  <h2 className="text-xl font-semibold mb-1">Recipient Details</h2>
                  <p className="text-sm text-gray-500 mb-5">
                    Who is this gift card for?
                  </p>

                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Recipient Name"
                        placeholder="Their name"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        leftIcon={<User className="w-4 h-4" />}
                      />
                      <Input
                        label="Recipient Email"
                        type="email"
                        placeholder="their@email.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        leftIcon={<Mail className="w-4 h-4" />}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Personal Message (Optional)
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <textarea
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary outline-none resize-none hover:border-gray-300 transition-all"
                          rows={3}
                          placeholder="Add a heartfelt message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          maxLength={300}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/300</p>
                    </div>
                  </div>
                </Card>

                {/* Delivery Options */}
                <Card padding="lg">
                  <h2 className="text-xl font-semibold mb-1">Delivery</h2>
                  <p className="text-sm text-gray-500 mb-5">
                    When should we send the gift card?
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setDeliveryOption("now")}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        deliveryOption === "now"
                          ? "border-aura-primary bg-aura-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        deliveryOption === "now" ? "bg-aura-primary text-white" : "bg-gray-100 text-gray-400"
                      }`}>
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Send Now</p>
                        <p className="text-xs text-gray-500">Deliver immediately via email</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setDeliveryOption("scheduled")}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        deliveryOption === "scheduled"
                          ? "border-aura-primary bg-aura-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        deliveryOption === "scheduled" ? "bg-aura-primary text-white" : "bg-gray-100 text-gray-400"
                      }`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Schedule</p>
                        <p className="text-xs text-gray-500">Pick a future delivery date</p>
                      </div>
                    </button>
                  </div>

                  {deliveryOption === "scheduled" && (
                    <Input
                      type="date"
                      label="Delivery Date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={minDate}
                      leftIcon={<Calendar className="w-4 h-4" />}
                    />
                  )}
                </Card>

                {/* Error Display */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Purchase Button (mobile) */}
                <div className="lg:hidden">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handlePurchase}
                    isLoading={isPurchasing}
                    disabled={!isValidAmount || !recipientName.trim() || !recipientEmail.trim()}
                    leftIcon={<Gift className="w-5 h-5" />}
                  >
                    {authLoading
                      ? "Loading..."
                      : !isAuthenticated
                      ? "Sign In to Purchase"
                      : `Purchase ${isValidAmount ? formatCurrency(activeAmount) : ""} Gift Card`}
                  </Button>
                </div>
              </div>

              {/* Sidebar: Preview + CTA */}
              <div className="lg:col-span-2 space-y-6">
                {/* Gift Card Preview */}
                <div className="sticky top-24 space-y-6">
                  <Card padding="none" className="overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b">
                      <h3 className="font-medium text-sm text-gray-600">Gift Card Preview</h3>
                    </div>

                    {/* Gift Card Visual */}
                    <div className="p-6">
                      <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 rounded-2xl p-6 text-white shadow-xl aspect-[1.6/1] flex flex-col justify-between overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-6 -translate-x-6" />

                        {/* Top row: Logo + Amount */}
                        <div className="relative flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                <Sparkles className="w-4 h-4 text-amber-300" />
                              </div>
                              <span className="text-lg font-bold tracking-wide">AURA</span>
                            </div>
                            <p className="text-xs text-emerald-200">Gift Card</p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold">
                              {isValidAmount ? formatCurrency(activeAmount) : "$--"}
                            </p>
                          </div>
                        </div>

                        {/* Bottom row: Recipient + Message */}
                        <div className="relative">
                          <p className="text-xs text-emerald-300 mb-0.5">To</p>
                          <p className="font-semibold text-sm truncate">
                            {recipientName || "Recipient Name"}
                          </p>
                          {message && (
                            <p className="text-xs text-emerald-200 mt-1 line-clamp-2 italic">
                              &ldquo;{message}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Email Preview Hint */}
                    <div className="px-6 pb-6">
                      <div className="bg-gray-50 rounded-lg p-4 border border-dashed border-gray-200">
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Email Preview</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {recipientName || "Your recipient"} will receive a beautifully designed email
                              with the gift card code and your personal message
                              {deliveryOption === "scheduled" && scheduledDate
                                ? ` on ${new Date(scheduledDate + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                                : " instantly"}.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Purchase CTA (desktop) */}
                  <div className="hidden lg:block space-y-4">
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handlePurchase}
                      isLoading={isPurchasing}
                      disabled={!isValidAmount || !recipientName.trim() || !recipientEmail.trim()}
                      leftIcon={<Gift className="w-5 h-5" />}
                    >
                      {authLoading
                        ? "Loading..."
                        : !isAuthenticated
                        ? "Sign In to Purchase"
                        : `Purchase ${isValidAmount ? formatCurrency(activeAmount) : ""} Gift Card`}
                    </Button>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-lg border border-gray-100">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                        <span className="text-xs text-gray-500 text-center">Secure Payment</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-lg border border-gray-100">
                        <Zap className="w-5 h-5 text-amber-500" />
                        <span className="text-xs text-gray-500 text-center">Instant Delivery</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-lg border border-gray-100">
                        <Lock className="w-5 h-5 text-blue-600" />
                        <span className="text-xs text-gray-500 text-center">SSL Encrypted</span>
                      </div>
                    </div>
                  </div>

                  {/* Fine Print */}
                  <p className="text-xs text-gray-400 text-center hidden lg:block">
                    *Gift cards are valid for 1 year from purchase date.
                    Non-refundable. Cannot be exchanged for cash.
                    See our <Link href="/terms" className="underline hover:text-gray-600">Terms</Link> for details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-10">How Gift Cards Work</h2>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                {
                  icon: Gift,
                  title: "1. Choose & Personalize",
                  desc: "Pick an amount and add a personal message for your recipient.",
                },
                {
                  icon: Send,
                  title: "2. We Deliver It",
                  desc: "The gift card is emailed instantly or on your chosen date.",
                },
                {
                  icon: Heart,
                  title: "3. They Enjoy",
                  desc: "Your recipient builds their dream box and enjoys premium meals.",
                },
              ].map((step) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.title} className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                      <StepIcon className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-gray-500">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-12 px-4 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3">Not sure what they like?</h2>
            <p className="text-gray-600 mb-6">
              That is the beauty of a gift card. They choose their own meals from our entire premium catalog.
            </p>
            <Link href="/products">
              <Button variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Browse Our Catalog
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
