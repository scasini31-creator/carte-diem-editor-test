/* Editor universale non distruttivo: le modifiche sono bozze locali/cloud. */
const ueData=savedDraft.elements||{};
const ueToolbar=document.createElement('div');
ueToolbar.style.cssText='display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 18px;background:#202a39;border-bottom:1px solid #ad8948';
ueToolbar.innerHTML='<button id="ueToggle" type="button" aria-pressed="true">✎ Selezione elementi: ATTIVA</button><span style="color:#e6d4b2">Tocca qualsiasi elemento nell’anteprima per modificarlo</span><button id="ueResetPage" type="button">Ripristina bozze pagina</button>';
document.querySelector('.controls').after(ueToolbar);
let ueEnabled=true,ueSelected=null,ueOutline=null;
document.getElementById('ueToggle').onclick=()=>{ueEnabled=!ueEnabled;document.getElementById('ueToggle').textContent='✎ Selezione elementi: '+(ueEnabled?'ATTIVA':'DISATTIVA');document.getElementById('ueToggle').setAttribute('aria-pressed',String(ueEnabled));};
const uePanel=document.createElement('div');
uePanel.id='uePanel';uePanel.style.cssText='position:fixed;inset:0;z-index:300;background:#000d;display:none;align-items:center;justify-content:center;padding:12px';
uePanel.innerHTML='<div style="background:#121b2b;color:#f7f5ee;border:1px solid #d5b36a;border-radius:14px;padding:18px;width:min(550px,100%);max-height:92dvh;overflow:auto;font:14px Arial"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong>✎ Modifica elemento</strong><button id="ueClose" type="button">Chiudi ✕</button></div><p id="uePath" style="overflow-wrap:anywhere;color:#e1c785"></p><label style="display:block;margin:10px 0">Testo (solo il testo diretto dell’elemento)<textarea id="ueText" rows="3" style="display:block;width:100%;margin-top:5px;background:#fff;color:#111;padding:8px"></textarea></label><label style="display:block;margin:10px 0">URL immagine / collegamento<input id="ueUrl" style="display:block;width:100%;margin-top:5px;background:#fff;color:#111;padding:8px"></label><label style="display:block;margin:10px 0">Testo alternativo immagine<input id="ueAlt" style="display:block;width:100%;margin-top:5px;background:#fff;color:#111;padding:8px"></label><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label>Colore testo<input id="ueColor" type="color" style="display:block;width:100%"></label><label>Colore sfondo<input id="ueBg" type="color" style="display:block;width:100%"></label><label>Dimensione carattere (px)<input id="ueFont" type="number" min="6" max="200" style="display:block;width:100%"></label><label>Spaziatura interna (px)<input id="uePadding" type="number" min="0" max="250" style="display:block;width:100%"></label><label>Larghezza (%)<input id="ueWidth" type="number" min="1" max="100" style="display:block;width:100%"></label><label>Allineamento<select id="ueAlign" style="display:block;width:100%"><option value="">Originale</option><option value="left">Sinistra</option><option value="center">Centro</option><option value="right">Destra</option><option value="justify">Giustificato</option></select></label></div><label style="display:block;margin:12px 0"><input id="ueHide" type="checkbox"> Nascondi elemento nell’anteprima</label><div style="display:flex;flex-wrap:wrap;gap:8px"><button id="ueApply" type="button">Applica bozza</button><button id="ueRestore" type="button">Ripristina elemento</button></div><p style="color:#aeb7c8">Le modifiche qui non aggiornano il sito pubblico né il database dei prodotti.</p></div>';
document.body.appendChild(uePanel);
const ueGet=id=>document.getElementById('ue'+id);
const uePage=()=>preview.getAttribute('src').split('?')[0];
const ueKey=selector=>uePage()+'|'+selector;
function ueSelector(el){
 const parts=[];let n=el;
 while(n&&n.nodeType===1&&n.tagName!=='HTML'){
  if(n.id&&/^[A-Za-z][\w-]*$/.test(n.id)){parts.unshift('#'+n.id);break;}
  const tag=n.tagName.toLowerCase();const parent=n.parentElement;
  if(!parent){parts.unshift(tag);break;}
  const same=[...parent.children].filter(x=>x.tagName===n.tagName);
  parts.unshift(tag+(same.length>1?':nth-of-type('+(same.indexOf(n)+1)+')':''));
  n=parent;
 }
 return parts.join(' > ');
}
function ueDirectText(el){return [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim();}
function ueSetText(el,value){
 const nodes=[...el.childNodes].filter(n=>n.nodeType===3);
 if(nodes.length){nodes[0].textContent=value;nodes.slice(1).forEach(n=>n.textContent='');}
 else if(el.children.length===0)el.textContent=value;
}
function ueSafeUrl(url){if(!url)return '';try{const u=new URL(url,preview.contentWindow.location.href);return ['https:','http:'].includes(u.protocol)?url:'';}catch(e){return '';}}
function ueApplyRecord(el,record){
 if(!el||!record)return;
 if(record.text!==undefined)ueSetText(el,record.text);
 if(record.url!==undefined){const url=ueSafeUrl(record.url);if(el.tagName==='IMG'&&url)el.src=url;else if(el.tagName==='A'&&url)el.href=url;}
 if(record.alt!==undefined&&el.tagName==='IMG')el.alt=record.alt;
 for(const [k,prop] of [['color','color'],['background','backgroundColor'],['fontSize','fontSize'],['padding','padding'],['width','width'],['align','textAlign']]){
  if(record[k]!==undefined)el.style[prop]=record[k];
 }
 if(record.hidden!==undefined)el.style.display=record.hidden?'none':'';
}
function ueRestoreAll(){
 const d=preview.contentDocument;if(!d)return;
 for(const [key,value] of Object.entries(ueData)){
  if(!key.startsWith(uePage()+'|'))continue;
  const selector=key.slice(uePage().length+1);
  try{ueApplyRecord(d.querySelector(selector),value);}catch(e){}
 }
}
function ueOpen(el){
 ueSelected={el,selector:ueSelector(el),page:uePage()};
 const record=ueData[ueKey(ueSelected.selector)]||{};
 ueGet('Path').textContent=ueSelected.page+' → '+ueSelected.selector;
 ueGet('Text').value=record.text??ueDirectText(el);
 ueGet('Url').value=record.url??(el.tagName==='IMG'?el.getAttribute('src')||'':el.tagName==='A'?el.getAttribute('href')||'':'');
 ueGet('Alt').value=record.alt??(el.tagName==='IMG'?el.alt:'');
 const style=preview.contentWindow.getComputedStyle(el);
 const hex=c=>{const m=c.match(/\d+/g);return m&&m.length>=3?'#'+m.slice(0,3).map(x=>Math.min(255,+x).toString(16).padStart(2,'0')).join(''):'#ffffff'};
 ueGet('Color').value=hex(style.color);ueGet('Bg').value=hex(style.backgroundColor);
 ueGet('Font').value=parseInt(style.fontSize)||14;ueGet('Padding').value=parseInt(style.paddingTop)||0;
 ueGet('Width').value=record.width?parseInt(record.width):'';ueGet('Align').value=record.align||'';
 ueGet('Hide').checked=!!record.hidden;
 uePanel.style.display='flex';
}
ueGet('Close').onclick=()=>uePanel.style.display='none';
uePanel.addEventListener('click',e=>{if(e.target===uePanel)uePanel.style.display='none';});
ueGet('Apply').onclick=()=>{
 if(!ueSelected)return;
 const {el,selector,page}=ueSelected;
 const record={text:ueGet('Text').value,url:ueGet('Url').value,alt:ueGet('Alt').value,color:ueGet('Color').value,background:ueGet('Bg').value,fontSize:ueGet('Font').value+'px',padding:ueGet('Padding').value+'px',width:ueGet('Width').value?ueGet('Width').value+'%':'',align:ueGet('Align').value,hidden:ueGet('Hide').checked};
 if(!['IMG','A'].includes(el.tagName))delete record.url;
 if(el.tagName!=='IMG')delete record.alt;
 ueData[page+'|'+selector]=record;ueApplyRecord(el,record);
 persistDraft();uePanel.style.display='none';
};
ueGet('Restore').onclick=()=>{if(!ueSelected)return;delete ueData[ueSelected.page+'|'+ueSelected.selector];persistDraft();uePanel.style.display='none';preview.contentWindow.location.reload();};
document.getElementById('ueResetPage').onclick=()=>{if(!confirm('Ripristinare tutte le modifiche in bozza per questa pagina?'))return;for(const k of Object.keys(ueData))if(k.startsWith(uePage()+'|'))delete ueData[k];persistDraft();preview.contentWindow.location.reload();};
function universalDecorate(){
 const d=preview.contentDocument;if(!d)return;
 ueRestoreAll();
 d.addEventListener('click',e=>{
  if(!ueEnabled)return;
  const el=e.target.closest('body *');
  if(!el||['SCRIPT','STYLE','NOSCRIPT','META','LINK'].includes(el.tagName))return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  ueOpen(el);
 },true);
 d.addEventListener('mouseover',e=>{if(!ueEnabled)return;const el=e.target.closest('body *');if(!el||el===ueOutline)return;if(ueOutline)ueOutline.style.removeProperty('outline');ueOutline=el;el.style.outline='2px solid #f0b948';},true);
 d.addEventListener('mouseout',()=>{if(ueOutline){ueOutline.style.removeProperty('outline');ueOutline=null;}},true);
 // Non osservare tutte le mutazioni: causerebbe cicli continui quando si modifica il testo.

}

// L'iframe può aver terminato il caricamento prima che questo script venga eseguito.
if(preview.contentDocument?.readyState==='complete')universalDecorate();
