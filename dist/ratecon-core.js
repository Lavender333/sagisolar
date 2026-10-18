(function(root){
function suggest(raw){
 const text=String(raw).replace(/\u00a0/g,' ').replace(/[–—]/g,'-');
 // Split common inline labels without treating arbitrary numbers as rates.
 const normalized=text.replace(/\s{2,}(?=(?:total(?: carrier)? (?:pay|rate)|pickup|pick up|delivery|destination|loaded miles|load #)\s*[:#])/gi,'\n');
 const lines=normalized.split(/\r?\n/).map(s=>s.trim()).filter(Boolean),result={origin:'',destination:'',pay:'',miles:'',loadNumber:'',warnings:[]};
 const unique=a=>[...new Set(a.filter(v=>v!==''&&v!==undefined))];
 const number=s=>{const t=String(s).replace(/,/g,'').trim();return /^\d+(?:\.\d{1,2})?$/.test(t)?Number(t):null;};
 const labels={origin:/^(?:pick\s*up(?: location| address)?(?:\s*#?\d+)?|origin|shipper(?: location| address)?)\s*(?:[:\-]\s*(.*))?$/i,destination:/^(?:delivery(?: location| address)?(?:\s*#?\d+)?|deliver to|destination|consignee(?: location| address)?|receiver(?: location| address)?)\s*(?:[:\-]\s*(.*))?$/i};
 const stop=/^(?:pickup|pick up|delivery|shipper|consignee|receiver|origin|destination|load|rate|total|weight|equipment|commodity|appointment|contact|phone|date|notes|instructions|broker)\b/i;
 for(const [key,re] of Object.entries(labels)){const candidates=[];lines.forEach((line,i)=>{const m=line.match(re);if(!m)return;const block=[];if(m[1]?.trim())block.push(m[1].trim());for(let j=i+1;j<Math.min(lines.length,i+5);j++){if(stop.test(lines[j])||/^(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/.test(lines[j]))break;block.push(lines[j]);}const city=block.find(s=>/\b[A-Za-z][A-Za-z .'-]+,\s*[A-Z]{2}(?:\s+\d{5}(?:-\d{4})?)?\s*$/i.test(s));const candidate=city||m[1]?.trim();if(candidate&&candidate.length<=150&&!/\b(?:appointment|phone|date|time)\b/i.test(candidate))candidates.push(candidate);});const values=unique(candidates);if(values.length===1)result[key]=values[0];else if(values.length>1)result.warnings.push(`Multiple ${key==='origin'?'pickup':'delivery'} locations found. Choose the correct stop.`);}
 const load=[];lines.forEach((line,i)=>{const m=line.match(/^(?:load(?:\s*(?:number|no\.?|#|id))?|reference(?: number)?|confirmation(?: number)?)\s*[:#-]?\s*([A-Za-z0-9][A-Za-z0-9_-]{1,59})?\s*$/i);if(m){const v=m[1]||lines[i+1];if(v&&/^[A-Za-z0-9][A-Za-z0-9_-]{1,59}$/.test(v))load.push(v)}});if(unique(load).length===1)result.loadNumber=load[0];
 const totalLabel=/^(?:total(?: carrier)? (?:pay(?:ment)?|rate|amount|compensation)|carrier (?:pay|rate|total)|all[ -]?in(?: rate| total)?|agreed rate|total)\s*[:\-]?\s*(.*)$/i;
 const mileageLabel=/^(?:loaded miles|total miles|trip miles|mileage|miles)\s*[:\-]?\s*(.*)$/i;
 const pay=[],miles=[];
 lines.forEach((line,i)=>{let m=line.match(totalLabel);if(m){const v=(m[1]||lines[i+1]||'').trim();const match=v.match(/^(?:USD\s*)?\$?\s*([\d,]+(?:\.\d{1,2})?)\s*(?:USD)?$/i);if(match){const n=number(match[1]);if(n>0)pay.push(n)}}m=line.match(mileageLabel);if(m){const v=(m[1]||lines[i+1]||'').trim();const match=v.match(/^([\d,]+(?:\.\d{1,2})?)\s*(?:mi|miles)?$/i);if(match){const n=number(match[1]);if(n>0)miles.push(n)}}});
 // Tabular broker forms: isolate labeled columns, never infer pay from penalties.
 for(const m of text.matchAll(/\bMiles:\s*([\d,]+(?:\.\d+)?)\b/gi)){const n=number(m[1]);if(n>0)miles.push(n)}
 const orderIds=unique([...text.matchAll(/\b(?:Load Confirmation|Order:)\s+(\d{4,})\b/gi)].map(m=>m[1]));
 if(orderIds.length===1)result.loadNumber=orderIds[0];
 for(const [key,marker] of [['origin',/^(?:PU|Pick\s*up)\s*\d+\b/i],['destination',/^(?:SO|DEL|Delivery)\s*\d+\b/i]]){
 const stops=[];
 lines.forEach((line,i)=>{if(!marker.test(line))return;for(let j=i+1;j<Math.min(i+5,lines.length);j++){const left=lines[j].split(/\s+(?:Contact|Phone|Date|Driver Load)\s*:/i)[0].trim();const city=left.match(/^([A-Za-z][A-Za-z .'-]+?)\s*,?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);if(city){stops.push(`${city[1].trim()}, ${city[2]} ${city[3]}`);break;}}});
 const values=unique(stops);if(values.length===1)result[key]=values[0];else if(values.length>1){result[key]='';result.warnings.push('Multiple stops found. Confirm the complete route and mileage.');}
 }
 const rates=unique(pay),distances=unique(miles);if(rates.length===1)result.pay=rates[0];else if(rates.length>1)result.warnings.push('Different totals found. Confirm the final carrier payment.');if(distances.length===1)result.miles=distances[0];else if(distances.length>1)result.warnings.push('Different mileage values found. Confirm loaded miles.');
 if(/\bCAD\b|C\$|Canadian dollars/i.test(text)){result.pay='';result.warnings.push('Possible Canadian-dollar amount. This calculator requires USD.');}
 if(/\b(?:km|kilomet(?:er|re)s)\b/i.test(text)){result.miles='';result.warnings.push('Possible kilometres found. Enter distance in miles.');}
 return result;
}
function detectType(bytes){const a=Array.from(bytes.slice(0,12)),str=String.fromCharCode(...a);if(str.startsWith('%PDF-'))return'application/pdf';if(a[0]===255&&a[1]===216&&a[2]===255)return'image/jpeg';if(a.slice(0,8).join(',')==='137,80,78,71,13,10,26,10')return'image/png';if(str.startsWith('RIFF')&&str.slice(8,12)==='WEBP')return'image/webp';return null;}
const api={suggest,detectType};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RateconCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
