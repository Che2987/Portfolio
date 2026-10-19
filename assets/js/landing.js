(() => {
'use strict';
const $ = s => document.querySelector(s);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================= CUBE DATA ================= */
const C = {r:'var(--red)',b:'var(--blue)',y:'var(--yellow)',w:'var(--white)',o:'var(--orange)',g:'var(--green)',k:'var(--ink)'};
const FRONT = [
  ['P','r','y'],['O','w','r'],['R','y','r'],
  ['T','b','w'],['F','r','w'],['O','y','b'],
  ['L','w','b'],['I','b','y'],['O','r','w']];
const TOP = [
  ['C','w','r'],['H','b','w'],['E','y','k'],
  ['T','r','y'],['H','w','b'],['N','r','w'],
  ['A','y','r'],['✦','b','y'],['✦','w','k']];
const RIGHT = [
  ['U','y','b'],['X','r','w'],['✦','b','y'],
  ['D','w','r'],['E','y','k'],['S','b','w'],
  ['I','r','y'],['G','w','b'],['N','y','r']];
const stickerFor = (face,x,y,z) => ({
  front:  z ===  1 ? FRONT[(y+1)*3+(x+1)] : null,
  top:    y === -1 ? TOP[(z+1)*3+(x+1)]   : null,
  right:  x ===  1 ? RIGHT[(y+1)*3+(1-z)] : null,
  back:   z === -1 ? ['','o','k'] : null,
  left:   x === -1 ? ['','g','k'] : null,
  bottom: y ===  1 ? ['','y','k'] : null
})[face];

/*MATH-START*/
const mul = (A,B) => { const R = new Array(16).fill(0);
  for (let r=0;r<4;r++) for (let c=0;c<4;c++) for (let k=0;k<4;k++) R[r*4+c] += A[r*4+k]*B[k*4+c];
  return R; };
function rot(axis,deg){
  const t = deg*Math.PI/180, c = Math.cos(t), s = Math.sin(t);
  if (axis==='x') return [1,0,0,0, 0,c,-s,0, 0,s,c,0, 0,0,0,1];
  if (axis==='y') return [c,0,s,0, 0,1,0,0, -s,0,c,0, 0,0,0,1];
  return [c,-s,0,0, s,c,0,0, 0,0,1,0, 0,0,0,1];
}
const toCss = (M,px) => `matrix3d(${[
  M[0],M[4],M[8],M[12], M[1],M[5],M[9],M[13], M[2],M[6],M[10],M[14],
  M[3]*px,M[7]*px,M[11]*px,M[15]].join(',')})`;
const snap = M => M.map(v => Math.round(v)+0);
const axisIdx = {x:3,y:7,z:11};
/*MATH-END*/

/* ================= BUILD CUBE ================= */
const FACES = ['front','back','right','left','top','bottom'];
const stage = $('#stage'), cubeEl = $('#cube'), probe = $('#probe');
const cubies = [];
for (let x=-1;x<=1;x++) for (let y=-1;y<=1;y++) for (let z=-1;z<=1;z++){
  if (!x && !y && !z) continue;
  const el = document.createElement('div');
  el.className = 'cubie';
  FACES.forEach(f => {
    const face = document.createElement('div');
    face.className = 'face f-'+f;
    const st = stickerFor(f,x,y,z);
    if (st){
      const s = document.createElement('div');
      s.className = 'sticker' + (st[0]==='✦' ? ' star' : '');
      s.textContent = st[0];
      s.style.background = C[st[1]];
      s.style.color = C[st[2]];
      if (f==='front') s.style.setProperty('--i', (y+1)*3+(x+1));
      face.appendChild(s);
    }
    el.appendChild(face);
  });
  cubeEl.appendChild(el);
  cubies.push({el, M:[1,0,0,x, 0,1,0,y, 0,0,1,z, 0,0,0,1]});
}
let px = 70;
function render(){ cubies.forEach(c => c.el.style.transform = toCss(c.M,px)); }
function measure(){ px = probe.getBoundingClientRect().width || px; render(); }
measure();
addEventListener('resize', measure);

/* ================= TURNS ================= */
function turn(move, ms){
  const sel = cubies.filter(c => Math.round(c.M[axisIdx[move.axis]]) === move.layer);
  return new Promise(done => {
    const t0 = performance.now();
    (function frame(now){
      const p = Math.min(1, Math.max(0,(now - t0)/ms));
      const e = p < .5 ? 4*p*p*p : 1 - Math.pow(-2*p+2,3)/2;
      const R = rot(move.axis, move.dir*90*e);
      sel.forEach(c => c.el.style.transform = toCss(mul(R,c.M),px));
      if (p < 1) return requestAnimationFrame(frame);
      const Rf = rot(move.axis, move.dir*90);
      sel.forEach(c => { c.M = snap(mul(Rf,c.M)); c.el.style.transform = toCss(c.M,px); });
      done();
    })(t0);
  });
}
const AXES = ['x','y','z'];
function randomMove(prev){
  let m;
  do { m = {axis:AXES[Math.floor(Math.random()*3)], layer:Math.floor(Math.random()*3)-1, dir:Math.random()<.5?1:-1}; }
  while (prev && prev.axis===m.axis && prev.layer===m.layer);
  return m;
}

/* ================= UI STATE ================= */
const pzState = $('#pzState'), pzDetail = $('#pzDetail'), pzBar = $('#pzBar'), chipText = $('#chipText');
const pad = n => String(n).padStart(2,'0');
function setState(s,i){
  document.body.dataset.state = s;
  let title, detail, pct;
  if (s==='solved'){ title='Solved'; detail='PORTFOLIO'; pct=100; }
  else if (s==='scrambling'){ title='Scrambling'; detail=`move ${pad(i)} of 14`; pct=(1-i/14)*100; }
  else if (s==='thinking'){ title='Thinking…'; detail='planning the solve'; pct=0; }
  else { title='Solving'; detail=`move ${pad(i)} of 14`; pct=i/14*100; }
  pzState.textContent = title; pzDetail.textContent = detail;
  pzBar.style.width = pct+'%';
  pzBar.style.setProperty('--bw', pct>0 ? (10000/pct)+'%' : '100%');
  chipText.textContent = s==='solved' ? 'Solved · PORTFOLIO' : `${title} · ${detail}`;
  if (s==='solved') stage.classList.add('solved'); else stage.classList.remove('solved');
}

/* ================= LOOP ================= */
let skipWait = null;
const sleep = ms => new Promise(r => setTimeout(r,ms));
const hold = ms => new Promise(r => {
  const id = setTimeout(done, ms);
  function done(){ clearTimeout(id); skipWait = null; r(); }
  skipWait = done;
});
async function run(){
  try { await document.fonts.ready; } catch(e){}
  measure();
  let first = true;
  while (true){
    setState('solved');
    await hold(first ? 4500 : 3200); first = false;
    stage.classList.remove('solved');
    const history = [];
    for (let i=1;i<=14;i++){
      const m = randomMove(history[history.length-1]);
      history.push(m); setState('scrambling',i); await turn(m,300);
    }
    setState('thinking'); await sleep(900);
    for (let j=1;j<=14;j++){
      const m = history[14-j];
      setState('solving',j); await turn({axis:m.axis,layer:m.layer,dir:-m.dir},480); await sleep(70);
    }
  }
}
['#scrambleBtn','#scrambleBtn2'].forEach(s => $(s).addEventListener('click', () => { if (skipWait) skipWait(); }));

/* ================= ORBIT ================= */
const BASE = {x:-24,y:-36};
let offX=0, offY=0, velX=0, velY=0, dragging=false, lx=0, ly=0;
const wrap180 = v => ((v+180)%360+360)%360-180;
function applyOrbit(sx,sy){ cubeEl.style.transform = `rotateX(${BASE.x+offX+sx}deg) rotateY(${BASE.y+offY+sy}deg)`; }
if (reduceMotion){
  applyOrbit(0,0);
  setState('solved');
} else {
  stage.addEventListener('pointerdown', e => { dragging=true; stage.classList.add('drag'); lx=e.clientX; ly=e.clientY; velX=velY=0; try{stage.setPointerCapture(e.pointerId);}catch(_){} });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx=e.clientX-lx, dy=e.clientY-ly; lx=e.clientX; ly=e.clientY;
    velY = dx*.4; velX = -dy*.4;
    offY += velY; offX += velX;
  });
  const end = () => { dragging=false; stage.classList.remove('drag'); };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  (function orbit(t){
    if (!dragging){
      offX += velX; offY += velY; velX *= .92; velY *= .92;
      offX = wrap180(offX); offY = wrap180(offY);
      offX += (0-offX)*.04; offY += (0-offY)*.04;
    }
    applyOrbit(Math.sin(t*.0006)*5, Math.sin(t*.0009)*12);
    requestAnimationFrame(orbit);
  })(0);
  run();
}

