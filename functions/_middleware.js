const LOGIN_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Interview Copilot - Sign in</title>
<style>
body{font:16px system-ui;background:#eef3fb;color:#152541;display:grid;place-items:center;min-height:100vh;margin:0}
main{background:white;border:1px solid #d8e2f0;border-radius:16px;padding:30px;max-width:390px;width:90%}
input,button{box-sizing:border-box;width:100%;padding:13px;border-radius:9px;margin-top:12px;font:inherit}
input{border:1px solid #c9d6e6}button{background:#2458bd;color:white;border:0;cursor:pointer}
p{color:#63728a}#status{color:#aa2840}
</style></head><body><main>
<h2>Interview Command Center</h2><p>Sign in with your private dashboard password.</p>
<form id="f"><input type="password" id="password" placeholder="Dashboard password" required><button>Open dashboard</button></form>
<p id="status" role="alert"></p></main>
<script>
document.getElementById('f').onsubmit=async e=>{
e.preventDefault();
let s=document.getElementById('status');s.textContent='Signing in...';
try{
let r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:document.getElementById('password').value})});
if(!r.ok)throw Error('Incorrect password or server not configured');
location.replace('/');
}catch(err){s.textContent=err.message}
};
</script></body></html>`;
const enc = new TextEncoder();
async function hmac(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
  return Array.from(bytes, b=>b.toString(16).padStart(2,'0')).join('');
}
export async function onRequest(context) {
  const {request,env,next} = context;
  const path = new URL(request.url).pathname;
  if (path === '/api/login' || path === '/favicon.ico') return next();
  if (!env.APP_PASSWORD || !env.OPENAI_API_KEY) return new Response('Set APP_PASSWORD and OPENAI_API_KEY in Cloudflare Pages settings.',{status:503});
  const cookie = request.headers.get('Cookie')||'';
  const token = cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('copilot_session='))?.slice('copilot_session='.length);
  let valid = false;
  if(token) {
    const [expires,sig] = token.split('.');
    if(/^\d{10,14}$/.test(expires||'') && /^[a-f0-9]{64}$/.test(sig||'') && Number(expires)>Date.now()) {
      valid = (await hmac(env.APP_PASSWORD, 'interview-session-v1:'+expires))===sig;
    }
  }
  if (!valid) {
    if(path.startsWith('/api/')) return new Response('Session expired. Refresh and sign in.',{status:401});
    return new Response(LOGIN_HTML, {status:200, headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  const response = await next();
  response.headers.set('Cache-Control','private, no-store');
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('Referrer-Policy','no-referrer');
  return response;
}
