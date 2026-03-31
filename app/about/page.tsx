/* eslint-disable react/no-unescaped-entities */
import Link from "next/link"
import { ArrowLeft, Compass, Heart, Sparkles, Stars } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60rem 30rem at 10% -10%, oklch(0.8 0.15 295 / 0.24), transparent 60%), radial-gradient(55rem 28rem at 95% 5%, oklch(0.83 0.12 260 / 0.2), transparent 65%), linear-gradient(180deg, oklch(0.98 0.01 285), oklch(0.95 0.01 285))",
        }}
      />

      <div className="relative container mx-auto max-w-6xl px-4 pb-20 pt-16 md:pt-20">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-md transition-colors hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="grid gap-10 md:gap-14 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              About Dat3Night
            </div>

            <div className="space-y-5">
              <h1 className="font-serif text-4xl leading-tight md:text-6xl">
                Turning date planning into a story you cannot wait to live.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Dat3Night blends smart recommendations, local discovery, and playful planning so couples can
                spend less time deciding and more time creating unforgettable nights together.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-card/75 p-4 shadow-sm backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mission</p>
                <p className="mt-2 text-sm font-medium">Make great dates easy to discover and even easier to plan.</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/75 p-4 shadow-sm backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approach</p>
                <p className="mt-2 text-sm font-medium">Pair AI guidance with real venue signals and your preferences.</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/75 p-4 shadow-sm backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Promise</p>
                <p className="mt-2 text-sm font-medium">Less scrolling, fewer arguments, and better nights out.</p>
              </div>
            </div>
          </section>

          <section className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
              <AnimatedDateMap />

              <div className="mt-6 grid gap-3 text-sm">
                <div className="flex items-center gap-2 rounded-xl bg-background/70 px-3 py-2">
                  <Compass className="h-4 w-4 text-primary" />
                  <span>Find the right place, not just the nearest place.</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-background/70 px-3 py-2">
                  <Stars className="h-4 w-4 text-primary" />
                  <span>Personalized recommendations that feel thoughtful.</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-background/70 px-3 py-2">
                  <Heart className="h-4 w-4 text-primary" />
                  <span>Plans designed for quality time and real connection.</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur-sm md:p-8">
            <h2 className="font-serif text-2xl md:text-3xl">What We Actually Do</h2>
            <ul className="mt-5 space-y-4 text-muted-foreground">
              <li>
                Curate romantic restaurants, hidden gems, and vibe-specific venues near you.
              </li>
              <li>
                Suggest experiences that match your mood, budget, and timing.
              </li>
              <li>
                Build clear, ready-to-go itineraries from first plan to final stop.
              </li>
              <li>
                Help you save favorites and avoid repeating the same night out.
              </li>
            </ul>
          </section>

          <section className="rounded-3xl border border-border/70 bg-card/70 p-6 shadow-sm backdrop-blur-sm md:p-8">
            <h2 className="font-serif text-2xl md:text-3xl">Why It Matters</h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              The best dates start before you sit down at the table. They begin with momentum, confidence,
              and the feeling that tonight is going to be different. Dat3Night helps create that feeling on
              purpose.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Whether you want a cozy first date, a surprise anniversary plan, or just something new this
              Friday, Dat3Night helps you pick faster and enjoy more.
            </p>
          </section>
        </div>

        <section className="mt-10 rounded-3xl border border-primary/20 bg-primary/10 p-6 md:p-8">
          <h2 className="font-serif text-2xl md:text-3xl">Built For Real Nights Out</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            We built Dat3Night for couples who care about moments, not endless decision loops. Every
            recommendation is meant to get you from maybe to booked with less friction.
          </p>
        </section>

        <section className="mt-12 overflow-hidden rounded-3xl border border-border/70 bg-card/80 p-1 shadow-xl backdrop-blur-sm">
          <div className="relative rounded-[1.35rem] border border-primary/20 bg-gradient-to-r from-primary/15 via-background to-primary/10 px-6 py-8 md:px-10 md:py-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  "radial-gradient(26rem 16rem at 8% 18%, oklch(0.74 0.16 300 / 0.25), transparent 65%), radial-gradient(24rem 14rem at 92% 82%, oklch(0.66 0.17 270 / 0.2), transparent 70%)",
              }}
            />

            <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your Next Night Starts Here</p>
                <h3 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">
                  Stop deciding. Start dating.
                </h3>
                <p className="mt-3 text-muted-foreground md:text-lg">
                  Launch Dat3Night and get a personalized plan in minutes, with venues and vibes that
                  actually fit your night.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Start Planning Now
                </Link>
                <Link
                  href="/plans"
                  className="inline-flex items-center justify-center rounded-full border border-border bg-background/80 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-background"
                >
                  View Plans
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function AnimatedDateMap() {
  return (
    <div className="relative mx-auto w-full max-w-[30rem]">
      <svg
        viewBox="0 0 520 360"
        role="img"
        aria-label="Animated map illustration showing date-night discovery"
        className="h-auto w-full"
      >
        <defs>
          <linearGradient id="pathGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.18 280)" />
            <stop offset="100%" stopColor="oklch(0.58 0.2 305)" />
          </linearGradient>
          <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.7 0.17 295 / 0.5)" />
            <stop offset="100%" stopColor="oklch(0.7 0.17 295 / 0)" />
          </radialGradient>
        </defs>

        <circle cx="260" cy="180" r="130" fill="url(#glowGradient)" className="about-pulse" />

        <path
          d="M88 254 C140 214, 188 118, 258 148 C328 178, 352 256, 430 196"
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="14 18"
          className="about-dash"
        />

        <g className="about-float-slow">
          <circle cx="108" cy="248" r="20" fill="oklch(0.98 0.01 285)" stroke="oklch(0.72 0.15 290)" strokeWidth="6" />
          <circle cx="108" cy="248" r="6" fill="oklch(0.62 0.18 300)" />
        </g>

        <g className="about-float-fast" style={{ transformOrigin: "430px 196px" }}>
          <circle cx="430" cy="196" r="28" fill="oklch(0.98 0.01 285)" stroke="oklch(0.65 0.2 300)" strokeWidth="8" />
          <path
            d="M430 181 C425 170, 410 171, 410 186 C410 199, 423 205, 430 216 C437 205, 450 199, 450 186 C450 171, 435 170, 430 181 Z"
            fill="oklch(0.62 0.2 305)"
          />
        </g>

        <g className="about-orbit" style={{ transformOrigin: "260px 180px" }}>
          <circle cx="260" cy="78" r="8" fill="oklch(0.67 0.17 280)" />
          <circle cx="342" cy="118" r="5" fill="oklch(0.62 0.18 305)" />
          <circle cx="186" cy="120" r="5" fill="oklch(0.63 0.16 260)" />
        </g>

        <g className="about-float-slow" style={{ transformOrigin: "260px 180px" }}>
          <rect x="224" y="152" width="72" height="56" rx="14" fill="oklch(0.99 0 0)" stroke="oklch(0.84 0.05 285)" strokeWidth="4" />
          <path
            d="M260 163 C252 148, 232 149, 232 168 C232 184, 247 191, 260 208 C273 191, 288 184, 288 168 C288 149, 268 148, 260 163 Z"
            fill="oklch(0.62 0.2 305)"
          />
        </g>
      </svg>

      <style jsx>{`
        .about-float-slow {
          animation: aboutFloatSlow 5.2s ease-in-out infinite;
        }

        .about-float-fast {
          animation: aboutFloatFast 3.6s ease-in-out infinite;
        }

        .about-dash {
          animation: aboutDash 14s linear infinite;
        }

        .about-orbit {
          animation: aboutOrbit 12s linear infinite;
        }

        .about-pulse {
          animation: aboutPulse 3.8s ease-in-out infinite;
        }

        @keyframes aboutDash {
          to {
            stroke-dashoffset: -620;
          }
        }

        @keyframes aboutFloatSlow {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes aboutFloatFast {
          0%,
          100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.02);
          }
        }

        @keyframes aboutOrbit {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes aboutPulse {
          0%,
          100% {
            opacity: 0.45;
            transform: scale(1);
          }
          50% {
            opacity: 0.75;
            transform: scale(1.06);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .about-float-slow,
          .about-float-fast,
          .about-dash,
          .about-orbit,
          .about-pulse {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
