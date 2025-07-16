<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Phasma‑Phoney</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html, body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      height: 100%;
      width: 100%;
      background-color: #000;
      font-family: monospace;
    }
    body {
      background: url('Van_N.png') no-repeat center center fixed;
      background-size: cover;
      transition: background 0.8s ease-in-out;
    }

    /* === HUD (Sanity / Room / Items) === */
    #hud {
      position: fixed;
      bottom: 20px;
      left: 20px;
      color: #0ff;
      font-size: 15px;
      line-height: 1.4em;
      text-shadow: 0 0 4px #0ff;
      background: rgba(0,0,0,0.3);
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid rgba(0,255,255,0.4);
      z-index: 9999;
    }

    #flash-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: white;
      opacity: 0;
      pointer-events: none;
      z-index: 9999;
    }
    #orb-canvas, #camera-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 0;
    }
    #camera-overlay {
      background: rgba(0,255,0,0.08);
      mix-blend-mode: screen;
      display: none;
      z-index: 5;
      animation: monitorGlitch 2s infinite alternate;
    }
    @keyframes monitorGlitch {
      0% {opacity:0.1;transform:skew(0deg);}
      50% {opacity:0.3;transform:skew(-1deg);}
      100% {opacity:0.15;transform:skew(0.5deg);}
    }

    footer {
      position: fixed;
      bottom: 6px;
      right: 10px;
      color: rgba(255,255,255,0.3);
      font-size: 0.8em;
      font-family: sans-serif;
      z-index: 9999;
    }

    button {
      background: #111;
      color: #0ff;
      border: 1px solid #0ff;
      padding: 6px 12px;
      margin: 3px;
      cursor: pointer;
      font-family: monospace;
      transition: all 0.2s ease-in-out;
    }
    button:hover {
      background: #0ff;
      color: #000;
    }

    /* === Game UI === */
    #game-ui {
      display: none;
      position: fixed;
      top: 5%;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      max-width: 900px;
      height: 80%;
      z-index: 1500;
      pointer-events: none;
    }
    #game-log {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: calc(100% - 70px);
      background-color: rgba(0, 0, 0, 0.45);
      color: #0ff;
      padding: 18px;
      overflow-y: auto;
      border: 1px solid rgba(0,255,255,0.3);
      pointer-events: auto;
      font-size: 15px;
    }
    #game-options {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      background-color: rgba(0, 0, 0, 0.55);
      padding: 8px;
      border-top: 1px solid rgba(0,255,255,0.3);
      pointer-events: auto;
      text-align: center;
    }

    /* Weather Layers */
    #fog-layer, #rain-layer, #bloodmoon-layer {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 1;
      display: none;
    }
    #fog-layer { background: url('fog.png') repeat; opacity: 0.4; animation: fogMove 60s linear infinite; }
    #rain-layer { background: url('rain.png') repeat; opacity: 0.5; animation: rainMove 2s linear infinite; }
    #bloodmoon-layer { background: rgba(255,0,0,0.2); }
    @keyframes fogMove { from{background-position:0 0;} to{background-position:1000px 0;} }
    @keyframes rainMove { from{background-position:0 0;} to{background-position:0 1000px;} }

    /* === VAN SWAP PANEL === */
    #van-swap-screen {
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 500px;
      background-color: rgba(0,0,0,0.85);
      color: #0ff;
      padding: 25px;
      border: 2px solid #0ff;
      border-radius: 8px;
      font-family: monospace;
      z-index: 3000;
    }
    #van-swap-screen h2 {
      text-align: center;
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 18px;
      text-shadow: 0 0 6px #0ff;
    }
    #van-swap-container {
      display: flex;
      justify-content: space-between;
    }
    #van-swap-left, #van-swap-right {
      width: 45%;
      min-height: 200px;
      border: 1px solid rgba(0,255,255,0.3);
      padding: 8px;
    }
    #van-swap-left div, #van-swap-right div {
      padding: 4px 8px;
      margin-bottom: 4px;
      border: 1px solid rgba(0,255,255,0.3);
      background: rgba(0,255,255,0.05);
      cursor: pointer;
      transition: background 0.2s;
    }
    #van-swap-left div:hover, #van-swap-right div:hover {
      background: rgba(0,255,255,0.25);
    }

    /* === SALT HUD INFO === */
    #salt-hud {
      position: fixed;
      bottom: 20px;
      right: 20px;
      color: #0ff;
      font-size: 13px;
      text-shadow: 0 0 4px #0ff;
      background: rgba(0,0,0,0.3);
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid rgba(0,255,255,0.4);
      z-index: 9999;
    }
  </style>
</head>
<body>
  <div id="flash-overlay"></div>
  <canvas id="orb-canvas"></canvas>
  <div id="camera-overlay"></div>
  <div id="fog-layer"></div>
  <div id="rain-layer"></div>
  <div id="bloodmoon-layer"></div>

  <div id="hud">
    Sanity: <span id="hud-sanity">100%</span><br>
    Room: <span id="hud-room">Van</span><br>
    Items: <span id="hud-items">None</span>
  </div>

  <div id="salt-hud">Salt: None</div>
  <footer>Shark-Blades — Inspired by Phasmophobia.</footer>

  <!-- VAN SWAP SCREEN -->
  <div id="van-swap-screen">
    <h2>Van Inventory Swap</h2>
    <div id="van-swap-container">
      <div id="van-swap-left"><strong>Van:</strong><div id="van-swap-van"></div></div>
      <div id="van-swap-right"><strong>Holding:</strong><div id="van-swap-player"></div></div>
    </div>
    <div style="text-align:center;margin-top:15px;">
      <button id="van-swap-confirm">Confirm</button>
      <button id="van-swap-cancel">Cancel</button>
    </div>
  </div>

  <!-- GAME UI -->
  <div id="game-ui">
    <div id="game-log"></div>
    <div id="game-options"></div>
  </div>

