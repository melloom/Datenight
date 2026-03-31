/* eslint-disable react/no-unescaped-entities */
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="space-y-12">
          <div>
            <h1 className="font-serif text-4xl md:text-6xl mb-6">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-8 prose prose-neutral max-w-none">
            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By using Dat3Night, you agree to these Terms of Service. If you don't agree, 
                please don't use our service.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                Dat3Night is a date planning platform that helps couples discover venues, 
                plan activities, and organize memorable date experiences. We provide recommendations 
                and tools to make date planning easier and more enjoyable.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">User Accounts</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Account Creation</h3>
                  <p className="text-muted-foreground">
                    You must create an account to access certain features. You're responsible for 
                    maintaining the confidentiality of your account credentials.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Account Responsibilities</h3>
                  <p className="text-muted-foreground">
                    You agree to provide accurate information and keep your account information updated. 
                    You're responsible for all activity under your account.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree to use Dat3Night responsibly and not to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Use the service for illegal purposes</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Post false or misleading information</li>
                <li>Attempt to compromise the security of our platform</li>
                <li>Use automated tools to access the service</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Content and Recommendations</h2>
              <p className="text-muted-foreground leading-relaxed">
                We strive to provide accurate and helpful recommendations, but we cannot guarantee 
                the quality or availability of third-party venues and services. Always verify 
                information independently before making plans.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                Dat3Night and its content are owned by us or our licensors and are protected by 
                intellectual property laws. You may not use our content without permission.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Dat3Night is provided "as is" without warranties. We're not liable for damages 
                arising from your use of our service, including issues with third-party venues 
                or services.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Service Modifications</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify, suspend, or discontinue our service at any time. 
                We may also update these terms periodically.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate your account if you violate these terms. You can also close 
                your account at any time through your account settings.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about these Terms of Service, please contact us at 
                contact@mellowsites.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
