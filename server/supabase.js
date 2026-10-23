const MAX_FILE=15*1024*1024;
export class ServiceError extends Error {constructor(message,status=503){super(message);this.status=status;}}
export function createServices(env=process.env,fetcher=fetch){
 let base;try{const u=new URL(env.SUPABASE_URL);if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/')throw Error();base=u.origin;}catch{throw new ServiceError('Database is not configured. Add SUPABASE_URL in Vercel.');}
 const key=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;if(!key)throw new ServiceError('Database is not configured. Add the Supabase server key in Vercel.');
 const headers={apikey:key,...(key.startsWith('eyJ')?{Authorization:'Bearer '+key}:{}),'Content-Type':'application/json'};
 async function call(path,options={}){let r;try{r=await fetcher(base+path,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(12000)});}catch{throw new ServiceError('The database is temporarily unavailable. Please retry.');}let data;try{data=await r.json();}catch{data=null;}if(!r.ok){if(data?.message?.includes('answer_conflict'))throw new ServiceError('This answer was already recorded with different data.',409);if(data?.message?.includes('unknown_drink'))throw new ServiceError('Unknown drink. Reload the menu.',400);if(data?.message?.includes('target_not_empty'))throw new ServiceError('The destination already contains a menu.',409);throw new ServiceError('Database request failed. Check the Supabase SQL setup and server key.');}return data;}
 const rpc=(name,args={})=>call('/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(args)});
 const bucket='menu-originals',objectPath=key=>key.split('/').map(encodeURIComponent).join('/');
 return {
  rpc,
  async signedUpload(path){const data=await call('/storage/v1/object/upload/sign/'+bucket+'/'+objectPath(path),{method:'POST',body:'{}'});const raw=data?.url||data?.signedURL||data?.signedUrl;if(!raw)throw new ServiceError('Could not create an upload link.');const url=new URL(raw.startsWith('/object/')?'/storage/v1'+raw:raw,base);if(url.origin!==base||url.protocol!=='https:')throw new ServiceError('Invalid upload link.');return url.href;},
  async verifyUpload(path,size){const info=await call('/storage/v1/object/info/'+bucket+'/'+objectPath(path));const actual=Number(info?.metadata?.size??info?.size??info?.contentLength);if(!Number.isFinite(actual)||actual!==size||actual>MAX_FILE||actual<1)throw new ServiceError('Uploaded file size does not match. Please upload again.',400);}
 };
}
export const recordGet=(s,key)=>s.rpc('mm_record_get',{p_key:key});
export const recordPut=(s,key,value)=>s.rpc('mm_record_put',{p_key:key,p_value:value});
export const recordDelete=(s,key)=>s.rpc('mm_record_delete',{p_key:key});
