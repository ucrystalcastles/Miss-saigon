import {guestQuestions} from './recommendations.js';
import {sweetnessClasses,wineTypes} from './wines.js';

export function shuffle(items){
 const out=[...items];
 for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
 return out;
}

export function matchingClue(drink,lang='en'){
 if(drink.category!=='wine')return {description:drink.description[lang],ingredients:drink.ingredients};
 const w=drink.wine||{};
 return {description:[wineTypes[w.type]?.[lang],w.type!=='rose'&&/ros[ée]/i.test(drink.name)?'Rosé':null,w.producer,w.region,w.vintage,
  w.grapes?.join(' · '),w.sweetness&&w.sweetness!=='unconfirmed'?sweetnessClasses[w.sweetness]?.[lang]:null,
  w.bottlePrice!=null?`${lang==='de'?'Flasche':'Bottle'} ${w.bottleVolume||0.75} l · € ${Number(w.bottlePrice).toFixed(2)}`:null
 ].filter(Boolean).join(' · '),ingredients:[]};
}
const clueKey=d=>JSON.stringify(matchingClue(d));

// Reviews are strictly category-local and follow only the drinks just studied.
export function buildStudyGroups(items,random=Math.random){
 const categories=new Map();
 for(const d of items){if(!categories.has(d.category))categories.set(d.category,[]);categories.get(d.category).push(d);}
 const groups=[];
 for(const category of categories.values()){
  let offset=0;
  while(offset<category.length){
   const remaining=category.length-offset;
   let size=remaining<=5?remaining:3+Math.min(2,Math.floor(random()*3));
   if(remaining-size===1)size--; // Avoid leaving one drink to distinguish on its own.
   groups.push(category.slice(offset,offset+size));offset+=size;
  }
 }
 return groups;
}

function multipleReview(items,randomize,uniqueOnly=false){
 const candidates=[];
 if(items[0].category==='wine'){
  for(const field of ['sweetness','type','producer','region']){
   for(const value of new Set(items.map(d=>d.wine?.[field]).filter(v=>v&&v!=='unconfirmed'))){
    const right=items.filter(d=>d.wine?.[field]===value).map(d=>d.id);
    if(right.length===items.length)continue;
    const label=field==='sweetness'?sweetnessClasses[value]:field==='type'?wineTypes[value]:{en:value,de:value};
    const prompts={sweetness:['Which wines have this sweetness class?','Welche Weine haben diese Süßeklasse?'],type:['Which wines have this type?','Welche Weine gehören zu dieser Weinart?'],producer:['Which wines are from this producer?','Welche Weine stammen von diesem Produzenten?'],region:['Which wines come from this origin?','Welche Weine stammen aus dieser Herkunft?']};
    // Unknown sweetness is never treated as a confirmed negative answer.
    if(field==='sweetness'&&items.some(d=>!d.wine?.sweetness||d.wine.sweetness==='unconfirmed'))continue;
    candidates.push({kind:'multiple',right,prompt:{en:prompts[field][0],de:prompts[field][1]},fact:label});
   }
  }
 }else{
  for(const value of new Set(items.flatMap(d=>d.ingredients))){
   const right=items.filter(d=>d.ingredients.includes(value)).map(d=>d.id);
   if(right.length!==items.length)candidates.push({kind:'multiple',right,prompt:{en:'Which drinks contain this ingredient?',de:'Welche Drinks enthalten diese Zutat?'},ingredient:value});
  }
 }
 if(uniqueOnly){const unique=candidates.filter(c=>c.right.length===1||c.right.length===items.length-1);return unique.length?randomize(unique)[0]:null;}
 if(!candidates.length)return null;
 const shared=candidates.filter(c=>c.right.length>1);
 return randomize(shared.length?shared:candidates)[0];
}

