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
  Shapes,
  Hexagon,
  Triangle,
  MoveUpRight,
  Minus,
  X,
  CircleDashed,
  Terminal,
  MousePointer2,
  Circle,
  Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- 1. Custom Logo with Shapes ---
const DrawSyncLogo = () => {
  return (
    <div className="flex items-center justify-center gap-1 text-5xl md:text-8xl font-bold tracking-tighter text-foreground">
      <span>Dr</span>
      {/* Replace 'a' with Triangle */}
      <motion.div 
        className="relative flex items-center justify-center w-[0.8em] h-[0.8em]"
        whileHover={{ rotate: 180, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <Triangle className="w-full h-full fill-blue-600 stroke-none" />
      </motion.div>
      <span>wS</span>
      <span>yn</span>
      {/* Replace 'c' with Semicircle (C shape) */}
      <motion.div 
        className="relative flex items-center justify-center w-[0.7em] h-[0.7em]"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-blue-600 stroke-[15] stroke-linecap-round">
          {/* C-Shape Arc */}
          <path d="M 90 30 A 40 40 0 1 0 90 70" />
        </svg>
      </motion.div>
    </div>
  );
};

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

  const isIcon = !!Icon;
  const baseWidth = isIcon ? 40 : 90;
  const maxWidth = isIcon ? 80 : 130;

  const widthTransform = useTransform(distance, [-150, 0, 150], [baseWidth, maxWidth, baseWidth]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 60, 40]);
  const scaleTransform = useTransform(distance, [-150, 0, 150], [1, 1.2, 1]);

  const width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 });
  const contentScale = useSpring(scaleTransform, { mass: 0.1, stiffness: 150, damping: 12 });

  const content = (
    <motion.div
      ref={ref}
      style={{ width, height }}
      className={cn(
        "flex items-center justify-center relative transition-colors duration-200 cursor-pointer border border-slate-200 dark:border-slate-800",
        isIcon ? "rounded-full aspect-square" : "rounded-full px-2",
        active 
          ? "bg-black text-white dark:bg-white dark:text-black" 
          : "bg-white hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
      )}
      onClick={onClick}
    >
      <motion.div style={{ scale: contentScale }} className="flex items-center justify-center whitespace-nowrap">
        {Icon ? <Icon className="w-5 h-5" /> : <span className="text-sm font-medium">{label}</span>}
      </motion.div>
    </motion.div>
  );

  if (href) {
    return <Link href={href} title={label}>{content}</Link>;
  }

  return <button onClick={onClick} title={label} className="focus:outline-none">{content}</button>;
}

const FloatingDock = () => {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(Infinity);

  useEffect(() => { setMounted(true); }, []);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="
fixed 
top-6 md:top-10 
left-1/2 -translate-x-1/2 
z-50 
flex items-center gap-2 md:gap-3 
px-3 md:px-4 
py-2 
max-w-[95vw] 
overflow-x-auto 
rounded-full 
bg-white/80 dark:bg-black/80 
backdrop-blur-md 
border border-slate-200 dark:border-slate-800 
shadow-xl
"

    >
      <DockItem mouseX={mouseX} icon={HomeIcon} href="/" label="Home" />
      <DockItem 
        mouseX={mouseX} 
        icon={!mounted ? Moon : (theme === "dark" ? Sun : Moon)}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        label="Toggle Theme"
      />
      <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 self-center mx-1" />
      <DockItem mouseX={mouseX} href="#features" label="Features" />
      <DockItem mouseX={mouseX} href="/auth" label="Sign In" />
      <DockItem mouseX={mouseX} href="/auth" label="Sign Up" active />
    </motion.div>
  );
};

