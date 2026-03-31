/* eslint-disable react/no-unescaped-entities */
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function AboutPage() {
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
            <h1 className="font-serif text-4xl md:text-6xl mb-6">About Dat3Night</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Your ultimate companion for planning unforgettable date experiences.
            </p>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                At Dat3Night, we believe every couple deserves amazing date experiences. 
                We're dedicated to helping you discover the best restaurants, activities, and venues 
                in your area, making date planning effortless and exciting.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">What We Do</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Discover Venues</h3>
                  <p className="text-muted-foreground">
                    Find romantic restaurants, cozy cafes, and unique spots perfect for your next date.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Plan Activities</h3>
                  <p className="text-muted-foreground">
                    Explore fun activities and experiences that will create lasting memories together.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Get Recommendations</h3>
                  <p className="text-muted-foreground">
                    Receive personalized suggestions based on your preferences and interests.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Save & Organize</h3>
                  <p className="text-muted-foreground">
                    Keep track of your favorite spots and plan future dates with ease.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-2xl md:text-3xl mb-4">Why Dat3Night?</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We understand that planning the perfect date can be challenging. That's why we created 
                Dat3Night - to simplify the process and help you focus on what matters most: spending 
                quality time together.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Whether you're looking for a romantic dinner spot, an exciting activity, or something 
                completely new, Dat3Night is here to help you discover and plan amazing experiences.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