/* ================= SKILLS BAND ================= */
const PAL = [['var(--red)','#fff'],['var(--yellow)','var(--ink)'],['var(--blue)','#fff'],['var(--green)','#fff'],
  ['var(--orange)','var(--ink)'],['#FF8FC8','var(--ink)'],['#A98BFF','var(--ink)'],['#fff','var(--ink)']];
const ROW1 = ['Heuristic evaluation','Competitive benchmarking','User interviews','Information architecture','Edge-case design','Accessibility','Search & booking flows','Access control'];
const ROW2 = ['Personas & journeys','Affinity mapping','Design systems','Prototyping','Email templates','Mobile & desktop','AI disclosure patterns','Figma'];
function fillRow(id, items, offset){
  const row = $(id);
  items.forEach((t,i) => {
    const p = document.createElement('span'); p.className='pill'; p.textContent=t;
    const c = PAL[(i+offset)%PAL.length]; p.style.background=c[0]; p.style.color=c[1];
    row.appendChild(p);
  });
  [...row.children].forEach(n => { const c = n.cloneNode(true); c.setAttribute('aria-hidden','true'); row.appendChild(c); });
}
fillRow('#row1', ROW1, 0);
fillRow('#row2', ROW2, 4);

/* ================= WORK TILES ================= */
const TC = {r:'var(--red)',b:'var(--blue)',y:'var(--yellow)',w:'var(--white)'};
document.querySelectorAll('.tiles').forEach(g => {
  g.dataset.t.replace(/\s/g,'').split('').forEach(k => { const i=document.createElement('i'); i.style.background=TC[k]; g.appendChild(i); });
});

