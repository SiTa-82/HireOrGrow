'use strict';
// All market/salary source payloads are public, pre-processed datasets.
// Manual Internal rate never enters a network request. Only currency codes go to Frankfurter.
const MARKET_ROLES = {
 'devops-engineer':'DevOps Engineer', 'software-engineer':'Software Engineer', 'backend-engineer':'Backend Engineer',
 'cloud-architect':'Cloud Architect', 'data-scientist':'Data Scientist',
 'site-reliability-engineer':'Site Reliability Engineer'
};
const sourceHosts=new Set(['jobs.ita.am','www.fairpay.ge','findjobs.ge','www.platy.sk','www.paylab.com','frankfurter.dev']);
const priorityMarkets=['armenia','georgia','slovakia'];
const allMarkets=Object.keys(MARKETS);
const marketPresets={priority:priorityMarkets,eu:allMarkets.filter(x=>MARKETS[x].region==='eu'),us:['united-states'],india:['india'],global:allMarkets};
const selectedMarkets=()=>Array.from(document.querySelectorAll('.m-country:checked')).map(x=>x.value);
const SOURCE_FILES={refs:'./data/salary_references.json',jobs:'./data/georgia_live.json'};
let referenceRecords=[], georgiaFeed={status:'not_collected',roles:{},generatedAt:null};
let marketError=[],marketBusy=false,lastLoad=0,marketOpened=false,fxRates={USD:1},fxDate=null;
const showDate=raw=>raw?String(raw).slice(0,10):'Not supplied';
function marketLink(raw,label){
 try { const u=new URL(raw);if(u.protocol!=='https:' || !sourceHosts.has(u.hostname))return safe(label);
  return `<a href="${safe(u.toString())}" target="_blank" rel="noopener noreferrer">${safe(label)} ↗</a>`; }
 catch {return safe(label)}
}
function formatMoney(value,cur){try{return new Intl.NumberFormat('en-US',{style:'currency',currency:cur,maximumFractionDigits:0}).format(value)}catch{return Math.round(value).toLocaleString('en-US')+' '+cur}}
function internalAnnual(){
 const s=el('m-historical').value.trim();if(!s)return null;
 const x=Number(s);if(!Number.isFinite(x)||x<0)return null;
 return x*({annual:1,monthly:12,hourly:2080}[el('m-rate-basis').value]||1);
}
function convertMoney(value,from,to){
 if(from===to)return value;
 if(!Number.isFinite(fxRates[from])||!Number.isFinite(fxRates[to]))return null;
 return value/fxRates[from]*fxRates[to];
}
async function fetchData(file){
 const response=await fetch(file,{cache:'no-store',credentials:'same-origin'});
 if(!response.ok)throw Error(`Dataset unavailable: HTTP ${response.status}`);
 return response.json();
}
async function updateFx(){
 try{
  const c=new AbortController(),timer=setTimeout(()=>c.abort(),7000);
  try{
   const response=await fetch('https://api.frankfurter.dev/v2/rates?base=USD',
    {method:'GET',signal:c.signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
   if(!response.ok)throw Error('FX API unavailable');
   const rows=await response.json(); if(!Array.isArray(rows))throw Error('Invalid FX response');
   const rates={USD:1};let date=null;
   for(const r of rows){const cc=String(r.quote||'').toUpperCase(),v=Number(r.rate);
    if(/^[A-Z]{3}$/.test(cc)&&Number.isFinite(v)&&v>0)rates[cc]=v;
    if(!date&&r.date)date=showDate(r.date);
   }
   if(!rates.EUR)throw Error('EUR missing from FX response');fxRates=rates;fxDate=date;
  }finally{clearTimeout(timer)}
 }catch(_){fxRates={USD:1};fxDate=null}
}
function displaySalary(r){
 const low=formatMoney(r.low,r.currency),hi=formatMoney(r.high,r.currency);
 return low+' – '+hi+(r.median!==null&&r.median!==undefined?' · median '+formatMoney(r.median,r.currency):'');
}
function gradeMismatch(r,grade){return r.grade!==grade}
function renderReferenceCard(r,selectedGrade){
 const isMatch=!gradeMismatch(r,selectedGrade);
 const level=r.grade==='all'?'All experience levels':r.grade==='senior'?'Senior':r.grade==='mid'?'Mid-level':'Junior';
 const roleMatched=r.roleScope!=='family';
 const verified=isMatch&&roleMatched&&r.basis==='gross'&&Number(r.sample||0)>=8;
 const header=!roleMatched?'Job-family context · not role-specific':!isMatch?'Context only · level mismatch':r.basis==='gross'?'Role + level match · gross':'Role + level match · '+String(r.basis).toUpperCase();
 const origin=`${safe(r.source)} · ${marketLink(r.url,'Source page')} · checked: ${safe(showDate(r.checkedDate))}`;
 const details=`${safe(r.rangeLabel)} · ${safe(level)} · ${safe(r.basis.toUpperCase())} · ${safe(r.currency)} per ${safe(r.period)}${Number.isFinite(r.sample)?' · n='+safe(r.sample):''}`;
 const annualFactor=r.period==='month'?12:1;
 const reportcur=el('m-reportcur').value;
 const convertedLow=convertMoney(r.low*annualFactor,r.currency,reportcur),convertedHi=convertMoney(r.high*annualFactor,r.currency,reportcur);
 const converted=(convertedLow===null||convertedHi===null)?'Conversion unavailable for the requested currency.' :
  `Annualized indicative amount: ${formatMoney(convertedLow,reportcur)} – ${formatMoney(convertedHi,reportcur)} / year${fxDate?' (FX '+safe(fxDate)+')':''}.`;
 const overheadRaw=el('m-burden').value.trim();
 const overheadPercent=overheadRaw===''?null:Number(overheadRaw);
 const overhead=(r.basis==='gross' && overheadPercent!==null && Number.isFinite(overheadPercent) && overheadPercent>=0 && overheadPercent<=250)?
  `<div class="subtext">Illustrative employer overhead +${safe(overheadPercent.toFixed(1))}% (user assumption, NOT a country tax calculation): ${safe(formatMoney(r.low*(1+overheadPercent/100),r.currency))} – ${safe(formatMoney(r.high*(1+overheadPercent/100),r.currency))} / ${safe(r.period)}.</div>` : '';
 return `<article class="benchmark reference" data-source-country="${safe(r.country)}"><div class="benchmark-top"><strong>${safe(r.source)}</strong><span class="flag ${verified?'api':'uncertain'}">${safe(header)}</span></div>`+
 `<div class="salary">${safe(displaySalary(r))} / ${safe(r.period)}</div><div class="crumb">${details}</div>`+
 `<div class="subtext">${safe(converted)}</div>${overhead}<div class="sourcebox"><div class="src">${origin}</div>`+
 `<div class="src">Last source update: ${safe(showDate(r.publishedDate))} · Survey method: ${safe(r.type)}.</div>`+
 `<p class="marketnote">${safe(r.note)}</p></div></article>`;
}
function renderGeorgiaJobs(role,grade){
 const box=el('m-georgia-results');
 const obj=georgiaFeed.roles?.[role];
 const status=georgiaFeed.status||'unavailable';
 if(status!=='ok'){
  const blocked=status==='blocked'||georgiaFeed.errorType==='PermissionError';
  const reason=blocked?'Collection blocked by the source’s robots.txt. The workflow respects this restriction; no vacancy data was imported.':'No successful source collection is available.';
  box.innerHTML=`<p class="marketnote">${safe(reason)} This does not mean there are no jobs. ${marketLink('https://findjobs.ge/crawl/en/','Explore source')}</p>`;
  set('m-georgia-count',blocked?'Access blocked':'No fresh feed');return;
 }
 if(!obj){box.innerHTML='<p class="marketnote">No result for this occupation in the most recent dataset.</p>';set('m-georgia-count','0 matching ads');return}
 const list=Array.isArray(obj.vacancies)?obj.vacancies:[];
 const appropriate=list.filter(x=>x.grade===grade);
 const sample=obj.sampleCount||list.length;
 const summary=`<div class="marketnote">Collected ${safe(showDate(georgiaFeed.generatedAt))} · ${sample} salary-disclosing local ads for this role, all levels. ${obj.verifiedMedian&&obj.verifiedMedianCount>=8?'Median of advertised monthly pay midpoints from at least eight listings: '+formatMoney(obj.verifiedMedian,'GEL')+'. ':'Sample too small to publish a reliable role-level median. '}Pay basis (gross/net) is not specified by this job-board data.</div>`;
 const shown=(appropriate.length?appropriate:list).slice(0,6);
 const lines=shown.length?shown.map(x=>`<div class="sc-row"><span>${marketLink(x.url,x.title)}<small class="crumb">${safe(x.company||'Employer not shown')} · ${safe(x.city||'Georgia')} · ${safe(x.grade==='unspecified'?'grade not stated':x.grade)}</small></span><b>${safe(formatMoney(x.min,'GEL'))} – ${safe(formatMoney(x.max,'GEL'))} / mo</b></div>`).join(''):'<p class="marketnote">No ads disclose a usable monthly salary for this grade.</p>';
 const caveat=appropriate.length===0?'No grade-exact job ads found in this sample; other grades are displayed only for context.':`Grade-explicit ads: ${appropriate.length}; do not infer a grade median if fewer than eight.`;
 box.innerHTML=summary+`<div class="marketnote">${safe(caveat)}</div>`+lines;
 set('m-georgia-count',sample+' salary-posted ads');
}

// Always put a comparison summary first. These figures remain in original units;
// no ranking is attempted across NET/GROSS/unknown-basis records.
function renderComparisonTable(selected,reference,grade){
 const output=[];
 for(const country of selected){
  const available=reference.filter(r=>r.country===country);
  const rank=r=>(r.roleScope==='family'?2:0)+(r.grade===grade?0:1);
  const best=available.slice().sort((a,b)=>rank(a)-rank(b))[0];
  const countryText=safe(MARKETS[country].name);
  if(!best){
   output.push(`<tr><th scope="row">${countryText}</th><td class="muted-cell">No documented range</td><td><span class="fit-label no-fit">No coverage</span></td><td><span class="mini-muted">Not available</span></td></tr>`);
   continue;
  }
  const exactRole=best.roleScope!=='family',exactLevel=best.grade===grade;
  const fullMatch=exactRole&&exactLevel;
  const label=!exactRole?'Role family only':exactLevel?`Level matched · ${best.basis.toUpperCase()}`:'Different level / all grades';
  const state=!fullMatch?'context':'partial';
  const salary=`${formatMoney(best.low,best.currency)}–${formatMoney(best.high,best.currency)}`;
  const labelMedian=best.median===null?'':`<span class="mini-muted">Median ${safe(formatMoney(best.median,best.currency))}</span>`;
  output.push(`<tr><th scope="row">${countryText}</th><td><strong>${safe(salary)} / ${best.period==='month'?'mo':'yr'}</strong><span class="mini-muted">${safe(best.basis.toUpperCase())} · ${safe(best.grade==='all'?'all levels':best.grade)}</span>${labelMedian}</td><td><span class="fit-label ${state}">${safe(label)}</span><span class="mini-muted">${best.sample?'n='+safe(best.sample):'Sample not published'}</span></td><td>${marketLink(best.url,best.source)}<span class="mini-muted">${best.publishedDate?'Source '+safe(showDate(best.publishedDate))+' · ':''}checked ${safe(showDate(best.checkedDate))}</span></td></tr>`);
 }
 el('m-compare-rows').innerHTML=output.join('')||'<tr><td colspan="4">Select markets to compare.</td></tr>';
 const exactCountries=new Set(reference.filter(r=>r.roleScope!=='family'&&r.grade===grade).map(r=>r.country));
 return exactCountries.size;
}

function renderMarket(){
 const role=el('m-role').value,grade=el('m-grade').value,selected=selectedMarkets();
 // Every country-specific evidence section must obey the checkbox selection.
 // A provider's existence in the underlying dataset is NOT grounds to show its card.
 const georgiaSelected=selected.includes('georgia');
 const georgiaPanel=el('m-georgia-panel');
 georgiaPanel.hidden=!georgiaSelected;
 georgiaPanel.style.display=georgiaSelected?'':'none';
 const raw=internalAnnual(),internalloc=el('m-home').value,internalcur=el('m-history-cur').value;
 const reference=referenceRecords.filter(r=>r.role===role&&selected.includes(r.country));
 const haveCountries=new Set(reference.map(r=>r.country));
 const jobs=georgiaFeed.roles?.[role];
 if(selected.includes('georgia')&&georgiaFeed.status==='ok'&&jobs?.sampleCount)haveCountries.add('georgia');
 set('m-result-title',`${MARKET_ROLES[role]} · ${grade==='mid'?'Mid-level':grade==='senior'?'Senior':'Junior'}`);
 const gradeMatchCount=renderComparisonTable(selected,reference,grade);
 set('m-context',`${selected.length} selected markets · ${gradeMatchCount} role-and-level matches · surveys are dated snapshots`);
 set('m-locations',selected.length);set('m-comparable',gradeMatchCount);
 set('m-rate-date',fxDate?'FX · '+fxDate:'FX not available');
 set('m-internal',raw===null?'Not entered':formatMoney(raw,internalcur)+'/yr');
 let summary='Read the market table first: salary is shown in original currency and period; NET and GROSS are not interchangeable. A role-family or other-level source is context, not a matching salary quote. ';
 if(raw===null)summary+='Optional manual Internal rate is not saved or sent to salary providers.';
 else if(el('m-rate-type').value==='billing')summary+='Internal input is a client billing rate, not a salary; comparison is disabled.';
 else{
  const comparable=reference.find(r=>r.country===internalloc && r.grade===grade && r.roleScope!=='family' && r.basis==='gross' && r.median!==null);
  if(comparable){
   const v=convertMoney(raw,internalcur,comparable.currency);
   if(v===null)summary+='Reference FX is unavailable for comparison.';
   else{const base=comparable.median*(comparable.period==='month'?12:1),dif=(v/base-1)*100;
    summary+=`Manual gross rate is ${Math.abs(dif).toFixed(1)}% ${dif>=0?'above':'below'} the grade-specific reference median. Source: ${comparable.source}.`;
   }
  }else{
   const contextual=reference.find(r=>r.country===internalloc&&r.roleScope!=='family'&&r.basis==='gross');
   if(contextual){const val=convertMoney(raw,internalcur,contextual.currency),annual=contextual.period==='month'?12:1;
    if(val!==null)summary+=`Context only: this internal gross rate is ${val<contextual.low*annual?'below':val>contextual.high*annual?'above':'within'} the all-level range published by ${contextual.source}. No grade-specific percentage gap is shown.`;
    else summary+='Reference FX unavailable; no salary gap calculated.';
   } else summary+='No same-grade, same-pay-basis benchmark; a percentage gap would be misleading.';
  }
 }
 set('m-ceo',summary);
 const rendered=[];
 for(const c of selected){const entries=reference.filter(r=>r.country===c);
  if(!entries.length){continue}
  rendered.push(`<details class="country-source-group"><summary>${safe(MARKETS[c].name)} · ${entries.length} attributed ${entries.length===1?'record':'records'}</summary>${entries.map(r=>renderReferenceCard(r,grade)).join('')}</details>`);
 }
 el('m-results').innerHTML=rendered.join('')||'<p class="marketnote">No detailed sources available for this selection.</p>';
 if(georgiaSelected)renderGeorgiaJobs(role,grade);
 const stamp=georgiaFeed.generatedAt?'Georgia feed: '+showDate(georgiaFeed.generatedAt):'Georgia feed not published';
 const scopeCaveat=[];
 if(!selected.length)scopeCaveat.push('Select one or more markets to display salary evidence.');
 else{
  scopeCaveat.push('Historical survey figures are reference information, not current salary offers or employer-total-cost estimates.');
  if(selected.includes('armenia'))scopeCaveat.push('Armenia: available ITA Jobs figures are NET; some records belong to Senior or other positions.');
  if(selected.includes('georgia'))scopeCaveat.push('Georgia: Fairpay samples are small and do not state NET/GROSS; the separate vacancy feed is blocked by source access restrictions.');
  if(selected.includes('slovakia'))scopeCaveat.push('Slovakia: the Platy.sk DevOps figures are GROSS and include all seniority levels.');
  if(selected.some(c=>!['armenia','georgia','slovakia'].includes(c)))scopeCaveat.push('Some selected markets have no verified salary records for this role and level; no amount is inferred.');
  scopeCaveat.push('Different pay bases and grades cannot be directly compared. The manual Internal rate is separate and never uploaded.');
 }
 set('m-interpretation', 'Interpretation: '+scopeCaveat.join(' '));
 const shownFeed=georgiaSelected?' · '+stamp:'';
 const relevantErrors=marketError.filter(x=>georgiaSelected||!x.toLowerCase().includes('georgia'));
 set('m-fetchstatus',marketBusy?'Loading site data…':`Public source snapshots: ${reference.length}${shownFeed} · FX ${fxDate||'unavailable'}${relevantErrors.length?' · '+relevantErrors.join('; '):''}`);
 const lines=[`HireOrGrow v0.8.1 · ${MARKET_ROLES[role]} · level ${grade}`,`Markets: ${selected.map(c=>MARKETS[c].name).join(', ')}`,
 `Report created: ${new Date().toISOString().slice(0,10)}`,`FX: Frankfurter ${fxDate||'unavailable'}`,`Internal rate: ${raw===null?'Not entered':formatMoney(raw,internalcur)+'/year (manual, fictional)'}`,summary];
 for(const r of reference)lines.push(`${MARKETS[r.country].name}: ${displaySalary(r)} per ${r.period}, ${r.basis}, grade ${r.grade}, scope ${r.roleScope||'exact'}, n=${r.sample||'unknown'}, ${r.source}, checked ${r.checkedDate}, updated ${r.publishedDate||'not specified'}, ${r.url}`);
 if(georgiaSelected)lines.push(`Georgia job feed: ${stamp}; ${georgiaFeed.sourceUrl||''}`);
 lines.push(`Disclaimer: Not an employer-total-cost estimate, not an automated HR recommendation. Do not use NDA data.`);
 marketReport=lines.join('\n');
}
async function loadMarkets(){
 const run=++lastLoad;marketBusy=true;marketError=[];renderMarket();
 const tasks=await Promise.allSettled([fetchData(SOURCE_FILES.refs),fetchData(SOURCE_FILES.jobs),updateFx()]);
 if(run!==lastLoad)return;
 if(tasks[0].status==='fulfilled'&&Array.isArray(tasks[0].value.records)){referenceRecords=tasks[0].value.records;}
 else{referenceRecords=[];marketError.push('Salary reference file unavailable')}
 if(tasks[1].status==='fulfilled'&&tasks[1].value&&typeof tasks[1].value.roles==='object'){georgiaFeed=tasks[1].value;}
 else{georgiaFeed={status:'unavailable',roles:{}};marketError.push('Georgia job feed file unavailable')}
 marketBusy=false;renderMarket();
}
function setMarketPreset(type){
 const wanted=new Set(marketPresets[type]||[]);
 if(type==='clear')wanted.clear();
 if(type!=='custom')document.querySelectorAll('.m-country').forEach(x=>{x.checked=wanted.has(x.value)});
 document.querySelectorAll('[data-preset]').forEach(b=>{const yes=b.dataset.preset===type;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes))});
 renderMarket();
}
for(const b of document.querySelectorAll('[data-preset]'))b.addEventListener('click',()=>setMarketPreset(b.dataset.preset));
for(const c of document.querySelectorAll('.m-country'))c.addEventListener('change',()=>setMarketPreset('custom'));
for(const id of ['m-role','m-grade','m-reportcur','m-burden','m-historical','m-home','m-history-cur','m-rate-basis','m-rate-type'])el(id).addEventListener('input',renderMarket);
el('m-refresh').addEventListener('click',loadMarkets);
el('tab-market').addEventListener('click',()=>{if(!marketOpened){marketOpened=true;loadMarkets()}});
el('m-copy').onclick=()=>copy(marketReport);
renderMarket();

// The reference section is the default landing view; load its public datasets now.
marketOpened=true;
loadMarkets();
