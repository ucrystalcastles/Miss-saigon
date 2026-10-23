export const sweetnessClasses={
 unconfirmed:{en:'Not yet confirmed',de:'Noch nicht bestätigt'},
 dry:{en:'Dry',de:'Trocken'},'off-dry':{en:'Off-dry',de:'Halbtrocken'},'medium-sweet':{en:'Medium-sweet',de:'Lieblich'},sweet:{en:'Sweet',de:'Süß'},
 'brut-nature':{en:'Brut Nature',de:'Brut Nature'},'extra-brut':{en:'Extra Brut',de:'Extra Brut'},brut:{en:'Brut',de:'Brut'},'extra-dry':{en:'Extra Dry',de:'Extra Dry'},sec:{en:'Sec / Dry',de:'Sec / Trocken'},'demi-sec':{en:'Demi-sec',de:'Demi-sec'},doux:{en:'Doux',de:'Doux'}
};
export const wineTypes={white:{en:'White wine',de:'Weißwein'},red:{en:'Red wine',de:'Rotwein'},rose:{en:'Rosé wine',de:'Roséwein'},champagne:{en:'Champagne',de:'Champagner'},sparkling:{en:'Sparkling wine',de:'Sekt'}};
const wine=(id,name,type,vintage,producer,region,grapes,sweetness,glass,bottle,source)=>({id,name,category:'wine',ingredients:grapes.length?grapes:['Grapes not specified'],description:{en:`${wineTypes[type].en} from ${producer}, ${region}.`,de:`${wineTypes[type].de} von ${producer}, ${region.replace(/Austria/g,'Österreich').replace(/France/g,'Frankreich').replace(/Vienna/g,'Wien')}.`},wine:{type,vintage,producer,region,grapes,sweetness,glassPrice:glass,bottlePrice:bottle,glassVolume:type==='champagne'||type==='sparkling'?0.1:0.125,bottleVolume:0.75,sweetnessSource:source||null}});
export const wines=[
 wine('wine-sax','Grüner Veltliner DAC PhoSaigon Edition','white',2025,'Sax','Langenlois · Kamptal · Austria',['Grüner Veltliner'],'dry',6.5,39,{label:'Kamptal DAC classification',url:'https://www.bmluk.gv.at/themen/landwirtschaft/landwirtschaft-in-oesterreich/pflanzliche-produktion/wein/kamptal-dac-neu-ab-jahrgang-2024.html'}),
 wine('wine-gemischter','Wiener Gemischter Satz Miss Saigon Edition','white',2024,'Höpler','Vienna · Austria',[],'unconfirmed',7.5,45),
 wine('wine-sauvignon','Sauvignon Blanc','white',2025,'Wohlmuth','Fresing · Südsteiermark · Austria',['Sauvignon Blanc'],'dry',7.5,45,{label:'Wohlmuth · 2025',url:'https://www.wohlmuth.at/product/sauvignon-blanc-suedsteiermark/'}),
 wine('wine-muskateller','Roter Muskateller Bio','white',2025,'Holzmann','Bad Pirawarth · Weinviertel · Austria',['Roter Muskateller'],'dry',7.5,42,{label:'WirWinzer · 2025',url:'https://wirwinzer.de/2025-roter-muskateller-trocken-bio-weingut-holzmann.html'}),
 wine('wine-celestia','Rosé Célestia','rose',2025,'Höpler','Breitenbrunn · Burgenland · Austria',['Pinot Noir','St. Laurent','Blaufränkisch'],'dry',7.5,42,{label:'Höpler · 2025',url:'https://hoepler.at/en/shop/wine/rose/rose-celestia-2025/'}),
 wine('wine-asia','Asia Cuvée','white',2025,'Mayer am Pfarrplatz','Vienna · Austria',[],'off-dry',null,48,{label:'Vinorama · 2025',url:'https://www.vinorama.at/Weine/ALLE-WEINE/Asia-Cuv-e-2025.html'}),
 wine('wine-knoll','Loibner Grüner Veltliner Federspiel','white',2025,'Knoll','Unterloiben · Wachau · Austria',['Grüner Veltliner'],'dry',null,51,{label:'Vinea Wachau · Federspiel',url:'https://www.vinea-wachau.at/en/translate-to-englisch-vinea-wachau/vinea-wine-styles'}),
 wine('wine-prager','Riesling Federspiel Ried Steinriegl','white',2025,'Prager','Weißenkirchen · Wachau · Austria',['Riesling'],'dry',null,57,{label:'Vinea Wachau · Federspiel',url:'https://www.vinea-wachau.at/en/translate-to-englisch-vinea-wachau/vinea-wine-styles'}),
 wine('wine-hoepler-red','Blaufränkisch','red',2020,'Höpler','Breitenbrunn · Burgenland · Austria',['Blaufränkisch'],'unconfirmed',8,48),
 wine('wine-norwood','Norwood Heritage Red','red',2020,'Salomon Estate','Finniss · Australia',['Shiraz','Cabernet Sauvignon'],'dry',8,48,{label:'Salomon · 2020 · 0.5 g/L residual sugar',url:'https://salomonwines.com/wp/wp-content/uploads/2024/04/Norwood-2020-Heritage-Red.pdf'}),
 wine('wine-pinot','Pinot Noir Bio','red',2023,'Weingut Familie Reinisch','Tattendorf · Thermenregion · Austria',['Pinot Noir'],'dry',8.5,51,{label:'Rindchen · 2023',url:'https://www.rindchen.de/Pinot-Noir-Thermenregion/3000105523'}),
 wine('wine-zweigelt','Zweigelt Bio','red',2023,'Jurtschitsch','Langenlois · Kamptal · Austria',['Zweigelt'],'dry',null,42,{label:'Vinorama · 2023',url:'https://www.vinorama.at/Weine/Rotwein/Zweigelt-2023-oxid-7.html'}),
 wine('wine-kaiken','Terroir Series','red',2022,'Kaiken','Mendoza · Valle de Uco · Argentina',['Malbec','Bonarda','Petit Verdot'],'dry',null,45,{label:'Edelrausch · 2022',url:'https://www.edelrausch.de/kaiken-terroir-series-malbec-2022'}),
 wine('wine-hochberc','Blaufränkisch Hochberc Bio','red',2022,'Gesellmann','Deutschkreutz · Mittelburgenland · Burgenland · Austria',['Blaufränkisch'],'dry',null,89,{label:'Vinorama · 2022',url:'https://www.vinorama.at/Weine/ALLE-WEINE/Blaufraenkisch-hochberc-2022.html'}),
 wine('wine-piper','Piper-Heidsieck Essentiel Extra Brut','champagne',null,'Piper-Heidsieck','Champagne · France',[],'extra-brut',15,99,{label:'Drinks menu · page 11'}),
 wine('wine-piper-rose','Piper-Heidsieck Rosé Sauvage','champagne',null,'Piper-Heidsieck','Champagne · France',[],'brut',null,109,{label:'Piper-Heidsieck · technical sheet',url:'https://www.piper-heidsieck.com/sites/default/files/2021-02/PH_Fiche%20Technique_Ros%C3%A9%20Sauvage_v.%20courte_fr.pdf'}),
 wine('wine-roederer-rose','Louis Roederer Brut Rosé Vintage','champagne',2017,'Louis Roederer','Champagne · France',[],'brut',null,180,{label:'Drinks menu · page 11'}),
 wine('wine-cristal','Louis Roederer Cristal Brut','champagne',2016,'Louis Roederer','Champagne · France',[],'brut',null,420,{label:'Drinks menu · page 11'}),
 wine('wine-schlumberger','Schlumberger Brut Klassik','sparkling',null,'Schlumberger','Austria',[],'brut',10,65,{label:'Drinks menu · page 11'}),
 wine('wine-schlumberger-rose','Schlumberger Rosé Brut','sparkling',null,'Schlumberger','Austria',[],'brut',10,65,{label:'Drinks menu · page 11'})
];
export function makeWineQuestion(d,index,all,shuffle){
 const w=d.wine||{},known=w.sweetness&&w.sweetness!=='unconfirmed';let field=known&&index%2===0?'sweetness':index%3===1&&w.producer?'producer':'region';if(!w[field])field=known?'sweetness':'type';
 const value=w[field]||'white';const prompt=field==='sweetness'?{en:`What is the sweetness class of ${d.name}?`,de:`Welche Süßeklasse hat ${d.name}?`}:field==='producer'?{en:`Who produces ${d.name}?`,de:`Wer produziert ${d.name}?`}:field==='region'?{en:`Where does ${d.name} come from?`,de:`Woher stammt ${d.name}?`}:{en:`What type of wine is ${d.name}?`,de:`Welche Weinart ist ${d.name}?`};
 const candidates=field==='sweetness'?(w.type==='champagne'||w.type==='sparkling'?['brut','extra-brut','extra-dry','demi-sec']:['dry','off-dry','medium-sweet','sweet']):field==='type'?Object.keys(wineTypes):[...new Set(all.filter(x=>x.category==='wine').map(x=>x.wine?.[field]).filter(Boolean))];
 const choices=shuffle([value,...shuffle(candidates.filter(x=>x!==value)).slice(0,3)]);const label=x=>field==='sweetness'?sweetnessClasses[x]:field==='type'?wineTypes[x]:{en:x,de:field==='region'?x.replace(/Austria/g,'Österreich').replace(/France/g,'Frankreich').replace(/Vienna/g,'Wien'):x};
 return {prompt,answer:value,options:choices.map(x=>({id:x,label:label(x)})),explanation:label(value)};
}
