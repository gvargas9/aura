import Link from "next/link";
import { Card, CardContent, CardTitle, CardDescription, Header, Footer, Button } from "@/components/ui";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl mb-2">Authentication Error</CardTitle>
            <CardDescription className="mb-6">
              Something went wrong during authentication. This could be due to an
              expired link or an invalid session. Please try again.
            </CardDescription>
            <div className="space-y-3">
              <Link href="/auth/login" className="block">
                <Button className="w-full">
                  Try Again
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="secondary" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
