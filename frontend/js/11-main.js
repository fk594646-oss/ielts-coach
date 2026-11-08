/* Theme switch and app start-up */
const isDark=()=>{const t=document.documentElement.dataset.theme;return t?t==='dark':matchMedia('(prefers-color-scheme:dark)').matches};
function syncTh(){const d=isDark();$('#th').dataset.m=d?'dark':'light';$('#tt').textContent=d?'Dark theme':'Light theme'}
function setTheme(next){const r=document.documentElement;r.classList.add('theming');r.dataset.theme=next;syncTh();clearTimeout(window._tt);window._tt=setTimeout(()=>r.classList.remove('theming'),2600)}
$('#th').onclick=()=>setTheme(isDark()?'light':'dark');syncTh();
Object.assign(window,{retryAI,login,logout,profile,tips,claim,home,reading,writing,listening,speaking});
(async()=>{await probe();if(srv){P.cur=null;S=fresh();if(tokenGet()){try{const m=await api('/me');adopt(m.user)}catch(e){tokenClear()}}}const q=new URLSearchParams(location.search),rt=q.get('reset');
if(rt&&srv){history.replaceState(null,'',location.pathname);authReset(rt)}else home();
if(q.get('verified')){toast('Email verified. You can sign in now.');history.replaceState(null,'',location.pathname)}
if(q.get('verify_error')){toast('That verification link is invalid or has expired.');history.replaceState(null,'',location.pathname)}
getSample()})();
