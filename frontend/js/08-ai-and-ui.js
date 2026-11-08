/* AI request handling, timers, question rendering, marking */
async function getSample(){if(sample)return sample;if(noAI)return null;try{if(window.claude&&claude.use)sample=await claude.use('sample')}catch(e){}if(!sample)noAI=true;return sample}
async function retryAI(){if(srv){try{const h=await api('/health');toast(h.ai?'AI is available. New tasks will use it.':'AI is not configured on this server yet.')}catch(e){toast('Cannot reach the server.')}return}sample=null;noAI=false;const sm=await getSample();toast(sm?'Claude is connected. New tasks will use it.':'Still cannot reach Claude from this view.')}
async function ask(p){const gen=!/^You are/.test(p);
 if(srv&&tokenGet()){try{const r=await api('/generate',{method:'POST',body:{prompt:p+`\n${hs(gen)}\nVariation seed: ${seed()}. Return ONLY valid JSON.`}});return r.data}catch(e){if(e.status===429||e.status===400)throw{message:e.message};if(e.status===401){tokenClear();toast('Your session expired. Please sign in again.')}}}
 const sm=await getSample();
 if(sm){try{return await sm.json(p+`\n${hs(gen)}\nVariation seed: ${seed()}. Return ONLY valid JSON.`,{cache:false})}catch(e){if(e&&e.code==='rate_limited')throw{message:'Too many requests right now. Wait a minute and try again.'}}}
 offline=true;return gen?OFF[cur](p):localFb(p)}
const NOTE='<div class="note" style="margin:0 0 14px">AI is not connected right now, so this is a built-in practice set (scoring is limited too). <button class="lnk" onclick="retryAI()">Try connecting again</button></div>';
function loading(m,k){stop();pal(k);cur=k;offline=false;$('#view').innerHTML=`<div class="center rise"><div class="spin"></div>${m}. This can take up to a minute.</div>`}
function fail(e){$('#view').innerHTML=`<div class="center err">${esc(e.message||e.code||e)}<br><br><button class="btn" onclick="home()">Back home</button></div>`}
function bar(title,mins){$('#view').innerHTML=`<div class="bar rise"><h3>${ic(title.split(/[ ,]/)[0].toLowerCase(),22)} ${title}</h3><span class="timer" id="tm">${String(mins).padStart(2,'0')}:00</span><button class="btn alt" onclick="tips('${title.split(/[ ,]/)[0].toLowerCase()}')">8+ tips</button><button class="btn alt" onclick="home()">Exit</button><div class="prog"><i id="pg"></i></div></div>${offline?NOTE:''}<div id="body" class="rise" style="--i:1"></div>`;
 let s=mins*60;const tot=s;stop();tick=setInterval(()=>{s--;const e=$('#tm');if(!e){stop();return}$('#pg').style.width=(s/tot*100)+'%';
  if(s<=0){const f=timeUpFn;e.textContent="Time's up";stop();if(f)f();return}e.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');e.classList.toggle('low',s<120)},1000)}
const LET='ABCDEFGH';
const qKind=q=>{const o=q.options||[];return o.length===3&&o.every((x,i)=>['true','false','not given'][i]===String(x).toLowerCase())?'tf':o.length?'mc':/^[A-H]$/i.test(String(q.answer).trim())?'match':'text'};
const qHTML=(qs,p,off=0)=>qs.map((q,i)=>{const k=qKind(q),hint={tf:'Write TRUE, FALSE or NOT GIVEN',match:'Write the paragraph letter',text:'Write your answer'}[k];
 const pickHTML=arr=>`<div class="opts" id="${p}o${i}" data-f="${p}${i}" role="radiogroup">${arr.map(([l,v,x])=>`<button type="button" class="opt pick" data-l="${v}" role="radio" aria-checked="false"><b class="${l.length>1?'sm':''}">${l}</b><span>${esc(x)}</span></button>`).join('')}</div><input type="hidden" id="${p}${i}" value="">`;
 const body=k==='mc'?pickHTML(q.options.map((o,j)=>[LET[j],LET[j],String(o).replace(/^[A-H][.)]\s+/,'')])):k==='tf'?pickHTML([['T','True','TRUE'],['F','False','FALSE'],['NG','Not Given','NOT GIVEN']]):`<input type="text" id="${p}${i}" autocomplete="off" spellcheck="false" maxlength="40" placeholder="${hint}">`;
 return`<div class="q"><div class="qn">${i+1+off}</div><div class="qb"><p>${esc(q.q)}</p>${body}<div class="exp" id="${p}f${i}"></div></div></div>`}).join('');
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.opt.pick');if(!b)return;const box=b.parentElement;box.querySelectorAll('.pick').forEach(x=>{x.classList.remove('on');x.setAttribute('aria-checked','false')});b.classList.add('on');b.setAttribute('aria-checked','true');const f=document.getElementById(box.dataset.f);if(f)f.value=b.dataset.l});
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
const TFMAP={t:'true',true:'true',f:'false',false:'false',ng:'not given',notgiven:'not given','not given':'not given',n:'not given'};
function isRight(q,v){const k=qKind(q),a=String(q.answer),u=norm(v);if(!u)return false;
 if(k==='tf')return(TFMAP[u]||TFMAP[u.replace(/ /g,'')])===norm(a);
 if(k==='mc'){const i=q.options.findIndex(o=>norm(o)===norm(a));return(u.length===1&&LET.toLowerCase().indexOf(u)===i)||u===norm(a)}
 if(k==='match')return u===norm(a);
 return a.split('|').some(x=>norm(x)===u)}
function showAns(q){const k=qKind(q),a=String(q.answer);if(k==='mc'){const i=q.options.findIndex(o=>norm(o)===norm(a));return(i>=0?LET[i]+'. ':'')+a}return a.split('|')[0]}
function mark(qs,p,out,m){let s=0;qs.forEach((q,i)=>{const v=$('#'+p+i).value,ok=isRight(q,v);if(ok)s++;{const el=$('#'+p+i);el.classList.remove('okb','badb');el.classList.add(ok?'okb':'badb')}{const box=$('#'+p+'o'+i);if(box&&q.options){const ci=qKind(q)==='tf'?['true','false','not given'].indexOf(norm(q.answer)):q.options.findIndex(o=>norm(o)===norm(q.answer));box.querySelectorAll('.opt').forEach((b,j)=>{b.classList.remove('right','wrong');if(j===ci)b.classList.add('right');else if(b.classList.contains('on'))b.classList.add('wrong')})}}$('#'+p+'f'+i).innerHTML=`<span class="${ok?'ok':'bad'}">${ok?'Correct.':'The answer was: '+esc(showAns(q))+'.'}</span> ${esc(q.explanation||'')}`});
 const eq=Math.round(s/qs.length*40),band=convBand(m,eq),r=CONV[m].find(x=>x[1]===+S.target),need=r?Math.ceil(r[0]/40*qs.length):null;
 $(out).innerHTML=rptHTML({label:m+' · Practice test',band,third:['Marks',s+' / '+qs.length,'about '+eq+' / 40 on the IELTS scale'],note:band>=+S.target?'Target reached. Aim for a margin of a couple of marks so a bad day does not cost you.':'To reach band '+S.target+' you need about '+(r?r[0]:'?')+' out of 40, roughly '+need+' out of '+qs.length+' on this test. Review the explanations above and try a fresh one.'});
 rec(m,s+'/'+qs.length+' · Band '+band.toFixed(1),band>=+S.target,band)}
