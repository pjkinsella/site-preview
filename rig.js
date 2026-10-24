import * as T from 'three';
export function start(host){
  const r=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  r.setPixelRatio(Math.min(devicePixelRatio,1.5));host.appendChild(r.domElement);
  const s=new T.Scene(),cam=new T.PerspectiveCamera(32,1,.1,100);cam.position.set(0,0,16);
  const hot=new T.LineBasicMaterial({color:0xff7a1a,transparent:true,opacity:.95});
  const dim=new T.LineBasicMaterial({color:0xc2410c,transparent:true,opacity:.55});
  const root=new T.Group();s.add(root);root.rotation.set(.35,-.85,.08);
  const parts=[];
  const add=(g,x,ex,m=hot,rot=true)=>{const l=new T.LineSegments(new T.EdgesGeometry(g,18),m);
    if(rot)l.rotation.z=Math.PI/2; const o=new T.Group();o.add(l);o.position.x=x;root.add(o);parts.push({o,x,ex});return o};
  const gear=(R,w,n)=>{const sh=new T.Shape(),k=n*2;for(let i=0;i<=k*2;i++){const a=i/(k*2)*Math.PI*2,rr=(i%4<2)?R:R*.86;i?sh.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):sh.moveTo(rr,0)}
    const h=new T.Path();h.absarc(0,0,R*.3,0,Math.PI*2,true);sh.holes.push(h);
    for(let j=0;j<5;j++){const a=j/5*Math.PI*2,c=new T.Path();c.absarc(Math.cos(a)*R*.58,Math.sin(a)*R*.58,R*.12,0,Math.PI*2,true);sh.holes.push(c)}
    const g=new T.ExtrudeGeometry(sh,{depth:w,bevelEnabled:false,curveSegments:10});g.translate(0,0,-w/2);g.rotateY(Math.PI/2);return g};
  const cyl=(a,b,h,seg=40,open=false)=>new T.CylinderGeometry(a,b,h,seg,1,open);
  // shaft
  add(cyl(.32,.32,13,24),0,0,dim);
  // gears
  const g1=add(gear(2.3,.7,28),-1.2,-2.2,hot,false), g2=add(gear(1.55,.6,20),1.4,1.6,hot,false), g3=add(gear(1,.5,14),3.2,3.6,hot,false);
  // bearings (outer/inner race + balls ring)
  for(const [x,ex] of [[-3.4,-4.8],[4.6,5.6]]){const o=add(cyl(.95,.95,.45,40,true),x,ex);
    const inr=new T.LineSegments(new T.EdgesGeometry(cyl(.5,.5,.45,32,true)),hot);inr.rotation.z=Math.PI/2;o.add(inr);
    const ring=new T.LineSegments(new T.EdgesGeometry(new T.TorusGeometry(.72,.14,6,18)),dim);ring.rotation.y=Math.PI/2;o.add(ring)}
  // housing halves
  add(cyl(2.9,2.9,3.2,48,true),-.9,-7,dim); add(cyl(2.9,2.2,1.4,48,true),2.6,7.5,dim);
  add(cyl(3.1,3.1,.25,48),-2.6,-9,dim); add(cyl(2.3,2.3,.25,48),3.4,9.5,dim);
  const size=()=>{const w=host.clientWidth,h=host.clientHeight;r.setSize(w,h,false);cam.aspect=w/h;cam.position.z=w<760?30:19;cam.updateProjectionMatrix()};
  size();addEventListener('resize',size);
  let px=0,py=0,tx=0,ty=0,run=true,raf=0,t0=performance.now();
  addEventListener('pointermove',e=>{tx=(e.clientX/innerWidth-.5);ty=(e.clientY/innerHeight-.5)},{passive:true});
  const track=host.closest('.track');
  const frame=now=>{raf=requestAnimationFrame(frame);const t=(now-t0)/1000;
    const p=Math.min(1,Math.max(0,scrollY/Math.max(1,track.offsetHeight-innerHeight))),e=p*p*(3-2*p);
    for(const q of parts)q.o.position.x=q.x+q.ex*e*.9;
    g1.rotation.x=t*.5;g2.rotation.x=-t*.74;g3.rotation.x=t*1.15;
    px+=(tx-px)*.05;py+=(ty-py)*.05;
    root.rotation.y=-.85+t*.06+px*.35;root.rotation.x=.35+py*.25;
    r.render(s,cam)};
  new IntersectionObserver(([en])=>{run=en.isIntersecting;cancelAnimationFrame(raf);if(run)raf=requestAnimationFrame(frame)}).observe(host);
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden&&run)raf=requestAnimationFrame(frame)});
  host.classList.add('live');window.__rigReady=true;
}
