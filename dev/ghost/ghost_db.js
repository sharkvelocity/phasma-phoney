// ghost_db.js
// Simple ghost database used by logic/evidence systems.

window.GHOST_DB = [
  { name:'Spirit',      ev:['emf','writing','spiritbox'], speed:1.2 },
  { name:'Wraith',      ev:['emf','dots','spiritbox'],    speed:1.4, saltImmune:true },
  { name:'Phantom',     ev:['spiritbox','dots','uv'],     speed:1.2 },
  { name:'Poltergeist', ev:['spiritbox','uv','writing'],  speed:1.1 },
  { name:'Banshee',     ev:['dots','uv','temp'],          speed:1.3 },
  { name:'Jinn',        ev:['emf','uv','temp'],           speed:1.4 },
  { name:'Mare',        ev:['spiritbox','writing','temp'],speed:1.2 },
  { name:'Revenant',    ev:['writing','uv','temp'],       speed:1.0 },
  { name:'Shade',       ev:['emf','writing','temp'],      speed:1.0, shy:true },
  { name:'Demon',       ev:['uv','writing','temp'],       speed:1.5 },
  { name:'Yurei',       ev:['dots','writing','temp'],     speed:1.2 },
  { name:'Oni',         ev:['emf','dots','temp'],         speed:1.5 },
  { name:'Goryo',       ev:['emf','dots','uv'],           speed:1.35, dotsCameraOnly:true },
  { name:'Myling',      ev:['emf','writing','uv'],        speed:1.1 },
  { name:'Onryo',       ev:['spiritbox','uv','temp'],     speed:1.2 },
  { name:'Obake',       ev:['emf','uv','dots'],           speed:1.35, ficklePrints:true }
];

window.ghostHasEvidence = function ghostHasEvidence(key){
  try{
    const t = (window.ghost?.type||'').toLowerCase();
    const rec = (Array.isArray(window.GHOST_DB) ? window.GHOST_DB : []).find(g => (g.name||'').toLowerCase()===t);
    return !!(rec && Array.isArray(rec.ev) && rec.ev.includes(key));
  }catch(_){ return false; }
};
