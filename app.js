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
   const summary=tied?'Equal lowest modeled costs':`${winners[0].name} · ${money(best)}`;
   const next= !tied && Number.isFinite(second)?`${money(Math.max(0,second-best))} below next alternative`:'No cost difference';
   const bars=options.map(o=>{
      const isLowest=Math.abs(o.cost-best)<.005;
      const width=Math.max(0,Math.min(100,100*Math.max(o.cost,0)/maxVal));
      const detail=o.detail?`<span class="decision-bar-detail">${safe(o.detail)}</span>`:'';
      return `<div class="decision-bar-row" title="${safe(o.name)}: ${safe(money(o.cost))}">
       <div class="decision-bar-label"><span>${safe(o.name)}${detail}</span><strong>${safe(money(o.cost))}</strong></div>
       <div class="decision-bar-track"><div class="decision-bar-fill ${isLowest?'lowest':''}" style="width:${width.toFixed(2)}%"></div></div>
       ${isLowest?'<span class="decision-lowest-tag">Lowest modeled cost</span>':''}
      </div>`;
   }).join('');
   return `<article class="decision-chart-card" aria-label="${safe(group.title)} estimated costs">
    <div class="decision-chart-head"><div><h3>${safe(group.title)}</h3><p>${safe(group.basis)}</p></div></div>
    <div class="decision-chart-bars">${bars}</div>
    <div class="decision-chart-summary"><b>${safe(summary)}</b><small>${safe(next)}</small></div>
    <p class="decision-chart-note">${safe(group.note)}</p>
    <button class="decision-chart-edit" data-edit="${safe(key)}" type="button">Edit assumptions ↗</button>
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
  decisionModels.hire={key:'hire',title:'External vs. internal hire',basis:'One-off cost to fill a position',note:`Time to start: external ${n('he-days')}d / internal ${n('hi-days')}d. Compensation after hire is excluded.`,options:[{name:'External hire',cost:external,detail:`${n('he-days')} days`},{name:'Internal transfer',cost:internal,detail:`${n('hi-days')} days`}]};renderDecisionOverview();
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
  decisionModels.replace={key:'replace',title:'Retain vs. replace',basis:`Full modeled cost · ${months}-month horizon`,note:'Includes salary and estimated productivity loss. Does not establish grounds to terminate a person.',options:[{name:'Retain',cost:retain},{name:'Replace',cost:replace}]};renderDecisionOverview();
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
 decisionModels.talent={key:'talent',title:'Hire, promote or reskill',basis:`Incremental cost · ${months}-month horizon`,note:'Internal moves include backfill assumptions. Readiness and competence must be assessed separately.',options:rows.map(r=>({name:r.name,cost:r.total,detail:`${r.delay} mo to ready`}))};renderDecisionOverview();
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
el('currency').addEventListener('input',()=>{calculateHire();calculateReplace();calculateTalent();set('r-currency',currency());});
el('scenario-location').addEventListener('change',updateScenarioLocation);
el('decision-role').addEventListener('change',()=>syncDecisionRole(el('decision-role')));
el('m-role').addEventListener('change',()=>syncDecisionRole(el('m-role')));



updateScenarioLocation();
set('r-currency',currency());
syncDecisionRole(el('decision-role'));
showTab('decision');
