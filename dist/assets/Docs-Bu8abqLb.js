import{s as Ne,j as e,N as De,h as Q,I as A,d as S,r as x,C as me,D,f as Se,u as Ce,p as $e,a as Me,T as Oe,E as Ge}from"./index-DOmG3-xo.js";const He=a=>a.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"section",Re=/[\\`*_{}\[\]()#+\-.!|>:~<]/;function R(a,t=[]){const s=[],n=r=>{const l=s[s.length-1];l?.t==="text"?l.v+=r:r&&s.push({t:"text",v:r})};let o=0;for(;o<a.length;){const r=a[o];if(r==="\\"&&o+1<a.length&&Re.test(a[o+1])){n(a[o+1]),o+=2;continue}if(r==="{"&&a.startsWith("{{",o)){const l=a.indexOf("}}",o+2);if(l<0){t.push(`an unclosed placeholder: "${a.slice(o,o+24)}"`),n(a.slice(o));break}s.push({t:"num",key:a.slice(o+2,l).trim()}),o=l+2;continue}if(r==="`"){let l=1;for(;a[o+l]==="`";)l++;const c="`".repeat(l),p=a.indexOf(c,o+l);if(p>0){let i=a.slice(o+l,p);i.startsWith(" ")&&i.endsWith(" ")&&i.trim()&&(i=i.slice(1,-1)),s.push({t:"code",c:fe(i,t)}),o=p+l;continue}n(c),o+=l;continue}if(r==="*"&&a[o+1]==="*"){const l=ie(a,o+2,"**");if(l>0){s.push({t:"strong",c:R(a.slice(o+2,l),t)}),o=l+2;continue}}if((r==="*"||r==="_")&&a[o+1]!==r&&Be(a,o)){const l=ie(a,o+1,r);if(l>0){s.push({t:"em",c:R(a.slice(o+1,l),t)}),o=l+1;continue}}if(r==="["){const l=Fe(a,o);if(l>0&&a[l+1]==="("){const c=a.indexOf(")",l+2);if(c>0){s.push({t:"link",href:a.slice(l+2,c).trim(),c:R(a.slice(o+1,l),t)}),o=c+1;continue}}}n(r),o++}return s}function fe(a,t){const s=[];let n=0;for(;n<a.length;){const o=a.indexOf("{{",n);if(o<0)break;const r=a.indexOf("}}",o+2);if(r<0){t.push(`an unclosed placeholder: "${a.slice(o,o+24)}"`);break}o>n&&s.push({t:"text",v:a.slice(n,o)}),s.push({t:"num",key:a.slice(o+2,r).trim()}),n=r+2}return n<a.length&&s.push({t:"text",v:a.slice(n)}),s}const we=a=>a===void 0||/\s/.test(a),_e=a=>!!a&&/[\p{L}\p{N}]/u.test(a);function Be(a,t){return we(a[t+1])?!1:a[t]==="*"||!_e(a[t-1])}function ie(a,t,s){let n=t;for(;n<a.length;){if(a[n]==="\\"){n+=2;continue}if(a[n]==="`"){const o=a.indexOf("`",n+1);if(o>0){n=o+1;continue}}if(a.startsWith(s,n)&&n>t&&!we(a[n-1])){if(s==="*"&&a[n+1]==="*"){n+=2;continue}if(s==="_"&&_e(a[n+1])){n++;continue}return n}n++}return-1}function Fe(a,t){let s=0;for(let n=t;n<a.length;n++){if(a[n]==="\\"){n++;continue}if(a[n]==="["&&s++,a[n]==="]"&&--s===0)return n}return-1}const ye=/^```\s*([\w-]*)\s*$/,be=/^(#{1,6})\s+(.*?)\s*#*\s*$/,xe=/^(?:-{3,}|\*{3,}|_{3,})\s*$/,B=/^:::\s*(.*?)\s*$/,F=/^>\s?/,N=/^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/,We=/^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/,ge=(a,t)=>/^\s*\|/.test(a[t])&&t+1<a.length&&We.test(a[t+1].trim()),ve=(a,t)=>{const s=a[t];return ye.test(s)||be.test(s)||xe.test(s)||B.test(s)||F.test(s)||ge(a,t)||N.test(s)&&N.exec(s)[1].length<2};function U(a){let t=a.trim();t.startsWith("|")&&(t=t.slice(1)),t.endsWith("|")&&!t.endsWith("\\|")&&(t=t.slice(0,-1));const s=[];let n="",o=!1;for(let r=0;r<t.length;r++)t[r]==="\\"&&t[r+1]==="|"?(n+="|",r++):t[r]==="`"?(o=!o,n+="`"):t[r]==="|"&&!o?(s.push(n.trim()),n=""):n+=t[r];return s.push(n.trim()),s}function Z(a,t=o=>o,s=0,n=new Map){const o=a.replace(/\r\n?/g,`
`).replace(/<!--[\s\S]*?-->/g,u=>u.replace(/[^\n]/g,"")).split(`
`),r=[],l=[],c=(u,m)=>l.push(`line ${s+u+1}: ${m}`),p=(u,m)=>{const f=[],w=R(u,f);for(const h of f)c(m,h);return w};let i=0;for(;i<o.length;){const u=o[i];if(!u.trim()){i++;continue}let m;if(m=ye.exec(u)){const h=i++,b=[];for(;i<o.length&&!/^```\s*$/.test(o[i]);)b.push(o[i++]);i>=o.length&&c(h,"a code block (```) is never closed"),i++;const d=[];r.push({t:"pre",lang:m[1],c:fe(b.join(`
`),d)});for(const _ of d)c(h,_);continue}if(m=be.exec(u)){const h=m[1].length;let b=m[2],d="";const _=/\s*\{#([a-z0-9-]+)\}\s*$/.exec(b);_&&(d=_[1],b=b.slice(0,_.index)),h>4&&c(i,`a level-${h} heading: the docs use # to #### only`);const g=p(b,i);d||=He(k(g,t));const P=n.get(d)||0;n.set(d,P+1),P&&(d=`${d}-${P+1}`),r.push({t:"h",level:Math.min(h,4),id:d,c:g}),i++;continue}if(xe.test(u)){r.push({t:"hr"}),i++;continue}if(m=B.exec(u)){const[h,...b]=m[1].split(/\s+/),d=m[1].slice(h.length).trim();if(h==="diagram"){(!/^[a-z0-9-]+$/.test(d)||b.length!==1)&&c(i,`"::: diagram" needs one name in a-z, 0-9 and -: "${u.trim()}"`),r.push({t:"diagram",name:d,line:s+i+1}),i++;continue}if(h==="note"||h==="warn"||h==="builders"){const _=i++,g=[];for(;i<o.length&&!/^:::\s*$/.test(o[i]);)B.exec(o[i])?.[1]&&!/^diagram\b/.test(B.exec(o[i])[1])&&c(i,"a callout inside a callout: close the first with ::: before opening another"),g.push(o[i++]);i>=o.length&&c(_,`"::: ${h}" is never closed with a line of :::`),i++;const P=Z(g.join(`
`),t,s+_+1,n);l.push(...P.errors),r.push({t:"callout",kind:h,title:d?p(d,_):void 0,c:P.blocks});continue}c(i,h?`an unknown block "::: ${h}" (use diagram, note, warn or builders)`:"a ::: that closes nothing"),i++;continue}if(F.test(u)){const h=i,b=[];for(;i<o.length&&F.test(o[i]);)b.push(o[i++].replace(F,""));const d=Z(b.join(`
`),t,s+h,n);l.push(...d.errors),r.push({t:"quote",c:d.blocks});continue}if(ge(o,i)){const h=U(u),b=U(o[i+1]).map(g=>g.endsWith(":")?g.startsWith(":")?"c":"r":"l");b.length!==h.length&&c(i,"the table's --- line has a different number of columns from its head");const d=i;i+=2;const _=[];for(;i<o.length&&/^\s*\|/.test(o[i]);){const g=U(o[i]);g.length!==h.length&&c(i,`a table row with ${g.length} cells under a head of ${h.length}`),_.push(g.map(P=>p(P,i))),i++}r.push({t:"table",align:b,head:h.map(g=>p(g,d)),rows:_});continue}if((m=N.exec(u))&&m[1].length<2){const h=Ye(o,i,p,c);r.push(h.list),i=h.next;continue}const f=i,w=[];for(;i<o.length&&o[i].trim()&&(i===f||!ve(o,i));)w.push(o[i++].trim());r.push({t:"p",c:p(w.join(" "),f)})}return{blocks:r,errors:l}}const M=a=>/\d/.test(a);function Ye(a,t,s,n){const o=N.exec(a[t]),r={t:"list",ordered:M(o[2]),start:parseInt(o[2])||1,items:[]};let l=t,c=-1,p;const i=[],u=()=>{p&&i.push(p),p=void 0};for(;l<a.length;){const m=a[l];if(!m.trim()){let w=l+1;for(;w<a.length&&!a[w].trim();)w++;const h=w<a.length?N.exec(a[w]):null;if(h&&(h[1].length>=2?r.items.length>0:M(h[2])===r.ordered)){l=w;continue}break}const f=N.exec(m);if(f&&f[1].length<2){if(M(f[2])!==r.ordered)break;u();const w={c:[]};r.items.push(w),p={item:w,parts:[f[3]],line:l},c=-1,l++;continue}if(f&&r.items.length){const w=r.items[r.items.length-1];c<0&&(c=f[1].length),f[1].length>c+1&&n(l,"a list nested more than one level: the docs nest lists one level only"),w.sub||(w.sub={t:"list",ordered:M(f[2]),start:parseInt(f[2])||1,items:[]}),u();const h={c:[]};w.sub.items.push(h),p={item:h,parts:[f[3]],line:l},l++;continue}if(f||ve(a,l))break;p&&p.parts.push(m.trim()),l++}u();for(const m of i)m.item.c=s(m.parts.join(" "),m.line);return{list:r,next:l}}function k(a,t=s=>s){return a.map(s=>s.t==="text"?s.v:s.t==="num"?t(s.key)??s.key:k(s.c,t)).join("")}const ze=(a,t)=>a.filter(s=>s.t==="h"&&(s.level===2||s.level===3)).map(s=>({id:s.id,level:s.level,text:k(s.c,t)}));function Ee(a){const t=/^(?:\.\/)?(\d\d)-([a-z0-9-]+)\.md(?:#([a-z0-9-]+))?$/.exec(a);return t?`#/docs/${t[2]}${t[3]?`/${t[3]}`:""}`:a}function W(a,t=18){const s=a<0n,n=s?-a:a,o=10n**BigInt(t),r=(n/o).toLocaleString("en-US"),l=(n%o).toString().padStart(t,"0").replace(/0+$/,"");return(s?"−":"")+r+(l?"."+l:"")}const Ue=a=>W(a,2);function Y(a,t){let s;try{if(t==null||t==="")return;s=BigInt(t)}catch{return}switch(a){case"int":return s.toLocaleString("en-US");case"imd":return`${W(s)} IMD`;case"plea":return`${W(s)} PLEA`;case"duration":return Ne(Number(s));case"bps":return`${Ue(s)}%`;case"multiplier":return`×${W(s,4)}`;default:return}}const ce=new Set;function se(a,t,s){const n=t==="_meta"?void 0:a[t];if(!n)return;const o=n.chain?s?.[n.chain]:void 0;if(o==null)return n.text;let r=!0;try{r=n.value!==null&&BigInt(o)===BigInt(n.value)}catch{r=!1}return!r&&!ce.has(t)&&(ce.add(t),console.warn(`Docs: ${n.chain} on chain is ${String(o)}, numbers.json's ${t} says ${n.value}; the page shows the chain's.`)),n.format==="text"?n.text:Y(n.format,o)??n.text}function qe(a,t,s){const n=t==="_meta"?void 0:a[t];if(!n)return;const o=n.chain?s?.[n.chain]:void 0;try{return o!=null?BigInt(o):n.value===null?void 0:BigInt(n.value)}catch{return}}const Ae=(a,t)=>a.items.map(s=>k(s.c,t)+(s.sub?" "+Ae(s.sub,t):"")).join(" ");function ee(a,t){switch(a.t){case"p":case"pre":return k(a.c,t);case"list":return Ae(a,t);case"table":return[a.head,...a.rows].map(s=>s.map(n=>k(n,t)).join(" ")).join(" ");case"quote":return a.c.map(s=>ee(s,t)).join(" ");case"callout":return[a.kind==="builders"?"For builders":"",a.title?k(a.title,t):"",...a.c.map(s=>ee(s,t))].join(" ");default:return""}}function Ve(a,t){const s=[];for(const n of a){let o={slug:n.slug,page:n.title,heading:"",id:"",text:"",order:s.length};const r=[],l=()=>{o.text=r.join(" ").replace(/\s+/g," ").trim(),(o.heading||o.text)&&s.push({...o,order:s.length}),r.length=0};for(const c of n.blocks)if(!(c.t==="h"&&c.level===1)){if(c.t==="h"){l(),o={slug:n.slug,page:n.title,heading:k(c.c,t),id:c.id,text:"",order:0};continue}r.push(ee(c,t))}l()}return s}const C=a=>a.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,""),ne=a=>C(a).split(/[^\p{L}\p{N}%.×-]+/u).filter(t=>t.length>0),Ke=(a,t)=>{let s=0,n=a.indexOf(t);for(;n>=0&&s<5;)s++,n=a.indexOf(t,n+t.length);return s},ke=a=>a.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),he=(a,t)=>new RegExp(`(^|[^\\p{L}\\p{N}])${ke(t)}`,"u").test(a),de=(a,t)=>new RegExp(`(^|[^\\p{L}\\p{N}])${ke(t)}($|[^\\p{L}\\p{N}])`,"u").test(a);function Xe(a,t,s=8){const n=ne(t);if(n.join("").length<2)return[];const o=n.join(" "),r=[];for(const l of a){const c=C(l.heading),p=C(l.page),i=C(l.text);if(!n.every(m=>c.includes(m)||p.includes(m)||i.includes(m)))continue;let u=n.length>1&&c.includes(o)?20:0;for(const m of n)u+=(he(c,m)?10:0)+(he(p,m)?5:0)+Ke(i,m)+(de(c,m)||de(i,m)?2:0);r.push({e:l,score:u})}return r.sort((l,c)=>c.score-l.score||l.e.order-c.e.order),r.slice(0,s).map(({e:l})=>({entry:l,href:Ee(`#/docs/${l.slug}${l.id?`/${l.id}`:""}`),snippet:Je(l.text,n)}))}function Je(a,t,s=120){const n=C(a),o=Math.min(...t.map(c=>n.indexOf(c)).filter(c=>c>=0),1/0);if(a.length<=s)return a;let r=o===1/0?0:Math.max(0,o-Math.floor(s/3));r>0&&(r=a.indexOf(" ",r)+1||r);let l=Math.min(a.length,r+s);return l<a.length&&(l=a.lastIndexOf(" ",l)>r?a.lastIndexOf(" ",l):l),(r>0?"…":"")+a.slice(r,l)+(l<a.length?"…":"")}const Qe={note:{kind:"info",icon:"info",title:void 0},warn:{kind:"warn",icon:"warning",title:void 0},builders:{kind:"builders",icon:"seal-check",title:"For builders"}};function te(a,t){const s=t.num(a);if(s===void 0)throw Error(`The docs name an unknown number {{${a}}}.`);return s}function E(a,t,s="i"){return a.map((n,o)=>{const r=`${s}.${o}`;switch(n.t){case"text":return n.v;case"num":{const l=te(n.key,t);return l.split(" ").length<=3?e.jsx("span",{className:"nowrap",children:l},r):l}case"strong":return e.jsx("strong",{children:E(n.c,t,r)},r);case"em":return e.jsx("em",{children:E(n.c,t,r)},r);case"code":return e.jsx("code",{children:E(n.c,t,r)},r);case"link":{const l=Ee(n.href);return/^https?:\/\//.test(l)?e.jsxs("a",{href:l,target:"_blank",rel:"noreferrer",className:"docs-ext",children:[E(n.c,t,r),e.jsx(A,{name:"arrow-square-out"}),e.jsx("span",{className:"sr-only",children:" (opens in a new tab)"})]},r):e.jsx("a",{href:l,children:E(n.c,t,r)},r)}}})}function je(a,t,s){const n=a.items.map((o,r)=>e.jsxs("li",{children:[E(o.c,t,`${s}.${r}`),o.sub&&je(o.sub,t,`${s}.${r}.s`)]},r));return a.ordered?e.jsx("ol",{start:a.start===1?void 0:a.start,children:n},s):e.jsx("ul",{children:n},s)}const ue={l:void 0,c:"c",r:"r"};function ae(a,t,s="b"){return a.map((n,o)=>{const r=`${s}.${o}`;switch(n.t){case"h":{const l=E(n.c,t,r);if(n.level===1)return e.jsx("div",{className:"page-title",children:e.jsx("h1",{children:l})},r);if(n.level===4)return e.jsx("h4",{id:Q(n.id),tabIndex:-1,children:l},r);const c=n.level===2?"h2":"h3",p=k(n.c,i=>te(i,t));return e.jsxs("div",{className:`docs-h docs-h--${n.level}`,children:[e.jsx(c,{id:Q(n.id),tabIndex:-1,children:l}),e.jsx("a",{className:"docs-anchor",href:S(t.slug,n.id),"aria-label":`Link to ${p}`,children:e.jsx(A,{name:"link"})})]},r)}case"p":return e.jsx("p",{children:E(n.c,t,r)},r);case"list":return je(n,t,r);case"table":{const l=n.head.map(c=>k(c,p=>te(p,t))).join(", ");return e.jsx("div",{className:"table-wrap docs-table",role:"region","aria-label":`Table: ${l}`,tabIndex:0,children:e.jsxs("table",{className:"table",children:[e.jsx("thead",{children:e.jsx("tr",{children:n.head.map((c,p)=>e.jsx("th",{scope:"col",className:ue[n.align[p]||"l"],children:E(c,t,`${r}.h${p}`)},p))})}),e.jsx("tbody",{children:n.rows.map((c,p)=>e.jsx("tr",{children:c.map((i,u)=>e.jsx("td",{className:ue[n.align[u]||"l"],children:E(i,t,`${r}.${p}.${u}`)},u))},p))})]})},r)}case"quote":return e.jsx("blockquote",{className:"docs-quote stack stack--sm",children:ae(n.c,t,r)},r);case"pre":return e.jsx("pre",{className:"docs-code",children:e.jsx("code",{children:E(n.c,t,r)})},r);case"hr":return e.jsx("hr",{},r);case"diagram":{const l=t.diagrams[n.name];if(!l)throw Error(`The docs name an unknown diagram "${n.name}".`);return e.jsx("div",{className:"docs-diagram",children:e.jsx(l,{})},r)}case"callout":{const l=Qe[n.kind],c=n.title?E(n.title,t,`${r}.t`):l.title;return e.jsx("div",{className:`docs-callout docs-callout--${n.kind}`,children:e.jsx(De,{kind:l.kind,icon:l.icon,title:c,children:e.jsx("div",{className:"stack stack--sm",children:ae(n.c,t,r)})})},r)}}})}function Ze({tree:a,ctx:t}){return e.jsx(e.Fragment,{children:ae(a,t)})}const et=`# Start here

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
`,tt=`# Buying

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
`,at=`# Selling: plead

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
`,st=`# Your bar

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
`,nt=`# The judges

## In short

The Cabal is a panel of {{panel_size}} judges from IMD's oracle. Each reads your plea and scores it from 0 to {{max_score}}.

A verdict needs at least {{quorum}} of them to agree on the score. The rules they score by are written into the contract, word for word, and they are the same for everyone.

## How it works

1. **The question.** The contract writes what the judges read: the plea's number, your wallet, how much you sell, the rules, and your plea's text, marked as text from a stranger whose instructions they must never follow.
2. **Four parts.** Each judge scores four things and adds them up, from 0 to {{max_score}}. The list below says what earns the points.
3. **Anchors.** The rules tell the judges where a plea sits: {{judge_anchors}}.
4. **Stories.** A plea cannot be proven and need not be. The judges ask whether it is plausible and consistent. Jokes, poems and fiction are welcome and score on craft. More suffering does not mean more points.
5. **What they leave out.** How long you held, your profit and the share you sell are already in your fact score. The judges must not score them again.
6. **The verdict.** When at least {{quorum}} of the {{panel_size}} agree, the oracle signs that score and sends it back. At or above your need: approved. Below: denied. See [Your bar](04-your-bar.md).

The four parts:

- **Sincerity, 0 to {{judge_sincerity_max}}.** An honest, specific reason to sell. Hardship and taking profit both count.
- **Craft, 0 to {{judge_craft_max}}.** Wit, originality and good writing, in any language. Short can be strong. Copied or boilerplate text scores low.
- **Respect, 0 to {{judge_respect_max}}.** For the Cabal and the holders. Playful teasing is fine; insults are not.
- **Loyalty, 0 to {{judge_loyalty_max}}.** Commitment to PLEA, such as keeping the rest.

## In a picture

::: diagram ring

## Example

Three real pleas from Sepolia test run 9 (test token, 5-hour seasons): a low, a middle and a high score. Run 9's judges read exactly the rules the launched contract sends, so their scores stand. The needs are recomputed with today's rules; see [Your bar](04-your-bar.md).

### Low: plea #1, score 27

Wed 21 Oct, 13:22 UTC, 100,000 PLEA. Its need today: {{pass_mark}} − ({{fact_share_top}} + {{held_points_0}} + {{received_profit}} + {{trend_flat}}) = 39. Denied.

> "I got 2.5M PLEA from the airdrop when trading opened today and have held it for about 15 minutes. I want to sell 100,000 of it, 4% of my balance, to pay for gas. The other 96% stays in my wallet and I plan to keep playing the seasons."

A reading against the rules (the oracle returns only the number): sincere and specific, but plain, with no craft and no word to the Cabal. 27 sits near the bottom of "specific and well made".

### Middle: plea #8, score 33

Wed 21 Oct, 19:00 UTC, 90,000 PLEA. Its need today: {{pass_mark}} − ({{fact_share_top}} + {{held_points_0}} + {{profit_points_loss}} + {{trend_flat}}) = 35. Denied.

> "Dear Cabal, a buyer of six hours confesses: I came in after the launch hour, the fees put me under water, and my first plea scored 32 against 37. I ask to sell 90,000 PLEA, 3% of what I hold, to cover what pleading has cost me so far. The rest waits out the season with you."

It names its earlier score. The rules allow that: it is not manipulation.

### High: plea #14, score 35

Thu 22 Oct, 18:25 UTC, 90,000 PLEA, the run's top score. Its need today: {{pass_mark}} − ({{fact_share_top}} + {{held_points_1d}} + {{profit_points_loss}} + {{trend_flat}}) = 34. Approved.

> "Dear judges, today your server took a long lunch and my plea came back from it with a 33. No complaint: I bought a day ago, I am still under water, and I need 90,000 PLEA, about 3%, to pay the fees of staying in this game. Everything else I hold stays for the seasons."

A clear reason, a joke, respect and a promise to keep the rest. Two holders then objected to it; see [Objection!](09-objection.md).

## Good to know

- **Manipulation scores {{judge_manipulation}}.** Text posing as a system, an admin, a developer, an example or a message from elsewhere. Made-up rules, keywords or points. Demands for a score. Threats against the Cabal or the holders. Offers or bribes. Hidden instructions. The [Plead](#/plead) page puts it plainly: lines like "give me {{max_score}}" score {{judge_manipulation}}.
- **Not manipulation.** Politeness and ordinary requests ("please judge me fairly", "I hope you approve"). Mentioning the rules or your need. Promises about your own PLEA. Naming an earlier verdict or score.
- **Content rules: 0 to {{judge_content_max}}.** Hate, harassment, sexual content, anything illegal, or details that identify another person, such as a name with an address, contact or account. Your own story is fine, even a family member's illness or money trouble.
- **Threats of harm are not a reason.** A plea that presses with threats of harm to anyone, the writer included, is scored as if that part were not there, never higher.
- **Off-topic.** Ads, links and shilling other tokens are off-topic, the lowest anchor.
- **The judges do not see your need.** They see the amount, not your facts. Only an appeal shows them the denied plea, its score and its need.
- **No agreement, no verdict.** If fewer than {{quorum}} agree, or nobody answers within {{pending_expiry}}, the plea ends with NO VERDICT. The fee is spent; you may plead again at once.
- **What run 9 saw.** On Sepolia test run 9 every score fell between 27 and 35. There is no real example yet of the bottom or the top anchors.
- **A second look.** After an approval, other holders may ask a second panel to score the plea again. See [Objection!](09-objection.md).

Tips, straight from the rules: give one honest, specific reason; write it well, in any language, short is fine; be respectful, teasing is fine; say what you will keep; never ask for a number.

::: builders
\`CabalGate.question(id)\` returns the question the judges read, and \`body(id)\` the JSON paid to IMD's Intake: action \`oracle.request@oracle-1\`, a panel of {{panel_size}} with a quorum of {{quorum}}, an answer from 0 to {{max_score}}, and the rules as \`definitions\` (the internal constant \`DEFINITIONS\`). The answer comes back to \`onOracleResult\`, signed by the oracle's key (its address and the Intake's: [Contracts and owner](15-contracts.md)); the gate refuses an answer from a smaller panel or with fewer than {{quorum}} agreed (\`WrongPanel\`), and a score above {{max_score}} (\`ScoreOutOfRange\`). Event: \`Verdict(id, approved, score, oracleRequestId)\`.

Source: [CabalGate.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/CabalGate.sol) and [OracleAttestation.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/OracleAttestation.sol), at the commit IMD deployed.
:::
`,ot=`# Appeals

## In short

A denied plea gets one appeal. You send it within {{appeal_window}} of the denial, for the same amount or less, with a new text.

It costs {{appeal_total}}: the {{oracle_fee}} oracle fee and {{appeal_wall_share}} for the buy wall. The judges score it on its own, against a fresh need.

## How it works

1. **A denial opens the window.** For {{appeal_window}} after the verdict you may appeal. The same {{appeal_window}} is your cooldown, so an appeal is the only plea you can send in it.
2. **Open your plea's page.** The denied plea's page, from your [Profile](#/profile), has a "One appeal" box while the window is open. Only the wallet that pleaded can appeal.
3. **Choose the amount.** The same amount or less. It must also fit today's limits: at most {{max_share}} and at least {{min_share}} of the smaller of your PLEA now and your PLEA when you pleaded.
4. **Write a new text.** The judges score the appeal on its own text. They also see the denied plea, its score and its need. Repeating the old plea adds nothing; naming the old score is allowed.
5. **Pay {{appeal_total}}.** The {{oracle_fee}} oracle fee goes to the judges and {{appeal_wall_share}} to the buy wall, both in IMD.
6. **A fresh need.** The contract scores your facts again, as they are now. For the share sold it takes the smaller of the appeal's share and the denied plea's, so an appeal never lands in a worse share band. See [Your bar](04-your-bar.md).
7. **The verdict.** Approved: the stamp reads OVERTURNED, and you sell within {{sell_window}}, as after any approval. Denied: UPHELD, and there is no further appeal. Your next plea waits {{cooldown}} from that verdict, or from your sale.
8. **No verdict.** If no verdict comes within {{pending_expiry}}, the appeal is closed and its slot is free again. Inside the window you may appeal once more, paying again.

## In a picture

::: diagram appeal-window

## Example

A real appeal from Sepolia test run 9 (test token, 5-hour seasons). Plea #1, the low example on [The judges](05-judges.md), asked to sell 100,000 PLEA on Wed 21 Oct at 13:22 UTC and was denied. At 14:44 the same wallet appealed, for the same 100,000 PLEA:

> "Honoured Cabal, a fair verdict: my first plea was as plain as a gas receipt. Since then I bought in with my own imdTEST too. I still ask to sell 100,000 PLEA, 4% of my bag, to pay my gas; the rest stays and keeps playing the seasons. Thank you for reading me twice."

| Part | Plea #1 | Appeal #2 |
| --- | --- | --- |
| Share sold, about 4% | {{fact_share_top}} | {{fact_share_top}} |
| Held | {{held_points_0}} | {{held_points_0}} |
| Profit | {{received_profit}}, received | {{profit_points_loss}}, at a loss |
| Trend | {{trend_flat}} | {{trend_flat}} |
| **Fact score** | **30** | **34** |
| **Need: {{pass_mark}} − fact** | **39** | **35** |
| Judges' score | 27 | 30 |
| Approved? | No, 12 short | No, 5 short |

Between the two, the wallet made its first buy, at 14:42. That buy covered the appeal's 100,000 PLEA, bought at a loss: {{profit_points_loss}} points for profit instead of {{received_profit}} for received PLEA. So the appeal's need fell from 39 to 35.

The new text scored 30, so the denial was UPHELD. The appeal cost {{oracle_fee}} + {{appeal_wall_share}} = {{appeal_total}}. The wallet's next plea, #7, came at 18:59, after the cooldown that started with the appeal's verdict.

::: note Recomputed with today's rules
Run 9 used a pass mark of 71 and counted received PLEA at 10 for profit. Its needs were 40 and 37, with the same verdicts. The needs above use the launched rules.
:::

## Good to know

- **Too late.** After {{appeal_window}}: "The appeal window closed. Wait for your next plea."
- **Once only.** A second appeal, or an appeal of an appeal: "This plea has already been appealed."
- **Only a denial.** An approved plea, or one with no verdict, cannot be appealed: "This plea was not denied. Refresh its status before appealing."
- **Only your own.** "Only the seller can send this action. Connect the wallet that wrote the plea."
- **Not more than before.** An amount above the denied plea's: "The amount is over the limit. Reduce it or press Max."
- **The fee is spent.** Both parts of {{appeal_total}} are paid whatever the verdict. The {{appeal_wall_share}} goes to the buy wall; see [The pool](12-pool.md).
- **Other ways to appeal.** Tick "Sell automatically if approved" on the appeal and its fees are paid in PLEA, {{letter_appeal_fee}} worth; see [The auto-sell box](08-auto-sell.md). Without the site, send a letter that starts with APPEAL; see [Letters](07-letters.md).
- **The appeal's points.** An overturned appeal earns its score as season points, like any approval. Others may object to it. See [Objection!](09-objection.md)

::: builders
\`CabalGate.appeal(originalId, amount, text)\` appeals; it pulls \`APPEAL_POOL_SHARE\` in IMD, sends it to the wall (\`PleaHook.fundWall\`), then pays \`ORACLE_FEE\` as a plea does. Approve the gate for {{appeal_total}} first. The appeal is a new plea with \`isAppeal\` set and \`originalId\` pointing back; the denied plea gets \`appealed\`. \`question(id)\` of an appeal quotes the denied plea, its score and its need.

Errors: \`AppealClosed\`, \`AlreadyAppealed\`, \`NotDenied\`, \`NotSeller\`, \`AmountTooLarge\`, \`AmountTooSmall\`, \`PendingExists\`, \`CannotPass(need)\`, \`CabalNotWatching\`. The Letterbox's \`appealAuto(originalId, text)\` is the auto-sell appeal.

Source: [CabalGate.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/CabalGate.sol), at the commit IMD deployed.
:::
`,rt=`# Letters

## In short

You can plead without the site. Send your plea as a plain text message to the Letterbox, from Etherscan or your wallet. That message is a letter.

A letter pleads {{letter_share}} of your PLEA. Its fees are paid in PLEA, in the same transaction, and the PLEA it pleads waits in escrow. If the Cabal approves, anyone may sell it for you within {{sell_window}}, and the sale is yours.

## How it works

1. **Send a letter.** From the wallet that holds your PLEA, with 0 ETH, to the Letterbox. Its address is on the [Letters](#/letters) page. There are three ways:
   - Etherscan's message page, [etherscan.io/idm](https://etherscan.io/idm): the Letterbox as the recipient, your plea as the message.
   - Etherscan's Write Contract tab for the Letterbox: the function \`letter\`, with your plea as its text.
   - Your wallet's data field: your plea, written as hex.
2. **The first word decides.** APPEAL followed by a text appeals your latest denied plea. SELL sells your own approved letter. NAME followed by a name sets your display name. Any other text is a new plea. The command words are in capitals.
3. **A plea for {{letter_share}}.** A letter pleads {{letter_share}} of your PLEA, never more than {{max_sell}}. The same judges, rules and need as on the site apply; your fact score is read from your PLEA before the escrow. See [Your bar](04-your-bar.md).
4. **Fees in PLEA.** In the same transaction, some of your PLEA is sold for {{letter_fee}}: the {{oracle_fee}} oracle fee and a {{runner_tip}} tip for whoever delivers the sale. An appeal letter buys {{letter_appeal_fee}}, with the {{appeal_wall_share}} for the buy wall. The fee sale may spend PLEA worth up to {{fee_cap}} of the fees at the hourly price; what it does not spend comes back at once.
5. **The fees' limit.** The fees may take at most {{max_fee_share}} of your PLEA. So a letter needs PLEA worth about {{letter_min_value}} or more at the hourly price.
6. **Escrow.** The {{letter_share}} waits in the Letterbox while the Cabal judges the plea.
7. **Delivered.** Approved: within {{sell_window}}, anyone may deliver it, that is, sell the escrow for you. The sale's IMD goes to you, after the usual trade fee; a letter pays no auto-sell fee. The {{runner_tip}} tip goes to whoever delivered. Send SELL and you deliver it yourself, and keep the tip.
8. **Settled.** Denied, no verdict, or approved but not delivered in time: anyone may settle the letter, and your PLEA and the tip come back to you. The oracle fee is spent. An approval that was not delivered still counts for the season.

On the site, a letter's page has the buttons: "Deliver approved sale" for anyone, "Sell yourself" for you, and "Return escrow and tip" to settle.

## In a picture

::: diagram letter-path

## Example

The smallest letter, if the hourly price is the opening {{seed_price}} a PLEA.

1. **The fees' cap.** The fees are {{letter_fee}}. The fee sale may spend up to {{fee_cap}} of that, 0.825 IMD, which is 0.825 ÷ 0.00002 = 41,250 PLEA.
2. **Your PLEA.** The fees may take at most {{max_fee_share}} of it: 41,250 ÷ 10% = 412,500 PLEA. You need about that much or more, worth 412,500 × 0.00002 = {{letter_min_value}}.
3. **The plea.** The letter pleads {{letter_share}} of 412,500 = 82,500 PLEA, worth 82,500 × 0.00002 = 1.65 IMD. That clears both minimums: {{min_letter}} and {{min_sale_value}}.
4. **The fee sale.** It sells about 38,400 PLEA: 0.75 IMD, plus the trade's fee, at 0.00002 IMD. The rest of the 41,250 comes back at once. Like any sale, it shrinks your buy record.
5. **Delivered.** The sale must pay at least {{delivery_floor}} of the escrow's hourly value: 1.65 × 92.86% = 1.53 IMD. All of it is yours. The runner gets the {{runner_tip}} tip.
6. **Or settled.** Your 82,500 PLEA and the {{runner_tip}} tip come back. The {{oracle_fee}} is spent.

At another price the PLEA counts change, but {{letter_min_value}} stays the least your PLEA must be worth.

## Good to know

- **Same rules as the site.** One plea at a time, the cooldown, the need above {{max_score}}: a letter is refused exactly as a plea from the site would be.
- **A new letter settles the old one.** If your last letter is finished, your next one first returns its PLEA and tip. If it is still waiting for a verdict or inside its sell window, the new letter is refused.
- **Commands are capitals, then a space.** "SELL" sells; "sell" is read as a new plea, and is refused while you have an open one. APPEAL alone is refused. NAME alone clears your name.
- **Names.** {{name_min_length}} to {{name_max_length}} characters, using {{name_chars}}. Each name belongs to one wallet. Reserved: {{name_reserved}}.
- **An appeal letter.** It appeals your newest plea for its original amount, a little less if the fee sale shrank your PLEA. Its fees must fit in {{max_fee_share}} of your PLEA, or in {{fee_cap}} of the denied plea's amount, so you need about {{letter_appeal_min_value}} unless the second fits. See [Appeals](06-appeals.md).
- **Read your letter's state.** The Letterbox's \`status\` on Etherscan's Read Contract tab, given your wallet, answers in one sentence. \`leaderboard\` gives the season's top 25.
- **Points.** An approved letter's score counts for the season like any other. Its points can be recorded once the objection window has passed. See [Seasons and prizes](10-seasons.md).
- **After the Cabal dies.** New letters are refused. PLEA still waiting in a letter comes back through settle.

What a wallet or Etherscan shows when a letter would fail, in plain words:

- \`LetterTooLong\`: over {{max_plea_bytes}} bytes. Shorten it.
- \`LetterTooSmall\`: {{letter_share}} of your PLEA is under {{min_letter}}, so you need at least {{letter_min_balance}}.
- \`TooSmallForTheFee\`: the plea is worth less than {{min_sale_value}} at the hourly price.
- \`FeeTooHigh\`: the fees would take more than {{max_fee_share}} of your PLEA, or the price fell since the hourly price was taken. Try after the next hour.
- \`PendingExists\`: your previous plea or letter is still open.
- \`Cooldown\`, \`CannotPass\`, \`BadPleaText\`: as for a plea from the site; see [Selling: plead](03-plead.md).
- \`NothingToAppeal\`, \`NotDenied\`, \`AppealClosed\`: nothing to appeal, or too late.
- \`NotOpen\`: SELL with no approved letter waiting.
- \`BadName\`, \`NameTaken\`: the name breaks the rules, or another wallet holds it.
- \`NoPrice\`: trading has not opened yet.

::: builders
\`Letterbox\`: a letter is a call with the text as input data (the \`fallback\`) or \`letter(text)\`. \`deliver(id)\` sells an approved escrow for anyone and pays them the tip; \`settle(id)\` returns an escrow that will not sell. \`feesFor(isAppeal)\` gives the IMD a letter buys and the most PLEA it may spend now; \`escrowOf(id)\` and \`openOf(wallet)\` read escrows; \`status(wallet)\` and \`leaderboard()\` answer in words; \`setName(name)\` and \`nameOf(wallet)\` are the names. The Letterbox pleads through \`CabalGate.submitFor\` and \`appealFor\`. Events: \`Escrowed\`, \`Delivered\`, \`Settled\`, \`NameSet\`.

Its numbers (the {{letter_share}} share, the tip, the {{max_fee_share}} limit, the {{min_sale_value}} floor) are internal constants, with no getter. No owner, no admin.

Source: [Letterbox.sol](https://github.com/khaed1/plea/blob/42e0f855875786a953e945e528e9d7f2724a5352/src/Letterbox.sol), at the commit IMD deployed.
:::
`,lt=`# The auto-sell box

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
`,it=`# Objection!

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
`,ct=`# Seasons and prizes

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
`,ht=`# Fees

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
`,dt=`# The pool: cap, burn and the buy wall

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
`,ut=`# The dead-man

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
`,pt=`# Keepers

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
`,mt=`# Contracts and owner

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
`,ft=`# Audits

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
`,wt=`# Risks and FAQ

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
`,_t=`# Glossary

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
`,yt={deployment:"PLEA launch #2647 on Ethereum (block 26,293,890)",source:"khaed1/plea, the branch IMD deployed for the Ethereum launch, @ 42e0f855875786a953e945e528e9d7f2724a5352 (its src/; every file:line below is there)",status:"Checked 2026-10-29 by the numbers agent: every entry re-read in src/ at 42e0f85 and launch.json; every chain-bound value read from the launched contracts (read-only calls); trading not open yet (PleaHook.seeded false, PleaLaunch.opened false), so seed-time values (the cap's daily allowance) are computed",format:"key -> {text: words the docs print, value: raw on-chain value as a decimal string or null, chain: the site's constant key con(s, 'Contract.NAME') or null, format: int|imd|plea|duration|bps|multiplier|text, source: file:line, what: one line}. Whenever value is set and format is not text, text is format(value) exactly (the unit tests check it)"},bt={text:"69",value:"69",chain:"CabalGate.PASS_MARK",format:"int",source:"src/CabalGate.sol:122; need = PASS_MARK - fact score :433",what:"need = pass mark - fact score; a plea is approved when the judges' score is at least its need (:554)"},xt={text:"45",value:"45",chain:"CabalGate.MAX_PLEA_SCORE",format:"int",source:"src/CabalGate.sol:123; CannotPass :433-434; ScoreOutOfRange :551-552",what:"the judges' scale is 0 to 45; a plea whose need is above 45 is refused (CannotPass)"},gt={text:"30",value:"30",chain:"CabalGate.PANEL_SIZE",format:"int",source:"src/CabalGate.sol:124; checked :545-550",what:"judges on a panel (the Cabal)"},vt={text:"17",value:"17",chain:"CabalGate.QUORUM",format:"int",source:"src/CabalGate.sol:125; at least 17 agreed :545-550",what:"judges who must agree for a verdict"},Et={text:"0.5 IMD",value:"500000000000000000",chain:"CabalGate.ORACLE_FEE",format:"imd",source:"src/CabalGate.sol:110; paid to IMD's Intake in _ask :452-463",what:"a plea's or an appeal's oracle fee, in IMD; spent whatever happens (approved, denied, no verdict)"},At={text:"0.35 IMD",value:"350000000000000000",chain:"CabalGate.APPEAL_POOL_SHARE",format:"imd",source:"src/CabalGate.sol:111; paid to the buy wall by _payAppeal :396-401 (PleaHook.fundWall)",what:"an appeal's extra payment, to the buy wall"},kt={text:"0.85 IMD",value:"850000000000000000",chain:null,format:"imd",source:"src/CabalGate.sol:110-111 (0.5 + 0.35), appeal :347-350",what:"what an appeal costs in IMD: the oracle fee plus the wall share"},jt={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:377-378, :382 (NotDenied, AlreadyAppealed); an expired appeal frees its slot :508",what:"appeals per denied plea; an appeal itself cannot be appealed; an appeal that got no verdict may be sent again inside the window, paying again"},Pt={text:"7 minutes",value:"420",chain:"CabalGate.EXECUTE_WINDOW",format:"duration",source:"src/CabalGate.sol:112; WindowLapsed :620; lapse :492-496",what:"time to sell after an approval; after it the approval lapses"},Tt={text:"4 hours",value:"14400",chain:"CabalGate.COOLDOWN",format:"duration",source:"src/CabalGate.sol:113; _requireCanPlead :469-476, _cooldown :479-482; a lapse is timed from the approval :494",what:"no new plea for this long after a sale, a denial or a lapsed approval (a lapse counts from the approval's time); none after a plea that got no verdict"},Lt={text:"4 hours",value:"14400",chain:"CabalGate.COOLDOWN",format:"duration",source:"src/CabalGate.sol:379 (AppealClosed)",what:"an appeal must be sent within this long after the denial"},It={text:"20 minutes",value:"1200",chain:"CabalGate.PENDING_EXPIRY",format:"duration",source:"src/CabalGate.sol:114; expire :514-521; a later verdict is refused :540-542",what:"a plea with no verdict after this (or once IMD's Intake closed it without one) can be closed by anyone: no cooldown, the fee is spent"},Nt={text:"280",value:"280",chain:"CabalGate.MAX_PLEA_BYTES",format:"int",source:"src/CabalGate.sol:115; _validateText :824-865",what:"a plea's text, 1 to 280 bytes of UTF-8 (the number alone: a page writes the word bytes after it)"},Dt={text:"2,500,000 PLEA",value:"2500000000000000000000000",chain:"CabalGate.MAX_SELL",format:"plea",source:"src/CabalGate.sol:116; _checkAmount :525-530",what:"most PLEA one plea may sell"},St={text:"50%",value:"5000",chain:"CabalGate.MAX_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:117; :526",what:"most of your balance one plea may sell"},Ct={text:"1%",value:"100",chain:"CabalGate.MIN_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:118-119; :527-529 (AmountTooSmall)",what:"least share of your balance a plea may sell (or 2,500,000 PLEA when 1% is more)"},$t={text:"250,000,000 PLEA",value:"250000000000000000000000000",chain:null,format:"plea",source:"src/CabalGate.sol:523-528 (1% of 250,000,000 = MAX_SELL)",what:"above this balance the 1% minimum is capped at 2,500,000 PLEA, so the least and the most a plea may sell meet"},Mt={text:"33 hours",value:"118800",chain:"CabalGate.DEADMAN",format:"duration",source:"src/CabalGate.sol:147, :200-204; launch.json CabalGate argument 7 = 118800; reset only by a signed plea or appeal verdict :557",what:"the Cabal dies after this long without a signed verdict on a plea or an appeal, for good"},Ot={text:"15 days",value:"1296000",chain:"Seasons.SEASON",format:"duration",source:"src/Seasons.sol:83,107 = CabalGate.SEASON (src/CabalGate.sol:146; launch.json CabalGate argument 6 = 1296000)",what:"one season; seasons run back to back from the moment trading opens"},Gt={text:"selling at most 20%: 16 points; at most 35%: 9; more: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:270 (share rounded up :260-264; an appeal takes the lesser of its share and the original's :266-268, :427-431)",what:"share-sold part of the fact score"},Ht={text:"20%",value:"2000",chain:null,format:"bps",source:"src/CabalGate.sol:270",what:"selling at most this share of your PLEA scores the top share points"},Rt={text:"35%",value:"3500",chain:null,format:"bps",source:"src/CabalGate.sol:270",what:"selling at most this share (and more than 20%) scores the middle share points"},Bt={text:"16",value:"16",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for selling at most 20% of your PLEA"},Ft={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for more than 20% and at most 35%"},Wt={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for more than 35%"},Yt={text:"held under a day: 0; a day: 1; 3 days: 2; 7 days: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:300-305; the time is the buy-weighted average of your buys (src/PleaHook.sol:731-739)",what:"holding-time part of the fact score"},zt={text:"0",value:"0",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for PLEA held under a day"},Ut={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least a day"},qt={text:"2",value:"2",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least 3 days"},Vt={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least 7 days"},Kt={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:304 (held >= 1 days)",what:"days held for the first holding point (a page writes day or days after it)"},Xt={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:304 (held >= 3 days)",what:"days held for the second holding point"},Jt={text:"7",value:"7",chain:null,format:"int",source:"src/CabalGate.sol:304 (held >= 7 days)",what:"days held for the third and last holding point"},Qt={text:"at a loss: 13; gain at most 50%: 12; at most 200%: 10; at most 500%: 8; at most 1,000%: 6; more: 4",value:null,chain:null,format:"text",source:"src/CabalGate.sol:279-288 (the recorded PLEA at the latest hourly price vs the IMD the buys cost, fees included: src/PleaHook.sol:566, :738)",what:"profit part of the fact score"},Zt={text:"13",value:"13",chain:null,format:"int",source:"src/CabalGate.sol:283",what:"profit points at a loss"},ea={text:"12",value:"12",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 50%"},ta={text:"10",value:"10",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 200%"},aa={text:"8",value:"8",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 500%"},sa={text:"6",value:"6",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 1,000%"},na={text:"4",value:"4",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain above 1,000%"},oa={text:"50%",value:"5000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g * 2 <= spent)",what:"first profit band edge"},ra={text:"200%",value:"20000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 2)",what:"second profit band edge"},la={text:"500%",value:"50000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 5)",what:"third profit band edge"},ia={text:"1,000%",value:"100000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 10)",what:"fourth profit band edge"},ca={text:"PLEA no buy record covers (airdrop, prizes) counts as held since trading opened, at profit 9",value:null,chain:null,format:"text",source:"src/CabalGate.sol:274-278, :289-292 (PLEA-weighted mean of the record's points and the received points, rounded to the nearest point)",what:"received PLEA"},ha={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:291",what:"profit points for PLEA no buy record covers"},da={text:"24-hour price up more than 2%: 9; within 2% (or no price 24 hours ago): 5; down more than 2%: 0",value:null,chain:null,format:"text",source:"src/CabalGate.sol:294-297; the hour checkpoints src/PleaHook.sol:294-309",what:"trend part of the fact score"},ua={text:"2%",value:"200",chain:null,format:"bps",source:"src/CabalGate.sol:296-297 (latest > ago * 102 / 100; latest * 100 >= ago * 98)",what:"how far the price must move in 24 hours to count as up or down"},pa={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:296",what:"trend points when the price rose more than 2% in 24 hours"},ma={text:"5",value:"5",chain:null,format:"int",source:"src/CabalGate.sol:295, :297",what:"trend points within 2%, or when no price from 24 hours ago exists (the first day)"},fa={text:"0",value:"0",chain:null,format:"int",source:"src/CabalGate.sol:294-297",what:"trend points when the price fell more than 2%"},wa={text:"1 hour",value:"3600",chain:null,format:"duration",source:"src/PleaHook.sol:278-309, :1057-1067; src/CabalGate.sol:247-248",what:"prices for the fact score are hourly checkpoints (the price before each hour's first trade), never the spot price"},_a={text:"48",value:"48",chain:null,format:"int",source:"src/PleaHook.sol:195-198, :300-308",what:"hours of checkpoints kept; the 24-hour price is the newest checkpoint at least 24 and at most 48 hours old"},ya={text:"41",value:"41",chain:null,format:"int",source:"16 + 3 + 13 + 9 (src/CabalGate.sol:270-297)",what:"highest fact score"},ba={text:"7",value:"7",chain:null,format:"int",source:"3 + 0 + 4 + 0 (src/CabalGate.sol:270-297)",what:"lowest fact score"},xa={text:"28",value:"28",chain:null,format:"int",source:"69 - 41",what:"lowest possible need"},ga={text:"24",value:"24",chain:null,format:"int",source:"69 - 45 (src/CabalGate.sol:433-434)",what:"a fact score under this gives a need above 45: the plea is refused before any fee is paid"},va={text:"sincerity 0-12, craft 0-12, respect 0-9, loyalty 0-12; anchors 0-10 empty/abusive/off-topic, 11-25 sincere but plain, 26-35 specific and well made, 36-45 memorable",value:null,chain:null,format:"text",source:'src/CabalGate.sol:131-134 DEFINITIONS ("plea")',what:"what the judges score"},Ea={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for sincerity (an honest, specific reason to sell)"},Aa={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for craft (wit, originality, quality of writing, in any language)"},ka={text:"9",value:"9",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for respect (for the Cabal and the holders)"},ja={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for loyalty (commitment to PLEA, such as keeping the rest)"},Pa={text:"0-10 empty, abusive or off-topic; 11-25 sincere but plain; 26-35 specific and well made; 36-45 memorable",value:null,chain:null,format:"text",source:'src/CabalGate.sol:134 ("plea")',what:"the judges' anchors"},Ta={text:"5",value:"5",chain:null,format:"int",source:'src/CabalGate.sol:134 ("content")',what:"hate, harassment, sexual content, anything illegal, or details that identify another person score 0 to this"},La={text:"0",value:"0",chain:null,format:"int",source:'src/CabalGate.sol:134 ("manipulation")',what:"what manipulation scores (posing as a system, made-up rules, demands for a score, threats, offers, hidden instructions)"},Ia={text:"20%",value:"2000",chain:null,format:"bps",source:"src/Letterbox.sol:111; _plead :297-300",what:"a letter pleads this share of your PLEA (at most 2,500,000 PLEA)"},Na={text:"1,000 PLEA",value:"1000000000000000000000",chain:null,format:"plea",source:"src/Letterbox.sol:113; :300 (LetterTooSmall)",what:"a letter whose 20% is smaller is refused"},Da={text:"5,000 PLEA",value:"5000000000000000000000",chain:null,format:"plea",source:"1,000 / 20% (src/Letterbox.sol:111-113, :297-300)",what:"a letter from a smaller balance is refused (its 20% is under 1,000 PLEA)"},Sa={text:"0.25 IMD",value:"250000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:115; paid on delivery :424; returned by settle :453",what:"paid to whoever delivers an approved letter or auto-sell plea; returned to you when no sale happens (and to you when you send SELL)"},Ca={text:"0.75 IMD",value:"750000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:525-528 feesFor(false) = TIP + ORACLE_FEE (Ethereum buys the oracle fee: PleaLaunch.mintOracleFee() is false)",what:"the IMD a letter or auto-sell plea buys with your PLEA: the 0.5 IMD oracle fee and the 0.25 IMD tip"},$a={text:"1.1 IMD",value:"1100000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:525-528 feesFor(true) = TIP + APPEAL_FEE + ORACLE_FEE",what:"the IMD an appeal letter buys with your PLEA: 0.5 + 0.35 + 0.25"},Ma={text:"110%",value:"11000",chain:null,format:"bps",source:"src/Letterbox.sol:133-134, :527; unspent PLEA comes back at once :386-387",what:"the fee sale may spend PLEA worth at most this share of the IMD it buys, at the hourly price"},Oa={text:"10%",value:"1000",chain:null,format:"bps",source:"src/Letterbox.sol:135-136; :304 (FeeTooHigh)",what:"a letter's or auto-sell plea's fees may take at most this share of your PLEA"},Ga={text:"8.25 IMD",value:"8250000000000000000",chain:null,format:"imd",source:"0.75 IMD x 110% / 10% (src/Letterbox.sol:304, :525-528)",what:"the least your PLEA must be worth, at the hourly price, to send a letter or an auto-sell plea"},Ha={text:"12.1 IMD",value:"12100000000000000000",chain:null,format:"imd",source:"1.1 IMD x 110% / 10% (src/Letterbox.sol:361-363; or the fees fit in 110% of the original plea's amount)",what:"the least your PLEA must be worth for an appeal letter, unless its fees fit in 110% of the original plea's amount"},Ra={text:"0.7 IMD",value:"700000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:120-124; _requireWorthTheFee :428-433 (TooSmallForTheFee)",what:"a letter or auto-sell plea worth less at the hourly price is refused"},Ba={text:"95%",value:"9500",chain:null,format:"bps",source:"src/Letterbox.sol:127-129; _deliver :405-406",what:"a delivered sale must get at least 95% of its hourly value after the hook's sale fees"},Fa={text:"92.86%",value:null,chain:null,format:"text",source:"95% x (100% - 2.25%) = 92.8625% (src/Letterbox.sol:129-132, :405-406)",what:"the least a delivered sale pays, as a share of the plea's hourly value"},Wa={text:"0.35 IMD",value:"350000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:116-119; _deliver :415-421 (never more than the sale; letters do not pay it)",what:"taken from a delivered auto-sell sale, to the season's prize pot"},Ya={text:"APPEAL followed by your text; SELL; NAME followed by a name; any other text is a new plea",value:null,chain:null,format:"text",source:"src/Letterbox.sol:204-216, :495-519",what:"what a letter's first word does"},za={text:"3",value:"3",chain:null,format:"int",source:"src/Letterbox.sol:260-261 (BadName)",what:"shortest display name"},Ua={text:"20",value:"20",chain:null,format:"int",source:"src/Letterbox.sol:260-261 (BadName)",what:"longest display name"},qa={text:"a-z, 0-9 and _",value:null,chain:null,format:"text",source:"src/Letterbox.sol:262-265",what:"the characters a display name may use"},Va={text:"cabal, admin, imd, plea, owner",value:null,chain:null,format:"text",source:"src/Letterbox.sol:266-270",what:"names nobody may take"},Ka={text:"20 minutes",value:"1200",chain:"Tribunal.OBJECTION_WINDOW",format:"duration",source:"src/Tribunal.sol:126-127; :263 (WindowClosed)",what:"time after an approval to object; the plea's season points wait for it"},Xa={text:"0.5 IMD",value:"500000000000000000",chain:"Tribunal.ORACLE_FEE",format:"imd",source:"src/Tribunal.sol:130; :291-301",what:"an objection's oracle fee, spent whatever the ruling"},Ja={text:"0.35 IMD",value:"350000000000000000",chain:"Tribunal.STAKE",format:"imd",source:"src/Tribunal.sol:131; :290; settle :370-381",what:"back if sustained or void; to the plea's season prize pot if overruled"},Qa={text:"0.85 IMD",value:"850000000000000000",chain:null,format:"imd",source:"src/Tribunal.sol:130-131 (0.5 + 0.35)",what:"what an objection costs in IMD"},Za={text:"2",value:"2",chain:"Tribunal.MARGIN",format:"int",source:"src/Tribunal.sol:134-135; sustained when score + 2 < need :330",what:"sustained only when the new score is more than this below the need"},es={text:"2",value:"2",chain:"Tribunal.MAX_OBJECTIONS",format:"int",source:"src/Tribunal.sol:132-133; :268-279",what:"objections per plea, each from a different wallet; both may wait at once"},ts={text:"20 minutes",value:"1200",chain:"Tribunal.PENDING_EXPIRY",format:"duration",source:"src/Tribunal.sol:128-129; expire :361-368",what:"an objection with no ruling after this is void (stake back, fee spent)"},as={text:"280",value:"280",chain:"Tribunal.MAX_TEXT_BYTES",format:"int",source:"src/Tribunal.sol:136; :483-486",what:"an objection's text, in UTF-8 bytes (a page writes the word bytes after it)"},ss={text:"60",value:"60",chain:"Seasons.MIN_POINTS",format:"int",source:"src/Seasons.sol:60; :339, :444",what:"points to qualify for a prize"},ns={text:"25",value:"25",chain:"Seasons.TOP",format:"int",source:"src/Seasons.sol:61; :338",what:"ranks paid each season"},os={text:"3",value:"3",chain:null,format:"int",source:"src/Seasons.sol:86-87, :265-281",what:"your best pleas that count in a season"},rs={text:"135",value:"135",chain:null,format:"int",source:"3 x 45 (src/Seasons.sol:265-281)",what:"most points a wallet can have in a season without a seat"},ls={text:"162",value:"162",chain:null,format:"int",source:"3 x 54 (src/Seasons.sol:133-135, :265-281)",what:"most points with an IMD seat"},is={text:"4.5% for 1st down to 3.5% for 25th, in a straight line (rounded to whole basis points), 100% in all",value:null,chain:null,format:"text",source:"src/Seasons.sol:74-76 SHARES; shareBps :117-119 (on chain: 450 ... 350, sum 10,000)",what:"prize shares"},cs={text:"4.5%",value:"450",chain:null,format:"bps",source:"src/Seasons.sol:76; Seasons.shareBps(0) = 450 on chain",what:"the 1st place's share of the pot and of the bonus"},hs={text:"3.5%",value:"350",chain:null,format:"bps",source:"src/Seasons.sol:76; Seasons.shareBps(24) = 350 on chain",what:"the 25th place's share"},ds={text:"4.50, 4.46, 4.42, 4.38, 4.33, 4.29, 4.25, 4.21, 4.17, 4.12, 4.08, 4.04, 4.00, 3.96, 3.92, 3.88, 3.83, 3.79, 3.75, 3.71, 3.67, 3.62, 3.58, 3.54, 3.50",value:null,chain:null,format:"text",source:"src/Seasons.sol:76; Seasons.shareBps(0..24) on chain",what:"every rank's share in percent, 1st to 25th"},us={text:"1 hour",value:"3600",chain:"Seasons.CLOSE_GRACE",format:"duration",source:"src/Seasons.sol:62-64; :326 (NotReady)",what:"after a season ends, before anyone can close it"},ps={text:"6",value:"6",chain:"Seasons.BONUS_SEASONS",format:"int",source:"src/Seasons.sol:65-66; :350",what:"seasons that also pay the PLEA bonus"},ms={text:"10,000,000 PLEA",value:"10000000000000000000000000",chain:"Seasons.BONUS_PER_SEASON",format:"plea",source:"src/Seasons.sol:67; _payBonus :437-460",what:"PLEA bonus per season, same shares and same 60-point bar; unpaid shares are burned"},fs={text:"60,000,000 PLEA",value:"60000000000000000000000000",chain:null,format:"plea",source:"6 x 10,000,000 = Seasons' 6% (src/PLEA.sol:105)",what:"all six seasons' bonus"},ws={text:"×1.2",value:"12000",chain:"Seasons.SEAT_MULTIPLIER_BPS",format:"multiplier",source:"src/Seasons.sol:68-71; pointsFor :131-135 (rounded down; read when the plea is recorded)",what:"points for an IMD seat holder; points only, never the need or the 60-point bar"},_s={text:"a score of 45 counts 54 points",value:null,chain:null,format:"text",source:"45 x 12,000 / 10,000 = 54 (src/Seasons.sol:134)",what:"the seat multiplier on the top score"},ys={text:"2.25%",value:"225",chain:null,format:"bps",source:"src/PleaHook.sol:73-79 (IMD_FEE_BPS 200 of the trade's IMD + PLEA_BURN_BPS 25 of its PLEA)",what:"every trade's fee"},bs={text:"2%",value:"200",chain:"PleaHook.IMD_FEE_BPS",format:"bps",source:"src/PleaHook.sol:78; a share of the IMD that reaches or leaves the pool :470-472, :551",what:"the IMD part of every trade's fee"},xs={text:"0.5%",value:"50",chain:"PleaHook.CASHBACK_BPS",format:"bps",source:"src/PleaHook.sol:74; :598; _payCashback :758-781",what:"back to the trader as staked IMD (sIMD, imd/acc's Stacker); stays in the pool when no trader is known (after the death)"},gs={text:"1%",value:"100",chain:"PleaHook.OWNER_BPS",format:"bps",source:"src/PleaHook.sol:75; :599, :619",what:"to the owner (the hook's fixed fee receiver)"},vs={text:"0.25%",value:"25",chain:"PleaHook.PRIZE_BPS",format:"bps",source:"src/PleaHook.sol:76; :600-601 (to pool liquidity once the Cabal is dead)",what:"to the season's prize pot while the Cabal lives"},Es={text:"0.25%",value:"25",chain:"PleaHook.POOL_BPS",format:"bps",source:"src/PleaHook.sol:77; :618, :630-633",what:"kept in the pool for the buy wall"},As={text:"0.25%",value:"25",chain:"PleaHook.PLEA_BURN_BPS",format:"bps",source:"src/PleaHook.sol:79; :594, :644-654",what:"of the trade's PLEA, burned"},ks={text:"1.75%",value:"175",chain:null,format:"bps",source:"0.5% + 1% + 0.25% (src/PleaHook.sol:598-602)",what:"the IMD fee parts paid out of the pool (cashback, owner, prize)"},js={text:"90 minutes",value:"5400",chain:"PleaHook.LAUNCH_WINDOW",format:"duration",source:"src/PleaHook.sol:80; launchExtraBps :311-317; max buy :721-725",what:"the launch window after trading opens"},Ps={text:"70%",value:"7000",chain:"PleaHook.LAUNCH_EXTRA_BPS",format:"bps",source:"src/PleaHook.sol:81; :311-317, :485-487; a share of the IMD that reaches the pool :470-472; kept for the wall :618",what:"the extra fee on buys at the open; it falls in a straight line to 0% over the launch window; it stays in the pool for the buy wall"},Ts={text:"70% at the open, 58.33% after 15 minutes, 46.66% after 30, 35% after 45, 23.33% after 60, 11.66% after 75, 0% from 90",value:null,chain:null,format:"text",source:"7,000 x (5,400 - seconds since the open) / 5,400 basis points, rounded down (src/PleaHook.sol:311-317)",what:"the launch fee over the window"},Ls={text:"72%",value:"7200",chain:null,format:"bps",source:"2% + 70% (src/PleaHook.sol:485-487)",what:"the IMD fee on a buy at the open, as a share of the IMD that reaches the pool"},Is={text:"41.86%",value:null,chain:null,format:"text",source:"7,200 / 17,200 = 41.86% (src/PleaHook.sol:470-472: fee = amount x rate / (10,000 + rate))",what:"the fee at the open as a share of the IMD a buyer pays"},Ns={text:"5,000,000 PLEA",value:"5000000000000000000000000",chain:"PleaHook.LAUNCH_MAX_BUY",format:"plea",source:"src/PleaHook.sol:82; _checkMaxBuy :721-725 (BuyTooLarge); the pool's PLEA out before the burn :474, :538",what:"most PLEA one buy may take from the pool in the launch window"},Ds={text:"0.00002 IMD",value:"20000000000000",chain:null,format:"imd",source:"20,000 IMD / 1,000,000,000 PLEA (src/PleaHook.sol:384-389; the opening tick is rounded up to the 60-tick grid :394-396, about 0.23% higher)",what:"the opening price of one PLEA"},Ss={text:"about 100 IMD",value:null,chain:null,format:"text",source:"5,000,000 x 0.00002 IMD (before price impact and fees)",what:"what the largest launch-window buy is worth at the opening price"},Cs={text:"2 IMD",value:"2000000000000000000",chain:"PleaHook.PAYOUT_RESERVE",format:"imd",source:"src/PleaHook.sol:83-86; :603-617 (PayoutsToPool)",what:"the opening exception: while the pool's own IMD plus a buy's fee is under this and the pool cannot pay out, that buy's cashback, owner and prize shares join the pool instead"},$s={text:"20,000 IMD",value:"20000000000000000000000",chain:"PleaHook.MARKET_CAP_IMD",format:"imd",source:"src/PleaHook.sol:87-88; seed :376-424",what:"the market cap trading opens at"},Ms={text:"14,000 IMD",value:"14000000000000000000000",chain:null,format:"imd",source:"src/PleaLaunch.sol:211-214 (BelowAgreedMarketCap)",what:"on Ethereum, seed refuses a hook whose opening market cap is under this"},Os={text:"15 days",value:"1296000",chain:null,format:"duration",source:"src/PleaLaunch.sol:211-212 (BelowAgreedTiming)",what:"on Ethereum, seed refuses seasons shorter than this"},Gs={text:"33 hours",value:"118800",chain:null,format:"duration",source:"src/PleaLaunch.sol:211-212 (BelowAgreedTiming)",what:"on Ethereum, seed refuses a dead-man shorter than this"},Hs={text:"900,000 PLEA",value:"900000000000000000000000",chain:"PleaHook.CAP_FLOOR",format:"plea",source:"src/PleaHook.sol:89; :803",what:"the inventory cap never falls below this"},Rs={text:"15",value:"15",chain:"PleaHook.CAP_DECAY_DAYS",format:"int",source:"src/PleaHook.sol:90-93; capDecayPerDay :409",what:"the cap may fall from the seeded PLEA to its floor in this many days at the fastest (a page writes the word days after it)"},Bs={text:"about 54.6 million PLEA",value:null,chain:null,format:"text",source:"(820,000,000 - 900,000) / 15 = 54,606,666 (src/PleaHook.sol:409; the seeded amount is a hair under 820,000,000: the 1-in-a-million rounding margin :1084)",what:"how far the cap may fall per day at most (fixed at the seed)"},Fs={text:"1 PLEA",value:"1000000000000000000",chain:"PleaHook.MIN_TRIM",format:"plea",source:"src/PleaHook.sol:94; :331-335, :815",what:"the least excess above the cap that is trimmed"},Ws={text:"1 IMD",value:"1000000000000000000",chain:"PleaHook.WALL_THRESHOLD",format:"imd",source:"src/PleaHook.sol:95; pendingRebalance :337-340",what:"kept IMD worth a rebalance"},Ys={text:"1,000 PLEA",value:"1000000000000000000000",chain:"PleaHook.WALL_MIN_FILL",format:"plea",source:"src/PleaHook.sol:96; :339",what:"PLEA bought by the wall worth a rebalance (it is burned then)"},zs={text:"700",value:"700",chain:"PleaHook.WALL_GUARD_TICKS_PER_DAY",format:"int",source:"src/PleaHook.sol:178-185; _updateWallGuard :1022-1055",what:"ticks a day the wall's ceiling may rise toward a higher price (it falls at once); a page writes the word ticks after it"},Us={text:"about 7.25%",value:null,chain:null,format:"text",source:"1.0001 ^ 700 = 1.0725",what:"the wall guard's daily step as a price change"},qs={text:"200",value:"200",chain:null,format:"int",source:"src/PleaHook.sol:177; _observeTick :1002-1014",what:"ticks a block the hook's reference price may move (about 2%)"},Vs={text:"60",value:"60",chain:"PleaHook.TICK_SPACING",format:"int",source:"src/PleaHook.sol:106",what:"the pool's tick spacing"},Ks={text:"0",value:"0",chain:"PleaHook.LP_FEE",format:"int",source:"src/PleaHook.sol:105",what:"the pool's own swap fee: every fee is the hook's"},Xs={text:"1,400,000",value:"1400000",chain:null,format:"int",source:"creditGas 400,000 + SWAP_RESERVE 1,000,000 (src/PleaHook.sol:99-102, :452; launch.json PleaLaunch argument 8 = 400000)",what:"gas a trade must still have when it reaches the hook, or it reverts NotEnoughGas"},Js={text:"1,000,000,000 PLEA",value:"1000000000000000000000000000",chain:"PLEA.TOTAL_SUPPLY",format:"plea",source:"src/PLEA.sol:27; minted once in init :98-108",what:"fixed supply"},Qs={text:"820,000,000 PLEA",value:"820000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:104 (82%); on chain PLEA.balanceOf(hook) = 820,000,000 before the seed",what:"the pool's PLEA: all of it is the pool's liquidity"},Zs={text:"60,000,000 PLEA",value:"60000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:105 (6%); on chain PLEA.balanceOf(Seasons)",what:"Seasons' PLEA bonus"},en={text:"120,000,000 PLEA",value:"120000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:106 (12%); on chain PLEA.balanceOf(PleaDistributor)",what:"the distributor's PLEA (the swarm's 10% and a 2% airdrop, paid by one Merkle root)"},tn={text:"82%",value:"8200",chain:null,format:"bps",source:"src/PLEA.sol:104",what:"the pool's share of the supply"},an={text:"6%",value:"600",chain:null,format:"bps",source:"src/PLEA.sol:105",what:"Seasons' share"},sn={text:"12%",value:"1200",chain:null,format:"bps",source:"src/PLEA.sol:106",what:"the distributor's share"},nn={text:"10%",value:"1000",chain:null,format:"bps",source:"src/PLEA.sol:10-11, src/PleaDistributor.sol:10 (comments: the code pays whatever the owner's root lists)",what:"the swarm's part of the distributor's 12%"},on={text:"2%",value:"200",chain:null,format:"bps",source:"src/PLEA.sol:10-11, src/PleaDistributor.sol:10 (comments: the code pays whatever the owner's root lists)",what:"the airdrop's part of the distributor's 12%"},rn={text:"82% to the pool (820,000,000), 6% to Seasons (60,000,000), 12% to the distributor (120,000,000)",value:null,chain:null,format:"text",source:"src/PLEA.sol:95-108; minted at deployHook (block 26,294,113)",what:"supply at launch"},ln={text:"Tue 24 Nov 2026, 15:00 UTC",value:"1795532400",chain:"PleaLaunch.START",format:"text",source:"launch.json PleaLaunch argument 9 = 1795532400; src/PleaLaunch.sol:69-70, :206",what:"from this time anyone may open trading (seed); the owner may open it earlier"},cn={text:"0x5BF3597216f9019Cf10CF680783289Efc8639Bf0",value:null,chain:null,format:"text",source:"launch.json $owner; on chain PLEA.owner(), PleaHook.owner(), PleaDistributor.owner()",what:"PLEA's owner, the hook's fee receiver and the distributor's owner"},hn={text:"#2647",value:null,chain:null,format:"text",source:"IMD's launch record (README of the site)",what:"IMD's launch number"},dn={text:"26,293,890",value:"26293890",chain:null,format:"int",source:"Ethereum block of the launch transaction (PLEA's Launched event)",what:"the launch block"},un={text:"26,294,106",value:"26294106",chain:null,format:"int",source:"PleaLaunch's LetterboxDeployed event",what:"the Letterbox's block"},pn={text:"26,294,111",value:"26294111",chain:null,format:"int",source:"PleaLaunch's TribunalDeployed event",what:"the Tribunal's block"},mn={text:"26,294,113",value:"26294113",chain:null,format:"int",source:"PleaLaunch's HookDeployed event (PLEA minted its supply here)",what:"the hook's block"},fn={text:"0x1F158929496162b53fB232536468948e25170aB3",value:null,chain:null,format:"text",source:"launch #2647",what:"PLEA (the token)"},wn={text:"0x39AC882a1161EA19aCb6FBDd7A5835D96CF876EB",value:null,chain:null,format:"text",source:"launch #2647; PLEA.gate()",what:"CabalGate (pleas, verdicts, sales)"},_n={text:"0xF7c024F7Bc96Cf152a572F6E184318ff6d380738",value:null,chain:null,format:"text",source:"launch #2647; PLEA.seasons()",what:"Seasons (points, prizes)"},yn={text:"0x97fAcE21C7a9f3b64D0f4E0bF21861721fBBfE3E",value:null,chain:null,format:"text",source:"launch #2647; PLEA.distributor()",what:"PleaDistributor (the 12%)"},bn={text:"0x9e75eabf8d1c905a07a0C99bb9eC9430a065358F",value:null,chain:null,format:"text",source:"launch #2647; PLEA.launcher()",what:"PleaLaunch (wiring, seed)"},xn={text:"0x00423EbaEd03445Fc1452d9A79A51E3C0DFdab5f",value:null,chain:null,format:"text",source:"PleaLaunch.letterbox(); PLEA.letterbox()",what:"Letterbox (letters, the auto-sell box)"},gn={text:"0x1aA665eB420F28103324daAAf034DE13EE6f53D9",value:null,chain:null,format:"text",source:"PleaLaunch.tribunal()",what:"Tribunal (Objection!)"},vn={text:"0xf1122bc96AdeA8768CFf2badf02b6D4594f928Cc",value:null,chain:null,format:"text",source:"PleaLaunch.hook(); PLEA.hook()",what:"PleaHook (the pool's hook: fees, cap, wall)"},En={text:"0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7",value:null,chain:null,format:"text",source:"launch.json CabalGate arguments 3-4",what:"IMD (the pool's other token and the fee token)"},An={text:"0x000000000004444c5dc75cB358380D2e3dE08A90",value:null,chain:null,format:"text",source:"launch.json PleaLaunch argument 5; PLEA.poolManager()",what:"Uniswap v4's PoolManager"},kn={text:"0x06909F672301F28A810f78cfe7a754851269F4F0",value:null,chain:null,format:"text",source:"launch.json PleaLaunch argument 7",what:"imd/acc's Stacker (pays the cashback as sIMD)"},jn={text:"0xa43e6F75ee006411F79Ac1C84120606C2330DE82",value:null,chain:null,format:"text",source:"launch.json CabalGate argument 2",what:"IMD's Intake (asks the Cabal)"},Pn={text:"0x5598Aa9146215Bc13eb26f2c692Ad1461Fd32982",value:null,chain:null,format:"text",source:"launch.json CabalGate argument 5",what:"the key that signs the Cabal's answers"},Tn={text:"0x0000eC93127BAA929E58E97dd0095A2BFb38ec1D",value:null,chain:null,format:"text",source:"launch.json Seasons argument 4; Seasons.seat()",what:"the IMD seat NFT (identity.md) behind the seat multiplier"},Ln={text:"12",value:"12",chain:null,format:"int",source:"audit/FINDINGS.md Rounds table (rounds 1-12; 9-12 on the Ethereum code, the last on 571ae80, round 12)",what:"IMD swarm audit rounds"},In={text:"852",value:"852",chain:null,format:"int",source:"README.md:299 (written 2026-10-17 for run 8.5's code; not re-counted for 42e0f85)",what:"the README's test count (unit, fuzz, invariant, adversarial, fork)"},Nn={_meta:yt,pass_mark:bt,max_score:xt,panel_size:gt,quorum:vt,oracle_fee:Et,appeal_wall_share:At,appeal_total:kt,appeals_per_plea:jt,sell_window:Pt,cooldown:Tt,appeal_window:Lt,pending_expiry:It,max_plea_bytes:Nt,max_sell:Dt,max_share:St,min_share:Ct,min_share_cap_balance:$t,deadman:Mt,season_length:Ot,fact_share_bands:Gt,share_band_top:Ht,share_band_mid:Rt,fact_share_top:Bt,fact_share_mid:Ft,fact_share_low:Wt,fact_held_points:Yt,held_points_0:zt,held_points_1d:Ut,held_points_3d:qt,held_points_7d:Vt,held_day_1:Kt,held_day_3:Xt,held_day_7:Jt,fact_profit_bands:Qt,profit_points_loss:Zt,profit_points_50:ea,profit_points_200:ta,profit_points_500:aa,profit_points_1000:sa,profit_points_more:na,profit_band_50:oa,profit_band_200:ra,profit_band_500:la,profit_band_1000:ia,fact_received:ca,received_profit:ha,fact_trend:da,trend_band:ua,trend_up:pa,trend_flat:ma,trend_down:fa,checkpoint_interval:wa,price_ring_hours:_a,fact_max:ya,fact_min:ba,need_min:xa,fact_needed:ga,judge_rubric:va,judge_sincerity_max:Ea,judge_craft_max:Aa,judge_respect_max:ka,judge_loyalty_max:ja,judge_anchors:Pa,judge_content_max:Ta,judge_manipulation:La,letter_share:Ia,min_letter:Na,letter_min_balance:Da,runner_tip:Sa,letter_fee:Ca,letter_appeal_fee:$a,fee_cap:Ma,max_fee_share:Oa,letter_min_value:Ga,letter_appeal_min_value:Ha,min_sale_value:Ra,delivery_min_out:Ba,delivery_floor:Fa,auto_sell_fee:Wa,letter_commands:Ya,name_min_length:za,name_max_length:Ua,name_chars:qa,name_reserved:Va,objection_window:Ka,objection_fee:Xa,objection_stake:Ja,objection_total:Qa,objection_margin:Za,max_objections:es,objection_expiry:ts,objection_bytes:as,min_points:ss,top:ns,best_count:os,max_points:rs,max_points_seat:ls,shares:is,share_first:cs,share_last:hs,shares_list:ds,close_grace:us,bonus_seasons:ps,bonus_per_season:ms,bonus_total:fs,seat_multiplier:ws,seat_example:_s,fee_total:ys,fee_imd:bs,fee_cashback:xs,fee_owner:gs,fee_prize:vs,fee_pool:Es,fee_burn:As,fee_payouts:ks,launch_window:js,launch_extra:Ps,launch_fee_curve:Ts,launch_open_fee:Ls,launch_open_fee_of_payment:Is,launch_max_buy:Ns,seed_price:Ds,launch_max_buy_value:Ss,payout_reserve:Cs,market_cap:$s,market_cap_check:Ms,seed_check_season:Os,seed_check_deadman:Gs,cap_floor:Hs,cap_decay_days:Rs,cap_decay_per_day:Bs,min_trim:Fs,wall_threshold:Ws,wall_min_fill:Ys,wall_guard:zs,wall_guard_pct:Us,ref_step:qs,tick_spacing:Vs,lp_fee:Ks,swap_min_gas:Xs,total_supply:Js,supply_pool:Qs,supply_seasons:Zs,supply_distributor:en,supply_pool_pct:tn,supply_seasons_pct:an,supply_distributor_pct:sn,supply_swarm_pct:nn,supply_airdrop_pct:on,supply_split:rn,start:ln,owner:cn,launch_id:hn,launch_block:dn,letterbox_block:un,tribunal_block:pn,hook_block:mn,addr_plea:fn,addr_gate:wn,addr_seasons:_n,addr_distributor:yn,addr_launch:bn,addr_letterbox:xn,addr_tribunal:gn,addr_hook:vn,addr_imd:En,addr_pool_manager:An,addr_stacker:kn,addr_intake:jn,addr_oracle_signer:Pn,addr_seat:Tn,audit_rounds:Ln,tests_count:In},$=Nn;function Pe(a){return{text:t=>{const s=se($,t,a);if(s===void 0)throw Error(`The docs name an unknown number {{${t}}}.`);return s},value:t=>{if(!(t in $)||t==="_meta")throw Error(`The docs name an unknown number {{${t}}}.`);return qe($,t,a)}}}const Te=x.createContext(Pe()),Dn=Te.Provider,j=()=>x.useContext(Te),Sn={APPROVED:"approved",OVERTURNED:"approved",DENIED:"denied",UPHELD:"denied",PENDING:"pending","NO VERDICT":"noverdict",LAPSED:"lapsed",SOLD:"sold",OBJECTION:"objection",SUSTAINED:"objection",OVERRULED:"objection",VOID:"objection"};function y({state:a,sub:t,size:s}){return e.jsxs("span",{className:`stamp stamp--${Sn[a]}${s?` stamp--${s}`:""}`,children:[a,t&&e.jsx("span",{className:"stamp__sub",children:t})]})}function Cn({fact:a,score:t,verdict:s}){const n=j(),o=Number(n.value("pass_mark")),r=Number(n.value("max_score")),l=o-a,c=s!==void 0&&t!==void 0,p=s==="DENIED",i=c?p?`${l-t} short`:`passes by ${t-l}`:"";return e.jsxs("div",{className:`meter ${c?p?"meter--denied":"":"meter--none"}`,style:{"--score":Math.max(0,Math.min(r,t??0)),"--need":Math.max(0,Math.min(r,l))},children:[e.jsxs("div",{className:"meter__legend",children:[e.jsx("span",{children:c?`Judges ${t}`:"No score yet"}),e.jsxs("span",{children:["Need ",e.jsx("b",{children:l})," = ",o," − fact ",e.jsx("b",{children:a})]}),c&&e.jsx("span",{className:p?"bad-text":"ok-text",children:i})]}),e.jsxs("div",{className:"meter__bar",role:"img","aria-label":c?`Score ${t} of ${r}, need ${l}: ${i}`:`No score yet, need ${l} of ${r}.`,children:[e.jsx("span",{className:"meter__fill"}),e.jsx("span",{className:"meter__need"})]}),e.jsxs("div",{className:"meter__scale","aria-hidden":"true",children:[e.jsx("span",{children:"0"}),e.jsx("span",{children:r})]})]})}function I({title:a,alt:t,children:s,lead:n,after:o}){const r="dg-"+x.useId().replace(/[^a-zA-Z0-9_-]/g,"");return e.jsxs("figure",{className:"docs-figure panel stack stack--md dg",children:[e.jsx("figcaption",{className:"docs-figure__title",children:a}),n,e.jsxs("div",{className:"dg-art",role:"img","aria-labelledby":r,children:[e.jsx("span",{id:r,className:"sr-only",children:t}),s]}),o]})}function z({down:a=!1}){return a?e.jsx("span",{className:"dg-arrow","aria-hidden":"true",children:e.jsx(A,{name:"arrow-down"})}):e.jsxs("span",{className:"dg-arrow","aria-hidden":"true",children:[e.jsx("span",{className:"dg-arrow__down",children:e.jsx(A,{name:"arrow-down"})}),e.jsx("span",{className:"dg-arrow__across",children:e.jsx(A,{name:"arrow-right"})})]})}function oe({n:a,icon:t,title:s,children:n,wait:o=!1}){return e.jsxs("div",{className:`dg-node${o?" dg-node--wait":""}`,children:[e.jsxs("span",{className:"dg-node__head",children:[a!==void 0&&e.jsx("span",{className:"dg-n",children:a}),t&&e.jsx(A,{name:t}),e.jsx("span",{children:s})]}),n]})}function L({children:a}){return e.jsx("div",{className:"dg-lane",children:a})}function re({n:a,children:t}){return e.jsx("div",{className:"dg-lanes",style:{"--lanes":a},children:t})}function le({icon:a,children:t}){return e.jsxs("div",{className:"dg-band",children:[e.jsx(A,{name:a}),e.jsx("p",{children:t})]})}function $n(){const a=j(),t=a.text,s=[{icon:"gavel",state:"is-done",title:"Denied",body:`Your score is below your need. A window of ${t("appeal_window")} opens. It is also your cooldown: no new plea before it ends.`,stamps:e.jsx(y,{state:"DENIED",sub:"score < need",size:"sm"})},{icon:"timer",state:"is-now",title:`Appeal within ${t("appeal_window")}`,body:`Once, for the same amount or less, with a new text. Pay the ${t("oracle_fee")} oracle fee and ${t("appeal_wall_share")} for the buy wall: ${t("appeal_total")}.`},{icon:"hourglass",state:"is-later",title:"The judges read it",body:`A new plea with a new need, judged on its own text. The judges also see the denied plea, its score and its need. Up to ${t("pending_expiry")}.`,stamps:e.jsx(y,{state:"PENDING",size:"sm"})},{icon:"gavel",state:"is-later",title:"The appeal's verdict",body:`Overturned: sell within ${t("sell_window")}, as after any approval. Upheld: no further appeal. No verdict: you may appeal again inside the window, paying again.`,stamps:e.jsxs("span",{className:"cluster cluster--sm",children:[e.jsx(y,{state:"OVERTURNED",size:"sm"}),e.jsx(y,{state:"UPHELD",size:"sm"}),e.jsx(y,{state:"NO VERDICT",size:"sm"})]})}],n="A timeline of an appeal. "+s.map((o,r)=>`${r+1}, ${o.title}: ${o.body}`).join(" ")+` After an upheld appeal, or a sale, the next plea waits ${t("cooldown")} from then.`;return e.jsx(I,{title:`A denial opens one appeal, for ${t("appeal_window")}`,alt:n,children:e.jsx("ol",{className:"timeline",children:s.map(o=>e.jsxs("li",{className:o.state,children:[e.jsx("span",{className:"timeline__dot",children:e.jsx(A,{name:o.icon})}),e.jsxs("div",{className:"stack stack--sm",children:[e.jsx("p",{className:"timeline__title",children:o.title}),o.stamps&&e.jsx("div",{children:o.stamps}),e.jsx("p",{className:"timeline__meta",children:o.body})]})]},o.title))})})}const q=[{key:"fee_cashback",label:"Back to you, as staked IMD",fill:"var(--approved)",of:"IMD"},{key:"fee_owner",label:"The owner",fill:"var(--objection)",of:"IMD"},{key:"fee_prize",label:"The season’s prize pot",fill:"var(--pending)",of:"IMD"},{key:"fee_pool",label:"The buy wall, kept in the pool",fill:"var(--executed)",of:"IMD"},{key:"fee_burn",label:"Burned",fill:"var(--noverdict)",of:"PLEA"}],O=1e3,V=48;function Mn(){const a=j(),t="fee-bar-"+x.useId().replace(/[^a-zA-Z0-9_-]/g,""),s=q.map(i=>a.value(i.key)??0n),n=s.reduce((i,u)=>i+u,0n),o=s.slice(0,4).reduce((i,u)=>i+u,0n),r=i=>Y("bps",i);let l=0;const c=q.map((i,u)=>{const m=n?O*Number(s[u])/Number(n):O/q.length,f={...i,x:l,w:m,n:u+1,text:a.text(i.key)};return l+=m,f}),p=`A bar for the ${r(n)} fee every trade pays, in five numbered parts: `+c.map(i=>`${i.n}, ${i.label[0].toLowerCase()+i.label.slice(1)}: ${i.text} of the ${i.of}`).join("; ")+`. Parts 1 to 4 are ${r(o)} of the trade’s IMD; part 5 is ${c[4].text} of its PLEA.`;return e.jsxs("figure",{className:"docs-figure panel stack stack--md",children:[e.jsxs("figcaption",{className:"docs-figure__title",children:["The ",r(n)," fee on every trade: ",r(o)," of its IMD in four parts, and ",c[4].text," of its PLEA, burned"]}),e.jsxs("div",{className:"docs-bar",children:[e.jsxs("svg",{className:"docs-bar__svg",viewBox:`0 0 ${O} ${V}`,preserveAspectRatio:"none",role:"img","aria-labelledby":`${t}-alt`,children:[e.jsx("title",{id:`${t}-alt`,children:p}),c.map(i=>e.jsx("rect",{x:i.x,y:"0",width:i.w,height:V,style:{fill:i.fill}},i.key)),c.slice(1).map(i=>e.jsx("line",{x1:i.x,y1:"0",x2:i.x,y2:V,vectorEffect:"non-scaling-stroke",style:{stroke:"var(--line)",strokeWidth:i.of==="PLEA"?8:3}},i.key))]}),c.map(i=>e.jsx("span",{className:"docs-bar__key",style:{left:`${(i.x+i.w/2)*100/O}%`},"aria-hidden":"true",children:i.n},i.key))]}),e.jsx(me,{rows:[...c.map(i=>[e.jsxs("span",{className:"docs-key-row",children:[e.jsxs("svg",{className:"docs-key",viewBox:"0 0 28 28","aria-hidden":"true",children:[e.jsx("rect",{x:"1",y:"1",width:"26",height:"26",rx:"4",style:{fill:i.fill,stroke:"var(--line)",strokeWidth:2}}),e.jsx("circle",{cx:"14",cy:"14",r:"9",style:{fill:"var(--day)",stroke:"var(--night)",strokeWidth:1.5}}),e.jsx("text",{x:"14",y:"14",dy:"0.35em",textAnchor:"middle",style:{fill:"var(--night)",fontFamily:"var(--font-body)",fontWeight:800,fontSize:12},children:i.n})]}),e.jsxs("span",{children:[e.jsxs("span",{className:"sr-only",children:["Part ",i.n,": "]}),i.label]})]}),e.jsxs(e.Fragment,{children:[i.text," ",e.jsxs("span",{className:"text-2",children:["of the ",i.of]})]})]),["Every trade",r(n),"total"]]}),e.jsx("p",{className:"small text-2",children:"Once the Cabal is dead there are no more seasons: part 3 joins the pool too."})]})}const G=6,v=1e3;function On(){const a=j(),t=a.value("launch_extra")??0n,s=a.value("launch_window")??1n,n=a.value("fee_imd")??0n,o=h=>Y("bps",h),r=h=>Y("duration",h),l=h=>h>=s?0n:t*(s-h)/s,c=Array.from({length:G+1},(h,b)=>{const d=s*BigInt(b)/BigInt(G);return{s:d,i:b,fee:l(d)}}),p=Number(s)*(G+1)/G,i=h=>Number(h)/p*v,u=h=>t?v-Number(h)/Number(t)*v:v,m=i(s),f=h=>String(Number(h)/60),w=`A line chart of the launch fee over the launch window. It starts at ${o(t)} when trading opens and falls in a straight line to 0% at ${r(s)}, then stays at 0%. `+c.map(h=>h.i===0?`At the open: ${o(h.fee)}`:`after ${f(h.s)} minutes: ${o(h.fee)}`).join(", ")+`. It comes on top of the usual ${o(n)} of the IMD that reaches the pool. Until ${r(s)} after the open, one buy may take at most ${a.text("launch_max_buy")} from the pool.`;return e.jsx(I,{title:`The launch fee: ${o(t)} at the open, 0% after ${r(s)}`,alt:w,after:e.jsxs(e.Fragment,{children:[e.jsx(me,{rows:c.map(h=>[h.i===0?"At the open":`${h.s>=s?"From":"After"} ${f(h.s)} minutes`,e.jsxs(e.Fragment,{children:[o(h.fee)," ",e.jsxs("span",{className:"text-2",children:["+ ",o(n)]})]})])}),e.jsxs("p",{className:"small text-2",children:["The launch fee is a share of the IMD that reaches the pool, on buys only, on top of the usual ",o(n),". It stays in the pool, for the buy wall."]})]}),children:e.jsxs("div",{className:"dg-chart",children:[e.jsx("span",{className:"dg-chart__title",children:"Launch fee, as a share of the IMD that reaches the pool"}),e.jsxs("div",{className:"dg-chart__plot",children:[e.jsxs("svg",{className:"dg-chart__svg",viewBox:`0 0 ${v} ${v}`,preserveAspectRatio:"none","aria-hidden":"true",children:[e.jsx("polygon",{points:`0,${u(t)} ${m},${v} 0,${v}`,style:{fill:"var(--action-soft)"}}),c.slice(1).map(h=>e.jsx("line",{x1:i(h.s),y1:"0",x2:i(h.s),y2:v,vectorEffect:"non-scaling-stroke",style:{stroke:"var(--line-soft)",strokeWidth:2,strokeDasharray:h.s===s?void 0:"4 4"}},h.i)),e.jsx("polyline",{points:`0,${u(t)} ${m},${v} ${v},${v}`,vectorEffect:"non-scaling-stroke",style:{fill:"none",stroke:"var(--ink)",strokeWidth:3,strokeLinejoin:"round"}})]}),c.map(h=>e.jsx("span",{className:"dg-chart__dot",style:{left:`${i(h.s)/10}%`,top:`${u(h.fee)/10}%`}},h.i)),e.jsx("span",{className:"dg-chart__y",style:{top:"0%"},children:o(t)}),e.jsx("span",{className:"dg-chart__y",style:{top:"50%"},children:o(t/2n)}),e.jsx("span",{className:"dg-chart__y",style:{top:"100%"},children:"0%"})]}),e.jsxs("div",{className:"dg-chart__row",children:[c.map(h=>e.jsx("span",{className:`dg-chart__x${h.i===0?" dg-chart__x--start":""}`,style:{left:`${i(h.s)/10}%`},children:f(h.s)},h.i)),e.jsx("span",{className:"dg-chart__x dg-chart__x--end",style:{left:"100%"},children:"min"})]}),e.jsx("span",{className:"dg-chart__title",children:"Minutes after trading opens"}),e.jsx("div",{className:"dg-chart__row",style:{width:`${m/10}%`},children:e.jsxs("span",{className:"dg-chart__span",children:["Until minute ",f(s),": at most ",a.text("launch_max_buy")," a buy"]})})]})})}function Gn(){const a=j(),t=a.text,s=[{icon:"envelope-simple",title:"You send a letter",text:"Your plea as plain text, sent to the Letterbox from the wallet that holds your PLEA. No ETH."},{icon:"coins",title:"Fees, paid in PLEA",text:`Some of your PLEA is sold for ${t("letter_fee")}: the ${t("oracle_fee")} oracle fee and a ${t("runner_tip")} tip. At most ${t("max_fee_share")} of your PLEA.`},{icon:"hourglass",title:"Escrow",text:`${t("letter_share")} of your PLEA waits in the Letterbox while the Cabal judges the plea.`}],n=`Within ${t("sell_window")}, anyone may deliver it: sell the escrow for you. The sale's IMD goes to you, and the ${t("runner_tip")} tip to whoever delivered. Send SELL and you deliver it yourself, and keep the tip.`,o=`Denied, no verdict, or approved but not delivered in time: anyone may settle it. Your PLEA and the ${t("runner_tip")} tip come back to you. The oracle fee is spent.`,r="A letter's path. "+s.map((l,c)=>`${c+1}, ${l.title}: ${l.text}`).join(" ")+` Then one of two endings. Delivered, after APPROVED, ending SOLD: ${n} Settled, after DENIED, NO VERDICT or LAPSED: ${o}`;return e.jsxs(I,{title:"A letter: fees in PLEA, escrow, then delivered or settled",alt:r,children:[e.jsx("div",{className:"dg-flow",children:s.map((l,c)=>e.jsxs(x.Fragment,{children:[c>0&&e.jsx(z,{}),e.jsxs(oe,{icon:l.icon,title:l.title,children:[e.jsx("span",{className:"dg-node__text",children:l.text}),c===2&&e.jsx(y,{state:"PENDING",size:"sm"})]})]},l.title))}),e.jsx(z,{down:!0}),e.jsxs(re,{n:2,children:[e.jsxs(L,{children:[e.jsxs("p",{className:"dg-then",children:[e.jsx(y,{state:"APPROVED",size:"sm"}),e.jsx(y,{state:"SOLD",size:"sm"})]}),e.jsx("p",{className:"strong",children:"Delivered"}),e.jsx("p",{className:"small",children:n})]}),e.jsxs(L,{children:[e.jsxs("p",{className:"dg-then",children:[e.jsx(y,{state:"DENIED",size:"sm"}),e.jsx(y,{state:"NO VERDICT",size:"sm"}),e.jsx(y,{state:"LAPSED",size:"sm"})]}),e.jsx("p",{className:"strong",children:"Settled"}),e.jsx("p",{className:"small",children:o})]})]}),e.jsxs(le,{icon:"envelope-simple",children:[e.jsx("b",{children:"Other letters."})," APPEAL followed by a text appeals your latest denied plea. SELL delivers your approved letter. NAME followed by a name sets your display name."]})]})}function Hn(){const a=j(),t=a.text,s=[{title:"Buy",text:"Open to anyone. Each buy records what you paid and when."},{title:"Plead",text:`Write why you want to sell, and pay the ${t("oracle_fee")} oracle fee.`,stamp:"PENDING"},{title:"Judged",text:`${t("panel_size")} judges score it from 0 to ${t("max_score")}; ${t("quorum")} must agree. Your need or more: approved.`,stamp:"APPROVED"},{title:"Sell",text:`Sell what you asked for, in one go, within ${t("sell_window")}.`,stamp:"SOLD"}],n=`Appeal once within ${t("appeal_window")}. Or wait out the cooldown, ${t("cooldown")}, and plead again.`,o=`No answer within ${t("pending_expiry")}. The fee is spent, and you may plead again at once.`,r=`Every verdict restarts its clock. After ${t("deadman")} without one, the Cabal dies for good: no more pleas, and PLEA trades freely.`,l="The PLEA loop, left to right: "+s.map((c,p)=>`${p+1}, ${c.title}: ${c.text}`).join(" ")+` A plea can also end two other ways. Denied: ${n} No verdict: ${o} Under it all, the dead-man: ${r}`;return e.jsxs(I,{title:"Buy, plead, be judged, sell",alt:l,children:[e.jsx("div",{className:"dg-flow",children:s.map((c,p)=>e.jsxs(x.Fragment,{children:[p>0&&e.jsx(z,{}),e.jsxs(oe,{n:p+1,title:c.title,children:[e.jsx("span",{className:"dg-node__text",children:c.text}),c.stamp&&e.jsx(y,{state:c.stamp,size:"sm"})]})]},c.title))}),e.jsx("p",{className:"small strong",children:"Or the plea ends another way:"}),e.jsxs(re,{n:2,children:[e.jsxs(L,{children:[e.jsx(y,{state:"DENIED",size:"sm"}),e.jsx("p",{className:"small",children:n})]}),e.jsxs(L,{children:[e.jsx(y,{state:"NO VERDICT",size:"sm"}),e.jsx("p",{className:"small",children:o})]})]}),e.jsxs(le,{icon:"hourglass",children:[e.jsx("b",{children:"Under it all, the dead-man."})," ",r]})]})}const H=1e3,K=48;function Rn(){const a=j(),t=a.text,s=d=>Number(a.value(d)??0n),n=s("pass_mark"),o=[{key:"share",label:"Share sold",value:`at most ${t("share_band_top")}`,pts:s("fact_share_top"),fill:"var(--executed)"},{key:"held",label:"Held",value:`${t("held_day_1")} day since the open`,pts:s("held_points_1d"),fill:"var(--objection)"},{key:"profit",label:"Profit or loss",value:"received, not bought",pts:s("received_profit"),fill:"var(--approved)"},{key:"trend",label:"24-hour trend",value:"flat",pts:s("trend_flat"),fill:"var(--pending)"}],r=o.reduce((d,_)=>d+_.pts,0),l=n-r;let c=0;const p=[...o,{key:"need",label:"Need",value:"the judges' part",pts:l,fill:"var(--card)"}].map(d=>{const _=H*d.pts/n,g={...d,x:c,w:_};return c+=_,g}),i=`${o.map(d=>d.pts).join(" + ")} = ${r}`,u=[{day:"0",held:s("held_points_0")},{day:t("held_day_1"),held:s("held_points_1d")},{day:t("held_day_3"),held:s("held_points_3d")},{day:t("held_day_7"),held:s("held_points_7d")}],m=[{who:"Bought, now at a loss",profit:s("profit_points_loss")},{who:`Bought, up at most ${t("profit_band_50")}`,profit:s("profit_points_50")},{who:`Bought, up ${t("profit_band_200")} to ${t("profit_band_500")}`,profit:s("profit_points_500")},{who:"Received (airdrop, prizes)",profit:s("received_profit")}],f=(d,_)=>n-(s("fact_share_top")+d+_+s("trend_flat")),w=s("trend_up")-s("trend_flat"),h=s("trend_flat")-s("trend_down"),b=`A bar for the pass mark, ${n}, split into the four fact parts and the need. `+o.map(d=>`${d.label}, ${d.value}: ${d.pts}`).join("; ")+`. Fact score ${i}. The rest of the bar is the need, ${n} − ${r} = ${l}: the judges' score, from 0 to ${t("max_score")}, must reach it.`;return e.jsxs(I,{title:`Your need is the part of ${n} your facts do not cover`,alt:b,lead:e.jsxs("p",{className:"small",children:["A plea of at most ",t("share_band_top")," of PLEA received in the airdrop, ",t("held_day_1")," day after trading opened, with a flat price:"]}),after:e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"facts",children:o.map(d=>e.jsxs("div",{className:"fact",children:[e.jsxs("span",{className:"fact__label dg-key__row",children:[e.jsx("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:e.jsx("rect",{x:"1",y:"1",width:"22",height:"22",rx:"4",style:{fill:d.fill,stroke:"var(--line)",strokeWidth:2}})}),d.label]}),e.jsx("b",{className:"fact__value",children:d.value}),e.jsxs("span",{className:"fact__pts",children:["+",d.pts]})]},d.key))}),e.jsxs("p",{className:"strong",children:["Fact score ",i,". Need ",n," − ",r," = ",l,"."]}),e.jsx(Cn,{fact:r}),e.jsx("div",{className:"table-wrap",role:"region","aria-label":"Table: need by days held",tabIndex:0,children:e.jsxs("table",{className:"table",children:[e.jsxs("caption",{className:"dg-caption",children:["Need by days held, for a plea of at most ",t("share_band_top")," at a flat price"]}),e.jsxs("thead",{children:[e.jsxs("tr",{children:[e.jsx("th",{scope:"col",rowSpan:2,children:"Your PLEA"}),e.jsx("th",{scope:"colgroup",colSpan:u.length,className:"r",children:"Days held"})]}),e.jsx("tr",{children:u.map(d=>e.jsx("th",{scope:"col",className:"r",children:d.day},d.day))})]}),e.jsx("tbody",{children:m.map(d=>e.jsxs("tr",{children:[e.jsx("th",{scope:"row",children:d.who}),u.map(_=>e.jsx("td",{className:"r strong",children:f(_.held,d.profit)},_.day))]},d.who))})]})}),e.jsxs("p",{className:"small text-2",children:["Price up more than ",t("trend_band")," in 24 hours: each need is ",w," lower. Down more than ",t("trend_band"),":"," ",h," higher. On trading's first day there is no price from 24 hours before, so the trend counts"," ",t("trend_flat"),". Received PLEA counts its days from the moment trading opened."]})]}),children:[e.jsxs("div",{className:"dg-need",children:[e.jsxs("svg",{className:"dg-need__svg",viewBox:`0 0 ${H} ${K}`,preserveAspectRatio:"none","aria-hidden":"true",children:[e.jsx("defs",{children:e.jsxs("pattern",{id:"dg-need-hatch",width:"8",height:"8",patternUnits:"userSpaceOnUse",patternTransform:"rotate(45)",children:[e.jsx("rect",{width:"8",height:"8",style:{fill:"var(--card)"}}),e.jsx("line",{x1:"0",y1:"0",x2:"0",y2:"8",style:{stroke:"var(--line-soft)",strokeWidth:4}})]})}),p.map(d=>e.jsx("rect",{x:d.x,y:"0",width:d.w,height:K,style:{fill:d.key==="need"?"url(#dg-need-hatch)":d.fill}},d.key)),p.slice(1).map(d=>e.jsx("line",{x1:d.x,y1:"0",x2:d.x,y2:K,vectorEffect:"non-scaling-stroke",style:{stroke:"var(--line)",strokeWidth:d.key==="need"?6:2}},d.key))]}),p.filter(d=>d.w>=H*.07).map(d=>e.jsx("span",{className:"dg-need__key",style:{left:`${(d.x+d.w/2)*100/H}%`},children:d.key==="need"?`need ${d.pts}`:d.pts},d.key))]}),e.jsxs("div",{className:"dg-chart__row",children:[e.jsx("span",{className:"dg-chart__x dg-chart__x--start",style:{left:0},children:"0"}),e.jsxs("span",{className:"dg-chart__x",style:{left:`${r*100/n}%`},children:["fact ",r]}),e.jsxs("span",{className:"dg-chart__x dg-chart__x--end",style:{left:"100%"},children:[n,", the pass mark"]})]})]})}function Bn(){const a=j(),t=a.text,s={pending:`The Cabal reads your plea. A verdict can come for up to ${t("pending_expiry")}.`,approved:`Your score is at least your need. Sell it all, in one go, within ${t("sell_window")}.`,sold:"You sold in time.",lapsed:"The window passed with no sale. Nothing was sold; the points still count.",denied:`Your score is below your need. You may appeal once within ${t("appeal_window")}: a new plea, judged on its own text.`,overturned:"The appeal is approved: sell within the window.",upheld:"The appeal is denied too. No further appeal.",none:`No verdict within ${t("pending_expiry")}. Anyone may close the plea. The fee is spent.`,cooldown:`After a sale, a denial or a lapse, your next plea waits ${t("cooldown")}. After no verdict, it need not wait.`},n=`The states of a plea, each a stamp. PENDING: ${s.pending} Then one of three. APPROVED: ${s.approved} It ends SOLD (${s.sold}) or LAPSED (${s.lapsed}) DENIED: ${s.denied} The appeal ends OVERTURNED (${s.overturned}) or UPHELD (${s.upheld}) NO VERDICT: ${s.none} Cooldown: ${s.cooldown}`;return e.jsxs(I,{title:"A plea's states, as the site stamps them",alt:n,children:[e.jsxs(oe,{title:"Sent",children:[e.jsx(y,{state:"PENDING",size:"sm"}),e.jsx("span",{className:"dg-node__text",children:s.pending})]}),e.jsx(z,{down:!0}),e.jsxs(re,{n:3,children:[e.jsxs(L,{children:[e.jsx(y,{state:"APPROVED",sub:"score ≥ need"}),e.jsx("p",{className:"small",children:s.approved}),e.jsx("p",{className:"small strong",children:"Then it ends:"}),e.jsxs("p",{className:"dg-then",children:[e.jsx(y,{state:"SOLD",size:"sm"}),e.jsx("span",{children:s.sold})]}),e.jsxs("p",{className:"dg-then",children:[e.jsx(y,{state:"LAPSED",size:"sm"}),e.jsx("span",{children:s.lapsed})]})]}),e.jsxs(L,{children:[e.jsx(y,{state:"DENIED",sub:"score < need"}),e.jsx("p",{className:"small",children:s.denied}),e.jsx("p",{className:"small strong",children:"An appeal ends:"}),e.jsxs("p",{className:"dg-then",children:[e.jsx(y,{state:"OVERTURNED",size:"sm"}),e.jsx("span",{children:s.overturned})]}),e.jsxs("p",{className:"dg-then",children:[e.jsx(y,{state:"UPHELD",size:"sm"}),e.jsx("span",{children:s.upheld})]})]}),e.jsxs(L,{children:[e.jsx(y,{state:"NO VERDICT",sub:"expired"}),e.jsx("p",{className:"small",children:s.none})]})]}),e.jsxs(le,{icon:"timer",children:[e.jsx("b",{children:"Cooldown."})," ",s.cooldown]})]})}const T=150,X=118,pe=11;function J({x:a,y:t,agrees:s}){return s?e.jsxs("g",{children:[e.jsx("circle",{cx:a,cy:t,r:pe,style:{fill:"var(--approved)",stroke:"var(--line)",strokeWidth:2.5}}),e.jsx("path",{d:`M${a-5} ${t} l3.5 4 l7 -8`,style:{fill:"none",stroke:"var(--night)",strokeWidth:3,strokeLinecap:"round",strokeLinejoin:"round"}})]}):e.jsxs("g",{children:[e.jsx("circle",{cx:a,cy:t,r:pe,style:{fill:"var(--card)",stroke:"var(--line)",strokeWidth:2.5,strokeDasharray:"5 3"}}),e.jsx("path",{d:`M${a-4.5} ${t} h9`,style:{stroke:"var(--ink)",strokeWidth:2.5,strokeLinecap:"round"}})]})}function Fn(){const a=j(),t=a.text,s=Number(a.value("panel_size")??0n),n=Number(a.value("quorum")??0n),o=Array.from({length:s},(c,p)=>{const i=2*Math.PI*p/s-Math.PI/2;return{x:T+X*Math.cos(i),y:T+X*Math.sin(i),agrees:p<n}}),r=[`Each of the ${t("panel_size")} judges scores your plea from 0 to ${t("max_score")}.`,`When at least ${t("quorum")} agree on a score, the oracle signs it and sends it back. Your plea is approved if that score is at least your need, and denied if not.`,`With fewer in agreement there is no verdict: after ${t("pending_expiry")} anyone may close the plea, the fee is spent, and you may plead again at once.`],l=`A ring of ${t("panel_size")} seats, the Cabal. ${t("quorum")} seats are filled and ticked: they agree on the score, the least agreement that makes a verdict. The other ${s-n} are dashed: another answer, or none. `+r.join(" ");return e.jsx(I,{title:`${t("panel_size")} judges, and ${t("quorum")} must agree`,alt:l,children:e.jsxs("div",{className:"dg-ring",children:[e.jsxs("svg",{className:"dg-ring__svg",viewBox:"0 0 300 300","aria-hidden":"true",children:[e.jsx("circle",{cx:T,cy:T,r:X,style:{fill:"none",stroke:"var(--line-soft)",strokeWidth:2}}),o.map((c,p)=>e.jsx(J,{...c},p)),e.jsx("text",{x:T,y:T-8,textAnchor:"middle",style:{fill:"var(--ink)",fontFamily:"var(--font-display)",fontStretch:"125%",fontWeight:800,fontSize:64},children:t("quorum")}),e.jsxs("text",{x:T,y:T+22,textAnchor:"middle",style:{fill:"var(--ink)",fontFamily:"var(--font-body)",fontWeight:700,fontSize:17},children:["of ",t("panel_size")," must agree"]})]}),e.jsxs("div",{className:"dg-key",children:[e.jsxs("p",{className:"dg-key__row",children:[e.jsx("svg",{viewBox:"0 0 32 32","aria-hidden":"true",children:e.jsx(J,{x:16,y:16,agrees:!0})}),e.jsx("span",{children:"Agrees on the score"})]}),e.jsxs("p",{className:"dg-key__row",children:[e.jsx("svg",{viewBox:"0 0 32 32","aria-hidden":"true",children:e.jsx(J,{x:16,y:16,agrees:!1})}),e.jsx("span",{children:"Another answer, or none"})]}),r.map(c=>e.jsx("p",{children:c},c))]})]})})}const Wn=Object.assign({"../../../docs/01-start-here.md":et,"../../../docs/02-buying.md":tt,"../../../docs/03-plead.md":at,"../../../docs/04-your-bar.md":st,"../../../docs/05-judges.md":nt,"../../../docs/06-appeals.md":ot,"../../../docs/07-letters.md":rt,"../../../docs/08-auto-sell.md":lt,"../../../docs/09-objection.md":it,"../../../docs/10-seasons.md":ct,"../../../docs/11-fees.md":ht,"../../../docs/12-pool.md":dt,"../../../docs/13-dead-man.md":ut,"../../../docs/14-keepers.md":pt,"../../../docs/15-contracts.md":mt,"../../../docs/16-audits.md":ft,"../../../docs/17-risks.md":wt,"../../../docs/18-glossary.md":_t}),Yn=Object.fromEntries(Object.entries(Object.assign({"./diagrams/appeal-window.tsx":$n,"./diagrams/fee-bar.tsx":Mn,"./diagrams/launch-fee.tsx":On,"./diagrams/letter-path.tsx":Gn,"./diagrams/loop.tsx":Hn,"./diagrams/need.tsx":Rn,"./diagrams/plea-states.tsx":Bn,"./diagrams/ring.tsx":Fn})).map(([a,t])=>[a.replace(/^.*\/|\.tsx$/g,""),t])),Le=a=>se($,a),Ie=D.map(a=>{const t=Wn[`../../../docs/${Se(a)}`]??`# ${a.title}
`;return{...a,blocks:Z(t,Le).blocks}}),zn=Ve(Ie,Le);function Jn({slug:a,heading:t}){const{statics:s,s:n}=Ce(),o=s??n?.constants,r=x.useCallback(f=>se($,f,o),[o]),l=x.useMemo(()=>Pe(o),[o]),c=$e(a),p=c&&Ie.find(f=>f.slug===c.slug);x.useEffect(()=>{if(!t)return;const f=document.getElementById(Q(t));f&&(f.scrollIntoView(),f.focus({preventScroll:!0}))},[c?.slug,t]);const i=x.useMemo(()=>p?ze(p.blocks,r):[],[p,r]),{prev:u,next:m}=Me(c?.slug||"");return e.jsx(Dn,{value:l,children:e.jsxs("div",{className:"docs",children:[e.jsx(Un,{current:c?.slug}),e.jsxs("article",{className:"docs__page",children:[p?e.jsx("div",{className:"docs-body",children:e.jsx(Ze,{tree:p.blocks,ctx:{slug:p.slug,num:r,diagrams:Yn}})}):e.jsxs("div",{className:"stack stack--lg",children:[e.jsx(Oe,{title:"Page not found"}),e.jsx(Ge,{title:`No docs page at #/docs/${a}`,action:{href:"#/docs",label:"Start here"},children:"Pick a page from the list, or search the docs."})]}),p&&e.jsxs("nav",{className:"docs-pager","aria-label":"Previous and next page",children:[u&&e.jsxs("a",{className:"docs-pager__link",href:S(u.slug),rel:"prev",children:[e.jsx("span",{className:"label",children:"Previous"}),e.jsxs("span",{className:"docs-pager__title",children:[e.jsx("span",{className:"docs-pager__back",children:e.jsx(A,{name:"arrow-right"})}),u.title]})]}),m&&e.jsxs("a",{className:"docs-pager__link docs-pager__link--next",href:S(m.slug),rel:"next",children:[e.jsx("span",{className:"label",children:"Next"}),e.jsxs("span",{className:"docs-pager__title",children:[m.title,e.jsx(A,{name:"arrow-right"})]})]})]})]}),p&&i.length>0&&e.jsxs("nav",{className:"docs__toc","aria-label":"On this page",children:[e.jsx("p",{className:"label",children:"On this page"}),e.jsx("ul",{children:i.map(f=>e.jsx("li",{className:f.level===3?"docs__toc-sub":void 0,children:e.jsx("a",{href:S(p.slug,f.id),"aria-current":f.id===t?"location":void 0,children:f.text})},f.id))})]})]})})}function Un({current:a}){const[t,s]=x.useState(!1),n=x.useRef(null);x.useEffect(()=>s(!1),[a]);const o=D.findIndex(l=>l.slug===a),r=l=>{l.key==="Escape"&&t&&document.getElementById("docs-pages")?.contains(document.activeElement)?(s(!1),n.current?.focus()):l.key==="Escape"&&t&&document.activeElement===n.current&&s(!1)};return e.jsxs("div",{className:"docs__side",onKeyDown:r,children:[e.jsx(qn,{}),e.jsxs("button",{ref:n,type:"button",className:"docs__toggle","aria-expanded":t,"aria-controls":"docs-pages",onClick:()=>s(!t),children:[e.jsx(A,{name:t?"x":"list"}),e.jsxs("span",{className:"docs__toggle-text",children:[e.jsx("span",{className:"strong",children:"Docs pages"}),o>=0&&e.jsxs("span",{className:"meta",children:[o+1," of ",D.length,": ",D[o].title]})]})]}),e.jsx("nav",{id:"docs-pages",className:`docs-nav${t?" is-open":""}`,"aria-label":"Docs pages",children:e.jsx("ol",{children:D.map(l=>e.jsx("li",{children:e.jsx("a",{href:S(l.slug),"aria-current":l.slug===a?"page":void 0,children:l.title})},l.slug))})})]})}function qn(){const[a,t]=x.useState(""),s=x.useRef(null),n=x.useRef(null),o=8,r=x.useMemo(()=>Xe(zn,a,1/0),[a]),l=r.slice(0,o),c=ne(a).join("").length>=2;x.useEffect(()=>{const u=()=>t("");return window.addEventListener("hashchange",u),()=>window.removeEventListener("hashchange",u)},[]);const p=()=>[...n.current?.querySelectorAll("a")||[]],i=(u,m)=>{const f=p();u.key==="ArrowDown"&&f.length?(u.preventDefault(),f[Math.min(m+1,f.length-1)].focus()):u.key==="ArrowUp"?(u.preventDefault(),m<=0?s.current?.focus():f[m-1].focus()):u.key==="Escape"&&a&&(u.preventDefault(),u.stopPropagation(),t(""),s.current?.focus())};return e.jsxs("form",{role:"search",className:"docs-search",onSubmit:u=>{u.preventDefault(),l[0]&&(location.hash=l[0].href)},children:[e.jsx("label",{className:"sr-only",htmlFor:"docs-q",children:"Search the docs"}),e.jsxs("div",{className:"input input--text",children:[e.jsx(A,{name:"magnifying-glass"}),e.jsx("input",{ref:s,id:"docs-q",className:"input__control",type:"search",placeholder:"Search the docs",autoComplete:"off",spellCheck:!1,value:a,"aria-describedby":"docs-q-count","aria-controls":c&&l.length?"docs-results":void 0,onChange:u=>t(u.target.value),onKeyDown:u=>i(u,-1)})]}),e.jsx("p",{id:"docs-q-count",className:"sr-only","aria-live":"polite",children:c?`${r.length||"No"} result${r.length===1?"":"s"}${r.length>o?`, the first ${o} shown`:""}`:""}),c&&(l.length?e.jsxs("ul",{ref:n,id:"docs-results",className:"docs-results","aria-label":"Search results",children:[l.map((u,m)=>e.jsx("li",{children:e.jsxs("a",{href:u.href,onKeyDown:f=>i(f,m),children:[e.jsx("span",{className:"docs-results__where",children:e.jsx(Vn,{entry:u.entry})}),u.snippet&&e.jsx("span",{className:"docs-results__text",children:e.jsx(Kn,{text:u.snippet,query:a})})]})},u.href)),r.length>o&&e.jsxs("li",{className:"small text-2 docs-results__more","aria-hidden":"true",children:[r.length," sections match; the first ",o," are shown. Add a word to narrow it."]})]}):e.jsxs("p",{className:"small text-2 docs-results__none",children:["No section mentions “",a.trim(),"”."]}))]})}const Vn=({entry:a})=>e.jsxs(e.Fragment,{children:[a.page,a.heading&&e.jsxs(e.Fragment,{children:[e.jsx("span",{"aria-hidden":"true",children:" › "}),e.jsx("span",{className:"sr-only",children:", "}),a.heading]})]});function Kn({text:a,query:t}){const s=ne(t).filter(o=>o.length>1);if(!s.length)return e.jsx(e.Fragment,{children:a});const n=new RegExp(`(${s.map(o=>o.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})`,"gi");return e.jsx(e.Fragment,{children:a.split(n).map((o,r)=>r%2?e.jsx("mark",{children:o},r):o)})}export{Jn as default};
