/* App state, saving, and server mode (talks to /api) */
const fresh=()=>({h:[],target:'7',level:'Band 6-7',xp:0,bd:[],n:0,best:0});
let sample=null,tick=null,S=fresh(),P={cur:null,list:{}};
let LINK='https://claude.ai/artifact/QDYB823eU2WnVoCh9EphZ5';
try{P={...P,...JSON.parse(localStorage.getItem('ielts_profiles')||'{}')}}catch(e){}
try{const old=localStorage.getItem('ielts_coach');if(old&&!Object.keys(P.list).length)P.list.me={name:'My profile',av:0,st:'Intermediate',S:{...fresh(),...JSON.parse(old)}}}catch(e){}
const save=()=>{try{if(P.cur&&P.list[P.cur])P.list[P.cur].S=S;localStorage.setItem('ielts_profiles',JSON.stringify(P))}catch(e){}pushSrv()};

/* ---------- SERVER MODE: real accounts + AI through your own backend (/api) ---------- */
let srv=false,pushT=null;
const tokenGet=()=>{try{return localStorage.getItem('ielts_token')}catch(e){return null}},tokenSet=t=>{try{localStorage.setItem('ielts_token',t)}catch(e){}},tokenClear=()=>{try{localStorage.removeItem('ielts_token')}catch(e){}};
async function api(path,o={}){const t=tokenGet(),r=await fetch('/api'+path,{method:o.method||'GET',headers:{'Content-Type':'application/json',...(t?{Authorization:'Bearer '+t}:{})},body:o.body?JSON.stringify(o.body):undefined,keepalive:!!o.keep});let j={};try{j=await r.json()}catch(e){}if(!r.ok)throw{status:r.status,code:j.code,message:j.error||'Request failed ('+r.status+').'};return j}
function pushSrv(now){if(!srv||!P.cur||!P.list[P.cur]||!P.list[P.cur].srv||!tokenGet())return;clearTimeout(pushT);const go=()=>{const p=P.list[P.cur];if(!p)return;api('/me',{method:'PUT',keep:!!now,body:{name:p.name,photo:p.photo||null,st:p.st,av:p.av||0,state:p.S}}).catch(()=>{})};now?go():pushT=setTimeout(go,800)}
function adopt(u){const id='srv_'+u.id;P.list[id]={name:u.name,email:u.email,av:u.av||0,photo:u.photo||null,st:u.st||'Intermediate',srv:true,S:{...fresh(),...(u.state||{})}};P.cur=id;S=P.list[id].S;try{localStorage.setItem('ielts_profiles',JSON.stringify(P))}catch(e){}}
async function probe(){if(!/^https?:/.test(location.protocol))return;try{const h=await api('/health');srv=!!(h&&h.ok&&('signup' in h));LINK=h.publicUrl||location.origin;MSG=MSG.replace(/Join me: .*$/,'Join me: '+LINK)}catch(e){srv=false}}
