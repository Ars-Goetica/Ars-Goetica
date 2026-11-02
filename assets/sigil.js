// Name-based sigil generator, shared by index.html and sigil.html.
// The same name always draws the same sigil.
//  - letters            -> spoke count = letter count, clamped to 3-12 (and outer ring size)
//  - first + last letter -> core shape
//  - vowels             -> inner ornament and inner ring size
//  - words              -> number of outer dotted rings, 1-3
//  - letters odd / even -> node on every spoke / every other spoke
//  - name hash          -> rotation only
(function(global){
  const CORES=['circle','triangle','diamond','pentagon','hexagon','star'];
  const ORNAMENTS=['none','double ring','dashed ring','dot ring'];

  function hashName(name){let h=2166136261;for(const c of name){h=Math.imul(h^c.charCodeAt(0),16777619)}return h>>>0}

  function sigilTraits(name){
    name=String(name||'').trim();
    const chars=[...name.replace(/\s+/g,'')];
    if(!chars.length)return null;
    const letters=chars.length;
    const words=name.split(/\s+/).length;
    const vowels=(name.toLowerCase().match(/[aeiouy]/g)||[]).length;
    const first=chars[0].toLowerCase().charCodeAt(0);
    const last=chars[chars.length-1].toLowerCase().charCodeAt(0);
    const hash=hashName(name);
    return {
      name,letters,words,vowels,
      firstChar:chars[0],lastChar:chars[chars.length-1],
      spokes:Math.min(Math.max(letters,3),12),
      outer:70+(letters%5)*2,
      inner:26+(vowels*3)%12,
      core:CORES[(first+last)%CORES.length],
      ornament:ORNAMENTS[vowels%4],
      halos:Math.min(words,3),
      allNodes:letters%2===1,
      rotation:hash%360,
    };
  }

  function sigilFor(name){
    const t=sigilTraits(name);
    if(!t)return '';
    const C=110,f=n=>n.toFixed(2);
    const spin=t.rotation*Math.PI/180;
    const {spokes,outer,inner}=t;
    const pt=(a,r)=>[f(C+Math.cos(a)*r),f(C+Math.sin(a)*r)];
    const poly=(n,r,rot)=>'M'+Array.from({length:n},(_,i)=>pt(rot+i/n*Math.PI*2,r).join(' ')).join('L')+'Z';

    let rays='',nodes='';
    for(let i=0;i<spokes;i++){
      const a=i/spokes*Math.PI*2+spin;
      const [x1,y1]=pt(a,inner),[x2,y2]=pt(a,outer);
      rays+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" opacity=".53"/>`;
      if(t.allNodes||i%2===0)nodes+=`<circle cx="${x2}" cy="${y2}" r="2.5" fill="currentColor" stroke="none"/>`;
    }

    const up=-Math.PI/2,cr=40;
    const star='M'+Array.from({length:10},(_,i)=>pt(up+i/10*Math.PI*2,i%2?cr*.45:cr).join(' ')).join('L')+'Z';
    const cores={
      circle:`<circle cx="${C}" cy="${C}" r="${cr*.8}"/>`,
      triangle:`<path d="${poly(3,cr,up)}"/>`,
      diamond:`<path d="${poly(4,cr,up)}"/>`,
      pentagon:`<path d="${poly(5,cr,up)}"/>`,
      hexagon:`<path d="${poly(6,cr,up)}"/>`,
      star:`<path d="${star}"/>`,
    };
    const core=`<g stroke-width="1.2">${cores[t.core]}</g>`;

    const mid=(inner+outer)/2;
    let ornament='';
    if(t.ornament==='double ring')ornament=`<circle cx="${C}" cy="${C}" r="${inner-7}" opacity=".45"/>`;
    else if(t.ornament==='dashed ring')ornament=`<circle cx="${C}" cy="${C}" r="${f(mid)}" stroke-dasharray="4 6" opacity=".5"/>`;
    else if(t.ornament==='dot ring')for(let i=0;i<spokes;i++){const [x,y]=pt((i+.5)/spokes*Math.PI*2+spin,mid);ornament+=`<circle cx="${x}" cy="${y}" r="1.6" fill="currentColor" stroke="none" opacity=".7"/>`}

    let halos='';
    for(let i=0;i<t.halos;i++)halos+=`<circle cx="${C}" cy="${C}" r="${outer+10+i*8}" stroke-dasharray="1 ${11-i*3}" opacity="${f(.4-i*.08)}"/>`;

    return `<svg viewBox="0 0 220 220" fill="none" stroke="currentColor" stroke-width=".85" aria-hidden="true" focusable="false"><circle cx="${C}" cy="${C}" r="${outer}" opacity=".75"/><circle cx="${C}" cy="${C}" r="${inner}" opacity=".5"/>${halos}${ornament}${rays}${core}<path d="M110 24V49M110 171V196M24 110H49M171 110H196" opacity=".6"/>${nodes}<circle cx="${C}" cy="${C}" r="3" fill="currentColor" stroke="none"/></svg>`;
  }

  global.sigilTraits=sigilTraits;
  global.sigilFor=sigilFor;
})(window);
