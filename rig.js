import * as T from 'three';
// Two-stage reverted spur reduction gearbox: coaxial input/output, offset countershaft.
// Module 0.12. Stage 1: 14T pinion -> 40T. Stage 2: 16T pinion -> 38T. Same center distance (3.24).
export function start(host){
  const r=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  r.setPixelRatio(Math.min(devicePixelRatio,1.5));host.appendChild(r.domElement);
  const s=new T.Scene(),cam=new T.PerspectiveCamera(32,1,.1,100);cam.position.set(0,0,19);
  const hot=new T.LineBasicMaterial({color:0xff7a1a,transparent:true,opacity:.95});
  const dim=new T.LineBasicMaterial({color:0xc2410c,transparent:true,opacity:.5});
  const root=new T.Group();s.add(root);root.rotation.set(.35,-.85,.08);
  const asm=new T.Group();asm.position.y=1.5;root.add(asm);
  const M=.12,C=3.24,parts=[];
  const edge=(g,m)=>new T.LineSegments(new T.EdgesGeometry(g,20),m);
  const add=(obj,x,y,ex=0,ey=0)=>{const o=new T.Group();o.add(obj);o.position.set(x,y,0);asm.add(o);parts.push({o,x,y,ex,ey});return o};
  const gearGeo=(z,w,bore,holes)=>{
    const rp=M*z/2,ra=rp+M,rf=rp-1.25*M,sh=new T.Shape(),p=Math.PI*2/z;
    for(let i=0;i<z;i++){const a=i*p,pts=[[rf,a],[rf,a+p*.18],[ra,a+p*.36],[ra,a+p*.64],[rf,a+p*.82]];
      pts.forEach(([rr,aa],j)=>{const X=Math.cos(aa)*rr,Y=Math.sin(aa)*rr;(i||j)?sh.lineTo(X,Y):sh.moveTo(X,Y)})}
    sh.closePath();
    const h=new T.Path();h.absarc(0,0,bore,0,Math.PI*2,true);sh.holes.push(h);
    if(holes){const rr=(bore+rf)/2,hr=(rf-bore)*.26;for(let j=0;j<6;j++){const a=j/6*Math.PI*2,c=new T.Path();c.absarc(Math.cos(a)*rr,Math.sin(a)*rr,hr,0,Math.PI*2,true);sh.holes.push(c)}}
    const g=new T.ExtrudeGeometry(sh,{depth:w,bevelEnabled:false,curveSegments:12});g.translate(0,0,-w/2);g.rotateY(Math.PI/2);return g};
  const shaft=(len,rad)=>{const g=new T.CylinderGeometry(rad,rad,len,20,1,false);g.rotateZ(Math.PI/2);return g};
  const bearing=()=>{const o=new T.Group();for(const [a,b] of [[.62,.45],[.36,.45]]){const g=new T.CylinderGeometry(a,a,b,36,1,true);g.rotateZ(Math.PI/2);o.add(edge(g,hot))}
    const t=new T.TorusGeometry(.49,.09,6,16);t.rotateY(Math.PI/2);o.add(edge(t,dim));return o};
  const gear=(z,w,bore,holes,phase)=>{const o=new T.Group(),l=edge(gearGeo(z,w,bore,holes),hot);l.rotation.x=phase;o.add(l);return o};
  // shafts: input (left, y=0), output (right, y=0), countershaft (y=-C)
  add(edge(shaft(6.2,.28),dim),-3.3,0,-2.2,0);
  add(edge(shaft(6.2,.28),dim),3.3,0,2.2,0);
  add(edge(shaft(7.6,.3),dim),0,-C,0,-1.6);
  // gears (stage 1 at x=-1.7, stage 2 at x=1.7)
  const gIn=add(gear(14,.9,.28,false,0),-1.7,0,-1.2,0);
  const gC1=add(gear(40,.8,.3,true,Math.PI/40),-1.7,-C,-1.2,-1.6);
  const gC2=add(gear(16,1.0,.3,false,0),1.7,-C,1.2,-1.6);
  const gOut=add(gear(38,.9,.28,true,Math.PI/38),1.7,0,1.2,0);
  // bearings in the housing walls and a pilot bearing between input and output
  for(const [x,y,ex,ey] of [[-3.6,0,-4.2,0],[3.6,0,4.2,0],[-3.6,-C,-4.2,-1.6],[3.6,-C,4.2,-1.6],[0,0,0,1.4]])add(bearing(),x,y,ex,ey);
  // housing walls with bores
  const wall=()=>{const sh=new T.Shape(),y0=-C-3,y1=3,zr=3.1,rc=.8;
    sh.moveTo(-zr+rc,y0);sh.lineTo(zr-rc,y0);sh.quadraticCurveTo(zr,y0,zr,y0+rc);sh.lineTo(zr,y1-rc);sh.quadraticCurveTo(zr,y1,zr-rc,y1);
    sh.lineTo(-zr+rc,y1);sh.quadraticCurveTo(-zr,y1,-zr,y1-rc);sh.lineTo(-zr,y0+rc);sh.quadraticCurveTo(-zr,y0,-zr+rc,y0);
    for(const y of [0,-C]){const h=new T.Path();h.absarc(0,y,.62,0,Math.PI*2,true);sh.holes.push(h)}
    const g=new T.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:false,curveSegments:10});g.translate(0,0,-.15);g.rotateY(Math.PI/2);
    const o=edge(g,dim);o.rotation.x=0;return o};
  const wl=wall(),wr=wall();
  add(wl,-3.85,0,-6.5,0);add(wr,3.85,0,6.5,0);
  const size=()=>{const w=host.clientWidth,h=host.clientHeight;r.setSize(w,h,false);cam.aspect=w/h;cam.position.z=w<760?32:20;cam.updateProjectionMatrix()};
  size();addEventListener('resize',size);
  let px=0,py=0,tx=0,ty=0,run=true,raf=0,t0=performance.now();
  addEventListener('pointermove',e=>{tx=(e.clientX/innerWidth-.5);ty=(e.clientY/innerHeight-.5)},{passive:true});
  const track=host.closest('.track');
  const frame=now=>{raf=requestAnimationFrame(frame);const t=(now-t0)/1000;
    const p=Math.min(1,Math.max(0,scrollY/Math.max(1,track.offsetHeight-innerHeight))),e=p*p*(3-2*p);
    for(const q of parts){q.o.position.x=q.x+q.ex*e*.8;q.o.position.y=q.y+q.ey*e*.8}
    const w=t*.9,wc=-w*14/40,wo=-wc*16/38;
    gIn.rotation.x=w;gC1.rotation.x=wc;gC2.rotation.x=wc;gOut.rotation.x=wo;
    px+=(tx-px)*.05;py+=(ty-py)*.05;
    root.rotation.y=-.85+Math.sin(t*.12)*.25+px*.35;root.rotation.x=.35+py*.25;
    r.render(s,cam)};
  new IntersectionObserver(([en])=>{run=en.isIntersecting;cancelAnimationFrame(raf);if(run)raf=requestAnimationFrame(frame)}).observe(host);
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden&&run)raf=requestAnimationFrame(frame)});
  host.classList.add('live');window.__rigReady=true;
}
