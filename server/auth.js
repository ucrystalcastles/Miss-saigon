import {digest,pinHash} from '../src/pin-auth.js';
import {recordGet,recordDelete} from './supabase.js';
export const COOKIE='__Host-menu-mentor-pin';const DURATION=604800,WINDOW=300000;
const hex=bytes=>Buffer.from(bytes).toString('hex');
export async function authConfig(env){if(env.PROTOTYPE_PIN_HASH){try{const c=JSON.parse(env.PROTOTYPE_PIN_HASH);if(/^[a-f0-9]{32}$/.test(c.salt)&&/^[a-f0-9]{64}$/.test(c.hash))return{...c,mode:'pbkdf2'};}catch{}return null;}if(typeof env.APP_PIN==='string'&&/^\d{4}$/.test(env.APP_PIN))return {hash:await digest(env.APP_PIN),mode:'sha256'};return null;}
async function sessionKey(request){const token=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);return token&&/^[a-f0-9]{64}$/.test(token)?'pin-session:'+await digest(token):null;}
export async function getSession(request,s,config){const id=await sessionKey(request);if(!id||!config)return null;const data=await recordGet(s,id);return data?.expires>Date.now()&&data.version===config.hash?{id,...data}:null;}
export async function login(request,s,config){if(!config)return {status:503,data:{error:'Configure APP_PIN in Vercel before signing in.'}};let body;try{body=await request.json();}catch{return{status:400,data:{error:'Enter a four-digit PIN.'}};}if(typeof body?.pin!=='string'||!/^\d{4}$/.test(body.pin))return{status:400,data:{error:'Enter a four-digit PIN.'}};
 const now=Date.now(),window=Math.floor(now/WINDOW),ip=request.headers.get('x-menu-client-ip')||'prototype',key=`pin-rate:${window}:${await digest(ip)}`;
 const n=await s.rpc('mm_rate_hit',{p_key:key,p_expires:(window+1)*WINDOW});if(n>8)return{status:429,data:{error:'Too many attempts. Please try again in a few minutes.'},headers:{'Retry-After':String(Math.ceil(((window+1)*WINDOW-now)/1000))}};
 const hash=config.mode==='pbkdf2'?await pinHash(body.pin,config.salt):await digest(body.pin);let diff=0;for(let i=0;i<config.hash.length;i++)diff|=hash.charCodeAt(i)^config.hash.charCodeAt(i);if(diff)return {status:401,data:{error:'Incorrect PIN.'}};
 const token=hex(crypto.getRandomValues(new Uint8Array(32)));await s.rpc('mm_session_create',{p_key:'pin-session:'+await digest(token),p_value:{expires:now+DURATION*1000,version:config.hash},p_now:now});return{status:200,data:{unlocked:true},headers:{'Set-Cookie':`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DURATION}`}};
}
export async function logout(request,s){const key=await sessionKey(request);if(key)await recordDelete(s,key);return{status:200,data:{unlocked:false},headers:{'Set-Cookie':`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`}};}
