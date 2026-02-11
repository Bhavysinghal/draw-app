"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { 
  motion, 
  useMotionValue, 
  useSpring, 
  useTransform, 
  MotionValue 
} from "framer-motion";
import { 
  Home as HomeIcon,
  Pencil, 
  Moon, 
  Sun, 
  LogIn, 
  UserPlus, 
  Info,
  MousePointer2,
  Terminal,
  Shapes,
  Hexagon,
  Triangle,
  MoveUpRight,
  Minus,
  X,
  CircleDashed
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Dock Component ---

function DockItem({
  mouseX,
  icon: Icon,
  href,
  onClick,
  label,
  active = false,
}: {
  mouseX: MotionValue;
  icon?: React.ElementType;
  href?: string;
  onClick?: () => void;
  label?: string;
  active?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Dynamic dimensions based on content type (Icon vs Text)
  const isIcon = !!Icon;
  const baseWidth = isIcon ? 40 : 90;
  const maxWidth = isIcon ? 80 : 130;

  const widthTransform = useTransform(distance, [-150, 0, 150], [baseWidth, maxWidth, baseWidth]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 60, 40]);
  
  // Scale content inside
  const scaleTransform = useTransform(distance, [-150, 0, 150], [1, 1.2, 1]);

  const width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const contentScale = useSpring(scaleTransform, { mass: 0.1, stiffness: 150, damping: 12 });

  const content = (
    <motion.div
      ref={ref}
      style={{ width, height }}
      className={cn(
        "flex items-center justify-center relative transition-colors duration-200 cursor-pointer",
        isIcon ? "rounded-full aspect-square" : "rounded-full px-2", // Circle for icons, Pill for text
        active 
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
          : "bg-background/80 hover:bg-muted border border-border text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
    >
      <motion.div style={{ scale: contentScale }} className="flex items-center justify-center whitespace-nowrap">
        {Icon ? <Icon className="w-5 h-5" /> : <span className="text-sm font-medium">{label}</span>}
      </motion.div>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} title={label}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} title={label} className="focus:outline-none">
      {content}
    </button>
  );
}

const FloatingDock = () => {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false); // 1. Add mounted state
  const mouseX = useMotionValue(Infinity);

  // 2. Set mounted to true only after client-side hydration is complete
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-full bg-background/20 backdrop-blur-lg border border-white/20 shadow-2xl ring-1 ring-black/5"
    >
      {/* 1. Home Icon */}
      <DockItem 
        mouseX={mouseX} 
        icon={HomeIcon}
        href="/" 
        label="Home"
      />

      {/* 2. Theme Toggle Icon */}
      {/* 👇 FIX: Show Moon (default) until mounted, then show correct icon */}
      <DockItem 
        mouseX={mouseX} 
        icon={!mounted ? Moon : (theme === "dark" ? Sun : Moon)}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        label="Toggle Theme"
      />

      {/* Divider */}
      <div className="w-px h-6 bg-border/50 self-center mx-1" />

      {/* 3. About Us (Text) */}
      <DockItem 
        mouseX={mouseX} 
        href="#about" 
        label="About Us" 
      />

      {/* 4. Sign In (Text) */}
      <DockItem 
        mouseX={mouseX} 
        href="/auth?mode=signin" 
        label="Sign In" 
      />

      {/* 5. Sign Up (Text) */}
      <DockItem 
        mouseX={mouseX} 
        href="/auth?mode=signup" 
        label="Sign Up" 
        active 
      />
    </motion.div>
  );
};

// --- Background Shapes Component ---

