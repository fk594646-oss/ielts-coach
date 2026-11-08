/* Full exam mode: Reading (3 passages, 40 questions, 60 min) and Listening (4 sections, 40 questions, each played once) */
let EX=null;
const topics=n=>{const t=[];while(t.length<n){const x=pick(TOPICS);if(!t.includes(x))t.push(x)}return t};
const cum=ds=>ds.reduce((a,d,i)=>(a.push(i?a[i-1]+ds[i-1].questions.length:0),a),[]);

function modeChooser(k){stop();pal(k);cur=k;const R=k==='reading',T=R?'Reading':'Listening';
 $('#view').innerHTML=`<div class="hero rise" style="padding-bottom:6px"><span class="tag">${T}</span><h1 style="font-size:2.2rem">${ic(k,34)} Choose how you want to practise</h1></div>
 <div class="modes"><div class="mode rise" style="--i:1"><div class="tag">Practice</div><h3>${R?'One passage':'One section'}</h3><p class="mut">${R?'One passage with 13 or 14 questions and a 20-minute timer. Check your answers whenever you like and read the explanations straight away.':'One section with 10 questions. The recording plays once. Check your answers and read the transcript afterwards.'}</p><ul class="ml"><li>Instant explanations</li><li>${R?'Highlighter and a fresh passage each time':'Transcript after you finish'}</li><li>Relaxed pace</li></ul><button class="btn" id="mp">Start practice</button></div>
 <div class="mode rise" style="--i:2"><div class="tag">Real exam experience</div><h3>Full ${T} test</h3><p class="mut">${R?'Three passages and 40 questions (13, 13 and 14) against one 60-minute timer. No feedback until you submit.':'Four sections of 10 questions each, 40 in total. Every recording plays once, with 30 seconds to read the questions first. You cannot go back.'}</p><ul class="ml"><li>${R?'The test submits itself when time runs out':'Sections move on by themselves'}</li><li>One overall band, CEFR level and section breakdown</li><li>${R?'About 60 minutes':'About 20 minutes with these recordings'}</li></ul><button class="btn" id="mf">Start full exam</button></div></div>
 <p><button class="btn alt" onclick="home()">Back</button></p>`;
 $('#mp').onclick=()=>window[k]();$('#mf').onclick=()=>R?fullReading():fullListening()}

function markUI(qs,p){let s=0;qs.forEach((q,i)=>{const el=$('#'+p+i),ok=isRight(q,el?el.value:'');if(ok)s++;if(el){el.classList.remove('okb','badb');el.classList.add(ok?'okb':'badb')}
 const box=$('#'+p+'o'+i);if(box&&q.options){const ci=qKind(q)==='tf'?['true','false','not given'].indexOf(norm(q.answer)):q.options.findIndex(o=>norm(o)===norm(q.answer));box.querySelectorAll('.opt').forEach((b,j)=>{b.classList.remove('right','wrong');if(j===ci)b.classList.add('right');else if(b.classList.contains('on'))b.classList.add('wrong')})}
 const f=$('#'+p+'f'+i);if(f)f.innerHTML=`<span class="${ok?'ok':'bad'}">${ok?'Correct.':'The answer was: '+esc(showAns(q))+'.'}</span> ${esc(q.explanation||'')}`});return s}

