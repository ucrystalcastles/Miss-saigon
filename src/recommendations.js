export const flavorTags={refreshing:{en:'Refreshing',de:'Erfrischend'},citrusy:{en:'Citrusy',de:'Zitrusbetont'},sweet:{en:'Sweet',de:'Süß'},fruity:{en:'Fruity',de:'Fruchtig'},creamy:{en:'Creamy',de:'Cremig'},herbal:{en:'Herbal',de:'Kräuterbetont'},savoury:{en:'Savoury',de:'Herzhaft'},smoky:{en:'Smoky',de:'Rauchig'},nutty:{en:'Nutty',de:'Nussig'},spiced:{en:'Spiced',de:'Würzig'}};
export const foodTags={fish:{en:'Fish',de:'Fisch'},meat:{en:'Meat',de:'Fleisch'},seafood:{en:'Seafood',de:'Meeresfrüchte'},desserts:{en:'Desserts',de:'Desserts'},fatty_meat:{en:'Fattier meat',de:'Fettreicheres Fleisch'},lean_meat:{en:'Leaner meat',de:'Magereres Fleisch'},soups:{en:'Soups',de:'Suppen'}};
// Only explicit card descriptions are used as an initial learning profile.
const flavorWords={refreshing:/refreshing|crisp/i,citrusy:/citrusy|citrus/i,sweet:/\bsweet\b/i,fruity:/fruity|tropical/i,creamy:/creamy|creaminess|velvety/i,herbal:/herbal|herbs/i,savoury:/savoury/i,smoky:/smoky/i,nutty:/nutty/i,spiced:/spiced|spices/i};
export function trainingFor(d){
 if(d.training)return d.training;
 const text=d.description?.en||'';
 const flavorText=text.split(/Pair with/i)[0];
 const flavors=Object.keys(flavorWords).filter(k=>flavorWords[k].test(flavorText));
 const pair=text.match(/Pair with ([^.]+)/i)?.[1]||'';
 const foods=[];
 if(/seafood/i.test(pair))foods.push('seafood');if(/\bfish\b/i.test(pair))foods.push('fish');if(/meats?|beef/i.test(pair))foods.push('meat');if(/desserts?/i.test(pair))foods.push('desserts');if(/pho|soups?/i.test(pair))foods.push('soups');
 return {flavors,foods,flavorConfirmed:flavors.length>0,foodConfirmed:!!pair,pitch:{en:d.description?.en||'',de:d.description?.de||''},source:'card'};
}
export function validTraining(p){return p&&typeof p==='object'&&Array.isArray(p.flavors)&&p.flavors.length<=Object.keys(flavorTags).length&&p.flavors.every(k=>Object.hasOwn(flavorTags,k))&&new Set(p.flavors).size===p.flavors.length&&Array.isArray(p.foods)&&p.foods.length<=Object.keys(foodTags).length&&p.foods.every(k=>Object.hasOwn(foodTags,k))&&new Set(p.foods).size===p.foods.length&&typeof p.flavorConfirmed==='boolean'&&typeof p.foodConfirmed==='boolean'&&typeof p.pitch?.en==='string'&&p.pitch.en.length<=600&&typeof p.pitch?.de==='string'&&p.pitch.de.length<=600;}
export function guestQuestions(group,randomize){
 const questions=[];
 const profiles=group.map(d=>({d,p:trainingFor(d)}));
 for(const domain of ['flavors','foods']){
  const flag=domain==='foods'?'foodConfirmed':'flavorConfirmed',labels=domain==='foods'?foodTags:flavorTags;
  const known=profiles.filter(x=>x.p[flag]);if(known.length<2)continue;
  const criteria=[...new Set(known.flatMap(x=>x.p[domain]))].map(k=>[k]);
  if(domain==='flavors')for(const x of known)if(x.p.flavors.length>=2)criteria.push(x.p.flavors.slice(0,2));
  for(const tags of criteria){
   const right=known.filter(x=>tags.every(k=>x.p[domain].includes(k))).map(x=>x.d.id);
   if(!right.length||right.length===known.length)continue;
   const fact={en:tags.map(k=>labels[k].en).join(' + '),de:tags.map(k=>labels[k].de).join(' + ')};
   questions.push({kind:'recommend',domain,tags,right,items:known.map(x=>x.d),options:randomize(known.map(x=>x.d)),points:1,fact,prompt:domain==='foods'?{en:'A guest orders this food. What would you recommend?',de:'Ein Gast bestellt dieses Essen. Was würdest du empfehlen?'}:{en:'A guest asks for this flavour. What would you recommend?',de:'Ein Gast wünscht diesen Geschmack. Was würdest du empfehlen?'}});
  }
 }
 const taste=randomize(questions.filter(q=>q.domain==='flavors'))[0],food=randomize(questions.filter(q=>q.domain==='foods'))[0];
 return [taste,food].filter(Boolean);
}
