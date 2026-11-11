import fs from "fs"; const RPC="https://base-rpc.publicnode.com"; let id=0;
const rpc=(m,p)=>fetch(RPC,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:++id,method:m,params:p})}).then(r=>r.json()).then(r=>r.result);
const w=JSON.parse(fs.readFileSync("whales.json")); const all=w.ranked;
const res=[]; for(const x of all){ const [code,n]=await Promise.all([rpc("eth_getCode",[x.a,"latest"]),rpc("eth_getTransactionCount",[x.a,"latest"])]); const nonce=parseInt(n,16);
 let kind; if(code==="0x"||code?.startsWith("0xef0100")) kind= nonce>5000?"bot-EOA":"human-EOA"; else kind=(code.length-2)/2<1000?"proxy/smart-wallet":"contract";
 res.push({...x,kind,nonce}); }
const g={}; for(const r of res){ g[r.kind]??={n:0,gross:0,small:0}; g[r.kind].n++; g[r.kind].gross+=r.gross; if(r.gross<1000) g[r.kind].small++; }
const tot=res.reduce((s,r)=>s+r.gross,0); for(const [k,v] of Object.entries(g)) console.log(k.padEnd(20),"addrs",v.n,"share",(100*v.gross/tot).toFixed(1)+"%","under$1K",v.small);
const hum=res.filter(r=>r.kind!="bot-EOA"&&r.kind!="contract"); const tk={}; for(const r of hum) for(const [t,v] of Object.entries(r.toks)) tk[t]=(tk[t]||0)+1;
console.log("tickers among human/smart-wallet addrs:",JSON.stringify(Object.entries(tk).sort((a,b)=>b[1]-a[1])));
const med=a=>{a=[...a].sort((x,y)=>x-y);return a[Math.floor(a.length/2)]}; console.log("median gross human/sw:",Math.round(med(hum.map(r=>r.gross))), "n",hum.length, "buy-only",hum.filter(r=>r.sell<1).length);
console.log("human-EOA top:"); for(const r of res.filter(r=>r.kind=="human-EOA").slice(0,8)) console.log(r.a,"nonce",r.nonce,"gross",Math.round(r.gross),JSON.stringify(r.toks).slice(0,120));
