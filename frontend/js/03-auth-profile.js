/* Left sidebar, sign in / sign up page, profile page */
const AVC=[['#2563eb','#06b6d4'],['#059669','#84cc16'],['#7c3aed','#d946ef'],['#ea580c','#f59e0b'],['#0ea5e9','#6366f1'],['#db2777','#9333ea'],['#0d9488','#22c55e'],['#ca8a04','#f97316']];
const LVL={Beginner:['Band 5-6','6'],Intermediate:['Band 6-7','7'],Advanced:['Band 7-8','8']};
const avatar=(p,z=28)=>p.photo?`<span class="av2" style="width:${z}px;height:${z}px;background:#222 url('${p.photo}') center/cover no-repeat"></span>`:`<span class="av2" style="width:${z}px;height:${z}px;font-size:${z*.45}px;background:linear-gradient(135deg,${AVC[p.av||0][0]},${AVC[p.av||0][1]})">${esc((p.name||'?')[0].toUpperCase())}</span>`;
function pickPhoto(cb){const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=()=>{const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=160;const m=Math.min(im.width,im.height);c.getContext('2d').drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,160,160);cb(c.toDataURL('image/jpeg',.82))};im.src=r.result};r.readAsDataURL(f)};i.click()}
let MSG=`I'm practising for IELTS with IELTS Coach. It makes fresh reading, writing, listening and speaking tasks every time, with streaks and rewards. Join me: ${LINK}`;
function hdr(){const p=P.cur&&P.list[P.cur];$('#shell').classList.toggle('nos',!p);const sd=$('#side');if(!p){sd.innerHTML='';return}
 const lv=1+Math.floor(S.xp/100),cf=cefr(),st=streak();
 sd.innerHTML=`<div class="scard"><div class="sp"><div class="avw" id="avu" title="Change photo">${avatar(p,64)}<span class="cam">${ic('camera',13)}</span></div>${p.photo?'<button class="lnk" id="rmp">Remove photo</button>':'<button class="lnk" id="adp">Add photo</button>'}<h3 style="margin-top:6px">${esc(p.name)}</h3><div class="mut">Level ${lv}${cf?' · CEFR '+cf.c:''}</div><div class="xpb"><i style="width:${S.xp%100}%"></i></div><div class="mut">${S.xp%100} / 100 XP to level ${lv+1}</div><button class="btn alt menu" onclick="this.closest('aside').classList.toggle('open')">Menu</button></div>
 <div class="more"><div class="mini"><div><b>${st}</b>day streak</div><div><b>${S.n||0}</b>sessions</div><div><b>${cf?cf.c:'--'}</b>CEFR</div></div>
 <button class="nv" onclick="home()">${ic('home',18)} Home</button><button class="nv" onclick="profile()">${ic('user',18)} My profile</button><button class="nv" onclick="profile()">${ic('sliders',18)} Edit profile</button>
 <button class="nv" onclick="logout()">${ic('logout',18)} Log out</button></div></div>
 <div class="scard more2"><h3 style="font-size:1.05rem">${ic('users',18)} Invite friends</h3><p class="mut">Send the link and practise together. Everyone keeps their own profile and progress.</p>
 <button class="btn" id="cp">Copy invite</button><button class="btn alt" id="sh">Share</button><a class="btn alt" style="text-decoration:none;display:inline-block" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(MSG)}">WhatsApp</a>
 <textarea id="iv" readonly style="display:none;min-height:100px;margin-top:8px"></textarea>
 <p class="mut" style="font-size:.75rem;margin:8px 0 0">Friends can open the link only if sharing is on for this page in Claude.</p></div>`;
 const up=()=>pickPhoto(u=>{p.photo=u;save();hdr()});$('#avu').onclick=up;if($('#adp'))$('#adp').onclick=up;if($('#rmp'))$('#rmp').onclick=()=>{p.photo=null;save();hdr()};
 $('#cp').onclick=async()=>{try{await navigator.clipboard.writeText(MSG);$('#cp').textContent='Copied!'}catch(e){const t=$('#iv');t.style.display='block';t.value=MSG;t.select();$('#cp').textContent='Copy the text above'}};
 if(navigator.share)$('#sh').onclick=()=>navigator.share({text:MSG}).catch(()=>{});else $('#sh').style.display='none'}
