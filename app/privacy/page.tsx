import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
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
            <h1 className="font-serif text-4xl md:text-6xl mb-6">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-8 prose prose-neutral max-w-none">
            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                At Dat3Night, we take your privacy seriously. This Privacy Policy explains how we 
                collect, use, and protect your information when you use our service.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Personal Information</h3>
                  <p className="text-muted-foreground">
                    When you create an account, we collect information such as your name, email address, 
                    and other details you provide.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Usage Data</h3>
                  <p className="text-muted-foreground">
                    We collect information about how you use our service, including features you use, 
                    time spent, and interactions with content.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Preferences</h3>
                  <p className="text-muted-foreground">
                    We store your date preferences, saved venues, and planning history to provide 
                    personalized recommendations.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>To provide and maintain our service</li>
                <li>To personalize your experience and recommendations</li>
                <li>To improve our features and functionality</li>
                <li>To communicate with you about your account</li>
                <li>To ensure the security and integrity of our platform</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Data Protection</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate security measures to protect your information from unauthorized 
                access, alteration, disclosure, or destruction. Your data is encrypted and stored 
                securely.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may use third-party services for analytics, authentication, and other functionality. 
                These services have their own privacy policies and we are not responsible for their practices.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to access, update, or delete your personal information at any time. 
                You can also request a copy of your data or deactivate your account.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy or how we handle your data, please 
                contact us at privacy@dat3night.app
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
