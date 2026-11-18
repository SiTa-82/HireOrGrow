'use strict';
// Live public-market preview: only the market module makes GET requests to allowlisted APIs.
// Manual internal salary/rate is NEVER added to request URLs, headers or bodies.
const el = id => document.getElementById(id);
const n = id => { const v = Number(el(id).value); return Number.isFinite(v) && v >= 0 ? v : 0; };
const currency = () => el('currency').value;
const money = value => new Intl.NumberFormat('en-US', {style:'currency',currency:currency(),maximumFractionDigits:0}).format(value);
const amount = (value, cur) => { try { return new Intl.NumberFormat('en-US',{style:'currency',currency:cur,maximumFractionDigits:0}).format(value); } catch (_) {return Math.round(value).toLocaleString('en-US')+' '+cur;} };
const set = (id, value) => { el(id).textContent = String(value); };
const pct = (x,max) => (max > 0 ? Math.max(0,Math.min(100,100*x/max)) : 0)+'%';
const safe = value => String(value).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MARKETS = {
  'armenia': {name:'Armenia',region:'other'},'georgia':{name:'Georgia',region:'other'},
  'portugal':{name:'Portugal',region:'eu'},'kazakhstan':{name:'Kazakhstan',region:'other'},
  'finland':{name:'Finland',region:'eu'},'slovakia':{name:'Slovakia',region:'eu'},
  'germany':{name:'Germany',region:'eu'},'netherlands':{name:'Netherlands',region:'eu'},
  'poland':{name:'Poland',region:'eu'},'spain':{name:'Spain',region:'eu'},
  'greece':{name:'Greece',region:'eu'},'united-states':{name:'United States',region:'us'},
  'united-kingdom':{name:'United Kingdom',region:'other'},
  'singapore':{name:'Singapore',region:'other'},'india':{name:'India',region:'other'}
};
const scopeNames = {'eu':'European Union (EU)','global':'Global / cross-border','united-states':'United States (US)'};
const selectedScope = () => scopeNames[el('scenario-location').value] || MARKETS[el('scenario-location').value]?.name || 'Selected market';
function updateScenarioLocation(){
  const loc=selectedScope();
  document.querySelectorAll('.scenario-context').forEach(node => node.textContent = `Selected location: ${loc} · Costs are entered manually. No local taxes or FX conversion are applied.`);
  calculateHire(); calculateReplace(); calculateTalent();
}
let hireReport='',replacementReport='',talentReport='',marketReport='';
function calculateHire(){
  const external=n('he-recruit')+n('he-onboard')+n('he-vacancy')+n('he-ramp');
  const internal=n('hi-recruit')+n('hi-onboard')+n('hi-vacancy')+n('hi-ramp')+n('hi-backfill');
  const diff=Math.abs(external-internal);
  const winner=external===internal?'Both options':external<internal?'External hire':'Internal transfer';
  set('hire-external',money(external));set('hire-internal',money(internal));
  set('he-value',money(external));set('hi-value',money(internal));set('hire-delta',money(diff));
  set('hire-take',external===internal?'Equal one-off costs':`${winner} has ${money(diff)} lower one-off costs`);
  const max=Math.max(external,internal,1);el('he-bar').style.width=pct(external,max);el('hi-bar').style.width=pct(internal,max);
  const role=el('role').value.trim()||'unspecified role';
  const narrative=`For ${role} in ${selectedScope()}, one-off economic costs are ${money(external)} for external hiring and ${money(internal)} for an internal transfer. `+
   (external===internal?'Both scenarios have the same modeled cost.':`${winner} has ${money(diff)} lower modeled cost.`)+
   ` Time to start: external ${n('he-days')} days, internal ${n('hi-days')} days. Lead time is contextual and not charged again. Backfilling the internal candidate’s prior role is estimated at ${money(n('hi-backfill'))}. Annual salary and candidate readiness require separate analysis.`;
  set('hire-summary',narrative);
  hireReport='TalentCost — Cost to Fill\n'+narrative+'\nAssumptions entered by the user; this is not a hiring recommendation.';
}
function calculateReplace(){
  const months=n('r-months'),vacancy=Math.min(n('r-empty'),months);
  const retain=(n('r-pay')+n('r-raise'))*months/12+n('r-train');
  const salary=n('r-newpay')*(months-vacancy)/12;
  const cash=salary+n('r-recruit')+n('r-exit')+n('r-onboard');
  const loss=n('r-vacancy')+n('r-ramp');
  const replace=cash+loss,diff=replace-retain;
  [['r-keep',retain],['r-replace',replace],['r-keep-v',retain],['r-repl-v',replace],['r-delta',Math.abs(diff)],['r-loss',loss]].forEach(([id,x])=>set(id,money(x)));
  set('r-cash',(cash-retain<0?'−':'+')+money(Math.abs(cash-retain)));
  set('r-title',diff===0?'Equal modeled economic costs':diff>0?'Replacement costs more':'Replacement costs less');
  set('r-summary',`${months}-month horizon · ${money(Math.abs(diff))} difference`);
  const max=Math.max(retain,replace,1);el('r-keepbar').style.width=pct(retain,max);el('r-replacebar').style.width=pct(replace,max);
  const role=el('r-role').value.trim()||'unspecified role';
  const narrative=`Over ${months} months for ${role} in ${selectedScope()}, retaining costs ${money(retain)}, while replacing costs ${money(replace)}. `+
    (diff===0?'Both are modeled at the same cost.':`Replacement is ${money(Math.abs(diff))} ${diff>0?'more':'less'} expensive.`)+
    ` Replacement includes ${money(salary)} of salary after ${vacancy} vacant months, ${money(n('r-recruit'))} recruitment, ${money(n('r-exit'))} severance, ${money(n('r-onboard'))} onboarding, and ${money(loss)} estimated productivity losses. Replacement cash outlay is ${money(cash)}. Finance must validate assumptions; assess legal and workforce implications separately.`;
  set('r-narrative',narrative);
  replacementReport='TalentCost — Retain vs. Replace\n'+narrative+'\nScenario calculation only. Not an employee termination recommendation.';
}
function calculateTalent(){
 const months=n('t-horizon'),active=d=>Math.max(0,months-Math.min(months,d));
 const extPay=n('t-e-new')*active(n('t-e-delay'))/12;
 const extOther=n('t-e-recruit')+n('t-e-onboard'),extLoss=n('t-e-vacancy')+n('t-e-ramp');
 const promPay=(n('t-p-new')-n('t-p-old')+n('t-p-backfill'))*active(n('t-p-delay'))/12;
 const promOther=n('t-p-admin')+n('t-p-train')+(n('t-p-backfill')>0?n('t-p-backfill-one'):0);
 const promLoss=n('t-p-loss')+n('t-p-oldloss');
 const skillPay=(n('t-s-new')-n('t-s-old')+n('t-s-backfill'))*active(n('t-s-delay'))/12;
 const skillOther=n('t-s-train')+n('t-s-mentor')+(n('t-s-backfill')>0?n('t-s-backfill-one'):0);
 const skillLoss=n('t-s-learning-loss')+n('t-s-newloss')+n('t-s-oldloss');
 const rows=[{name:'External hire',short:'t-e',delay:n('t-e-delay'),pay:extPay,other:extOther,loss:extLoss},
             {name:'Promotion',short:'t-p',delay:n('t-p-delay'),pay:promPay,other:promOther,loss:promLoss},
             {name:'Reskilling',short:'t-s',delay:n('t-s-delay'),pay:skillPay,other:skillOther,loss:skillLoss}];
 rows.forEach(r=>r.total=r.pay+r.other+r.loss);
 const lowest=Math.min(...rows.map(r=>r.total));
 const winners=rows.filter(r=>Math.abs(r.total-lowest)<0.005).map(r=>r.name);
 rows.forEach(r=>{
   set(r.short+'-total',money(r.total));
   set(r.short+'-brief',`Ready in ${r.delay} months · cash cost ${money(r.pay+r.other)}`);
   el(r.short+'-card').classList.toggle('best',Math.abs(r.total-lowest)<.005);
 });
 set('t-min',money(lowest));
 set('t-winner',winners.length===1?'Lowest modeled cost: '+winners[0]:'Equal modeled costs: '+winners.join(' / '));
 el('t-breakdown').innerHTML=rows.map(r=>`<div class="sc-row"><span>${safe(r.name)}</span><b>${safe(money(r.pay))} payroll delta + ${safe(money(r.other))} direct costs + ${safe(money(r.loss))} estimated productivity loss</b></div>`).join('');
 const notReady=rows.some(r=>r.delay>=months)?' Caution: at least one option is not ready within the selected horizon; a zero future payroll line does not mean the role is filled.':'';
 const role=el('t-role').value.trim()||'unspecified role';
 const narrative=`For ${role} in ${selectedScope()} over ${months} months: external hire ${money(rows[0].total)}, promotion ${money(rows[1].total)}, reskilling ${money(rows[2].total)}. Cash costs and estimated productivity losses are shown separately. The lowest cost does not establish candidate readiness.${notReady}`;
 set('t-narrative',narrative);
 talentReport='TalentCost — Internal Talent scenarios\n'+narrative+'\n'+rows.map(r=>`${r.name}: ${money(r.total)}; incremental payroll incl. backfill ${money(r.pay)}; direct costs ${money(r.other)}; estimated losses ${money(r.loss)}`).join('\n')+'\nFinance approval required. Not an automated HR decision.';
}
function showTab(tab){
 for(const id of ['hire','replace','market','talent']){
  el(id).classList.toggle('hide',id!==tab);
  const button=el('tab-'+id);button.classList.toggle('active',id===tab);button.setAttribute('aria-selected',String(id===tab));
 }
}
for(const id of ['hire','replace','market','talent']) el('tab-'+id).addEventListener('click',()=>showTab(id));
async function copy(text){
  try{
    if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(text);alert('Report copied.');return;}
    const area=document.createElement('textarea');area.value=text;document.body.appendChild(area);area.select();
    const ok=document.execCommand('copy');area.remove();if(!ok)throw Error('Copy unavailable');alert('Report copied.');
  }catch(_){alert('Could not copy the text. Try Print / PDF instead.');}
}
el('copy-hire').onclick=()=>copy(hireReport);el('copy-replace').onclick=()=>copy(replacementReport);
el('t-copy').onclick=()=>copy(talentReport);el('m-copy').onclick=()=>copy(marketReport);
for(const id of ['print-hire','print-replace','t-print','m-print']) el(id).onclick=()=>window.print();
document.querySelectorAll('#hire input,#hire select').forEach(node=>node.addEventListener('input',calculateHire));
document.querySelectorAll('#replace input,#replace select').forEach(node=>node.addEventListener('input',calculateReplace));
document.querySelectorAll('#talent input,#talent select').forEach(node=>node.addEventListener('input',calculateTalent));
el('currency').addEventListener('input',()=>{calculateHire();calculateReplace();calculateTalent();set('r-currency',currency());});
el('scenario-location').addEventListener('change',updateScenarioLocation);


