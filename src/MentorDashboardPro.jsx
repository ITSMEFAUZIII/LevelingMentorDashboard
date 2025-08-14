// MentorDashboardProV9.jsx
// Single-file FINAL: Part 1 + Part 2 terintegrasi (tanpa import duplikat / ReactDOM patch)
// Pastikan punya: framer-motion, @hello-pangea/dnd, dan course_js.json

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import courseData from "./course_js.json";

// ============ THEME ============
const THEMES = {
  mono:  { bar: "bg-neutral-900 dark:bg-neutral-100", bg: "from-slate-50 to-slate-100",   darkBg: "from-neutral-900 to-neutral-950" },
  ocean: { bar: "bg-cyan-600 dark:bg-cyan-400",       bg: "from-cyan-50 to-sky-100",      darkBg: "from-cyan-950 to-slate-950" },
  grape: { bar: "bg-purple-600 dark:bg-violet-400",   bg: "from-fuchsia-50 to-violet-100",darkBg: "from-violet-950 to-slate-950" },
  lime:  { bar: "bg-lime-600 dark:bg-lime-400",       bg: "from-lime-50 to-emerald-100",  darkBg: "from-emerald-950 to-slate-950" },
};
const LS_KEY = "mentor-dashboard-pro-v9";
const LS_PEERS = "mentor-dashboard-pro-v9-peers";
const DAY_MS = 24*60*60*1000;
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const todayKey = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
};
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

// ============ COURSE ============
const COURSE_SECTIONS = (courseData?.sections ?? []).map((s, si) => ({
  name: s.name,
  lectures: s.lectures || [],
  index: si,
}));
const TOTAL_LECTURES = COURSE_SECTIONS.reduce((acc, s) => acc + s.lectures.length, 0);
const LECTURE_XP = 1;

// ============ AUDIO ============
const playTone = (freq=440, duration=0.12, type="sine", gain=0.08) => {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type; osc.frequency.value = freq; g.gain.value = gain;
  osc.connect(g); g.connect(ctx.destination); osc.start();
  setTimeout(()=>{ osc.stop(); ctx.close(); }, duration*1000);
};
const levelUpSound = () => [440,660,880].forEach((f,i)=>setTimeout(()=>playTone(f,0.1,"triangle",0.07), i*120));
const badgeSound   = () => playTone(880, 0.15, "square", 0.06);
const capstoneSound= () => [523,659,783,1046].forEach((f,i)=>setTimeout(()=>playTone(f,0.12,"sine",0.08), i*110));
const tickSound    = () => playTone(660, 0.05, "sine", 0.05);
const checkInSound = () => [660, 990].forEach((f,i)=>setTimeout(()=>playTone(f,0.08,"sine",0.06), i*60));

// ============ BADGES ============
const FUN_BADGES = [
  { key:"rajinn",   label:"Si Paling Rajin",    check:(ctx)=>ctx.streak>=5,              hint:"Streak ≥ 5 hari" },
  { key:"gercep",   label:"Si Paling Gercep",   check:(ctx)=>ctx.stats.tests_written>=20, hint:"centang ≥ 20 Update Info" },
  { key:"aktif",    label:"Si Paling Aktif",    check:(ctx)=>ctx.weeklyXP>=150,          hint:"XP 7 hari ≥ 150" },
  { key:"bugbos",   label:"Bug Boss",           check:(ctx)=>ctx.stats.bugs_fixed>=30,   hint:"Tugas Selesai ≥ 30" },
  { key:"latihan",  label:"Latihan Warrior",    check:(ctx)=>ctx.stats.exercises_completed>=40, hint:"Latihan ≥ 40" },
  { key:"solid",    label:"Solid Streak",       check:(ctx)=>ctx.streak>=10,             hint:"Streak ≥ 10" },
  { key:"pilot",    label:"Gen Anti Kudet",     check:(ctx)=>ctx.stats.tests_written>=50, hint:"Update Info ≥ 50" },
  { key:"framework",label:"Explorer",           check:(ctx)=>ctx.stats.frameworks_tried>=5, hint:"Coba ≥ 5 materi baru" },
  { key:"xpbooster",label:"XP Booster",         check:(ctx)=>ctx.totalXP>=10000,          hint:"Total XP ≥ 10000" },
  { key:"finisher", label:"Section Finisher",   check:(ctx)=>ctx.finishedSections>=10,   hint:"Selesai ≥ 10 section kurikulum" },
];

// ============ QUESTS ============
const QUEST_POOL = [
  { id:"q1", text:"Kerjakan 3 lecture", type:"js_done", need:3, xp:15 },
  { id:"q2", text:"Claim 1 capstone", type:"cap_claim", need:1, xp:25 },
  { id:"q3", text:"Coba tema baru", type:"theme_switch", need:1, xp:5 },
  { id:"q4", text:"Tambah 1 lecture di kurikulum kustom", type:"uc_add", need:1, xp:10 },
  { id:"q5", text:"Tulis 5 unit test", type:"tests_written", need:5, xp:15 },
  { id:"q6", text:"Perbaiki 3 bug", type:"bugs_fixed", need:3, xp:10 },
  { id:"q7", text:"Selesai 1 milestone", type:"milestone_done", need:1, xp:10 },
];
const genDailyQuests = () => {
  const arr = [...QUEST_POOL];
  arr.sort(()=>Math.random()-0.5);
  return arr.slice(0,3).map(q=>({ ...q, progress:0, done:false }));
};

