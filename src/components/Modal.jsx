// src/components/Modal.jsx
import React from "react";
import { motion as fmMotion, AnimatePresence } from "framer-motion";

const MotionDiv = fmMotion.div;

export default function Modal({ open, onClose, title, tone="auto", children }) {
  const bright = tone === "bright";
  return (
    <AnimatePresence>
      {open && (
        <MotionDiv className="fixed inset-0 z-[10000] grid place-items-center"
          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
          <MotionDiv
            initial={{scale:.9,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.95,opacity:0}}
            transition={{type:"spring",stiffness:120,damping:16}}
            className={
              "relative z-10 w-[min(92vw,760px)] rounded-2xl p-5 shadow-2xl border "+
              (bright ? "bg-white text-neutral-900 border-neutral-200" : "bg-white dark:bg-neutral-900 border-neutral-200/60 dark:border-neutral-800/60")
            }>
            {title && (
              <div className="text-lg font-semibold mb-3 inline-flex items-center gap-2">
                {title}
                {bright && <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,.25)]"/>}
              </div>
            )}
            <div>{children}</div>
            <div className="mt-4 text-right">
              <button onClick={onClose} className="rounded-xl px-3 py-2 border hover:bg-neutral-50">Tutup</button>
            </div>
          </MotionDiv>
        </MotionDiv>
      )}
    </AnimatePresence>
  );
}
