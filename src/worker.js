import {validateMenu as validate} from './validation.js';
import {pinAccess} from './pin-auth.js';
import {validTraining,trainingFor} from './recommendations.js';
import {drinks,glossary} from './data.js';
import {wikipediaResponse} from './wikipedia.js';
import {wines,sweetnessClasses,wineTypes} from './wines.js';
const json=(x,status=200)=>Response.json(x,{status,headers:{'Cache-Control':'no-store'}});
async function getCatalog(db){
 const row=await db.prepare('SELECT value FROM records WHERE id = ?').bind('catalog').first();
 let catalog=row?JSON.parse(row.value):drinks;
 const detailsRelease=await db.prepare('SELECT value FROM records WHERE id = ?').bind('menu-details-v1').first();
 if(!detailsRelease){const originals=drinks.filter(d=>d.category!=='wine'),changed=[];catalog=catalog.map(d=>{const original=originals.find(o=>o.id===d.id||o.name.toLowerCase()===d.name.toLowerCase());if(!original||JSON.stringify(original.ingredients)===JSON.stringify(d.ingredients))return d;changed.push(d.id);return {...d,ingredients:original.ingredients};});await db.batch([db.prepare('INSERT INTO records(id,value) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').bind('catalog',JSON.stringify(catalog)),db.prepare('INSERT INTO records(id,value) VALUES (?,?) ON CONFLICT(id) DO NOTHING').bind('menu-details-v1','updated'),...changed.map(id=>db.prepare('UPDATE progress SET correct=0,due=0 WHERE id=?').bind(id))]);}
 const release=await db.prepare('SELECT value FROM records WHERE id = ?').bind('wine-release-v1').first();
 if(!release){const added=wines.filter(w=>!catalog.some(d=>d.id===w.id||d.name.toLowerCase()===w.name.toLowerCase()));catalog=[...catalog,...added];await db.batch([db.prepare('INSERT INTO records(id,value) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').bind('catalog',JSON.stringify(catalog)),db.prepare('INSERT INTO records(id,value) VALUES (?,?) ON CONFLICT(id) DO NOTHING').bind('wine-release-v1','added')]);}
 return catalog;
}
export default {async fetch(request,env){const url=new URL(request.url);try{
if(url.pathname.startsWith('/api/')){
if(request.method!=='GET'&&request.headers.get('Origin')!==url.origin)return json({error:'Reload the app before saving.'},403);
const db=env.DB;if(!db)return json({error:'Storage is unavailable. Please try again shortly.'},503);
const access=await pinAccess(request,env);if(access)return access;
if(url.pathname==='/api/wikipedia'&&request.method==='GET')return wikipediaResponse(request);
if(url.pathname==='/api/catalog'&&request.method==='GET'){const catalog=await getCatalog(db);const draft=await db.prepare('SELECT value FROM records WHERE id = ?').bind('draft').first();const progress=await db.prepare('SELECT * FROM progress').all();return json({drinks:catalog,glossary,draft:draft?JSON.parse(draft.value):null,progress:progress.results});}
if(url.pathname==='/api/training'&&request.method==='POST'){const b=await request.json();if(!b||typeof b.id!=='string'||!validTraining(b.training))return json({error:'Invalid recommendation profile.'},400);const current=await getCatalog(db);if(!current.some(d=>d.id===b.id))return json({error:'Unknown drink.'},400);const old=current.find(d=>d.id===b.id);const fingerprint=p=>JSON.stringify({flavors:[...p.flavors].sort(),foods:[...p.foods].sort(),flavorConfirmed:p.flavorConfirmed,foodConfirmed:p.foodConfirmed,pitch:p.pitch});const changed=fingerprint(trainingFor(old))!==fingerprint(b.training);const next=current.map(d=>d.id===b.id?{...d,training:{...b.training,source:'team'}}:d);await db.batch([db.prepare('INSERT INTO records(id,value) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').bind('catalog',JSON.stringify(next)),...(changed?[db.prepare('DELETE FROM progress WHERE id = ?').bind(b.id)]:[])]);return json({drinks:next,changed});}
if(url.pathname==='/api/answer'&&request.method==='POST'){
 const b=await request.json();if(!b||typeof b.id!=='string'||typeof b.correct!=='boolean'||(b.attemptId!=null&&(typeof b.attemptId!=='string'||!/^[a-f0-9-]{32,64}$/i.test(b.attemptId))))return json({error:'Invalid answer.'},400);
 const catalog=await getCatalog(db);if(!catalog.some(d=>d.id===b.id))return json({error:'Unknown drink.'},400);
 const key='answer:'+ (b.attemptId||crypto.randomUUID()),now=Date.now();
 const done=await db.prepare('SELECT value FROM records WHERE id=?').bind(key).first();
 if(done){const saved=JSON.parse(done.value);if(saved.id!==b.id||Boolean(saved.answer)!==b.correct)return json({error:'This answer was already recorded with different data.'},409);const {answer,...result}=saved;return json(result);}
 // The ledger and progress update share a transaction; a lost response can be retried safely.
 const result=await db.batch([
  db.prepare("INSERT INTO progress(id,correct,attempts,due) SELECT ?,?,1,? WHERE NOT EXISTS(SELECT 1 FROM records WHERE id=?) ON CONFLICT(id) DO UPDATE SET correct=CASE WHEN ? THEN progress.correct+1 ELSE 0 END,attempts=progress.attempts+1,due=?+CASE WHEN ? THEN MIN(30,(1 << MIN(progress.correct+1,5)))*86400000 ELSE 600000 END").bind(b.id,b.correct?1:0,now+(b.correct?2*86400000:600000),key,b.correct?1:0,now,b.correct?1:0),
  db.prepare("INSERT INTO records(id,value) SELECT ?,json_object('id',id,'correct',correct,'attempts',attempts,'due',due,'answer',?) FROM progress WHERE id=? ON CONFLICT(id) DO NOTHING").bind(key,b.correct?1:0,b.id),
  db.prepare('SELECT value FROM records WHERE id=?').bind(key)
 ]);
 const saved=JSON.parse(result[2].results[0].value);if(saved.id!==b.id||Boolean(saved.answer)!==b.correct)return json({error:'This answer was already recorded with different data.'},409);const {answer,...record}=saved;return json(record);
}
if(url.pathname==='/api/draft'&&request.method==='POST'){const form=await request.formData();const file=form.get('file');if(!file||typeof file==='string'||file.size>15*1024*1024)return json({error:'Choose a file under 15 MB.'},400);const items=validate(JSON.parse(form.get('drinks')));if(!env.BUCKET)return json({error:'Upload storage is unavailable.'},503);const key='uploads/'+crypto.randomUUID();await env.BUCKET.put(key,file.stream(),{httpMetadata:{contentType:file.type||'application/octet-stream'}});const draft={filename:file.name,key,drinks:items,created:Date.now()};await db.prepare('INSERT INTO records(id,value) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').bind('draft',JSON.stringify(draft)).run();return json(draft);}
if(url.pathname==='/api/publish'&&request.method==='POST'){const b=await request.json();const items=validate(b?.drinks);const current=await getCatalog(db);if(b.replace!==true){for(const item of items){const byId=current.find(d=>d.id===item.id),byName=current.find(d=>d.name.trim().toLowerCase()===item.name.toLowerCase());if(byId&&byName&&byId.id!==byName.id)return json({error:'This name belongs to another drink. Use a different name or ID.'},400);}}const next=b.replace===true?items:[...current.filter(d=>!items.some(i=>i.id===d.id||i.name.toLowerCase()===d.name.toLowerCase())),...items];validate(next);const changed=current.filter(d=>!next.some(n=>n.id===d.id&&JSON.stringify(n)===JSON.stringify(d)));await db.batch([db.prepare('INSERT INTO records(id,value) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value').bind('catalog',JSON.stringify(next)),db.prepare('DELETE FROM records WHERE id = ?').bind('draft'),...changed.map(d=>db.prepare('DELETE FROM progress WHERE id = ?').bind(d.id))]);return json({drinks:next});}
return json({error:'Not found.'},404);
}
return env.ASSETS.fetch(request);
}catch(e){if(!/^(Every drink|Provide |Drink IDs)/.test(e.message||'')&&!(e instanceof SyntaxError))console.error(e);if(e instanceof SyntaxError)return json({error:'Invalid JSON. Check the menu format.'},400);return json({error:e.message?.startsWith('Every drink')||e.message?.startsWith('Provide ')||e.message?.startsWith('Drink IDs')?e.message:'Could not save or load. Your input is still here; please try again.'},400);}}};
