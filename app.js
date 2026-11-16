(()=>{
const $=s=>document.querySelector(s),HR=36e5,DAY=864e5;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const FIELDS={id:['ticket id','id','ticket','ticket number','key','issue id','number','request id'],created:['created','created at','created time','created date','opened','open date','requested'],resp:['first response','first response time','first reply','first responded at','first response at','first reply time'],resolved:['resolved','resolved at','resolved time','solved','solved at','closed at','closed'],status:['status','state','ticket status'],priority:['priority','severity','ticket priority'],assignee:['assignee','agent','assigned to','owner','assignee name','assigned agent']};
const LBL={id:'Ticket ID *',created:'Created *',resp:'First response',resolved:'Resolved',status:'Status',priority:'Priority',assignee:'Assignee'};
const RES=new Set(['resolved','closed','solved','done','completed']);
const SLA={urgent:[1,4],high:[2,8],medium:[8,24],low:[24,72]};
let T=[],H=null,M={},now=Date.now();
const norm=h=>h.toLowerCase().replace(/[_\-]+/g,' ').trim();
function parse(t){t=t.replace(/^\uFEFF/,'');const r=[];let row=[],f='',q=false;
for(let i=0;i<t.length;i++){const c=t[i];
if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++}else q=false}else f+=c}
else if(c=='"')q=true;else if(c==','){row.push(f);f=''}
else if(c=='\n'||c=='\r'){if(c=='\r'&&t[i+1]=='\n')i++;row.push(f);f='';if(row.some(x=>x.trim()))r.push(row);row=[]}else f+=c}
row.push(f);if(row.some(x=>x.trim()))r.push(row);return r}
function pd(s,f){s=(s||'').trim();if(!s)return null;
if(f=='iso'){if(!/^\d{4}-\d{2}-\d{2}/.test(s))return NaN;const d=Date.parse(s);return isNaN(d)?NaN:d}
const m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);if(!m)return NaN;
const a=+m[1],b=+m[2],dd=f=='dmy'?a:b,mm=f=='dmy'?b:a;if(mm<1||mm>12||dd<1||dd>31)return NaN;
return new Date(+m[3],mm-1,dd,+m[4]||0,+m[5]||0).getTime()}
const auto=h=>{const o={};for(const k in FIELDS){let i=h.findIndex(x=>FIELDS[k].includes(norm(x)));if(i<0)i=h.findIndex(x=>FIELDS[k].some(a=>a.length>4&&norm(x).includes(a)));o[k]=i}return o};
function build(rows,fmt){const d=rows.slice(1),seen=new Set();
T=d.map((r,n)=>{const g=k=>M[k]>=0?(r[M[k]]||'').trim():'';
const t={id:g('id'),row:n+2,reasons:[],st:'valid',status:(g('status')||'unknown').toLowerCase(),priority:g('priority').toLowerCase(),assignee:g('assignee')||null};
for(const [k,key] of [['created','createdAt'],['resp','respAt'],['resolved','resAt']]){const v=pd(g(k),fmt);if(Number.isNaN(v)){t.reasons.push('Invalid '+key.replace('At','')+' timestamp');t.bad=1;t[key]=null}else t[key]=v}
t.done=RES.has(t.status);
if(!t.id){t.st='excluded';t.reasons.push('Missing ticket ID')}
else if(seen.has(t.id)){t.st='excluded';t.reasons.push('Duplicate ticket ID (first occurrence kept)')}
else{seen.add(t.id);if(t.createdAt==null&&!t.bad)t.reasons.push('Missing created timestamp');if(t.reasons.length)t.st='review'}
return t});now=Date.now();show()}
function sl(t,end,tg){if(t.bad)return'Needs review';if(!t.createdAt||!tg)return'Not measurable';
if(end!=null){if(end<t.createdAt)return'Needs review';return(end-t.createdAt)/HR<=tg?'Met':'Breached'}
return(now-t.createdAt)/HR>tg?'Overdue':'On track'}
function enr(t){const tr=SLA[t.priority];t.age=!t.done&&t.createdAt?(now-t.createdAt)/HR:null;
t.bucket=t.age==null?'':t.age<24?'Fresh':t.age<48?'Aging':t.age<72?'At risk':'Critical';
t.rs=t.respAt==null&&t.done&&!t.bad?'Not measurable':sl(t,t.respAt,tr&&tr[0]);
t.zs=t.done&&t.resAt==null&&!t.bad?'Not measurable':sl(t,t.done?t.resAt:null,tr&&tr[1])}
const fh=h=>h==null?'–':h<1?Math.round(h*60)+' min':h<48?h.toFixed(1)+' h':(h/24).toFixed(1)+' d';
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null,med=a=>{if(!a.length)return null;a=[...a].sort((x,y)=>x-y);const m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2};
const cls=s=>({Met:'g','On track':'b',Breached:'r',Overdue:'r'}[s]||'');
function fill(id,label,vals){const e=$(id),c=e.value;e.innerHTML=`<option value="">${label}</option>`+[...new Set(vals)].sort().map(v=>`<option>${esc(v)}</option>`).join('');e.value=c}
function show(){$('#map').hidden=true;$('#upload').hidden=true;$('#dash').hidden=false;const A=T.filter(t=>t.st!='excluded');
fill('#fs','All statuses',A.map(t=>t.status));fill('#fp','All priorities',A.map(t=>t.priority||'(none)'));fill('#fa','All assignees',A.map(t=>t.assignee||'Unassigned'));
$('#slaCfg').innerHTML='<table><tr><th>Priority</th><th>Response</th><th>Resolution</th></tr>'+Object.keys(SLA).map(p=>`<tr><td>${p}</td>${[0,1].map(i=>`<td><input type="number" min="0.1" step="0.5" value="${SLA[p][i]}" data-p="${p}" data-i="${i}" style="width:80px"></td>`).join('')}</tr>`).join('')+'</table>';
render()}
function render(){const A=T.filter(t=>t.st!='excluded');A.forEach(enr);
const s=$('#fs').value,p=$('#fp').value,a=$('#fa').value,q=$('#q').value.toLowerCase().trim();
const F=A.filter(t=>(!s||t.status==s)&&(!p||(t.priority||'(none)')==p)&&(!a||(t.assignee||'Unassigned')==a)&&(!q||t.id.toLowerCase().includes(q)));
const open=F.filter(t=>!t.done),res=F.filter(t=>t.done),all=[...F.map(t=>t.rs),...F.map(t=>t.zs)];
const meas=all.filter(x=>['Met','Breached','Overdue'].includes(x)),met=meas.filter(x=>x=='Met').length;
const rt=F.filter(t=>t.respAt&&t.createdAt&&!t.bad&&t.respAt>=t.createdAt).map(t=>(t.respAt-t.createdAt)/HR),zt=F.filter(t=>t.done&&t.resAt&&t.createdAt&&!t.bad&&t.resAt>=t.createdAt).map(t=>(t.resAt-t.createdAt)/HR);
$('#ref').textContent=new Date(now).toLocaleString();
const K=[[F.length,'Total tickets'],[open.length,'Open backlog'],[res.length,'Resolved'],[meas.length?(met/meas.length*100).toFixed(1)+'%':'–','SLA compliance (est.)'],[meas.length-met,'SLA breaches / overdue'],[fh(avg(rt)),'Avg first response'],[fh(med(rt)),'Median first response'],[fh(avg(zt)),'Avg resolution'],[fh(med(zt)),'Median resolution'],[open.filter(t=>!t.assignee).length,'Unassigned open']];
$('#kpis').innerHTML=K.map(([v,l])=>`<div class="k"><b>${esc(v)}</b><span>${l}</span></div>`).join('');
const B=['Fresh','Aging','At risk','Critical'],bc=B.map(b=>open.filter(t=>t.bucket==b).length),mx=Math.max(1,...bc);
$('#age').innerHTML=B.map((b,i)=>`<div class="row"><span>${b}</span><i style="width:${bc[i]/mx*60}%"></i><b>${bc[i]}</b></div>`).join('')+'<p class="muted">Fresh 0–24h · Aging 24–48h · At risk 48–72h · Critical 72h+ (age since creation, unresolved only).</p>';
const SS=['Met','Breached','On track','Overdue','Not measurable','Needs review'];
$('#sla').innerHTML='<table><tr><th></th>'+SS.map(x=>`<th>${x}</th>`).join('')+'</tr>'+[['First response','rs'],['Resolution','zs']].map(([n,k])=>`<tr><td>${n}</td>${SS.map(x=>`<td>${F.filter(t=>t[k]==x).length}</td>`).join('')}</tr>`).join('')+'</table>';
const W={};F.forEach(t=>{const n=t.assignee||'Unassigned';(W[n]=W[n]||[]).push(t)});
$('#work').innerHTML='<table><tr><th>Assignee</th><th>Open</th><th>Resolved</th><th>Total</th><th>Oldest open</th></tr>'+Object.entries(W).sort((x,y)=>y[1].filter(t=>!t.done).length-x[1].filter(t=>!t.done).length).map(([n,l])=>`<tr><td>${esc(n)}</td><td>${l.filter(t=>!t.done).length}</td><td>${l.filter(t=>t.done).length}</td><td>${l.length}</td><td>${fh(Math.max(-1,...l.filter(t=>t.age!=null).map(t=>t.age))<0?null:Math.max(...l.filter(t=>t.age!=null).map(t=>t.age)))}</td></tr>`).join('')+'</table>';
const bad=T.filter(t=>t.st!='valid');
$('#qual').innerHTML=`<p>${T.filter(t=>t.st=='valid').length} valid · ${T.filter(t=>t.st=='review').length} need review · ${T.filter(t=>t.st=='excluded').length} excluded (of ${T.length} rows).</p>`+(bad.length?'<div class="scroll"><table><tr><th>Row</th><th>Ticket</th><th>State</th><th>Reason</th></tr>'+bad.slice(0,50).map(t=>`<tr><td>${t.row}</td><td>${esc(t.id)}</td><td>${t.st}</td><td>${esc(t.reasons.join('; '))}</td></tr>`).join('')+'</table></div>'+(bad.length>50?'<p class="muted">Showing first 50.</p>':''):'<p class="muted">No data-quality issues found.</p>');
const sorted=[...F].sort((x,y)=>(y.age??-1)-(x.age??-1));$('#cnt').textContent=`(${F.length}${F.length>200?', showing 200':''})`;
$('#tbl').innerHTML='<table><tr><th>ID</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Age</th><th>Response</th><th>Resolution</th></tr>'+sorted.slice(0,200).map(t=>`<tr><td>${esc(t.id)}</td><td>${esc(t.status)}</td><td>${esc(t.priority||'–')}</td><td>${esc(t.assignee||'Unassigned')}</td><td>${t.age==null?'–':fh(t.age)+' · '+t.bucket}</td><td><span class="c ${cls(t.rs)}">${t.rs}</span></td><td><span class="c ${cls(t.zs)}">${t.zs}</span></td></tr>`).join('')+'</table>';
return F}
const sx=v=>{v=String(v??'');if(/^[=+\-@\t\r]/.test(v))v="'"+v;return/[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
function exportCsv(){const F=render(),iso=x=>x?new Date(x).toISOString():'';
const rows=[['ticket_id','status','priority','assignee','created_at','first_response_at','resolved_at','age_hours','age_bucket','response_sla_estimate','resolution_sla_estimate','validation','notes']].concat(F.map(t=>[t.id,t.status,t.priority,t.assignee||'Unassigned',iso(t.createdAt),iso(t.respAt),iso(t.resAt),t.age==null?'':t.age.toFixed(1),t.bucket,t.rs,t.zs,t.st,t.reasons.join('; ')]));
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.map(r=>r.map(sx).join(',')).join('\r\n')],{type:'text/csv'}));a.download='queuelens-tickets.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1e3)}
function sample(){let s=7;const r=()=>(s=(s*1103515245+12345)%2147483648)/2147483648,P=['urgent','high','medium','low'],A=['Asha','Ben','Chen','Dara',''],S=['open','pending','resolved','closed','open'],iso=t=>new Date(t).toISOString(),n=Date.now();
const rows=[['Ticket ID','Created','First Response','Resolved','Status','Priority','Assignee']];
for(let i=1;i<=40;i++){const c=n-(0.2+r()*5)*DAY,st=S[i%5],fr=r()<.85?c+r()*10*HR:null,dn=st=='resolved'||st=='closed',rs=dn?(fr||c)+r()*30*HR:null;
rows.push(['T-'+(1000+i),iso(c),fr&&fr<n?iso(fr):'',rs&&rs<n?iso(rs):'',st,P[i%4],A[Math.floor(r()*5)]])}
rows.push(['T-1001',iso(n-HR),'','','open','low','Ben'],['T-1099','not-a-date','','','open','high','Asha']);return rows}
function begin(rows,fmt){if(rows.length<2)return err('No data rows found in this file.');if(rows.length>50001)return err('File has more than 50,000 rows. Please filter or split it first.');H=rows;M=auto(rows[0]);
if(fmt){$('#dfmt').value=fmt;build(rows,fmt);return}
$('#mapGrid').innerHTML=Object.keys(FIELDS).map(k=>`<label>${LBL[k]}<select data-k="${k}"><option value="-1">— not mapped —</option>${rows[0].map((h,i)=>`<option value="${i}"${M[k]==i?' selected':''}>${esc(h)}</option>`).join('')}</select></label>`).join('');
$('#map').hidden=false;$('#map').scrollIntoView({behavior:'smooth'})}
const err=m=>{$('#msg').textContent=m;$('#msg').className='warn'};
$('#file').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;
if(!/\.csv$/i.test(f.name)&&f.type!='text/csv')return err('Please choose a .csv file.');
if(f.size>10*1048576)return err('File is larger than 10 MB.');
const fr=new FileReader();fr.onload=()=>{try{begin(parse(fr.result))}catch(x){err('Could not read this CSV.')}};fr.onerror=()=>err('Could not read this file.');fr.readAsText(f)});
$('#sampleBtn').onclick=()=>begin(sample(),'iso');
$('#go').onclick=()=>{document.querySelectorAll('#mapGrid select').forEach(s=>M[s.dataset.k]=+s.value);
if(M.id<0||M.created<0)return alert('Please map Ticket ID and Created.');build(H,$('#dfmt').value)};
['#fs','#fp','#fa'].forEach(i=>$(i).onchange=render);$('#q').oninput=render;
$('#slaCfg').addEventListener('input',e=>{const x=e.target,v=parseFloat(x.value);if(x.dataset.p&&v>0){SLA[x.dataset.p][+x.dataset.i]=v;render()}});
$('#exp').onclick=exportCsv;$('#prt').onclick=()=>window.print();
$('#clr').onclick=()=>{T=[];H=null;M={};$('#file').value='';$('#q').value='';$('#dash').hidden=true;$('#upload').hidden=false;$('#msg').textContent='Data cleared. Processed locally in your browser.';$('#msg').className='muted'};
})();
