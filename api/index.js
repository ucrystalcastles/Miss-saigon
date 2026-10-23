import {handleRequest} from '../server/handler.js';
export const MAX_BODY=3*1024*1024;
export async function requestFromNode(req){
 const host=req.headers.host;if(typeof host!=='string'||!/^([a-z0-9.-]+)(:[0-9]+)?$/i.test(host))throw Error('Invalid host');
 const protocol=process.env.NODE_ENV!=='production'&&/^(localhost|127\.0\.0\.1)(:[0-9]+)?$/.test(host)?'http://':'https://';
 const original=new URL(req.url,protocol+host),route=original.pathname.startsWith('/api/')?original.pathname.slice(5):original.searchParams.get('route')||'';
 if(!/^[a-z-]+$/.test(route))return null;
 original.pathname='/api/'+route;original.searchParams.delete('route');
 const headers=new Headers();for(const [k,value]of Object.entries(req.headers)){if(value!==undefined)headers.set(k,Array.isArray(value)?value.join(','):value);}
 // Vercel sets x-real-ip at its trusted ingress; never accept a browser's custom client-IP header.
 headers.set('x-menu-client-ip',req.headers['x-real-ip']||'prototype');
 let body;if(!['GET','HEAD'].includes(req.method)){
  if(req.body!==undefined){body=Buffer.isBuffer(req.body)?req.body:Buffer.from(typeof req.body==='string'?req.body:JSON.stringify(req.body));}
  else{const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw Object.assign(Error('Menu JSON is too large. Split it into smaller uploads.'),{status:413});chunks.push(chunk);}body=Buffer.concat(chunks);}
  if(body.length>MAX_BODY)throw Object.assign(Error('Menu JSON is too large. Split it into smaller uploads.'),{status:413});
 }
 return new Request(original,{method:req.method,headers,body});
}
export default async function handler(req,res){try{const request=await requestFromNode(req);const response=request?await handleRequest(request):Response.json({error:'Not found.'},{status:404});res.statusCode=response.status;for(const[k,v]of response.headers)res.setHeader(k,v);res.end(Buffer.from(await response.arrayBuffer()));}catch(e){res.statusCode=e.status||400;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({error:e.status===413?e.message:'Invalid request.'}));}}
