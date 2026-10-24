import * as T from 'three';
// Hobbywing HM 13842-class heavy-lift outrunner BLDC: 36N40P, starts exploded, assembles along the shaft on scroll.
export function start(host){
  const r=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  r.setPixelRatio(Math.min(devicePixelRatio,1.5));host.appendChild(r.domElement);
  const s=new T.Scene(),cam=new T.PerspectiveCamera(32,1,.1,100);cam.position.set(0,0,19);
  const hot=new T.LineBasicMaterial({color:0xff7a1a,transparent:true,opacity:.95});
  const dim=new T.LineBasicMaterial({color:0xc2410c,transparent:true,opacity:.5});
  const cu=new T.LineBasicMaterial({color:0xffb347,transparent:true,opacity:.45});
  const root=new T.Group();s.add(root);root.rotation.set(.5,-.4,0);
  const asm=new T.Group();asm.position.y=1.5;root.add(asm);
  // Hobbywing HM 13842 outrunner. Scale 1u = 20mm. Axis = +Y. Can OD 152, ~74mm tall incl. base; stator 138 x 42, 36N40P.
  asm.position.y=-1.5;
  const parts=[],TAU=Math.PI*2;
  const fill=new T.MeshBasicMaterial({color:0x0b0a09,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
  const edge=(g,m)=>{const o=new T.Group();o.add(new T.Mesh(g,fill));o.add(new T.LineSegments(new T.EdgesGeometry(g,20),m));return o};
  const add=(ey,spin)=>{const o=new T.Group();asm.add(o);parts.push({o,ey,spin});return o};
  const ext=(sh,d,y0,seg=24)=>{const g=new T.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false,curveSegments:seg});g.rotateX(-Math.PI/2);g.translate(0,y0,0);return g};
  const hole=(sh,x,z,r)=>{const h=new T.Path();h.absarc(x,-z,r,0,TAU,true);sh.holes.push(h)};
  const ring=(ro,ri,h,y0,m,seg=64)=>{const s=new T.Shape();s.absarc(0,0,ro,0,TAU,false);hole(s,0,0,ri);return edge(ext(s,h,y0,seg),m)};
  const tube=(r,h,y,m,seg=48)=>edge(new T.CylinderGeometry(r,r,h,seg,1,true).translate(0,y,0),m);
  const circ=(r,y,m)=>{const l=new T.LineLoop(new T.BufferGeometry().setFromPoints(new T.EllipseCurve(0,0,r,r,0,TAU).getPoints(96).map(v=>new T.Vector3(v.x,y,v.y))),m);return l};
  const NS=36,NP=40;
  // (c) BASE: 5-spoke mount, outer ring with mount holes, bearing housing, phase leads exiting low
  const base=add(-3.0,0);
  {const s=new T.Shape();s.absarc(0,0,2.9,0,TAU,false);hole(s,0,0,2.5);base.add(edge(ext(s,.25,-.5),hot));
   base.add(ring(1.05,.5,.75,-.5,hot,40));
   for(let i=0;i<5;i++){const a=i/5*TAU,g=new T.BoxGeometry(1.5,.22,.38);g.translate(1.78,-.39,0);g.rotateY(a);base.add(edge(g,hot))}
   for(let i=0;i<5;i++){const a=(i+.5)/5*TAU;base.add(tube(.1,.27,-.37,dim,10).translateX(Math.cos(a)*2.7).translateZ(Math.sin(a)*2.7))}
   for(let k=0;k<3;k++){const a=.9+k*.16,P=(r,y)=>new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);
     base.add(edge(new T.TubeGeometry(new T.CatmullRomCurve3([P(2.6,-.1),P(3.3,-.28),P(4.3,-.36)]),10,.08,6),cu))}}
  // (b) STATOR: 36-slot stack with silver tooth tips, dim copper windings, spoked hub with two bearings
  const sta=add(0,0);
  {const s=new T.Shape(),p=TAU/NS,Ro=3.45,Ry=2.95,tw=.5,tt=.85;
   for(let i=0;i<NS;i++){const a=i*p,pts=[[Ry,a-p*tw/2*.6],[Ro-.12,a-p*tw/2*.6],[Ro,a-p*tt/2],[Ro,a+p*tt/2],[Ro-.12,a+p*tw/2*.6],[Ry,a+p*tw/2*.6]];
     pts.forEach(([r,q],j)=>{const X=Math.cos(q)*r,Z=Math.sin(q)*r;(i||j)?s.lineTo(X,Z):s.moveTo(X,Z)})}
   s.closePath();hole(s,0,0,2.65);sta.add(edge(ext(s,2.1,.3,6),hot));
   for(let i=0;i<NS;i++){const g=new T.BoxGeometry(.34,2.4,.28);g.translate(3.15,1.35,0);g.rotateY(-i/NS*TAU);sta.add(edge(g,cu))}
   sta.add(ring(1.0,.56,2.1,.3,dim,40));sta.add(ring(2.65,2.45,2.1,.3,dim,64));
   for(let i=0;i<6;i++){const g=new T.BoxGeometry(1.5,1.4,.22);g.translate(1.75,1.35,0);g.rotateY(i/6*TAU+.26);sta.add(edge(g,dim))}
   for(const y of [.6,2.1]){sta.add(tube(.56,.34,y,hot,40));sta.add(tube(.32,.34,y,dim,24))}}
  // (a) ROTOR CAN: wall + magnets + solid top face + shaft, one unit
  const can=add(4.8,1);
  {can.add(ring(3.8,3.62,2.8,.1,hot,96));
   const p=TAU/NP;for(let i=0;i<NP;i++){const s=new T.Shape(),a0=i*p+p*.06,a1=(i+1)*p-p*.06;
     s.absarc(0,0,3.62,a0,a1,false);s.absarc(0,0,3.5,a1,a0,true);s.closePath();can.add(edge(ext(s,2.1,.3,3),dim))}
   for(let i=0;i<13;i++){const a=i/13*TAU,c=new T.EllipseCurve(0,0,.42,.15,0,TAU).getPoints(20).map(v=>new T.Vector3(v.x,v.y,0));
     const l=new T.LineLoop(new T.BufferGeometry().setFromPoints(c),hot);l.position.set(Math.cos(a)*3.815,2.5,Math.sin(a)*3.815);l.lookAt(Math.cos(a)*9,2.5,Math.sin(a)*9);can.add(l)}
   const s=new T.Shape();s.absarc(0,0,3.8,0,TAU,false);hole(s,0,0,.3);
   for(let i=0;i<6;i++){const a=i/6*TAU;hole(s,Math.cos(a)*1.15,Math.sin(a)*1.15,.09)}
   can.add(edge(ext(s,.15,2.9,64),hot));
   for(const r of [1.6,2.3,2.95,3.5])can.add(circ(r,3.056,dim));
   can.add(ring(.75,.3,.17,3.05,hot,40));
   can.add(edge(new T.CylinderGeometry(.3,.3,3.9,20).translate(0,1.5,0),dim))}
  const size=()=>{const w=host.clientWidth,h=host.clientHeight;r.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()};
  const fit=e=>{const t=Math.tan(16*Math.PI/180),hh=3.4+e*4.0,m=innerWidth<=760,hw=m?5.0:5.6;return Math.max(hh/t,hw/(t*cam.aspect))+(m?1.5+e*3:4)};
  size();addEventListener('resize',size);
  let px=0,py=0,tx=0,ty=0,run=true,raf=0,t0=performance.now();
  addEventListener('pointermove',e=>{tx=(e.clientX/innerWidth-.5);ty=(e.clientY/innerHeight-.5)},{passive:true});
  const track=host.closest('.track');
  const frame=now=>{raf=requestAnimationFrame(frame);const t=(now-t0)/1000;
    const q=location.search,p=/[?&]explode/.test(q)?1:/[?&]assembled/.test(q)?0:1-Math.min(1,Math.max(0,scrollY/Math.max(1,track.offsetHeight-innerHeight))),e=p*p*(3-2*p);
    for(const q of parts){q.o.position.y=q.ey*e;q.o.rotation.y=q.spin*t*.35}
    px+=(tx-px)*.05;py+=(ty-py)*.05;
    root.rotation.y=-.4+(1-p)*Math.PI*2+Math.sin(t*.12)*.2+px*.35;root.rotation.x=.5+py*.2;asm.position.y=-1.3-e*.9;cam.position.z=fit(e);
    r.render(s,cam)};
  new IntersectionObserver(([en])=>{run=en.isIntersecting;cancelAnimationFrame(raf);if(run)raf=requestAnimationFrame(frame)}).observe(host);
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden&&run)raf=requestAnimationFrame(frame)});
  host.classList.add('live');window.__rigReady=true;
}
