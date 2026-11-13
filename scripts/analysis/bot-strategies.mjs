import fs from "fs";
const RPC="https://base-rpc.publicnode.com"; let id=0;
async function rpc(m,p){for(let k=0;k<6;k++){try{const r=await fetch(RPC,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:++id,method:m,params:p})}).then(r=>r.json());if(r.error)throw new Error(r.error.message);return r.result}catch(e){if(k==5)throw e;await new Promise(s=>setTimeout(s,700*(k+1)))}}}
const m=JSON.parse(fs.readFileSync("market.json"));
const top=m.rows.filter(x=>x.liq>2e5||x.vol>1e6).slice(0,12);
const tokBy=Object.fromEntries(top.map(t=>[t.addr.toLowerCase(),t]));
const USDC="0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const T="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const pad=a=>"0x"+a.slice(2).toLowerCase().padStart(64,"0");
const addrs=process.argv.slice(2).map(a=>a.toLowerCase());
const headHex=await rpc("eth_blockNumber",[]); const head=parseInt(headHex,16);
const headTs=parseInt((await rpc("eth_getBlockByNumber",[headHex,false])).timestamp,16);
const SPAN=+process.env.SPAN||432000, STEP=+process.env.STEP||20000;
const oldTs=parseInt((await rpc("eth_getBlockByNumber",["0x"+(head-SPAN).toString(16),false])).timestamp,16); const BS=(headTs-oldTs)/SPAN;
const tsOf=b=>headTs-(head-b)*BS;
// HL candles
const hl={}; async function candles(sym){ if(hl[sym]) return hl[sym]; const coin="xyz:"+sym.replace(/c$/,""); const r=await fetch("https://api.hyperliquid.xyz/info",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type:"candleSnapshot",req:{coin,interval:"1m",startTime:(tsOf(head-SPAN)-600)*1000,endTime:headTs*1000}})}).then(r=>r.json()).catch(()=>[]); const mp=new Map(); for(const c of (Array.isArray(r)?r:[])) mp.set(Math.floor(c.t/60000),+c.c); return hl[sym]=mp; }
const fair=(mp,ts,off=0)=>{const k=Math.floor(ts/60)-off; for(let d=0;d<5;d++){ if(mp.has(k-d)) return mp.get(k-d);} return null};
const session=ts=>{const d=new Date(ts*1000); const h=d.getUTCHours()+d.getUTCMinutes()/60; const wd=d.getUTCDay(); if(wd==0||wd==6) return "weekend"; if(h>=14.5&&h<21) return "open"; if(h>=9&&h<14.5) return "pre"; if(h>=21&&h<24) return "post"; return "overnight";};
const report={};
for(const A of addrs){
  const legs=[]; const txs=new Map();
  for(let f=head-SPAN; f<=head; f+=STEP){ const to=Math.min(head,f+STEP-1); const fb="0x"+f.toString(16), tb="0x"+to.toString(16);
    for(const grp of [top.slice(0,6),top.slice(6)]) for(const topics of [[T,pad(A)],[T,null,pad(A)]]){ const logs=await rpc("eth_getLogs",[{address:grp.map(t=>t.addr),topics,fromBlock:fb,toBlock:tb}]); for(const l of logs){ txs.set(l.transactionHash,parseInt(l.blockNumber,16)); } } }
  const list=[...txs.entries()].slice(0,250);
  for(const [h,b] of list){ const rc=await rpc("eth_getTransactionReceipt",[h]); let usdc=0; const st={}; const lp=rc.logs.some(l=>["0x3067048b","0x26f6a048","0x0c396cd9","0x7a53080b"].includes(l.topics[0]?.slice(0,10))); if(lp){ legs.push({h,b,lp:true,other:true}); continue; }
    for(const l of rc.logs){ if(l.topics[0]!==T||l.topics.length!==3||!l.data||l.data==="0x") continue; const from="0x"+l.topics[1].slice(26), to="0x"+l.topics[2].slice(26); const ad=l.address.toLowerCase(); const v=BigInt(l.data);
      if(ad===USDC){ if(to===A) usdc+=Number(v)/1e6; if(from===A) usdc-=Number(v)/1e6; }
      else if(tokBy[ad]){ const s=tokBy[ad].sym; if(to===A) st[s]=(st[s]||0)+Number(v)/1e8; if(from===A) st[s]=(st[s]||0)-Number(v)/1e8; } }
    const syms=Object.entries(st).filter(([s,q])=>Math.abs(q)>1e-9);
    if(syms.length!==1||Math.abs(usdc)<0.5) { legs.push({h,b,ts:tsOf(b),other:true,usdc,st}); continue; }
    const [s,q]=syms[0]; legs.push({h,b,ts:tsOf(b),sym:s,q,usdc,px:Math.abs(usdc/q),side:q>0?"buy":"sell",from:rc.from.toLowerCase()===A});
  }
  // compare to fair
  const tr=legs.filter(l=>!l.other); const sess={}; const edges=[]; let follow=0,against=0,flat=0;
  for(const l of tr){ const mp=await candles(l.sym); const f=fair(mp,l.ts); sess[session(l.ts)]=(sess[session(l.ts)]||0)+1; if(!f) continue;
    const ratio=l.px/f; l.fair=f; l.ratio=ratio; }
  // normalise multiplier per sym via median ratio
  const bySym={}; for(const l of tr) if(l.ratio){(bySym[l.sym]??=[]).push(l.ratio)}; const med={}; for(const [s,a] of Object.entries(bySym)){a.sort((x,y)=>x-y); med[s]=a[Math.floor(a.length/2)];}
  for(const l of tr){ if(!l.ratio) continue; const fairAdj=l.fair; const edgeBps= l.side==="buy"? (1-l.ratio)*1e4 : (l.ratio-1)*1e4; l.edge=edgeBps; edges.push(edgeBps);
    const mp=hl[l.sym]; const p0=fair(mp,l.ts,3), p1=fair(mp,l.ts); if(p0&&p1){ const r=(p1-p0)/p0; if(Math.abs(r)<2e-4) flat++; else if((r>0&&l.side==="buy")||(r<0&&l.side==="sell")) follow++; else against++; } }
  edges.sort((a,b)=>a-b); const usdNet=tr.reduce((s,l)=>s+l.usdc,0); const vol=tr.reduce((s,l)=>s+Math.abs(l.usdc),0);
  const net={}; for(const l of tr) net[l.sym]=(net[l.sym]||0)+l.q; let invVal=0; for(const [s,q] of Object.entries(net)){ const p=top.find(t=>t.sym==s).price; invVal+=q*p; }
  const sizes=tr.map(l=>Math.abs(l.usdc)).sort((a,b)=>a-b);
  // holding: buys followed by sells same sym
  let holds=[]; const lastBuy={}; for(const l of [...tr].sort((a,b)=>a.ts-b.ts)){ if(l.side=="buy") lastBuy[l.sym]=l.ts; else if(lastBuy[l.sym]) {holds.push(l.ts-lastBuy[l.sym]); delete lastBuy[l.sym];} } holds.sort((a,b)=>a-b);
  const gaps=[...tr].sort((a,b)=>a.ts-b.ts).map((l,i,a)=>i?l.ts-a[i-1].ts:null).filter(x=>x!=null).sort((a,b)=>a-b);
  report[A]={txs:txs.size,analysed:list.length,trades:tr.length,multiLeg:legs.length-tr.length,lpTx:legs.filter(l=>l.lp).length,sentByAddr:tr.filter(l=>l.from).length,
    vol:Math.round(vol), cashPnL:Math.round(usdNet), invChange:Math.round(invVal), approxPnL:Math.round(usdNet+invVal), pnlBps: vol? Math.round((usdNet+invVal)/vol*1e4):0,
    edgeMedianBps: edges.length? Math.round(edges[Math.floor(edges.length/2)]):null, edgePosShare: edges.length? +(edges.filter(e=>e>0).length/edges.length).toFixed(2):null,
    followHL:follow, againstHL:against, flat, sessions:sess, sizeMedian: Math.round(sizes[Math.floor(sizes.length/2)]||0), holdMedianMin: holds.length? Math.round(holds[Math.floor(holds.length/2)]/60):null, gapMedianSec: gaps.length? gaps[Math.floor(gaps.length/2)]:null,
    syms:Object.keys(net)};
  console.log(A, JSON.stringify(report[A])); if(process.env.DUMP) for(const l of tr.slice(0,+process.env.DUMP)) console.log("  ",new Date(l.ts*1000).toISOString().slice(5,16),l.sym,l.side,Math.round(Math.abs(l.usdc)),"px",l.px?.toFixed(2),"fair",l.fair,"edge",Math.round(l.edge));
}
fs.writeFileSync("strat.json",JSON.stringify(report,null,1));