// --- Background Shapes Component ---
const BackgroundShapes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
      {/* 1. Dashed Circle Top Left */}
      <motion.svg className="absolute top-[10%] left-[5%] text-slate-400 w-24 h-24" fill="none" viewBox="0 0 100 100" animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8" />
      </motion.svg>

      {/* 2. Triangle Top Right */}
      <motion.div className="absolute top-[15%] right-[10%] text-slate-400" animate={{ rotate: -10, y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity }}>
        <Triangle className="w-16 h-16 stroke-[2px] fill-transparent" />
      </motion.div>

      {/* 3. Square Bottom Left */}
      <motion.div className="absolute bottom-[20%] left-[10%] text-slate-400" animate={{ rotate: 15, y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity }}>
        <Square className="w-20 h-20 stroke-[2px] fill-transparent" />
      </motion.div>

      {/* 4. Hexagon Bottom Right */}
      <motion.div className="absolute bottom-[25%] right-[15%] text-slate-400" animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
        <Hexagon className="w-24 h-24 stroke-[2px] stroke-dashed fill-transparent" />
      </motion.div>

      {/* 5. Plus Signs Scattered */}
      <div className="absolute top-[40%] left-[20%] text-slate-300"><Minus className="w-8 h-8 rotate-90" /><Minus className="w-8 h-8 -mt-8" /></div>
      <div className="absolute top-[60%] right-[30%] text-slate-300"><Minus className="w-6 h-6 rotate-90" /><Minus className="w-6 h-6 -mt-6" /></div>
      <div className="absolute bottom-[10%] left-[40%] text-slate-300"><Minus className="w-10 h-10 rotate-90" /><Minus className="w-10 h-10 -mt-10" /></div>

      {/* 6. Wavy Line Center */}
      <motion.svg className="absolute top-[30%] left-[40%] text-slate-300 w-48 h-24" fill="none" viewBox="0 0 200 100" animate={{ x: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity }}>
         <path d="M10 50 Q 55 10 100 50 T 190 50" stroke="currentColor" strokeWidth="2" />
      </motion.svg>

      {/* 7. X Shapes */}
      <motion.div className="absolute top-[80%] right-[5%] text-slate-400" animate={{ rotate: 180 }} transition={{ duration: 10, repeat: Infinity }}>
        <X className="w-12 h-12" />
      </motion.div>
       <motion.div className="absolute top-[20%] left-[30%] text-slate-400" animate={{ rotate: -180 }} transition={{ duration: 12, repeat: Infinity }}>
        <X className="w-8 h-8" />
      </motion.div>

      {/* 8. Circles */}
      <motion.div className="absolute top-[50%] right-[40%] text-slate-300" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }}>
        <Circle className="w-4 h-4 fill-slate-300" />
      </motion.div>
      <motion.div className="absolute bottom-[40%] left-[5%] text-slate-300" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 4, repeat: Infinity }}>
        <Circle className="w-6 h-6 stroke-2" />
      </motion.div>
      
       {/* 9. Grid Dots */}
       <div className="absolute top-[10%] right-[40%] grid grid-cols-4 gap-2 opacity-30">
        {[...Array(16)].map((_, i) => <div key={i} className="w-1 h-1 bg-slate-500 rounded-full" />)}
      </div>
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
        duration: 8, repeat: Infinity, repeatDelay: 2, delay: delay, times: [0, 0.1, 0.9, 1]
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
    <div className="relative w-full max-w-4xl mx-auto mt-16 aspect-[16/9] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden group">
      {/* Browser Header */}
      <div className="absolute top-0 inset-x-0 h-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-2 z-10">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <div className="mx-auto w-1/3 h-5 bg-white dark:bg-slate-700 rounded text-[10px] flex items-center justify-center text-slate-400 font-mono">
          drawsync.app/canvas/room-123
        </div>
      </div>

      {/* Canvas Area */}
      <div className="absolute inset-0 top-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-50"></div>
      <div className="absolute inset-0 top-10 bg-white dark:bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Mock Toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm z-10">
          <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900 text-blue-600 flex items-center justify-center"><Pencil className="w-4 h-4"/></div>
          <div className="w-8 h-8 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"><Shapes className="w-4 h-4 opacity-50"/></div>
          <div className="w-8 h-8 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"><Terminal className="w-4 h-4 opacity-50"/></div>
        </div>

        {/* Animations */}
        <AnimatedCursor color="#EF4444" name="Alice" x={[100, 400, 300, 100]} y={[200, 100, 400, 200]} delay={0} />
        <AnimatedCursor color="#3B82F6" name="Bob" x={[600, 300, 500, 600]} y={[300, 500, 200, 300]} delay={1.5} />
        
        {/* Drawing Elements */}
        <div className="absolute top-1/4 left-1/4">
             <motion.div 
               initial={{ scale: 0, rotate: 0 }}
               animate={{ scale: 1, rotate: 180 }}
               transition={{ duration: 4, repeat: Infinity, repeatType: "mirror" }}
               className="w-32 h-32 border-4 border-dashed border-slate-800 dark:border-slate-200 rounded-lg flex items-center justify-center"
             >
                <span className="text-xs font-mono font-bold">MONOREPO</span>
             </motion.div>
        </div>
        
        <div className="absolute bottom-1/3 right-1/4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.5 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
               className="w-24 h-24 bg-blue-500/10 rounded-full border-2 border-blue-500 flex items-center justify-center text-[10px] text-blue-600 font-bold"
             >
               WEBSOCKETS
             </motion.div>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 relative overflow-hidden text-slate-900 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900">
      
      <FloatingDock />
      <BackgroundShapes />

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-40 pb-20 flex flex-col items-center justify-center text-center relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl space-y-8"
        >
          {/* Logo */}
          <div className="flex justify-center">
            <DrawSyncLogo />
          </div>

          {/* New Tagline with Reduced Font Size */}
          <div className="space-y-6">
             {/* 🛠️ UPDATED: Changed text-5xl/7xl to text-4xl/6xl */}
             <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
              <span className="relative inline-block">
                <span className="absolute inset-0 translate-y-2 bg-stone-300 dark:bg-stone-800/50 blur-lg rounded-full opacity-50"></span>
                <span className="relative text-stone-800 dark:text-stone-200 decoration-wavy underline decoration-stone-500/50 underline-offset-8">
                  Dirty your hands
                </span>
              </span>
              <br className="md:hidden" />
              <span className="mx-3 text-muted-foreground/50 text-3xl font-light hidden md:inline-block">—</span>
               
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
              <Button size="lg" className="h-14 px-10 text-xl font-semibold rounded-full bg-black text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 transition-all hover:scale-105 active:scale-95 shadow-xl">
                Start Drawing
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

        {/* Features */}
        <div id="features" className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full text-left">
          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4">
              <MoveUpRight className="w-6 h-6 text-slate-900 dark:text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Live Sync</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Powered by dedicated WebSocket servers for sub-second, low-latency updates across all clients.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4">
              <Shapes className="w-6 h-6 text-slate-900 dark:text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Monorepo</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Built with Turborepo, separating runtime apps (HTTP, WS, Frontend) from shared packages and configs.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4">
              <Terminal className="w-6 h-6 text-slate-900 dark:text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Persistence</h3>
            <p className="text-slate-500 dark:text-slate-400">
               Utilizing Prisma ORM and PostgreSQL for reliable storage of users, rooms, and chat history.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
