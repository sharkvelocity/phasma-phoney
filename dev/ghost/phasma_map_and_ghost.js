/* phasma_map_and_ghost.js — full combined procedural map generator + ghost logic for PhasmaPhoney */

(function(){
"use strict";
if(window.__PhasmaMapGhostReady) return;
window.__PhasmaMapGhostReady = true;

const S = () => window.scene || BABYLON.EngineStore.LastCreatedScene;

// -------------------- MAP GENERATOR --------------------
window.MapGenerator = {
    rooms: [],
    roomMeshes: [],
    roomSizeUnit: 4, // 1 unit = 1 square
    doorMesh: null,

    async loadDoorMesh(path="./assets/models/map/door.glb"){
        if(this.doorMesh) return this.doorMesh;
        const sc = S();
        if(!sc) throw new Error("Scene not ready");
        const res = await BABYLON.SceneLoader.ImportMeshAsync("", "", path, sc);
        const door = res.meshes[0] || null;
        if(door){
            door.isVisible = false; // template
            this.doorMesh = door;
        }
        return this.doorMesh;
    },

    createRoomMesh(room){
        const sc = S();
        if(!sc) return null;
        let mesh = BABYLON.MeshBuilder.CreateBox(room.name, {
            width: room.width*this.roomSizeUnit,
            depth: room.depth*this.roomSizeUnit,
            height: 2.5
        }, sc);
        mesh.position.set(room.position.x,1.25,room.position.z);
        mesh.checkCollisions = true;
        mesh.metadata = room;
        this.roomMeshes.push(mesh);
        return mesh;
    },

    generate(seed = 12345){
        let rng = (function(s){
            let x = s;
            return ()=>{ x = (x*9301+49297)%233280; return x/233280; };
        })(seed);

        const rooms = [];
        const usedSpaces = new Set();
        function hashPos(x,z){ return `${x},${z}`; }

        // --- foyer ---
        const foyer = { name:"Foyer", width:1, depth:1, type:"foyer", position:{x:0,z:0}, doors:[] };
        rooms.push(foyer); usedSpaces.add(hashPos(foyer.position.x, foyer.position.z));

        // --- garage ---
        const garageWidth = 2, garageDepth = 2;
        const garageX = 3, garageZ = 0;
        const garage = { name:"Garage", width:garageWidth, depth:garageDepth, type:"garage", position:{x:garageX,z:garageZ}, doors:[] };
        rooms.push(garage);
        for(let dx=0;dx<garageWidth;dx++) for(let dz=0;dz<garageDepth;dz++) usedSpaces.add(hashPos(garageX+dx,garageZ+dz));

        // --- living ---
        const living = { name:"LivingRoom", width:2, depth:2, type:"living", position:{x:0,z:2}, doors:[] };
        rooms.push(living);
        for(let dx=0;dx<2;dx++) for(let dz=0;dz<2;dz++) usedSpaces.add(hashPos(living.position.x+dx,living.position.z+dz));

        // --- kitchen + dining ---
        const kitchen = { name:"Kitchen", width:2, depth:1, type:"kitchen", position:{x:2,z:2}, doors:[] };
        const dining = { name:"Dining", width:2, depth:1, type:"dining", position:{x:2,z:3}, doors:[] };
        rooms.push(kitchen,dining);
        for(let dx=0;dx<2;dx++){
            usedSpaces.add(hashPos(kitchen.position.x+dx,kitchen.position.z));
            usedSpaces.add(hashPos(dining.position.x+dx,dining.position.z));
        }

        // --- bedrooms (1-3) ---
        const numBeds = 1 + Math.floor(rng()*3);
        let bedX = 0, bedZ = 4;
        for(let i=0;i<numBeds;i++){
            const w = 1 + Math.floor(rng()*2);
            const d = 1 + Math.floor(rng()*2);
            const room = { name:"Bedroom"+(i+1), width:w, depth:d, type:"bedroom", position:{x:bedX,z:bedZ}, doors:[] };
            rooms.push(room);
            for(let dx=0;dx<w;dx++) for(let dz=0;dz<d;dz++) usedSpaces.add(hashPos(bedX+dx,bedZ+dz));
            bedX += w; if(bedX>4){ bedX=0; bedZ+=d; }
        }

        // --- bathrooms (1-3) ---
        const numBaths = 1 + Math.floor(rng()*3);
        let bathX = 0, bathZ = 6;
        for(let i=0;i<numBaths;i++){
            const room = { name:"Bathroom"+(i+1), width:1, depth:1, type:"bathroom", position:{x:bathX,z:bathZ}, doors:[] };
            rooms.push(room); usedSpaces.add(hashPos(bathX,bathZ));
            bathX += 1; if(bathX>3){ bathX=0; bathZ+=1; }
        }

        // --- doors ---
        rooms.forEach(r=>{
            r.doors = [];
            if(r.type==="foyer") r.doors.push({x:0.5,z:-0.5});
            if(r.type==="garage") r.doors.push({x:r.width/2,z:-0.5});
            if(r.type==="bathroom") r.doors.push({x:0.5,z:-0.5});
            if(r.type==="living") r.doors.push({x:r.width/2,z:-0.5});
            if(r.type==="kitchen") r.doors.push({x:r.width/2,z:-0.5});
            if(r.type==="dining") r.doors.push({x:r.width/2,z:-0.5});
        });

        this.rooms = rooms;
        return rooms;
    },

    async spawnRooms(seed){
        const sc = S();
        if(!sc) return;
        if(this.roomMeshes.length){
            this.roomMeshes.forEach(m=>{ try{ m.dispose(); } catch{} });
            this.roomMeshes = [];
        }

        this.generate(seed);

        for(const r of this.rooms){
            this.createRoomMesh(r);
        }

        // spawn doors
        if(!this.doorMesh) await this.loadDoorMesh();
        if(this.doorMesh){
            for(const r of this.rooms){
                r.doors.forEach(d=>{
                    const dm = this.doorMesh.clone(r.name+"_door");
                    dm.isVisible = true;
                    dm.position.set(r.position.x + d.x, 1, r.position.z + d.z);
                    dm.checkCollisions = true;
                });
            }
        }

        // place player at van location
        if(window.__PP_SPAWN){
            const sp = window.__PP_SPAWN;
            sp.x = -3; sp.y = 1.8; sp.z = -5;
        }
    },

    // --- helper methods used by ghost logic and bootstrap ---
    getVanRoom(){
        return this.rooms.find(r=>r.type==="garage") || null;
    },

    getRoomCenter(name){
        const room = this.rooms.find(r=>r.name===name);
        if(!room) return null;
        return new BABYLON.Vector3(
            room.position.x + room.width*this.roomSizeUnit/2,
            1.25,
            room.position.z + room.depth*this.roomSizeUnit/2
        );
    }
};

// -------------------- GHOST LOGIC --------------------
window.GhostLogic = {
    ghost: null,
    init(ghostMesh){
        this.ghost = ghostMesh;
    },

    getValidAdjacentPositions(roomName){
        const mg = window.MapGenerator;
        const center = mg.getRoomCenter(roomName);
        if(!center) return [];
        const offsets = [
            new BABYLON.Vector3(1,0,0),
            new BABYLON.Vector3(-1,0,0),
            new BABYLON.Vector3(0,0,1),
            new BABYLON.Vector3(0,0,-1)
        ];
        return offsets.map(o=>center.add(o));
    },

    moveGhostRandomly(){
        if(!this.ghost) return;
        const mg = window.MapGenerator;
        const roomName = this.ghost.roomName || "LivingRoom";
        const positions = this.getValidAdjacentPositions(roomName);
        if(positions.length){
            const nextPos = positions[Math.floor(Math.random()*positions.length)];
            this.ghost.position.copyFrom(nextPos);
        }
    },

    // optional update loop for render observer
    attachToScene(scene){
        if(!scene) return;
        scene.onBeforeRenderObservable.add(()=>{
            if(this.ghost) this.moveGhostRandomly();
        });
    }
};

})();
