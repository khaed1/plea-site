import{s as ye,j as a,N as ve,h as W,I as E,d as L,r as x,C as ne,D as j,f as ke,u as Ee,p as Pe,a as Ae,T as je,E as Le}from"./index-D6_T8F--.js";const Ie=e=>e.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"section",Te=/[\\`*_{}\[\]()#+\-.!|>:~<]/;function S(e,t=[]){const o=[],n=l=>{const r=o[o.length-1];r?.t==="text"?r.v+=l:l&&o.push({t:"text",v:l})};let s=0;for(;s<e.length;){const l=e[s];if(l==="\\"&&s+1<e.length&&Te.test(e[s+1])){n(e[s+1]),s+=2;continue}if(l==="{"&&e.startsWith("{{",s)){const r=e.indexOf("}}",s+2);if(r<0){t.push(`an unclosed placeholder: "${e.slice(s,s+24)}"`),n(e.slice(s));break}o.push({t:"num",key:e.slice(s+2,r).trim()}),s=r+2;continue}if(l==="`"){let r=1;for(;e[s+r]==="`";)r++;const c="`".repeat(r),d=e.indexOf(c,s+r);if(d>0){let i=e.slice(s+r,d);i.startsWith(" ")&&i.endsWith(" ")&&i.trim()&&(i=i.slice(1,-1)),o.push({t:"code",c:oe(i,t)}),s=d+r;continue}n(c),s+=r;continue}if(l==="*"&&e[s+1]==="*"){const r=Q(e,s+2,"**");if(r>0){o.push({t:"strong",c:S(e.slice(s+2,r),t)}),s=r+2;continue}}if((l==="*"||l==="_")&&e[s+1]!==l&&Ce(e,s)){const r=Q(e,s+1,l);if(r>0){o.push({t:"em",c:S(e.slice(s+1,r),t)}),s=r+1;continue}}if(l==="["){const r=Ne(e,s);if(r>0&&e[r+1]==="("){const c=e.indexOf(")",r+2);if(c>0){o.push({t:"link",href:e.slice(r+2,c).trim(),c:S(e.slice(s+1,r),t)}),s=c+1;continue}}}n(l),s++}return o}function oe(e,t){const o=[];let n=0;for(;n<e.length;){const s=e.indexOf("{{",n);if(s<0)break;const l=e.indexOf("}}",s+2);if(l<0){t.push(`an unclosed placeholder: "${e.slice(s,s+24)}"`);break}s>n&&o.push({t:"text",v:e.slice(n,s)}),o.push({t:"num",key:e.slice(s+2,l).trim()}),n=l+2}return n<e.length&&o.push({t:"text",v:e.slice(n)}),o}const se=e=>e===void 0||/\s/.test(e),le=e=>!!e&&/[\p{L}\p{N}]/u.test(e);function Ce(e,t){return se(e[t+1])?!1:e[t]==="*"||!le(e[t-1])}function Q(e,t,o){let n=t;for(;n<e.length;){if(e[n]==="\\"){n+=2;continue}if(e[n]==="`"){const s=e.indexOf("`",n+1);if(s>0){n=s+1;continue}}if(e.startsWith(o,n)&&n>t&&!se(e[n-1])){if(o==="*"&&e[n+1]==="*"){n+=2;continue}if(o==="_"&&le(e[n+1])){n++;continue}return n}n++}return-1}function Ne(e,t){let o=0;for(let n=t;n<e.length;n++){if(e[n]==="\\"){n++;continue}if(e[n]==="["&&o++,e[n]==="]"&&--o===0)return n}return-1}const re=/^```\s*([\w-]*)\s*$/,ie=/^(#{1,6})\s+(.*?)\s*#*\s*$/,ce=/^(?:-{3,}|\*{3,}|_{3,})\s*$/,M=/^:::\s*(.*?)\s*$/,$=/^>\s?/,A=/^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/,De=/^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/,he=(e,t)=>/^\s*\|/.test(e[t])&&t+1<e.length&&De.test(e[t+1].trim()),ue=(e,t)=>{const o=e[t];return re.test(o)||ie.test(o)||ce.test(o)||M.test(o)||$.test(o)||he(e,t)||A.test(o)&&A.exec(o)[1].length<2};function H(e){let t=e.trim();t.startsWith("|")&&(t=t.slice(1)),t.endsWith("|")&&!t.endsWith("\\|")&&(t=t.slice(0,-1));const o=[];let n="",s=!1;for(let l=0;l<t.length;l++)t[l]==="\\"&&t[l+1]==="|"?(n+="|",l++):t[l]==="`"?(s=!s,n+="`"):t[l]==="|"&&!s?(o.push(n.trim()),n=""):n+=t[l];return o.push(n.trim()),o}function U(e,t=s=>s,o=0,n=new Map){const s=e.replace(/\r\n?/g,`
`).replace(/<!--[\s\S]*?-->/g,u=>u.replace(/[^\n]/g,"")).split(`
`),l=[],r=[],c=(u,p)=>r.push(`line ${o+u+1}: ${p}`),d=(u,p)=>{const f=[],w=S(u,f);for(const h of f)c(p,h);return w};let i=0;for(;i<s.length;){const u=s[i];if(!u.trim()){i++;continue}let p;if(p=re.exec(u)){const h=i++,b=[];for(;i<s.length&&!/^```\s*$/.test(s[i]);)b.push(s[i++]);i>=s.length&&c(h,"a code block (```) is never closed"),i++;const m=[];l.push({t:"pre",lang:p[1],c:oe(b.join(`
`),m)});for(const g of m)c(h,g);continue}if(p=ie.exec(u)){const h=p[1].length;let b=p[2],m="";const g=/\s*\{#([a-z0-9-]+)\}\s*$/.exec(b);g&&(m=g[1],b=b.slice(0,g.index)),h>4&&c(i,`a level-${h} heading: the docs use # to #### only`);const _=d(b,i);m||=Ie(k(_,t));const P=n.get(m)||0;n.set(m,P+1),P&&(m=`${m}-${P+1}`),l.push({t:"h",level:Math.min(h,4),id:m,c:_}),i++;continue}if(ce.test(u)){l.push({t:"hr"}),i++;continue}if(p=M.exec(u)){const[h,...b]=p[1].split(/\s+/),m=p[1].slice(h.length).trim();if(h==="diagram"){(!/^[a-z0-9-]+$/.test(m)||b.length!==1)&&c(i,`"::: diagram" needs one name in a-z, 0-9 and -: "${u.trim()}"`),l.push({t:"diagram",name:m,line:o+i+1}),i++;continue}if(h==="note"||h==="warn"||h==="builders"){const g=i++,_=[];for(;i<s.length&&!/^:::\s*$/.test(s[i]);)M.exec(s[i])?.[1]&&!/^diagram\b/.test(M.exec(s[i])[1])&&c(i,"a callout inside a callout: close the first with ::: before opening another"),_.push(s[i++]);i>=s.length&&c(g,`"::: ${h}" is never closed with a line of :::`),i++;const P=U(_.join(`
`),t,o+g+1,n);r.push(...P.errors),l.push({t:"callout",kind:h,title:m?d(m,g):void 0,c:P.blocks});continue}c(i,h?`an unknown block "::: ${h}" (use diagram, note, warn or builders)`:"a ::: that closes nothing"),i++;continue}if($.test(u)){const h=i,b=[];for(;i<s.length&&$.test(s[i]);)b.push(s[i++].replace($,""));const m=U(b.join(`
`),t,o+h,n);r.push(...m.errors),l.push({t:"quote",c:m.blocks});continue}if(he(s,i)){const h=H(u),b=H(s[i+1]).map(_=>_.endsWith(":")?_.startsWith(":")?"c":"r":"l");b.length!==h.length&&c(i,"the table's --- line has a different number of columns from its head");const m=i;i+=2;const g=[];for(;i<s.length&&/^\s*\|/.test(s[i]);){const _=H(s[i]);_.length!==h.length&&c(i,`a table row with ${_.length} cells under a head of ${h.length}`),g.push(_.map(P=>d(P,i))),i++}l.push({t:"table",align:b,head:h.map(_=>d(_,m)),rows:g});continue}if((p=A.exec(u))&&p[1].length<2){const h=Se(s,i,d,c);l.push(h.list),i=h.next;continue}const f=i,w=[];for(;i<s.length&&s[i].trim()&&(i===f||!ue(s,i));)w.push(s[i++].trim());l.push({t:"p",c:d(w.join(" "),f)})}return{blocks:l,errors:r}}const C=e=>/\d/.test(e);function Se(e,t,o,n){const s=A.exec(e[t]),l={t:"list",ordered:C(s[2]),start:parseInt(s[2])||1,items:[]};let r=t,c=-1,d;const i=[],u=()=>{d&&i.push(d),d=void 0};for(;r<e.length;){const p=e[r];if(!p.trim()){let w=r+1;for(;w<e.length&&!e[w].trim();)w++;const h=w<e.length?A.exec(e[w]):null;if(h&&(h[1].length>=2?l.items.length>0:C(h[2])===l.ordered)){r=w;continue}break}const f=A.exec(p);if(f&&f[1].length<2){if(C(f[2])!==l.ordered)break;u();const w={c:[]};l.items.push(w),d={item:w,parts:[f[3]],line:r},c=-1,r++;continue}if(f&&l.items.length){const w=l.items[l.items.length-1];c<0&&(c=f[1].length),f[1].length>c+1&&n(r,"a list nested more than one level: the docs nest lists one level only"),w.sub||(w.sub={t:"list",ordered:C(f[2]),start:parseInt(f[2])||1,items:[]}),u();const h={c:[]};w.sub.items.push(h),d={item:h,parts:[f[3]],line:r},r++;continue}if(f||ue(e,r))break;d&&d.parts.push(p.trim()),r++}u();for(const p of i)p.item.c=o(p.parts.join(" "),p.line);return{list:l,next:r}}function k(e,t=o=>o){return e.map(o=>o.t==="text"?o.v:o.t==="num"?t(o.key)??o.key:k(o.c,t)).join("")}const Me=(e,t)=>e.filter(o=>o.t==="h"&&(o.level===2||o.level===3)).map(o=>({id:o.id,level:o.level,text:k(o.c,t)}));function de(e){const t=/^(?:\.\/)?(\d\d)-([a-z0-9-]+)\.md(?:#([a-z0-9-]+))?$/.exec(e);return t?`#/docs/${t[2]}${t[3]?`/${t[3]}`:""}`:e}function G(e,t=18){const o=e<0n,n=o?-e:e,s=10n**BigInt(t),l=(n/s).toLocaleString("en-US"),r=(n%s).toString().padStart(t,"0").replace(/0+$/,"");return(o?"−":"")+l+(r?"."+r:"")}const $e=e=>G(e,2);function O(e,t){let o;try{if(t==null||t==="")return;o=BigInt(t)}catch{return}switch(e){case"int":return o.toLocaleString("en-US");case"imd":return`${G(o)} IMD`;case"plea":return`${G(o)} PLEA`;case"duration":return ye(Number(o));case"bps":return`${$e(o)}%`;case"multiplier":return`×${G(o,4)}`;default:return}}const J=new Set;function K(e,t,o){const n=t==="_meta"?void 0:e[t];if(!n)return;const s=n.chain?o?.[n.chain]:void 0;if(s==null)return n.text;let l=!0;try{l=n.value!==null&&BigInt(s)===BigInt(n.value)}catch{l=!1}return!l&&!J.has(t)&&(J.add(t),console.warn(`Docs: ${n.chain} on chain is ${String(s)}, numbers.json's ${t} says ${n.value}; the page shows the chain's.`)),n.format==="text"?n.text:O(n.format,s)??n.text}function Ge(e,t,o){const n=t==="_meta"?void 0:e[t];if(!n)return;const s=n.chain?o?.[n.chain]:void 0;try{return s!=null?BigInt(s):n.value===null?void 0:BigInt(n.value)}catch{return}}const pe=(e,t)=>e.items.map(o=>k(o.c,t)+(o.sub?" "+pe(o.sub,t):"")).join(" ");function z(e,t){switch(e.t){case"p":case"pre":return k(e.c,t);case"list":return pe(e,t);case"table":return[e.head,...e.rows].map(o=>o.map(n=>k(n,t)).join(" ")).join(" ");case"quote":return e.c.map(o=>z(o,t)).join(" ");case"callout":return[e.kind==="builders"?"For builders":"",e.title?k(e.title,t):"",...e.c.map(o=>z(o,t))].join(" ");default:return""}}function Oe(e,t){const o=[];for(const n of e){let s={slug:n.slug,page:n.title,heading:"",id:"",text:"",order:o.length};const l=[],r=()=>{s.text=l.join(" ").replace(/\s+/g," ").trim(),(s.heading||s.text)&&o.push({...s,order:o.length}),l.length=0};for(const c of n.blocks)if(!(c.t==="h"&&c.level===1)){if(c.t==="h"){r(),s={slug:n.slug,page:n.title,heading:k(c.c,t),id:c.id,text:"",order:0};continue}l.push(z(c,t))}r()}return o}const I=e=>e.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,""),X=e=>I(e).split(/[^\p{L}\p{N}%.×-]+/u).filter(t=>t.length>0),He=(e,t)=>{let o=0,n=e.indexOf(t);for(;n>=0&&o<5;)o++,n=e.indexOf(t,n+t.length);return o},fe=e=>e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),Z=(e,t)=>new RegExp(`(^|[^\\p{L}\\p{N}])${fe(t)}`,"u").test(e),ee=(e,t)=>new RegExp(`(^|[^\\p{L}\\p{N}])${fe(t)}($|[^\\p{L}\\p{N}])`,"u").test(e);function Be(e,t,o=8){const n=X(t);if(n.join("").length<2)return[];const s=n.join(" "),l=[];for(const r of e){const c=I(r.heading),d=I(r.page),i=I(r.text);if(!n.every(p=>c.includes(p)||d.includes(p)||i.includes(p)))continue;let u=n.length>1&&c.includes(s)?20:0;for(const p of n)u+=(Z(c,p)?10:0)+(Z(d,p)?5:0)+He(i,p)+(ee(c,p)||ee(i,p)?2:0);l.push({e:r,score:u})}return l.sort((r,c)=>c.score-r.score||r.e.order-c.e.order),l.slice(0,o).map(({e:r})=>({entry:r,href:de(`#/docs/${r.slug}${r.id?`/${r.id}`:""}`),snippet:Fe(r.text,n)}))}function Fe(e,t,o=120){const n=I(e),s=Math.min(...t.map(c=>n.indexOf(c)).filter(c=>c>=0),1/0);if(e.length<=o)return e;let l=s===1/0?0:Math.max(0,s-Math.floor(o/3));l>0&&(l=e.indexOf(" ",l)+1||l);let r=Math.min(e.length,l+o);return r<e.length&&(r=e.lastIndexOf(" ",r)>l?e.lastIndexOf(" ",r):r),(l>0?"…":"")+e.slice(l,r)+(r<e.length?"…":"")}const Re={note:{kind:"info",icon:"info",title:void 0},warn:{kind:"warn",icon:"warning",title:void 0},builders:{kind:"builders",icon:"seal-check",title:"For builders"}};function Y(e,t){const o=t.num(e);if(o===void 0)throw Error(`The docs name an unknown number {{${e}}}.`);return o}function v(e,t,o="i"){return e.map((n,s)=>{const l=`${o}.${s}`;switch(n.t){case"text":return n.v;case"num":{const r=Y(n.key,t);return r.split(" ").length<=3?a.jsx("span",{className:"nowrap",children:r},l):r}case"strong":return a.jsx("strong",{children:v(n.c,t,l)},l);case"em":return a.jsx("em",{children:v(n.c,t,l)},l);case"code":return a.jsx("code",{children:v(n.c,t,l)},l);case"link":{const r=de(n.href);return/^https?:\/\//.test(r)?a.jsxs("a",{href:r,target:"_blank",rel:"noreferrer",className:"docs-ext",children:[v(n.c,t,l),a.jsx(E,{name:"arrow-square-out"}),a.jsx("span",{className:"sr-only",children:" (opens in a new tab)"})]},l):a.jsx("a",{href:r,children:v(n.c,t,l)},l)}}})}function me(e,t,o){const n=e.items.map((s,l)=>a.jsxs("li",{children:[v(s.c,t,`${o}.${l}`),s.sub&&me(s.sub,t,`${o}.${l}.s`)]},l));return e.ordered?a.jsx("ol",{start:e.start===1?void 0:e.start,children:n},o):a.jsx("ul",{children:n},o)}const te={l:void 0,c:"c",r:"r"};function q(e,t,o="b"){return e.map((n,s)=>{const l=`${o}.${s}`;switch(n.t){case"h":{const r=v(n.c,t,l);if(n.level===1)return a.jsx("div",{className:"page-title",children:a.jsx("h1",{children:r})},l);if(n.level===4)return a.jsx("h4",{id:W(n.id),tabIndex:-1,children:r},l);const c=n.level===2?"h2":"h3",d=k(n.c,i=>Y(i,t));return a.jsxs("div",{className:`docs-h docs-h--${n.level}`,children:[a.jsx(c,{id:W(n.id),tabIndex:-1,children:r}),a.jsx("a",{className:"docs-anchor",href:L(t.slug,n.id),"aria-label":`Link to ${d}`,children:a.jsx(E,{name:"link"})})]},l)}case"p":return a.jsx("p",{children:v(n.c,t,l)},l);case"list":return me(n,t,l);case"table":{const r=n.head.map(c=>k(c,d=>Y(d,t))).join(", ");return a.jsx("div",{className:"table-wrap docs-table",role:"region","aria-label":`Table: ${r}`,tabIndex:0,children:a.jsxs("table",{className:"table",children:[a.jsx("thead",{children:a.jsx("tr",{children:n.head.map((c,d)=>a.jsx("th",{scope:"col",className:te[n.align[d]||"l"],children:v(c,t,`${l}.h${d}`)},d))})}),a.jsx("tbody",{children:n.rows.map((c,d)=>a.jsx("tr",{children:c.map((i,u)=>a.jsx("td",{className:te[n.align[u]||"l"],children:v(i,t,`${l}.${d}.${u}`)},u))},d))})]})},l)}case"quote":return a.jsx("blockquote",{className:"docs-quote stack stack--sm",children:q(n.c,t,l)},l);case"pre":return a.jsx("pre",{className:"docs-code",children:a.jsx("code",{children:v(n.c,t,l)})},l);case"hr":return a.jsx("hr",{},l);case"diagram":{const r=t.diagrams[n.name];if(!r)throw Error(`The docs name an unknown diagram "${n.name}".`);return a.jsx("div",{className:"docs-diagram",children:a.jsx(r,{})},l)}case"callout":{const r=Re[n.kind],c=n.title?v(n.title,t,`${l}.t`):r.title;return a.jsx("div",{className:`docs-callout docs-callout--${n.kind}`,children:a.jsx(ve,{kind:r.kind,icon:r.icon,title:c,children:a.jsx("div",{className:"stack stack--sm",children:q(n.c,t,l)})})},l)}}})}function We({tree:e,ctx:t}){return a.jsx(a.Fragment,{children:q(e,t)})}const Ue=`# Start here

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
`,ze=`# Buying

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
`,Ye=`# Selling: plead

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
`,qe=`# Your bar

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
`,Ke=`# The judges

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
`,Xe=`# Appeals

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
`,Ve=`# Letters

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
`,Qe=`# The auto-sell box

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
`,Je=`# Objection!

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
`,Ze=`# Seasons and prizes

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
`,et=`# Fees

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
`,tt=`# The pool: cap, burn and the buy wall

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
`,at=`# The dead-man

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
`,nt=`# Keepers

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
`,ot=`# Contracts and owner

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
`,st=`# Audits

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
`,lt=`# Risks and FAQ

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
`,rt=`# Glossary

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
`,it={deployment:"PLEA launch #2647 on Ethereum (block 26,293,890)",source:"khaed1/plea, the branch IMD deployed for the Ethereum launch, @ 42e0f855875786a953e945e528e9d7f2724a5352 (its src/; every file:line below is there)",status:"Checked 2026-10-29 by the numbers agent: every entry re-read in src/ at 42e0f85 and launch.json; every chain-bound value read from the launched contracts (read-only calls); trading not open yet (PleaHook.seeded false, PleaLaunch.opened false), so seed-time values (the cap's daily allowance) are computed",format:"key -> {text: words the docs print, value: raw on-chain value as a decimal string or null, chain: the site's constant key con(s, 'Contract.NAME') or null, format: int|imd|plea|duration|bps|multiplier|text, source: file:line, what: one line}. Whenever value is set and format is not text, text is format(value) exactly (the unit tests check it)"},ct={text:"69",value:"69",chain:"CabalGate.PASS_MARK",format:"int",source:"src/CabalGate.sol:122; need = PASS_MARK - fact score :433",what:"need = pass mark - fact score; a plea is approved when the judges' score is at least its need (:554)"},ht={text:"45",value:"45",chain:"CabalGate.MAX_PLEA_SCORE",format:"int",source:"src/CabalGate.sol:123; CannotPass :433-434; ScoreOutOfRange :551-552",what:"the judges' scale is 0 to 45; a plea whose need is above 45 is refused (CannotPass)"},ut={text:"30",value:"30",chain:"CabalGate.PANEL_SIZE",format:"int",source:"src/CabalGate.sol:124; checked :545-550",what:"judges on a panel (the Cabal)"},dt={text:"17",value:"17",chain:"CabalGate.QUORUM",format:"int",source:"src/CabalGate.sol:125; at least 17 agreed :545-550",what:"judges who must agree for a verdict"},pt={text:"0.5 IMD",value:"500000000000000000",chain:"CabalGate.ORACLE_FEE",format:"imd",source:"src/CabalGate.sol:110; paid to IMD's Intake in _ask :452-463",what:"a plea's or an appeal's oracle fee, in IMD; spent whatever happens (approved, denied, no verdict)"},ft={text:"0.35 IMD",value:"350000000000000000",chain:"CabalGate.APPEAL_POOL_SHARE",format:"imd",source:"src/CabalGate.sol:111; paid to the buy wall by _payAppeal :396-401 (PleaHook.fundWall)",what:"an appeal's extra payment, to the buy wall"},mt={text:"0.85 IMD",value:"850000000000000000",chain:null,format:"imd",source:"src/CabalGate.sol:110-111 (0.5 + 0.35), appeal :347-350",what:"what an appeal costs in IMD: the oracle fee plus the wall share"},wt={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:377-378, :382 (NotDenied, AlreadyAppealed); an expired appeal frees its slot :508",what:"appeals per denied plea; an appeal itself cannot be appealed; an appeal that got no verdict may be sent again inside the window, paying again"},bt={text:"7 minutes",value:"420",chain:"CabalGate.EXECUTE_WINDOW",format:"duration",source:"src/CabalGate.sol:112; WindowLapsed :620; lapse :492-496",what:"time to sell after an approval; after it the approval lapses"},xt={text:"4 hours",value:"14400",chain:"CabalGate.COOLDOWN",format:"duration",source:"src/CabalGate.sol:113; _requireCanPlead :469-476, _cooldown :479-482; a lapse is timed from the approval :494",what:"no new plea for this long after a sale, a denial or a lapsed approval (a lapse counts from the approval's time); none after a plea that got no verdict"},_t={text:"4 hours",value:"14400",chain:"CabalGate.COOLDOWN",format:"duration",source:"src/CabalGate.sol:379 (AppealClosed)",what:"an appeal must be sent within this long after the denial"},gt={text:"20 minutes",value:"1200",chain:"CabalGate.PENDING_EXPIRY",format:"duration",source:"src/CabalGate.sol:114; expire :514-521; a later verdict is refused :540-542",what:"a plea with no verdict after this (or once IMD's Intake closed it without one) can be closed by anyone: no cooldown, the fee is spent"},yt={text:"280",value:"280",chain:"CabalGate.MAX_PLEA_BYTES",format:"int",source:"src/CabalGate.sol:115; _validateText :824-865",what:"a plea's text, 1 to 280 bytes of UTF-8 (the number alone: a page writes the word bytes after it)"},vt={text:"2,500,000 PLEA",value:"2500000000000000000000000",chain:"CabalGate.MAX_SELL",format:"plea",source:"src/CabalGate.sol:116; _checkAmount :525-530",what:"most PLEA one plea may sell"},kt={text:"50%",value:"5000",chain:"CabalGate.MAX_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:117; :526",what:"most of your balance one plea may sell"},Et={text:"1%",value:"100",chain:"CabalGate.MIN_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:118-119; :527-529 (AmountTooSmall)",what:"least share of your balance a plea may sell (or 2,500,000 PLEA when 1% is more)"},Pt={text:"250,000,000 PLEA",value:"250000000000000000000000000",chain:null,format:"plea",source:"src/CabalGate.sol:523-528 (1% of 250,000,000 = MAX_SELL)",what:"above this balance the 1% minimum is capped at 2,500,000 PLEA, so the least and the most a plea may sell meet"},At={text:"33 hours",value:"118800",chain:"CabalGate.DEADMAN",format:"duration",source:"src/CabalGate.sol:147, :200-204; launch.json CabalGate argument 7 = 118800; reset only by a signed plea or appeal verdict :557",what:"the Cabal dies after this long without a signed verdict on a plea or an appeal, for good"},jt={text:"15 days",value:"1296000",chain:"Seasons.SEASON",format:"duration",source:"src/Seasons.sol:83,107 = CabalGate.SEASON (src/CabalGate.sol:146; launch.json CabalGate argument 6 = 1296000)",what:"one season; seasons run back to back from the moment trading opens"},Lt={text:"selling at most 20%: 16 points; at most 35%: 9; more: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:270 (share rounded up :260-264; an appeal takes the lesser of its share and the original's :266-268, :427-431)",what:"share-sold part of the fact score"},It={text:"20%",value:"2000",chain:null,format:"bps",source:"src/CabalGate.sol:270",what:"selling at most this share of your PLEA scores the top share points"},Tt={text:"35%",value:"3500",chain:null,format:"bps",source:"src/CabalGate.sol:270",what:"selling at most this share (and more than 20%) scores the middle share points"},Ct={text:"16",value:"16",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for selling at most 20% of your PLEA"},Nt={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for more than 20% and at most 35%"},Dt={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for more than 35%"},St={text:"held under a day: 0; a day: 1; 3 days: 2; 7 days: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:300-305; the time is the buy-weighted average of your buys (src/PleaHook.sol:731-739)",what:"holding-time part of the fact score"},Mt={text:"0",value:"0",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for PLEA held under a day"},$t={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least a day"},Gt={text:"2",value:"2",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least 3 days"},Ot={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least 7 days"},Ht={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:304 (held >= 1 days)",what:"days held for the first holding point (a page writes day or days after it)"},Bt={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:304 (held >= 3 days)",what:"days held for the second holding point"},Ft={text:"7",value:"7",chain:null,format:"int",source:"src/CabalGate.sol:304 (held >= 7 days)",what:"days held for the third and last holding point"},Rt={text:"at a loss: 13; gain at most 50%: 12; at most 200%: 10; at most 500%: 8; at most 1,000%: 6; more: 4",value:null,chain:null,format:"text",source:"src/CabalGate.sol:279-288 (the recorded PLEA at the latest hourly price vs the IMD the buys cost, fees included: src/PleaHook.sol:566, :738)",what:"profit part of the fact score"},Wt={text:"13",value:"13",chain:null,format:"int",source:"src/CabalGate.sol:283",what:"profit points at a loss"},Ut={text:"12",value:"12",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 50%"},zt={text:"10",value:"10",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 200%"},Yt={text:"8",value:"8",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 500%"},qt={text:"6",value:"6",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 1,000%"},Kt={text:"4",value:"4",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain above 1,000%"},Xt={text:"50%",value:"5000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g * 2 <= spent)",what:"first profit band edge"},Vt={text:"200%",value:"20000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 2)",what:"second profit band edge"},Qt={text:"500%",value:"50000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 5)",what:"third profit band edge"},Jt={text:"1,000%",value:"100000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 10)",what:"fourth profit band edge"},Zt={text:"PLEA no buy record covers (airdrop, prizes) counts as held since trading opened, at profit 9",value:null,chain:null,format:"text",source:"src/CabalGate.sol:274-278, :289-292 (PLEA-weighted mean of the record's points and the received points, rounded to the nearest point)",what:"received PLEA"},ea={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:291",what:"profit points for PLEA no buy record covers"},ta={text:"24-hour price up more than 2%: 9; within 2% (or no price 24 hours ago): 5; down more than 2%: 0",value:null,chain:null,format:"text",source:"src/CabalGate.sol:294-297; the hour checkpoints src/PleaHook.sol:294-309",what:"trend part of the fact score"},aa={text:"2%",value:"200",chain:null,format:"bps",source:"src/CabalGate.sol:296-297 (latest > ago * 102 / 100; latest * 100 >= ago * 98)",what:"how far the price must move in 24 hours to count as up or down"},na={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:296",what:"trend points when the price rose more than 2% in 24 hours"},oa={text:"5",value:"5",chain:null,format:"int",source:"src/CabalGate.sol:295, :297",what:"trend points within 2%, or when no price from 24 hours ago exists (the first day)"},sa={text:"0",value:"0",chain:null,format:"int",source:"src/CabalGate.sol:294-297",what:"trend points when the price fell more than 2%"},la={text:"1 hour",value:"3600",chain:null,format:"duration",source:"src/PleaHook.sol:278-309, :1057-1067; src/CabalGate.sol:247-248",what:"prices for the fact score are hourly checkpoints (the price before each hour's first trade), never the spot price"},ra={text:"48",value:"48",chain:null,format:"int",source:"src/PleaHook.sol:195-198, :300-308",what:"hours of checkpoints kept; the 24-hour price is the newest checkpoint at least 24 and at most 48 hours old"},ia={text:"41",value:"41",chain:null,format:"int",source:"16 + 3 + 13 + 9 (src/CabalGate.sol:270-297)",what:"highest fact score"},ca={text:"7",value:"7",chain:null,format:"int",source:"3 + 0 + 4 + 0 (src/CabalGate.sol:270-297)",what:"lowest fact score"},ha={text:"28",value:"28",chain:null,format:"int",source:"69 - 41",what:"lowest possible need"},ua={text:"24",value:"24",chain:null,format:"int",source:"69 - 45 (src/CabalGate.sol:433-434)",what:"a fact score under this gives a need above 45: the plea is refused before any fee is paid"},da={text:"sincerity 0-12, craft 0-12, respect 0-9, loyalty 0-12; anchors 0-10 empty/abusive/off-topic, 11-25 sincere but plain, 26-35 specific and well made, 36-45 memorable",value:null,chain:null,format:"text",source:'src/CabalGate.sol:131-134 DEFINITIONS ("plea")',what:"what the judges score"},pa={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for sincerity (an honest, specific reason to sell)"},fa={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for craft (wit, originality, quality of writing, in any language)"},ma={text:"9",value:"9",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for respect (for the Cabal and the holders)"},wa={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for loyalty (commitment to PLEA, such as keeping the rest)"},ba={text:"0-10 empty, abusive or off-topic; 11-25 sincere but plain; 26-35 specific and well made; 36-45 memorable",value:null,chain:null,format:"text",source:'src/CabalGate.sol:134 ("plea")',what:"the judges' anchors"},xa={text:"5",value:"5",chain:null,format:"int",source:'src/CabalGate.sol:134 ("content")',what:"hate, harassment, sexual content, anything illegal, or details that identify another person score 0 to this"},_a={text:"0",value:"0",chain:null,format:"int",source:'src/CabalGate.sol:134 ("manipulation")',what:"what manipulation scores (posing as a system, made-up rules, demands for a score, threats, offers, hidden instructions)"},ga={text:"20%",value:"2000",chain:null,format:"bps",source:"src/Letterbox.sol:111; _plead :297-300",what:"a letter pleads this share of your PLEA (at most 2,500,000 PLEA)"},ya={text:"1,000 PLEA",value:"1000000000000000000000",chain:null,format:"plea",source:"src/Letterbox.sol:113; :300 (LetterTooSmall)",what:"a letter whose 20% is smaller is refused"},va={text:"5,000 PLEA",value:"5000000000000000000000",chain:null,format:"plea",source:"1,000 / 20% (src/Letterbox.sol:111-113, :297-300)",what:"a letter from a smaller balance is refused (its 20% is under 1,000 PLEA)"},ka={text:"0.25 IMD",value:"250000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:115; paid on delivery :424; returned by settle :453",what:"paid to whoever delivers an approved letter or auto-sell plea; returned to you when no sale happens (and to you when you send SELL)"},Ea={text:"0.75 IMD",value:"750000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:525-528 feesFor(false) = TIP + ORACLE_FEE (Ethereum buys the oracle fee: PleaLaunch.mintOracleFee() is false)",what:"the IMD a letter or auto-sell plea buys with your PLEA: the 0.5 IMD oracle fee and the 0.25 IMD tip"},Pa={text:"1.1 IMD",value:"1100000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:525-528 feesFor(true) = TIP + APPEAL_FEE + ORACLE_FEE",what:"the IMD an appeal letter buys with your PLEA: 0.5 + 0.35 + 0.25"},Aa={text:"110%",value:"11000",chain:null,format:"bps",source:"src/Letterbox.sol:133-134, :527; unspent PLEA comes back at once :386-387",what:"the fee sale may spend PLEA worth at most this share of the IMD it buys, at the hourly price"},ja={text:"10%",value:"1000",chain:null,format:"bps",source:"src/Letterbox.sol:135-136; :304 (FeeTooHigh)",what:"a letter's or auto-sell plea's fees may take at most this share of your PLEA"},La={text:"8.25 IMD",value:"8250000000000000000",chain:null,format:"imd",source:"0.75 IMD x 110% / 10% (src/Letterbox.sol:304, :525-528)",what:"the least your PLEA must be worth, at the hourly price, to send a letter or an auto-sell plea"},Ia={text:"12.1 IMD",value:"12100000000000000000",chain:null,format:"imd",source:"1.1 IMD x 110% / 10% (src/Letterbox.sol:361-363; or the fees fit in 110% of the original plea's amount)",what:"the least your PLEA must be worth for an appeal letter, unless its fees fit in 110% of the original plea's amount"},Ta={text:"0.7 IMD",value:"700000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:120-124; _requireWorthTheFee :428-433 (TooSmallForTheFee)",what:"a letter or auto-sell plea worth less at the hourly price is refused"},Ca={text:"95%",value:"9500",chain:null,format:"bps",source:"src/Letterbox.sol:127-129; _deliver :405-406",what:"a delivered sale must get at least 95% of its hourly value after the hook's sale fees"},Na={text:"92.86%",value:null,chain:null,format:"text",source:"95% x (100% - 2.25%) = 92.8625% (src/Letterbox.sol:129-132, :405-406)",what:"the least a delivered sale pays, as a share of the plea's hourly value"},Da={text:"0.35 IMD",value:"350000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:116-119; _deliver :415-421 (never more than the sale; letters do not pay it)",what:"taken from a delivered auto-sell sale, to the season's prize pot"},Sa={text:"APPEAL followed by your text; SELL; NAME followed by a name; any other text is a new plea",value:null,chain:null,format:"text",source:"src/Letterbox.sol:204-216, :495-519",what:"what a letter's first word does"},Ma={text:"3",value:"3",chain:null,format:"int",source:"src/Letterbox.sol:260-261 (BadName)",what:"shortest display name"},$a={text:"20",value:"20",chain:null,format:"int",source:"src/Letterbox.sol:260-261 (BadName)",what:"longest display name"},Ga={text:"a-z, 0-9 and _",value:null,chain:null,format:"text",source:"src/Letterbox.sol:262-265",what:"the characters a display name may use"},Oa={text:"cabal, admin, imd, plea, owner",value:null,chain:null,format:"text",source:"src/Letterbox.sol:266-270",what:"names nobody may take"},Ha={text:"20 minutes",value:"1200",chain:"Tribunal.OBJECTION_WINDOW",format:"duration",source:"src/Tribunal.sol:126-127; :263 (WindowClosed)",what:"time after an approval to object; the plea's season points wait for it"},Ba={text:"0.5 IMD",value:"500000000000000000",chain:"Tribunal.ORACLE_FEE",format:"imd",source:"src/Tribunal.sol:130; :291-301",what:"an objection's oracle fee, spent whatever the ruling"},Fa={text:"0.35 IMD",value:"350000000000000000",chain:"Tribunal.STAKE",format:"imd",source:"src/Tribunal.sol:131; :290; settle :370-381",what:"back if sustained or void; to the plea's season prize pot if overruled"},Ra={text:"0.85 IMD",value:"850000000000000000",chain:null,format:"imd",source:"src/Tribunal.sol:130-131 (0.5 + 0.35)",what:"what an objection costs in IMD"},Wa={text:"2",value:"2",chain:"Tribunal.MARGIN",format:"int",source:"src/Tribunal.sol:134-135; sustained when score + 2 < need :330",what:"sustained only when the new score is more than this below the need"},Ua={text:"2",value:"2",chain:"Tribunal.MAX_OBJECTIONS",format:"int",source:"src/Tribunal.sol:132-133; :268-279",what:"objections per plea, each from a different wallet; both may wait at once"},za={text:"20 minutes",value:"1200",chain:"Tribunal.PENDING_EXPIRY",format:"duration",source:"src/Tribunal.sol:128-129; expire :361-368",what:"an objection with no ruling after this is void (stake back, fee spent)"},Ya={text:"280",value:"280",chain:"Tribunal.MAX_TEXT_BYTES",format:"int",source:"src/Tribunal.sol:136; :483-486",what:"an objection's text, in UTF-8 bytes (a page writes the word bytes after it)"},qa={text:"60",value:"60",chain:"Seasons.MIN_POINTS",format:"int",source:"src/Seasons.sol:60; :339, :444",what:"points to qualify for a prize"},Ka={text:"25",value:"25",chain:"Seasons.TOP",format:"int",source:"src/Seasons.sol:61; :338",what:"ranks paid each season"},Xa={text:"3",value:"3",chain:null,format:"int",source:"src/Seasons.sol:86-87, :265-281",what:"your best pleas that count in a season"},Va={text:"135",value:"135",chain:null,format:"int",source:"3 x 45 (src/Seasons.sol:265-281)",what:"most points a wallet can have in a season without a seat"},Qa={text:"162",value:"162",chain:null,format:"int",source:"3 x 54 (src/Seasons.sol:133-135, :265-281)",what:"most points with an IMD seat"},Ja={text:"4.5% for 1st down to 3.5% for 25th, in a straight line (rounded to whole basis points), 100% in all",value:null,chain:null,format:"text",source:"src/Seasons.sol:74-76 SHARES; shareBps :117-119 (on chain: 450 ... 350, sum 10,000)",what:"prize shares"},Za={text:"4.5%",value:"450",chain:null,format:"bps",source:"src/Seasons.sol:76; Seasons.shareBps(0) = 450 on chain",what:"the 1st place's share of the pot and of the bonus"},en={text:"3.5%",value:"350",chain:null,format:"bps",source:"src/Seasons.sol:76; Seasons.shareBps(24) = 350 on chain",what:"the 25th place's share"},tn={text:"4.50, 4.46, 4.42, 4.38, 4.33, 4.29, 4.25, 4.21, 4.17, 4.12, 4.08, 4.04, 4.00, 3.96, 3.92, 3.88, 3.83, 3.79, 3.75, 3.71, 3.67, 3.62, 3.58, 3.54, 3.50",value:null,chain:null,format:"text",source:"src/Seasons.sol:76; Seasons.shareBps(0..24) on chain",what:"every rank's share in percent, 1st to 25th"},an={text:"1 hour",value:"3600",chain:"Seasons.CLOSE_GRACE",format:"duration",source:"src/Seasons.sol:62-64; :326 (NotReady)",what:"after a season ends, before anyone can close it"},nn={text:"6",value:"6",chain:"Seasons.BONUS_SEASONS",format:"int",source:"src/Seasons.sol:65-66; :350",what:"seasons that also pay the PLEA bonus"},on={text:"10,000,000 PLEA",value:"10000000000000000000000000",chain:"Seasons.BONUS_PER_SEASON",format:"plea",source:"src/Seasons.sol:67; _payBonus :437-460",what:"PLEA bonus per season, same shares and same 60-point bar; unpaid shares are burned"},sn={text:"60,000,000 PLEA",value:"60000000000000000000000000",chain:null,format:"plea",source:"6 x 10,000,000 = Seasons' 6% (src/PLEA.sol:105)",what:"all six seasons' bonus"},ln={text:"×1.2",value:"12000",chain:"Seasons.SEAT_MULTIPLIER_BPS",format:"multiplier",source:"src/Seasons.sol:68-71; pointsFor :131-135 (rounded down; read when the plea is recorded)",what:"points for an IMD seat holder; points only, never the need or the 60-point bar"},rn={text:"a score of 45 counts 54 points",value:null,chain:null,format:"text",source:"45 x 12,000 / 10,000 = 54 (src/Seasons.sol:134)",what:"the seat multiplier on the top score"},cn={text:"2.25%",value:"225",chain:null,format:"bps",source:"src/PleaHook.sol:73-79 (IMD_FEE_BPS 200 of the trade's IMD + PLEA_BURN_BPS 25 of its PLEA)",what:"every trade's fee"},hn={text:"2%",value:"200",chain:"PleaHook.IMD_FEE_BPS",format:"bps",source:"src/PleaHook.sol:78; a share of the IMD that reaches or leaves the pool :470-472, :551",what:"the IMD part of every trade's fee"},un={text:"0.5%",value:"50",chain:"PleaHook.CASHBACK_BPS",format:"bps",source:"src/PleaHook.sol:74; :598; _payCashback :758-781",what:"back to the trader as staked IMD (sIMD, imd/acc's Stacker); stays in the pool when no trader is known (after the death)"},dn={text:"1%",value:"100",chain:"PleaHook.OWNER_BPS",format:"bps",source:"src/PleaHook.sol:75; :599, :619",what:"to the owner (the hook's fixed fee receiver)"},pn={text:"0.25%",value:"25",chain:"PleaHook.PRIZE_BPS",format:"bps",source:"src/PleaHook.sol:76; :600-601 (to pool liquidity once the Cabal is dead)",what:"to the season's prize pot while the Cabal lives"},fn={text:"0.25%",value:"25",chain:"PleaHook.POOL_BPS",format:"bps",source:"src/PleaHook.sol:77; :618, :630-633",what:"kept in the pool for the buy wall"},mn={text:"0.25%",value:"25",chain:"PleaHook.PLEA_BURN_BPS",format:"bps",source:"src/PleaHook.sol:79; :594, :644-654",what:"of the trade's PLEA, burned"},wn={text:"1.75%",value:"175",chain:null,format:"bps",source:"0.5% + 1% + 0.25% (src/PleaHook.sol:598-602)",what:"the IMD fee parts paid out of the pool (cashback, owner, prize)"},bn={text:"90 minutes",value:"5400",chain:"PleaHook.LAUNCH_WINDOW",format:"duration",source:"src/PleaHook.sol:80; launchExtraBps :311-317; max buy :721-725",what:"the launch window after trading opens"},xn={text:"70%",value:"7000",chain:"PleaHook.LAUNCH_EXTRA_BPS",format:"bps",source:"src/PleaHook.sol:81; :311-317, :485-487; a share of the IMD that reaches the pool :470-472; kept for the wall :618",what:"the extra fee on buys at the open; it falls in a straight line to 0% over the launch window; it stays in the pool for the buy wall"},_n={text:"70% at the open, 58.33% after 15 minutes, 46.66% after 30, 35% after 45, 23.33% after 60, 11.66% after 75, 0% from 90",value:null,chain:null,format:"text",source:"7,000 x (5,400 - seconds since the open) / 5,400 basis points, rounded down (src/PleaHook.sol:311-317)",what:"the launch fee over the window"},gn={text:"72%",value:"7200",chain:null,format:"bps",source:"2% + 70% (src/PleaHook.sol:485-487)",what:"the IMD fee on a buy at the open, as a share of the IMD that reaches the pool"},yn={text:"41.86%",value:null,chain:null,format:"text",source:"7,200 / 17,200 = 41.86% (src/PleaHook.sol:470-472: fee = amount x rate / (10,000 + rate))",what:"the fee at the open as a share of the IMD a buyer pays"},vn={text:"5,000,000 PLEA",value:"5000000000000000000000000",chain:"PleaHook.LAUNCH_MAX_BUY",format:"plea",source:"src/PleaHook.sol:82; _checkMaxBuy :721-725 (BuyTooLarge); the pool's PLEA out before the burn :474, :538",what:"most PLEA one buy may take from the pool in the launch window"},kn={text:"0.00002 IMD",value:"20000000000000",chain:null,format:"imd",source:"20,000 IMD / 1,000,000,000 PLEA (src/PleaHook.sol:384-389; the opening tick is rounded up to the 60-tick grid :394-396, about 0.23% higher)",what:"the opening price of one PLEA"},En={text:"about 100 IMD",value:null,chain:null,format:"text",source:"5,000,000 x 0.00002 IMD (before price impact and fees)",what:"what the largest launch-window buy is worth at the opening price"},Pn={text:"2 IMD",value:"2000000000000000000",chain:"PleaHook.PAYOUT_RESERVE",format:"imd",source:"src/PleaHook.sol:83-86; :603-617 (PayoutsToPool)",what:"the opening exception: while the pool's own IMD plus a buy's fee is under this and the pool cannot pay out, that buy's cashback, owner and prize shares join the pool instead"},An={text:"20,000 IMD",value:"20000000000000000000000",chain:"PleaHook.MARKET_CAP_IMD",format:"imd",source:"src/PleaHook.sol:87-88; seed :376-424",what:"the market cap trading opens at"},jn={text:"14,000 IMD",value:"14000000000000000000000",chain:null,format:"imd",source:"src/PleaLaunch.sol:211-214 (BelowAgreedMarketCap)",what:"on Ethereum, seed refuses a hook whose opening market cap is under this"},Ln={text:"15 days",value:"1296000",chain:null,format:"duration",source:"src/PleaLaunch.sol:211-212 (BelowAgreedTiming)",what:"on Ethereum, seed refuses seasons shorter than this"},In={text:"33 hours",value:"118800",chain:null,format:"duration",source:"src/PleaLaunch.sol:211-212 (BelowAgreedTiming)",what:"on Ethereum, seed refuses a dead-man shorter than this"},Tn={text:"900,000 PLEA",value:"900000000000000000000000",chain:"PleaHook.CAP_FLOOR",format:"plea",source:"src/PleaHook.sol:89; :803",what:"the inventory cap never falls below this"},Cn={text:"15",value:"15",chain:"PleaHook.CAP_DECAY_DAYS",format:"int",source:"src/PleaHook.sol:90-93; capDecayPerDay :409",what:"the cap may fall from the seeded PLEA to its floor in this many days at the fastest (a page writes the word days after it)"},Nn={text:"about 54.6 million PLEA",value:null,chain:null,format:"text",source:"(820,000,000 - 900,000) / 15 = 54,606,666 (src/PleaHook.sol:409; the seeded amount is a hair under 820,000,000: the 1-in-a-million rounding margin :1084)",what:"how far the cap may fall per day at most (fixed at the seed)"},Dn={text:"1 PLEA",value:"1000000000000000000",chain:"PleaHook.MIN_TRIM",format:"plea",source:"src/PleaHook.sol:94; :331-335, :815",what:"the least excess above the cap that is trimmed"},Sn={text:"1 IMD",value:"1000000000000000000",chain:"PleaHook.WALL_THRESHOLD",format:"imd",source:"src/PleaHook.sol:95; pendingRebalance :337-340",what:"kept IMD worth a rebalance"},Mn={text:"1,000 PLEA",value:"1000000000000000000000",chain:"PleaHook.WALL_MIN_FILL",format:"plea",source:"src/PleaHook.sol:96; :339",what:"PLEA bought by the wall worth a rebalance (it is burned then)"},$n={text:"700",value:"700",chain:"PleaHook.WALL_GUARD_TICKS_PER_DAY",format:"int",source:"src/PleaHook.sol:178-185; _updateWallGuard :1022-1055",what:"ticks a day the wall's ceiling may rise toward a higher price (it falls at once); a page writes the word ticks after it"},Gn={text:"about 7.25%",value:null,chain:null,format:"text",source:"1.0001 ^ 700 = 1.0725",what:"the wall guard's daily step as a price change"},On={text:"200",value:"200",chain:null,format:"int",source:"src/PleaHook.sol:177; _observeTick :1002-1014",what:"ticks a block the hook's reference price may move (about 2%)"},Hn={text:"60",value:"60",chain:"PleaHook.TICK_SPACING",format:"int",source:"src/PleaHook.sol:106",what:"the pool's tick spacing"},Bn={text:"0",value:"0",chain:"PleaHook.LP_FEE",format:"int",source:"src/PleaHook.sol:105",what:"the pool's own swap fee: every fee is the hook's"},Fn={text:"1,400,000",value:"1400000",chain:null,format:"int",source:"creditGas 400,000 + SWAP_RESERVE 1,000,000 (src/PleaHook.sol:99-102, :452; launch.json PleaLaunch argument 8 = 400000)",what:"gas a trade must still have when it reaches the hook, or it reverts NotEnoughGas"},Rn={text:"1,000,000,000 PLEA",value:"1000000000000000000000000000",chain:"PLEA.TOTAL_SUPPLY",format:"plea",source:"src/PLEA.sol:27; minted once in init :98-108",what:"fixed supply"},Wn={text:"820,000,000 PLEA",value:"820000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:104 (82%); on chain PLEA.balanceOf(hook) = 820,000,000 before the seed",what:"the pool's PLEA: all of it is the pool's liquidity"},Un={text:"60,000,000 PLEA",value:"60000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:105 (6%); on chain PLEA.balanceOf(Seasons)",what:"Seasons' PLEA bonus"},zn={text:"120,000,000 PLEA",value:"120000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:106 (12%); on chain PLEA.balanceOf(PleaDistributor)",what:"the distributor's PLEA (the swarm's 10% and a 2% airdrop, paid by one Merkle root)"},Yn={text:"82%",value:"8200",chain:null,format:"bps",source:"src/PLEA.sol:104",what:"the pool's share of the supply"},qn={text:"6%",value:"600",chain:null,format:"bps",source:"src/PLEA.sol:105",what:"Seasons' share"},Kn={text:"12%",value:"1200",chain:null,format:"bps",source:"src/PLEA.sol:106",what:"the distributor's share"},Xn={text:"10%",value:"1000",chain:null,format:"bps",source:"src/PLEA.sol:10-11, src/PleaDistributor.sol:10 (comments: the code pays whatever the owner's root lists)",what:"the swarm's part of the distributor's 12%"},Vn={text:"2%",value:"200",chain:null,format:"bps",source:"src/PLEA.sol:10-11, src/PleaDistributor.sol:10 (comments: the code pays whatever the owner's root lists)",what:"the airdrop's part of the distributor's 12%"},Qn={text:"82% to the pool (820,000,000), 6% to Seasons (60,000,000), 12% to the distributor (120,000,000)",value:null,chain:null,format:"text",source:"src/PLEA.sol:95-108; minted at deployHook (block 26,294,113)",what:"supply at launch"},Jn={text:"Tue 24 Nov 2026, 15:00 UTC",value:"1795532400",chain:"PleaLaunch.START",format:"text",source:"launch.json PleaLaunch argument 9 = 1795532400; src/PleaLaunch.sol:69-70, :206",what:"from this time anyone may open trading (seed); the owner may open it earlier"},Zn={text:"0x5BF3597216f9019Cf10CF680783289Efc8639Bf0",value:null,chain:null,format:"text",source:"launch.json $owner; on chain PLEA.owner(), PleaHook.owner(), PleaDistributor.owner()",what:"PLEA's owner, the hook's fee receiver and the distributor's owner"},eo={text:"#2647",value:null,chain:null,format:"text",source:"IMD's launch record (README of the site)",what:"IMD's launch number"},to={text:"26,293,890",value:"26293890",chain:null,format:"int",source:"Ethereum block of the launch transaction (PLEA's Launched event)",what:"the launch block"},ao={text:"26,294,106",value:"26294106",chain:null,format:"int",source:"PleaLaunch's LetterboxDeployed event",what:"the Letterbox's block"},no={text:"26,294,111",value:"26294111",chain:null,format:"int",source:"PleaLaunch's TribunalDeployed event",what:"the Tribunal's block"},oo={text:"26,294,113",value:"26294113",chain:null,format:"int",source:"PleaLaunch's HookDeployed event (PLEA minted its supply here)",what:"the hook's block"},so={text:"0x1F158929496162b53fB232536468948e25170aB3",value:null,chain:null,format:"text",source:"launch #2647",what:"PLEA (the token)"},lo={text:"0x39AC882a1161EA19aCb6FBDd7A5835D96CF876EB",value:null,chain:null,format:"text",source:"launch #2647; PLEA.gate()",what:"CabalGate (pleas, verdicts, sales)"},ro={text:"0xF7c024F7Bc96Cf152a572F6E184318ff6d380738",value:null,chain:null,format:"text",source:"launch #2647; PLEA.seasons()",what:"Seasons (points, prizes)"},io={text:"0x97fAcE21C7a9f3b64D0f4E0bF21861721fBBfE3E",value:null,chain:null,format:"text",source:"launch #2647; PLEA.distributor()",what:"PleaDistributor (the 12%)"},co={text:"0x9e75eabf8d1c905a07a0C99bb9eC9430a065358F",value:null,chain:null,format:"text",source:"launch #2647; PLEA.launcher()",what:"PleaLaunch (wiring, seed)"},ho={text:"0x00423EbaEd03445Fc1452d9A79A51E3C0DFdab5f",value:null,chain:null,format:"text",source:"PleaLaunch.letterbox(); PLEA.letterbox()",what:"Letterbox (letters, the auto-sell box)"},uo={text:"0x1aA665eB420F28103324daAAf034DE13EE6f53D9",value:null,chain:null,format:"text",source:"PleaLaunch.tribunal()",what:"Tribunal (Objection!)"},po={text:"0xf1122bc96AdeA8768CFf2badf02b6D4594f928Cc",value:null,chain:null,format:"text",source:"PleaLaunch.hook(); PLEA.hook()",what:"PleaHook (the pool's hook: fees, cap, wall)"},fo={text:"0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7",value:null,chain:null,format:"text",source:"launch.json CabalGate arguments 3-4",what:"IMD (the pool's other token and the fee token)"},mo={text:"0x000000000004444c5dc75cB358380D2e3dE08A90",value:null,chain:null,format:"text",source:"launch.json PleaLaunch argument 5; PLEA.poolManager()",what:"Uniswap v4's PoolManager"},wo={text:"0x06909F672301F28A810f78cfe7a754851269F4F0",value:null,chain:null,format:"text",source:"launch.json PleaLaunch argument 7",what:"imd/acc's Stacker (pays the cashback as sIMD)"},bo={text:"0xa43e6F75ee006411F79Ac1C84120606C2330DE82",value:null,chain:null,format:"text",source:"launch.json CabalGate argument 2",what:"IMD's Intake (asks the Cabal)"},xo={text:"0x5598Aa9146215Bc13eb26f2c692Ad1461Fd32982",value:null,chain:null,format:"text",source:"launch.json CabalGate argument 5",what:"the key that signs the Cabal's answers"},_o={text:"0x0000eC93127BAA929E58E97dd0095A2BFb38ec1D",value:null,chain:null,format:"text",source:"launch.json Seasons argument 4; Seasons.seat()",what:"the IMD seat NFT (identity.md) behind the seat multiplier"},go={text:"12",value:"12",chain:null,format:"int",source:"audit/FINDINGS.md Rounds table (rounds 1-12; 9-12 on the Ethereum code, the last on 571ae80, round 12)",what:"IMD swarm audit rounds"},yo={text:"852",value:"852",chain:null,format:"int",source:"README.md:299 (written 2026-10-17 for run 8.5's code; not re-counted for 42e0f85)",what:"the README's test count (unit, fuzz, invariant, adversarial, fork)"},vo={_meta:it,pass_mark:ct,max_score:ht,panel_size:ut,quorum:dt,oracle_fee:pt,appeal_wall_share:ft,appeal_total:mt,appeals_per_plea:wt,sell_window:bt,cooldown:xt,appeal_window:_t,pending_expiry:gt,max_plea_bytes:yt,max_sell:vt,max_share:kt,min_share:Et,min_share_cap_balance:Pt,deadman:At,season_length:jt,fact_share_bands:Lt,share_band_top:It,share_band_mid:Tt,fact_share_top:Ct,fact_share_mid:Nt,fact_share_low:Dt,fact_held_points:St,held_points_0:Mt,held_points_1d:$t,held_points_3d:Gt,held_points_7d:Ot,held_day_1:Ht,held_day_3:Bt,held_day_7:Ft,fact_profit_bands:Rt,profit_points_loss:Wt,profit_points_50:Ut,profit_points_200:zt,profit_points_500:Yt,profit_points_1000:qt,profit_points_more:Kt,profit_band_50:Xt,profit_band_200:Vt,profit_band_500:Qt,profit_band_1000:Jt,fact_received:Zt,received_profit:ea,fact_trend:ta,trend_band:aa,trend_up:na,trend_flat:oa,trend_down:sa,checkpoint_interval:la,price_ring_hours:ra,fact_max:ia,fact_min:ca,need_min:ha,fact_needed:ua,judge_rubric:da,judge_sincerity_max:pa,judge_craft_max:fa,judge_respect_max:ma,judge_loyalty_max:wa,judge_anchors:ba,judge_content_max:xa,judge_manipulation:_a,letter_share:ga,min_letter:ya,letter_min_balance:va,runner_tip:ka,letter_fee:Ea,letter_appeal_fee:Pa,fee_cap:Aa,max_fee_share:ja,letter_min_value:La,letter_appeal_min_value:Ia,min_sale_value:Ta,delivery_min_out:Ca,delivery_floor:Na,auto_sell_fee:Da,letter_commands:Sa,name_min_length:Ma,name_max_length:$a,name_chars:Ga,name_reserved:Oa,objection_window:Ha,objection_fee:Ba,objection_stake:Fa,objection_total:Ra,objection_margin:Wa,max_objections:Ua,objection_expiry:za,objection_bytes:Ya,min_points:qa,top:Ka,best_count:Xa,max_points:Va,max_points_seat:Qa,shares:Ja,share_first:Za,share_last:en,shares_list:tn,close_grace:an,bonus_seasons:nn,bonus_per_season:on,bonus_total:sn,seat_multiplier:ln,seat_example:rn,fee_total:cn,fee_imd:hn,fee_cashback:un,fee_owner:dn,fee_prize:pn,fee_pool:fn,fee_burn:mn,fee_payouts:wn,launch_window:bn,launch_extra:xn,launch_fee_curve:_n,launch_open_fee:gn,launch_open_fee_of_payment:yn,launch_max_buy:vn,seed_price:kn,launch_max_buy_value:En,payout_reserve:Pn,market_cap:An,market_cap_check:jn,seed_check_season:Ln,seed_check_deadman:In,cap_floor:Tn,cap_decay_days:Cn,cap_decay_per_day:Nn,min_trim:Dn,wall_threshold:Sn,wall_min_fill:Mn,wall_guard:$n,wall_guard_pct:Gn,ref_step:On,tick_spacing:Hn,lp_fee:Bn,swap_min_gas:Fn,total_supply:Rn,supply_pool:Wn,supply_seasons:Un,supply_distributor:zn,supply_pool_pct:Yn,supply_seasons_pct:qn,supply_distributor_pct:Kn,supply_swarm_pct:Xn,supply_airdrop_pct:Vn,supply_split:Qn,start:Jn,owner:Zn,launch_id:eo,launch_block:to,letterbox_block:ao,tribunal_block:no,hook_block:oo,addr_plea:so,addr_gate:lo,addr_seasons:ro,addr_distributor:io,addr_launch:co,addr_letterbox:ho,addr_tribunal:uo,addr_hook:po,addr_imd:fo,addr_pool_manager:mo,addr_stacker:wo,addr_intake:bo,addr_oracle_signer:xo,addr_seat:_o,audit_rounds:go,tests_count:yo},T=vo;function we(e){return{text:t=>{const o=K(T,t,e);if(o===void 0)throw Error(`The docs name an unknown number {{${t}}}.`);return o},value:t=>{if(!(t in T)||t==="_meta")throw Error(`The docs name an unknown number {{${t}}}.`);return Ge(T,t,e)}}}const be=x.createContext(we()),ko=be.Provider,V=()=>x.useContext(be),B=[{key:"fee_cashback",label:"Back to you, as staked IMD",fill:"var(--approved)",of:"IMD"},{key:"fee_owner",label:"The owner",fill:"var(--objection)",of:"IMD"},{key:"fee_prize",label:"The season’s prize pot",fill:"var(--pending)",of:"IMD"},{key:"fee_pool",label:"The buy wall, kept in the pool",fill:"var(--executed)",of:"IMD"},{key:"fee_burn",label:"Burned",fill:"var(--noverdict)",of:"PLEA"}],N=1e3,F=48;function Eo(){const e=V(),t="fee-bar-"+x.useId().replace(/[^a-zA-Z0-9_-]/g,""),o=B.map(i=>e.value(i.key)??0n),n=o.reduce((i,u)=>i+u,0n),s=o.slice(0,4).reduce((i,u)=>i+u,0n),l=i=>O("bps",i);let r=0;const c=B.map((i,u)=>{const p=n?N*Number(o[u])/Number(n):N/B.length,f={...i,x:r,w:p,n:u+1,text:e.text(i.key)};return r+=p,f}),d=`A bar for the ${l(n)} fee every trade pays, in five numbered parts: `+c.map(i=>`${i.n}, ${i.label[0].toLowerCase()+i.label.slice(1)}: ${i.text} of the ${i.of}`).join("; ")+`. Parts 1 to 4 are ${l(s)} of the trade’s IMD; part 5 is ${c[4].text} of its PLEA.`;return a.jsxs("figure",{className:"docs-figure panel stack stack--md",children:[a.jsxs("figcaption",{className:"docs-figure__title",children:["The ",l(n)," fee on every trade: ",l(s)," of its IMD in four parts, and ",c[4].text," of its PLEA, burned"]}),a.jsxs("div",{className:"docs-bar",children:[a.jsxs("svg",{className:"docs-bar__svg",viewBox:`0 0 ${N} ${F}`,preserveAspectRatio:"none",role:"img","aria-labelledby":`${t}-alt`,children:[a.jsx("title",{id:`${t}-alt`,children:d}),c.map(i=>a.jsx("rect",{x:i.x,y:"0",width:i.w,height:F,style:{fill:i.fill}},i.key)),c.slice(1).map(i=>a.jsx("line",{x1:i.x,y1:"0",x2:i.x,y2:F,vectorEffect:"non-scaling-stroke",style:{stroke:"var(--line)",strokeWidth:i.of==="PLEA"?8:3}},i.key))]}),c.map(i=>a.jsx("span",{className:"docs-bar__key",style:{left:`${(i.x+i.w/2)*100/N}%`},"aria-hidden":"true",children:i.n},i.key))]}),a.jsx(ne,{rows:[...c.map(i=>[a.jsxs("span",{className:"docs-key-row",children:[a.jsxs("svg",{className:"docs-key",viewBox:"0 0 28 28","aria-hidden":"true",children:[a.jsx("rect",{x:"1",y:"1",width:"26",height:"26",rx:"4",style:{fill:i.fill,stroke:"var(--line)",strokeWidth:2}}),a.jsx("circle",{cx:"14",cy:"14",r:"9",style:{fill:"var(--day)",stroke:"var(--night)",strokeWidth:1.5}}),a.jsx("text",{x:"14",y:"14",dy:"0.35em",textAnchor:"middle",style:{fill:"var(--night)",fontFamily:"var(--font-body)",fontWeight:800,fontSize:12},children:i.n})]}),a.jsxs("span",{children:[a.jsxs("span",{className:"sr-only",children:["Part ",i.n,": "]}),i.label]})]}),a.jsxs(a.Fragment,{children:[i.text," ",a.jsxs("span",{className:"text-2",children:["of the ",i.of]})]})]),["Every trade",l(n),"total"]]}),a.jsx("p",{className:"small text-2",children:"Once the Cabal is dead there are no more seasons: part 3 joins the pool too."})]})}function xe({title:e,alt:t,children:o,after:n}){const s="dg-"+x.useId().replace(/[^a-zA-Z0-9_-]/g,"");return a.jsxs("figure",{className:"docs-figure panel stack stack--md dg",children:[a.jsx("figcaption",{className:"docs-figure__title",children:e}),a.jsxs("div",{className:"dg-art",role:"img","aria-labelledby":s,children:[a.jsx("span",{id:s,className:"sr-only",children:t}),o]}),n]})}function Po(){return a.jsxs("span",{className:"dg-arrow","aria-hidden":"true",children:[a.jsx("span",{className:"dg-arrow__down",children:a.jsx(E,{name:"arrow-down"})}),a.jsx("span",{className:"dg-arrow__across",children:a.jsx(E,{name:"arrow-right"})})]})}function Ao({n:e,icon:t,title:o,children:n,wait:s=!1}){return a.jsxs("div",{className:`dg-node${s?" dg-node--wait":""}`,children:[a.jsxs("span",{className:"dg-node__head",children:[e!==void 0&&a.jsx("span",{className:"dg-n",children:e}),t&&a.jsx(E,{name:t}),a.jsx("span",{children:o})]}),n]})}function ae({children:e}){return a.jsx("div",{className:"dg-lane",children:e})}function jo({n:e,children:t}){return a.jsx("div",{className:"dg-lanes",style:{"--lanes":e},children:t})}function Lo({icon:e,children:t}){return a.jsxs("div",{className:"dg-band",children:[a.jsx(E,{name:e}),a.jsx("p",{children:t})]})}const D=6,y=1e3;function Io(){const e=V(),t=e.value("launch_extra")??0n,o=e.value("launch_window")??1n,n=e.value("fee_imd")??0n,s=h=>O("bps",h),l=h=>O("duration",h),r=h=>h>=o?0n:t*(o-h)/o,c=Array.from({length:D+1},(h,b)=>{const m=o*BigInt(b)/BigInt(D);return{s:m,i:b,fee:r(m)}}),d=Number(o)*(D+1)/D,i=h=>Number(h)/d*y,u=h=>t?y-Number(h)/Number(t)*y:y,p=i(o),f=h=>String(Number(h)/60),w=`A line chart of the launch fee over the launch window. It starts at ${s(t)} when trading opens and falls in a straight line to 0% at ${l(o)}, then stays at 0%. `+c.map(h=>h.i===0?`At the open: ${s(h.fee)}`:`after ${f(h.s)} minutes: ${s(h.fee)}`).join(", ")+`. It comes on top of the usual ${s(n)} of the IMD that reaches the pool. Until ${l(o)} after the open, one buy may take at most ${e.text("launch_max_buy")} from the pool.`;return a.jsx(xe,{title:`The launch fee: ${s(t)} at the open, 0% after ${l(o)}`,alt:w,after:a.jsxs(a.Fragment,{children:[a.jsx(ne,{rows:c.map(h=>[h.i===0?"At the open":`${h.s>=o?"From":"After"} ${f(h.s)} minutes`,a.jsxs(a.Fragment,{children:[s(h.fee)," ",a.jsxs("span",{className:"text-2",children:["+ ",s(n)]})]})])}),a.jsxs("p",{className:"small text-2",children:["The launch fee is a share of the IMD that reaches the pool, on buys only, on top of the usual ",s(n),". It stays in the pool, for the buy wall."]})]}),children:a.jsxs("div",{className:"dg-chart",children:[a.jsx("span",{className:"dg-chart__title",children:"Launch fee, as a share of the IMD that reaches the pool"}),a.jsxs("div",{className:"dg-chart__plot",children:[a.jsxs("svg",{className:"dg-chart__svg",viewBox:`0 0 ${y} ${y}`,preserveAspectRatio:"none","aria-hidden":"true",children:[a.jsx("polygon",{points:`0,${u(t)} ${p},${y} 0,${y}`,style:{fill:"var(--action-soft)"}}),c.slice(1).map(h=>a.jsx("line",{x1:i(h.s),y1:"0",x2:i(h.s),y2:y,vectorEffect:"non-scaling-stroke",style:{stroke:"var(--line-soft)",strokeWidth:2,strokeDasharray:h.s===o?void 0:"4 4"}},h.i)),a.jsx("polyline",{points:`0,${u(t)} ${p},${y} ${y},${y}`,vectorEffect:"non-scaling-stroke",style:{fill:"none",stroke:"var(--ink)",strokeWidth:3,strokeLinejoin:"round"}})]}),c.map(h=>a.jsx("span",{className:"dg-chart__dot",style:{left:`${i(h.s)/10}%`,top:`${u(h.fee)/10}%`}},h.i)),a.jsx("span",{className:"dg-chart__y",style:{top:"0%"},children:s(t)}),a.jsx("span",{className:"dg-chart__y",style:{top:"50%"},children:s(t/2n)}),a.jsx("span",{className:"dg-chart__y",style:{top:"100%"},children:"0%"})]}),a.jsxs("div",{className:"dg-chart__row",children:[c.map(h=>a.jsx("span",{className:`dg-chart__x${h.i===0?" dg-chart__x--start":""}`,style:{left:`${i(h.s)/10}%`},children:f(h.s)},h.i)),a.jsx("span",{className:"dg-chart__x dg-chart__x--end",style:{left:"100%"},children:"min"})]}),a.jsx("span",{className:"dg-chart__title",children:"Minutes after trading opens"}),a.jsx("div",{className:"dg-chart__row",style:{width:`${p/10}%`},children:a.jsxs("span",{className:"dg-chart__span",children:["Until minute ",f(o),": at most ",e.text("launch_max_buy")," a buy"]})})]})})}const To={APPROVED:"approved",OVERTURNED:"approved",DENIED:"denied",UPHELD:"denied",PENDING:"pending","NO VERDICT":"noverdict",LAPSED:"lapsed",SOLD:"sold",OBJECTION:"objection",SUSTAINED:"objection",OVERRULED:"objection",VOID:"objection"};function R({state:e,sub:t,size:o}){return a.jsxs("span",{className:`stamp stamp--${To[e]}${o?` stamp--${o}`:""}`,children:[e,t&&a.jsx("span",{className:"stamp__sub",children:t})]})}function Co(){const e=V(),t=e.text,o=[{title:"Buy",text:"Open to anyone. Each buy records what you paid and when."},{title:"Plead",text:`Write why you want to sell, and pay the ${t("oracle_fee")} oracle fee.`,stamp:"PENDING"},{title:"Judged",text:`${t("panel_size")} judges score it from 0 to ${t("max_score")}; ${t("quorum")} must agree. Your need or more: approved.`,stamp:"APPROVED"},{title:"Sell",text:`Sell what you asked for, in one go, within ${t("sell_window")}.`,stamp:"SOLD"}],n=`Appeal once within ${t("appeal_window")}. Or wait out the cooldown, ${t("cooldown")}, and plead again.`,s=`No answer within ${t("pending_expiry")}. The fee is spent, and you may plead again at once.`,l=`Every verdict restarts its clock. After ${t("deadman")} without one, the Cabal dies for good: no more pleas, and PLEA trades freely.`,r="The PLEA loop, left to right: "+o.map((c,d)=>`${d+1}, ${c.title}: ${c.text}`).join(" ")+` A plea can also end two other ways. Denied: ${n} No verdict: ${s} Under it all, the dead-man: ${l}`;return a.jsxs(xe,{title:"Buy, plead, be judged, sell",alt:r,children:[a.jsx("div",{className:"dg-flow",children:o.map((c,d)=>a.jsxs(x.Fragment,{children:[d>0&&a.jsx(Po,{}),a.jsxs(Ao,{n:d+1,title:c.title,children:[a.jsx("span",{className:"dg-node__text",children:c.text}),c.stamp&&a.jsx(R,{state:c.stamp,size:"sm"})]})]},c.title))}),a.jsx("p",{className:"small strong",children:"Or the plea ends another way:"}),a.jsxs(jo,{n:2,children:[a.jsxs(ae,{children:[a.jsx(R,{state:"DENIED",size:"sm"}),a.jsx("p",{className:"small",children:n})]}),a.jsxs(ae,{children:[a.jsx(R,{state:"NO VERDICT",size:"sm"}),a.jsx("p",{className:"small",children:s})]})]}),a.jsxs(Lo,{icon:"hourglass",children:[a.jsx("b",{children:"Under it all, the dead-man."})," ",l]})]})}const No=Object.assign({"../../../docs/01-start-here.md":Ue,"../../../docs/02-buying.md":ze,"../../../docs/03-plead.md":Ye,"../../../docs/04-your-bar.md":qe,"../../../docs/05-judges.md":Ke,"../../../docs/06-appeals.md":Xe,"../../../docs/07-letters.md":Ve,"../../../docs/08-auto-sell.md":Qe,"../../../docs/09-objection.md":Je,"../../../docs/10-seasons.md":Ze,"../../../docs/11-fees.md":et,"../../../docs/12-pool.md":tt,"../../../docs/13-dead-man.md":at,"../../../docs/14-keepers.md":nt,"../../../docs/15-contracts.md":ot,"../../../docs/16-audits.md":st,"../../../docs/17-risks.md":lt,"../../../docs/18-glossary.md":rt}),Do=Object.fromEntries(Object.entries(Object.assign({"./diagrams/fee-bar.tsx":Eo,"./diagrams/launch-fee.tsx":Io,"./diagrams/loop.tsx":Co})).map(([e,t])=>[e.replace(/^.*\/|\.tsx$/g,""),t])),_e=e=>K(T,e),ge=j.map(e=>{const t=No[`../../../docs/${ke(e)}`]??`# ${e.title}
`;return{...e,blocks:U(t,_e).blocks}}),So=Oe(ge,_e);function Bo({slug:e,heading:t}){const{statics:o,s:n}=Ee(),s=o??n?.constants,l=x.useCallback(f=>K(T,f,s),[s]),r=x.useMemo(()=>we(s),[s]),c=Pe(e),d=c&&ge.find(f=>f.slug===c.slug);x.useEffect(()=>{if(!t)return;const f=document.getElementById(W(t));f&&(f.scrollIntoView(),f.focus({preventScroll:!0}))},[c?.slug,t]);const i=x.useMemo(()=>d?Me(d.blocks,l):[],[d,l]),{prev:u,next:p}=Ae(c?.slug||"");return a.jsx(ko,{value:r,children:a.jsxs("div",{className:"docs",children:[a.jsx(Mo,{current:c?.slug}),a.jsxs("article",{className:"docs__page",children:[d?a.jsx("div",{className:"docs-body",children:a.jsx(We,{tree:d.blocks,ctx:{slug:d.slug,num:l,diagrams:Do}})}):a.jsxs("div",{className:"stack stack--lg",children:[a.jsx(je,{title:"Page not found"}),a.jsx(Le,{title:`No docs page at #/docs/${e}`,action:{href:"#/docs",label:"Start here"},children:"Pick a page from the list, or search the docs."})]}),d&&a.jsxs("nav",{className:"docs-pager","aria-label":"Previous and next page",children:[u&&a.jsxs("a",{className:"docs-pager__link",href:L(u.slug),rel:"prev",children:[a.jsx("span",{className:"label",children:"Previous"}),a.jsxs("span",{className:"docs-pager__title",children:[a.jsx("span",{className:"docs-pager__back",children:a.jsx(E,{name:"arrow-right"})}),u.title]})]}),p&&a.jsxs("a",{className:"docs-pager__link docs-pager__link--next",href:L(p.slug),rel:"next",children:[a.jsx("span",{className:"label",children:"Next"}),a.jsxs("span",{className:"docs-pager__title",children:[p.title,a.jsx(E,{name:"arrow-right"})]})]})]})]}),d&&i.length>0&&a.jsxs("nav",{className:"docs__toc","aria-label":"On this page",children:[a.jsx("p",{className:"label",children:"On this page"}),a.jsx("ul",{children:i.map(f=>a.jsx("li",{className:f.level===3?"docs__toc-sub":void 0,children:a.jsx("a",{href:L(d.slug,f.id),"aria-current":f.id===t?"location":void 0,children:f.text})},f.id))})]})]})})}function Mo({current:e}){const[t,o]=x.useState(!1),n=x.useRef(null);x.useEffect(()=>o(!1),[e]);const s=j.findIndex(r=>r.slug===e),l=r=>{r.key==="Escape"&&t&&document.getElementById("docs-pages")?.contains(document.activeElement)?(o(!1),n.current?.focus()):r.key==="Escape"&&t&&document.activeElement===n.current&&o(!1)};return a.jsxs("div",{className:"docs__side",onKeyDown:l,children:[a.jsx($o,{}),a.jsxs("button",{ref:n,type:"button",className:"docs__toggle","aria-expanded":t,"aria-controls":"docs-pages",onClick:()=>o(!t),children:[a.jsx(E,{name:t?"x":"list"}),a.jsxs("span",{className:"docs__toggle-text",children:[a.jsx("span",{className:"strong",children:"Docs pages"}),s>=0&&a.jsxs("span",{className:"meta",children:[s+1," of ",j.length,": ",j[s].title]})]})]}),a.jsx("nav",{id:"docs-pages",className:`docs-nav${t?" is-open":""}`,"aria-label":"Docs pages",children:a.jsx("ol",{children:j.map(r=>a.jsx("li",{children:a.jsx("a",{href:L(r.slug),"aria-current":r.slug===e?"page":void 0,children:r.title})},r.slug))})})]})}function $o(){const[e,t]=x.useState(""),o=x.useRef(null),n=x.useRef(null),s=8,l=x.useMemo(()=>Be(So,e,1/0),[e]),r=l.slice(0,s),c=X(e).join("").length>=2;x.useEffect(()=>{const u=()=>t("");return window.addEventListener("hashchange",u),()=>window.removeEventListener("hashchange",u)},[]);const d=()=>[...n.current?.querySelectorAll("a")||[]],i=(u,p)=>{const f=d();u.key==="ArrowDown"&&f.length?(u.preventDefault(),f[Math.min(p+1,f.length-1)].focus()):u.key==="ArrowUp"?(u.preventDefault(),p<=0?o.current?.focus():f[p-1].focus()):u.key==="Escape"&&e&&(u.preventDefault(),u.stopPropagation(),t(""),o.current?.focus())};return a.jsxs("form",{role:"search",className:"docs-search",onSubmit:u=>{u.preventDefault(),r[0]&&(location.hash=r[0].href)},children:[a.jsx("label",{className:"sr-only",htmlFor:"docs-q",children:"Search the docs"}),a.jsxs("div",{className:"input input--text",children:[a.jsx(E,{name:"magnifying-glass"}),a.jsx("input",{ref:o,id:"docs-q",className:"input__control",type:"search",placeholder:"Search the docs",autoComplete:"off",spellCheck:!1,value:e,"aria-describedby":"docs-q-count","aria-controls":c&&r.length?"docs-results":void 0,onChange:u=>t(u.target.value),onKeyDown:u=>i(u,-1)})]}),a.jsx("p",{id:"docs-q-count",className:"sr-only","aria-live":"polite",children:c?`${l.length||"No"} result${l.length===1?"":"s"}${l.length>s?`, the first ${s} shown`:""}`:""}),c&&(r.length?a.jsxs("ul",{ref:n,id:"docs-results",className:"docs-results","aria-label":"Search results",children:[r.map((u,p)=>a.jsx("li",{children:a.jsxs("a",{href:u.href,onKeyDown:f=>i(f,p),children:[a.jsx("span",{className:"docs-results__where",children:a.jsx(Go,{entry:u.entry})}),u.snippet&&a.jsx("span",{className:"docs-results__text",children:a.jsx(Oo,{text:u.snippet,query:e})})]})},u.href)),l.length>s&&a.jsxs("li",{className:"small text-2 docs-results__more","aria-hidden":"true",children:[l.length," sections match; the first ",s," are shown. Add a word to narrow it."]})]}):a.jsxs("p",{className:"small text-2 docs-results__none",children:["No section mentions “",e.trim(),"”."]}))]})}const Go=({entry:e})=>a.jsxs(a.Fragment,{children:[e.page,e.heading&&a.jsxs(a.Fragment,{children:[a.jsx("span",{"aria-hidden":"true",children:" › "}),a.jsx("span",{className:"sr-only",children:", "}),e.heading]})]});function Oo({text:e,query:t}){const o=X(t).filter(s=>s.length>1);if(!o.length)return a.jsx(a.Fragment,{children:e});const n=new RegExp(`(${o.map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})`,"gi");return a.jsx(a.Fragment,{children:e.split(n).map((s,l)=>l%2?a.jsx("mark",{children:s},l):s)})}export{Bo as default};
