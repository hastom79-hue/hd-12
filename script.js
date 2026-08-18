'use strict';
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(pointer:fine)').matches;

const sections=$$('main section[id]');
const bookmarks=$$('.bookmark');
const navLinks=$$('.topnav a');
const progress=$('#progress');
const backtop=$('#backtop');
const topbar=$('.topbar');

bookmarks.forEach(btn=>btn.addEventListener('click',()=>{
  const id=btn.dataset.target;
  const target=id==='top'?$('#top'):$('#'+id);
  target?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
}));
backtop?.addEventListener('click',()=>scrollTo({top:0,behavior:reduced?'auto':'smooth'}));

function updateScrollUI(){
  const max=document.documentElement.scrollHeight-innerHeight;
  if(progress) progress.style.width=(max?scrollY/max*100:0)+'%';
  backtop?.classList.toggle('show',scrollY>500);
  topbar?.classList.toggle('scrolled',scrollY>30);
  let current='top';
  sections.forEach(s=>{if(scrollY+innerHeight*.38>=s.offsetTop) current=s.id});
  bookmarks.forEach(b=>b.classList.toggle('active',b.dataset.target===current));
  navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+current));
}
addEventListener('scroll',updateScrollUI,{passive:true}); updateScrollUI();

const revealItems=$$('.reveal');
if('IntersectionObserver' in window && !reduced){
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}
  }),{threshold:.12,rootMargin:'0px 0px -5%'});
  revealItems.forEach(el=>io.observe(el));
}else revealItems.forEach(el=>el.classList.add('in'));

const steps=$$('.step');
if('IntersectionObserver' in window && !reduced){
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('active');io.unobserve(e.target)}
  }),{threshold:.4}); steps.forEach(el=>io.observe(el));
}else steps.forEach(el=>el.classList.add('active'));

/* Framework relationship animation + linked module highlight */
const frameworkShell=$('.framework-shell'), symbol=$('.hdps-symbol');
if(symbol && !$('.con-top',symbol)){
  const line=document.createElement('span'); line.className='framework-connector con-top'; line.setAttribute('aria-hidden','true'); symbol.prepend(line);
}
const hexes=$$('.framework-shell .hex'), groupCards=$$('.module-card');
const lineMap={team:'.con-top',q:'.con-top-left',j:'.con-top-right',ci:'.con-mid-left',o:'.con-mid-right',bottom:'.con-bottom'};
const cardMap={team:0,bottom:1,q:2,o:3,ci:4,j:5};
const keyOf=h=>Object.keys(lineMap).find(k=>h.classList.contains(k));
function frameworkFocus(hex,on){
  const key=keyOf(hex); if(!key) return;
  const linked=groupCards[cardMap[key]], line=$(lineMap[key],symbol);
  hexes.forEach(h=>{h.classList.toggle('focused',on&&h===hex);h.classList.toggle('dimmed',on&&h!==hex)});
  groupCards.forEach(c=>{c.classList.toggle('linked-active',on&&c===linked);c.classList.toggle('linked-dim',on&&c!==linked)});
  line?.classList.toggle('line-active',on);
}
hexes.forEach(h=>{
  h.tabIndex=0;
  h.addEventListener('mouseenter',()=>frameworkFocus(h,true)); h.addEventListener('mouseleave',()=>frameworkFocus(h,false));
  h.addEventListener('focus',()=>frameworkFocus(h,true)); h.addEventListener('blur',()=>frameworkFocus(h,false));
});
if(frameworkShell){
  if('IntersectionObserver' in window && !reduced){
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){frameworkShell.classList.add('framework-active');io.disconnect()}}),{threshold:.3});io.observe(frameworkShell);
  }else frameworkShell.classList.add('framework-active');
}

/* Group cards jump to matching board card */
const boardCards=$$('.board-card');
groupCards.forEach((card,i)=>{
  card.tabIndex=0; card.setAttribute('role','button');
  const go=()=>{boardCards[i]?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});boardCards[i]?.classList.add('board-focus');setTimeout(()=>boardCards[i]?.classList.remove('board-focus'),1200)};
  card.addEventListener('click',go); card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}});
});

/* Board-game style card: tilt + light sweep */
if(fine&&!reduced){
  boardCards.forEach(card=>{
    card.addEventListener('pointerenter',()=>{card.classList.remove('is-glint');void card.offsetWidth;card.classList.add('is-glint','board-focus')});
    card.addEventListener('pointermove',e=>{
      const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
      card.style.transform=`translateY(-14px) rotateX(${-y*6.5}deg) rotateY(${x*8}deg) scale(1.025)`;
    });
    card.addEventListener('pointerleave',()=>{card.style.transform='';card.classList.remove('is-glint','board-focus')});
  });
}

