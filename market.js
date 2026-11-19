'use strict';
// All market/salary source payloads are public, pre-processed datasets.
// Manual Internal rate never enters a network request. Only currency codes go to Frankfurter.
const MARKET_ROLES = {
 "algorithm-developer": "Algorithm Developer",
 "algorithm-engineer": "Algorithm Engineer",
 "android-developer": "Android Developer",
 "backend-engineer": "Backend Engineer",
 "bi-analyst": "BI Analyst",
 "bi-developer": "BI Developer",
 "bioinformatics-analyst": "Bioinformatics Analyst",
 "bioinformatics-engineer": "Bioinformatics Engineer",
 "bioinformatics-scientist": "Bioinformatics Scientist",
 "business-analyst": "Business Analyst",
 "cloud-architect": "Cloud Architect",
 "cloud-engineer": "Cloud Engineer",
 "cloud-support-engineer": "Cloud Support Engineer",
 "computational-biologist": "Computational Biologist",
 "data-analyst": "Data Analyst",
 "data-architect": "Data Architect",
 "data-engineer": "Data Engineer",
 "data-platform-engineer": "Data Platform Engineer",
 "data-scientist": "Data Scientist",
 "devops-engineer": "DevOps Engineer",
 "etl-developer": "ETL Developer",
 "frontend-developer": "Frontend Developer",
 "full-stack-developer": "Full Stack Developer",
 "go-developer": "Go Developer",
 "hpc-engineer": "High Performance Computing (HPC) Engineer",
 "hpc-systems-administrator": "HPC Systems Administrator",
 "ios-developer": "iOS Developer",
 "java-developer": "Java Developer",
 "javascript-developer": "JavaScript Developer",
 "machine-learning-engineer": "Machine Learning Engineer",
 "mlops-engineer": "MLOps Engineer",
 "mobile-developer": "Mobile Developer",
 "performance-engineer": "Performance Engineer",
 "platform-engineer": "Platform Engineer",
 "python-developer": "Python Developer",
 "qa-automation-engineer": "QA Automation Engineer",
 "qa-engineer": "QA Engineer",
 "site-reliability-engineer": "Site Reliability Engineer (SRE)",
 "software-engineer": "Software Engineer",
 "solution-architect": "Solution Architect",
 "systems-analyst": "Systems Analyst",
 "technical-business-analyst": "Technical Business Analyst",
 "technical-support-engineer": "Technical Support Engineer"
};
const sourceHosts=new Set(['salarybyrole.com','www.salarybyrole.com','yubhub.co','www.yubhub.co','jobs.ita.am','www.fairpay.ge','findjobs.ge','www.platy.sk','www.paylab.com','frankfurter.dev','www.itechscope.com','www.pearsoncarter.com','hyrezy.com','realtime.jobs','taylor.kz','www.inform.kz']);
const allMarkets=Object.keys(MARKETS);
const marketPresets={eu:allMarkets.filter(x=>MARKETS[x].region==='eu'),us:['united-states'],global:allMarkets};
const selectedMarkets=()=>Array.from(document.querySelectorAll('.m-country:checked')).map(x=>x.value);
const SOURCE_FILES={refs:'./data/salary_references.json?v=0.9.10',jobs:'./data/georgia_live.json?v=0.9.10',auto:'./data/automatic_market.json?v=0.9.10',history:'./data/rate_history.json?v=0.9.10'};
let rateHistory={observations:[],lastCheckedAt:null}, referenceRecords=[], georgiaFeed={status:'not_collected',roles:{},generatedAt:null};
let automated={generatedAt:null,providers:{},salaryRecords:[],vacancyRecords:[]};
let marketError=[],marketBusy=false,lastLoad=0,marketOpened=false,referenceLoaded=false,fxRates={USD:1},fxDates={},fxDate=null;
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
   const rates={USD:1},rateDates={};let latestDate=null;
   for(const r of rows){const cc=String(r.quote||'').toUpperCase(),v=Number(r.rate);
    if(/^[A-Z]{3}$/.test(cc)&&Number.isFinite(v)&&v>0){
     rates[cc]=v;
     if(r.date){rateDates[cc]=showDate(r.date);
      if(!latestDate||rateDates[cc]>latestDate)latestDate=rateDates[cc];}
    }
   }
   // Each FX quote may have its own observation date. Never assign a generic
   // EUR date to a GEL conversion, and never invent a missing FX rate.
   if(Object.keys(rates).length<2)throw Error('No FX quotes returned');
   fxRates=rates;fxDates=rateDates;fxDate=latestDate;
  }finally{clearTimeout(timer)}
 }catch(_){fxRates={USD:1};fxDates={};fxDate=null}
}
function marketConversion(r){
 const target=el('m-reportcur').value||'USD';
 const base=r.currency;
 const didConvert=base!==target;
 const low=convertMoney(r.low,base,target);
 const high=convertMoney(r.high,base,target);
 const median=r.median===null||r.median===undefined?null:convertMoney(r.median,base,target);
 const success=Number.isFinite(low)&&Number.isFinite(high);
 const original=displaySalary(r);
 const originalRange=formatMoney(r.low,base)+' – '+formatMoney(r.high,base);
 const dates=[base,target].filter(c=>c!=='USD').map(c=>fxDates[c]).filter(Boolean);
 const distinctDates=[...new Set(dates)];
 const rateDate=distinctDates.length?distinctDates.join(' / '):'not supplied';
 const convertedRange=success?formatMoney(low,target)+' – '+formatMoney(high,target):originalRange;
 const conversionNote=!didConvert?`Source already in ${target} · no currency conversion`:
  success?`Automatically converted to ${target} using Frankfurter FX · rate date ${rateDate}`:
  `FX conversion to ${target} unavailable · showing original ${base} amounts`;
 return {target,success,didConvert,low,high,median,original,convertedRange,conversionNote,rateDate};
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
 const cv=marketConversion(r);
 const annualFactor=r.period==='month'?12:1;
 const annualized=cv.success?`Indicative annualized amount in ${cv.target}: ${formatMoney(cv.low*annualFactor,cv.target)} – ${formatMoney(cv.high*annualFactor,cv.target)} / year. `:'';
 const converted=`${cv.conversionNote}. ${annualized}Currency conversion does not change NET/GROSS pay basis.`;
 const overheadRaw=el('m-burden').value.trim();
 const overheadPercent=overheadRaw===''?null:Number(overheadRaw);
 const overhead=(r.basis==='gross' && overheadPercent!==null && Number.isFinite(overheadPercent) && overheadPercent>=0 && overheadPercent<=250)?
  `<div class="subtext">Illustrative employer overhead +${safe(overheadPercent.toFixed(1))}% (user assumption, NOT a country tax calculation): ${safe(formatMoney(r.low*(1+overheadPercent/100),r.currency))} – ${safe(formatMoney(r.high*(1+overheadPercent/100),r.currency))} / ${safe(r.period)}.</div>` : '';
 return `<article class="benchmark reference" data-source-country="${safe(r.country)}"><div class="benchmark-top"><strong>${safe(r.source)}</strong><span class="flag ${verified?'api':'uncertain'}">${safe(header)}</span></div>`+
 `<div class="salary">${safe(cv.convertedRange)} / ${safe(r.period)}</div><div class="crumb">Original source: ${safe(cv.original)} / ${safe(r.period)} · ${details}</div>`+
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
 const lines=shown.length?shown.map(x=>{
  const target=el('m-reportcur').value||'USD';
  const a=convertMoney(x.min,'GEL',target),b=convertMoney(x.max,'GEL',target);
  const converted=Number.isFinite(a)&&Number.isFinite(b);
  const primary=converted?`${formatMoney(a,target)} – ${formatMoney(b,target)}`:`${formatMoney(x.min,'GEL')} – ${formatMoney(x.max,'GEL')}`;
  const original=`${formatMoney(x.min,'GEL')} – ${formatMoney(x.max,'GEL')}`;
  const date=fxDates.GEL||'not supplied';
  const note=target==='GEL'?'Original GEL':converted?`Auto-converted to ${target} · Frankfurter FX ${date}`:`${target} FX unavailable · original GEL`;
  return `<div class="sc-row"><span>${marketLink(x.url,x.title)}<small class="crumb">${safe(x.company||'Employer not shown')} · ${safe(x.city||'Georgia')} · ${safe(x.grade==='unspecified'?'grade not stated':x.grade)}</small></span><span class="job-salary"><b>${safe(primary)} / mo</b><small>${safe(note)}${converted&&target!=='GEL'?` · Original: ${safe(original)} / mo`:''}</small></span></div>`;
 }).join(''):'<p class="marketnote">No ads disclose a usable monthly salary for this grade.</p>';
 const caveat=appropriate.length===0?'No grade-exact job ads found in this sample; other grades are displayed only for context.':`Grade-explicit ads: ${appropriate.length}; do not infer a grade median if fewer than eight.`;
 box.innerHTML=summary+`<div class="marketnote">${safe(caveat)}</div>`+lines;
 set('m-georgia-count',sample+' salary-posted ads');
}

