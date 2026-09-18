function rng(seed){ return () => (seed = seed*1103515245+12345 & 0x7fffffff)/0x7fffffff; }
const N=200, TICKS=200, SESSIONS=50, TOP=10;

function score(x,t){
  const A=1,B=20;
  return ((x.likes+A)/(x.vues+A+B)) * Math.exp(-(t-x.naissance)/60);
}

function simuler(strategie, seed, expl=0){
  const rand=rng(seed); const v=[];
  for(let t=0;t<TICKS;t++){
    v.push({id:t,q:rand(),naissance:t,vues:0,likes:0});
    for(let s=0;s<SESSIONS;s++){
      let classe;
      if(strategie==='chrono') classe=[...v].sort((a,b)=>b.naissance-a.naissance).slice(0,TOP);
      else {
        const tri=[...v].sort((a,b)=> strategie==='brute' ? b.likes-a.likes : score(b,t)-score(a,t));
        const nExpl=Math.round(TOP*expl);
        const exploit=tri.slice(0,TOP-nExpl);
        // Places d'exploration : les videos les MOINS vues, au hasard parmi elles.
        const reste=v.filter(x=>!exploit.includes(x)).sort((a,b)=>a.vues-b.vues).slice(0,40);
        const pioche=[];
        while(pioche.length<nExpl && reste.length) pioche.push(reste.splice(Math.floor(rand()*reste.length),1)[0]);
        classe=[...exploit,...pioche];
      }
      for(const x of classe){ x.vues++; if(rand()<x.q) x.likes++; }
    }
  }
  return v;
}

function analyser(nom,v){
  const vues=v.map(x=>x.vues).sort((a,b)=>b-a), total=vues.reduce((a,b)=>a+b,0);
  const top10=vues.slice(0,Math.ceil(v.length*0.1)).reduce((a,b)=>a+b,0);
  const parVues=[...v].sort((a,b)=>b.vues-a.vues).slice(0,20).map(x=>x.id);
  const parQ=[...v].sort((a,b)=>b.q-a.q).slice(0,20).map(x=>x.id);
  const tard=v.filter(x=>x.naissance>TICKS*0.7&&x.q>0.7);
  return {nom,
    conc:(top10/total*100).toFixed(0)+' %',
    jamais:v.filter(x=>x.vues===0).length+'/'+v.length,
    qual:parVues.filter(i=>parQ.includes(i)).length+'/20',
    tard:tard.length? tard.filter(x=>x.vues>total/v.length).length+'/'+tard.length :'n/a'};
}

const r=[
  analyser('ORDER BY likes DESC',        simuler('brute',42)),
  analyser('Taux lisse, sans explor.',   simuler('taux',42,0)),
  analyser('Taux lisse + 20 % explor.',  simuler('taux',42,0.2)),
  analyser('Taux lisse + 30 % explor.',  simuler('taux',42,0.3)),
  analyser('Taux lisse + 50 % explor.',  simuler('taux',42,0.5)),
  analyser('Chronologique',              simuler('chrono',42)),
];
const c=[['Strategie','nom',30],['Top 10 % des vues','conc',20],['Jamais vues','jamais',16],
         ['Top 20 reel retrouve','qual',24],['Bonnes tardives percees','tard',24]];
console.log('\n'+c.map(([t,,w])=>t.padEnd(w)).join(''));
console.log('-'.repeat(c.reduce((a,[,,w])=>a+w,0)));
for(const l of r) console.log(c.map(([,k,w])=>String(l[k]).padEnd(w)).join(''));
console.log();