<script>
/* ==============================
   === GAME STATE & DOM HOOKS ===
============================== */
const hudSanity=document.getElementById("hud-sanity");
const hudRoom=document.getElementById("hud-room");
const hudItems=document.getElementById("hud-items");
const saltHud=document.getElementById("salt-hud");
const gameLog=document.getElementById('game-log');
const gameOptions=document.getElementById('game-options');
const gameUI=document.getElementById('game-ui');
const cameraOverlay=document.getElementById('camera-overlay');
const fogLayer=document.getElementById('fog-layer');
const rainLayer=document.getElementById('rain-layer');
const bloodmoonLayer=document.getElementById('bloodmoon-layer');
const vanSwapScreen=document.getElementById('van-swap-screen');
const vanSwapVan=document.getElementById('van-swap-van');
const vanSwapPlayer=document.getElementById('van-swap-player');
const vanSwapConfirm=document.getElementById('van-swap-confirm');
const vanSwapCancel=document.getElementById('van-swap-cancel');

const game={
  inventory:[],
  vanStock:{},
  playerRoom:"Van",
  ghostRoom:null,
  currentGhost:null,
  mimicForm:null,
  mimicShift:0,
  sanity:100,
  turn:0,
  foundEvidence:[],
  started:false,
  droppedItems:{},
  activeHunt:false,
  crucifixUsed:false,
  smudgeUsed:false,
  huntCooldown:0,
  weather:"Clear",
  cameraPlaced:{},
  cameraRoom:null,
  saltPlaced:{},
  saltDisturbed:{}
};

const rooms = ["Van","Living Room","Kitchen","Bathroom","Bedroom","Garage","Basement"];
const roomVisuals = {
  "Van":"Van_N.png",
  "Living Room":"LivingRoom_N.png",
  "Kitchen":"Kitchen_N.png",
  "Bathroom":"Bathroom_N.png",
  "Bedroom":"Bedroom_N.png",
  "Garage":"Garage_N.png",
  "Basement":"Basement_N.png"
};

function updateHUD(){
  hudSanity.textContent=game.sanity+"%";
  hudRoom.textContent=game.playerRoom;
  hudItems.textContent=game.inventory.length?game.inventory.join(", "):"None";
  const saltState = game.saltPlaced[game.playerRoom]
    ? (game.saltDisturbed[game.playerRoom]?"Disturbed":"Placed")
    : "None";
  saltHud.textContent="Salt: "+saltState;
}

function log(msg){
  const line=document.createElement('div');
  line.textContent=msg;
  line.style.marginBottom='5px';
  gameLog.appendChild(line);
  gameLog.scrollTop=gameLog.scrollHeight;
}
/* ==============================
   === MAP VISUALS & WEATHER ===
============================== */
function updateMapVisual(){
  const bg=roomVisuals[game.playerRoom]||"Van_N.png";
  document.body.style.background=`url('${bg}') no-repeat center center fixed`;
  document.body.style.backgroundSize="cover";
}

const weathers=["Clear","Rain","Bloodmoon","Fog"];
function applyWeather(){
  fogLayer.style.display="none";
  rainLayer.style.display="none";
  bloodmoonLayer.style.display="none";
  if(game.weather==="Fog") fogLayer.style.display="block";
  else if(game.weather==="Rain") rainLayer.style.display="block";
  else if(game.weather==="Bloodmoon") bloodmoonLayer.style.display="block";
}
function chooseWeather(){
  game.weather=weathers[Math.floor(Math.random()*weathers.length)];
  applyWeather();
  log("The weather's "+game.weather.toLowerCase()+" today.");
}

/* ==============================
   === GHOST PROFILES & ROOMS ===
============================== */
const ghostProfiles=[
  {name:"Spirit",evidence:["EMF","Spirit Box","Ghost Writing"]},
  {name:"Wraith",evidence:["EMF","Spirit Box","D.O.T.S"]},
  {name:"Phantom",evidence:["Spirit Box","Fingerprints","D.O.T.S"]},
  {name:"Poltergeist",evidence:["Spirit Box","Fingerprints","Ghost Writing"]},
  {name:"Banshee",evidence:["Fingerprints","Ghost Orb","D.O.T.S"]},
  {name:"Jinn",evidence:["EMF","Fingerprints","Freezing"]},
  {name:"Mare",evidence:["Spirit Box","Ghost Orb","Ghost Writing"]},
  {name:"Revenant",evidence:["Ghost Orb","Ghost Writing","Freezing"]},
  {name:"Shade",evidence:["EMF","Ghost Writing","Freezing"]},
  {name:"Demon",evidence:["Fingerprints","Ghost Writing","Freezing"]},
  {name:"Yurei",evidence:["Ghost Orb","Freezing","D.O.T.S"]},
  {name:"Oni",evidence:["EMF","Freezing","D.O.T.S"]},
  {name:"Yokai",evidence:["Spirit Box","Ghost Orb","D.O.T.S"]},
  {name:"Hantu",evidence:["Fingerprints","Ghost Orb","Freezing"]},
  {name:"Goryo",evidence:["EMF","Fingerprints","D.O.T.S"]},
  {name:"Myling",evidence:["EMF","Fingerprints","Ghost Writing"]},
  {name:"Onryo",evidence:["Spirit Box","Ghost Orb","Freezing"]},
  {name:"The Twins",evidence:["EMF","Spirit Box","Freezing"]},
  {name:"Raiju",evidence:["EMF","Ghost Orb","D.O.T.S"]},
  {name:"Obake",evidence:["EMF","Fingerprints","Ghost Orb"]},
  {name:"The Mimic",evidence:["Spirit Box","Fingerprints","Freezing"]},
  {name:"Moroi",evidence:["Spirit Box","Ghost Writing","Freezing"]},
  {name:"Deogen",evidence:["Spirit Box","Ghost Writing","D.O.T.S"]},
  {name:"Thaye",evidence:["Ghost Orb","Ghost Writing","D.O.T.S"]},
  {name:"Succubus",evidence:["Spirit Box","Ghost Writing","D.O.T.S"]}
];

