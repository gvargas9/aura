import Link from "next/link";
import { Header, Footer, Card, Button } from "@/components/ui";
import { CheckCircle, Mail, Clock, ArrowRight } from "lucide-react";

export default function ApplicationSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold mb-4">Application Submitted!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for applying to become an Aura dealer partner.
          </p>

          <Card padding="lg" className="text-left mb-8">
            <h2 className="font-semibold mb-4">What happens next?</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-aura-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-aura-primary" />
                </div>
                <div>
                  <p className="font-medium">Check Your Email</p>
                  <p className="text-sm text-gray-600">
                    We&apos;ve sent a confirmation email with your application details.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-aura-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-aura-primary" />
                </div>
                <div>
                  <p className="font-medium">Review Process</p>
                  <p className="text-sm text-gray-600">
                    Our partnerships team will review your application within 48 hours.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-aura-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-aura-primary" />
                </div>
                <div>
                  <p className="font-medium">Get Started</p>
                  <p className="text-sm text-gray-600">
                    Once approved, you&apos;ll receive access to your dealer portal
                    with your unique referral code and wholesale pricing.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button variant="outline">Return to Home</Button>
            </Link>
            <Link href="/products">
              <Button>
                Browse Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray-500">
            Questions? Contact us at{" "}
            <a
              href="mailto:partnerships@aura.com"
              className="text-aura-primary hover:underline"
            >
              partnerships@aura.com
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
