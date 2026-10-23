import {sweetnessClasses,wineTypes} from './wines.js';
import {validTraining} from './recommendations.js';
export const canonical=s=>s.normalize('NFKC').trim().toLocaleLowerCase();
export const safeLink=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}};
export function validateMenu(items){
 if(!Array.isArray(items)||!items.length||items.length>300)throw Error('Provide 1–300 drinks.');
 const ids=new Set(),names=new Set();
 return items.map(d=>{
  if(!d||typeof d.id!=='string'||!d.id.trim()||d.id.length>160||typeof d.name!=='string'||!d.name.trim()||d.name.length>200||!['signature','free','house','pairing','wine'].includes(d.category)||!Array.isArray(d.ingredients)||!d.ingredients.length||d.ingredients.length>80||!d.ingredients.every(i=>typeof i==='string'&&i.trim()&&i.length<200)||!['en','de'].every(lang=>typeof d.description?.[lang]==='string'&&d.description[lang].trim()&&d.description[lang].length<=4000))throw Error('Every drink needs a name, category, ingredients and non-empty English/German descriptions.');
  const id=d.id.trim(),name=d.name.trim();if(ids.has(id)||names.has(canonical(name)))throw Error('Drink IDs and names must be unique.');ids.add(id);names.add(canonical(name));
  if(d.price!=null&&(!Number.isFinite(d.price)||d.price<0))throw Error('Every drink needs a valid price.');
  if(d.training&&!validTraining(d.training))throw Error('Every drink needs a valid recommendation profile.');
  if(d.wine){const w=d.wine;if(!Object.hasOwn(sweetnessClasses,w.sweetness)||!Object.hasOwn(wineTypes,w.type))throw Error('Every drink with wine details needs a valid wine type and sweetness class.');for(const key of ['producer','region'])if(w[key]!=null&&(typeof w[key]!=='string'||w[key].length>300))throw Error('Every drink needs valid wine text fields.');if(w.grapes!=null&&(!Array.isArray(w.grapes)||!w.grapes.every(g=>typeof g==='string'&&g.trim()&&g.length<200)))throw Error('Every drink needs valid grapes.');for(const key of ['glassPrice','bottlePrice','glassVolume','bottleVolume'])if(w[key]!=null&&(!Number.isFinite(w[key])||w[key]<0||((key.endsWith('Volume'))&&w[key]===0)))throw Error('Every drink needs valid prices and volumes.');if(w.sweetnessSource&&(typeof w.sweetnessSource.label!=='string'||(w.sweetnessSource.url&&!safeLink(w.sweetnessSource.url))))throw Error('Every drink needs a valid source link.');}
  const seen=new Set(),ingredients=d.ingredients.map(i=>i.trim()).filter(i=>{const key=canonical(i);if(seen.has(key))return false;seen.add(key);return true;});
  return {...d,id,name,ingredients,description:{en:d.description.en.trim(),de:d.description.de.trim()}};
 });
}