// Always put a comparison summary first. These figures remain in original units;
// no ranking is attempted across NET/GROSS/unknown-basis records.
function renderComparisonTable(selected,reference,grade){
 const output=[];
 if(!referenceLoaded){
  el('m-compare-rows').innerHTML=`<div class="market-load-error" role="alert"><strong>Reference data not loaded</strong><p>The public salary JSON was unavailable. This is a loading error, not evidence that the market has no salary data.</p><button class="action" type="button" id="m-retry-data">Try loading again</button></div>`;
  const retry=el('m-retry-data');if(retry)retry.addEventListener('click',loadMarkets);
  return 0;
 }
 for(const country of selected){
  const available=reference.filter(r=>r.country===country);
  const rank=r=>(r.roleScope==='family'?10:0)+(r.grade===grade?0:r.grade==='all'?2:4)+(r.basis==='unspecified'?1:0);
  const best=available.slice().sort((a,b)=>rank(a)-rank(b))[0];
  const name=safe(MARKETS[country].name);
  if(!best){
   output.push(`<article class="market-mini-card"><div class="market-mini-head"><h4>${name}</h4><span class="fit-label no-fit">No documented range</span></div><p class="marketnote">No verified salary figure for this role and country in the current source library.</p></article>`);
   continue;
  }
  const exactRole=best.roleScope!=='family',exactLevel=best.grade===grade;
  const fullMatch=exactRole&&exactLevel;
  const label=!exactRole?'Related occupation':exactLevel?`Level matched · ${best.basis.toUpperCase()}`:(best.grade==='all'?'All levels · context':(best.grade==='senior'?'Senior only · context':best.grade==='mid'?'Mid-level only · context':'Junior only · context'));
  const state=!fullMatch?'context':'partial';
  const cv=marketConversion(best);
  const extraMedian=best.median===null||best.median===undefined?'':`<span class="market-mini-median">Median ${safe(cv.median===null?formatMoney(best.median,best.currency):formatMoney(cv.median,cv.target))}</span>`;
  const gradeLabel=best.grade==='all'?'All experience levels':best.grade==='mid'?'Mid-level':best.grade==='senior'?'Senior':'Junior';
  const note=exactLevel?'':'This is context, not a salary estimate for the selected level.';
  const title=cv.didConvert&&cv.success?`Published salary · auto-converted to ${cv.target}`:cv.success?`Published salary · ${cv.target}`:`Published salary · original ${best.currency}`;
  const originalLine=cv.didConvert&&cv.success?`Original source: ${cv.original} / ${best.period}`:`Original source currency: ${best.currency}`;
  const fxLink=cv.didConvert&&cv.success?` · <a href="https://frankfurter.dev/" target="_blank" rel="noopener noreferrer">Frankfurter FX ↗</a>`:'';
  output.push(`<article class="market-mini-card" data-market="${safe(country)}">
     <div class="market-mini-head"><h4>${name}</h4><span class="fit-label ${state}">${safe(label)}</span></div>
     <div class="market-mini-caption">${safe(title)}</div>
     <div class="market-mini-pay">${safe(cv.convertedRange)} <span>/ ${best.period==='month'?'month':'year'}</span></div>
     ${extraMedian}
     <div class="market-mini-origin">${safe(originalLine)}</div>
     <div class="market-mini-fx${cv.didConvert&&!cv.success?' missing-fx':''}">${safe(cv.conversionNote)}${fxLink}</div>
     <div class="market-mini-meta"><span>${safe(best.basis.toUpperCase())}</span><span>${safe(gradeLabel)}</span>${best.sample?`<span>Sample: ${safe(best.sample)}</span>`:''}</div>
     ${note?`<p class="market-mini-warning">${note}</p>`:''}
     <div class="market-mini-footer"><span class="market-mini-caption">Source · ${best.publishedDate?'published '+safe(showDate(best.publishedDate)):'publication date unknown'} · checked ${safe(showDate(best.checkedDate))}</span><div>${marketLink(best.url,best.source)}</div></div>
   </article>`);
 }
 el('m-compare-rows').innerHTML=output.join('')||'<p class="marketnote">Select one or more countries to compare.</p>';
 const exactCountries=new Set(reference.filter(r=>r.roleScope!=='family'&&r.grade===grade).map(r=>r.country));
 return exactCountries.size;
}