/* ---------------- FULL READING ---------------- */
const rdPrompt=(n,i,t)=>`Write an original IELTS Academic Reading passage of about ${Math.min(900,DF().wc+120)} words, in paragraphs labelled A to F, that reads like a ${['magazine feature','journal article','long-form science essay'][i]}. Loosely inspired by "${t}". Then write exactly ${n} questions in this mix: 5 True/False/Not Given (options exactly ["True","False","Not Given"], answer is one of them), 3 matching-paragraph questions ("Which paragraph contains ...?", options null, answer is a single paragraph letter such as "C"), 3 multiple choice (3-4 options, answer is the full text of the correct option) and ${n-11} sentence completion (options null, answer is 1-3 words from the passage). JSON: {"title":str,"passage":[str],"questions":[{"q":str,"options":[str]|null,"answer":str,"explanation":str}]}`;
async function fullReading(){loading('Preparing three passages','reading');
 try{const ns=[13,13,14],tp=topics(3);
  let ds=await Promise.all(ns.map((n,i)=>ask(rdPrompt(n,i,tp[i])).catch(()=>null)));
  const okv=ds.every((d,i)=>d&&Array.isArray(d.passage)&&d.passage.length>=3&&Array.isArray(d.questions)&&d.questions.length>=ns[i]-2);
  if(offline||!okv){offline=true;ds=[OFFB.RD[1],OFFB.RD[2],OFFB.RD[0]]}
  const offs=cum(ds);EX={kind:'Reading',ds,offs,done:false,t0:Date.now()};
  bar('Reading · Full test',60);timeUpFn=()=>submitReading(true);
  $('#body').innerHTML=`<div id="res"></div><div class="tabs" id="tbs">${ds.map((d,i)=>`<button class="tab ${i?'':'on'}" data-i="${i}">Passage ${i+1}<small>Questions ${offs[i]+1}–${offs[i]+d.questions.length}</small></button>`).join('')}</div>
  ${ds.map((d,i)=>`<div class="split pn ${i?'hide':''}" id="pn${i}"><div class="pane sc pass"><button class="btn alt hlb" data-i="${i}">Highlight selection</button><button class="btn alt clb" data-i="${i}">Clear</button><div id="ps${i}"><h2>${esc(d.title)}</h2>${d.passage.map(p=>`<p>${esc(p)}</p>`).join('')}</div></div><div class="pane sc">${qHTML(d.questions,'f'+i+'_',offs[i])}</div></div>`).join('')}
  <div class="pane" id="subbox" style="margin-top:14px"><button class="btn" id="sub">Submit test</button><span class="mut"> Move between passages with the tabs. Once you submit, your answers are final.</span></div>`;
  document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x===b));ds.forEach((_,i)=>$('#pn'+i).classList.toggle('hide',i!=b.dataset.i))});
  document.querySelectorAll('.hlb').forEach(b=>b.onclick=()=>{const s=getSelection();if(!s.rangeCount||s.isCollapsed)return;const r=s.getRangeAt(0);if(!$('#ps'+b.dataset.i).contains(r.commonAncestorContainer))return;try{r.surroundContents(document.createElement('mark'))}catch(e){}s.removeAllRanges()});
  document.querySelectorAll('.clb').forEach(b=>b.onclick=()=>document.querySelectorAll('#ps'+b.dataset.i+' mark').forEach(m=>m.replaceWith(...m.childNodes)));
  let armed=false;$('#sub').onclick=()=>{if(!armed){const blank=ds.reduce((a,d,i)=>a+d.questions.filter((q,j)=>!(($('#f'+i+'_'+j)||{}).value||'').trim()).length,0);armed=true;$('#sub').textContent=(blank?blank+' unanswered. ':'')+'Click again to submit';setTimeout(()=>{armed=false;const b=$('#sub');if(b&&!EX.done)b.textContent='Submit test'},5000);return}submitReading(false)}
 }catch(e){fail(e)}}
function submitReading(auto){if(!EX||EX.done||EX.kind!=='Reading')return;EX.done=true;stop();timeUpFn=null;
 const sc=EX.ds.map((d,i)=>markUI(d.questions,'f'+i+'_')),tot=sc.reduce((a,b)=>a+b,0),N=EX.ds.reduce((a,d)=>a+d.questions.length,0),eq=Math.round(tot/N*40),band=convBand('Reading',eq),r=CONV.Reading.find(x=>x[1]===+S.target),mins=Math.max(1,Math.round((Date.now()-EX.t0)/60000));
 document.querySelectorAll('.pane input,.opt.pick').forEach(e=>e.disabled=true);$('#subbox').remove();
 $('#res').innerHTML=rptHTML({label:'Reading · Full test',tag:'IELTS Academic · Full test report',band,third:['Marks',tot+' / '+N,'about '+eq+' / 40 on the IELTS scale'],note:'Passage 1: '+sc[0]+'/'+EX.ds[0].questions.length+'  ·  Passage 2: '+sc[1]+'/'+EX.ds[1].questions.length+'  ·  Passage 3: '+sc[2]+'/'+EX.ds[2].questions.length+'  ·  Time used: about '+mins+' min'+(auto?' (time ran out)':'')+'. '+(band>=+S.target?'Target reached.':'To reach band '+S.target+' you need about '+(r?r[0]:'?')+' out of 40.')+' Scroll down to review every answer with explanations.'});
 rec('Reading','Full test '+tot+'/'+N+' · Band '+band.toFixed(1),band>=+S.target,band);window.scrollTo({top:0,behavior:'smooth'})}

