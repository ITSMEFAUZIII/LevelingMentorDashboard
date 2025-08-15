// src/dashboard/DashboardV2Growth.jsx
import React, { useRef, useState } from "react";
import { motion as fmMotion } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import EcoScene from "../components/EcoScene.jsx";
import Modal from "../components/Modal.jsx";
import StressModal from "../components/StressModal.jsx";
import { useDashboardCore, LECTURE_XP } from "./useDashboardCore.js";
import { todayKey, ymd, DAY_MS } from "../constants/gameData.js";

// small UI
const MotionDiv = fmMotion.div;
const ProgressBar = ({value})=>(
  <div className="relative h-3 w-full overflow-hidden rounded-full bg-neutral-200">
    <MotionDiv initial={{width:0}} animate={{width:`${Math.min(100,Math.max(0,value))}%`}}
      className="absolute left-0 top-0 h-full" style={{background:"linear-gradient(90deg,#10b981,#22d3ee)"}}/>
    <MotionDiv className="absolute inset-0" initial={{x:"-100%"}} animate={{x:"100%"}} transition={{repeat:Infinity,duration:1.8,ease:"linear"}}
      style={{background:"linear-gradient(120deg,transparent,rgba(255,255,255,.35),transparent)"}}/>
  </div>
);
const Btn=({children,onClick,className=""})=>(
  <button onClick={onClick} className={"rounded-2xl bg-white border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50 "+className}>{children}</button>
);