function safeJobUrl(raw){
 try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port||u.hostname==='localhost'||u.hostname.endsWith('.localhost'))return null;return u.href}catch{return null}
}
function renderAutomaticJobs(selected,role,grade){
 const host=el('m-auto-results'),status=el('m-auto-status');
 if(!host||!status)return;
 const salaryProvider=automated.providers?.salarybyrole||{status:'not_run',records:0};
 const jobProvider=automated.providers?.yubhub||{status:'not_run',records:0};
 const jobs=(automated.vacancyRecords||[]).filter(j=>selected.includes(j.country)&&j.role===role&&typeof j.salaryText==='string');
 const exact=jobs.filter(j=>j.grade===grade);
 const shown=(exact.length?exact:jobs).slice(0,12);
 const oldJobs=shown.filter(j=>j.cacheStatus==='retained_previous').length;
 const totalBands=(automated.salaryRecords||[]).filter(r=>selected.includes(r.country)&&r.role===role).length;
 status.textContent=`API snapshot ${showDate(automated.generatedAt)} · SalaryByRole: ${salaryProvider.status||'not run'} (${totalBands} relevant bands) · YubHub: ${jobProvider.status||'not run'} (${jobs.length} salary-posted ads for this role in selected markets). Public API coverage can be zero even when jobs exist.`;
 if(!selected.length){host.innerHTML='<p class="marketnote">Select a country to see salary-posted job listings.</p>';return}
 if(!shown.length){host.innerHTML='<p class="marketnote">No salary-posted vacancies in this available API snapshot for this position and selection. Existing sourced salary surveys above remain available. This does not mean there are no local vacancies.</p>';return}
 const lines=shown.map(j=>{
  const address=safeJobUrl(j.url);
  const title=address?`<a href="${safe(address)}" target="_blank" rel="noopener noreferrer nofollow">${safe(j.title)} ↗</a>`:safe(j.title);
  const level=j.grade==='unspecified'?'Level not stated':j.grade===grade?'Level match':`Other level: ${j.grade}`;
  const observed=j.observedDate||showDate(j.fetchedAt);
  const old=j.cacheStatus==='retained_previous'?' · retained previous snapshot, not refreshed today':'';
  const salary=safe(j.salaryText);
  return `<article class="auto-vacancy"><div class="auto-vacancy-title">${title}<span class="pill">${safe(MARKETS[j.country]?.name||j.country)}</span></div>`+
   `<strong class="auto-vacancy-pay">${salary}</strong><p class="marketnote">${safe(j.company||'Employer unspecified')} · ${safe(j.location||'')} · ${safe(level)} · period ${safe(j.period||'unspecified')} · pay basis unspecified</p>`+
   `<p class="market-mini-caption">Source: YubHub (CC BY 4.0) · indexed ${safe(observed)}${safe(old)} · job location is based on source country filter and may require manual verification. <a href="https://yubhub.co/api/" target="_blank" rel="noopener noreferrer">Provider details ↗</a></p></article>`;
 }).join('');
 host.innerHTML=`<p class="marketnote">${shown.length} salary-disclosing job listing(s) shown${oldJobs?' · '+oldJobs+' retained from a previous refresh':''}. These are individual offers, not a market salary median. ${exact.length?'Grade-labelled listings shown first.':'Exact grade not provided; other levels shown only as context.'}</p><div class="auto-vacancy-grid">${lines}</div>`;
}

