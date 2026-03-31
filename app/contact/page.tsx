import Link from "next/link"
import { ArrowLeft, Mail, MessageSquare, MapPin } from "lucide-react"

export default function ContactPage() {
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
            <h1 className="font-serif text-4xl md:text-6xl mb-6">Contact Us</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We'd love to hear from you. Whether you have questions, feedback, or just want to say hello.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Email</h3>
              <p className="text-muted-foreground">support@dat3night.app</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Support</h3>
              <p className="text-muted-foreground">help@dat3night.app</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Location</h3>
              <p className="text-muted-foreground">Remote First</p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-2xl p-8">
            <h2 className="font-serif text-2xl md:text-3xl mb-6">Get in Touch</h2>
            
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                  placeholder="How can we help?"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors resize-none"
                  placeholder="Tell us more..."
                />
              </div>
              
              <button
                type="submit"
                className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>

          <div className="text-center">
            <h2 className="font-serif text-xl mb-4">Follow Us</h2>
            <p className="text-muted-foreground mb-6">
              Stay updated with the latest features and date ideas
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="#"
                className="px-6 py-2 border border-border rounded-full text-sm font-medium hover:bg-background/80 transition-colors"
              >
                Twitter
              </a>
              <a
                href="#"
                className="px-6 py-2 border border-border rounded-full text-sm font-medium hover:bg-background/80 transition-colors"
              >
                Instagram
              </a>
              <a
                href="#"
                className="px-6 py-2 border border-border rounded-full text-sm font-medium hover:bg-background/80 transition-colors"
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
