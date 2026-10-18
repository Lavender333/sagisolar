/* Fuel statements stay in the browser. No account credentials are accepted here. */
(function(root){
'use strict';
function parseCSV(text){
 text=String(text).replace(/^\uFEFF/,'');
 const first=text.split(/\r?\n/)[0];let delimiter=',';
 if(first.includes('\t'))delimiter='\t';else if(!first.includes(',')&&first.includes(';'))delimiter=';';
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell!==''){throw Error('Unexpected quote in CSV. Export a fresh CSV from your provider.');}else quoted=!quoted;}else if(c===delimiter&&!quoted){row.push(cell.trim());cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw Error('The CSV has an unclosed quotation mark.');row.push(cell.trim());if(row.some(Boolean))rows.push(row);
 if(rows.length<2)throw Error('Include a header row and at least one transaction.');if(rows.length>5001)throw Error('Import up to 5,000 transactions at a time.');
 const header=rows.shift();if(new Set(header).size!==header.length)throw Error('Column names must be unique.');return{header,rows};
}
function numeric(v){const s=String(v??'').trim().replace(/[$,\s]/g,'');return s&&/^\d+(\.\d+)?$/.test(s)?Number(s):NaN;}
function dateOnly(v){let s=String(v??'').trim(),m;if((m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s))){}else if((m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s))){m=[m[0],m[3],m[1].padStart(2,'0'),m[2].padStart(2,'0')];}else return null;const d=m.slice(1).join('-');const parsed=new Date(d+'T12:00:00Z');return Number.isFinite(+parsed)&&parsed.toISOString().slice(0,10)===d?d:null;}
function normalize(row,header,map,provider){
 const value=k=>map[k]===undefined||map[k]===''?'':row[Number(map[k])]??'';
 if(row.length!==header.length)return{error:'Column count does not match the header.'};
 const date=dateOnly(value('date')),gallons=numeric(value('gallons'));let total=numeric(value('total')),price=numeric(value('price'));const name=value('station').trim()||'Fuel purchase',transactionId=value('id').trim();
 const currency=value('currency').trim().toUpperCase(),product=value('product').trim().toLowerCase();
 if(currency&&currency!=='USD')return{error:'Only USD transactions are supported.'};
 if(product&&!/diesel|ulsd|ultra low sulfur/.test(product))return{error:'Not identified as diesel. Review separately.'};
 if(!date)return{error:'Use YYYY-MM-DD or MM/DD/YYYY dates.'};if(!Number.isFinite(gallons)||gallons<=0)return{error:'Gallons must be greater than zero; credits are not supported.'};
 if((map.total===undefined||map.total==='')&&Number.isFinite(price))total=gallons*price;
 if(!Number.isFinite(total)||total<=0)return{error:'Enter a positive diesel-only total or unit price.'};
 price=total/gallons;
 if(name.length>200||transactionId.length>200)return{error:'Station or transaction ID exceeds 200 characters.'};
 return{value:{date,gallons,total:Math.round(total*100)/100,price,station:name,provider,transactionId,key:transactionId?JSON.stringify([provider,transactionId]):JSON.stringify([provider,date,name.toLowerCase(),gallons,Math.round(total*100)])}};
}
function review(parsed,map,provider,existing){const seen=new Set(existing.map(t=>t.key)),valid=[],invalid=[],duplicates=[];parsed.rows.forEach((row,i)=>{const r=normalize(row,parsed.header,map,provider);if(r.error){invalid.push({row:i+2,error:r.error});return}if(seen.has(r.value.key)){duplicates.push(i+2);return}seen.add(r.value.key);valid.push(r.value)});return{valid,invalid,duplicates};}
function totals(transactions){const total=transactions.reduce((s,t)=>s+t.total,0),gallons=transactions.reduce((s,t)=>s+t.gallons,0);return{total,gallons,price:gallons?total/gallons:0};}
const api={parseCSV,numeric,dateOnly,normalize,review,totals};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FuelCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
