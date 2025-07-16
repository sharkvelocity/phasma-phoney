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

    /* === ORB & CAMERA LAYERS === */
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

    /* === WEATHER LAYERS === */
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

    /* === LEFT LOG & BUTTONS === */
    #game-ui {
      display: none;
      position: fixed;
      top: 10%;
      left: 10px;
      width: 320px;
      height: 65%;
      background: transparent;
      pointer-events: auto;
      z-index: 1500;
    }
    #game-log {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: calc(100% - 90px);
      background: transparent;
      color: #0ff;
      padding: 0 5px;
      overflow-y: auto;
      border: none;
      font-size: 14px;
    }
    #game-options {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      background: rgba(0,0,0,0.3);
      border-top: 1px solid rgba(0,255,255,0.3);
      padding: 6px;
      text-align: center;
    }
    button {
      background: rgba(0,0,0,0.6);
      color: #0ff;
      border: 1px solid #0ff;
      padding: 6px 12px;
      margin: 3px;
      cursor: pointer;
      font-family: monospace;
      transition: all 0.2s ease-in-out;
      text-transform: uppercase;
      font-weight: bold;
    }
    button:hover {
      background: rgba(0,255,255,0.2);
      color: #0ff;
    }

    /* === BOTTOM-LEFT HUD === */
    #hud-container {
      position: fixed;
      bottom: 10px;
      left: 10px;
      z-index: 9999;
      pointer-events: none;
      color: #0ff;
      font-family: monospace;
    }
    #hud-sanity-bar {
      width: 200px;
      height: 16px;
      border: 1px solid #0ff;
      background: rgba(0,0,0,0.5);
      margin-bottom: 6px;
    }
    #hud-sanity {
      height: 100%;
      width: 100%;
      background: linear-gradient(to right, #0ff, #004);
      transition: width 0.4s ease-out;
    }
    #hud-room, #hud-items, #hud-salt {
      margin-bottom: 4px;
    }
    #return-van-btn {
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 4px 8px;
      background: rgba(0,0,0,0.6);
      color: #0ff;
      border: 1px solid #0ff;
      cursor: pointer;
      pointer-events: auto;
    }

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

    footer {
      position: fixed;
      bottom: 6px;
      right: 10px;
      color: rgba(255,255,255,0.3);
      font-size: 0.8em;
      font-family: sans-serif;
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

  <!-- Left UI -->
  <div id="game-ui">
    <div id="game-log"></div>
    <div id="game-options"></div>
  </div>

  <!-- HUD Bottom Left -->
  <div id="hud-container">
    <div id="hud-sanity-bar"><div id="hud-sanity"></div></div>
    <div id="hud-room">Room: Van</div>
    <div id="hud-items">Items: None</div>
    <div id="hud-salt">Salt: None</div>
    <button id="return-van-btn">Return to Van</button>
  </div>

  <!-- Van Swap Screen -->
  <div id="van-swap-screen">
    <h2 style="text-align:center;">Van Inventory Swap</h2>
    <div id="van-swap-container">
      <div id="van-swap-left"><strong>Van:</strong><div id="van-swap-van"></div></div>
      <div id="van-swap-right"><strong>Holding:</strong><div id="van-swap-player"></div></div>
    </div>
    <div style="text-align:center;margin-top:15px;">
      <button id="van-swap-confirm">Confirm</button>
      <button id="van-swap-cancel">Cancel</button>
    </div>
  </div>

  <footer>Shark-Blades — Inspired by Phasmophobia.</footer>

<script>
/* ==============================
   === GAME STATE & DOM HOOKS ===
============================== */
const hudSanity=document.getElementById("hud-sanity");
const hudRoom=document.getElementById("hud-room");
const hudItems=document.getElementById("hud-items");
const hudSalt=document.getElementById("hud-salt");
const gameLog=document.getElementById('game-log');
const gameOptions=document.getElementById('game-options');
const cameraOverlay=document.getElementById('camera-overlay');
const fogLayer=document.getElementById('fog-layer');
const rainLayer=document.getElementById('rain-layer');
const bloodmoonLayer=document.getElementById('bloodmoon-layer');
const returnVanBtn=document.getElementById('return-van-btn');
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

const rooms=["Van","Living Room","Kitchen","Bathroom","Bedroom","Garage","Basement"];
const roomVisuals={
  "Van":"Van_N.png",
  "Living Room":"LivingRoom_N.png",
  "Kitchen":"Kitchen_N.png",
  "Bathroom":"Bathroom_N.png",
  "Bedroom":"Bedroom_N.png",
  "Garage":"Garage_N.png",
  "Basement":"Basement_N.png"
};

function updateHUD(){
  hudSanity.style.width=game.sanity+"%";
  hudRoom.textContent="Room: "+game.playerRoom;
  hudItems.textContent="Items: "+(game.inventory.length?game.inventory.join(", "):"None");
  const saltStatus=game.saltPlaced[game.playerRoom]
    ?(game.saltDisturbed[game.playerRoom]?"Disturbed":"Placed")
    :"None";
  hudSalt.textContent="Salt: "+saltStatus;
}

// Fade log & add lines
function log(msg){
  const line=document.createElement("div");
  line.textContent=msg;
  line.style.opacity=1;
  line.style.transition="opacity 2s linear";
  gameLog.appendChild(line);
  gameLog.scrollTop=gameLog.scrollHeight;

  const lines=[...gameLog.children];
  const cutoff=gameLog.scrollHeight/2;
  let totalHeight=0;
  for(let i=0;i<lines.length;i++){
    totalHeight+=lines[i].offsetHeight;
    if(totalHeight>cutoff) lines[i].style.opacity=0.4;
  }
}

returnVanBtn.onclick=()=>{
  if(game.playerRoom!=="Van"){
    game.playerRoom="Van";
    updateMapVisual();
    cameraOverlay.style.display="none";
    log("Returned to the van.");
    endTurn();
  }else log("Already in the van.");
};
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
   === GHOST PROFILES ===
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
    {label:"Drop/Pick",handler:openDropMenu},
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
   === MOVE MENU (No Van Option If Already There) ===
============================== */
function openMoveMenu(){
  gameOptions.innerHTML="<p>Select a room to move to:</p>";
  rooms.forEach(r=>{
    if(r===game.playerRoom) return;
    const btn=document.createElement("button");
    btn.textContent=r;
    btn.onclick=()=>{
      game.playerRoom=r;
      updateMapVisual();
      cameraOverlay.style.display="none";
      log("Moved to "+r+".");
      endTurn();
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

  if(item==="Thermometer"){
    const temp = (game.playerRoom===game.ghostRoom ? (Math.random()*5+(-5)).toFixed(1)+"°C" : (Math.random()*10+15).toFixed(1)+"°C");
    log("Thermometer reads: "+temp);
    updateHUD();
    endTurn();return;
  }

  if(item==="Camera"){
    game.cameraPlaced[game.playerRoom]=true;
    game.cameraRoom=game.playerRoom;
    log("Camera placed in "+game.playerRoom+".");
    if((game.foundEvidence.includes("Ghost Orb")||(isMimic&&inGhostRoom))&&inGhostRoom){
      cameraOverlay.style.display="block";
      log("Camera captures faint orbs swirling on screen.");
    }
    endTurn();return;
  }

  if(item==="Salt"){
    if(!game.saltPlaced[game.playerRoom]){
      game.saltPlaced[game.playerRoom]=true;
      game.saltDisturbed[game.playerRoom]=false;
      log("I sprinkled salt carefully on the ground here.");
      updateHUD();
    }else log("Salt is already placed here.");
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
      }else log("Same reading as before.");
    }else log("The reading flickers... nothing solid yet.");
  }else log("No response from this tool.");
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
      }else{
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
   === VAN MENU ===
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
      log("I stare at the monitor, watching "+game.cameraRoom+".");
      endTurn(true);
    }else log("No active cameras connected.");
  };
  gameOptions.appendChild(camBtn);

  const swapBtn=document.createElement("button");
  swapBtn.textContent="Swap Items";
  swapBtn.onclick=openVanSwapScreen;
  gameOptions.appendChild(swapBtn);

  const cancel=document.createElement("button");
  cancel.textContent="Cancel";
  cancel.onclick=renderActionButtons;
  gameOptions.appendChild(cancel);
}
/* ==============================
   === VAN SWAP SCREEN LOGIC ===
============================== */
function openVanSwapScreen(){
  vanSwapVan.innerHTML="";
  vanSwapPlayer.innerHTML="";

  for(let tool in game.vanStock){
    const div=document.createElement("div");
    div.textContent=tool+" ("+game.vanStock[tool]+")";
    div.onclick=()=>{
      if(game.inventory.length>=5){log("I can't carry more.");return;}
      game.inventory.push(tool);
      game.vanStock[tool]--;
      if(game.vanStock[tool]<=0) delete game.vanStock[tool];
      log("Took "+tool+" from the van.");
      updateHUD();
      openVanSwapScreen();
    };
    vanSwapVan.appendChild(div);
  }

  game.inventory.filter(i=>!["Notebook","Lighter"].includes(i)).forEach(i=>{
    const div=document.createElement("div");
    div.textContent=i;
    div.onclick=()=>{
      game.inventory=game.inventory.filter(x=>x!==i);
      game.vanStock[i]=(game.vanStock[i]||0)+1;
      log("Returned "+i+" to the van.");
      updateHUD();
      openVanSwapScreen();
    };
    vanSwapPlayer.appendChild(div);
  });

  vanSwapScreen.style.display="block";
}