/* ==============================
   === START INVESTIGATION ===
============================== */
function startInvestigation(){
  game.currentGhost=ghostProfiles[Math.floor(Math.random()*ghostProfiles.length)];
  game.ghostRoom=rooms[Math.floor(Math.random()*(rooms.length-1))+1];
  game.turn=1;
  game.foundEvidence=[];
  game.mimicForm=null;
  game.mimicShift=3+Math.floor(Math.random()*4);
  chooseWeather();
  updateMapVisual();
  log("This is it... the investigation starts.");
  updateHUD();
  renderActionButtons();
}

/* ==============================
   === ACTION BUTTONS ===
============================== */
function renderActionButtons(){
  gameOptions.innerHTML="";
  [
    {label:"Move",handler:openMoveMenu},
    {label:"Use Item",handler:openItemMenu},
    {label:"Notebook",handler:openNotebook},
    {label:"Drop/Pick Item",handler:openDropMenu},
    {label:"Van Options",handler:openVanMenu},
    {label:"Wait",handler:endTurn}
  ].forEach(b=>{
    const btn=document.createElement("button");
    btn.textContent=b.label;
    btn.onclick=b.handler;
    gameOptions.appendChild(btn);
  });
}

/* ==============================
   === MOVE MENU ===
============================== */
function openMoveMenu(){
  gameOptions.innerHTML="<p>Select a room to move to:</p>";
  rooms.forEach(r=>{
    const btn=document.createElement("button");
    btn.textContent=r;
    btn.onclick=()=>{
      if(r===game.playerRoom){log("Already in "+r+".");return;}
      game.playerRoom=r;
      updateMapVisual();
      cameraOverlay.style.display="none";
      log("Moved to "+r+".");
      endTurn(); // moving counts as a turn
    };
    gameOptions.appendChild(btn);
  });
  const back=document.createElement("button");
  back.textContent="Cancel";
  back.onclick=renderActionButtons;
  gameOptions.appendChild(back);
}

/* ==============================
   === ITEM USAGE & SALT ===
============================== */
function openItemMenu(){
  gameOptions.innerHTML="<p>Select an item to use:</p>";
  game.inventory.forEach(i=>{
    if(i!=="Notebook" && i!=="Lighter"){
      const btn=document.createElement("button");
      btn.textContent=i;
      btn.onclick=()=>{useItem(i);};
      gameOptions.appendChild(btn);
    }
  });
  const back=document.createElement("button");
  back.textContent="Cancel";
  back.onclick=renderActionButtons;
  gameOptions.appendChild(back);
}

function useItem(item){
  const evMap={
    "EMF":"EMF","Spirit Box":"Spirit Box","Camera":"Ghost Orb",
    "UV Light":"Fingerprints","Thermometer":"Freezing",
    "D.O.T.S":"D.O.T.S","Book":"Ghost Writing"
  };
  const ev=evMap[item];
  const inGhostRoom=game.playerRoom===game.ghostRoom;
  const isMimic=game.currentGhost.name==="The Mimic";
  const evidenceList=(isMimic&&game.mimicForm)?game.mimicForm.evidence:game.currentGhost.evidence;
  const chance=0.5+Math.random()*0.35;

  if(item==="Camera"){
    game.cameraPlaced[game.playerRoom]=true;
    game.cameraRoom=game.playerRoom;
    log("Camera placed in "+game.playerRoom+".");
    if((game.foundEvidence.includes("Ghost Orb")|| (isMimic&&inGhostRoom)) && inGhostRoom){
      cameraOverlay.style.display="block";
      log("Camera captures faint orbs on screen.");
    }
    endTurn();return;
  }

  if(item==="Salt"){
    if(!game.saltPlaced[game.playerRoom]){
      game.saltPlaced[game.playerRoom]=true;
      game.saltDisturbed[game.playerRoom]=false;
      log("I sprinkled salt carefully on the ground here.");
      updateHUD();
    } else log("Salt is already placed here.");
    endTurn();return;
  }

  if(!inGhostRoom){
    log("No signs... wrong room maybe.");
    endTurn();return;
  }

  if(evidenceList.includes(ev)){
    if(Math.random()<=chance){
      if(!game.foundEvidence.includes(ev)){
        game.foundEvidence.push(ev);
        log("Evidence confirmed: "+ev);
        if(ev==="Ghost Orb") cameraOverlay.style.display="block";
      } else log("Same reading as before.");
    } else log("The reading flickers... nothing solid yet.");
  } else log("No response from this tool.");
  updateHUD();
  endTurn();
}

