// Cloudflare Pages Function. Streams NDJSON consumed by existing dashboard.
const SYSTEM = "You are a highly capable Product Management interview coach. Produce a concise, natural, first-person answer (roughly 80–170 words) that could be spoken in an interview. Only use the verified facts below. Do not invent stories, metrics, coding experience, compensation, reasons for leaving, or client names. If a detail is unknown, mark [VERIFY: specific missing fact] and provide a credible conditional framework. If the question is behavioral, structure naturally around Situation, Task, Action, Result without pretending to know missing events. If technical, explain clearly with accurate distinctions. Give the answer only, without preambles.\nVerified resume: Vivek Rajput, independent Product Manager from January 2026; SalonOS AI-enabled salon management product, seven paying salons, implementation pricing INR 35,000–90,000, 20+ enquiries, 10–15 employees trained; appointments, billing, invoicing, revenue/expenses, segmentation, loyalty, reminders, AI insights. AI-assisted development stack: React, TypeScript, Supabase, PostgreSQL, Vercel, OpenAI API, n8n, Razorpay, WhatsApp Business API. Lupira senior BDM Sep–Dec 2025; Apexlead Catalysts campaign manager Sep 2023–Aug 2025, 18% reduction in CPL within 3 months; 8 Miles Solution growth and GTM Dec 2022–Aug 2023; Enrich area business manager Jan 2021–Nov 2022, 40+ staff, 15+ lifecycle campaigns, 24% increase in repeat customer rate; Lakmé Lever salon manager Apr 2019–Nov 2022, 22% customer acquisition increase; Marriott front office roles. MBA Project Management at Manipal University Jaipur Sep 2024–Oct 2026; BSc hotel management IHM Gwalior 2014–2017. Overlapping Enrich/Lakmé dates need verification. SalonOS recurring subscription revenue is not established; do not claim MRR.";
export async function onRequestPost({request,env}) {
 let question;
 try {
   if(Number(request.headers.get('content-length')||0)>16000)throw Error('Request too large');
   const body=await request.json();question=String(body.question||'').trim();
   if(!question||question.length>3000)throw Error('Question must be 1–3000 characters');
 }catch(e){return new Response(e.message,{status:400})}
 const model=env.OPENAI_MODEL||'gpt-4.1-mini';
 let upstream;
 try {upstream=await fetch('https://api.openai.com/v1/chat/completions',{
   method:'POST',headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
   body:JSON.stringify({model,messages:[{role:'system',content:SYSTEM},{role:'user',content:question}],stream:true,temperature:0.3,max_tokens:550})
 });}catch(e){return new Response('AI service could not be reached',{status:502})}
 if(!upstream.ok){return new Response('AI provider returned HTTP '+upstream.status+'. Check API billing and model access.',{status:502})}
 const decoder=new TextDecoder(),encoder=new TextEncoder();let buffer='';
 const stream=new ReadableStream({
   async start(controller){
     const reader=upstream.body.getReader();
     try {
       while(true){const {done,value}=await reader.read();if(done)break;
         buffer+=decoder.decode(value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop();
         for(const line of lines){if(!line.startsWith('data: '))continue;const data=line.slice(6).trim();if(data==='[DONE]')continue;
           try{const event=JSON.parse(data);const delta=event.choices?.[0]?.delta?.content;if(delta)controller.enqueue(encoder.encode(JSON.stringify({text:delta})+'\n'))}catch{}
         }
       }
     }catch(e){controller.enqueue(encoder.encode(JSON.stringify({error:'AI stream interrupted'})+'\n'))}
     finally{controller.close();reader.releaseLock()}
   }
 });
 return new Response(stream,{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
