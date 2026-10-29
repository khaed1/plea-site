import{s as me,j as r,N as fe,h as H,I as T,d as N,r as x,C as we,D as y,f as be,u as xe,p as ge,a as _e,T as ve,E as ke}from"./index-CU-YYPBy.js";const je=e=>e.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"section",Ee=/[\\`*_{}\[\]()#+\-.!|>:~<]/;function L(e,t=[]){const o=[],n=a=>{const l=o[o.length-1];l?.t==="text"?l.v+=a:a&&o.push({t:"text",v:a})};let s=0;for(;s<e.length;){const a=e[s];if(a==="\\"&&s+1<e.length&&Ee.test(e[s+1])){n(e[s+1]),s+=2;continue}if(a==="{"&&e.startsWith("{{",s)){const l=e.indexOf("}}",s+2);if(l<0){t.push(`an unclosed placeholder: "${e.slice(s,s+24)}"`),n(e.slice(s));break}o.push({t:"num",key:e.slice(s+2,l).trim()}),s=l+2;continue}if(a==="`"){let l=1;for(;e[s+l]==="`";)l++;const c="`".repeat(l),h=e.indexOf(c,s+l);if(h>0){let i=e.slice(s+l,h);i.startsWith(" ")&&i.endsWith(" ")&&i.trim()&&(i=i.slice(1,-1)),o.push({t:"code",c:Q(i,t)}),s=h+l;continue}n(c),s+=l;continue}if(a==="*"&&e[s+1]==="*"){const l=q(e,s+2,"**");if(l>0){o.push({t:"strong",c:L(e.slice(s+2,l),t)}),s=l+2;continue}}if((a==="*"||a==="_")&&e[s+1]!==a&&Te(e,s)){const l=q(e,s+1,a);if(l>0){o.push({t:"em",c:L(e.slice(s+1,l),t)}),s=l+1;continue}}if(a==="["){const l=ye(e,s);if(l>0&&e[l+1]==="("){const c=e.indexOf(")",l+2);if(c>0){o.push({t:"link",href:e.slice(l+2,c).trim(),c:L(e.slice(s+1,l),t)}),s=c+1;continue}}}n(a),s++}return o}function Q(e,t){const o=[];let n=0;for(;n<e.length;){const s=e.indexOf("{{",n);if(s<0)break;const a=e.indexOf("}}",s+2);if(a<0){t.push(`an unclosed placeholder: "${e.slice(s,s+24)}"`);break}s>n&&o.push({t:"text",v:e.slice(n,s)}),o.push({t:"num",key:e.slice(s+2,a).trim()}),n=a+2}return n<e.length&&o.push({t:"text",v:e.slice(n)}),o}const J=e=>e===void 0||/\s/.test(e),Z=e=>!!e&&/[\p{L}\p{N}]/u.test(e);function Te(e,t){return J(e[t+1])?!1:e[t]==="*"||!Z(e[t-1])}function q(e,t,o){let n=t;for(;n<e.length;){if(e[n]==="\\"){n+=2;continue}if(e[n]==="`"){const s=e.indexOf("`",n+1);if(s>0){n=s+1;continue}}if(e.startsWith(o,n)&&n>t&&!J(e[n-1])){if(o==="*"&&e[n+1]==="*"){n+=2;continue}if(o==="_"&&Z(e[n+1])){n++;continue}return n}n++}return-1}function ye(e,t){let o=0;for(let n=t;n<e.length;n++){if(e[n]==="\\"){n++;continue}if(e[n]==="["&&o++,e[n]==="]"&&--o===0)return n}return-1}const ee=/^```\s*([\w-]*)\s*$/,te=/^(#{1,6})\s+(.*?)\s*#*\s*$/,ne=/^(?:-{3,}|\*{3,}|_{3,})\s*$/,$=/^:::\s*(.*?)\s*$/,C=/^>\s?/,E=/^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/,Ne=/^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/,se=(e,t)=>/^\s*\|/.test(e[t])&&t+1<e.length&&Ne.test(e[t+1].trim()),oe=(e,t)=>{const o=e[t];return ee.test(o)||te.test(o)||ne.test(o)||$.test(o)||C.test(o)||se(e,t)||E.test(o)&&E.exec(o)[1].length<2};function O(e){let t=e.trim();t.startsWith("|")&&(t=t.slice(1)),t.endsWith("|")&&!t.endsWith("\\|")&&(t=t.slice(0,-1));const o=[];let n="",s=!1;for(let a=0;a<t.length;a++)t[a]==="\\"&&t[a+1]==="|"?(n+="|",a++):t[a]==="`"?(s=!s,n+="`"):t[a]==="|"&&!s?(o.push(n.trim()),n=""):n+=t[a];return o.push(n.trim()),o}function R(e,t=s=>s,o=0,n=new Map){const s=e.replace(/\r\n?/g,`
`).replace(/<!--[\s\S]*?-->/g,u=>u.replace(/[^\n]/g,"")).split(`
`),a=[],l=[],c=(u,d)=>l.push(`line ${o+u+1}: ${d}`),h=(u,d)=>{const p=[],w=L(u,p);for(const m of p)c(d,m);return w};let i=0;for(;i<s.length;){const u=s[i];if(!u.trim()){i++;continue}let d;if(d=ee.exec(u)){const m=i++,b=[];for(;i<s.length&&!/^```\s*$/.test(s[i]);)b.push(s[i++]);i>=s.length&&c(m,"a code block (```) is never closed"),i++;const f=[];a.push({t:"pre",lang:d[1],c:Q(b.join(`
`),f)});for(const _ of f)c(m,_);continue}if(d=te.exec(u)){const m=d[1].length;let b=d[2],f="";const _=/\s*\{#([a-z0-9-]+)\}\s*$/.exec(b);_&&(f=_[1],b=b.slice(0,_.index)),m>4&&c(i,`a level-${m} heading: the docs use # to #### only`);const g=h(b,i);f||=je(k(g,t));const j=n.get(f)||0;n.set(f,j+1),j&&(f=`${f}-${j+1}`),a.push({t:"h",level:Math.min(m,4),id:f,c:g}),i++;continue}if(ne.test(u)){a.push({t:"hr"}),i++;continue}if(d=$.exec(u)){const[m,...b]=d[1].split(/\s+/),f=d[1].slice(m.length).trim();if(m==="diagram"){(!/^[a-z0-9-]+$/.test(f)||b.length!==1)&&c(i,`"::: diagram" needs one name in a-z, 0-9 and -: "${u.trim()}"`),a.push({t:"diagram",name:f,line:o+i+1}),i++;continue}if(m==="note"||m==="warn"||m==="builders"){const _=i++,g=[];for(;i<s.length&&!/^:::\s*$/.test(s[i]);)$.exec(s[i])?.[1]&&!/^diagram\b/.test($.exec(s[i])[1])&&c(i,"a callout inside a callout: close the first with ::: before opening another"),g.push(s[i++]);i>=s.length&&c(_,`"::: ${m}" is never closed with a line of :::`),i++;const j=R(g.join(`
`),t,o+_+1,n);l.push(...j.errors),a.push({t:"callout",kind:m,title:f?h(f,_):void 0,c:j.blocks});continue}c(i,m?`an unknown block "::: ${m}" (use diagram, note, warn or builders)`:"a ::: that closes nothing"),i++;continue}if(C.test(u)){const m=i,b=[];for(;i<s.length&&C.test(s[i]);)b.push(s[i++].replace(C,""));const f=R(b.join(`
`),t,o+m,n);l.push(...f.errors),a.push({t:"quote",c:f.blocks});continue}if(se(s,i)){const m=O(u),b=O(s[i+1]).map(g=>g.endsWith(":")?g.startsWith(":")?"c":"r":"l");b.length!==m.length&&c(i,"the table's --- line has a different number of columns from its head");const f=i;i+=2;const _=[];for(;i<s.length&&/^\s*\|/.test(s[i]);){const g=O(s[i]);g.length!==m.length&&c(i,`a table row with ${g.length} cells under a head of ${m.length}`),_.push(g.map(j=>h(j,i))),i++}a.push({t:"table",align:b,head:m.map(g=>h(g,f)),rows:_});continue}if((d=E.exec(u))&&d[1].length<2){const m=Ie(s,i,h,c);a.push(m.list),i=m.next;continue}const p=i,w=[];for(;i<s.length&&s[i].trim()&&(i===p||!oe(s,i));)w.push(s[i++].trim());a.push({t:"p",c:h(w.join(" "),p)})}return{blocks:a,errors:l}}const P=e=>/\d/.test(e);function Ie(e,t,o,n){const s=E.exec(e[t]),a={t:"list",ordered:P(s[2]),start:parseInt(s[2])||1,items:[]};let l=t,c=-1,h;const i=[],u=()=>{h&&i.push(h),h=void 0};for(;l<e.length;){const d=e[l];if(!d.trim()){let w=l+1;for(;w<e.length&&!e[w].trim();)w++;const m=w<e.length?E.exec(e[w]):null;if(m&&(m[1].length>=2?a.items.length>0:P(m[2])===a.ordered)){l=w;continue}break}const p=E.exec(d);if(p&&p[1].length<2){if(P(p[2])!==a.ordered)break;u();const w={c:[]};a.items.push(w),h={item:w,parts:[p[3]],line:l},c=-1,l++;continue}if(p&&a.items.length){const w=a.items[a.items.length-1];c<0&&(c=p[1].length),p[1].length>c+1&&n(l,"a list nested more than one level: the docs nest lists one level only"),w.sub||(w.sub={t:"list",ordered:P(p[2]),start:parseInt(p[2])||1,items:[]}),u();const m={c:[]};w.sub.items.push(m),h={item:m,parts:[p[3]],line:l},l++;continue}if(p||oe(e,l))break;h&&h.parts.push(d.trim()),l++}u();for(const d of i)d.item.c=o(d.parts.join(" "),d.line);return{list:a,next:l}}function k(e,t=o=>o){return e.map(o=>o.t==="text"?o.v:o.t==="num"?t(o.key)??o.key:k(o.c,t)).join("")}const Ae=(e,t)=>e.filter(o=>o.t==="h"&&(o.level===2||o.level===3)).map(o=>({id:o.id,level:o.level,text:k(o.c,t)}));function ae(e){const t=/^(?:\.\/)?(\d\d)-([a-z0-9-]+)\.md(?:#([a-z0-9-]+))?$/.exec(e);return t?`#/docs/${t[2]}${t[3]?`/${t[3]}`:""}`:e}function G(e,t=18){const o=e<0n,n=o?-e:e,s=10n**BigInt(t),a=(n/s).toLocaleString("en-US"),l=(n%s).toString().padStart(t,"0").replace(/0+$/,"");return(o?"−":"")+a+(l?"."+l:"")}const Pe=e=>G(e,2);function re(e,t){let o;try{if(t==null||t==="")return;o=BigInt(t)}catch{return}switch(e){case"int":return o.toLocaleString("en-US");case"imd":return`${G(o)} IMD`;case"plea":return`${G(o)} PLEA`;case"duration":return me(Number(o));case"bps":return`${Pe(o)}%`;case"multiplier":return`×${G(o,4)}`;default:return}}const K=new Set;function W(e,t,o){const n=t==="_meta"?void 0:e[t];if(!n)return;const s=n.chain?o?.[n.chain]:void 0;if(s==null)return n.text;let a=!0;try{a=n.value!==null&&BigInt(s)===BigInt(n.value)}catch{a=!1}return!a&&!K.has(t)&&(K.add(t),console.warn(`Docs: ${n.chain} on chain is ${String(s)}, numbers.json's ${t} says ${n.value}; the page shows the chain's.`)),n.format==="text"?n.text:re(n.format,s)??n.text}function Se(e,t,o){const n=t==="_meta"?void 0:e[t];if(!n)return;const s=n.chain?o?.[n.chain]:void 0;try{return s!=null?BigInt(s):n.value===null?void 0:BigInt(n.value)}catch{return}}const le=(e,t)=>e.items.map(o=>k(o.c,t)+(o.sub?" "+le(o.sub,t):"")).join(" ");function B(e,t){switch(e.t){case"p":case"pre":return k(e.c,t);case"list":return le(e,t);case"table":return[e.head,...e.rows].map(o=>o.map(n=>k(n,t)).join(" ")).join(" ");case"quote":return e.c.map(o=>B(o,t)).join(" ");case"callout":return[e.kind==="builders"?"For builders":"",e.title?k(e.title,t):"",...e.c.map(o=>B(o,t))].join(" ");default:return""}}function Le(e,t){const o=[];for(const n of e){let s={slug:n.slug,page:n.title,heading:"",id:"",text:"",order:o.length};const a=[],l=()=>{s.text=a.join(" ").replace(/\s+/g," ").trim(),(s.heading||s.text)&&o.push({...s,order:o.length}),a.length=0};for(const c of n.blocks)if(!(c.t==="h"&&c.level===1)){if(c.t==="h"){l(),s={slug:n.slug,page:n.title,heading:k(c.c,t),id:c.id,text:"",order:0};continue}a.push(B(c,t))}l()}return o}const I=e=>e.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,""),z=e=>I(e).split(/[^\p{L}\p{N}%.×-]+/u).filter(t=>t.length>0),$e=(e,t)=>{let o=0,n=e.indexOf(t);for(;n>=0&&o<5;)o++,n=e.indexOf(t,n+t.length);return o},ie=e=>e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),X=(e,t)=>new RegExp(`(^|[^\\p{L}\\p{N}])${ie(t)}`,"u").test(e),Y=(e,t)=>new RegExp(`(^|[^\\p{L}\\p{N}])${ie(t)}($|[^\\p{L}\\p{N}])`,"u").test(e);function Ce(e,t,o=8){const n=z(t);if(n.join("").length<2)return[];const s=n.join(" "),a=[];for(const l of e){const c=I(l.heading),h=I(l.page),i=I(l.text);if(!n.every(d=>c.includes(d)||h.includes(d)||i.includes(d)))continue;let u=n.length>1&&c.includes(s)?20:0;for(const d of n)u+=(X(c,d)?10:0)+(X(h,d)?5:0)+$e(i,d)+(Y(c,d)||Y(i,d)?2:0);a.push({e:l,score:u})}return a.sort((l,c)=>c.score-l.score||l.e.order-c.e.order),a.slice(0,o).map(({e:l})=>({entry:l,href:ae(`#/docs/${l.slug}${l.id?`/${l.id}`:""}`),snippet:Ge(l.text,n)}))}function Ge(e,t,o=120){const n=I(e),s=Math.min(...t.map(c=>n.indexOf(c)).filter(c=>c>=0),1/0);if(e.length<=o)return e;let a=s===1/0?0:Math.max(0,s-Math.floor(o/3));a>0&&(a=e.indexOf(" ",a)+1||a);let l=Math.min(e.length,a+o);return l<e.length&&(l=e.lastIndexOf(" ",l)>a?e.lastIndexOf(" ",l):l),(a>0?"…":"")+e.slice(a,l)+(l<e.length?"…":"")}const Oe={note:{kind:"info",icon:"info",title:void 0},warn:{kind:"warn",icon:"warning",title:void 0},builders:{kind:"builders",icon:"seal-check",title:"For builders"}};function F(e,t){const o=t.num(e);if(o===void 0)throw Error(`The docs name an unknown number {{${e}}}.`);return o}function v(e,t,o="i"){return e.map((n,s)=>{const a=`${o}.${s}`;switch(n.t){case"text":return n.v;case"num":{const l=F(n.key,t);return l.split(" ").length<=3?r.jsx("span",{className:"nowrap",children:l},a):l}case"strong":return r.jsx("strong",{children:v(n.c,t,a)},a);case"em":return r.jsx("em",{children:v(n.c,t,a)},a);case"code":return r.jsx("code",{children:v(n.c,t,a)},a);case"link":{const l=ae(n.href);return/^https?:\/\//.test(l)?r.jsxs("a",{href:l,target:"_blank",rel:"noreferrer",className:"docs-ext",children:[v(n.c,t,a),r.jsx(T,{name:"arrow-square-out"}),r.jsx("span",{className:"sr-only",children:" (opens in a new tab)"})]},a):r.jsx("a",{href:l,children:v(n.c,t,a)},a)}}})}function ce(e,t,o){const n=e.items.map((s,a)=>r.jsxs("li",{children:[v(s.c,t,`${o}.${a}`),s.sub&&ce(s.sub,t,`${o}.${a}.s`)]},a));return e.ordered?r.jsx("ol",{start:e.start===1?void 0:e.start,children:n},o):r.jsx("ul",{children:n},o)}const V={l:void 0,c:"c",r:"r"};function U(e,t,o="b"){return e.map((n,s)=>{const a=`${o}.${s}`;switch(n.t){case"h":{const l=v(n.c,t,a);if(n.level===1)return r.jsx("div",{className:"page-title",children:r.jsx("h1",{children:l})},a);if(n.level===4)return r.jsx("h4",{id:H(n.id),tabIndex:-1,children:l},a);const c=n.level===2?"h2":"h3",h=k(n.c,i=>F(i,t));return r.jsxs("div",{className:`docs-h docs-h--${n.level}`,children:[r.jsx(c,{id:H(n.id),tabIndex:-1,children:l}),r.jsx("a",{className:"docs-anchor",href:N(t.slug,n.id),"aria-label":`Link to ${h}`,children:r.jsx(T,{name:"link"})})]},a)}case"p":return r.jsx("p",{children:v(n.c,t,a)},a);case"list":return ce(n,t,a);case"table":{const l=n.head.map(c=>k(c,h=>F(h,t))).join(", ");return r.jsx("div",{className:"table-wrap docs-table",role:"region","aria-label":`Table: ${l}`,tabIndex:0,children:r.jsxs("table",{className:"table",children:[r.jsx("thead",{children:r.jsx("tr",{children:n.head.map((c,h)=>r.jsx("th",{scope:"col",className:V[n.align[h]||"l"],children:v(c,t,`${a}.h${h}`)},h))})}),r.jsx("tbody",{children:n.rows.map((c,h)=>r.jsx("tr",{children:c.map((i,u)=>r.jsx("td",{className:V[n.align[u]||"l"],children:v(i,t,`${a}.${h}.${u}`)},u))},h))})]})},a)}case"quote":return r.jsx("blockquote",{className:"docs-quote stack stack--sm",children:U(n.c,t,a)},a);case"pre":return r.jsx("pre",{className:"docs-code",children:r.jsx("code",{children:v(n.c,t,a)})},a);case"hr":return r.jsx("hr",{},a);case"diagram":{const l=t.diagrams[n.name];if(!l)throw Error(`The docs name an unknown diagram "${n.name}".`);return r.jsx("div",{className:"docs-diagram",children:r.jsx(l,{})},a)}case"callout":{const l=Oe[n.kind],c=n.title?v(n.title,t,`${a}.t`):l.title;return r.jsx("div",{className:`docs-callout docs-callout--${n.kind}`,children:r.jsx(fe,{kind:l.kind,icon:l.icon,title:c,children:r.jsx("div",{className:"stack stack--sm",children:U(n.c,t,a)})})},a)}}})}function De({tree:e,ctx:t}){return r.jsx(r.Fragment,{children:U(e,t)})}const Me=`# Start here

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
`,He=`# Buying

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
`,Re=`# Selling: plead

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
`,Be=`# Your bar

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
`,Fe=`# The judges

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
`,Ue=`# Appeals

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
`,We=`# Letters

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
`,ze=`# The auto-sell box

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
`,qe=`# Objection!

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
`,Ke=`# Seasons and prizes

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
`,Xe=`# Fees

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
`,Ye=`# The pool: cap, burn and the buy wall

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
`,Ve=`# The dead-man

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
`,Qe=`# Keepers

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
`,Je=`# Contracts and owner

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
`,Ze=`# Audits

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
`,et=`# Risks and FAQ

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
`,tt=`# Glossary

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
`,nt={deployment:"PLEA launch #2647 on Ethereum (block 26,293,890)",source:"khaed1/plea, the branch IMD deployed for the Ethereum launch, @ 42e0f855875786a953e945e528e9d7f2724a5352 (its src/; every file:line below is there)",status:"DRAFT by the main session from a first read; every entry must be re-checked, and the hook's mechanics (launch fee curve, cap decay, trim, wall) are still to add",format:"key -> {text: words the docs print, value: raw on-chain value as a decimal string or null, chain: the site's constant key con(s, 'Contract.NAME') or null, format: int|imd|plea|duration|bps|multiplier|text, source: file:line, what: one line}"},st={text:"69",value:"69",chain:"CabalGate.PASS_MARK",format:"int",source:"src/CabalGate.sol:122",what:"need = pass mark - fact score"},ot={text:"45",value:"45",chain:"CabalGate.MAX_PLEA_SCORE",format:"int",source:"src/CabalGate.sol:123",what:"the judges' scale is 0 to 45; a need above 45 cannot pass (CannotPass)"},at={text:"30",value:"30",chain:"CabalGate.PANEL_SIZE",format:"int",source:"src/CabalGate.sol:124",what:"judges on a panel"},rt={text:"17",value:"17",chain:"CabalGate.QUORUM",format:"int",source:"src/CabalGate.sol:125",what:"judges who must agree"},lt={text:"0.5 IMD",value:"500000000000000000",chain:"CabalGate.ORACLE_FEE",format:"imd",source:"src/CabalGate.sol:110",what:"a plea's or an appeal's oracle fee, spent whatever the verdict"},it={text:"0.35 IMD",value:"350000000000000000",chain:"CabalGate.APPEAL_POOL_SHARE",format:"imd",source:"src/CabalGate.sol:111 (paid to the buy wall, :396-400)",what:"an appeal's extra payment, to the buy wall"},ct={text:"7 minutes",value:"420",chain:"CabalGate.EXECUTE_WINDOW",format:"duration",source:"src/CabalGate.sol:112",what:"time to sell after an approval"},ut={text:"4 hours",value:"14400",chain:"CabalGate.COOLDOWN",format:"duration",source:"src/CabalGate.sol:113",what:"after a sale, a denial or a lapse; also the appeal window after a denial (:379)"},ht={text:"20 minutes",value:"1200",chain:"CabalGate.PENDING_EXPIRY",format:"duration",source:"src/CabalGate.sol:114",what:"a plea with no verdict after this can be expired by anyone"},dt={text:"280",value:"280",chain:"CabalGate.MAX_PLEA_BYTES",format:"int",source:"src/CabalGate.sol:115",what:"a plea's text, in UTF-8 bytes (the number alone: a page writes the word bytes after it)"},pt={text:"2,500,000 PLEA",value:"2500000000000000000000000",chain:"CabalGate.MAX_SELL",format:"plea",source:"src/CabalGate.sol:116",what:"most PLEA one plea may sell"},mt={text:"50%",value:"5000",chain:"CabalGate.MAX_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:117",what:"most of the balance one plea may sell"},ft={text:"1%",value:"100",chain:"CabalGate.MIN_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:119; rule :525-532 (at least 1% of the balance, or 2.5M PLEA when that is less)",what:"least share a plea may sell"},wt={text:"33 hours",value:"118800",chain:"CabalGate.DEADMAN",format:"duration",source:"src/CabalGate.sol:147 (immutable); launch.json CabalGate argument 7 = 118800",what:"the Cabal dies after this long without a signed plea verdict"},bt={text:"15 days",value:"1296000",chain:"Seasons.SEASON",format:"duration",source:"src/Seasons.sol:83,107 (from CabalGate.SEASON, launch.json argument 6 = 1296000)",what:"one season"},xt={text:"selling at most 20%: 16 points; at most 35%: 9; more: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:270 (share rounded up, :262-264)",what:"share-sold part of the fact score"},gt={text:"held under a day: 0; a day: 1; 3 days: 2; 7 days: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:301-306",what:"holding-time part (from the buy record's average buy time)"},_t={text:"at a loss: 13; gain at most 50%: 12; at most 200%: 10; at most 500%: 8; at most 1,000%: 6; more: 4",value:null,chain:null,format:"text",source:"src/CabalGate.sol:279-288",what:"profit part (value of the recorded PLEA at the latest price vs the IMD spent)"},vt={text:"PLEA no buy record covers (airdrop, prizes) counts as held since trading opened, at profit 9",value:null,chain:null,format:"text",source:"src/CabalGate.sol:289-291 (PLEA-weighted mean, rounded)",what:"received PLEA"},kt={text:"24-hour price up more than 2%: 9; within 2% (or no price 24 hours ago): 5; down more than 2%: 0",value:null,chain:null,format:"text",source:"src/CabalGate.sol:293-297",what:"trend part"},jt={text:"41",value:"41",chain:null,format:"int",source:"16 + 3 + 13 + 9 (src/CabalGate.sol:270-297)",what:"highest fact score"},Et={text:"28",value:"28",chain:null,format:"int",source:"69 - 41",what:"lowest possible need"},Tt={text:"sincerity 0-12, craft 0-12, respect 0-9, loyalty 0-12; anchors 0-10 empty/abusive/off-topic, 11-25 sincere but plain, 26-35 specific and well made, 36-45 memorable",value:null,chain:null,format:"text",source:'src/CabalGate.sol:133-134 DEFINITIONS ("plea")',what:"what the judges score"},yt={text:"20 minutes",value:"1200",chain:"Tribunal.OBJECTION_WINDOW",format:"duration",source:"src/Tribunal.sol:127",what:"time after an approval to object"},Nt={text:"0.5 IMD",value:"500000000000000000",chain:"Tribunal.ORACLE_FEE",format:"imd",source:"src/Tribunal.sol:130",what:"an objection's oracle fee"},It={text:"0.35 IMD",value:"350000000000000000",chain:"Tribunal.STAKE",format:"imd",source:"src/Tribunal.sol:131",what:"back if sustained or void; to the season's prize pot if overruled (src/Tribunal.sol:40-49)"},At={text:"2",value:"2",chain:"Tribunal.MARGIN",format:"int",source:"src/Tribunal.sol:135; sustained when score + 2 < need (:330)",what:"sustained when the new score is more than 2 below the need"},Pt={text:"2",value:"2",chain:"Tribunal.MAX_OBJECTIONS",format:"int",source:"src/Tribunal.sol:133",what:"objections per plea, from different wallets"},St={text:"20 minutes",value:"1200",chain:"Tribunal.PENDING_EXPIRY",format:"duration",source:"src/Tribunal.sol:129",what:"an unanswered objection becomes void after this"},Lt={text:"60",value:"60",chain:"Seasons.MIN_POINTS",format:"int",source:"src/Seasons.sol:60",what:"points to qualify for a prize"},$t={text:"25",value:"25",chain:"Seasons.TOP",format:"int",source:"src/Seasons.sol:61",what:"ranks paid each season"},Ct={text:"4.50% for 1st down to 3.50% for 25th, in a straight line, 100% in all",value:null,chain:null,format:"text",source:"src/Seasons.sol:75-76 SHARES (450 ... 350 bps)",what:"prize shares"},Gt={text:"1 hour",value:"3600",chain:"Seasons.CLOSE_GRACE",format:"duration",source:"src/Seasons.sol:64",what:"after a season ends, before it can be closed"},Ot={text:"6",value:"6",chain:"Seasons.BONUS_SEASONS",format:"int",source:"src/Seasons.sol:66",what:"seasons that also pay the PLEA bonus"},Dt={text:"10,000,000 PLEA",value:"10000000000000000000000000",chain:"Seasons.BONUS_PER_SEASON",format:"plea",source:"src/Seasons.sol:67",what:"PLEA bonus per season, same shares; unpaid shares are burned"},Mt={text:"×1.2",value:"12000",chain:"Seasons.SEAT_MULTIPLIER_BPS",format:"multiplier",source:"src/Seasons.sol:71",what:"points for an IMD seat holder at recording, rounded down"},Ht={text:"20%",value:"2000",chain:null,format:"bps",source:"src/Letterbox.sol:111 LETTER_SHARE_BPS",what:"a letter pleads 20% of the writer's PLEA (within the 2.5M cap)"},Rt={text:"1,000 PLEA",value:"1000000000000000000000",chain:null,format:"plea",source:"src/Letterbox.sol:113 MIN_LETTER",what:"a smaller letter is refused"},Bt={text:"0.25 IMD",value:"250000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:115 TIP",what:"paid to whoever delivers an approved letter or auto-sell plea; refunded when no sale happens"},Ft={text:"0.35 IMD",value:"350000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:119 AUTO_SELL_FEE",what:"taken from a delivered auto-sell sale, to the season's prize pot (letters do not pay it)"},Ut={text:"0.70 IMD",value:"700000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:124 MIN_SALE_VALUE",what:"a letter or auto-sell plea worth less at the snapshot is refused"},Wt={text:"10%",value:"1000",chain:null,format:"bps",source:"src/Letterbox.sol:136 MAX_FEE_SHARE_BPS",what:"a letter's fees may take at most 10% of the writer's PLEA"},zt={text:"the snapshot value + 10%",value:"11000",chain:null,format:"text",source:"src/Letterbox.sol:134 FEE_CAP_BPS",what:"the fee swap may spend at most the snapshot value of the IMD it buys, plus 10%"},qt={text:"95%",value:"9500",chain:null,format:"bps",source:"src/Letterbox.sol:129 MIN_OUT_BPS",what:"a delivered sale must get at least 95% of its snapshot value after the hook's sale fees"},Kt={text:"2.25%",value:null,chain:null,format:"text",source:"src/PleaHook.sol:73-79 (IMD_FEE_BPS 200 + PLEA_BURN_BPS 25)",what:"every trade's fee"},Xt={text:"0.5%",value:"50",chain:"PleaHook.CASHBACK_BPS",format:"bps",source:"src/PleaHook.sol:74",what:"back to the trader as sIMD (imd/acc's Stacker)"},Yt={text:"1%",value:"100",chain:"PleaHook.OWNER_BPS",format:"bps",source:"src/PleaHook.sol:75",what:"to the owner"},Vt={text:"0.25%",value:"25",chain:"PleaHook.PRIZE_BPS",format:"bps",source:"src/PleaHook.sol:76",what:"to the season's prize pot (to pool liquidity after the death: check)"},Qt={text:"0.25%",value:"25",chain:"PleaHook.POOL_BPS",format:"bps",source:"src/PleaHook.sol:77",what:"to pool liquidity, the buy wall"},Jt={text:"0.25%",value:"25",chain:"PleaHook.PLEA_BURN_BPS",format:"bps",source:"src/PleaHook.sol:79",what:"of the PLEA leg, burned"},Zt={text:"90 minutes",value:"5400",chain:"PleaHook.LAUNCH_WINDOW",format:"duration",source:"src/PleaHook.sol:80",what:"the launch window after trading opens"},en={text:"70%",value:"7000",chain:"PleaHook.LAUNCH_EXTRA_BPS",format:"bps",source:"src/PleaHook.sol:81 (to pool liquidity; the formula is in the hook: check what it is a share of)",what:"the launch fee at the open; it falls in a straight line to 0% over the launch window (the words are the page's)"},tn={text:"5,000,000 PLEA",value:"5000000000000000000000000",chain:"PleaHook.LAUNCH_MAX_BUY",format:"plea",source:"src/PleaHook.sol:82",what:"most PLEA one buy may get in the launch window"},nn={text:"20,000 IMD",value:"20000000000000000000000",chain:"PleaHook.MARKET_CAP_IMD",format:"imd",source:"src/PleaHook.sol:88",what:"the market cap trading opens at"},sn={text:"900,000 PLEA",value:"900000000000000000000000",chain:null,format:"plea",source:"src/PleaHook.sol:89 CAP_FLOOR",what:"the inventory cap's floor"},on={text:"15 days",value:"15",chain:null,format:"int",source:"src/PleaHook.sol:93 CAP_DECAY_DAYS",what:"the cap ratchets to its floor over this"},an={text:"700 ticks (about 7.25%) a day",value:"700",chain:null,format:"int",source:"src/PleaHook.sol:179 WALL_GUARD_TICKS_PER_DAY",what:"how far the wall may move up a day"},rn={text:"1,000,000,000 PLEA",value:"1000000000000000000000000000",chain:"PLEA.TOTAL_SUPPLY",format:"plea",source:"src/PLEA.sol:27",what:"fixed supply"},ln={text:"82% to the pool (820,000,000), 6% to Seasons (60,000,000), 12% to the distributor (120,000,000)",value:null,chain:null,format:"text",source:"src/PLEA.sol (Initialized; 82/6/12 comment at src/PleaLaunch.sol:22); minted on chain at deployHook (HANDOFF)",what:"supply at launch"},cn={text:"Tue 24 Nov 2026, 15:00 UTC",value:"1795532400",chain:"PleaLaunch.START",format:"text",source:"launch.json PleaLaunch argument 9; src/PleaLaunch.sol:70",what:"from this time anyone may seed; the owner may seed earlier"},un={text:"0x5BF3597216f9019Cf10CF680783289Efc8639Bf0",value:null,chain:null,format:"text",source:"launch.json $owner; on chain PLEA.owner()",what:"PLEA's owner"},hn={_meta:nt,pass_mark:st,max_score:ot,panel_size:at,quorum:rt,oracle_fee:lt,appeal_wall_share:it,sell_window:ct,cooldown:ut,pending_expiry:ht,max_plea_bytes:dt,max_sell:pt,max_share:mt,min_share:ft,deadman:wt,season_length:bt,fact_share_bands:xt,fact_held_points:gt,fact_profit_bands:_t,fact_received:vt,fact_trend:kt,fact_max:jt,need_min:Et,judge_rubric:Tt,objection_window:yt,objection_fee:Nt,objection_stake:It,objection_margin:At,max_objections:Pt,objection_expiry:St,min_points:Lt,top:$t,shares:Ct,close_grace:Gt,bonus_seasons:Ot,bonus_per_season:Dt,seat_multiplier:Mt,letter_share:Ht,min_letter:Rt,runner_tip:Bt,auto_sell_fee:Ft,min_sale_value:Ut,max_fee_share:Wt,fee_cap:zt,delivery_min_out:qt,fee_total:Kt,fee_cashback:Xt,fee_owner:Yt,fee_prize:Vt,fee_pool:Qt,fee_burn:Jt,launch_window:Zt,launch_extra:en,launch_max_buy:tn,market_cap:nn,cap_floor:sn,cap_decay_days:on,wall_guard:an,total_supply:rn,supply_split:ln,start:cn,owner:un},A=hn;function ue(e){return{text:t=>{const o=W(A,t,e);if(o===void 0)throw Error(`The docs name an unknown number {{${t}}}.`);return o},value:t=>{if(!(t in A)||t==="_meta")throw Error(`The docs name an unknown number {{${t}}}.`);return Se(A,t,e)}}}const he=x.createContext(ue()),dn=he.Provider,pn=()=>x.useContext(he),D=[{key:"fee_cashback",label:"Back to you, as staked IMD",fill:"var(--approved)",of:"IMD"},{key:"fee_owner",label:"The owner",fill:"var(--objection)",of:"IMD"},{key:"fee_prize",label:"The season’s prize pot",fill:"var(--pending)",of:"IMD"},{key:"fee_pool",label:"The buy wall, kept in the pool",fill:"var(--executed)",of:"IMD"},{key:"fee_burn",label:"Burned",fill:"var(--noverdict)",of:"PLEA"}],S=1e3,M=48;function mn(){const e=pn(),t="fee-bar-"+x.useId().replace(/[^a-zA-Z0-9_-]/g,""),o=D.map(i=>e.value(i.key)??0n),n=o.reduce((i,u)=>i+u,0n),s=o.slice(0,4).reduce((i,u)=>i+u,0n),a=i=>re("bps",i);let l=0;const c=D.map((i,u)=>{const d=n?S*Number(o[u])/Number(n):S/D.length,p={...i,x:l,w:d,n:u+1,text:e.text(i.key)};return l+=d,p}),h=`A bar for the ${a(n)} fee every trade pays, in five numbered parts: `+c.map(i=>`${i.n}, ${i.label[0].toLowerCase()+i.label.slice(1)}: ${i.text} of the ${i.of}`).join("; ")+`. Parts 1 to 4 are ${a(s)} of the trade’s IMD; part 5 is ${c[4].text} of its PLEA.`;return r.jsxs("figure",{className:"docs-figure panel stack stack--md",children:[r.jsxs("figcaption",{className:"docs-figure__title",children:["The ",a(n)," fee on every trade: ",a(s)," of its IMD in four parts, and ",c[4].text," of its PLEA, burned"]}),r.jsxs("div",{className:"docs-bar",children:[r.jsxs("svg",{className:"docs-bar__svg",viewBox:`0 0 ${S} ${M}`,preserveAspectRatio:"none",role:"img","aria-labelledby":`${t}-alt`,children:[r.jsx("title",{id:`${t}-alt`,children:h}),c.map(i=>r.jsx("rect",{x:i.x,y:"0",width:i.w,height:M,style:{fill:i.fill}},i.key)),c.slice(1).map(i=>r.jsx("line",{x1:i.x,y1:"0",x2:i.x,y2:M,vectorEffect:"non-scaling-stroke",style:{stroke:"var(--line)",strokeWidth:i.of==="PLEA"?8:3}},i.key))]}),c.map(i=>r.jsx("span",{className:"docs-bar__key",style:{left:`${(i.x+i.w/2)*100/S}%`},"aria-hidden":"true",children:i.n},i.key))]}),r.jsx(we,{rows:[...c.map(i=>[r.jsxs("span",{className:"docs-key-row",children:[r.jsxs("svg",{className:"docs-key",viewBox:"0 0 28 28","aria-hidden":"true",children:[r.jsx("rect",{x:"1",y:"1",width:"26",height:"26",rx:"4",style:{fill:i.fill,stroke:"var(--line)",strokeWidth:2}}),r.jsx("circle",{cx:"14",cy:"14",r:"9",style:{fill:"var(--day)",stroke:"var(--night)",strokeWidth:1.5}}),r.jsx("text",{x:"14",y:"14",dy:"0.35em",textAnchor:"middle",style:{fill:"var(--night)",fontFamily:"var(--font-body)",fontWeight:800,fontSize:12},children:i.n})]}),r.jsxs("span",{children:[r.jsxs("span",{className:"sr-only",children:["Part ",i.n,": "]}),i.label]})]}),r.jsxs(r.Fragment,{children:[i.text," ",r.jsxs("span",{className:"text-2",children:["of the ",i.of]})]})]),["Every trade",a(n),"total"]]}),r.jsx("p",{className:"small text-2",children:"Once the Cabal is dead there are no more seasons: part 3 joins the pool too."})]})}const fn=Object.assign({"../../../docs/01-start-here.md":Me,"../../../docs/02-buying.md":He,"../../../docs/03-plead.md":Re,"../../../docs/04-your-bar.md":Be,"../../../docs/05-judges.md":Fe,"../../../docs/06-appeals.md":Ue,"../../../docs/07-letters.md":We,"../../../docs/08-auto-sell.md":ze,"../../../docs/09-objection.md":qe,"../../../docs/10-seasons.md":Ke,"../../../docs/11-fees.md":Xe,"../../../docs/12-pool.md":Ye,"../../../docs/13-dead-man.md":Ve,"../../../docs/14-keepers.md":Qe,"../../../docs/15-contracts.md":Je,"../../../docs/16-audits.md":Ze,"../../../docs/17-risks.md":et,"../../../docs/18-glossary.md":tt}),wn=Object.fromEntries(Object.entries(Object.assign({"./diagrams/fee-bar.tsx":mn})).map(([e,t])=>[e.replace(/^.*\/|\.tsx$/g,""),t])),de=e=>W(A,e),pe=y.map(e=>{const t=fn[`../../../docs/${be(e)}`]??`# ${e.title}
`;return{...e,blocks:R(t,de).blocks}}),bn=Le(pe,de);function jn({slug:e,heading:t}){const{statics:o,s:n}=xe(),s=o??n?.constants,a=x.useCallback(p=>W(A,p,s),[s]),l=x.useMemo(()=>ue(s),[s]),c=ge(e),h=c&&pe.find(p=>p.slug===c.slug);x.useEffect(()=>{if(!t)return;const p=document.getElementById(H(t));p&&(p.scrollIntoView(),p.focus({preventScroll:!0}))},[c?.slug,t]);const i=x.useMemo(()=>h?Ae(h.blocks,a):[],[h,a]),{prev:u,next:d}=_e(c?.slug||"");return r.jsx(dn,{value:l,children:r.jsxs("div",{className:"docs",children:[r.jsx(xn,{current:c?.slug}),r.jsxs("article",{className:"docs__page",children:[h?r.jsx("div",{className:"docs-body",children:r.jsx(De,{tree:h.blocks,ctx:{slug:h.slug,num:a,diagrams:wn}})}):r.jsxs("div",{className:"stack stack--lg",children:[r.jsx(ve,{title:"Page not found"}),r.jsx(ke,{title:`No docs page at #/docs/${e}`,action:{href:"#/docs",label:"Start here"},children:"Pick a page from the list, or search the docs."})]}),h&&r.jsxs("nav",{className:"docs-pager","aria-label":"Previous and next page",children:[u&&r.jsxs("a",{className:"docs-pager__link",href:N(u.slug),rel:"prev",children:[r.jsx("span",{className:"label",children:"Previous"}),r.jsxs("span",{className:"docs-pager__title",children:[r.jsx("span",{className:"docs-pager__back",children:r.jsx(T,{name:"arrow-right"})}),u.title]})]}),d&&r.jsxs("a",{className:"docs-pager__link docs-pager__link--next",href:N(d.slug),rel:"next",children:[r.jsx("span",{className:"label",children:"Next"}),r.jsxs("span",{className:"docs-pager__title",children:[d.title,r.jsx(T,{name:"arrow-right"})]})]})]})]}),h&&i.length>0&&r.jsxs("nav",{className:"docs__toc","aria-label":"On this page",children:[r.jsx("p",{className:"label",children:"On this page"}),r.jsx("ul",{children:i.map(p=>r.jsx("li",{className:p.level===3?"docs__toc-sub":void 0,children:r.jsx("a",{href:N(h.slug,p.id),"aria-current":p.id===t?"location":void 0,children:p.text})},p.id))})]})]})})}function xn({current:e}){const[t,o]=x.useState(!1),n=x.useRef(null);x.useEffect(()=>o(!1),[e]);const s=y.findIndex(l=>l.slug===e),a=l=>{l.key==="Escape"&&t&&document.getElementById("docs-pages")?.contains(document.activeElement)?(o(!1),n.current?.focus()):l.key==="Escape"&&t&&document.activeElement===n.current&&o(!1)};return r.jsxs("div",{className:"docs__side",onKeyDown:a,children:[r.jsx(gn,{}),r.jsxs("button",{ref:n,type:"button",className:"docs__toggle","aria-expanded":t,"aria-controls":"docs-pages",onClick:()=>o(!t),children:[r.jsx(T,{name:t?"x":"list"}),r.jsxs("span",{className:"docs__toggle-text",children:[r.jsx("span",{className:"strong",children:"Docs pages"}),s>=0&&r.jsxs("span",{className:"meta",children:[s+1," of ",y.length,": ",y[s].title]})]})]}),r.jsx("nav",{id:"docs-pages",className:`docs-nav${t?" is-open":""}`,"aria-label":"Docs pages",children:r.jsx("ol",{children:y.map(l=>r.jsx("li",{children:r.jsx("a",{href:N(l.slug),"aria-current":l.slug===e?"page":void 0,children:l.title})},l.slug))})})]})}function gn(){const[e,t]=x.useState(""),o=x.useRef(null),n=x.useRef(null),s=8,a=x.useMemo(()=>Ce(bn,e,1/0),[e]),l=a.slice(0,s),c=z(e).join("").length>=2;x.useEffect(()=>{const u=()=>t("");return window.addEventListener("hashchange",u),()=>window.removeEventListener("hashchange",u)},[]);const h=()=>[...n.current?.querySelectorAll("a")||[]],i=(u,d)=>{const p=h();u.key==="ArrowDown"&&p.length?(u.preventDefault(),p[Math.min(d+1,p.length-1)].focus()):u.key==="ArrowUp"?(u.preventDefault(),d<=0?o.current?.focus():p[d-1].focus()):u.key==="Escape"&&e&&(u.preventDefault(),u.stopPropagation(),t(""),o.current?.focus())};return r.jsxs("form",{role:"search",className:"docs-search",onSubmit:u=>{u.preventDefault(),l[0]&&(location.hash=l[0].href)},children:[r.jsx("label",{className:"sr-only",htmlFor:"docs-q",children:"Search the docs"}),r.jsxs("div",{className:"input input--text",children:[r.jsx(T,{name:"magnifying-glass"}),r.jsx("input",{ref:o,id:"docs-q",className:"input__control",type:"search",placeholder:"Search the docs",autoComplete:"off",spellCheck:!1,value:e,"aria-describedby":"docs-q-count","aria-controls":c&&l.length?"docs-results":void 0,onChange:u=>t(u.target.value),onKeyDown:u=>i(u,-1)})]}),r.jsx("p",{id:"docs-q-count",className:"sr-only","aria-live":"polite",children:c?`${a.length||"No"} result${a.length===1?"":"s"}${a.length>s?`, the first ${s} shown`:""}`:""}),c&&(l.length?r.jsxs("ul",{ref:n,id:"docs-results",className:"docs-results","aria-label":"Search results",children:[l.map((u,d)=>r.jsx("li",{children:r.jsxs("a",{href:u.href,onKeyDown:p=>i(p,d),children:[r.jsx("span",{className:"docs-results__where",children:r.jsx(_n,{entry:u.entry})}),u.snippet&&r.jsx("span",{className:"docs-results__text",children:r.jsx(vn,{text:u.snippet,query:e})})]})},u.href)),a.length>s&&r.jsxs("li",{className:"small text-2 docs-results__more","aria-hidden":"true",children:[a.length," sections match; the first ",s," are shown. Add a word to narrow it."]})]}):r.jsxs("p",{className:"small text-2 docs-results__none",children:["No section mentions “",e.trim(),"”."]}))]})}const _n=({entry:e})=>r.jsxs(r.Fragment,{children:[e.page,e.heading&&r.jsxs(r.Fragment,{children:[r.jsx("span",{"aria-hidden":"true",children:" › "}),r.jsx("span",{className:"sr-only",children:", "}),e.heading]})]});function vn({text:e,query:t}){const o=z(t).filter(s=>s.length>1);if(!o.length)return r.jsx(r.Fragment,{children:e});const n=new RegExp(`(${o.map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})`,"gi");return r.jsx(r.Fragment,{children:e.split(n).map((s,a)=>a%2?r.jsx("mark",{children:s},a):s)})}export{jn as default};