/* ================= REVEAL ================= */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), {threshold:.12});
document.querySelectorAll('.rv').forEach(el => io.observe(el));
})();

/* Seamless one-direction logo loop: clone the logo group until the track is wider than the viewport,
   then slide by exactly one group's width so the restart is invisible. */
(function(){
  var track=document.querySelector('.ctrack'); if(!track) return;
  var base=track.querySelector('.cgrp'); if(!base) return;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  var SPEED=60; /* px per second */
  function build(){
    track.classList.remove('ready');
    Array.prototype.forEach.call(track.querySelectorAll('.cgrp.clone'),function(n){n.remove();});
    base.style.width='';
    if(reduce.matches) return;
    var w=base.getBoundingClientRect().width; if(!w) return;
    w=Math.ceil(w); base.style.width=w+'px'; /* whole pixels so every copy lines up exactly */
    var need=Math.ceil(window.innerWidth/w);
    for(var i=0;i<need;i++){
      var c=base.cloneNode(true); c.classList.add('clone'); c.setAttribute('aria-hidden','true');
      Array.prototype.forEach.call(c.querySelectorAll('img'),function(im){im.alt='';});
      track.appendChild(c);
    }
    track.style.setProperty('--shift',w+'px');
    track.style.setProperty('--dur',(w/SPEED)+'s');
    track.classList.add('ready');
  }
  var imgs=Array.prototype.slice.call(base.querySelectorAll('img'));
  Promise.all(imgs.map(function(im){
    return im.complete?Promise.resolve():new Promise(function(r){im.onload=im.onerror=r;});
  })).then(build);
  var t; window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(build,200);});
})();
