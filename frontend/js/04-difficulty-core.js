/* Difficulty calibration, modules list, colours, shared helpers */
const HUMAN=`Style rules: write like a real person, not a chatbot. Use plain, natural English with varied sentence length, concrete details and a natural voice. Avoid cliches and filler such as "delve", "tapestry", "in today's world", "it is important to note", "moreover", "landscape" and "testament". No emojis. Target difficulty: ${'${LV}'}.`;
let cur=null;
const LB={'Band 5-6':5.5,'Band 6-7':6.5,'Band 7-8':7.5};
function DF(){const E=(LB[S.level]+ +S.target)/2,t=E<5.75?0:E<6.5?1:E<7.25?2:E<8?3:4;return{E:(Math.round(E*2)/2).toFixed(1),t,wc:[450,520,600,680,750][t],sl:['220-260','260-300','300-350','350-400','400-450'][t]}}
const calText=()=>'Tasks are calibrated to about band '+DF().E+'. Raise the target band or the task difficulty for harder material, lower either one for easier tasks.';
const G={
reading:['Use everyday vocabulary, short clear sentences and answers that are easy to locate with simple paraphrasing. Very few distractors.','Mostly common vocabulary with some topic words, clear paragraph structure and moderate paraphrasing.','Academic vocabulary, longer sentences, some inference, noticeable paraphrasing and a few distractors.','Dense academic prose, abstract ideas, subtle paraphrasing, strong distractors and genuine Not Given traps.','University-journal density and nuance, heavy paraphrasing, questions needing inference across paragraphs, very tempting distractors.'],
writing:['Task 1: simple data with few categories. Task 2: familiar, concrete topics.','Task 1: moderate data with clear trends. Task 2: everyday social topics.','Task 1: several categories or a detailed process or map. Task 2: standard IELTS topics needing balanced arguments.','Task 1: complex multi-part data. Task 2: abstract topics needing nuance and weighing of ideas.','Task 1: dense multi-source data with subtle comparisons. Task 2: abstract, policy-heavy topics that demand sophisticated argument.'],
listening:['Slow, clear speech, one accent, answers stated directly, no changes of mind.','Clear natural speech, few corrections, simple distractors.','Natural speed, some self-corrections and distractors, mixed accents.','Fast natural speech, frequent corrections, close distractors, academic vocabulary.','Fast dense academic talk with several speakers, interruptions, subtle attitude questions and close distractors.'],
speaking:['Simple personal topics and concrete, easy Part 3 questions.','Familiar topics and fairly concrete Part 3 questions.','Standard topics; Part 3 questions requiring reasons and comparisons.','Part 2 topic needing description and reflection; abstract, societal Part 3 questions.','Part 2 topic demanding reflection and nuance; highly abstract, hypothetical Part 3 questions that need evaluation of trade-offs.']};
const hs=(gen=true)=>{const d=DF();return HUMAN.replace('${LV}',gen?`about IELTS band ${d.E} (task difficulty ${S.level}, target band ${S.target}). ${(G[cur]||[])[d.t]||''}`:'not applicable here; mark strictly against the official band descriptors')};
const MODS=[
 {k:'reading',t:'Reading',f:'60 min · 3 passages · 40 questions',d:'A fresh passage with a highlighter, laid out like the on-screen test.'},
 {k:'writing',t:'Writing',f:'60 min · Task 1 and Task 2',d:'Type your answer with a live word count, then get straight-talking feedback.'},
 {k:'listening',t:'Listening',f:'About 30 min · 40 questions',d:'One play only, just like the real thing. Bring headphones.'},
 {k:'speaking',t:'Speaking',f:'11 to 14 min · 3 parts',d:'Talk to a virtual examiner, by voice or by typing.'}];
const PAL={reading:['#2563eb','#0891b2'],writing:['#059669','#65a30d'],listening:['#7c3aed','#c026d3'],speaking:['#ea580c','#d97706']};
function pal(k){const v=$('#view');if(!k){v.removeAttribute('style');return}v.style.setProperty('--a1',PAL[k][0]);v.style.setProperty('--a2',PAL[k][1])}
let timeUpFn=null;
function stop(){clearInterval(tick);tick=null;timeUpFn=null;try{speechSynthesis.cancel()}catch(e){}}
function streak(){const d=[...new Set(S.h.map(x=>x.d))].sort().reverse();let n=0,c=new Date();c.setHours(0,0,0,0);
 for(const x of d){const k=ld(c);if(x===k){n++;c.setDate(c.getDate()-1)}else if(n===0){c.setDate(c.getDate()-1);if(x===ld(c)){n++;c.setDate(c.getDate()-1)}else break}else break}return n}
function count(el,to){let i=0;const s=Math.max(1,Math.ceil(to/25));const t=setInterval(()=>{i=Math.min(to,i+s);el.textContent=i;if(i>=to)clearInterval(t)},30)}
function confetti(){for(let i=0;i<40;i++){const e=document.createElement('i');e.className='cf';e.style.left=Math.random()*100+'vw';e.style.background=pick(['#e8590c','#c2255c','#ffd43b','#40c057','#339af0']);e.style.animationDelay=Math.random()*.6+'s';document.body.appendChild(e);setTimeout(()=>e.remove(),3400)}}
