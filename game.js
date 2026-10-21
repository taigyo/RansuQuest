'use strict';
const $=s=>document.querySelector(s),pad=n=>String(n).padStart(3,'0');
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const M=n=>(n%1000+1000)%1000,M10=v=>(v%10+10)%10;
const dg=n=>[n/100|0,(n/10|0)%10,n%10],un=d=>d[0]*100+d[1]*10+d[2];
const eachD=(n,f)=>un(dg(n).map(f));
const POS=['百','十','一'];
const WEAPONS={add:['ひのきのぼう','どうのつるぎ','てつのやり','こんぼう'],dig:['ぶんしんのけん','ゆうしゃのたて','まじんのおの'],cnv:['はんてんのかがみ','ほしのつえ','ふしぎなつぼ'],rng:['ダイスのつるぎ','カオスブレード','ルーレットハンマー']};
const CAT={add:'加減乗除',dig:'桁いじり',cnv:'変換',rng:'乱数'};
const mk=(cat,w,label,f,basic)=>({cat,w,label,f,basic});
const POOL=[];
[1,10,100].forEach(k=>POOL.push(mk('add',k==100?2:4,'+'+k,n=>M(n+k),1),mk('add',k==100?2:4,'−'+k,n=>M(n-k),1)));
POOL.push(mk('add',1,'+7',n=>M(n+7)),mk('add',1,'−7',n=>M(n-7)),mk('add',2,'×2',n=>M(n*2)),mk('add',1,'×3',n=>M(n*3)));
[0,1,2].forEach(i=>POOL.push(mk('dig',2,POS[i]+'の位 +3',n=>eachD(n,(x,j)=>j==i?M10(x+3):x))));
POOL.push(
 mk('dig',2,'右シフト',n=>n/10|0),
 mk('dig',2,'左シフト',n=>n%100*10),
 mk('dig',2,'桁を右回転',n=>{const d=dg(n);return un([d[2],d[0],d[1]])}),
 mk('dig',2,'桁を反転',n=>{const d=dg(n);return un([d[2],d[1],d[0]])}),
 mk('dig',2,'奇数の桁 +2',n=>eachD(n,x=>x%2?M10(x+2):x)),
 mk('dig',2,'偶数の桁 ÷2',n=>eachD(n,x=>x%2?x:x/2)),
 mk('cnv',2,'補数 (999−n)',n=>999-n),
 mk('cnv',1,'2乗の下3桁',n=>n*n%1000),
 mk('cnv',1,'桁の和を足す',n=>M(n+dg(n).reduce((a,b)=>a+b))),
 mk('rng',2,'真ん中2乗法',n=>+String(n*n).padStart(6,'0').slice(1,4)),
 mk('rng',2,'線形合同法',n=>(n*21+7)%1000),
 mk('rng',2,'XOR 85',n=>(n^85)%1000),
 mk('rng',1,'ダイス ±9',n=>M(n+R(-9,9)))
);
const pick=list=>{let r=Math.random()*list.reduce((a,o)=>a+o.w,0);for(const o of list){if((r-=o.w)<0)return o}return list[0]};
const dist=(a,b)=>{const d=Math.abs(a-b);return Math.min(d,1000-d)};
const say=(who,t)=>{const e=$('#say-'+who);e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),1800)};
const show=(id,v)=>{const e=$('#v-'+id);e.textContent=pad(v);e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop')};
let S=null;const box=$('#chests');

function spawn(i){
  const basic=S.chests.filter((c,j)=>j!=i&&c&&c.op.basic).length;
  const op=basic<2?pick(POOL.filter(o=>o.basic)):pick(POOL);
  const c={op,weapon:pick(WEAPONS[op.cat].map(n=>({w:1,n}))).n,lock:null};
  const slot=box.children[i];
  slot.className='slot '+op.cat;
  slot.innerHTML='<i class="lid"></i><span class="lb">'+op.label+'</span><span class="tag">'+CAT[op.cat]+'</span><i class="bar"></i>';
  void slot.offsetWidth;
  c.timer=setTimeout(()=>{if(!c.lock&&!S.over)spawn(i)},10000);
  S.chests[i]=c;
}
function take(i,who){
  const c=S&&S.chests[i];
  if(!c||S.over||c.lock)return;
  c.lock=who;clearTimeout(c.timer);
  box.children[i].classList.add('open',who==='me'?'me':'cpu');
  setTimeout(()=>{
    if(S.over)return;
    S[who]=c.op.f(S[who]);
    show(who==='me'?'me':'cpu',S[who]);
    say(who==='me'?'me':'cpu',c.weapon+'を手に入れた！ '+c.op.label);
    if(S[who]===S.t)return end(who);
    spawn(i);
  },700);
}
function cpuTurn(){
  if(!S||S.over)return;
  const opts=S.chests.map((c,i)=>({c,i})).filter(o=>!o.c.lock);
  if(opts.length){
    const sc=o=>o.c.op.label.startsWith('ダイス')?30:dist(o.c.op.f(S.cpu),S.t);
    opts.sort((a,b)=>sc(a)-sc(b));
    take((Math.random()<.7?opts[0]:opts[R(0,opts.length-1)]).i,'cpu');
  }
  setTimeout(cpuTurn,R(1500,2700));
}
function end(who){
  S.over=true;S.chests.forEach(c=>clearTimeout(c.timer));
  const win=who==='me';
  $('#ot').textContent=win?'伝説のランスを手に入れた！':'ライバルがランスを奪った…';
  $('#op').textContent=win?'乱数を制した。キミの勝ち！':'あと一歩だった。もう一度シードを書き換えよう。';
  $('#go').textContent='もう一度あそぶ';
  $('#ov').classList.remove('hide');
}
function start(){
  const v=$('#seed').value.trim(),me=/^\d{1,3}$/.test(v)?+v:R(0,999),cpu=R(0,999);
  let t;do t=R(0,999);while(t===me||t===cpu);
  S={me,cpu,t,chests:[],over:false};
  show('me',me);show('cpu',cpu);show('t',t);
  for(let i=0;i<6;i++)spawn(i);
  $('#ov').classList.add('hide');
  setTimeout(cpuTurn,2000);
}
box.innerHTML='<button class="slot"></button>'.repeat(6);
box.onclick=e=>{const b=e.target.closest('.slot');if(b)take([...box.children].indexOf(b),'me')};
addEventListener('keydown',e=>{if(e.target.tagName!=='INPUT'&&/^[1-6]$/.test(e.key))take(+e.key-1,'me')});
$('#go').onclick=start;