export default function DashboardV2Growth({ activeUser }) {
  const {
    state,setState, COURSE_SECTIONS, TOTAL_LECTURES,
    xpInLevel, levelNow, progress, weeklyXP, streak, xpMultiplier,
    jsOpen,setJsOpen, ucOpen,setUcOpen,
    awardXP, incStat,
    isJsDone, toggleJsLecture,
    userCourse, addSection, addLecture, deleteSection, isUcDone, toggleUcLecture, deleteUcLecture, onUcDragEnd,
    addCapstone, deleteCapstone, claimCapstone,
    exportProgress, importProgress,
    quests, logStudy, logBreak,
    newBadge, setNewBadge,
    sortedPeers, shufflePeers,
  } = useDashboardCore(activeUser);

  const [openWeekly,setOpenWeekly] = useState(false);
  const [openStress,setOpenStress] = useState(false);
  const fileRef = useRef(null);
  const [newSectionTitle,setNewSectionTitle]=useState("");
  const [newLectureTitle,setNewLectureTitle]=useState("");
  const [capTitle,setCapTitle]=useState(""); const [capXp,setCapXp]=useState(150); const [capTopics,setCapTopics]=useState("");

  return (
    <div className="min-h-screen w-full relative overflow-hidden text-neutral-900">
      <EcoScene/>

      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-ku.jpeg" alt="Logo" className="h-8 w-8 rounded object-cover"/>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">MentorDashboard</h1>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-emerald-200 text-emerald-800">
                  🔥 x{streak} Streak
                </span>
              </div>
              <p className="text-neutral-600">Track: <span className="font-medium">{state.track}</span> — XP 7d: <span className="font-medium">{weeklyXP}</span></p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={()=>setOpenStress(true)}>Kesehatan & Waktu</Btn>
            <Btn onClick={()=>{localStorage.removeItem(`mentor-dashboard-pro-v9:${activeUser}`); location.reload();}}>Reset Local</Btn>
          </div>
        </header>

        {/* XP & Level */}
        <section className="mb-6 rounded-3xl p-5 bg-white border border-emerald-200 shadow">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">XP & Level</h2>
            {xpMultiplier>1 && <div className="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs">🎉 Double XP Day!</div>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1"><ProgressBar value={progress}/></div>
            <div className="text-sm tabular-nums w-24 text-right">{xpInLevel}/100</div>
          </div>
          <div className="mt-2 text-sm">Level <span className="font-medium">{levelNow}</span> — Total XP: <span className="font-medium">{state.xp}</span></div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn onClick={()=>{incStat("exercises_completed",1); awardXP(10);}}>+10 XP (Latihan)</Btn>
            <Btn onClick={()=>{incStat("bugs_fixed",1); awardXP(5);}}>+5 XP (Tugas Selesai)</Btn>
            <Btn onClick={()=>{incStat("tests_written",3); awardXP(15);}}>+15 XP (Update Info)</Btn>
            <Btn onClick={()=>{incStat("frameworks_tried",1); awardXP(10);}}>+10 XP (Coba Materi baru)</Btn>
            <Btn onClick={()=>logStudy(25,2)}>+ Log Belajar 25m (+2 XP)</Btn>
            <Btn onClick={()=>logStudy(50,5)}>+ Log Belajar 50m (+5 XP)</Btn>
            <Btn onClick={logBreak}>+ Log Istirahat 5m</Btn>
          </div>
        </section>

        {/* Quests */}
        <section className="mb-6 rounded-3xl p-5 bg-white border border-emerald-200 shadow">
          <h2 className="text-lg font-semibold mb-3">Quest Harian</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quests.map((q,i)=>(
              <div key={q.id} className={"rounded-2xl border p-4 "+(q.done?"border-emerald-400":"border-neutral-200")}>
                <div className="text-sm font-semibold mb-1">{i+1}. {q.text}</div>
                <div className="text-xs opacity-70 mb-2">{q.progress}/{q.need} • Reward {q.xp} XP</div>
                <ProgressBar value={(q.progress/q.need)*100}/>
              </div>
            ))}
          </div>
          <div className="text-xs opacity-70 mt-2">*Quest reset tiap hari ({todayKey()})</div>
        </section>

        {/* Badges */}
        <section className="mb-6 rounded-3xl p-5 bg-white border border-emerald-200 shadow">
          <h2 className="text-lg font-semibold mb-3">Badges</h2>
          <div className="flex flex-wrap gap-2">
            {(state.badgesUnlocked||[]).length===0 && <div className="text-neutral-500">Belum ada badge — semangat! 🌱</div>}
            {(state.badgesUnlocked||[]).map(k=>(
              <span key={k} className="text-[12px] rounded-full px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200">🏅 {k}</span>
            ))}
          </div>
        </section>

        {/* Kurikulum JS */}
        <section className="mb-6 rounded-3xl p-5 bg-white border border-emerald-200 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Kurikulum JS (21 section • {TOTAL_LECTURES} lecture)</h2>
            <div className="text-sm opacity-80">Progress: {state.jsChecklist.length}/{TOTAL_LECTURES}</div>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-neutral-200 mb-4">
            <MotionDiv initial={{width:0}} animate={{width:`${Math.round((state.jsChecklist.length/TOTAL_LECTURES)*100)}%`}} className="absolute left-0 top-0 h-full bg-emerald-500"/>
          </div>
          <div className="space-y-3">
            {COURSE_SECTIONS.map((sec,si)=>{
              const done=sec.lectures.filter((_,li)=>isJsDone(si,li)).length;
              const pct = sec.lectures.length? Math.round((done/sec.lectures.length)*100) : 0;
              const open=!!jsOpen[si];
              return (
                <div key={si} className="rounded-2xl border border-neutral-200">
                  <button className="w-full flex items-center justify-between px-4 py-3" onClick={()=>setJsOpen(p=>({...p,[si]:!open}))}>
                    <div className="text-sm font-semibold">{si+1}. {sec.name}</div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs opacity-80">{done}/{sec.lectures.length} • {pct}%</div>
                      <div className={"size-6 rounded-full grid place-items-center "+(open?"bg-neutral-900 text-white":"bg-neutral-200")}>{open?"−":"+"}</div>
                    </div>
                  </button>
                  {open && (
                    <div className="px-4 pb-3">
                      <ul className="space-y-1">
                        {sec.lectures.map((t,li)=>{
                          const checked=isJsDone(si,li);
                          return (
                            <li key={`js-${si}-${li}`} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-neutral-50">
                              <div className="flex items-center gap-3">
                                <input type="checkbox" checked={checked} onChange={()=>toggleJsLecture(si,li)}/>
                                <div className={"text-sm "+(checked?"line-through opacity-70":"")}>{li+1}. {t}</div>
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

        {/* Kurikulum Kustom */}
        <section className="mb-6 rounded-3xl p-5 bg-white border border-emerald-200 shadow">
          <h2 className="text-lg font-semibold mb-2">{userCourse.title}</h2>
          <div className="flex gap-2 mb-3">
            <input value={userCourse.title} onChange={e=>setState(s=>({...s,userCourse:{...s.userCourse,title:e.target.value}}))} className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 bg-white"/>
          </div>
          <div className="flex gap-2 mb-3">
            <input value={newSectionTitle} onChange={e=>setNewSectionTitle(e.target.value)} placeholder="Tambah Section..." className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 bg-white"/>
            <Btn onClick={()=>{addSection(newSectionTitle); setNewSectionTitle("");}}>Tambah Section</Btn>
          </div>
          <DragDropContext onDragEnd={onUcDragEnd}>
            <div className="space-y-3">
              {(userCourse.sections||[]).map((sec,si)=>{
                const done=(sec.lectures||[]).filter((_,li)=>isUcDone(si,li)).length;
                const all =(sec.lectures||[]).length;
                const open=!!ucOpen[si];
                return (
                  <div key={`uc-sec-${si}`} className="rounded-2xl border border-neutral-200">
                    <div className="flex items-center justify-between px-4 py-3">
                      <button className="flex-1 text-left" onClick={()=>setUcOpen(p=>({...p,[si]:!open}))}>
                        <div className="text-sm font-semibold">{si+1}. {sec.title}</div>
                      </button>
                      <div className="flex items-center gap-2">
                        <div className="text-xs opacity-70">{done}/{all}</div>
                        <button onClick={()=>deleteSection(si)} className="text-xs rounded-xl border border-neutral-200 px-2 py-1 hover:bg-neutral-50">Hapus Section</button>
                        <div className={"size-6 rounded-full grid place-items-center "+(open?"bg-neutral-900 text-white":"bg-neutral-200")}>{open?"−":"+"}</div>
                      </div>
                    </div>
                    {open && (
                      <div className="px-4 pb-3">
                        <div className="flex gap-2 mb-2">
                          <input value={newLectureTitle} onChange={e=>setNewLectureTitle(e.target.value)} placeholder="Tambah lecture..." className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 bg-white"/>
                          <button onClick={()=>{addLecture(si,newLectureTitle); setNewLectureTitle("");}} className="rounded-xl border border-neutral-200 px-3 py-2 hover:bg-neutral-50">Tambah</button>
                        </div>
                        <Droppable droppableId={`uc-sec-${si}`} type="UC-LECTURE">
                          {(drop)=>(
                            <ul ref={drop.innerRef} {...drop.droppableProps} className="space-y-1">
                              {(sec.lectures||[]).map((t,li)=>(
                                <Draggable key={`uc-${si}-${li}`} draggableId={`uc-${si}-${li}`} index={li}>
                                  {(drag)=>(
                                    <li ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps}
                                      className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-neutral-50">
                                      <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={isUcDone(si,li)} onChange={()=>toggleUcLecture(si,li)}/>
                                        <div className={"text-sm "+(isUcDone(si,li)?"line-through opacity-70":"")}>{li+1}. {t}</div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="text-[10px] opacity-70">+{LECTURE_XP} XP</div>
                                        <button onClick={()=>deleteUcLecture(si,li)} className="text-[10px] rounded-xl border border-neutral-200 px-2 py-1 hover:bg-neutral-50">Hapus</button>
                                      </div>
                                    </li>
                                  )}
                                </Draggable>
                              ))}
                              {drop.placeholder}
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

        {/* Capstones */}
        <section className="mb-6 rounded-3xl p-5 bg-white border border-emerald-200 shadow">
          <h2 className="text-lg font-semibold mb-3">Proyek Akhir</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input value={capTitle} onChange={e=>setCapTitle(e.target.value)} placeholder="Judul proyek..." className="rounded-xl border border-neutral-200 px-3 py-2"/>
            <input type="number" value={capXp} onChange={e=>setCapXp(e.target.value)} className="rounded-xl border border-neutral-200 px-3 py-2"/>
            <input value={capTopics} onChange={e=>setCapTopics(e.target.value)} placeholder="Topik (pisah koma) ..." className="rounded-xl border border-neutral-200 px-3 py-2"/>
          </div>
          <div className="mb-4"><Btn onClick={()=>{addCapstone(capTitle,capXp,capTopics); setCapTitle(""); setCapXp(150); setCapTopics("");}}>Tambah Proyek</Btn></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(state.userCapstones||[]).map(c=>(
              <div key={c.id} className="rounded-2xl border border-neutral-200 p-4">
                <div className="text-sm font-semibold mb-1">{c.title}</div>
                <div className="text-xs mb-2 opacity-80">XP: {c.xp}</div>
                {c.topics?.length>0 && <ul className="text-xs list-disc pl-5 space-y-1 mb-2">{c.topics.map((t,i)=>(<li key={i}>{t}</li>))}</ul>}
                <div className="flex gap-2">
                  <Btn onClick={()=>claimCapstone(c.xp)}>Claim XP</Btn>
                  <button onClick={()=>deleteCapstone(c.id)} className="rounded-xl border border-neutral-200 px-3 py-1 text-sm hover:bg-neutral-50">Hapus</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Leaderboard */}
        <section className="mb-6 rounded-3xl p-5 bg-white border border-emerald-200 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Leaderboard (XP 7 hari)</h2>
            <div className="flex gap-2"><button onClick={shufflePeers} className="rounded-xl border border-neutral-200 px-3 py-1 text-sm hover:bg-neutral-50">Acak Skor</button></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedPeers.map((p,i)=>(
              <div key={p.id} className={"flex items-center justify-between rounded-2xl border p-3 "+(p.id==="me"?"border-emerald-400":"border-neutral-200")}>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full grid place-items-center text-xs bg-emerald-100">{i+1}</div>
                  <div className={"text-sm "+(p.id==="me"?"font-semibold":"")}>{p.name}</div>
                </div>
                <div className="text-sm">{p.score} XP</div>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly Summary */}
        <section className="mb-6 rounded-3xl p-5 bg-white border border-emerald-200 shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Weekly Summary</h2>
            <button onClick={()=>setOpenWeekly(true)} className="rounded-xl border border-neutral-200 px-3 py-1 text-sm hover:bg-neutral-50">Lihat Ringkasan</button>
          </div>
          <div className="text-sm mt-2">Total XP 7 hari: <span className="font-medium">{weeklyXP}</span> • Streak: <span className="font-medium">{streak} hari</span></div>
        </section>

        {/* Backup */}
        <section className="mb-6 rounded-3xl p-5 bg-white border border-emerald-200 shadow">
          <h2 className="text-lg font-semibold mb-3">Backup</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={exportProgress} className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50">Export JSON</button>
            <input ref={fileRef} type="file" accept="application/json" onChange={(e)=>importProgress(e.target.files?.[0])} className="text-sm"/>
          </div>
        </section>

        <footer className="mt-8 text-center text-xs text-neutral-500">
          Copyright {activeUser} ❤️ — MentorDashboard
        </footer>
      </div>

      {/* Badge Modal */}
      <Modal open={!!newBadge} onClose={()=>setNewBadge(null)} title="🏅 Badge Unlocked!" tone="bright">
        {newBadge && <div className="text-center">
          <div className="text-2xl font-semibold mb-1">{newBadge.label}</div>
          <div className="text-sm text-neutral-600">Mantap! Terus pertahankan progresmu 🔥</div>
        </div>}
      </Modal>

      {/* Weekly Modal */}
      <WeeklyModal isOpen={openWeekly} onClose={()=>setOpenWeekly(false)} state={state} xpInLevel={xpInLevel} levelNow={levelNow} streak={streak}/>
      <StressModal open={openStress} onClose={()=>setOpenStress(false)} state={state} onLogBreak={logBreak}/>
    </div>
  );
}

const dayShort=["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
function WeeklyModal({isOpen,onClose,state,streak,xpInLevel,levelNow}){
  const base=new Date(); base.setHours(0,0,0,0);
  const series=[]; for(let i=6;i>=0;i--){ const d=new Date(base.getTime()-i*DAY_MS); const k=ymd(d); series.push({key:k,label:dayShort[d.getDay()],xp:Number(state.history?.[k]||0)}); }
  const total=series.reduce((a,b)=>a+b.xp,0);
  const max=Math.max(...series.map(d=>d.xp),1);
  const avg=Math.round(total/7);
  const active=series.filter(d=>d.xp>0).length;
  const best=series.reduce((m,d)=>d.xp>m.xp?d:m,{xp:-1});
  return (
    <Modal open={isOpen} onClose={onClose} title="📊 Ringkasan Mingguan" tone="bright">
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Pill label="Total XP (7 hari)" value={`${total} XP`}/>
          <Pill label="Rata-rata / hari" value={`${avg} XP`} sub={`${active} hari aktif`}/>
          <Pill label="Best day" value={best.label||"-"} sub={`${best.xp>0?best.xp:0} XP`}/>
          <Pill label="Streak" value={`${streak} hari`}/>
        </div>
        <div>
          <div className="text-sm font-semibold mb-2">Aktivitas Harian</div>
          <div className="flex items-end gap-3">
            {series.map(d=>(
              <div key={d.key} className="flex flex-col items-center w-10">
                <div className="w-7 rounded-md" style={{ height: Math.max(6, Math.round((d.xp/max)*100))+"px", background:"linear-gradient(#34d399,#10b981)" }}/>
                <div className="text-[10px] mt-1 text-neutral-700">{d.label}</div>
                <div className="text-[10px] text-neutral-500">{d.xp}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-3 border border-neutral-200 bg-white flex items-center gap-3">
          <svg width="70" height="70" className="-rotate-90"><circle cx="35" cy="35" r="26" stroke="#e5e7eb" strokeWidth="8" fill="none"/><circle cx="35" cy="35" r="26" stroke="#10b981" strokeWidth="8" fill="none" strokeDasharray={2*Math.PI*26} strokeDashoffset={(2*Math.PI*26)*(1-(xpInLevel/100))}/></svg>
          <div><div className="text-sm font-semibold">Progres Level</div><div className="text-[13px]">Level {levelNow} — <span className="font-semibold">{xpInLevel}/100 XP</span></div></div>
        </div>
      </div>
    </Modal>
  );
}
const Pill=({label,value,sub})=>(
  <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2">
    <div className="text-[11px] opacity-70">{label}</div>
    <div className="text-sm font-semibold">{value}</div>
    {sub && <div className="text-[11px] opacity-70 mt-0.5">{sub}</div>}
  </div>
);