/* ==============================
   === NOTEBOOK ===
============================== */
function openNotebook(){
  gameOptions.innerHTML="<p>Notebook:</p>";
  const allEv=["EMF","Spirit Box","Fingerprints","Ghost Orb","Ghost Writing","Freezing","D.O.T.S"];
  allEv.forEach(e=>{
    const btn=document.createElement("button");
    btn.textContent=(game.foundEvidence.includes(e)?"✓ ":"")+e;
    btn.onclick=()=>{
      if(game.foundEvidence.includes(e)){
        game.foundEvidence=game.foundEvidence.filter(x=>x!==e);
        log("Crossed out "+e+" in notebook.");
      } else {
        game.foundEvidence.push(e);
        log("Marked "+e+" in notebook.");
      }
      updateHUD();
      openNotebook();
    };
    gameOptions.appendChild(btn);
  });

  const ghostList=document.createElement("div");
  ghostList.style.marginTop="10px";
  const possible=ghostProfiles.filter(g=>
    game.foundEvidence.every(ev=>g.evidence.includes(ev))
  );
  ghostList.innerHTML="<strong>Possible Ghosts:</strong><br>"+(possible.length?possible.map(g=>g.name).join(", "):"None");
  gameOptions.appendChild(document.createElement("hr"));
  gameOptions.appendChild(ghostList);

  const cancel=document.createElement("button");
  cancel.textContent="Cancel";
  cancel.onclick=renderActionButtons;
  gameOptions.appendChild(cancel);
}
/* ==============================
   === DROP / PICK ITEMS ===
============================== */
function openDropMenu(){
  gameOptions.innerHTML="<p>Drop or pick items:</p>";
  const room=game.playerRoom;
  if(!game.droppedItems[room]) game.droppedItems[room]=[];

  game.inventory.filter(i=>!["Notebook","Lighter"].includes(i)).forEach(i=>{
    const btn=document.createElement("button");
    btn.textContent="Drop "+i;
    btn.onclick=()=>{
      game.droppedItems[room].push(i);
      game.inventory=game.inventory.filter(x=>x!==i);
      log("Dropped "+i+" in "+room+".");
      updateHUD();
      renderActionButtons();
    };
    gameOptions.appendChild(btn);
  });

  if(game.droppedItems[room].length){
    gameOptions.appendChild(document.createElement("hr"));
    game.droppedItems[room].forEach(i=>{
      const btn=document.createElement("button");
      btn.textContent="Pick "+i;
      btn.onclick=()=>{
        if(game.inventory.length>=5){log("Can't hold more...");return;}
        game.inventory.push(i);
        game.droppedItems[room]=game.droppedItems[room].filter(x=>x!==i);
        log("Picked up "+i+".");
        updateHUD();
        renderActionButtons();
      };
      gameOptions.appendChild(btn);
    });
  }

  const cancel=document.createElement("button");
  cancel.textContent="Cancel";
  cancel.onclick=renderActionButtons;
  gameOptions.appendChild(cancel);
}

/* ==============================
   === VAN MENU (CLICK + DRAG) ===
============================== */
function openVanMenu(){
  if(game.playerRoom!=="Van"){
    log("I need to be in the van for this.");
    renderActionButtons();
    return;
  }
  gameOptions.innerHTML="<p>Van Options:</p>";

  const camBtn=document.createElement("button");
  camBtn.textContent="View Camera Monitor";
  camBtn.onclick=()=>{
    if(game.cameraRoom && game.cameraPlaced[game.cameraRoom]){
      document.body.style.background=`url('${roomVisuals[game.cameraRoom]}') no-repeat center center fixed`;
      document.body.style.backgroundSize="cover";
      cameraOverlay.style.display="block";
      log("I stare at the monitor, watching "+game.cameraRoom+".");
      endTurn(true); // viewing counts as a turn
    } else log("No active cameras connected.");
  };
  gameOptions.appendChild(camBtn);

  const swapBtn=document.createElement("button");
  swapBtn.textContent="Swap Items";
  swapBtn.onclick=()=>{
    gameOptions.innerHTML="<p>Swap items:</p>";
    for(let tool in game.vanStock){
      const take=document.createElement("button");
      take.textContent="Take "+tool+" ("+game.vanStock[tool]+")";
      take.onclick=()=>{
        if(game.inventory.length>=5){log("I can't carry more.");return;}
        game.inventory.push(tool);
        game.vanStock[tool]--;
        if(game.vanStock[tool]<=0) delete game.vanStock[tool];
        log("Took "+tool+" from the van.");
        updateHUD();
        openVanMenu();
      };
      gameOptions.appendChild(take);
    }
    game.inventory.filter(i=>!["Notebook","Lighter"].includes(i)).forEach(i=>{
      const ret=document.createElement("button");
      ret.textContent="Return "+i;
      ret.onclick=()=>{
        game.inventory=game.inventory.filter(x=>x!==i);
        game.vanStock[i]=(game.vanStock[i]||0)+1;
        log("Returned "+i+" to the van.");
        updateHUD();
        openVanMenu();
      };
      gameOptions.appendChild(ret);
    });
    const back=document.createElement("button");
    back.textContent="Back";
    back.onclick=openVanMenu;
    gameOptions.appendChild(back);
  };
  gameOptions.appendChild(swapBtn);

  const cancel=document.createElement("button");
  cancel.textContent="Cancel";
  cancel.onclick=renderActionButtons;
  gameOptions.appendChild(cancel);
}

/* ==============================
   === HUD UPDATE ===
============================== */
function updateHUD(){
  const hudSanity=document.querySelector("#hud-sanity");
  const hudRoom=document.querySelector("#hud-room");
  const hudItems=document.querySelector("#hud-items");
  const heldItems=game.inventory.length?game.inventory.join(", "):"None";

  hudSanity.textContent="Sanity: "+game.sanity+"%";
  hudRoom.textContent="Room: "+game.playerRoom;
  hudItems.textContent="Items: "+heldItems;

  // Salt HUD
  const hudSalt=document.querySelector("#hud-salt");
  const saltInfo = [];
  for(let room in game.saltPlaced){
    if(game.saltPlaced[room]){
      saltInfo.push(`${room}: ${game.saltDisturbed[room]?"Disturbed":"Placed"}`);
    }
  }
  hudSalt.textContent=saltInfo.length?"Salt: "+saltInfo.join(" | "):"Salt: None";
}

