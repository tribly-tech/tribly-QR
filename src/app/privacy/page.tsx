import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | tribly.ai",
  description: "Privacy Policy for tribly.ai services.",
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: February 9, 2025
        </p>
        <div className="mt-10 space-y-8 text-foreground/90 prose prose-slate dark:prose-invert max-w-none">
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
              1. Introduction
            </h2>
            <p>
              tribly.ai (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your privacy. This
              Privacy Policy explains how we collect, use, disclose, and protect
              information when you use our services, including our website and
              business dashboard.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
              2. Information We Collect
            </h2>
            <p>
              We may collect: (a) information you provide, such as name, email,
              business details, and account credentials; (b) information from
              Google services when you connect your Google Business Profile
              (e.g., business name, location, reviews); (c) usage data such as
              how you use our dashboard and features; and (d) technical data
              such as IP address, browser type, and device information.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
              3. How We Use Your Information
            </h2>
            <p>
              We use collected information to provide, maintain, and improve our
              services; to authenticate users and manage accounts; to communicate
              with you; to analyze usage and trends; and to comply with legal
              obligations. We do not sell your personal information to third
              parties.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
              4. Sharing and Disclosure
            </h2>
            <p>
              We may share information with service providers who assist in
              operating our services (under strict confidentiality), with Google
              in connection with Google Business Profile and related APIs, and
              when required by law or to protect our rights and safety.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
              5. Data Security and Retention
            </h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your data. We retain your information only as long as
              necessary to provide our services and fulfill the purposes
              described in this policy, or as required by law.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
              6. Your Rights
            </h2>
            <p>
              Depending on your location, you may have rights to access,
              correct, delete, or port your personal data, or to object to or
              restrict certain processing. To exercise these rights, contact us
              at the email below.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
              7. Cookies and Similar Technologies
            </h2>
            <p>
              We may use cookies and similar technologies for authentication,
              preferences, and analytics. You can manage cookie settings through
              your browser.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">
              8. Changes and Contact
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of material changes by posting the updated policy and
              updating the &quot;Last updated&quot; date. For questions or requests,
              contact us at{" "}
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
          <Link href="/terms" className="hover:text-foreground">
            Terms and Conditions
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
