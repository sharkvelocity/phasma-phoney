/**
 * logger.js — Simulation logger for PhasmaPhoney
 * Records player, camera, and ghost events.
 * Save with Alt+S.
 */
(function(){
    if(window.__PP_SIM_LOGGER__) return;
    window.__PP_SIM_LOGGER__ = true;

    window.SimLog = {
        events: [],
        record: function(type, data){ 
            this.events.push({ time: performance.now(), type, data }); 
        },
        exportJSON: function(){ return JSON.stringify(this.events,null,2); },
        saveToFile: function(filename="sim_log.json"){
            try{
                const blob = new Blob([this.exportJSON()], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                a.click();
                console.log("[SimLog] Saved", this.events.length, "events");
            }catch(e){ console.warn("[SimLog] Save failed", e); }
        }
    };

    // ---------- Hooks ----------
    const recordPlayer = ()=> {
        const p = window.PP?.rig?.body;
        if(p) SimLog.record("playerTick", { pos: p.position.clone(), forward: PP.state.controls.forward });
    };
    const recordCamera = ()=> {
        if(window.camera) SimLog.record("cameraTick", { pos: window.camera.position.clone(), rot: window.camera.rotation.clone() });
    };

    const trySceneHook = setInterval(()=>{
        if(window.SCENE){
            clearInterval(trySceneHook);
            window.SCENE.onBeforeRenderObservable.add(()=>{
                recordPlayer();
                recordCamera();
            });
        }
    }, 200);

    // Example: ghost attacks
    if(window.GhostSystem){
        const origAttack = GhostSystem.attack;
        GhostSystem.attack = function(target){
            SimLog.record("ghostAttack", { ghost: this.type, target: target?.name });
            return origAttack.call(this,target);
        };
    }

    // ---------- Keyboard Shortcut: Alt+S ----------
    window.addEventListener("keydown",(e)=>{
        if(e.altKey && e.code==="KeyS"){
            e.preventDefault();
            SimLog.saveToFile();
        }
    });

    console.log("[SimLog] Initialized — Alt+S to save log");
})();
