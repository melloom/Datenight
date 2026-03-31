"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Sparkles, MapPin, Heart, Calendar, Users, Star, ChevronRight, Wine, Music, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export default function LandingPage() {
  const { user } = useAuth()

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Planning",
      description: "Smart date suggestions tailored to your preferences and location"
    },
    {
      icon: MapPin,
      title: "Local Venue Discovery",
      description: "Find hidden gems and popular spots in your area"
    },
    {
      icon: Calendar,
      title: "Perfect Itineraries",
      description: "Complete date plans with timing, reservations, and backup options"
    },
    {
      icon: Heart,
      title: "Relationship Builder",
      description: "Create memorable experiences that bring you closer together"
    }
  ]

  const testimonials = [
    {
      name: "Sarah & Mike",
      role: "Dating 3 years",
      content: "Date Night completely transformed our date nights. No more 'what should we do?' arguments!",
      rating: 5
    },
    {
      name: "Jessica & Tom",
      role: "Newly dating",
      content: "As a new couple, it helped us discover amazing spots we never knew existed.",
      rating: 5
    },
    {
      icon: Users,
      title: "Join Thousands of Couples",
      description: "Discover why couples everywhere are making every date count"
    }
  ]

  const dateTypes = [
    { icon: Wine, label: "Romantic Dinners" },
    { icon: Music, label: "Live Entertainment" },
    { icon: Camera, label: "Adventure Dates" },
    { icon: Heart, label: "Cozy Nights" }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-accent/5" />
        
        <div className="relative container mx-auto px-6 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Date Planning</span>
            </div>

            {/* Main headline */}
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground mb-6">
              Transform Your
              <span className="block text-primary">Date Nights</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Stop wondering what to do. Let AI craft perfect date experiences with curated venues, 
              smart timing, and personalized recommendations.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Link href="/app">
                  <Button size="lg" className="px-8 py-4 text-lg h-auto">
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link href="/legal/terms-of-service">
                  <Button size="lg" className="px-8 py-4 text-lg h-auto bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                    Start Planning Perfect Dates
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              )}
              
              <Link href="#features">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg h-auto">
                  See How It Works
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-foreground">4.9/5</span>
                <span>from 2,000+ reviews</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span className="font-medium text-foreground">10,000+</span>
                <span>couples dating better</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              Everything You Need for
              <span className="block text-primary">Amazing Dates</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              From finding the perfect spot to planning every detail, we've got you covered
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Date Types Section */}
      <section className="py-20 lg:py-32 bg-linear-to-b from-background to-primary/5">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              Perfect for Every
              <span className="block text-primary">Type of Date</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Whether you're planning something romantic, adventurous, or cozy
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dateTypes.map((type, index) => (
              <div key={index} className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <type.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{type.label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              Loved by
              <span className="block text-primary">Thousands of Couples</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              See what real couples have to say about their transformed date nights
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-card border border-border rounded-2xl p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 lg:py-32 bg-linear-to-r from-primary/10 to-accent/10">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">
              Ready to Transform
              <span className="block text-primary">Your Date Nights?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              Join thousands of couples who are already creating unforgettable memories
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link href="/app">
                  <Button size="lg" className="px-8 py-4 text-lg h-auto">
                    Start Planning Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link href="/legal/terms-of-service">
                  <Button size="lg" className="px-8 py-4 text-lg h-auto bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
                    Sign Up Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              )}
              
              <Link href="#features">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg h-auto">
                  Learn More
                </Button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground mt-8">
              No credit card required • Free to get started • Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