// // }
// "use client";

// import React, { useRef, useState, useEffect } from "react";
// import Link from "next/link";
// import { useTheme } from "next-themes";
// import { 
//   motion, 
//   useMotionValue, 
//   useSpring, 
//   useTransform, 
//   MotionValue 
// } from "framer-motion";
// import { 
//   Home as HomeIcon,
//   Pencil, 
//   Moon, 
//   Sun, 
//   Shapes,
//   Hexagon,
//   Triangle,
//   MoveUpRight,
//   Minus,
//   X,
//   Terminal,
//   MousePointer2,
//   Circle,
//   Square
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";

// /* -------------------------------------------------------------------------- */
// /* 1. LOGO COMPONENT (Responsive)                                             */
// /* -------------------------------------------------------------------------- */
// const DrawSyncLogo = () => {
//   return (
//     <div className="flex items-center justify-center gap-1 text-5xl md:text-8xl font-bold tracking-tighter text-foreground">
//       <span>Dr</span>
//       <motion.div 
//         className="relative flex items-center justify-center w-[0.8em] h-[0.8em]"
//         whileHover={{ rotate: 180, scale: 1.1 }}
//         transition={{ type: "spring", stiffness: 200 }}
//       >
//         <Triangle className="w-full h-full fill-blue-600 stroke-none" />
//       </motion.div>
//       <span>wS</span>
//       <span>yn</span>
//       <motion.div 
//         className="relative flex items-center justify-center w-[0.7em] h-[0.7em]"
//         animate={{ rotate: 360 }}
//         transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
//       >
//         <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-blue-600 stroke-[15] stroke-linecap-round">
//           <path d="M 90 30 A 40 40 0 1 0 90 70" />
//         </svg>
//       </motion.div>
//     </div>
//   );
// };

