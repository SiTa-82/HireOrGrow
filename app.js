'use strict';
// Source-attributed local-market demo: salary references are served by this site.
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
  'armenia': {name:'Armenia',region:'other'},
  'georgia': {name:'Georgia',region:'other'},
  'slovakia': {name:'Slovakia',region:'eu'},
  'kazakhstan': {name:'Kazakhstan',region:'other'},
  'portugal': {name:'Portugal',region:'eu'},
  'finland': {name:'Finland',region:'eu'},
  'netherlands': {name:'Netherlands',region:'eu'},
  'united-states': {name:'United States',region:'us'},
  'india': {name:'India',region:'other'}
};
const scopeNames = {'eu':'European Union (EU)','global':'Global / cross-border','united-states':'United States (US)'};
const selectedScope = () => scopeNames[el('scenario-location').value] || MARKETS[el('scenario-location').value]?.name || 'Selected market';
function updateScenarioLocation(){
  const loc=selectedScope();
  document.querySelectorAll('.scenario-context').forEach(node => node.textContent = `Selected location: ${loc} · Costs are entered manually. No local taxes or FX conversion are applied.`);
  calculateHire(); calculateReplace(); calculateTalent();
}
let hireReport='',replacementReport='',talentReport='',marketReport='';
const decisionModels = {};
function renderDecisionOverview(){
 const root=el('decision-chart');if(!root)return;
 const groups=[decisionModels.hire,decisionModels.replace,decisionModels.talent].filter(Boolean);
 root.innerHTML=groups.map(group=>{
   const options=group.options;
   const best=Math.min(...options.map(o=>o.cost));
   const second=[...options].sort((a,b)=>a.cost-b.cost)[1]?.cost;
   const winners=options.filter(o=>Math.abs(o.cost-best)<.005);
   const tied=winners.length>1;
   const maxVal=Math.max(1,...options.map(o=>Math.max(0,o.cost)));
   const key=group.key;
   const costPeriod=group.key==='hire'?'One-Time Cost':group.key==='replace'?`${n('r-months')}-Month Total Cost`:`${n('t-horizon')}-Month Incremental Cost`;
   const perValue=group.key==='hire'?'one-time':group.key==='replace'?`${n('r-months')}-month total`:`${n('t-horizon')}-month incremental`;
   const summary=tied?'Equal Lowest Modeled Costs':`${winners[0].name} · ${money(best)}`;
   const next= !tied && Number.isFinite(second)?`${money(Math.max(0,second-best))} Below Next Alternative`:'No Cost Difference';
   // Each card uses exactly three aligned scenario slots. Missing scenarios and
   // unavailable lead times reserve space, rather than shifting the bars upward.
   const bars=Array.from({length:3},(_,index)=>{
      const o=options[index];
      if(!o)return '<div class="decision-bar-row decision-bar-row--empty" aria-hidden="true"></div>';
      const isLowest=Math.abs(o.cost-best)<.005;
      const width=Math.max(0,Math.min(100,100*Math.max(o.cost,0)/maxVal));
      return `<div class="decision-bar-row" title="${safe(o.name)}: ${safe(money(o.cost))}">
       <div class="decision-bar-label"><span>${safe(o.name)}</span><span class="decision-bar-money"><strong>${safe(money(o.cost))}</strong><small>${safe(perValue)}</small></span></div>
       <span class="decision-bar-detail${o.detail?'':' decision-bar-detail--empty'}">${o.detail?safe(o.detail):'&nbsp;'}</span>
       <div class="decision-bar-track"><div class="decision-bar-fill ${isLowest?'lowest':''}" style="width:${width.toFixed(2)}%"></div></div>
       ${isLowest?'<span class="decision-lowest-tag">Lowest Modeled Cost</span>':'<span class="decision-lowest-placeholder" aria-hidden="true">&nbsp;</span>'}
      </div>`;
   }).join('');
   return `<article class="decision-chart-card" aria-label="${safe(group.title)} estimated costs">
    <div class="decision-chart-head"><div><h3>${safe(group.title)}</h3><p>${safe(group.basis)}</p><span class="decision-period-pill">${safe(costPeriod)}</span></div></div>
    <div class="decision-chart-bars">${bars}</div>
    <div class="decision-chart-summary"><b>${safe(summary)}</b><small>${safe(next)}</small></div>
    <p class="decision-chart-note">${safe(group.note)}</p>
    <button class="decision-chart-edit" data-edit="${safe(key)}" type="button" aria-label="Edit Assumptions for ${safe(group.title)}"><span class="decision-edit-icon" aria-hidden="true">✎</span><span>Edit Assumptions</span><span class="decision-edit-arrow" aria-hidden="true">↗</span></button>
   </article>`;
 }).join('');
 root.querySelectorAll('[data-edit]').forEach(btn=>btn.addEventListener('click',()=>{
   const details=el(btn.dataset.edit+'-editor');
   details.open=true;details.scrollIntoView({behavior:'smooth',block:'start'});
 }));
}
function syncDecisionRole(source){
 const roleId=source.value;
 const roleText=source.selectedOptions[0]?.textContent.trim()||'DevOps Engineer';
 el('decision-role').value=roleId;
 el('m-role').value=roleId;
 ['role','r-role','t-role'].forEach(id=>{el(id).value=roleText;});
 calculateHire();calculateReplace();calculateTalent();
 if(typeof renderMarket==='function')renderMarket();
}