/* ==============================
   === TURN / SANITY LOGIC ===
============================== */
function endTurn(isVanAction=false){
  if(!isVanAction && game.playerRoom!=="Van"){
    game.turn++;
    if(game.playerRoom!==game.ghostRoom){
      if(game.weather==="Clear" || game.weather==="Fog") game.sanity=Math.min(100,game.sanity+1);
      else game.sanity=Math.max(0,game.sanity-Math.floor(Math.random()*2));
    } else {
      game.sanity=Math.max(0,game.sanity-Math.floor(Math.random()*6+3));
    }
  }
  updateHUD();
  ambientNarration();
  ghostLogic();
  renderActionButtons();
}

function ambientNarration(){
  const roomAmbience={
    "Van":["The hum of electronics is comforting.","Safe... at least for now."],
    "Living Room":["The couch smells damp.","Something shifts near the TV."],
    "Kitchen":["The fridge hum is too steady... too loud.","The smell of stale food makes me gag."],
    "Bathroom":["The mirror seems to fog slightly.","A drip echoes from the sink."],
    "Bedroom":["The bed looks slept in... but no one's here.","Sheets rustle on their own."],
    "Garage":["The concrete floor vibrates slightly.","Tools rattle softly on their hooks."],
    "Basement":["The air is wet, heavy.","I think I saw something move in the dark."]
  };
  if(roomAmbience[game.playerRoom]){
    const line=roomAmbience[game.playerRoom][Math.floor(Math.random()*roomAmbience[game.playerRoom].length)];
    log(line);
  }
}

/* ==============================
   === GHOST LOGIC & HUNTS ===
============================== */
function ghostLogic(){
  if(game.playerRoom===game.ghostRoom){
    if(Math.random()<0.25 && !game.activeHunt){
      triggerHunt();
      return;
    }
    if(game.saltPlaced[game.playerRoom] && !game.saltDisturbed[game.playerRoom] && Math.random()<0.3){
      game.saltDisturbed[game.playerRoom]=true;
      log("I watch as something steps in the salt. Prints disturb the smooth line.");
      updateHUD();
    }
  } else {
    // Salt gets disturbed off-screen
    if(game.saltPlaced[game.ghostRoom] && !game.saltDisturbed[game.ghostRoom] && Math.random()<0.15){
      game.saltDisturbed[game.ghostRoom]=true;
      updateHUD();
    }
  }
}

function triggerHunt(){
  game.activeHunt=true;
  log("The air thickens, breath catches... it's hunting!");
  setTimeout(()=>{
    if(game.inventory.includes("Crucifix") && !game.crucifixUsed){
      log("The crucifix burns red, snapping in half. The ghost retreats.");
      game.crucifixUsed=true;
    } else if(game.inventory.includes("Smudge") && !game.smudgeUsed){
      log("I light the smudge, smoke curls and it screeches, fading away.");
      game.smudgeUsed=true;
    } else {
      log("The shadow rushes me, cold fingers wrap around my throat... I can't breathe—");
      setTimeout(()=>endGame(false),1500);
    }
    game.activeHunt=false;
  },2500);
}

/* ==============================
   === END GAME ===
============================== */
function endGame(victory){
  gameOptions.innerHTML="";
  const msg=document.createElement("div");
  msg.style.marginBottom="10px";
  msg.textContent=victory?
    "Case solved. The ghost retreats into silence." :
    "You died. The ghost claimed you.";
  gameOptions.appendChild(msg);
  const restart=document.createElement("button");
  restart.textContent="Restart";
  restart.onclick=()=>location.reload();
  gameOptions.appendChild(restart);
}
/* ==============================
   === HUD STYLING UPDATE ===
============================== */
function createHUD(){
  const hud=document.createElement("div");
  hud.id="hud";
  hud.style.position="fixed";
  hud.style.bottom="20px";
  hud.style.left="20px";
  hud.style.color="#0ff";
  hud.style.fontFamily="monospace";
  hud.style.fontSize="16px";
  hud.style.lineHeight="1.4em";
  hud.style.textShadow="0 0 5px #0ff";
  hud.style.pointerEvents="none";
  hud.style.zIndex="9999";
  hud.innerHTML=`
    <div id="hud-sanity">Sanity: 100%</div>
    <div id="hud-room">Room: Van</div>
    <div id="hud-items">Items: None</div>
    <div id="hud-salt">Salt: None</div>
  `;
  document.body.appendChild(hud);
}
createHUD();

