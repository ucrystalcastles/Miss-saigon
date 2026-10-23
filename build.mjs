import {build} from 'esbuild';
import {mkdir,copyFile,cp,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
await build({entryPoints:['src/app.js'],outfile:'dist/app.js',bundle:true,format:'esm',platform:'browser',target:'es2022'});
for(const f of ['index.html','style.css','favicon.svg','manifest.json','wine-illustrations.png'])await copyFile('public/'+f,'dist/'+f);
await copyFile('node_modules/pdfjs-dist/build/pdf.worker.min.mjs','dist/pdf.worker.min.mjs');await cp('public/drink-photos','dist/drink-photos',{recursive:true});
