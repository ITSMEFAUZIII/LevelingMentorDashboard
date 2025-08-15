// src/dashboard/useDashboardCore.js
import { useEffect, useMemo, useRef, useState } from "react";
import courseData from "../course_js.json";
import { BADGES, genDailyQuests, todayKey, ymd, DAY_MS, buildBadgeCtx } from "../constants/gameData.js";

const LECTURE_XP = 1;
const LS_KEY = "mentor-dashboard-pro-v9";

const playTone=(f=440,d=0.1,t="sine",g=0.07)=>{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C();const o=c.createOscillator();const G=c.createGain();o.type=t;o.frequency.value=f;G.gain.value=g;o.connect(G);G.connect(c.destination);o.start();setTimeout(()=>{o.stop();c.close();},d*1000);};
const levelUpSound=()=>[440,660,880].forEach((f,i)=>setTimeout(()=>playTone(f,0.09,"triangle",0.06),i*120));
const badgeSound =()=>playTone(880,0.15,"square",0.06);

export function useDashboardCore(activeUser){
  const STORE_KEY = `${LS_KEY}:${activeUser}`;
  const saved = useMemo(()=>{ try{return JSON.parse(localStorage.getItem(STORE_KEY)||"null");}catch{return null;} },[STORE_KEY]);

  const COURSE_SECTIONS = (courseData?.sections??[]).map((s,si)=>({name:s.name, lectures:s.lectures||[], index:si}));
  const TOTAL_LECTURES = COURSE_SECTIONS.reduce((a,s)=>a+s.lectures.length,0);

  const [state,setState] = useState(saved?.state ?? {
    xp:0, track:"JS Beginner",
    stats:{bugs_fixed:0,exercises_completed:0,tests_written:0,frameworks_tried:0},
    history:{}, badgesUnlocked:[],
    milestones:[{id:"m1",text:"Baca materi 30 menit",done:false},{id:"m2",text:"Kerjakan 2 latihan",done:false}],
    userCapstones:[],
    userCourse:{title:"Kurikulum Kustom Kamu",sections:[]},
    jsChecklist:[], userCourseChecklist:[],
    studyHistory:{}, restHistory:{},
  });
  const [jsOpen,setJsOpen]=useState(saved?.jsOpen ?? {});
  const [ucOpen,setUcOpen]=useState(saved?.ucOpen ?? {});
  const [uiVersion,setUiVersion] = useState(saved?.uiVersion ?? "v2");

  // autosave
  useEffect(()=>{ localStorage.setItem(STORE_KEY, JSON.stringify({state,jsOpen,ucOpen,uiVersion})); },[STORE_KEY,state,jsOpen,ucOpen,uiVersion]);

  // XP / Level
  const xpInLevel = state.xp % 100;
  const levelNow  = Math.floor(state.xp/100)+1;
  const progress  = Math.min(100, Math.max(0, xpInLevel));

  // history ops
  const addHistoryOn=(key,delta)=>setState(s=>({ ...s, history:{ ...(s.history||{}), [key]: (s.history?.[key]||0)+delta } }));
  const addHistory=(delta)=>addHistoryOn(todayKey(),delta);

  // streak
  const streak = useMemo(()=>{
    const h=state.history||{}; let st=0; const start=new Date(todayKey());
    for(let i=0;i<365;i++){const d=new Date(start.getTime()-i*DAY_MS); const k=ymd(d); if((h[k]||0)>0) st++; else break;}
    return st;
  },[state.history]);

  // weeklyXP
  const weeklyXP = useMemo(()=>{
    const h=state.history||{}; let t=0; const now=new Date(todayKey());
    for(let i=0;i<7;i++){const d=new Date(now.getTime()-i*DAY_MS); t+=(h[ymd(d)]||0);}
    return t;
  },[state.history]);

  // double XP weekend
  const isDoubleXP=()=>{const day=new Date().getDay(); return day===0||day===6;};
  const [xpMultiplier,setXpMultiplier]=useState(isDoubleXP()?2:1);
  useEffect(()=>{const id=setInterval(()=>setXpMultiplier(isDoubleXP()?2:1),60000); return()=>clearInterval(id);},[]);

  const awardXP=(n)=>{ if(!n) return; const before=Math.floor(state.xp/100)+1; const bonus=Math.round(n*(xpMultiplier-1)); const total=n+bonus; const after=Math.floor((state.xp+total)/100)+1; setState(s=>({...s,xp:s.xp+total})); addHistory(total); if(after>before){levelUpSound();} };

  const incStat=(k,d=1)=>setState(s=>({...s, stats:{...s.stats,[k]:Math.max(0,(s.stats[k]||0)+d)}}));

  // JS curriculum
  const jsId=(si,li)=>`js-${si}-${li}`;
  const isJsDone=(si,li)=>state.jsChecklist.includes(jsId(si,li));
  const toggleJsLecture=(si,li)=>setState(s=>{
    const id=jsId(si,li); const setArr=new Set(s.jsChecklist);
    if(setArr.has(id)) setArr.delete(id);
    else { setArr.add(id); awardXP(LECTURE_XP); updateQuest("js_done",1); }
    return {...s, jsChecklist:[...setArr]};
  });

  // Custom course
  const userCourse = state.userCourse || { title:"Kurikulum Kustom Kamu", sections:[] };
  const ucId=(si,li)=>`uc-${si}-${li}`;
  const isUcDone=(si,li)=>state.userCourseChecklist.includes(ucId(si,li));
  const toggleUcLecture=(si,li)=>setState(s=>{
    const id=ucId(si,li); const setArr=new Set(s.userCourseChecklist||[]);
    if(setArr.has(id)) setArr.delete(id);
    else { setArr.add(id); awardXP(LECTURE_XP); }
    return {...s, userCourseChecklist:[...setArr]};
  });
  const addSection=(title)=>{ const t=title.trim(); if(!t) return; setState(s=>({...s, userCourse:{...s.userCourse, sections:[...(s.userCourse.sections||[]), {title:t, lectures:[]}]}})); };
  const addLecture=(si,title)=>{ const t=title.trim(); if(!t) return; setState(s=>{ const sections=(s.userCourse.sections||[]).map((sec,i)=> i===si? {...sec, lectures:[...(sec.lectures||[]), t]}:sec ); return {...s, userCourse:{...s.userCourse, sections}}; }); updateQuest("uc_add",1); };
  const deleteSection=(si)=>setState(s=>{ const sections=(s.userCourse.sections||[]).filter((_,i)=>i!==si); const keep=(s.userCourseChecklist||[]).filter(id=>!id.startsWith(`uc-${si}-`)); return {...s, userCourse:{...s.userCourse, sections}, userCourseChecklist:keep }; });
  const deleteUcLecture=(si,li)=>setState(s=>{ const sections=(s.userCourse.sections||[]).map((sec,i)=> i===si? {...sec, lectures:(sec.lectures||[]).filter((_,x)=>x!==li)}:sec ); const keep=(s.userCourseChecklist||[]).filter(x=>x!==ucId(si,li)); return {...s, userCourse:{...s.userCourse, sections}, userCourseChecklist:keep }; });
  const onUcDragEnd=(r)=>{ if(!r?.destination) return; const {source,destination,type}=r; if(type!=="UC-LECTURE") return; const sI=+source.droppableId.replace("uc-sec-",""); const dI=+destination.droppableId.replace("uc-sec-",""); if(sI!==dI) return;
    setState(s=>{const sections=(s.userCourse.sections||[]).map((sec,i)=>{ if(i!==sI) return sec; const arr=Array.from(sec.lectures||[]); const [mv]=arr.splice(source.index,1); arr.splice(destination.index,0,mv); return {...sec, lectures:arr};}); return {...s, userCourse:{...s.userCourse, sections}};});
  };

  // milestones
  const addMilestone=(text)=>{ const t=text.trim(); if(!t) return; setState(s=>({...s, milestones:[...s.milestones, {id:crypto.randomUUID(),text:t,done:false}]})); };
  const toggleMilestone=(id)=>{ setState(s=>({...s, milestones:s.milestones.map(m=>m.id===id?{...m,done:!m.done}:m)})); updateQuest("milestone_done",1); };
  const deleteMilestone=(id)=> setState(s=>({...s, milestones:s.milestones.filter(m=>m.id!==id)}));

  // capstone
  const [capstonesClaimed,setCapstonesClaimed] = useState(0);
  const addCapstone=(title,xp,topics)=>{ const t=title.trim(); if(!t) return; const arr=(topics||"").split(",").map(s=>s.trim()).filter(Boolean);
    setState(s=>({...s, userCapstones:[...(s.userCapstones||[]), {id:(crypto?.randomUUID?.()||Math.random().toString(36).slice(2)), title:t, xp:Number(xp||150), topics:arr}]}));
  };
  const deleteCapstone=(id)=> setState(s=>({...s, userCapstones:(s.userCapstones||[]).filter(c=>c.id!==id)}));
  const claimCapstone=(xp)=>{ awardXP(xp); setCapstonesClaimed(n=>n+1); updateQuest("cap_claim",1); };

  // quests per-user
  const QUEST_KEY = "mentor-daily-quests";
  const [quests,setQuests]=useState(()=>{const k=todayKey(); const raw=localStorage.getItem(`${QUEST_KEY}:${k}:${activeUser}`); if(raw) return JSON.parse(raw); const g=genDailyQuests(); localStorage.setItem(`${QUEST_KEY}:${k}:${activeUser}`, JSON.stringify(g)); return g;});
  useEffect(()=>{const id=setInterval(()=>{const k=todayKey(); const raw=localStorage.getItem(`${QUEST_KEY}:${k}:${activeUser}`); if(!raw){ const g=genDailyQuests(); localStorage.setItem(`${QUEST_KEY}:${k}:${activeUser}`,JSON.stringify(g)); setQuests(g);} }, 30000); return ()=>clearInterval(id);},[activeUser]);
  const persistQuests=(qs)=>localStorage.setItem(`${QUEST_KEY}:${todayKey()}:${activeUser}`, JSON.stringify(qs));
  const updateQuest=(type,by=1)=> setQuests(qs=>{
    const upd=qs.map(q=>{
      if(q.type!==type || q.done) return q;
      const nv = Math.max(0, Math.min(q.need, (q.progress||0) + by));
      const done = nv>=q.need;
      return { ...q, progress:nv, done };
    });
    // reward XP untuk quest yang baru selesai
    upd.forEach((q,i)=>{ if(!qs[i].done && q.done) awardXP(q.xp); });
    persistQuests(upd);
    return upd;
  });

  // study/rest logging
  const addStudyOn=(key,mins)=> setState(s=>({ ...s, studyHistory:{ ...(s.studyHistory||{}), [key]:(s.studyHistory?.[key]||0) + mins }}));
  const addRestOn =(key,c=1)=> setState(s=>({ ...s,  restHistory:{ ...(s.restHistory||{}),  [key]:(s.restHistory?.[key]||0) + c   }}));
  const logStudy=(minutes,xpReward=0)=>{ const k=todayKey(); addStudyOn(k, minutes); if(xpReward) awardXP(xpReward); updateQuest("log_study_min", minutes); };
  const logBreak=()=>{ const k=todayKey(); addRestOn(k,1); updateQuest("take_break",1); };

  // finished sections (JS+Custom)
  const finishedSections = useMemo(()=>{
    const jsFin = COURSE_SECTIONS.reduce((acc,sec,si)=>{
      const all=sec.lectures.length;
      const done=sec.lectures.filter((_,li)=> state.jsChecklist.includes(`js-${si}-${li}`)).length;
      return acc + (all>0 && done===all ? 1 : 0);
    },0);
    const ucFin = (state.userCourse.sections||[]).filter((sec,si)=>
      (sec.lectures||[]).length>0 &&
      (sec.lectures||[]).every((_,li)=> state.userCourseChecklist.includes(`uc-${si}-${li}`))
    ).length;
    return jsFin + ucFin;
  },[COURSE_SECTIONS,state.jsChecklist,state.userCourse,state.userCourseChecklist]);

  // badges unlock
  const [newBadge,setNewBadge]=useState(null);
  useEffect(()=>{
    const ctx = buildBadgeCtx({ state, streak, weeklyXP, finishedSections, extra:{capstonesClaimed} });
    const before = new Set(state.badgesUnlocked||[]);
    const after  = new Set(state.badgesUnlocked||[]);
    BADGES.forEach(b=>{ if(b.check(ctx)) after.add(b.key); });
    let found=null; for(const k of after) if(!before.has(k)){ found = BADGES.find(x=>x.key===k); break; }
    if(found){ badgeSound(); setNewBadge({ key:found.key, label:found.label }); setState(s=>({...s, badgesUnlocked:[...after]})); }
    else if((state.badgesUnlocked||[]).length !== after.size){ setState(s=>({...s, badgesUnlocked:[...after]})); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streak, weeklyXP, finishedSections, state.studyHistory, state.restHistory, state.stats, state.xp]);

  // export/import per-user
  const exportProgress=()=>{ const payload={ state, jsOpen, ucOpen, uiVersion }; const a=document.createElement("a"); a.href="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(payload,null,2)); a.download=`mentor-${activeUser}.json`; a.click(); };
  const importProgress=(file)=>{ if(!file) return; const r=new FileReader(); r.onload=(ev)=>{ try{ const obj=JSON.parse(String(ev.target.result)); if(obj.state) setState(obj.state); if(obj.jsOpen) setJsOpen(obj.jsOpen); if(obj.ucOpen) setUcOpen(obj.ucOpen); if(obj.uiVersion) setUiVersion(obj.uiVersion);}catch{ alert("Invalid JSON"); } }; r.readAsText(file); };

  // peers leaderboard
  const peersSeed=[{id:"p1",name:"Hidup Jokowi",score:120},{id:"p2",name:"Rara",score:96},{id:"p3",name:"Budi",score:88},{id:"p4",name:"Aripin",score:75},{id:"p5",name:"Siti",score:110},{id:"p6",name:"Dewi",score:90},{id:"p7",name:"Agus",score:84},{id:"p8",name:"Yanto",score:79},{id:"p9",name:"Putri",score:95},{id:"me",name:activeUser,score:weeklyXP}];
  const [peers,setPeers]=useState(()=>{ try{return JSON.parse(localStorage.getItem(`${STORE_KEY}:peers`)||"null")||peersSeed;} catch{return peersSeed;} });
  useEffect(()=>{ setPeers(ps=>ps.map(p=>p.id==="me"?{...p,score:weeklyXP,name:activeUser}:p)); },[weeklyXP,activeUser]);
  useEffect(()=>{ localStorage.setItem(`${STORE_KEY}:peers`, JSON.stringify(peers)); },[peers,STORE_KEY]);
  const shufflePeers=()=>setPeers(ps=>ps.map(p=>p.id==="me"?p:{...p,score:Math.max(0, weeklyXP + (Math.floor(Math.random()*100)-50))}));
  const sortedPeers = useMemo(()=>[...peers].sort((a,b)=>b.score-a.score).slice(0,10),[peers]);

  return {
    // data / state
    state,setState, COURSE_SECTIONS, TOTAL_LECTURES,
    xpInLevel, levelNow, progress, weeklyXP, streak, xpMultiplier,
    jsOpen,setJsOpen, ucOpen,setUcOpen, uiVersion,setUiVersion,

    // handlers
    awardXP, incStat, addHistory, addHistoryOn,
    isJsDone, toggleJsLecture,
    userCourse, addSection, addLecture, deleteSection, isUcDone, toggleUcLecture, deleteUcLecture, onUcDragEnd,
    addMilestone, toggleMilestone, deleteMilestone,
    addCapstone, deleteCapstone, claimCapstone,
    exportProgress, importProgress,

    // quests & log
    quests, updateQuest, logStudy, logBreak,

    // badges
    newBadge, setNewBadge,

    // derived
    finishedSections,
    sortedPeers, shufflePeers,
  };
}
