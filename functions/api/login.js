const enc=new TextEncoder();
async function digest(s){return new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s)))}
async function sign(secret, msg){const k=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',k,enc.encode(msg))),b=>b.toString(16).padStart(2,'0')).join('')}
export async function onRequestPost({request,env}){
 if(!env.APP_PASSWORD)return new Response('Dashboard password is not configured',{status:503});
 let body;try{body=await request.json()}catch{return new Response('Invalid JSON',{status:400})}
 const supplied=String(body.password||'');if(supplied.length>256)return new Response('Invalid password',{status:400});
 const a=await digest(supplied),b=await digest(env.APP_PASSWORD);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];
 if(diff)return new Response('Incorrect password',{status:401});
 const expires=String(Date.now()+12*60*60*1000),signature=await sign(env.APP_PASSWORD,'interview-session-v1:'+expires);
 return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json','Set-Cookie':`copilot_session=${expires}.${signature}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`,'Cache-Control':'no-store'}});
}
