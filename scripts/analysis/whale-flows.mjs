import fs from "fs";
const RPC=process.env.RPC||"https://base-rpc.publicnode.com";
const m=JSON.parse(fs.readFileSync("market.json"));
const top=m.rows.filter(x=>x.liq>2e5||x.vol>1e6).slice(0,12);
const pools=new Set(m.rows.flatMap(x=>x.pools.map(p=>p.pair.toLowerCase())));
let id=0; async function rpc(method,params){ for(let k=0;k<5;k++){ try{ const r=await fetch(RPC,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:++id,method,params})}).then(r=>r.json()); if(r.error) throw new Error(JSON.stringify(r.error)); return r.result;}catch(e){ if(k==4) throw e; await new Promise(s=>setTimeout(s,800*(k+1)));} } }
const head=parseInt(await rpc("eth_blockNumber",[]),16);
const SPAN=+process.env.SPAN||43200, STEP=+process.env.STEP||5000;
const T="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const stats={}; const flows={}; let nlogs=0;
for(const tok of top){
  const dec=8, px=tok.price;
  for(let from=head-SPAN; from<=head; from+=STEP){
    const to=Math.min(head,from+STEP-1);
    let logs; try{ logs=await rpc("eth_getLogs",[{address:tok.addr,topics:[T],fromBlock:"0x"+from.toString(16),toBlock:"0x"+to.toString(16)}]); }catch(e){ console.error(tok.sym,from,String(e).slice(0,120)); continue; }
    nlogs+=logs.length;
    for(const l of logs){
      const a="0x"+l.topics[1].slice(26), b="0x"+l.topics[2].slice(26); const usd=Number(BigInt(l.data))/10**dec*px;
      if(pools.has(a)){ // buy: pool -> b
        flows[b]??={buy:0,sell:0,n:0,toks:{}}; flows[b].buy+=usd; flows[b].n++; flows[b].toks[tok.sym]=(flows[b].toks[tok.sym]||0)+usd; }
      if(pools.has(b)){ flows[a]??={buy:0,sell:0,n:0,toks:{}}; flows[a].sell+=usd; flows[a].n++; flows[a].toks[tok.sym]=(flows[a].toks[tok.sym]||0)+usd; }
    }
  }
  console.error("done",tok.sym,nlogs);
}
const ranked=Object.entries(flows).map(([a,f])=>({a,...f,gross:f.buy+f.sell})).sort((x,y)=>y.gross-x.gross);
const total=ranked.reduce((s,x)=>s+x.gross,0);
// classify top 40
for(const x of ranked.slice(0,40)){ const code=await rpc("eth_getCode",[x.a,"latest"]); x.kind= code==="0x"?"EOA": code.startsWith("0xef0100")?"EOA+7702":"contract("+((code.length-2)/2)+"B)"; x.txc=parseInt(await rpc("eth_getTransactionCount",[x.a,"latest"]),16);
  // holdings
  x.hold={}; for(const tok of top){ const bal=await rpc("eth_call",[{to:tok.addr,data:"0x70a08231"+x.a.slice(2).padStart(64,"0")},"latest"]); const v=Number(BigInt(bal))/1e8*tok.price; if(v>1) x.hold[tok.sym]=Math.round(v); } }
fs.writeFileSync("whales.json",JSON.stringify({head,SPAN,total,n:ranked.length,ranked:ranked.slice(0,200)},null,1));
console.log("addresses:",ranked.length,"gross$",total.toFixed(0),"logs",nlogs);
let cum=0; [1,5,10,20,50,100].forEach(k=>{ const s=ranked.slice(0,k).reduce((a,x)=>a+x.gross,0); console.log("top"+k, (100*s/total).toFixed(1)+"%");});
const buckets=[[0,100],[100,1e3],[1e3,1e4],[1e4,1e5],[1e5,1e9]]; for(const [lo,hi] of buckets){ const g=ranked.filter(x=>x.gross>=lo&&x.gross<hi); console.log(`addr gross ${lo}-${hi}:`,g.length); }
for(const x of ranked.slice(0,40)) console.log(x.a, x.kind.padEnd(16), "nonce",String(x.txc).padStart(7), "gross$",Math.round(x.gross).toString().padStart(9),"buy",Math.round(x.buy),"sell",Math.round(x.sell),"n",x.n, JSON.stringify(Object.fromEntries(Object.entries(x.toks).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>[k,Math.round(v)]))), "HOLD",JSON.stringify(x.hold));