export function createPractice(catalog,categories,progress,randomize=shuffle,random=Math.random,mode='full'){
 const due=new Map(progress.map(p=>[p.id,p.due||0]));
 const selected=catalog.filter(d=>categories.has(d.category)).sort((a,b)=>(due.get(a.id)||0)-(due.get(b.id)||0));
 if(!selected.length)return null;
 const available=buildStudyGroups(selected,random),groups=mode==='short'?available.slice(0,1):available,items=groups.flat(),rounds=[];
 let afterIndex=0;
 groups.forEach((group,groupIndex)=>{
  afterIndex+=group.length;
  if(group.length<2)return;
  const base={groupIndex,afterIndex,category:group[0].category,items:group};
  for(const q of guestQuestions(group,randomize))rounds.push({...base,...q});
  rounds.push({...base,kind:'matching',rows:randomize(group),options:randomize(group),points:group.length});
  const target=randomize(group)[0];
  rounds.push({...base,kind:'identify',target,options:randomize(group),points:1});
  const multiple=multipleReview(group,randomize);
  if(multiple)rounds.push({...base,...multiple,options:randomize(group),points:group.length});
  const difference=groupIndex%2===1?multipleReview(group,randomize,true):null;
  if(difference){
   const excluded=difference.right.length!==1;
   const answer=group.find(d=>excluded?!difference.right.includes(d.id):difference.right.includes(d.id));
   rounds.push({...base,...difference,kind:'difference',target:answer,
    prompt:excluded?{en:'Which drink does NOT match this fact?',de:'Welcher Drink passt NICHT zu dieser Angabe?'}:{en:'Which drink is the only match for this fact?',de:'Welcher Drink passt als einziger zu dieser Angabe?'},
    options:randomize(group),points:1});
  }else{
   const alternatives=group.filter(d=>clueKey(d)!==clueKey(target));
   const claim=alternatives.length&&random()<0.5?randomize(alternatives)[0]:target;
   rounds.push({...base,kind:'true-false',target,claim,answer:clueKey(target)===clueKey(claim)?'true':'false',
    options:randomize([{id:'true',label:{en:'True',de:'Richtig'}},{id:'false',label:{en:'False',de:'Falsch'}}]),points:1});
  }
 });
 return {mode,totalSelected:selected.length,retryIds:new Set(),items,groups,rounds,index:0,roundIndex:0,stage:'card',picks:[],matches:{},score:0,reviewScore:0,reviewTotal:rounds.reduce((sum,r)=>sum+r.points,0),answered:false};
}

export function correctReviewIds(round){if(round.kind==='identify')return round.options.filter(d=>clueKey(d)===clueKey(round.target)).map(d=>d.id);if(round.kind==='true-false')return [round.answer];if(round.kind==='difference')return [round.target.id];return round.right||[];}
export function gradeReview(round,picks){
 if(round.kind==='recommend'){const correct=picks.length===1&&round.right.includes(picks[0]);return [{id:correct?picks[0]:round.right[0],correct}];}
 if(round.kind==='true-false')return [{id:round.target.id,correct:picks.length===1&&picks[0]===round.answer}];
 if(round.kind==='difference')return [{id:round.target.id,correct:picks.length===1&&picks[0]===round.target.id}];
 if(round.kind==='identify'){
  const selected=round.items.find(d=>d.id===picks[0]);
  return [{id:round.target.id,correct:picks.length===1&&!!selected&&clueKey(round.target)===clueKey(selected)}];
 }
 return round.items.map(d=>({id:d.id,correct:picks.includes(d.id)===round.right.includes(d.id)}));
}

export function gradeMatching(round,matches){
 const picked=Object.values(matches);
 const complete=round.rows.every(d=>round.options.some(o=>o.id===matches[d.id]))&&new Set(picked).size===round.rows.length;
 return round.rows.map(d=>({id:d.id,correct:complete&&clueKey(d)===clueKey(round.options.find(o=>o.id===matches[d.id]))}));
}

export function queueMistakes(s,results){
 const wrong=results.filter(r=>!r.correct&&!s.retryIds.has(r.id));
 for(const result of wrong){
  const target=s.items.find(d=>d.id===result.id);if(!target)continue;
  const groupIndex=s.groups.findIndex(g=>g.some(d=>d.id===target.id)),group=s.groups[groupIndex];
  const afterIndex=s.groups.slice(0,groupIndex+1).reduce((n,g)=>n+g.length,0);
  const positions=s.rounds.map((r,i)=>r.groupIndex===groupIndex?i:-1).filter(i=>i>=0);
  const at=positions.length?positions.at(-1)+1:s.roundIndex;
  s.rounds.splice(at,0,{groupIndex,afterIndex,category:target.category,items:group,kind:'identify',target,options:shuffle(group),points:1,retry:true});
  s.retryIds.add(result.id);s.reviewTotal++;
 }
}