vanSwapConfirm.onclick=()=>{
  vanSwapScreen.style.display="none";
  log("Swapped items finalized.");
  updateHUD();
  renderActionButtons();
};
vanSwapCancel.onclick=()=>{
  vanSwapScreen.style.display="none";
  log("Canceled swapping.");
  renderActionButtons();
};

/* ==============================
   === HUD UPDATE (Thermometer Included) ===
============================== */
function updateHUD(){
  hudSanity.textContent=game.sanity+"%";
  hudRoom.textContent=game.playerRoom;

  let itemsHeld=game.inventory.length?game.inventory.join(", "):"None";
  if(game.inventory.includes("Thermometer")){
    const temp=(game.playerRoom===game.ghostRoom?(-1-Math.random()*4).toFixed(1):(15+Math.random()*10).toFixed(1))+"°C";
    itemsHeld+=" | Temp: "+temp;
  }
  hudItems.textContent=itemsHeld;

  const saltState=game.saltPlaced[game.playerRoom]
    ?(game.saltDisturbed[game.playerRoom]?"Disturbed":"Placed")
    :"None";
  saltHud.textContent="Salt: "+saltState;
}

/* ==============================
   === AMBIENT NARRATION (Expanded) ===
============================== */
function ambientNarration(){
  const lines={
    "Van":[
      "The hum of electronics is oddly calming.",
      "Safe here… for now.",
      "The monitor flickers gently in the dark.",
      "The faint smell of coffee lingers in the air."
    ],
    "Living Room":[
      "The couch smells damp.",
      "A shadow flickers near the TV.",
      "Something shifts behind the curtains.",
      "The carpet muffles my every step unnaturally."
    ],
    "Kitchen":[
      "The fridge hum is too steady… almost loud.",
      "A fork clatters in the sink by itself.",
      "The smell of stale food is overwhelming.",
      "Condensation drips slowly down the window."
    ],
    "Bathroom":[
      "The mirror fogs slightly despite no steam.",
      "A drip echoes from the sink.",
      "Shampoo bottles tip slightly as if nudged.",
      "The curtain flutters with no draft."
    ],
    "Bedroom":[
      "The bed looks slept in… but no one’s here.",
      "Sheets rustle faintly on their own.",
      "The closet door creaks ever so slightly.",
      "An old perfume smell wafts through the air."
    ],
    "Garage":[
      "The concrete floor vibrates slightly.",
      "Tools rattle softly on their hooks.",
      "A faint oil smell stings my nose.",
      "The car mirror glints strangely in the dark."
    ],
    "Basement":[
      "The air is wet, heavy, and still.",
      "Something scurries across the floor.",
      "A muffled thump echoes from the far wall.",
      "The shadows seem to crawl here."
    ]
  };

  if(lines[game.playerRoom]){
    const arr=lines[game.playerRoom];
    const line=arr[Math.floor(Math.random()*arr.length)];
    log(line);
  }
}

