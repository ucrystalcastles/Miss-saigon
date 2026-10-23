// An additional prototype lock inside the existing Sites access boundary.
const COOKIE='__Host-menu-mentor-pin',DURATION=7*86400,WINDOW=300000,MAX_ATTEMPTS=8;
const json=(data,status=200,headers={})=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...headers}});
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
export const digest=async text=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)));
export async function pinHash(pin,salt){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:Uint8Array.from(salt.match(/../g),b=>parseInt(b,16)),iterations:100000,hash:'SHA-256'},key,256));}
function config(env){try{const c=JSON.parse(env.PROTOTYPE_PIN_HASH||'null');return c&&/^[a-f0-9]{32}$/.test(c.salt)&&/^[a-f0-9]{64}$/.test(c.hash)?c:null;}catch{return null;}}
function tokenFrom(request){const raw=request.headers.get('Cookie')||'';return raw.split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';}
async function sessionKey(request){const token=tokenFrom(request);return /^[a-f0-9]{64}$/.test(token)?'pin-session:'+await digest(token):null;}
async function isUnlocked(request,db,c){if(!c)return false;const key=await sessionKey(request);if(!key)return false;const row=await db.prepare('SELECT value FROM records WHERE id = ?').bind(key).first();if(!row)return false;try{const s=JSON.parse(row.value);return s.expires>Date.now()&&s.version===c.hash;}catch{return false;}}
export async function pinAccess(request,env){
 const path=new URL(request.url).pathname,db=env.DB,c=config(env);
 if(path==='/api/session'&&request.method==='GET')return json({unlocked:await isUnlocked(request,db,c)});
 if(path==='/api/logout'&&request.method==='POST'){const key=await sessionKey(request);if(key)await db.prepare('DELETE FROM records WHERE id = ?').bind(key).run();return json({unlocked:false},200,{'Set-Cookie':`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`});}
 if(path==='/api/login'&&request.method==='POST'){
  if(!c)return json({error:'Sign-in is unavailable. Please try again shortly.'},503);
  let input;try{input=await request.json();}catch{return json({error:'Enter a four-digit PIN.'},400);}
  if(!input||typeof input.pin!=='string'||!/^\d{4}$/.test(input.pin))return json({error:'Enter a four-digit PIN.'},400);
  const now=Date.now(),window=Math.floor(now/WINDOW),client=await digest(request.headers.get('CF-Connecting-IP')||'prototype');
  const rateKey=`pin-rate:${window}:${client}`;
  const rate=await db.prepare("INSERT INTO records(id,value) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=json_set(records.value,'$.count',json_extract(records.value,'$.count')+1) RETURNING value").bind(rateKey,JSON.stringify({count:1,expires:(window+1)*WINDOW})).first();
  if(JSON.parse(rate.value).count>MAX_ATTEMPTS)return json({error:'Too many attempts. Please try again in a few minutes.'},429,{'Retry-After':String(Math.ceil(((window+1)*WINDOW-now)/1000))});
  const hash=await pinHash(input.pin,c.salt);let diff=0;for(let i=0;i<hash.length;i++)diff|=hash.charCodeAt(i)^c.hash.charCodeAt(i);
  if(diff)return json({error:'Incorrect PIN.'},401);
  const token=hex(crypto.getRandomValues(new Uint8Array(32))),key='pin-session:'+await digest(token);
  await db.batch([db.prepare('INSERT INTO records(id,value) VALUES (?,?)').bind(key,JSON.stringify({version:c.hash,expires:now+DURATION*1000})),db.prepare("DELETE FROM records WHERE (id LIKE 'pin-session:%' OR id LIKE 'pin-rate:%') AND json_extract(value,'$.expires') < ?").bind(now)]);
  return json({unlocked:true},200,{'Set-Cookie':`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DURATION}`});
 }
 if(!await isUnlocked(request,db,c))return json({error:'Enter your PIN to continue.'},401);
 return null;
}
