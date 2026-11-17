// Protect every route except the login page and login endpoint.
const enc = new TextEncoder();
async function hmac(secret, message) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
  return Array.from(bytes, b=>b.toString(16).padStart(2,'0')).join('');
}
export async function onRequest(context) {
  const {request,env,next} = context;
  const path = new URL(request.url).pathname;
if (
  path === '/login' ||
  path === '/login/' ||
  path === '/login.html' ||
  path === '/api/login' ||
  path === '/favicon.ico'
) return next();
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
    return Response.redirect(new URL('/login.html',request.url),302);
  }
  const response = await next();
  response.headers.set('Cache-Control','private, no-store');
  response.headers.set('X-Content-Type-Options','nosniff');
  response.headers.set('Referrer-Policy','no-referrer');
  return response;
}