// v0.9.7: shared financial assumptions. Only a same-role/same-grade, annualized
// GROSS benchmark may auto-populate a market pay input. Otherwise keep explicit
// demo inputs or require a user-entered figure; never infer pay from NET or CTC.
const finManual={market:false,internal:false,raise:false,training:false};
let finSourceRecord=null;
const FIN_DEMO_INTERNAL=48000,FIN_RAISE_PERCENT=.087,FIN_US_TRAIN=1023;
// Keep salary and raise values in canonical ANNUAL units to prevent rounding
// drift when switching Monthly <-> Annual. The display unit is presentation only.
const finAnnualValues={market:null,internal:FIN_DEMO_INTERNAL,raise:FIN_DEMO_INTERNAL*FIN_RAISE_PERCENT};
function finPeriodFactor(){return el('fin-period').value==='monthly'?12:1;}
function fm(id){const raw=el(id)?.value;if(raw===''||raw===undefined)return null;const val=Number(raw);return Number.isFinite(val)&&val>=0?val:null;}
function annualFin(key){return finAnnualValues[key];}
function finField(id,valAnnual){
 const key=id.slice('fin-'.length);
 if(Object.prototype.hasOwnProperty.call(finAnnualValues,key))finAnnualValues[key]=Number.isFinite(valAnnual)?valAnnual:null;
 const isSalary=Object.prototype.hasOwnProperty.call(finAnnualValues,key);
 const displayed=Number.isFinite(valAnnual)?valAnnual/(isSalary?finPeriodFactor():1):null;
 // Visual rounding is not fed back into the underlying annual financial model.
 el(id).value=displayed===null?'':String(Math.round(displayed*100)/100);
}
function renderFinPeriod(){
 const unit=el('fin-period').value==='monthly'?'Month':'Year';
 set('fin-market-label',`Market Gross Rate / ${unit}`);
 set('fin-internal-label',`Internal Gross Rate / ${unit}`);
 set('fin-raise-label',`Promotion / Retention Raise / ${unit}`);
 set('fin-raise-note',finManual.raise?'Custom raise entered manually; shown per '+unit.toLowerCase()+'.':'Default: 8.7% of internal gross pay, shown per '+unit.toLowerCase()+' (Mercer US promotion survey).');
}
function switchFinPeriod(){
 renderFinPeriod();
 for(const key of Object.keys(finAnnualValues))finField('fin-'+key,finAnnualValues[key]);
 applyFinancialAssumptions();
}
function financialMarketCandidate(){
 const loc=el('scenario-location').value,grade=el('decision-grade').value,role=el('decision-role').value;
 if(!MARKETS[loc])return null;
 const all=[...(typeof referenceRecords!=='undefined'?referenceRecords:[]),...((typeof automated!=='undefined'&&automated.salaryRecords)||[])];
 const candidates=all.filter(r=>r.country===loc&&r.role===role&&r.grade===grade&&r.basis==='gross'&&r.roleScope==='exact'&&['year','month'].includes(r.period)&&Number(r.low)>0&&Number(r.high)>=Number(r.low));
 candidates.sort((a,b)=>(b.publishedDate||'').localeCompare(a.publishedDate||'')||Number(b.sample||0)-Number(a.sample||0));
 return candidates[0]||null;
}
function refreshFinancialBenchmark(opts={}){
 renderFinPeriod();
 if(opts.reset){Object.keys(finManual).forEach(k=>finManual[k]=false)}
 const cur=currency(),r=financialMarketCandidate();finSourceRecord=r;
 const marketAnnual=r?((r.median!==null&&r.median!==undefined?Number(r.median):(Number(r.low)+Number(r.high))/2)*(r.period==='month'?12:1)):null;
 const converted=r&&typeof convertMoney==='function'?convertMoney(marketAnnual,r.currency,cur):r&&r.currency===cur?marketAnnual:null;
 if(!finManual.market){finField('fin-market',converted)}
 let src=!r?'No same-role, same-level GROSS market reference. Enter a market rate manually.':
   converted===null?`Source: ${r.source}. FX unavailable for ${r.currency} → ${cur}; enter manually.`:
   `${r.source} · ${r.publishedDate||'date not supplied'} · ${r.median!==null&&r.median!==undefined?'source median':'range midpoint (not statistical mean)'} · original ${r.currency} / ${r.period}; ${r.period==='month'?'monthly source × 12 for annual cost model':el('fin-period').value==='monthly'?'annual source ÷ 12 for monthly display':'annual source unchanged'}. Gross only.`;
 if(finManual.market)src='Manually entered market rate (not source-verified). Original benchmark: '+src;
 set('fin-market-source',src);
 const reference=annualFin('market');
 if(!finManual.internal){finField('fin-internal',reference!==null?reference:FIN_DEMO_INTERNAL)}
 set('fin-internal-note',reference!==null&&!finManual.internal?'Default matches the verified market-rate input. Edit for your organization.':'Illustrative starting rate only; NOT a verified local average. Edit manually.');
 if(!finManual.raise){finField('fin-raise',(annualFin('internal')||0)*FIN_RAISE_PERCENT)}
 let trainingVal=cur==='USD'?FIN_US_TRAIN:typeof convertMoney==='function'?convertMoney(FIN_US_TRAIN,'USD',cur):null;
 if(!finManual.training){finField('fin-training',trainingVal)}
 set('fin-training-note',trainingVal===null&& !finManual.training?'USD training average cannot be converted: enter a budget manually.':
 `Indicative US average: $1,023 per learner (Training Magazine 2026), ${cur==='USD'?'no FX needed':'FX-converted if available'}. Not a reskilling quote.`);
 applyFinancialAssumptions();
}
function applyFinancialAssumptions(){
 const grossInternal=annualFin('internal'),grossMarket=annualFin('market'),raise=annualFin('raise'),training=fm('fin-training');
 const overhead=Math.max(0,Math.min(250,fm('fin-overhead')||0));
 const multiplier=1+overhead/100;
 // Existing models use estimated EMPLOYER expense, not pure salary. Since
 // we cannot know statutory levies, this remains a user-defined cost proxy.
 if(grossInternal!==null){
  el('r-pay').value=Math.round(grossInternal*multiplier);
  el('t-p-old').value=Math.round(grossInternal*multiplier);
  el('t-s-old').value=Math.round(grossInternal*multiplier);
 }
 if(grossMarket!==null){
  el('r-newpay').value=Math.round(grossMarket*multiplier);
  el('t-e-new').value=Math.round(grossMarket*multiplier);
 }
 if(raise!==null){
  el('r-raise').value=Math.round(raise*multiplier);
  if(grossInternal!==null){
   el('t-p-new').value=Math.round((grossInternal+raise)*multiplier);
   el('t-s-new').value=Math.round((grossInternal+raise)*multiplier);
  }
 }
 if(training!==null){
  el('r-train').value=Math.round(training);
  el('t-p-train').value=Math.round(training);
  el('t-s-train').value=Math.round(training);
  el('hi-onboard').value=Math.round(training);
 }
 const noted=grossMarket===null?'No verified market gross rate. External employer-cost inputs remain DEMO/manual until reviewed.':
  `Market employer-cost proxy: ${money(grossMarket*multiplier)} per year (gross salary ${money(grossMarket)} + ${overhead}% assumed overhead).`;
 set('fin-status',`${noted} Internal rate and promotion costs are user-adjustable. Illustrative US promotion default 8.7%; training default $1,023 per learner. No local taxes calculated. Edits update all three models; they are not hiring recommendations.`);
 calculateHire();calculateReplace();calculateTalent();
}

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
  const mr=annualFin('market'),ir=annualFin('internal'),inc=annualFin('raise')||0;
  const ov=1+(fm('fin-overhead')||0)/100;
  set('hire-payroll-12mo',mr!==null&&ir!==null?
   `Separate 12-month salary-inclusive projection (not included in the bars): external ${money(external+mr*ov)} vs. internal ${money(internal+(ir+inc)*ov)}. Assumes a full year of pay after start, so excludes vacancy timing; internal backfill remains in one-off costs. Validate with Finance.`:
   `Salary-inclusive comparison unavailable: no matched market gross pay. One-off bars remain valid for the manually entered transition assumptions.`);
  decisionModels.hire={key:'hire',title:'External vs. Internal Hire',basis:'One-Time Cost to Fill a Position',note:'Time to start shown in approximate months. Compensation after hire is excluded.',options:[{name:'External hire',cost:external,detail:`≈ ${(n('he-days')/30.44).toFixed(1)} months to start`},{name:'Internal transfer',cost:internal,detail:`≈ ${(n('hi-days')/30.44).toFixed(1)} months to start`}]};renderDecisionOverview();
  hireReport='HireOrGrow — Cost to Fill\n'+narrative+'\nAssumptions entered by the user; this is not a hiring recommendation.';
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
  decisionModels.replace={key:'replace',title:'Retain vs. Replace',basis:`Full Modeled Cost · ${months}-Month Horizon`,note:'Includes salary and estimated productivity loss. Does not establish grounds to terminate a person.',options:[{name:'Retain',cost:retain},{name:'Replace',cost:replace}]};renderDecisionOverview();
  replacementReport='HireOrGrow — Retain vs. Replace\n'+narrative+'\nScenario calculation only. Not an employee termination recommendation.';
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
 decisionModels.talent={key:'talent',title:'Hire, Promote, or Reskill',basis:`Incremental Cost · ${months}-Month Horizon`,note:'Internal moves include backfill assumptions. Readiness and competence must be assessed separately.',options:rows.map(r=>({name:r.name,cost:r.total,detail:`${r.delay.toFixed(1)} months to ready`}))};renderDecisionOverview();
 talentReport='HireOrGrow — Internal Talent scenarios\n'+narrative+'\n'+rows.map(r=>`${r.name}: ${money(r.total)}; incremental payroll incl. backfill ${money(r.pay)}; direct costs ${money(r.other)}; estimated losses ${money(r.loss)}`).join('\n')+'\nFinance approval required. Not an automated HR decision.';
}
function showTab(tab){
 const decision=tab==='decision';
 el('decision').classList.toggle('hide',!decision);
 el('market').classList.toggle('hide',decision);
 for(const id of ['decision','market']){
  const btn=el('tab-'+id);const active=id===tab;
  btn.classList.toggle('active',active);
  btn.setAttribute('aria-selected',String(active));
 }
}
for(const id of ['decision','market']) el('tab-'+id).addEventListener('click',()=>showTab(id));
async function copy(text){
  try{
    if(navigator.clipboard && window.isSecureContext){await navigator.clipboard.writeText(text);alert('Report copied.');return;}
    const area=document.createElement('textarea');area.value=text;document.body.appendChild(area);area.select();
    const ok=document.execCommand('copy');area.remove();if(!ok)throw Error('Copy unavailable');alert('Report copied.');
  }catch(_){alert('Could not copy the text. Try Print / PDF instead.');}
}
el('copy-hire').onclick=()=>copy(hireReport);el('copy-replace').onclick=()=>copy(replacementReport);
el('t-copy').onclick=()=>copy(talentReport);
for(const id of ['print-hire','print-replace','t-print','m-print']) el(id).onclick=()=>window.print();
document.querySelectorAll('#hire input,#hire select').forEach(node=>node.addEventListener('input',calculateHire));
document.querySelectorAll('#replace input,#replace select').forEach(node=>node.addEventListener('input',calculateReplace));
document.querySelectorAll('#talent input,#talent select').forEach(node=>node.addEventListener('input',calculateTalent));
el('currency').addEventListener('input',()=>{set('r-currency',currency());refreshFinancialBenchmark();});
el('decision-grade').addEventListener('change',()=>{el('m-grade').value=el('decision-grade').value;refreshFinancialBenchmark();if(typeof renderMarket==='function')renderMarket();});
for(const fld of ['market','internal','raise','training'])el('fin-'+fld).addEventListener('input',()=>{
  finManual[fld]=true;
  if(fld!=='training')finAnnualValues[fld]=fm('fin-'+fld)===null?null:fm('fin-'+fld)*finPeriodFactor();
  if(fld==='internal'&&!finManual.raise){finField('fin-raise',(annualFin('internal')||0)*FIN_RAISE_PERCENT)}
  if(fld==='raise')renderFinPeriod();
  applyFinancialAssumptions();
});
el('fin-period').addEventListener('change',switchFinPeriod);
el('fin-overhead').addEventListener('input',applyFinancialAssumptions);
el('fin-reset').addEventListener('click',()=>refreshFinancialBenchmark({reset:true}));
el('scenario-location').addEventListener('change',()=>{updateScenarioLocation();refreshFinancialBenchmark()});
el('decision-role').addEventListener('change',()=>{syncDecisionRole(el('decision-role'));refreshFinancialBenchmark()});
el('m-role').addEventListener('change',()=>{syncDecisionRole(el('m-role'));refreshFinancialBenchmark()});



updateScenarioLocation();
set('r-currency',currency());
syncDecisionRole(el('decision-role'));
refreshFinancialBenchmark();
showTab('decision');
