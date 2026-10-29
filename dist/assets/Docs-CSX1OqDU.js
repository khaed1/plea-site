import{s as Pe,j as e,N as Te,h as V,I as k,d as N,r as x,C as re,D as L,f as Le,u as Ne,p as Ie,a as Ce,T as De,E as Se}from"./index-BshC06mA.js";const $e=t=>t.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"section",Me=/[\\`*_{}\[\]()#+\-.!|>:~<]/;function O(t,a=[]){const s=[],n=r=>{const l=s[s.length-1];l?.t==="text"?l.v+=r:r&&s.push({t:"text",v:r})};let o=0;for(;o<t.length;){const r=t[o];if(r==="\\"&&o+1<t.length&&Me.test(t[o+1])){n(t[o+1]),o+=2;continue}if(r==="{"&&t.startsWith("{{",o)){const l=t.indexOf("}}",o+2);if(l<0){a.push(`an unclosed placeholder: "${t.slice(o,o+24)}"`),n(t.slice(o));break}s.push({t:"num",key:t.slice(o+2,l).trim()}),o=l+2;continue}if(r==="`"){let l=1;for(;t[o+l]==="`";)l++;const c="`".repeat(l),p=t.indexOf(c,o+l);if(p>0){let i=t.slice(o+l,p);i.startsWith(" ")&&i.endsWith(" ")&&i.trim()&&(i=i.slice(1,-1)),s.push({t:"code",c:le(i,a)}),o=p+l;continue}n(c),o+=l;continue}if(r==="*"&&t[o+1]==="*"){const l=te(t,o+2,"**");if(l>0){s.push({t:"strong",c:O(t.slice(o+2,l),a)}),o=l+2;continue}}if((r==="*"||r==="_")&&t[o+1]!==r&&Ge(t,o)){const l=te(t,o+1,r);if(l>0){s.push({t:"em",c:O(t.slice(o+1,l),a)}),o=l+1;continue}}if(r==="["){const l=Oe(t,o);if(l>0&&t[l+1]==="("){const c=t.indexOf(")",l+2);if(c>0){s.push({t:"link",href:t.slice(l+2,c).trim(),c:O(t.slice(o+1,l),a)}),o=c+1;continue}}}n(r),o++}return s}function le(t,a){const s=[];let n=0;for(;n<t.length;){const o=t.indexOf("{{",n);if(o<0)break;const r=t.indexOf("}}",o+2);if(r<0){a.push(`an unclosed placeholder: "${t.slice(o,o+24)}"`);break}o>n&&s.push({t:"text",v:t.slice(n,o)}),s.push({t:"num",key:t.slice(o+2,r).trim()}),n=r+2}return n<t.length&&s.push({t:"text",v:t.slice(n)}),s}const ie=t=>t===void 0||/\s/.test(t),ce=t=>!!t&&/[\p{L}\p{N}]/u.test(t);function Ge(t,a){return ie(t[a+1])?!1:t[a]==="*"||!ce(t[a-1])}function te(t,a,s){let n=a;for(;n<t.length;){if(t[n]==="\\"){n+=2;continue}if(t[n]==="`"){const o=t.indexOf("`",n+1);if(o>0){n=o+1;continue}}if(t.startsWith(s,n)&&n>a&&!ie(t[n-1])){if(s==="*"&&t[n+1]==="*"){n+=2;continue}if(s==="_"&&ce(t[n+1])){n++;continue}return n}n++}return-1}function Oe(t,a){let s=0;for(let n=a;n<t.length;n++){if(t[n]==="\\"){n++;continue}if(t[n]==="["&&s++,t[n]==="]"&&--s===0)return n}return-1}const he=/^```\s*([\w-]*)\s*$/,de=/^(#{1,6})\s+(.*?)\s*#*\s*$/,ue=/^(?:-{3,}|\*{3,}|_{3,})\s*$/,H=/^:::\s*(.*?)\s*$/,B=/^>\s?/,P=/^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/,He=/^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/,pe=(t,a)=>/^\s*\|/.test(t[a])&&a+1<t.length&&He.test(t[a+1].trim()),me=(t,a)=>{const s=t[a];return he.test(s)||de.test(s)||ue.test(s)||H.test(s)||B.test(s)||pe(t,a)||P.test(s)&&P.exec(s)[1].length<2};function Y(t){let a=t.trim();a.startsWith("|")&&(a=a.slice(1)),a.endsWith("|")&&!a.endsWith("\\|")&&(a=a.slice(0,-1));const s=[];let n="",o=!1;for(let r=0;r<a.length;r++)a[r]==="\\"&&a[r+1]==="|"?(n+="|",r++):a[r]==="`"?(o=!o,n+="`"):a[r]==="|"&&!o?(s.push(n.trim()),n=""):n+=a[r];return s.push(n.trim()),s}function K(t,a=o=>o,s=0,n=new Map){const o=t.replace(/\r\n?/g,`
`).replace(/<!--[\s\S]*?-->/g,u=>u.replace(/[^\n]/g,"")).split(`
`),r=[],l=[],c=(u,m)=>l.push(`line ${s+u+1}: ${m}`),p=(u,m)=>{const f=[],w=O(u,f);for(const h of f)c(m,h);return w};let i=0;for(;i<o.length;){const u=o[i];if(!u.trim()){i++;continue}let m;if(m=he.exec(u)){const h=i++,b=[];for(;i<o.length&&!/^```\s*$/.test(o[i]);)b.push(o[i++]);i>=o.length&&c(h,"a code block (```) is never closed"),i++;const d=[];r.push({t:"pre",lang:m[1],c:le(b.join(`
`),d)});for(const _ of d)c(h,_);continue}if(m=de.exec(u)){const h=m[1].length;let b=m[2],d="";const _=/\s*\{#([a-z0-9-]+)\}\s*$/.exec(b);_&&(d=_[1],b=b.slice(0,_.index)),h>4&&c(i,`a level-${h} heading: the docs use # to #### only`);const y=p(b,i);d||=$e(A(y,a));const j=n.get(d)||0;n.set(d,j+1),j&&(d=`${d}-${j+1}`),r.push({t:"h",level:Math.min(h,4),id:d,c:y}),i++;continue}if(ue.test(u)){r.push({t:"hr"}),i++;continue}if(m=H.exec(u)){const[h,...b]=m[1].split(/\s+/),d=m[1].slice(h.length).trim();if(h==="diagram"){(!/^[a-z0-9-]+$/.test(d)||b.length!==1)&&c(i,`"::: diagram" needs one name in a-z, 0-9 and -: "${u.trim()}"`),r.push({t:"diagram",name:d,line:s+i+1}),i++;continue}if(h==="note"||h==="warn"||h==="builders"){const _=i++,y=[];for(;i<o.length&&!/^:::\s*$/.test(o[i]);)H.exec(o[i])?.[1]&&!/^diagram\b/.test(H.exec(o[i])[1])&&c(i,"a callout inside a callout: close the first with ::: before opening another"),y.push(o[i++]);i>=o.length&&c(_,`"::: ${h}" is never closed with a line of :::`),i++;const j=K(y.join(`
`),a,s+_+1,n);l.push(...j.errors),r.push({t:"callout",kind:h,title:d?p(d,_):void 0,c:j.blocks});continue}c(i,h?`an unknown block "::: ${h}" (use diagram, note, warn or builders)`:"a ::: that closes nothing"),i++;continue}if(B.test(u)){const h=i,b=[];for(;i<o.length&&B.test(o[i]);)b.push(o[i++].replace(B,""));const d=K(b.join(`
`),a,s+h,n);l.push(...d.errors),r.push({t:"quote",c:d.blocks});continue}if(pe(o,i)){const h=Y(u),b=Y(o[i+1]).map(y=>y.endsWith(":")?y.startsWith(":")?"c":"r":"l");b.length!==h.length&&c(i,"the table's --- line has a different number of columns from its head");const d=i;i+=2;const _=[];for(;i<o.length&&/^\s*\|/.test(o[i]);){const y=Y(o[i]);y.length!==h.length&&c(i,`a table row with ${y.length} cells under a head of ${h.length}`),_.push(y.map(j=>p(j,i))),i++}r.push({t:"table",align:b,head:h.map(y=>p(y,d)),rows:_});continue}if((m=P.exec(u))&&m[1].length<2){const h=Be(o,i,p,c);r.push(h.list),i=h.next;continue}const f=i,w=[];for(;i<o.length&&o[i].trim()&&(i===f||!me(o,i));)w.push(o[i++].trim());r.push({t:"p",c:p(w.join(" "),f)})}return{blocks:r,errors:l}}const S=t=>/\d/.test(t);function Be(t,a,s,n){const o=P.exec(t[a]),r={t:"list",ordered:S(o[2]),start:parseInt(o[2])||1,items:[]};let l=a,c=-1,p;const i=[],u=()=>{p&&i.push(p),p=void 0};for(;l<t.length;){const m=t[l];if(!m.trim()){let w=l+1;for(;w<t.length&&!t[w].trim();)w++;const h=w<t.length?P.exec(t[w]):null;if(h&&(h[1].length>=2?r.items.length>0:S(h[2])===r.ordered)){l=w;continue}break}const f=P.exec(m);if(f&&f[1].length<2){if(S(f[2])!==r.ordered)break;u();const w={c:[]};r.items.push(w),p={item:w,parts:[f[3]],line:l},c=-1,l++;continue}if(f&&r.items.length){const w=r.items[r.items.length-1];c<0&&(c=f[1].length),f[1].length>c+1&&n(l,"a list nested more than one level: the docs nest lists one level only"),w.sub||(w.sub={t:"list",ordered:S(f[2]),start:parseInt(f[2])||1,items:[]}),u();const h={c:[]};w.sub.items.push(h),p={item:h,parts:[f[3]],line:l},l++;continue}if(f||me(t,l))break;p&&p.parts.push(m.trim()),l++}u();for(const m of i)m.item.c=s(m.parts.join(" "),m.line);return{list:r,next:l}}function A(t,a=s=>s){return t.map(s=>s.t==="text"?s.v:s.t==="num"?a(s.key)??s.key:A(s.c,a)).join("")}const Re=(t,a)=>t.filter(s=>s.t==="h"&&(s.level===2||s.level===3)).map(s=>({id:s.id,level:s.level,text:A(s.c,a)}));function fe(t){const a=/^(?:\.\/)?(\d\d)-([a-z0-9-]+)\.md(?:#([a-z0-9-]+))?$/.exec(t);return a?`#/docs/${a[2]}${a[3]?`/${a[3]}`:""}`:t}function R(t,a=18){const s=t<0n,n=s?-t:t,o=10n**BigInt(a),r=(n/o).toLocaleString("en-US"),l=(n%o).toString().padStart(a,"0").replace(/0+$/,"");return(s?"−":"")+r+(l?"."+l:"")}const Fe=t=>R(t,2);function F(t,a){let s;try{if(a==null||a==="")return;s=BigInt(a)}catch{return}switch(t){case"int":return s.toLocaleString("en-US");case"imd":return`${R(s)} IMD`;case"plea":return`${R(s)} PLEA`;case"duration":return Pe(Number(s));case"bps":return`${Fe(s)}%`;case"multiplier":return`×${R(s,4)}`;default:return}}const ae=new Set;function Z(t,a,s){const n=a==="_meta"?void 0:t[a];if(!n)return;const o=n.chain?s?.[n.chain]:void 0;if(o==null)return n.text;let r=!0;try{r=n.value!==null&&BigInt(o)===BigInt(n.value)}catch{r=!1}return!r&&!ae.has(a)&&(ae.add(a),console.warn(`Docs: ${n.chain} on chain is ${String(o)}, numbers.json's ${a} says ${n.value}; the page shows the chain's.`)),n.format==="text"?n.text:F(n.format,o)??n.text}function We(t,a,s){const n=a==="_meta"?void 0:t[a];if(!n)return;const o=n.chain?s?.[n.chain]:void 0;try{return o!=null?BigInt(o):n.value===null?void 0:BigInt(n.value)}catch{return}}const we=(t,a)=>t.items.map(s=>A(s.c,a)+(s.sub?" "+we(s.sub,a):"")).join(" ");function X(t,a){switch(t.t){case"p":case"pre":return A(t.c,a);case"list":return we(t,a);case"table":return[t.head,...t.rows].map(s=>s.map(n=>A(n,a)).join(" ")).join(" ");case"quote":return t.c.map(s=>X(s,a)).join(" ");case"callout":return[t.kind==="builders"?"For builders":"",t.title?A(t.title,a):"",...t.c.map(s=>X(s,a))].join(" ");default:return""}}function Ye(t,a){const s=[];for(const n of t){let o={slug:n.slug,page:n.title,heading:"",id:"",text:"",order:s.length};const r=[],l=()=>{o.text=r.join(" ").replace(/\s+/g," ").trim(),(o.heading||o.text)&&s.push({...o,order:s.length}),r.length=0};for(const c of n.blocks)if(!(c.t==="h"&&c.level===1)){if(c.t==="h"){l(),o={slug:n.slug,page:n.title,heading:A(c.c,a),id:c.id,text:"",order:0};continue}r.push(X(c,a))}l()}return s}const I=t=>t.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,""),ee=t=>I(t).split(/[^\p{L}\p{N}%.×-]+/u).filter(a=>a.length>0),Ue=(t,a)=>{let s=0,n=t.indexOf(a);for(;n>=0&&s<5;)s++,n=t.indexOf(a,n+a.length);return s},_e=t=>t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),se=(t,a)=>new RegExp(`(^|[^\\p{L}\\p{N}])${_e(a)}`,"u").test(t),ne=(t,a)=>new RegExp(`(^|[^\\p{L}\\p{N}])${_e(a)}($|[^\\p{L}\\p{N}])`,"u").test(t);function ze(t,a,s=8){const n=ee(a);if(n.join("").length<2)return[];const o=n.join(" "),r=[];for(const l of t){const c=I(l.heading),p=I(l.page),i=I(l.text);if(!n.every(m=>c.includes(m)||p.includes(m)||i.includes(m)))continue;let u=n.length>1&&c.includes(o)?20:0;for(const m of n)u+=(se(c,m)?10:0)+(se(p,m)?5:0)+Ue(i,m)+(ne(c,m)||ne(i,m)?2:0);r.push({e:l,score:u})}return r.sort((l,c)=>c.score-l.score||l.e.order-c.e.order),r.slice(0,s).map(({e:l})=>({entry:l,href:fe(`#/docs/${l.slug}${l.id?`/${l.id}`:""}`),snippet:qe(l.text,n)}))}function qe(t,a,s=120){const n=I(t),o=Math.min(...a.map(c=>n.indexOf(c)).filter(c=>c>=0),1/0);if(t.length<=s)return t;let r=o===1/0?0:Math.max(0,o-Math.floor(s/3));r>0&&(r=t.indexOf(" ",r)+1||r);let l=Math.min(t.length,r+s);return l<t.length&&(l=t.lastIndexOf(" ",l)>r?t.lastIndexOf(" ",l):l),(r>0?"…":"")+t.slice(r,l)+(l<t.length?"…":"")}const Ve={note:{kind:"info",icon:"info",title:void 0},warn:{kind:"warn",icon:"warning",title:void 0},builders:{kind:"builders",icon:"seal-check",title:"For builders"}};function J(t,a){const s=a.num(t);if(s===void 0)throw Error(`The docs name an unknown number {{${t}}}.`);return s}function v(t,a,s="i"){return t.map((n,o)=>{const r=`${s}.${o}`;switch(n.t){case"text":return n.v;case"num":{const l=J(n.key,a);return l.split(" ").length<=3?e.jsx("span",{className:"nowrap",children:l},r):l}case"strong":return e.jsx("strong",{children:v(n.c,a,r)},r);case"em":return e.jsx("em",{children:v(n.c,a,r)},r);case"code":return e.jsx("code",{children:v(n.c,a,r)},r);case"link":{const l=fe(n.href);return/^https?:\/\//.test(l)?e.jsxs("a",{href:l,target:"_blank",rel:"noreferrer",className:"docs-ext",children:[v(n.c,a,r),e.jsx(k,{name:"arrow-square-out"}),e.jsx("span",{className:"sr-only",children:" (opens in a new tab)"})]},r):e.jsx("a",{href:l,children:v(n.c,a,r)},r)}}})}function be(t,a,s){const n=t.items.map((o,r)=>e.jsxs("li",{children:[v(o.c,a,`${s}.${r}`),o.sub&&be(o.sub,a,`${s}.${r}.s`)]},r));return t.ordered?e.jsx("ol",{start:t.start===1?void 0:t.start,children:n},s):e.jsx("ul",{children:n},s)}const oe={l:void 0,c:"c",r:"r"};function Q(t,a,s="b"){return t.map((n,o)=>{const r=`${s}.${o}`;switch(n.t){case"h":{const l=v(n.c,a,r);if(n.level===1)return e.jsx("div",{className:"page-title",children:e.jsx("h1",{children:l})},r);if(n.level===4)return e.jsx("h4",{id:V(n.id),tabIndex:-1,children:l},r);const c=n.level===2?"h2":"h3",p=A(n.c,i=>J(i,a));return e.jsxs("div",{className:`docs-h docs-h--${n.level}`,children:[e.jsx(c,{id:V(n.id),tabIndex:-1,children:l}),e.jsx("a",{className:"docs-anchor",href:N(a.slug,n.id),"aria-label":`Link to ${p}`,children:e.jsx(k,{name:"link"})})]},r)}case"p":return e.jsx("p",{children:v(n.c,a,r)},r);case"list":return be(n,a,r);case"table":{const l=n.head.map(c=>A(c,p=>J(p,a))).join(", ");return e.jsx("div",{className:"table-wrap docs-table",role:"region","aria-label":`Table: ${l}`,tabIndex:0,children:e.jsxs("table",{className:"table",children:[e.jsx("thead",{children:e.jsx("tr",{children:n.head.map((c,p)=>e.jsx("th",{scope:"col",className:oe[n.align[p]||"l"],children:v(c,a,`${r}.h${p}`)},p))})}),e.jsx("tbody",{children:n.rows.map((c,p)=>e.jsx("tr",{children:c.map((i,u)=>e.jsx("td",{className:oe[n.align[u]||"l"],children:v(i,a,`${r}.${p}.${u}`)},u))},p))})]})},r)}case"quote":return e.jsx("blockquote",{className:"docs-quote stack stack--sm",children:Q(n.c,a,r)},r);case"pre":return e.jsx("pre",{className:"docs-code",children:e.jsx("code",{children:v(n.c,a,r)})},r);case"hr":return e.jsx("hr",{},r);case"diagram":{const l=a.diagrams[n.name];if(!l)throw Error(`The docs name an unknown diagram "${n.name}".`);return e.jsx("div",{className:"docs-diagram",children:e.jsx(l,{})},r)}case"callout":{const l=Ve[n.kind],c=n.title?v(n.title,a,`${r}.t`):l.title;return e.jsx("div",{className:`docs-callout docs-callout--${n.kind}`,children:e.jsx(Te,{kind:l.kind,icon:l.icon,title:c,children:e.jsx("div",{className:"stack stack--sm",children:Q(n.c,a,r)})})},r)}}})}function Ke({tree:t,ctx:a}){return e.jsx(e.Fragment,{children:Q(t,a)})}const Xe=`# Start here

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
`,Je=`# Buying

## In short

Anyone can buy PLEA, from the moment trading opens. You pay IMD and the pool sends the PLEA straight to your wallet.

The first {{launch_window}} are the launch window: buys pay an extra fee that falls from {{launch_extra}} to 0%, and one buy may take at most {{launch_max_buy}}.

Buy on the site's [Buy](#/buy) page. While the Cabal lives, many other apps cannot buy PLEA.

## How it works

1. **Trading opens.** From {{start}} anyone may open trading; the owner may open it earlier. The pool opens at a market cap of {{market_cap}}, about {{seed_price}} a PLEA.
2. **You pay IMD, you get PLEA.** Every trade pays a fee: {{fee_imd}} of the IMD that reaches the pool, and {{fee_burn}} of the PLEA, burned. Of the IMD part, {{fee_cashback}} comes back to you as staked IMD. See [Fees](11-fees.md).
3. **The launch window.** For the first {{launch_window}}, a buy also pays a launch fee. It starts at {{launch_extra}} of the IMD that reaches the pool and falls in a straight line to 0%. It stays in the pool, for the buy wall.
4. **The launch cap.** In the same window, one buy may take at most {{launch_max_buy}} from the pool. That is {{launch_max_buy_value}} at the opening price.
5. **Your buy record.** Each buy adds to your record: the IMD you paid, fees included, the PLEA you got, and their average buy time. Your pleas' fact scores are read from it. See [Your bar](04-your-bar.md).
6. **The PLEA stays with you.** While the Cabal lives, PLEA cannot be sent from wallet to wallet. What you buy stays in the wallet that bought it, until you sell it through a plea or the Cabal dies.

## In a picture

::: diagram launch-fee

## Example

You buy with 100 IMD, 30 minutes after trading opens.

1. **The launch fee.** {{launch_extra}} × ({{launch_window}} − 30 minutes) ÷ {{launch_window}} = 46.67%. The contract rounds it down to whole hundredths of a percent: 46.66%.
2. **The whole fee.** The usual {{fee_imd}} + 46.66% = 48.66% of the IMD that reaches the pool.
3. **What reaches the pool.** 100 ÷ 1.4866 = 67.268 IMD. The fee is the rest: 100 − 67.268 = 32.732 IMD.
4. **Where the fee goes.** {{fee_cashback}} of 67.268 = 0.336 IMD back to you, as staked IMD. {{fee_owner}} = 0.673 IMD to the owner. {{fee_prize}} = 0.168 IMD to the season's prize pot. The rest stays in the pool for the buy wall: 32.732 − 0.336 − 0.673 − 0.168 = 31.555 IMD.
5. **What you get.** If the price were still the opening {{seed_price}}, 67.268 IMD would buy about 3.36 million PLEA, a little less after the price moves. That is under the {{launch_max_buy}} cap. Then {{fee_burn}} of it is burned.
6. **Your record.** It grows by 100 IMD paid and the PLEA you received, bought at minute 30.

After the launch window the same 100 IMD pays only the usual {{fee_imd}}: 100 ÷ 1.02 = 98.039 IMD reaches the pool, and the fee is 1.961 IMD.

At the very open the whole fee is {{launch_open_fee}} of what reaches the pool. That is {{launch_open_fee_of_payment}} of what you pay.

## Good to know

- **Buy on the site.** While the Cabal lives, the pool sends the PLEA straight to the buyer. It only takes buys that say who the buyer is and spend an exact amount of IMD. Apps, aggregators and routers that expect the PLEA to come back to them, or cannot name the buyer, fail. The site's [Buy](#/buy) page is built for this pool.
- **"Get exactly this much PLEA" is refused.** While the Cabal lives you choose how much IMD to spend, never how much PLEA to get. The site says: "Exact-output buys are unavailable while the Cabal lives. Use the exact-input Buy control."
- **No buyer, no buy.** While the Cabal lives, a buy that names no buyer fails. The site says: "The buy needs your wallet as recipient. Reconnect in the top bar and try again."
- **Too big for the launch window.** A buy that would take more than {{launch_max_buy}} in the window fails. The site says: "This buy exceeds the launch cap. Lower the amount or wait for the launch window to end."
- **Too early.** Before trading opens, every buy fails. The site says: "Trading is not open yet. Wait until the pool is seeded."
- **The very first buys.** While the pool holds almost none of its own IMD (under {{payout_reserve}}, with the buy's fee), a buy's cashback, owner and prize shares stay in the pool instead.
- **Your record moves with you.** A sale takes its share out of your record, so the rest keeps its cost and age. PLEA you received, not bought, has no record: it counts as held since trading opened.
- **After the Cabal dies.** Buys work like on any pool: other apps can route to it once they list it. A buy that names no buyer gets no cashback.

::: builders
The fee and the launch rules live in the pool's hook, \`PleaHook\`: \`beforeSwap\` and \`afterSwap\`, \`launchExtraBps()\`, the constants \`LAUNCH_WINDOW\`, \`LAUNCH_EXTRA_BPS\`, \`LAUNCH_MAX_BUY\` and \`IMD_FEE_BPS\`, and the event \`FeesTaken\`. \`basisOf(wallet)\` returns a wallet's buy record: IMD spent, PLEA held and the average buy time.

The buyer is read from \`hookData\` (\`abi.encode(address)\`), else from the router's \`msgSender()\`, else from a plain wallet calling the pool manager. Refusals: \`RecipientRequired\`, \`ExactOutputBuyRefused\`, \`BuyTooLarge\`, \`NotSeeded\`, and \`NotEnoughGas\` when a trade reaches the hook with less than {{swap_min_gas}} gas. The site buys through Uniswap's Universal Router with Permit2.

Source: [PleaHook.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/PleaHook.sol), at the commit IMD deployed.
:::
`,Qe=`# Selling: plead

## In short

While the Cabal lives, the only way to sell PLEA is a plea. You write why you want to sell, choose how much, and pay the {{oracle_fee}} oracle fee.

The Cabal usually answers within minutes. Approved: you have {{sell_window}} to sell. Denied: you may appeal once, or wait and try again.

## How it works

1. **Write your plea.** 1 to {{max_plea_bytes}} bytes of text, in any language, on one line. Tell the judges why you want to sell. See [The judges](05-judges.md) for what they score.
2. **Choose the amount.** At least {{min_share}} of your PLEA and at most {{max_share}}, and never more than {{max_sell}}.
3. **Check your need.** The [Plead](#/plead) page shows your fact score and your need before you send. If your need is above {{max_score}}, not even a perfect plea can pass, so the contract refuses it and you pay nothing. See [Your bar](04-your-bar.md).
4. **Send it.** One transaction pays the {{oracle_fee}} oracle fee in IMD (the site asks you to approve it once). Your plea, its amount, your fact score and your need are stored on Ethereum.
5. **Wait for the verdict.** {{panel_size}} judges score your plea. If the score is at least your need, it is approved; if not, denied.
6. **Approved: sell.** Press Sell now within {{sell_window}}. The whole amount sells in one go, for at least the minimum you set. Miss the window and the approval lapses: nothing is sold, but its points still count.
7. **Denied: appeal or wait.** You may appeal once within {{appeal_window}}. See [Appeals](06-appeals.md).
8. **No verdict.** If no verdict comes within {{pending_expiry}}, anyone may close the plea. You may plead again at once. The fee is spent.
9. **Cooldown.** After a sale, a denial or a lapse, your next plea waits {{cooldown}}. A lapse counts from the moment of the approval.

Prefer not to sell by hand? Tick the [auto-sell box](08-auto-sell.md) and anyone may sell it for you. Or plead without the site, by [letter](07-letters.md).

## In a picture

::: diagram plea-states

## Example

You hold 3,000,000 PLEA, bought this morning, now worth a little less than you paid. The price is flat. You plead to sell 200,000 PLEA.

1. **The limits.** At least {{min_share}} of 3,000,000 = 30,000 PLEA. At most {{max_share}} = 1,500,000 PLEA, which is under {{max_sell}}. 200,000 fits.
2. **Your need.** You sell 6.67%: {{fact_share_top}} points. Held under a day: {{held_points_0}}. At a loss: {{profit_points_loss}}. Flat price: {{trend_flat}}. Fact score {{fact_share_top}} + {{held_points_0}} + {{profit_points_loss}} + {{trend_flat}} = 34, so your need is {{pass_mark}} − 34 = 35.
3. **12:00 UTC.** You send the plea and pay {{oracle_fee}}. It is PENDING.
4. **12:04.** The Cabal answers: 37 vs need 35. APPROVED. You may sell until 12:11, {{sell_window}} after the approval.
5. **12:06.** You press Sell now. SOLD. Your next plea can come from 16:06, {{cooldown}} after the sale.

The same plea could have ended three other ways:

- **Not sold by 12:11.** LAPSED. Your next plea can come from 16:04, {{cooldown}} after the approval.
- **33 vs need 35 at 12:04.** DENIED. You may appeal until 16:04, or plead again from 16:04.
- **No answer by 12:20**, {{pending_expiry}} after you sent it. NO VERDICT. Anyone may close it, and you may plead again at once. The {{oracle_fee}} is spent.

## Good to know

- **Text the contract refuses.** Line breaks, invisible characters (zero-width spaces, direction marks), some emoji that carry an invisible style character, and the markers "[PLEA" and "[OBJECTION" in any case. The checks under the text box flag them. The site says: "Your plea contains refused text. Fix the checks under the text box."
- **Bytes, not letters.** English letters take one byte each. Accented letters, Greek, Cyrillic, Arabic and Hebrew take two, Chinese, Japanese and Korean three, emoji four. So {{max_plea_bytes}} bytes is about {{max_plea_bytes}} English letters, or {{max_plea_bytes}} ÷ 3 = about 93 Chinese characters.
- **Too much or too little.** The site says: "The amount is over the limit. Reduce it or press Max." or "The amount is below the minimum. Increase it to the minimum shown."
- **Big holders.** Above {{min_share_cap_balance}}, {{min_share}} of your PLEA is more than {{max_sell}}. Then the least and the most a plea may sell are both {{max_sell}}.
- **A need above {{max_score}}.** The site says: "This plea cannot pass: your need is above {{max_score}}. Sell a smaller share or wait for your facts to improve." Nothing is paid.
- **One plea at a time.** While a plea waits for its verdict, or is approved and not yet sold, a new one is refused: "You already have an open plea. Open its status page first."
- **The cooldown.** A plea sent too soon is refused: "Your cooldown is still running. Wait until the time shown before sending another plea."
- **Too late to sell.** After the window: "The sell window closed. The plea has lapsed; its points may still count."
- **The price moved.** A sale that would get less than your minimum is refused, and you may try again inside the window: "The price moved beyond your minimum. Refresh the quote or raise your slippage."
- **The sale pays the usual fee.** {{fee_total}} of every trade, as on a buy. Your buy record shrinks by the share you sold. See [Fees](11-fees.md).
- **The fee is spent.** The {{oracle_fee}} pays the judges, whatever the verdict.
- **Your need is fixed when you send.** The facts use hourly prices, so the need the site shows changes only with a new hour, a change in your balance or another day held.
- **When the Cabal is not watching.** Before trading opens and after the Cabal dies, a plea is refused: "The Cabal is not taking pleas. Check whether trading has opened or the Cabal has died." After the death you sell like any token, with no plea.
- **Public for good.** Your plea's text is stored on Ethereum next to your wallet.

::: builders
\`CabalGate.submitSell(amount, text)\` pleads; it pulls \`ORACLE_FEE\` in IMD from the caller, so approve the gate first. \`factScore(seller, amount)\` gives the fact score it will use. \`executeSell(minOut)\` sells the caller's approved plea; \`expire(id)\` closes a plea with no verdict once it is stale. \`getPlea(id)\` returns the stored plea; its \`status\` is \`Pending\`, \`Approved\`, \`Denied\`, \`Executed\` (sold), \`Lapsed\` or \`Expired\` (no verdict). A lapse is written when the seller next pleads; until then an unsold approval past its window still reads \`Approved\`.

Errors: \`BadPleaText\`, \`AmountTooLarge\`, \`AmountTooSmall\`, \`CannotPass(need)\`, \`PendingExists\`, \`Cooldown(until)\`, \`CabalNotWatching\`, \`NotApproved\`, \`WindowLapsed\`, \`SlippageExceeded(out, minOut)\`. Events: \`PleaSubmitted\`, \`Verdict\`, \`SellExecuted\`, \`PleaLapsed\`, \`PleaExpired\`, \`PleaFailed\`.

Source: [CabalGate.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/CabalGate.sol), at the commit IMD deployed.
:::
`,Ze=`# Your bar

## In short

Every plea has a bar: the need. The judges' score must reach it.

Your need is {{pass_mark}} minus your fact score. The contract reads the fact score from four facts about your sale. Better facts, a lower need.

## How it works

1. **Share sold.** The plea's amount as a share of your PLEA, rounded up to a hundredth of a percent. At most {{share_band_top}}: {{fact_share_top}} points. At most {{share_band_mid}}: {{fact_share_mid}}. More: {{fact_share_low}}.
2. **Held.** How long ago you bought, on average, weighted by the PLEA each buy got. Under a day: {{held_points_0}}. {{held_day_1}} day: {{held_points_1d}}. {{held_day_3}} days: {{held_points_3d}}. {{held_day_7}} days: {{held_points_7d}}.
3. **Profit or loss.** The PLEA your buys got, at the latest hourly price, against the IMD they cost you, fees included. At a loss: {{profit_points_loss}}. Up at most {{profit_band_50}}: {{profit_points_50}}. At most {{profit_band_200}}: {{profit_points_200}}. At most {{profit_band_500}}: {{profit_points_500}}. At most {{profit_band_1000}}: {{profit_points_1000}}. More: {{profit_points_more}}.
4. **PLEA you received.** PLEA no buy of yours covers, from the airdrop or a prize, counts as held since trading opened, at {{received_profit}} for profit. A plea bigger than your buy record mixes the two, weighted by PLEA and rounded.
5. **The 24-hour trend.** The latest hourly price against the price 24 hours earlier. Up more than {{trend_band}}: {{trend_up}}. Within {{trend_band}}, or no price from 24 hours ago: {{trend_flat}}. Down more than {{trend_band}}: {{trend_down}}.
6. **Your need.** Add the four parts: that is your fact score, from {{fact_min}} to {{fact_max}}. Your need is {{pass_mark}} minus it, so it is never below {{need_min}}.
7. **The verdict.** The judges score from 0 to {{max_score}}. A score at or above your need is approved.

Selling less, holding longer, selling at a loss and selling into a rising price all lower your need. Big profits raise it.

## In a picture

::: diagram need

## Example

Two real pleas from Sepolia test run 9 (test token, 5-hour seasons). The same wallet (0x6828…8F4f) asked to sell the same 90,000 PLEA, about 3% of its PLEA, and both pleas scored 33. Its only buy was on Wed 21 Oct at 14:42 UTC, and its PLEA was worth less than it paid.

Plea #7 was sent on Wed 21 Oct at 18:59 UTC, 4 h 17 min after the buy. Plea #23 was sent on Sat 24 Oct at 20:16 UTC, 3 days 5 h 34 min after it.

| Part | #7 | #23 |
| --- | --- | --- |
| Share sold, about 3% | {{fact_share_top}} | {{fact_share_top}} |
| Held | {{held_points_0}} | {{held_points_3d}} |
| Profit: at a loss | {{profit_points_loss}} | {{profit_points_loss}} |
| Trend: no change | {{trend_flat}} | {{trend_flat}} |
| **Fact score** | **34** | **36** |
| **Need: {{pass_mark}} − fact** | **35** | **33** |
| Judges' score | 33 | 33 |
| Approved? | No, 2 short | Yes |

The same score was denied on Wednesday and approved on Saturday. Nothing about the plea changed: the wallet had held for three days, so its bar fell by 2.

> #7: "Your honours, today I paid two oracle fees and lost both with good grace. Tonight I ask to sell 90,000 PLEA, about 3% of my bag, to refill the gas those fees drained. I bought in with my own imdTEST, I hold an IMD seat, and the rest of my PLEA stays for the seasons."

> #23: "Honoured Cabal, this afternoon you let me sell 90,000 PLEA and I kept my word: the rest is still here. Tonight I ask for 90,000 more, about 3% of my bag, to cover the oracle fees of this week. I keep over 2.5M PLEA and my IMD seat for the seasons ahead."

::: note Recomputed with today's rules
Run 9 used a pass mark of 71 and holding points of 0, 2, 4 and 7. Its needs for these two pleas were 37 and 33, and its verdicts were the same. The needs above use the launched rules: {{pass_mark}}, and {{fact_held_points}}.
:::

## Good to know

- **The typical seller.** A plea of at most {{share_band_top}} of airdropped PLEA, with a flat price, needs {{pass_mark}} − ({{fact_share_top}} + held + {{received_profit}} + {{trend_flat}}). With held {{held_points_0}}, {{held_points_1d}}, {{held_points_3d}} or {{held_points_7d}}, that is 39, 38, 37 and 36 on days 0, {{held_day_1}}, {{held_day_3}} and {{held_day_7}} after trading opened. With the price up more than {{trend_band}}, the trend counts {{trend_up}} instead of {{trend_flat}}: 34, 33 and 32 from day {{held_day_1}}.
- **Hourly prices only.** Profit and trend use the price before each hour's first trade, never the price of the moment. A big trade cannot move your need within its own hour.
- **A need above {{max_score}} cannot pass.** With a fact score under {{fact_needed}}, the plea is refused before any fee: "This plea cannot pass: your need is above {{max_score}}. Sell a smaller share or wait for your facts to improve."
- **Buying more moves your record.** A new buy pulls your average buy time toward now, which can cost holding points. It also changes your cost.
- **Selling shrinks your record.** A sale takes its share of the PLEA and the cost out of your record. The average buy time stays.
- **Exactly {{share_band_top}} still counts as {{share_band_top}}.** The share is rounded up, so a plea of exactly {{share_band_top}} scores {{fact_share_top}}, and one PLEA more does not. A [letter](07-letters.md) pleads {{letter_share}}, rounded down, so it always scores {{fact_share_top}}.
- **Appeals keep their band.** An appeal uses the smaller of its own share and the denied plea's. See [Appeals](06-appeals.md).
- **Fixed when sent.** The need is stored with the plea and never changes after.

::: builders
\`CabalGate.factScore(seller, amount)\` returns the fact score for a plea of \`amount\` now; \`getPlea(id)\` returns a plea's stored \`factScore\` and \`need\`. The facts come from \`PleaHook.basisOf(wallet)\` (IMD spent, PLEA held, average buy time), \`latestPrice()\` and \`price24hAgo()\`, the hook's hourly checkpoints (\`PriceCheckpoint\` events). A plea whose need is above \`MAX_PLEA_SCORE\` reverts \`CannotPass(need)\`.

Source: [CabalGate.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/CabalGate.sol) (\`_factScoreAt\`, \`_heldPoints\`) and [PleaHook.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/PleaHook.sol) (\`_updateBasis\`, \`_checkpoint\`), at the commit IMD deployed.
:::
`,et=`# The judges

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
`,tt=`# Appeals

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
`,at=`# Letters

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
`,st=`# The auto-sell box

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
`,nt=`# Objection!

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
`,ot=`# Seasons and prizes

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
`,rt=`# Fees

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
`,lt=`# The pool: cap, burn and the buy wall

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
`,it=`# The dead-man

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
`,ct=`# Keepers

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
`,ht=`# Contracts and owner

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
`,dt=`# Audits

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
`,ut=`# Risks and FAQ

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
`,pt=`# Glossary

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
`,mt={deployment:"PLEA launch #2647 on Ethereum (block 26,293,890)",source:"khaed1/plea, the branch IMD deployed for the Ethereum launch, @ 42e0f855875786a953e945e528e9d7f2724a5352 (its src/; every file:line below is there)",status:"Checked 2026-10-29 by the numbers agent: every entry re-read in src/ at 42e0f85 and launch.json; every chain-bound value read from the launched contracts (read-only calls); trading not open yet (PleaHook.seeded false, PleaLaunch.opened false), so seed-time values (the cap's daily allowance) are computed",format:"key -> {text: words the docs print, value: raw on-chain value as a decimal string or null, chain: the site's constant key con(s, 'Contract.NAME') or null, format: int|imd|plea|duration|bps|multiplier|text, source: file:line, what: one line}. Whenever value is set and format is not text, text is format(value) exactly (the unit tests check it)"},ft={text:"69",value:"69",chain:"CabalGate.PASS_MARK",format:"int",source:"src/CabalGate.sol:122; need = PASS_MARK - fact score :433",what:"need = pass mark - fact score; a plea is approved when the judges' score is at least its need (:554)"},wt={text:"45",value:"45",chain:"CabalGate.MAX_PLEA_SCORE",format:"int",source:"src/CabalGate.sol:123; CannotPass :433-434; ScoreOutOfRange :551-552",what:"the judges' scale is 0 to 45; a plea whose need is above 45 is refused (CannotPass)"},_t={text:"30",value:"30",chain:"CabalGate.PANEL_SIZE",format:"int",source:"src/CabalGate.sol:124; checked :545-550",what:"judges on a panel (the Cabal)"},bt={text:"17",value:"17",chain:"CabalGate.QUORUM",format:"int",source:"src/CabalGate.sol:125; at least 17 agreed :545-550",what:"judges who must agree for a verdict"},xt={text:"0.5 IMD",value:"500000000000000000",chain:"CabalGate.ORACLE_FEE",format:"imd",source:"src/CabalGate.sol:110; paid to IMD's Intake in _ask :452-463",what:"a plea's or an appeal's oracle fee, in IMD; spent whatever happens (approved, denied, no verdict)"},yt={text:"0.35 IMD",value:"350000000000000000",chain:"CabalGate.APPEAL_POOL_SHARE",format:"imd",source:"src/CabalGate.sol:111; paid to the buy wall by _payAppeal :396-401 (PleaHook.fundWall)",what:"an appeal's extra payment, to the buy wall"},gt={text:"0.85 IMD",value:"850000000000000000",chain:null,format:"imd",source:"src/CabalGate.sol:110-111 (0.5 + 0.35), appeal :347-350",what:"what an appeal costs in IMD: the oracle fee plus the wall share"},vt={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:377-378, :382 (NotDenied, AlreadyAppealed); an expired appeal frees its slot :508",what:"appeals per denied plea; an appeal itself cannot be appealed; an appeal that got no verdict may be sent again inside the window, paying again"},Et={text:"7 minutes",value:"420",chain:"CabalGate.EXECUTE_WINDOW",format:"duration",source:"src/CabalGate.sol:112; WindowLapsed :620; lapse :492-496",what:"time to sell after an approval; after it the approval lapses"},kt={text:"4 hours",value:"14400",chain:"CabalGate.COOLDOWN",format:"duration",source:"src/CabalGate.sol:113; _requireCanPlead :469-476, _cooldown :479-482; a lapse is timed from the approval :494",what:"no new plea for this long after a sale, a denial or a lapsed approval (a lapse counts from the approval's time); none after a plea that got no verdict"},At={text:"4 hours",value:"14400",chain:"CabalGate.COOLDOWN",format:"duration",source:"src/CabalGate.sol:379 (AppealClosed)",what:"an appeal must be sent within this long after the denial"},jt={text:"20 minutes",value:"1200",chain:"CabalGate.PENDING_EXPIRY",format:"duration",source:"src/CabalGate.sol:114; expire :514-521; a later verdict is refused :540-542",what:"a plea with no verdict after this (or once IMD's Intake closed it without one) can be closed by anyone: no cooldown, the fee is spent"},Pt={text:"280",value:"280",chain:"CabalGate.MAX_PLEA_BYTES",format:"int",source:"src/CabalGate.sol:115; _validateText :824-865",what:"a plea's text, 1 to 280 bytes of UTF-8 (the number alone: a page writes the word bytes after it)"},Tt={text:"2,500,000 PLEA",value:"2500000000000000000000000",chain:"CabalGate.MAX_SELL",format:"plea",source:"src/CabalGate.sol:116; _checkAmount :525-530",what:"most PLEA one plea may sell"},Lt={text:"50%",value:"5000",chain:"CabalGate.MAX_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:117; :526",what:"most of your balance one plea may sell"},Nt={text:"1%",value:"100",chain:"CabalGate.MIN_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:118-119; :527-529 (AmountTooSmall)",what:"least share of your balance a plea may sell (or 2,500,000 PLEA when 1% is more)"},It={text:"250,000,000 PLEA",value:"250000000000000000000000000",chain:null,format:"plea",source:"src/CabalGate.sol:523-528 (1% of 250,000,000 = MAX_SELL)",what:"above this balance the 1% minimum is capped at 2,500,000 PLEA, so the least and the most a plea may sell meet"},Ct={text:"33 hours",value:"118800",chain:"CabalGate.DEADMAN",format:"duration",source:"src/CabalGate.sol:147, :200-204; launch.json CabalGate argument 7 = 118800; reset only by a signed plea or appeal verdict :557",what:"the Cabal dies after this long without a signed verdict on a plea or an appeal, for good"},Dt={text:"15 days",value:"1296000",chain:"Seasons.SEASON",format:"duration",source:"src/Seasons.sol:83,107 = CabalGate.SEASON (src/CabalGate.sol:146; launch.json CabalGate argument 6 = 1296000)",what:"one season; seasons run back to back from the moment trading opens"},St={text:"selling at most 20%: 16 points; at most 35%: 9; more: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:270 (share rounded up :260-264; an appeal takes the lesser of its share and the original's :266-268, :427-431)",what:"share-sold part of the fact score"},$t={text:"20%",value:"2000",chain:null,format:"bps",source:"src/CabalGate.sol:270",what:"selling at most this share of your PLEA scores the top share points"},Mt={text:"35%",value:"3500",chain:null,format:"bps",source:"src/CabalGate.sol:270",what:"selling at most this share (and more than 20%) scores the middle share points"},Gt={text:"16",value:"16",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for selling at most 20% of your PLEA"},Ot={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for more than 20% and at most 35%"},Ht={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for more than 35%"},Bt={text:"held under a day: 0; a day: 1; 3 days: 2; 7 days: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:300-305; the time is the buy-weighted average of your buys (src/PleaHook.sol:731-739)",what:"holding-time part of the fact score"},Rt={text:"0",value:"0",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for PLEA held under a day"},Ft={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least a day"},Wt={text:"2",value:"2",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least 3 days"},Yt={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least 7 days"},Ut={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:304 (held >= 1 days)",what:"days held for the first holding point (a page writes day or days after it)"},zt={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:304 (held >= 3 days)",what:"days held for the second holding point"},qt={text:"7",value:"7",chain:null,format:"int",source:"src/CabalGate.sol:304 (held >= 7 days)",what:"days held for the third and last holding point"},Vt={text:"at a loss: 13; gain at most 50%: 12; at most 200%: 10; at most 500%: 8; at most 1,000%: 6; more: 4",value:null,chain:null,format:"text",source:"src/CabalGate.sol:279-288 (the recorded PLEA at the latest hourly price vs the IMD the buys cost, fees included: src/PleaHook.sol:566, :738)",what:"profit part of the fact score"},Kt={text:"13",value:"13",chain:null,format:"int",source:"src/CabalGate.sol:283",what:"profit points at a loss"},Xt={text:"12",value:"12",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 50%"},Jt={text:"10",value:"10",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 200%"},Qt={text:"8",value:"8",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 500%"},Zt={text:"6",value:"6",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 1,000%"},ea={text:"4",value:"4",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain above 1,000%"},ta={text:"50%",value:"5000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g * 2 <= spent)",what:"first profit band edge"},aa={text:"200%",value:"20000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 2)",what:"second profit band edge"},sa={text:"500%",value:"50000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 5)",what:"third profit band edge"},na={text:"1,000%",value:"100000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 10)",what:"fourth profit band edge"},oa={text:"PLEA no buy record covers (airdrop, prizes) counts as held since trading opened, at profit 9",value:null,chain:null,format:"text",source:"src/CabalGate.sol:274-278, :289-292 (PLEA-weighted mean of the record's points and the received points, rounded to the nearest point)",what:"received PLEA"},ra={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:291",what:"profit points for PLEA no buy record covers"},la={text:"24-hour price up more than 2%: 9; within 2% (or no price 24 hours ago): 5; down more than 2%: 0",value:null,chain:null,format:"text",source:"src/CabalGate.sol:294-297; the hour checkpoints src/PleaHook.sol:294-309",what:"trend part of the fact score"},ia={text:"2%",value:"200",chain:null,format:"bps",source:"src/CabalGate.sol:296-297 (latest > ago * 102 / 100; latest * 100 >= ago * 98)",what:"how far the price must move in 24 hours to count as up or down"},ca={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:296",what:"trend points when the price rose more than 2% in 24 hours"},ha={text:"5",value:"5",chain:null,format:"int",source:"src/CabalGate.sol:295, :297",what:"trend points within 2%, or when no price from 24 hours ago exists (the first day)"},da={text:"0",value:"0",chain:null,format:"int",source:"src/CabalGate.sol:294-297",what:"trend points when the price fell more than 2%"},ua={text:"1 hour",value:"3600",chain:null,format:"duration",source:"src/PleaHook.sol:278-309, :1057-1067; src/CabalGate.sol:247-248",what:"prices for the fact score are hourly checkpoints (the price before each hour's first trade), never the spot price"},pa={text:"48",value:"48",chain:null,format:"int",source:"src/PleaHook.sol:195-198, :300-308",what:"hours of checkpoints kept; the 24-hour price is the newest checkpoint at least 24 and at most 48 hours old"},ma={text:"41",value:"41",chain:null,format:"int",source:"16 + 3 + 13 + 9 (src/CabalGate.sol:270-297)",what:"highest fact score"},fa={text:"7",value:"7",chain:null,format:"int",source:"3 + 0 + 4 + 0 (src/CabalGate.sol:270-297)",what:"lowest fact score"},wa={text:"28",value:"28",chain:null,format:"int",source:"69 - 41",what:"lowest possible need"},_a={text:"24",value:"24",chain:null,format:"int",source:"69 - 45 (src/CabalGate.sol:433-434)",what:"a fact score under this gives a need above 45: the plea is refused before any fee is paid"},ba={text:"sincerity 0-12, craft 0-12, respect 0-9, loyalty 0-12; anchors 0-10 empty/abusive/off-topic, 11-25 sincere but plain, 26-35 specific and well made, 36-45 memorable",value:null,chain:null,format:"text",source:'src/CabalGate.sol:131-134 DEFINITIONS ("plea")',what:"what the judges score"},xa={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for sincerity (an honest, specific reason to sell)"},ya={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for craft (wit, originality, quality of writing, in any language)"},ga={text:"9",value:"9",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for respect (for the Cabal and the holders)"},va={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for loyalty (commitment to PLEA, such as keeping the rest)"},Ea={text:"0-10 empty, abusive or off-topic; 11-25 sincere but plain; 26-35 specific and well made; 36-45 memorable",value:null,chain:null,format:"text",source:'src/CabalGate.sol:134 ("plea")',what:"the judges' anchors"},ka={text:"5",value:"5",chain:null,format:"int",source:'src/CabalGate.sol:134 ("content")',what:"hate, harassment, sexual content, anything illegal, or details that identify another person score 0 to this"},Aa={text:"0",value:"0",chain:null,format:"int",source:'src/CabalGate.sol:134 ("manipulation")',what:"what manipulation scores (posing as a system, made-up rules, demands for a score, threats, offers, hidden instructions)"},ja={text:"20%",value:"2000",chain:null,format:"bps",source:"src/Letterbox.sol:111; _plead :297-300",what:"a letter pleads this share of your PLEA (at most 2,500,000 PLEA)"},Pa={text:"1,000 PLEA",value:"1000000000000000000000",chain:null,format:"plea",source:"src/Letterbox.sol:113; :300 (LetterTooSmall)",what:"a letter whose 20% is smaller is refused"},Ta={text:"5,000 PLEA",value:"5000000000000000000000",chain:null,format:"plea",source:"1,000 / 20% (src/Letterbox.sol:111-113, :297-300)",what:"a letter from a smaller balance is refused (its 20% is under 1,000 PLEA)"},La={text:"0.25 IMD",value:"250000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:115; paid on delivery :424; returned by settle :453",what:"paid to whoever delivers an approved letter or auto-sell plea; returned to you when no sale happens (and to you when you send SELL)"},Na={text:"0.75 IMD",value:"750000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:525-528 feesFor(false) = TIP + ORACLE_FEE (Ethereum buys the oracle fee: PleaLaunch.mintOracleFee() is false)",what:"the IMD a letter or auto-sell plea buys with your PLEA: the 0.5 IMD oracle fee and the 0.25 IMD tip"},Ia={text:"1.1 IMD",value:"1100000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:525-528 feesFor(true) = TIP + APPEAL_FEE + ORACLE_FEE",what:"the IMD an appeal letter buys with your PLEA: 0.5 + 0.35 + 0.25"},Ca={text:"110%",value:"11000",chain:null,format:"bps",source:"src/Letterbox.sol:133-134, :527; unspent PLEA comes back at once :386-387",what:"the fee sale may spend PLEA worth at most this share of the IMD it buys, at the hourly price"},Da={text:"10%",value:"1000",chain:null,format:"bps",source:"src/Letterbox.sol:135-136; :304 (FeeTooHigh)",what:"a letter's or auto-sell plea's fees may take at most this share of your PLEA"},Sa={text:"8.25 IMD",value:"8250000000000000000",chain:null,format:"imd",source:"0.75 IMD x 110% / 10% (src/Letterbox.sol:304, :525-528)",what:"the least your PLEA must be worth, at the hourly price, to send a letter or an auto-sell plea"},$a={text:"12.1 IMD",value:"12100000000000000000",chain:null,format:"imd",source:"1.1 IMD x 110% / 10% (src/Letterbox.sol:361-363; or the fees fit in 110% of the original plea's amount)",what:"the least your PLEA must be worth for an appeal letter, unless its fees fit in 110% of the original plea's amount"},Ma={text:"0.7 IMD",value:"700000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:120-124; _requireWorthTheFee :428-433 (TooSmallForTheFee)",what:"a letter or auto-sell plea worth less at the hourly price is refused"},Ga={text:"95%",value:"9500",chain:null,format:"bps",source:"src/Letterbox.sol:127-129; _deliver :405-406",what:"a delivered sale must get at least 95% of its hourly value after the hook's sale fees"},Oa={text:"92.86%",value:null,chain:null,format:"text",source:"95% x (100% - 2.25%) = 92.8625% (src/Letterbox.sol:129-132, :405-406)",what:"the least a delivered sale pays, as a share of the plea's hourly value"},Ha={text:"0.35 IMD",value:"350000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:116-119; _deliver :415-421 (never more than the sale; letters do not pay it)",what:"taken from a delivered auto-sell sale, to the season's prize pot"},Ba={text:"APPEAL followed by your text; SELL; NAME followed by a name; any other text is a new plea",value:null,chain:null,format:"text",source:"src/Letterbox.sol:204-216, :495-519",what:"what a letter's first word does"},Ra={text:"3",value:"3",chain:null,format:"int",source:"src/Letterbox.sol:260-261 (BadName)",what:"shortest display name"},Fa={text:"20",value:"20",chain:null,format:"int",source:"src/Letterbox.sol:260-261 (BadName)",what:"longest display name"},Wa={text:"a-z, 0-9 and _",value:null,chain:null,format:"text",source:"src/Letterbox.sol:262-265",what:"the characters a display name may use"},Ya={text:"cabal, admin, imd, plea, owner",value:null,chain:null,format:"text",source:"src/Letterbox.sol:266-270",what:"names nobody may take"},Ua={text:"20 minutes",value:"1200",chain:"Tribunal.OBJECTION_WINDOW",format:"duration",source:"src/Tribunal.sol:126-127; :263 (WindowClosed)",what:"time after an approval to object; the plea's season points wait for it"},za={text:"0.5 IMD",value:"500000000000000000",chain:"Tribunal.ORACLE_FEE",format:"imd",source:"src/Tribunal.sol:130; :291-301",what:"an objection's oracle fee, spent whatever the ruling"},qa={text:"0.35 IMD",value:"350000000000000000",chain:"Tribunal.STAKE",format:"imd",source:"src/Tribunal.sol:131; :290; settle :370-381",what:"back if sustained or void; to the plea's season prize pot if overruled"},Va={text:"0.85 IMD",value:"850000000000000000",chain:null,format:"imd",source:"src/Tribunal.sol:130-131 (0.5 + 0.35)",what:"what an objection costs in IMD"},Ka={text:"2",value:"2",chain:"Tribunal.MARGIN",format:"int",source:"src/Tribunal.sol:134-135; sustained when score + 2 < need :330",what:"sustained only when the new score is more than this below the need"},Xa={text:"2",value:"2",chain:"Tribunal.MAX_OBJECTIONS",format:"int",source:"src/Tribunal.sol:132-133; :268-279",what:"objections per plea, each from a different wallet; both may wait at once"},Ja={text:"20 minutes",value:"1200",chain:"Tribunal.PENDING_EXPIRY",format:"duration",source:"src/Tribunal.sol:128-129; expire :361-368",what:"an objection with no ruling after this is void (stake back, fee spent)"},Qa={text:"280",value:"280",chain:"Tribunal.MAX_TEXT_BYTES",format:"int",source:"src/Tribunal.sol:136; :483-486",what:"an objection's text, in UTF-8 bytes (a page writes the word bytes after it)"},Za={text:"60",value:"60",chain:"Seasons.MIN_POINTS",format:"int",source:"src/Seasons.sol:60; :339, :444",what:"points to qualify for a prize"},es={text:"25",value:"25",chain:"Seasons.TOP",format:"int",source:"src/Seasons.sol:61; :338",what:"ranks paid each season"},ts={text:"3",value:"3",chain:null,format:"int",source:"src/Seasons.sol:86-87, :265-281",what:"your best pleas that count in a season"},as={text:"135",value:"135",chain:null,format:"int",source:"3 x 45 (src/Seasons.sol:265-281)",what:"most points a wallet can have in a season without a seat"},ss={text:"162",value:"162",chain:null,format:"int",source:"3 x 54 (src/Seasons.sol:133-135, :265-281)",what:"most points with an IMD seat"},ns={text:"4.5% for 1st down to 3.5% for 25th, in a straight line (rounded to whole basis points), 100% in all",value:null,chain:null,format:"text",source:"src/Seasons.sol:74-76 SHARES; shareBps :117-119 (on chain: 450 ... 350, sum 10,000)",what:"prize shares"},os={text:"4.5%",value:"450",chain:null,format:"bps",source:"src/Seasons.sol:76; Seasons.shareBps(0) = 450 on chain",what:"the 1st place's share of the pot and of the bonus"},rs={text:"3.5%",value:"350",chain:null,format:"bps",source:"src/Seasons.sol:76; Seasons.shareBps(24) = 350 on chain",what:"the 25th place's share"},ls={text:"4.50, 4.46, 4.42, 4.38, 4.33, 4.29, 4.25, 4.21, 4.17, 4.12, 4.08, 4.04, 4.00, 3.96, 3.92, 3.88, 3.83, 3.79, 3.75, 3.71, 3.67, 3.62, 3.58, 3.54, 3.50",value:null,chain:null,format:"text",source:"src/Seasons.sol:76; Seasons.shareBps(0..24) on chain",what:"every rank's share in percent, 1st to 25th"},is={text:"1 hour",value:"3600",chain:"Seasons.CLOSE_GRACE",format:"duration",source:"src/Seasons.sol:62-64; :326 (NotReady)",what:"after a season ends, before anyone can close it"},cs={text:"6",value:"6",chain:"Seasons.BONUS_SEASONS",format:"int",source:"src/Seasons.sol:65-66; :350",what:"seasons that also pay the PLEA bonus"},hs={text:"10,000,000 PLEA",value:"10000000000000000000000000",chain:"Seasons.BONUS_PER_SEASON",format:"plea",source:"src/Seasons.sol:67; _payBonus :437-460",what:"PLEA bonus per season, same shares and same 60-point bar; unpaid shares are burned"},ds={text:"60,000,000 PLEA",value:"60000000000000000000000000",chain:null,format:"plea",source:"6 x 10,000,000 = Seasons' 6% (src/PLEA.sol:105)",what:"all six seasons' bonus"},us={text:"×1.2",value:"12000",chain:"Seasons.SEAT_MULTIPLIER_BPS",format:"multiplier",source:"src/Seasons.sol:68-71; pointsFor :131-135 (rounded down; read when the plea is recorded)",what:"points for an IMD seat holder; points only, never the need or the 60-point bar"},ps={text:"a score of 45 counts 54 points",value:null,chain:null,format:"text",source:"45 x 12,000 / 10,000 = 54 (src/Seasons.sol:134)",what:"the seat multiplier on the top score"},ms={text:"2.25%",value:"225",chain:null,format:"bps",source:"src/PleaHook.sol:73-79 (IMD_FEE_BPS 200 of the trade's IMD + PLEA_BURN_BPS 25 of its PLEA)",what:"every trade's fee"},fs={text:"2%",value:"200",chain:"PleaHook.IMD_FEE_BPS",format:"bps",source:"src/PleaHook.sol:78; a share of the IMD that reaches or leaves the pool :470-472, :551",what:"the IMD part of every trade's fee"},ws={text:"0.5%",value:"50",chain:"PleaHook.CASHBACK_BPS",format:"bps",source:"src/PleaHook.sol:74; :598; _payCashback :758-781",what:"back to the trader as staked IMD (sIMD, imd/acc's Stacker); stays in the pool when no trader is known (after the death)"},_s={text:"1%",value:"100",chain:"PleaHook.OWNER_BPS",format:"bps",source:"src/PleaHook.sol:75; :599, :619",what:"to the owner (the hook's fixed fee receiver)"},bs={text:"0.25%",value:"25",chain:"PleaHook.PRIZE_BPS",format:"bps",source:"src/PleaHook.sol:76; :600-601 (to pool liquidity once the Cabal is dead)",what:"to the season's prize pot while the Cabal lives"},xs={text:"0.25%",value:"25",chain:"PleaHook.POOL_BPS",format:"bps",source:"src/PleaHook.sol:77; :618, :630-633",what:"kept in the pool for the buy wall"},ys={text:"0.25%",value:"25",chain:"PleaHook.PLEA_BURN_BPS",format:"bps",source:"src/PleaHook.sol:79; :594, :644-654",what:"of the trade's PLEA, burned"},gs={text:"1.75%",value:"175",chain:null,format:"bps",source:"0.5% + 1% + 0.25% (src/PleaHook.sol:598-602)",what:"the IMD fee parts paid out of the pool (cashback, owner, prize)"},vs={text:"90 minutes",value:"5400",chain:"PleaHook.LAUNCH_WINDOW",format:"duration",source:"src/PleaHook.sol:80; launchExtraBps :311-317; max buy :721-725",what:"the launch window after trading opens"},Es={text:"70%",value:"7000",chain:"PleaHook.LAUNCH_EXTRA_BPS",format:"bps",source:"src/PleaHook.sol:81; :311-317, :485-487; a share of the IMD that reaches the pool :470-472; kept for the wall :618",what:"the extra fee on buys at the open; it falls in a straight line to 0% over the launch window; it stays in the pool for the buy wall"},ks={text:"70% at the open, 58.33% after 15 minutes, 46.66% after 30, 35% after 45, 23.33% after 60, 11.66% after 75, 0% from 90",value:null,chain:null,format:"text",source:"7,000 x (5,400 - seconds since the open) / 5,400 basis points, rounded down (src/PleaHook.sol:311-317)",what:"the launch fee over the window"},As={text:"72%",value:"7200",chain:null,format:"bps",source:"2% + 70% (src/PleaHook.sol:485-487)",what:"the IMD fee on a buy at the open, as a share of the IMD that reaches the pool"},js={text:"41.86%",value:null,chain:null,format:"text",source:"7,200 / 17,200 = 41.86% (src/PleaHook.sol:470-472: fee = amount x rate / (10,000 + rate))",what:"the fee at the open as a share of the IMD a buyer pays"},Ps={text:"5,000,000 PLEA",value:"5000000000000000000000000",chain:"PleaHook.LAUNCH_MAX_BUY",format:"plea",source:"src/PleaHook.sol:82; _checkMaxBuy :721-725 (BuyTooLarge); the pool's PLEA out before the burn :474, :538",what:"most PLEA one buy may take from the pool in the launch window"},Ts={text:"0.00002 IMD",value:"20000000000000",chain:null,format:"imd",source:"20,000 IMD / 1,000,000,000 PLEA (src/PleaHook.sol:384-389; the opening tick is rounded up to the 60-tick grid :394-396, about 0.23% higher)",what:"the opening price of one PLEA"},Ls={text:"about 100 IMD",value:null,chain:null,format:"text",source:"5,000,000 x 0.00002 IMD (before price impact and fees)",what:"what the largest launch-window buy is worth at the opening price"},Ns={text:"2 IMD",value:"2000000000000000000",chain:"PleaHook.PAYOUT_RESERVE",format:"imd",source:"src/PleaHook.sol:83-86; :603-617 (PayoutsToPool)",what:"the opening exception: while the pool's own IMD plus a buy's fee is under this and the pool cannot pay out, that buy's cashback, owner and prize shares join the pool instead"},Is={text:"20,000 IMD",value:"20000000000000000000000",chain:"PleaHook.MARKET_CAP_IMD",format:"imd",source:"src/PleaHook.sol:87-88; seed :376-424",what:"the market cap trading opens at"},Cs={text:"14,000 IMD",value:"14000000000000000000000",chain:null,format:"imd",source:"src/PleaLaunch.sol:211-214 (BelowAgreedMarketCap)",what:"on Ethereum, seed refuses a hook whose opening market cap is under this"},Ds={text:"15 days",value:"1296000",chain:null,format:"duration",source:"src/PleaLaunch.sol:211-212 (BelowAgreedTiming)",what:"on Ethereum, seed refuses seasons shorter than this"},Ss={text:"33 hours",value:"118800",chain:null,format:"duration",source:"src/PleaLaunch.sol:211-212 (BelowAgreedTiming)",what:"on Ethereum, seed refuses a dead-man shorter than this"},$s={text:"900,000 PLEA",value:"900000000000000000000000",chain:"PleaHook.CAP_FLOOR",format:"plea",source:"src/PleaHook.sol:89; :803",what:"the inventory cap never falls below this"},Ms={text:"15",value:"15",chain:"PleaHook.CAP_DECAY_DAYS",format:"int",source:"src/PleaHook.sol:90-93; capDecayPerDay :409",what:"the cap may fall from the seeded PLEA to its floor in this many days at the fastest (a page writes the word days after it)"},Gs={text:"about 54.6 million PLEA",value:null,chain:null,format:"text",source:"(820,000,000 - 900,000) / 15 = 54,606,666 (src/PleaHook.sol:409; the seeded amount is a hair under 820,000,000: the 1-in-a-million rounding margin :1084)",what:"how far the cap may fall per day at most (fixed at the seed)"},Os={text:"1 PLEA",value:"1000000000000000000",chain:"PleaHook.MIN_TRIM",format:"plea",source:"src/PleaHook.sol:94; :331-335, :815",what:"the least excess above the cap that is trimmed"},Hs={text:"1 IMD",value:"1000000000000000000",chain:"PleaHook.WALL_THRESHOLD",format:"imd",source:"src/PleaHook.sol:95; pendingRebalance :337-340",what:"kept IMD worth a rebalance"},Bs={text:"1,000 PLEA",value:"1000000000000000000000",chain:"PleaHook.WALL_MIN_FILL",format:"plea",source:"src/PleaHook.sol:96; :339",what:"PLEA bought by the wall worth a rebalance (it is burned then)"},Rs={text:"700",value:"700",chain:"PleaHook.WALL_GUARD_TICKS_PER_DAY",format:"int",source:"src/PleaHook.sol:178-185; _updateWallGuard :1022-1055",what:"ticks a day the wall's ceiling may rise toward a higher price (it falls at once); a page writes the word ticks after it"},Fs={text:"about 7.25%",value:null,chain:null,format:"text",source:"1.0001 ^ 700 = 1.0725",what:"the wall guard's daily step as a price change"},Ws={text:"200",value:"200",chain:null,format:"int",source:"src/PleaHook.sol:177; _observeTick :1002-1014",what:"ticks a block the hook's reference price may move (about 2%)"},Ys={text:"60",value:"60",chain:"PleaHook.TICK_SPACING",format:"int",source:"src/PleaHook.sol:106",what:"the pool's tick spacing"},Us={text:"0",value:"0",chain:"PleaHook.LP_FEE",format:"int",source:"src/PleaHook.sol:105",what:"the pool's own swap fee: every fee is the hook's"},zs={text:"1,400,000",value:"1400000",chain:null,format:"int",source:"creditGas 400,000 + SWAP_RESERVE 1,000,000 (src/PleaHook.sol:99-102, :452; launch.json PleaLaunch argument 8 = 400000)",what:"gas a trade must still have when it reaches the hook, or it reverts NotEnoughGas"},qs={text:"1,000,000,000 PLEA",value:"1000000000000000000000000000",chain:"PLEA.TOTAL_SUPPLY",format:"plea",source:"src/PLEA.sol:27; minted once in init :98-108",what:"fixed supply"},Vs={text:"820,000,000 PLEA",value:"820000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:104 (82%); on chain PLEA.balanceOf(hook) = 820,000,000 before the seed",what:"the pool's PLEA: all of it is the pool's liquidity"},Ks={text:"60,000,000 PLEA",value:"60000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:105 (6%); on chain PLEA.balanceOf(Seasons)",what:"Seasons' PLEA bonus"},Xs={text:"120,000,000 PLEA",value:"120000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:106 (12%); on chain PLEA.balanceOf(PleaDistributor)",what:"the distributor's PLEA (the swarm's 10% and a 2% airdrop, paid by one Merkle root)"},Js={text:"82%",value:"8200",chain:null,format:"bps",source:"src/PLEA.sol:104",what:"the pool's share of the supply"},Qs={text:"6%",value:"600",chain:null,format:"bps",source:"src/PLEA.sol:105",what:"Seasons' share"},Zs={text:"12%",value:"1200",chain:null,format:"bps",source:"src/PLEA.sol:106",what:"the distributor's share"},en={text:"10%",value:"1000",chain:null,format:"bps",source:"src/PLEA.sol:10-11, src/PleaDistributor.sol:10 (comments: the code pays whatever the owner's root lists)",what:"the swarm's part of the distributor's 12%"},tn={text:"2%",value:"200",chain:null,format:"bps",source:"src/PLEA.sol:10-11, src/PleaDistributor.sol:10 (comments: the code pays whatever the owner's root lists)",what:"the airdrop's part of the distributor's 12%"},an={text:"82% to the pool (820,000,000), 6% to Seasons (60,000,000), 12% to the distributor (120,000,000)",value:null,chain:null,format:"text",source:"src/PLEA.sol:95-108; minted at deployHook (block 26,294,113)",what:"supply at launch"},sn={text:"Tue 24 Nov 2026, 15:00 UTC",value:"1795532400",chain:"PleaLaunch.START",format:"text",source:"launch.json PleaLaunch argument 9 = 1795532400; src/PleaLaunch.sol:69-70, :206",what:"from this time anyone may open trading (seed); the owner may open it earlier"},nn={text:"0x5BF3597216f9019Cf10CF680783289Efc8639Bf0",value:null,chain:null,format:"text",source:"launch.json $owner; on chain PLEA.owner(), PleaHook.owner(), PleaDistributor.owner()",what:"PLEA's owner, the hook's fee receiver and the distributor's owner"},on={text:"#2647",value:null,chain:null,format:"text",source:"IMD's launch record (README of the site)",what:"IMD's launch number"},rn={text:"26,293,890",value:"26293890",chain:null,format:"int",source:"Ethereum block of the launch transaction (PLEA's Launched event)",what:"the launch block"},ln={text:"26,294,106",value:"26294106",chain:null,format:"int",source:"PleaLaunch's LetterboxDeployed event",what:"the Letterbox's block"},cn={text:"26,294,111",value:"26294111",chain:null,format:"int",source:"PleaLaunch's TribunalDeployed event",what:"the Tribunal's block"},hn={text:"26,294,113",value:"26294113",chain:null,format:"int",source:"PleaLaunch's HookDeployed event (PLEA minted its supply here)",what:"the hook's block"},dn={text:"0x1F158929496162b53fB232536468948e25170aB3",value:null,chain:null,format:"text",source:"launch #2647",what:"PLEA (the token)"},un={text:"0x39AC882a1161EA19aCb6FBDd7A5835D96CF876EB",value:null,chain:null,format:"text",source:"launch #2647; PLEA.gate()",what:"CabalGate (pleas, verdicts, sales)"},pn={text:"0xF7c024F7Bc96Cf152a572F6E184318ff6d380738",value:null,chain:null,format:"text",source:"launch #2647; PLEA.seasons()",what:"Seasons (points, prizes)"},mn={text:"0x97fAcE21C7a9f3b64D0f4E0bF21861721fBBfE3E",value:null,chain:null,format:"text",source:"launch #2647; PLEA.distributor()",what:"PleaDistributor (the 12%)"},fn={text:"0x9e75eabf8d1c905a07a0C99bb9eC9430a065358F",value:null,chain:null,format:"text",source:"launch #2647; PLEA.launcher()",what:"PleaLaunch (wiring, seed)"},wn={text:"0x00423EbaEd03445Fc1452d9A79A51E3C0DFdab5f",value:null,chain:null,format:"text",source:"PleaLaunch.letterbox(); PLEA.letterbox()",what:"Letterbox (letters, the auto-sell box)"},_n={text:"0x1aA665eB420F28103324daAAf034DE13EE6f53D9",value:null,chain:null,format:"text",source:"PleaLaunch.tribunal()",what:"Tribunal (Objection!)"},bn={text:"0xf1122bc96AdeA8768CFf2badf02b6D4594f928Cc",value:null,chain:null,format:"text",source:"PleaLaunch.hook(); PLEA.hook()",what:"PleaHook (the pool's hook: fees, cap, wall)"},xn={text:"0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7",value:null,chain:null,format:"text",source:"launch.json CabalGate arguments 3-4",what:"IMD (the pool's other token and the fee token)"},yn={text:"0x000000000004444c5dc75cB358380D2e3dE08A90",value:null,chain:null,format:"text",source:"launch.json PleaLaunch argument 5; PLEA.poolManager()",what:"Uniswap v4's PoolManager"},gn={text:"0x06909F672301F28A810f78cfe7a754851269F4F0",value:null,chain:null,format:"text",source:"launch.json PleaLaunch argument 7",what:"imd/acc's Stacker (pays the cashback as sIMD)"},vn={text:"0xa43e6F75ee006411F79Ac1C84120606C2330DE82",value:null,chain:null,format:"text",source:"launch.json CabalGate argument 2",what:"IMD's Intake (asks the Cabal)"},En={text:"0x5598Aa9146215Bc13eb26f2c692Ad1461Fd32982",value:null,chain:null,format:"text",source:"launch.json CabalGate argument 5",what:"the key that signs the Cabal's answers"},kn={text:"0x0000eC93127BAA929E58E97dd0095A2BFb38ec1D",value:null,chain:null,format:"text",source:"launch.json Seasons argument 4; Seasons.seat()",what:"the IMD seat NFT (identity.md) behind the seat multiplier"},An={text:"12",value:"12",chain:null,format:"int",source:"audit/FINDINGS.md Rounds table (rounds 1-12; 9-12 on the Ethereum code, the last on 571ae80, round 12)",what:"IMD swarm audit rounds"},jn={text:"852",value:"852",chain:null,format:"int",source:"README.md:299 (written 2026-10-17 for run 8.5's code; not re-counted for 42e0f85)",what:"the README's test count (unit, fuzz, invariant, adversarial, fork)"},Pn={_meta:mt,pass_mark:ft,max_score:wt,panel_size:_t,quorum:bt,oracle_fee:xt,appeal_wall_share:yt,appeal_total:gt,appeals_per_plea:vt,sell_window:Et,cooldown:kt,appeal_window:At,pending_expiry:jt,max_plea_bytes:Pt,max_sell:Tt,max_share:Lt,min_share:Nt,min_share_cap_balance:It,deadman:Ct,season_length:Dt,fact_share_bands:St,share_band_top:$t,share_band_mid:Mt,fact_share_top:Gt,fact_share_mid:Ot,fact_share_low:Ht,fact_held_points:Bt,held_points_0:Rt,held_points_1d:Ft,held_points_3d:Wt,held_points_7d:Yt,held_day_1:Ut,held_day_3:zt,held_day_7:qt,fact_profit_bands:Vt,profit_points_loss:Kt,profit_points_50:Xt,profit_points_200:Jt,profit_points_500:Qt,profit_points_1000:Zt,profit_points_more:ea,profit_band_50:ta,profit_band_200:aa,profit_band_500:sa,profit_band_1000:na,fact_received:oa,received_profit:ra,fact_trend:la,trend_band:ia,trend_up:ca,trend_flat:ha,trend_down:da,checkpoint_interval:ua,price_ring_hours:pa,fact_max:ma,fact_min:fa,need_min:wa,fact_needed:_a,judge_rubric:ba,judge_sincerity_max:xa,judge_craft_max:ya,judge_respect_max:ga,judge_loyalty_max:va,judge_anchors:Ea,judge_content_max:ka,judge_manipulation:Aa,letter_share:ja,min_letter:Pa,letter_min_balance:Ta,runner_tip:La,letter_fee:Na,letter_appeal_fee:Ia,fee_cap:Ca,max_fee_share:Da,letter_min_value:Sa,letter_appeal_min_value:$a,min_sale_value:Ma,delivery_min_out:Ga,delivery_floor:Oa,auto_sell_fee:Ha,letter_commands:Ba,name_min_length:Ra,name_max_length:Fa,name_chars:Wa,name_reserved:Ya,objection_window:Ua,objection_fee:za,objection_stake:qa,objection_total:Va,objection_margin:Ka,max_objections:Xa,objection_expiry:Ja,objection_bytes:Qa,min_points:Za,top:es,best_count:ts,max_points:as,max_points_seat:ss,shares:ns,share_first:os,share_last:rs,shares_list:ls,close_grace:is,bonus_seasons:cs,bonus_per_season:hs,bonus_total:ds,seat_multiplier:us,seat_example:ps,fee_total:ms,fee_imd:fs,fee_cashback:ws,fee_owner:_s,fee_prize:bs,fee_pool:xs,fee_burn:ys,fee_payouts:gs,launch_window:vs,launch_extra:Es,launch_fee_curve:ks,launch_open_fee:As,launch_open_fee_of_payment:js,launch_max_buy:Ps,seed_price:Ts,launch_max_buy_value:Ls,payout_reserve:Ns,market_cap:Is,market_cap_check:Cs,seed_check_season:Ds,seed_check_deadman:Ss,cap_floor:$s,cap_decay_days:Ms,cap_decay_per_day:Gs,min_trim:Os,wall_threshold:Hs,wall_min_fill:Bs,wall_guard:Rs,wall_guard_pct:Fs,ref_step:Ws,tick_spacing:Ys,lp_fee:Us,swap_min_gas:zs,total_supply:qs,supply_pool:Vs,supply_seasons:Ks,supply_distributor:Xs,supply_pool_pct:Js,supply_seasons_pct:Qs,supply_distributor_pct:Zs,supply_swarm_pct:en,supply_airdrop_pct:tn,supply_split:an,start:sn,owner:nn,launch_id:on,launch_block:rn,letterbox_block:ln,tribunal_block:cn,hook_block:hn,addr_plea:dn,addr_gate:un,addr_seasons:pn,addr_distributor:mn,addr_launch:fn,addr_letterbox:wn,addr_tribunal:_n,addr_hook:bn,addr_imd:xn,addr_pool_manager:yn,addr_stacker:gn,addr_intake:vn,addr_oracle_signer:En,addr_seat:kn,audit_rounds:An,tests_count:jn},C=Pn;function xe(t){return{text:a=>{const s=Z(C,a,t);if(s===void 0)throw Error(`The docs name an unknown number {{${a}}}.`);return s},value:a=>{if(!(a in C)||a==="_meta")throw Error(`The docs name an unknown number {{${a}}}.`);return We(C,a,t)}}}const ye=x.createContext(xe()),Tn=ye.Provider,T=()=>x.useContext(ye),U=[{key:"fee_cashback",label:"Back to you, as staked IMD",fill:"var(--approved)",of:"IMD"},{key:"fee_owner",label:"The owner",fill:"var(--objection)",of:"IMD"},{key:"fee_prize",label:"The season’s prize pot",fill:"var(--pending)",of:"IMD"},{key:"fee_pool",label:"The buy wall, kept in the pool",fill:"var(--executed)",of:"IMD"},{key:"fee_burn",label:"Burned",fill:"var(--noverdict)",of:"PLEA"}],$=1e3,z=48;function Ln(){const t=T(),a="fee-bar-"+x.useId().replace(/[^a-zA-Z0-9_-]/g,""),s=U.map(i=>t.value(i.key)??0n),n=s.reduce((i,u)=>i+u,0n),o=s.slice(0,4).reduce((i,u)=>i+u,0n),r=i=>F("bps",i);let l=0;const c=U.map((i,u)=>{const m=n?$*Number(s[u])/Number(n):$/U.length,f={...i,x:l,w:m,n:u+1,text:t.text(i.key)};return l+=m,f}),p=`A bar for the ${r(n)} fee every trade pays, in five numbered parts: `+c.map(i=>`${i.n}, ${i.label[0].toLowerCase()+i.label.slice(1)}: ${i.text} of the ${i.of}`).join("; ")+`. Parts 1 to 4 are ${r(o)} of the trade’s IMD; part 5 is ${c[4].text} of its PLEA.`;return e.jsxs("figure",{className:"docs-figure panel stack stack--md",children:[e.jsxs("figcaption",{className:"docs-figure__title",children:["The ",r(n)," fee on every trade: ",r(o)," of its IMD in four parts, and ",c[4].text," of its PLEA, burned"]}),e.jsxs("div",{className:"docs-bar",children:[e.jsxs("svg",{className:"docs-bar__svg",viewBox:`0 0 ${$} ${z}`,preserveAspectRatio:"none",role:"img","aria-labelledby":`${a}-alt`,children:[e.jsx("title",{id:`${a}-alt`,children:p}),c.map(i=>e.jsx("rect",{x:i.x,y:"0",width:i.w,height:z,style:{fill:i.fill}},i.key)),c.slice(1).map(i=>e.jsx("line",{x1:i.x,y1:"0",x2:i.x,y2:z,vectorEffect:"non-scaling-stroke",style:{stroke:"var(--line)",strokeWidth:i.of==="PLEA"?8:3}},i.key))]}),c.map(i=>e.jsx("span",{className:"docs-bar__key",style:{left:`${(i.x+i.w/2)*100/$}%`},"aria-hidden":"true",children:i.n},i.key))]}),e.jsx(re,{rows:[...c.map(i=>[e.jsxs("span",{className:"docs-key-row",children:[e.jsxs("svg",{className:"docs-key",viewBox:"0 0 28 28","aria-hidden":"true",children:[e.jsx("rect",{x:"1",y:"1",width:"26",height:"26",rx:"4",style:{fill:i.fill,stroke:"var(--line)",strokeWidth:2}}),e.jsx("circle",{cx:"14",cy:"14",r:"9",style:{fill:"var(--day)",stroke:"var(--night)",strokeWidth:1.5}}),e.jsx("text",{x:"14",y:"14",dy:"0.35em",textAnchor:"middle",style:{fill:"var(--night)",fontFamily:"var(--font-body)",fontWeight:800,fontSize:12},children:i.n})]}),e.jsxs("span",{children:[e.jsxs("span",{className:"sr-only",children:["Part ",i.n,": "]}),i.label]})]}),e.jsxs(e.Fragment,{children:[i.text," ",e.jsxs("span",{className:"text-2",children:["of the ",i.of]})]})]),["Every trade",r(n),"total"]]}),e.jsx("p",{className:"small text-2",children:"Once the Cabal is dead there are no more seasons: part 3 joins the pool too."})]})}function W({title:t,alt:a,children:s,lead:n,after:o}){const r="dg-"+x.useId().replace(/[^a-zA-Z0-9_-]/g,"");return e.jsxs("figure",{className:"docs-figure panel stack stack--md dg",children:[e.jsx("figcaption",{className:"docs-figure__title",children:t}),n,e.jsxs("div",{className:"dg-art",role:"img","aria-labelledby":r,children:[e.jsx("span",{id:r,className:"sr-only",children:a}),s]}),o]})}function ge({down:t=!1}){return t?e.jsx("span",{className:"dg-arrow","aria-hidden":"true",children:e.jsx(k,{name:"arrow-down"})}):e.jsxs("span",{className:"dg-arrow","aria-hidden":"true",children:[e.jsx("span",{className:"dg-arrow__down",children:e.jsx(k,{name:"arrow-down"})}),e.jsx("span",{className:"dg-arrow__across",children:e.jsx(k,{name:"arrow-right"})})]})}function ve({n:t,icon:a,title:s,children:n,wait:o=!1}){return e.jsxs("div",{className:`dg-node${o?" dg-node--wait":""}`,children:[e.jsxs("span",{className:"dg-node__head",children:[t!==void 0&&e.jsx("span",{className:"dg-n",children:t}),a&&e.jsx(k,{name:a}),e.jsx("span",{children:s})]}),n]})}function D({children:t}){return e.jsx("div",{className:"dg-lane",children:t})}function Ee({n:t,children:a}){return e.jsx("div",{className:"dg-lanes",style:{"--lanes":t},children:a})}function ke({icon:t,children:a}){return e.jsxs("div",{className:"dg-band",children:[e.jsx(k,{name:t}),e.jsx("p",{children:a})]})}const M=6,g=1e3;function Nn(){const t=T(),a=t.value("launch_extra")??0n,s=t.value("launch_window")??1n,n=t.value("fee_imd")??0n,o=h=>F("bps",h),r=h=>F("duration",h),l=h=>h>=s?0n:a*(s-h)/s,c=Array.from({length:M+1},(h,b)=>{const d=s*BigInt(b)/BigInt(M);return{s:d,i:b,fee:l(d)}}),p=Number(s)*(M+1)/M,i=h=>Number(h)/p*g,u=h=>a?g-Number(h)/Number(a)*g:g,m=i(s),f=h=>String(Number(h)/60),w=`A line chart of the launch fee over the launch window. It starts at ${o(a)} when trading opens and falls in a straight line to 0% at ${r(s)}, then stays at 0%. `+c.map(h=>h.i===0?`At the open: ${o(h.fee)}`:`after ${f(h.s)} minutes: ${o(h.fee)}`).join(", ")+`. It comes on top of the usual ${o(n)} of the IMD that reaches the pool. Until ${r(s)} after the open, one buy may take at most ${t.text("launch_max_buy")} from the pool.`;return e.jsx(W,{title:`The launch fee: ${o(a)} at the open, 0% after ${r(s)}`,alt:w,after:e.jsxs(e.Fragment,{children:[e.jsx(re,{rows:c.map(h=>[h.i===0?"At the open":`${h.s>=s?"From":"After"} ${f(h.s)} minutes`,e.jsxs(e.Fragment,{children:[o(h.fee)," ",e.jsxs("span",{className:"text-2",children:["+ ",o(n)]})]})])}),e.jsxs("p",{className:"small text-2",children:["The launch fee is a share of the IMD that reaches the pool, on buys only, on top of the usual ",o(n),". It stays in the pool, for the buy wall."]})]}),children:e.jsxs("div",{className:"dg-chart",children:[e.jsx("span",{className:"dg-chart__title",children:"Launch fee, as a share of the IMD that reaches the pool"}),e.jsxs("div",{className:"dg-chart__plot",children:[e.jsxs("svg",{className:"dg-chart__svg",viewBox:`0 0 ${g} ${g}`,preserveAspectRatio:"none","aria-hidden":"true",children:[e.jsx("polygon",{points:`0,${u(a)} ${m},${g} 0,${g}`,style:{fill:"var(--action-soft)"}}),c.slice(1).map(h=>e.jsx("line",{x1:i(h.s),y1:"0",x2:i(h.s),y2:g,vectorEffect:"non-scaling-stroke",style:{stroke:"var(--line-soft)",strokeWidth:2,strokeDasharray:h.s===s?void 0:"4 4"}},h.i)),e.jsx("polyline",{points:`0,${u(a)} ${m},${g} ${g},${g}`,vectorEffect:"non-scaling-stroke",style:{fill:"none",stroke:"var(--ink)",strokeWidth:3,strokeLinejoin:"round"}})]}),c.map(h=>e.jsx("span",{className:"dg-chart__dot",style:{left:`${i(h.s)/10}%`,top:`${u(h.fee)/10}%`}},h.i)),e.jsx("span",{className:"dg-chart__y",style:{top:"0%"},children:o(a)}),e.jsx("span",{className:"dg-chart__y",style:{top:"50%"},children:o(a/2n)}),e.jsx("span",{className:"dg-chart__y",style:{top:"100%"},children:"0%"})]}),e.jsxs("div",{className:"dg-chart__row",children:[c.map(h=>e.jsx("span",{className:`dg-chart__x${h.i===0?" dg-chart__x--start":""}`,style:{left:`${i(h.s)/10}%`},children:f(h.s)},h.i)),e.jsx("span",{className:"dg-chart__x dg-chart__x--end",style:{left:"100%"},children:"min"})]}),e.jsx("span",{className:"dg-chart__title",children:"Minutes after trading opens"}),e.jsx("div",{className:"dg-chart__row",style:{width:`${m/10}%`},children:e.jsxs("span",{className:"dg-chart__span",children:["Until minute ",f(s),": at most ",t.text("launch_max_buy")," a buy"]})})]})})}const In={APPROVED:"approved",OVERTURNED:"approved",DENIED:"denied",UPHELD:"denied",PENDING:"pending","NO VERDICT":"noverdict",LAPSED:"lapsed",SOLD:"sold",OBJECTION:"objection",SUSTAINED:"objection",OVERRULED:"objection",VOID:"objection"};function E({state:t,sub:a,size:s}){return e.jsxs("span",{className:`stamp stamp--${In[t]}${s?` stamp--${s}`:""}`,children:[t,a&&e.jsx("span",{className:"stamp__sub",children:a})]})}function Cn({fact:t,score:a,verdict:s}){const n=T(),o=Number(n.value("pass_mark")),r=Number(n.value("max_score")),l=o-t,c=s!==void 0&&a!==void 0,p=s==="DENIED",i=c?p?`${l-a} short`:`passes by ${a-l}`:"";return e.jsxs("div",{className:`meter ${c?p?"meter--denied":"":"meter--none"}`,style:{"--score":Math.max(0,Math.min(r,a??0)),"--need":Math.max(0,Math.min(r,l))},children:[e.jsxs("div",{className:"meter__legend",children:[e.jsx("span",{children:c?`Judges ${a}`:"No score yet"}),e.jsxs("span",{children:["Need ",e.jsx("b",{children:l})," = ",o," − fact ",e.jsx("b",{children:t})]}),c&&e.jsx("span",{className:p?"bad-text":"ok-text",children:i})]}),e.jsxs("div",{className:"meter__bar",role:"img","aria-label":c?`Score ${a} of ${r}, need ${l}: ${i}`:`No score yet, need ${l} of ${r}.`,children:[e.jsx("span",{className:"meter__fill"}),e.jsx("span",{className:"meter__need"})]}),e.jsxs("div",{className:"meter__scale","aria-hidden":"true",children:[e.jsx("span",{children:"0"}),e.jsx("span",{children:r})]})]})}function Dn(){const t=T(),a=t.text,s=[{title:"Buy",text:"Open to anyone. Each buy records what you paid and when."},{title:"Plead",text:`Write why you want to sell, and pay the ${a("oracle_fee")} oracle fee.`,stamp:"PENDING"},{title:"Judged",text:`${a("panel_size")} judges score it from 0 to ${a("max_score")}; ${a("quorum")} must agree. Your need or more: approved.`,stamp:"APPROVED"},{title:"Sell",text:`Sell what you asked for, in one go, within ${a("sell_window")}.`,stamp:"SOLD"}],n=`Appeal once within ${a("appeal_window")}. Or wait out the cooldown, ${a("cooldown")}, and plead again.`,o=`No answer within ${a("pending_expiry")}. The fee is spent, and you may plead again at once.`,r=`Every verdict restarts its clock. After ${a("deadman")} without one, the Cabal dies for good: no more pleas, and PLEA trades freely.`,l="The PLEA loop, left to right: "+s.map((c,p)=>`${p+1}, ${c.title}: ${c.text}`).join(" ")+` A plea can also end two other ways. Denied: ${n} No verdict: ${o} Under it all, the dead-man: ${r}`;return e.jsxs(W,{title:"Buy, plead, be judged, sell",alt:l,children:[e.jsx("div",{className:"dg-flow",children:s.map((c,p)=>e.jsxs(x.Fragment,{children:[p>0&&e.jsx(ge,{}),e.jsxs(ve,{n:p+1,title:c.title,children:[e.jsx("span",{className:"dg-node__text",children:c.text}),c.stamp&&e.jsx(E,{state:c.stamp,size:"sm"})]})]},c.title))}),e.jsx("p",{className:"small strong",children:"Or the plea ends another way:"}),e.jsxs(Ee,{n:2,children:[e.jsxs(D,{children:[e.jsx(E,{state:"DENIED",size:"sm"}),e.jsx("p",{className:"small",children:n})]}),e.jsxs(D,{children:[e.jsx(E,{state:"NO VERDICT",size:"sm"}),e.jsx("p",{className:"small",children:o})]})]}),e.jsxs(ke,{icon:"hourglass",children:[e.jsx("b",{children:"Under it all, the dead-man."})," ",r]})]})}const G=1e3,q=48;function Sn(){const t=T(),a=t.text,s=d=>Number(t.value(d)??0n),n=s("pass_mark"),o=[{key:"share",label:"Share sold",value:`at most ${a("share_band_top")}`,pts:s("fact_share_top"),fill:"var(--executed)"},{key:"held",label:"Held",value:`${a("held_day_1")} day since the open`,pts:s("held_points_1d"),fill:"var(--objection)"},{key:"profit",label:"Profit or loss",value:"received, not bought",pts:s("received_profit"),fill:"var(--approved)"},{key:"trend",label:"24-hour trend",value:"flat",pts:s("trend_flat"),fill:"var(--pending)"}],r=o.reduce((d,_)=>d+_.pts,0),l=n-r;let c=0;const p=[...o,{key:"need",label:"Need",value:"the judges' part",pts:l,fill:"var(--card)"}].map(d=>{const _=G*d.pts/n,y={...d,x:c,w:_};return c+=_,y}),i=`${o.map(d=>d.pts).join(" + ")} = ${r}`,u=[{day:"0",held:s("held_points_0")},{day:a("held_day_1"),held:s("held_points_1d")},{day:a("held_day_3"),held:s("held_points_3d")},{day:a("held_day_7"),held:s("held_points_7d")}],m=[{who:"Bought, now at a loss",profit:s("profit_points_loss")},{who:`Bought, up at most ${a("profit_band_50")}`,profit:s("profit_points_50")},{who:`Bought, up ${a("profit_band_200")} to ${a("profit_band_500")}`,profit:s("profit_points_500")},{who:"Received (airdrop, prizes)",profit:s("received_profit")}],f=(d,_)=>n-(s("fact_share_top")+d+_+s("trend_flat")),w=s("trend_up")-s("trend_flat"),h=s("trend_flat")-s("trend_down"),b=`A bar for the pass mark, ${n}, split into the four fact parts and the need. `+o.map(d=>`${d.label}, ${d.value}: ${d.pts}`).join("; ")+`. Fact score ${i}. The rest of the bar is the need, ${n} − ${r} = ${l}: the judges' score, from 0 to ${a("max_score")}, must reach it.`;return e.jsxs(W,{title:`Your need is the part of ${n} your facts do not cover`,alt:b,lead:e.jsxs("p",{className:"small",children:["A plea of at most ",a("share_band_top")," of PLEA received in the airdrop, ",a("held_day_1")," day after trading opened, with a flat price:"]}),after:e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"facts",children:o.map(d=>e.jsxs("div",{className:"fact",children:[e.jsxs("span",{className:"fact__label dg-key__row",children:[e.jsx("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:e.jsx("rect",{x:"1",y:"1",width:"22",height:"22",rx:"4",style:{fill:d.fill,stroke:"var(--line)",strokeWidth:2}})}),d.label]}),e.jsx("b",{className:"fact__value",children:d.value}),e.jsxs("span",{className:"fact__pts",children:["+",d.pts]})]},d.key))}),e.jsxs("p",{className:"strong",children:["Fact score ",i,". Need ",n," − ",r," = ",l,"."]}),e.jsx(Cn,{fact:r}),e.jsx("div",{className:"table-wrap",role:"region","aria-label":"Table: need by days held",tabIndex:0,children:e.jsxs("table",{className:"table",children:[e.jsxs("caption",{className:"dg-caption",children:["Need by days held, for a plea of at most ",a("share_band_top")," at a flat price"]}),e.jsxs("thead",{children:[e.jsxs("tr",{children:[e.jsx("th",{scope:"col",rowSpan:2,children:"Your PLEA"}),e.jsx("th",{scope:"colgroup",colSpan:u.length,className:"r",children:"Days held"})]}),e.jsx("tr",{children:u.map(d=>e.jsx("th",{scope:"col",className:"r",children:d.day},d.day))})]}),e.jsx("tbody",{children:m.map(d=>e.jsxs("tr",{children:[e.jsx("th",{scope:"row",children:d.who}),u.map(_=>e.jsx("td",{className:"r strong",children:f(_.held,d.profit)},_.day))]},d.who))})]})}),e.jsxs("p",{className:"small text-2",children:["Price up more than ",a("trend_band")," in 24 hours: each need is ",w," lower. Down more than ",a("trend_band"),":"," ",h," higher. On trading's first day there is no price from 24 hours before, so the trend counts"," ",a("trend_flat"),". Received PLEA counts its days from the moment trading opened."]})]}),children:[e.jsxs("div",{className:"dg-need",children:[e.jsxs("svg",{className:"dg-need__svg",viewBox:`0 0 ${G} ${q}`,preserveAspectRatio:"none","aria-hidden":"true",children:[e.jsx("defs",{children:e.jsxs("pattern",{id:"dg-need-hatch",width:"8",height:"8",patternUnits:"userSpaceOnUse",patternTransform:"rotate(45)",children:[e.jsx("rect",{width:"8",height:"8",style:{fill:"var(--card)"}}),e.jsx("line",{x1:"0",y1:"0",x2:"0",y2:"8",style:{stroke:"var(--line-soft)",strokeWidth:4}})]})}),p.map(d=>e.jsx("rect",{x:d.x,y:"0",width:d.w,height:q,style:{fill:d.key==="need"?"url(#dg-need-hatch)":d.fill}},d.key)),p.slice(1).map(d=>e.jsx("line",{x1:d.x,y1:"0",x2:d.x,y2:q,vectorEffect:"non-scaling-stroke",style:{stroke:"var(--line)",strokeWidth:d.key==="need"?6:2}},d.key))]}),p.filter(d=>d.w>=G*.07).map(d=>e.jsx("span",{className:"dg-need__key",style:{left:`${(d.x+d.w/2)*100/G}%`},children:d.key==="need"?`need ${d.pts}`:d.pts},d.key))]}),e.jsxs("div",{className:"dg-chart__row",children:[e.jsx("span",{className:"dg-chart__x dg-chart__x--start",style:{left:0},children:"0"}),e.jsxs("span",{className:"dg-chart__x",style:{left:`${r*100/n}%`},children:["fact ",r]}),e.jsxs("span",{className:"dg-chart__x dg-chart__x--end",style:{left:"100%"},children:[n,", the pass mark"]})]})]})}function $n(){const t=T(),a=t.text,s={pending:`The Cabal reads your plea. A verdict can come for up to ${a("pending_expiry")}.`,approved:`Your score is at least your need. Sell it all, in one go, within ${a("sell_window")}.`,sold:"You sold in time.",lapsed:"The window passed with no sale. Nothing was sold; the points still count.",denied:`Your score is below your need. You may appeal once within ${a("appeal_window")}: a new plea, judged on its own text.`,overturned:"The appeal is approved: sell within the window.",upheld:"The appeal is denied too. No further appeal.",none:`No verdict within ${a("pending_expiry")}. Anyone may close the plea. The fee is spent.`,cooldown:`After a sale, a denial or a lapse, your next plea waits ${a("cooldown")}. After no verdict, it need not wait.`},n=`The states of a plea, each a stamp. PENDING: ${s.pending} Then one of three. APPROVED: ${s.approved} It ends SOLD (${s.sold}) or LAPSED (${s.lapsed}) DENIED: ${s.denied} The appeal ends OVERTURNED (${s.overturned}) or UPHELD (${s.upheld}) NO VERDICT: ${s.none} Cooldown: ${s.cooldown}`;return e.jsxs(W,{title:"A plea's states, as the site stamps them",alt:n,children:[e.jsxs(ve,{title:"Sent",children:[e.jsx(E,{state:"PENDING",size:"sm"}),e.jsx("span",{className:"dg-node__text",children:s.pending})]}),e.jsx(ge,{down:!0}),e.jsxs(Ee,{n:3,children:[e.jsxs(D,{children:[e.jsx(E,{state:"APPROVED",sub:"score ≥ need"}),e.jsx("p",{className:"small",children:s.approved}),e.jsx("p",{className:"small strong",children:"Then it ends:"}),e.jsxs("p",{className:"dg-then",children:[e.jsx(E,{state:"SOLD",size:"sm"}),e.jsx("span",{children:s.sold})]}),e.jsxs("p",{className:"dg-then",children:[e.jsx(E,{state:"LAPSED",size:"sm"}),e.jsx("span",{children:s.lapsed})]})]}),e.jsxs(D,{children:[e.jsx(E,{state:"DENIED",sub:"score < need"}),e.jsx("p",{className:"small",children:s.denied}),e.jsx("p",{className:"small strong",children:"An appeal ends:"}),e.jsxs("p",{className:"dg-then",children:[e.jsx(E,{state:"OVERTURNED",size:"sm"}),e.jsx("span",{children:s.overturned})]}),e.jsxs("p",{className:"dg-then",children:[e.jsx(E,{state:"UPHELD",size:"sm"}),e.jsx("span",{children:s.upheld})]})]}),e.jsxs(D,{children:[e.jsx(E,{state:"NO VERDICT",sub:"expired"}),e.jsx("p",{className:"small",children:s.none})]})]}),e.jsxs(ke,{icon:"timer",children:[e.jsx("b",{children:"Cooldown."})," ",s.cooldown]})]})}const Mn=Object.assign({"../../../docs/01-start-here.md":Xe,"../../../docs/02-buying.md":Je,"../../../docs/03-plead.md":Qe,"../../../docs/04-your-bar.md":Ze,"../../../docs/05-judges.md":et,"../../../docs/06-appeals.md":tt,"../../../docs/07-letters.md":at,"../../../docs/08-auto-sell.md":st,"../../../docs/09-objection.md":nt,"../../../docs/10-seasons.md":ot,"../../../docs/11-fees.md":rt,"../../../docs/12-pool.md":lt,"../../../docs/13-dead-man.md":it,"../../../docs/14-keepers.md":ct,"../../../docs/15-contracts.md":ht,"../../../docs/16-audits.md":dt,"../../../docs/17-risks.md":ut,"../../../docs/18-glossary.md":pt}),Gn=Object.fromEntries(Object.entries(Object.assign({"./diagrams/fee-bar.tsx":Ln,"./diagrams/launch-fee.tsx":Nn,"./diagrams/loop.tsx":Dn,"./diagrams/need.tsx":Sn,"./diagrams/plea-states.tsx":$n})).map(([t,a])=>[t.replace(/^.*\/|\.tsx$/g,""),a])),Ae=t=>Z(C,t),je=L.map(t=>{const a=Mn[`../../../docs/${Le(t)}`]??`# ${t.title}
`;return{...t,blocks:K(a,Ae).blocks}}),On=Ye(je,Ae);function Yn({slug:t,heading:a}){const{statics:s,s:n}=Ne(),o=s??n?.constants,r=x.useCallback(f=>Z(C,f,o),[o]),l=x.useMemo(()=>xe(o),[o]),c=Ie(t),p=c&&je.find(f=>f.slug===c.slug);x.useEffect(()=>{if(!a)return;const f=document.getElementById(V(a));f&&(f.scrollIntoView(),f.focus({preventScroll:!0}))},[c?.slug,a]);const i=x.useMemo(()=>p?Re(p.blocks,r):[],[p,r]),{prev:u,next:m}=Ce(c?.slug||"");return e.jsx(Tn,{value:l,children:e.jsxs("div",{className:"docs",children:[e.jsx(Hn,{current:c?.slug}),e.jsxs("article",{className:"docs__page",children:[p?e.jsx("div",{className:"docs-body",children:e.jsx(Ke,{tree:p.blocks,ctx:{slug:p.slug,num:r,diagrams:Gn}})}):e.jsxs("div",{className:"stack stack--lg",children:[e.jsx(De,{title:"Page not found"}),e.jsx(Se,{title:`No docs page at #/docs/${t}`,action:{href:"#/docs",label:"Start here"},children:"Pick a page from the list, or search the docs."})]}),p&&e.jsxs("nav",{className:"docs-pager","aria-label":"Previous and next page",children:[u&&e.jsxs("a",{className:"docs-pager__link",href:N(u.slug),rel:"prev",children:[e.jsx("span",{className:"label",children:"Previous"}),e.jsxs("span",{className:"docs-pager__title",children:[e.jsx("span",{className:"docs-pager__back",children:e.jsx(k,{name:"arrow-right"})}),u.title]})]}),m&&e.jsxs("a",{className:"docs-pager__link docs-pager__link--next",href:N(m.slug),rel:"next",children:[e.jsx("span",{className:"label",children:"Next"}),e.jsxs("span",{className:"docs-pager__title",children:[m.title,e.jsx(k,{name:"arrow-right"})]})]})]})]}),p&&i.length>0&&e.jsxs("nav",{className:"docs__toc","aria-label":"On this page",children:[e.jsx("p",{className:"label",children:"On this page"}),e.jsx("ul",{children:i.map(f=>e.jsx("li",{className:f.level===3?"docs__toc-sub":void 0,children:e.jsx("a",{href:N(p.slug,f.id),"aria-current":f.id===a?"location":void 0,children:f.text})},f.id))})]})]})})}function Hn({current:t}){const[a,s]=x.useState(!1),n=x.useRef(null);x.useEffect(()=>s(!1),[t]);const o=L.findIndex(l=>l.slug===t),r=l=>{l.key==="Escape"&&a&&document.getElementById("docs-pages")?.contains(document.activeElement)?(s(!1),n.current?.focus()):l.key==="Escape"&&a&&document.activeElement===n.current&&s(!1)};return e.jsxs("div",{className:"docs__side",onKeyDown:r,children:[e.jsx(Bn,{}),e.jsxs("button",{ref:n,type:"button",className:"docs__toggle","aria-expanded":a,"aria-controls":"docs-pages",onClick:()=>s(!a),children:[e.jsx(k,{name:a?"x":"list"}),e.jsxs("span",{className:"docs__toggle-text",children:[e.jsx("span",{className:"strong",children:"Docs pages"}),o>=0&&e.jsxs("span",{className:"meta",children:[o+1," of ",L.length,": ",L[o].title]})]})]}),e.jsx("nav",{id:"docs-pages",className:`docs-nav${a?" is-open":""}`,"aria-label":"Docs pages",children:e.jsx("ol",{children:L.map(l=>e.jsx("li",{children:e.jsx("a",{href:N(l.slug),"aria-current":l.slug===t?"page":void 0,children:l.title})},l.slug))})})]})}function Bn(){const[t,a]=x.useState(""),s=x.useRef(null),n=x.useRef(null),o=8,r=x.useMemo(()=>ze(On,t,1/0),[t]),l=r.slice(0,o),c=ee(t).join("").length>=2;x.useEffect(()=>{const u=()=>a("");return window.addEventListener("hashchange",u),()=>window.removeEventListener("hashchange",u)},[]);const p=()=>[...n.current?.querySelectorAll("a")||[]],i=(u,m)=>{const f=p();u.key==="ArrowDown"&&f.length?(u.preventDefault(),f[Math.min(m+1,f.length-1)].focus()):u.key==="ArrowUp"?(u.preventDefault(),m<=0?s.current?.focus():f[m-1].focus()):u.key==="Escape"&&t&&(u.preventDefault(),u.stopPropagation(),a(""),s.current?.focus())};return e.jsxs("form",{role:"search",className:"docs-search",onSubmit:u=>{u.preventDefault(),l[0]&&(location.hash=l[0].href)},children:[e.jsx("label",{className:"sr-only",htmlFor:"docs-q",children:"Search the docs"}),e.jsxs("div",{className:"input input--text",children:[e.jsx(k,{name:"magnifying-glass"}),e.jsx("input",{ref:s,id:"docs-q",className:"input__control",type:"search",placeholder:"Search the docs",autoComplete:"off",spellCheck:!1,value:t,"aria-describedby":"docs-q-count","aria-controls":c&&l.length?"docs-results":void 0,onChange:u=>a(u.target.value),onKeyDown:u=>i(u,-1)})]}),e.jsx("p",{id:"docs-q-count",className:"sr-only","aria-live":"polite",children:c?`${r.length||"No"} result${r.length===1?"":"s"}${r.length>o?`, the first ${o} shown`:""}`:""}),c&&(l.length?e.jsxs("ul",{ref:n,id:"docs-results",className:"docs-results","aria-label":"Search results",children:[l.map((u,m)=>e.jsx("li",{children:e.jsxs("a",{href:u.href,onKeyDown:f=>i(f,m),children:[e.jsx("span",{className:"docs-results__where",children:e.jsx(Rn,{entry:u.entry})}),u.snippet&&e.jsx("span",{className:"docs-results__text",children:e.jsx(Fn,{text:u.snippet,query:t})})]})},u.href)),r.length>o&&e.jsxs("li",{className:"small text-2 docs-results__more","aria-hidden":"true",children:[r.length," sections match; the first ",o," are shown. Add a word to narrow it."]})]}):e.jsxs("p",{className:"small text-2 docs-results__none",children:["No section mentions “",t.trim(),"”."]}))]})}const Rn=({entry:t})=>e.jsxs(e.Fragment,{children:[t.page,t.heading&&e.jsxs(e.Fragment,{children:[e.jsx("span",{"aria-hidden":"true",children:" › "}),e.jsx("span",{className:"sr-only",children:", "}),t.heading]})]});function Fn({text:t,query:a}){const s=ee(a).filter(o=>o.length>1);if(!s.length)return e.jsx(e.Fragment,{children:t});const n=new RegExp(`(${s.map(o=>o.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})`,"gi");return e.jsx(e.Fragment,{children:t.split(n).map((o,r)=>r%2?e.jsx("mark",{children:o},r):o)})}export{Yn as default};
