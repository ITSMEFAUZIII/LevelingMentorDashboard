// src/MentorApp.jsx
import React, { useState } from "react";
import { ACTIVE_USER, loadUsers, saveUsers, sha256 } from "./auth/localAuth.js";
import DashboardV1Classic from "./dashboard/DashboardV1Classic.jsx";
import DashboardV2Growth from "./dashboard/DashboardV2Growth.jsx";

const UI_KEY = "mentor-dashboard-pro-v9-ui";

function LoginScreen({ onLogin }) {
  const [mode,setMode]=useState("login");
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [err,setErr]=useState("");

  const handle=async()=>{
    setErr("");
    if(!u.trim()||!p) return setErr("Username & password wajib.");
    const users = loadUsers();
    const pass  = await sha256(p);
    if(mode==="register"){
      if(users[u]) return setErr("Username sudah dipakai.");
      users[u] = { pass, createdAt: Date.now() };
      saveUsers(users);
      localStorage.setItem(ACTIVE_USER, u);
      onLogin(u);
    }else{
      if(!users[u] || users[u].pass!==pass) return setErr("Username/password salah.");
      localStorage.setItem(ACTIVE_USER, u);
      onLogin(u);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{background:"linear-gradient(#ecfeff,#f0fdf4)"}}>
      <div className="relative w-[min(92vw,460px)] rounded-3xl bg-white p-6 shadow-xl border border-emerald-200">
        <div className="text-2xl font-bold text-emerald-700 mb-2">MentorDashboard</div>
        <div className="text-sm text-neutral-600 mb-4">Masuk atau daftar agar progresmu tersimpan.</div>

        <div className="flex gap-2 mb-4">
          <button onClick={()=>setMode("login")} className={"px-3 py-1 rounded-full border "+(mode==="login"?"bg-emerald-600 text-white border-emerald-600":"border-neutral-200")}>Login</button>
          <button onClick={()=>setMode("register")} className={"px-3 py-1 rounded-full border "+(mode==="register"?"bg-emerald-600 text-white border-emerald-600":"border-neutral-200")}>Register</button>
        </div>

        <div className="space-y-3">
          <input value={u} onChange={e=>setU(e.target.value)} placeholder="Username" className="w-full rounded-xl border px-3 py-2"/>
          <input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="Password" className="w-full rounded-xl border px-3 py-2"/>
          {err && <div className="text-sm text-rose-600">{err}</div>}
          <button onClick={handle} className="w-full rounded-xl bg-emerald-600 text-white px-4 py-2">{mode==="login"?"Masuk":"Daftar"}</button>
        </div>

        <div className="mt-6 text-xs text-neutral-500">
          *Autentikasi lokal (offline). Untuk sinkron lintas-device: Export/Import JSON.
        </div>
      </div>
    </div>
  );
}

export default function MentorApp(){
  const [active,setActive]=useState(()=>localStorage.getItem(ACTIVE_USER));
  const [ui,setUi]=useState(()=>localStorage.getItem(UI_KEY) || "v2");
  if(!active) return <LoginScreen onLogin={(u)=>setActive(u)}/>;

  const logout=()=>{ localStorage.removeItem(ACTIVE_USER); location.reload(); };
  const toggleUI=()=>{ const nv=ui==="v1"?"v2":"v1"; setUi(nv); localStorage.setItem(UI_KEY, nv); };

  return (
    <div>
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[10001]">
        <button onClick={toggleUI} className="rounded-full bg-white/90 border px-3 py-1 text-xs shadow">
          Switch UI: {ui==="v2"?"Growth (v2)":"Space (v1)"}
        </button>
        <button onClick={logout} className="ml-2 rounded-full bg-white/90 border px-3 py-1 text-xs shadow">
          Logout ({active})
        </button>
      </div>
      {ui==="v1"
        ? <DashboardV1Classic activeUser={active}/>
        : <DashboardV2Growth activeUser={active}/>}
    </div>
  );
}
