const r = await fetch("https://api.coinbase.com/v1/tokenized-stocks?page_size=500").then(r=>r.json());
const list = r.tokenized_stocks || r.data || r.items || r;
const arr = Array.isArray(list)?list:Object.values(list).find(Array.isArray);
console.error("stocks:", arr.length, Object.keys(arr[0]));
const addrs = arr.map(s=>s.contract_address||s.address||s.token_address).filter(Boolean);
const out=[];
for (let i=0;i<addrs.length;i+=30){
  const ps = await fetch("https://api.dexscreener.com/tokens/v1/base/"+addrs.slice(i,i+30).join(",")).then(r=>r.json());
  for (const p of ps) out.push(p);
}
const by={};
for (const p of out){ const t=p.baseToken.symbol; if(!addrs.map(a=>a.toLowerCase()).includes(p.baseToken.address.toLowerCase())) continue;
  by[t] ??= {sym:t, addr:p.baseToken.address, liq:0, vol:0, txns:0, buys:0, sells:0, pools:[], price:+p.priceUsd, ch24:p.priceChange?.h24};
  const b=by[t]; b.liq+=p.liquidity?.usd||0; b.vol+=p.volume?.h24||0; b.buys+=p.txns?.h24?.buys||0; b.sells+=p.txns?.h24?.sells||0; b.txns+=(p.txns?.h24?.buys||0)+(p.txns?.h24?.sells||0);
  b.pools.push({pair:p.pairAddress, dex:p.dexId, quote:p.quoteToken.symbol, liq:p.liquidity?.usd||0, vol:p.volume?.h24||0});
}
const rows=Object.values(by).sort((a,b)=>b.vol-a.vol);
const fs=await import("fs"); fs.writeFileSync("market.json", JSON.stringify({ts:new Date().toISOString(), n:arr.length, rows, sample:arr[0]},null,1));
let L=0,V=0,T=0; for(const x of rows){L+=x.liq;V+=x.vol;T+=x.txns}
console.log("with pools:",rows.length,"liq",L.toFixed(0),"vol24",V.toFixed(0),"txns",T, ">100k liq:",rows.filter(x=>x.liq>1e5).length, ">1M:",rows.filter(x=>x.liq>1e6).length);
for(const x of rows.slice(0,25)) console.log(x.sym.padEnd(8), (x.liq/1e3).toFixed(0).padStart(6)+"K", (x.vol/1e6).toFixed(2).padStart(7)+"M", String(x.txns).padStart(6), "avg$"+(x.vol/Math.max(1,x.txns)).toFixed(0).padStart(5), "vol/liq "+(x.vol/Math.max(1,x.liq)).toFixed(1), "ch24 "+x.ch24, x.pools.length+"p");
