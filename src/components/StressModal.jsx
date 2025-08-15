// src/components/StressModal.jsx
import React from "react";
import Modal from "./Modal.jsx";
import { DAY_MS, ymd } from "../constants/gameData.js";

function clamp(n,a,b){ return Math.min(b, Math.max(a,n)); }

export default function StressModal({ open, onClose, state, onLogBreak }) {
  const base = new Date(); base.setHours(0,0,0,0);
  const series = [];
  const dayShort = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];
  for (let i=6;i>=0;i--){
    const d = new Date(base.getTime()-i*DAY_MS);
    const k = ymd(d);
    series.push({
      key:k, label: dayShort[d.getDay()],
      mins: Number(state.studyHistory?.[k]||0),
      breaks: Number(state.restHistory?.[k]||0),
    });
  }
  const total  = series.reduce((a,b)=>a+b.mins,0);
  const avg    = Math.round(total/7);
  const long   = series.filter(d=>d.mins>120).length;
  const breaks = series.reduce((a,b)=>a+b.breaks,0);
  const active = series.filter(d=>d.mins>0).length;

  let stress = 35 + (avg-60)*0.4 + long*8 + active*2 - breaks*6;
  stress = clamp(Math.round(stress), 0, 100);
  const level = stress<35 ? "Rendah" : stress<65 ? "Sedang" : "Tinggi";
  const r=44, C=2*Math.PI*r, off=C*(stress/100);

  return (
    <Modal open={open} onClose={onClose} title="🧠 Kesehatan • Waktu Belajar" tone="bright">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 flex items-center justify-center">
          <svg width="120" height="120" className="-rotate-90">
            <circle cx="60" cy="60" r={r} stroke="#e5e7eb" strokeWidth="12" fill="none"/>
            <circle cx="60" cy="60" r={r} stroke="#10b981" strokeWidth="12" fill="none"
              strokeDasharray={C} strokeDashoffset={C-off} strokeLinecap="round"/>
          </svg>
          <div className="ml-4">
            <div className="text-2xl font-bold">{stress}%</div>
            <div className="text-sm">Tingkat stress: <b>{level}</b></div>
            <div className="text-xs text-neutral-500">Rata² {avg} mnt/hari • Break {breaks}x/7d</div>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold mb-2">Ringkasan 7 Hari</div>
          <ul className="text-sm space-y-1">
            <li>Total belajar: <b>{total} menit</b></li>
            <li>Hari aktif: <b>{active}/7</b></li>
            <li>Hari &gt;120m: <b>{long}</b></li>
            <li>Istirahat di-log: <b>{breaks}x</b></li>
          </ul>
          <button onClick={onLogBreak} className="mt-3 rounded-xl border px-3 py-1 text-sm hover:bg-neutral-50">
            + Log Istirahat 5 menit
          </button>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold mb-2">Saran</div>
          <ul className="text-sm list-disc pl-5 space-y-1">
            {stress>=65 && <li>Kurangi sesi panjang; pecah jadi blok 25–30 menit.</li>}
            <li>Minimal 2–3 break singkat tiap 90 menit.</li>
            <li>Target rata² 60–90 menit/hari untuk ritme stabil.</li>
            <li>Jauhkan device 5 menit setelah tiap sesi untuk pendinginan.</li>
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold mb-1">Durasi Harian</div>
        <div className="flex items-end gap-3">
          {series.map((d)=>(
            <div key={d.key} className="flex flex-col items-center w-10">
              <div className="w-6 rounded-md" title={`${d.label}: ${d.mins}m • break ${d.breaks}x`}
                style={{height: Math.max(6, Math.round((d.mins/180)*100))+"px",
                        background:"linear-gradient(#34d399, #10b981)"}}/>
              <div className="text-[10px] mt-1 text-neutral-700">{d.label}</div>
              <div className="text-[10px] text-neutral-500">{d.mins}m</div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
