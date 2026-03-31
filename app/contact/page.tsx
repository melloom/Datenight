import Link from "next/link"
import { ArrowLeft, Mail, MessageSquare, MapPin, Sparkles } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="space-y-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Get in Touch
            </div>
            <h1 className="font-serif text-5xl md:text-7xl mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Contact Us
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              We'd love to hear from you. Whether you have questions, feedback, or just want to say hello.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="group text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Business Email</h3>
              <a href="mailto:contact@mellowsites.com" className="text-primary hover:text-primary/80 font-medium transition-colors">
                contact@mellowsites.com
              </a>
            </div>

            <div className="group text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Support</h3>
              <p className="text-muted-foreground">Available via email</p>
            </div>

            <div className="group text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Location</h3>
              <p className="text-muted-foreground">Remote First</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm rounded-3xl p-10 md:p-12 text-center border border-border/50 shadow-xl">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-serif text-3xl md:text-4xl mb-4">Ready to Connect?</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
              Have questions or need assistance? We'd love to hear from you.
            </p>
            <a
              href="mailto:contact@mellowsites.com"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold rounded-xl hover:from-primary/90 hover:to-primary/80 transition-all duration-300 text-lg shadow-lg hover:shadow-xl hover:shadow-primary/20 transform hover:-translate-y-0.5"
            >
              <Mail className="w-6 h-6" />
              contact@mellowsites.com
            </a>
            <p className="text-sm text-muted-foreground mt-6">
              We typically respond within 24 hours
            </p>
          </div>

          <div className="text-center">
            <h2 className="font-serif text-2xl md:text-3xl mb-4">Follow Us</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Stay updated with the latest features and date ideas
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="#"
                className="px-8 py-3 border border-border rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
              >
                Twitter
              </a>
              <a
                href="#"
                className="px-8 py-3 border border-border rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
              >
                Instagram
              </a>
              <a
                href="#"
                className="px-8 py-3 border border-border rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