function renderRateTrends(selected,role,grade){
 const host=el('m-trends-chart');if(!host)return;
 const rows=(rateHistory.observations||[]).filter(r=>r && selected.includes(r.country) && r.role===role && r.grade===grade && r.roleScope==='exact' && r.kind && Number.isFinite(Number(r.low)) && Number.isFinite(Number(r.high)));
 if(!selected.length){host.innerHTML='<p class="marketnote">Select a market to view historical observations.</p>';return;}
 if(!rows.length){host.innerHTML='<p class="marketnote">No rate history recorded for this role, grade and selected location yet. Collection starts after the first successful GitHub Actions refresh. Historical values are not invented.</p>';return;}
 const bySource=new Map();
 for(const r of rows){
  const key=r.seriesKey||[r.country,r.role,r.grade,r.source,r.currency,r.period,r.basis].join('|');
  if(!bySource.has(key))bySource.set(key,[]);
  bySource.get(key).push(r);
 }
 const trendCards=[...bySource.values()].sort((a,b)=>b.length-a.length).slice(0,8).map(series=>{
  series.sort((a,b)=>a.observedAt.localeCompare(b.observedAt));
  const first=series[0], last=series[series.length-1];
  const center=r=>r.median!==null&&r.median!==undefined?Number(r.median):(Number(r.low)+Number(r.high))/2;
  const values=series.map(center),firstV=values[0],lastV=values[values.length-1];
  const delta=firstV>0?(lastV/firstV-1)*100:null;
  const draw=series.length>1;
  const h=96,w=315,pad=17,min=Math.min(...values),max=Math.max(...values);
  const position=(v,i)=>[pad+i*(w-pad*2)/Math.max(1,values.length-1),max===min?h/2:pad+(max-v)*(h-pad*2)/(max-min)];
  const coords=values.map(position);
  const path=coords.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const svg=draw?`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${safe(series.length)} tracked observations: ${safe(first.observedAt)} to ${safe(last.observedAt)}" preserveAspectRatio="none"><path d="${path}" stroke="#276ea8" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${coords.map(([x,y])=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#276ea8"/>`).join('')}</svg>`:'<div class="rate-trend-empty">One recorded observation. Next observation will establish the first historical comparison.</div>';
  const change=series.length<2?'Tracking started':delta===null?'No comparable baseline':`${delta>=0?'+':''}${delta.toFixed(1)}% observed change`;
  return `<article class="rate-trend-card">
    <div class="rate-trend-meta"><strong>${safe(MARKETS[first.country]?.name||first.country)} · ${safe(first.source)}</strong><span class="pill">${safe(first.kind==='curated'?'Static survey':'API observations')}</span></div>
    <p class="rate-trend-units">${safe(first.grade)} · ${safe(first.basis.toUpperCase())} · ${safe(first.currency)} per ${safe(first.period)} · same source only</p>
    <div class="rate-trend-amount">${safe(formatMoney(lastV,last.currency))} <small>${safe(last.median!==null&&last.median!==undefined?'reported median':'range midpoint')}</small></div>
    ${svg}
    <div class="rate-trend-dates"><span>First saved: ${safe(showDate(first.observedAt))}</span><span>Last saved: ${safe(showDate(last.observedAt))}</span></div>
    <p class="marketnote"><strong>${safe(change)}</strong> · ${series.length} observation${series.length===1?'':'s'} · Source publication: ${safe(showDate(last.publishedDate))}. ${first.kind==='curated'?'This survey is not automatically republished.':'Repeated API collection does not guarantee changed underlying salary data.'} ${marketLink(first.url,'Source')}</p>
   </article>`;
 });
 const unrepresented=rows.length>0&&bySource.size>8?`<p class="marketnote">Showing 8 of ${bySource.size} distinct source series. No incompatible series are merged.</p>`:'';
 host.innerHTML=`<div class="rate-trend-grid">${trendCards.join('')}</div>${unrepresented}<p class="rate-trend-footnote">Collection history is stored in the public repository. It contains salary observations, NOT employee information. These are nominal source-currency changes, not inflation-adjusted trends. Empty or unchanged data must not be interpreted as a flat labor market.</p>`;
}
function renderMarket(){
 const role=el('m-role').value,grade=el('m-grade').value,selected=selectedMarkets();
 renderRateTrends(selected,role,grade);
 // Every country-specific evidence section must obey the checkbox selection.
 // A provider's existence in the underlying dataset is NOT grounds to show its card.
 const georgiaSelected=selected.includes('georgia');
 const georgiaPanel=el('m-georgia-panel');
 const hasUsableGeorgiaFeed=georgiaSelected&&georgiaFeed.status==='ok';
 georgiaPanel.hidden=!hasUsableGeorgiaFeed;
 georgiaPanel.style.display=hasUsableGeorgiaFeed?'':'none';
 const raw=internalAnnual(),internalloc=el('m-home').value,internalcur=el('m-history-cur').value;
 const availableAuto=(automated.salaryRecords||[]).filter(r=>r&&r.role===role&&selected.includes(r.country)&&['mid','senior','junior'].includes(r.grade)&&r.roleScope==='exact');
 const reference=referenceRecords.filter(r=>r.role===role&&selected.includes(r.country)).concat(availableAuto);
 const haveCountries=new Set(reference.map(r=>r.country));
 const jobs=georgiaFeed.roles?.[role];
 if(selected.includes('georgia')&&georgiaFeed.status==='ok'&&jobs?.sampleCount)haveCountries.add('georgia');
 set('m-result-title',`${MARKET_ROLES[role]} · ${grade==='mid'?'Mid-level':grade==='senior'?'Senior':'Junior'}`);
 const gradeMatchCount=renderComparisonTable(selected,reference,grade);
 set('m-context',`${selected.length} selected markets · ${gradeMatchCount} role-and-level matches · surveys are dated snapshots`);
 set('m-locations',selected.length);set('m-comparable',gradeMatchCount);
 set('m-rate-date',fxDate?'Frankfurter FX · latest '+fxDate:'Live FX unavailable');
 set('m-internal',raw===null?'Not entered':formatMoney(raw,internalcur)+'/yr');
 let summary=`Market comparison is displayed in ${el('m-reportcur').value} where a Frankfurter FX rate is available; original salary and each FX observation date are shown on the cards. Currency conversion does not turn NET pay into GROSS or make different grades comparable. A role-family or other-level source is context, not a matching salary quote. `;
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
 renderAutomaticJobs(selected,role,grade);
 const stamp=georgiaFeed.generatedAt?'Georgia feed: '+showDate(georgiaFeed.generatedAt):'Georgia feed not published';
 const scopeCaveat=[];
 if(!selected.length)scopeCaveat.push('Select one or more markets to display salary evidence.');
 else{
  scopeCaveat.push('Historical survey figures are reference information, not current salary offers or employer-total-cost estimates.');
  if(selected.includes('armenia'))scopeCaveat.push('Armenia: available ITA Jobs figures are NET; some records belong to Senior or other positions.');
  if(selected.includes('georgia'))scopeCaveat.push('Georgia: Fairpay samples are small and do not state NET/GROSS; the separate vacancy feed is blocked by source access restrictions.');
  if(selected.includes('slovakia'))scopeCaveat.push('Slovakia: the Platy.sk DevOps figures are GROSS and include all seniority levels.');
  if(selected.some(c=>!['armenia','georgia','slovakia'].includes(c)))scopeCaveat.push('Some selected markets have no verified salary records for this role and level; no amount is inferred.');
  scopeCaveat.push('Displayed currency is standardized only when a Frankfurter FX rate is available (rate date is shown); source values remain unchanged. Different pay bases and grades cannot be directly compared. The manual Internal rate is separate and never uploaded.');
 }
 set('m-interpretation', 'Interpretation: '+scopeCaveat.join(' '));
 const shownFeed=georgiaSelected?' · '+stamp:'';
 const relevantErrors=marketError.filter(x=>georgiaSelected||!x.toLowerCase().includes('georgia'));
 set('m-fetchstatus',marketBusy?'Loading site data…':`Public source snapshots: ${reference.length}${shownFeed} · FX ${fxDate||'unavailable'}${relevantErrors.length?' · '+relevantErrors.join('; '):''}`);
 const lines=[`HireOrGrow v0.9.8 · ${MARKET_ROLES[role]} · level ${grade}`,`Markets: ${selected.map(c=>MARKETS[c].name).join(', ')}`,
 `Report created: ${new Date().toISOString().slice(0,10)}`,`Displayed currency: ${el('m-reportcur').value} · Frankfurter FX ${fxDate||'unavailable'}`,`Internal rate: ${raw===null?'Not entered':formatMoney(raw,internalcur)+'/year (manual, fictional)'}`,summary];
 for(const r of reference){const cv=marketConversion(r);lines.push(`${MARKETS[r.country].name}: ${cv.convertedRange} per ${r.period} [${cv.conversionNote}], source original ${cv.original} ${r.currency} per ${r.period}, ${r.basis}, grade ${r.grade}, scope ${r.roleScope||'exact'}, n=${r.sample||'unknown'}, ${r.source}, checked ${r.checkedDate}, updated ${r.publishedDate||'not specified'}, ${r.url}`)}
 if(georgiaSelected)lines.push(`Georgia legacy feed: ${stamp}; ${georgiaFeed.sourceUrl||''}`);
 for(const j of (automated.vacancyRecords||[]).filter(j=>selected.includes(j.country)&&j.role===role).slice(0,30)){lines.push(`Employer salary-posted vacancy (${j.country}): ${j.salaryText} · ${j.title} · index date ${j.observedDate||showDate(j.fetchedAt)} · ${j.url}`)}
 lines.push(`Disclaimer: Not an employer-total-cost estimate, not an automated HR recommendation. Do not use NDA data.`);
 marketReport=lines.join('\n');
}
async function loadMarkets(){
 const run=++lastLoad;marketBusy=true;marketError=[];renderMarket();
 const tasks=await Promise.allSettled([fetchData(SOURCE_FILES.refs),fetchData(SOURCE_FILES.jobs),fetchData(SOURCE_FILES.auto),fetchData(SOURCE_FILES.history),updateFx()]);
 if(run!==lastLoad)return;
 if(tasks[0].status==='fulfilled'&&Array.isArray(tasks[0].value.records)){referenceRecords=tasks[0].value.records;referenceLoaded=true;}
 else{referenceRecords=[];referenceLoaded=false;marketError.push('Salary reference file unavailable')}
 if(tasks[1].status==='fulfilled'&&tasks[1].value&&typeof tasks[1].value.roles==='object'){georgiaFeed=tasks[1].value;}
 else{georgiaFeed={status:'unavailable',roles:{}};marketError.push('Georgia job feed file unavailable')}
 if(tasks[2].status==='fulfilled'&&tasks[2].value&&Array.isArray(tasks[2].value.salaryRecords)&&Array.isArray(tasks[2].value.vacancyRecords)){automated=tasks[2].value;}
 else{automated={providers:{},salaryRecords:[],vacancyRecords:[],generatedAt:null};marketError.push('Automated source snapshot unavailable')}
 if(tasks[3].status==='fulfilled'&&tasks[3].value&&Array.isArray(tasks[3].value.observations)){rateHistory=tasks[3].value;}
 else{rateHistory={observations:[],lastCheckedAt:null};marketError.push('Rate history unavailable')}
 marketBusy=false;renderMarket();
 if(typeof refreshFinancialBenchmark==='function')refreshFinancialBenchmark();
}
function setMarketPreset(type){
 const wanted=new Set(marketPresets[type]||[]);
 if(type==='clear')wanted.clear();
 document.querySelectorAll('.m-country').forEach(x=>{x.checked=wanted.has(x.value)});
 document.querySelectorAll('[data-preset]').forEach(b=>{const yes=b.dataset.preset===type;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes))});
 renderMarket();
}
for(const b of document.querySelectorAll('[data-preset]'))b.addEventListener('click',()=>setMarketPreset(b.dataset.preset));
for(const c of document.querySelectorAll('.m-country'))c.addEventListener('change',()=>{document.querySelectorAll('[data-preset]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')});renderMarket()});
for(const id of ['m-role','m-grade','m-reportcur','m-burden','m-historical','m-home','m-history-cur','m-rate-basis','m-rate-type'])el(id).addEventListener('input',()=>{
 if(id==='m-grade'){el('decision-grade').value=el('m-grade').value;if(typeof refreshFinancialBenchmark==='function')refreshFinancialBenchmark()}
 renderMarket();
});
el('m-refresh').addEventListener('click',loadMarkets);
el('tab-market').addEventListener('click',()=>{if(!marketOpened){marketOpened=true;loadMarkets()}});
el('m-copy').onclick=()=>copy(marketReport);
renderMarket();

// The reference section is the default landing view; load its public datasets now.
marketOpened=true;
loadMarkets();
