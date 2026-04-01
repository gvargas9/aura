"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
  Zap,
  ShieldCheck,
  Globe,
  Brain,
  Box,
  Truck,
  Users,
  Store,
  ChefHat,
  Layers,
  BarChart3,
  Lock,
  Languages,
  Rocket,
  Trophy,
  DollarSign,
  Mail,
  Package,
  ShoppingCart,
  Building2,
  Coffee,
  Anchor,
  Shield,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Database,
  Server,
  Code2,
  TestTube2,
  Palette,
  Coins,
  Target,
  CheckCircle2,
  Clock,
  Star,
  MapPin,
  CircleDot,
  GitBranch,
  Cpu,
  Workflow,
  Eye,
} from "lucide-react";

// ─────────────────────────────────────────────
// CSS ANIMATIONS (injected via style tag)
// ─────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');

  @keyframes orbit {
    from { transform: rotate(0deg) translateX(var(--orbit-radius)) rotate(0deg); }
    to { transform: rotate(360deg) translateX(var(--orbit-radius)) rotate(-360deg); }
  }

  @keyframes orbit-reverse {
    from { transform: rotate(360deg) translateX(var(--orbit-radius)) rotate(-360deg); }
    to { transform: rotate(0deg) translateX(var(--orbit-radius)) rotate(0deg); }
  }

  @keyframes pulse-glow {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  @keyframes reveal-up {
    from { opacity: 0; transform: translateY(60px) scale(0.95); filter: blur(10px); }
    to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
  }

  @keyframes reveal-scale {
    from { opacity: 0; transform: scale(0.8); filter: blur(20px); }
    to { opacity: 1; transform: scale(1); filter: blur(0); }
  }

  @keyframes draw-line {
    from { stroke-dashoffset: 1000; }
    to { stroke-dashoffset: 0; }
  }

  @keyframes particle-float {
    0% { transform: translateY(0) translateX(0); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
  }

  @keyframes text-gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes obsidian-pulse {
    0%, 100% {
      box-shadow: 0 0 60px rgba(16,185,129,0.15), 0 0 120px rgba(16,185,129,0.05), inset 0 0 60px rgba(16,185,129,0.05);
    }
    50% {
      box-shadow: 0 0 80px rgba(16,185,129,0.25), 0 0 160px rgba(16,185,129,0.1), inset 0 0 80px rgba(16,185,129,0.1);
    }
  }

  @keyframes ring-spin {
    from { transform: rotateX(75deg) rotateZ(0deg); }
    to { transform: rotateX(75deg) rotateZ(360deg); }
  }

  @keyframes ring-spin-reverse {
    from { transform: rotateX(75deg) rotateZ(360deg); }
    to { transform: rotateX(75deg) rotateZ(0deg); }
  }

  @keyframes device-float {
    0%, 100% { transform: translateY(0) rotateY(-5deg) rotateX(2deg); }
    50% { transform: translateY(-12px) rotateY(-5deg) rotateX(2deg); }
  }

  @keyframes count-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slide-in-left {
    from { opacity: 0; transform: translateX(-80px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes slide-in-right {
    from { opacity: 0; transform: translateX(80px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes border-flow {
    0% { background-position: 0% 50%; }
    100% { background-position: 300% 50%; }
  }

  .obsidian-surface {
    background: radial-gradient(ellipse at 30% 20%, rgba(16,185,129,0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, rgba(16,185,129,0.05) 0%, transparent 50%),
                linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%);
  }

  .glass-card {
    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
    border: 1px solid rgba(255,255,255,0.06);
    backdrop-filter: blur(20px);
  }

  .glass-card-glow {
    background: linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(255,255,255,0.02) 100%);
    border: 1px solid rgba(16,185,129,0.15);
    backdrop-filter: blur(20px);
  }

  .gradient-text {
    background: linear-gradient(135deg, #10B981 0%, #34D399 50%, #6EE7B7 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: text-gradient 4s ease infinite;
  }

  .gradient-text-gold {
    background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #FDE68A 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: text-gradient 4s ease infinite;
  }

  .shimmer-text {
    background: linear-gradient(90deg, #ffffff 0%, #10B981 25%, #ffffff 50%, #10B981 75%, #ffffff 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }

  .flowing-border {
    position: relative;
  }
  .flowing-border::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent, rgba(16,185,129,0.3), transparent);
    background-size: 300% 100%;
    animation: border-flow 4s linear infinite;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  .device-mockup {
    perspective: 1200px;
  }

  .device-frame {
    border-radius: 2.5rem;
    overflow: hidden;
    box-shadow: 0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(16,185,129,0.1);
    border: 3px solid rgba(255,255,255,0.1);
    animation: device-float 6s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// ─────────────────────────────────────────────
// PARTICLES BACKGROUND
// ─────────────────────────────────────────────
function Particles({ count = 30 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 20,
        duration: 15 + Math.random() * 25,
        size: 1 + Math.random() * 2,
        opacity: 0.1 + Math.random() * 0.3,
      })),
    [count]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-emerald-400"
          style={{
            left: `${p.left}%`,
            bottom: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animation: `particle-float ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────
function AnimatedCounter({
  end,
  suffix = "",
  prefix = "",
  duration = 2000,
  active,
}: {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  active: boolean;
}) {
  const [count, setCount] = useState(0);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (!active || hasRun) return;
    setHasRun(true);
    setCount(0);
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [active, hasRun, end, duration]);

  // Reset when leaving the slide so it re-animates on return
  useEffect(() => {
    if (!active) setHasRun(false);
  }, [active]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─────────────────────────────────────────────
// REVEAL ANIMATION WRAPPER
// ─────────────────────────────────────────────
function Reveal({
  children,
  active,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: React.ReactNode;
  active: boolean;
  delay?: number;
  direction?: "up" | "scale" | "left" | "right";
  className?: string;
}) {
  const animName =
    direction === "scale"
      ? "reveal-scale"
      : direction === "left"
        ? "slide-in-left"
        : direction === "right"
          ? "slide-in-right"
          : "reveal-up";

  return (
    <div
      className={className}
      style={{
        opacity: active ? 1 : 0,
        animation: active ? `${animName} 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards` : "none",
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// OBSIDIAN ORB (central animation element)
// ─────────────────────────────────────────────
function ObsidianOrb({ size = 200 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
          transform: "scale(2.5)",
          animation: "pulse-glow 4s ease-in-out infinite",
        }}
      />
      {/* The orb */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(ellipse at 35% 30%, rgba(16,185,129,0.3) 0%, rgba(16,185,129,0.05) 30%, #0a0a0a 70%)`,
          animation: "obsidian-pulse 4s ease-in-out infinite",
        }}
      />
      {/* Inner shine */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.08) 0%, transparent 50%)",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// ORBIT RINGS
// ─────────────────────────────────────────────
function OrbitRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "800px" }}>
      {/* Ring 1 */}
      <div
        className="absolute rounded-full border border-emerald-500/10"
        style={{
          width: 350,
          height: 350,
          animation: "ring-spin 20s linear infinite",
        }}
      >
        <div className="absolute -top-1.5 left-1/2 w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
      </div>
      {/* Ring 2 */}
      <div
        className="absolute rounded-full border border-emerald-500/[0.06]"
        style={{
          width: 500,
          height: 500,
          animation: "ring-spin-reverse 30s linear infinite",
        }}
      >
        <div className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-emerald-300/60 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
        <div className="absolute top-1/2 -right-1 w-2 h-2 rounded-full bg-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
      </div>
      {/* Ring 3 */}
      <div
        className="absolute rounded-full border border-emerald-500/[0.03]"
        style={{
          width: 650,
          height: 650,
          animation: "ring-spin 45s linear infinite",
        }}
      >
        <div className="absolute -top-1 left-1/3 w-1.5 h-1.5 rounded-full bg-blue-400/40" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DEVICE MOCKUP
// ─────────────────────────────────────────────
function DeviceMockup({
  src,
  alt,
  className = "",
  delay = 0,
  active = true,
}: {
  src: string;
  alt: string;
  className?: string;
  delay?: number;
  active?: boolean;
}) {
  return (
    <Reveal active={active} delay={delay} direction="up" className={`device-mockup ${className}`}>
      <div className="device-frame w-[220px] md:w-[260px]">
        <Image
          src={src}
          alt={alt}
          width={260}
          height={520}
          className="w-full h-auto"
          priority
        />
      </div>
    </Reveal>
  );
}

// ─────────────────────────────────────────────
// GLASS CARD
// ─────────────────────────────────────────────
function GlassCard({
  children,
  className = "",
  glow = false,
  hover = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl p-6 ${glow ? "glass-card-glow" : "glass-card"} ${hover ? "transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] cursor-pointer" : ""} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// SECTION BADGE
// ─────────────────────────────────────────────
function SectionBadge({
  children,
  variant = "emerald",
}: {
  children: React.ReactNode;
  variant?: "emerald" | "amber" | "blue";
}) {
  const colors = {
    emerald: "bg-emerald-500/8 text-emerald-400 border-emerald-500/15",
    amber: "bg-amber-500/8 text-amber-400 border-amber-500/15",
    blue: "bg-blue-500/8 text-blue-400 border-blue-500/15",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wider uppercase ${colors[variant]}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: variant === "emerald" ? "#10B981" : variant === "amber" ? "#F59E0B" : "#3B82F6",
          boxShadow: `0 0 6px ${variant === "emerald" ? "rgba(16,185,129,0.6)" : variant === "amber" ? "rgba(245,158,11,0.6)" : "rgba(59,130,246,0.6)"}`,
        }}
      />
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────
// TIMELINE ITEM
// ─────────────────────────────────────────────
function TimelineItem({
  phase,
  title,
  status,
  items,
}: {
  phase: string;
  title: string;
  status: "done" | "next" | "future";
  items: string[];
}) {
  const dotColor = status === "done" ? "bg-emerald-500" : status === "next" ? "bg-amber-500" : "bg-gray-600";
  const glowColor =
    status === "done"
      ? "shadow-[0_0_10px_rgba(16,185,129,0.5)]"
      : status === "next"
        ? "shadow-[0_0_10px_rgba(245,158,11,0.5)]"
        : "";

  return (
    <div className="relative flex gap-5">
      <div className="flex flex-col items-center">
        <div className={`h-4 w-4 rounded-full ${dotColor} ${glowColor}`} />
        <div className="w-px flex-1 bg-gradient-to-b from-gray-700 to-transparent" />
      </div>
      <div className="pb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-sm font-semibold text-gray-500 font-mono">{phase}</span>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              status === "done"
                ? "bg-emerald-500/15 text-emerald-400"
                : status === "next"
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-gray-800 text-gray-500"
            }`}
          >
            {status === "done" ? "COMPLETE" : status === "next" ? "IN PROGRESS" : "PLANNED"}
          </span>
        </div>
        <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-gray-400 flex items-center gap-2.5">
              <CheckCircle2
                size={13}
                className={status === "done" ? "text-emerald-500" : "text-gray-700"}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SLIDES CONFIG
// ─────────────────────────────────────────────
const TOTAL_SLIDES = 19;

const slideLabels = [
  "Title",
  "Problem",
  "Solution",
  "Channels",
  "Consumer UX",
  "AI Features",
  "B2B Portal",
  "CRM Integration",
  "Academy",
  "Multi-Storefront",
  "Architecture",
  "Metrics",
  "Supply Chain",
  "Security",
  "i18n",
  "Roadmap",
  "Competitive Moat",
  "Revenue",
  "CTA",
];

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [overview, setOverview] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= TOTAL_SLIDES || idx === currentSlide) return;
      setDirection(idx > currentSlide ? "right" : "left");
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(idx);
        setIsTransitioning(false);
      }, 250);
    },
    [currentSlide]
  );

  const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);
  const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        if (overview) setOverview(false);
        else next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (!overview) prev();
      }
      if (e.key === "Escape") setOverview((o) => !o);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, prev, overview]);

  const progress = ((currentSlide + 1) / TOTAL_SLIDES) * 100;
  const active = !isTransitioning;

  const slideComponents = [
    <Slide01Title key={0} active={active} />,
    <Slide02Problem key={1} active={active} />,
    <Slide03Solution key={2} active={active} />,
    <Slide04Channels key={3} active={active} />,
    <Slide05ConsumerUX key={4} active={active} />,
    <Slide06AI key={5} active={active} />,
    <Slide07B2B key={6} active={active} />,
    <Slide08CRM key={7} active={active} />,
    <Slide09Academy key={8} active={active} />,
    <Slide10Storefronts key={9} active={active} />,
    <Slide11Architecture key={10} active={active} />,
    <Slide12Metrics key={11} active={active} />,
    <Slide13SupplyChain key={12} active={active} />,
    <Slide14Security key={13} active={active} />,
    <Slide15i18n key={14} active={active} />,
    <Slide16Roadmap key={15} active={active} />,
    <Slide17Moat key={16} active={active} />,
    <Slide18Revenue key={17} active={active} />,
    <Slide19CTA key={18} active={active} />,
  ];

  // ─── OVERVIEW GRID ───
  if (overview) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
        <div className="fixed inset-0 bg-[#050505] z-50 overflow-auto p-6 md:p-10" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Eye size={16} className="text-emerald-400" />
                </div>
                Overview
              </h2>
              <button
                onClick={() => setOverview(false)}
                className="text-gray-400 hover:text-white text-sm border border-gray-800 rounded-xl px-5 py-2.5 transition-colors hover:border-gray-600 cursor-pointer"
              >
                Close <span className="text-gray-600 ml-1">ESC</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {slideLabels.map((label, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentSlide(i);
                    setOverview(false);
                  }}
                  className={`group relative aspect-video rounded-xl border transition-all duration-200 flex flex-col items-center justify-center p-3 cursor-pointer ${
                    i === currentSlide
                      ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                      : "border-gray-800/50 bg-gray-900/30 hover:border-gray-700 hover:bg-gray-900/60"
                  }`}
                >
                  <span className="text-2xl font-black text-gray-700 group-hover:text-gray-500 transition-colors font-mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] text-gray-600 group-hover:text-gray-400 mt-1 transition-colors tracking-wide">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── MAIN VIEW ───
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
      <div
        className="fixed inset-0 bg-[#050505] text-white overflow-hidden select-none"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        {/* Progress bar */}
        <div className="fixed top-0 left-0 right-0 h-[2px] bg-gray-900/50 z-50">
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)",
              boxShadow: "0 0 10px rgba(16,185,129,0.5), 0 0 30px rgba(16,185,129,0.2)",
            }}
          />
        </div>

        {/* Slide content */}
        <div
          className="h-screen w-screen"
          style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning
              ? `translateX(${direction === "right" ? "30px" : "-30px"}) scale(0.98)`
              : "translateX(0) scale(1)",
            filter: isTransitioning ? "blur(4px)" : "blur(0)",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {slideComponents[currentSlide]}
        </div>

        {/* Nav dots */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-1 z-50">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-500 cursor-pointer ${
                i === currentSlide
                  ? "w-8 h-1.5 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : "w-1.5 h-1.5 bg-gray-800 hover:bg-gray-600"
              }`}
              aria-label={`Go to slide ${i + 1}: ${slideLabels[i]}`}
            />
          ))}
        </div>

        {/* Slide counter */}
        <div className="fixed bottom-6 right-8 text-xs text-gray-700 z-50 font-mono tracking-widest">
          {String(currentSlide + 1).padStart(2, "0")} / {TOTAL_SLIDES}
        </div>

        {/* Arrow buttons */}
        {currentSlide > 0 && (
          <button
            onClick={prev}
            className="fixed left-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-card flex items-center justify-center text-gray-500 hover:text-white hover:border-emerald-500/30 transition-all z-50 cursor-pointer"
            aria-label="Previous slide"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        {currentSlide < TOTAL_SLIDES - 1 && (
          <button
            onClick={next}
            className="fixed right-5 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-card flex items-center justify-center text-gray-500 hover:text-white hover:border-emerald-500/30 transition-all z-50 cursor-pointer"
            aria-label="Next slide"
          >
            <ArrowRight size={18} />
          </button>
        )}

        {/* ESC hint */}
        <div className="fixed top-5 right-8 flex items-center gap-2 z-50">
          <kbd className="px-2 py-0.5 rounded-md border border-gray-800 bg-gray-900/50 text-gray-600 text-[10px] font-mono">
            ESC
          </kbd>
          <span className="text-[10px] text-gray-700">overview</span>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 1 — TITLE (OBSIDIAN ORB + ORBIT)
// ═══════════════════════════════════════════════
function Slide01Title({ active }: { active: boolean }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden obsidian-surface">
      <Particles count={40} />
      <OrbitRings />

      <div className="relative z-10 flex flex-col items-center">
        <Reveal active={active} delay={0} direction="scale">
          <ObsidianOrb size={180} />
        </Reveal>

        <Reveal active={active} delay={300}>
          <h1 className="text-[8rem] md:text-[10rem] font-black tracking-tighter leading-none -mt-6">
            <span className="gradient-text">Aura</span>
          </h1>
        </Reveal>

        <Reveal active={active} delay={500}>
          <p className="text-xl md:text-2xl text-gray-400 mt-2 font-light tracking-[0.2em] uppercase">
            Energy, Anywhere
          </p>
        </Reveal>

        <Reveal active={active} delay={700}>
          <div className="mt-6">
            <SectionBadge>AI-Native Omni-Commerce Food Platform</SectionBadge>
          </div>
        </Reveal>

        <Reveal active={active} delay={1000}>
          <div className="flex items-center gap-3 mt-20 text-gray-600 text-sm">
            <span className="shimmer-text">Press</span>
            <kbd className="px-3 py-1.5 rounded-lg border border-gray-800 bg-gray-900/50 text-gray-500 text-xs font-mono">
              &rarr;
            </kbd>
            <span className="shimmer-text">to begin</span>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 2 — PROBLEM
// ═══════════════════════════════════════════════
function Slide02Problem({ active }: { active: boolean }) {
  const problems = [
    {
      icon: <Truck size={24} />,
      title: "Cold-Chain is Expensive",
      desc: "Refrigerated logistics cost 3-5x more than ambient shipping, killing margins for DTC food brands.",
      stat: "3-5x",
      statLabel: "higher cost",
    },
    {
      icon: <Package size={24} />,
      title: "Shelf-Stable is Mush",
      desc: "Existing options sacrifice taste and nutrition with heavy processing and preservatives.",
      stat: "72%",
      statLabel: "consumer distrust",
    },
    {
      icon: <Store size={24} />,
      title: "No Multi-Channel Platform",
      desc: "No single platform handles B2C subscriptions, B2B wholesale, vending, and specialty markets together.",
      stat: "0",
      statLabel: "unified solutions",
    },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={15} />
      <Reveal active={active} delay={0}>
        <SectionBadge variant="amber">The Market Gap</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-5xl md:text-8xl font-black mt-5 mb-3 text-center tracking-tight">
          The <span className="gradient-text-gold">$300B</span> Problem
        </h2>
      </Reveal>
      <Reveal active={active} delay={200}>
        <p className="text-gray-500 text-lg mb-14 text-center max-w-2xl font-light">
          The prepared food industry is trapped between expensive cold-chain logistics
          and low-quality shelf-stable options.
        </p>
      </Reveal>
      <div className="grid md:grid-cols-3 gap-5 max-w-5xl w-full">
        {problems.map((p, i) => (
          <Reveal key={i} active={active} delay={400 + i * 150}>
            <GlassCard hover className="h-full group">
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/8 border border-amber-500/15 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/15 transition-colors">
                  {p.icon}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-amber-400">{p.stat}</div>
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider">{p.statLabel}</div>
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">{p.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 3 — SOLUTION
// ═══════════════════════════════════════════════
function Slide03Solution({ active }: { active: boolean }) {
  const features = [
    { icon: <Clock size={28} />, label: "2-Year Shelf Life", sublabel: "No refrigeration needed" },
    { icon: <Sparkles size={28} />, label: "100% Natural", sublabel: "Zero preservatives" },
    { icon: <Zap size={28} />, label: "Ship Anywhere", sublabel: "Ambient temperature safe" },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={20} />

      {/* Background radial accent */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)" }}
      />

      <Reveal active={active} delay={0}>
        <SectionBadge>Our Answer</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-4xl md:text-7xl font-black mt-5 mb-5 text-center max-w-5xl leading-tight tracking-tight">
          Premium, All-Natural,{" "}
          <span className="gradient-text">Zero Refrigeration</span>
        </h2>
      </Reveal>
      <Reveal active={active} delay={200}>
        <p className="text-gray-500 text-lg mb-16 text-center max-w-2xl font-light">
          Chef-crafted meals using proprietary preservation technology that locks in
          nutrition and flavor without cold-chain dependency.
        </p>
      </Reveal>
      <div className="grid grid-cols-3 gap-8 md:gap-16 max-w-3xl w-full">
        {features.map((f, i) => (
          <Reveal key={i} active={active} delay={450 + i * 200} className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl glass-card-glow flex items-center justify-center text-emerald-400 mb-5 flowing-border">
              {f.icon}
            </div>
            <h3 className="text-lg md:text-xl font-bold">{f.label}</h3>
            <p className="text-sm text-gray-600 mt-1.5">{f.sublabel}</p>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 4 — CHANNELS
// ═══════════════════════════════════════════════
function Slide04Channels({ active }: { active: boolean }) {
  const channels = [
    { icon: <ShoppingCart size={22} />, name: "B2C Subscription", desc: "Monthly build-a-box, 15% savings", color: "text-emerald-400" },
    { icon: <Package size={22} />, name: "B2C One-Time", desc: "Single purchase, no commitment", color: "text-emerald-400" },
    { icon: <Building2 size={22} />, name: "B2B Wholesale", desc: "Tiered pricing, PO workflow", color: "text-blue-400" },
    { icon: <Coffee size={22} />, name: "Vending", desc: "Live API · smart vending partners", color: "text-amber-400" },
    { icon: <Anchor size={22} />, name: "Specialty", desc: "Marine, aviation, expeditions", color: "text-purple-400" },
    { icon: <Shield size={22} />, name: "Preparedness", desc: "Emergency & long-term storage", color: "text-red-400" },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={15} />
      <Reveal active={active} delay={0}>
        <SectionBadge>Revenue Channels</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-5xl md:text-8xl font-black mt-5 mb-3 text-center tracking-tight">
          <span className="gradient-text">6</span> Ways to Sell
        </h2>
      </Reveal>
      <Reveal active={active} delay={200}>
        <p className="text-gray-500 text-lg mb-12 text-center font-light">
          One platform, six distinct revenue streams.
        </p>
      </Reveal>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl w-full">
        {channels.map((ch, i) => (
          <Reveal key={i} active={active} delay={350 + i * 80}>
            <GlassCard hover className="flex items-start gap-4 h-full">
              <div className={`${ch.color} mt-0.5 shrink-0`}>{ch.icon}</div>
              <div>
                <h3 className="font-semibold text-sm md:text-base">{ch.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{ch.desc}</p>
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 5 — CONSUMER UX (with device mockups)
// ═══════════════════════════════════════════════
function Slide05ConsumerUX({ active }: { active: boolean }) {
  return (
    <div className="h-screen flex items-center justify-center px-6 md:px-16 relative obsidian-surface">
      <Particles count={10} />

      {/* Left content */}
      <div className="flex-1 max-w-md mr-8 hidden md:block">
        <Reveal active={active} delay={0}>
          <SectionBadge>Consumer Experience</SectionBadge>
        </Reveal>
        <Reveal active={active} delay={100}>
          <h2 className="text-5xl md:text-6xl font-black mt-5 mb-5 tracking-tight leading-none">
            Build-a-<span className="gradient-text">Box</span>
          </h2>
        </Reveal>
        <Reveal active={active} delay={200}>
          <p className="text-gray-500 text-base mb-8 font-light">
            Three steps to premium nutrition. As low as{" "}
            <span className="text-emerald-400 font-semibold">$6.25/meal</span>.
          </p>
        </Reveal>
        {[
          { step: "01", title: "Choose Your Plan", desc: "Starter (8), Voyager (12), or Bunker (24)" },
          { step: "02", title: "Pick Your Meals", desc: "Curated catalog, dietary filters" },
          { step: "03", title: "Subscribe & Save", desc: "15% off, skip or cancel anytime" },
        ].map((s, i) => (
          <Reveal key={i} active={active} delay={400 + i * 150}>
            <div className="flex items-start gap-4 mb-4">
              <span className="text-emerald-500/30 text-3xl font-black font-mono w-10 shrink-0">
                {s.step}
              </span>
              <div>
                <h3 className="font-bold text-sm">{s.title}</h3>
                <p className="text-xs text-gray-600">{s.desc}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Device mockups */}
      <div className="flex items-end gap-4 md:gap-6">
        <DeviceMockup
          src="/presentation/mobile-landing.png"
          alt="Aura landing page"
          active={active}
          delay={300}
          className="opacity-60 scale-90 hidden md:block"
        />
        <DeviceMockup
          src="/presentation/mobile-buildbox.png"
          alt="Build-a-Box interface"
          active={active}
          delay={500}
        />
        <DeviceMockup
          src="/presentation/mobile-products.png"
          alt="Product catalog"
          active={active}
          delay={700}
          className="opacity-60 scale-90 hidden md:block"
        />
      </div>

      {/* Mobile title */}
      <div className="md:hidden absolute top-20 left-6 right-6 text-center">
        <SectionBadge>Consumer Experience</SectionBadge>
        <h2 className="text-4xl font-black mt-3 tracking-tight">
          Build-a-<span className="gradient-text">Box</span>
        </h2>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 6 — AI FEATURES
// ═══════════════════════════════════════════════
function Slide06AI({ active }: { active: boolean }) {
  const features = [
    {
      icon: <MessageSquare size={24} />,
      title: "Ask Aura Chat",
      desc: "Conversational AI for product discovery, dietary questions, and personalized recommendations.",
      tech: "Gemini 2.5 Flash",
    },
    {
      icon: <Sparkles size={24} />,
      title: "Smart Fill",
      desc: "One-click box completion based on preferences, past orders, and nutritional goals.",
      tech: "Custom Algorithm",
    },
    {
      icon: <Brain size={24} />,
      title: "Vector Search",
      desc: "pgvector cosine similarity over product embeddings for hyper-relevant suggestions.",
      tech: "pgvector + Gemini",
    },
    {
      icon: <TrendingUp size={24} />,
      title: "Demand Forecasting",
      desc: "AI-powered inventory prediction to optimize stock levels and reduce waste.",
      tech: "Predictive ML",
    },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={20} />

      {/* Central glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 60%)" }}
      />

      <Reveal active={active} delay={0}>
        <SectionBadge>Intelligence Layer</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-5xl md:text-8xl font-black mt-5 mb-3 text-center tracking-tight">
          AI-<span className="gradient-text">Native</span>
        </h2>
      </Reveal>
      <Reveal active={active} delay={200}>
        <p className="text-gray-500 text-lg mb-12 text-center max-w-xl font-light">
          Not bolted on. Built in from day one.
        </p>
      </Reveal>
      <div className="grid md:grid-cols-2 gap-4 max-w-4xl w-full">
        {features.map((f, i) => (
          <Reveal key={i} active={active} delay={400 + i * 120}>
            <GlassCard hover className="flex gap-5 h-full group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0 group-hover:bg-emerald-500/15 transition-colors">
                {f.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-base">{f.title}</h3>
                  <span className="text-[10px] font-mono text-emerald-500/50 bg-emerald-500/5 px-2 py-0.5 rounded-full">
                    {f.tech}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 7 — B2B PORTAL
// ═══════════════════════════════════════════════
function Slide07B2B({ active }: { active: boolean }) {
  const features = [
    { icon: <Layers size={18} />, label: "Tiered Pricing" },
    { icon: <BarChart3 size={18} />, label: "Commission Dashboard" },
    { icon: <Truck size={18} />, label: "PO Workflow" },
    { icon: <MapPin size={18} />, label: "Multi-Location" },
    { icon: <Palette size={18} />, label: "White-Label" },
    { icon: <CircleDot size={18} />, label: "QR Virtual Distributor" },
    { icon: <Target size={18} />, label: "Sample Tracking" },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={10} />
      <Reveal active={active} delay={0}>
        <SectionBadge variant="blue">B2B Commerce</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-5xl md:text-8xl font-black mt-5 mb-3 text-center tracking-tight">
          Dealer <span className="gradient-text">Portal</span>
        </h2>
      </Reveal>
      <Reveal active={active} delay={200}>
        <p className="text-gray-500 text-lg mb-12 text-center max-w-2xl font-light">
          Full-featured B2B platform with Stripe Connect, enabling dealers to manage inventory,
          track commissions, and serve their own customers.
        </p>
      </Reveal>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl w-full">
        {features.map((f, i) => (
          <Reveal key={i} active={active} delay={400 + i * 80}>
            <div className="flex items-center gap-3 rounded-xl glass-card px-5 py-4 hover:border-blue-500/20 transition-all cursor-pointer">
              <div className="text-blue-400">{f.icon}</div>
              <span className="font-medium text-sm">{f.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal active={active} delay={900}>
        <div className="mt-10">
          <GlassCard glow className="px-8 py-4 text-center">
            <p className="text-sm text-gray-400">
              Dealers earn{" "}
              <span className="text-amber-400 font-bold text-lg">8-15%</span>{" "}
              commission on every referral
            </p>
          </GlassCard>
        </div>
      </Reveal>
    </div>
  );
}

// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// SLIDE 8 — CRM INTEGRATION (Aura ↔ MenuMaster)
// ═══════════════════════════════════════════════
function Slide08CRM({ active }: { active: boolean }) {
  const flow = [
    { step: "01", label: "Admin Allocates", desc: "Assign sample packs from Aura inventory to a sales agent", color: "text-emerald-400" },
    { step: "02", label: "Agent Delivers", desc: "Sales person gives samples to supermarket lead, logged in CRM", color: "text-blue-400" },
    { step: "03", label: "CRM Tracks", desc: "MenuMaster records activity, updates lead status automatically", color: "text-amber-400" },
    { step: "04", label: "Lead Converts", desc: "Webhook fires back → Aura creates B2B organization + contract", color: "text-emerald-400" },
  ];

  const integrations = [
    { icon: <Users size={16} />, label: "Leads & Contacts sync" },
    { icon: <Target size={16} />, label: "Sample custody tracking" },
    { icon: <BarChart3 size={16} />, label: "Activity timeline" },
    { icon: <Workflow size={16} />, label: "Bi-directional webhooks" },
    { icon: <Building2 size={16} />, label: "Auto org creation" },
    { icon: <CircleDot size={16} />, label: "Dealer ↔ CRM user sync" },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={15} />
      <Reveal active={active} delay={0}>
        <SectionBadge variant="amber">CRM Integration</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-4xl md:text-7xl font-black mt-5 mb-3 text-center tracking-tight">
          Aura <span className="gradient-text-gold">↔</span> MenuMaster
        </h2>
      </Reveal>
      <Reveal active={active} delay={200}>
        <p className="text-gray-500 text-lg mb-10 text-center max-w-2xl font-light">
          Seamless B2B sales pipeline. Track samples from warehouse to supermarket shelf.
        </p>
      </Reveal>

      {/* Flow steps */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 max-w-4xl w-full mb-8">
        {flow.map((f, i) => (
          <Reveal key={i} active={active} delay={350 + i * 120} className="flex-1">
            <GlassCard className="h-full relative overflow-hidden">
              <span className={`text-5xl font-black opacity-[0.06] absolute -top-1 -right-1 ${f.color}`}>
                {f.step}
              </span>
              <span className={`text-xs font-mono font-bold ${f.color}`}>
                Step {f.step}
              </span>
              <h3 className="text-sm font-bold mt-1.5 mb-1">{f.label}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </GlassCard>
          </Reveal>
        ))}
      </div>

      {/* Integration features */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-3xl w-full">
        {integrations.map((item, i) => (
          <Reveal key={i} active={active} delay={850 + i * 60}>
            <div className="flex items-center gap-2.5 rounded-xl glass-card px-4 py-3 hover:border-amber-500/20 transition-all cursor-pointer">
              <div className="text-amber-400">{item.icon}</div>
              <span className="font-medium text-xs">{item.label}</span>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal active={active} delay={1300}>
        <p className="mt-6 text-xs text-gray-600 text-center">
          Live integration via webhook API &mdash;{" "}
          <span className="text-amber-400 font-semibold">crm.inspiration-ai.com</span>
        </p>
      </Reveal>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 9 — ACADEMY
// ═══════════════════════════════════════════════
function Slide09Academy({ active }: { active: boolean }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={10} />
      <Reveal active={active} delay={0}>
        <SectionBadge variant="amber">Engagement</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-5xl md:text-8xl font-black mt-5 mb-3 text-center tracking-tight">
          Aura <span className="gradient-text-gold">Academy</span>
        </h2>
      </Reveal>
      <Reveal active={active} delay={200}>
        <p className="text-gray-500 text-lg mb-14 text-center max-w-2xl font-light">
          Chef-curated recipes that transform our meals into
          culinary experiences, driving engagement and reducing churn.
        </p>
      </Reveal>
      <Reveal active={active} delay={400}>
        <GlassCard className="max-w-2xl w-full">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/8 border border-amber-500/15 flex items-center justify-center">
              <ChefHat size={26} className="text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Chef-Crafted Recipes</h3>
              <p className="text-sm text-gray-600">Step-by-step visual guides</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { step: "1", text: "Select any Aura product as your base ingredient" },
              { step: "2", text: "Follow chef instructions with prep times and tips" },
              { step: "3", text: "Share your creation with the Aura community" },
            ].map((item, i) => (
              <Reveal key={i} active={active} delay={600 + i * 120}>
                <div className="flex items-center gap-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3.5">
                  <span className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                    {item.step}
                  </span>
                  <span className="text-sm text-gray-300">{item.text}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </GlassCard>
      </Reveal>
      <Reveal active={active} delay={1000}>
        <p className="mt-8 text-sm text-gray-600 text-center">
          Content-driven retention &mdash; recipe users have{" "}
          <span className="text-emerald-400 font-bold">2.3x higher LTV</span>
        </p>
      </Reveal>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 10 — MULTI-STOREFRONT
// ═══════════════════════════════════════════════
function Slide10Storefronts({ active }: { active: boolean }) {
  const stores = [
    { name: "Main Store", color: "#10B981", desc: "Full catalog, subscriptions" },
    { name: "Outdoor & Camping", color: "#F59E0B", desc: "Adventure-optimized selection" },
    { name: "Marine & Aviation", color: "#3B82F6", desc: "Coast Guard approved" },
    { name: "Preparedness", color: "#EF4444", desc: "Long-term storage bundles" },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={10} />
      <Reveal active={active} delay={0}>
        <SectionBadge>Multi-Brand</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-5xl md:text-8xl font-black mt-5 mb-3 text-center tracking-tight">
          <span className="gradient-text">4</span> Themed Stores
        </h2>
      </Reveal>
      <Reveal active={active} delay={200}>
        <p className="text-gray-500 text-lg mb-12 text-center max-w-xl font-light">
          One codebase, four distinct shopping experiences tailored to each audience.
        </p>
      </Reveal>
      <div className="grid grid-cols-2 gap-4 max-w-3xl w-full">
        {stores.map((s, i) => (
          <Reveal key={i} active={active} delay={400 + i * 120}>
            <GlassCard hover className="h-full">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: s.color, boxShadow: `0 0 10px ${s.color}40` }}
                />
                <h3 className="font-bold">{s.name}</h3>
              </div>
              <p className="text-sm text-gray-500">{s.desc}</p>
              <div className="mt-5 flex gap-2">
                <div className="h-1 flex-1 rounded-full" style={{ background: s.color, opacity: 0.4 }} />
                <div className="h-1 w-8 rounded-full bg-white/5" />
                <div className="h-1 w-4 rounded-full bg-white/[0.03]" />
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 11 — ARCHITECTURE
// ═══════════════════════════════════════════════
function Slide11Architecture({ active }: { active: boolean }) {
  const layers = [
    { label: "Frontend", tech: "Next.js 16 + React 19 + Tailwind 4", color: "#10B981", icon: <Code2 size={16} /> },
    { label: "API Layer", tech: "58 REST Endpoints + Server Actions", color: "#3B82F6", icon: <Server size={16} /> },
    { label: "Edge Functions", tech: "7 Supabase Edge Functions (Deno)", color: "#8B5CF6", icon: <Zap size={16} /> },
    { label: "Intelligence", tech: "Pricing Engine + Gemini AI + pgvector", color: "#F59E0B", icon: <Brain size={16} /> },
    { label: "CRM Integration", tech: "MenuMaster API · Sample Tracking · Dealer Sync", color: "#EC4899", icon: <Users size={16} /> },
    { label: "Data Layer", tech: "Supabase Postgres (47+ tables, RLS)", color: "#06B6D4", icon: <Database size={16} /> },
    { label: "Automation", tech: "n8n Workflows + Stripe + EasyPost", color: "#6B7280", icon: <Workflow size={16} /> },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={15} />
      <Reveal active={active} delay={0}>
        <SectionBadge variant="blue">Technical Architecture</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-5xl md:text-8xl font-black mt-5 mb-12 text-center tracking-tight">
          The Stack
        </h2>
      </Reveal>
      <div className="max-w-2xl w-full space-y-2.5">
        {layers.map((layer, i) => (
          <Reveal key={i} active={active} delay={300 + i * 100}>
            <div
              className="rounded-xl glass-card px-6 py-4 flex items-center justify-between group hover:border-opacity-30 transition-all cursor-pointer"
              style={{ borderColor: `${layer.color}15` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${layer.color}10`, color: layer.color }}
                >
                  {layer.icon}
                </div>
                <span className="font-bold text-sm" style={{ color: layer.color }}>
                  {layer.label}
                </span>
              </div>
              <span className="text-xs text-gray-500 font-mono">{layer.tech}</span>
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal active={active} delay={1000}>
        <div className="flex items-center gap-4 mt-8 text-[11px] text-gray-600">
          <div className="flex items-center gap-1.5">
            <Cpu size={12} />
            <span>Serverless-first</span>
          </div>
          <span className="text-gray-800">|</span>
          <div className="flex items-center gap-1.5">
            <Globe size={12} />
            <span>Edge-optimized</span>
          </div>
          <span className="text-gray-800">|</span>
          <div className="flex items-center gap-1.5">
            <GitBranch size={12} />
            <span>CI/CD ready</span>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 12 — METRICS
// ═══════════════════════════════════════════════
function Slide12Metrics({ active }: { active: boolean }) {
  const heroMetrics = [
    { value: 59, suffix: "K", label: "Lines of Code", icon: <Code2 size={22} />, color: "#10B981" },
    { value: 54, suffix: "", label: "Pages", icon: <Layers size={22} />, color: "#3B82F6" },
    { value: 58, suffix: "", label: "API Endpoints", icon: <Server size={22} />, color: "#8B5CF6" },
    { value: 47, suffix: "+", label: "Database Tables", icon: <Database size={22} />, color: "#F59E0B" },
  ];

  const detailMetrics = [
    { value: 202, suffix: "", label: "Source Files", icon: <Code2 size={15} /> },
    { value: 25, suffix: "", label: "UI Components", icon: <Palette size={15} /> },
    { value: 7, suffix: "", label: "Edge Functions", icon: <Zap size={15} /> },
    { value: 166, suffix: "", label: "E2E Tests", icon: <TestTube2 size={15} /> },
    { value: 7, suffix: "", label: "Custom Hooks", icon: <GitBranch size={15} /> },
    { value: 35, suffix: "", label: "Lib Modules", icon: <Package size={15} /> },
    { value: 4, suffix: "", label: "Languages", icon: <Globe size={15} /> },
    { value: 4, suffix: "", label: "Currencies", icon: <Coins size={15} /> },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={20} />

      {/* Central glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)" }}
      />

      <Reveal active={active} delay={0}>
        <SectionBadge>By The Numbers</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-5xl md:text-8xl font-black mt-5 mb-10 text-center tracking-tight">
          Platform <span className="gradient-text">Scale</span>
        </h2>
      </Reveal>

      {/* Hero metrics — big numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mb-6">
        {heroMetrics.map((m, i) => (
          <Reveal key={i} active={active} delay={250 + i * 100}>
            <GlassCard className="text-center group hover:border-emerald-500/20 transition-all cursor-pointer relative overflow-hidden">
              {/* Background accent */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 80%, ${m.color}08, transparent 70%)` }}
              />
              <div
                className="flex justify-center mb-3 transition-colors"
                style={{ color: `${m.color}60` }}
              >
                {m.icon}
              </div>
              <div className="text-4xl md:text-5xl font-black text-white relative">
                <AnimatedCounter end={m.value} suffix={m.suffix} active={active} duration={1800 + i * 100} />
              </div>
              <div className="text-[10px] text-gray-600 mt-2 font-medium uppercase tracking-widest">
                {m.label}
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>

      {/* Detail metrics — smaller, denser grid */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2 max-w-4xl w-full">
        {detailMetrics.map((m, i) => (
          <Reveal key={i} active={active} delay={700 + i * 60}>
            <div className="glass-card rounded-xl p-3 text-center group hover:border-emerald-500/15 transition-all cursor-pointer">
              <div className="text-emerald-400/30 flex justify-center mb-1.5 group-hover:text-emerald-400/60 transition-colors">
                {m.icon}
              </div>
              <div className="text-lg md:text-xl font-bold text-white">
                <AnimatedCounter end={m.value} suffix={m.suffix} active={active} duration={1200 + i * 60} />
              </div>
              <div className="text-[8px] text-gray-700 mt-1 font-medium uppercase tracking-wider leading-tight">
                {m.label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 13 — SUPPLY CHAIN
// ═══════════════════════════════════════════════
function Slide13SupplyChain({ active }: { active: boolean }) {
  const chain = [
    { label: "Suzazon Mexico", desc: "Manufacturing & QC", icon: <Building2 size={22} />, flag: "MX" },
    { label: "El Paso, TX", desc: "Cross-border hub", icon: <Truck size={22} />, flag: "US" },
    { label: "USA Distribution", desc: "Nationwide ambient", icon: <MapPin size={22} />, flag: "US" },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={10} />
      <Reveal active={active} delay={0}>
        <SectionBadge>Operations</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-5xl md:text-8xl font-black mt-5 mb-3 text-center tracking-tight">
          Supply <span className="gradient-text">Chain</span>
        </h2>
      </Reveal>
      <Reveal active={active} delay={200}>
        <p className="text-gray-500 text-lg mb-14 text-center max-w-xl font-light">
          Vertically integrated from production to doorstep.
        </p>
      </Reveal>

      {/* Chain visualization */}
      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-0 max-w-4xl w-full">
        {chain.map((step, i) => (
          <Reveal key={i} active={active} delay={400 + i * 200} className="flex items-center">
            <GlassCard glow className="text-center w-56">
              <div className="text-emerald-400 flex justify-center mb-3">{step.icon}</div>
              <h3 className="font-bold">{step.label}</h3>
              <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
            </GlassCard>
            {i < chain.length - 1 && (
              <div className="hidden md:flex px-3 text-gray-700">
                <ArrowRight size={20} />
              </div>
            )}
          </Reveal>
        ))}
      </div>

      <Reveal active={active} delay={1000}>
        <div className="grid grid-cols-2 gap-10 mt-12">
          <div className="text-center">
            <div className="text-sm font-bold text-amber-400 flex items-center justify-center gap-2">
              <Workflow size={14} />
              n8n Automation
            </div>
            <div className="text-xs text-gray-600 mt-1.5">Fulfillment, stock alerts, PO generation</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-amber-400 flex items-center justify-center gap-2">
              <Brain size={14} />
              AI Forecasting
            </div>
            <div className="text-xs text-gray-600 mt-1.5">Demand prediction, reorder optimization</div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 14 — SECURITY
// ═══════════════════════════════════════════════
function Slide14Security({ active }: { active: boolean }) {
  const checks = [
    { text: "Rate Limiting on all API endpoints", category: "API" },
    { text: "CSRF Token Protection", category: "AUTH" },
    { text: "XSS Prevention + Content Security Policy", category: "WEB" },
    { text: "Security Headers (HSTS, X-Frame-Options)", category: "HTTP" },
    { text: "Row Level Security on all tables", category: "DB" },
    { text: "PCI DSS Compliant via Stripe", category: "PAY" },
    { text: "OWASP Top 10 Addressed", category: "STD" },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={10} />
      <Reveal active={active} delay={0}>
        <SectionBadge>Security Posture</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-5xl md:text-8xl font-black mt-5 mb-3 text-center tracking-tight">
          Secure by <span className="gradient-text">Design</span>
        </h2>
      </Reveal>
      <Reveal active={active} delay={200}>
        <p className="text-gray-500 text-lg mb-12 text-center max-w-xl font-light">
          Enterprise-grade security baked into every layer.
        </p>
      </Reveal>
      <div className="max-w-xl w-full space-y-2.5">
        {checks.map((check, i) => (
          <Reveal key={i} active={active} delay={400 + i * 80}>
            <div className="flex items-center gap-4 rounded-xl glass-card px-5 py-3.5 hover:border-emerald-500/20 transition-all cursor-pointer">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              <span className="text-sm text-gray-300 flex-1">{check.text}</span>
              <span className="text-[9px] font-mono text-gray-700 bg-white/[0.03] px-2 py-0.5 rounded">
                {check.category}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 15 — i18n
// ═══════════════════════════════════════════════
function Slide15i18n({ active }: { active: boolean }) {
  const languages = [
    { flag: "US", lang: "English", code: "EN" },
    { flag: "MX", lang: "Espanol", code: "ES" },
    { flag: "FR", lang: "Francais", code: "FR" },
    { flag: "BR", lang: "Portugues", code: "PT" },
  ];
  const currencies = [
    { symbol: "$", code: "USD", name: "US Dollar" },
    { symbol: "$", code: "MXN", name: "Mexican Peso" },
    { symbol: "\u20AC", code: "EUR", name: "Euro" },
    { symbol: "R$", code: "BRL", name: "Brazilian Real" },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={10} />
      <Reveal active={active} delay={0}>
        <SectionBadge>Global Ready</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-5xl md:text-8xl font-black mt-5 mb-12 text-center tracking-tight">
          <span className="gradient-text">i18n</span> &{" "}
          <span className="gradient-text-gold">Currency</span>
        </h2>
      </Reveal>
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl w-full">
        <Reveal active={active} delay={300}>
          <GlassCard>
            <div className="flex items-center gap-2.5 mb-5">
              <Languages size={18} className="text-emerald-400" />
              <h3 className="font-bold text-sm">4 Languages</h3>
            </div>
            <div className="space-y-2.5">
              {languages.map((l, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3">
                  <span className="text-sm font-medium">{l.lang}</span>
                  <span className="text-xs font-mono text-gray-600">{l.code}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </Reveal>
        <Reveal active={active} delay={500}>
          <GlassCard>
            <div className="flex items-center gap-2.5 mb-5">
              <Coins size={18} className="text-amber-400" />
              <h3 className="font-bold text-sm">4 Currencies</h3>
            </div>
            <div className="space-y-2.5">
              {currencies.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-amber-500/8 border border-amber-500/15 flex items-center justify-center text-amber-400 text-sm font-bold">
                      {c.symbol}
                    </span>
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                  <span className="text-xs font-mono text-gray-600">{c.code}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 16 — ROADMAP
// ═══════════════════════════════════════════════
function Slide16Roadmap({ active }: { active: boolean }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={10} />
      <Reveal active={active} delay={0}>
        <SectionBadge>Timeline</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-5xl md:text-8xl font-black mt-5 mb-12 text-center tracking-tight">
          Roadmap
        </h2>
      </Reveal>
      <div className="max-w-2xl w-full">
        <Reveal active={active} delay={300}>
          <TimelineItem
            phase="Phase 1"
            title="Core Platform"
            status="done"
            items={["Build-a-Box subscription flow", "Stripe payments & webhooks", "Product catalog & admin panel", "User auth & profiles"]}
          />
        </Reveal>
        <Reveal active={active} delay={500}>
          <TimelineItem
            phase="Phase 2"
            title="Intelligence Layer"
            status="done"
            items={["AI chat assistant (Gemini)", "Smart Fill & recommendations", "B2B dealer portal", "Multi-storefront architecture"]}
          />
        </Reveal>
        <Reveal active={active} delay={700}>
          <TimelineItem
            phase="Phase 3"
            title="Scale Operations"
            status="done"
            items={["n8n workflow automation", "Demand forecasting AI", "Vending machine API", "CRM & sample tracking"]}
          />
        </Reveal>
        <Reveal active={active} delay={900}>
          <TimelineItem
            phase="Phase 4"
            title="Market Expansion"
            status="next"
            items={["Mobile app (React Native)", "International markets", "White-label platform licensing", "API marketplace"]}
          />
        </Reveal>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 17 — COMPETITIVE MOAT
// ═══════════════════════════════════════════════
function Slide17Moat({ active }: { active: boolean }) {
  const moats = [
    {
      icon: <Box size={24} />,
      title: "Product Moat",
      desc: "No cold-chain dependency. Premium quality at ambient temperatures. 2-year shelf life eliminates waste and expands addressable markets.",
      color: "#10B981",
    },
    {
      icon: <Brain size={24} />,
      title: "Technology Moat",
      desc: "AI-native from day one. We own our recommendation engine, demand forecasting, and conversational commerce stack.",
      color: "#F59E0B",
    },
    {
      icon: <Truck size={24} />,
      title: "Logistics Moat",
      desc: "Ambient shipping costs 3-5x less. Wider delivery reach, fewer failed deliveries, lower customer acquisition cost.",
      color: "#3B82F6",
    },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={15} />
      <Reveal active={active} delay={0}>
        <SectionBadge>Defensibility</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-5xl md:text-8xl font-black mt-5 mb-3 text-center tracking-tight">
          Competitive <span className="gradient-text">Moat</span>
        </h2>
      </Reveal>
      <Reveal active={active} delay={200}>
        <p className="text-gray-500 text-lg mb-12 text-center max-w-xl font-light">
          Three reinforcing advantages that compound over time.
        </p>
      </Reveal>
      <div className="grid md:grid-cols-3 gap-5 max-w-5xl w-full">
        {moats.map((m, i) => (
          <Reveal key={i} active={active} delay={400 + i * 150}>
            <GlassCard hover className="h-full" style={{ borderColor: `${m.color}15` }}>
              <div className="mb-5" style={{ color: m.color }}>{m.icon}</div>
              <h3 className="text-lg font-bold mb-3">{m.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 18 — REVENUE
// ═══════════════════════════════════════════════
function Slide18Revenue({ active }: { active: boolean }) {
  const streams = [
    { label: "B2C Subscription", range: "$59 - $149/mo", icon: <ShoppingCart size={16} /> },
    { label: "B2C One-Time", range: "$69 - $179", icon: <Package size={16} /> },
    { label: "B2B Wholesale", range: "Volume pricing", icon: <Building2 size={16} /> },
    { label: "Vending Commissions", range: "Rev share", icon: <Coffee size={16} /> },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative obsidian-surface">
      <Particles count={15} />
      <Reveal active={active} delay={0}>
        <SectionBadge variant="amber">Business Model</SectionBadge>
      </Reveal>
      <Reveal active={active} delay={100}>
        <h2 className="text-5xl md:text-8xl font-black mt-5 mb-3 text-center tracking-tight">
          Revenue <span className="gradient-text-gold">Model</span>
        </h2>
      </Reveal>
      <Reveal active={active} delay={200}>
        <p className="text-gray-500 text-lg mb-12 text-center max-w-xl font-light">
          Recurring-first with multiple revenue multipliers.
        </p>
      </Reveal>
      <div className="grid grid-cols-2 gap-3 max-w-2xl w-full mb-10">
        {streams.map((s, i) => (
          <Reveal key={i} active={active} delay={400 + i * 80}>
            <GlassCard hover className="flex items-center gap-4">
              <div className="text-amber-400">{s.icon}</div>
              <div>
                <div className="font-semibold text-sm">{s.label}</div>
                <div className="text-xs text-gray-600">{s.range}</div>
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>
      <Reveal active={active} delay={800}>
        <GlassCard glow className="max-w-lg w-full flowing-border">
          <div className="flex items-center gap-3 mb-5">
            <Target size={18} className="text-emerald-400" />
            <h3 className="font-bold text-sm">Year 1 Targets</h3>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-4xl font-black gradient-text">
                <AnimatedCounter end={1000} active={active} prefix="" suffix="" duration={2000} />
              </div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Active Subscribers</div>
            </div>
            <div>
              <div className="text-4xl font-black gradient-text-gold">
                <AnimatedCounter end={50} active={active} suffix="" duration={1500} />
              </div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mt-1">Dealer Partners</div>
            </div>
          </div>
        </GlassCard>
      </Reveal>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SLIDE 19 — CTA
// ═══════════════════════════════════════════════
function Slide19CTA({ active }: { active: boolean }) {
  const nextSteps = [
    { icon: <DollarSign size={18} />, text: "Configure Stripe for production payments" },
    { icon: <Rocket size={18} />, text: "Deploy to Vercel with edge optimization" },
    { icon: <Users size={18} />, text: "Onboard first 10 customers" },
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center px-6 md:px-20 relative overflow-hidden obsidian-surface">
      <Particles count={50} />
      <OrbitRings />

      <div className="relative z-10 flex flex-col items-center">
        <Reveal active={active} delay={0} direction="scale">
          <ObsidianOrb size={120} />
        </Reveal>

        <Reveal active={active} delay={200}>
          <h2 className="text-5xl md:text-8xl font-black mt-2 mb-3 text-center tracking-tight">
            Let&apos;s Build{" "}
            <span className="gradient-text">Aura</span>
          </h2>
        </Reveal>

        <Reveal active={active} delay={400}>
          <p className="text-gray-500 text-lg mb-12 text-center max-w-xl font-light">
            The platform is built. The product is proven. Now we scale.
          </p>
        </Reveal>

        <div className="space-y-2.5 max-w-md w-full mb-12">
          {nextSteps.map((step, i) => (
            <Reveal key={i} active={active} delay={600 + i * 120}>
              <div className="flex items-center gap-4 rounded-xl glass-card-glow px-5 py-4 flowing-border hover:bg-emerald-500/5 transition-colors cursor-pointer">
                <div className="text-emerald-400">{step.icon}</div>
                <span className="text-sm font-medium">{step.text}</span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal active={active} delay={1000}>
          <div className="flex items-center gap-3 text-gray-500">
            <Mail size={16} />
            <a
              href="mailto:gio@gvargas.com"
              className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              gio@gvargas.com
            </a>
          </div>
        </Reveal>

        <Reveal active={active} delay={1200}>
          <div className="mt-10 flex items-center gap-2 text-[11px] text-gray-700">
            <Star size={11} />
            <span className="font-mono">Built with Next.js 16 &middot; React 19 &middot; Supabase &middot; Stripe</span>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
