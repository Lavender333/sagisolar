const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('dist/index.html','utf8'),script=fs.readFileSync('dist/ratecons.js','utf8');
const elements=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],{value:'',hidden:true,checked:true}]));
const context={$:id=>{assert.ok(elements[id],`Missing field ${id}`);return elements[id]},fileURL:()=>'',openDocument:()=>{},reviewingRatecon:null,last:{},window:{setActiveRatecon(){}}};vm.createContext(context);vm.runInContext(script.slice(script.indexOf('function showRatecon'),script.indexOf('async function renderRatecons')),context);
const fields={pay:1900,miles:320,origin:'Atlanta, GA',destination:'Orlando, FL',loadNumber:'TEST-9988',pickupAt:'2026-10-13T14:30',deliveryAt:'2026-10-14T08:15',pickupAddress:'100 Example Road',deliveryAddress:'200 Example Road',broker:'Example Dispatch',equipment:'Van',weight:42000,notes:'Check in with dispatch'};
context.showRatecon({fields,type:'application/pdf',note:'Review',text:'Example'});for(const [k,v] of Object.entries(fields))assert.equal(elements[k].value,v);assert.equal(elements.rateconReview.hidden,false);assert.equal(elements.loadDetails.open,true);
context.showRatecon({fields:{pay:500},type:'application/pdf',note:'Partial scan',text:'Example'});assert.equal(elements.pay.value,500);assert.equal(elements.origin.value,'');console.log('PASS: every extracted field maps to an existing review input; panel visible; partial reads clear stale values; single trip form populated without an apply step.');

assert.doesNotMatch(html,/id="rc_|id="rateconForm"|id="example"/);assert.match(script,/showRatecon\(updated\);calculate\(\)/);