/* ---------------- FULL LISTENING ---------------- */
const LROLE=['Section 1: an everyday conversation between two people (for example booking, enquiring or registering). Questions are mostly form or note completion with names, numbers and spellings, plus one or two multiple choice.','Section 2: a monologue in an everyday setting (for example a guide, a manager or a radio announcement giving information). Questions: completion plus two or three multiple choice.','Section 3: an academic discussion between two or three students, sometimes with a tutor. Questions: multiple choice and completion that test opinions and reasons.','Section 4: a university lecture on an academic subject, given by one speaker. Questions: mostly sentence or note completion.'];
const lsPrompt=(i,t)=>`Write an original IELTS Listening ${LROLE[i]} Loosely about "${t}". The script must be 450-550 words, sound like real speech (natural hesitations, corrections, short replies) and give every answer in the order of the questions. Then write exactly 10 questions in that order: completion answers are 1-3 words or a number, multiple-choice questions have 3 options and the answer is the full text of the correct option. JSON: {"title":str,"context":str,"script":[{"speaker":str,"text":str}],"questions":[{"q":str,"options":[str]|null,"answer":str,"explanation":str}]}`;
async function fullListening(){loading('Recording four sections','listening');
 try{const tp=topics(4);
  let ds=await Promise.all([0,1,2,3].map(i=>ask(lsPrompt(i,tp[i])).catch(()=>null)));
  const okv=ds.every(d=>d&&Array.isArray(d.script)&&d.script.length&&Array.isArray(d.questions)&&d.questions.length>=8);
  if(offline||!okv){offline=true;ds=[OFFB.LS[0],OFFB.LS[2],OFFB.LS[3],OFFB.LS[1]]}
  EX={kind:'Listening',ds,offs:cum(ds),vals:[],cur:null,done:false};
  bar('Listening · Full test',45);stop();timeUpFn=null;$('#tm').style.display='none';{const pg=document.querySelector('.prog');if(pg)pg.style.display='none'}
  $('#body').innerHTML=`<div class="pane" style="max-width:660px;margin:0 auto"><span class="tag">Before you start</span><h2>Listening test</h2><ul class="ml"><li>Four sections of 10 questions each, 40 in total.</li><li>Each recording plays <b>once</b>. There is no replay.</li><li>You get 30 seconds to read the questions before each recording and a short time to check your answers after it. After the last section you have 2 minutes for a final check.</li><li>You cannot go back to an earlier section.</li><li>Put on headphones and set your volume now. Your device's own voices read the recordings.</li></ul><button class="btn" id="st">Start Section 1</button></div>`;
  $('#st').onclick=()=>lsSection(0)}catch(e){fail(e)}}