/* ==============================
   === ORBS & CAMERA OVERLAY ===
============================== */
function animateOrbs(){
  ctx.clearRect(0,0,width,height);

  // Show orbs in ghost room or when viewing through camera monitor in van
  const showOrbs = (
    (game.playerRoom===game.ghostRoom && game.foundEvidence.includes("Ghost Orb")) ||
    (game.playerRoom==="Van" && game.cameraRoom===game.ghostRoom && game.cameraPlaced[game.cameraRoom])
  );

  if(showOrbs){
    orbs.forEach(o=>{
      o.tick++;
      if(o.fadeIn){
        o.opacity+=0.01;
        if(o.opacity>0.6) o.fadeIn=false;
      } else {
        o.opacity-=0.005;
        if(o.opacity<=0.05) Object.assign(o,createOrb());
      }
      o.x+=o.vx; o.y+=o.vy;
      if(o.x<0||o.x>width) o.vx*=-1;
      if(o.y<0||o.y>height) o.vy*=-1;

      const gradient=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.baseRadius*3);
      gradient.addColorStop(0,`rgba(200,255,255,${o.opacity})`);
      gradient.addColorStop(0.5,`rgba(150,200,255,${o.opacity*0.5})`);
      gradient.addColorStop(1,`rgba(100,150,200,0)`);

      ctx.beginPath();
      ctx.fillStyle=gradient;
      ctx.ellipse(
        o.x,o.y,
        o.baseRadius*(1+Math.sin(o.tick*0.05)*0.3),
        o.baseRadius,
        0,0,Math.PI*2
      );
      ctx.fill();
    });
  }

  requestAnimationFrame(animateOrbs);
}
animateOrbs();

/* ==============================
   === STARTUP LOADOUT (CLICK+DRAG) ===
============================== */
function initLoadout(){
  vanItems.innerHTML="";
  playerItems.innerHTML="";
  allLoadoutItems.forEach(it=>{
    const div=document.createElement("div");
    div.textContent=it;
    div.className="loadout-item";
    div.style.padding="4px 6px";
    div.style.border="1px solid #0ff";
    div.style.margin="2px 0";
    div.style.cursor="pointer";
    div.style.userSelect="none";
    div.style.transition="background 0.2s";
    div.onmouseenter=()=>div.style.background="#022";
    div.onmouseleave=()=>div.style.background="";
    div.draggable=true;

    div.onclick=()=>{
      if([...playerItems.querySelectorAll("div")].length>=3){alert("Max 3 items.");return;}
      if([...playerItems.querySelectorAll("div")].some(d=>d.textContent===it))return;
      playerItems.appendChild(div);
    };
    div.ondragstart=e=>{e.dataTransfer.setData("text/plain",it);};
    vanItems.appendChild(div);
  });

  [vanItems,playerItems].forEach(el=>{
    el.ondragover=e=>e.preventDefault();
  });

  playerItems.ondrop=e=>{
    const it=e.dataTransfer.getData("text/plain");
    if(playerItems.querySelectorAll("div").length>=3){alert("Max 3 items.");return;}
    const node=[...vanItems.querySelectorAll("div")].find(d=>d.textContent===it);
    if(node) playerItems.appendChild(node);
  };

  vanItems.ondrop=e=>{
    const it=e.dataTransfer.getData("text/plain");
    const node=[...playerItems.querySelectorAll("div")].find(d=>d.textContent===it);
    if(node) vanItems.appendChild(node);
  };
}

document.getElementById('confirm-loadout').onclick=()=>{
  game.inventory=[...playerItems.querySelectorAll("div")].map(d=>d.textContent);
  if(game.inventory.length>3){alert("Max 3 items.");return;}
  game.vanStock={};
  allLoadoutItems.forEach(it=>{
    if(!game.inventory.includes(it)) game.vanStock[it]=(it==="Smudge"?2:it==="Salt"?3:1);
  });
  game.inventory.push("Notebook","Lighter");
  loadoutScreen.style.display="none";
  gameUI.style.display="block";
  updateHUD();
  log("I’ve packed: "+game.inventory.join(", "));
  startInvestigation();
};

/* ==============================
   === INVESTIGATION START ===
============================== */
function startInvestigation(){
  game.currentGhost=ghostProfiles[Math.floor(Math.random()*ghostProfiles.length)];
  game.ghostRoom=rooms[Math.floor(Math.random()*(rooms.length-1))+1];
  game.turn=1;
  game.foundEvidence=[];
  game.mimicForm=null;
  game.mimicShift=3+Math.floor(Math.random()*4);
  chooseWeather();
  updateMapVisual();
  log("This is it... the investigation starts.");
  renderActionButtons();
}

/* ==============================
   === BUTTON STYLING UPDATE ===
============================== */
function renderActionButtons(){
  gameOptions.innerHTML="";
  [
    {label:"Move",handler:openMoveMenu},
    {label:"Use Item",handler:openItemMenu},
    {label:"Notebook",handler:openNotebook},
    {label:"Drop/Pick",handler:openDropMenu},
    {label:"Van",handler:openVanMenu},
    {label:"Wait",handler:endTurn}
  ].forEach(btn=>{
    const b=document.createElement("button");
    b.textContent=btn.label;
    b.style.padding="6px 10px";
    b.style.margin="2px";
    b.style.border="1px solid #0ff";
    b.style.background="rgba(0,0,0,0.6)";
    b.style.color="#0ff";
    b.style.cursor="pointer";
    b.style.textTransform="uppercase";
    b.style.fontWeight="bold";
    b.onmouseenter=()=>b.style.background="rgba(0,255,255,0.2)";
    b.onmouseleave=()=>b.style.background="rgba(0,0,0,0.6)";
    b.onclick=btn.handler;
    gameOptions.appendChild(b);
  });
}

/* ==============================
   === WEATHER SELECTION ===
============================== */
function chooseWeather(){
  game.weather=weathers[Math.floor(Math.random()*weathers.length)];
  applyWeather();
  log("The weather's "+game.weather.toLowerCase()+" today.");
}

/* ==============================
   === WEATHER LAYERS ===
============================== */
function applyWeather(){
  fogLayer.style.display="none";
  rainLayer.style.display="none";
  bloodmoonLayer.style.display="none";
  if(game.weather==="Fog") fogLayer.style.display="block";
  else if(game.weather==="Rain") rainLayer.style.display="block";
  else if(game.weather==="Bloodmoon") bloodmoonLayer.style.display="block";
}

