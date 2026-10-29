import{s as Ae,j as t,N as Pe,h as U,I as k,d as L,r as x,C as se,D as T,f as je,u as Te,p as Le,a as Ie,T as Ne,E as Ce}from"./index-BPLz4D8W.js";const De=e=>e.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"section",Se=/[\\`*_{}\[\]()#+\-.!|>:~<]/;function M(e,a=[]){const n=[],s=l=>{const r=n[n.length-1];r?.t==="text"?r.v+=l:l&&n.push({t:"text",v:l})};let o=0;for(;o<e.length;){const l=e[o];if(l==="\\"&&o+1<e.length&&Se.test(e[o+1])){s(e[o+1]),o+=2;continue}if(l==="{"&&e.startsWith("{{",o)){const r=e.indexOf("}}",o+2);if(r<0){a.push(`an unclosed placeholder: "${e.slice(o,o+24)}"`),s(e.slice(o));break}n.push({t:"num",key:e.slice(o+2,r).trim()}),o=r+2;continue}if(l==="`"){let r=1;for(;e[o+r]==="`";)r++;const c="`".repeat(r),d=e.indexOf(c,o+r);if(d>0){let i=e.slice(o+r,d);i.startsWith(" ")&&i.endsWith(" ")&&i.trim()&&(i=i.slice(1,-1)),n.push({t:"code",c:oe(i,a)}),o=d+r;continue}s(c),o+=r;continue}if(l==="*"&&e[o+1]==="*"){const r=Z(e,o+2,"**");if(r>0){n.push({t:"strong",c:M(e.slice(o+2,r),a)}),o=r+2;continue}}if((l==="*"||l==="_")&&e[o+1]!==l&&$e(e,o)){const r=Z(e,o+1,l);if(r>0){n.push({t:"em",c:M(e.slice(o+1,r),a)}),o=r+1;continue}}if(l==="["){const r=Me(e,o);if(r>0&&e[r+1]==="("){const c=e.indexOf(")",r+2);if(c>0){n.push({t:"link",href:e.slice(r+2,c).trim(),c:M(e.slice(o+1,r),a)}),o=c+1;continue}}}s(l),o++}return n}function oe(e,a){const n=[];let s=0;for(;s<e.length;){const o=e.indexOf("{{",s);if(o<0)break;const l=e.indexOf("}}",o+2);if(l<0){a.push(`an unclosed placeholder: "${e.slice(o,o+24)}"`);break}o>s&&n.push({t:"text",v:e.slice(s,o)}),n.push({t:"num",key:e.slice(o+2,l).trim()}),s=l+2}return s<e.length&&n.push({t:"text",v:e.slice(s)}),n}const le=e=>e===void 0||/\s/.test(e),re=e=>!!e&&/[\p{L}\p{N}]/u.test(e);function $e(e,a){return le(e[a+1])?!1:e[a]==="*"||!re(e[a-1])}function Z(e,a,n){let s=a;for(;s<e.length;){if(e[s]==="\\"){s+=2;continue}if(e[s]==="`"){const o=e.indexOf("`",s+1);if(o>0){s=o+1;continue}}if(e.startsWith(n,s)&&s>a&&!le(e[s-1])){if(n==="*"&&e[s+1]==="*"){s+=2;continue}if(n==="_"&&re(e[s+1])){s++;continue}return s}s++}return-1}function Me(e,a){let n=0;for(let s=a;s<e.length;s++){if(e[s]==="\\"){s++;continue}if(e[s]==="["&&n++,e[s]==="]"&&--n===0)return s}return-1}const ie=/^```\s*([\w-]*)\s*$/,ce=/^(#{1,6})\s+(.*?)\s*#*\s*$/,he=/^(?:-{3,}|\*{3,}|_{3,})\s*$/,G=/^:::\s*(.*?)\s*$/,O=/^>\s?/,j=/^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/,Ge=/^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/,ue=(e,a)=>/^\s*\|/.test(e[a])&&a+1<e.length&&Ge.test(e[a+1].trim()),de=(e,a)=>{const n=e[a];return ie.test(n)||ce.test(n)||he.test(n)||G.test(n)||O.test(n)||ue(e,a)||j.test(n)&&j.exec(n)[1].length<2};function F(e){let a=e.trim();a.startsWith("|")&&(a=a.slice(1)),a.endsWith("|")&&!a.endsWith("\\|")&&(a=a.slice(0,-1));const n=[];let s="",o=!1;for(let l=0;l<a.length;l++)a[l]==="\\"&&a[l+1]==="|"?(s+="|",l++):a[l]==="`"?(o=!o,s+="`"):a[l]==="|"&&!o?(n.push(s.trim()),s=""):s+=a[l];return n.push(s.trim()),n}function z(e,a=o=>o,n=0,s=new Map){const o=e.replace(/\r\n?/g,`
`).replace(/<!--[\s\S]*?-->/g,u=>u.replace(/[^\n]/g,"")).split(`
`),l=[],r=[],c=(u,p)=>r.push(`line ${n+u+1}: ${p}`),d=(u,p)=>{const m=[],w=M(u,m);for(const h of m)c(p,h);return w};let i=0;for(;i<o.length;){const u=o[i];if(!u.trim()){i++;continue}let p;if(p=ie.exec(u)){const h=i++,b=[];for(;i<o.length&&!/^```\s*$/.test(o[i]);)b.push(o[i++]);i>=o.length&&c(h,"a code block (```) is never closed"),i++;const f=[];l.push({t:"pre",lang:p[1],c:oe(b.join(`
`),f)});for(const y of f)c(h,y);continue}if(p=ce.exec(u)){const h=p[1].length;let b=p[2],f="";const y=/\s*\{#([a-z0-9-]+)\}\s*$/.exec(b);y&&(f=y[1],b=b.slice(0,y.index)),h>4&&c(i,`a level-${h} heading: the docs use # to #### only`);const _=d(b,i);f||=De(A(_,a));const P=s.get(f)||0;s.set(f,P+1),P&&(f=`${f}-${P+1}`),l.push({t:"h",level:Math.min(h,4),id:f,c:_}),i++;continue}if(he.test(u)){l.push({t:"hr"}),i++;continue}if(p=G.exec(u)){const[h,...b]=p[1].split(/\s+/),f=p[1].slice(h.length).trim();if(h==="diagram"){(!/^[a-z0-9-]+$/.test(f)||b.length!==1)&&c(i,`"::: diagram" needs one name in a-z, 0-9 and -: "${u.trim()}"`),l.push({t:"diagram",name:f,line:n+i+1}),i++;continue}if(h==="note"||h==="warn"||h==="builders"){const y=i++,_=[];for(;i<o.length&&!/^:::\s*$/.test(o[i]);)G.exec(o[i])?.[1]&&!/^diagram\b/.test(G.exec(o[i])[1])&&c(i,"a callout inside a callout: close the first with ::: before opening another"),_.push(o[i++]);i>=o.length&&c(y,`"::: ${h}" is never closed with a line of :::`),i++;const P=z(_.join(`
`),a,n+y+1,s);r.push(...P.errors),l.push({t:"callout",kind:h,title:f?d(f,y):void 0,c:P.blocks});continue}c(i,h?`an unknown block "::: ${h}" (use diagram, note, warn or builders)`:"a ::: that closes nothing"),i++;continue}if(O.test(u)){const h=i,b=[];for(;i<o.length&&O.test(o[i]);)b.push(o[i++].replace(O,""));const f=z(b.join(`
`),a,n+h,s);r.push(...f.errors),l.push({t:"quote",c:f.blocks});continue}if(ue(o,i)){const h=F(u),b=F(o[i+1]).map(_=>_.endsWith(":")?_.startsWith(":")?"c":"r":"l");b.length!==h.length&&c(i,"the table's --- line has a different number of columns from its head");const f=i;i+=2;const y=[];for(;i<o.length&&/^\s*\|/.test(o[i]);){const _=F(o[i]);_.length!==h.length&&c(i,`a table row with ${_.length} cells under a head of ${h.length}`),y.push(_.map(P=>d(P,i))),i++}l.push({t:"table",align:b,head:h.map(_=>d(_,f)),rows:y});continue}if((p=j.exec(u))&&p[1].length<2){const h=Oe(o,i,d,c);l.push(h.list),i=h.next;continue}const m=i,w=[];for(;i<o.length&&o[i].trim()&&(i===m||!de(o,i));)w.push(o[i++].trim());l.push({t:"p",c:d(w.join(" "),m)})}return{blocks:l,errors:r}}const D=e=>/\d/.test(e);function Oe(e,a,n,s){const o=j.exec(e[a]),l={t:"list",ordered:D(o[2]),start:parseInt(o[2])||1,items:[]};let r=a,c=-1,d;const i=[],u=()=>{d&&i.push(d),d=void 0};for(;r<e.length;){const p=e[r];if(!p.trim()){let w=r+1;for(;w<e.length&&!e[w].trim();)w++;const h=w<e.length?j.exec(e[w]):null;if(h&&(h[1].length>=2?l.items.length>0:D(h[2])===l.ordered)){r=w;continue}break}const m=j.exec(p);if(m&&m[1].length<2){if(D(m[2])!==l.ordered)break;u();const w={c:[]};l.items.push(w),d={item:w,parts:[m[3]],line:r},c=-1,r++;continue}if(m&&l.items.length){const w=l.items[l.items.length-1];c<0&&(c=m[1].length),m[1].length>c+1&&s(r,"a list nested more than one level: the docs nest lists one level only"),w.sub||(w.sub={t:"list",ordered:D(m[2]),start:parseInt(m[2])||1,items:[]}),u();const h={c:[]};w.sub.items.push(h),d={item:h,parts:[m[3]],line:r},r++;continue}if(m||de(e,r))break;d&&d.parts.push(p.trim()),r++}u();for(const p of i)p.item.c=n(p.parts.join(" "),p.line);return{list:l,next:r}}function A(e,a=n=>n){return e.map(n=>n.t==="text"?n.v:n.t==="num"?a(n.key)??n.key:A(n.c,a)).join("")}const He=(e,a)=>e.filter(n=>n.t==="h"&&(n.level===2||n.level===3)).map(n=>({id:n.id,level:n.level,text:A(n.c,a)}));function pe(e){const a=/^(?:\.\/)?(\d\d)-([a-z0-9-]+)\.md(?:#([a-z0-9-]+))?$/.exec(e);return a?`#/docs/${a[2]}${a[3]?`/${a[3]}`:""}`:e}function H(e,a=18){const n=e<0n,s=n?-e:e,o=10n**BigInt(a),l=(s/o).toLocaleString("en-US"),r=(s%o).toString().padStart(a,"0").replace(/0+$/,"");return(n?"−":"")+l+(r?"."+r:"")}const Be=e=>H(e,2);function B(e,a){let n;try{if(a==null||a==="")return;n=BigInt(a)}catch{return}switch(e){case"int":return n.toLocaleString("en-US");case"imd":return`${H(n)} IMD`;case"plea":return`${H(n)} PLEA`;case"duration":return Ae(Number(n));case"bps":return`${Be(n)}%`;case"multiplier":return`×${H(n,4)}`;default:return}}const ee=new Set;function X(e,a,n){const s=a==="_meta"?void 0:e[a];if(!s)return;const o=s.chain?n?.[s.chain]:void 0;if(o==null)return s.text;let l=!0;try{l=s.value!==null&&BigInt(o)===BigInt(s.value)}catch{l=!1}return!l&&!ee.has(a)&&(ee.add(a),console.warn(`Docs: ${s.chain} on chain is ${String(o)}, numbers.json's ${a} says ${s.value}; the page shows the chain's.`)),s.format==="text"?s.text:B(s.format,o)??s.text}function Re(e,a,n){const s=a==="_meta"?void 0:e[a];if(!s)return;const o=s.chain?n?.[s.chain]:void 0;try{return o!=null?BigInt(o):s.value===null?void 0:BigInt(s.value)}catch{return}}const me=(e,a)=>e.items.map(n=>A(n.c,a)+(n.sub?" "+me(n.sub,a):"")).join(" ");function q(e,a){switch(e.t){case"p":case"pre":return A(e.c,a);case"list":return me(e,a);case"table":return[e.head,...e.rows].map(n=>n.map(s=>A(s,a)).join(" ")).join(" ");case"quote":return e.c.map(n=>q(n,a)).join(" ");case"callout":return[e.kind==="builders"?"For builders":"",e.title?A(e.title,a):"",...e.c.map(n=>q(n,a))].join(" ");default:return""}}function Fe(e,a){const n=[];for(const s of e){let o={slug:s.slug,page:s.title,heading:"",id:"",text:"",order:n.length};const l=[],r=()=>{o.text=l.join(" ").replace(/\s+/g," ").trim(),(o.heading||o.text)&&n.push({...o,order:n.length}),l.length=0};for(const c of s.blocks)if(!(c.t==="h"&&c.level===1)){if(c.t==="h"){r(),o={slug:s.slug,page:s.title,heading:A(c.c,a),id:c.id,text:"",order:0};continue}l.push(q(c,a))}r()}return n}const I=e=>e.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,""),J=e=>I(e).split(/[^\p{L}\p{N}%.×-]+/u).filter(a=>a.length>0),We=(e,a)=>{let n=0,s=e.indexOf(a);for(;s>=0&&n<5;)n++,s=e.indexOf(a,s+a.length);return n},fe=e=>e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),te=(e,a)=>new RegExp(`(^|[^\\p{L}\\p{N}])${fe(a)}`,"u").test(e),ae=(e,a)=>new RegExp(`(^|[^\\p{L}\\p{N}])${fe(a)}($|[^\\p{L}\\p{N}])`,"u").test(e);function Ye(e,a,n=8){const s=J(a);if(s.join("").length<2)return[];const o=s.join(" "),l=[];for(const r of e){const c=I(r.heading),d=I(r.page),i=I(r.text);if(!s.every(p=>c.includes(p)||d.includes(p)||i.includes(p)))continue;let u=s.length>1&&c.includes(o)?20:0;for(const p of s)u+=(te(c,p)?10:0)+(te(d,p)?5:0)+We(i,p)+(ae(c,p)||ae(i,p)?2:0);l.push({e:r,score:u})}return l.sort((r,c)=>c.score-r.score||r.e.order-c.e.order),l.slice(0,n).map(({e:r})=>({entry:r,href:pe(`#/docs/${r.slug}${r.id?`/${r.id}`:""}`),snippet:Ue(r.text,s)}))}function Ue(e,a,n=120){const s=I(e),o=Math.min(...a.map(c=>s.indexOf(c)).filter(c=>c>=0),1/0);if(e.length<=n)return e;let l=o===1/0?0:Math.max(0,o-Math.floor(n/3));l>0&&(l=e.indexOf(" ",l)+1||l);let r=Math.min(e.length,l+n);return r<e.length&&(r=e.lastIndexOf(" ",r)>l?e.lastIndexOf(" ",r):r),(l>0?"…":"")+e.slice(l,r)+(r<e.length?"…":"")}const ze={note:{kind:"info",icon:"info",title:void 0},warn:{kind:"warn",icon:"warning",title:void 0},builders:{kind:"builders",icon:"seal-check",title:"For builders"}};function V(e,a){const n=a.num(e);if(n===void 0)throw Error(`The docs name an unknown number {{${e}}}.`);return n}function v(e,a,n="i"){return e.map((s,o)=>{const l=`${n}.${o}`;switch(s.t){case"text":return s.v;case"num":{const r=V(s.key,a);return r.split(" ").length<=3?t.jsx("span",{className:"nowrap",children:r},l):r}case"strong":return t.jsx("strong",{children:v(s.c,a,l)},l);case"em":return t.jsx("em",{children:v(s.c,a,l)},l);case"code":return t.jsx("code",{children:v(s.c,a,l)},l);case"link":{const r=pe(s.href);return/^https?:\/\//.test(r)?t.jsxs("a",{href:r,target:"_blank",rel:"noreferrer",className:"docs-ext",children:[v(s.c,a,l),t.jsx(k,{name:"arrow-square-out"}),t.jsx("span",{className:"sr-only",children:" (opens in a new tab)"})]},l):t.jsx("a",{href:r,children:v(s.c,a,l)},l)}}})}function we(e,a,n){const s=e.items.map((o,l)=>t.jsxs("li",{children:[v(o.c,a,`${n}.${l}`),o.sub&&we(o.sub,a,`${n}.${l}.s`)]},l));return e.ordered?t.jsx("ol",{start:e.start===1?void 0:e.start,children:s},n):t.jsx("ul",{children:s},n)}const ne={l:void 0,c:"c",r:"r"};function K(e,a,n="b"){return e.map((s,o)=>{const l=`${n}.${o}`;switch(s.t){case"h":{const r=v(s.c,a,l);if(s.level===1)return t.jsx("div",{className:"page-title",children:t.jsx("h1",{children:r})},l);if(s.level===4)return t.jsx("h4",{id:U(s.id),tabIndex:-1,children:r},l);const c=s.level===2?"h2":"h3",d=A(s.c,i=>V(i,a));return t.jsxs("div",{className:`docs-h docs-h--${s.level}`,children:[t.jsx(c,{id:U(s.id),tabIndex:-1,children:r}),t.jsx("a",{className:"docs-anchor",href:L(a.slug,s.id),"aria-label":`Link to ${d}`,children:t.jsx(k,{name:"link"})})]},l)}case"p":return t.jsx("p",{children:v(s.c,a,l)},l);case"list":return we(s,a,l);case"table":{const r=s.head.map(c=>A(c,d=>V(d,a))).join(", ");return t.jsx("div",{className:"table-wrap docs-table",role:"region","aria-label":`Table: ${r}`,tabIndex:0,children:t.jsxs("table",{className:"table",children:[t.jsx("thead",{children:t.jsx("tr",{children:s.head.map((c,d)=>t.jsx("th",{scope:"col",className:ne[s.align[d]||"l"],children:v(c,a,`${l}.h${d}`)},d))})}),t.jsx("tbody",{children:s.rows.map((c,d)=>t.jsx("tr",{children:c.map((i,u)=>t.jsx("td",{className:ne[s.align[u]||"l"],children:v(i,a,`${l}.${d}.${u}`)},u))},d))})]})},l)}case"quote":return t.jsx("blockquote",{className:"docs-quote stack stack--sm",children:K(s.c,a,l)},l);case"pre":return t.jsx("pre",{className:"docs-code",children:t.jsx("code",{children:v(s.c,a,l)})},l);case"hr":return t.jsx("hr",{},l);case"diagram":{const r=a.diagrams[s.name];if(!r)throw Error(`The docs name an unknown diagram "${s.name}".`);return t.jsx("div",{className:"docs-diagram",children:t.jsx(r,{})},l)}case"callout":{const r=ze[s.kind],c=s.title?v(s.title,a,`${l}.t`):r.title;return t.jsx("div",{className:`docs-callout docs-callout--${s.kind}`,children:t.jsx(Pe,{kind:r.kind,icon:r.icon,title:c,children:t.jsx("div",{className:"stack stack--sm",children:K(s.c,a,l)})})},l)}}})}function qe({tree:e,ctx:a}){return t.jsx(t.Fragment,{children:K(e,a)})}const Ve=`# Start here

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
`,Ke=`# Buying

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
`,Xe=`# Selling: plead

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
`,Je=`# Your bar

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
`,Qe=`# The judges

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
`,Ze=`# Appeals

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
`,et=`# Letters

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
`,tt=`# The auto-sell box

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
`,at=`# Objection!

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
`,nt=`# Seasons and prizes

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
`,st=`# Fees

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
`,ot=`# The pool: cap, burn and the buy wall

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
`,lt=`# The dead-man

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
`,rt=`# Keepers

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
`,it=`# Contracts and owner

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
`,ct=`# Audits

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
`,ht=`# Risks and FAQ

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
`,ut=`# Glossary

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
`,dt={deployment:"PLEA launch #2647 on Ethereum (block 26,293,890)",source:"khaed1/plea, the branch IMD deployed for the Ethereum launch, @ 42e0f855875786a953e945e528e9d7f2724a5352 (its src/; every file:line below is there)",status:"Checked 2026-10-29 by the numbers agent: every entry re-read in src/ at 42e0f85 and launch.json; every chain-bound value read from the launched contracts (read-only calls); trading not open yet (PleaHook.seeded false, PleaLaunch.opened false), so seed-time values (the cap's daily allowance) are computed",format:"key -> {text: words the docs print, value: raw on-chain value as a decimal string or null, chain: the site's constant key con(s, 'Contract.NAME') or null, format: int|imd|plea|duration|bps|multiplier|text, source: file:line, what: one line}. Whenever value is set and format is not text, text is format(value) exactly (the unit tests check it)"},pt={text:"69",value:"69",chain:"CabalGate.PASS_MARK",format:"int",source:"src/CabalGate.sol:122; need = PASS_MARK - fact score :433",what:"need = pass mark - fact score; a plea is approved when the judges' score is at least its need (:554)"},mt={text:"45",value:"45",chain:"CabalGate.MAX_PLEA_SCORE",format:"int",source:"src/CabalGate.sol:123; CannotPass :433-434; ScoreOutOfRange :551-552",what:"the judges' scale is 0 to 45; a plea whose need is above 45 is refused (CannotPass)"},ft={text:"30",value:"30",chain:"CabalGate.PANEL_SIZE",format:"int",source:"src/CabalGate.sol:124; checked :545-550",what:"judges on a panel (the Cabal)"},wt={text:"17",value:"17",chain:"CabalGate.QUORUM",format:"int",source:"src/CabalGate.sol:125; at least 17 agreed :545-550",what:"judges who must agree for a verdict"},bt={text:"0.5 IMD",value:"500000000000000000",chain:"CabalGate.ORACLE_FEE",format:"imd",source:"src/CabalGate.sol:110; paid to IMD's Intake in _ask :452-463",what:"a plea's or an appeal's oracle fee, in IMD; spent whatever happens (approved, denied, no verdict)"},xt={text:"0.35 IMD",value:"350000000000000000",chain:"CabalGate.APPEAL_POOL_SHARE",format:"imd",source:"src/CabalGate.sol:111; paid to the buy wall by _payAppeal :396-401 (PleaHook.fundWall)",what:"an appeal's extra payment, to the buy wall"},_t={text:"0.85 IMD",value:"850000000000000000",chain:null,format:"imd",source:"src/CabalGate.sol:110-111 (0.5 + 0.35), appeal :347-350",what:"what an appeal costs in IMD: the oracle fee plus the wall share"},yt={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:377-378, :382 (NotDenied, AlreadyAppealed); an expired appeal frees its slot :508",what:"appeals per denied plea; an appeal itself cannot be appealed; an appeal that got no verdict may be sent again inside the window, paying again"},gt={text:"7 minutes",value:"420",chain:"CabalGate.EXECUTE_WINDOW",format:"duration",source:"src/CabalGate.sol:112; WindowLapsed :620; lapse :492-496",what:"time to sell after an approval; after it the approval lapses"},vt={text:"4 hours",value:"14400",chain:"CabalGate.COOLDOWN",format:"duration",source:"src/CabalGate.sol:113; _requireCanPlead :469-476, _cooldown :479-482; a lapse is timed from the approval :494",what:"no new plea for this long after a sale, a denial or a lapsed approval (a lapse counts from the approval's time); none after a plea that got no verdict"},Et={text:"4 hours",value:"14400",chain:"CabalGate.COOLDOWN",format:"duration",source:"src/CabalGate.sol:379 (AppealClosed)",what:"an appeal must be sent within this long after the denial"},kt={text:"20 minutes",value:"1200",chain:"CabalGate.PENDING_EXPIRY",format:"duration",source:"src/CabalGate.sol:114; expire :514-521; a later verdict is refused :540-542",what:"a plea with no verdict after this (or once IMD's Intake closed it without one) can be closed by anyone: no cooldown, the fee is spent"},At={text:"280",value:"280",chain:"CabalGate.MAX_PLEA_BYTES",format:"int",source:"src/CabalGate.sol:115; _validateText :824-865",what:"a plea's text, 1 to 280 bytes of UTF-8 (the number alone: a page writes the word bytes after it)"},Pt={text:"2,500,000 PLEA",value:"2500000000000000000000000",chain:"CabalGate.MAX_SELL",format:"plea",source:"src/CabalGate.sol:116; _checkAmount :525-530",what:"most PLEA one plea may sell"},jt={text:"50%",value:"5000",chain:"CabalGate.MAX_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:117; :526",what:"most of your balance one plea may sell"},Tt={text:"1%",value:"100",chain:"CabalGate.MIN_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:118-119; :527-529 (AmountTooSmall)",what:"least share of your balance a plea may sell (or 2,500,000 PLEA when 1% is more)"},Lt={text:"250,000,000 PLEA",value:"250000000000000000000000000",chain:null,format:"plea",source:"src/CabalGate.sol:523-528 (1% of 250,000,000 = MAX_SELL)",what:"above this balance the 1% minimum is capped at 2,500,000 PLEA, so the least and the most a plea may sell meet"},It={text:"33 hours",value:"118800",chain:"CabalGate.DEADMAN",format:"duration",source:"src/CabalGate.sol:147, :200-204; launch.json CabalGate argument 7 = 118800; reset only by a signed plea or appeal verdict :557",what:"the Cabal dies after this long without a signed verdict on a plea or an appeal, for good"},Nt={text:"15 days",value:"1296000",chain:"Seasons.SEASON",format:"duration",source:"src/Seasons.sol:83,107 = CabalGate.SEASON (src/CabalGate.sol:146; launch.json CabalGate argument 6 = 1296000)",what:"one season; seasons run back to back from the moment trading opens"},Ct={text:"selling at most 20%: 16 points; at most 35%: 9; more: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:270 (share rounded up :260-264; an appeal takes the lesser of its share and the original's :266-268, :427-431)",what:"share-sold part of the fact score"},Dt={text:"20%",value:"2000",chain:null,format:"bps",source:"src/CabalGate.sol:270",what:"selling at most this share of your PLEA scores the top share points"},St={text:"35%",value:"3500",chain:null,format:"bps",source:"src/CabalGate.sol:270",what:"selling at most this share (and more than 20%) scores the middle share points"},$t={text:"16",value:"16",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for selling at most 20% of your PLEA"},Mt={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for more than 20% and at most 35%"},Gt={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for more than 35%"},Ot={text:"held under a day: 0; a day: 1; 3 days: 2; 7 days: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:300-305; the time is the buy-weighted average of your buys (src/PleaHook.sol:731-739)",what:"holding-time part of the fact score"},Ht={text:"0",value:"0",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for PLEA held under a day"},Bt={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least a day"},Rt={text:"2",value:"2",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least 3 days"},Ft={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least 7 days"},Wt={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:304 (held >= 1 days)",what:"days held for the first holding point (a page writes day or days after it)"},Yt={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:304 (held >= 3 days)",what:"days held for the second holding point"},Ut={text:"7",value:"7",chain:null,format:"int",source:"src/CabalGate.sol:304 (held >= 7 days)",what:"days held for the third and last holding point"},zt={text:"at a loss: 13; gain at most 50%: 12; at most 200%: 10; at most 500%: 8; at most 1,000%: 6; more: 4",value:null,chain:null,format:"text",source:"src/CabalGate.sol:279-288 (the recorded PLEA at the latest hourly price vs the IMD the buys cost, fees included: src/PleaHook.sol:566, :738)",what:"profit part of the fact score"},qt={text:"13",value:"13",chain:null,format:"int",source:"src/CabalGate.sol:283",what:"profit points at a loss"},Vt={text:"12",value:"12",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 50%"},Kt={text:"10",value:"10",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 200%"},Xt={text:"8",value:"8",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 500%"},Jt={text:"6",value:"6",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 1,000%"},Qt={text:"4",value:"4",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain above 1,000%"},Zt={text:"50%",value:"5000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g * 2 <= spent)",what:"first profit band edge"},ea={text:"200%",value:"20000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 2)",what:"second profit band edge"},ta={text:"500%",value:"50000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 5)",what:"third profit band edge"},aa={text:"1,000%",value:"100000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 10)",what:"fourth profit band edge"},na={text:"PLEA no buy record covers (airdrop, prizes) counts as held since trading opened, at profit 9",value:null,chain:null,format:"text",source:"src/CabalGate.sol:274-278, :289-292 (PLEA-weighted mean of the record's points and the received points, rounded to the nearest point)",what:"received PLEA"},sa={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:291",what:"profit points for PLEA no buy record covers"},oa={text:"24-hour price up more than 2%: 9; within 2% (or no price 24 hours ago): 5; down more than 2%: 0",value:null,chain:null,format:"text",source:"src/CabalGate.sol:294-297; the hour checkpoints src/PleaHook.sol:294-309",what:"trend part of the fact score"},la={text:"2%",value:"200",chain:null,format:"bps",source:"src/CabalGate.sol:296-297 (latest > ago * 102 / 100; latest * 100 >= ago * 98)",what:"how far the price must move in 24 hours to count as up or down"},ra={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:296",what:"trend points when the price rose more than 2% in 24 hours"},ia={text:"5",value:"5",chain:null,format:"int",source:"src/CabalGate.sol:295, :297",what:"trend points within 2%, or when no price from 24 hours ago exists (the first day)"},ca={text:"0",value:"0",chain:null,format:"int",source:"src/CabalGate.sol:294-297",what:"trend points when the price fell more than 2%"},ha={text:"1 hour",value:"3600",chain:null,format:"duration",source:"src/PleaHook.sol:278-309, :1057-1067; src/CabalGate.sol:247-248",what:"prices for the fact score are hourly checkpoints (the price before each hour's first trade), never the spot price"},ua={text:"48",value:"48",chain:null,format:"int",source:"src/PleaHook.sol:195-198, :300-308",what:"hours of checkpoints kept; the 24-hour price is the newest checkpoint at least 24 and at most 48 hours old"},da={text:"41",value:"41",chain:null,format:"int",source:"16 + 3 + 13 + 9 (src/CabalGate.sol:270-297)",what:"highest fact score"},pa={text:"7",value:"7",chain:null,format:"int",source:"3 + 0 + 4 + 0 (src/CabalGate.sol:270-297)",what:"lowest fact score"},ma={text:"28",value:"28",chain:null,format:"int",source:"69 - 41",what:"lowest possible need"},fa={text:"24",value:"24",chain:null,format:"int",source:"69 - 45 (src/CabalGate.sol:433-434)",what:"a fact score under this gives a need above 45: the plea is refused before any fee is paid"},wa={text:"sincerity 0-12, craft 0-12, respect 0-9, loyalty 0-12; anchors 0-10 empty/abusive/off-topic, 11-25 sincere but plain, 26-35 specific and well made, 36-45 memorable",value:null,chain:null,format:"text",source:'src/CabalGate.sol:131-134 DEFINITIONS ("plea")',what:"what the judges score"},ba={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for sincerity (an honest, specific reason to sell)"},xa={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for craft (wit, originality, quality of writing, in any language)"},_a={text:"9",value:"9",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for respect (for the Cabal and the holders)"},ya={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for loyalty (commitment to PLEA, such as keeping the rest)"},ga={text:"0-10 empty, abusive or off-topic; 11-25 sincere but plain; 26-35 specific and well made; 36-45 memorable",value:null,chain:null,format:"text",source:'src/CabalGate.sol:134 ("plea")',what:"the judges' anchors"},va={text:"5",value:"5",chain:null,format:"int",source:'src/CabalGate.sol:134 ("content")',what:"hate, harassment, sexual content, anything illegal, or details that identify another person score 0 to this"},Ea={text:"0",value:"0",chain:null,format:"int",source:'src/CabalGate.sol:134 ("manipulation")',what:"what manipulation scores (posing as a system, made-up rules, demands for a score, threats, offers, hidden instructions)"},ka={text:"20%",value:"2000",chain:null,format:"bps",source:"src/Letterbox.sol:111; _plead :297-300",what:"a letter pleads this share of your PLEA (at most 2,500,000 PLEA)"},Aa={text:"1,000 PLEA",value:"1000000000000000000000",chain:null,format:"plea",source:"src/Letterbox.sol:113; :300 (LetterTooSmall)",what:"a letter whose 20% is smaller is refused"},Pa={text:"5,000 PLEA",value:"5000000000000000000000",chain:null,format:"plea",source:"1,000 / 20% (src/Letterbox.sol:111-113, :297-300)",what:"a letter from a smaller balance is refused (its 20% is under 1,000 PLEA)"},ja={text:"0.25 IMD",value:"250000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:115; paid on delivery :424; returned by settle :453",what:"paid to whoever delivers an approved letter or auto-sell plea; returned to you when no sale happens (and to you when you send SELL)"},Ta={text:"0.75 IMD",value:"750000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:525-528 feesFor(false) = TIP + ORACLE_FEE (Ethereum buys the oracle fee: PleaLaunch.mintOracleFee() is false)",what:"the IMD a letter or auto-sell plea buys with your PLEA: the 0.5 IMD oracle fee and the 0.25 IMD tip"},La={text:"1.1 IMD",value:"1100000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:525-528 feesFor(true) = TIP + APPEAL_FEE + ORACLE_FEE",what:"the IMD an appeal letter buys with your PLEA: 0.5 + 0.35 + 0.25"},Ia={text:"110%",value:"11000",chain:null,format:"bps",source:"src/Letterbox.sol:133-134, :527; unspent PLEA comes back at once :386-387",what:"the fee sale may spend PLEA worth at most this share of the IMD it buys, at the hourly price"},Na={text:"10%",value:"1000",chain:null,format:"bps",source:"src/Letterbox.sol:135-136; :304 (FeeTooHigh)",what:"a letter's or auto-sell plea's fees may take at most this share of your PLEA"},Ca={text:"8.25 IMD",value:"8250000000000000000",chain:null,format:"imd",source:"0.75 IMD x 110% / 10% (src/Letterbox.sol:304, :525-528)",what:"the least your PLEA must be worth, at the hourly price, to send a letter or an auto-sell plea"},Da={text:"12.1 IMD",value:"12100000000000000000",chain:null,format:"imd",source:"1.1 IMD x 110% / 10% (src/Letterbox.sol:361-363; or the fees fit in 110% of the original plea's amount)",what:"the least your PLEA must be worth for an appeal letter, unless its fees fit in 110% of the original plea's amount"},Sa={text:"0.7 IMD",value:"700000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:120-124; _requireWorthTheFee :428-433 (TooSmallForTheFee)",what:"a letter or auto-sell plea worth less at the hourly price is refused"},$a={text:"95%",value:"9500",chain:null,format:"bps",source:"src/Letterbox.sol:127-129; _deliver :405-406",what:"a delivered sale must get at least 95% of its hourly value after the hook's sale fees"},Ma={text:"92.86%",value:null,chain:null,format:"text",source:"95% x (100% - 2.25%) = 92.8625% (src/Letterbox.sol:129-132, :405-406)",what:"the least a delivered sale pays, as a share of the plea's hourly value"},Ga={text:"0.35 IMD",value:"350000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:116-119; _deliver :415-421 (never more than the sale; letters do not pay it)",what:"taken from a delivered auto-sell sale, to the season's prize pot"},Oa={text:"APPEAL followed by your text; SELL; NAME followed by a name; any other text is a new plea",value:null,chain:null,format:"text",source:"src/Letterbox.sol:204-216, :495-519",what:"what a letter's first word does"},Ha={text:"3",value:"3",chain:null,format:"int",source:"src/Letterbox.sol:260-261 (BadName)",what:"shortest display name"},Ba={text:"20",value:"20",chain:null,format:"int",source:"src/Letterbox.sol:260-261 (BadName)",what:"longest display name"},Ra={text:"a-z, 0-9 and _",value:null,chain:null,format:"text",source:"src/Letterbox.sol:262-265",what:"the characters a display name may use"},Fa={text:"cabal, admin, imd, plea, owner",value:null,chain:null,format:"text",source:"src/Letterbox.sol:266-270",what:"names nobody may take"},Wa={text:"20 minutes",value:"1200",chain:"Tribunal.OBJECTION_WINDOW",format:"duration",source:"src/Tribunal.sol:126-127; :263 (WindowClosed)",what:"time after an approval to object; the plea's season points wait for it"},Ya={text:"0.5 IMD",value:"500000000000000000",chain:"Tribunal.ORACLE_FEE",format:"imd",source:"src/Tribunal.sol:130; :291-301",what:"an objection's oracle fee, spent whatever the ruling"},Ua={text:"0.35 IMD",value:"350000000000000000",chain:"Tribunal.STAKE",format:"imd",source:"src/Tribunal.sol:131; :290; settle :370-381",what:"back if sustained or void; to the plea's season prize pot if overruled"},za={text:"0.85 IMD",value:"850000000000000000",chain:null,format:"imd",source:"src/Tribunal.sol:130-131 (0.5 + 0.35)",what:"what an objection costs in IMD"},qa={text:"2",value:"2",chain:"Tribunal.MARGIN",format:"int",source:"src/Tribunal.sol:134-135; sustained when score + 2 < need :330",what:"sustained only when the new score is more than this below the need"},Va={text:"2",value:"2",chain:"Tribunal.MAX_OBJECTIONS",format:"int",source:"src/Tribunal.sol:132-133; :268-279",what:"objections per plea, each from a different wallet; both may wait at once"},Ka={text:"20 minutes",value:"1200",chain:"Tribunal.PENDING_EXPIRY",format:"duration",source:"src/Tribunal.sol:128-129; expire :361-368",what:"an objection with no ruling after this is void (stake back, fee spent)"},Xa={text:"280",value:"280",chain:"Tribunal.MAX_TEXT_BYTES",format:"int",source:"src/Tribunal.sol:136; :483-486",what:"an objection's text, in UTF-8 bytes (a page writes the word bytes after it)"},Ja={text:"60",value:"60",chain:"Seasons.MIN_POINTS",format:"int",source:"src/Seasons.sol:60; :339, :444",what:"points to qualify for a prize"},Qa={text:"25",value:"25",chain:"Seasons.TOP",format:"int",source:"src/Seasons.sol:61; :338",what:"ranks paid each season"},Za={text:"3",value:"3",chain:null,format:"int",source:"src/Seasons.sol:86-87, :265-281",what:"your best pleas that count in a season"},en={text:"135",value:"135",chain:null,format:"int",source:"3 x 45 (src/Seasons.sol:265-281)",what:"most points a wallet can have in a season without a seat"},tn={text:"162",value:"162",chain:null,format:"int",source:"3 x 54 (src/Seasons.sol:133-135, :265-281)",what:"most points with an IMD seat"},an={text:"4.5% for 1st down to 3.5% for 25th, in a straight line (rounded to whole basis points), 100% in all",value:null,chain:null,format:"text",source:"src/Seasons.sol:74-76 SHARES; shareBps :117-119 (on chain: 450 ... 350, sum 10,000)",what:"prize shares"},nn={text:"4.5%",value:"450",chain:null,format:"bps",source:"src/Seasons.sol:76; Seasons.shareBps(0) = 450 on chain",what:"the 1st place's share of the pot and of the bonus"},sn={text:"3.5%",value:"350",chain:null,format:"bps",source:"src/Seasons.sol:76; Seasons.shareBps(24) = 350 on chain",what:"the 25th place's share"},on={text:"4.50, 4.46, 4.42, 4.38, 4.33, 4.29, 4.25, 4.21, 4.17, 4.12, 4.08, 4.04, 4.00, 3.96, 3.92, 3.88, 3.83, 3.79, 3.75, 3.71, 3.67, 3.62, 3.58, 3.54, 3.50",value:null,chain:null,format:"text",source:"src/Seasons.sol:76; Seasons.shareBps(0..24) on chain",what:"every rank's share in percent, 1st to 25th"},ln={text:"1 hour",value:"3600",chain:"Seasons.CLOSE_GRACE",format:"duration",source:"src/Seasons.sol:62-64; :326 (NotReady)",what:"after a season ends, before anyone can close it"},rn={text:"6",value:"6",chain:"Seasons.BONUS_SEASONS",format:"int",source:"src/Seasons.sol:65-66; :350",what:"seasons that also pay the PLEA bonus"},cn={text:"10,000,000 PLEA",value:"10000000000000000000000000",chain:"Seasons.BONUS_PER_SEASON",format:"plea",source:"src/Seasons.sol:67; _payBonus :437-460",what:"PLEA bonus per season, same shares and same 60-point bar; unpaid shares are burned"},hn={text:"60,000,000 PLEA",value:"60000000000000000000000000",chain:null,format:"plea",source:"6 x 10,000,000 = Seasons' 6% (src/PLEA.sol:105)",what:"all six seasons' bonus"},un={text:"×1.2",value:"12000",chain:"Seasons.SEAT_MULTIPLIER_BPS",format:"multiplier",source:"src/Seasons.sol:68-71; pointsFor :131-135 (rounded down; read when the plea is recorded)",what:"points for an IMD seat holder; points only, never the need or the 60-point bar"},dn={text:"a score of 45 counts 54 points",value:null,chain:null,format:"text",source:"45 x 12,000 / 10,000 = 54 (src/Seasons.sol:134)",what:"the seat multiplier on the top score"},pn={text:"2.25%",value:"225",chain:null,format:"bps",source:"src/PleaHook.sol:73-79 (IMD_FEE_BPS 200 of the trade's IMD + PLEA_BURN_BPS 25 of its PLEA)",what:"every trade's fee"},mn={text:"2%",value:"200",chain:"PleaHook.IMD_FEE_BPS",format:"bps",source:"src/PleaHook.sol:78; a share of the IMD that reaches or leaves the pool :470-472, :551",what:"the IMD part of every trade's fee"},fn={text:"0.5%",value:"50",chain:"PleaHook.CASHBACK_BPS",format:"bps",source:"src/PleaHook.sol:74; :598; _payCashback :758-781",what:"back to the trader as staked IMD (sIMD, imd/acc's Stacker); stays in the pool when no trader is known (after the death)"},wn={text:"1%",value:"100",chain:"PleaHook.OWNER_BPS",format:"bps",source:"src/PleaHook.sol:75; :599, :619",what:"to the owner (the hook's fixed fee receiver)"},bn={text:"0.25%",value:"25",chain:"PleaHook.PRIZE_BPS",format:"bps",source:"src/PleaHook.sol:76; :600-601 (to pool liquidity once the Cabal is dead)",what:"to the season's prize pot while the Cabal lives"},xn={text:"0.25%",value:"25",chain:"PleaHook.POOL_BPS",format:"bps",source:"src/PleaHook.sol:77; :618, :630-633",what:"kept in the pool for the buy wall"},_n={text:"0.25%",value:"25",chain:"PleaHook.PLEA_BURN_BPS",format:"bps",source:"src/PleaHook.sol:79; :594, :644-654",what:"of the trade's PLEA, burned"},yn={text:"1.75%",value:"175",chain:null,format:"bps",source:"0.5% + 1% + 0.25% (src/PleaHook.sol:598-602)",what:"the IMD fee parts paid out of the pool (cashback, owner, prize)"},gn={text:"90 minutes",value:"5400",chain:"PleaHook.LAUNCH_WINDOW",format:"duration",source:"src/PleaHook.sol:80; launchExtraBps :311-317; max buy :721-725",what:"the launch window after trading opens"},vn={text:"70%",value:"7000",chain:"PleaHook.LAUNCH_EXTRA_BPS",format:"bps",source:"src/PleaHook.sol:81; :311-317, :485-487; a share of the IMD that reaches the pool :470-472; kept for the wall :618",what:"the extra fee on buys at the open; it falls in a straight line to 0% over the launch window; it stays in the pool for the buy wall"},En={text:"70% at the open, 58.33% after 15 minutes, 46.66% after 30, 35% after 45, 23.33% after 60, 11.66% after 75, 0% from 90",value:null,chain:null,format:"text",source:"7,000 x (5,400 - seconds since the open) / 5,400 basis points, rounded down (src/PleaHook.sol:311-317)",what:"the launch fee over the window"},kn={text:"72%",value:"7200",chain:null,format:"bps",source:"2% + 70% (src/PleaHook.sol:485-487)",what:"the IMD fee on a buy at the open, as a share of the IMD that reaches the pool"},An={text:"41.86%",value:null,chain:null,format:"text",source:"7,200 / 17,200 = 41.86% (src/PleaHook.sol:470-472: fee = amount x rate / (10,000 + rate))",what:"the fee at the open as a share of the IMD a buyer pays"},Pn={text:"5,000,000 PLEA",value:"5000000000000000000000000",chain:"PleaHook.LAUNCH_MAX_BUY",format:"plea",source:"src/PleaHook.sol:82; _checkMaxBuy :721-725 (BuyTooLarge); the pool's PLEA out before the burn :474, :538",what:"most PLEA one buy may take from the pool in the launch window"},jn={text:"0.00002 IMD",value:"20000000000000",chain:null,format:"imd",source:"20,000 IMD / 1,000,000,000 PLEA (src/PleaHook.sol:384-389; the opening tick is rounded up to the 60-tick grid :394-396, about 0.23% higher)",what:"the opening price of one PLEA"},Tn={text:"about 100 IMD",value:null,chain:null,format:"text",source:"5,000,000 x 0.00002 IMD (before price impact and fees)",what:"what the largest launch-window buy is worth at the opening price"},Ln={text:"2 IMD",value:"2000000000000000000",chain:"PleaHook.PAYOUT_RESERVE",format:"imd",source:"src/PleaHook.sol:83-86; :603-617 (PayoutsToPool)",what:"the opening exception: while the pool's own IMD plus a buy's fee is under this and the pool cannot pay out, that buy's cashback, owner and prize shares join the pool instead"},In={text:"20,000 IMD",value:"20000000000000000000000",chain:"PleaHook.MARKET_CAP_IMD",format:"imd",source:"src/PleaHook.sol:87-88; seed :376-424",what:"the market cap trading opens at"},Nn={text:"14,000 IMD",value:"14000000000000000000000",chain:null,format:"imd",source:"src/PleaLaunch.sol:211-214 (BelowAgreedMarketCap)",what:"on Ethereum, seed refuses a hook whose opening market cap is under this"},Cn={text:"15 days",value:"1296000",chain:null,format:"duration",source:"src/PleaLaunch.sol:211-212 (BelowAgreedTiming)",what:"on Ethereum, seed refuses seasons shorter than this"},Dn={text:"33 hours",value:"118800",chain:null,format:"duration",source:"src/PleaLaunch.sol:211-212 (BelowAgreedTiming)",what:"on Ethereum, seed refuses a dead-man shorter than this"},Sn={text:"900,000 PLEA",value:"900000000000000000000000",chain:"PleaHook.CAP_FLOOR",format:"plea",source:"src/PleaHook.sol:89; :803",what:"the inventory cap never falls below this"},$n={text:"15",value:"15",chain:"PleaHook.CAP_DECAY_DAYS",format:"int",source:"src/PleaHook.sol:90-93; capDecayPerDay :409",what:"the cap may fall from the seeded PLEA to its floor in this many days at the fastest (a page writes the word days after it)"},Mn={text:"about 54.6 million PLEA",value:null,chain:null,format:"text",source:"(820,000,000 - 900,000) / 15 = 54,606,666 (src/PleaHook.sol:409; the seeded amount is a hair under 820,000,000: the 1-in-a-million rounding margin :1084)",what:"how far the cap may fall per day at most (fixed at the seed)"},Gn={text:"1 PLEA",value:"1000000000000000000",chain:"PleaHook.MIN_TRIM",format:"plea",source:"src/PleaHook.sol:94; :331-335, :815",what:"the least excess above the cap that is trimmed"},On={text:"1 IMD",value:"1000000000000000000",chain:"PleaHook.WALL_THRESHOLD",format:"imd",source:"src/PleaHook.sol:95; pendingRebalance :337-340",what:"kept IMD worth a rebalance"},Hn={text:"1,000 PLEA",value:"1000000000000000000000",chain:"PleaHook.WALL_MIN_FILL",format:"plea",source:"src/PleaHook.sol:96; :339",what:"PLEA bought by the wall worth a rebalance (it is burned then)"},Bn={text:"700",value:"700",chain:"PleaHook.WALL_GUARD_TICKS_PER_DAY",format:"int",source:"src/PleaHook.sol:178-185; _updateWallGuard :1022-1055",what:"ticks a day the wall's ceiling may rise toward a higher price (it falls at once); a page writes the word ticks after it"},Rn={text:"about 7.25%",value:null,chain:null,format:"text",source:"1.0001 ^ 700 = 1.0725",what:"the wall guard's daily step as a price change"},Fn={text:"200",value:"200",chain:null,format:"int",source:"src/PleaHook.sol:177; _observeTick :1002-1014",what:"ticks a block the hook's reference price may move (about 2%)"},Wn={text:"60",value:"60",chain:"PleaHook.TICK_SPACING",format:"int",source:"src/PleaHook.sol:106",what:"the pool's tick spacing"},Yn={text:"0",value:"0",chain:"PleaHook.LP_FEE",format:"int",source:"src/PleaHook.sol:105",what:"the pool's own swap fee: every fee is the hook's"},Un={text:"1,400,000",value:"1400000",chain:null,format:"int",source:"creditGas 400,000 + SWAP_RESERVE 1,000,000 (src/PleaHook.sol:99-102, :452; launch.json PleaLaunch argument 8 = 400000)",what:"gas a trade must still have when it reaches the hook, or it reverts NotEnoughGas"},zn={text:"1,000,000,000 PLEA",value:"1000000000000000000000000000",chain:"PLEA.TOTAL_SUPPLY",format:"plea",source:"src/PLEA.sol:27; minted once in init :98-108",what:"fixed supply"},qn={text:"820,000,000 PLEA",value:"820000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:104 (82%); on chain PLEA.balanceOf(hook) = 820,000,000 before the seed",what:"the pool's PLEA: all of it is the pool's liquidity"},Vn={text:"60,000,000 PLEA",value:"60000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:105 (6%); on chain PLEA.balanceOf(Seasons)",what:"Seasons' PLEA bonus"},Kn={text:"120,000,000 PLEA",value:"120000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:106 (12%); on chain PLEA.balanceOf(PleaDistributor)",what:"the distributor's PLEA (the swarm's 10% and a 2% airdrop, paid by one Merkle root)"},Xn={text:"82%",value:"8200",chain:null,format:"bps",source:"src/PLEA.sol:104",what:"the pool's share of the supply"},Jn={text:"6%",value:"600",chain:null,format:"bps",source:"src/PLEA.sol:105",what:"Seasons' share"},Qn={text:"12%",value:"1200",chain:null,format:"bps",source:"src/PLEA.sol:106",what:"the distributor's share"},Zn={text:"10%",value:"1000",chain:null,format:"bps",source:"src/PLEA.sol:10-11, src/PleaDistributor.sol:10 (comments: the code pays whatever the owner's root lists)",what:"the swarm's part of the distributor's 12%"},es={text:"2%",value:"200",chain:null,format:"bps",source:"src/PLEA.sol:10-11, src/PleaDistributor.sol:10 (comments: the code pays whatever the owner's root lists)",what:"the airdrop's part of the distributor's 12%"},ts={text:"82% to the pool (820,000,000), 6% to Seasons (60,000,000), 12% to the distributor (120,000,000)",value:null,chain:null,format:"text",source:"src/PLEA.sol:95-108; minted at deployHook (block 26,294,113)",what:"supply at launch"},as={text:"Tue 24 Nov 2026, 15:00 UTC",value:"1795532400",chain:"PleaLaunch.START",format:"text",source:"launch.json PleaLaunch argument 9 = 1795532400; src/PleaLaunch.sol:69-70, :206",what:"from this time anyone may open trading (seed); the owner may open it earlier"},ns={text:"0x5BF3597216f9019Cf10CF680783289Efc8639Bf0",value:null,chain:null,format:"text",source:"launch.json $owner; on chain PLEA.owner(), PleaHook.owner(), PleaDistributor.owner()",what:"PLEA's owner, the hook's fee receiver and the distributor's owner"},ss={text:"#2647",value:null,chain:null,format:"text",source:"IMD's launch record (README of the site)",what:"IMD's launch number"},os={text:"26,293,890",value:"26293890",chain:null,format:"int",source:"Ethereum block of the launch transaction (PLEA's Launched event)",what:"the launch block"},ls={text:"26,294,106",value:"26294106",chain:null,format:"int",source:"PleaLaunch's LetterboxDeployed event",what:"the Letterbox's block"},rs={text:"26,294,111",value:"26294111",chain:null,format:"int",source:"PleaLaunch's TribunalDeployed event",what:"the Tribunal's block"},is={text:"26,294,113",value:"26294113",chain:null,format:"int",source:"PleaLaunch's HookDeployed event (PLEA minted its supply here)",what:"the hook's block"},cs={text:"0x1F158929496162b53fB232536468948e25170aB3",value:null,chain:null,format:"text",source:"launch #2647",what:"PLEA (the token)"},hs={text:"0x39AC882a1161EA19aCb6FBDd7A5835D96CF876EB",value:null,chain:null,format:"text",source:"launch #2647; PLEA.gate()",what:"CabalGate (pleas, verdicts, sales)"},us={text:"0xF7c024F7Bc96Cf152a572F6E184318ff6d380738",value:null,chain:null,format:"text",source:"launch #2647; PLEA.seasons()",what:"Seasons (points, prizes)"},ds={text:"0x97fAcE21C7a9f3b64D0f4E0bF21861721fBBfE3E",value:null,chain:null,format:"text",source:"launch #2647; PLEA.distributor()",what:"PleaDistributor (the 12%)"},ps={text:"0x9e75eabf8d1c905a07a0C99bb9eC9430a065358F",value:null,chain:null,format:"text",source:"launch #2647; PLEA.launcher()",what:"PleaLaunch (wiring, seed)"},ms={text:"0x00423EbaEd03445Fc1452d9A79A51E3C0DFdab5f",value:null,chain:null,format:"text",source:"PleaLaunch.letterbox(); PLEA.letterbox()",what:"Letterbox (letters, the auto-sell box)"},fs={text:"0x1aA665eB420F28103324daAAf034DE13EE6f53D9",value:null,chain:null,format:"text",source:"PleaLaunch.tribunal()",what:"Tribunal (Objection!)"},ws={text:"0xf1122bc96AdeA8768CFf2badf02b6D4594f928Cc",value:null,chain:null,format:"text",source:"PleaLaunch.hook(); PLEA.hook()",what:"PleaHook (the pool's hook: fees, cap, wall)"},bs={text:"0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7",value:null,chain:null,format:"text",source:"launch.json CabalGate arguments 3-4",what:"IMD (the pool's other token and the fee token)"},xs={text:"0x000000000004444c5dc75cB358380D2e3dE08A90",value:null,chain:null,format:"text",source:"launch.json PleaLaunch argument 5; PLEA.poolManager()",what:"Uniswap v4's PoolManager"},_s={text:"0x06909F672301F28A810f78cfe7a754851269F4F0",value:null,chain:null,format:"text",source:"launch.json PleaLaunch argument 7",what:"imd/acc's Stacker (pays the cashback as sIMD)"},ys={text:"0xa43e6F75ee006411F79Ac1C84120606C2330DE82",value:null,chain:null,format:"text",source:"launch.json CabalGate argument 2",what:"IMD's Intake (asks the Cabal)"},gs={text:"0x5598Aa9146215Bc13eb26f2c692Ad1461Fd32982",value:null,chain:null,format:"text",source:"launch.json CabalGate argument 5",what:"the key that signs the Cabal's answers"},vs={text:"0x0000eC93127BAA929E58E97dd0095A2BFb38ec1D",value:null,chain:null,format:"text",source:"launch.json Seasons argument 4; Seasons.seat()",what:"the IMD seat NFT (identity.md) behind the seat multiplier"},Es={text:"12",value:"12",chain:null,format:"int",source:"audit/FINDINGS.md Rounds table (rounds 1-12; 9-12 on the Ethereum code, the last on 571ae80, round 12)",what:"IMD swarm audit rounds"},ks={text:"852",value:"852",chain:null,format:"int",source:"README.md:299 (written 2026-10-17 for run 8.5's code; not re-counted for 42e0f85)",what:"the README's test count (unit, fuzz, invariant, adversarial, fork)"},As={_meta:dt,pass_mark:pt,max_score:mt,panel_size:ft,quorum:wt,oracle_fee:bt,appeal_wall_share:xt,appeal_total:_t,appeals_per_plea:yt,sell_window:gt,cooldown:vt,appeal_window:Et,pending_expiry:kt,max_plea_bytes:At,max_sell:Pt,max_share:jt,min_share:Tt,min_share_cap_balance:Lt,deadman:It,season_length:Nt,fact_share_bands:Ct,share_band_top:Dt,share_band_mid:St,fact_share_top:$t,fact_share_mid:Mt,fact_share_low:Gt,fact_held_points:Ot,held_points_0:Ht,held_points_1d:Bt,held_points_3d:Rt,held_points_7d:Ft,held_day_1:Wt,held_day_3:Yt,held_day_7:Ut,fact_profit_bands:zt,profit_points_loss:qt,profit_points_50:Vt,profit_points_200:Kt,profit_points_500:Xt,profit_points_1000:Jt,profit_points_more:Qt,profit_band_50:Zt,profit_band_200:ea,profit_band_500:ta,profit_band_1000:aa,fact_received:na,received_profit:sa,fact_trend:oa,trend_band:la,trend_up:ra,trend_flat:ia,trend_down:ca,checkpoint_interval:ha,price_ring_hours:ua,fact_max:da,fact_min:pa,need_min:ma,fact_needed:fa,judge_rubric:wa,judge_sincerity_max:ba,judge_craft_max:xa,judge_respect_max:_a,judge_loyalty_max:ya,judge_anchors:ga,judge_content_max:va,judge_manipulation:Ea,letter_share:ka,min_letter:Aa,letter_min_balance:Pa,runner_tip:ja,letter_fee:Ta,letter_appeal_fee:La,fee_cap:Ia,max_fee_share:Na,letter_min_value:Ca,letter_appeal_min_value:Da,min_sale_value:Sa,delivery_min_out:$a,delivery_floor:Ma,auto_sell_fee:Ga,letter_commands:Oa,name_min_length:Ha,name_max_length:Ba,name_chars:Ra,name_reserved:Fa,objection_window:Wa,objection_fee:Ya,objection_stake:Ua,objection_total:za,objection_margin:qa,max_objections:Va,objection_expiry:Ka,objection_bytes:Xa,min_points:Ja,top:Qa,best_count:Za,max_points:en,max_points_seat:tn,shares:an,share_first:nn,share_last:sn,shares_list:on,close_grace:ln,bonus_seasons:rn,bonus_per_season:cn,bonus_total:hn,seat_multiplier:un,seat_example:dn,fee_total:pn,fee_imd:mn,fee_cashback:fn,fee_owner:wn,fee_prize:bn,fee_pool:xn,fee_burn:_n,fee_payouts:yn,launch_window:gn,launch_extra:vn,launch_fee_curve:En,launch_open_fee:kn,launch_open_fee_of_payment:An,launch_max_buy:Pn,seed_price:jn,launch_max_buy_value:Tn,payout_reserve:Ln,market_cap:In,market_cap_check:Nn,seed_check_season:Cn,seed_check_deadman:Dn,cap_floor:Sn,cap_decay_days:$n,cap_decay_per_day:Mn,min_trim:Gn,wall_threshold:On,wall_min_fill:Hn,wall_guard:Bn,wall_guard_pct:Rn,ref_step:Fn,tick_spacing:Wn,lp_fee:Yn,swap_min_gas:Un,total_supply:zn,supply_pool:qn,supply_seasons:Vn,supply_distributor:Kn,supply_pool_pct:Xn,supply_seasons_pct:Jn,supply_distributor_pct:Qn,supply_swarm_pct:Zn,supply_airdrop_pct:es,supply_split:ts,start:as,owner:ns,launch_id:ss,launch_block:os,letterbox_block:ls,tribunal_block:rs,hook_block:is,addr_plea:cs,addr_gate:hs,addr_seasons:us,addr_distributor:ds,addr_launch:ps,addr_letterbox:ms,addr_tribunal:fs,addr_hook:ws,addr_imd:bs,addr_pool_manager:xs,addr_stacker:_s,addr_intake:ys,addr_oracle_signer:gs,addr_seat:vs,audit_rounds:Es,tests_count:ks},N=As;function be(e){return{text:a=>{const n=X(N,a,e);if(n===void 0)throw Error(`The docs name an unknown number {{${a}}}.`);return n},value:a=>{if(!(a in N)||a==="_meta")throw Error(`The docs name an unknown number {{${a}}}.`);return Re(N,a,e)}}}const xe=x.createContext(be()),Ps=xe.Provider,R=()=>x.useContext(xe),W=[{key:"fee_cashback",label:"Back to you, as staked IMD",fill:"var(--approved)",of:"IMD"},{key:"fee_owner",label:"The owner",fill:"var(--objection)",of:"IMD"},{key:"fee_prize",label:"The season’s prize pot",fill:"var(--pending)",of:"IMD"},{key:"fee_pool",label:"The buy wall, kept in the pool",fill:"var(--executed)",of:"IMD"},{key:"fee_burn",label:"Burned",fill:"var(--noverdict)",of:"PLEA"}],S=1e3,Y=48;function js(){const e=R(),a="fee-bar-"+x.useId().replace(/[^a-zA-Z0-9_-]/g,""),n=W.map(i=>e.value(i.key)??0n),s=n.reduce((i,u)=>i+u,0n),o=n.slice(0,4).reduce((i,u)=>i+u,0n),l=i=>B("bps",i);let r=0;const c=W.map((i,u)=>{const p=s?S*Number(n[u])/Number(s):S/W.length,m={...i,x:r,w:p,n:u+1,text:e.text(i.key)};return r+=p,m}),d=`A bar for the ${l(s)} fee every trade pays, in five numbered parts: `+c.map(i=>`${i.n}, ${i.label[0].toLowerCase()+i.label.slice(1)}: ${i.text} of the ${i.of}`).join("; ")+`. Parts 1 to 4 are ${l(o)} of the trade’s IMD; part 5 is ${c[4].text} of its PLEA.`;return t.jsxs("figure",{className:"docs-figure panel stack stack--md",children:[t.jsxs("figcaption",{className:"docs-figure__title",children:["The ",l(s)," fee on every trade: ",l(o)," of its IMD in four parts, and ",c[4].text," of its PLEA, burned"]}),t.jsxs("div",{className:"docs-bar",children:[t.jsxs("svg",{className:"docs-bar__svg",viewBox:`0 0 ${S} ${Y}`,preserveAspectRatio:"none",role:"img","aria-labelledby":`${a}-alt`,children:[t.jsx("title",{id:`${a}-alt`,children:d}),c.map(i=>t.jsx("rect",{x:i.x,y:"0",width:i.w,height:Y,style:{fill:i.fill}},i.key)),c.slice(1).map(i=>t.jsx("line",{x1:i.x,y1:"0",x2:i.x,y2:Y,vectorEffect:"non-scaling-stroke",style:{stroke:"var(--line)",strokeWidth:i.of==="PLEA"?8:3}},i.key))]}),c.map(i=>t.jsx("span",{className:"docs-bar__key",style:{left:`${(i.x+i.w/2)*100/S}%`},"aria-hidden":"true",children:i.n},i.key))]}),t.jsx(se,{rows:[...c.map(i=>[t.jsxs("span",{className:"docs-key-row",children:[t.jsxs("svg",{className:"docs-key",viewBox:"0 0 28 28","aria-hidden":"true",children:[t.jsx("rect",{x:"1",y:"1",width:"26",height:"26",rx:"4",style:{fill:i.fill,stroke:"var(--line)",strokeWidth:2}}),t.jsx("circle",{cx:"14",cy:"14",r:"9",style:{fill:"var(--day)",stroke:"var(--night)",strokeWidth:1.5}}),t.jsx("text",{x:"14",y:"14",dy:"0.35em",textAnchor:"middle",style:{fill:"var(--night)",fontFamily:"var(--font-body)",fontWeight:800,fontSize:12},children:i.n})]}),t.jsxs("span",{children:[t.jsxs("span",{className:"sr-only",children:["Part ",i.n,": "]}),i.label]})]}),t.jsxs(t.Fragment,{children:[i.text," ",t.jsxs("span",{className:"text-2",children:["of the ",i.of]})]})]),["Every trade",l(s),"total"]]}),t.jsx("p",{className:"small text-2",children:"Once the Cabal is dead there are no more seasons: part 3 joins the pool too."})]})}function Q({title:e,alt:a,children:n,after:s}){const o="dg-"+x.useId().replace(/[^a-zA-Z0-9_-]/g,"");return t.jsxs("figure",{className:"docs-figure panel stack stack--md dg",children:[t.jsx("figcaption",{className:"docs-figure__title",children:e}),t.jsxs("div",{className:"dg-art",role:"img","aria-labelledby":o,children:[t.jsx("span",{id:o,className:"sr-only",children:a}),n]}),s]})}function _e({down:e=!1}){return e?t.jsx("span",{className:"dg-arrow","aria-hidden":"true",children:t.jsx(k,{name:"arrow-down"})}):t.jsxs("span",{className:"dg-arrow","aria-hidden":"true",children:[t.jsx("span",{className:"dg-arrow__down",children:t.jsx(k,{name:"arrow-down"})}),t.jsx("span",{className:"dg-arrow__across",children:t.jsx(k,{name:"arrow-right"})})]})}function ye({n:e,icon:a,title:n,children:s,wait:o=!1}){return t.jsxs("div",{className:`dg-node${o?" dg-node--wait":""}`,children:[t.jsxs("span",{className:"dg-node__head",children:[e!==void 0&&t.jsx("span",{className:"dg-n",children:e}),a&&t.jsx(k,{name:a}),t.jsx("span",{children:n})]}),s]})}function C({children:e}){return t.jsx("div",{className:"dg-lane",children:e})}function ge({n:e,children:a}){return t.jsx("div",{className:"dg-lanes",style:{"--lanes":e},children:a})}function ve({icon:e,children:a}){return t.jsxs("div",{className:"dg-band",children:[t.jsx(k,{name:e}),t.jsx("p",{children:a})]})}const $=6,g=1e3;function Ts(){const e=R(),a=e.value("launch_extra")??0n,n=e.value("launch_window")??1n,s=e.value("fee_imd")??0n,o=h=>B("bps",h),l=h=>B("duration",h),r=h=>h>=n?0n:a*(n-h)/n,c=Array.from({length:$+1},(h,b)=>{const f=n*BigInt(b)/BigInt($);return{s:f,i:b,fee:r(f)}}),d=Number(n)*($+1)/$,i=h=>Number(h)/d*g,u=h=>a?g-Number(h)/Number(a)*g:g,p=i(n),m=h=>String(Number(h)/60),w=`A line chart of the launch fee over the launch window. It starts at ${o(a)} when trading opens and falls in a straight line to 0% at ${l(n)}, then stays at 0%. `+c.map(h=>h.i===0?`At the open: ${o(h.fee)}`:`after ${m(h.s)} minutes: ${o(h.fee)}`).join(", ")+`. It comes on top of the usual ${o(s)} of the IMD that reaches the pool. Until ${l(n)} after the open, one buy may take at most ${e.text("launch_max_buy")} from the pool.`;return t.jsx(Q,{title:`The launch fee: ${o(a)} at the open, 0% after ${l(n)}`,alt:w,after:t.jsxs(t.Fragment,{children:[t.jsx(se,{rows:c.map(h=>[h.i===0?"At the open":`${h.s>=n?"From":"After"} ${m(h.s)} minutes`,t.jsxs(t.Fragment,{children:[o(h.fee)," ",t.jsxs("span",{className:"text-2",children:["+ ",o(s)]})]})])}),t.jsxs("p",{className:"small text-2",children:["The launch fee is a share of the IMD that reaches the pool, on buys only, on top of the usual ",o(s),". It stays in the pool, for the buy wall."]})]}),children:t.jsxs("div",{className:"dg-chart",children:[t.jsx("span",{className:"dg-chart__title",children:"Launch fee, as a share of the IMD that reaches the pool"}),t.jsxs("div",{className:"dg-chart__plot",children:[t.jsxs("svg",{className:"dg-chart__svg",viewBox:`0 0 ${g} ${g}`,preserveAspectRatio:"none","aria-hidden":"true",children:[t.jsx("polygon",{points:`0,${u(a)} ${p},${g} 0,${g}`,style:{fill:"var(--action-soft)"}}),c.slice(1).map(h=>t.jsx("line",{x1:i(h.s),y1:"0",x2:i(h.s),y2:g,vectorEffect:"non-scaling-stroke",style:{stroke:"var(--line-soft)",strokeWidth:2,strokeDasharray:h.s===n?void 0:"4 4"}},h.i)),t.jsx("polyline",{points:`0,${u(a)} ${p},${g} ${g},${g}`,vectorEffect:"non-scaling-stroke",style:{fill:"none",stroke:"var(--ink)",strokeWidth:3,strokeLinejoin:"round"}})]}),c.map(h=>t.jsx("span",{className:"dg-chart__dot",style:{left:`${i(h.s)/10}%`,top:`${u(h.fee)/10}%`}},h.i)),t.jsx("span",{className:"dg-chart__y",style:{top:"0%"},children:o(a)}),t.jsx("span",{className:"dg-chart__y",style:{top:"50%"},children:o(a/2n)}),t.jsx("span",{className:"dg-chart__y",style:{top:"100%"},children:"0%"})]}),t.jsxs("div",{className:"dg-chart__row",children:[c.map(h=>t.jsx("span",{className:`dg-chart__x${h.i===0?" dg-chart__x--start":""}`,style:{left:`${i(h.s)/10}%`},children:m(h.s)},h.i)),t.jsx("span",{className:"dg-chart__x dg-chart__x--end",style:{left:"100%"},children:"min"})]}),t.jsx("span",{className:"dg-chart__title",children:"Minutes after trading opens"}),t.jsx("div",{className:"dg-chart__row",style:{width:`${p/10}%`},children:t.jsxs("span",{className:"dg-chart__span",children:["Until minute ",m(n),": at most ",e.text("launch_max_buy")," a buy"]})})]})})}const Ls={APPROVED:"approved",OVERTURNED:"approved",DENIED:"denied",UPHELD:"denied",PENDING:"pending","NO VERDICT":"noverdict",LAPSED:"lapsed",SOLD:"sold",OBJECTION:"objection",SUSTAINED:"objection",OVERRULED:"objection",VOID:"objection"};function E({state:e,sub:a,size:n}){return t.jsxs("span",{className:`stamp stamp--${Ls[e]}${n?` stamp--${n}`:""}`,children:[e,a&&t.jsx("span",{className:"stamp__sub",children:a})]})}function Is(){const e=R(),a=e.text,n=[{title:"Buy",text:"Open to anyone. Each buy records what you paid and when."},{title:"Plead",text:`Write why you want to sell, and pay the ${a("oracle_fee")} oracle fee.`,stamp:"PENDING"},{title:"Judged",text:`${a("panel_size")} judges score it from 0 to ${a("max_score")}; ${a("quorum")} must agree. Your need or more: approved.`,stamp:"APPROVED"},{title:"Sell",text:`Sell what you asked for, in one go, within ${a("sell_window")}.`,stamp:"SOLD"}],s=`Appeal once within ${a("appeal_window")}. Or wait out the cooldown, ${a("cooldown")}, and plead again.`,o=`No answer within ${a("pending_expiry")}. The fee is spent, and you may plead again at once.`,l=`Every verdict restarts its clock. After ${a("deadman")} without one, the Cabal dies for good: no more pleas, and PLEA trades freely.`,r="The PLEA loop, left to right: "+n.map((c,d)=>`${d+1}, ${c.title}: ${c.text}`).join(" ")+` A plea can also end two other ways. Denied: ${s} No verdict: ${o} Under it all, the dead-man: ${l}`;return t.jsxs(Q,{title:"Buy, plead, be judged, sell",alt:r,children:[t.jsx("div",{className:"dg-flow",children:n.map((c,d)=>t.jsxs(x.Fragment,{children:[d>0&&t.jsx(_e,{}),t.jsxs(ye,{n:d+1,title:c.title,children:[t.jsx("span",{className:"dg-node__text",children:c.text}),c.stamp&&t.jsx(E,{state:c.stamp,size:"sm"})]})]},c.title))}),t.jsx("p",{className:"small strong",children:"Or the plea ends another way:"}),t.jsxs(ge,{n:2,children:[t.jsxs(C,{children:[t.jsx(E,{state:"DENIED",size:"sm"}),t.jsx("p",{className:"small",children:s})]}),t.jsxs(C,{children:[t.jsx(E,{state:"NO VERDICT",size:"sm"}),t.jsx("p",{className:"small",children:o})]})]}),t.jsxs(ve,{icon:"hourglass",children:[t.jsx("b",{children:"Under it all, the dead-man."})," ",l]})]})}function Ns(){const e=R(),a=e.text,n={pending:`The Cabal reads your plea. A verdict can come for up to ${a("pending_expiry")}.`,approved:`Your score is at least your need. Sell it all, in one go, within ${a("sell_window")}.`,sold:"You sold in time.",lapsed:"The window passed with no sale. Nothing was sold; the points still count.",denied:`Your score is below your need. You may appeal once within ${a("appeal_window")}: a new plea, judged on its own text.`,overturned:"The appeal is approved: sell within the window.",upheld:"The appeal is denied too. No further appeal.",none:`No verdict within ${a("pending_expiry")}. Anyone may close the plea. The fee is spent.`,cooldown:`After a sale, a denial or a lapse, your next plea waits ${a("cooldown")}. After no verdict, it need not wait.`},s=`The states of a plea, each a stamp. PENDING: ${n.pending} Then one of three. APPROVED: ${n.approved} It ends SOLD (${n.sold}) or LAPSED (${n.lapsed}) DENIED: ${n.denied} The appeal ends OVERTURNED (${n.overturned}) or UPHELD (${n.upheld}) NO VERDICT: ${n.none} Cooldown: ${n.cooldown}`;return t.jsxs(Q,{title:"A plea's states, as the site stamps them",alt:s,children:[t.jsxs(ye,{title:"Sent",children:[t.jsx(E,{state:"PENDING",size:"sm"}),t.jsx("span",{className:"dg-node__text",children:n.pending})]}),t.jsx(_e,{down:!0}),t.jsxs(ge,{n:3,children:[t.jsxs(C,{children:[t.jsx(E,{state:"APPROVED",sub:"score ≥ need"}),t.jsx("p",{className:"small",children:n.approved}),t.jsx("p",{className:"small strong",children:"Then it ends:"}),t.jsxs("p",{className:"dg-then",children:[t.jsx(E,{state:"SOLD",size:"sm"}),t.jsx("span",{children:n.sold})]}),t.jsxs("p",{className:"dg-then",children:[t.jsx(E,{state:"LAPSED",size:"sm"}),t.jsx("span",{children:n.lapsed})]})]}),t.jsxs(C,{children:[t.jsx(E,{state:"DENIED",sub:"score < need"}),t.jsx("p",{className:"small",children:n.denied}),t.jsx("p",{className:"small strong",children:"An appeal ends:"}),t.jsxs("p",{className:"dg-then",children:[t.jsx(E,{state:"OVERTURNED",size:"sm"}),t.jsx("span",{children:n.overturned})]}),t.jsxs("p",{className:"dg-then",children:[t.jsx(E,{state:"UPHELD",size:"sm"}),t.jsx("span",{children:n.upheld})]})]}),t.jsxs(C,{children:[t.jsx(E,{state:"NO VERDICT",sub:"expired"}),t.jsx("p",{className:"small",children:n.none})]})]}),t.jsxs(ve,{icon:"timer",children:[t.jsx("b",{children:"Cooldown."})," ",n.cooldown]})]})}const Cs=Object.assign({"../../../docs/01-start-here.md":Ve,"../../../docs/02-buying.md":Ke,"../../../docs/03-plead.md":Xe,"../../../docs/04-your-bar.md":Je,"../../../docs/05-judges.md":Qe,"../../../docs/06-appeals.md":Ze,"../../../docs/07-letters.md":et,"../../../docs/08-auto-sell.md":tt,"../../../docs/09-objection.md":at,"../../../docs/10-seasons.md":nt,"../../../docs/11-fees.md":st,"../../../docs/12-pool.md":ot,"../../../docs/13-dead-man.md":lt,"../../../docs/14-keepers.md":rt,"../../../docs/15-contracts.md":it,"../../../docs/16-audits.md":ct,"../../../docs/17-risks.md":ht,"../../../docs/18-glossary.md":ut}),Ds=Object.fromEntries(Object.entries(Object.assign({"./diagrams/fee-bar.tsx":js,"./diagrams/launch-fee.tsx":Ts,"./diagrams/loop.tsx":Is,"./diagrams/plea-states.tsx":Ns})).map(([e,a])=>[e.replace(/^.*\/|\.tsx$/g,""),a])),Ee=e=>X(N,e),ke=T.map(e=>{const a=Cs[`../../../docs/${je(e)}`]??`# ${e.title}
`;return{...e,blocks:z(a,Ee).blocks}}),Ss=Fe(ke,Ee);function Bs({slug:e,heading:a}){const{statics:n,s}=Te(),o=n??s?.constants,l=x.useCallback(m=>X(N,m,o),[o]),r=x.useMemo(()=>be(o),[o]),c=Le(e),d=c&&ke.find(m=>m.slug===c.slug);x.useEffect(()=>{if(!a)return;const m=document.getElementById(U(a));m&&(m.scrollIntoView(),m.focus({preventScroll:!0}))},[c?.slug,a]);const i=x.useMemo(()=>d?He(d.blocks,l):[],[d,l]),{prev:u,next:p}=Ie(c?.slug||"");return t.jsx(Ps,{value:r,children:t.jsxs("div",{className:"docs",children:[t.jsx($s,{current:c?.slug}),t.jsxs("article",{className:"docs__page",children:[d?t.jsx("div",{className:"docs-body",children:t.jsx(qe,{tree:d.blocks,ctx:{slug:d.slug,num:l,diagrams:Ds}})}):t.jsxs("div",{className:"stack stack--lg",children:[t.jsx(Ne,{title:"Page not found"}),t.jsx(Ce,{title:`No docs page at #/docs/${e}`,action:{href:"#/docs",label:"Start here"},children:"Pick a page from the list, or search the docs."})]}),d&&t.jsxs("nav",{className:"docs-pager","aria-label":"Previous and next page",children:[u&&t.jsxs("a",{className:"docs-pager__link",href:L(u.slug),rel:"prev",children:[t.jsx("span",{className:"label",children:"Previous"}),t.jsxs("span",{className:"docs-pager__title",children:[t.jsx("span",{className:"docs-pager__back",children:t.jsx(k,{name:"arrow-right"})}),u.title]})]}),p&&t.jsxs("a",{className:"docs-pager__link docs-pager__link--next",href:L(p.slug),rel:"next",children:[t.jsx("span",{className:"label",children:"Next"}),t.jsxs("span",{className:"docs-pager__title",children:[p.title,t.jsx(k,{name:"arrow-right"})]})]})]})]}),d&&i.length>0&&t.jsxs("nav",{className:"docs__toc","aria-label":"On this page",children:[t.jsx("p",{className:"label",children:"On this page"}),t.jsx("ul",{children:i.map(m=>t.jsx("li",{className:m.level===3?"docs__toc-sub":void 0,children:t.jsx("a",{href:L(d.slug,m.id),"aria-current":m.id===a?"location":void 0,children:m.text})},m.id))})]})]})})}function $s({current:e}){const[a,n]=x.useState(!1),s=x.useRef(null);x.useEffect(()=>n(!1),[e]);const o=T.findIndex(r=>r.slug===e),l=r=>{r.key==="Escape"&&a&&document.getElementById("docs-pages")?.contains(document.activeElement)?(n(!1),s.current?.focus()):r.key==="Escape"&&a&&document.activeElement===s.current&&n(!1)};return t.jsxs("div",{className:"docs__side",onKeyDown:l,children:[t.jsx(Ms,{}),t.jsxs("button",{ref:s,type:"button",className:"docs__toggle","aria-expanded":a,"aria-controls":"docs-pages",onClick:()=>n(!a),children:[t.jsx(k,{name:a?"x":"list"}),t.jsxs("span",{className:"docs__toggle-text",children:[t.jsx("span",{className:"strong",children:"Docs pages"}),o>=0&&t.jsxs("span",{className:"meta",children:[o+1," of ",T.length,": ",T[o].title]})]})]}),t.jsx("nav",{id:"docs-pages",className:`docs-nav${a?" is-open":""}`,"aria-label":"Docs pages",children:t.jsx("ol",{children:T.map(r=>t.jsx("li",{children:t.jsx("a",{href:L(r.slug),"aria-current":r.slug===e?"page":void 0,children:r.title})},r.slug))})})]})}function Ms(){const[e,a]=x.useState(""),n=x.useRef(null),s=x.useRef(null),o=8,l=x.useMemo(()=>Ye(Ss,e,1/0),[e]),r=l.slice(0,o),c=J(e).join("").length>=2;x.useEffect(()=>{const u=()=>a("");return window.addEventListener("hashchange",u),()=>window.removeEventListener("hashchange",u)},[]);const d=()=>[...s.current?.querySelectorAll("a")||[]],i=(u,p)=>{const m=d();u.key==="ArrowDown"&&m.length?(u.preventDefault(),m[Math.min(p+1,m.length-1)].focus()):u.key==="ArrowUp"?(u.preventDefault(),p<=0?n.current?.focus():m[p-1].focus()):u.key==="Escape"&&e&&(u.preventDefault(),u.stopPropagation(),a(""),n.current?.focus())};return t.jsxs("form",{role:"search",className:"docs-search",onSubmit:u=>{u.preventDefault(),r[0]&&(location.hash=r[0].href)},children:[t.jsx("label",{className:"sr-only",htmlFor:"docs-q",children:"Search the docs"}),t.jsxs("div",{className:"input input--text",children:[t.jsx(k,{name:"magnifying-glass"}),t.jsx("input",{ref:n,id:"docs-q",className:"input__control",type:"search",placeholder:"Search the docs",autoComplete:"off",spellCheck:!1,value:e,"aria-describedby":"docs-q-count","aria-controls":c&&r.length?"docs-results":void 0,onChange:u=>a(u.target.value),onKeyDown:u=>i(u,-1)})]}),t.jsx("p",{id:"docs-q-count",className:"sr-only","aria-live":"polite",children:c?`${l.length||"No"} result${l.length===1?"":"s"}${l.length>o?`, the first ${o} shown`:""}`:""}),c&&(r.length?t.jsxs("ul",{ref:s,id:"docs-results",className:"docs-results","aria-label":"Search results",children:[r.map((u,p)=>t.jsx("li",{children:t.jsxs("a",{href:u.href,onKeyDown:m=>i(m,p),children:[t.jsx("span",{className:"docs-results__where",children:t.jsx(Gs,{entry:u.entry})}),u.snippet&&t.jsx("span",{className:"docs-results__text",children:t.jsx(Os,{text:u.snippet,query:e})})]})},u.href)),l.length>o&&t.jsxs("li",{className:"small text-2 docs-results__more","aria-hidden":"true",children:[l.length," sections match; the first ",o," are shown. Add a word to narrow it."]})]}):t.jsxs("p",{className:"small text-2 docs-results__none",children:["No section mentions “",e.trim(),"”."]}))]})}const Gs=({entry:e})=>t.jsxs(t.Fragment,{children:[e.page,e.heading&&t.jsxs(t.Fragment,{children:[t.jsx("span",{"aria-hidden":"true",children:" › "}),t.jsx("span",{className:"sr-only",children:", "}),e.heading]})]});function Os({text:e,query:a}){const n=J(a).filter(o=>o.length>1);if(!n.length)return t.jsx(t.Fragment,{children:e});const s=new RegExp(`(${n.map(o=>o.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})`,"gi");return t.jsx(t.Fragment,{children:e.split(s).map((o,l)=>l%2?t.jsx("mark",{children:o},l):o)})}export{Bs as default};