/* Live market module: source attribution on every estimate, no stored employee data. */
const MARKET_ROLES = {
  'devops-engineer':'DevOps Engineer',
  'software-engineer':'Software Engineer',
  'cloud-architect':'Cloud Architect',
  'data-scientist':'Data Scientist',
  'site-reliability-engineer':'Site Reliability Engineer'
};
const salaryCache = new Map();
const CACHE_MS = 30 * 60 * 1000; // one page session only
let marketRecords = new Map();
let remoteJobs = [];
let fxRates = {USD:1};
let fxDate = null;
let marketStatus = {loading:false, errors:[], remote:'Not yet requested', salary:'Not yet requested', fx:'Not yet requested'};
let latestRun = 0;
let marketTimer = null;
let marketOpened = false;
const marketNames = {junior:'Junior',mid:'Mid-level',senior:'Senior'};
const chosenMarkets = () => Array.from(document.querySelectorAll('.m-country:checked')).map(c => c.value);
const allMarkets = Object.keys(MARKETS);
const marketPresets = {eu:allMarkets.filter(x=>MARKETS[x].region==='eu'),us:['united-states'],global:allMarkets};
const sourceAPI = (role,country) => 'https://salarybyrole.com/api/salary?'+new URLSearchParams({role,country});
function linkHTML(url,label){
  // Reject URL schemes not on our explicitly permitted providers.
  let u; try {u=new URL(url);} catch(_) {return safe(label);}
  if(u.protocol!=='https:' || !['salarybyrole.com','jobicy.com','frankfurter.dev'].includes(u.hostname)) return safe(label);
  return `<a href="${safe(u.href)}" target="_blank" rel="noopener noreferrer">${safe(label)} ↗</a>`;
}
function formatDate(value){
  if(!value)return 'Not supplied';
  const d=new Date(value);
  return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):'Not supplied';
}
function unitRate(){
  const x=el('m-historical').value.trim();
  if(x==='')return null;
  const raw=Number(x);
  if(!Number.isFinite(raw)||raw<0)return null;
  const mult=({annual:1,monthly:12,hourly:2080})[el('m-rate-basis').value]||1;
  return raw*mult;
}
function rateConvert(val,from,to){
  if(from===to)return val;
  if(!Number.isFinite(fxRates[from]) || !Number.isFinite(fxRates[to]) || fxRates[from]<=0 || fxRates[to]<=0)return null;
  return val/fxRates[from]*fxRates[to];
}
async function getJSON(url,timeout=9000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const response=await fetch(url,{signal:controller.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const json=await response.json();
    if(json?.success===false)throw new Error('Provider returned an error');
    return json;
  }finally{clearTimeout(timer);}
}
function parseSalary(record,role,country,grade){
  if(!record || typeof record!=='object' || !Array.isArray(record.salaries))return null;
  // Refuse mismatched provider responses; never substitute an unrelated occupation/country.
  if(record.role?.slug && record.role.slug!==role)return null;
  if(record.country?.slug && record.country.slug!==country)return null;
  const row=record.salaries.find(r=>String(r.experience_level||'').toLowerCase()===grade);
  if(!row)return null;
  const low=Number(row.min),mid=Number(row.median),high=Number(row.max);
  if(![low,mid,high].every(x=>Number.isFinite(x) && x>0) || !(low<=mid && mid<=high))return null;
  const curr=String(row.currency||record.country?.currency||'').toUpperCase();
  if(!/^[A-Z]{3}$/.test(curr))return null;
  return {country,role,grade,low,mid,high,currency:curr,year:row.year||null,
          generatedAt:record.generated_at||null,secondary:typeof row.source==='string'?row.source:'Not disclosed',
          provider:'SalaryByRole',apiUrl:sourceAPI(role,country)};
}
async function getCountrySalary(role,country,grade,force){
  const key=role+'|'+country;
  const cached=salaryCache.get(key);
  const now=Date.now();
  if(!force && cached && now-cached.time<CACHE_MS){return parseSalary(cached.data,role,country,grade);}
  // Cache even negative results until refresh, so selecting multiple grades does not refetch.
  const json=await getJSON(sourceAPI(role,country));
  salaryCache.set(key,{time:Date.now(),data:json});
  return parseSalary(json,role,country,grade);
}
async function refreshFX(force=false){
  if(!force && fxDate)return;
  const rows=await getJSON('https://api.frankfurter.dev/v2/rates?base=usd');
  if(!Array.isArray(rows)||!rows.length)throw Error('No FX rates in provider response');
  const rates={USD:1};let date=null;
  for(const r of rows){
    const c=String(r.quote||'').toUpperCase(),n=Number(r.rate);
    if(/^[A-Z]{3}$/.test(c) && n>0 && Number.isFinite(n))rates[c]=n;
    if(!date && r.date)date=String(r.date).slice(0,10);
  }
  if(!rates.EUR)throw Error('Missing EUR exchange rate');
  fxRates=rates;fxDate=date||'Date not provided';
}
async function refreshRemote(role,force=false){
  const tag=MARKET_ROLES[role]||'Engineer';
  if(!force && remoteCache.has(tag) && Date.now()-remoteCache.get(tag).time<60*60*1000){
    remoteJobs=remoteCache.get(tag).jobs;return;
  }
  // Recent global remote jobs, never interpreted as country-level salaries.
  const endpoint='https://jobicy.com/api/jobs?'+new URLSearchParams({count:'100',tag});
  const payload=await getJSON(endpoint);
  if(!Array.isArray(payload.jobs))throw Error('Unexpected jobs response');
  const out=[];
  for(const j of payload.jobs){
    const low=Number(j.salaryMin),high=Number(j.salaryMax);
    if(!Number.isFinite(low)||!Number.isFinite(high)||low<=0||high<low)continue;
    const c=String(j.salaryCurrency||'').toUpperCase();
    if(!/^[A-Z]{3}$/.test(c))continue;
    const u=String(j.url||'');
    if(!/^https:\/\/(www\.)?jobicy\.com\//.test(u))continue;
    out.push({title:String(j.jobTitle||'Unspecified'),company:String(j.companyName||'Unspecified'),
     location:String(j.jobGeo||'Remote location not specified'),level:String(j.jobLevel||'Not stated'),
     period:String(j.salaryPeriod||'Not specified'),low,high,currency:c,url:u,date:formatDate(j.pubDate)});
  }
  remoteJobs=out.slice(0,8);
  remoteCache.set(tag,{time:Date.now(),jobs:remoteJobs});
}
const remoteCache=new Map();
function jobBox(){
  const node=el('m-jobicy-results');
  const signal=marketStatus.remote;
  if(signal.startsWith('Error')){
    node.innerHTML=`<p class="marketnote">${safe(signal)}. ${linkHTML('https://jobicy.com/jobs-rss-feed','Check source manually')}</p>`;
    set('m-jobicy-count','Jobicy · unavailable');return;
  }
  if(!remoteJobs.length){
    node.innerHTML='<p class="marketnote">No recent remote offers with disclosed salaries matched this search. This does not mean there are no job vacancies.</p>';
    set('m-jobicy-count','Jobicy · 0 disclosed salaries');return;
  }
  set('m-jobicy-count','Jobicy · '+remoteJobs.length+' salary-posted ads');
  node.innerHTML=remoteJobs.map(j=>{
    const period=/year|annual/i.test(j.period)?'/yr':/month/i.test(j.period)?'/mo':/hour/i.test(j.period)?'/hr':'('+safe(j.period)+')';
    return `<article class="remote-entry"><strong>${safe(j.title)}</strong><div class="crumb">${safe(j.company)} · ${safe(j.location)} · level: ${safe(j.level)}</div><div class="remote-pay">${safe(amount(j.low,j.currency))} – ${safe(amount(j.high,j.currency))} ${period}</div><div class="src">Source: ${linkHTML(j.url,'Jobicy job listing')} · Published: ${safe(j.date)} · Original currency: ${safe(j.currency)}</div></article>`;
  }).join('');
}
function renderMarket(){
  const role=el('m-role').value,grade=el('m-grade').value,countries=chosenMarkets(),curr=el('m-reportcur').value;
  const matches=countries.map(x=>marketRecords.get(x)).filter(Boolean);
  const internal=unitRate(),internalCur=el('m-history-cur').value,internalLoc=el('m-home').value;
  const overRaw=el('m-burden').value.trim(),over=overRaw===''?null:Math.max(0,Number(overRaw));
  const basis=el('m-rate-type').value;
  set('m-result-title',`${MARKET_ROLES[role]||'Position'} · ${marketNames[grade]||grade}`);
  set('m-context',`${countries.length} selected markets · ${matches.length} source-backed country results · values received from external APIs`);
  set('m-locations',countries.length);set('m-comparable',matches.length);
  set('m-rate-date',fxDate?`FX: Frankfurter · ${fxDate}`:'FX: unavailable');
  set('m-internal',internal===null?'Not entered':`${amount(internal,internalCur)}/year`);
  const estimate=matches.find(r=>r.country===internalLoc);
  let summary='Salary estimates are queried live from SalaryByRole; publication dates and source links appear on each card. '; 
  if(internal===null){summary+='Enter an optional manual Internal rate to compare against a selected country benchmark.';}
  else if(basis==='billing'){summary+='Internal rate is a billing rate and cannot be compared with employee pay; no salary gap is calculated.';}
  else if(!estimate){summary+='No matching external salary estimate for the Internal rate country and selected job level.';}
  else{
    const match=rateConvert(internal,internalCur,estimate.currency);
    if(match===null){summary+='FX unavailable for the Internal rate currency, so a percentage comparison cannot be calculated.';}
    else {const gap=(match/estimate.mid-1)*100;
      summary+=`Manual Internal rate ${amount(internal,internalCur)}/year is ${Math.abs(gap).toFixed(1)}% ${gap>=0?'above':'below'} the source-reported ${MARKETS[internalLoc].name} median ${amount(estimate.mid,estimate.currency)}/year. This is indicative only; pay basis and methodology may differ.`;
    }
  }
  set('m-ceo',summary);
  const cards=[];
  for(const key of countries){
    const r=marketRecords.get(key);
    if(!r){
      const reason=marketStatus.loading?'Loading public salary data…':(marketStatus.errors.find(x=>x.country===key)?.message||'No level-matched estimate returned by the provider.');
      cards.push(`<article class="benchmark snapshot"><div class="benchmark-top"><strong>${safe(MARKETS[key].name)}</strong><span class="flag uncertain">${marketStatus.loading?'Loading':'No source-backed range'}</span></div><p class="marketnote">${safe(reason)}</p><div class="src">Attempted source: ${linkHTML(sourceAPI(role,key),'SalaryByRole API')} · country: ${safe(key)} · level: ${safe(grade)}</div></article>`);
      continue;
    }
    const converted=rateConvert(r.mid,r.currency,curr),lowConverted=rateConvert(r.low,r.currency,curr),highConverted=rateConvert(r.high,r.currency,curr);
    const convertedText=converted===null?`<p class="marketnote">No FX for ${safe(r.currency)} → ${safe(curr)}; original units retained.</p>`:
      (r.currency!==curr?`<div class="subtext">Converted (Frankfurter ${safe(fxDate||'date not available')}): ${safe(amount(lowConverted,curr))} – ${safe(amount(highConverted,curr))}; median ${safe(amount(converted,curr))}.</div>`:'');
    const overhead=over===null||!Number.isFinite(over)?'':`<div class="subtext">Illustrative +${safe(over.toFixed(1))}% employer overhead (user assumption): ${safe(amount(r.low*(1+over/100),r.currency))} – ${safe(amount(r.high*(1+over/100),r.currency))}; not a verified country tax calculation.</div>`;
    const sourceLine=`Source: ${linkHTML(r.apiUrl,'SalaryByRole API data')} (CC BY 4.0) · ${linkHTML('https://salarybyrole.com/role/'+role,'Role benchmark page')}`;
    cards.push(`<article class="benchmark"><div class="benchmark-top"><div><strong>${safe(MARKETS[key].name)}</strong><div class="crumb">${safe(MARKET_ROLES[role])} · ${safe(marketNames[grade])} · annual salary estimate</div></div><span class="flag api">API · source-backed</span></div><div class="salary">${safe(amount(r.low,r.currency))} – ${safe(amount(r.high,r.currency))}</div><div class="medianline">Provider median: <b>${safe(amount(r.mid,r.currency))}/year</b></div>${convertedText}${overhead}<div class="sourcebox"><div class="src"><strong>${sourceLine}</strong></div><div class="src">Published data: ${safe(formatDate(r.generatedAt))} · Reference year: ${safe(r.year??'Not specified')} · Original currency: ${safe(r.currency)}</div><div class="src">Underlying sources listed by provider: ${safe(r.secondary)} (not independently verified)</div><p class="marketnote">This source does not conclusively establish whether the estimate represents gross base pay, total compensation, or an employer-loaded cost. Validate the salary definition before finance use.</p></div></article>`);
  }
  el('m-results').innerHTML=cards.join('') || '<p class="marketnote">Choose at least one location to retrieve country salary estimates.</p>';
  jobBox();
  const errorCount=marketStatus.errors.length;
  const status=marketStatus.loading?`Fetching salary estimates for ${countries.length} market(s) …`:
    `${matches.length}/${countries.length} countries with matching source data. Salary: ${marketStatus.salary}. FX: ${marketStatus.fx}. Remote postings: ${marketStatus.remote}. ${errorCount?`${errorCount} country request(s) unavailable.`:''}`;
  set('m-fetchstatus',status);
  const historyText=internal===null?'Not entered':`${amount(internal,internalCur)} per year (${basis}; manual only, not transmitted)`;
  const lines=[`TalentCost Global — ${MARKET_ROLES[role]}, ${marketNames[grade]}`,
    `Date of report: ${new Date().toISOString().slice(0,10)}`,
    `Markets: ${countries.map(c=>MARKETS[c].name).join(', ') || '(none)'}`,
    `Salary source: SalaryByRole public API, https://salarybyrole.com/data/api`,
    `FX: Frankfurter (https://frankfurter.dev), date: ${fxDate||'unavailable'}`,
    `Remote vacancies: Jobicy (https://jobicy.com/jobs-rss-feed), shown separately`,
    `Internal rate: ${historyText}`,summary];
  for(const key of countries){
    const r=marketRecords.get(key);
    if(!r){lines.push(`${MARKETS[key].name}: no matching source-backed data / unavailable; ${sourceAPI(role,key)}`);continue;}
    lines.push(`${MARKETS[key].name}: ${amount(r.low,r.currency)} – ${amount(r.high,r.currency)} / year; source median ${amount(r.mid,r.currency)}; SalaryByRole; provider data generated ${formatDate(r.generatedAt)}; reference year ${r.year||'unknown'}; underlying sources as reported by provider: ${r.secondary}; ${r.apiUrl}`);
  }
  for(const j of remoteJobs){lines.push(`Remote offer: ${j.title}, ${j.company}: ${amount(j.low,j.currency)} – ${amount(j.high,j.currency)} ${j.period}; location eligibility: ${j.location}; ${j.date}; ${j.url}`);}
  lines.push('DISCLAIMER: Salary basis not independently verified. Remote ads not used as local country salary. No client compensation data are sent to external API. Internal rate is demo-only.');
  marketReport=lines.join('\n');
}
async function refreshMarket(force=false){
  const run=++latestRun,role=el('m-role').value,grade=el('m-grade').value,countries=chosenMarkets();
  marketStatus={loading:true,errors:[],remote:'Loading',fx:'Loading',salary:'Loading'};
  marketRecords=new Map();remoteJobs=[];renderMarket();
  const items=await Promise.all(countries.map(async country=>{
    try{return {country,record:await getCountrySalary(role,country,grade,force)};}
    catch(e){return {country,error:e instanceof Error?e.message:'Unknown provider error'};}
  }));
  if(run!==latestRun)return;
  for(const item of items){if(item.record)marketRecords.set(item.country,item.record);
    if(item.error)marketStatus.errors.push({country:item.country,message:'Provider request failed ('+item.error+').' });}
  marketStatus.salary='SalaryByRole '+marketRecords.size+'/'+countries.length+' matched';
  // Secondary feeds should not erase primary salary results when unavailable.
  const extras=await Promise.allSettled([refreshFX(force),refreshRemote(role,force)]);
  if(run!==latestRun)return;
  marketStatus.fx=extras[0].status==='fulfilled'?`Frankfurter ${fxDate}`:'Unavailable ('+String(extras[0].reason?.message||'network error')+')';
  marketStatus.remote=extras[1].status==='fulfilled'?'Jobicy loaded':'Error loading Jobicy ('+String(extras[1].reason?.message||'network error')+')';
  marketStatus.loading=false;
  renderMarket();
}
function scheduleMarketRefresh(){
  if(marketTimer!==null)clearTimeout(marketTimer);
  marketTimer=setTimeout(()=>{marketTimer=null;refreshMarket();},550);
}
function setMarketPreset(type){
  const chosen=type==='clear'?new Set():new Set(marketPresets[type]||[]);
  if(type!=='custom')document.querySelectorAll('.m-country').forEach(x=>{x.checked=chosen.has(x.value);});
  document.querySelectorAll('[data-preset]').forEach(b=>{
    const active=b.dataset.preset===type;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
  });
  scheduleMarketRefresh();
  renderMarket();
}
document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>setMarketPreset(b.dataset.preset)));
document.querySelectorAll('.m-country').forEach(x=>x.addEventListener('change',()=>setMarketPreset('custom')));
for(const id of ['m-role','m-grade'])el(id).addEventListener('change',scheduleMarketRefresh);
for(const id of ['m-historical','m-home','m-history-cur','m-rate-basis','m-rate-type','m-reportcur','m-burden']){
  el(id).addEventListener('input',renderMarket);
}
el('m-refresh').addEventListener('click',()=>refreshMarket(true));
el('tab-market').addEventListener('click',()=>{if(!marketOpened){marketOpened=true;refreshMarket();}});
updateScenarioLocation();set('r-currency',currency());renderMarket();
