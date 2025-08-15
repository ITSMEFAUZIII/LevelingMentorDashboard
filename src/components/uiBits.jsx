// src/components/uiBits.jsx
import { motion as fmMotion } from "framer-motion";
import { useRef, useState } from "react";

const MotionDiv = fmMotion.div;
const MotionCircle = fmMotion.circle;
const clamp = (n,a,b)=>Math.min(b,Math.max(a,n));

export const ProgressBar = ({ value, className="" }) => (
  <div className={"relative h-3 w-full overflow-hidden rounded-full bg-neutral-200 "+className}>
    <MotionDiv initial={{ width: 0 }} animate={{ width: `${clamp(value,0,100)}%` }}
      transition={{ type:"spring", stiffness:80, damping:20 }}
      className="absolute left-0 top-0 h-full"
      style={{ background: "linear-gradient(90deg,#10b981,#22d3ee)" }}/>
    <MotionDiv className="absolute inset-0" initial={{ x: "-100%" }} animate={{ x: "100%" }}
      transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
      style={{ background: "linear-gradient(120deg, transparent, rgba(255,255,255,.35), transparent)" }}/>
  </div>
);

export function RippleButton({ children, onClick, className="", title }) {
  const [ripples, setRipples] = useState([]); const ref = useRef(null);
  return (
    <button ref={ref} title={title} onClick={(e)=>{ if(ref.current){const r=ref.current.getBoundingClientRect();
      const x=e.clientX-r.left, y=e.clientY-r.top, id=Math.random().toString(36).slice(2);
      setRipples(s=>[...s,{id,x,y}]); setTimeout(()=>setRipples(s=>s.filter(p=>p.id!==id)),600);} onClick?.(e); }}
      className={"relative overflow-hidden rounded-2xl bg-neutral-900 text-white px-4 py-2 shadow hover:opacity-90 active:scale-[0.99] "+className}>
      {children}
      <span className="pointer-events-none absolute inset-0">
        {ripples.map(({id,x,y})=>(
          <span key={id} className="absolute rounded-full opacity-30"
            style={{ left:x, top:y, width:10, height:10, transform:"translate(-50%,-50%)",
                     background:"white", animation:"rpl .6s ease-out forwards" }}/>
        ))}
      </span>
      <style>{`@keyframes rpl{from{opacity:.35;transform:translate(-50%,-50%) scale(.5)}to{opacity:0;transform:translate(-50%,-50%) scale(12)}}`}</style>
    </button>
  );
}

export const ParticleBurst = ({ burstKey, x=0, y=0 }) => {
  const colors = ["#22c55e","#3b82f6","#eab308","#ef4444","#a855f7"];
  const items = Array.from({length:18}).map((_,i)=>({id:`${burstKey}-${i}`,dx:(Math.random()*2-1)*120,dy:(Math.random()*2-1)*120-40,r:Math.random()*360,s:6+Math.random()*6,c:colors[Math.floor(Math.random()*colors.length)]}));
  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {items.map(p=>(
        <MotionDiv key={p.id} initial={{opacity:.9,x,y,rotate:p.r,scale:.8}}
          animate={{opacity:0,x:x+p.dx,y:y+p.dy,rotate:p.r+120,scale:1}}
          transition={{duration:.8,ease:"easeOut"}} style={{position:"absolute",width:p.s,height:p.s,borderRadius:2,background:p.c}}/>
      ))}
    </div>
  );
};

export const Medal = ({ rank }) => {
  const map = {1:["#f59e0b","#fde68a"], 2:["#9ca3af","#e5e7eb"], 3:["#d97706","#fcd34d"]};
  const [a,b] = map[rank] || ["#9ca3af","#e5e7eb"];
  return (
    <MotionDiv className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold text-white"
      style={{ background:`linear-gradient(135deg,${a},${b})` }}
      animate={{ scale:[1,1.08,1] }} transition={{ duration:1.8, repeat:Infinity }}>{rank}</MotionDiv>
  );
};

export const AvatarWithRing = ({ name="Kamu", pct=0 }) => {
  const r=18, c=2*Math.PI*r, off=c*(1-clamp(pct,0,100)/100);
  return (
    <div className="relative flex items-center gap-2">
      <svg width="44" height="44" className="rotate-[-90deg]">
        <circle cx="22" cy="22" r={r} stroke="#e5e7eb" strokeWidth="6" fill="none"/>
        <MotionCircle cx="22" cy="22" r={r} stroke="#10b981" strokeWidth="6" fill="none"
          strokeDasharray={c} strokeDashoffset={c}
          animate={{ strokeDashoffset: off }} transition={{ type:"spring", stiffness:60, damping:20 }}/>
      </svg>
      <div className="text-sm">{name}</div>
    </div>
  );
};

export const StatPill = ({ label, value, sub }) => (
  <div className="rounded-xl border border-neutral-200 px-3 py-2">
    <div className="text-[11px] opacity-70">{label}</div>
    <div className="text-sm font-semibold">{value}</div>
    {sub && <div className="text-[11px] opacity-70 mt-0.5">{sub}</div>}
  </div>
);

export const LevelRing = ({ pct=0 }) => {
  const r=26, c=2*Math.PI*r, off=c*(1-pct/100);
  return (
    <svg width="70" height="70" className="rotate-[-90deg]">
      <circle cx="35" cy="35" r={r} stroke="#e5e7eb" strokeWidth="8" fill="none"/>
      <MotionCircle cx="35" cy="35" r={r} stroke="#10b981" strokeWidth="8" fill="none"
        strokeDasharray={c} strokeDashoffset={c}
        animate={{ strokeDashoffset: off }} transition={{ type:"spring", stiffness:80, damping:20 }}/>
    </svg>
  );
};