// ============ UI Helpers ============
const ProgressBar = ({ value, className="" }) => (
  <div className={"relative h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700 " + className}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${clamp(value,0,100)}%` }}
      transition={{ type:"spring", stiffness:80, damping:20 }}
      className="absolute left-0 top-0 h-full"
      style={{ background: "linear-gradient(90deg,var(--bar1,#10b981),var(--bar2,#22d3ee))" }}
    />
    <motion.div
      className="absolute inset-0"
      initial={{ x: "-100%" }}
      animate={{ x: "100%" }}
      transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
      style={{ background: "linear-gradient(120deg, transparent, rgba(255,255,255,.35), transparent)" }}
    />
  </div>
);

const RippleButton = ({ children, onClick, className="", title }) => {
  const [ripples, setRipples] = useState([]);
  const ref = useRef(null);
  return (
    <button
      ref={ref}
      title={title}
      onClick={(e)=>{
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const id = Math.random().toString(36).slice(2);
          setRipples(r => [...r, { id, x, y }]);
          setTimeout(()=> setRipples(r => r.filter(p=>p.id!==id)), 600);
        }
        onClick?.(e);
      }}
      className={"relative overflow-hidden rounded-2xl bg-neutral-900 text-white px-4 py-2 shadow hover:opacity-90 active:scale-[0.99] " + className}
    >
      {children}
      <span className="pointer-events-none absolute inset-0">
        {ripples.map(({id,x,y})=>(
          <span
            key={id}
            className="absolute rounded-full opacity-30"
            style={{
              left: x, top: y, width: 10, height: 10,
              transform: "translate(-50%, -50%)",
              background: "white",
              animation: "rpl .6s ease-out forwards"
            }}
          />
        ))}
      </span>
      <style>{`@keyframes rpl{from{opacity:.35;transform:translate(-50%,-50%) scale(.5)}to{opacity:0;transform:translate(-50%,-50%) scale(12)}}`}</style>
    </button>
  );
};

const ParticleBurst = ({ burstKey, x=0, y=0 }) => {
  const colors = ["#22c55e","#3b82f6","#eab308","#ef4444","#a855f7"];
  const items = Array.from({length: 18}).map((_,i)=>({
    id: `${burstKey}-${i}`,
    dx: (Math.random()*2-1)*120,
    dy: (Math.random()*2-1)*120 - 40,
    r: Math.random()*360,
    s: 6+Math.random()*6,
    c: colors[Math.floor(Math.random()*colors.length)],
  }));
  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {items.map(p=>(
        <motion.div key={p.id}
          initial={{ opacity: 0.9, x, y, rotate: p.r, scale: .8 }}
          animate={{ opacity: 0, x: x + p.dx, y: y + p.dy, rotate: p.r + 120, scale: 1 }}
          transition={{ duration: .8, ease: "easeOut" }}
          style={{ position:"absolute", width:p.s, height:p.s, borderRadius:2, background:p.c }}
        />
      ))}
    </div>
  );
};

const Medal = ({ rank }) => {
  const map = { 1:["#f59e0b","#fde68a"], 2:["#9ca3af","#e5e7eb"], 3:["#d97706","#fcd34d"] };
  const [a,b] = map[rank] || ["#9ca3af","#e5e7eb"];
  return (
    <motion.div
      className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold text-white"
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
      animate={{ scale: [1,1.08,1] }}
      transition={{ duration: 1.8, repeat: Infinity }}
    >
      {rank}
    </motion.div>
  );
};

const AvatarWithRing = ({ name="Kamu", pct=0 }) => {
  const r = 18, c = 2*Math.PI*r, off = c*(1 - clamp(pct,0,100)/100);
  return (
    <div className="relative flex items-center gap-2">
      <svg width="44" height="44" className="rotate-[-90deg]">
        <circle cx="22" cy="22" r={r} stroke="#e5e7eb" strokeWidth="6" fill="none"/>
        <motion.circle
          cx="22" cy="22" r={r} stroke="#10b981" strokeWidth="6" fill="none"
          strokeDasharray={c} strokeDashoffset={c}
          animate={{ strokeDashoffset: off }}
          transition={{ type:"spring", stiffness:60, damping:20 }}
        />
      </svg>
      <div className="text-sm">{name}</div>
    </div>
  );
};

// ===== Modal (update: support tone="bright") =====
const Modal = ({ open, onClose, children, title, tone = "auto" }) => {
  const bright = tone === "bright";
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[10000] grid place-items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
          <motion.div
            initial={{ scale: .9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: .95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 16 }}
            className={
              "relative z-10 w-[min(92vw,720px)] rounded-2xl p-5 shadow-2xl border " +
              (bright
                ? "bg-white dark:bg-white text-neutral-900 border-neutral-200"
                : "bg-white dark:bg-neutral-900 text-inherit border-neutral-200/60 dark:border-neutral-800/60")
            }
          >
            {title && (
              <div className={
                "text-lg font-semibold mb-3 inline-flex items-center gap-2 " +
                (bright ? "text-neutral-900" : "")
              }>
                {title}
                {bright && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,.25)]"/>
                )}
              </div>
            )}
            <div className={bright ? "text-neutral-900" : ""}>
              {children}
            </div>
            <div className="mt-4 text-right">
              <button
                onClick={onClose}
                className={
                  "rounded-xl px-3 py-2 border hover:bg-neutral-50 " +
                  (bright
                    ? "border-neutral-200 text-neutral-800"
                    : "dark:hover:bg-neutral-800")
                }
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


// ===== Weekly Summary Pro (components) =====
const dayShort = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

const buildWeekSeries = (historyObj) => {
  const series = [];
  const base = new Date();
  base.setHours(0,0,0,0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base.getTime() - i*DAY_MS);
    const key = ymd(d);
    series.push({
      key,
      label: dayShort[d.getDay()],
      xp: Number(historyObj?.[key] || 0)
    });
  }
  return series;
};

const calcPrevWeekTotal = (historyObj) => {
  const base = new Date();
  base.setHours(0,0,0,0);
  let total = 0;
  for (let i = 7; i <= 13; i++) {
    const d = new Date(base.getTime() - i*DAY_MS);
    total += Number(historyObj?.[ymd(d)] || 0);
  }
  return total;
};

const MiniBar = ({ value=0, max=1, label="", today=false }) => {
  const h = max ? Math.max(6, Math.round((value/max)*100)) : 6; // min 6px biar kelihatan
  return (
    <div className="flex flex-col items-center gap-1 w-8">
      <motion.div
        initial={{ height: 6 }}
        animate={{ height: `${h}%` }}
        transition={{ type:"spring", stiffness:110, damping:18 }}
        className={"w-5 rounded-md bg-gradient-to-t from-emerald-600 to-cyan-400 " +
          (today ? "ring-2 ring-offset-2 ring-emerald-400 dark:ring-offset-neutral-900" : "")}
        style={{ minHeight: 6 }}
        title={`${label}: ${value} XP`}
      />
      <div className="text-[10px] opacity-80 select-none">{label}</div>
    </div>
  );
};

const StatPill = ({ label, value, sub }) => (
  <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2">
    <div className="text-[11px] opacity-70">{label}</div>
    <div className="text-sm font-semibold">{value}</div>
    {sub && <div className="text-[11px] opacity-70 mt-0.5">{sub}</div>}
  </div>
);

const LevelRing = ({ pct=0 }) => {
  const r=26, c=2*Math.PI*r, off = c*(1-pct/100);
  return (
    <svg width="70" height="70" className="rotate-[-90deg]">
      <circle cx="35" cy="35" r={r} stroke="#e5e7eb" className="dark:stroke-neutral-700" strokeWidth="8" fill="none"/>
      <motion.circle
        cx="35" cy="35" r={r} stroke="#10b981" strokeWidth="8" fill="none"
        strokeDasharray={c} strokeDashoffset={c}
        animate={{ strokeDashoffset: off }}
        transition={{ type:"spring", stiffness:80, damping:20 }}
      />
    </svg>
  );
};

const BadgeChip = ({ text }) => (
  <span className="text-[11px] rounded-full px-2 py-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
    {text}
  </span>
);


// ============ MAIN ============
export default function MentorDashboardProV9({
  initial = {
    xp: 0, track: "JS Beginner",
    stats: { bugs_fixed: 0, exercises_completed: 0, tests_written: 0, frameworks_tried: 0 },
    history: {}, badgesUnlocked: [],
    milestones: [
      { id: "m1", text: "Baca materi 30 menit", done: false },
      { id: "m2", text: "Kerjakan 2 latihan", done: false },
    ],
    userCapstones: [],
    userCourse: { title: "Kurikulum Kustom Kamu", sections: [] },
    jsChecklist: [],
    userCourseChecklist: [],
  },
}) {
  const saved = useMemo(() => { try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch { return null; } }, []);
  const [dark, setDark]   = useState(saved?.dark ?? false);
  const [theme, setTheme] = useState(saved?.theme ?? "mono");
  const [state, setState] = useState(saved?.state ?? initial);
  const [jsOpen, setJsOpen] = useState(saved?.jsOpen ?? {});
  const [ucOpen, setUcOpen] = useState(saved?.ucOpen ?? {});
  const [confetti, setConfetti] = useState([]);
  const [burst, setBurst] = useState(null); // {key,x,y}
  const [search, setSearch] = useState("");  // search kurikulum
  const fileRef = useRef(null);

  // theme auto-switch by time (sunrise/sunset approx)
  useEffect(()=>{
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) setDark(true);
  },[]);

  // XP & Level
  const xpInLevel = state.xp % 100;
  const levelNow  = Math.floor(state.xp / 100) + 1;
  const progress  = clamp(xpInLevel, 0, 100);

  // autosave
  useEffect(()=>{
    localStorage.setItem(LS_KEY, JSON.stringify({ dark, theme, state, jsOpen, ucOpen }));
  }, [dark, theme, state, jsOpen, ucOpen]);

  // confetti
  const launchConfetti = (count=50) => {
    const parts = Array.from({length:count}).map((_,i)=>({
      id:`${Date.now()}_${i}`, x:Math.random()*100, r:Math.random()*360, d:60+Math.random()*30, s:6+Math.random()*10
    }));
    setConfetti(parts);
    setTimeout(()=>setConfetti([]), 1200);
  };

  // history & streak
  const addHistoryOn = (keyStr, delta) => {
    setState((s) => {
      const h = { ...(s.history||{}) };
      h[keyStr] = (h[keyStr]||0) + delta;
      return { ...s, history: h };
    });
  };
  const addHistory = (delta) => addHistoryOn(todayKey(), delta);

  const computeStreak = useMemo(() => {
    const h = state.history || {};
    let streak = 0;
    const start = new Date(todayKey());
    for (let i=0;i<365;i++){
      const d = new Date(start.getTime() - i*DAY_MS);
      const k = ymd(d);
      if ((h[k]||0) > 0) streak += 1; else break;
    }
    return streak;
  }, [state.history]);

  const weeklyXP = useMemo(() => {
    const h = state.history || {};
    let total = 0;
    const now = new Date(todayKey());
    for (let i=0;i<7;i++){
      const d = new Date(now.getTime() - i*DAY_MS);
      const k = ymd(d);
      total += h[k] || 0;
    }
    return total;
  }, [state.history]);

  // XP Multiplier (Double XP on weekend)
  const isDoubleXP = () => {
    const day = new Date().getDay(); // 0 Sun, 6 Sat
    return day===0 || day===6;
  };
  const [xpMultiplier, setXpMultiplier] = useState(isDoubleXP()?2:1);
  useEffect(()=>{
    const id = setInterval(()=> setXpMultiplier(isDoubleXP()?2:1), 60_000);
    return ()=> clearInterval(id);
  },[]);

  const awardXP = (amount) => {
    if (!amount) return;
    const before = Math.floor(state.xp / 100) + 1;
    const bonus = Math.round(amount * (xpMultiplier-1));
    const total = amount + bonus;
    const after  = Math.floor((state.xp + total) / 100) + 1;
    setState((s) => ({ ...s, xp: s.xp + total }));
    addHistory(total);
    if (after > before) { levelUpSound(); launchConfetti(60); }
  };

  // Stats helpers
  const incStat = (k, d=1) => setState(s=>({...s, stats:{...s.stats, [k]: Math.max(0, (s.stats[k]||0)+d)}}));

  // ==== JS checklist ====
  const jsLectureId = (si, li) => `js-${si}-${li}`;
  const isJsDone = (si, li) => state.jsChecklist.includes(jsLectureId(si,li));
  const toggleJsLecture = (si, li) => {
    const id = jsLectureId(si,li);
    setState(s=>{
      const setArr = new Set(s.jsChecklist);
      if (setArr.has(id)) setArr.delete(id); else { setArr.add(id); awardXP(LECTURE_XP); tickSound(); updateQuestProgress("js_done", 1); }
      return { ...s, jsChecklist: Array.from(setArr) };
    });
  };

  // ==== User Course ====
  const userCourse = state.userCourse || { title:"Kurikulum Kustom Kamu", sections:[] };
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newLectureTitle, setNewLectureTitle] = useState("");

  const ucLectureId = (si, li) => `uc-${si}-${li}`;
  const isUcDone = (si, li) => state.userCourseChecklist.includes(ucLectureId(si,li));
  const toggleUcLecture = (si, li) => {
    const id = ucLectureId(si,li);
    setState(s=>{
      const setArr = new Set(s.userCourseChecklist || []);
      if (setArr.has(id)) setArr.delete(id);
      else { setArr.add(id); awardXP(LECTURE_XP); tickSound(); }
      return { ...s, userCourseChecklist: Array.from(setArr) };
    });
  };
  const addSection = () => {
    const title = newSectionTitle.trim(); if (!title) return;
    setState(s=>({
      ...s,
      userCourse:{ ...s.userCourse, sections:[...(s.userCourse.sections||[]), { title, lectures:[] }] }
    }));
    setNewSectionTitle("");
  };
  const addLecture = (si) => {
    const title = newLectureTitle.trim(); if (!title) return;
    setState(s=>{
      const sections = (s.userCourse.sections||[]).map((sec,idx)=>
        idx===si ? { ...sec, lectures:[...(sec.lectures||[]), title] } : sec
      );
      return { ...s, userCourse:{ ...s.userCourse, sections } };
    });
    setNewLectureTitle("");
    updateQuestProgress("uc_add",1);
  };
  const deleteSection = (si) => {
    setState(s=>{
      const sections = (s.userCourse.sections||[]).filter((_,idx)=>idx!==si);
      const keep = (s.userCourseChecklist||[]).filter(id=>!id.startsWith(`uc-${si}-`));
      return { ...s, userCourse:{...s.userCourse, sections}, userCourseChecklist: keep };
    });
  };
  const deleteUcLecture = (si, li) => {
    setState(s=>{
      const sections = (s.userCourse.sections||[]).map((sec,idx)=>{
        if (idx!==si) return sec;
        const lectures = (sec.lectures||[]).filter((_,i)=>i!==li);
        return { ...sec, lectures };
      });
      const delId = ucLectureId(si,li);
      const keep = (s.userCourseChecklist||[]).filter(x=>x!==delId);
      return { ...s, userCourse:{...s.userCourse, sections}, userCourseChecklist: keep };
    });
  };

  // DnD: intra-section reorder
  const onUcDragEnd = (result) => {
    if (!result?.destination) return;
    const { source, destination, type } = result;
    if (type !== "UC-LECTURE") return;
    const siS = Number(source.droppableId.replace("uc-sec-",""));
    const siD = Number(destination.droppableId.replace("uc-sec-",""));
    if (siS !== siD) return; // batasi intra-section agar ID checklist stabil
    setState(s=>{
      const sections = (s.userCourse.sections||[]).map((sec,idx)=>{
        if (idx!==siS) return sec;
        const arr = Array.from(sec.lectures||[]);
        const [moved] = arr.splice(source.index, 1);
        arr.splice(destination.index, 0, moved);
        return { ...sec, lectures: arr };
      });
      return { ...s, userCourse:{ ...s.userCourse, sections } };
    });
  };

  // ==== Milestones ====
  const [newMilestone, setNewMilestone] = useState("");
  const addMilestone = () => {
    const text = newMilestone.trim(); if (!text) return;
    setState(s=>({...s, milestones:[...s.milestones, { id: crypto.randomUUID(), text, done:false }]}));
    setNewMilestone("");
  };
  const toggleMilestone = (id) => {
    setState(s=>({...s, milestones:s.milestones.map(m=>m.id===id? {...m,done:!m.done}:m)}));
    updateQuestProgress("milestone_done", 1);
  };
  const deleteMilestone = (id) => setState(s=>({...s, milestones:s.milestones.filter(m=>m.id!==id)}));

  // ==== Capstone ====
  const claimCapstone = (xp) => { awardXP(xp); capstoneSound(); launchConfetti(60); updateQuestProgress("cap_claim",1); };
  const [capTitle, setCapTitle] = useState("");
  const [capXp, setCapXp] = useState(150);
  const [capTopics, setCapTopics] = useState("");
  const addCapstone = () => {
    const title = capTitle.trim(); if (!title) return;
    const topics = capTopics.split(",").map(s=>s.trim()).filter(Boolean);
    setState(s=>({
      ...s,
      userCapstones:[...(s.userCapstones||[]), { id: (crypto?.randomUUID?.()||Math.random().toString(36).slice(2)), title, xp:Number(capXp||150), topics }]
    }));
    setCapTitle(""); setCapXp(150); setCapTopics("");
  };
  const deleteCapstone = (id) => setState(s=>({ ...s, userCapstones:(s.userCapstones||[]).filter(c=>c.id!==id) }));

  // ==== Badges unlock + modal ====
  const ctxForBadges = {
    streak: computeStreak,
    weeklyXP,
    totalXP: state.xp,
    stats: state.stats,
    finishedSections: (() => {
      const jsFinished = COURSE_SECTIONS.reduce((acc,sec,si)=>{
        const all = sec.lectures.length;
        const done = sec.lectures.filter((_,li)=>isJsDone(si,li)).length;
        return acc + (all>0 && done===all ? 1 : 0);
      },0);
      const ucFinished = (userCourse.sections || []).filter((sec, si)=> (sec.lectures||[]).length>0 && (sec.lectures||[]).every((_,li)=> state.userCourseChecklist.includes(`uc-${si}-${li}`))).length;
      return jsFinished + ucFinished;
    })()
  };
  const allUnlocked = useMemo(()=>{
    const got = new Set(state.badgesUnlocked||[]);
    FUN_BADGES.forEach(b=>{ if (b.check(ctxForBadges)) got.add(b.key); });
    return Array.from(got);
  }, [state.badgesUnlocked, ctxForBadges]);

  const [newBadge, setNewBadge] = useState(null); // {key,label}
  useEffect(()=>{
    const before = new Set(state.badgesUnlocked||[]);
    const after = new Set(allUnlocked);
    let found = null;
    for (const b of after) if (!before.has(b)) { found = FUN_BADGES.find(x=>x.key===b); break; }
    if (found) {
      badgeSound();
      setNewBadge({ key: found.key, label: found.label });
      setState(s=>({ ...s, badgesUnlocked: Array.from(after) }));
    } else {
      if ((state.badgesUnlocked||[]).length !== allUnlocked.length) {
        setState(s=>({ ...s, badgesUnlocked: Array.from(after) }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUnlocked.length]);

  // ==== Daily quests ====
  const QUEST_KEY = "mentor-daily-quests";
  const [quests, setQuests] = useState(()=>{
    const k = todayKey();
    const raw = localStorage.getItem(`${QUEST_KEY}:${k}`);
    if (raw) return JSON.parse(raw);
    const g = genDailyQuests();
    localStorage.setItem(`${QUEST_KEY}:${k}`, JSON.stringify(g));
    return g;
  });
  useEffect(()=>{
    const id = setInterval(()=>{
      const k = todayKey();
      const raw = localStorage.getItem(`${QUEST_KEY}:${k}`);
      if (!raw) {
        const g = genDailyQuests();
        localStorage.setItem(`${QUEST_KEY}:${k}`, JSON.stringify(g));
        setQuests(g);
      }
    }, 30_000);
    return ()=> clearInterval(id);
  },[]);
  const persistQuests = (qs) => localStorage.setItem(`${QUEST_KEY}:${todayKey()}`, JSON.stringify(qs));
  const updateQuestProgress = (type, by=1) => {
    setQuests(qs=>{
      const upd = qs.map(q=>{
        if (q.type!==type || q.done) return q;
        const nv = clamp((q.progress||0)+by, 0, q.need);
        const done = nv>=q.need;
        if (done) awardXP(q.xp);
        return { ...q, progress: nv, done };
      });
      persistQuests(upd);
      return upd;
    });
  };

  // ==== Check-in ====
  const [checkedIn, setCheckedIn] = useState(()=> (state.history?.[todayKey()]||0) > 0);
  const handleCheckIn = (e) => {
    addHistory(1);
    awardXP(1);
    setCheckedIn(true);
    checkInSound();
    setBurst({ key: `b-${Date.now()}`, x: e.clientX, y: e.clientY });
    setTimeout(()=> setBurst(null), 900);
  };

  // ==== Export/Import ====
  const exportProgress = () => {
    const payload = { dark, theme, state, jsOpen, ucOpen };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const a = document.createElement("a"); a.href = dataStr; a.download = "mentor-dashboard-pro-v9.json"; a.click();
  };
  const importProgress = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const obj = JSON.parse(String(ev.target.result));
        if (typeof obj.dark === "boolean") setDark(obj.dark);
        if (obj.theme) setTheme(obj.theme);
        if (obj.state) setState(obj.state);
        if (obj.jsOpen) setJsOpen(obj.jsOpen);
        if (obj.ucOpen) setUcOpen(obj.ucOpen);
      } catch { alert("Invalid JSON"); }
    };
    r.readAsText(f);
  };

  // ==== Streak tier ====
  const streak = computeStreak;
  const streakTier = streak>=30 ? "xl" : streak>=10 ? "lg" : streak>=5 ? "md" : null;

  const themeObj = THEMES[theme] || THEMES.mono;

  // ==== Expose API (opsional) ====
  useEffect(()=>{
    window.MentorDash = {
      getStreak: () => streak,
      getWeeklyXP: () => weeklyXP,
      addXP: (n) => awardXP(Number(n||0)),
      checkInToday: () => handleCheckIn({ clientX: window.innerWidth/2, clientY: 120 }),
      addHistoryOn: (dateStr, xp) => addHistoryOn(dateStr, Number(xp||0)),
      setTheme: (t) => setTheme(t),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak, weeklyXP]);

  // ==== Leaderboard (10 nama) ====
  const peersSeed = [
    { id:"p1",  name:"Hidup Jokowi", score:120 },
    { id:"p2",  name:"Rara",         score:96  },
    { id:"p3",  name:"Budi",         score:88  },
    { id:"p4",  name:"Aripin",       score:75  },
    { id:"p5",  name:"Siti",         score:110 },
    { id:"p6",  name:"Dewi",         score:90  },
    { id:"p7",  name:"Agus",         score:84  },
    { id:"p8",  name:"Yanto",        score:79  },
    { id:"p9",  name:"Putri",        score:95  },
    { id:"me",  name:"Kamu",         score:weeklyXP },
  ];
  const savedPeers = useMemo(()=>{ try { return JSON.parse(localStorage.getItem(LS_PEERS) || "null"); } catch { return null; } }, []);
  const [peers, setPeers] = useState(savedPeers?.length ? savedPeers : peersSeed);
  useEffect(()=>{ setPeers(ps=>ps.map(p=>p.id==="me"? {...p, score: weeklyXP} : p)); }, [weeklyXP]);
  const shufflePeers = () => {
    setPeers(ps=>ps.map(p=>{
      if (p.id==="me") return p;
      const delta = Math.floor(Math.random()*100)-50;
      return { ...p, score: Math.max(0, weeklyXP + delta) };
    }));
  };
  const sortedPeers = useMemo(()=> [...peers].sort((a,b)=>b.score-a.score).slice(0,10), [peers]);
  useEffect(()=>{ try { localStorage.setItem(LS_PEERS, JSON.stringify(peers)); } catch {} }, [peers]);

  // ==== Weekly modal ====
  const [openWeekly, setOpenWeekly] = useState(false);

  return (
    <div className={(dark? "dark ":"") + "min-h-screen w-full relative overflow-hidden"}>
      {/* Animated gradient background */}
      <motion.div
        aria-hidden
        className={"pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br " + (dark? themeObj.darkBg:themeObj.bg)}
        initial={{ backgroundPosition: "0% 0%" }}
        animate={{ backgroundPosition: ["0% 0%","100% 100%","0% 0%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{ backgroundSize: "200% 200%" }}
      />

      {/* confetti from level up */}
      {confetti.map((p)=>(
        <motion.div key={p.id} initial={{opacity:1,y:-20,x:`${p.x}vw`,rotate:p.r}} animate={{y:"100vh",rotate:p.r+180}} transition={{duration:p.d/100,ease:"easeOut"}} className="pointer-events-none absolute top-0"
          style={{ width:p.s, height:p.s, borderRadius:2, background:["#22c55e","#3b82f6","#eab308","#ef4444","#a855f7"][Math.floor(Math.random()*5)] }} />
      ))}

      {/* particle burst for check-in */}
      <AnimatePresence>{burst && <ParticleBurst burstKey={burst.key} x={burst.x} y={burst.y} />}</AnimatePresence>

      <div className="mx-auto max-w-6xl p-6 text-neutral-900 dark:text-neutral-100">
        {/* HEADER */}
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img
  src="/logo-ku.jpeg"
  alt="Logo"
  className="h-8 w-8 rounded object-cover"
/>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">MentorDashboard</h1>
                {/* Streak flare */}
                <AnimatePresence>
                  {streakTier && (
                    <motion.span
                      key={`fl-${streakTier}`}
                      initial={{ opacity: 0, y: -6, scale: .9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300"
                    >
                      <span>🔥 x{streak}</span>
                      <span className="hidden sm:inline">Streak</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-neutral-600 dark:text-neutral-300">
                Track: <span className="font-medium">{state.track}</span> — Streak: <span className="font-medium">{streak} hari</span> — XP 7d: <span className="font-medium">{weeklyXP}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <select value={theme} onChange={e=>{ setTheme(e.target.value); updateQuestProgress("theme_switch",1); }} className="rounded-2xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-sm bg-white/90 dark:bg-neutral-800">
              {Object.keys(THEMES).map(k=><option key={k} value={k}>{k}</option>)}
            </select>
            <button onClick={()=>setDark(d=>!d)} className="rounded-2xl border border-neutral-200 dark:border-neutral-700 px-4 py-2 text-sm bg-white/90 dark:bg-neutral-800">
              Toggle {dark? "Light":"Dark"}
            </button>
            <button onClick={()=>{ localStorage.removeItem(LS_KEY); location.reload(); }} className="rounded-2xl border border-neutral-200 dark:border-neutral-700 px-4 py-2 text-sm bg-white/90 dark:bg-neutral-800">
              Reset Local
            </button>
          </div>
        </header>

        {/* XP & LEVEL */}
        <section className="mb-6 rounded-3xl bg-white/90 dark:bg-neutral-900 p-5 shadow">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">XP & Level</h2>
            <AnimatePresence>
              {xpMultiplier>1 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-xs"
                >
                  🎉 Double XP Day!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar value={progress}/>
            </div>
            <div className="text-sm tabular-nums w-24 text-right dark:text-neutral-200">{xpInLevel}/100</div>
          </div>
          <div className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
            Level <span className="font-medium">{levelNow}</span> — Total XP: <span className="font-medium">{state.xp}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <RippleButton onClick={()=>{ incStat("exercises_completed",1); awardXP(10); }} title="+10 XP (Latihan)">+10 XP (Latihan)</RippleButton>
            <RippleButton onClick={()=>{ incStat("bugs_fixed",1); awardXP(5); }} title="+5 XP (Bug Fix)">+5 XP (Tugas Selesai)</RippleButton>
            <RippleButton onClick={()=>{ incStat("tests_written",3); awardXP(15); }} title="+15 XP (Unit Test)">+15 XP (Update Info)</RippleButton>
            <RippleButton onClick={()=>{ incStat("frameworks_tried",1); awardXP(10); }} title="+10 XP (Coba Framework)">+10 XP (Coba Materi baru)</RippleButton>
            <RippleButton onClick={(e)=>handleCheckIn(e)} title="Daily Check-in (+1 XP)" className={checkedIn?"!bg-emerald-700/70 cursor-not-allowed":"!bg-emerald-600"}>
              {checkedIn ? "Sudah Check-in" : "Daily Check-in (+1 XP)"}
            </RippleButton>
          </div>
        </section>

        {/* DAILY QUEST BOARD */}
        <section className="mb-6 rounded-3xl bg-white/90 dark:bg-neutral-900 p-5 shadow">
          <h2 className="text-lg font-semibold mb-3">Quest Harian</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quests.map((q, i)=>(
              <motion.div key={q.id} whileHover={{ scale: 1.01 }} className={"rounded-2xl border p-4 " + (q.done? "border-emerald-400":"border-neutral-200 dark:border-neutral-700")}>
                <div className="text-sm font-semibold mb-1">{i+1}. {q.text}</div>
                <div className="text-xs opacity-70 mb-2">{q.progress}/{q.need} • Reward {q.xp} XP</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1"><ProgressBar value={(q.progress/q.need)*100}/></div>
                  <div className={"text-[10px] px-2 py-0.5 rounded-full " + (q.done?"bg-emerald-100 text-emerald-700":"bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-200")}>
                    {q.done? "Selesai":"Progres"}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-xs opacity-70 mt-2">*Quest reset tiap hari ({todayKey()}).</div>
        </section>

        {/* BADGES */}
        <section className="mb-6 rounded-3xl bg-white/90 dark:bg-neutral-900 p-5 shadow">
          <h2 className="text-lg font-semibold mb-3">Badges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FUN_BADGES.map(b=>{
              const have = (state.badgesUnlocked||[]).includes(b.key) || (allUnlocked||[]).includes(b.key);
              return (
                <motion.div key={b.key} whileHover={{ y: -2 }} className={"rounded-2xl border p-4 " + (have? "border-emerald-400":"border-neutral-200 dark:border-neutral-700")}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{b.label}</div>
                    <div className={"text-[10px] px-2 py-0.5 rounded-full " + (have? "bg-emerald-100 text-emerald-700":"bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-200")}>
                      {have? "Unlocked":"Locked"}
                    </div>
                  </div>
                  {!have && <div className="text-xs mt-2 opacity-70">{b.hint}</div>}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* KURIKULUM JS — FULL */}
        <section className="mb-6 rounded-3xl bg-white/90 dark:bg-neutral-900 p-5 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Kurikulum JS (21 section • {TOTAL_LECTURES} lecture)</h2>
            <div className="text-sm opacity-80">Progress: {state.jsChecklist.length}/{TOTAL_LECTURES}</div>
          </div>

          <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700 mb-4">
            <motion.div
              initial={{width:0}}
              animate={{width:`${Math.round((state.jsChecklist.length/TOTAL_LECTURES)*100)}%`}}
              className="absolute left-0 top-0 h-full bg-emerald-500"
            />
          </div>

          <div className="mb-3 flex gap-2">
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Cari lecture/section..." className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 bg-white/90 dark:bg-neutral-800"/>
          </div>

          <div className="space-y-3">
            {COURSE_SECTIONS
              .filter(sec=>{
                if (!search.trim()) return true;
                const q = search.toLowerCase();
                const inName = sec.name.toLowerCase().includes(q);
                const inLect = (sec.lectures||[]).some(t=>String(t).toLowerCase().includes(q));
                return inName || inLect;
              })
              .map((sec, si)=>{
                const done = sec.lectures.filter((_,li)=>isJsDone(si,li)).length;
                const pct = sec.lectures.length? Math.round((done/sec.lectures.length)*100) : 0;
                const open = !!jsOpen[si];
                return (
                  <div key={si} className="rounded-2xl border border-neutral-200 dark:border-neutral-700">
                    <button className="w-full flex items-center justify-between px-4 py-3" onClick={()=>setJsOpen(prev=>({ ...prev, [si]: !open }))}>
                      <div className="text-sm font-semibold">{si+1}. {sec.name}</div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs opacity-80">{done}/{sec.lectures.length} • {pct}%</div>
                        <div className={"size-6 rounded-full grid place-items-center " + (open? "bg-neutral-900 text-white":"bg-neutral-200 dark:bg-neutral-800")}>{open? "−":"+"}</div>
                      </div>
                    </button>
                    {open && (
                      <div className="px-4 pb-3">
                        <ul className="space-y-1">
                          {sec.lectures.map((t,li)=>{
                            const checked = isJsDone(si,li);
                            return (
                              <li key={`js-${si}-${li}`} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                                <div className="flex items-center gap-3">
                                  <input type="checkbox" checked={checked} onChange={()=>toggleJsLecture(si,li)} />
                                  <div className={"text-sm " + (checked? "line-through opacity-70":"")}>{li+1}. {t}</div>
                                </div>
                                <div className="text-[10px] opacity-70">+{LECTURE_XP} XP</div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </section>

        {/* KURIKULUM KUSTOM (CRUD + DnD intra-section) */}
        <section className="mb-6 rounded-3xl bg-white/90 dark:bg-neutral-900 p-5 shadow">
          <h2 className="text-lg font-semibold mb-2">{userCourse.title}</h2>
          <div className="flex gap-2 mb-3">
            <input value={userCourse.title} onChange={e=>setState(s=>({...s, userCourse:{...s.userCourse, title:e.target.value}}))} className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 bg-white/90 dark:bg-neutral-800" />
          </div>
          <div className="flex gap-2 mb-3">
            <input value={newSectionTitle} onChange={e=>setNewSectionTitle(e.target.value)} placeholder="Tambah Section..." className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 bg-white/90 dark:bg-neutral-800" />
            <button onClick={addSection} className="rounded-xl bg-neutral-900 text-white px-4 py-2">Tambah Section</button>
          </div>

          <DragDropContext onDragEnd={onUcDragEnd}>
            <div className="space-y-3">
              {(userCourse.sections||[]).map((sec, si)=>{
                const done = (sec.lectures||[]).filter((_,li)=>isUcDone(si,li)).length;
                const all  = (sec.lectures||[]).length;
                const open = !!ucOpen[si];
                return (
                  <div key={`uc-sec-${si}`} className="rounded-2xl border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between px-4 py-3">
                      <button className="flex-1 text-left" onClick={()=>setUcOpen(prev=>({...prev, [si]:!open}))}>
                        <div className="text-sm font-semibold">{si+1}. {sec.title}</div>
                      </button>
                      <div className="flex items-center gap-2">
                        <div className="text-xs opacity-70">{done}/{all}</div>
                        <button onClick={()=>deleteSection(si)} className="text-xs rounded-xl border px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800">Hapus Section</button>
                        <div className={"size-6 rounded-full grid place-items-center " + (open? "bg-neutral-900 text-white":"bg-neutral-200 dark:bg-neutral-800")}>{open? "−":"+"}</div>
                      </div>
                    </div>

                    {open && (
                      <div className="px-4 pb-3">
                        <div className="flex gap-2 mb-2">
                          <input value={newLectureTitle} onChange={e=>setNewLectureTitle(e.target.value)} placeholder="Tambah sub-bab/lecture..." className="flex-1 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 bg-white/90 dark:bg-neutral-800"/>
                          <button onClick={()=>addLecture(si)} className="rounded-xl border px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800">Tambah</button>
                        </div>

                        <Droppable droppableId={`uc-sec-${si}`} type="UC-LECTURE">
                          {(dropProvided)=>(
                            <ul ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="space-y-1">
                              {(sec.lectures||[]).map((t,li)=>(
                                <Draggable key={`uc-${si}-${li}`} draggableId={`uc-${si}-${li}`} index={li}>
                                  {(dragProvided)=>(
                                    <li
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                      className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                    >
                                      <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={isUcDone(si,li)} onChange={()=>toggleUcLecture(si,li)} />
                                        <div className={"text-sm " + (isUcDone(si,li)? "line-through opacity-70":"")}>
                                          {li+1}. {t}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="text-[10px] opacity-70">+{LECTURE_XP} XP</div>
                                        <button onClick={()=>deleteUcLecture(si,li)} className="text-[10px] rounded-xl border px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800">Hapus</button>
                                      </div>
                                    </li>
                                  )}
                                </Draggable>
                              ))}
                              {dropProvided.placeholder}
                            </ul>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </section>

        {/* PROYEK AKHIR (Capstone) */}
        <section className="mb-6 rounded-3xl bg-white/90 dark:bg-neutral-900 p-5 shadow">
          <h2 className="text-lg font-semibold mb-3">Proyek Akhir</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input value={capTitle} onChange={e=>setCapTitle(e.target.value)} placeholder="Judul proyek..." className="rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 bg-white/90 dark:bg-neutral-800" />
            <input type="number" value={capXp} onChange={e=>setCapXp(e.target.value)} className="rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 bg-white/90 dark:bg-neutral-800" />
            <input value={capTopics} onChange={e=>setCapTopics(e.target.value)} placeholder="Topik (pisah koma) ..." className="rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 bg-white/90 dark:bg-neutral-800" />
          </div>
          <div className="mb-4">
            <button onClick={addCapstone} className="rounded-xl bg-neutral-900 text-white px-4 py-2">Tambah Proyek</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(state.userCapstones||[]).map(c=>(
              <div key={c.id} className="rounded-2xl border border-neutral-200 dark:border-neutral-700 p-4">
                <div className="text-sm font-semibold mb-1">{c.title}</div>
                <div className="text-xs mb-2 opacity-80">XP: {c.xp}</div>
                {c.topics?.length>0 && (
                  <ul className="text-xs list-disc pl-5 space-y-1 mb-2">{c.topics.map((t,i)=>(<li key={i}>{t}</li>))}</ul>
                )}
                <div className="flex gap-2">
                  <button onClick={()=>claimCapstone(c.xp)} className="rounded-xl bg-neutral-900 text-white px-3 py-1 text-sm">Claim XP</button>
                  <button onClick={()=>deleteCapstone(c.id)} className="rounded-xl border px-3 py-1 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LEADERBOARD (10 nama) */}
        <section className="mb-6 rounded-3xl bg-white/90 dark:bg-neutral-900 p-5 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Leaderboard (XP 7 hari)</h2>
            <div className="flex gap-2">
              <button onClick={shufflePeers} className="rounded-xl border px-3 py-1 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">Acak Skor</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedPeers.map((p, i)=>(
              <div key={p.id} className={"flex items-center justify-between rounded-2xl border p-3 " + (p.id==="me" ? "border-emerald-400" : "border-neutral-200 dark:border-neutral-700")}>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full grid place-items-center text-xs">
                    <Medal rank={i+1}/>
                  </div>
                  <div className={"text-sm " + (p.id==="me"?"font-semibold":"")}>{p.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm">{p.score} XP</div>
                  {p.id==="me" && <AvatarWithRing name="Kamu" pct={Math.min(100, Math.max(0, Math.round((p.score/200)*100)))} />}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WEEKLY SUMMARY (panel + tombol modal) */}
        <section className="mb-6 rounded-3xl bg-white/90 dark:bg-neutral-900 p-5 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Weekly Summary</h2>
            <button onClick={()=>setOpenWeekly(true)} className="rounded-xl border px-3 py-1 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">
              Lihat Ringkasan
            </button>
          </div>
          <div className="text-sm mt-2">Total XP 7 hari: <span className="font-medium">{weeklyXP}</span> • Streak: <span className="font-medium">{streak} hari</span></div>
        </section>

        {/* BACKUP */}
        <section className="mb-6 rounded-3xl bg-white/90 dark:bg-neutral-900 p-5 shadow">
          <h2 className="text-lg font-semibold mb-3">Backup</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={exportProgress} className="rounded-2xl border border-neutral-200 dark:border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">Export JSON</button>
            <input ref={fileRef} type="file" accept="application/json" onChange={importProgress} className="text-sm" />
          </div>
        </section>

        {/* FOOTER */}
        <footer className="mt-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
          Copyright Fauzi Destyan ❤️ — MentorDashboard v1 Ultimate
        </footer>
      </div>

      {/* Achievement Modal — BRIGHT */}
<Modal open={!!newBadge} onClose={()=>setNewBadge(null)} title="🏅 Badge Unlocked!" tone="bright">
  {newBadge && (
    <div className="text-center">
      <div className="text-2xl font-semibold mb-1 text-neutral-900">{newBadge.label}</div>

      {/* subtext lebih kontras */}
      <div className="text-sm text-neutral-600">
        Mantap! Terus pertahankan progresmu 🔥
      </div>

      {/* chip aksen biar ‘meriah’ */}
      <div className="mt-3 flex justify-center">
        <span className="text-[11px] rounded-full px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200">
          Badge baru berhasil dibuka
        </span>
      </div>

      {/* optional: garis halus */}
      <div className="mt-4 h-px bg-neutral-200" />

      {/* tombol lanjut (opsional, karena sudah ada tombol Tutup bawaan modal) */}
      {/* <button onClick={()=>setNewBadge(null)} className="mt-3 rounded-xl bg-neutral-900 text-white px-4 py-2">
        Lanjut Belajar
      </button> */}
    </div>
  )}
</Modal>

      {/* WEEKLY SUMMARY MODAL — PRO (BRIGHT) */}
<Modal open={openWeekly} onClose={()=>setOpenWeekly(false)} title="📊 Ringkasan Mingguan" tone="bright">
  {(() => {
    const week = buildWeekSeries(state.history);
    const total = week.reduce((a,b)=>a+b.xp,0);
    const max = Math.max(...week.map(d=>d.xp), 1);
    const avg = Math.round(total/7);
    const active = week.filter(d=>d.xp>0).length;
    const best = week.reduce((m,d)=> d.xp>m.xp? d : m, {xp:-1});
    const prevTotal = calcPrevWeekTotal(state.history);
    const delta = total - prevTotal;
    const deltaPct = prevTotal ? Math.round((delta/prevTotal)*100) : 100;
    const unlocked = (state.badgesUnlocked||[]).map(k => FUN_BADGES.find(b=>b.key===k)?.label).filter(Boolean);

    return (
      <div className="space-y-4">
        {/* Top stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill label="Total XP (7 hari)" value={`${total} XP`}/>
          <StatPill label="Rata-rata / hari" value={`${avg} XP`} sub={`${active} hari aktif`}/>
          <StatPill label="Best day" value={`${best.label || "-"}`} sub={`${best.xp>0?best.xp:0} XP`}/>
          <StatPill label="Streak berjalan" value={`${streak} hari`} />
        </div>

        {/* Grafik detail – terang */}
        <div>
          <div className="text-sm font-semibold mb-2">Aktivitas Harian</div>
          <div className="flex items-end gap-3">
            {week.map((d,i)=>(
              <div key={d.key} className="flex flex-col items-center w-10">
                <motion.div
                  initial={{ height: 6 }}
                  animate={{ height: `${Math.max(6, Math.round((d.xp/max)*100))}%` }}
                  transition={{ type:"spring", stiffness:110, damping:18 }}
                  className={
                    "w-7 rounded-md bg-gradient-to-t from-emerald-500 to-cyan-400 " +
                    (i===6 ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-white" : "")
                  }
                  title={`${d.label}: ${d.xp} XP`}
                  style={{ minHeight: 6 }}
                />
                <div className="text-[10px] mt-1 text-neutral-700">{d.label}</div>
                <div className="text-[10px] text-neutral-500">{d.xp}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tren & level & badge – terang */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={(delta>=0
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-rose-300 bg-rose-50 text-rose-700") + " rounded-xl p-3 border"}>
            <div className="text-sm font-semibold">Perbandingan Mingguan</div>
            <div className="text-[13px] mt-1">
              {delta>=0 ? "Naik" : "Turun"} <span className="font-semibold">{Math.abs(delta)} XP</span> ({deltaPct>=0?"+":""}{deltaPct}%)
              <span className="opacity-70"> dibanding 7 hari sebelumnya</span>.
            </div>
          </div>

          <div className="rounded-xl p-3 border border-neutral-200 bg-white flex items-center gap-3">
            <LevelRing pct={Math.round((xpInLevel/100)*100)}/>
            <div>
              <div className="text-sm font-semibold">Progres Level</div>
              <div className="text-[13px]">Level {levelNow} — <span className="font-semibold">{xpInLevel}/100 XP</span></div>
            </div>
          </div>

          <div className="rounded-xl p-3 border border-neutral-200 bg-white">
            <div className="text-sm font-semibold mb-1">Badge Saat Ini</div>
            <div className="flex flex-wrap gap-1.5">
              {unlocked.length
                ? unlocked.map((t,i)=>(<BadgeChip key={i} text={t}/>))
                : <span className="text-[12px] text-neutral-500">Belum ada badge</span>}
            </div>
          </div>
        </div>

        <div className="text-[12px] text-neutral-600">
          • Gunakan <span className="font-medium text-neutral-800">Daily Check-in</span> dan selesaikan beberapa lecture tiap hari untuk menjaga streak. • Weekend aktif <b>Double XP</b> 🎉
        </div>
      </div>
    );
  })()}
</Modal>

    </div>
  );
}
