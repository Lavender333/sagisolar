(function(root){
function suggest(text){
 const lines=String(text).split(/\r?\n/).map(s=>s.trim()).filter(Boolean),result={origin:'',destination:'',pay:'',miles:'',loadNumber:''};
 const definitions={origin:/^(?:pickup(?: location)?|origin|shipper location)\s*[:\-]\s*(.{3,150})$/i,destination:/^(?:delivery(?: location)?|destination|consignee location)\s*[:\-]\s*(.{3,150})$/i,loadNumber:/^(?:load(?: number| no\.?| #)?|reference(?: number)?)\s*[:#\-]\s*([\w-]{2,60})$/i};
 for(const [key,re] of Object.entries(definitions)){const matches=lines.map(s=>s.match(re)?.[1]).filter(Boolean);if(new Set(matches).size===1)result[key]=matches[0];}
 const pay=[],miles=[];
 for(const line of lines){let m;if((m=/^(?:total(?: carrier)? (?:pay|rate)|carrier (?:pay|rate)|total compensation|agreed rate|total amount)\s*[:\-]?\s*(?:USD\s*)?\$?\s*([\d,]+(?:\.\d{1,2})?)\s*(?:USD)?$/i.exec(line)))pay.push(Number(m[1].replace(/,/g,'')));if((m=/^(?:loaded miles|total miles|mileage)\s*[:\-]?\s*([\d,]+(?:\.\d+)?)\s*(?:mi|miles)?$/i.exec(line)))miles.push(Number(m[1].replace(/,/g,'')));}
 if(new Set(pay).size===1&&pay[0]>0)result.pay=pay[0];if(new Set(miles).size===1&&miles[0]>0)result.miles=miles[0];return result;
}
function detectType(bytes){const a=Array.from(bytes.slice(0,12)),str=String.fromCharCode(...a);if(str.startsWith('%PDF-'))return'application/pdf';if(a[0]===255&&a[1]===216&&a[2]===255)return'image/jpeg';if(a.slice(0,8).join(',')==='137,80,78,71,13,10,26,10')return'image/png';if(str.startsWith('RIFF')&&str.slice(8,12)==='WEBP')return'image/webp';return null;}
const api={suggest,detectType};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RateconCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
