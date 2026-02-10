import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions | tribly.ai",
  description: "Terms and Conditions for using tribly.ai services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F1FF] via-[#F3EBFF] to-[#EFE5FF]">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          ← Back to tribly.ai
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Terms and Conditions
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: February 9, 2025
        </p>
        <div className="mt-10 space-y-8 text-foreground/90 prose prose-slate dark:prose-invert max-w-none">
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using tribly.ai (&quot;Service&quot;), you agree to be bound by
              these Terms and Conditions. If you do not agree, do not use the
              Service. We may update these terms from time to time; continued use
              after changes constitutes acceptance.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
              2. Description of Service
            </h2>
            <p>
              tribly.ai provides tools to help businesses collect, manage, and
              leverage Google reviews and related insights. Features may include
              QR-based review collection, dashboards, analytics, and integration
              with Google Business Profile and other services.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
              3. Your Obligations
            </h2>
            <p>
              You agree to use the Service only for lawful purposes and in
              accordance with these terms, Google&apos;s policies, and applicable
              laws. You are responsible for the accuracy of information you
              provide and for maintaining the security of your account. You must
              not misuse the Service, attempt to gain unauthorized access, or
              interfere with its operation.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
              4. Intellectual Property
            </h2>
            <p>
              The Service and its content, features, and functionality are owned
              by tribly.ai and are protected by intellectual property laws. You
              may not copy, modify, distribute, or create derivative works without
              our prior written consent.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
              5. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, tribly.ai shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages, or for any loss of profits, data, or business
              opportunities arising from your use of the Service.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
              6. Termination
            </h2>
            <p>
              We may suspend or terminate your access to the Service at any time
              for violation of these terms or for any other reason. You may stop
              using the Service at any time. Provisions that by their nature
              should survive will remain in effect after termination.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
              7. Contact
            </h2>
            <p>
              For questions about these Terms and Conditions, contact us at{" "}
              <a
                href="mailto:growth@tribly.ai"
                className="text-primary hover:underline"
              >
                growth@tribly.ai
              </a>
              .
            </p>
          </section>
        </div>
        <footer className="mt-[120px] pt-6 border-t border-border/60 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <span className="mx-2">·</span>
          <a href="https://tribly.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            tribly.ai
          </a>
        </footer>
      </div>
    </div>
  );
}
