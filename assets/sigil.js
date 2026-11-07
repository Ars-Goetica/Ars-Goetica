// Name-based sigil generator, shared by index.html and sigil.html.
// The same name always draws the same sigil.
//
// Every seal is a compass-and-straightedge construction with one rotational fold.
// The name decides which pieces are used:
//  - letters + hash -> fold (3, 4, 5, 6, 7, 8, 9 or 12)
//  - first letter   -> main motif (star, petals, keys, orbits, crown, ...)
//  - last letter    -> inner motif
//  - first + last   -> core mark
//  - vowels         -> stroke terminals
//  - words + hash   -> outer frame (inscribed band, polygon, thorns, ...)
//  - consonants     -> ornament ring
// Non-Latin letters (한글, かな, ...) are placed by code point, so any script works.
(function(global){
  const FOLDS=[3,4,5,6,7,8,9,12];
  const FRAMES=['inscribed band','double ring','polygon','broken arcs','dotted ring','thorned ring'];
  const MOTIFS=['star','petals','keys','orbits','crown','nested','scallops','interlace','spokes'];
  const INNERS=['polygon','star','petals','orbits','nested','spokes'];
  const CORES=['circle','triangle','square','pentagram','hexagram','crescent','vesica','cross','eye'];
  const TERMINALS=['dot','ring','cross','trident','crescent','triangle'];
  const ORNAMENTS=['bare','ticks','dot ring','bare','zigzag'];

  function hashName(name){let h=2166136261;for(const c of name){h=Math.imul(h^c.codePointAt(0),16777619)}return h>>>0}
  const slot=c=>{const l=c.toLowerCase(),k=l.charCodeAt(0);return k>=97&&k<=122?k-97:c.codePointAt(0)%26};
  const gcd=(a,b)=>b?gcd(b,a%b):a;

  function sigilTraits(name){
    name=String(name||'').trim();
    const chars=[...name.replace(/\s+/g,'')];
    if(!chars.length)return null;
    const lower=name.toLowerCase();
    const letters=chars.length,words=name.split(/\s+/).length;
    const vowels=(lower.match(/[aeiouy]/g)||[]).length;
    const consonants=(lower.match(/[b-df-hj-np-tv-xz]/g)||[]).length;
    const first=slot(chars[0]),last=slot(chars[chars.length-1]);
    const hash=hashName(name);
    const motif=MOTIFS[(first+(hash>>>7))%MOTIFS.length];
    let inner=INNERS[(last+vowels+(hash>>>11))%INNERS.length];
    if(motif==='interlace')inner='none';
    else if(inner===motif)inner=INNERS[(INNERS.indexOf(inner)+1)%INNERS.length];
    return {
      name,letters,words,vowels,consonants,
      firstChar:chars[0],lastChar:chars[chars.length-1],
      fold:FOLDS[(letters+(hash>>>3))%FOLDS.length],
      motif,inner,
      core:CORES[(first*7+last)%CORES.length],
      terminal:TERMINALS[vowels%TERMINALS.length],
      frame:FRAMES[(words+(hash>>>17))%FRAMES.length],
      ornament:ORNAMENTS[consonants%ORNAMENTS.length],
      rotation:hash%360,
      hash,
    };
  }

  function sigilFor(name){
    const t=sigilTraits(name);
    if(!t)return '';
    const C=110,TAU=Math.PI*2,n=t.fold,f=v=>(+v).toFixed(2);
    const off=(t.rotation/360)*(TAU/n)-Math.PI/2;           // rotation inside one fold keeps the seal upright-ish
    const ang=i=>off+i/n*TAU;
    const pt=(a,r)=>[C+Math.cos(a)*r,C+Math.sin(a)*r];
    const P=(a,r)=>pt(a,r).map(f).join(' ');
    const circ=(r,extra='')=>`<circle cx="${C}" cy="${C}" r="${f(r)}" ${extra}/>`;
    const ring=(x,y,r,extra='')=>`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" ${extra}/>`;
    const D='class="draw" pathLength="1"';
    const polyD=(k,r,rot)=>'M'+Array.from({length:k},(_,i)=>P(rot+i/k*TAU,r)).join('L')+'Z';

    // terminal glyph at (x,y) facing outward along angle a
    function term(x,y,a,s=1){
      const nx=Math.cos(a+Math.PI/2),ny=Math.sin(a+Math.PI/2),ux=Math.cos(a),uy=Math.sin(a),k=4.6*s;
      switch(t.terminal){
        case 'dot':return ring(x,y,2.4*s,'fill="currentColor" stroke="none" class="dot"');
        case 'ring':return ring(x,y,3.4*s,'fill="var(--sigil-bg,#030404)" class="dot"');
        case 'cross':return `<path class="dot" d="M${f(x-nx*k)} ${f(y-ny*k)}L${f(x+nx*k)} ${f(y+ny*k)}"/>`;
        case 'trident':return `<path class="dot" d="M${f(x-nx*k)} ${f(y-ny*k)}L${f(x+nx*k)} ${f(y+ny*k)}M${f(x-nx*k)} ${f(y-ny*k)}l${f(ux*k)} ${f(uy*k)}M${f(x+nx*k)} ${f(y+ny*k)}l${f(ux*k)} ${f(uy*k)}M${f(x)} ${f(y)}l${f(ux*k*1.3)} ${f(uy*k*1.3)}"/>`;
        case 'crescent':return `<path class="dot" d="M${f(x-nx*k)} ${f(y-ny*k)}A${f(k)} ${f(k)} 0 0 1 ${f(x+nx*k)} ${f(y+ny*k)}"/>`;
        case 'triangle':return `<path class="dot" d="M${f(x+ux*k*1.2)} ${f(y+uy*k*1.2)}L${f(x-nx*k*.8)} ${f(y-ny*k*.8)}L${f(x+nx*k*.8)} ${f(y+ny*k*.8)}Z" fill="currentColor" stroke="none"/>`;
      }
    }

    // one motif drawn between radii r0..r1
    function motif(kind,r0,r1,w){
      const o=[];const sw=`stroke-width="${w}"`;
      switch(kind){
        case 'polygon':
          o.push(`<path ${D} ${sw} d="${polyD(n,r1,off)}"/>`);break;
        case 'star':{
          if(n<5){o.push(`<path ${D} ${sw} d="${polyD(n,r1,off)}"/>`,`<path ${D} ${sw} d="${polyD(n,r1,off+Math.PI/n)}"/>`);break}
          const k=n>=7?3:2,g=gcd(n,k),m=n/g;
          for(let s=0;s<g;s++){let d='';for(let i=0;i<=m;i++)d+=(i?'L':'M')+P(ang(s+i*k),r1);o.push(`<path ${D} ${sw} stroke-linejoin="miter" d="${d}Z"/>`)}
          break}
        case 'petals':{
          const rad=(r1-r0)*.72;
          for(let i=0;i<n;i++){const A=P(ang(i),r0),B=P(ang(i),r1);o.push(`<path ${D} ${sw} d="M${A}A${f(rad)} ${f(rad)} 0 0 1 ${B}A${f(rad)} ${f(rad)} 0 0 1 ${A}Z"/>`)}
          o.push(circ(r0,`${D} opacity=".55"`));break}
        case 'keys':
          o.push(circ(r0,`${D} opacity=".6"`));
          for(let i=0;i<n;i++){
            const a=ang(i),[x,y]=pt(a,r1),m=r0+(r1-r0)*.55,nx=Math.cos(a+Math.PI/2)*5,ny=Math.sin(a+Math.PI/2)*5,[mx,my]=pt(a,m);
            o.push(`<path ${D} ${sw} d="M${P(a,r0)}L${f(x)} ${f(y)}"/>`,`<path ${sw} class="dot" d="M${f(mx-nx)} ${f(my-ny)}L${f(mx+nx)} ${f(my+ny)}"/>`,term(x,y,a));
          }break;
        case 'orbits':{
          const rc=(r0+r1)/2,rr=Math.min(Math.sin(Math.PI/n)*rc,(r1-r0)/2);
          o.push(circ(rc,`${D} opacity=".45"`));
          for(let i=0;i<n;i++){const [x,y]=pt(ang(i),rc);o.push(`<circle ${D} ${sw} cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="var(--sigil-bg,#030404)"/>`,ring(x,y,1.6,'fill="currentColor" stroke="none" class="dot"'))}
          break}
        case 'crown':{
          o.push(circ(r0,`${D} ${sw}`));
          const half=Math.PI/n*.72;
          for(let i=0;i<n;i++){const a=ang(i);o.push(`<path ${D} ${sw} d="M${P(a-half,r0)}L${P(a,r1)}L${P(a+half,r0)}"/>`);const [x,y]=pt(a,r1);o.push(term(x,y,a,.8))}
          break}
        case 'nested':
          o.push(`<path ${D} ${sw} d="${polyD(n,r1,off)}"/>`,`<path ${D} ${sw} opacity=".75" d="${polyD(n,r1*Math.cos(Math.PI/n),off+Math.PI/n)}"/>`,`<path ${D} opacity=".5" d="${polyD(n,r1*Math.cos(Math.PI/n)**2,off)}"/>`);
          break;
        case 'scallops':{
          let d='';const rr=2*r1*Math.sin(Math.PI/n)*.78;
          for(let i=0;i<n;i++)d+=`M${P(ang(i),r1)}A${f(rr)} ${f(rr)} 0 0 0 ${P(ang(i+1),r1)}`;
          o.push(`<path ${D} ${sw} d="${d}"/>`,circ(r0,`${D} opacity=".55"`));
          for(let i=0;i<n;i++){const [x,y]=pt(ang(i),r1);o.push(term(x,y,ang(i),.9))}
          break}
        case 'interlace':{
          const rr=r1/2;
          for(let i=0;i<n;i++){const [x,y]=pt(ang(i),rr);o.push(`<circle ${D} ${sw} cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" opacity=".85"/>`)}
          o.push(circ(r1,`${D} ${sw}`));break}
        case 'spokes':
          for(let i=0;i<n*2;i++){
            const a=off+i/(n*2)*TAU,long=i%2===0,re=long?r1:r0+(r1-r0)*.55,[x,y]=pt(a,re);
            o.push(`<path ${D} ${long?sw:''} opacity="${long?1:.6}" d="M${P(a,r0)}L${f(x)} ${f(y)}"/>`);
            if(long)o.push(term(x,y,a,.9));
          }
          o.push(circ(r0,`${D} opacity=".55"`));break;
      }
      return o.join('');
    }

    // ---------- frame ----------
    const R=101,fr=[];
    const spin=t.rotation*Math.PI/180;
    switch(t.frame){
      case 'inscribed band':{
        fr.push(circ(R,`${D} opacity=".85"`),circ(R-14,`${D} opacity=".65"`));
        const id='ib'+(t.hash%100000),word=t.name.toUpperCase().replace(/[&<>"]/g,'');
        const reps=Math.max(1,Math.round(38/([...word].length+3)));
        const band=Array.from({length:reps},()=>word).join('  ✦  ')+'  ✦  ';
        fr.push(`<defs><path id="${id}" d="M${C} ${C-(R-7)}a${R-7} ${R-7} 0 1 1 -.01 0"/></defs>`,
          `<text class="dot" font-family="'Bodoni Moda',Didot,'Times New Roman',serif" font-size="8.4" letter-spacing="1.1" fill="currentColor" stroke="none" opacity=".85"><textPath href="#${id}" textLength="${f(TAU*(R-7)-4)}" lengthAdjust="spacing">${band}</textPath></text>`);
        break}
      case 'double ring':
        fr.push(circ(R,`${D} opacity=".85"`),circ(R-5,`${D} opacity=".6"`),circ(R-10,'stroke-dasharray="1 4" opacity=".45" class="dot"'));break;
      case 'polygon':{
        const pn=n<5?n*2:n;  // a bare triangle/square frame crowds the seal; double it
        fr.push(`<path ${D} opacity=".8" d="${polyD(pn,R,off)}"/>`,circ(R*Math.cos(Math.PI/pn)-2,`${D} opacity=".5"`));
        for(let i=0;i<pn;i++){const [x,y]=pt(off+i/pn*TAU,R);fr.push(ring(x,y,2.2,'fill="currentColor" stroke="none" class="dot"'))}
        break}
      case 'broken arcs':{
        const gap=Math.min(.16,Math.PI/n*.3);
        for(let i=0;i<n;i++){const a0=ang(i)+Math.PI/n-(Math.PI/n-gap),a1=ang(i+1)-gap;fr.push(`<path ${D} opacity=".85" d="M${P(ang(i)+gap,R)}A${R} ${R} 0 0 1 ${P(a1,R)}"/>`);const [x,y]=pt(ang(i),R);fr.push(ring(x,y,2.6,'class="dot" opacity=".85"'))}
        fr.push(circ(R-9,`${D} opacity=".35"`));break}
      case 'dotted ring':
        fr.push(circ(R,'class="dot" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="0.01 6.4" opacity=".75"'),circ(R-8,`${D} opacity=".65"`));break;
      case 'thorned ring':{
        fr.push(circ(R-8,`${D} opacity=".8"`));
        const m=n*4;let d='';
        for(let i=0;i<m;i++){const a=off+i/m*TAU,len=i%4===0?11:i%2?4:7;d+=`M${P(a,R-8)}L${P(a,R-8+len)}`}
        fr.push(`<path class="dot" opacity=".65" d="${d}"/>`);break}
    }

    // ---------- ornament ring ----------
    const orn=[],oR=84;
    switch(t.ornament){
      case 'ticks':{let d='';const m=n*6;for(let i=0;i<m;i++){const a=off+i/m*TAU;d+=`M${P(a,oR)}L${P(a,oR+(i%6?2.5:5))}`}orn.push(`<path class="dot" opacity=".45" d="${d}"/>`);break}
      case 'dot ring':{const m=n*4;for(let i=0;i<m;i++){const [x,y]=pt(off+(i+.5)/m*TAU,oR+2);orn.push(ring(x,y,1.1,'fill="currentColor" stroke="none" opacity=".55" class="dot"'))}break}
      case 'zigzag':{const m=n*4;orn.push(`<path ${D} opacity=".35" d="M${Array.from({length:m},(_,i)=>P(off+i/m*TAU,i%2?oR:oR+4)).join('L')}Z"/>`);break}
    }

    // ---------- core ----------
    const cr=9+(t.hash>>>21)%5,up=-Math.PI/2;
    const star5=()=>{let s='';for(let i=0;i<5;i++)s+=(i?'L':'M')+P(up+(i*2%5)/5*TAU,cr);return s+'Z'};
    const cores={
      circle:circ(cr*.8,D)+circ(cr*.28,'fill="currentColor" stroke="none" class="dot"'),
      triangle:`<path ${D} d="${polyD(3,cr,up)}"/>`,
      square:`<path ${D} d="${polyD(4,cr,up+Math.PI/4)}"/>`,
      pentagram:`<path ${D} d="${star5()}"/>`,
      hexagram:`<path ${D} d="${polyD(3,cr,up)}"/><path ${D} d="${polyD(3,cr,-up)}"/>`,
      crescent:`<path ${D} d="M${P(up-1.1,cr)}A${cr} ${cr} 0 1 0 ${P(up+1.1,cr)}A${f(cr*.78)} ${f(cr*.78)} 0 1 1 ${P(up-1.1,cr)}Z"/>`,
      vesica:`<path ${D} d="M${C} ${f(C-cr)}A${cr} ${cr} 0 0 1 ${C} ${f(C+cr)}A${cr} ${cr} 0 0 1 ${C} ${f(C-cr)}Z"/>`,
      cross:`<path ${D} d="M${C} ${f(C-cr)}V${f(C+cr)}M${f(C-cr*.7)} ${f(C-cr*.2)}H${f(C+cr*.7)}"/>`,
      eye:`<path ${D} d="M${f(C-cr)} ${C}Q${C} ${f(C-cr*.95)} ${f(C+cr)} ${C}Q${C} ${f(C+cr*.95)} ${f(C-cr)} ${C}Z"/>`+circ(cr*.32,'fill="currentColor" stroke="none" class="dot"'),
    };

    return `<svg viewBox="0 0 220 220" fill="none" stroke="currentColor" stroke-width=".85" stroke-linecap="round" aria-hidden="true" focusable="false">`+
      `<g class="sigil-frame">${fr.join('')}${orn.join('')}</g>`+
      `<g class="sigil-motif">${motif(t.motif,40,78,1.1)}</g>`+
      (t.inner==='none'?'':`<g class="sigil-inner">${motif(t.inner,16,34,.95)}</g>`)+
      `<g class="sigil-core" stroke-width="1.15">${cores[t.core]}</g>`+
      `</svg>`;
  }

  global.sigilTraits=sigilTraits;
  global.sigilFor=sigilFor;
})(window);