const BackgroundShapes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      
      {/* 1. Small Circle - Top Left */}
      <motion.svg
        className="absolute top-[12%] left-[8%] text-primary/30 w-16 h-16"
        fill="currentColor"
        fillOpacity="0.05"
        viewBox="0 0 100 100"
        initial={{ y: 0, rotate: 0 }}
        animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="4" strokeDasharray="6 4" />
      </motion.svg>

      {/* 2. Mini Hexagon - Top Right */}
      <motion.div
         className="absolute top-[18%] right-[12%] text-purple-500/30"
         initial={{ rotate: 0, y: 0 }}
         animate={{ rotate: 360, y: [0, 15, 0] }}
         transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <Hexagon className="w-20 h-20 stroke-[1.5px] stroke-dashed fill-purple-500/5" />
      </motion.div>

      {/* 3. Small Square - Center Left */}
      <motion.svg
        className="absolute top-[40%] left-[5%] text-blue-500/30 w-12 h-12"
        fill="none"
        viewBox="0 0 100 100"
        initial={{ y: 0, rotate: 15 }}
        animate={{ y: [0, 20, 0], rotate: [15, 0, 15] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <rect x="10" y="10" width="80" height="80" rx="15" stroke="currentColor" strokeWidth="6" />
      </motion.svg>

      {/* 4. Triangle - Bottom Right */}
      <motion.div
        className="absolute bottom-[25%] right-[10%] text-orange-500/30"
        initial={{ y: 0, rotate: -10 }}
        animate={{ y: [0, -15, 0], rotate: [-10, -20, -10] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <Triangle className="w-16 h-16 stroke-[1.5px] fill-orange-500/5" />
      </motion.div>

      {/* 5. Bezier Curve - Top Center */}
      <motion.svg
        className="absolute top-[22%] left-[45%] text-pink-500/30 w-32 h-16"
        fill="none"
        viewBox="0 0 200 100"
        initial={{ x: 0 }}
        animate={{ x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M10 50 Q 100 0 190 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="8 8" />
      </motion.svg>

      {/* 6. Mini Donut - Bottom Left */}
      <motion.svg
        className="absolute bottom-[15%] left-[20%] text-emerald-500/30 w-14 h-14"
        fill="none"
        viewBox="0 0 100 100"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="3" />
        <circle cx="50" cy="50" r="20" stroke="currentColor" strokeWidth="3" />
      </motion.svg>

      {/* 7. ZigZag Line - Right Center */}
      <motion.svg
        className="absolute top-[55%] right-[5%] text-yellow-500/30 w-10 h-32"
        fill="none"
        viewBox="0 0 50 150"
        initial={{ y: 0 }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M25 10 L40 30 L10 50 L40 70 L10 90 L25 110" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>

      {/* 8. X Marks - Scattered */}
      <motion.div className="absolute top-[30%] left-[15%] text-red-400/20" animate={{ rotate: 90 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
         <Minus className="w-8 h-8 rotate-45" />
         <Minus className="w-8 h-8 -rotate-45 -mt-8" />
      </motion.div>
      <motion.div className="absolute bottom-[40%] right-[30%] text-cyan-400/20" animate={{ rotate: -90 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}>
         <Minus className="w-6 h-6 rotate-45" />
         <Minus className="w-6 h-6 -rotate-45 -mt-6" />
      </motion.div>

      {/* 9. Arrow / Direction - Top Leftish */}
      <motion.div
        className="absolute top-[15%] left-[25%] text-indigo-400/20"
        animate={{ x: [0, 5, 0], y: [0, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <MoveUpRight className="w-10 h-10" />
      </motion.div>

       {/* 10. Abstract Shape Cluster - Bottom Center */}
       <motion.div 
        className="absolute bottom-[8%] left-[50%] -translate-x-1/2 text-cyan-500/20"
        initial={{ rotate: 0 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
         <Shapes className="w-20 h-20 opacity-50" />
      </motion.div>

      {/* 11. Dashed Measurement Line - Center Right */}
      <div className="absolute top-[35%] right-[25%] w-32 h-px bg-gradient-to-r from-transparent via-stone-400/30 to-transparent border-t border-dashed border-stone-500/30" />

      {/* 12. Floating Dots */}
      <motion.div className="absolute top-[60%] left-[10%] w-2 h-2 rounded-full bg-primary/20" animate={{ y: [0, -20, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 4, repeat: Infinity }} />
      <motion.div className="absolute top-[20%] right-[40%] w-3 h-3 rounded-full bg-purple-500/20" animate={{ y: [0, 20, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} />
      <motion.div className="absolute bottom-[30%] left-[40%] w-2 h-2 rounded-full bg-orange-500/20" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, delay: 2 }} />

      {/* 13. Dotted Grid Patch - Right Middle */}
      <div className="absolute top-[40%] right-[8%] grid grid-cols-3 gap-2 opacity-20">
        {[...Array(9)].map((_, i) => (
          <motion.div 
            key={i} 
            className="w-1 h-1 rounded-full bg-foreground"
            initial={{ opacity: 0.2 }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </div>

      {/* 14. Floating X - Top Right */}
      <motion.div 
        className="absolute top-[10%] right-[5%] text-rose-500/20"
        initial={{ scale: 0.8, rotate: 0 }}
        animate={{ scale: [0.8, 1.2, 0.8], rotate: 180 }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <X className="w-12 h-12" />
      </motion.div>

      {/* 15. Semi-Circle Arc - Bottom Right */}
      <motion.svg
        className="absolute bottom-[10%] right-[5%] text-blue-400/20 w-24 h-24"
        fill="none"
        viewBox="0 0 100 100"
        initial={{ rotate: 0 }}
        animate={{ rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M10 50 A 40 40 0 0 1 90 50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </motion.svg>

       {/* 16. Dashed Circle - Middle Right */}
       <motion.div
        className="absolute top-[75%] right-[20%] text-emerald-500/20"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <CircleDashed className="w-16 h-16" />
      </motion.div>

    </div>
  );
};

// --- Animations & Dashboard Preview ---

const AnimatedCursor = ({ color, x, y, name, delay }: { color: string, x: number[], y: number[], name: string, delay: number }) => {
  return (
    <motion.div
      initial={{ x: x[0], y: y[0], opacity: 0 }}
      animate={{ x: x, y: y, opacity: [0, 1, 1, 0] }}
      transition={{ 
        duration: 8, 
        repeat: Infinity, 
        repeatDelay: 2,
        delay: delay,
        times: [0, 0.1, 0.9, 1]
      }}
      className="absolute top-0 left-0 pointer-events-none z-20"
    >
      <MousePointer2 className={`w-5 h-5 fill-current`} style={{ color }} />
      <div className="ml-5 mt-2 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap shadow-sm" style={{ backgroundColor: color }}>
        {name}
      </div>
    </motion.div>
  );
};

const DashboardPreview = () => {
  return (
    <div className="relative w-full max-w-4xl mx-auto mt-16 aspect-[16/9] rounded-xl border border-border bg-card shadow-2xl overflow-hidden group">
      {/* Mock Browser Header */}
      <div className="absolute top-0 inset-x-0 h-10 bg-muted/50 border-b border-border flex items-center px-4 gap-2 z-10">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-amber-400/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
        </div>
        <div className="mx-auto w-1/3 h-5 bg-background/50 rounded-md text-[10px] flex items-center justify-center text-muted-foreground font-mono">
        </div>
      </div>

      {/* Canvas Area */}
      <div className="absolute inset-0 top-10 bg-grid-slate-200/50 dark:bg-grid-slate-800/20 [mask-image:linear-gradient(to_bottom,white,transparent)]">
        
        {/* Mock Toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-background/80 backdrop-blur border border-border rounded-lg shadow-sm z-10">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary"><Pencil className="w-4 h-4"/></div>
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center"><Terminal className="w-4 h-4 opacity-50"/></div>
          <div className="w-8 h-8 rounded bg-muted" />
        </div>

        {/* Animations */}
        <AnimatedCursor 
          color="#FF5733" 
          name="Alice" 
          x={[100, 400, 300, 100]} 
          y={[200, 100, 400, 200]} 
          delay={0}
        />
         <AnimatedCursor 
          color="#33C1FF" 
          name="Bob" 
          x={[600, 300, 500, 600]} 
          y={[300, 500, 200, 300]} 
          delay={1.5}
        />
        
        {/* Shapes being drawn */}
        <div className="absolute top-1/4 left-1/4">
             <motion.div 
               initial={{ scale: 0, rotate: 0 }}
               animate={{ scale: 1, rotate: 180 }}
               transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
               className="w-32 h-32 border-4 border-dashed border-indigo-500 rounded-lg"
             />
        </div>
        
        <div className="absolute bottom-1/3 right-1/4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.5 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
               className="w-24 h-24 bg-pink-500/20 rounded-full border-2 border-pink-500 flex items-center justify-center text-xs text-pink-700 font-bold"
             >
               Idea!
             </motion.div>
        </div>
      </div>

      {/* Overlay Gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-primary/20">
      
      <FloatingDock />

      {/* Background Decor (Grid) - Z-Index -10 */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />
      </div>

      {/* Floating Shapes - Z-Index 0 */}
      <BackgroundShapes />

      {/* Main Content - Z-Index 10 */}
      <main className="container mx-auto px-4 pt-40 pb-20 flex flex-col items-center justify-center text-center relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl space-y-8"
        >
          <div className="space-y-6">
             <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-tight">
              <span className="relative inline-block">
                <span className="absolute inset-0 translate-y-2 bg-stone-300 dark:bg-stone-800/50 blur-lg rounded-full opacity-50"></span>
                <span className="relative text-stone-800 dark:text-stone-200 decoration-wavy underline decoration-stone-500/50 underline-offset-8">
                  Dirty your hands
                </span>
              </span>
              <br className="md:hidden" />
              <span className="mx-3 text-muted-foreground/50 text-4xl font-light hidden md:inline-block">—</span>
               
              <span className="relative inline-block px-2">
                 <span className="absolute inset-0 bg-primary/20 -skew-x-12 rounded-sm transform"></span>
                 <span className="relative text-primary italic font-serif">collaboratively</span>
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              ...by explaining your <span className="line-through decoration-destructive/50 decoration-4 font-semibold text-foreground/80">ugly</span> brilliant ideas. 
              <br/>
              A real-time whiteboard for chaotic genius.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/auth">
              <Button size="lg" className="h-14 px-8 text-xl rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95">
                Get Started
                <span className="ml-2">→</span>
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, scale: 0.95, y: 40 }}
           animate={{ opacity: 1, scale: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.2 }}
           className="w-full"
        >
          <DashboardPreview />
        </motion.div>

        {/* About Section Anchor */}
        <div id="about" className="mt-32 max-w-2xl text-center space-y-6">
          <h2 className="text-3xl font-bold">What is DrawSync?</h2>
          <p className="text-muted-foreground">
            It's a monorepo-architected, WebSocket-powered, JWT-secured collaborative drawing tool. 
            Designed for low-latency synchronization and high-fidelity chaos. 
            Frontend powered by Next.js & React, Backend by Node & Prisma.
          </p>
        </div>

      </main>
    </div>
  );
}