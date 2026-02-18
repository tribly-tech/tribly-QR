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
          ← Back
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Tribly Tech Pvt Ltd — Terms &amp; Conditions
        </h1>
        <p className="mt-1 text-sm font-medium text-foreground">
          Software-as-a-Service Agreement
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Effective Date: February 18, 2026 · Version 1.0
        </p>
        <div className="mt-10 space-y-8 text-foreground/90 prose prose-slate dark:prose-invert max-w-none [&_strong]:font-semibold">
          <p>
            These Terms and Conditions (hereinafter &quot;Terms&quot; or &quot;Agreement&quot;) constitute a legally binding contract between Tribly Tech Private Limited, a company incorporated under the Companies Act, 2013, with its registered office in India (hereinafter &quot;Tribly,&quot; &quot;Company,&quot; &quot;We,&quot; &quot;Us,&quot; or &quot;Our&quot;) and you, the individual, business entity, or organisation accessing or using the Platform and Services (hereinafter &quot;You,&quot; &quot;Your,&quot; or &quot;User&quot;).
          </p>
          <p>
            These Terms govern your access to and use of the Tribly.ai website, web application, mobile applications, APIs, dashboards, and all related tools and software (collectively, the &quot;Platform&quot;) and the services offered through the Platform (collectively, the &quot;Services&quot;), including but not limited to Google Business Profile management, review management, listing optimization, AI-powered tools, analytics, and multi-location management.
          </p>
          <p>
            Please read these Terms carefully before accessing or using the Platform. By registering an account, clicking &quot;I Agree,&quot; or by accessing or using any part of the Services, You acknowledge that You have read, understood, and agree to be bound by these Terms and Our Privacy Policy. If You do not agree to these Terms, You must immediately cease all access to and use of the Platform.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. Definitions</h2>
            <p className="mb-3">For the purpose of this Agreement, the following terms shall have the meanings assigned to them below:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li><strong>&quot;Account&quot;</strong> means the account created by the User on the Platform to access and use the Services.</li>
              <li><strong>&quot;Affiliate&quot;</strong> means any entity that directly or indirectly controls, is controlled by, or is under common control with Tribly.</li>
              <li><strong>&quot;Authorized User&quot;</strong> means any employee, contractor, or agent of the User who is permitted to access and use the Services under the User&apos;s Account.</li>
              <li><strong>&quot;Confidential Information&quot;</strong> means any non-public information disclosed by either party to the other, either directly or indirectly, in writing, orally, or by inspection of tangible objects, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.</li>
              <li><strong>&quot;Content&quot;</strong> means all information, data, text, images, photos, videos, posts, reviews, and other materials that Users upload, submit, or transmit through the Platform.</li>
              <li><strong>&quot;GBP Data&quot;</strong> means data accessed from a User&apos;s Google Business Profile via authorised Google APIs, including but not limited to listing information, reviews, photos, posts, Q&A, and performance insights.</li>
              <li><strong>&quot;Intellectual Property Rights&quot;</strong> means all patents, copyrights, trademarks, trade secrets, moral rights, design rights, database rights, and all other proprietary rights, whether registered or unregistered, subsisting anywhere in the world.</li>
              <li><strong>&quot;Service Plan&quot;</strong> means the subscription plan selected by the User, which determines the features, usage limits, and pricing applicable to the Services.</li>
              <li><strong>&quot;Subscription Fees&quot;</strong> means the fees payable by the User in exchange for access to the Services under a Service Plan.</li>
              <li><strong>&quot;Third-Party Services&quot;</strong> means any services, applications, or platforms provided by entities other than Tribly, including Google APIs and third-party integrations.</li>
              <li><strong>&quot;User Data&quot;</strong> means all data, information, and Content provided by the User through the Platform, including GBP Data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. Acceptance and Eligibility</h2>
            <p>By accessing or using the Platform, You represent and warrant that You are at least 18 years of age, have the legal capacity to enter into a binding contract, and are not barred from receiving the Services under applicable law.</p>
            <p>If You are accepting these Terms on behalf of a company, organisation, or other legal entity, You represent and warrant that You have the authority to bind such entity to these Terms. In that case, &quot;You&quot; and &quot;Your&quot; shall refer to such entity.</p>
            <p>You must provide accurate, complete, and current information during registration and must promptly update such information if it changes. Providing false or misleading information constitutes grounds for immediate account termination.</p>
            <p>The Services are intended solely for business use. You may not use the Services for personal, household, or consumer purposes unrelated to your business operations.</p>
            <p>Tribly reserves the right to refuse access to or use of the Platform to any person or entity at its sole discretion, including in jurisdictions where such access is prohibited by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. Account Registration and Security</h2>
            <p>To access certain features of the Services, You must create an Account by providing a valid email address, business details, and any other information required during the registration process.</p>
            <p>You are solely responsible for maintaining the confidentiality of your login credentials, including your username and password. You agree to notify Tribly immediately at <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a> upon becoming aware of any actual or suspected unauthorized access to your Account.</p>
            <p>You are fully responsible for all activities that occur under your Account, whether or not You have authorized such activities. Tribly shall not be liable for any loss or damage arising from your failure to safeguard your credentials.</p>
            <p>You must not share your Account credentials with any person who is not an Authorized User. Sharing access with unauthorised third parties constitutes a material breach of these Terms.</p>
            <p>Tribly reserves the right to suspend or terminate any Account that it reasonably suspects has been compromised, used fraudulently, or is in violation of these Terms.</p>
            <p>For multi-user accounts, the Account administrator is responsible for managing access permissions for all Authorized Users and ensuring their compliance with these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. SaaS Services and License Grant</h2>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">4.1 License Grant</h3>
            <p>Subject to your compliance with these Terms and timely payment of all applicable Subscription Fees, Tribly hereby grants You a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Platform and Services solely for your internal business purposes during the applicable Subscription Term.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">4.2 Scope of Services</h3>
            <p className="mb-2">The Services provided by Tribly include the following, subject to the features available under your selected Service Plan:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Google Business Profile (GBP) management, including editing listing information, managing reviews, scheduling posts, and Q&A management.</li>
              <li>AI-powered content generation and growth suggestions.</li>
              <li>Performance analytics and insights reporting for GBP listings.</li>
              <li>Multi-location management for businesses with multiple GBP listings.</li>
              <li>Photo and media management for GBP listings.</li>
              <li>Listing optimization recommendations and local SEO tools.</li>
              <li>Integration with third-party platforms and tools as made available from time to time.</li>
            </ul>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">4.3 Restrictions on Use</h3>
            <p className="mb-2">Except as expressly permitted under these Terms, You must not, and must not permit any Authorized User or third party to:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Copy, modify, create derivative works of, distribute, sell, sublicense, or otherwise transfer or exploit the Services or any part thereof.</li>
              <li>Reverse engineer, decompile, disassemble, decode, or otherwise attempt to derive or access the source code, algorithms, or underlying structure of the Platform.</li>
              <li>Use the Services to build or support a competing product or service, or for any benchmarking or competitive intelligence purpose.</li>
              <li>Access the Services through automated means, bots, scripts, crawlers, or any mechanism other than through the interfaces expressly provided by Tribly, unless Tribly has granted explicit written permission.</li>
              <li>Remove, alter, or obscure any proprietary notices, trademarks, or labels on the Platform or any part of the Services.</li>
              <li>Use the Services to transmit any malware, viruses, spyware, adware, or any other malicious software or code.</li>
              <li>Circumvent or attempt to circumvent any usage limits, access controls, rate limits, or security measures implemented by Tribly.</li>
              <li>Frame, mirror, or scrape the Platform or its content without Tribly&apos;s prior written consent.</li>
              <li>Use the Services in any manner that violates applicable laws, regulations, or third-party rights, including Google&apos;s Terms of Service and API policies.</li>
            </ul>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">4.4 Service Availability</h3>
            <p>Tribly will use commercially reasonable efforts to make the Services available 99% of the time in any given calendar month, excluding scheduled maintenance, emergency maintenance, and any unavailability caused by circumstances beyond Tribly&apos;s reasonable control. Tribly will endeavour to provide advance notice of scheduled maintenance windows wherever practicable.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">5. Google Business Profile Integration</h2>
            <p>The Services rely on integration with Google&apos;s Business Profile API and related Google APIs. By using Tribly, You authorize Tribly to access, retrieve, process, and manage your GBP Data on your behalf through Google&apos;s official OAuth 2.0 authorization framework.</p>
            <p>Your use of the Google integration is additionally subject to Google&apos;s Terms of Service, Google API Services User Data Policy, and Google&apos;s Privacy Policy. Tribly&apos;s use of data received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.</p>
            <p>You represent and warrant that You have the legal right and authority to authorize Tribly to access and manage your GBP listing(s) and that doing so does not violate any agreement You have with Google or any other party.</p>
            <p>Tribly does not guarantee the availability, accuracy, or completeness of GBP Data, as such data is sourced directly from Google&apos;s systems. Any changes, restrictions, or disruptions to Google&apos;s APIs may affect the availability or functionality of certain Services.</p>
            <p>You may revoke Tribly&apos;s access to your Google Account at any time through your Google Account settings. Revocation will not delete data already stored by Tribly; to request data deletion, refer to Section 12 of our Privacy Policy.</p>
            <p>Tribly acts solely as a data processor with respect to your GBP Data, processing it only on your instructions and for the purposes described in our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">6. Subscription, Fees, and Payment</h2>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">6.1 Service Plans and Subscription Fees</h3>
            <p>Access to the Services is provided on a subscription basis. The features available to You, the usage limits applicable, and the Subscription Fees payable are determined by the Service Plan selected by You at the time of registration or upgrade. Current pricing is available at tribly.ai/pricing and may be updated from time to time.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">6.2 Billing and Payment Terms</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Subscription Fees are billed in advance on a monthly or annual basis, as selected by You.</li>
              <li>All Subscription Fees are due and payable on the date of billing. Failure to pay on time may result in suspension of your Account.</li>
              <li>Fees are exclusive of all applicable taxes, including Goods and Services Tax (GST) and any other taxes required by law. You are responsible for paying all such taxes.</li>
              <li>Payment must be made through the payment methods made available on the Platform. By providing payment information, You authorize Tribly to charge the applicable fees to your designated payment method on a recurring basis.</li>
              <li>Tribly reserves the right to modify Subscription Fees with at least 30 days&apos; prior written notice. Continued use of the Services after the effective date of the fee change constitutes acceptance of the revised fees.</li>
            </ul>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">6.3 Free Trials</h3>
            <p>Tribly may, at its sole discretion, offer a free trial period for new users. At the end of the free trial, You will be required to subscribe to a paid Service Plan to continue using the Services. Tribly reserves the right to modify or terminate free trial offers at any time without notice.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">6.4 Refund Policy</h3>
            <p>All Subscription Fees paid are non-refundable, except as required by applicable law. No refunds or credits will be issued for partial subscription periods, unused features, or for periods during which Services are temporarily unavailable due to circumstances beyond Tribly&apos;s reasonable control. If You believe You have been charged in error, please contact <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a> within 14 days of the charge.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">6.5 Suspension for Non-Payment</h3>
            <p>If any payment due under these Terms remains unpaid for more than 7 days after the due date, Tribly reserves the right to suspend access to the Services until all outstanding amounts are settled. Tribly will provide written notice before suspension wherever practicable.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">7. User Content and Responsibilities</h2>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">7.1 User Content Ownership</h3>
            <p>You retain all ownership rights to Content that You upload, submit, or create through the Platform. By submitting Content, You grant Tribly a worldwide, non-exclusive, royalty-free license to use, store, display, reproduce, and process your Content solely to the extent necessary to provide and improve the Services.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">7.2 Content Standards</h3>
            <p className="mb-2">You are solely responsible for all Content You submit through the Platform and for ensuring that such Content:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Is accurate, complete, and not misleading.</li>
              <li>Does not infringe the Intellectual Property Rights, privacy rights, or any other rights of any third party.</li>
              <li>Is not defamatory, obscene, harassing, hateful, discriminatory, or otherwise unlawful.</li>
              <li>Does not contain malware, viruses, or any code designed to harm or interfere with any system.</li>
              <li>Complies with all applicable laws and regulations, including advertising standards, consumer protection laws, and data protection laws.</li>
            </ul>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">7.3 User Representations</h3>
            <p>You represent and warrant that You have all necessary rights, licenses, and permissions to submit Content through the Platform and to grant Tribly the license described above.</p>
            <p>You acknowledge that Tribly does not verify or endorse any Content submitted by Users and is not responsible for the accuracy, completeness, or legality of such Content.</p>
            <p>Tribly reserves the right to remove any Content that it determines, in its sole discretion, violates these Terms or is otherwise objectionable, without prior notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">8. Intellectual Property</h2>
            <p>The Platform, including all software, algorithms, design, layout, look and feel, source code, object code, documentation, trademarks, service marks, logos, and all other Intellectual Property Rights therein, is the exclusive property of Tribly Tech Private Limited or its licensors. All rights not expressly granted to You under these Terms are reserved by Tribly.</p>
            <p>Tribly&apos;s name, logo, and product names are registered or unregistered trademarks of Tribly Tech Private Limited. You are not granted any right or license to use Tribly&apos;s trademarks without prior written consent.</p>
            <p>You must not use, copy, modify, reproduce, distribute, or create derivative works of any part of the Platform or its content outside the scope of the license expressly granted under Section 4.1.</p>
            <p>Any feedback, suggestions, improvements, or other input You provide regarding the Services may be freely used by Tribly without any obligation, compensation, or attribution to You. Such input shall be considered non-confidential and non-proprietary.</p>
            <p>Unauthorized use of Tribly&apos;s Intellectual Property will constitute a material breach of these Terms and may give rise to civil and criminal liability.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">9. Confidentiality</h2>
            <p>Each party agrees to keep confidential all Confidential Information of the other party and to use such Confidential Information only for purposes of performing its obligations or exercising its rights under these Terms.</p>
            <p>Each party agrees to protect the other&apos;s Confidential Information with at least the same degree of care it uses to protect its own confidential information, but no less than reasonable care.</p>
            <p>Confidential Information does not include information that: (a) is or becomes publicly available through no fault of the receiving party; (b) was rightfully known to the receiving party before disclosure; (c) is independently developed by the receiving party without reference to the disclosing party&apos;s Confidential Information; or (d) is required to be disclosed by law or court order, provided the receiving party gives the disclosing party prompt written notice.</p>
            <p>The obligations of confidentiality shall survive the termination or expiry of these Terms for a period of 3 years.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">10. Data Protection and Privacy</h2>
            <p>Tribly processes User Data and GBP Data in accordance with its Privacy Policy, which is incorporated into these Terms by reference and is available at <a href="https://tribly.ai/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">tribly.ai/privacy-policy</a>.</p>
            <p>To the extent that Tribly processes personal data on behalf of the User as a data processor, such processing shall be governed by Tribly&apos;s Data Processing Agreement (DPA), which can be requested by contacting <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a>.</p>
            <p>Tribly implements appropriate technical and organisational measures to protect User Data against unauthorised access, disclosure, loss, or destruction, as further described in its Privacy Policy.</p>
            <p>You are responsible for ensuring that your use of the Services and your submission of User Data complies with all applicable data protection laws, including the Digital Personal Data Protection Act, 2023 (DPDP Act) and any regulations made thereunder.</p>
            <p>In the event of a personal data breach affecting your data, Tribly will notify You in accordance with its obligations under applicable law and as described in its Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">11. Third-Party Services and Integrations</h2>
            <p>The Platform may integrate with or provide links to Third-Party Services, including Google APIs, payment gateways, CRM tools, and other business applications. Tribly does not control and is not responsible for the content, functionality, privacy practices, or availability of any Third-Party Services.</p>
            <p>Your use of Third-Party Services is governed solely by the terms and conditions and privacy policies of those third parties. Tribly makes no representations or warranties regarding any Third-Party Services.</p>
            <p>If any Third-Party Service modifies, restricts, or discontinues its APIs or integration capabilities, this may affect the availability or functionality of certain features within the Platform. Tribly will use commercially reasonable efforts to address such disruptions but cannot guarantee continuity of third-party integrations.</p>
            <p>Tribly will not be liable for any loss, damage, or disruption arising from your use of or reliance on any Third-Party Service or integration.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">12. Prohibited Activities</h2>
            <p className="mb-2">In addition to the restrictions set out in Section 4.3, You agree that You will not, and will not permit any Authorized User or third party to, engage in any of the following prohibited activities:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Impersonate any individual or entity, or falsely represent your affiliation with any person or organisation.</li>
              <li>Use the Platform to transmit unsolicited commercial communications, spam, or phishing materials.</li>
              <li>Attempt to gain unauthorized access to any portion of the Platform, other user accounts, or Tribly&apos;s systems or networks.</li>
              <li>Engage in any activity that disrupts, degrades, or impairs the performance of the Platform or the experience of other users.</li>
              <li>Upload, transmit, or distribute any Content that infringes the rights of any third party or violates any applicable law.</li>
              <li>Use the Services to engage in any fraudulent, deceptive, or illegal activity, including misrepresenting your business or its listings.</li>
              <li>Attempt to probe, scan, or test the vulnerability of the Platform or breach any security or authentication measures.</li>
              <li>Collect or harvest any personally identifiable information from the Platform without the express consent of the individuals concerned.</li>
              <li>Use the Services in any way that could expose Tribly to civil or criminal liability.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">13. Term and Termination</h2>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">13.1 Term</h3>
            <p>These Terms commence on the date You first access or use the Platform and continue for the duration of your active Subscription Term, including any renewal periods, unless terminated earlier in accordance with this Section.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">13.2 Termination by User</h3>
            <p>You may cancel your subscription at any time by logging into your Account and following the cancellation instructions, or by emailing <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a>. Cancellation will take effect at the end of the then-current billing period. No refunds will be issued for any remaining portion of the prepaid Subscription Term.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">13.3 Termination by Tribly</h3>
            <p className="mb-2">Tribly may suspend or terminate your Account and access to the Services, with or without notice, in any of the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>You materially breach any provision of these Terms and fail to remedy such breach within 14 days of written notice (where the breach is capable of remedy).</li>
              <li>You engage in any prohibited activity described in these Terms.</li>
              <li>You fail to pay any Subscription Fees when due and do not remedy such failure within 7 days of notice.</li>
              <li>Tribly is required to do so by applicable law, court order, or governmental authority.</li>
              <li>Tribly decides, in its sole discretion, to discontinue the Services or any part thereof.</li>
            </ul>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">13.4 Effect of Termination</h3>
            <p>Upon termination, your license to use the Services will immediately cease, and You will lose access to your Account and all associated data.</p>
            <p>You remain liable for all Subscription Fees and other charges accrued up to the effective date of termination.</p>
            <p>Tribly will retain your data for 30 days following termination to allow You to export it. After 30 days, all User Data will be permanently deleted in accordance with the Privacy Policy.</p>
            <p>Provisions of these Terms that by their nature should survive termination will do so, including Sections 8 (Intellectual Property), 9 (Confidentiality), 14 (Disclaimers), 15 (Limitation of Liability), and 16 (Governing Law).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">14. Disclaimers</h2>
            <p className="uppercase text-sm font-semibold mb-2">The Services are provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranty of any kind. To the fullest extent permitted by applicable law, Tribly expressly disclaims all warranties, whether express, implied, statutory, or otherwise, including but not limited to:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Any implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement.</li>
              <li>Any warranties that the Services will be uninterrupted, error-free, secure, or free from viruses or other harmful components.</li>
              <li>Any warranties regarding the accuracy, reliability, completeness, or timeliness of any content, data, or information provided through the Services, including GBP Data sourced from Google.</li>
              <li>Any warranties that the Services will meet your specific requirements or that results obtained through the Services will be accurate or reliable.</li>
            </ul>
            <p>Tribly does not warrant or guarantee any specific results from the use of the Services, including improvements in search rankings, review ratings, or business performance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">15. Limitation of Liability</h2>
            <p>To the fullest extent permitted by applicable law, Tribly, its directors, officers, employees, affiliates, agents, and licensors shall not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, including but not limited to loss of profits, loss of revenue, loss of data, loss of goodwill, or business interruption, arising out of or in connection with your use of or inability to use the Services, even if Tribly has been advised of the possibility of such damages.</p>
            <p>In no event shall Tribly&apos;s total cumulative liability to You for all claims arising out of or related to these Terms or the Services exceed the total Subscription Fees paid by You to Tribly in the 3 months immediately preceding the event giving rise to the claim.</p>
            <p>The limitations in this Section apply regardless of the theory of liability — whether in contract, tort (including negligence), strict liability, or otherwise — and regardless of whether Tribly has been advised of the possibility of such damages.</p>
            <p>Some jurisdictions do not allow the exclusion or limitation of liability for certain types of damages. In such jurisdictions, Tribly&apos;s liability shall be limited to the maximum extent permitted by applicable law.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">16. Indemnification</h2>
            <p>You agree to defend, indemnify, and hold harmless Tribly, its Affiliates, directors, officers, employees, agents, licensors, and service providers from and against any and all claims, liabilities, damages, judgments, awards, losses, costs, expenses, and fees (including reasonable legal fees) arising out of or relating to:</p>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Your violation of these Terms or any applicable law or regulation.</li>
              <li>Your Content or User Data and any claims that such Content infringes the rights of any third party.</li>
              <li>Your use of the Services or the Platform.</li>
              <li>Your breach of any representation or warranty made under these Terms.</li>
              <li>Any misuse of your Account by You or any Authorized User.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">17. Modifications to Services and Terms</h2>
            <p>Tribly reserves the right to modify, update, or discontinue any feature or aspect of the Services at any time, with or without notice. Material changes that significantly affect your use of the Services will be communicated with reasonable advance notice.</p>
            <p>Tribly may revise these Terms at any time by posting an updated version on the Platform. The updated Terms will be effective from the date of posting. Your continued use of the Services after the effective date of any revision constitutes your acceptance of the revised Terms.</p>
            <p>If any modification to the Terms materially and adversely affects your rights, You may terminate your subscription within 30 days of receiving notice of such modification, and Tribly will provide a pro-rata refund of any prepaid Subscription Fees for the remaining unused period.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">18. Force Majeure</h2>
            <p>Tribly shall not be liable for any failure or delay in performing its obligations under these Terms to the extent that such failure or delay is caused by events beyond Tribly&apos;s reasonable control, including acts of God, natural disasters, war, terrorism, riots, government actions, internet or telecommunications failures, pandemics, or changes in applicable law. Tribly will use commercially reasonable efforts to minimize the impact of any such event and resume performance as soon as practicable.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">19. Governing Law and Dispute Resolution</h2>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">19.1 Governing Law</h3>
            <p>These Terms and any dispute or claim arising out of or in connection with them or their subject matter or formation (including non-contractual disputes or claims) shall be governed by and construed in accordance with the laws of India, without regard to its conflict of laws principles.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">19.2 Jurisdiction</h3>
            <p>Subject to the arbitration clause below, you irrevocably submit to the exclusive jurisdiction of the courts located in Visakhapatnam, Andhra Pradesh, India, for the resolution of any disputes arising out of or in connection with these Terms.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">19.3 Arbitration</h3>
            <p>Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or invalidity thereof, shall be settled by arbitration in accordance with the Arbitration and Conciliation Act, 1996 (as amended). The arbitration shall be conducted by a sole arbitrator mutually agreed upon by the parties, or failing agreement, appointed in accordance with the Act. The seat of arbitration shall be Visakhapatnam, India. The language of arbitration shall be English. The award rendered by the arbitrator shall be final and binding on the parties.</p>
            <h3 className="text-lg font-medium text-foreground mt-6 mb-2">19.4 Informal Resolution</h3>
            <p>Before initiating formal dispute resolution proceedings, both parties agree to first attempt to resolve any dispute informally by contacting <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a>. Tribly will endeavour to respond within 15 business days. This informal process is a prerequisite to arbitration or litigation.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">20. General Provisions</h2>
            <p><strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy and any applicable Service Plan documentation, constitute the entire agreement between You and Tribly with respect to the subject matter hereof and supersede all prior negotiations, representations, warranties, and understandings.</p>
            <p><strong>Severability:</strong> If any provision of these Terms is found to be invalid, illegal, or unenforceable under applicable law, such provision shall be modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall continue in full force and effect.</p>
            <p><strong>Waiver:</strong> No failure or delay by either party in exercising any right under these Terms shall constitute a waiver of that right. No waiver shall be effective unless made in writing and signed by an authorized representative of the waiving party.</p>
            <p><strong>Assignment:</strong> You may not assign or transfer any of your rights or obligations under these Terms without Tribly&apos;s prior written consent. Tribly may freely assign these Terms to any Affiliate or in connection with a merger, acquisition, or sale of substantially all of its assets.</p>
            <p><strong>Notices:</strong> All legal notices under these Terms shall be sent to <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a> (for notices to Tribly) and to the email address associated with your Account (for notices to You). Notices shall be deemed received on the day they are sent.</p>
            <p><strong>No Partnership:</strong> Nothing in these Terms creates any partnership, joint venture, agency, franchise, or employment relationship between You and Tribly.</p>
            <p><strong>Headings:</strong> Section headings in these Terms are for convenience only and shall not affect the interpretation of any provision.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">21. Grievance Officer</h2>
            <p>In accordance with the Information Technology Act, 2000 and the rules made thereunder, Tribly has appointed a Grievance Officer to address any complaints or concerns regarding the use of the Platform or the Services:</p>
            <p className="text-sm mt-4">
              <strong>Name:</strong> Grievance Officer, Tribly Tech Pvt Ltd<br />
              <strong>Email:</strong> <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a><br />
              <strong>Registered Office:</strong> 6-108/8/1/1A, SAMPATH, VINAYAKA NAGAR NEAR DUVVAD, RAILWAY STATION, DUVVADA, Visakhapatnam Andhra Pradesh 530046, India<br />
              <strong>Working Hours:</strong> Monday to Friday, 10:00 AM – 6:00 PM IST (excluding public holidays)
            </p>
            <p>Tribly will acknowledge all grievances within 48 hours and endeavour to resolve substantive complaints within 30 days of receipt.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">22. Contact Us</h2>
            <p>For any questions, concerns, or requests relating to these Terms, please contact:</p>
            <p className="text-sm mt-2">
              <strong>Tribly Tech Private Limited</strong><br />
              Email: <a href="mailto:connect@tribly.ai" className="text-primary hover:underline">connect@tribly.ai</a><br />
              Phone: +91 9010640909<br />
              Website: <a href="https://tribly.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://tribly.ai</a>
            </p>
          </section>

          <p className="mt-10 text-sm text-muted-foreground">
            © 2026 Tribly Tech Private Limited. All rights reserved.
          </p>
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