/* ==============================
   === TURN HANDLER & SANITY ===
============================== */
function endTurn(isVanAction=false){
  if(!isVanAction){
    game.turn++;
    if(game.playerRoom==="Van"){
      game.sanity=Math.min(100,game.sanity+2);
    } else {
      if(game.playerRoom!==game.ghostRoom){
        if(game.weather==="Clear"||game.weather==="Fog"){
          game.sanity=Math.min(100,game.sanity+1);
        } else {
          game.sanity=Math.max(0,game.sanity-1);
        }
      } else {
        game.sanity=Math.max(0,game.sanity-(3+Math.floor(Math.random()*5)));
      }
    }
  }
  updateHUD();
  ambientNarration();
  ghostLogic();
  renderActionButtons();
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
      log("I watch as something steps in the salt, disturbing it.");
      updateHUD();
    }
  } else if(game.saltPlaced[game.ghostRoom] && !game.saltDisturbed[game.ghostRoom] && Math.random()<0.15){
    game.saltDisturbed[game.ghostRoom]=true;
    updateHUD();
  }
}

function triggerHunt(){
  game.activeHunt=true;
  log("The air thickens, breath catches… it’s hunting!");
  applyHuntVisuals(true);

  setTimeout(()=>{
    if(game.inventory.includes("Crucifix") && !game.crucifixUsed){
      game.crucifixUsed=true;
      log("The crucifix glows and cracks— the ghost retreats.");
      applyHuntVisuals(false);
      game.activeHunt=false;
    } else if(game.inventory.includes("Smudge") && !game.smudgeUsed){
      game.smudgeUsed=true;
      log("I light the smudge—smoke curls as it hisses and retreats.");
      applyHuntVisuals(false);
      game.activeHunt=false;
    } else {
      log("The shadow lunges at me—cold fingers tighten around my throat…");
      setTimeout(()=>{endGame(false);applyHuntVisuals(false);},2000);
    }
  },3000);
}

