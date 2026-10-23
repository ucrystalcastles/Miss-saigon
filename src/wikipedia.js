export const normalizeIngredient=s=>s.normalize('NFKC').toLowerCase().replace(/[‐‑–—]/g,'-').replace(/\s+/g,' ').trim();
const generic=new Set(['lemon','lime','milk','cream','water','soda','sugar','sugar syrup','ice','salt','lemon juice','fresh lemon juice','fresh pineapple','pineapple','mango','strawberry','raspberry','mint','egg white','apple','banana','zitrone','limette','milch','sahne','obers','wasser','zucker','zuckersirup','eis','salz','ananas','erdbeere','himbeere','minze','eiweiß']);
export const isGenericIngredient=s=>generic.has(normalizeIngredient(s));
const aliases=new Map();
function topic(names,en,de,note=''){for(const name of names)aliases.set(normalizeIngredient(name),{en,de,note});}
topic(['Planteray Dark Rum','Planteray 3 Stars White Rum','Planteray Cut & Dry Coconut Rum','Planteray Original Dark Rum','Dark rum','White rum','Coconut rum'],'Rum','Rum');
topic(['Ming River Baijiu','Baijiu'],'Baijiu','Baijiu');
topic(['Ketel One Vodka'],'Ketel One','Ketel One');
topic(['Stolichnaya Cristall Vodka','Lemongrass-Infused Stolichnaya Cristall Vodka'],'Stolichnaya','Stolitschnaja');
topic(['Tanqueray No. Ten Gin','Tanqueray Gin'],'Tanqueray','Tanqueray');
topic(['Tanqueray 0.0%','Tanqueray 0,0%'],'Tanqueray','Tanqueray','alcohol-free');
topic(['Undone Not Vermouth'],'Vermouth','Wermut (Getränk)','alcohol-free');
topic(['Undone Not Wine Aperitif'],'Apéritif','Aperitif','alcohol-free');
topic(['Chai Infused Buffalo Trace Bourbon'],'Buffalo Trace Distillery','Buffalo Trace');
topic(['Johnnie Walker Black Label Whisky'],'Johnnie Walker','Johnnie Walker');
topic(['Blended Whisky','Whisky'],'Blended whisky','Blended Whisky');
topic(['Vodka'],'Vodka','Wodka');topic(['Gin'],'Gin','Gin');topic(['Tequila Blanco','Tequila'],'Tequila','Tequila');
topic(['Sake','Honjozo Sake'],'Sake','Sake');
topic(['Pear Eau-de-Vie'],'Eau de vie','Obstbrand');topic(['Pineapple Distillate'],'Eau de vie','Obstbrand');
topic(['Absinthe Spray','Absinthe'],'Absinthe','Absinth');
topic(['Cabernet Sauvignon Float','Cabernet Sauvignon'],'Cabernet Sauvignon','Cabernet Sauvignon');
topic(['Cointreau'],'Cointreau','Cointreau');topic(['Aperol'],'Aperol','Aperol');
topic(['Calamansi'],'Calamansi','Calamondinorange');topic(['Yuzu'],'Yuzu','Yuzu');
topic(['Yuzu–Calamansi Blend','Yuzu-Calamansi Blend'],'Yuzu','Yuzu');
topic(['Verjus'],'Verjuice','Verjus');topic(['Miso','Miso Banana'],'Miso','Miso');
topic(['Genmaicha'],'Genmaicha','Genmaicha');topic(['Matcha'],'Matcha','Matcha');
topic(['Ube'],'Dioscorea alata','Dioscorea alata');topic(['Makgeolli'],'Makgeolli','Makgeolli');
topic(['Nashi Pear'],'Pyrus pyrifolia','Nashi-Birne');topic(['Tonka Bean'],'Dipteryx odorata','Tonkabohne');
topic(['Lapsang'],'Lapsang souchong','Lapsang Souchong');
topic(['Earl Grey Tea'],'Earl Grey tea','Earl Grey');topic(['Jasmin Tea','Jasmine tea'],'Jasmine tea','Jasmintee');
topic(['Jasmin','Jasmine'],'Jasmine','Jasmin');topic(['Lotus Green Tea'],'Green tea','Grüner Tee');
topic(['Vietnamese Coffee'],'Vietnamese iced coffee','Vietnamesischer Kaffee');
topic(['Five Spice Syrup'],'Five-spice powder','Fünf-Gewürze-Pulver');
topic(['Szechuan Pepper','Sichuan Pepper'],'Sichuan pepper','Szechuanpfeffer');
topic(['Kaffir Lime Leaves'],'Kaffir lime','Kaffernlimette');
topic(['Thai Basil','Thai Basil Oil'],'Thai basil','Thai-Basilikum');
topic(['Pho Spices'],'Pho','Phở');topic(['Tom Yum Spices','Tom Yum Salt Rim'],'Tom yum','Tom Yam');
topic(['Toasted Rice Coconut Milk','Coconut Cream'],'Coconut milk','Kokosmilch');
topic(['Roasted Coconut','Coconut Jelly'],'Coconut','Kokospalme');
topic(['White Chocolate'],'White chocolate','Weiße Schokolade');
topic(['Chocolate Bitters'],'Bitters','Bitter (Spirituose)');
topic(['Maple Syrup'],'Maple syrup','Ahornsirup');topic(['Madagaskar Vanilla','Vanilla'],'Vanilla','Vanille');
topic(['Clarified with Vanilla Yogurt','Vanilla yogurt'],'Yogurt','Joghurt');topic(['Clarified Lime'],'Clarification (food)','Klärung (Lebensmittel)');
topic(['Lemongrass'],'Cymbopogon citratus','Westindisches Lemongras');
topic(['Aloe Vera','Aloe Vera Juice'],'Aloe vera','Aloe vera');
topic(['Elderflower'],'Sambucus nigra','Schwarzer Holunder');
topic(['Chamomile Herbal Liqueur'],'Chamomile','Kamille');
topic(['Blood Orange'],'Blood orange','Blutorange');topic(['Cranberry'],'Cranberry','Großfrüchtige Moosbeere');
topic(['Grapefruit','Pink Grapefruit Lemonade'],'Grapefruit','Grapefruit');
topic(['Passion Fruit','Passionfruit'],'Passion fruit (fruit)','Passionsfrucht');
topic(['Rhubarb Soda'],'Rhubarb','Rhabarber');topic(['Granny Smith Apple'],'Granny Smith','Granny Smith');
topic(['Caramelized Mango'],'Caramelization','Karamellisieren');
export function wikipediaTopic(query){return aliases.get(normalizeIngredient(query))||{en:query,de:query,note:''};}
async function wikiRequest(language,params){const url=new URL(`https://${language}.wikipedia.org/w/api.php`);for(const [key,value]of Object.entries({action:'query',format:'json',prop:'extracts|info|pageprops',exintro:'1',explaintext:'1',exsentences:'3',inprop:'url',redirects:'1',...params}))url.searchParams.set(key,value);const r=await fetch(url,{headers:{'User-Agent':'MenuMentor/1.0 (restaurant ingredient learning; contact via site owner)'},signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error('Wikipedia unavailable');const data=await r.json();if(data.error)throw Error('Wikipedia query failed');return Object.values(data.query?.pages||{}).filter(p=>p.pageid>0&&p.extract&&!Object.hasOwn(p.pageprops||{},'disambiguation')).sort((a,b)=>(a.index||0)-(b.index||0));}
export async function lookupWikipedia(query,language){
 const mapped=wikipediaTopic(query);let page=null,actualLanguage=language,unavailable=false;
 try{page=(await wikiRequest(language,{titles:mapped[language]}))[0];if(!page)page=(await wikiRequest(language,{generator:'search',gsrsearch:`${mapped[language]}`,gsrlimit:'3',gsrnamespace:'0'}))[0];}catch(e){unavailable=true;}
 if(!page&&language==='de'){try{page=(await wikiRequest('en',{titles:mapped.en}))[0];actualLanguage='en';}catch(e){unavailable=true;}}
 if(!page)return{status:unavailable?'unavailable':'not-found',query,language};
 const extract=page.extract.trim();const short=extract.length>900?extract.slice(0,900).replace(/\s+\S*$/,'')+'…':extract;
 return{status:'found',query,title:page.title,extract:short,url:`https://${actualLanguage}.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g,'_'))}`,language:actualLanguage,related:normalizeIngredient(query)!==normalizeIngredient(page.title),note:mapped.note};
}
export async function wikipediaResponse(request){const url=new URL(request.url),query=url.searchParams.get('q')?.trim(),language=url.searchParams.get('lang')||'en';if(!query||query.length>120||/[\u0000-\u001f]/.test(query)||!['en','de'].includes(language))return Response.json({error:'Invalid ingredient or language.'},{status:400});if(isGenericIngredient(query))return Response.json({status:'generic',query,language});
 const key=new Request(url.origin+'/api/wikipedia?lang='+language+'&q='+encodeURIComponent(normalizeIngredient(query)));const cache=globalThis.caches?.default;if(cache){try{const cached=await cache.match(key);if(cached)return Response.json(await cached.json());}catch{}}
 const result=await lookupWikipedia(query,language);if(cache&&result.status==='found'){try{await cache.put(key,Response.json(result,{headers:{'Cache-Control':'public, max-age=86400'}}));}catch{}}
 return Response.json(result,{headers:{'Cache-Control':'no-store'}});
}
