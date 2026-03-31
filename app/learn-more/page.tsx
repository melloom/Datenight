"use client"

import Link from "next/link"
import { ArrowLeft, MapPin, Sparkles, Heart, Calendar, Shield, Zap, ChevronRight } from "lucide-react"
import { useRef } from "react"
import { useInView } from "@/hooks/use-in-view"

const steps = [
  {
    number: "01",
    icon: MapPin,
    title: "Tell Us Your Vibe",
    description:
      "Share your preferences — cuisine type, budget, distance, mood. Whether you want a cozy dinner or an adventurous outing, we tailor everything to you.",
    color: "from-primary/20 to-primary/5",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "AI Finds the Best Spots",
    description:
      "Our AI scans thousands of real venues and activities near you. We pull live data from trusted sources — menus, reviews, hours, photos — so every recommendation is fresh and accurate.",
    color: "from-accent/20 to-accent/5",
  },
  {
    number: "03",
    icon: Heart,
    title: "Get Personalized Picks",
    description:
      "Receive a curated shortlist of date ideas ranked by how well they match your style. Each pick includes everything you need — location, price range, what to expect, and why it's perfect for you.",
    color: "from-primary/20 to-primary/5",
  },
  {
    number: "04",
    icon: Calendar,
    title: "Plan & Go",
    description:
      "Save your favorites, build an itinerary, and share it with your partner. When date night arrives, everything is ready — no stress, just enjoy.",
    color: "from-accent/20 to-accent/5",
  },
]

const features = [
  {
    icon: Zap,
    title: "Real-Time Venue Data",
    description:
      "We don't rely on stale databases. Our system pulls live information — hours, menus, availability — so you always get accurate, up-to-date suggestions.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Matching",
    description:
      "Powered by advanced AI, our recommendation engine learns your taste over time. The more you use it, the better your suggestions get.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your data stays yours. We never sell personal information. All preferences are stored securely and used only to improve your experience.",
  },
  {
    icon: Heart,
    title: "Built for Couples",
    description:
      "Every feature is designed with couples in mind — from shared wishlists to surprise date planning and budget-friendly filters.",
  },
  {
    icon: MapPin,
    title: "Local & Hyper-Relevant",
    description:
      "Discover hidden gems in your own city. Our system surfaces places you'd never find on your own — unique spots that feel special.",
  },
  {
    icon: Calendar,
    title: "Full Itinerary Builder",
    description:
      "Combine dinner, drinks, and activities into a single evening plan. Set times, add notes, and share the whole itinerary with one tap.",
  },
]

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { threshold: 0.15 })

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}