/* LEAN impact cards: spotlight, tilt, focus/dim */
const principles=$$('.principle-impact');
if(fine&&!reduced){
  principles.forEach(card=>{
    card.addEventListener('pointerenter',()=>{principles.forEach(c=>c.classList.toggle('principle-dim',c!==card));card.classList.add('principle-focus')});
    card.addEventListener('pointermove',e=>{
      const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
      card.style.setProperty('--mx',`${x*100}%`);card.style.setProperty('--my',`${y*100}%`);
      card.style.transform=`translateY(-12px) rotateX(${(.5-y)*5.5}deg) rotateY(${(x-.5)*7}deg) scale(1.015)`;
    });
    card.addEventListener('pointerleave',()=>{card.style.transform='';card.style.setProperty('--mx','50%');card.style.setProperty('--my','50%');principles.forEach(c=>c.classList.remove('principle-dim','principle-focus'))});
  });
}

/* Deal cards onto the board: staggered entrance for module & LEAN card grids */
[$('.board-deck'),$('.principle-impact-grid')].forEach(group=>{
  if(!group) return;
  const cards=$$('.card-deal',group);
  if(!cards.length) return;
  const deal=()=>cards.forEach((c,i)=>setTimeout(()=>{
    c.classList.add('in');
    const settle=ev=>{ if(ev && ev.propertyName!=='transform') return; c.classList.add('dealt'); c.removeEventListener('transitionend',settle); };
    c.addEventListener('transitionend',settle);
    setTimeout(()=>settle(),900);
  },reduced?0:i*95));
  if('IntersectionObserver' in window && !reduced){
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){deal();io.disconnect()}}),{threshold:.12});
    io.observe(group);
  }else deal();
});

/* Target pyramid: build from FIELD upward, then pulse support and DAILY loop */
const target=$('.target-impact'), levels=$$('.value-pyramid .pyramid-level');
function activateTarget(){
  target?.classList.add('target-live');
  levels.slice().reverse().forEach((level,i)=>setTimeout(()=>{
    level.classList.add('is-visible','is-pulse');setTimeout(()=>level.classList.remove('is-pulse'),850);
  },reduced?0:i*210));
  setTimeout(()=>$('.level-tags')?.classList.add('is-visible'),reduced?0:210+320);
}
if(target){
  if('IntersectionObserver' in window&&!reduced){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){activateTarget();io.disconnect()}}),{threshold:.23});io.observe(target)} else activateTarget();
}
if(fine&&!reduced){
  const pyramid=$('.value-pyramid');
  $('.value-pyramid-wrap')?.addEventListener('pointermove',e=>{
    const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    if(pyramid)pyramid.style.transform=`rotateX(${-y*2.2}deg) rotateY(${x*2.7}deg)`;
  });
  $('.value-pyramid-wrap')?.addEventListener('pointerleave',()=>{if(pyramid)pyramid.style.transform=''});
}

/* Pyramid level: big emphasis on hover proximity */
if(fine&&!reduced){
  const pyramidEl=$('.value-pyramid');
  levels.forEach(level=>{
    level.addEventListener('pointerenter',()=>{
      pyramidEl?.classList.add('has-hover');
      level.classList.add('level-hover');
    });
    level.addEventListener('pointerleave',()=>{
      pyramidEl?.classList.remove('has-hover');
      level.classList.remove('level-hover');
    });
  });
}

/* =========================================================
   ACTION — sequential rise + focus interaction
   ========================================================= */
(()=>{
  const action=document.querySelector('.action');
  const actionSteps=[...document.querySelectorAll('.action-step')];
  const mantraPhases=[...document.querySelectorAll('.mantra-phase')];
  if(!action || !actionSteps.length) return;

  let started=false;
  const activate=()=>{
    if(started) return;
    started=true;
    action.classList.add('action-live');
    mantraPhases.forEach((phase,i)=>setTimeout(()=>phase.classList.add('on'),reduced?0:120+i*160));
    const stepsStart=120+mantraPhases.length*160+280;
    actionSteps.forEach((step,i)=>setTimeout(()=>step.classList.add('action-on'),stepsStart+i*190));
  };

  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){activate();io.disconnect();}});
    },{threshold:.24});
    io.observe(action);
  }else activate();

  actionSteps.forEach(step=>{
    step.addEventListener('pointerenter',()=>{
      actionSteps.forEach(x=>x.classList.toggle('action-muted',x!==step));
      step.classList.add('action-focus');
    });
    step.addEventListener('pointerleave',()=>{
      actionSteps.forEach(x=>x.classList.remove('action-muted','action-focus'));
    });
  });
})();

/* Final mindset emphasis: support is an active force, not a side note */
(()=>{
  const target=document.querySelector('.target-impact');
  const supportHero=document.querySelector('.support-hero');
  const supportLevel=document.querySelector('.support-level');
  if(!target) return;
  const energize=()=>{
    target.classList.add('support-live');
    supportHero?.classList.add('support-on');
    setTimeout(()=>supportLevel?.classList.add('is-pulse'),780);
  };
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){energize();io.disconnect()}}),{threshold:.2});
    io.observe(target);
  }else energize();
})();