function login(id){P.cur=id;S={...fresh(),...P.list[id].S};P.list[id].S=S;save();home()}
function logout(){stop();save();pushSrv(true);tokenClear();P.cur=null;S=fresh();save();home()}
let authTab='in';
async function hashPw(pw,salt){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+pw));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){let h=5381;const t=salt+pw;for(let i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;return'x'+h}}
function auth(){stop();pal();hdr();const up=authTab==='up',legacy=Object.entries(P.list).filter(([id,p])=>!p.email&&!srv);
 $('#view').innerHTML=`<div class="auth rise"><div class="ab"><div><div class="alogo">IELTS Coach</div><h2>Your path to a higher IELTS band.</h2><p>Practise Reading, Writing, Listening and Speaking with fresh tasks every time.</p>
 <ul><li>${ic('check',18)} New tasks across all four modules</li><li>${ic('check',18)} Band score, CEFR level and a full report</li><li>${ic('check',18)} Streaks, XP and rewards to keep you going</li></ul></div><small>Practice results are estimates, not official IELTS scores.</small></div>
 <div class="af"><div class="seg"><button class="${up?'':'on'}" data-t="in">Sign in</button><button class="${up?'on':''}" data-t="up">Sign up</button></div>
 <h2>${up?'Create your account':'Welcome back'}</h2><p class="mut">${up?'Start practising in under a minute.':'Sign in to continue your practice.'}</p>
 ${up?`<label for="an">Full name</label><div class="fi">${ic('user',18)}<input type="text" id="an" autocomplete="name" placeholder="Your full name"></div>`:''}
 <label for="ae">Email</label><div class="fi">${ic('mail',18)}<input type="email" id="ae" autocomplete="email" placeholder="you@example.com"></div>
 <label for="ap">Password</label><div class="pw fi">${ic('lock',18)}<input type="password" id="ap" autocomplete="${up?'new-password':'current-password'}" placeholder="${up?'At least 8 characters':'Your password'}"><button type="button" class="eye" id="ey" aria-label="Show password">${ic('eye',18)}</button></div>
 ${!up&&srv?'<div style="text-align:right;margin-top:8px"><button type="button" class="lnk2" id="fgt">Forgot password?</button></div>':''}
 ${up?'<div class="meter"><i id="ms"></i></div><div class="mut" id="mt" style="font-size:.78rem">Use 8 or more characters.</div>':''}
 <div class="err" id="ar" role="alert"></div>
 <button class="btn full" id="go">${up?'Create account':'Sign in'}</button>
 <p class="mut" style="text-align:center;margin:14px 0 0">${up?'Already have an account?':'New here?'} <button class="lnk2" id="swt">${up?'Sign in':'Create an account'}</button></p>
 ${legacy.length?`<p class="leg">Practice profile found on this device: ${legacy.map(([id,p])=>`<button class="lnk2" data-id="${id}">${esc(p.name)}</button>`).join(', ')}. Continue without a password.</p>`:''}
 <p class="mut" style="font-size:.75rem;text-align:center;margin:10px 0 0">${srv?'Your progress is saved to your account.':'Accounts are stored on this device only.'}</p></div></div>`;
 document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{authTab=b.dataset.t;auth()});$('#swt').onclick=()=>{authTab=up?'in':'up';auth()};if(srv&&!up)$('#fgt').onclick=authForgot;
 document.querySelectorAll('.leg [data-id]').forEach(b=>b.onclick=()=>login(b.dataset.id));
 $('#ey').onclick=()=>{const i=$('#ap'),h=i.type==='password';i.type=h?'text':'password';$('#ey').innerHTML=ic(h?'eyeoff':'eye',18)};
 if(up)$('#ap').oninput=()=>{const v=$('#ap').value,sc=(v.length>=8)+(v.length>=12)+/[A-Z]/.test(v)+/[0-9]/.test(v)+/[^A-Za-z0-9]/.test(v),L=['Too weak','Weak','Fair','Good','Strong','Very strong'];$('#ms').style.width=sc*20+'%';$('#ms').style.background=sc<3?'#ef4444':sc<4?'#f59e0b':'#22c55e';$('#mt').textContent=v?L[sc]:'Use 8 or more characters.'};
 document.querySelectorAll('.af input').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter')$('#go').click()});
 $('#go').onclick=async()=>{const er=$('#ar'),email=$('#ae').value.trim().toLowerCase(),pw=$('#ap').value;er.textContent='';
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){er.textContent='Enter a valid email address.';return}
  $('#go').disabled=true;
  if(srv){try{if(up){if(!$('#an').value.trim())throw{message:'Enter your full name.'};if(pw.length<8)throw{message:'Your password needs at least 8 characters.'}}
   const r=await api(up?'/signup':'/login',{method:'POST',body:{name:up?$('#an').value.trim():undefined,email,password:pw}});if(r.needsVerify){authSent(email);return}tokenSet(r.token);adopt(r.user);home();toast(up?'Welcome, '+r.user.name.split(' ')[0]+'!':'Welcome back!');return}
   catch(e){if(e.code==='unverified'){authSent(email,'unverified');return}er.textContent=e.message||'Something went wrong. Please try again.'}$('#go').disabled=false;return}
  if(up){const n=$('#an').value.trim();
   if(!n)er.textContent='Enter your full name.';else if(pw.length<8)er.textContent='Your password needs at least 8 characters.';else if(Object.values(P.list).some(p=>p.email===email))er.textContent='An account with this email already exists. Try signing in.';
   else{const salt=Math.random().toString(36).slice(2)+Date.now().toString(36),hash=await hashPw(pw,salt),id=Date.now().toString(36);P.list[id]={name:n,email,salt,hash,av:0,st:'Intermediate',S:{...fresh(),level:'Band 6-7',target:'7'}};login(id);toast('Welcome, '+n.split(' ')[0]+'!');return}
  }else{const e=Object.entries(P.list).find(([id,p])=>p.email===email);
   if(!e||await hashPw(pw,e[1].salt)!==e[1].hash)er.textContent='Incorrect email or password.';else{login(e[0]);return}}
  $('#go').disabled=false}}
