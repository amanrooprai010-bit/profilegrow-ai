const SYSTEM = `You are ProfileGrow AI, an expert Instagram growth consultant for local businesses. Analyze only the information supplied by the user. Do not claim to know private analytics or facts not visible in screenshots. Give specific, practical, ethical advice in clear English. Avoid vanity-metric promises. Return valid JSON only.`;

const demo = {
 businessName:"Sunrise Bakery", score:68, summary:"Your profile looks appealing, but visitors do not get a fast, compelling reason to visit or order. Clearer local positioning and a simpler buying path can turn more profile views into customers.",
 metrics:[{name:"Profile & bio",score:55},{name:"Content quality",score:81},{name:"Local discovery",score:49},{name:"Conversion",score:62}],
 problems:[
  {severity:"High",title:"The bio lacks a clear local promise",evidence:"The offer, neighborhood and reason to choose the business are not immediately clear.",solution:"Lead with the signature product, location and one direct order action.",example:"Fresh pastries baked daily in East Austin 🥐"},
  {severity:"High",title:"There is no direct order path",evidence:"A general homepage adds steps for mobile visitors who are ready to buy.",solution:"Link directly to pre-orders, WhatsApp or the current menu.",example:"Pre-order tomorrow’s pastry box ↓"},
  {severity:"Medium",title:"Reels need stronger local discovery signals",evidence:"Product videos are attractive, but hooks and location context are weak.",solution:"Name the city or neighborhood in the opening text, caption and spoken hook.",example:"The croissant East Austin wakes up early for."}
 ],
 bio:"East Austin bakery 🥐\nSmall-batch pastries baked fresh daily\nPre-order tomorrow’s box ↓",
 pillars:[{name:"Product desire",description:"Close-up products, seasonal drops and best sellers"},{name:"Behind the scenes",description:"Baking process, ingredients and morning preparation"},{name:"Local community",description:"Neighborhood stories, events and collaborations"},{name:"Customer proof",description:"Reviews, reactions and customer favorites"}],
 actions:[
  {week:"Week 1",title:"Fix the conversion foundation",tasks:["Rewrite the bio","Create Order, Menu and Reviews highlights","Replace the general link with a direct order path"]},
  {week:"Week 2",title:"Build a repeatable content system",tasks:["Choose four content pillars","Film three short product videos in one session","Write local-first hooks for each Reel"]},
  {week:"Week 3",title:"Increase local discovery",tasks:["Collaborate with one nearby business","Publish one neighborhood guide post","Ask five happy customers for tagged stories"]},
  {week:"Week 4",title:"Review and improve",tasks:["Compare saves, shares and profile actions","Repeat the strongest post format","Plan next month from the results"]}
 ]
};

function schemaPrompt(data){return `Create an Instagram business audit using this context:\nProfile URL: ${data.instagramUrl}\nBusiness type: ${data.businessType||"Not provided"}\nLocation: ${data.location||"Not provided"}\nGoal: ${data.goal||"Get more local customers"}\n\nReturn JSON with exactly this shape: {"businessName":"string","score":number 0-100,"summary":"string","metrics":[{"name":"Profile & bio|Content quality|Local discovery|Conversion","score":number}],"problems":[{"severity":"High|Medium|Low","title":"string","evidence":"string","solution":"string","example":"string"}],"bio":"3-line improved bio","pillars":[{"name":"string","description":"string"}],"actions":[{"week":"Week 1","title":"string","tasks":["string"]}]}. Include exactly 4 metrics, 3-5 problems, 4 pillars and 4 weeks. Base observations on supplied screenshots; clearly frame uncertain points as recommendations.`}

export default async function handler(req,res){
 if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
 try{
  const body=req.body||{};
  if(body.action==="demo") return res.status(200).json(demo);
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:"AI is not configured. Add OPENAI_API_KEY in Vercel, or use the sample audit."});
  if(body.action==="chat"){
   const messages=[{role:"system",content:"You are ProfileGrow Coach. Give concise, specific advice based on the supplied audit. Never invent private Instagram metrics."},{role:"user",content:`Audit: ${JSON.stringify(body.audit||{})}\n\nQuestion: ${String(body.question||"").slice(0,1500)}`}];
   const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.AI_MODEL||"gpt-4.1-mini",messages,temperature:.5,max_tokens:600})});
   const j=await r.json(); if(!r.ok) throw new Error(j.error?.message||"AI request failed");
   return res.status(200).json({answer:j.choices?.[0]?.message?.content||"I could not create an answer."});
  }
  if(!body.instagramUrl) return res.status(400).json({error:"Instagram profile link is required."});
  const content=[{type:"text",text:schemaPrompt(body)}];
  for(const image of (body.images||[]).slice(0,6)){if(typeof image==="string"&&image.startsWith("data:image/")) content.push({type:"image_url",image_url:{url:image,detail:"low"}})}
  const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.AI_MODEL||"gpt-4.1-mini",response_format:{type:"json_object"},messages:[{role:"system",content:SYSTEM},{role:"user",content}],temperature:.35,max_tokens:2600})});
  const j=await r.json(); if(!r.ok) throw new Error(j.error?.message||"AI request failed");
  const parsed=JSON.parse(j.choices?.[0]?.message?.content||"{}");
  return res.status(200).json(parsed);
 }catch(e){return res.status(500).json({error:e.message||"Unable to analyze profile."})}
}