function applyHuntVisuals(active){
  if(active){
    document.body.style.filter="contrast(120%) saturate(150%) hue-rotate(-10deg)";
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
  msg.textContent=victory
    ?"You survived and solved the case."
    :"You died. The ghost claimed you.";
  gameOptions.appendChild(msg);

  const restart=document.createElement("button");
  restart.textContent="Restart Game";
  restart.onclick=()=>location.reload();
  gameOptions.appendChild(restart);
}

/* ==============================
   === ORBS & CAMERA OVERLAY ===
============================== */
const orbCanvas=document.getElementById("orb-canvas");
const ctx=orbCanvas.getContext("2d");
let width=orbCanvas.width=window.innerWidth;
let height=orbCanvas.height=window.innerHeight;
let orbs=[];

function createOrb(){
  return {
    x:Math.random()*width,
    y:Math.random()*height,
    vx:(Math.random()-0.5)*0.2,
    vy:(Math.random()-0.5)*0.2,
    baseRadius:Math.random()*2+1,
    opacity:Math.random()*0.3,
    fadeIn:true,
    tick:0
  };
}

for(let i=0;i<12;i++)orbs.push(createOrb());

function animateOrbs(){
  ctx.clearRect(0,0,width,height);

  const showOrbs=
    (game.playerRoom===game.ghostRoom && game.foundEvidence.includes("Ghost Orb")) ||
    (game.playerRoom==="Van" && game.cameraRoom===game.ghostRoom && game.cameraPlaced[game.cameraRoom]);

  if(showOrbs){
    orbs.forEach(o=>{
      o.tick++;
      if(o.fadeIn){
        o.opacity+=0.01;
        if(o.opacity>0.6)o.fadeIn=false;
      }else{
        o.opacity-=0.005;
        if(o.opacity<=0.05)Object.assign(o,createOrb());
      }
      o.x+=o.vx;o.y+=o.vy;
      if(o.x<0||o.x>width)o.vx*=-1;
      if(o.y<0||o.y>height)o.vy*=-1;

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
   === STARTUP LOADOUT ===
============================== */
const allLoadoutItems=["EMF","Spirit Box","Camera","UV Light","D.O.T.S","Thermometer","Book","Smudge","Crucifix","Salt"];
const vanItems=document.createElement("div");
const playerItems=document.createElement("div");

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
    div.onclick=()=>{
      if(playerItems.querySelectorAll("div").length>=3){alert("Max 3 items.");return;}
      if([...playerItems.querySelectorAll("div")].some(d=>d.textContent===it))return;
      playerItems.appendChild(div);
    };
    vanItems.appendChild(div);
  });
}

document.addEventListener("DOMContentLoaded",()=>{
  initLoadout();
  updateHUD();
});
/* ==============================
   === STARTUP SCREEN & GAME START ===
============================== */
const loadoutScreen=document.createElement("div");
loadoutScreen.style.position="fixed";
loadoutScreen.style.top="50%";
loadoutScreen.style.left="50%";
loadoutScreen.style.transform="translate(-50%,-50%)";
loadoutScreen.style.width="420px";
loadoutScreen.style.background="rgba(0,0,0,0.85)";
loadoutScreen.style.border="2px solid #0ff";
loadoutScreen.style.padding="20px";
loadoutScreen.style.color="#0ff";
loadoutScreen.style.fontFamily="monospace";
loadoutScreen.style.zIndex="9999";
loadoutScreen.innerHTML=`
  <h2 style="text-align:center;margin-top:0;margin-bottom:10px;text-shadow:0 0 6px #0ff;">Select Your Loadout</h2>
  <div style="display:flex;justify-content:space-between;">
    <div style="width:45%;border:1px solid rgba(0,255,255,0.3);padding:5px;">
      <strong>Van Items:</strong>
      <div id="vanItems"></div>
    </div>
    <div style="width:45%;border:1px solid rgba(0,255,255,0.3);padding:5px;">
      <strong>Selected (Max 3):</strong>
      <div id="playerItems"></div>
    </div>
  </div>
  <div style="text-align:center;margin-top:10px;">
    <button id="confirm-loadout" style="background:rgba(0,0,0,0.6);color:#0ff;border:1px solid #0ff;padding:6px 10px;">Confirm</button>
  </div>
`;
document.body.appendChild(loadoutScreen);

document.getElementById("confirm-loadout").onclick=()=>{
  game.inventory=[...playerItems.querySelectorAll("div")].map(d=>d.textContent);
  if(game.inventory.length>3){alert("Max 3 items.");return;}
  game.vanStock={};
  allLoadoutItems.forEach(it=>{
    if(!game.inventory.includes(it)){
      game.vanStock[it]=(it==="Smudge"?2:it==="Salt"?3:1);
    }
  });
  game.inventory.push("Notebook","Lighter");
  loadoutScreen.style.display="none";
  gameUI.style.display="block";
  log("I’ve packed: "+game.inventory.join(", "));
  startInvestigation();
};

/* ==============================
   === LOG INTERFACE (Transparent, Fade Effect) ===
============================== */
gameLog.style.background="transparent";
gameLog.style.border="none";
gameLog.style.color="#0ff";
gameLog.style.overflowY="auto";
gameLog.style.pointerEvents="auto";
gameLog.style.maxHeight="calc(100% - 80px)";
gameLog.style.padding="10px";
gameLog.style.scrollBehavior="smooth";

function log(msg){
  const line=document.createElement("div");
  line.textContent=msg;
  line.style.marginBottom="5px";
  line.style.opacity="1";
  line.style.transition="opacity 3s ease-in-out";

  gameLog.appendChild(line);
  gameLog.scrollTop=gameLog.scrollHeight;

  setTimeout(()=>{
    if(gameLog.scrollTop<gameLog.scrollHeight/2){
      line.style.opacity="0.3";
    }
  },3000);
}

/* ==============================
   === INTERFACE BUTTONS COMBINED WITH LOG ===
============================== */
gameOptions.style.position="absolute";
gameOptions.style.bottom="0";
gameOptions.style.left="0";
gameOptions.style.width="100%";
gameOptions.style.background="rgba(0,0,0,0.4)";
gameOptions.style.textAlign="center";
gameOptions.style.borderTop="1px solid rgba(0,255,255,0.3)";
gameOptions.style.padding="6px";

function renderActionButtons(){
  gameOptions.innerHTML="";
  const btnData=[
    {label:"Move",handler:openMoveMenu},
    {label:"Use Item",handler:openItemMenu},
    {label:"Notebook",handler:openNotebook},
    {label:"Drop/Pick",handler:openDropMenu},
    {label:"Van",handler:openVanMenu},
    {label:"Wait",handler:endTurn}
  ];
  btnData.forEach(obj=>{
    const b=document.createElement("button");
    b.textContent=obj.label;
    b.style.padding="6px 10px";
    b.style.margin="3px";
    b.style.border="1px solid #0ff";
    b.style.background="rgba(0,0,0,0.5)";
    b.style.color="#0ff";
    b.style.cursor="pointer";
    b.onmouseenter=()=>b.style.background="rgba(0,255,255,0.2)";
    b.onmouseleave=()=>b.style.background="rgba(0,0,0,0.5)";
    b.onclick=obj.handler;
    gameOptions.appendChild(b);
  });
}

/* ==============================
   === SANITY BAR HUD REDESIGN ===
============================== */
const sanityBarContainer=document.createElement("div");
sanityBarContainer.style.position="fixed";
sanityBarContainer.style.bottom="10px";
sanityBarContainer.style.left="10px";
sanityBarContainer.style.width="160px";
sanityBarContainer.style.height="14px";
sanityBarContainer.style.border="1px solid #0ff";
sanityBarContainer.style.background="rgba(0,0,0,0.3)";
sanityBarContainer.style.zIndex="9999";

const sanityBar=document.createElement("div");
sanityBar.style.height="100%";
sanityBar.style.width="100%";
sanityBar.style.background="linear-gradient(to right,#0ff,#00aa99)";
sanityBarContainer.appendChild(sanityBar);
document.body.appendChild(sanityBarContainer);

function updateSanityBar(){
  sanityBar.style.width=game.sanity+"%";
  if(game.sanity>70)sanityBar.style.background="linear-gradient(to right,#0ff,#00aa99)";
  else if(game.sanity>40)sanityBar.style.background="linear-gradient(to right,#ffaa00,#ff7700)";
  else sanityBar.style.background="linear-gradient(to right,#ff0000,#770000)";
}

function updateHUD(){
  hudRoom.textContent=game.playerRoom;
  let itemsHeld=game.inventory.length?game.inventory.join(", "):"None";
  if(game.inventory.includes("Thermometer")){
    const temp=(game.playerRoom===game.ghostRoom?(-1-Math.random()*4).toFixed(1):(15+Math.random()*10).toFixed(1))+"°C";
    itemsHeld+=" | Temp: "+temp;
  }
  hudItems.textContent=itemsHeld;
  const saltState=game.saltPlaced[game.playerRoom]
    ?(game.saltDisturbed[game.playerRoom]?"Disturbed":"Placed")
    :"None";
  saltHud.textContent="Salt: "+saltState;
  updateSanityBar();
}

/* ==============================
   === ITEMS HUD BOTTOM LEFT ===
============================== */
const itemsHudContainer=document.createElement("div");
itemsHudContainer.style.position="fixed";
itemsHudContainer.style.bottom="30px";
itemsHudContainer.style.left="10px";
itemsHudContainer.style.color="#0ff";
itemsHudContainer.style.fontFamily="monospace";
itemsHudContainer.style.fontSize="14px";
itemsHudContainer.style.textShadow="0 0 4px #0ff";
itemsHudContainer.style.zIndex="9999";
document.body.appendChild(itemsHudContainer);

function updateItemsHud(){
  itemsHudContainer.innerHTML="<strong>Items:</strong> "+(game.inventory.length?game.inventory.join(", "):"None");
}

function updateHUD(){
  hudRoom.textContent=game.playerRoom;
  updateSanityBar();
  updateItemsHud();
  const saltState=game.saltPlaced[game.playerRoom]
    ?(game.saltDisturbed[game.playerRoom]?"Disturbed":"Placed")
    :"None";
  saltHud.textContent="Salt: "+saltState;
}

/* ==============================
   === CAMERA OVERLAY BUTTON & ORBS ===
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
      endTurn(true);
    } else {
      log("No active cameras connected.");
    }
  };
  gameOptions.appendChild(camBtn);

  const swapBtn=document.createElement("button");
  swapBtn.textContent="Swap Items";
  swapBtn.onclick=()=>{openVanSwapScreen();};
  gameOptions.appendChild(swapBtn);

  const cancel=document.createElement("button");
  cancel.textContent="Cancel";
  cancel.onclick=renderActionButtons;
  gameOptions.appendChild(cancel);
}

/* ==============================
   === MOVE MENU FIX (Van Option Removed If Already There) ===
============================== */
function openMoveMenu(){
  gameOptions.innerHTML="<p>Select a room to move to:</p>";
  rooms.forEach(r=>{
    if(r===game.playerRoom)return;
    const btn=document.createElement("button");
    btn.textContent=r;
    btn.onclick=()=>{
      game.playerRoom=r;
      updateMapVisual();
      cameraOverlay.style.display="none";
      log("Moved to "+r+".");
      endTurn();
    };
    gameOptions.appendChild(btn);
  });
  const back=document.createElement("button");
  back.textContent="Cancel";
  back.onclick=renderActionButtons;
  gameOptions.appendChild(back);
}

/* ==============================
   === FINAL DOM READY ===
============================== */
document.addEventListener("DOMContentLoaded",()=>{
  updateHUD();
  updateItemsHud();
  updateSanityBar();
  log("Welcome to Phasma‑Phoney. Select your items to begin.");
});
/* ==============================
   === VAN SWAP SCREEN (New Polished UI) ===
============================== */
function openVanSwapScreen(){
  vanSwapVan.innerHTML="";
  vanSwapPlayer.innerHTML="";
  for(let tool in game.vanStock){
    const div=document.createElement("div");
    div.textContent=tool+" ("+game.vanStock[tool]+")";
    div.style.cursor="pointer";
    div.onclick=()=>{
      if(game.inventory.length>=5){log("I can't carry more.");return;}
      game.inventory.push(tool);
      game.vanStock[tool]--;
      if(game.vanStock[tool]<=0)delete game.vanStock[tool];
      log("Took "+tool+" from the van.");
      updateHUD();
      openVanSwapScreen();
    };
    vanSwapVan.appendChild(div);
  }

  game.inventory.filter(i=>!["Notebook","Lighter"].includes(i)).forEach(it=>{
    const div=document.createElement("div");
    div.textContent=it;
    div.style.cursor="pointer";
    div.onclick=()=>{
      game.inventory=game.inventory.filter(x=>x!==it);
      game.vanStock[it]=(game.vanStock[it]||0)+1;
      log("Returned "+it+" to the van.");
      updateHUD();
      openVanSwapScreen();
    };
    vanSwapPlayer.appendChild(div);
  });

  vanSwapScreen.style.display="block";
}

vanSwapConfirm.onclick=()=>{
  vanSwapScreen.style.display="none";
  renderActionButtons();
};
vanSwapCancel.onclick=()=>{
  vanSwapScreen.style.display="none";
  renderActionButtons();
};

/* ==============================
   === ORB ANIMATION UPDATE ===
============================== */
const orbCanvas=document.getElementById("orb-canvas");
const ctx=orbCanvas.getContext("2d");
let width=window.innerWidth;
let height=window.innerHeight;
orbCanvas.width=width;
orbCanvas.height=height;

window.addEventListener("resize",()=>{
  width=window.innerWidth;
  height=window.innerHeight;
  orbCanvas.width=width;
  orbCanvas.height=height;
});

function createOrb(){
  return{
    x:Math.random()*width,
    y:Math.random()*height,
    vx:(Math.random()-0.5)*0.3,
    vy:(Math.random()-0.5)*0.3,
    baseRadius:2+Math.random()*3,
    opacity:0,
    fadeIn:true,
    tick:0
  };
}

let orbs=Array.from({length:10},createOrb);

function animateOrbs(){
  ctx.clearRect(0,0,width,height);

  const showOrbs=(
    (game.playerRoom===game.ghostRoom && game.foundEvidence.includes("Ghost Orb"))||
    (game.playerRoom==="Van" && game.cameraRoom===game.ghostRoom && game.cameraPlaced[game.cameraRoom])
  );

  if(showOrbs){
    orbs.forEach(o=>{
      o.tick++;
      if(o.fadeIn){
        o.opacity+=0.01;
        if(o.opacity>0.6)o.fadeIn=false;
      }else{
        o.opacity-=0.005;
        if(o.opacity<=0.05)Object.assign(o,createOrb());
      }
      o.x+=o.vx;o.y+=o.vy;
      if(o.x<0||o.x>width)o.vx*=-1;
      if(o.y<0||o.y>height)o.vy*=-1;

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
   === DYNAMIC AMBIENT NARRATION EXPANDED ===
============================== */
function ambientNarration(){
  const roomAmbience={
    "Van":[
      "The hum of the van is oddly comforting.",
      "I adjust the monitor slightly, feeling safer here.",
      "This place is my lifeline to the outside world."
    ],
    "Living Room":[
      "The couch smells damp, like mildew.",
      "I swear the TV flickered just now.",
      "The carpet feels wetter than it should."
    ],
    "Kitchen":[
      "A sour smell lingers from the sink.",
      "The fridge hums unnaturally loud.",
      "The dishes seem shifted since I was here."
    ],
    "Bathroom":[
      "The mirror is fogged despite the cold air.",
      "A faint drip echoes from somewhere.",
      "The shower curtain rustles slightly."
    ],
    "Bedroom":[
      "Sheets are ruffled, but no one's here.",
      "A drawer creaks by itself.",
      "The wardrobe door looks slightly ajar now."
    ],
    "Garage":[
      "Tools rattle softly as if disturbed.",
      "The air smells faintly of oil.",
      "A shadow slides across the wall."
    ],
    "Basement":[
      "The air feels heavier, like it’s closing in.",
      "A cold breeze whispers through the darkness.",
      "Something shifts near the corner."
    ]
  };

  if(roomAmbience[game.playerRoom]){
    const lines=roomAmbience[game.playerRoom];
    const line=lines[Math.floor(Math.random()*lines.length)];
    log(line);
  }
}

/* ==============================
   === GHOST BEHAVIOR & HUNT UPDATE ===
============================== */
function handleHunt(){
  if(game.huntCooldown>0){game.huntCooldown--;return;}
  const huntChance=(100-game.sanity)/100;
  const inGhostRoom=game.playerRoom===game.ghostRoom;

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
      log("The crucifix glows, breaking in half... it stopped this hunt.");
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
    document.body.style.filter="contrast(130%) saturate(140%) hue-rotate(-20deg)";
    flashOverlay();
  }else{
    document.body.style.filter="";
  }
}

function flashOverlay(){
  const overlay=document.getElementById("flash-overlay");
  overlay.style.opacity=0.8;
  setTimeout(()=>overlay.style.opacity=0,300);
}

/* ==============================
   === END GAME SCREEN UPDATE ===
============================== */
function endGame(victory){
  gameOptions.innerHTML="";
  const msg=document.createElement("div");
  msg.style.marginBottom="10px";
  msg.textContent=victory
    ?"You survived and solved the case."
    :"You died. The ghost claimed you.";
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
   === FINALIZE GAME START ===
============================== */
document.addEventListener("DOMContentLoaded",()=>{
  initLoadout();
  log("Welcome to Phasma‑Phoney. Select your items to begin.");
});
</script>

</body>
</html>