/* ==============================
   === MAP UPDATE ===
============================== */
function updateMapVisual(){
  const bg=roomVisuals[game.playerRoom]||"Van_N.png";
  document.body.style.background=`url('${bg}') no-repeat center center fixed`;
  document.body.style.backgroundSize="cover";
}
/* ==============================
   === NOTEBOOK LOGIC ===
============================== */
function openNotebook(){
  gameOptions.innerHTML="<p>Notebook:</p>";
  const allEvidence=["EMF","Spirit Box","Fingerprints","Ghost Orb","Ghost Writing","Freezing","D.O.T.S"];
  allEvidence.forEach(e=>{
    const btn=document.createElement("button");
    btn.textContent=(game.foundEvidence.includes(e)?"✓ ":"")+e;
    btn.style.padding="4px 6px";
    btn.style.margin="2px";
    btn.style.border="1px solid #0ff";
    btn.style.background="rgba(0,0,0,0.5)";
    btn.style.color="#0ff";
    btn.onclick=()=>{
      if(game.foundEvidence.includes(e)){
        game.foundEvidence=game.foundEvidence.filter(x=>x!==e);
        log("Crossed out "+e+" in notebook.");
      } else {
        game.foundEvidence.push(e);
        log("Marked "+e+" in notebook.");
      }
      updateHUD();
      openNotebook();
    };
    gameOptions.appendChild(btn);
  });

  gameOptions.appendChild(document.createElement("hr"));
  const possibleGhosts=ghostProfiles.filter(g=>
    game.foundEvidence.every(ev=>g.evidence.includes(ev))
  );
  const ghostList=document.createElement("div");
  ghostList.style.marginTop="10px";
  ghostList.innerHTML="<strong>Possible Ghosts:</strong><br>"+
    (possibleGhosts.length?possibleGhosts.map(g=>g.name).join(", "):"None");
  gameOptions.appendChild(ghostList);

  const cancelBtn=document.createElement("button");
  cancelBtn.textContent="Cancel";
  cancelBtn.onclick=renderActionButtons;
  cancelBtn.style.padding="6px 10px";
  cancelBtn.style.marginTop="10px";
  cancelBtn.style.background="rgba(0,0,0,0.6)";
  cancelBtn.style.color="#0ff";
  gameOptions.appendChild(cancelBtn);
}

/* ==============================
   === VAN MENU UPDATE ===
============================== */
function openVanMenu(){
  if(game.playerRoom!=="Van"){log("I need to be in the van for this.");renderActionButtons();return;}
  gameOptions.innerHTML="<p>Van Options:</p>";

  const camBtn=document.createElement("button");
  camBtn.textContent="View Camera Monitor";
  camBtn.onclick=()=>{
    if(game.cameraRoom && game.cameraPlaced[game.cameraRoom]){
      document.body.style.background=`url('${roomVisuals[game.cameraRoom]}') no-repeat center center fixed`;
      document.body.style.backgroundSize="cover";
      cameraOverlay.style.display="block";
      log("I stare at the monitor, watching the feed from "+game.cameraRoom+".");
      endTurn(true); // viewing counts as a turn
    } else {
      log("No active cameras connected.");
    }
  };
  camBtn.style.margin="2px";
  camBtn.style.border="1px solid #0ff";
  camBtn.style.background="rgba(0,0,0,0.6)";
  camBtn.style.color="#0ff";
  gameOptions.appendChild(camBtn);

  const swapBtn=document.createElement("button");
  swapBtn.textContent="Swap Items";
  swapBtn.onclick=()=>{
    gameOptions.innerHTML="<p>Swap items:</p>";
    for(let tool in game.vanStock){
      const take=document.createElement("button");
      take.textContent="Take "+tool+" ("+game.vanStock[tool]+")";
      take.onclick=()=>{
        if(game.inventory.length>=5){log("I can't carry more.");return;}
        game.inventory.push(tool);
        game.vanStock[tool]--;
        if(game.vanStock[tool]<=0) delete game.vanStock[tool];
        log("Took "+tool+" from the van.");
        updateHUD();
        openVanMenu();
      };
      take.style.margin="2px";
      take.style.background="rgba(0,0,0,0.6)";
      take.style.color="#0ff";
      gameOptions.appendChild(take);
    }
    game.inventory.filter(i=>!["Notebook","Lighter"].includes(i)).forEach(i=>{
      const ret=document.createElement("button");
      ret.textContent="Return "+i;
      ret.onclick=()=>{
        game.inventory=game.inventory.filter(x=>x!==i);
        game.vanStock[i]=(game.vanStock[i]||0)+1;
        log("Returned "+i+" to the van.");
        updateHUD();
        openVanMenu();
      };
      ret.style.margin="2px";
      ret.style.background="rgba(0,0,0,0.6)";
      ret.style.color="#0ff";
      gameOptions.appendChild(ret);
    });
    const back=document.createElement("button");
    back.textContent="Back";
    back.onclick=openVanMenu;
    back.style.marginTop="10px";
    back.style.background="rgba(0,0,0,0.6)";
    back.style.color="#0ff";
    gameOptions.appendChild(back);
  };
  swapBtn.style.margin="2px";
  swapBtn.style.background="rgba(0,0,0,0.6)";
  swapBtn.style.color="#0ff";
  gameOptions.appendChild(swapBtn);

  const cancel=document.createElement("button");
  cancel.textContent="Cancel";
  cancel.onclick=renderActionButtons;
  cancel.style.margin="2px";
  cancel.style.background="rgba(0,0,0,0.6)";
  cancel.style.color="#0ff";
  gameOptions.appendChild(cancel);
}

