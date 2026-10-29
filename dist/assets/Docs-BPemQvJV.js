import{s as be,j as n,N as xe,h as B,I as E,d as A,r as b,C as _e,D as j,f as ge,u as ve,p as ye,a as Ee,T as ke,E as Pe}from"./index-DLud4m6G.js";const je=e=>e.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"section",Ae=/[\\`*_{}\[\]()#+\-.!|>:~<]/;function N(e,t=[]){const s=[],a=l=>{const r=s[s.length-1];r?.t==="text"?r.v+=l:l&&s.push({t:"text",v:l})};let o=0;for(;o<e.length;){const l=e[o];if(l==="\\"&&o+1<e.length&&Ae.test(e[o+1])){a(e[o+1]),o+=2;continue}if(l==="{"&&e.startsWith("{{",o)){const r=e.indexOf("}}",o+2);if(r<0){t.push(`an unclosed placeholder: "${e.slice(o,o+24)}"`),a(e.slice(o));break}s.push({t:"num",key:e.slice(o+2,r).trim()}),o=r+2;continue}if(l==="`"){let r=1;for(;e[o+r]==="`";)r++;const c="`".repeat(r),u=e.indexOf(c,o+r);if(u>0){let i=e.slice(o+r,u);i.startsWith(" ")&&i.endsWith(" ")&&i.trim()&&(i=i.slice(1,-1)),s.push({t:"code",c:Z(i,t)}),o=u+r;continue}a(c),o+=r;continue}if(l==="*"&&e[o+1]==="*"){const r=q(e,o+2,"**");if(r>0){s.push({t:"strong",c:N(e.slice(o+2,r),t)}),o=r+2;continue}}if((l==="*"||l==="_")&&e[o+1]!==l&&Le(e,o)){const r=q(e,o+1,l);if(r>0){s.push({t:"em",c:N(e.slice(o+1,r),t)}),o=r+1;continue}}if(l==="["){const r=Te(e,o);if(r>0&&e[r+1]==="("){const c=e.indexOf(")",r+2);if(c>0){s.push({t:"link",href:e.slice(r+2,c).trim(),c:N(e.slice(o+1,r),t)}),o=c+1;continue}}}a(l),o++}return s}function Z(e,t){const s=[];let a=0;for(;a<e.length;){const o=e.indexOf("{{",a);if(o<0)break;const l=e.indexOf("}}",o+2);if(l<0){t.push(`an unclosed placeholder: "${e.slice(o,o+24)}"`);break}o>a&&s.push({t:"text",v:e.slice(a,o)}),s.push({t:"num",key:e.slice(o+2,l).trim()}),a=l+2}return a<e.length&&s.push({t:"text",v:e.slice(a)}),s}const ee=e=>e===void 0||/\s/.test(e),te=e=>!!e&&/[\p{L}\p{N}]/u.test(e);function Le(e,t){return ee(e[t+1])?!1:e[t]==="*"||!te(e[t-1])}function q(e,t,s){let a=t;for(;a<e.length;){if(e[a]==="\\"){a+=2;continue}if(e[a]==="`"){const o=e.indexOf("`",a+1);if(o>0){a=o+1;continue}}if(e.startsWith(s,a)&&a>t&&!ee(e[a-1])){if(s==="*"&&e[a+1]==="*"){a+=2;continue}if(s==="_"&&te(e[a+1])){a++;continue}return a}a++}return-1}function Te(e,t){let s=0;for(let a=t;a<e.length;a++){if(e[a]==="\\"){a++;continue}if(e[a]==="["&&s++,e[a]==="]"&&--s===0)return a}return-1}const ae=/^```\s*([\w-]*)\s*$/,ne=/^(#{1,6})\s+(.*?)\s*#*\s*$/,oe=/^(?:-{3,}|\*{3,}|_{3,})\s*$/,S=/^:::\s*(.*?)\s*$/,D=/^>\s?/,P=/^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/,Ie=/^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/,se=(e,t)=>/^\s*\|/.test(e[t])&&t+1<e.length&&Ie.test(e[t+1].trim()),le=(e,t)=>{const s=e[t];return ae.test(s)||ne.test(s)||oe.test(s)||S.test(s)||D.test(s)||se(e,t)||P.test(s)&&P.exec(s)[1].length<2};function M(e){let t=e.trim();t.startsWith("|")&&(t=t.slice(1)),t.endsWith("|")&&!t.endsWith("\\|")&&(t=t.slice(0,-1));const s=[];let a="",o=!1;for(let l=0;l<t.length;l++)t[l]==="\\"&&t[l+1]==="|"?(a+="|",l++):t[l]==="`"?(o=!o,a+="`"):t[l]==="|"&&!o?(s.push(a.trim()),a=""):a+=t[l];return s.push(a.trim()),s}function R(e,t=o=>o,s=0,a=new Map){const o=e.replace(/\r\n?/g,`
`).replace(/<!--[\s\S]*?-->/g,h=>h.replace(/[^\n]/g,"")).split(`
`),l=[],r=[],c=(h,d)=>r.push(`line ${s+h+1}: ${d}`),u=(h,d)=>{const p=[],w=N(h,p);for(const m of p)c(d,m);return w};let i=0;for(;i<o.length;){const h=o[i];if(!h.trim()){i++;continue}let d;if(d=ae.exec(h)){const m=i++,x=[];for(;i<o.length&&!/^```\s*$/.test(o[i]);)x.push(o[i++]);i>=o.length&&c(m,"a code block (```) is never closed"),i++;const f=[];l.push({t:"pre",lang:d[1],c:Z(x.join(`
`),f)});for(const g of f)c(m,g);continue}if(d=ne.exec(h)){const m=d[1].length;let x=d[2],f="";const g=/\s*\{#([a-z0-9-]+)\}\s*$/.exec(x);g&&(f=g[1],x=x.slice(0,g.index)),m>4&&c(i,`a level-${m} heading: the docs use # to #### only`);const _=u(x,i);f||=je(y(_,t));const k=a.get(f)||0;a.set(f,k+1),k&&(f=`${f}-${k+1}`),l.push({t:"h",level:Math.min(m,4),id:f,c:_}),i++;continue}if(oe.test(h)){l.push({t:"hr"}),i++;continue}if(d=S.exec(h)){const[m,...x]=d[1].split(/\s+/),f=d[1].slice(m.length).trim();if(m==="diagram"){(!/^[a-z0-9-]+$/.test(f)||x.length!==1)&&c(i,`"::: diagram" needs one name in a-z, 0-9 and -: "${h.trim()}"`),l.push({t:"diagram",name:f,line:s+i+1}),i++;continue}if(m==="note"||m==="warn"||m==="builders"){const g=i++,_=[];for(;i<o.length&&!/^:::\s*$/.test(o[i]);)S.exec(o[i])?.[1]&&!/^diagram\b/.test(S.exec(o[i])[1])&&c(i,"a callout inside a callout: close the first with ::: before opening another"),_.push(o[i++]);i>=o.length&&c(g,`"::: ${m}" is never closed with a line of :::`),i++;const k=R(_.join(`
`),t,s+g+1,a);r.push(...k.errors),l.push({t:"callout",kind:m,title:f?u(f,g):void 0,c:k.blocks});continue}c(i,m?`an unknown block "::: ${m}" (use diagram, note, warn or builders)`:"a ::: that closes nothing"),i++;continue}if(D.test(h)){const m=i,x=[];for(;i<o.length&&D.test(o[i]);)x.push(o[i++].replace(D,""));const f=R(x.join(`
`),t,s+m,a);r.push(...f.errors),l.push({t:"quote",c:f.blocks});continue}if(se(o,i)){const m=M(h),x=M(o[i+1]).map(_=>_.endsWith(":")?_.startsWith(":")?"c":"r":"l");x.length!==m.length&&c(i,"the table's --- line has a different number of columns from its head");const f=i;i+=2;const g=[];for(;i<o.length&&/^\s*\|/.test(o[i]);){const _=M(o[i]);_.length!==m.length&&c(i,`a table row with ${_.length} cells under a head of ${m.length}`),g.push(_.map(k=>u(k,i))),i++}l.push({t:"table",align:x,head:m.map(_=>u(_,f)),rows:g});continue}if((d=P.exec(h))&&d[1].length<2){const m=Ce(o,i,u,c);l.push(m.list),i=m.next;continue}const p=i,w=[];for(;i<o.length&&o[i].trim()&&(i===p||!le(o,i));)w.push(o[i++].trim());l.push({t:"p",c:u(w.join(" "),p)})}return{blocks:l,errors:r}}const I=e=>/\d/.test(e);function Ce(e,t,s,a){const o=P.exec(e[t]),l={t:"list",ordered:I(o[2]),start:parseInt(o[2])||1,items:[]};let r=t,c=-1,u;const i=[],h=()=>{u&&i.push(u),u=void 0};for(;r<e.length;){const d=e[r];if(!d.trim()){let w=r+1;for(;w<e.length&&!e[w].trim();)w++;const m=w<e.length?P.exec(e[w]):null;if(m&&(m[1].length>=2?l.items.length>0:I(m[2])===l.ordered)){r=w;continue}break}const p=P.exec(d);if(p&&p[1].length<2){if(I(p[2])!==l.ordered)break;h();const w={c:[]};l.items.push(w),u={item:w,parts:[p[3]],line:r},c=-1,r++;continue}if(p&&l.items.length){const w=l.items[l.items.length-1];c<0&&(c=p[1].length),p[1].length>c+1&&a(r,"a list nested more than one level: the docs nest lists one level only"),w.sub||(w.sub={t:"list",ordered:I(p[2]),start:parseInt(p[2])||1,items:[]}),h();const m={c:[]};w.sub.items.push(m),u={item:m,parts:[p[3]],line:r},r++;continue}if(p||le(e,r))break;u&&u.parts.push(d.trim()),r++}h();for(const d of i)d.item.c=s(d.parts.join(" "),d.line);return{list:l,next:r}}function y(e,t=s=>s){return e.map(s=>s.t==="text"?s.v:s.t==="num"?t(s.key)??s.key:y(s.c,t)).join("")}const Ne=(e,t)=>e.filter(s=>s.t==="h"&&(s.level===2||s.level===3)).map(s=>({id:s.id,level:s.level,text:y(s.c,t)}));function re(e){const t=/^(?:\.\/)?(\d\d)-([a-z0-9-]+)\.md(?:#([a-z0-9-]+))?$/.exec(e);return t?`#/docs/${t[2]}${t[3]?`/${t[3]}`:""}`:e}function G(e,t=18){const s=e<0n,a=s?-e:e,o=10n**BigInt(t),l=(a/o).toLocaleString("en-US"),r=(a%o).toString().padStart(t,"0").replace(/0+$/,"");return(s?"−":"")+l+(r?"."+r:"")}const Se=e=>G(e,2);function ie(e,t){let s;try{if(t==null||t==="")return;s=BigInt(t)}catch{return}switch(e){case"int":return s.toLocaleString("en-US");case"imd":return`${G(s)} IMD`;case"plea":return`${G(s)} PLEA`;case"duration":return be(Number(s));case"bps":return`${Se(s)}%`;case"multiplier":return`×${G(s,4)}`;default:return}}const K=new Set;function U(e,t,s){const a=t==="_meta"?void 0:e[t];if(!a)return;const o=a.chain?s?.[a.chain]:void 0;if(o==null)return a.text;let l=!0;try{l=a.value!==null&&BigInt(o)===BigInt(a.value)}catch{l=!1}return!l&&!K.has(t)&&(K.add(t),console.warn(`Docs: ${a.chain} on chain is ${String(o)}, numbers.json's ${t} says ${a.value}; the page shows the chain's.`)),a.format==="text"?a.text:ie(a.format,o)??a.text}function De(e,t,s){const a=t==="_meta"?void 0:e[t];if(!a)return;const o=a.chain?s?.[a.chain]:void 0;try{return o!=null?BigInt(o):a.value===null?void 0:BigInt(a.value)}catch{return}}const ce=(e,t)=>e.items.map(s=>y(s.c,t)+(s.sub?" "+ce(s.sub,t):"")).join(" ");function F(e,t){switch(e.t){case"p":case"pre":return y(e.c,t);case"list":return ce(e,t);case"table":return[e.head,...e.rows].map(s=>s.map(a=>y(a,t)).join(" ")).join(" ");case"quote":return e.c.map(s=>F(s,t)).join(" ");case"callout":return[e.kind==="builders"?"For builders":"",e.title?y(e.title,t):"",...e.c.map(s=>F(s,t))].join(" ");default:return""}}function Ge(e,t){const s=[];for(const a of e){let o={slug:a.slug,page:a.title,heading:"",id:"",text:"",order:s.length};const l=[],r=()=>{o.text=l.join(" ").replace(/\s+/g," ").trim(),(o.heading||o.text)&&s.push({...o,order:s.length}),l.length=0};for(const c of a.blocks)if(!(c.t==="h"&&c.level===1)){if(c.t==="h"){r(),o={slug:a.slug,page:a.title,heading:y(c.c,t),id:c.id,text:"",order:0};continue}l.push(F(c,t))}r()}return s}const L=e=>e.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,""),Y=e=>L(e).split(/[^\p{L}\p{N}%.×-]+/u).filter(t=>t.length>0),Me=(e,t)=>{let s=0,a=e.indexOf(t);for(;a>=0&&s<5;)s++,a=e.indexOf(t,a+t.length);return s},he=e=>e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),V=(e,t)=>new RegExp(`(^|[^\\p{L}\\p{N}])${he(t)}`,"u").test(e),X=(e,t)=>new RegExp(`(^|[^\\p{L}\\p{N}])${he(t)}($|[^\\p{L}\\p{N}])`,"u").test(e);function $e(e,t,s=8){const a=Y(t);if(a.join("").length<2)return[];const o=a.join(" "),l=[];for(const r of e){const c=L(r.heading),u=L(r.page),i=L(r.text);if(!a.every(d=>c.includes(d)||u.includes(d)||i.includes(d)))continue;let h=a.length>1&&c.includes(o)?20:0;for(const d of a)h+=(V(c,d)?10:0)+(V(u,d)?5:0)+Me(i,d)+(X(c,d)||X(i,d)?2:0);l.push({e:r,score:h})}return l.sort((r,c)=>c.score-r.score||r.e.order-c.e.order),l.slice(0,s).map(({e:r})=>({entry:r,href:re(`#/docs/${r.slug}${r.id?`/${r.id}`:""}`),snippet:Oe(r.text,a)}))}function Oe(e,t,s=120){const a=L(e),o=Math.min(...t.map(c=>a.indexOf(c)).filter(c=>c>=0),1/0);if(e.length<=s)return e;let l=o===1/0?0:Math.max(0,o-Math.floor(s/3));l>0&&(l=e.indexOf(" ",l)+1||l);let r=Math.min(e.length,l+s);return r<e.length&&(r=e.lastIndexOf(" ",r)>l?e.lastIndexOf(" ",r):r),(l>0?"…":"")+e.slice(l,r)+(r<e.length?"…":"")}const He={note:{kind:"info",icon:"info",title:void 0},warn:{kind:"warn",icon:"warning",title:void 0},builders:{kind:"builders",icon:"seal-check",title:"For builders"}};function W(e,t){const s=t.num(e);if(s===void 0)throw Error(`The docs name an unknown number {{${e}}}.`);return s}function v(e,t,s="i"){return e.map((a,o)=>{const l=`${s}.${o}`;switch(a.t){case"text":return a.v;case"num":{const r=W(a.key,t);return r.split(" ").length<=3?n.jsx("span",{className:"nowrap",children:r},l):r}case"strong":return n.jsx("strong",{children:v(a.c,t,l)},l);case"em":return n.jsx("em",{children:v(a.c,t,l)},l);case"code":return n.jsx("code",{children:v(a.c,t,l)},l);case"link":{const r=re(a.href);return/^https?:\/\//.test(r)?n.jsxs("a",{href:r,target:"_blank",rel:"noreferrer",className:"docs-ext",children:[v(a.c,t,l),n.jsx(E,{name:"arrow-square-out"}),n.jsx("span",{className:"sr-only",children:" (opens in a new tab)"})]},l):n.jsx("a",{href:r,children:v(a.c,t,l)},l)}}})}function ue(e,t,s){const a=e.items.map((o,l)=>n.jsxs("li",{children:[v(o.c,t,`${s}.${l}`),o.sub&&ue(o.sub,t,`${s}.${l}.s`)]},l));return e.ordered?n.jsx("ol",{start:e.start===1?void 0:e.start,children:a},s):n.jsx("ul",{children:a},s)}const Q={l:void 0,c:"c",r:"r"};function z(e,t,s="b"){return e.map((a,o)=>{const l=`${s}.${o}`;switch(a.t){case"h":{const r=v(a.c,t,l);if(a.level===1)return n.jsx("div",{className:"page-title",children:n.jsx("h1",{children:r})},l);if(a.level===4)return n.jsx("h4",{id:B(a.id),tabIndex:-1,children:r},l);const c=a.level===2?"h2":"h3",u=y(a.c,i=>W(i,t));return n.jsxs("div",{className:`docs-h docs-h--${a.level}`,children:[n.jsx(c,{id:B(a.id),tabIndex:-1,children:r}),n.jsx("a",{className:"docs-anchor",href:A(t.slug,a.id),"aria-label":`Link to ${u}`,children:n.jsx(E,{name:"link"})})]},l)}case"p":return n.jsx("p",{children:v(a.c,t,l)},l);case"list":return ue(a,t,l);case"table":{const r=a.head.map(c=>y(c,u=>W(u,t))).join(", ");return n.jsx("div",{className:"table-wrap docs-table",role:"region","aria-label":`Table: ${r}`,tabIndex:0,children:n.jsxs("table",{className:"table",children:[n.jsx("thead",{children:n.jsx("tr",{children:a.head.map((c,u)=>n.jsx("th",{scope:"col",className:Q[a.align[u]||"l"],children:v(c,t,`${l}.h${u}`)},u))})}),n.jsx("tbody",{children:a.rows.map((c,u)=>n.jsx("tr",{children:c.map((i,h)=>n.jsx("td",{className:Q[a.align[h]||"l"],children:v(i,t,`${l}.${u}.${h}`)},h))},u))})]})},l)}case"quote":return n.jsx("blockquote",{className:"docs-quote stack stack--sm",children:z(a.c,t,l)},l);case"pre":return n.jsx("pre",{className:"docs-code",children:n.jsx("code",{children:v(a.c,t,l)})},l);case"hr":return n.jsx("hr",{},l);case"diagram":{const r=t.diagrams[a.name];if(!r)throw Error(`The docs name an unknown diagram "${a.name}".`);return n.jsx("div",{className:"docs-diagram",children:n.jsx(r,{})},l)}case"callout":{const r=He[a.kind],c=a.title?v(a.title,t,`${l}.t`):r.title;return n.jsx("div",{className:`docs-callout docs-callout--${a.kind}`,children:n.jsx(xe,{kind:r.kind,icon:r.icon,title:c,children:n.jsx("div",{className:"stack stack--sm",children:z(a.c,t,l)})})},l)}}})}function Be({tree:e,ctx:t}){return n.jsx(n.Fragment,{children:z(e,t)})}const Re=`# Start here

## In short

PLEA is a token anyone can buy. Selling is the hard part: to sell, you write a plea, and a panel of {{panel_size}} judges, the Cabal, decides.

If the Cabal ever goes {{deadman}} without a verdict, it dies. From then on PLEA trades freely, forever.

## How it works

1. **Buy.** Anyone can buy PLEA on the [Buy](#/buy) page from the moment trading opens. Each buy records what you paid and when. See [Buying](02-buying.md).
2. **Plead.** To sell, write why: 1 to {{max_plea_bytes}} bytes, in any language. Choose how much to sell and pay the {{oracle_fee}} oracle fee on the [Plead](#/plead) page. See [Selling: plead](03-plead.md).
3. **The contract sets your bar.** It scores four facts about your sale: how much of your PLEA you sell, how long you held it, your profit or loss and the price trend. Your need is {{pass_mark}} minus that fact score. The site shows it before you send. See [Your bar](04-your-bar.md).
4. **The Cabal judges.** {{panel_size}} judges score your plea from 0 to {{max_score}}, and at least {{quorum}} must agree. A score at or above your need is approved. See [The judges](05-judges.md).
5. **Sell.** Approved: you have {{sell_window}} to sell the amount you asked for, in one go.
6. **Or try again.** Denied: you may appeal once within {{appeal_window}}. Or wait out the cooldown, {{cooldown}}, and plead again. See [Appeals](06-appeals.md).
7. **The dead-man.** Every verdict, approved or denied, restarts the dead-man's clock. After {{deadman}} without one, the Cabal dies for good: no more pleas, and PLEA sells like any other token. See [The dead-man](13-dead-man.md).

## In a picture

::: diagram loop

## Example

You received 1,000,000 PLEA in the airdrop. A day after trading opened, with the price flat, you plead to sell 100,000 PLEA.

1. **The amount is allowed.** A plea sells at least {{min_share}} of your PLEA and at most {{max_share}}, and never more than {{max_sell}}. For 1,000,000 PLEA that is 10,000 to 500,000 PLEA. 100,000 fits.
2. **Your fact score.** You sell 10%, which is at most {{share_band_top}}: {{fact_share_top}} points. You have held it a day: {{held_points_1d}}. PLEA you received, not bought, counts {{received_profit}} for profit. The price is flat: {{trend_flat}}. In all: {{fact_share_top}} + {{held_points_1d}} + {{received_profit}} + {{trend_flat}} = 31.
3. **Your need.** {{pass_mark}} − 31 = 38. You pay the {{oracle_fee}} oracle fee, and the Cabal reads your plea.
4. **Approved.** The judges give 39. 39 is at least 38, so you may sell. You sell the 100,000 PLEA within {{sell_window}}. Your next plea can come {{cooldown}} after the sale.

Had the judges given 37, the plea would be denied. You could appeal once within {{appeal_window}} for {{appeal_total}}, or wait {{cooldown}} and plead again.

## Good to know

- **Buying is open, selling is not.** While the Cabal lives, the only way to sell is an approved plea.
- **Scanners may warn you.** Wallets and token scanners test a token with a plain sale. While the Cabal lives a plain sale fails, so they may call PLEA unsellable. That is the plea rule at work, not a trap. See [Risks and FAQ](17-risks.md).
- **No sending, either.** While the Cabal lives you cannot send PLEA to another wallet. The site says: "While the Cabal lives, sell through an approved plea."
- **The fee is spent.** The {{oracle_fee}} oracle fee pays the judges. It is not refunded, whatever the verdict.
- **One plea at a time.** A new plea waits while yours is still being judged, or approved and not yet sold. The site says: "You already have an open plea. Open its status page first."
- **Your plea is public.** Its text is stored on Ethereum for good, next to your wallet.
- **Three ways to plead.** By hand on [Plead](#/plead), with the [auto-sell box](08-auto-sell.md), or by [letter](07-letters.md), without the site.
- **Points and prizes.** An approved plea earns its score as season points. Others may object to it first. See [Objection!](09-objection.md) and [Seasons and prizes](10-seasons.md).

## Every page

- [Buying](02-buying.md): the launch window, the fees, your buy record.
- [Selling: plead](03-plead.md): the steps, the limits, every state of a plea.
- [Your bar](04-your-bar.md): the fact score and the need.
- [The judges](05-judges.md): what they score, and how a verdict forms.
- [Appeals](06-appeals.md): one more try after a denial.
- [Letters](07-letters.md): plead from a block explorer or your wallet.
- [The auto-sell box](08-auto-sell.md): let anyone sell it for you.
- [Objection!](09-objection.md): challenge an approval's points.
- [Seasons and prizes](10-seasons.md): points, the leaderboard, the pot.
- [Fees](11-fees.md): the {{fee_total}} on every trade.
- [The pool: cap, burn and the buy wall](12-pool.md): where the PLEA and the fees go.
- [The dead-man](13-dead-man.md): how the Cabal dies.
- [Keepers](14-keepers.md): the upkeep anyone can do.
- [Contracts and owner](15-contracts.md): addresses, and what the owner can and cannot do.
- [Audits](16-audits.md): who checked the code.
- [Risks and FAQ](17-risks.md): what can go wrong.
- [Glossary](18-glossary.md): every word, in one line.

::: builders
The loop lives in \`CabalGate\`: \`submitSell(amount, text)\` pleads, the oracle's answer arrives in \`onOracleResult\`, \`executeSell(minOut)\` sells, \`appeal(originalId, amount, text)\` appeals and \`expire(id)\` closes a plea with no verdict. Events: \`PleaSubmitted\`, \`Verdict\`, \`SellExecuted\`, \`PleaLapsed\`, \`PleaExpired\`. \`cabalAlive()\` is the dead-man.

Source: [CabalGate.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/CabalGate.sol), at the commit IMD deployed. Every contract and address: [Contracts and owner](15-contracts.md) and the site's [Contracts](#/contracts) list.
:::
`,Fe=`# Buying

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,We=`# Selling: plead

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,ze=`# Your bar

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,Ue=`# The judges

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,Ye=`# Appeals

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,qe=`# Letters

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,Ke=`# The auto-sell box

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,Ve=`# Objection!

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,Xe=`# Seasons and prizes

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,Qe=`# Fees

## In short

To be written.

## How it works

To be written.

## In a picture

::: diagram fee-bar

## Example

To be written.

## Good to know

To be written.
`,Je=`# The pool: cap, burn and the buy wall

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,Ze=`# The dead-man

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,et=`# Keepers

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,tt=`# Contracts and owner

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,at=`# Audits

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,nt=`# Risks and FAQ

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,ot=`# Glossary

## In short

To be written.

## How it works

To be written.

## In a picture

To be written.

## Example

To be written.

## Good to know

To be written.
`,st={deployment:"PLEA launch #2647 on Ethereum (block 26,293,890)",source:"khaed1/plea, the branch IMD deployed for the Ethereum launch, @ 42e0f855875786a953e945e528e9d7f2724a5352 (its src/; every file:line below is there)",status:"Checked 2026-10-29 by the numbers agent: every entry re-read in src/ at 42e0f85 and launch.json; every chain-bound value read from the launched contracts (read-only calls); trading not open yet (PleaHook.seeded false, PleaLaunch.opened false), so seed-time values (the cap's daily allowance) are computed",format:"key -> {text: words the docs print, value: raw on-chain value as a decimal string or null, chain: the site's constant key con(s, 'Contract.NAME') or null, format: int|imd|plea|duration|bps|multiplier|text, source: file:line, what: one line}. Whenever value is set and format is not text, text is format(value) exactly (the unit tests check it)"},lt={text:"69",value:"69",chain:"CabalGate.PASS_MARK",format:"int",source:"src/CabalGate.sol:122; need = PASS_MARK - fact score :433",what:"need = pass mark - fact score; a plea is approved when the judges' score is at least its need (:554)"},rt={text:"45",value:"45",chain:"CabalGate.MAX_PLEA_SCORE",format:"int",source:"src/CabalGate.sol:123; CannotPass :433-434; ScoreOutOfRange :551-552",what:"the judges' scale is 0 to 45; a plea whose need is above 45 is refused (CannotPass)"},it={text:"30",value:"30",chain:"CabalGate.PANEL_SIZE",format:"int",source:"src/CabalGate.sol:124; checked :545-550",what:"judges on a panel (the Cabal)"},ct={text:"17",value:"17",chain:"CabalGate.QUORUM",format:"int",source:"src/CabalGate.sol:125; at least 17 agreed :545-550",what:"judges who must agree for a verdict"},ht={text:"0.5 IMD",value:"500000000000000000",chain:"CabalGate.ORACLE_FEE",format:"imd",source:"src/CabalGate.sol:110; paid to IMD's Intake in _ask :452-463",what:"a plea's or an appeal's oracle fee, in IMD; spent whatever happens (approved, denied, no verdict)"},ut={text:"0.35 IMD",value:"350000000000000000",chain:"CabalGate.APPEAL_POOL_SHARE",format:"imd",source:"src/CabalGate.sol:111; paid to the buy wall by _payAppeal :396-401 (PleaHook.fundWall)",what:"an appeal's extra payment, to the buy wall"},dt={text:"0.85 IMD",value:"850000000000000000",chain:null,format:"imd",source:"src/CabalGate.sol:110-111 (0.5 + 0.35), appeal :347-350",what:"what an appeal costs in IMD: the oracle fee plus the wall share"},pt={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:377-378, :382 (NotDenied, AlreadyAppealed); an expired appeal frees its slot :508",what:"appeals per denied plea; an appeal itself cannot be appealed; an appeal that got no verdict may be sent again inside the window, paying again"},mt={text:"7 minutes",value:"420",chain:"CabalGate.EXECUTE_WINDOW",format:"duration",source:"src/CabalGate.sol:112; WindowLapsed :620; lapse :492-496",what:"time to sell after an approval; after it the approval lapses"},ft={text:"4 hours",value:"14400",chain:"CabalGate.COOLDOWN",format:"duration",source:"src/CabalGate.sol:113; _requireCanPlead :469-476, _cooldown :479-482; a lapse is timed from the approval :494",what:"no new plea for this long after a sale, a denial or a lapsed approval (a lapse counts from the approval's time); none after a plea that got no verdict"},wt={text:"4 hours",value:"14400",chain:"CabalGate.COOLDOWN",format:"duration",source:"src/CabalGate.sol:379 (AppealClosed)",what:"an appeal must be sent within this long after the denial"},bt={text:"20 minutes",value:"1200",chain:"CabalGate.PENDING_EXPIRY",format:"duration",source:"src/CabalGate.sol:114; expire :514-521; a later verdict is refused :540-542",what:"a plea with no verdict after this (or once IMD's Intake closed it without one) can be closed by anyone: no cooldown, the fee is spent"},xt={text:"280",value:"280",chain:"CabalGate.MAX_PLEA_BYTES",format:"int",source:"src/CabalGate.sol:115; _validateText :824-865",what:"a plea's text, 1 to 280 bytes of UTF-8 (the number alone: a page writes the word bytes after it)"},_t={text:"2,500,000 PLEA",value:"2500000000000000000000000",chain:"CabalGate.MAX_SELL",format:"plea",source:"src/CabalGate.sol:116; _checkAmount :525-530",what:"most PLEA one plea may sell"},gt={text:"50%",value:"5000",chain:"CabalGate.MAX_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:117; :526",what:"most of your balance one plea may sell"},vt={text:"1%",value:"100",chain:"CabalGate.MIN_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:118-119; :527-529 (AmountTooSmall)",what:"least share of your balance a plea may sell (or 2,500,000 PLEA when 1% is more)"},yt={text:"250,000,000 PLEA",value:"250000000000000000000000000",chain:null,format:"plea",source:"src/CabalGate.sol:523-528 (1% of 250,000,000 = MAX_SELL)",what:"above this balance the 1% minimum is capped at 2,500,000 PLEA, so the least and the most a plea may sell meet"},Et={text:"33 hours",value:"118800",chain:"CabalGate.DEADMAN",format:"duration",source:"src/CabalGate.sol:147, :200-204; launch.json CabalGate argument 7 = 118800; reset only by a signed plea or appeal verdict :557",what:"the Cabal dies after this long without a signed verdict on a plea or an appeal, for good"},kt={text:"15 days",value:"1296000",chain:"Seasons.SEASON",format:"duration",source:"src/Seasons.sol:83,107 = CabalGate.SEASON (src/CabalGate.sol:146; launch.json CabalGate argument 6 = 1296000)",what:"one season; seasons run back to back from the moment trading opens"},Pt={text:"selling at most 20%: 16 points; at most 35%: 9; more: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:270 (share rounded up :260-264; an appeal takes the lesser of its share and the original's :266-268, :427-431)",what:"share-sold part of the fact score"},jt={text:"20%",value:"2000",chain:null,format:"bps",source:"src/CabalGate.sol:270",what:"selling at most this share of your PLEA scores the top share points"},At={text:"35%",value:"3500",chain:null,format:"bps",source:"src/CabalGate.sol:270",what:"selling at most this share (and more than 20%) scores the middle share points"},Lt={text:"16",value:"16",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for selling at most 20% of your PLEA"},Tt={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for more than 20% and at most 35%"},It={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for more than 35%"},Ct={text:"held under a day: 0; a day: 1; 3 days: 2; 7 days: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:300-305; the time is the buy-weighted average of your buys (src/PleaHook.sol:731-739)",what:"holding-time part of the fact score"},Nt={text:"0",value:"0",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for PLEA held under a day"},St={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least a day"},Dt={text:"2",value:"2",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least 3 days"},Gt={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least 7 days"},Mt={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:304 (held >= 1 days)",what:"days held for the first holding point (a page writes day or days after it)"},$t={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:304 (held >= 3 days)",what:"days held for the second holding point"},Ot={text:"7",value:"7",chain:null,format:"int",source:"src/CabalGate.sol:304 (held >= 7 days)",what:"days held for the third and last holding point"},Ht={text:"at a loss: 13; gain at most 50%: 12; at most 200%: 10; at most 500%: 8; at most 1,000%: 6; more: 4",value:null,chain:null,format:"text",source:"src/CabalGate.sol:279-288 (the recorded PLEA at the latest hourly price vs the IMD the buys cost, fees included: src/PleaHook.sol:566, :738)",what:"profit part of the fact score"},Bt={text:"13",value:"13",chain:null,format:"int",source:"src/CabalGate.sol:283",what:"profit points at a loss"},Rt={text:"12",value:"12",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 50%"},Ft={text:"10",value:"10",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 200%"},Wt={text:"8",value:"8",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 500%"},zt={text:"6",value:"6",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 1,000%"},Ut={text:"4",value:"4",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain above 1,000%"},Yt={text:"50%",value:"5000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g * 2 <= spent)",what:"first profit band edge"},qt={text:"200%",value:"20000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 2)",what:"second profit band edge"},Kt={text:"500%",value:"50000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 5)",what:"third profit band edge"},Vt={text:"1,000%",value:"100000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 10)",what:"fourth profit band edge"},Xt={text:"PLEA no buy record covers (airdrop, prizes) counts as held since trading opened, at profit 9",value:null,chain:null,format:"text",source:"src/CabalGate.sol:274-278, :289-292 (PLEA-weighted mean of the record's points and the received points, rounded to the nearest point)",what:"received PLEA"},Qt={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:291",what:"profit points for PLEA no buy record covers"},Jt={text:"24-hour price up more than 2%: 9; within 2% (or no price 24 hours ago): 5; down more than 2%: 0",value:null,chain:null,format:"text",source:"src/CabalGate.sol:294-297; the hour checkpoints src/PleaHook.sol:294-309",what:"trend part of the fact score"},Zt={text:"2%",value:"200",chain:null,format:"bps",source:"src/CabalGate.sol:296-297 (latest > ago * 102 / 100; latest * 100 >= ago * 98)",what:"how far the price must move in 24 hours to count as up or down"},ea={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:296",what:"trend points when the price rose more than 2% in 24 hours"},ta={text:"5",value:"5",chain:null,format:"int",source:"src/CabalGate.sol:295, :297",what:"trend points within 2%, or when no price from 24 hours ago exists (the first day)"},aa={text:"0",value:"0",chain:null,format:"int",source:"src/CabalGate.sol:294-297",what:"trend points when the price fell more than 2%"},na={text:"1 hour",value:"3600",chain:null,format:"duration",source:"src/PleaHook.sol:278-309, :1057-1067; src/CabalGate.sol:247-248",what:"prices for the fact score are hourly checkpoints (the price before each hour's first trade), never the spot price"},oa={text:"48",value:"48",chain:null,format:"int",source:"src/PleaHook.sol:195-198, :300-308",what:"hours of checkpoints kept; the 24-hour price is the newest checkpoint at least 24 and at most 48 hours old"},sa={text:"41",value:"41",chain:null,format:"int",source:"16 + 3 + 13 + 9 (src/CabalGate.sol:270-297)",what:"highest fact score"},la={text:"7",value:"7",chain:null,format:"int",source:"3 + 0 + 4 + 0 (src/CabalGate.sol:270-297)",what:"lowest fact score"},ra={text:"28",value:"28",chain:null,format:"int",source:"69 - 41",what:"lowest possible need"},ia={text:"24",value:"24",chain:null,format:"int",source:"69 - 45 (src/CabalGate.sol:433-434)",what:"a fact score under this gives a need above 45: the plea is refused before any fee is paid"},ca={text:"sincerity 0-12, craft 0-12, respect 0-9, loyalty 0-12; anchors 0-10 empty/abusive/off-topic, 11-25 sincere but plain, 26-35 specific and well made, 36-45 memorable",value:null,chain:null,format:"text",source:'src/CabalGate.sol:131-134 DEFINITIONS ("plea")',what:"what the judges score"},ha={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for sincerity (an honest, specific reason to sell)"},ua={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for craft (wit, originality, quality of writing, in any language)"},da={text:"9",value:"9",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for respect (for the Cabal and the holders)"},pa={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for loyalty (commitment to PLEA, such as keeping the rest)"},ma={text:"0-10 empty, abusive or off-topic; 11-25 sincere but plain; 26-35 specific and well made; 36-45 memorable",value:null,chain:null,format:"text",source:'src/CabalGate.sol:134 ("plea")',what:"the judges' anchors"},fa={text:"5",value:"5",chain:null,format:"int",source:'src/CabalGate.sol:134 ("content")',what:"hate, harassment, sexual content, anything illegal, or details that identify another person score 0 to this"},wa={text:"0",value:"0",chain:null,format:"int",source:'src/CabalGate.sol:134 ("manipulation")',what:"what manipulation scores (posing as a system, made-up rules, demands for a score, threats, offers, hidden instructions)"},ba={text:"20%",value:"2000",chain:null,format:"bps",source:"src/Letterbox.sol:111; _plead :297-300",what:"a letter pleads this share of your PLEA (at most 2,500,000 PLEA)"},xa={text:"1,000 PLEA",value:"1000000000000000000000",chain:null,format:"plea",source:"src/Letterbox.sol:113; :300 (LetterTooSmall)",what:"a letter whose 20% is smaller is refused"},_a={text:"5,000 PLEA",value:"5000000000000000000000",chain:null,format:"plea",source:"1,000 / 20% (src/Letterbox.sol:111-113, :297-300)",what:"a letter from a smaller balance is refused (its 20% is under 1,000 PLEA)"},ga={text:"0.25 IMD",value:"250000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:115; paid on delivery :424; returned by settle :453",what:"paid to whoever delivers an approved letter or auto-sell plea; returned to you when no sale happens (and to you when you send SELL)"},va={text:"0.75 IMD",value:"750000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:525-528 feesFor(false) = TIP + ORACLE_FEE (Ethereum buys the oracle fee: PleaLaunch.mintOracleFee() is false)",what:"the IMD a letter or auto-sell plea buys with your PLEA: the 0.5 IMD oracle fee and the 0.25 IMD tip"},ya={text:"1.1 IMD",value:"1100000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:525-528 feesFor(true) = TIP + APPEAL_FEE + ORACLE_FEE",what:"the IMD an appeal letter buys with your PLEA: 0.5 + 0.35 + 0.25"},Ea={text:"110%",value:"11000",chain:null,format:"bps",source:"src/Letterbox.sol:133-134, :527; unspent PLEA comes back at once :386-387",what:"the fee sale may spend PLEA worth at most this share of the IMD it buys, at the hourly price"},ka={text:"10%",value:"1000",chain:null,format:"bps",source:"src/Letterbox.sol:135-136; :304 (FeeTooHigh)",what:"a letter's or auto-sell plea's fees may take at most this share of your PLEA"},Pa={text:"8.25 IMD",value:"8250000000000000000",chain:null,format:"imd",source:"0.75 IMD x 110% / 10% (src/Letterbox.sol:304, :525-528)",what:"the least your PLEA must be worth, at the hourly price, to send a letter or an auto-sell plea"},ja={text:"12.1 IMD",value:"12100000000000000000",chain:null,format:"imd",source:"1.1 IMD x 110% / 10% (src/Letterbox.sol:361-363; or the fees fit in 110% of the original plea's amount)",what:"the least your PLEA must be worth for an appeal letter, unless its fees fit in 110% of the original plea's amount"},Aa={text:"0.7 IMD",value:"700000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:120-124; _requireWorthTheFee :428-433 (TooSmallForTheFee)",what:"a letter or auto-sell plea worth less at the hourly price is refused"},La={text:"95%",value:"9500",chain:null,format:"bps",source:"src/Letterbox.sol:127-129; _deliver :405-406",what:"a delivered sale must get at least 95% of its hourly value after the hook's sale fees"},Ta={text:"92.86%",value:null,chain:null,format:"text",source:"95% x (100% - 2.25%) = 92.8625% (src/Letterbox.sol:129-132, :405-406)",what:"the least a delivered sale pays, as a share of the plea's hourly value"},Ia={text:"0.35 IMD",value:"350000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:116-119; _deliver :415-421 (never more than the sale; letters do not pay it)",what:"taken from a delivered auto-sell sale, to the season's prize pot"},Ca={text:"APPEAL followed by your text; SELL; NAME followed by a name; any other text is a new plea",value:null,chain:null,format:"text",source:"src/Letterbox.sol:204-216, :495-519",what:"what a letter's first word does"},Na={text:"3",value:"3",chain:null,format:"int",source:"src/Letterbox.sol:260-261 (BadName)",what:"shortest display name"},Sa={text:"20",value:"20",chain:null,format:"int",source:"src/Letterbox.sol:260-261 (BadName)",what:"longest display name"},Da={text:"a-z, 0-9 and _",value:null,chain:null,format:"text",source:"src/Letterbox.sol:262-265",what:"the characters a display name may use"},Ga={text:"cabal, admin, imd, plea, owner",value:null,chain:null,format:"text",source:"src/Letterbox.sol:266-270",what:"names nobody may take"},Ma={text:"20 minutes",value:"1200",chain:"Tribunal.OBJECTION_WINDOW",format:"duration",source:"src/Tribunal.sol:126-127; :263 (WindowClosed)",what:"time after an approval to object; the plea's season points wait for it"},$a={text:"0.5 IMD",value:"500000000000000000",chain:"Tribunal.ORACLE_FEE",format:"imd",source:"src/Tribunal.sol:130; :291-301",what:"an objection's oracle fee, spent whatever the ruling"},Oa={text:"0.35 IMD",value:"350000000000000000",chain:"Tribunal.STAKE",format:"imd",source:"src/Tribunal.sol:131; :290; settle :370-381",what:"back if sustained or void; to the plea's season prize pot if overruled"},Ha={text:"0.85 IMD",value:"850000000000000000",chain:null,format:"imd",source:"src/Tribunal.sol:130-131 (0.5 + 0.35)",what:"what an objection costs in IMD"},Ba={text:"2",value:"2",chain:"Tribunal.MARGIN",format:"int",source:"src/Tribunal.sol:134-135; sustained when score + 2 < need :330",what:"sustained only when the new score is more than this below the need"},Ra={text:"2",value:"2",chain:"Tribunal.MAX_OBJECTIONS",format:"int",source:"src/Tribunal.sol:132-133; :268-279",what:"objections per plea, each from a different wallet; both may wait at once"},Fa={text:"20 minutes",value:"1200",chain:"Tribunal.PENDING_EXPIRY",format:"duration",source:"src/Tribunal.sol:128-129; expire :361-368",what:"an objection with no ruling after this is void (stake back, fee spent)"},Wa={text:"280",value:"280",chain:"Tribunal.MAX_TEXT_BYTES",format:"int",source:"src/Tribunal.sol:136; :483-486",what:"an objection's text, in UTF-8 bytes (a page writes the word bytes after it)"},za={text:"60",value:"60",chain:"Seasons.MIN_POINTS",format:"int",source:"src/Seasons.sol:60; :339, :444",what:"points to qualify for a prize"},Ua={text:"25",value:"25",chain:"Seasons.TOP",format:"int",source:"src/Seasons.sol:61; :338",what:"ranks paid each season"},Ya={text:"3",value:"3",chain:null,format:"int",source:"src/Seasons.sol:86-87, :265-281",what:"your best pleas that count in a season"},qa={text:"135",value:"135",chain:null,format:"int",source:"3 x 45 (src/Seasons.sol:265-281)",what:"most points a wallet can have in a season without a seat"},Ka={text:"162",value:"162",chain:null,format:"int",source:"3 x 54 (src/Seasons.sol:133-135, :265-281)",what:"most points with an IMD seat"},Va={text:"4.5% for 1st down to 3.5% for 25th, in a straight line (rounded to whole basis points), 100% in all",value:null,chain:null,format:"text",source:"src/Seasons.sol:74-76 SHARES; shareBps :117-119 (on chain: 450 ... 350, sum 10,000)",what:"prize shares"},Xa={text:"4.5%",value:"450",chain:null,format:"bps",source:"src/Seasons.sol:76; Seasons.shareBps(0) = 450 on chain",what:"the 1st place's share of the pot and of the bonus"},Qa={text:"3.5%",value:"350",chain:null,format:"bps",source:"src/Seasons.sol:76; Seasons.shareBps(24) = 350 on chain",what:"the 25th place's share"},Ja={text:"4.50, 4.46, 4.42, 4.38, 4.33, 4.29, 4.25, 4.21, 4.17, 4.12, 4.08, 4.04, 4.00, 3.96, 3.92, 3.88, 3.83, 3.79, 3.75, 3.71, 3.67, 3.62, 3.58, 3.54, 3.50",value:null,chain:null,format:"text",source:"src/Seasons.sol:76; Seasons.shareBps(0..24) on chain",what:"every rank's share in percent, 1st to 25th"},Za={text:"1 hour",value:"3600",chain:"Seasons.CLOSE_GRACE",format:"duration",source:"src/Seasons.sol:62-64; :326 (NotReady)",what:"after a season ends, before anyone can close it"},en={text:"6",value:"6",chain:"Seasons.BONUS_SEASONS",format:"int",source:"src/Seasons.sol:65-66; :350",what:"seasons that also pay the PLEA bonus"},tn={text:"10,000,000 PLEA",value:"10000000000000000000000000",chain:"Seasons.BONUS_PER_SEASON",format:"plea",source:"src/Seasons.sol:67; _payBonus :437-460",what:"PLEA bonus per season, same shares and same 60-point bar; unpaid shares are burned"},an={text:"60,000,000 PLEA",value:"60000000000000000000000000",chain:null,format:"plea",source:"6 x 10,000,000 = Seasons' 6% (src/PLEA.sol:105)",what:"all six seasons' bonus"},nn={text:"×1.2",value:"12000",chain:"Seasons.SEAT_MULTIPLIER_BPS",format:"multiplier",source:"src/Seasons.sol:68-71; pointsFor :131-135 (rounded down; read when the plea is recorded)",what:"points for an IMD seat holder; points only, never the need or the 60-point bar"},on={text:"a score of 45 counts 54 points",value:null,chain:null,format:"text",source:"45 x 12,000 / 10,000 = 54 (src/Seasons.sol:134)",what:"the seat multiplier on the top score"},sn={text:"2.25%",value:"225",chain:null,format:"bps",source:"src/PleaHook.sol:73-79 (IMD_FEE_BPS 200 of the trade's IMD + PLEA_BURN_BPS 25 of its PLEA)",what:"every trade's fee"},ln={text:"2%",value:"200",chain:"PleaHook.IMD_FEE_BPS",format:"bps",source:"src/PleaHook.sol:78; a share of the IMD that reaches or leaves the pool :470-472, :551",what:"the IMD part of every trade's fee"},rn={text:"0.5%",value:"50",chain:"PleaHook.CASHBACK_BPS",format:"bps",source:"src/PleaHook.sol:74; :598; _payCashback :758-781",what:"back to the trader as staked IMD (sIMD, imd/acc's Stacker); stays in the pool when no trader is known (after the death)"},cn={text:"1%",value:"100",chain:"PleaHook.OWNER_BPS",format:"bps",source:"src/PleaHook.sol:75; :599, :619",what:"to the owner (the hook's fixed fee receiver)"},hn={text:"0.25%",value:"25",chain:"PleaHook.PRIZE_BPS",format:"bps",source:"src/PleaHook.sol:76; :600-601 (to pool liquidity once the Cabal is dead)",what:"to the season's prize pot while the Cabal lives"},un={text:"0.25%",value:"25",chain:"PleaHook.POOL_BPS",format:"bps",source:"src/PleaHook.sol:77; :618, :630-633",what:"kept in the pool for the buy wall"},dn={text:"0.25%",value:"25",chain:"PleaHook.PLEA_BURN_BPS",format:"bps",source:"src/PleaHook.sol:79; :594, :644-654",what:"of the trade's PLEA, burned"},pn={text:"1.75%",value:"175",chain:null,format:"bps",source:"0.5% + 1% + 0.25% (src/PleaHook.sol:598-602)",what:"the IMD fee parts paid out of the pool (cashback, owner, prize)"},mn={text:"90 minutes",value:"5400",chain:"PleaHook.LAUNCH_WINDOW",format:"duration",source:"src/PleaHook.sol:80; launchExtraBps :311-317; max buy :721-725",what:"the launch window after trading opens"},fn={text:"70%",value:"7000",chain:"PleaHook.LAUNCH_EXTRA_BPS",format:"bps",source:"src/PleaHook.sol:81; :311-317, :485-487; a share of the IMD that reaches the pool :470-472; kept for the wall :618",what:"the extra fee on buys at the open; it falls in a straight line to 0% over the launch window; it stays in the pool for the buy wall"},wn={text:"70% at the open, 58.33% after 15 minutes, 46.66% after 30, 35% after 45, 23.33% after 60, 11.66% after 75, 0% from 90",value:null,chain:null,format:"text",source:"7,000 x (5,400 - seconds since the open) / 5,400 basis points, rounded down (src/PleaHook.sol:311-317)",what:"the launch fee over the window"},bn={text:"72%",value:"7200",chain:null,format:"bps",source:"2% + 70% (src/PleaHook.sol:485-487)",what:"the IMD fee on a buy at the open, as a share of the IMD that reaches the pool"},xn={text:"41.86%",value:null,chain:null,format:"text",source:"7,200 / 17,200 = 41.86% (src/PleaHook.sol:470-472: fee = amount x rate / (10,000 + rate))",what:"the fee at the open as a share of the IMD a buyer pays"},_n={text:"5,000,000 PLEA",value:"5000000000000000000000000",chain:"PleaHook.LAUNCH_MAX_BUY",format:"plea",source:"src/PleaHook.sol:82; _checkMaxBuy :721-725 (BuyTooLarge); the pool's PLEA out before the burn :474, :538",what:"most PLEA one buy may take from the pool in the launch window"},gn={text:"0.00002 IMD",value:"20000000000000",chain:null,format:"imd",source:"20,000 IMD / 1,000,000,000 PLEA (src/PleaHook.sol:384-389; the opening tick is rounded up to the 60-tick grid :394-396, about 0.23% higher)",what:"the opening price of one PLEA"},vn={text:"about 100 IMD",value:null,chain:null,format:"text",source:"5,000,000 x 0.00002 IMD (before price impact and fees)",what:"what the largest launch-window buy is worth at the opening price"},yn={text:"2 IMD",value:"2000000000000000000",chain:"PleaHook.PAYOUT_RESERVE",format:"imd",source:"src/PleaHook.sol:83-86; :603-617 (PayoutsToPool)",what:"the opening exception: while the pool's own IMD plus a buy's fee is under this and the pool cannot pay out, that buy's cashback, owner and prize shares join the pool instead"},En={text:"20,000 IMD",value:"20000000000000000000000",chain:"PleaHook.MARKET_CAP_IMD",format:"imd",source:"src/PleaHook.sol:87-88; seed :376-424",what:"the market cap trading opens at"},kn={text:"14,000 IMD",value:"14000000000000000000000",chain:null,format:"imd",source:"src/PleaLaunch.sol:211-214 (BelowAgreedMarketCap)",what:"on Ethereum, seed refuses a hook whose opening market cap is under this"},Pn={text:"15 days",value:"1296000",chain:null,format:"duration",source:"src/PleaLaunch.sol:211-212 (BelowAgreedTiming)",what:"on Ethereum, seed refuses seasons shorter than this"},jn={text:"33 hours",value:"118800",chain:null,format:"duration",source:"src/PleaLaunch.sol:211-212 (BelowAgreedTiming)",what:"on Ethereum, seed refuses a dead-man shorter than this"},An={text:"900,000 PLEA",value:"900000000000000000000000",chain:"PleaHook.CAP_FLOOR",format:"plea",source:"src/PleaHook.sol:89; :803",what:"the inventory cap never falls below this"},Ln={text:"15",value:"15",chain:"PleaHook.CAP_DECAY_DAYS",format:"int",source:"src/PleaHook.sol:90-93; capDecayPerDay :409",what:"the cap may fall from the seeded PLEA to its floor in this many days at the fastest (a page writes the word days after it)"},Tn={text:"about 54.6 million PLEA",value:null,chain:null,format:"text",source:"(820,000,000 - 900,000) / 15 = 54,606,666 (src/PleaHook.sol:409; the seeded amount is a hair under 820,000,000: the 1-in-a-million rounding margin :1084)",what:"how far the cap may fall per day at most (fixed at the seed)"},In={text:"1 PLEA",value:"1000000000000000000",chain:"PleaHook.MIN_TRIM",format:"plea",source:"src/PleaHook.sol:94; :331-335, :815",what:"the least excess above the cap that is trimmed"},Cn={text:"1 IMD",value:"1000000000000000000",chain:"PleaHook.WALL_THRESHOLD",format:"imd",source:"src/PleaHook.sol:95; pendingRebalance :337-340",what:"kept IMD worth a rebalance"},Nn={text:"1,000 PLEA",value:"1000000000000000000000",chain:"PleaHook.WALL_MIN_FILL",format:"plea",source:"src/PleaHook.sol:96; :339",what:"PLEA bought by the wall worth a rebalance (it is burned then)"},Sn={text:"700",value:"700",chain:"PleaHook.WALL_GUARD_TICKS_PER_DAY",format:"int",source:"src/PleaHook.sol:178-185; _updateWallGuard :1022-1055",what:"ticks a day the wall's ceiling may rise toward a higher price (it falls at once); a page writes the word ticks after it"},Dn={text:"about 7.25%",value:null,chain:null,format:"text",source:"1.0001 ^ 700 = 1.0725",what:"the wall guard's daily step as a price change"},Gn={text:"200",value:"200",chain:null,format:"int",source:"src/PleaHook.sol:177; _observeTick :1002-1014",what:"ticks a block the hook's reference price may move (about 2%)"},Mn={text:"60",value:"60",chain:"PleaHook.TICK_SPACING",format:"int",source:"src/PleaHook.sol:106",what:"the pool's tick spacing"},$n={text:"0",value:"0",chain:"PleaHook.LP_FEE",format:"int",source:"src/PleaHook.sol:105",what:"the pool's own swap fee: every fee is the hook's"},On={text:"1,400,000",value:"1400000",chain:null,format:"int",source:"creditGas 400,000 + SWAP_RESERVE 1,000,000 (src/PleaHook.sol:99-102, :452; launch.json PleaLaunch argument 8 = 400000)",what:"gas a trade must still have when it reaches the hook, or it reverts NotEnoughGas"},Hn={text:"1,000,000,000 PLEA",value:"1000000000000000000000000000",chain:"PLEA.TOTAL_SUPPLY",format:"plea",source:"src/PLEA.sol:27; minted once in init :98-108",what:"fixed supply"},Bn={text:"820,000,000 PLEA",value:"820000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:104 (82%); on chain PLEA.balanceOf(hook) = 820,000,000 before the seed",what:"the pool's PLEA: all of it is the pool's liquidity"},Rn={text:"60,000,000 PLEA",value:"60000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:105 (6%); on chain PLEA.balanceOf(Seasons)",what:"Seasons' PLEA bonus"},Fn={text:"120,000,000 PLEA",value:"120000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:106 (12%); on chain PLEA.balanceOf(PleaDistributor)",what:"the distributor's PLEA (the swarm's 10% and a 2% airdrop, paid by one Merkle root)"},Wn={text:"82%",value:"8200",chain:null,format:"bps",source:"src/PLEA.sol:104",what:"the pool's share of the supply"},zn={text:"6%",value:"600",chain:null,format:"bps",source:"src/PLEA.sol:105",what:"Seasons' share"},Un={text:"12%",value:"1200",chain:null,format:"bps",source:"src/PLEA.sol:106",what:"the distributor's share"},Yn={text:"10%",value:"1000",chain:null,format:"bps",source:"src/PLEA.sol:10-11, src/PleaDistributor.sol:10 (comments: the code pays whatever the owner's root lists)",what:"the swarm's part of the distributor's 12%"},qn={text:"2%",value:"200",chain:null,format:"bps",source:"src/PLEA.sol:10-11, src/PleaDistributor.sol:10 (comments: the code pays whatever the owner's root lists)",what:"the airdrop's part of the distributor's 12%"},Kn={text:"82% to the pool (820,000,000), 6% to Seasons (60,000,000), 12% to the distributor (120,000,000)",value:null,chain:null,format:"text",source:"src/PLEA.sol:95-108; minted at deployHook (block 26,294,113)",what:"supply at launch"},Vn={text:"Tue 24 Nov 2026, 15:00 UTC",value:"1795532400",chain:"PleaLaunch.START",format:"text",source:"launch.json PleaLaunch argument 9 = 1795532400; src/PleaLaunch.sol:69-70, :206",what:"from this time anyone may open trading (seed); the owner may open it earlier"},Xn={text:"0x5BF3597216f9019Cf10CF680783289Efc8639Bf0",value:null,chain:null,format:"text",source:"launch.json $owner; on chain PLEA.owner(), PleaHook.owner(), PleaDistributor.owner()",what:"PLEA's owner, the hook's fee receiver and the distributor's owner"},Qn={text:"#2647",value:null,chain:null,format:"text",source:"IMD's launch record (README of the site)",what:"IMD's launch number"},Jn={text:"26,293,890",value:"26293890",chain:null,format:"int",source:"Ethereum block of the launch transaction (PLEA's Launched event)",what:"the launch block"},Zn={text:"26,294,106",value:"26294106",chain:null,format:"int",source:"PleaLaunch's LetterboxDeployed event",what:"the Letterbox's block"},eo={text:"26,294,111",value:"26294111",chain:null,format:"int",source:"PleaLaunch's TribunalDeployed event",what:"the Tribunal's block"},to={text:"26,294,113",value:"26294113",chain:null,format:"int",source:"PleaLaunch's HookDeployed event (PLEA minted its supply here)",what:"the hook's block"},ao={text:"0x1F158929496162b53fB232536468948e25170aB3",value:null,chain:null,format:"text",source:"launch #2647",what:"PLEA (the token)"},no={text:"0x39AC882a1161EA19aCb6FBDd7A5835D96CF876EB",value:null,chain:null,format:"text",source:"launch #2647; PLEA.gate()",what:"CabalGate (pleas, verdicts, sales)"},oo={text:"0xF7c024F7Bc96Cf152a572F6E184318ff6d380738",value:null,chain:null,format:"text",source:"launch #2647; PLEA.seasons()",what:"Seasons (points, prizes)"},so={text:"0x97fAcE21C7a9f3b64D0f4E0bF21861721fBBfE3E",value:null,chain:null,format:"text",source:"launch #2647; PLEA.distributor()",what:"PleaDistributor (the 12%)"},lo={text:"0x9e75eabf8d1c905a07a0C99bb9eC9430a065358F",value:null,chain:null,format:"text",source:"launch #2647; PLEA.launcher()",what:"PleaLaunch (wiring, seed)"},ro={text:"0x00423EbaEd03445Fc1452d9A79A51E3C0DFdab5f",value:null,chain:null,format:"text",source:"PleaLaunch.letterbox(); PLEA.letterbox()",what:"Letterbox (letters, the auto-sell box)"},io={text:"0x1aA665eB420F28103324daAAf034DE13EE6f53D9",value:null,chain:null,format:"text",source:"PleaLaunch.tribunal()",what:"Tribunal (Objection!)"},co={text:"0xf1122bc96AdeA8768CFf2badf02b6D4594f928Cc",value:null,chain:null,format:"text",source:"PleaLaunch.hook(); PLEA.hook()",what:"PleaHook (the pool's hook: fees, cap, wall)"},ho={text:"0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7",value:null,chain:null,format:"text",source:"launch.json CabalGate arguments 3-4",what:"IMD (the pool's other token and the fee token)"},uo={text:"0x000000000004444c5dc75cB358380D2e3dE08A90",value:null,chain:null,format:"text",source:"launch.json PleaLaunch argument 5; PLEA.poolManager()",what:"Uniswap v4's PoolManager"},po={text:"0x06909F672301F28A810f78cfe7a754851269F4F0",value:null,chain:null,format:"text",source:"launch.json PleaLaunch argument 7",what:"imd/acc's Stacker (pays the cashback as sIMD)"},mo={text:"0xa43e6F75ee006411F79Ac1C84120606C2330DE82",value:null,chain:null,format:"text",source:"launch.json CabalGate argument 2",what:"IMD's Intake (asks the Cabal)"},fo={text:"0x5598Aa9146215Bc13eb26f2c692Ad1461Fd32982",value:null,chain:null,format:"text",source:"launch.json CabalGate argument 5",what:"the key that signs the Cabal's answers"},wo={text:"0x0000eC93127BAA929E58E97dd0095A2BFb38ec1D",value:null,chain:null,format:"text",source:"launch.json Seasons argument 4; Seasons.seat()",what:"the IMD seat NFT (identity.md) behind the seat multiplier"},bo={text:"12",value:"12",chain:null,format:"int",source:"audit/FINDINGS.md Rounds table (rounds 1-12; 9-12 on the Ethereum code, the last on 571ae80, round 12)",what:"IMD swarm audit rounds"},xo={text:"852",value:"852",chain:null,format:"int",source:"README.md:299 (written 2026-10-17 for run 8.5's code; not re-counted for 42e0f85)",what:"the README's test count (unit, fuzz, invariant, adversarial, fork)"},_o={_meta:st,pass_mark:lt,max_score:rt,panel_size:it,quorum:ct,oracle_fee:ht,appeal_wall_share:ut,appeal_total:dt,appeals_per_plea:pt,sell_window:mt,cooldown:ft,appeal_window:wt,pending_expiry:bt,max_plea_bytes:xt,max_sell:_t,max_share:gt,min_share:vt,min_share_cap_balance:yt,deadman:Et,season_length:kt,fact_share_bands:Pt,share_band_top:jt,share_band_mid:At,fact_share_top:Lt,fact_share_mid:Tt,fact_share_low:It,fact_held_points:Ct,held_points_0:Nt,held_points_1d:St,held_points_3d:Dt,held_points_7d:Gt,held_day_1:Mt,held_day_3:$t,held_day_7:Ot,fact_profit_bands:Ht,profit_points_loss:Bt,profit_points_50:Rt,profit_points_200:Ft,profit_points_500:Wt,profit_points_1000:zt,profit_points_more:Ut,profit_band_50:Yt,profit_band_200:qt,profit_band_500:Kt,profit_band_1000:Vt,fact_received:Xt,received_profit:Qt,fact_trend:Jt,trend_band:Zt,trend_up:ea,trend_flat:ta,trend_down:aa,checkpoint_interval:na,price_ring_hours:oa,fact_max:sa,fact_min:la,need_min:ra,fact_needed:ia,judge_rubric:ca,judge_sincerity_max:ha,judge_craft_max:ua,judge_respect_max:da,judge_loyalty_max:pa,judge_anchors:ma,judge_content_max:fa,judge_manipulation:wa,letter_share:ba,min_letter:xa,letter_min_balance:_a,runner_tip:ga,letter_fee:va,letter_appeal_fee:ya,fee_cap:Ea,max_fee_share:ka,letter_min_value:Pa,letter_appeal_min_value:ja,min_sale_value:Aa,delivery_min_out:La,delivery_floor:Ta,auto_sell_fee:Ia,letter_commands:Ca,name_min_length:Na,name_max_length:Sa,name_chars:Da,name_reserved:Ga,objection_window:Ma,objection_fee:$a,objection_stake:Oa,objection_total:Ha,objection_margin:Ba,max_objections:Ra,objection_expiry:Fa,objection_bytes:Wa,min_points:za,top:Ua,best_count:Ya,max_points:qa,max_points_seat:Ka,shares:Va,share_first:Xa,share_last:Qa,shares_list:Ja,close_grace:Za,bonus_seasons:en,bonus_per_season:tn,bonus_total:an,seat_multiplier:nn,seat_example:on,fee_total:sn,fee_imd:ln,fee_cashback:rn,fee_owner:cn,fee_prize:hn,fee_pool:un,fee_burn:dn,fee_payouts:pn,launch_window:mn,launch_extra:fn,launch_fee_curve:wn,launch_open_fee:bn,launch_open_fee_of_payment:xn,launch_max_buy:_n,seed_price:gn,launch_max_buy_value:vn,payout_reserve:yn,market_cap:En,market_cap_check:kn,seed_check_season:Pn,seed_check_deadman:jn,cap_floor:An,cap_decay_days:Ln,cap_decay_per_day:Tn,min_trim:In,wall_threshold:Cn,wall_min_fill:Nn,wall_guard:Sn,wall_guard_pct:Dn,ref_step:Gn,tick_spacing:Mn,lp_fee:$n,swap_min_gas:On,total_supply:Hn,supply_pool:Bn,supply_seasons:Rn,supply_distributor:Fn,supply_pool_pct:Wn,supply_seasons_pct:zn,supply_distributor_pct:Un,supply_swarm_pct:Yn,supply_airdrop_pct:qn,supply_split:Kn,start:Vn,owner:Xn,launch_id:Qn,launch_block:Jn,letterbox_block:Zn,tribunal_block:eo,hook_block:to,addr_plea:ao,addr_gate:no,addr_seasons:oo,addr_distributor:so,addr_launch:lo,addr_letterbox:ro,addr_tribunal:io,addr_hook:co,addr_imd:ho,addr_pool_manager:uo,addr_stacker:po,addr_intake:mo,addr_oracle_signer:fo,addr_seat:wo,audit_rounds:bo,tests_count:xo},T=_o;function de(e){return{text:t=>{const s=U(T,t,e);if(s===void 0)throw Error(`The docs name an unknown number {{${t}}}.`);return s},value:t=>{if(!(t in T)||t==="_meta")throw Error(`The docs name an unknown number {{${t}}}.`);return De(T,t,e)}}}const pe=b.createContext(de()),go=pe.Provider,me=()=>b.useContext(pe),$=[{key:"fee_cashback",label:"Back to you, as staked IMD",fill:"var(--approved)",of:"IMD"},{key:"fee_owner",label:"The owner",fill:"var(--objection)",of:"IMD"},{key:"fee_prize",label:"The season’s prize pot",fill:"var(--pending)",of:"IMD"},{key:"fee_pool",label:"The buy wall, kept in the pool",fill:"var(--executed)",of:"IMD"},{key:"fee_burn",label:"Burned",fill:"var(--noverdict)",of:"PLEA"}],C=1e3,O=48;function vo(){const e=me(),t="fee-bar-"+b.useId().replace(/[^a-zA-Z0-9_-]/g,""),s=$.map(i=>e.value(i.key)??0n),a=s.reduce((i,h)=>i+h,0n),o=s.slice(0,4).reduce((i,h)=>i+h,0n),l=i=>ie("bps",i);let r=0;const c=$.map((i,h)=>{const d=a?C*Number(s[h])/Number(a):C/$.length,p={...i,x:r,w:d,n:h+1,text:e.text(i.key)};return r+=d,p}),u=`A bar for the ${l(a)} fee every trade pays, in five numbered parts: `+c.map(i=>`${i.n}, ${i.label[0].toLowerCase()+i.label.slice(1)}: ${i.text} of the ${i.of}`).join("; ")+`. Parts 1 to 4 are ${l(o)} of the trade’s IMD; part 5 is ${c[4].text} of its PLEA.`;return n.jsxs("figure",{className:"docs-figure panel stack stack--md",children:[n.jsxs("figcaption",{className:"docs-figure__title",children:["The ",l(a)," fee on every trade: ",l(o)," of its IMD in four parts, and ",c[4].text," of its PLEA, burned"]}),n.jsxs("div",{className:"docs-bar",children:[n.jsxs("svg",{className:"docs-bar__svg",viewBox:`0 0 ${C} ${O}`,preserveAspectRatio:"none",role:"img","aria-labelledby":`${t}-alt`,children:[n.jsx("title",{id:`${t}-alt`,children:u}),c.map(i=>n.jsx("rect",{x:i.x,y:"0",width:i.w,height:O,style:{fill:i.fill}},i.key)),c.slice(1).map(i=>n.jsx("line",{x1:i.x,y1:"0",x2:i.x,y2:O,vectorEffect:"non-scaling-stroke",style:{stroke:"var(--line)",strokeWidth:i.of==="PLEA"?8:3}},i.key))]}),c.map(i=>n.jsx("span",{className:"docs-bar__key",style:{left:`${(i.x+i.w/2)*100/C}%`},"aria-hidden":"true",children:i.n},i.key))]}),n.jsx(_e,{rows:[...c.map(i=>[n.jsxs("span",{className:"docs-key-row",children:[n.jsxs("svg",{className:"docs-key",viewBox:"0 0 28 28","aria-hidden":"true",children:[n.jsx("rect",{x:"1",y:"1",width:"26",height:"26",rx:"4",style:{fill:i.fill,stroke:"var(--line)",strokeWidth:2}}),n.jsx("circle",{cx:"14",cy:"14",r:"9",style:{fill:"var(--day)",stroke:"var(--night)",strokeWidth:1.5}}),n.jsx("text",{x:"14",y:"14",dy:"0.35em",textAnchor:"middle",style:{fill:"var(--night)",fontFamily:"var(--font-body)",fontWeight:800,fontSize:12},children:i.n})]}),n.jsxs("span",{children:[n.jsxs("span",{className:"sr-only",children:["Part ",i.n,": "]}),i.label]})]}),n.jsxs(n.Fragment,{children:[i.text," ",n.jsxs("span",{className:"text-2",children:["of the ",i.of]})]})]),["Every trade",l(a),"total"]]}),n.jsx("p",{className:"small text-2",children:"Once the Cabal is dead there are no more seasons: part 3 joins the pool too."})]})}const yo={APPROVED:"approved",OVERTURNED:"approved",DENIED:"denied",UPHELD:"denied",PENDING:"pending","NO VERDICT":"noverdict",LAPSED:"lapsed",SOLD:"sold",OBJECTION:"objection",SUSTAINED:"objection",OVERRULED:"objection",VOID:"objection"};function H({state:e,sub:t,size:s}){return n.jsxs("span",{className:`stamp stamp--${yo[e]}${s?` stamp--${s}`:""}`,children:[e,t&&n.jsx("span",{className:"stamp__sub",children:t})]})}function Eo({title:e,alt:t,children:s,after:a}){const o="dg-"+b.useId().replace(/[^a-zA-Z0-9_-]/g,"");return n.jsxs("figure",{className:"docs-figure panel stack stack--md dg",children:[n.jsx("figcaption",{className:"docs-figure__title",children:e}),n.jsxs("div",{className:"dg-art",role:"img","aria-labelledby":o,children:[n.jsx("span",{id:o,className:"sr-only",children:t}),s]}),a]})}function ko(){return n.jsxs("span",{className:"dg-arrow","aria-hidden":"true",children:[n.jsx("span",{className:"dg-arrow__down",children:n.jsx(E,{name:"arrow-down"})}),n.jsx("span",{className:"dg-arrow__across",children:n.jsx(E,{name:"arrow-right"})})]})}function Po({n:e,icon:t,title:s,children:a,wait:o=!1}){return n.jsxs("div",{className:`dg-node${o?" dg-node--wait":""}`,children:[n.jsxs("span",{className:"dg-node__head",children:[e!==void 0&&n.jsx("span",{className:"dg-n",children:e}),t&&n.jsx(E,{name:t}),n.jsx("span",{children:s})]}),a]})}function J({children:e}){return n.jsx("div",{className:"dg-lane",children:e})}function jo({n:e,children:t}){return n.jsx("div",{className:"dg-lanes",style:{"--lanes":e},children:t})}function Ao({icon:e,children:t}){return n.jsxs("div",{className:"dg-band",children:[n.jsx(E,{name:e}),n.jsx("p",{children:t})]})}function Lo(){const e=me(),t=e.text,s=[{title:"Buy",text:"Open to anyone. Each buy records what you paid and when."},{title:"Plead",text:`Write why you want to sell, and pay the ${t("oracle_fee")} oracle fee.`,stamp:"PENDING"},{title:"Judged",text:`${t("panel_size")} judges score it from 0 to ${t("max_score")}; ${t("quorum")} must agree. Your need or more: approved.`,stamp:"APPROVED"},{title:"Sell",text:`Sell what you asked for, in one go, within ${t("sell_window")}.`,stamp:"SOLD"}],a=`Appeal once within ${t("appeal_window")}. Or wait out the cooldown, ${t("cooldown")}, and plead again.`,o=`No answer within ${t("pending_expiry")}. The fee is spent, and you may plead again at once.`,l=`Every verdict restarts its clock. After ${t("deadman")} without one, the Cabal dies for good: no more pleas, and PLEA trades freely.`,r="The PLEA loop, left to right: "+s.map((c,u)=>`${u+1}, ${c.title}: ${c.text}`).join(" ")+` A plea can also end two other ways. Denied: ${a} No verdict: ${o} Under it all, the dead-man: ${l}`;return n.jsxs(Eo,{title:"Buy, plead, be judged, sell",alt:r,children:[n.jsx("div",{className:"dg-flow",children:s.map((c,u)=>n.jsxs(b.Fragment,{children:[u>0&&n.jsx(ko,{}),n.jsxs(Po,{n:u+1,title:c.title,children:[n.jsx("span",{className:"dg-node__text",children:c.text}),c.stamp&&n.jsx(H,{state:c.stamp,size:"sm"})]})]},c.title))}),n.jsx("p",{className:"small strong",children:"Or the plea ends another way:"}),n.jsxs(jo,{n:2,children:[n.jsxs(J,{children:[n.jsx(H,{state:"DENIED",size:"sm"}),n.jsx("p",{className:"small",children:a})]}),n.jsxs(J,{children:[n.jsx(H,{state:"NO VERDICT",size:"sm"}),n.jsx("p",{className:"small",children:o})]})]}),n.jsxs(Ao,{icon:"hourglass",children:[n.jsx("b",{children:"Under it all, the dead-man."})," ",l]})]})}const To=Object.assign({"../../../docs/01-start-here.md":Re,"../../../docs/02-buying.md":Fe,"../../../docs/03-plead.md":We,"../../../docs/04-your-bar.md":ze,"../../../docs/05-judges.md":Ue,"../../../docs/06-appeals.md":Ye,"../../../docs/07-letters.md":qe,"../../../docs/08-auto-sell.md":Ke,"../../../docs/09-objection.md":Ve,"../../../docs/10-seasons.md":Xe,"../../../docs/11-fees.md":Qe,"../../../docs/12-pool.md":Je,"../../../docs/13-dead-man.md":Ze,"../../../docs/14-keepers.md":et,"../../../docs/15-contracts.md":tt,"../../../docs/16-audits.md":at,"../../../docs/17-risks.md":nt,"../../../docs/18-glossary.md":ot}),Io=Object.fromEntries(Object.entries(Object.assign({"./diagrams/fee-bar.tsx":vo,"./diagrams/loop.tsx":Lo})).map(([e,t])=>[e.replace(/^.*\/|\.tsx$/g,""),t])),fe=e=>U(T,e),we=j.map(e=>{const t=To[`../../../docs/${ge(e)}`]??`# ${e.title}
`;return{...e,blocks:R(t,fe).blocks}}),Co=Ge(we,fe);function $o({slug:e,heading:t}){const{statics:s,s:a}=ve(),o=s??a?.constants,l=b.useCallback(p=>U(T,p,o),[o]),r=b.useMemo(()=>de(o),[o]),c=ye(e),u=c&&we.find(p=>p.slug===c.slug);b.useEffect(()=>{if(!t)return;const p=document.getElementById(B(t));p&&(p.scrollIntoView(),p.focus({preventScroll:!0}))},[c?.slug,t]);const i=b.useMemo(()=>u?Ne(u.blocks,l):[],[u,l]),{prev:h,next:d}=Ee(c?.slug||"");return n.jsx(go,{value:r,children:n.jsxs("div",{className:"docs",children:[n.jsx(No,{current:c?.slug}),n.jsxs("article",{className:"docs__page",children:[u?n.jsx("div",{className:"docs-body",children:n.jsx(Be,{tree:u.blocks,ctx:{slug:u.slug,num:l,diagrams:Io}})}):n.jsxs("div",{className:"stack stack--lg",children:[n.jsx(ke,{title:"Page not found"}),n.jsx(Pe,{title:`No docs page at #/docs/${e}`,action:{href:"#/docs",label:"Start here"},children:"Pick a page from the list, or search the docs."})]}),u&&n.jsxs("nav",{className:"docs-pager","aria-label":"Previous and next page",children:[h&&n.jsxs("a",{className:"docs-pager__link",href:A(h.slug),rel:"prev",children:[n.jsx("span",{className:"label",children:"Previous"}),n.jsxs("span",{className:"docs-pager__title",children:[n.jsx("span",{className:"docs-pager__back",children:n.jsx(E,{name:"arrow-right"})}),h.title]})]}),d&&n.jsxs("a",{className:"docs-pager__link docs-pager__link--next",href:A(d.slug),rel:"next",children:[n.jsx("span",{className:"label",children:"Next"}),n.jsxs("span",{className:"docs-pager__title",children:[d.title,n.jsx(E,{name:"arrow-right"})]})]})]})]}),u&&i.length>0&&n.jsxs("nav",{className:"docs__toc","aria-label":"On this page",children:[n.jsx("p",{className:"label",children:"On this page"}),n.jsx("ul",{children:i.map(p=>n.jsx("li",{className:p.level===3?"docs__toc-sub":void 0,children:n.jsx("a",{href:A(u.slug,p.id),"aria-current":p.id===t?"location":void 0,children:p.text})},p.id))})]})]})})}function No({current:e}){const[t,s]=b.useState(!1),a=b.useRef(null);b.useEffect(()=>s(!1),[e]);const o=j.findIndex(r=>r.slug===e),l=r=>{r.key==="Escape"&&t&&document.getElementById("docs-pages")?.contains(document.activeElement)?(s(!1),a.current?.focus()):r.key==="Escape"&&t&&document.activeElement===a.current&&s(!1)};return n.jsxs("div",{className:"docs__side",onKeyDown:l,children:[n.jsx(So,{}),n.jsxs("button",{ref:a,type:"button",className:"docs__toggle","aria-expanded":t,"aria-controls":"docs-pages",onClick:()=>s(!t),children:[n.jsx(E,{name:t?"x":"list"}),n.jsxs("span",{className:"docs__toggle-text",children:[n.jsx("span",{className:"strong",children:"Docs pages"}),o>=0&&n.jsxs("span",{className:"meta",children:[o+1," of ",j.length,": ",j[o].title]})]})]}),n.jsx("nav",{id:"docs-pages",className:`docs-nav${t?" is-open":""}`,"aria-label":"Docs pages",children:n.jsx("ol",{children:j.map(r=>n.jsx("li",{children:n.jsx("a",{href:A(r.slug),"aria-current":r.slug===e?"page":void 0,children:r.title})},r.slug))})})]})}function So(){const[e,t]=b.useState(""),s=b.useRef(null),a=b.useRef(null),o=8,l=b.useMemo(()=>$e(Co,e,1/0),[e]),r=l.slice(0,o),c=Y(e).join("").length>=2;b.useEffect(()=>{const h=()=>t("");return window.addEventListener("hashchange",h),()=>window.removeEventListener("hashchange",h)},[]);const u=()=>[...a.current?.querySelectorAll("a")||[]],i=(h,d)=>{const p=u();h.key==="ArrowDown"&&p.length?(h.preventDefault(),p[Math.min(d+1,p.length-1)].focus()):h.key==="ArrowUp"?(h.preventDefault(),d<=0?s.current?.focus():p[d-1].focus()):h.key==="Escape"&&e&&(h.preventDefault(),h.stopPropagation(),t(""),s.current?.focus())};return n.jsxs("form",{role:"search",className:"docs-search",onSubmit:h=>{h.preventDefault(),r[0]&&(location.hash=r[0].href)},children:[n.jsx("label",{className:"sr-only",htmlFor:"docs-q",children:"Search the docs"}),n.jsxs("div",{className:"input input--text",children:[n.jsx(E,{name:"magnifying-glass"}),n.jsx("input",{ref:s,id:"docs-q",className:"input__control",type:"search",placeholder:"Search the docs",autoComplete:"off",spellCheck:!1,value:e,"aria-describedby":"docs-q-count","aria-controls":c&&r.length?"docs-results":void 0,onChange:h=>t(h.target.value),onKeyDown:h=>i(h,-1)})]}),n.jsx("p",{id:"docs-q-count",className:"sr-only","aria-live":"polite",children:c?`${l.length||"No"} result${l.length===1?"":"s"}${l.length>o?`, the first ${o} shown`:""}`:""}),c&&(r.length?n.jsxs("ul",{ref:a,id:"docs-results",className:"docs-results","aria-label":"Search results",children:[r.map((h,d)=>n.jsx("li",{children:n.jsxs("a",{href:h.href,onKeyDown:p=>i(p,d),children:[n.jsx("span",{className:"docs-results__where",children:n.jsx(Do,{entry:h.entry})}),h.snippet&&n.jsx("span",{className:"docs-results__text",children:n.jsx(Go,{text:h.snippet,query:e})})]})},h.href)),l.length>o&&n.jsxs("li",{className:"small text-2 docs-results__more","aria-hidden":"true",children:[l.length," sections match; the first ",o," are shown. Add a word to narrow it."]})]}):n.jsxs("p",{className:"small text-2 docs-results__none",children:["No section mentions “",e.trim(),"”."]}))]})}const Do=({entry:e})=>n.jsxs(n.Fragment,{children:[e.page,e.heading&&n.jsxs(n.Fragment,{children:[n.jsx("span",{"aria-hidden":"true",children:" › "}),n.jsx("span",{className:"sr-only",children:", "}),e.heading]})]});function Go({text:e,query:t}){const s=Y(t).filter(o=>o.length>1);if(!s.length)return n.jsx(n.Fragment,{children:e});const a=new RegExp(`(${s.map(o=>o.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})`,"gi");return n.jsx(n.Fragment,{children:e.split(a).map((o,l)=>l%2?n.jsx("mark",{children:o},l):o)})}export{$o as default};