/* Professional module SVG icons — visual only; labels/content unchanged */
(()=>{
  const paths=['<circle cx="12" cy="7" r="3"/><path d="M5 20c.6-4 3-6 7-6s6.4 2 7 6"/><path d="M18 5l.7 1.5L20 7l-1.3 1 .4 1.7L18 8.8l-1.4.9.4-1.7-1.3-1 1.7-.5z"/>','<path d="M12 3l7 3v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6z"/><path d="M9 14c3.5 0 5.5-2 6-5-3 .2-5.5 1.5-6 5z"/><path d="M9 14l4-3"/>','<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"/><path d="M15 9l4-4"/>','<path d="M4 15V9l11-4v14L4 15z"/><path d="M15 9h3l2-2M18 7h2v2"/><path d="M6 15l1 5h3l-1-4"/>','<circle cx="7" cy="8" r="2.5"/><circle cx="17" cy="8" r="2.5"/><path d="M2.5 18c.5-3 2-5 4.5-5s4 2 4.5 5M12.5 18c.5-3 2-5 4.5-5s4 2 4.5 5"/><path d="M9 6h6M10 4L8 6l2 2M14 4l2 2-2 2"/>','<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M8 9h8M8 13h5M8 17h4"/><path d="M15 16l1.5 1.5L20 14"/>','<path d="M12 3l7 3v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6z"/><path d="M8.5 12l2.2 2.2L16 9"/>','<rect x="4" y="4" width="12" height="16" rx="2"/><path d="M8 4V2h4v2M7 9h6M7 13h4"/><circle cx="17" cy="16" r="3"/><path d="M19.2 18.2L22 21"/>','<circle cx="12" cy="12" r="9"/><text x="12" y="15" text-anchor="middle" font-size="8" font-weight="800" fill="currentColor" stroke="none">5S</text>','<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h5M9 12h6M9 16h6"/><path d="M8 8l1 1 2-2"/>','<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/><circle cx="12" cy="12" r="7"/>','<path d="M3 18h18M5 15l4-4 3 2 6-7"/><path d="M16 6h2v2"/>','<path d="M4 18V12h4v6M10 18V9h4v9M16 18V5h4v13"/><path d="M4 8l5-4 4 2 6-4"/><path d="M17 2h2v2"/>','<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L21 21M8 10h4M10 8v4"/>','<path d="M3 6h6l2 3h10M21 9l-2-2M21 9l-2 2"/><path d="M21 18h-6l-2-3H3M3 15l2-2M3 15l2 2"/>','<path d="M20 7a8 8 0 0 0-14-2L4 7"/><path d="M4 3v4h4M4 17a8 8 0 0 0 14 2l2-2"/><path d="M20 21v-4h-4"/>','<path d="M4 7l8-4 8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/>','<path d="M12 3v18M6 6h12M8 6l-4 8h8zM16 6l-4 8h8zM8 21h8"/>','<path d="M5 7h14l-1 9H7zM8 20h.01M17 20h.01"/><path d="M12 2v8M9 7l3 3 3-3"/>'];
  const pills=$$('.module-card li');
  pills.forEach((el,i)=>{
    if(i>=paths.length || el.querySelector(':scope > .module-svg-icon')) return;
    const icon=document.createElement('span');
    icon.className='module-svg-icon';
    icon.setAttribute('aria-hidden','true');
    icon.innerHTML=`<svg viewBox="0 0 24 24" focusable="false">${paths[i]}</svg>`;
    el.prepend(icon);
  });
})();


/* RELEASE FINAL — size Daily Action by real layout width, never by transform */
(()=>{
  const fit=()=>{
    document.querySelectorAll('.action-mantra').forEach(box=>{
      const flow=box.querySelector('.mantra-flow');
      if(!flow) return;
      const mobile=window.innerWidth<=760;
      let phase=mobile?18:32, arrow=mobile?14:25, gap=mobile?7:16;
      flow.style.setProperty('--phase-size',phase+'px');
      flow.style.setProperty('--arrow-size',arrow+'px');
      flow.style.setProperty('--flow-gap',gap+'px');
      const available=flow.clientWidth;
      let natural=flow.scrollWidth;
      if(natural>available && available>0){
        const ratio=Math.max(.56,Math.min(1,available/natural));
        phase*=ratio; arrow*=ratio; gap*=ratio;
        flow.style.setProperty('--phase-size',phase.toFixed(2)+'px');
        flow.style.setProperty('--arrow-size',arrow.toFixed(2)+'px');
        flow.style.setProperty('--flow-gap',gap.toFixed(2)+'px');
      }
    });
  };
  const run=()=>requestAnimationFrame(()=>requestAnimationFrame(fit));
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();
  addEventListener('resize',run,{passive:true});
  if(document.fonts?.ready) document.fonts.ready.then(run);
})();