// /* -------------------------------------------------------------------------- */
// /* 2. DOCK COMPONENTS (Mobile Bottom-Anchored)                                */
// /* -------------------------------------------------------------------------- */
// function DockItem({
//   mouseX,
//   icon: Icon,
//   href,
//   onClick,
//   label,
//   active = false,
// }: {
//   mouseX: MotionValue;
//   icon?: React.ElementType;
//   href?: string;
//   onClick?: () => void;
//   label?: string;
//   active?: boolean;
// }) {
//   const ref = useRef<HTMLDivElement>(null);
//   const distance = useTransform(mouseX, (val) => {
//     const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
//     return val - bounds.x - bounds.width / 2;
//   });

//   const isIcon = !!Icon;
//   const baseWidth = isIcon ? 40 : 80;
//   const maxWidth = isIcon ? 70 : 110;

//   const width = useSpring(useTransform(distance, [-150, 0, 150], [baseWidth, maxWidth, baseWidth]), { mass: 0.1, stiffness: 150, damping: 12 });
//   const height = useSpring(useTransform(distance, [-150, 0, 150], [40, 55, 40]), { mass: 0.1, stiffness: 150, damping: 12 });
//   const contentScale = useSpring(useTransform(distance, [-150, 0, 150], [1, 1.2, 1]), { mass: 0.1, stiffness: 150, damping: 12 });

//   const content = (
//     <motion.div
//       ref={ref}
//       style={{ width, height }}
//       className={cn(
//         "flex items-center justify-center relative transition-colors duration-200 cursor-pointer border border-slate-200 dark:border-slate-800",
//         isIcon ? "rounded-full aspect-square" : "rounded-full px-2",
//         active 
//           ? "bg-black text-white dark:bg-white dark:text-black" 
//           : "bg-white hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
//       )}
//       onClick={onClick}
//     >
//       <motion.div style={{ scale: contentScale }} className="flex items-center justify-center whitespace-nowrap">
//         {Icon ? <Icon className="w-5 h-5" /> : <span className="text-xs md:text-sm font-medium">{label}</span>}
//       </motion.div>
//     </motion.div>
//   );

//   return href ? <Link href={href}>{content}</Link> : <button onClick={onClick} className="focus:outline-none">{content}</button>;
// }

// const FloatingDock = () => {
//   const { setTheme, theme } = useTheme();
//   const [mounted, setMounted] = useState(false);
//   const mouseX = useMotionValue(Infinity);
//   useEffect(() => { setMounted(true); }, []);

//   return (
//     <motion.div
//       onMouseMove={(e) => mouseX.set(e.pageX)}
//       onMouseLeave={() => mouseX.set(Infinity)}
//       initial={{ y: 100, opacity: 0 }}
//       animate={{ y: 0, opacity: 1 }}
//       className="fixed bottom-6 md:top-10 md:bottom-auto left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl"
//     >
//       <DockItem mouseX={mouseX} icon={HomeIcon} href="/" label="Home" />
//       <DockItem 
//         mouseX={mouseX} 
//         icon={!mounted ? Moon : (theme === "dark" ? Sun : Moon)}
//         onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
//       />
//       <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
//       <div className="hidden sm:flex gap-2">
//          <DockItem mouseX={mouseX} href="#features" label="Features" />
//       </div>
//       <DockItem mouseX={mouseX} href="/auth" label="Sign In" />
//       <DockItem mouseX={mouseX} href="/auth" label="Sign Up" active />
//     </motion.div>
//   );
// };

// /* -------------------------------------------------------------------------- */
// /* 3. VISUAL ELEMENTS (Background & Preview)                                  */
// /* -------------------------------------------------------------------------- */
// const BackgroundShapes = () => (
//   <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 md:opacity-40">
//     <motion.div className="absolute top-[15%] right-[10%]" animate={{ rotate: -10, y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity }}><Triangle className="w-12 md:w-16 h-12 md:h-16 stroke-slate-400 fill-none" /></motion.div>
//     <motion.div className="absolute bottom-[20%] left-[10%]" animate={{ rotate: 15, y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity }}><Square className="w-16 md:w-20 h-16 md:h-20 stroke-slate-400 fill-none" /></motion.div>
//     <div className="absolute top-[10%] right-[40%] grid grid-cols-4 gap-2 opacity-30">
//         {[...Array(16)].map((_, i) => <div key={i} className="w-1 h-1 bg-slate-500 rounded-full" />)}
//     </div>
//   </div>
// );

