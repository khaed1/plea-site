import{s as fe,j as r,N as me,h as O,I as P,d as L,r as x,C as we,D as A,f as be,u as xe,p as _e,a as ve,T as ge,E as ke}from"./index-BUWL16_k.js";const ye=e=>e.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"section",Ee=/[\\`*_{}\[\]()#+\-.!|>:~<]/;function S(e,t=[]){const o=[],a=s=>{const l=o[o.length-1];l?.t==="text"?l.v+=s:s&&o.push({t:"text",v:s})};let n=0;for(;n<e.length;){const s=e[n];if(s==="\\"&&n+1<e.length&&Ee.test(e[n+1])){a(e[n+1]),n+=2;continue}if(s==="{"&&e.startsWith("{{",n)){const l=e.indexOf("}}",n+2);if(l<0){t.push(`an unclosed placeholder: "${e.slice(n,n+24)}"`),a(e.slice(n));break}o.push({t:"num",key:e.slice(n+2,l).trim()}),n=l+2;continue}if(s==="`"){let l=1;for(;e[n+l]==="`";)l++;const i="`".repeat(l),u=e.indexOf(i,n+l);if(u>0){let c=e.slice(n+l,u);c.startsWith(" ")&&c.endsWith(" ")&&c.trim()&&(c=c.slice(1,-1)),o.push({t:"code",c:Q(c,t)}),n=u+l;continue}a(i),n+=l;continue}if(s==="*"&&e[n+1]==="*"){const l=q(e,n+2,"**");if(l>0){o.push({t:"strong",c:S(e.slice(n+2,l),t)}),n=l+2;continue}}if((s==="*"||s==="_")&&e[n+1]!==s&&Pe(e,n)){const l=q(e,n+1,s);if(l>0){o.push({t:"em",c:S(e.slice(n+1,l),t)}),n=l+1;continue}}if(s==="["){const l=Ae(e,n);if(l>0&&e[l+1]==="("){const i=e.indexOf(")",l+2);if(i>0){o.push({t:"link",href:e.slice(l+2,i).trim(),c:S(e.slice(n+1,l),t)}),n=i+1;continue}}}a(s),n++}return o}function Q(e,t){const o=[];let a=0;for(;a<e.length;){const n=e.indexOf("{{",a);if(n<0)break;const s=e.indexOf("}}",n+2);if(s<0){t.push(`an unclosed placeholder: "${e.slice(n,n+24)}"`);break}n>a&&o.push({t:"text",v:e.slice(a,n)}),o.push({t:"num",key:e.slice(n+2,s).trim()}),a=s+2}return a<e.length&&o.push({t:"text",v:e.slice(a)}),o}const J=e=>e===void 0||/\s/.test(e),Z=e=>!!e&&/[\p{L}\p{N}]/u.test(e);function Pe(e,t){return J(e[t+1])?!1:e[t]==="*"||!Z(e[t-1])}function q(e,t,o){let a=t;for(;a<e.length;){if(e[a]==="\\"){a+=2;continue}if(e[a]==="`"){const n=e.indexOf("`",a+1);if(n>0){a=n+1;continue}}if(e.startsWith(o,a)&&a>t&&!J(e[a-1])){if(o==="*"&&e[a+1]==="*"){a+=2;continue}if(o==="_"&&Z(e[a+1])){a++;continue}return a}a++}return-1}function Ae(e,t){let o=0;for(let a=t;a<e.length;a++){if(e[a]==="\\"){a++;continue}if(e[a]==="["&&o++,e[a]==="]"&&--o===0)return a}return-1}const ee=/^```\s*([\w-]*)\s*$/,te=/^(#{1,6})\s+(.*?)\s*#*\s*$/,ae=/^(?:-{3,}|\*{3,}|_{3,})\s*$/,D=/^:::\s*(.*?)\s*$/,N=/^>\s?/,E=/^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/,Le=/^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/,ne=(e,t)=>/^\s*\|/.test(e[t])&&t+1<e.length&&Le.test(e[t+1].trim()),oe=(e,t)=>{const o=e[t];return ee.test(o)||te.test(o)||ae.test(o)||D.test(o)||N.test(o)||ne(e,t)||E.test(o)&&E.exec(o)[1].length<2};function M(e){let t=e.trim();t.startsWith("|")&&(t=t.slice(1)),t.endsWith("|")&&!t.endsWith("\\|")&&(t=t.slice(0,-1));const o=[];let a="",n=!1;for(let s=0;s<t.length;s++)t[s]==="\\"&&t[s+1]==="|"?(a+="|",s++):t[s]==="`"?(n=!n,a+="`"):t[s]==="|"&&!n?(o.push(a.trim()),a=""):a+=t[s];return o.push(a.trim()),o}function B(e,t=n=>n,o=0,a=new Map){const n=e.replace(/\r\n?/g,`
`).replace(/<!--[\s\S]*?-->/g,h=>h.replace(/[^\n]/g,"")).split(`
`),s=[],l=[],i=(h,d)=>l.push(`line ${o+h+1}: ${d}`),u=(h,d)=>{const p=[],w=S(h,p);for(const f of p)i(d,f);return w};let c=0;for(;c<n.length;){const h=n[c];if(!h.trim()){c++;continue}let d;if(d=ee.exec(h)){const f=c++,b=[];for(;c<n.length&&!/^```\s*$/.test(n[c]);)b.push(n[c++]);c>=n.length&&i(f,"a code block (```) is never closed"),c++;const m=[];s.push({t:"pre",lang:d[1],c:Q(b.join(`
`),m)});for(const v of m)i(f,v);continue}if(d=te.exec(h)){const f=d[1].length;let b=d[2],m="";const v=/\s*\{#([a-z0-9-]+)\}\s*$/.exec(b);v&&(m=v[1],b=b.slice(0,v.index)),f>4&&i(c,`a level-${f} heading: the docs use # to #### only`);const _=u(b,c);m||=ye(k(_,t));const y=a.get(m)||0;a.set(m,y+1),y&&(m=`${m}-${y+1}`),s.push({t:"h",level:Math.min(f,4),id:m,c:_}),c++;continue}if(ae.test(h)){s.push({t:"hr"}),c++;continue}if(d=D.exec(h)){const[f,...b]=d[1].split(/\s+/),m=d[1].slice(f.length).trim();if(f==="diagram"){(!/^[a-z0-9-]+$/.test(m)||b.length!==1)&&i(c,`"::: diagram" needs one name in a-z, 0-9 and -: "${h.trim()}"`),s.push({t:"diagram",name:m,line:o+c+1}),c++;continue}if(f==="note"||f==="warn"||f==="builders"){const v=c++,_=[];for(;c<n.length&&!/^:::\s*$/.test(n[c]);)D.exec(n[c])?.[1]&&!/^diagram\b/.test(D.exec(n[c])[1])&&i(c,"a callout inside a callout: close the first with ::: before opening another"),_.push(n[c++]);c>=n.length&&i(v,`"::: ${f}" is never closed with a line of :::`),c++;const y=B(_.join(`
`),t,o+v+1,a);l.push(...y.errors),s.push({t:"callout",kind:f,title:m?u(m,v):void 0,c:y.blocks});continue}i(c,f?`an unknown block "::: ${f}" (use diagram, note, warn or builders)`:"a ::: that closes nothing"),c++;continue}if(N.test(h)){const f=c,b=[];for(;c<n.length&&N.test(n[c]);)b.push(n[c++].replace(N,""));const m=B(b.join(`
`),t,o+f,a);l.push(...m.errors),s.push({t:"quote",c:m.blocks});continue}if(ne(n,c)){const f=M(h),b=M(n[c+1]).map(_=>_.endsWith(":")?_.startsWith(":")?"c":"r":"l");b.length!==f.length&&i(c,"the table's --- line has a different number of columns from its head");const m=c;c+=2;const v=[];for(;c<n.length&&/^\s*\|/.test(n[c]);){const _=M(n[c]);_.length!==f.length&&i(c,`a table row with ${_.length} cells under a head of ${f.length}`),v.push(_.map(y=>u(y,c))),c++}s.push({t:"table",align:b,head:f.map(_=>u(_,m)),rows:v});continue}if((d=E.exec(h))&&d[1].length<2){const f=je(n,c,u,i);s.push(f.list),c=f.next;continue}const p=c,w=[];for(;c<n.length&&n[c].trim()&&(c===p||!oe(n,c));)w.push(n[c++].trim());s.push({t:"p",c:u(w.join(" "),p)})}return{blocks:s,errors:l}}const I=e=>/\d/.test(e);function je(e,t,o,a){const n=E.exec(e[t]),s={t:"list",ordered:I(n[2]),start:parseInt(n[2])||1,items:[]};let l=t,i=-1,u;const c=[],h=()=>{u&&c.push(u),u=void 0};for(;l<e.length;){const d=e[l];if(!d.trim()){let w=l+1;for(;w<e.length&&!e[w].trim();)w++;const f=w<e.length?E.exec(e[w]):null;if(f&&(f[1].length>=2?s.items.length>0:I(f[2])===s.ordered)){l=w;continue}break}const p=E.exec(d);if(p&&p[1].length<2){if(I(p[2])!==s.ordered)break;h();const w={c:[]};s.items.push(w),u={item:w,parts:[p[3]],line:l},i=-1,l++;continue}if(p&&s.items.length){const w=s.items[s.items.length-1];i<0&&(i=p[1].length),p[1].length>i+1&&a(l,"a list nested more than one level: the docs nest lists one level only"),w.sub||(w.sub={t:"list",ordered:I(p[2]),start:parseInt(p[2])||1,items:[]}),h();const f={c:[]};w.sub.items.push(f),u={item:f,parts:[p[3]],line:l},l++;continue}if(p||oe(e,l))break;u&&u.parts.push(d.trim()),l++}h();for(const d of c)d.item.c=o(d.parts.join(" "),d.line);return{list:s,next:l}}function k(e,t=o=>o){return e.map(o=>o.t==="text"?o.v:o.t==="num"?t(o.key)??o.key:k(o.c,t)).join("")}const Te=(e,t)=>e.filter(o=>o.t==="h"&&(o.level===2||o.level===3)).map(o=>({id:o.id,level:o.level,text:k(o.c,t)}));function se(e){const t=/^(?:\.\/)?(\d\d)-([a-z0-9-]+)\.md(?:#([a-z0-9-]+))?$/.exec(e);return t?`#/docs/${t[2]}${t[3]?`/${t[3]}`:""}`:e}function G(e,t=18){const o=e<0n,a=o?-e:e,n=10n**BigInt(t),s=(a/n).toLocaleString("en-US"),l=(a%n).toString().padStart(t,"0").replace(/0+$/,"");return(o?"−":"")+s+(l?"."+l:"")}const Ie=e=>G(e,2);function re(e,t){let o;try{if(t==null||t==="")return;o=BigInt(t)}catch{return}switch(e){case"int":return o.toLocaleString("en-US");case"imd":return`${G(o)} IMD`;case"plea":return`${G(o)} PLEA`;case"duration":return fe(Number(o));case"bps":return`${Ie(o)}%`;case"multiplier":return`×${G(o,4)}`;default:return}}const K=new Set;function U(e,t,o){const a=t==="_meta"?void 0:e[t];if(!a)return;const n=a.chain?o?.[a.chain]:void 0;if(n==null)return a.text;let s=!0;try{s=a.value!==null&&BigInt(n)===BigInt(a.value)}catch{s=!1}return!s&&!K.has(t)&&(K.add(t),console.warn(`Docs: ${a.chain} on chain is ${String(n)}, numbers.json's ${t} says ${a.value}; the page shows the chain's.`)),a.format==="text"?a.text:re(a.format,n)??a.text}function Ce(e,t,o){const a=t==="_meta"?void 0:e[t];if(!a)return;const n=a.chain?o?.[a.chain]:void 0;try{return n!=null?BigInt(n):a.value===null?void 0:BigInt(a.value)}catch{return}}const le=(e,t)=>e.items.map(o=>k(o.c,t)+(o.sub?" "+le(o.sub,t):"")).join(" ");function F(e,t){switch(e.t){case"p":case"pre":return k(e.c,t);case"list":return le(e,t);case"table":return[e.head,...e.rows].map(o=>o.map(a=>k(a,t)).join(" ")).join(" ");case"quote":return e.c.map(o=>F(o,t)).join(" ");case"callout":return[e.kind==="builders"?"For builders":"",e.title?k(e.title,t):"",...e.c.map(o=>F(o,t))].join(" ");default:return""}}function Se(e,t){const o=[];for(const a of e){let n={slug:a.slug,page:a.title,heading:"",id:"",text:"",order:o.length};const s=[],l=()=>{n.text=s.join(" ").replace(/\s+/g," ").trim(),(n.heading||n.text)&&o.push({...n,order:o.length}),s.length=0};for(const i of a.blocks)if(!(i.t==="h"&&i.level===1)){if(i.t==="h"){l(),n={slug:a.slug,page:a.title,heading:k(i.c,t),id:i.id,text:"",order:0};continue}s.push(F(i,t))}l()}return o}const j=e=>e.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,""),z=e=>j(e).split(/[^\p{L}\p{N}%.×-]+/u).filter(t=>t.length>0),De=(e,t)=>{let o=0,a=e.indexOf(t);for(;a>=0&&o<5;)o++,a=e.indexOf(t,a+t.length);return o},ce=e=>e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),X=(e,t)=>new RegExp(`(^|[^\\p{L}\\p{N}])${ce(t)}`,"u").test(e),Y=(e,t)=>new RegExp(`(^|[^\\p{L}\\p{N}])${ce(t)}($|[^\\p{L}\\p{N}])`,"u").test(e);function Ne(e,t,o=8){const a=z(t);if(a.join("").length<2)return[];const n=a.join(" "),s=[];for(const l of e){const i=j(l.heading),u=j(l.page),c=j(l.text);if(!a.every(d=>i.includes(d)||u.includes(d)||c.includes(d)))continue;let h=a.length>1&&i.includes(n)?20:0;for(const d of a)h+=(X(i,d)?10:0)+(X(u,d)?5:0)+De(c,d)+(Y(i,d)||Y(c,d)?2:0);s.push({e:l,score:h})}return s.sort((l,i)=>i.score-l.score||l.e.order-i.e.order),s.slice(0,o).map(({e:l})=>({entry:l,href:se(`#/docs/${l.slug}${l.id?`/${l.id}`:""}`),snippet:Ge(l.text,a)}))}function Ge(e,t,o=120){const a=j(e),n=Math.min(...t.map(i=>a.indexOf(i)).filter(i=>i>=0),1/0);if(e.length<=o)return e;let s=n===1/0?0:Math.max(0,n-Math.floor(o/3));s>0&&(s=e.indexOf(" ",s)+1||s);let l=Math.min(e.length,s+o);return l<e.length&&(l=e.lastIndexOf(" ",l)>s?e.lastIndexOf(" ",l):l),(s>0?"…":"")+e.slice(s,l)+(l<e.length?"…":"")}const Me={note:{kind:"info",icon:"info",title:void 0},warn:{kind:"warn",icon:"warning",title:void 0},builders:{kind:"builders",icon:"seal-check",title:"For builders"}};function R(e,t){const o=t.num(e);if(o===void 0)throw Error(`The docs name an unknown number {{${e}}}.`);return o}function g(e,t,o="i"){return e.map((a,n)=>{const s=`${o}.${n}`;switch(a.t){case"text":return a.v;case"num":{const l=R(a.key,t);return l.split(" ").length<=3?r.jsx("span",{className:"nowrap",children:l},s):l}case"strong":return r.jsx("strong",{children:g(a.c,t,s)},s);case"em":return r.jsx("em",{children:g(a.c,t,s)},s);case"code":return r.jsx("code",{children:g(a.c,t,s)},s);case"link":{const l=se(a.href);return/^https?:\/\//.test(l)?r.jsxs("a",{href:l,target:"_blank",rel:"noreferrer",className:"docs-ext",children:[g(a.c,t,s),r.jsx(P,{name:"arrow-square-out"}),r.jsx("span",{className:"sr-only",children:" (opens in a new tab)"})]},s):r.jsx("a",{href:l,children:g(a.c,t,s)},s)}}})}function ie(e,t,o){const a=e.items.map((n,s)=>r.jsxs("li",{children:[g(n.c,t,`${o}.${s}`),n.sub&&ie(n.sub,t,`${o}.${s}.s`)]},s));return e.ordered?r.jsx("ol",{start:e.start===1?void 0:e.start,children:a},o):r.jsx("ul",{children:a},o)}const V={l:void 0,c:"c",r:"r"};function W(e,t,o="b"){return e.map((a,n)=>{const s=`${o}.${n}`;switch(a.t){case"h":{const l=g(a.c,t,s);if(a.level===1)return r.jsx("div",{className:"page-title",children:r.jsx("h1",{children:l})},s);if(a.level===4)return r.jsx("h4",{id:O(a.id),tabIndex:-1,children:l},s);const i=a.level===2?"h2":"h3",u=k(a.c,c=>R(c,t));return r.jsxs("div",{className:`docs-h docs-h--${a.level}`,children:[r.jsx(i,{id:O(a.id),tabIndex:-1,children:l}),r.jsx("a",{className:"docs-anchor",href:L(t.slug,a.id),"aria-label":`Link to ${u}`,children:r.jsx(P,{name:"link"})})]},s)}case"p":return r.jsx("p",{children:g(a.c,t,s)},s);case"list":return ie(a,t,s);case"table":{const l=a.head.map(i=>k(i,u=>R(u,t))).join(", ");return r.jsx("div",{className:"table-wrap docs-table",role:"region","aria-label":`Table: ${l}`,tabIndex:0,children:r.jsxs("table",{className:"table",children:[r.jsx("thead",{children:r.jsx("tr",{children:a.head.map((i,u)=>r.jsx("th",{scope:"col",className:V[a.align[u]||"l"],children:g(i,t,`${s}.h${u}`)},u))})}),r.jsx("tbody",{children:a.rows.map((i,u)=>r.jsx("tr",{children:i.map((c,h)=>r.jsx("td",{className:V[a.align[h]||"l"],children:g(c,t,`${s}.${u}.${h}`)},h))},u))})]})},s)}case"quote":return r.jsx("blockquote",{className:"docs-quote stack stack--sm",children:W(a.c,t,s)},s);case"pre":return r.jsx("pre",{className:"docs-code",children:r.jsx("code",{children:g(a.c,t,s)})},s);case"hr":return r.jsx("hr",{},s);case"diagram":{const l=t.diagrams[a.name];if(!l)throw Error(`The docs name an unknown diagram "${a.name}".`);return r.jsx("div",{className:"docs-diagram",children:r.jsx(l,{})},s)}case"callout":{const l=Me[a.kind],i=a.title?g(a.title,t,`${s}.t`):l.title;return r.jsx("div",{className:`docs-callout docs-callout--${a.kind}`,children:r.jsx(me,{kind:l.kind,icon:l.icon,title:i,children:r.jsx("div",{className:"stack stack--sm",children:W(a.c,t,s)})})},s)}}})}function He({tree:e,ctx:t}){return r.jsx(r.Fragment,{children:W(e,t)})}const $e=`# Start here

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
`,Oe=`# Buying

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
`,Be=`# Selling: plead

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
`,Fe=`# Your bar

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
`,Re=`# The judges

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
`,We=`# Appeals

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
`,Ue=`# Letters

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
`,at={deployment:"PLEA launch #2647 on Ethereum (block 26,293,890)",source:"khaed1/plea, the branch IMD deployed for the Ethereum launch, @ 42e0f855875786a953e945e528e9d7f2724a5352 (its src/; every file:line below is there)",status:"Checked 2026-10-29 by the numbers agent: every entry re-read in src/ at 42e0f85 and launch.json; every chain-bound value read from the launched contracts (read-only calls); trading not open yet (PleaHook.seeded false, PleaLaunch.opened false), so seed-time values (the cap's daily allowance) are computed",format:"key -> {text: words the docs print, value: raw on-chain value as a decimal string or null, chain: the site's constant key con(s, 'Contract.NAME') or null, format: int|imd|plea|duration|bps|multiplier|text, source: file:line, what: one line}. Whenever value is set and format is not text, text is format(value) exactly (the unit tests check it)"},nt={text:"69",value:"69",chain:"CabalGate.PASS_MARK",format:"int",source:"src/CabalGate.sol:122; need = PASS_MARK - fact score :433",what:"need = pass mark - fact score; a plea is approved when the judges' score is at least its need (:554)"},ot={text:"45",value:"45",chain:"CabalGate.MAX_PLEA_SCORE",format:"int",source:"src/CabalGate.sol:123; CannotPass :433-434; ScoreOutOfRange :551-552",what:"the judges' scale is 0 to 45; a plea whose need is above 45 is refused (CannotPass)"},st={text:"30",value:"30",chain:"CabalGate.PANEL_SIZE",format:"int",source:"src/CabalGate.sol:124; checked :545-550",what:"judges on a panel (the Cabal)"},rt={text:"17",value:"17",chain:"CabalGate.QUORUM",format:"int",source:"src/CabalGate.sol:125; at least 17 agreed :545-550",what:"judges who must agree for a verdict"},lt={text:"0.5 IMD",value:"500000000000000000",chain:"CabalGate.ORACLE_FEE",format:"imd",source:"src/CabalGate.sol:110; paid to IMD's Intake in _ask :452-463",what:"a plea's or an appeal's oracle fee, in IMD; spent whatever happens (approved, denied, no verdict)"},ct={text:"0.35 IMD",value:"350000000000000000",chain:"CabalGate.APPEAL_POOL_SHARE",format:"imd",source:"src/CabalGate.sol:111; paid to the buy wall by _payAppeal :396-401 (PleaHook.fundWall)",what:"an appeal's extra payment, to the buy wall"},it={text:"0.85 IMD",value:"850000000000000000",chain:null,format:"imd",source:"src/CabalGate.sol:110-111 (0.5 + 0.35), appeal :347-350",what:"what an appeal costs in IMD: the oracle fee plus the wall share"},ht={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:377-378, :382 (NotDenied, AlreadyAppealed); an expired appeal frees its slot :508",what:"appeals per denied plea; an appeal itself cannot be appealed; an appeal that got no verdict may be sent again inside the window, paying again"},ut={text:"7 minutes",value:"420",chain:"CabalGate.EXECUTE_WINDOW",format:"duration",source:"src/CabalGate.sol:112; WindowLapsed :620; lapse :492-496",what:"time to sell after an approval; after it the approval lapses"},dt={text:"4 hours",value:"14400",chain:"CabalGate.COOLDOWN",format:"duration",source:"src/CabalGate.sol:113; _requireCanPlead :469-476, _cooldown :479-482; a lapse is timed from the approval :494",what:"no new plea for this long after a sale, a denial or a lapsed approval (a lapse counts from the approval's time); none after a plea that got no verdict"},pt={text:"4 hours",value:"14400",chain:"CabalGate.COOLDOWN",format:"duration",source:"src/CabalGate.sol:379 (AppealClosed)",what:"an appeal must be sent within this long after the denial"},ft={text:"20 minutes",value:"1200",chain:"CabalGate.PENDING_EXPIRY",format:"duration",source:"src/CabalGate.sol:114; expire :514-521; a later verdict is refused :540-542",what:"a plea with no verdict after this (or once IMD's Intake closed it without one) can be closed by anyone: no cooldown, the fee is spent"},mt={text:"280",value:"280",chain:"CabalGate.MAX_PLEA_BYTES",format:"int",source:"src/CabalGate.sol:115; _validateText :824-865",what:"a plea's text, 1 to 280 bytes of UTF-8 (the number alone: a page writes the word bytes after it)"},wt={text:"2,500,000 PLEA",value:"2500000000000000000000000",chain:"CabalGate.MAX_SELL",format:"plea",source:"src/CabalGate.sol:116; _checkAmount :525-530",what:"most PLEA one plea may sell"},bt={text:"50%",value:"5000",chain:"CabalGate.MAX_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:117; :526",what:"most of your balance one plea may sell"},xt={text:"1%",value:"100",chain:"CabalGate.MIN_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:118-119; :527-529 (AmountTooSmall)",what:"least share of your balance a plea may sell (or 2,500,000 PLEA when 1% is more)"},_t={text:"250,000,000 PLEA",value:"250000000000000000000000000",chain:null,format:"plea",source:"src/CabalGate.sol:523-528 (1% of 250,000,000 = MAX_SELL)",what:"above this balance the 1% minimum is capped at 2,500,000 PLEA, so the least and the most a plea may sell meet"},vt={text:"33 hours",value:"118800",chain:"CabalGate.DEADMAN",format:"duration",source:"src/CabalGate.sol:147, :200-204; launch.json CabalGate argument 7 = 118800; reset only by a signed plea or appeal verdict :557",what:"the Cabal dies after this long without a signed verdict on a plea or an appeal, for good"},gt={text:"15 days",value:"1296000",chain:"Seasons.SEASON",format:"duration",source:"src/Seasons.sol:83,107 = CabalGate.SEASON (src/CabalGate.sol:146; launch.json CabalGate argument 6 = 1296000)",what:"one season; seasons run back to back from the moment trading opens"},kt={text:"selling at most 20%: 16 points; at most 35%: 9; more: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:270 (share rounded up :260-264; an appeal takes the lesser of its share and the original's :266-268, :427-431)",what:"share-sold part of the fact score"},yt={text:"20%",value:"2000",chain:null,format:"bps",source:"src/CabalGate.sol:270",what:"selling at most this share of your PLEA scores the top share points"},Et={text:"35%",value:"3500",chain:null,format:"bps",source:"src/CabalGate.sol:270",what:"selling at most this share (and more than 20%) scores the middle share points"},Pt={text:"16",value:"16",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for selling at most 20% of your PLEA"},At={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for more than 20% and at most 35%"},Lt={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:270",what:"share points for more than 35%"},jt={text:"held under a day: 0; a day: 1; 3 days: 2; 7 days: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:300-305; the time is the buy-weighted average of your buys (src/PleaHook.sol:731-739)",what:"holding-time part of the fact score"},Tt={text:"0",value:"0",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for PLEA held under a day"},It={text:"1",value:"1",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least a day"},Ct={text:"2",value:"2",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least 3 days"},St={text:"3",value:"3",chain:null,format:"int",source:"src/CabalGate.sol:304",what:"holding points for at least 7 days"},Dt={text:"at a loss: 13; gain at most 50%: 12; at most 200%: 10; at most 500%: 8; at most 1,000%: 6; more: 4",value:null,chain:null,format:"text",source:"src/CabalGate.sol:279-288 (the recorded PLEA at the latest hourly price vs the IMD the buys cost, fees included: src/PleaHook.sol:566, :738)",what:"profit part of the fact score"},Nt={text:"13",value:"13",chain:null,format:"int",source:"src/CabalGate.sol:283",what:"profit points at a loss"},Gt={text:"12",value:"12",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 50%"},Mt={text:"10",value:"10",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 200%"},Ht={text:"8",value:"8",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 500%"},$t={text:"6",value:"6",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain of at most 1,000%"},Ot={text:"4",value:"4",chain:null,format:"int",source:"src/CabalGate.sol:287",what:"profit points for a gain above 1,000%"},Bt={text:"50%",value:"5000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g * 2 <= spent)",what:"first profit band edge"},Ft={text:"200%",value:"20000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 2)",what:"second profit band edge"},Rt={text:"500%",value:"50000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 5)",what:"third profit band edge"},Wt={text:"1,000%",value:"100000",chain:null,format:"bps",source:"src/CabalGate.sol:287 (g <= spent * 10)",what:"fourth profit band edge"},Ut={text:"PLEA no buy record covers (airdrop, prizes) counts as held since trading opened, at profit 9",value:null,chain:null,format:"text",source:"src/CabalGate.sol:274-278, :289-292 (PLEA-weighted mean of the record's points and the received points, rounded to the nearest point)",what:"received PLEA"},zt={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:291",what:"profit points for PLEA no buy record covers"},qt={text:"24-hour price up more than 2%: 9; within 2% (or no price 24 hours ago): 5; down more than 2%: 0",value:null,chain:null,format:"text",source:"src/CabalGate.sol:294-297; the hour checkpoints src/PleaHook.sol:294-309",what:"trend part of the fact score"},Kt={text:"2%",value:"200",chain:null,format:"bps",source:"src/CabalGate.sol:296-297 (latest > ago * 102 / 100; latest * 100 >= ago * 98)",what:"how far the price must move in 24 hours to count as up or down"},Xt={text:"9",value:"9",chain:null,format:"int",source:"src/CabalGate.sol:296",what:"trend points when the price rose more than 2% in 24 hours"},Yt={text:"5",value:"5",chain:null,format:"int",source:"src/CabalGate.sol:295, :297",what:"trend points within 2%, or when no price from 24 hours ago exists (the first day)"},Vt={text:"0",value:"0",chain:null,format:"int",source:"src/CabalGate.sol:294-297",what:"trend points when the price fell more than 2%"},Qt={text:"1 hour",value:"3600",chain:null,format:"duration",source:"src/PleaHook.sol:278-309, :1057-1067; src/CabalGate.sol:247-248",what:"prices for the fact score are hourly checkpoints (the price before each hour's first trade), never the spot price"},Jt={text:"48",value:"48",chain:null,format:"int",source:"src/PleaHook.sol:195-198, :300-308",what:"hours of checkpoints kept; the 24-hour price is the newest checkpoint at least 24 and at most 48 hours old"},Zt={text:"41",value:"41",chain:null,format:"int",source:"16 + 3 + 13 + 9 (src/CabalGate.sol:270-297)",what:"highest fact score"},ea={text:"7",value:"7",chain:null,format:"int",source:"3 + 0 + 4 + 0 (src/CabalGate.sol:270-297)",what:"lowest fact score"},ta={text:"28",value:"28",chain:null,format:"int",source:"69 - 41",what:"lowest possible need"},aa={text:"24",value:"24",chain:null,format:"int",source:"69 - 45 (src/CabalGate.sol:433-434)",what:"a fact score under this gives a need above 45: the plea is refused before any fee is paid"},na={text:"sincerity 0-12, craft 0-12, respect 0-9, loyalty 0-12; anchors 0-10 empty/abusive/off-topic, 11-25 sincere but plain, 26-35 specific and well made, 36-45 memorable",value:null,chain:null,format:"text",source:'src/CabalGate.sol:131-134 DEFINITIONS ("plea")',what:"what the judges score"},oa={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for sincerity (an honest, specific reason to sell)"},sa={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for craft (wit, originality, quality of writing, in any language)"},ra={text:"9",value:"9",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for respect (for the Cabal and the holders)"},la={text:"12",value:"12",chain:null,format:"int",source:'src/CabalGate.sol:134 ("plea")',what:"most points for loyalty (commitment to PLEA, such as keeping the rest)"},ca={text:"0-10 empty, abusive or off-topic; 11-25 sincere but plain; 26-35 specific and well made; 36-45 memorable",value:null,chain:null,format:"text",source:'src/CabalGate.sol:134 ("plea")',what:"the judges' anchors"},ia={text:"5",value:"5",chain:null,format:"int",source:'src/CabalGate.sol:134 ("content")',what:"hate, harassment, sexual content, anything illegal, or details that identify another person score 0 to this"},ha={text:"0",value:"0",chain:null,format:"int",source:'src/CabalGate.sol:134 ("manipulation")',what:"what manipulation scores (posing as a system, made-up rules, demands for a score, threats, offers, hidden instructions)"},ua={text:"20%",value:"2000",chain:null,format:"bps",source:"src/Letterbox.sol:111; _plead :297-300",what:"a letter pleads this share of your PLEA (at most 2,500,000 PLEA)"},da={text:"1,000 PLEA",value:"1000000000000000000000",chain:null,format:"plea",source:"src/Letterbox.sol:113; :300 (LetterTooSmall)",what:"a letter whose 20% is smaller is refused"},pa={text:"5,000 PLEA",value:"5000000000000000000000",chain:null,format:"plea",source:"1,000 / 20% (src/Letterbox.sol:111-113, :297-300)",what:"a letter from a smaller balance is refused (its 20% is under 1,000 PLEA)"},fa={text:"0.25 IMD",value:"250000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:115; paid on delivery :424; returned by settle :453",what:"paid to whoever delivers an approved letter or auto-sell plea; returned to you when no sale happens (and to you when you send SELL)"},ma={text:"0.75 IMD",value:"750000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:525-528 feesFor(false) = TIP + ORACLE_FEE (Ethereum buys the oracle fee: PleaLaunch.mintOracleFee() is false)",what:"the IMD a letter or auto-sell plea buys with your PLEA: the 0.5 IMD oracle fee and the 0.25 IMD tip"},wa={text:"1.1 IMD",value:"1100000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:525-528 feesFor(true) = TIP + APPEAL_FEE + ORACLE_FEE",what:"the IMD an appeal letter buys with your PLEA: 0.5 + 0.35 + 0.25"},ba={text:"110%",value:"11000",chain:null,format:"bps",source:"src/Letterbox.sol:133-134, :527; unspent PLEA comes back at once :386-387",what:"the fee sale may spend PLEA worth at most this share of the IMD it buys, at the hourly price"},xa={text:"10%",value:"1000",chain:null,format:"bps",source:"src/Letterbox.sol:135-136; :304 (FeeTooHigh)",what:"a letter's or auto-sell plea's fees may take at most this share of your PLEA"},_a={text:"8.25 IMD",value:"8250000000000000000",chain:null,format:"imd",source:"0.75 IMD x 110% / 10% (src/Letterbox.sol:304, :525-528)",what:"the least your PLEA must be worth, at the hourly price, to send a letter or an auto-sell plea"},va={text:"12.1 IMD",value:"12100000000000000000",chain:null,format:"imd",source:"1.1 IMD x 110% / 10% (src/Letterbox.sol:361-363; or the fees fit in 110% of the original plea's amount)",what:"the least your PLEA must be worth for an appeal letter, unless its fees fit in 110% of the original plea's amount"},ga={text:"0.7 IMD",value:"700000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:120-124; _requireWorthTheFee :428-433 (TooSmallForTheFee)",what:"a letter or auto-sell plea worth less at the hourly price is refused"},ka={text:"95%",value:"9500",chain:null,format:"bps",source:"src/Letterbox.sol:127-129; _deliver :405-406",what:"a delivered sale must get at least 95% of its hourly value after the hook's sale fees"},ya={text:"92.86%",value:null,chain:null,format:"text",source:"95% x (100% - 2.25%) = 92.8625% (src/Letterbox.sol:129-132, :405-406)",what:"the least a delivered sale pays, as a share of the plea's hourly value"},Ea={text:"0.35 IMD",value:"350000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:116-119; _deliver :415-421 (never more than the sale; letters do not pay it)",what:"taken from a delivered auto-sell sale, to the season's prize pot"},Pa={text:"APPEAL followed by your text; SELL; NAME followed by a name; any other text is a new plea",value:null,chain:null,format:"text",source:"src/Letterbox.sol:204-216, :495-519",what:"what a letter's first word does"},Aa={text:"3",value:"3",chain:null,format:"int",source:"src/Letterbox.sol:260-261 (BadName)",what:"shortest display name"},La={text:"20",value:"20",chain:null,format:"int",source:"src/Letterbox.sol:260-261 (BadName)",what:"longest display name"},ja={text:"a-z, 0-9 and _",value:null,chain:null,format:"text",source:"src/Letterbox.sol:262-265",what:"the characters a display name may use"},Ta={text:"cabal, admin, imd, plea, owner",value:null,chain:null,format:"text",source:"src/Letterbox.sol:266-270",what:"names nobody may take"},Ia={text:"20 minutes",value:"1200",chain:"Tribunal.OBJECTION_WINDOW",format:"duration",source:"src/Tribunal.sol:126-127; :263 (WindowClosed)",what:"time after an approval to object; the plea's season points wait for it"},Ca={text:"0.5 IMD",value:"500000000000000000",chain:"Tribunal.ORACLE_FEE",format:"imd",source:"src/Tribunal.sol:130; :291-301",what:"an objection's oracle fee, spent whatever the ruling"},Sa={text:"0.35 IMD",value:"350000000000000000",chain:"Tribunal.STAKE",format:"imd",source:"src/Tribunal.sol:131; :290; settle :370-381",what:"back if sustained or void; to the plea's season prize pot if overruled"},Da={text:"0.85 IMD",value:"850000000000000000",chain:null,format:"imd",source:"src/Tribunal.sol:130-131 (0.5 + 0.35)",what:"what an objection costs in IMD"},Na={text:"2",value:"2",chain:"Tribunal.MARGIN",format:"int",source:"src/Tribunal.sol:134-135; sustained when score + 2 < need :330",what:"sustained only when the new score is more than this below the need"},Ga={text:"2",value:"2",chain:"Tribunal.MAX_OBJECTIONS",format:"int",source:"src/Tribunal.sol:132-133; :268-279",what:"objections per plea, each from a different wallet; both may wait at once"},Ma={text:"20 minutes",value:"1200",chain:"Tribunal.PENDING_EXPIRY",format:"duration",source:"src/Tribunal.sol:128-129; expire :361-368",what:"an objection with no ruling after this is void (stake back, fee spent)"},Ha={text:"280",value:"280",chain:"Tribunal.MAX_TEXT_BYTES",format:"int",source:"src/Tribunal.sol:136; :483-486",what:"an objection's text, in UTF-8 bytes (a page writes the word bytes after it)"},$a={text:"60",value:"60",chain:"Seasons.MIN_POINTS",format:"int",source:"src/Seasons.sol:60; :339, :444",what:"points to qualify for a prize"},Oa={text:"25",value:"25",chain:"Seasons.TOP",format:"int",source:"src/Seasons.sol:61; :338",what:"ranks paid each season"},Ba={text:"3",value:"3",chain:null,format:"int",source:"src/Seasons.sol:86-87, :265-281",what:"your best pleas that count in a season"},Fa={text:"135",value:"135",chain:null,format:"int",source:"3 x 45 (src/Seasons.sol:265-281)",what:"most points a wallet can have in a season without a seat"},Ra={text:"162",value:"162",chain:null,format:"int",source:"3 x 54 (src/Seasons.sol:133-135, :265-281)",what:"most points with an IMD seat"},Wa={text:"4.5% for 1st down to 3.5% for 25th, in a straight line (rounded to whole basis points), 100% in all",value:null,chain:null,format:"text",source:"src/Seasons.sol:74-76 SHARES; shareBps :117-119 (on chain: 450 ... 350, sum 10,000)",what:"prize shares"},Ua={text:"4.5%",value:"450",chain:null,format:"bps",source:"src/Seasons.sol:76; Seasons.shareBps(0) = 450 on chain",what:"the 1st place's share of the pot and of the bonus"},za={text:"3.5%",value:"350",chain:null,format:"bps",source:"src/Seasons.sol:76; Seasons.shareBps(24) = 350 on chain",what:"the 25th place's share"},qa={text:"4.50, 4.46, 4.42, 4.38, 4.33, 4.29, 4.25, 4.21, 4.17, 4.12, 4.08, 4.04, 4.00, 3.96, 3.92, 3.88, 3.83, 3.79, 3.75, 3.71, 3.67, 3.62, 3.58, 3.54, 3.50",value:null,chain:null,format:"text",source:"src/Seasons.sol:76; Seasons.shareBps(0..24) on chain",what:"every rank's share in percent, 1st to 25th"},Ka={text:"1 hour",value:"3600",chain:"Seasons.CLOSE_GRACE",format:"duration",source:"src/Seasons.sol:62-64; :326 (NotReady)",what:"after a season ends, before anyone can close it"},Xa={text:"6",value:"6",chain:"Seasons.BONUS_SEASONS",format:"int",source:"src/Seasons.sol:65-66; :350",what:"seasons that also pay the PLEA bonus"},Ya={text:"10,000,000 PLEA",value:"10000000000000000000000000",chain:"Seasons.BONUS_PER_SEASON",format:"plea",source:"src/Seasons.sol:67; _payBonus :437-460",what:"PLEA bonus per season, same shares and same 60-point bar; unpaid shares are burned"},Va={text:"60,000,000 PLEA",value:"60000000000000000000000000",chain:null,format:"plea",source:"6 x 10,000,000 = Seasons' 6% (src/PLEA.sol:105)",what:"all six seasons' bonus"},Qa={text:"×1.2",value:"12000",chain:"Seasons.SEAT_MULTIPLIER_BPS",format:"multiplier",source:"src/Seasons.sol:68-71; pointsFor :131-135 (rounded down; read when the plea is recorded)",what:"points for an IMD seat holder; points only, never the need or the 60-point bar"},Ja={text:"a score of 45 counts 54 points",value:null,chain:null,format:"text",source:"45 x 12,000 / 10,000 = 54 (src/Seasons.sol:134)",what:"the seat multiplier on the top score"},Za={text:"2.25%",value:"225",chain:null,format:"bps",source:"src/PleaHook.sol:73-79 (IMD_FEE_BPS 200 of the trade's IMD + PLEA_BURN_BPS 25 of its PLEA)",what:"every trade's fee"},en={text:"2%",value:"200",chain:"PleaHook.IMD_FEE_BPS",format:"bps",source:"src/PleaHook.sol:78; a share of the IMD that reaches or leaves the pool :470-472, :551",what:"the IMD part of every trade's fee"},tn={text:"0.5%",value:"50",chain:"PleaHook.CASHBACK_BPS",format:"bps",source:"src/PleaHook.sol:74; :598; _payCashback :758-781",what:"back to the trader as staked IMD (sIMD, imd/acc's Stacker); stays in the pool when no trader is known (after the death)"},an={text:"1%",value:"100",chain:"PleaHook.OWNER_BPS",format:"bps",source:"src/PleaHook.sol:75; :599, :619",what:"to the owner (the hook's fixed fee receiver)"},nn={text:"0.25%",value:"25",chain:"PleaHook.PRIZE_BPS",format:"bps",source:"src/PleaHook.sol:76; :600-601 (to pool liquidity once the Cabal is dead)",what:"to the season's prize pot while the Cabal lives"},on={text:"0.25%",value:"25",chain:"PleaHook.POOL_BPS",format:"bps",source:"src/PleaHook.sol:77; :618, :630-633",what:"kept in the pool for the buy wall"},sn={text:"0.25%",value:"25",chain:"PleaHook.PLEA_BURN_BPS",format:"bps",source:"src/PleaHook.sol:79; :594, :644-654",what:"of the trade's PLEA, burned"},rn={text:"1.75%",value:"175",chain:null,format:"bps",source:"0.5% + 1% + 0.25% (src/PleaHook.sol:598-602)",what:"the IMD fee parts paid out of the pool (cashback, owner, prize)"},ln={text:"90 minutes",value:"5400",chain:"PleaHook.LAUNCH_WINDOW",format:"duration",source:"src/PleaHook.sol:80; launchExtraBps :311-317; max buy :721-725",what:"the launch window after trading opens"},cn={text:"70%",value:"7000",chain:"PleaHook.LAUNCH_EXTRA_BPS",format:"bps",source:"src/PleaHook.sol:81; :311-317, :485-487; a share of the IMD that reaches the pool :470-472; kept for the wall :618",what:"the extra fee on buys at the open; it falls in a straight line to 0% over the launch window; it stays in the pool for the buy wall"},hn={text:"70% at the open, 58.33% after 15 minutes, 46.66% after 30, 35% after 45, 23.33% after 60, 11.66% after 75, 0% from 90",value:null,chain:null,format:"text",source:"7,000 x (5,400 - seconds since the open) / 5,400 basis points, rounded down (src/PleaHook.sol:311-317)",what:"the launch fee over the window"},un={text:"72%",value:"7200",chain:null,format:"bps",source:"2% + 70% (src/PleaHook.sol:485-487)",what:"the IMD fee on a buy at the open, as a share of the IMD that reaches the pool"},dn={text:"41.86%",value:null,chain:null,format:"text",source:"7,200 / 17,200 = 41.86% (src/PleaHook.sol:470-472: fee = amount x rate / (10,000 + rate))",what:"the fee at the open as a share of the IMD a buyer pays"},pn={text:"5,000,000 PLEA",value:"5000000000000000000000000",chain:"PleaHook.LAUNCH_MAX_BUY",format:"plea",source:"src/PleaHook.sol:82; _checkMaxBuy :721-725 (BuyTooLarge); the pool's PLEA out before the burn :474, :538",what:"most PLEA one buy may take from the pool in the launch window"},fn={text:"0.00002 IMD",value:"20000000000000",chain:null,format:"imd",source:"20,000 IMD / 1,000,000,000 PLEA (src/PleaHook.sol:384-389; the opening tick is rounded up to the 60-tick grid :394-396, about 0.23% higher)",what:"the opening price of one PLEA"},mn={text:"about 100 IMD",value:null,chain:null,format:"text",source:"5,000,000 x 0.00002 IMD (before price impact and fees)",what:"what the largest launch-window buy is worth at the opening price"},wn={text:"2 IMD",value:"2000000000000000000",chain:"PleaHook.PAYOUT_RESERVE",format:"imd",source:"src/PleaHook.sol:83-86; :603-617 (PayoutsToPool)",what:"the opening exception: while the pool's own IMD plus a buy's fee is under this and the pool cannot pay out, that buy's cashback, owner and prize shares join the pool instead"},bn={text:"20,000 IMD",value:"20000000000000000000000",chain:"PleaHook.MARKET_CAP_IMD",format:"imd",source:"src/PleaHook.sol:87-88; seed :376-424",what:"the market cap trading opens at"},xn={text:"14,000 IMD",value:"14000000000000000000000",chain:null,format:"imd",source:"src/PleaLaunch.sol:211-214 (BelowAgreedMarketCap)",what:"on Ethereum, seed refuses a hook whose opening market cap is under this"},_n={text:"15 days",value:"1296000",chain:null,format:"duration",source:"src/PleaLaunch.sol:211-212 (BelowAgreedTiming)",what:"on Ethereum, seed refuses seasons shorter than this"},vn={text:"33 hours",value:"118800",chain:null,format:"duration",source:"src/PleaLaunch.sol:211-212 (BelowAgreedTiming)",what:"on Ethereum, seed refuses a dead-man shorter than this"},gn={text:"900,000 PLEA",value:"900000000000000000000000",chain:"PleaHook.CAP_FLOOR",format:"plea",source:"src/PleaHook.sol:89; :803",what:"the inventory cap never falls below this"},kn={text:"15",value:"15",chain:"PleaHook.CAP_DECAY_DAYS",format:"int",source:"src/PleaHook.sol:90-93; capDecayPerDay :409",what:"the cap may fall from the seeded PLEA to its floor in this many days at the fastest (a page writes the word days after it)"},yn={text:"about 54.6 million PLEA",value:null,chain:null,format:"text",source:"(820,000,000 - 900,000) / 15 = 54,606,666 (src/PleaHook.sol:409; the seeded amount is a hair under 820,000,000: the 1-in-a-million rounding margin :1084)",what:"how far the cap may fall per day at most (fixed at the seed)"},En={text:"1 PLEA",value:"1000000000000000000",chain:"PleaHook.MIN_TRIM",format:"plea",source:"src/PleaHook.sol:94; :331-335, :815",what:"the least excess above the cap that is trimmed"},Pn={text:"1 IMD",value:"1000000000000000000",chain:"PleaHook.WALL_THRESHOLD",format:"imd",source:"src/PleaHook.sol:95; pendingRebalance :337-340",what:"kept IMD worth a rebalance"},An={text:"1,000 PLEA",value:"1000000000000000000000",chain:"PleaHook.WALL_MIN_FILL",format:"plea",source:"src/PleaHook.sol:96; :339",what:"PLEA bought by the wall worth a rebalance (it is burned then)"},Ln={text:"700",value:"700",chain:"PleaHook.WALL_GUARD_TICKS_PER_DAY",format:"int",source:"src/PleaHook.sol:178-185; _updateWallGuard :1022-1055",what:"ticks a day the wall's ceiling may rise toward a higher price (it falls at once); a page writes the word ticks after it"},jn={text:"about 7.25%",value:null,chain:null,format:"text",source:"1.0001 ^ 700 = 1.0725",what:"the wall guard's daily step as a price change"},Tn={text:"200",value:"200",chain:null,format:"int",source:"src/PleaHook.sol:177; _observeTick :1002-1014",what:"ticks a block the hook's reference price may move (about 2%)"},In={text:"60",value:"60",chain:"PleaHook.TICK_SPACING",format:"int",source:"src/PleaHook.sol:106",what:"the pool's tick spacing"},Cn={text:"0",value:"0",chain:"PleaHook.LP_FEE",format:"int",source:"src/PleaHook.sol:105",what:"the pool's own swap fee: every fee is the hook's"},Sn={text:"1,400,000",value:"1400000",chain:null,format:"int",source:"creditGas 400,000 + SWAP_RESERVE 1,000,000 (src/PleaHook.sol:99-102, :452; launch.json PleaLaunch argument 8 = 400000)",what:"gas a trade must still have when it reaches the hook, or it reverts NotEnoughGas"},Dn={text:"1,000,000,000 PLEA",value:"1000000000000000000000000000",chain:"PLEA.TOTAL_SUPPLY",format:"plea",source:"src/PLEA.sol:27; minted once in init :98-108",what:"fixed supply"},Nn={text:"820,000,000 PLEA",value:"820000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:104 (82%); on chain PLEA.balanceOf(hook) = 820,000,000 before the seed",what:"the pool's PLEA: all of it is the pool's liquidity"},Gn={text:"60,000,000 PLEA",value:"60000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:105 (6%); on chain PLEA.balanceOf(Seasons)",what:"Seasons' PLEA bonus"},Mn={text:"120,000,000 PLEA",value:"120000000000000000000000000",chain:null,format:"plea",source:"src/PLEA.sol:106 (12%); on chain PLEA.balanceOf(PleaDistributor)",what:"the distributor's PLEA (the swarm's 10% and a 2% airdrop, paid by one Merkle root)"},Hn={text:"82%",value:"8200",chain:null,format:"bps",source:"src/PLEA.sol:104",what:"the pool's share of the supply"},$n={text:"6%",value:"600",chain:null,format:"bps",source:"src/PLEA.sol:105",what:"Seasons' share"},On={text:"12%",value:"1200",chain:null,format:"bps",source:"src/PLEA.sol:106",what:"the distributor's share"},Bn={text:"10%",value:"1000",chain:null,format:"bps",source:"src/PLEA.sol:10-11, src/PleaDistributor.sol:10 (comments: the code pays whatever the owner's root lists)",what:"the swarm's part of the distributor's 12%"},Fn={text:"2%",value:"200",chain:null,format:"bps",source:"src/PLEA.sol:10-11, src/PleaDistributor.sol:10 (comments: the code pays whatever the owner's root lists)",what:"the airdrop's part of the distributor's 12%"},Rn={text:"82% to the pool (820,000,000), 6% to Seasons (60,000,000), 12% to the distributor (120,000,000)",value:null,chain:null,format:"text",source:"src/PLEA.sol:95-108; minted at deployHook (block 26,294,113)",what:"supply at launch"},Wn={text:"Tue 24 Nov 2026, 15:00 UTC",value:"1795532400",chain:"PleaLaunch.START",format:"text",source:"launch.json PleaLaunch argument 9 = 1795532400; src/PleaLaunch.sol:69-70, :206",what:"from this time anyone may open trading (seed); the owner may open it earlier"},Un={text:"0x5BF3597216f9019Cf10CF680783289Efc8639Bf0",value:null,chain:null,format:"text",source:"launch.json $owner; on chain PLEA.owner(), PleaHook.owner(), PleaDistributor.owner()",what:"PLEA's owner, the hook's fee receiver and the distributor's owner"},zn={text:"#2647",value:null,chain:null,format:"text",source:"IMD's launch record (README of the site)",what:"IMD's launch number"},qn={text:"26,293,890",value:"26293890",chain:null,format:"int",source:"Ethereum block of the launch transaction (PLEA's Launched event)",what:"the launch block"},Kn={text:"26,294,106",value:"26294106",chain:null,format:"int",source:"PleaLaunch's LetterboxDeployed event",what:"the Letterbox's block"},Xn={text:"26,294,111",value:"26294111",chain:null,format:"int",source:"PleaLaunch's TribunalDeployed event",what:"the Tribunal's block"},Yn={text:"26,294,113",value:"26294113",chain:null,format:"int",source:"PleaLaunch's HookDeployed event (PLEA minted its supply here)",what:"the hook's block"},Vn={text:"0x1F158929496162b53fB232536468948e25170aB3",value:null,chain:null,format:"text",source:"launch #2647",what:"PLEA (the token)"},Qn={text:"0x39AC882a1161EA19aCb6FBDd7A5835D96CF876EB",value:null,chain:null,format:"text",source:"launch #2647; PLEA.gate()",what:"CabalGate (pleas, verdicts, sales)"},Jn={text:"0xF7c024F7Bc96Cf152a572F6E184318ff6d380738",value:null,chain:null,format:"text",source:"launch #2647; PLEA.seasons()",what:"Seasons (points, prizes)"},Zn={text:"0x97fAcE21C7a9f3b64D0f4E0bF21861721fBBfE3E",value:null,chain:null,format:"text",source:"launch #2647; PLEA.distributor()",what:"PleaDistributor (the 12%)"},eo={text:"0x9e75eabf8d1c905a07a0C99bb9eC9430a065358F",value:null,chain:null,format:"text",source:"launch #2647; PLEA.launcher()",what:"PleaLaunch (wiring, seed)"},to={text:"0x00423EbaEd03445Fc1452d9A79A51E3C0DFdab5f",value:null,chain:null,format:"text",source:"PleaLaunch.letterbox(); PLEA.letterbox()",what:"Letterbox (letters, the auto-sell box)"},ao={text:"0x1aA665eB420F28103324daAAf034DE13EE6f53D9",value:null,chain:null,format:"text",source:"PleaLaunch.tribunal()",what:"Tribunal (Objection!)"},no={text:"0xf1122bc96AdeA8768CFf2badf02b6D4594f928Cc",value:null,chain:null,format:"text",source:"PleaLaunch.hook(); PLEA.hook()",what:"PleaHook (the pool's hook: fees, cap, wall)"},oo={text:"0xD34a99Bc0f67aE1bbd63C660e6d0b0dd03E263B7",value:null,chain:null,format:"text",source:"launch.json CabalGate arguments 3-4",what:"IMD (the pool's other token and the fee token)"},so={text:"0x000000000004444c5dc75cB358380D2e3dE08A90",value:null,chain:null,format:"text",source:"launch.json PleaLaunch argument 5; PLEA.poolManager()",what:"Uniswap v4's PoolManager"},ro={text:"0x06909F672301F28A810f78cfe7a754851269F4F0",value:null,chain:null,format:"text",source:"launch.json PleaLaunch argument 7",what:"imd/acc's Stacker (pays the cashback as sIMD)"},lo={text:"0xa43e6F75ee006411F79Ac1C84120606C2330DE82",value:null,chain:null,format:"text",source:"launch.json CabalGate argument 2",what:"IMD's Intake (asks the Cabal)"},co={text:"0x5598Aa9146215Bc13eb26f2c692Ad1461Fd32982",value:null,chain:null,format:"text",source:"launch.json CabalGate argument 5",what:"the key that signs the Cabal's answers"},io={text:"0x0000eC93127BAA929E58E97dd0095A2BFb38ec1D",value:null,chain:null,format:"text",source:"launch.json Seasons argument 4; Seasons.seat()",what:"the IMD seat NFT (identity.md) behind the seat multiplier"},ho={text:"12",value:"12",chain:null,format:"int",source:"audit/FINDINGS.md Rounds table (rounds 1-12; 9-12 on the Ethereum code, the last on 571ae80, round 12)",what:"IMD swarm audit rounds"},uo={text:"852",value:"852",chain:null,format:"int",source:"README.md:299 (written 2026-10-17 for run 8.5's code; not re-counted for 42e0f85)",what:"the README's test count (unit, fuzz, invariant, adversarial, fork)"},po={_meta:at,pass_mark:nt,max_score:ot,panel_size:st,quorum:rt,oracle_fee:lt,appeal_wall_share:ct,appeal_total:it,appeals_per_plea:ht,sell_window:ut,cooldown:dt,appeal_window:pt,pending_expiry:ft,max_plea_bytes:mt,max_sell:wt,max_share:bt,min_share:xt,min_share_cap_balance:_t,deadman:vt,season_length:gt,fact_share_bands:kt,share_band_top:yt,share_band_mid:Et,fact_share_top:Pt,fact_share_mid:At,fact_share_low:Lt,fact_held_points:jt,held_points_0:Tt,held_points_1d:It,held_points_3d:Ct,held_points_7d:St,fact_profit_bands:Dt,profit_points_loss:Nt,profit_points_50:Gt,profit_points_200:Mt,profit_points_500:Ht,profit_points_1000:$t,profit_points_more:Ot,profit_band_50:Bt,profit_band_200:Ft,profit_band_500:Rt,profit_band_1000:Wt,fact_received:Ut,received_profit:zt,fact_trend:qt,trend_band:Kt,trend_up:Xt,trend_flat:Yt,trend_down:Vt,checkpoint_interval:Qt,price_ring_hours:Jt,fact_max:Zt,fact_min:ea,need_min:ta,fact_needed:aa,judge_rubric:na,judge_sincerity_max:oa,judge_craft_max:sa,judge_respect_max:ra,judge_loyalty_max:la,judge_anchors:ca,judge_content_max:ia,judge_manipulation:ha,letter_share:ua,min_letter:da,letter_min_balance:pa,runner_tip:fa,letter_fee:ma,letter_appeal_fee:wa,fee_cap:ba,max_fee_share:xa,letter_min_value:_a,letter_appeal_min_value:va,min_sale_value:ga,delivery_min_out:ka,delivery_floor:ya,auto_sell_fee:Ea,letter_commands:Pa,name_min_length:Aa,name_max_length:La,name_chars:ja,name_reserved:Ta,objection_window:Ia,objection_fee:Ca,objection_stake:Sa,objection_total:Da,objection_margin:Na,max_objections:Ga,objection_expiry:Ma,objection_bytes:Ha,min_points:$a,top:Oa,best_count:Ba,max_points:Fa,max_points_seat:Ra,shares:Wa,share_first:Ua,share_last:za,shares_list:qa,close_grace:Ka,bonus_seasons:Xa,bonus_per_season:Ya,bonus_total:Va,seat_multiplier:Qa,seat_example:Ja,fee_total:Za,fee_imd:en,fee_cashback:tn,fee_owner:an,fee_prize:nn,fee_pool:on,fee_burn:sn,fee_payouts:rn,launch_window:ln,launch_extra:cn,launch_fee_curve:hn,launch_open_fee:un,launch_open_fee_of_payment:dn,launch_max_buy:pn,seed_price:fn,launch_max_buy_value:mn,payout_reserve:wn,market_cap:bn,market_cap_check:xn,seed_check_season:_n,seed_check_deadman:vn,cap_floor:gn,cap_decay_days:kn,cap_decay_per_day:yn,min_trim:En,wall_threshold:Pn,wall_min_fill:An,wall_guard:Ln,wall_guard_pct:jn,ref_step:Tn,tick_spacing:In,lp_fee:Cn,swap_min_gas:Sn,total_supply:Dn,supply_pool:Nn,supply_seasons:Gn,supply_distributor:Mn,supply_pool_pct:Hn,supply_seasons_pct:$n,supply_distributor_pct:On,supply_swarm_pct:Bn,supply_airdrop_pct:Fn,supply_split:Rn,start:Wn,owner:Un,launch_id:zn,launch_block:qn,letterbox_block:Kn,tribunal_block:Xn,hook_block:Yn,addr_plea:Vn,addr_gate:Qn,addr_seasons:Jn,addr_distributor:Zn,addr_launch:eo,addr_letterbox:to,addr_tribunal:ao,addr_hook:no,addr_imd:oo,addr_pool_manager:so,addr_stacker:ro,addr_intake:lo,addr_oracle_signer:co,addr_seat:io,audit_rounds:ho,tests_count:uo},T=po;function he(e){return{text:t=>{const o=U(T,t,e);if(o===void 0)throw Error(`The docs name an unknown number {{${t}}}.`);return o},value:t=>{if(!(t in T)||t==="_meta")throw Error(`The docs name an unknown number {{${t}}}.`);return Ce(T,t,e)}}}const ue=x.createContext(he()),fo=ue.Provider,mo=()=>x.useContext(ue),H=[{key:"fee_cashback",label:"Back to you, as staked IMD",fill:"var(--approved)",of:"IMD"},{key:"fee_owner",label:"The owner",fill:"var(--objection)",of:"IMD"},{key:"fee_prize",label:"The season’s prize pot",fill:"var(--pending)",of:"IMD"},{key:"fee_pool",label:"The buy wall, kept in the pool",fill:"var(--executed)",of:"IMD"},{key:"fee_burn",label:"Burned",fill:"var(--noverdict)",of:"PLEA"}],C=1e3,$=48;function wo(){const e=mo(),t="fee-bar-"+x.useId().replace(/[^a-zA-Z0-9_-]/g,""),o=H.map(c=>e.value(c.key)??0n),a=o.reduce((c,h)=>c+h,0n),n=o.slice(0,4).reduce((c,h)=>c+h,0n),s=c=>re("bps",c);let l=0;const i=H.map((c,h)=>{const d=a?C*Number(o[h])/Number(a):C/H.length,p={...c,x:l,w:d,n:h+1,text:e.text(c.key)};return l+=d,p}),u=`A bar for the ${s(a)} fee every trade pays, in five numbered parts: `+i.map(c=>`${c.n}, ${c.label[0].toLowerCase()+c.label.slice(1)}: ${c.text} of the ${c.of}`).join("; ")+`. Parts 1 to 4 are ${s(n)} of the trade’s IMD; part 5 is ${i[4].text} of its PLEA.`;return r.jsxs("figure",{className:"docs-figure panel stack stack--md",children:[r.jsxs("figcaption",{className:"docs-figure__title",children:["The ",s(a)," fee on every trade: ",s(n)," of its IMD in four parts, and ",i[4].text," of its PLEA, burned"]}),r.jsxs("div",{className:"docs-bar",children:[r.jsxs("svg",{className:"docs-bar__svg",viewBox:`0 0 ${C} ${$}`,preserveAspectRatio:"none",role:"img","aria-labelledby":`${t}-alt`,children:[r.jsx("title",{id:`${t}-alt`,children:u}),i.map(c=>r.jsx("rect",{x:c.x,y:"0",width:c.w,height:$,style:{fill:c.fill}},c.key)),i.slice(1).map(c=>r.jsx("line",{x1:c.x,y1:"0",x2:c.x,y2:$,vectorEffect:"non-scaling-stroke",style:{stroke:"var(--line)",strokeWidth:c.of==="PLEA"?8:3}},c.key))]}),i.map(c=>r.jsx("span",{className:"docs-bar__key",style:{left:`${(c.x+c.w/2)*100/C}%`},"aria-hidden":"true",children:c.n},c.key))]}),r.jsx(we,{rows:[...i.map(c=>[r.jsxs("span",{className:"docs-key-row",children:[r.jsxs("svg",{className:"docs-key",viewBox:"0 0 28 28","aria-hidden":"true",children:[r.jsx("rect",{x:"1",y:"1",width:"26",height:"26",rx:"4",style:{fill:c.fill,stroke:"var(--line)",strokeWidth:2}}),r.jsx("circle",{cx:"14",cy:"14",r:"9",style:{fill:"var(--day)",stroke:"var(--night)",strokeWidth:1.5}}),r.jsx("text",{x:"14",y:"14",dy:"0.35em",textAnchor:"middle",style:{fill:"var(--night)",fontFamily:"var(--font-body)",fontWeight:800,fontSize:12},children:c.n})]}),r.jsxs("span",{children:[r.jsxs("span",{className:"sr-only",children:["Part ",c.n,": "]}),c.label]})]}),r.jsxs(r.Fragment,{children:[c.text," ",r.jsxs("span",{className:"text-2",children:["of the ",c.of]})]})]),["Every trade",s(a),"total"]]}),r.jsx("p",{className:"small text-2",children:"Once the Cabal is dead there are no more seasons: part 3 joins the pool too."})]})}const bo=Object.assign({"../../../docs/01-start-here.md":$e,"../../../docs/02-buying.md":Oe,"../../../docs/03-plead.md":Be,"../../../docs/04-your-bar.md":Fe,"../../../docs/05-judges.md":Re,"../../../docs/06-appeals.md":We,"../../../docs/07-letters.md":Ue,"../../../docs/08-auto-sell.md":ze,"../../../docs/09-objection.md":qe,"../../../docs/10-seasons.md":Ke,"../../../docs/11-fees.md":Xe,"../../../docs/12-pool.md":Ye,"../../../docs/13-dead-man.md":Ve,"../../../docs/14-keepers.md":Qe,"../../../docs/15-contracts.md":Je,"../../../docs/16-audits.md":Ze,"../../../docs/17-risks.md":et,"../../../docs/18-glossary.md":tt}),xo=Object.fromEntries(Object.entries(Object.assign({"./diagrams/fee-bar.tsx":wo})).map(([e,t])=>[e.replace(/^.*\/|\.tsx$/g,""),t])),de=e=>U(T,e),pe=A.map(e=>{const t=bo[`../../../docs/${be(e)}`]??`# ${e.title}
`;return{...e,blocks:B(t,de).blocks}}),_o=Se(pe,de);function Po({slug:e,heading:t}){const{statics:o,s:a}=xe(),n=o??a?.constants,s=x.useCallback(p=>U(T,p,n),[n]),l=x.useMemo(()=>he(n),[n]),i=_e(e),u=i&&pe.find(p=>p.slug===i.slug);x.useEffect(()=>{if(!t)return;const p=document.getElementById(O(t));p&&(p.scrollIntoView(),p.focus({preventScroll:!0}))},[i?.slug,t]);const c=x.useMemo(()=>u?Te(u.blocks,s):[],[u,s]),{prev:h,next:d}=ve(i?.slug||"");return r.jsx(fo,{value:l,children:r.jsxs("div",{className:"docs",children:[r.jsx(vo,{current:i?.slug}),r.jsxs("article",{className:"docs__page",children:[u?r.jsx("div",{className:"docs-body",children:r.jsx(He,{tree:u.blocks,ctx:{slug:u.slug,num:s,diagrams:xo}})}):r.jsxs("div",{className:"stack stack--lg",children:[r.jsx(ge,{title:"Page not found"}),r.jsx(ke,{title:`No docs page at #/docs/${e}`,action:{href:"#/docs",label:"Start here"},children:"Pick a page from the list, or search the docs."})]}),u&&r.jsxs("nav",{className:"docs-pager","aria-label":"Previous and next page",children:[h&&r.jsxs("a",{className:"docs-pager__link",href:L(h.slug),rel:"prev",children:[r.jsx("span",{className:"label",children:"Previous"}),r.jsxs("span",{className:"docs-pager__title",children:[r.jsx("span",{className:"docs-pager__back",children:r.jsx(P,{name:"arrow-right"})}),h.title]})]}),d&&r.jsxs("a",{className:"docs-pager__link docs-pager__link--next",href:L(d.slug),rel:"next",children:[r.jsx("span",{className:"label",children:"Next"}),r.jsxs("span",{className:"docs-pager__title",children:[d.title,r.jsx(P,{name:"arrow-right"})]})]})]})]}),u&&c.length>0&&r.jsxs("nav",{className:"docs__toc","aria-label":"On this page",children:[r.jsx("p",{className:"label",children:"On this page"}),r.jsx("ul",{children:c.map(p=>r.jsx("li",{className:p.level===3?"docs__toc-sub":void 0,children:r.jsx("a",{href:L(u.slug,p.id),"aria-current":p.id===t?"location":void 0,children:p.text})},p.id))})]})]})})}function vo({current:e}){const[t,o]=x.useState(!1),a=x.useRef(null);x.useEffect(()=>o(!1),[e]);const n=A.findIndex(l=>l.slug===e),s=l=>{l.key==="Escape"&&t&&document.getElementById("docs-pages")?.contains(document.activeElement)?(o(!1),a.current?.focus()):l.key==="Escape"&&t&&document.activeElement===a.current&&o(!1)};return r.jsxs("div",{className:"docs__side",onKeyDown:s,children:[r.jsx(go,{}),r.jsxs("button",{ref:a,type:"button",className:"docs__toggle","aria-expanded":t,"aria-controls":"docs-pages",onClick:()=>o(!t),children:[r.jsx(P,{name:t?"x":"list"}),r.jsxs("span",{className:"docs__toggle-text",children:[r.jsx("span",{className:"strong",children:"Docs pages"}),n>=0&&r.jsxs("span",{className:"meta",children:[n+1," of ",A.length,": ",A[n].title]})]})]}),r.jsx("nav",{id:"docs-pages",className:`docs-nav${t?" is-open":""}`,"aria-label":"Docs pages",children:r.jsx("ol",{children:A.map(l=>r.jsx("li",{children:r.jsx("a",{href:L(l.slug),"aria-current":l.slug===e?"page":void 0,children:l.title})},l.slug))})})]})}function go(){const[e,t]=x.useState(""),o=x.useRef(null),a=x.useRef(null),n=8,s=x.useMemo(()=>Ne(_o,e,1/0),[e]),l=s.slice(0,n),i=z(e).join("").length>=2;x.useEffect(()=>{const h=()=>t("");return window.addEventListener("hashchange",h),()=>window.removeEventListener("hashchange",h)},[]);const u=()=>[...a.current?.querySelectorAll("a")||[]],c=(h,d)=>{const p=u();h.key==="ArrowDown"&&p.length?(h.preventDefault(),p[Math.min(d+1,p.length-1)].focus()):h.key==="ArrowUp"?(h.preventDefault(),d<=0?o.current?.focus():p[d-1].focus()):h.key==="Escape"&&e&&(h.preventDefault(),h.stopPropagation(),t(""),o.current?.focus())};return r.jsxs("form",{role:"search",className:"docs-search",onSubmit:h=>{h.preventDefault(),l[0]&&(location.hash=l[0].href)},children:[r.jsx("label",{className:"sr-only",htmlFor:"docs-q",children:"Search the docs"}),r.jsxs("div",{className:"input input--text",children:[r.jsx(P,{name:"magnifying-glass"}),r.jsx("input",{ref:o,id:"docs-q",className:"input__control",type:"search",placeholder:"Search the docs",autoComplete:"off",spellCheck:!1,value:e,"aria-describedby":"docs-q-count","aria-controls":i&&l.length?"docs-results":void 0,onChange:h=>t(h.target.value),onKeyDown:h=>c(h,-1)})]}),r.jsx("p",{id:"docs-q-count",className:"sr-only","aria-live":"polite",children:i?`${s.length||"No"} result${s.length===1?"":"s"}${s.length>n?`, the first ${n} shown`:""}`:""}),i&&(l.length?r.jsxs("ul",{ref:a,id:"docs-results",className:"docs-results","aria-label":"Search results",children:[l.map((h,d)=>r.jsx("li",{children:r.jsxs("a",{href:h.href,onKeyDown:p=>c(p,d),children:[r.jsx("span",{className:"docs-results__where",children:r.jsx(ko,{entry:h.entry})}),h.snippet&&r.jsx("span",{className:"docs-results__text",children:r.jsx(yo,{text:h.snippet,query:e})})]})},h.href)),s.length>n&&r.jsxs("li",{className:"small text-2 docs-results__more","aria-hidden":"true",children:[s.length," sections match; the first ",n," are shown. Add a word to narrow it."]})]}):r.jsxs("p",{className:"small text-2 docs-results__none",children:["No section mentions “",e.trim(),"”."]}))]})}const ko=({entry:e})=>r.jsxs(r.Fragment,{children:[e.page,e.heading&&r.jsxs(r.Fragment,{children:[r.jsx("span",{"aria-hidden":"true",children:" › "}),r.jsx("span",{className:"sr-only",children:", "}),e.heading]})]});function yo({text:e,query:t}){const o=z(t).filter(n=>n.length>1);if(!o.length)return r.jsx(r.Fragment,{children:e});const a=new RegExp(`(${o.map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})`,"gi");return r.jsx(r.Fragment,{children:e.split(a).map((n,s)=>s%2?r.jsx("mark",{children:n},s):n)})}export{Po as default};
