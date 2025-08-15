// src/constants/gameData.js
export const DAY_MS = 86400000;
export const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export const todayKey = () => {
  const n = new Date(); n.setHours(0,0,0,0); return ymd(n);
};

// QUESTS (10) — no check-in
export const QUEST_POOL = [
  { id:"q1",  text:"Selesaikan 3 lecture kurikulum",           type:"js_done",         need:3,  xp:15 },
  { id:"q2",  text:"Tambah 1 lecture di kurikulum kustom",      type:"uc_add",          need:1,  xp:10 },
  { id:"q3",  text:"Tulis 5 Update Info",                       type:"tests_written",   need:5,  xp:15 },
  { id:"q4",  text:"Tuntaskan 3 tugas",                         type:"bugs_fixed",      need:3,  xp:10 },
  { id:"q5",  text:"Selesaikan 1 milestone",                     type:"milestone_done",  need:1,  xp:12 },
  { id:"q6",  text:"Claim 1 capstone",                           type:"cap_claim",       need:1,  xp:25 },
  { id:"q7",  text:"Log belajar 50 menit total",                 type:"log_study_min",   need:50, xp:12 },
  { id:"q8",  text:"Ambil 2 kali istirahat singkat",             type:"take_break",      need:2,  xp:6  },
  { id:"q9",  text:"Coba 1 materi/fitur baru",                   type:"frameworks_tried",need:1,  xp:8  },
  { id:"q10", text:"Ganti tema/tampilan sekali",                  type:"theme_switch",    need:1,  xp:5  },
];

export const genDailyQuests = () =>
  [...QUEST_POOL].sort(()=>Math.random()-0.5).slice(0,3).map(q=>({...q,progress:0,done:false}));

// BADGES (20) — sinkron untuk V1 & V2
export const BADGES = [
  { key:"streak5",    label:"Streak Novice",       hint:"Streak ≥ 5 hari",        check:(c)=>c.streak>=5 },
  { key:"streak10",   label:"Streak Pro",          hint:"Streak ≥ 10 hari",       check:(c)=>c.streak>=10 },
  { key:"streak20",   label:"Streak Legend",       hint:"Streak ≥ 20 hari",       check:(c)=>c.streak>=20 },

  { key:"weekly100",  label:"Weekly 100",          hint:"XP 7 hari ≥ 100",        check:(c)=>c.weeklyXP>=100 },
  { key:"weekly200",  label:"Weekly 200",          hint:"XP 7 hari ≥ 200",        check:(c)=>c.weeklyXP>=200 },
  { key:"weekly350",  label:"Weekly 350",          hint:"XP 7 hari ≥ 350",        check:(c)=>c.weeklyXP>=350 },

  { key:"total1k",    label:"XP Bronze",           hint:"Total XP ≥ 1.000",       check:(c)=>c.totalXP>=1000 },
  { key:"total5k",    label:"XP Silver",           hint:"Total XP ≥ 5.000",       check:(c)=>c.totalXP>=5000 },
  { key:"total10k",   label:"XP Gold",             hint:"Total XP ≥ 10.000",      check:(c)=>c.totalXP>=10000 },

  { key:"lect10",     label:"Lecture Hunter",      hint:"Selesai ≥ 10 lecture",   check:(c)=>c.lecturesDone>=10 },
  { key:"lect50",     label:"Lecture Grinder",     hint:"Selesai ≥ 50 lecture",   check:(c)=>c.lecturesDone>=50 },

  { key:"milestone3", label:"Milestone Sprinter",  hint:"Milestone selesai ≥ 3",  check:(c)=>c.milestonesDone>=3 },
  { key:"cap1",       label:"Capstone Starter",    hint:"Claim capstone ≥ 1",     check:(c)=>c.capstonesClaimed>=1 },
  { key:"cap3",       label:"Capstone Finisher",   hint:"Claim capstone ≥ 3",     check:(c)=>c.capstonesClaimed>=3 },

  { key:"section5",   label:"Section Finisher I",  hint:"Section selesai ≥ 5",    check:(c)=>c.finishedSections>=5 },
  { key:"section10",  label:"Section Finisher II", hint:"Section selesai ≥ 10",   check:(c)=>c.finishedSections>=10 },

  { key:"study300",   label:"Study 300m (7d)",     hint:"Belajar ≥ 300m/7d",      check:(c)=>c.study7d>=300 },
  { key:"study600",   label:"Study 600m (7d)",     hint:"Belajar ≥ 600m/7d",      check:(c)=>c.study7d>=600 },
  { key:"rest7",      label:"Mindful Rest",        hint:"Istirahat ≥ 7x/7d",      check:(c)=>c.breaks7d>=7 },
  { key:"consistent", label:"Consistent 5/7",      hint:"Aktif ≥ 5 hari/7d",      check:(c)=>c.activeDays7d>=5 },
];

// Bangun context buat cek badge
export function buildBadgeCtx({ state, streak, weeklyXP, finishedSections, extra }) {
  const now = new Date(); now.setHours(0,0,0,0);
  let study7d=0, breaks7d=0, activeDays7d=0;
  for (let i=0;i<7;i++){
    const k = ymd(new Date(now.getTime()-i*DAY_MS));
    const m = Number(state.studyHistory?.[k]||0);
    const b = Number(state.restHistory?.[k]||0);
    study7d += m;
    breaks7d += b;
    if ((state.history?.[k]||0) > 0 || m>0) activeDays7d++;
  }
  return {
    streak,
    weeklyXP,
    totalXP: state.xp,
    lecturesDone: (state.jsChecklist?.length||0)+(state.userCourseChecklist?.length||0),
    milestonesDone: (state.milestones||[]).filter(m=>m.done).length,
    capstonesClaimed: extra?.capstonesClaimed||0,
    finishedSections,
    study7d, breaks7d, activeDays7d,
    stats: state.stats||{},
  };
}