/* ==============================
   === UPDATE HUD ===
============================== */
function updateHUD(){
  const hudSan=document.getElementById("hud-sanity");
  const hudRoom=document.getElementById("hud-room");
  const hudItems=document.getElementById("hud-items");
  const hudSalt=document.getElementById("hud-salt");

  hudSan.textContent="Sanity: "+game.sanity+"%";
  hudRoom.textContent="Room: "+game.playerRoom;
  hudItems.textContent="Items: "+(game.inventory.length?game.inventory.join(", "):"None");

  let saltStatus="None";
  if(game.saltPlaced[game.playerRoom]){
    saltStatus = game.saltDisturbed[game.playerRoom] ? "Disturbed" : "Placed";
  }
  hudSalt.textContent="Salt: "+saltStatus;
}

/* ==============================
   === TURN HANDLER & HUNT ===
============================== */
function endTurn(skipAmbient){
  game.turn++;
  // Sanity adjustments
  if(game.playerRoom==="Van"){
    game.sanity=Math.min(100,game.sanity+2); // regain a bit in van
  } else {
    const lighted=false; // placeholder for future lighting system
    if(!lighted){
      if(game.playerRoom!==game.ghostRoom){
        game.sanity=Math.max(0,game.sanity-1);
      } else {
        game.sanity=Math.max(0,game.sanity-Math.floor(Math.random()*6+3));
      }
    }
  }

  updateHUD();
  if(!skipAmbient){
    const ambientThoughts=[
      "The air smells stale, wrong, heavy.",
      "I swear I heard someone whisper my name.",
      "The floor creaked... was it me?",
      "The shadows feel too deep here.",
      "My breath caught in my throat for a second."
    ];
    if(Math.random()<0.6){
      const thought=ambientThoughts[Math.floor(Math.random()*ambientThoughts.length)];
      log(thought);
    }
  }

  // Mimic Logic
  if(game.currentGhost.name==="The Mimic"){
    game.mimicShift--;
    if(game.mimicShift<=0){
      let pool=ghostProfiles.filter(g=>g.name!=="The Mimic");
      game.mimicForm=pool[Math.floor(Math.random()*pool.length)];
      game.mimicShift=3+Math.floor(Math.random()*4);
      log("Its behavior feels... different now.");
    }
  }

  handleHunt();
  renderActionButtons();
}

function handleHunt(){
  if(game.huntCooldown>0){game.huntCooldown--;return;}
  const huntChance=(100-game.sanity)/100;
  const inGhostRoom=(game.playerRoom===game.ghostRoom);
  if(inGhostRoom && Math.random()<huntChance){
    game.huntCooldown=3+Math.floor(Math.random()*3);
    triggerHunt();
  }
}

function triggerHunt(){
  log("The air thickens... it's hunting!");
  applyHuntVisuals(true);

  if(!game.crucifixUsed && game.inventory.includes("Crucifix")){
    game.crucifixUsed=true;
    setTimeout(()=>{
      log("The crucifix glows... it stopped this hunt.");
      applyHuntVisuals(false);
    },2000);
    return;
  }

  if(!game.smudgeUsed && game.inventory.includes("Smudge")){
    game.smudgeUsed=true;
    setTimeout(()=>{
      log("I light the smudge... smoke curls as it retreats.");
      applyHuntVisuals(false);
    },2500);
    return;
  }

  setTimeout(()=>{
    log("It lunges at me—everything goes black.");
    endGame(false);
    applyHuntVisuals(false);
  },4000);
}

function applyHuntVisuals(active){
  if(active){
    document.body.style.filter="contrast(120%) saturate(130%) hue-rotate(-20deg)";
    flashOverlay();
  } else {
    document.body.style.filter="";
  }
}

function flashOverlay(){
  const overlay=document.getElementById("flash-overlay");
  overlay.style.opacity=0.8;
  setTimeout(()=>overlay.style.opacity=0,300);
}

/* ==============================
   === END GAME ===
============================== */
function endGame(victory){
  gameOptions.innerHTML="";
  const msg=document.createElement("div");
  msg.style.marginBottom="10px";
  msg.textContent=victory?
    "You survived and solved the case.":
    "You died. The ghost claimed you.";
  gameOptions.appendChild(msg);

  const restart=document.createElement("button");
  restart.textContent="Restart Game";
  restart.onclick=()=>{
    localStorage.removeItem("phasmaGame");
    location.reload();
  };
  restart.style.padding="6px 10px";
  restart.style.marginTop="10px";
  restart.style.background="rgba(0,0,0,0.6)";
  restart.style.color="#0ff";
  gameOptions.appendChild(restart);
}

/* ==============================
   === DOM READY ===
============================== */
document.addEventListener("DOMContentLoaded",()=>{
  initLoadout();
});
</script>

<!-- ==============================
     === HUD (Video Game Style) ===
============================== -->
<div id="hud" style="
  position:fixed;
  bottom:10px;
  left:10px;
  color:#0ff;
  font-family:monospace;
  z-index:9999;
  pointer-events:none;
  text-shadow:0 0 4px #000;">
  <div id="hud-sanity" style="margin-bottom:4px;">Sanity: 100%</div>
  <div id="hud-room" style="margin-bottom:4px;">Room: Van</div>
  <div id="hud-items" style="margin-bottom:4px;">Items: None</div>
  <div id="hud-salt" style="margin-bottom:4px;">Salt: None</div>
  <div style="width:200px;height:2px;background:linear-gradient(to right,#0ff,transparent);"></div>
</div>

</body>
</html>
