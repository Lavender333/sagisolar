/* Documents remain on-device. OCR downloads only engine/language resources. */
const asset=p=>new URL(p,import.meta.url).href;
export function textFromItems(items){
 const lines=[];
 for(const item of items){if(!item.str?.trim()||!item.transform)continue;const y=item.transform[5],x=item.transform[4];let line=lines.find(l=>Math.abs(l.y-y)<3);if(!line){line={y,items:[]};lines.push(line)}line.items.push({x,text:item.str});}
 return lines.sort((a,b)=>b.y-a.y).map(l=>l.items.sort((a,b)=>a.x-b.x).map(i=>i.text).join(' ')).join('\n');
}
function deadline(promise,ms,signal){return new Promise((resolve,reject)=>{let done=false;const finish=(f,v)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);f(v)};const abort=()=>finish(reject,new Error('Reading cancelled. Your original file is still saved.'));const timer=setTimeout(()=>finish(reject,new Error('Reading timed out. Try a smaller or clearer file.')),ms);signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();promise.then(v=>finish(resolve,v),e=>finish(reject,e));});}
async function loadOCR(){if(globalThis.Tesseract)return globalThis.Tesseract;await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=asset('./vendor/tesseract.min.js');script.onload=resolve;script.onerror=()=>{script.remove();reject(Error('OCR reader could not load. Check your connection and retry.'))};document.head.appendChild(script)});return globalThis.Tesseract;}
export async function readDocument(bytes,type,options={}){
 const {signal,onProgress=()=>{},forceOCR=false}=options;let worker=null,loadingTask=null,closed=false;let ocrPages=0;const notes=[];
 const check=()=>{if(signal?.aborted)throw Error('Reading cancelled. Your original file is still saved.');};
 async function recognize(image){check();if(options.recognizeImage)return options.recognizeImage(image);if(!worker){onProgress('Loading scan reader. First use may take a moment…');const api=await deadline(loadOCR(),30000,signal);const pending=api.createWorker('eng',1,{workerPath:asset('./vendor/ocr-worker.min.js'),workerBlobURL:false,corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0',langPath:'https://tessdata.projectnaptha.com/4.0.0',logger:m=>{if(m.status==='recognizing text')onProgress(`Scanning page ${ocrPages} · ${Math.round((m.progress||0)*100)}%`);},errorHandler:()=>{}});pending.then(w=>{if(closed)w.terminate().catch(()=>{})},()=>{});worker=await deadline(pending,90000,signal);await worker.setParameters({tessedit_pageseg_mode:'3',preserve_interword_spaces:'1',user_defined_dpi:'200'});}const {data}=await deadline(worker.recognize(image,{}, {text:true}),120000,signal);if(data.confidence<70)notes.push('Some scanned text has low confidence. Carefully check amounts and addresses.');return data.text||'';}
 try{
  let text='';
  if(type==='application/pdf'){
   const lib=options.pdfLib||await import('./vendor/pdf.min.mjs');if(!options.pdfLib)lib.GlobalWorkerOptions.workerSrc=asset('./vendor/pdf.worker.min.mjs');
   loadingTask=lib.getDocument({data:new Uint8Array(bytes),isEvalSupported:false,useSystemFonts:true});const pdf=await deadline(loadingTask.promise,30000,signal);const pages=Math.min(pdf.numPages,20);if(pdf.numPages>pages)notes.push(`Only ${pages} of ${pdf.numPages} pages were read.`);
   for(let i=1;i<=pages;i++){check();onProgress(`Reading page ${i} of ${pages}…`);const page=await pdf.getPage(i);const content=await deadline(page.getTextContent(),30000,signal);let pageText=textFromItems(content.items);
    if(forceOCR||pageText.trim().length<100){if(ocrPages>=6){notes.push(`Page ${i} needs scanning; the six scanned-page limit was reached.`);}else{ocrPages++;onProgress(`Scanning page ${i} of ${pages}…`);const base=page.getViewport({scale:1}),scale=Math.min(2.5,2200/Math.max(base.width,base.height)),viewport=page.getViewport({scale});const canvas=options.createCanvas?options.createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height)):Object.assign(document.createElement('canvas'),{width:Math.ceil(viewport.width),height:Math.ceil(viewport.height)});await deadline(page.render({canvasContext:canvas.getContext('2d'),viewport}).promise,30000,signal);const image=options.canvasImage?options.canvasImage(canvas):canvas;pageText=await recognize(image);canvas.width=1;canvas.height=1;}}
    text+=pageText+'\n';page.cleanup();if(text.length>100000){text=text.slice(0,100000);notes.push('Long text was truncated at 100,000 characters.');break;}
   }
  }else{ocrPages=1;onProgress('Scanning your photo…');const image=options.imageInput||new Blob([bytes],{type});text=await recognize(image);}
  check();return{text,ocrPages,note:[...new Set(notes)].join(' ')};
 }catch(e){if(e.name==='PasswordException')throw Error('This PDF is password-protected. Upload an unlocked copy or enter details manually.');throw e;}
 finally{closed=true;if(worker)await worker.terminate().catch(()=>{});if(loadingTask)await loadingTask.destroy().catch(()=>{});}
}