function lsCollect(i){const d=EX.ds[i];EX.vals[i]=d.questions.map((q,j)=>{const el=$('#g'+i+'_'+j);return el?el.value:''})}
function lsSection(i){if(!EX||EX.done)return;const d=EX.ds[i],off=EX.offs[i];EX.cur=i;try{speechSynthesis.cancel()}catch(e){}
 $('#body').innerHTML=`<div class="split"><div class="pane"><span class="tag">Section ${i+1} of 4</span><h2>${esc(d.title)}</h2><p>${esc(d.context)}</p><div class="phase" id="ph"></div><p class="mut">Questions ${off+1}–${off+d.questions.length}. You cannot return to this section.</p></div><div class="pane sc">${qHTML(d.questions,'g'+i+'_',off)}</div></div>`;
 const setPh=(t,n)=>{$('#ph').innerHTML=`<div class="phl">${t}</div>`+(n!=null?`<div class="phn" id="pn">${n}</div>`:'<div class="wave"><i></i><i></i><i></i><i></i><i></i></div>')};
 const countdown=(label,secs,done)=>{let c=secs;setPh(label,c);const iv=setInterval(()=>{if(!$('#pn')||EX.done||EX.cur!==i){clearInterval(iv);return}c--;$('#pn').textContent=c;if(c<=0){clearInterval(iv);done()}},1000)};
 const next=()=>{if(!EX||EX.done||EX.cur!==i)return;lsCollect(i);i<3?lsSection(i+1):finishListening()};
 const check=()=>i===3?countdown('Final check. You have 2 minutes to review your answers.',120,next):countdown('Check your answers',20,next);
 const play=()=>{if(!$('#ph'))return;setPh('Listening. The recording plays once.');let over=false;const go=()=>{if(over||!$('#ph')||EX.done||EX.cur!==i)return;over=true;clearTimeout(EX.guard);check()};
  speak(d.script,go);const words=d.script.map(l=>l.text).join(' ').split(/\s+/).length;EX.guard=setTimeout(()=>{try{speechSynthesis.cancel()}catch(e){}go()},Math.max(30000,words/2.2*1400+8000))};
 countdown('Read the questions',30,play)}
function finishListening(){if(!EX||EX.done||EX.kind!=='Listening')return;EX.done=true;stop();timeUpFn=null;clearTimeout(EX.guard);
 if(EX.cur!=null&&!EX.vals[EX.cur]&&$('#ph'))lsCollect(EX.cur);
 let tot=0,N=0;const rows=EX.ds.map((d,i)=>{const v=EX.vals[i]||[];let s=0;const items=d.questions.map((q,j)=>{const ok=isRight(q,v[j]||'');if(ok)s++;return{n:EX.offs[i]+j+1,u:v[j]||'',a:showAns(q),ok}});tot+=s;N+=d.questions.length;return{s,n:d.questions.length,items,d}});
 const eq=Math.round(tot/N*40),band=convBand('Listening',eq),r=CONV.Listening.find(x=>x[1]===+S.target);
 const rev=rows.map((o,i)=>`<details class="pane rv"><summary><b>Section ${i+1}: ${esc(o.d.title)}</b> <span class="mut">${o.s} / ${o.n}</span></summary><div class="tw"><table class="ct"><tr><th>No.</th><th>Your answer</th><th>Correct answer</th><th></th></tr>${o.items.map(x=>`<tr><td>${x.n}</td><td>${esc(x.u||'(blank)')}</td><td>${esc(x.a)}</td><td class="${x.ok?'ok':'bad'}">${x.ok?'✓':'✗'}</td></tr>`).join('')}</table></div><details><summary class="mut">Show transcript</summary><div class="pass">${o.d.script.map(l=>`<p><b>${esc(l.speaker)}:</b> ${esc(l.text)}</p>`).join('')}</div></details></details>`).join('');
 $('#body').innerHTML=rptHTML({label:'Listening · Full test',tag:'IELTS Academic · Full test report',band,third:['Marks',tot+' / '+N,'about '+eq+' / 40 on the IELTS scale'],note:rows.map((o,i)=>'Section '+(i+1)+': '+o.s+'/'+o.n).join('  ·  ')+'. '+(band>=+S.target?'Target reached.':'To reach band '+S.target+' you need about '+(r?r[0]:'?')+' out of 40.')+' Open each section below to review your answers.'})+rev+'<p><button class="btn alt" onclick="modeChooser(\'listening\')">Back to Listening</button></p>';
 rec('Listening','Full test '+tot+'/'+N+' · Band '+band.toFixed(1),band>=+S.target,band);window.scrollTo({top:0,behavior:'smooth'})}
