import fs from "fs";
const UA=process.env.SEC_UA; if(!UA) throw new Error("set SEC_UA=\"Name email@example.com\" (SEC requires a contact)");
const ciks=JSON.parse(fs.readFileSync("ciks.json"));
const mids=await fetch("https://api.hyperliquid.xyz/info",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type:"allMids",dex:"xyz"})}).then(r=>r.json());
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// latest value of a concept (instant), from 10-K/10-Q
function latest(facts,ns,names,unit="USD"){ let best=null; for(const n of names){ const u=facts[ns]?.[n]?.units?.[unit]; if(!u) continue; for(const f of u){ if(!/10-[KQ]/.test(f.form||"")) continue; if(f.start) continue; if(!best||f.end>best.end||(f.end===best.end&&f.filed>best.filed)) best={...f,concept:n}; } } return best; }
function sumLatest(facts,ns,names){ // sum several concepts at the same end date
  const vals={}; let end=null; for(const n of names){ const v=latest(facts,ns,[n]); if(v){ vals[n]=v; if(!end||v.end>end) end=v.end; } }
  let s=0; const used=[]; for(const [n,v] of Object.entries(vals)) if(v.end===end){ s+=v.val; used.push(n); } return {val:s,end,used}; }
// trailing-4-quarter duration sum, fallback to latest 10-K annual
function ttm(facts,names){ let best=null; for(const n of names){ const u=facts["us-gaap"]?.[n]?.units?.USD; if(!u) continue; for(const f of u){ if(!(f.form==="10-K"&&f.start&&(new Date(f.end)-new Date(f.start))>300*864e5)) continue; if(!best||f.end>best.end||(f.end===best.end&&f.val>best.val)) best={val:f.val,end:f.end,concept:n}; } } return best; }
const out=[];
for(const [tk,cik] of Object.entries(ciks)){
  const r=await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${String(cik).padStart(10,"0")}.json`,{headers:{"user-agent":UA}}); await sleep(250);
  if(!r.ok){ out.push({tk,err:r.status}); continue; }
  const facts=(await r.json()).facts;
  // shares: sum classes at latest date
  const sh=facts.dei?.EntityCommonStockSharesOutstanding?.units?.shares||[]; const lastEnd=sh.reduce((m,f)=>f.end>m?f.end:m,""); const lastFiled=sh.filter(f=>f.end===lastEnd).reduce((m,f)=>f.filed>m?f.filed:m,""); const shares=sh.filter(f=>f.end===lastEnd&&f.filed===lastFiled).reduce((s,f)=>s+f.val,0);
  let shares2=shares; if(!shares2){ const w=facts["us-gaap"]?.WeightedAverageNumberOfDilutedSharesOutstanding?.units?.shares||[]; const q=w.filter(f=>/10-[KQ]/.test(f.form)).sort((a,b)=>a.end<b.end?1:a.end>b.end?-1:(a.filed<b.filed?1:-1))[0]; shares2=q?.val||0; }
  const price=+mids["xyz:"+tk]; const mcap=shares2*price;
  const debt=sumLatest(facts,"us-gaap",["LongTermDebtNoncurrent","LongTermDebtCurrent","ShortTermBorrowings","CommercialPaper","DebtCurrent","LongTermDebt"].slice(0,5));
  let debtVal=debt.val; if(!debtVal){ const d=latest(facts,"us-gaap",["LongTermDebt","DebtInstrumentCarryingAmount","ConvertibleNotesPayable","LongTermDebtFairValue"]); debtVal=d?.val||0; }
  const cash=sumLatest(facts,"us-gaap",["CashAndCashEquivalentsAtCarryingValue","ShortTermInvestments","MarketableSecuritiesCurrent","AvailableForSaleSecuritiesDebtSecuritiesCurrent"]);
  const rev=ttm(facts,["Revenues","RevenueFromContractWithCustomerExcludingAssessedTax","RevenueFromContractWithCustomerIncludingAssessedTax","SalesRevenueNet"]);
  const intInc=ttm(facts,["InvestmentIncomeInterest","InterestIncomeOther","InvestmentIncomeInterestAndDividend","InterestAndOtherIncome","InterestIncomeOperating"]);
  const o={tk,price,shares:shares2,mcapB:+(mcap/1e9).toFixed(1),debtB:+(debtVal/1e9).toFixed(2),cashB:+(cash.val/1e9).toFixed(2),revB:rev?+(rev.val/1e9).toFixed(2):null,intB:intInc?+(intInc.val/1e9).toFixed(3):null,
    debtPct:+(100*debtVal/mcap).toFixed(2),cashPct:+(100*cash.val/mcap).toFixed(2),intPct:rev&&intInc?+(100*intInc.val/rev.val).toFixed(2):null,asOf:cash.end};
  out.push(o); console.log(JSON.stringify(o));
}
fs.writeFileSync("halal.json",JSON.stringify(out,null,1));