export default function LearnMorePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-3 md:pb-4 flex items-center justify-between">
          <Link
            href="/landing"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <span className="font-serif text-lg md:text-xl tracking-tight">Dat3Night</span>
          <Link
            href="/login"
            className="px-4 md:px-5 py-2 bg-primary text-primary-foreground rounded-full text-xs md:text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--primary)_0%,transparent_50%)] opacity-[0.07]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,var(--accent)_0%,transparent_50%)] opacity-[0.05]" />

        <div className="relative max-w-5xl mx-auto px-4 md:px-6 pt-16 pb-14 md:pt-32 md:pb-28 text-center">
          <AnimatedSection>
            <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground mb-6 block">
              How It Works
            </span>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <h1 className="font-serif text-3xl md:text-6xl lg:text-7xl leading-[0.95] tracking-tight mb-6 md:mb-8">
              Date nights,{" "}
              <span className="text-primary">reimagined</span>
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Dat3Night uses AI to find the perfect restaurants, activities, and
              venues near you — then builds a complete date plan in seconds.
              No more endless scrolling. Just great nights out.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-border" />
      </div>

      {/* How It Works — Steps */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-32">
        <AnimatedSection className="mb-12 md:mb-20 text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4 block">
            Step by Step
          </span>
          <h2 className="font-serif text-2xl md:text-5xl">
            From idea to <span className="text-outline">unforgettable</span>
          </h2>
        </AnimatedSection>

        <div className="space-y-16 md:space-y-24">
          {/* Step 01 — Tell Us Your Vibe */}
          <AnimatedSection delay={0}>
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
              <div className="w-full md:w-1/2 shrink-0">
                <div className="relative aspect-4/3 rounded-3xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden p-8">
                  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    {/* Phone frame */}
                    <rect x="120" y="20" width="160" height="260" rx="20" className="stroke-foreground/20" strokeWidth="2" fill="var(--card)" />
                    <rect x="168" y="30" width="64" height="6" rx="3" className="fill-foreground/10" />

                    {/* Preference sliders */}
                    <text x="145" y="75" className="fill-foreground/60" fontSize="10" fontWeight="500">Cuisine</text>
                    <rect x="145" y="82" width="110" height="6" rx="3" className="fill-foreground/10" />
                    <rect x="145" y="82" width="70" height="6" rx="3" className="fill-primary/60">
                      <animate attributeName="width" values="70;90;50;70" dur="4s" repeatCount="indefinite" />
                    </rect>
                    <circle cx="215" cy="85" r="8" className="fill-primary" stroke="var(--card)" strokeWidth="2">
                      <animate attributeName="cx" values="215;235;195;215" dur="4s" repeatCount="indefinite" />
                    </circle>

                    <text x="145" y="115" className="fill-foreground/60" fontSize="10" fontWeight="500">Budget</text>
                    <rect x="145" y="122" width="110" height="6" rx="3" className="fill-foreground/10" />
                    <rect x="145" y="122" width="45" height="6" rx="3" className="fill-accent/60">
                      <animate attributeName="width" values="45;80;30;45" dur="5s" repeatCount="indefinite" />
                    </rect>
                    <circle cx="190" cy="125" r="8" className="fill-accent" stroke="var(--card)" strokeWidth="2">
                      <animate attributeName="cx" values="190;225;175;190" dur="5s" repeatCount="indefinite" />
                    </circle>

                    <text x="145" y="155" className="fill-foreground/60" fontSize="10" fontWeight="500">Distance</text>
                    <rect x="145" y="162" width="110" height="6" rx="3" className="fill-foreground/10" />
                    <rect x="145" y="162" width="85" height="6" rx="3" className="fill-primary/60">
                      <animate attributeName="width" values="85;60;100;85" dur="3.5s" repeatCount="indefinite" />
                    </rect>
                    <circle cx="230" cy="165" r="8" className="fill-primary" stroke="var(--card)" strokeWidth="2">
                      <animate attributeName="cx" values="230;205;245;230" dur="3.5s" repeatCount="indefinite" />
                    </circle>

                    {/* Mood chips */}
                    <text x="145" y="200" className="fill-foreground/60" fontSize="10" fontWeight="500">Mood</text>
                    <rect x="145" y="210" width="50" height="22" rx="11" className="fill-primary/20 stroke-primary/40" strokeWidth="1" />
                    <text x="155" y="224" className="fill-primary" fontSize="9">Romantic</text>
                    <rect x="200" y="210" width="55" height="22" rx="11" className="fill-foreground/5 stroke-foreground/15" strokeWidth="1" />
                    <text x="209" y="224" className="fill-foreground/40" fontSize="9">Adventure</text>
                    <rect x="145" y="237" width="38" height="22" rx="11" className="fill-foreground/5 stroke-foreground/15" strokeWidth="1" />
                    <text x="153" y="251" className="fill-foreground/40" fontSize="9">Chill</text>
                    <rect x="188" y="237" width="42" height="22" rx="11" className="fill-accent/20 stroke-accent/40" strokeWidth="1" />
                    <text x="196" y="251" className="fill-accent" fontSize="9">Foodie</text>
                  </svg>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <span className="text-xs uppercase tracking-[0.3em] text-primary mb-3 block">Step 01</span>
                <h3 className="font-serif text-2xl md:text-4xl mb-4">Tell Us Your Vibe</h3>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  Share your preferences — cuisine type, budget, distance, mood. Whether you want a cozy dinner or an adventurous outing, we tailor everything to you.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* Step 02 — AI Finds the Best Spots */}
          <AnimatedSection delay={0.1}>
            <div className="flex flex-col md:flex-row-reverse items-center gap-10 md:gap-16">
              <div className="w-full md:w-1/2 shrink-0">
                <div className="relative aspect-4/3 rounded-3xl bg-linear-to-br from-accent/20 to-accent/5 flex items-center justify-center overflow-hidden p-8">
                  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    {/* Scanning radar */}
                    <circle cx="200" cy="150" r="100" className="stroke-foreground/10" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="200" cy="150" r="70" className="stroke-foreground/10" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="200" cy="150" r="40" className="stroke-foreground/10" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Radar sweep */}
                    <line x1="200" y1="150" x2="200" y2="50" className="stroke-primary/40" strokeWidth="2">
                      <animateTransform attributeName="transform" type="rotate" from="0 200 150" to="360 200 150" dur="3s" repeatCount="indefinite" />
                    </line>
                    <path d="M200 150 L200 50 A100 100 0 0 1 270 80 Z" className="fill-primary/10">
                      <animateTransform attributeName="transform" type="rotate" from="0 200 150" to="360 200 150" dur="3s" repeatCount="indefinite" />
                    </path>

                    {/* Center dot */}
                    <circle cx="200" cy="150" r="6" className="fill-primary">
                      <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
                    </circle>

                    {/* Venue dots appearing */}
                    <circle cx="240" cy="110" r="5" className="fill-accent">
                      <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="r" values="0;5;5;0" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="160" cy="120" r="5" className="fill-primary">
                      <animate attributeName="opacity" values="0;0;1;1;0" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="r" values="0;0;5;5;0" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="230" cy="180" r="5" className="fill-accent">
                      <animate attributeName="opacity" values="0;0;0;1;1" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="r" values="0;0;0;5;5" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="170" cy="190" r="5" className="fill-primary">
                      <animate attributeName="opacity" values="0;0;1;1;0" dur="4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="255" cy="155" r="4" className="fill-primary/60">
                      <animate attributeName="opacity" values="0;1;0;1;0" dur="3.5s" repeatCount="indefinite" />
                    </circle>

                    {/* Labels floating */}
                    <rect x="248" y="98" width="65" height="18" rx="4" className="fill-card" stroke="var(--border)" strokeWidth="1">
                      <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" />
                    </rect>
                    <text x="258" y="111" fontSize="8" className="fill-foreground/70">
                      <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" />
                      The Olive Branch ★ 4.8
                    </text>

                    <rect x="85" y="115" width="65" height="18" rx="4" className="fill-card" stroke="var(--border)" strokeWidth="1">
                      <animate attributeName="opacity" values="0;0;1;1;0" dur="3s" repeatCount="indefinite" />
                    </rect>
                    <text x="94" y="128" fontSize="8" className="fill-foreground/70">
                      <animate attributeName="opacity" values="0;0;1;1;0" dur="3s" repeatCount="indefinite" />
                      Blue Note Jazz ★ 4.6
                    </text>
                  </svg>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <span className="text-xs uppercase tracking-[0.3em] text-primary mb-3 block">Step 02</span>
                <h3 className="font-serif text-2xl md:text-4xl mb-4">AI Finds the Best Spots</h3>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  Our AI scans thousands of real venues and activities near you. We pull live data from trusted sources — menus, reviews, hours, photos — so every recommendation is fresh and accurate.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* Step 03 — Get Personalized Picks */}
          <AnimatedSection delay={0.2}>
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
              <div className="w-full md:w-1/2 shrink-0">
                <div className="relative aspect-4/3 rounded-3xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden p-8">
                  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    {/* Recommendation cards stack */}
                    {/* Card 3 (back) */}
                    <rect x="130" y="50" width="180" height="110" rx="12" className="fill-card stroke-border" strokeWidth="1" opacity="0.5" transform="rotate(3 220 105)" />

                    {/* Card 2 (middle) */}
                    <rect x="118" y="55" width="180" height="110" rx="12" className="fill-card stroke-border" strokeWidth="1" opacity="0.7" transform="rotate(-2 208 110)" />

                    {/* Card 1 (front — main) */}
                    <g>
                      <animate attributeName="opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite" />
                      <rect x="110" y="60" width="180" height="110" rx="12" className="fill-card" stroke="var(--primary)" strokeWidth="1.5" />
                      {/* Image placeholder */}
                      <rect x="120" y="70" width="60" height="50" rx="8" className="fill-primary/15" />
                      <circle cx="150" cy="88" r="8" className="fill-primary/30" />
                      <path d="M130 107 L140 95 L155 105 L165 92 L175 107 Z" className="fill-primary/20" />
                      {/* Text lines */}
                      <rect x="190" y="75" width="85" height="8" rx="2" className="fill-foreground/15" />
                      <rect x="190" y="90" width="60" height="6" rx="2" className="fill-foreground/8" />
                      {/* Stars */}
                      <text x="190" y="115" fontSize="10" className="fill-primary">★ ★ ★ ★ ★</text>
                      {/* Price & match */}
                      <rect x="120" y="130" width="40" height="18" rx="9" className="fill-primary/15" />
                      <text x="128" y="143" fontSize="8" className="fill-primary">$$$</text>
                      <rect x="168" y="130" width="60" height="18" rx="9" className="fill-accent/15" />
                      <text x="176" y="143" fontSize="8" className="fill-accent">98% Match</text>
                    </g>

                    {/* Match percentage animation */}
                    <g transform="translate(115, 190)">
                      <text x="0" y="12" fontSize="10" className="fill-foreground/50" fontWeight="500">Your Top Picks</text>
                      {/* Bar 1 */}
                      <rect x="0" y="22" width="170" height="8" rx="4" className="fill-foreground/5" />
                      <rect x="0" y="22" width="0" height="8" rx="4" className="fill-primary">
                        <animate attributeName="width" from="0" to="166" dur="1.5s" fill="freeze" begin="0.3s" />
                      </rect>
                      <text x="175" y="30" fontSize="8" className="fill-primary">98%</text>
                      {/* Bar 2 */}
                      <rect x="0" y="38" width="170" height="8" rx="4" className="fill-foreground/5" />
                      <rect x="0" y="38" width="0" height="8" rx="4" className="fill-accent">
                        <animate attributeName="width" from="0" to="145" dur="1.5s" fill="freeze" begin="0.5s" />
                      </rect>
                      <text x="175" y="46" fontSize="8" className="fill-accent">85%</text>
                      {/* Bar 3 */}
                      <rect x="0" y="54" width="170" height="8" rx="4" className="fill-foreground/5" />
                      <rect x="0" y="54" width="0" height="8" rx="4" className="fill-primary/60">
                        <animate attributeName="width" from="0" to="128" dur="1.5s" fill="freeze" begin="0.7s" />
                      </rect>
                      <text x="175" y="62" fontSize="8" className="fill-primary/60">75%</text>
                    </g>
                  </svg>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <span className="text-xs uppercase tracking-[0.3em] text-primary mb-3 block">Step 03</span>
                <h3 className="font-serif text-2xl md:text-4xl mb-4">Get Personalized Picks</h3>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  Receive a curated shortlist of date ideas ranked by how well they match your style. Each pick includes everything you need — location, price range, what to expect, and why it&apos;s perfect for you.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* Step 04 — Plan & Go */}
          <AnimatedSection delay={0.3}>
            <div className="flex flex-col md:flex-row-reverse items-center gap-10 md:gap-16">
              <div className="w-full md:w-1/2 shrink-0">
                <div className="relative aspect-4/3 rounded-3xl bg-linear-to-br from-accent/20 to-accent/5 flex items-center justify-center overflow-hidden p-8">
                  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    {/* Itinerary timeline */}
                    <line x1="160" y1="40" x2="160" y2="260" className="stroke-border" strokeWidth="2" />

                    {/* Timeline node 1 — Dinner */}
                    <g>
                      <circle cx="160" cy="65" r="10" className="fill-primary" stroke="var(--card)" strokeWidth="3">
                        <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <rect x="185" y="45" width="140" height="40" rx="10" className="fill-card" stroke="var(--primary)" strokeWidth="1" />
                      <text x="198" y="62" fontSize="10" fontWeight="600" className="fill-foreground">7:00 PM — Dinner</text>
                      <text x="198" y="76" fontSize="8" className="fill-foreground/50">The Olive Branch</text>
                      {/* Checkmark */}
                      <circle cx="310" cy="65" r="8" className="fill-primary/15" />
                      <path d="M305 65 L308 68 L315 61" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" />
                    </g>

                    {/* Timeline node 2 — Drinks */}
                    <g>
                      <circle cx="160" cy="125" r="10" className="fill-accent" stroke="var(--card)" strokeWidth="3">
                        <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" begin="0.5s" />
                      </circle>
                      <rect x="185" y="105" width="140" height="40" rx="10" className="fill-card" stroke="var(--accent)" strokeWidth="1" />
                      <text x="198" y="122" fontSize="10" fontWeight="600" className="fill-foreground">8:30 PM — Drinks</text>
                      <text x="198" y="136" fontSize="8" className="fill-foreground/50">Blue Note Jazz Club</text>
                      <circle cx="310" cy="125" r="8" className="fill-accent/15" />
                      <path d="M305 125 L308 128 L315 121" className="stroke-accent" strokeWidth="1.5" strokeLinecap="round" />
                    </g>

                    {/* Timeline node 3 — Activity */}
                    <g>
                      <circle cx="160" cy="185" r="10" className="fill-primary" stroke="var(--card)" strokeWidth="3">
                        <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" begin="1s" />
                      </circle>
                      <rect x="185" y="165" width="140" height="40" rx="10" className="fill-card" stroke="var(--border)" strokeWidth="1" />
                      <text x="198" y="182" fontSize="10" fontWeight="600" className="fill-foreground">10:00 PM — Walk</text>
                      <text x="198" y="196" fontSize="8" className="fill-foreground/50">Waterfront Park</text>
                    </g>

                    {/* Share button */}
                    <g transform="translate(185, 225)">
                      <rect width="110" height="32" rx="16" className="fill-primary">
                        <animate attributeName="opacity" values="0.85;1;0.85" dur="2s" repeatCount="indefinite" />
                      </rect>
                      <text x="22" y="20" fontSize="10" fontWeight="600" className="fill-primary-foreground">Share Plan ❤</text>
                    </g>

                    {/* Left side time markers */}
                    <text x="110" y="68" fontSize="9" className="fill-foreground/30" textAnchor="end">7 PM</text>
                    <text x="110" y="128" fontSize="9" className="fill-foreground/30" textAnchor="end">8:30</text>
                    <text x="110" y="188" fontSize="9" className="fill-foreground/30" textAnchor="end">10 PM</text>
                  </svg>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <span className="text-xs uppercase tracking-[0.3em] text-primary mb-3 block">Step 04</span>
                <h3 className="font-serif text-2xl md:text-4xl mb-4">Plan & Go</h3>
                <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                  Save your favorites, build an itinerary, and share it with your partner. When date night arrives, everything is ready — no stress, just enjoy.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-border" />
      </div>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-32">
        <AnimatedSection className="mb-10 md:mb-16 text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4 block">
            What Makes Us Different
          </span>
          <h2 className="font-serif text-2xl md:text-5xl">
            Built for <span className="text-primary">real</span> date nights
          </h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <AnimatedSection key={feature.title} delay={index * 0.08}>
                <div className="group p-5 md:p-8 rounded-xl md:rounded-2xl border border-border hover:border-primary/30 bg-card hover:bg-card/80 transition-all duration-500 h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </AnimatedSection>
            )
          })}
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-border" />
      </div>

      {/* Behind the Scenes */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-32">
        <AnimatedSection className="mb-10 md:mb-16">
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4 block">
            Under the Hood
          </span>
          <h2 className="font-serif text-2xl md:text-5xl max-w-3xl">
            How we find the <span className="text-outline">perfect</span> spots
          </h2>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-8 md:gap-16">
          <AnimatedSection delay={0.1}>
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-2 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  Live Venue Discovery
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed pl-6">
                  We scan real-time data from multiple trusted sources to find restaurants,
                  bars, activities, and experiences near your location. No outdated listings —
                  everything is verified and current.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-2 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  Smart Filtering
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed pl-6">
                  Our AI considers dozens of factors: cuisine type, ambiance, price range,
                  distance, ratings, recent reviews, and even time of day. The result is a
                  shortlist that actually matches what you're looking for.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-2 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  Contextual Recommendations
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed pl-6">
                  Planning a first date? Anniversary dinner? Quick weeknight outing?
                  The AI adjusts its recommendations based on the occasion and builds
                  a complete itinerary — not just a single venue.
                </p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-2 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  Photo & Menu Previews
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed pl-6">
                  Each recommendation comes with real photos, menu highlights, and
                  key details so you know exactly what to expect before you go.
                  No surprises — unless you want them.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-2 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  Mystery Date Mode
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed pl-6">
                  Want to surprise your partner? Our Mystery Date feature plans an
                  entire evening without revealing the details. Just set preferences,
                  and we handle the rest — revealed one step at a time.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-2 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  Always Improving
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed pl-6">
                  Rate your dates, save favorites, and the AI gets smarter.
                  Over time, your recommendations become more personal and
                  more aligned with what you and your partner love.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_60%)] opacity-[0.08]" />
        <div className="relative max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-32 text-center">
          <AnimatedSection>
            <h2 className="font-serif text-2xl md:text-5xl mb-4 md:mb-6">
              Ready to plan something <span className="text-primary">amazing</span>?
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mb-8 md:mb-10 max-w-lg mx-auto">
              Sign up free and discover your next unforgettable date night in minutes.
            </p>
            <Link href="/login">
              <button className="group relative px-8 md:px-10 py-3 md:py-4 bg-primary text-primary-foreground font-medium uppercase tracking-[0.15em] text-xs md:text-sm overflow-hidden rounded-full">
                <span className="relative z-10">Get Started Free</span>
                <div className="absolute inset-0 bg-foreground transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-full" />
                <span className="absolute inset-0 flex items-center justify-center text-background transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 delay-75 font-medium uppercase tracking-[0.15em] text-sm">
                  Get Started Free
                </span>
              </button>
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-border py-8 md:py-12 px-4 md:px-6 bg-background">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-3 md:gap-4">
          <div className="font-serif text-lg md:text-xl tracking-tight">Dat3Night</div>
          <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs md:text-sm text-muted-foreground">
            <a href="/about" className="hover:text-foreground transition-colors">About</a>
            <a href="/legal/privacy-policy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="/legal/terms-of-service" className="hover:text-foreground transition-colors">Terms</a>
            <a href="/contact" className="hover:text-foreground transition-colors">Contact</a>
          </nav>
          <div className="text-sm text-muted-foreground">
            2026 Dat3Night. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
