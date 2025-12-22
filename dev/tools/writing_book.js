// writing_book.js
// Ghost book: drop/place, then ghost may write or toss, gated by evidence and Shade behavior.

(function(){
  'use strict';
  if (window.__WritingBookReady) return; window.__WritingBookReady = true;

  const SCENE = ()=> window.scene || BABYLON.Engine?.LastCreatedScene;
  const CAMERA = ()=> SCENE()?.activeCamera;

  let BOOK_PLACED=false, BOOK_POS=null, BOOK_WRITTEN=false;
  let bookCooldown = 0;

  const WritingAudio = (function(){
    let writeClip=null, tossClip=null;
    function ensure(){
      const s=SCENE(); if (!s) return;
      const base = { loop:false, autoplay:false, spatialSound:true, refDistance:2, rolloffFactor:1.2, maxDistance:25 };
      writeClip = writeClip || new BABYLON.Sound('ghostWriting','./assets/audio/GhostWriting1.mp3', s, null, { ...base, volume:0.9 });
      tossClip  = tossClip  || new BABYLON.Sound('bookToss','./assets/audio/Toss.wav',        s, null, { ...base, volume:0.85 });
    }
    function at(pos, snd){ try{ ensure(); snd?.setPosition?.(pos); snd?.stop?.(); snd?.play?.(); }catch(_){ } }
    return { writeAt:(p)=>at(p,writeClip), tossAt:(p)=>at(p,tossClip) };
  })();

  function aimPointOnGround(maxDist=4){
    try{
      const s=SCENE(); const cam=CAMERA();
      const origin = cam?.position ?? new BABYLON.Vector3(0,1.8,0);
      const ray = cam?.getForwardRay?.(maxDist) ?? new BABYLON.Ray(origin, new BABYLON.Vector3(0,0,1), maxDist);
      const pick = s?.pickWithRay?.(ray, m => m?.isPickable !== false);
      if (pick?.hit) return pick.pickedPoint;
    }catch(_){}
    return CAMERA()?.position?.clone?.() || new BABYLON.Vector3(0,1.8,0);
  }

  function isShadeAndPlayerInRoom(){
    try{
      const isShade = ((ghost?.type||'').toLowerCase() === 'shade');
      const inRoom = typeof currentRoomName === 'function' && ghost?.roomName && currentRoomName() === ghost.roomName;
      return isShade && inRoom;
    }catch(_){ return false; }
  }
  function ghostHasWritingEvidence(){
    try { return typeof ghostHasEvidence==='function' ? !!ghostHasEvidence('writing') : true; } catch(_){ return true; }
  }

  window.dropWritingBook = function(){
    BOOK_PLACED = true;
    BOOK_WRITTEN = false;
    const p = aimPointOnGround(3.8);
    BOOK_POS = (p instanceof BABYLON.Vector3) ? p : new BABYLON.Vector3(p?.x||0, p?.y||0, p?.z||0);
    bookCooldown = 2;
    try{ toast?.('Book dropped'); }catch(_){}
  };

  (function loop(){
    const s=SCENE(); const eng=s?.getEngine?.()||BABYLON.Engine?.LastCreatedEngine;
    if (!s) { setTimeout(loop, 120); return; }
    let timer=0, nextCheck = 8 + Math.random()*14;
    s.onBeforeRenderObservable.add(()=>{
      const dt=((eng?.getDeltaTime?.()||16.7)/1000);
      timer += dt;
      if (bookCooldown>0) bookCooldown -= dt;
      if (!BOOK_PLACED || !BOOK_POS) return;
      if (timer < nextCheck || bookCooldown > 0) return;

      timer = 0; nextCheck = 8 + Math.random()*14;
      if (isShadeAndPlayerInRoom()) return;

      try{
        const gpos = ghost?.position || BABYLON.Vector3.Zero();
        const near = BABYLON.Vector3.Distance(BOOK_POS, gpos) < 3.2;
        if (!near) return;

        if (ghostHasWritingEvidence()){
          if (Math.random() < 0.5){ WritingAudio.writeAt(BOOK_POS); BOOK_WRITTEN=true; bookCooldown=10; try{ toast?.('Ghost wrote in book!'); }catch(_){ } }
          else { WritingAudio.tossAt(BOOK_POS); BOOK_PLACED=false; bookCooldown=5; try{ toast?.('The book was tossed!'); }catch(_){} }
        } else {
          WritingAudio.tossAt(BOOK_POS); BOOK_PLACED=false; bookCooldown=5; try{ toast?.('The book was tossed!'); }catch(_){}
        }
      }catch(_){}
    });
  })();
})();

/* ---- Storage registration (Writing Book item) ---- */
(function(){
  if (!window.registerItem) return;
  registerItem({
    id: "writing_book",
    name: "Writing Book",
    icon: "./assets/icons/writing_book.png",
    defaultCharges: 1,
    onEquip(){ try{ toast?.("Place the book where activity is high."); }catch(_){ } }
  });

  // Optional: X to drop the book when equipped
  if (!window.__WB_keybound){
    window.__WB_keybound = true;
    window.addEventListener("keydown", (e)=>{
      if ((e.key === "x" || e.key === "X") && window.inventory){
        const slot = window.activeItemSlot || 1;
        if (window.inventory.slots?.[slot] === "Writing Book"){
          try{ window.dropWritingBook?.(); }catch(_){}
          // decrement single charge on belt
          try{
            const ch = window.inventory.slotCharges?.[slot];
            if (isFinite(ch)) window.inventory.slotCharges[slot] = Math.max(0, (ch||1) - 1);
            window.rebuildBelt?.();
          }catch(_){}
        }
      }
    });
  }
})();
