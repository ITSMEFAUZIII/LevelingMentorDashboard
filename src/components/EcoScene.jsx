// src/components/EcoScene.jsx
import React from "react";

export default function EcoScene(){
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <style>{`
        .eco-sky { background: linear-gradient(180deg,#ecfeff 0%,#f0fdf4 45%,#ffffff 100%); }
        .eco-hill{ position:absolute; bottom:-12vh; width:60vw; height:40vh; border-radius:50%; filter:blur(2px); }
        .eco-hill.a{ left:-10vw; background: radial-gradient(circle at 50% 40%, #bdf7c1, #68d391);}
        .eco-hill.b{ right:-15vw; background: radial-gradient(circle at 50% 40%, #a7f3d0, #34d399);}
        .eco-water{ position:absolute; bottom:0; left:10vw; width:80vw; height:22vh;
          background: radial-gradient(60% 100% at 50% 100%, #a5f3fc 0%, #67e8f9 40%, transparent 60%);}
        .eco-grass{ position:absolute; bottom:0; left:0; right:0; height:12vh;
          background:
            repeating-linear-gradient(90deg, rgba(16,185,129,.3) 0 3px, transparent 3px 8px),
            linear-gradient(180deg,#bbf7d0,#86efac);
        }
        .tree{ position:absolute; width:0;height:0; border-left:18px solid transparent; border-right:18px solid transparent; border-bottom:42px solid #22c55e;}
        .tree::after{ content:""; position:absolute; left:-3px; bottom:-52px; width:6px;height:12px; background:#7c3f00; border-radius:2px;}
        .person{ position:absolute; width:8px; height:18px; background:#16a34a; left:50%; transform:translateX(-50%); bottom:12vh; border-radius:3px 3px 2px 2px;}
        .person::before{ content:""; position:absolute; width:10px;height:10px; border-radius:50%; background:#065f46; top:-10px; left:-1px;}
      `}</style>
      <div className="eco-sky absolute inset-0"/>
      <div className="eco-hill a"/><div className="eco-hill b"/>
      <div className="eco-water"/><div className="eco-grass"/>
      <div className="tree" style={{left:"12vw",bottom:"14vh"}}/>
      <div className="tree" style={{left:"18vw",bottom:"12vh"}}/>
      <div className="tree" style={{left:"72vw",bottom:"13vh"}}/>
      <div className="tree" style={{left:"78vw",bottom:"11vh"}}/>
      <div className="person"/>
    </div>
  );
}