// const AnimatedCursor = ({ color, x, y, name, delay }: { color: string, x: number[], y: number[], name: string, delay: number }) => (
//   <motion.div
//     initial={{ x: x[0], y: y[0], opacity: 0 }}
//     animate={{ x, y, opacity: [0, 1, 1, 0] }}
//     transition={{ duration: 8, repeat: Infinity, repeatDelay: 2, delay, times: [0, 0.1, 0.9, 1] }}
//     className="absolute top-0 left-0 pointer-events-none z-20"
//   >
//     <MousePointer2 className="w-4 h-4 md:w-5 md:h-5 fill-current" style={{ color }} />
//     <div className="ml-4 mt-1 px-1.5 py-0.5 rounded text-[10px] text-white font-medium shadow-sm" style={{ backgroundColor: color }}>{name}</div>
//   </motion.div>
// );

// const DashboardPreview = () => (
//   <div className="relative w-full max-w-4xl mx-auto mt-8 md:mt-16 aspect-[16/9] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
//     <div className="absolute top-0 inset-x-0 h-8 md:h-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-2 z-10">
//       <div className="flex gap-1"><div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-red-400" /><div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-amber-400" /><div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-emerald-400" /></div>
//     </div>
//     <div className="absolute inset-0 top-8 md:top-10 bg-white dark:bg-slate-950">
//       <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]"></div>
//       <AnimatedCursor color="#EF4444" name="Alice" x={[50, 200, 150, 50]} y={[100, 50, 200, 100]} delay={0} />
//       <AnimatedCursor color="#3B82F6" name="Bob" x={[300, 150, 250, 300]} y={[150, 250, 100, 150]} delay={1.5} />
//     </div>
//   </div>
// );

// /* -------------------------------------------------------------------------- */
// /* 4. MAIN PAGE                                                               */
// /* -------------------------------------------------------------------------- */
// export default function Home() {
//   return (
//     <div className="min-h-screen bg-white dark:bg-slate-950 relative overflow-hidden text-slate-900 dark:text-slate-100">
//       <FloatingDock />
//       <BackgroundShapes />

//       <main className="container mx-auto px-4 pt-20 md:pt-40 pb-32 flex flex-col items-center text-center relative z-10">
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl space-y-6 md:space-y-10">
//           <div className="scale-75 md:scale-100"><DrawSyncLogo /></div>

//           <div className="space-y-4">
//             <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-tight">
//               Dirty your hands <br className="block md:hidden"/>
//               <span className="text-primary italic font-serif">collaboratively</span>
//             </h1>
//             <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
//               Real-time whiteboarding for explaining your brilliant ideas. Built for chaotic genius.
//             </p>
//           </div>

//           <div className="flex flex-col sm:flex-row justify-center gap-4 px-8">
//             <Link href="/auth" className="w-full sm:w-auto">
//               <Button size="lg" className="w-full h-14 px-10 text-lg md:text-xl font-semibold rounded-full shadow-xl">
//                 Start Drawing Free →
//               </Button>
//             </Link>
//           </div>
//         </motion.div>

//         <div className="w-full scale-[0.9] md:scale-100 origin-top">
//           <DashboardPreview />
//         </div>

//         <div id="features" className="mt-20 md:mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full text-left">
//           <FeatureCard icon={MoveUpRight} title="Live Sync" desc="Sub-second updates via WebSockets." />
//           <FeatureCard icon={Shapes} title="Monorepo" desc="Built with Turborepo for scale." />
//           <FeatureCard icon={Terminal} title="Persistence" desc="Powered by Prisma and PostgreSQL." />
//         </div>
//       </main>
//     </div>
//   );
// }

// const FeatureCard = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
//   <div className="p-6 md:p-8 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 transition-all hover:shadow-lg">
//     <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
//       <Icon className="w-5 md:w-6 h-5 md:h-6 text-primary" />
//     </div>
//     <h3 className="text-lg md:text-xl font-bold mb-2">{title}</h3>
//     <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">{desc}</p>
//   </div>
// );