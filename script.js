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


/* Module label icons — visual markers only; labels/content remain unchanged */
(()=>{
  const iconMap={
    'Leadership':'★',
    'EHS':'♻',
    'Goal-Oriented Team Management':'◎',
    'Issue Escalation':'↑',
    'Cross-Functional Work':'↔',
    'Quality Planning':'✓',
    'Zero Defects':'◉',
    'Quality Assurance':'◆',
    '5S':'⑤',
    'Standardized Work':'≡',
    'TPM':'⚙',
    'Production Leveling':'⇄',
    'Improvement Approach':'↗',
    'Problem-Solving Methodology':'◇',
    'Value-Stream Mapping':'⇢',
    'Continuous Flow':'↻',
    'Material Supply':'▣',
    'Line Balancing':'≋',
    'Pull System':'⇣'
  };

  const addIcon=(el)=>{
    if(!el || el.querySelector(':scope > .module-label-icon')) return;
    const label=el.textContent.trim();
    const mark=iconMap[label];
    if(!mark) return;
    const icon=document.createElement('span');
    icon.className='module-label-icon';
    icon.setAttribute('aria-hidden','true');
    icon.textContent=mark;
    el.prepend(icon);
  };

  $$('.module-card li').forEach(addIcon);
  $$('.module-brief b').forEach(addIcon);
})();
