// src/components/SpaceScene.jsx
import React from "react";

export default function SpaceScene(){
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <style>{`
        .space-bg { background: radial-gradient(1000px 500px at 20% 20%, #1f2937, #0b1021 60%, #050814 100%); }
        .star { position:absolute; width:2px; height:2px; background:#fff; opacity:.8; border-radius:50%; }
        .sun  { position:absolute; right:-10vw; top:-10vh; width:36vh; height:36vh; border-radius:50%;
                background: radial-gradient(circle at 30% 30%, #ffec8b, #ffb703 45%, #f59e0b 70%, transparent 72%);
                box-shadow: 0 0 80px 20px rgba(255,184,0,.25); }
        .planet { position:absolute; border-radius:50%; filter: drop-shadow(0 0 20px rgba(255,255,255,.08)); }
        .p1{ left:6vw;  top:18vh; width:18vh; height:18vh; background: radial-gradient(circle, #8ab4f8, #5a8bd6); }
        .p2{ left:18vw; top:40vh; width:12vh; height:12vh; background: radial-gradient(circle, #d1fae5, #10b981); }
        .p3{ left:30vw; top:10vh; width:10vh; height:10vh; background: radial-gradient(circle, #fde68a, #f59e0b); }
        .p4{ left:46vw; top:30vh; width:14vh; height:14vh; background: radial-gradient(circle, #fca5a5, #ef4444); }
        .p5{ left:60vw; top:12vh; width:11vh; height:11vh; background: radial-gradient(circle, #c4b5fd, #8b5cf6); }
        .p6{ left:68vw; top:46vh; width:16vh; height:16vh; background: radial-gradient(circle, #93c5fd, #3b82f6); }
        .p7{ left:12vw; top:60vh; width:13vh; height:13vh; background: radial-gradient(circle, #fbcfe8, #ec4899); }
        .rocket { position:absolute; left:8vw; bottom:8vh; width:22px; height:48px; border-radius:10px 10px 2px 2px;
                  background:#e5e7eb; transform: rotate(18deg); animation: fly 16s linear infinite; }
        .rocket::after{ content:""; position:absolute; left:7px; bottom:-12px; width:8px; height:14px; 
                        background: linear-gradient(#fb923c,#f59e0b); border-radius: 0 0 8px 8px; filter: blur(1px); }
        @keyframes fly {
          0%   { transform: translate(0,0) rotate(18deg); }
          50%  { transform: translate(40vw,-18vh) rotate(24deg); }
          100% { transform: translate(0,0) rotate(18deg); }
        }
      `}</style>
      <div className="space-bg absolute inset-0"/>
      <div className="sun"/>
      {[...Array(200)].map((_,i)=>(
        <div key={i} className="star"
          style={{ left:(Math.random()*100)+"vw", top:(Math.random()*100)+"vh", opacity:.5+Math.random()*0.5 }}/>
      ))}
      <div className="planet p1"/><div className="planet p2"/><div className="planet p3"/>
      <div className="planet p4"/><div className="planet p5"/><div className="planet p6"/><div className="planet p7"/>
      <div className="rocket"/>
    </div>
  );
}
