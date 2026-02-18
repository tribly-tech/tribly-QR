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
          ← Back
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective Date: February 18, 2026 · Last Updated: February 18, 2026 · Version 1.0
        </p>
        <div className="mt-10 space-y-8 text-foreground/90 prose prose-slate dark:prose-invert max-w-none [&_strong]:font-semibold">
          <p className="text-foreground/90">
            Welcome to Tribly.ai. This Privacy Policy is a legally binding document that describes how Tribly Tech Pvt ltd. (&quot;Tribly,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, stores, discloses, and safeguards information — including personal data and Google Business Profile data — when you access or use the Tribly.ai platform, website, APIs, and related services (collectively, the &quot;Services&quot;). This policy applies to all users, including business owners, marketers, agencies, and any other individuals who interact with our platform.
          </p>
          <p className="text-foreground/90">
            By accessing or using the Services, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy and our Terms of Service. If you do not agree with any part of this Privacy Policy, you must discontinue use of the Services immediately.
          </p>
          <p className="text-foreground/90">
            Tribly.ai is committed to transparency, data minimization, and user control. We collect only what we need, explain exactly why we need it, and give you meaningful options to manage, export, or delete your data at any time.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. Definitions</h2>
            <p className="mb-3">For the purposes of this Privacy Policy, the following definitions apply:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>&quot;Personal Data&quot;</strong> means any information that identifies or can reasonably identify a natural person, including name, email address, IP address, and location data.</li>
              <li><strong>&quot;GBP&quot;</strong> or <strong>&quot;Google Business Profile&quot;</strong> refers to the business listing product offered by Google LLC that allows businesses to manage their online presence across Google Search and Maps.</li>
              <li><strong>&quot;GBP Data&quot;</strong> means all data, metadata, content, and information accessed from a User&apos;s Google Business Profile, including but not limited to business name, address, phone number, reviews, photos, posts, Q&A, insights, and performance analytics.</li>
              <li><strong>&quot;Platform&quot;</strong> refers to the Tribly.ai website (tribly.ai), web application, mobile applications, APIs, and all associated tools and dashboards.</li>
              <li><strong>&quot;User&quot;</strong> / <strong>&quot;You&quot;</strong> refers to any individual or entity that accesses or uses the Platform, including business owners, administrators, team members, and agencies.</li>
              <li><strong>&quot;Processing&quot;</strong> means any operation performed on Personal Data or GBP Data, including collection, storage, use, modification, disclosure, and deletion.</li>
              <li><strong>&quot;Third Party&quot;</strong> refers to any individual, company, or service not directly owned or controlled by Tribly.</li>
              <li><strong>&quot;Controller&quot;</strong> refers to Tribly as the entity that determines the purposes and means of processing Personal Data.</li>
              <li><strong>&quot;Data Subject&quot;</strong> means any individual whose Personal Data is processed by Tribly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect several categories of information to provide, improve, and personalize the Services. Below is a comprehensive breakdown of each category:</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">2.1 Information You Provide Directly</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Account Registration Data:</strong> Full name, business name, email address, phone number, and password when you create an account.</li>
              <li><strong>Business Profile Information:</strong> Details you enter manually about your business, including service areas, descriptions, categories, and operating hours.</li>
              <li><strong>Communications:</strong> Messages, support tickets, survey responses, feedback, and any other communications you send to us.</li>
              <li><strong>User-Generated Content:</strong> Posts, responses to reviews, photos, Q&A content, and other content you create or schedule through the Platform.</li>
            </ul>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">2.2 Google Business Profile (GBP) Data — Detailed Disclosure</h3>
            <p className="mb-2">Tribly.ai integrates with the Google Business Profile API and Google My Business API to provide its core services. When you connect your Google account and authorize our application, we access and process the following GBP Data:</p>
            <p className="mb-2 text-sm"><strong>A. Business Listing Information:</strong> Business name, address, phone number (NAP consistency data); business category (primary and secondary); website URL, business description, service areas; operating hours, special hours, and holiday hours; business attributes (e.g., accessibility features, payment methods, amenities); verification status of the listing.</p>
            <p className="mb-2 text-sm"><strong>B. Reviews and Ratings:</strong> All customer reviews associated with your GBP listing; star ratings (overall and per-category where available); your existing responses to reviews; review timestamps and reviewer display names (as provided by Google).</p>
            <p className="mb-2 text-sm"><strong>C. Photos and Media:</strong> Business photos (exterior, interior, products, team); owner-uploaded media and customer-uploaded photos visible on your listing; photo metadata including upload dates and categories.</p>
            <p className="mb-2 text-sm"><strong>D. Google Posts and Updates:</strong> Published posts, offers, events, and product listings; post status, scheduled dates, and engagement metrics; historical post archives.</p>
            <p className="mb-2 text-sm"><strong>E. Questions & Answers (Q&A):</strong> All questions posted on your GBP listing by Google users; answers provided by you or other contributors; Q&A timestamps.</p>
            <p className="mb-2 text-sm"><strong>F. Performance Insights and Analytics:</strong> Search impressions; map views and direction requests; website click-through counts; phone call click counts; photo view counts; customer action metrics (searches, direct searches, branded searches).</p>
            <p className="mb-2 text-sm"><strong>G. Service and Product Listings:</strong> Services and menu items you have added to your GBP listing; product catalogs linked to your profile.</p>
            <p className="mb-2 text-sm"><strong>H. Multi-Location Data:</strong> Aggregated and per-location data for businesses managing multiple GBP listings; bulk location metadata for chain or franchise accounts.</p>
            <p className="text-sm">We access GBP Data exclusively through Google&apos;s official APIs under OAuth 2.0 authorization. We do not scrape Google&apos;s platforms or access data outside the scope of your explicit authorization. You may revoke our access at any time through your Google Account settings.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">2.3 Automatically Collected Technical Data</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Device and Browser Information:</strong> Device type, operating system, browser version, screen resolution, and unique device identifiers.</li>
              <li><strong>Log Data:</strong> IP address, access timestamps, pages viewed, referring URL, session duration, and clickstream data.</li>
              <li><strong>Cookies and Tracking Technologies:</strong> Session cookies, persistent cookies, web beacons, and pixel tags (see Section 9 for full cookie policy).</li>
              <li><strong>Usage Analytics:</strong> Feature usage patterns, dashboard interactions, scheduling frequency, and error logs for system diagnostics.</li>
            </ul>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">2.4 Data from Third-Party Integrations</h3>
            <p>If you connect third-party services (e.g., CRM platforms, scheduling tools, or social media accounts), we may receive information from those services as authorized by you. This data is governed by the respective third party&apos;s privacy policy as well as this Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. Why We Access Your Google Business Profile Data</h2>
            <p className="mb-3">We access GBP Data strictly for the purpose of providing our Services to you. Every data access is purposeful, limited, and tied to a specific functional need.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">3.1 Core Platform Functionality</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Listing Management:</strong> To display your GBP listing details within the Tribly dashboard, enabling you to view, edit, and update your business information from a single interface.</li>
              <li><strong>Review Management:</strong> To retrieve and display all customer reviews so you can monitor, respond to, and analyze feedback. We access review content to enable AI-generated response suggestions and response scheduling.</li>
              <li><strong>Post Scheduling and Publishing:</strong> To access your existing posts and publish new posts, offers, events, or product updates to your GBP listing on your behalf at scheduled times.</li>
              <li><strong>Q&A Management:</strong> To fetch questions on your listing and help you draft, schedule, and publish answers efficiently.</li>
              <li><strong>Photo Management:</strong> To display, organize, and upload photos to your GBP listing as directed by you.</li>
            </ul>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">3.2 Analytics and Reporting</h3>
            <p className="text-sm">Performance Insights; Competitive Benchmarking (using aggregated, anonymized data); Trend Analysis.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">3.3 AI-Powered Features</h3>
            <p className="text-sm">Listing Optimization Suggestions; Content Recommendations.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">3.4 Multi-Location Management</h3>
            <p className="text-sm">For users managing multiple GBP listings, we access data across all authorized locations to provide unified dashboards, bulk editing capabilities, and consolidated reporting.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">3.5 Service Improvement and Quality Assurance</h3>
            <p className="text-sm">We may use de-identified and aggregated GBP Data to improve the reliability, performance, and accuracy of our platform features. Individual-level GBP Data is never shared with third parties for these purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. How We Store Your Google Business Profile Data</h2>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">4.1 Infrastructure and Location</h3>
            <p className="text-sm">All GBP Data and Personal Data collected by Tribly.ai is stored on secure cloud infrastructure hosted by Amazon Web Services (AWS) or Google Cloud Platform (GCP). Our primary data centers are located within the United States.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">4.2 Data Encryption</h3>
            <p className="text-sm"><strong>In Transit:</strong> All data transmitted between your browser, our servers, and Google&apos;s APIs is encrypted using TLS 1.2 or higher. We enforce HTTPS across all endpoints.</p>
            <p className="text-sm"><strong>At Rest:</strong> All stored data, including GBP Data, is encrypted at rest using AES-256 encryption. Database backups are encrypted using the same standard.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">4.3 Data Segregation and Access Controls</h3>
            <p className="text-sm">GBP Data is stored in logically segregated environments. Access is restricted to authenticated users, authorized Tribly personnel with RBAC, and our AI processing pipeline. We enforce the principle of least privilege.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">4.4 Data Caching and Sync</h3>
            <p className="text-sm">Some GBP Data may be cached and synchronized with Google&apos;s live data on a configurable basis (typically every 24 hours or in real time based on webhooks). You may trigger a manual sync at any time through the dashboard.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">4.5 Retention Periods</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Active Account Data:</strong> Retained for the duration of your active account plus 30 days after account closure.</li>
              <li><strong>Cached GBP Data:</strong> Upon account deletion, all cached data is purged within 30 days.</li>
              <li><strong>Performance Analytics and Reports:</strong> Up to 24 months from the date of generation.</li>
              <li><strong>Audit Logs:</strong> Up to 12 months.</li>
              <li><strong>Backup Systems:</strong> Encrypted backups may retain your data for up to 90 days post-deletion.</li>
            </ul>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">4.6 Third-Party Sub-Processors</h3>
            <p className="text-sm">We engage trusted sub-processors (e.g., AWS, GCP, OpenAI/Anthropic for AI processing). All are bound by data processing agreements. A current list is available upon request by emailing <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a>.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">4.7 Security Practices</h3>
            <p className="text-sm">Access monitoring; annual third-party penetration testing; documented incident response (notification within 72 hours of discovery where required); employee privacy and security training.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">5. How You Can Delete Your Data</h2>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">5.1 Disconnecting Your Google Business Profile</h3>
            <p className="text-sm">You may disconnect your GBP account from Tribly at any time by emailing us at <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a>. Upon disconnection, Tribly will immediately cease accessing new GBP Data. Existing cached GBP Data will be permanently purged from our active systems within 30 days. This action does not delete data from your Google Business Profile itself.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">5.2 Deleting Specific Data</h3>
            <p className="text-sm">You may request deletion of specific categories (review response history, scheduled posts, analytics/reporting data, AI interaction logs) by contacting <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a>.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">5.3 Deleting Your Account</h3>
            <p className="text-sm">Request account deletion by emailing <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a> from your registered email address. We will process your request within 10 business days.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">5.4 What Happens After Deletion</h3>
            <p className="text-sm">All GBP Data cached in our systems will be permanently deleted within 30 days. Your personal information will be removed from all active databases within 30 days. Encrypted backups will be purged on a rolling cycle within 90 days. We will retain only the minimum data required by law.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">5.5 Revoking Google Authorization</h3>
            <p className="text-sm">You may revoke Tribly&apos;s access at any time via Google Account → Security → Third-party apps with account access → Tribly → Remove Access. We will treat this as a disconnection request and begin the data deletion process in Section 5.1.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">5.6 Exercising Your Right to Erasure (GDPR / CCPA)</h3>
            <p className="text-sm">Submit a verifiable request to <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a>. We will respond within 30 days (GDPR) or 45 days (CCPA), with the possibility of a single 30-day extension for complex requests.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">6. Legal Basis for Processing</h2>
            <p className="mb-2">We only process your data when we have a valid reason:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Your Consent:</strong> You have given us permission for a specific purpose (e.g., connecting your Google Business Profile or receiving marketing emails). You can withdraw this at any time.</li>
              <li><strong>To Deliver Our Services:</strong> We need to process certain data to provide the Services you signed up for.</li>
              <li><strong>Legal Compliance:</strong> When required by law or a government authority.</li>
              <li><strong>Legitimate Business Interests:</strong> To keep our platform secure, prevent fraud, and improve our Services — provided this does not override your rights.</li>
            </ul>
            <p className="text-sm mt-2">Contact <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a> with questions about why we process specific data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">7. Your Privacy Rights</h2>
            <p className="mb-2">Depending on your jurisdiction, you may have the following rights. We honor these for all users:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Right to Access:</strong> Request a copy of your personal data and GBP Data in a portable, machine-readable format.</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete personal data.</li>
              <li><strong>Right to Erasure:</strong> Request permanent deletion (see Section 5).</li>
              <li><strong>Right to Restriction:</strong> Request that we limit processing in certain circumstances.</li>
              <li><strong>Right to Data Portability:</strong> Request an export in a structured, machine-readable format (e.g., JSON or CSV).</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or for direct marketing.</li>
              <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, you may withdraw it at any time.</li>
              <li><strong>Right to Lodge a Complaint:</strong> With your supervisory authority (e.g., national DPA, ICO, California Attorney General).</li>
            </ul>
            <p className="text-sm mt-2">To exercise any of these rights, contact <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a>. We will respond within the timeframes required by applicable law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">8. Disclosure of Information</h2>
            <p className="mb-2">We do not sell, rent, or trade your personal data or GBP Data to third parties for commercial purposes. We may share your information only in these circumstances:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Service Delivery:</strong> With sub-processors (Section 4.6) strictly to provide our Services.</li>
              <li><strong>Legal Compliance:</strong> When required by law, court order, or governmental authority.</li>
              <li><strong>Protection of Rights:</strong> To protect the rights, safety, or property of Tribly, our users, or the public.</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets. We will notify you and provide an opt-out if your data will be subject to a different privacy policy.</li>
              <li><strong>With Your Consent:</strong> In any other circumstance with your explicit prior consent.</li>
            </ul>
            <p className="text-sm mt-2">We require all third parties to provide equivalent data protection through contractual data processing agreements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">9. Cookies and Tracking Technologies</h2>
            <p className="mb-2">We use cookies and similar technologies for operation, preferences, and analytics:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>Strictly Necessary Cookies:</strong> Required for the Platform to operate (e.g., session authentication, security tokens). These cannot be disabled.</li>
              <li><strong>Functional Cookies:</strong> Language preferences, dashboard layouts, saved filters.</li>
              <li><strong>Analytics Cookies:</strong> To understand how users interact with the Platform (e.g., Google Analytics with IP anonymization).</li>
              <li><strong>Marketing Cookies:</strong> Used only with your consent for relevant advertisements and campaign measurement.</li>
            </ul>
            <p className="text-sm mt-2">You may manage cookie preferences through your browser or our Cookie Preference Center at <a href="https://tribly.ai/cookies" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">tribly.ai/cookies</a>. Disabling strictly necessary cookies may impair Platform functionality.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">10. Children&apos;s Privacy</h2>
            <p>The Services are not directed to individuals under the age of 16. We do not knowingly collect personal data from children. If we become aware that a child under 16 has provided personal data, we will delete such data promptly. Contact <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a> if you believe we have collected data from a child.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">11. International Data Transfers</h2>
            <p>Your data may be transferred to and processed in countries other than your country of residence, including the United States. Where such transfers involve personal data of EEA or UK residents, we implement appropriate safeguards including Standard Contractual Clauses (SCCs) approved by the European Commission, or rely on adequacy decisions where applicable.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">12. Third-Party Links and Services</h2>
            <p>Our Platform may contain links to third-party websites, tools, or services. We are not responsible for their privacy practices. Your use of Google APIs (including GBP API) is also subject to Google&apos;s Privacy Policy at <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://policies.google.com/privacy</a>. Tribly&apos;s use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">13. Data Breach Notification</h2>
            <p>In the event of a personal data breach, we will notify affected users via their registered email within 72 hours of becoming aware of the breach (or as soon as reasonably practicable), and provide details of the nature of the breach, categories of data affected, likely consequences, and remedial actions taken. We maintain documented incident response procedures and conduct regular breach preparedness exercises.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">14. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. When we make material changes, we will post the updated policy on our website with a new effective date and send an email to users who may be materially affected. Your continued use of the Services after the effective date of the revised Privacy Policy constitutes your acceptance of the changes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">15. Contact Information and Grievance Officer</h2>
            <p className="mb-2">For questions, concerns, or requests regarding this Privacy Policy or our data practices:</p>
            <p className="text-sm">
              <strong>Privacy Team – Tribly Tech Pvt Ltd.</strong><br />
              Email: <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a><br />
              Phone: +91 9010640909<br />
              Website: <a href="https://qr.tribly.ai/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://qr.tribly.ai/privacy-policy</a>
            </p>
            <p className="text-sm mt-2">We will acknowledge all privacy inquiries within 5 business days and resolve substantive requests within 30 days.</p>
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
