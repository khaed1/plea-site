import{s as ue,j as r,N as he,h as M,I as y,d as N,r as g,C as de,D as I,f as pe,u as fe,p as me,a as we,T as xe,E as be}from"./index-CbOIhP-g.js";const ge=e=>e.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||"section",_e=/[\\`*_{}\[\]()#+\-.!|>:~<]/;function L(e,t=[]){const a=[],n=o=>{const l=a[a.length-1];l?.t==="text"?l.v+=o:o&&a.push({t:"text",v:o})};let s=0;for(;s<e.length;){const o=e[s];if(o==="\\"&&s+1<e.length&&_e.test(e[s+1])){n(e[s+1]),s+=2;continue}if(o==="{"&&e.startsWith("{{",s)){const l=e.indexOf("}}",s+2);if(l<0){t.push(`an unclosed placeholder: "${e.slice(s,s+24)}"`),n(e.slice(s));break}a.push({t:"num",key:e.slice(s+2,l).trim()}),s=l+2;continue}if(o==="`"){let l=1;for(;e[s+l]==="`";)l++;const h="`".repeat(l),c=e.indexOf(h,s+l);if(c>0){let i=e.slice(s+l,c);i.startsWith(" ")&&i.endsWith(" ")&&i.trim()&&(i=i.slice(1,-1)),a.push({t:"code",c:X(i,t)}),s=c+l;continue}n(h),s+=l;continue}if(o==="*"&&e[s+1]==="*"){const l=z(e,s+2,"**");if(l>0){a.push({t:"strong",c:L(e.slice(s+2,l),t)}),s=l+2;continue}}if((o==="*"||o==="_")&&e[s+1]!==o&&ve(e,s)){const l=z(e,s+1,o);if(l>0){a.push({t:"em",c:L(e.slice(s+1,l),t)}),s=l+1;continue}}if(o==="["){const l=ke(e,s);if(l>0&&e[l+1]==="("){const h=e.indexOf(")",l+2);if(h>0){a.push({t:"link",href:e.slice(l+2,h).trim(),c:L(e.slice(s+1,l),t)}),s=h+1;continue}}}n(o),s++}return a}function X(e,t){const a=[];let n=0;for(;n<e.length;){const s=e.indexOf("{{",n);if(s<0)break;const o=e.indexOf("}}",s+2);if(o<0){t.push(`an unclosed placeholder: "${e.slice(s,s+24)}"`);break}s>n&&a.push({t:"text",v:e.slice(n,s)}),a.push({t:"num",key:e.slice(s+2,o).trim()}),n=o+2}return n<e.length&&a.push({t:"text",v:e.slice(n)}),a}const Y=e=>e===void 0||/\s/.test(e),V=e=>!!e&&/[\p{L}\p{N}]/u.test(e);function ve(e,t){return Y(e[t+1])?!1:e[t]==="*"||!V(e[t-1])}function z(e,t,a){let n=t;for(;n<e.length;){if(e[n]==="\\"){n+=2;continue}if(e[n]==="`"){const s=e.indexOf("`",n+1);if(s>0){n=s+1;continue}}if(e.startsWith(a,n)&&n>t&&!Y(e[n-1])){if(a==="*"&&e[n+1]==="*"){n+=2;continue}if(a==="_"&&V(e[n+1])){n++;continue}return n}n++}return-1}function ke(e,t){let a=0;for(let n=t;n<e.length;n++){if(e[n]==="\\"){n++;continue}if(e[n]==="["&&a++,e[n]==="]"&&--a===0)return n}return-1}const Q=/^```\s*([\w-]*)\s*$/,J=/^(#{1,6})\s+(.*?)\s*#*\s*$/,Z=/^(?:-{3,}|\*{3,}|_{3,})\s*$/,$=/^:::\s*(.*?)\s*$/,C=/^>\s?/,T=/^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/,je=/^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/,ee=(e,t)=>/^\s*\|/.test(e[t])&&t+1<e.length&&je.test(e[t+1].trim()),te=(e,t)=>{const a=e[t];return Q.test(a)||J.test(a)||Z.test(a)||$.test(a)||C.test(a)||ee(e,t)||T.test(a)&&T.exec(a)[1].length<2};function O(e){let t=e.trim();t.startsWith("|")&&(t=t.slice(1)),t.endsWith("|")&&!t.endsWith("\\|")&&(t=t.slice(0,-1));const a=[];let n="",s=!1;for(let o=0;o<t.length;o++)t[o]==="\\"&&t[o+1]==="|"?(n+="|",o++):t[o]==="`"?(s=!s,n+="`"):t[o]==="|"&&!s?(a.push(n.trim()),n=""):n+=t[o];return a.push(n.trim()),a}function H(e,t=s=>s,a=0,n=new Map){const s=e.replace(/\r\n?/g,`
`).replace(/<!--[\s\S]*?-->/g,d=>d.replace(/[^\n]/g,"")).split(`
`),o=[],l=[],h=(d,u)=>l.push(`line ${a+d+1}: ${u}`),c=(d,u)=>{const p=[],m=L(d,p);for(const f of p)h(u,f);return m};let i=0;for(;i<s.length;){const d=s[i];if(!d.trim()){i++;continue}let u;if(u=Q.exec(d)){const f=i++,b=[];for(;i<s.length&&!/^```\s*$/.test(s[i]);)b.push(s[i++]);i>=s.length&&h(f,"a code block (```) is never closed"),i++;const w=[];o.push({t:"pre",lang:u[1],c:X(b.join(`
`),w)});for(const v of w)h(f,v);continue}if(u=J.exec(d)){const f=u[1].length;let b=u[2],w="";const v=/\s*\{#([a-z0-9-]+)\}\s*$/.exec(b);v&&(w=v[1],b=b.slice(0,v.index)),f>4&&h(i,`a level-${f} heading: the docs use # to #### only`);const _=c(b,i);w||=ge(j(_,t));const E=n.get(w)||0;n.set(w,E+1),E&&(w=`${w}-${E+1}`),o.push({t:"h",level:Math.min(f,4),id:w,c:_}),i++;continue}if(Z.test(d)){o.push({t:"hr"}),i++;continue}if(u=$.exec(d)){const[f,...b]=u[1].split(/\s+/),w=u[1].slice(f.length).trim();if(f==="diagram"){(!/^[a-z0-9-]+$/.test(w)||b.length!==1)&&h(i,`"::: diagram" needs one name in a-z, 0-9 and -: "${d.trim()}"`),o.push({t:"diagram",name:w,line:a+i+1}),i++;continue}if(f==="note"||f==="warn"||f==="builders"){const v=i++,_=[];for(;i<s.length&&!/^:::\s*$/.test(s[i]);)$.exec(s[i])?.[1]&&!/^diagram\b/.test($.exec(s[i])[1])&&h(i,"a callout inside a callout: close the first with ::: before opening another"),_.push(s[i++]);i>=s.length&&h(v,`"::: ${f}" is never closed with a line of :::`),i++;const E=H(_.join(`
`),t,a+v+1,n);l.push(...E.errors),o.push({t:"callout",kind:f,title:w?c(w,v):void 0,c:E.blocks});continue}h(i,f?`an unknown block "::: ${f}" (use diagram, note, warn or builders)`:"a ::: that closes nothing"),i++;continue}if(C.test(d)){const f=i,b=[];for(;i<s.length&&C.test(s[i]);)b.push(s[i++].replace(C,""));const w=H(b.join(`
`),t,a+f,n);l.push(...w.errors),o.push({t:"quote",c:w.blocks});continue}if(ee(s,i)){const f=O(d),b=O(s[i+1]).map(_=>_.endsWith(":")?_.startsWith(":")?"c":"r":"l");b.length!==f.length&&h(i,"the table's --- line has a different number of columns from its head");const w=i;i+=2;const v=[];for(;i<s.length&&/^\s*\|/.test(s[i]);){const _=O(s[i]);_.length!==f.length&&h(i,`a table row with ${_.length} cells under a head of ${f.length}`),v.push(_.map(E=>c(E,i))),i++}o.push({t:"table",align:b,head:f.map(_=>c(_,w)),rows:v});continue}if((u=T.exec(d))&&u[1].length<2){const f=Ee(s,i,c,h);o.push(f.list),i=f.next;continue}const p=i,m=[];for(;i<s.length&&s[i].trim()&&(i===p||!te(s,i));)m.push(s[i++].trim());o.push({t:"p",c:c(m.join(" "),p)})}return{blocks:o,errors:l}}const S=e=>/\d/.test(e);function Ee(e,t,a,n){const s=T.exec(e[t]),o={t:"list",ordered:S(s[2]),start:parseInt(s[2])||1,items:[]};let l=t,h=-1,c;const i=[],d=()=>{c&&i.push(c),c=void 0};for(;l<e.length;){const u=e[l];if(!u.trim()){let m=l+1;for(;m<e.length&&!e[m].trim();)m++;const f=m<e.length?T.exec(e[m]):null;if(f&&(f[1].length>=2?o.items.length>0:S(f[2])===o.ordered)){l=m;continue}break}const p=T.exec(u);if(p&&p[1].length<2){if(S(p[2])!==o.ordered)break;d();const m={c:[]};o.items.push(m),c={item:m,parts:[p[3]],line:l},h=-1,l++;continue}if(p&&o.items.length){const m=o.items[o.items.length-1];h<0&&(h=p[1].length),p[1].length>h+1&&n(l,"a list nested more than one level: the docs nest lists one level only"),m.sub||(m.sub={t:"list",ordered:S(p[2]),start:parseInt(p[2])||1,items:[]}),d();const f={c:[]};m.sub.items.push(f),c={item:f,parts:[p[3]],line:l},l++;continue}if(p||te(e,l))break;c&&c.parts.push(u.trim()),l++}d();for(const u of i)u.item.c=a(u.parts.join(" "),u.line);return{list:o,next:l}}function j(e,t=a=>a){return e.map(a=>a.t==="text"?a.v:a.t==="num"?t(a.key)??a.key:j(a.c,t)).join("")}const Te=(e,t)=>e.filter(a=>a.t==="h"&&(a.level===2||a.level===3)).map(a=>({id:a.id,level:a.level,text:j(a.c,t)}));function ne(e){const t=/^(?:\.\/)?(\d\d)-([a-z0-9-]+)\.md(?:#([a-z0-9-]+))?$/.exec(e);return t?`#/docs/${t[2]}${t[3]?`/${t[3]}`:""}`:e}function G(e,t=18){const a=e<0n,n=a?-e:e,s=10n**BigInt(t),o=(n/s).toLocaleString("en-US"),l=(n%s).toString().padStart(t,"0").replace(/0+$/,"");return(a?"−":"")+o+(l?"."+l:"")}const ye=e=>G(e,2);function se(e,t){let a;try{if(t==null||t==="")return;a=BigInt(t)}catch{return}switch(e){case"int":return a.toLocaleString("en-US");case"imd":return`${G(a)} IMD`;case"plea":return`${G(a)} PLEA`;case"duration":return ue(Number(a));case"bps":return`${ye(a)}%`;case"multiplier":return`×${G(a,4)}`;default:return}}const q=new Set;function W(e,t,a){const n=t==="_meta"?void 0:e[t];if(!n)return;const s=n.chain?a?.[n.chain]:void 0;if(s==null)return n.text;let o=!0;try{o=n.value!==null&&BigInt(s)===BigInt(n.value)}catch{o=!1}return!o&&!q.has(t)&&(q.add(t),console.warn(`Docs: ${n.chain} on chain is ${String(s)}, numbers.json's ${t} says ${n.value}; the page shows the chain's.`)),n.format==="text"?n.text:se(n.format,s)??n.text}function Ie(e,t,a){const n=t==="_meta"?void 0:e[t];if(!n)return;const s=n.chain?a?.[n.chain]:void 0;try{return s!=null?BigInt(s):n.value===null?void 0:BigInt(n.value)}catch{return}}const oe=(e,t)=>e.items.map(a=>j(a.c,t)+(a.sub?" "+oe(a.sub,t):"")).join(" ");function B(e,t){switch(e.t){case"p":case"pre":return j(e.c,t);case"list":return oe(e,t);case"table":return[e.head,...e.rows].map(a=>a.map(n=>j(n,t)).join(" ")).join(" ");case"quote":return e.c.map(a=>B(a,t)).join(" ");case"callout":return[e.kind==="builders"?"For builders":"",e.title?j(e.title,t):"",...e.c.map(a=>B(a,t))].join(" ");default:return""}}function Ne(e,t){const a=[];for(const n of e){let s={slug:n.slug,page:n.title,heading:"",id:"",text:"",order:a.length};const o=[],l=()=>{s.text=o.join(" ").replace(/\s+/g," ").trim(),(s.heading||s.text)&&a.push({...s,order:a.length}),o.length=0};for(const h of n.blocks)if(!(h.t==="h"&&h.level===1)){if(h.t==="h"){l(),s={slug:n.slug,page:n.title,heading:j(h.c,t),id:h.id,text:"",order:0};continue}o.push(B(h,t))}l()}return a}const P=e=>e.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g,""),U=e=>P(e).split(/[^\p{L}\p{N}%.×-]+/u).filter(t=>t.length>0),Pe=(e,t)=>{let a=0,n=e.indexOf(t);for(;n>=0&&a<5;)a++,n=e.indexOf(t,n+t.length);return a};function Ae(e,t,a=8){const n=U(t);if(n.join("").length<2)return[];const s=[];for(const o of e){const l=P(o.heading),h=P(o.page),c=P(o.text);let i=0;for(const d of n){const u=(l.includes(d)?10:0)+(h.includes(d)?5:0)+Pe(c,d);if(!u){i=0;break}const p=new RegExp(`(^|[^\\p{L}\\p{N}])${d.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}($|[^\\p{L}\\p{N}])`,"u");i+=u+(p.test(l)||p.test(c)?2:0)}i&&s.push({e:o,score:i})}return s.sort((o,l)=>l.score-o.score||o.e.order-l.e.order),s.slice(0,a).map(({e:o})=>({entry:o,href:ne(`#/docs/${o.slug}${o.id?`/${o.id}`:""}`),snippet:Se(o.text,n)}))}function Se(e,t,a=120){const n=P(e),s=Math.min(...t.map(h=>n.indexOf(h)).filter(h=>h>=0),1/0);if(e.length<=a)return e;let o=s===1/0?0:Math.max(0,s-Math.floor(a/3));o>0&&(o=e.indexOf(" ",o)+1||o);let l=Math.min(e.length,o+a);return l<e.length&&(l=e.lastIndexOf(" ",l)>o?e.lastIndexOf(" ",l):l),(o>0?"…":"")+e.slice(o,l)+(l<e.length?"…":"")}const Le={note:{kind:"info",icon:"info",title:void 0},warn:{kind:"warn",icon:"warning",title:void 0},builders:{kind:"builders",icon:"seal-check",title:"For builders"}};function R(e,t){const a=t.num(e);if(a===void 0)throw Error(`The docs name an unknown number {{${e}}}.`);return a}function k(e,t,a="i"){return e.map((n,s)=>{const o=`${a}.${s}`;switch(n.t){case"text":return n.v;case"num":{const l=R(n.key,t);return l.split(" ").length<=3?r.jsx("span",{className:"nowrap",children:l},o):l}case"strong":return r.jsx("strong",{children:k(n.c,t,o)},o);case"em":return r.jsx("em",{children:k(n.c,t,o)},o);case"code":return r.jsx("code",{children:k(n.c,t,o)},o);case"link":{const l=ne(n.href);return/^https?:\/\//.test(l)?r.jsxs("a",{href:l,target:"_blank",rel:"noreferrer",className:"docs-ext",children:[k(n.c,t,o),r.jsx(y,{name:"arrow-square-out"}),r.jsx("span",{className:"sr-only",children:" (opens in a new tab)"})]},o):r.jsx("a",{href:l,children:k(n.c,t,o)},o)}}})}function ae(e,t,a){const n=e.items.map((s,o)=>r.jsxs("li",{children:[k(s.c,t,`${a}.${o}`),s.sub&&ae(s.sub,t,`${a}.${o}.s`)]},o));return e.ordered?r.jsx("ol",{start:e.start===1?void 0:e.start,children:n},a):r.jsx("ul",{children:n},a)}const K={l:void 0,c:"c",r:"r"};function F(e,t,a="b"){return e.map((n,s)=>{const o=`${a}.${s}`;switch(n.t){case"h":{const l=k(n.c,t,o);if(n.level===1)return r.jsx("div",{className:"page-title",children:r.jsx("h1",{children:l})},o);if(n.level===4)return r.jsx("h4",{id:M(n.id),tabIndex:-1,children:l},o);const h=n.level===2?"h2":"h3",c=j(n.c,i=>R(i,t));return r.jsxs("div",{className:`docs-h docs-h--${n.level}`,children:[r.jsx(h,{id:M(n.id),tabIndex:-1,children:l}),r.jsx("a",{className:"docs-anchor",href:N(t.slug,n.id),"aria-label":`Link to ${c}`,children:r.jsx(y,{name:"link"})})]},o)}case"p":return r.jsx("p",{children:k(n.c,t,o)},o);case"list":return ae(n,t,o);case"table":{const l=n.head.map(h=>j(h,c=>R(c,t))).join(", ");return r.jsx("div",{className:"table-wrap docs-table",role:"region","aria-label":`Table: ${l}`,tabIndex:0,children:r.jsxs("table",{className:"table",children:[r.jsx("thead",{children:r.jsx("tr",{children:n.head.map((h,c)=>r.jsx("th",{scope:"col",className:K[n.align[c]||"l"],children:k(h,t,`${o}.h${c}`)},c))})}),r.jsx("tbody",{children:n.rows.map((h,c)=>r.jsx("tr",{children:h.map((i,d)=>r.jsx("td",{className:K[n.align[d]||"l"],children:k(i,t,`${o}.${c}.${d}`)},d))},c))})]})},o)}case"quote":return r.jsx("blockquote",{className:"docs-quote stack stack--sm",children:F(n.c,t,o)},o);case"pre":return r.jsx("pre",{className:"docs-code",children:r.jsx("code",{children:k(n.c,t,o)})},o);case"hr":return r.jsx("hr",{},o);case"diagram":{const l=t.diagrams[n.name];if(!l)throw Error(`The docs name an unknown diagram "${n.name}".`);return r.jsx("div",{className:"docs-diagram",children:r.jsx(l,{})},o)}case"callout":{const l=Le[n.kind],h=n.title?k(n.title,t,`${o}.t`):l.title;return r.jsx("div",{className:`docs-callout docs-callout--${n.kind}`,children:r.jsx(he,{kind:l.kind,icon:l.icon,title:h,children:r.jsx("div",{className:"stack stack--sm",children:F(n.c,t,o)})})},o)}}})}function $e({tree:e,ctx:t}){return r.jsx(r.Fragment,{children:F(e,t)})}const Ce=`# Start here

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
`,Ge=`# Buying

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
`,Oe=`# Selling: plead

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
`,De=`# Your bar

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
`,Me=`# The judges

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
`,He=`# Appeals

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
`,Be=`# Letters

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
`,Re=`# The auto-sell box

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
`,Fe=`# Objection!

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
`,We=`# Seasons and prizes

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
`,Ue=`# Fees

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
`,ze=`# The pool: cap, burn and the buy wall

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
`,qe=`# The dead-man

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
`,Ke=`# Keepers

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
`,Xe=`# Contracts and owner

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
`,Ye=`# Audits

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
`,Ve=`# Risks and FAQ

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
`,Qe=`# Glossary

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
`,Je={deployment:"PLEA launch #2647 on Ethereum (block 26,293,890)",source:"khaed1/plea mainnet @ 42e0f855875786a953e945e528e9d7f2724a5352 (src/ = /home/user/plea-mainnet/src)",status:"DRAFT by the main session from a first read; every entry must be re-checked, and the hook's mechanics (launch fee curve, cap decay, trim, wall) are still to add",format:"key -> {text: words the docs print, value: raw on-chain value as a decimal string or null, chain: the site's constant key con(s, 'Contract.NAME') or null, format: int|imd|plea|duration|bps|multiplier|text, source: file:line, what: one line}"},Ze={text:"69",value:"69",chain:"CabalGate.PASS_MARK",format:"int",source:"src/CabalGate.sol:122",what:"need = pass mark - fact score"},et={text:"45",value:"45",chain:"CabalGate.MAX_PLEA_SCORE",format:"int",source:"src/CabalGate.sol:123",what:"the judges' scale is 0 to 45; a need above 45 cannot pass (CannotPass)"},tt={text:"30",value:"30",chain:"CabalGate.PANEL_SIZE",format:"int",source:"src/CabalGate.sol:124",what:"judges on a panel"},nt={text:"17",value:"17",chain:"CabalGate.QUORUM",format:"int",source:"src/CabalGate.sol:125",what:"judges who must agree"},st={text:"0.5 IMD",value:"500000000000000000",chain:"CabalGate.ORACLE_FEE",format:"imd",source:"src/CabalGate.sol:110",what:"a plea's or an appeal's oracle fee, spent whatever the verdict"},ot={text:"0.35 IMD",value:"350000000000000000",chain:"CabalGate.APPEAL_POOL_SHARE",format:"imd",source:"src/CabalGate.sol:111 (paid to the buy wall, :396-400)",what:"an appeal's extra payment, to the buy wall"},at={text:"7 minutes",value:"420",chain:"CabalGate.EXECUTE_WINDOW",format:"duration",source:"src/CabalGate.sol:112",what:"time to sell after an approval"},rt={text:"4 hours",value:"14400",chain:"CabalGate.COOLDOWN",format:"duration",source:"src/CabalGate.sol:113",what:"after a sale, a denial or a lapse; also the appeal window after a denial (:379)"},lt={text:"20 minutes",value:"1200",chain:"CabalGate.PENDING_EXPIRY",format:"duration",source:"src/CabalGate.sol:114",what:"a plea with no verdict after this can be expired by anyone"},it={text:"280",value:"280",chain:"CabalGate.MAX_PLEA_BYTES",format:"int",source:"src/CabalGate.sol:115",what:"a plea's text, in UTF-8 bytes (the number alone: a page writes the word bytes after it)"},ct={text:"2,500,000 PLEA",value:"2500000000000000000000000",chain:"CabalGate.MAX_SELL",format:"plea",source:"src/CabalGate.sol:116",what:"most PLEA one plea may sell"},ut={text:"50%",value:"5000",chain:"CabalGate.MAX_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:117",what:"most of the balance one plea may sell"},ht={text:"1%",value:"100",chain:"CabalGate.MIN_SHARE_BPS",format:"bps",source:"src/CabalGate.sol:119; rule :525-532 (at least 1% of the balance, or 2.5M PLEA when that is less)",what:"least share a plea may sell"},dt={text:"33 hours",value:"118800",chain:"CabalGate.DEADMAN",format:"duration",source:"src/CabalGate.sol:147 (immutable); launch.json CabalGate argument 7 = 118800",what:"the Cabal dies after this long without a signed plea verdict"},pt={text:"15 days",value:"1296000",chain:"Seasons.SEASON",format:"duration",source:"src/Seasons.sol:83,107 (from CabalGate.SEASON, launch.json argument 6 = 1296000)",what:"one season"},ft={text:"selling at most 20%: 16 points; at most 35%: 9; more: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:270 (share rounded up, :262-264)",what:"share-sold part of the fact score"},mt={text:"held under a day: 0; a day: 1; 3 days: 2; 7 days: 3",value:null,chain:null,format:"text",source:"src/CabalGate.sol:301-306",what:"holding-time part (from the buy record's average buy time)"},wt={text:"at a loss: 13; gain at most 50%: 12; at most 200%: 10; at most 500%: 8; at most 1,000%: 6; more: 4",value:null,chain:null,format:"text",source:"src/CabalGate.sol:279-288",what:"profit part (value of the recorded PLEA at the latest price vs the IMD spent)"},xt={text:"PLEA no buy record covers (airdrop, prizes) counts as held since trading opened, at profit 9",value:null,chain:null,format:"text",source:"src/CabalGate.sol:289-291 (PLEA-weighted mean, rounded)",what:"received PLEA"},bt={text:"24-hour price up more than 2%: 9; within 2% (or no price 24 hours ago): 5; down more than 2%: 0",value:null,chain:null,format:"text",source:"src/CabalGate.sol:293-297",what:"trend part"},gt={text:"41",value:"41",chain:null,format:"int",source:"16 + 3 + 13 + 9 (src/CabalGate.sol:270-297)",what:"highest fact score"},_t={text:"28",value:"28",chain:null,format:"int",source:"69 - 41",what:"lowest possible need"},vt={text:"sincerity 0-12, craft 0-12, respect 0-9, loyalty 0-12; anchors 0-10 empty/abusive/off-topic, 11-25 sincere but plain, 26-35 specific and well made, 36-45 memorable",value:null,chain:null,format:"text",source:'src/CabalGate.sol:133-134 DEFINITIONS ("plea")',what:"what the judges score"},kt={text:"20 minutes",value:"1200",chain:"Tribunal.OBJECTION_WINDOW",format:"duration",source:"src/Tribunal.sol:127",what:"time after an approval to object"},jt={text:"0.5 IMD",value:"500000000000000000",chain:"Tribunal.ORACLE_FEE",format:"imd",source:"src/Tribunal.sol:130",what:"an objection's oracle fee"},Et={text:"0.35 IMD",value:"350000000000000000",chain:"Tribunal.STAKE",format:"imd",source:"src/Tribunal.sol:131",what:"back if sustained or void; to the season's prize pot if overruled (src/Tribunal.sol:40-49)"},Tt={text:"2",value:"2",chain:"Tribunal.MARGIN",format:"int",source:"src/Tribunal.sol:135; sustained when score + 2 < need (:330)",what:"sustained when the new score is more than 2 below the need"},yt={text:"2",value:"2",chain:"Tribunal.MAX_OBJECTIONS",format:"int",source:"src/Tribunal.sol:133",what:"objections per plea, from different wallets"},It={text:"20 minutes",value:"1200",chain:"Tribunal.PENDING_EXPIRY",format:"duration",source:"src/Tribunal.sol:129",what:"an unanswered objection becomes void after this"},Nt={text:"60",value:"60",chain:"Seasons.MIN_POINTS",format:"int",source:"src/Seasons.sol:60",what:"points to qualify for a prize"},Pt={text:"25",value:"25",chain:"Seasons.TOP",format:"int",source:"src/Seasons.sol:61",what:"ranks paid each season"},At={text:"4.50% for 1st down to 3.50% for 25th, in a straight line, 100% in all",value:null,chain:null,format:"text",source:"src/Seasons.sol:75-76 SHARES (450 ... 350 bps)",what:"prize shares"},St={text:"1 hour",value:"3600",chain:"Seasons.CLOSE_GRACE",format:"duration",source:"src/Seasons.sol:64",what:"after a season ends, before it can be closed"},Lt={text:"6",value:"6",chain:"Seasons.BONUS_SEASONS",format:"int",source:"src/Seasons.sol:66",what:"seasons that also pay the PLEA bonus"},$t={text:"10,000,000 PLEA",value:"10000000000000000000000000",chain:"Seasons.BONUS_PER_SEASON",format:"plea",source:"src/Seasons.sol:67",what:"PLEA bonus per season, same shares; unpaid shares are burned"},Ct={text:"×1.2",value:"12000",chain:"Seasons.SEAT_MULTIPLIER_BPS",format:"multiplier",source:"src/Seasons.sol:71",what:"points for an IMD seat holder at recording, rounded down"},Gt={text:"20%",value:"2000",chain:null,format:"bps",source:"src/Letterbox.sol:111 LETTER_SHARE_BPS",what:"a letter pleads 20% of the writer's PLEA (within the 2.5M cap)"},Ot={text:"1,000 PLEA",value:"1000000000000000000000",chain:null,format:"plea",source:"src/Letterbox.sol:113 MIN_LETTER",what:"a smaller letter is refused"},Dt={text:"0.25 IMD",value:"250000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:115 TIP",what:"paid to whoever delivers an approved letter or auto-sell plea; refunded when no sale happens"},Mt={text:"0.35 IMD",value:"350000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:119 AUTO_SELL_FEE",what:"taken from a delivered auto-sell sale, to the season's prize pot (letters do not pay it)"},Ht={text:"0.70 IMD",value:"700000000000000000",chain:null,format:"imd",source:"src/Letterbox.sol:124 MIN_SALE_VALUE",what:"a letter or auto-sell plea worth less at the snapshot is refused"},Bt={text:"10%",value:"1000",chain:null,format:"bps",source:"src/Letterbox.sol:136 MAX_FEE_SHARE_BPS",what:"a letter's fees may take at most 10% of the writer's PLEA"},Rt={text:"the snapshot value + 10%",value:"11000",chain:null,format:"text",source:"src/Letterbox.sol:134 FEE_CAP_BPS",what:"the fee swap may spend at most the snapshot value of the IMD it buys, plus 10%"},Ft={text:"95%",value:"9500",chain:null,format:"bps",source:"src/Letterbox.sol:129 MIN_OUT_BPS",what:"a delivered sale must get at least 95% of its snapshot value after the hook's sale fees"},Wt={text:"2.25%",value:null,chain:null,format:"text",source:"src/PleaHook.sol:73-79 (IMD_FEE_BPS 200 + PLEA_BURN_BPS 25)",what:"every trade's fee"},Ut={text:"0.5%",value:"50",chain:"PleaHook.CASHBACK_BPS",format:"bps",source:"src/PleaHook.sol:74",what:"back to the trader as sIMD (imd/acc's Stacker)"},zt={text:"1%",value:"100",chain:"PleaHook.OWNER_BPS",format:"bps",source:"src/PleaHook.sol:75",what:"to the owner"},qt={text:"0.25%",value:"25",chain:"PleaHook.PRIZE_BPS",format:"bps",source:"src/PleaHook.sol:76",what:"to the season's prize pot (to pool liquidity after the death: check)"},Kt={text:"0.25%",value:"25",chain:"PleaHook.POOL_BPS",format:"bps",source:"src/PleaHook.sol:77",what:"to pool liquidity, the buy wall"},Xt={text:"0.25%",value:"25",chain:"PleaHook.PLEA_BURN_BPS",format:"bps",source:"src/PleaHook.sol:79",what:"of the PLEA leg, burned"},Yt={text:"90 minutes",value:"5400",chain:"PleaHook.LAUNCH_WINDOW",format:"duration",source:"src/PleaHook.sol:80",what:"the launch window after trading opens"},Vt={text:"70%",value:"7000",chain:"PleaHook.LAUNCH_EXTRA_BPS",format:"bps",source:"src/PleaHook.sol:81 (to pool liquidity; the formula is in the hook: check what it is a share of)",what:"the launch fee at the open; it falls in a straight line to 0% over the launch window (the words are the page's)"},Qt={text:"5,000,000 PLEA",value:"5000000000000000000000000",chain:"PleaHook.LAUNCH_MAX_BUY",format:"plea",source:"src/PleaHook.sol:82",what:"most PLEA one buy may get in the launch window"},Jt={text:"20,000 IMD",value:"20000000000000000000000",chain:"PleaHook.MARKET_CAP_IMD",format:"imd",source:"src/PleaHook.sol:88",what:"the market cap trading opens at"},Zt={text:"900,000 PLEA",value:"900000000000000000000000",chain:null,format:"plea",source:"src/PleaHook.sol:89 CAP_FLOOR",what:"the inventory cap's floor"},en={text:"15 days",value:"15",chain:null,format:"int",source:"src/PleaHook.sol:93 CAP_DECAY_DAYS",what:"the cap ratchets to its floor over this"},tn={text:"700 ticks (about 7.25%) a day",value:"700",chain:null,format:"int",source:"src/PleaHook.sol:179 WALL_GUARD_TICKS_PER_DAY",what:"how far the wall may move up a day"},nn={text:"1,000,000,000 PLEA",value:"1000000000000000000000000000",chain:"PLEA.TOTAL_SUPPLY",format:"plea",source:"src/PLEA.sol:27",what:"fixed supply"},sn={text:"82% to the pool (820,000,000), 6% to Seasons (60,000,000), 12% to the distributor (120,000,000)",value:null,chain:null,format:"text",source:"src/PLEA.sol (Initialized; 82/6/12 comment at src/PleaLaunch.sol:22); minted on chain at deployHook (HANDOFF)",what:"supply at launch"},on={text:"Tue 24 Nov 2026, 15:00 UTC",value:"1795532400",chain:"PleaLaunch.START",format:"text",source:"launch.json PleaLaunch argument 9; src/PleaLaunch.sol:70",what:"from this time anyone may seed; the owner may seed earlier"},an={text:"0x5BF3597216f9019Cf10CF680783289Efc8639Bf0",value:null,chain:null,format:"text",source:"launch.json $owner; on chain PLEA.owner()",what:"PLEA's owner"},rn={_meta:Je,pass_mark:Ze,max_score:et,panel_size:tt,quorum:nt,oracle_fee:st,appeal_wall_share:ot,sell_window:at,cooldown:rt,pending_expiry:lt,max_plea_bytes:it,max_sell:ct,max_share:ut,min_share:ht,deadman:dt,season_length:pt,fact_share_bands:ft,fact_held_points:mt,fact_profit_bands:wt,fact_received:xt,fact_trend:bt,fact_max:gt,need_min:_t,judge_rubric:vt,objection_window:kt,objection_fee:jt,objection_stake:Et,objection_margin:Tt,max_objections:yt,objection_expiry:It,min_points:Nt,top:Pt,shares:At,close_grace:St,bonus_seasons:Lt,bonus_per_season:$t,seat_multiplier:Ct,letter_share:Gt,min_letter:Ot,runner_tip:Dt,auto_sell_fee:Mt,min_sale_value:Ht,max_fee_share:Bt,fee_cap:Rt,delivery_min_out:Ft,fee_total:Wt,fee_cashback:Ut,fee_owner:zt,fee_prize:qt,fee_pool:Kt,fee_burn:Xt,launch_window:Yt,launch_extra:Vt,launch_max_buy:Qt,market_cap:Jt,cap_floor:Zt,cap_decay_days:en,wall_guard:tn,total_supply:nn,supply_split:sn,start:on,owner:an},A=rn;function re(e){return{text:t=>{const a=W(A,t,e);if(a===void 0)throw Error(`The docs name an unknown number {{${t}}}.`);return a},value:t=>{if(!(t in A)||t==="_meta")throw Error(`The docs name an unknown number {{${t}}}.`);return Ie(A,t,e)}}}const le=g.createContext(re()),ln=le.Provider,cn=()=>g.useContext(le),D=[{key:"fee_cashback",label:"Back to you, as staked IMD",fill:"var(--approved)",of:"IMD"},{key:"fee_owner",label:"The owner",fill:"var(--objection)",of:"IMD"},{key:"fee_prize",label:"The season’s prize pot",fill:"var(--pending)",of:"IMD"},{key:"fee_pool",label:"The buy wall, kept in the pool",fill:"var(--executed)",of:"IMD"},{key:"fee_burn",label:"Burned",fill:"",of:"PLEA"}],un=360,hn=64,x={x:1.5,y:8,w:357,h:48};function dn(){const e=cn(),t="fee-bar-"+g.useId().replace(/[^a-zA-Z0-9_-]/g,""),a=D.map(u=>e.value(u.key)??0n),n=a.reduce((u,p)=>u+p,0n),s=a.slice(0,4).reduce((u,p)=>u+p,0n),o=u=>se("bps",u);let l=x.x;const h=D.map((u,p)=>{const m=n?x.w*Number(a[p])/Number(n):x.w/D.length,f={...u,x:l,w:m,n:p+1,text:e.text(u.key)};return l+=m,f}),c=`${t}-hatch`,i=`${t}-clip`,d=`A bar for the ${o(n)} fee every trade pays, in five numbered parts: `+h.map(u=>`${u.n}, ${u.label.toLowerCase()}: ${u.text} of the ${u.of}`).join("; ")+`. Parts 1 to 4 are ${o(s)} of the trade’s IMD; part 5 is ${h[4].text} of its PLEA.`;return r.jsxs("figure",{className:"docs-figure panel stack stack--md",children:[r.jsxs("figcaption",{className:"docs-figure__title",children:["The ",o(n)," fee on every trade: ",o(s)," of its IMD in four parts, and ",h[4].text," of its PLEA, burned"]}),r.jsxs("svg",{className:"docs-figure__svg",viewBox:`0 0 ${un} ${hn}`,role:"img","aria-labelledby":`${t}-alt`,style:{maxWidth:560},children:[r.jsx("title",{id:`${t}-alt`,children:d}),r.jsxs("defs",{children:[r.jsxs("pattern",{id:c,width:"8",height:"8",patternUnits:"userSpaceOnUse",patternTransform:"rotate(45)",children:[r.jsx("rect",{width:"8",height:"8",style:{fill:"var(--noverdict)"}}),r.jsx("line",{x1:"0",y1:"0",x2:"0",y2:"8",style:{stroke:"var(--night)",strokeWidth:3}})]}),r.jsx("clipPath",{id:i,children:r.jsx("rect",{x:x.x,y:x.y,width:x.w,height:x.h,rx:"8"})})]}),r.jsx("g",{clipPath:`url(#${i})`,children:h.map(u=>r.jsx("rect",{x:u.x,y:x.y,width:u.w,height:x.h,style:{fill:u.fill||`url(#${c})`}},u.key))}),h.slice(1).map(u=>r.jsx("line",{x1:u.x,y1:x.y,x2:u.x,y2:x.y+x.h,style:{stroke:"var(--line)",strokeWidth:3}},u.key)),r.jsx("rect",{x:x.x,y:x.y,width:x.w,height:x.h,rx:"8",style:{fill:"none",stroke:"var(--line)",strokeWidth:3}}),h.map(u=>r.jsxs("g",{children:[r.jsx("circle",{cx:u.x+u.w/2,cy:x.y+x.h/2,r:"11",style:{fill:"var(--day)",stroke:"var(--night)",strokeWidth:2}}),r.jsx("text",{x:u.x+u.w/2,y:x.y+x.h/2,dy:"0.35em",textAnchor:"middle",style:{fill:"var(--night)",fontFamily:"var(--font-body)",fontWeight:800,fontSize:14},children:u.n})]},u.key))]}),r.jsx(de,{rows:[...h.map(u=>[r.jsxs("span",{className:"docs-key-row",children:[r.jsxs("svg",{className:"docs-key",viewBox:"0 0 28 28","aria-hidden":"true",children:[r.jsx("rect",{x:"1",y:"1",width:"26",height:"26",rx:"4",style:{fill:u.fill||`url(#${c})`,stroke:"var(--line)",strokeWidth:2}}),r.jsx("circle",{cx:"14",cy:"14",r:"9",style:{fill:"var(--day)",stroke:"var(--night)",strokeWidth:1.5}}),r.jsx("text",{x:"14",y:"14",dy:"0.35em",textAnchor:"middle",style:{fill:"var(--night)",fontFamily:"var(--font-body)",fontWeight:800,fontSize:12},children:u.n})]}),r.jsxs("span",{children:[r.jsxs("span",{className:"sr-only",children:["Part ",u.n,": "]}),u.label]})]}),r.jsxs(r.Fragment,{children:[u.text," ",r.jsxs("span",{className:"text-2",children:["of the ",u.of]})]})]),["Every trade",o(n),"total"]]}),r.jsx("p",{className:"small text-2",children:"Once the Cabal is dead there are no more seasons: part 3 joins the pool too."})]})}const pn=Object.assign({"../../../docs/01-start-here.md":Ce,"../../../docs/02-buying.md":Ge,"../../../docs/03-plead.md":Oe,"../../../docs/04-your-bar.md":De,"../../../docs/05-judges.md":Me,"../../../docs/06-appeals.md":He,"../../../docs/07-letters.md":Be,"../../../docs/08-auto-sell.md":Re,"../../../docs/09-objection.md":Fe,"../../../docs/10-seasons.md":We,"../../../docs/11-fees.md":Ue,"../../../docs/12-pool.md":ze,"../../../docs/13-dead-man.md":qe,"../../../docs/14-keepers.md":Ke,"../../../docs/15-contracts.md":Xe,"../../../docs/16-audits.md":Ye,"../../../docs/17-risks.md":Ve,"../../../docs/18-glossary.md":Qe}),fn=Object.fromEntries(Object.entries(Object.assign({"./diagrams/fee-bar.tsx":dn})).map(([e,t])=>[e.replace(/^.*\/|\.tsx$/g,""),t])),ie=e=>W(A,e),ce=I.map(e=>{const t=pn[`../../../docs/${pe(e)}`]??`# ${e.title}
`;return{...e,blocks:H(t,ie).blocks}}),mn=Ne(ce,ie);function vn({slug:e,heading:t}){const{statics:a,s:n}=fe(),s=a??n?.constants,o=g.useCallback(p=>W(A,p,s),[s]),l=g.useMemo(()=>re(s),[s]),h=me(e),c=h&&ce.find(p=>p.slug===h.slug);g.useEffect(()=>{if(!t)return;const p=document.getElementById(M(t));p&&(p.scrollIntoView(),p.focus({preventScroll:!0}))},[h?.slug,t]);const i=g.useMemo(()=>c?Te(c.blocks,o):[],[c,o]),{prev:d,next:u}=we(h?.slug||"");return r.jsx(ln,{value:l,children:r.jsxs("div",{className:"docs",children:[r.jsx(wn,{current:h?.slug}),r.jsxs("article",{className:"docs__page",children:[c?r.jsx("div",{className:"docs-body",children:r.jsx($e,{tree:c.blocks,ctx:{slug:c.slug,num:o,diagrams:fn}})}):r.jsxs("div",{className:"stack stack--lg",children:[r.jsx(xe,{title:"Page not found"}),r.jsx(be,{title:`No docs page at #/docs/${e}`,action:{href:"#/docs",label:"Start here"},children:"Pick a page from the list, or search the docs."})]}),c&&r.jsxs("nav",{className:"docs-pager","aria-label":"Previous and next page",children:[d&&r.jsxs("a",{className:"docs-pager__link",href:N(d.slug),rel:"prev",children:[r.jsx("span",{className:"label",children:"Previous"}),r.jsxs("span",{className:"docs-pager__title",children:[r.jsx("span",{className:"docs-pager__back",children:r.jsx(y,{name:"arrow-right"})}),d.title]})]}),u&&r.jsxs("a",{className:"docs-pager__link docs-pager__link--next",href:N(u.slug),rel:"next",children:[r.jsx("span",{className:"label",children:"Next"}),r.jsxs("span",{className:"docs-pager__title",children:[u.title,r.jsx(y,{name:"arrow-right"})]})]})]})]}),c&&i.length>0&&r.jsxs("nav",{className:"docs__toc","aria-label":"On this page",children:[r.jsx("p",{className:"label",children:"On this page"}),r.jsx("ul",{children:i.map(p=>r.jsx("li",{className:p.level===3?"docs__toc-sub":void 0,children:r.jsx("a",{href:N(c.slug,p.id),"aria-current":p.id===t?"location":void 0,children:p.text})},p.id))})]})]})})}function wn({current:e}){const[t,a]=g.useState(!1),n=g.useRef(null);g.useEffect(()=>a(!1),[e]);const s=I.findIndex(l=>l.slug===e),o=l=>{l.key==="Escape"&&t&&document.getElementById("docs-pages")?.contains(document.activeElement)?(a(!1),n.current?.focus()):l.key==="Escape"&&t&&document.activeElement===n.current&&a(!1)};return r.jsxs("div",{className:"docs__side",onKeyDown:o,children:[r.jsx(xn,{}),r.jsxs("button",{ref:n,type:"button",className:"docs__toggle","aria-expanded":t,"aria-controls":"docs-pages",onClick:()=>a(!t),children:[r.jsx(y,{name:t?"x":"list"}),r.jsxs("span",{className:"docs__toggle-text",children:[r.jsx("span",{className:"strong",children:"Docs pages"}),s>=0&&r.jsxs("span",{className:"meta",children:[s+1," of ",I.length,": ",I[s].title]})]})]}),r.jsx("nav",{id:"docs-pages",className:`docs-nav${t?" is-open":""}`,"aria-label":"Docs pages",children:r.jsx("ol",{children:I.map(l=>r.jsx("li",{children:r.jsx("a",{href:N(l.slug),"aria-current":l.slug===e?"page":void 0,children:l.title})},l.slug))})})]})}function xn(){const[e,t]=g.useState(""),a=g.useRef(null),n=g.useRef(null),s=g.useMemo(()=>Ae(mn,e),[e]),o=U(e).join("").length>=2;g.useEffect(()=>{const c=()=>t("");return window.addEventListener("hashchange",c),()=>window.removeEventListener("hashchange",c)},[]);const l=()=>[...n.current?.querySelectorAll("a")||[]],h=(c,i)=>{const d=l();c.key==="ArrowDown"&&d.length?(c.preventDefault(),d[Math.min(i+1,d.length-1)].focus()):c.key==="ArrowUp"?(c.preventDefault(),i<=0?a.current?.focus():d[i-1].focus()):c.key==="Escape"&&e&&(c.preventDefault(),c.stopPropagation(),t(""),a.current?.focus())};return r.jsxs("form",{role:"search",className:"docs-search",onSubmit:c=>{c.preventDefault(),s[0]&&(location.hash=s[0].href)},children:[r.jsx("label",{className:"sr-only",htmlFor:"docs-q",children:"Search the docs"}),r.jsxs("div",{className:"input input--text",children:[r.jsx(y,{name:"magnifying-glass"}),r.jsx("input",{ref:a,id:"docs-q",className:"input__control",type:"search",placeholder:"Search the docs",autoComplete:"off",spellCheck:!1,value:e,"aria-describedby":"docs-q-count","aria-controls":o&&s.length?"docs-results":void 0,onChange:c=>t(c.target.value),onKeyDown:c=>h(c,-1)})]}),r.jsx("p",{id:"docs-q-count",className:"sr-only","aria-live":"polite",children:o?`${s.length||"No"} result${s.length===1?"":"s"}`:""}),o&&(s.length?r.jsx("ul",{ref:n,id:"docs-results",className:"docs-results","aria-label":"Search results",children:s.map((c,i)=>r.jsx("li",{children:r.jsxs("a",{href:c.href,onKeyDown:d=>h(d,i),children:[r.jsx("span",{className:"docs-results__where",children:r.jsx(bn,{entry:c.entry})}),c.snippet&&r.jsx("span",{className:"docs-results__text",children:r.jsx(gn,{text:c.snippet,query:e})})]})},c.href))}):r.jsxs("p",{className:"small text-2 docs-results__none",children:["No section mentions “",e.trim(),"”."]}))]})}const bn=({entry:e})=>r.jsxs(r.Fragment,{children:[e.page,e.heading&&r.jsxs(r.Fragment,{children:[r.jsx("span",{"aria-hidden":"true",children:" › "}),r.jsx("span",{className:"sr-only",children:", "}),e.heading]})]});function gn({text:e,query:t}){const a=U(t).filter(s=>s.length>1);if(!a.length)return r.jsx(r.Fragment,{children:e});const n=new RegExp(`(${a.map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")})`,"gi");return r.jsx(r.Fragment,{children:e.split(n).map((s,o)=>o%2?r.jsx("mark",{children:s},o):s)})}export{vn as default};
