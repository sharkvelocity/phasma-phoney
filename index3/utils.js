// Toast + helpers
function toast(msg, ms=1500){
  const t=document.getElementById('toast');
  t.textContent=msg; t.style.display='block';
  setTimeout(()=>t.style.display='none', ms);
}
function inVanZone(pos){ return BABYLON.Vector3.Distance(pos, vanZone.center) <= vanZone.radius; }

function pickGroundHeightAt(x, z){
  const ray = new BABYLON.Ray(new BABYLON.Vector3(x, 80, z), new BABYLON.Vector3(0,-1,0), 200);
  const hit = scene.pickWithRay(ray, m=>{
    if(!m || !m.isPickable) return false;
    const n = (m.name||"");
    return /ground|floor|terrain|fallbackground/i.test(n);
  });
  if(hit.hit && hit.pickedPoint) return hit.pickedPoint.y;
  return 1.2;
}

function randomPointInPolygonXZ(poly){
  let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
  poly.forEach(p=>{ minX=Math.min(minX,p.x); maxX=Math.max(maxX,p.x); minZ=Math.min(minZ,p.z); maxZ=Math.max(maxZ,p.z); });
  for(let i=0;i<500;i++){
    const x = minX + Math.random()*(maxX-minX);
    const z = minZ + Math.random()*(maxZ-minZ);
    if(pointInPolyXZ(new BABYLON.Vector3(x,0,z), poly)) return new BABYLON.Vector3(x, 0, z);
  }
  return poly[0].clone();
}
function pointInPolyXZ(p, poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i].x, zi=poly[i].z, xj=poly[j].x, zj=poly[j].z;
    const intersect = ((zi>p.z)!=(zj>p.z)) && (p.x < (xj-xi)*(p.z-zi)/(zj-zi)+xi);
    if(intersect) inside=!inside;
  }
  return inside;
}
function lookAtXZ(mesh, target){
  const dir = target.subtract(mesh.position); dir.y=0;
  if(dir.lengthSquared()>0.001){
    mesh.rotationQuaternion=null;
    mesh.rotation = new BABYLON.Vector3(0, Math.atan2(dir.x, dir.z), 0);
  }
}
