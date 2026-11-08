/* Password & security card on the profile page: change password, delete account */
async function changePw(p,cur,nw){
 if(srv&&p.srv){const r=await api('/password',{method:'PUT',body:{current:cur,password:nw}});tokenSet(r.token);return}
 if(await hashPw(cur,p.salt)!==p.hash)throw{message:'Your current password is not correct.'};
 p.salt=Math.random().toString(36).slice(2)+Date.now().toString(36);p.hash=await hashPw(nw,p.salt);save()}
function secCard(p){const server=srv&&p.srv;if(!server&&!(p.email&&p.salt))return;
 $('#view').lastElementChild.insertAdjacentHTML('beforeend',`<div class="dc rise" style="--i:2;margin-top:18px"><h3>${ic('lock',18)} Password &amp; security</h3>
 <label class="mut">Current password</label><input type="password" id="cp0" autocomplete="current-password">
 <label class="mut">New password (at least 8 characters)</label><input type="password" id="cp1" autocomplete="new-password">
 <label class="mut">Confirm new password</label><input type="password" id="cp2" autocomplete="new-password">
 <div class="err" id="cpe" style="min-height:20px;margin-top:8px"></div><button class="btn" id="cpb">Update password</button>
 ${server?`<hr style="border:0;border-top:1px solid var(--bd);margin:18px 0"><h3 style="color:var(--bad)">Delete account</h3><p class="mut">This permanently deletes your account and all your progress. Enter your password to confirm.</p><input type="password" id="dpw" autocomplete="current-password" placeholder="Your password"><div class="err" id="dae" style="min-height:20px;margin-top:8px"></div><button class="btn alt" id="dab" style="color:var(--bad);border-color:var(--bad)">Delete my account</button>`:''}</div>`);
 $('#cpb').onclick=async()=>{const er=$('#cpe'),c=$('#cp0').value,n=$('#cp1').value;er.style.color='';er.textContent='';
  if(!c){er.textContent='Enter your current password.';return}if(n.length<8){er.textContent='Your new password needs at least 8 characters.';return}
  if(n!==$('#cp2').value){er.textContent='The new passwords do not match.';return}if(n===c){er.textContent='Choose a password different from your current one.';return}
  $('#cpb').disabled=true;try{await changePw(p,c,n);['cp0','cp1','cp2'].forEach(i=>$('#'+i).value='');toast(server?'Password updated. Other devices were signed out.':'Password updated.')}catch(e){er.textContent=e.message||'Could not update the password.'}$('#cpb').disabled=false};
 if(server){const d=$('#dl');if(d)d.remove();
  $('#dab').onclick=async()=>{const er=$('#dae'),pw=$('#dpw').value;er.textContent='';if(!pw){er.textContent='Enter your password to confirm.';return}
   $('#dab').disabled=true;try{await api('/delete-account',{method:'POST',body:{password:pw}});delete P.list[P.cur];tokenClear();P.cur=null;S=fresh();save();home();toast('Your account was deleted.')}catch(e){er.textContent=e.message||'Could not delete the account.';$('#dab').disabled=false}}}}
