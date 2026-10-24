import * as T from 'three';
// Hobbywing HM 13842-class heavy-lift outrunner BLDC: 36N40P, exploded along the shaft on scroll.
export function start(host){
  const r=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  r.setPixelRatio(Math.min(devicePixelRatio,1.5));host.appendChild(r.domElement);
  const s=new T.Scene(),cam=new T.PerspectiveCamera(32,1,.1,100);cam.position.set(0,0,19);
  const hot=new T.LineBasicMaterial({color:0xff7a1a,transparent:true,opacity:.95});
  const dim=new T.LineBasicMaterial({color:0xc2410c,transparent:true,opacity:.5});
  const cu=new T.LineBasicMaterial({color:0xffb347,transparent:true,opacity:.45});
  const root=new T.Group();s.add(root);root.rotation.set(.5,-.4,0);
  const asm=new T.Group();asm.position.y=1.5;root.add(asm);
  // Hobbywing HM 13842-class outrunner. Scale 1u = 20mm. Axis = +Y.
  // Stator 138mm dia x 42mm stack, 36 slots; rotor 40 poles (arc magnets), OD ~152mm, air gap ~1mm.
  asm.position.y=-1.5;
  const parts=[],TAU=Math.PI*2,Y=new T.Vector3(0,1,0);
  const edge=(g,m)=>new T.LineSegments(new T.EdgesGeometry(g,20),m);
  const add=(ey,spin)=>{const o=new T.Group();asm.add(o);parts.push({o,ey,spin});return o};
  const ext=(sh,d,y0,seg=24)=>{const g=new T.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false,curveSegments:seg});g.rotateX(-Math.PI/2);g.translate(0,y0,0);return g};
  const hole=(sh,x,z,r)=>{const h=new T.Path();h.absarc(x,-z,r,0,TAU,true);sh.holes.push(h)};
  const ring=(ro,ri,h,y0,m,seg=64)=>{const s=new T.Shape();s.absarc(0,0,ro,0,TAU,false);hole(s,0,0,ri);return edge(ext(s,h,y0,seg),m)};
  const tube=(r,h,y,m,seg=48)=>edge(new T.CylinderGeometry(r,r,h,seg,1,true).translate(0,y,0),m);
  const NS=36,NP=40;
  // BASE: spoked mount, bearing housing, outer ring with mount holes
  const base=add(-3.2,0);
  {const s=new T.Shape();s.absarc(0,0,2.75,0,TAU,false);hole(s,0,0,2.35);base.add(edge(ext(s,.3,-.35),hot));
   const hub=new T.Shape();hub.absarc(0,0,1.0,0,TAU,false);hole(hub,0,0,.56);base.add(edge(ext(hub,.55,-.35),hot));
   for(let i=0;i<5;i++){const a=i/5*TAU,g=new T.BoxGeometry(1.45,.22,.34);g.translate(1.68,-.24,0);g.rotateY(a);base.add(edge(g,hot))}
   for(let i=0;i<5;i++){const a=(i+.5)/5*TAU;base.add(tube(.09,.32,-.19,dim,10).translateX(Math.cos(a)*2.55).translateZ(Math.sin(a)*2.55))}
   base.add(ring(.56,.3,.12,-.47,dim,24))} // M8 shaft-end retainer
  // BEARINGS: two thin-wall bearings on the shaft, inside stator hub
  const brg=add(-2.1,0);
  for(const y of [.55,1.85]){brg.add(tube(.56,.36,y,hot,40));brg.add(tube(.3,.36,y,dim,24));
    const t=new T.TorusGeometry(.43,.06,5,18);t.rotateX(Math.PI/2);t.translate(0,y,0);brg.add(edge(t,dim))}
  // STATOR: 36-slot lamination stack, copper winding blocks, spoked inner hub, phase leads
  const sta=add(-.9,0);
  {const s=new T.Shape(),p=TAU/NS,Ro=3.45,Ry=2.95,tw=.5,tt=.85;
   for(let i=0;i<NS;i++){const a=i*p,pts=[[Ry,a-p*.5+p*(1-tw)/2*0],[Ry,a-p*tw/2*.6],[Ro-.12,a-p*tw/2*.6],[Ro,a-p*tt/2],[Ro,a+p*tt/2],[Ro-.12,a+p*tw/2*.6],[Ry,a+p*tw/2*.6]];
     pts.forEach(([r,q],j)=>{const X=Math.cos(q)*r,Z=Math.sin(q)*r;(i||j)?s.lineTo(X,Z):s.moveTo(X,Z)})}
   s.closePath();hole(s,0,0,2.65);sta.add(edge(ext(s,2.1,.25,6),hot));
   for(let i=0;i<NS;i++){const g=new T.BoxGeometry(.36,2.4,.3);g.translate(3.18,1.3,0);g.rotateY(-i/NS*TAU);sta.add(edge(g,cu))}
   sta.add(ring(1.0,.56,1.9,.35,dim,40));
   for(let i=0;i<6;i++){const g=new T.BoxGeometry(1.7,1.6,.22);g.translate(1.8,1.3,0);g.rotateY(i/6*TAU+.26);sta.add(edge(g,dim))}
   for(let k=0;k<3;k++){const a=-.5+k*.18,c=new T.CatmullRomCurve3([new T.Vector3(Math.cos(a)*3.1,.2,Math.sin(a)*3.1),new T.Vector3(Math.cos(a)*4.0,-.05,Math.sin(a)*4.0),new T.Vector3(Math.cos(a)*5.4,-.15,Math.sin(a)*5.4)]);
     sta.add(edge(new T.TubeGeometry(c,8,.07,6),cu))}}
  // MAGNET RING: 40 thin arc magnets bonded inside can wall; gap to stator ~0.05u (1mm)
  const mag=add(.4,1);
  {const p=TAU/NP;for(let i=0;i<NP;i++){const s=new T.Shape(),a0=i*p+p*.06,a1=(i+1)*p-p*.06;
     s.absarc(0,0,3.62,a0,a1,false);s.absarc(0,0,3.5,a1,a0,true);s.closePath();mag.add(edge(ext(s,2.0,.3,3),i%2?hot:dim))}}
  // ROTOR CAN: steel bell wall with ventilation slots ringing upper edge, plus shaft
  const can=add(1.6,1);
  {can.add(ring(3.8,3.62,2.55,.15,hot,72));
   for(let i=0;i<24;i++){const a=i/24*TAU,c=new T.EllipseCurve(0,0,.2,.09,0,TAU).getPoints(14).map(v=>new T.Vector3(v.x,v.y,0));
     const l=new T.LineLoop(new T.BufferGeometry().setFromPoints(c),dim);l.position.set(Math.cos(a)*3.81,2.42,Math.sin(a)*3.81);l.lookAt(Math.cos(a)*9,2.42,Math.sin(a)*9);can.add(l)}
   can.add(edge(new T.CylinderGeometry(.3,.3,3.9,20).translate(0,1.0,0),dim))}
  // TOP CAP: flat face, oval slot ring, 6-hole bolt circle, center shaft boss
  const cap=add(2.9,1);
  {const s=new T.Shape();s.absarc(0,0,3.8,0,TAU,false);hole(s,0,0,.3);
   for(let i=0;i<18;i++){const a=i/18*TAU,h=new T.Path(),cx=Math.cos(a)*2.85,cz=Math.sin(a)*2.85;h.absellipse(cx,-cz,.5,.2,0,TAU,true,-a);s.holes.push(h)}
   for(let i=0;i<6;i++){const a=i/6*TAU;hole(s,Math.cos(a)*1.25,Math.sin(a)*1.25,.11)}
   cap.add(edge(ext(s,.16,2.7,48),hot));cap.add(ring(.75,.3,.3,2.86,hot,40))}
  const size=()=>{const w=host.clientWidth,h=host.clientHeight;r.setSize(w,h,false);cam.aspect=w/h;cam.position.z=w<760?42:27;cam.updateProjectionMatrix()};
  size();addEventListener('resize',size);
  let px=0,py=0,tx=0,ty=0,run=true,raf=0,t0=performance.now();
  addEventListener('pointermove',e=>{tx=(e.clientX/innerWidth-.5);ty=(e.clientY/innerHeight-.5)},{passive:true});
  const track=host.closest('.track');
  const frame=now=>{raf=requestAnimationFrame(frame);const t=(now-t0)/1000;
    const p=/[?&]explode/.test(location.search)?1:Math.min(1,Math.max(0,scrollY/Math.max(1,track.offsetHeight-innerHeight))),e=p*p*(3-2*p);
    for(const q of parts){q.o.position.y=q.ey*e;q.o.rotation.y=q.spin*t*.35}
    px+=(tx-px)*.05;py+=(ty-py)*.05;
    root.rotation.y=-.4+Math.sin(t*.12)*.2+px*.35;root.rotation.x=.5+py*.2;asm.position.y=(innerWidth<760?-1.2:-2.6)-e*.2;
    r.render(s,cam)};
  new IntersectionObserver(([en])=>{run=en.isIntersecting;cancelAnimationFrame(raf);if(run)raf=requestAnimationFrame(frame)}).observe(host);
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden&&run)raf=requestAnimationFrame(frame)});
  host.classList.add('live');window.__rigReady=true;
}
