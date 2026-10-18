import assert from 'node:assert/strict';
import {pageTextContent} from '../dist/document-reader.mjs';
let cancelled=false,released=false,index=0;
const page={streamTextContent:()=>({getReader:()=>({read:async()=>index++===0?{done:false,value:{items:[{str:'Load total'}]}}:{done:true},cancel:async()=>{cancelled=true},releaseLock:()=>{released=true}})})};
assert.deepEqual((await pageTextContent(page)).items,[{str:'Load total'}]);assert.ok(cancelled&&released);
const abort=new AbortController();abort.abort();await assert.rejects(pageTextContent(page,abort.signal),/cancelled/);
console.log('PASS: text extraction works without a stream async iterator; cancellation cleans up.');