function profile(){if(!P.cur){auth();return}stop();pal();hdr();const p=P.list[P.cur],st=streak(),cf=cefr(),lv=1+Math.floor(S.xp/100);
 const msg=`I'm practising for IELTS with IELTS Coach. It makes fresh reading, writing, listening and speaking tasks every time, with streaks and rewards. Join me: ${LINK}`;
 $('#view').innerHTML=`<div class="hero rise" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">${avatar(p,74)}<div><span class="tag">Your profile</span><h1 style="font-size:2rem">${esc(p.name)}</h1><p style="margin:2px 0 0">Level ${lv} · ${S.xp} XP · ${st}-day streak${cf?' · CEFR '+cf.c:''}</p></div></div>
 <div style="max-width:640px"><div class="dc rise" style="--i:1"><h3>Edit profile</h3><label class="mut">Name</label><input type="text" id="en" value="${esc(p.name)}" maxlength="24">
 <label class="mut">My level</label><select id="el">${Object.keys(LVL).map(l=>`<option ${l==p.st?'selected':''}>${l}</option>`).join('')}</select>
 <label class="mut">Target band</label><select id="et">${['5.5','6','6.5','7','7.5','8','8.5'].map(b=>`<option ${b==S.target?'selected':''}>${b}</option>`).join('')}</select>
 <label class="mut">Task difficulty</label><select id="ed">${['Band 5-6','Band 6-7','Band 7-8'].map(b=>`<option ${b==S.level?'selected':''}>${b}</option>`).join('')}</select>
 <button class="btn" id="sv">Save changes</button><button class="btn alt" onclick="logout()">Log out</button><button class="btn alt" id="dl">Delete profile</button><div class="mut" id="sm"></div></div>
 </div>`;

 $('#sv').onclick=()=>{const n=$('#en').value.trim();if(!n)return;p.name=n;p.st=$('#el').value;S.target=$('#et').value;S.level=$('#ed').value;save();hdr();toast('Profile saved');profile()};
 let sure=false;$('#dl').onclick=()=>{if(!sure){sure=true;$('#dl').textContent='Tap again to delete for good';return}delete P.list[P.cur];P.cur=null;S=fresh();save();home()};secCard(p)}
