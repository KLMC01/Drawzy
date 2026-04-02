/* ============================================================
   RAFFLE DRAW v9 – Standalone (no database, no PHP API)
   All features: ZIP photo import (browser-side via JSZip),
   file import, correct spin, winner screen in normal + FS,
   CSS burst, confetti, session history, Sinhala/English
   ============================================================ */
'use strict';

const state = {
  names:[], photos:{}, photoCache:{}, history:[],
  spinDuration:6, spinning:false, currentAngle:0, fsAngle:0, logoSize:90,
  drawSoundType:'tick', winSoundType:'fanfare', drawVolume:.4, winVolume:.5,
  customDrawAudio:null, customWinAudio:null,
};

const $=id=>document.getElementById(id);
const canvas=$('wheelCanvas'),ctx=canvas.getContext('2d');
const canvasFS=$('wheelCanvasFS'),ctxFS=canvasFS.getContext('2d');
const spinBtn=$('spinBtn'),spinBtnFS=$('spinBtnFS');
const namesBox=$('namesBox'),nameCount=$('nameCount');
const shuffleBtn=$('shuffleBtn');
const dropZone=$('dropZone'),fileInput=$('fileInput');
const zipDropZone=$('zipDropZone'),zipFileInput=$('zipFileInput');
const photoPreviewGrid=$('photoPreviewGrid'),photoThumbs=$('photoThumbs');
const photoPreviewCount=$('photoPreviewCount'),photoClearBtn=$('photoClearBtn');
const menuBtn=$('menuBtn'),sidebar=$('sidebar'),closeSidebar=$('closeSidebar'),backdrop=$('sidebarBackdrop');
const spinDurSlider=$('spinDuration'),spinDurVal=$('spinDurationVal');
const logoSizeSlider=$('logoSize'),logoSizeVal=$('logoSizeVal');
const bgFileInput=$('bgFileInput'),logoFileInput=$('logoFileInput');
const logoImg=$('logoImg'),fsLogoImg=$('fsLogoImg');
const historyList=$('historyList'),clearHistoryBtn=$('clearHistoryBtn');
const bgOverlay=$('bg-overlay'),bgOverlayFS=$('bg-overlay-fs');
const fsOverlay=$('fsOverlay'),fullscreenBtn=$('fullscreenBtn'),fsExitBtn=$('fsExitBtn');
const mainLayout=$('mainLayout'),spinLock=$('spinLock');
const winnerScreen=$('winnerScreen'),wsName=$('wsName'),wsPhotoBox=$('wsPhotoBox');
const wsCloseBtn=$('wsCloseBtn'),wsFwRing=$('wsFwRing');
const winnerTicker=$('winnerTicker'),winnerTickerFS=$('winnerTickerFS');
const cfCanvas=$('confettiCanvas'),cfCtx=cfCanvas.getContext('2d');
const bgDropZone=$('bgDropZone'),bgPreviewRow=$('bgPreviewRow');
const bgPreviewThumb=$('bgPreviewThumb'),bgPreviewName=$('bgPreviewName'),resetBg=$('resetBg');
const logoDropZone=$('logoDropZone'),logoPreviewRow=$('logoPreviewRow');
const logoPreviewThumb=$('logoPreviewThumb'),logoPreviewName=$('logoPreviewName'),resetLogo=$('resetLogo');
const drawSoundSel=$('drawSoundSelect'),winSoundSel=$('winSoundSelect');
const drawSoundUpRow=$('drawSoundUploadRow'),winSoundUpRow=$('winSoundUploadRow');
const drawSoundFile=$('drawSoundFile'),winSoundFile=$('winSoundFile');
const drawVolSlider=$('drawVol'),winVolSlider=$('winVol');
const drawVolVal=$('drawVolVal'),winVolVal=$('winVolVal');

const WHEEL_COLORS=['#c0420a','#d48a18','#b07828','#7a3e00','#a06818','#c85200','#e0a830','#8a4c0a','#b05828','#c08810','#9c5018','#d07410'];

let _toast=null;
function showToast(msg,dur=2800){if(!_toast){_toast=document.createElement('div');_toast.className='toast';document.body.appendChild(_toast);}
_toast.textContent=msg;_toast.classList.add('show');clearTimeout(_toast._t);_toast._t=setTimeout(()=>_toast.classList.remove('show'),dur);}

let _ac=null;
function getAC(){if(!_ac)_ac=new(window.AudioContext||window.webkitAudioContext)();if(_ac.state==='suspended')_ac.resume();return _ac;}
function _osc(type,freq,vol,dur){try{const ac=getAC(),now=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,now);g.gain.exponentialRampToValueAtTime(.001,now+dur);o.start(now);o.stop(now+dur+.01);}catch(e){}}
function synthTick(v){_osc('triangle',880,v,.07);}
function synthClick(v){_osc('square',1200,v*.5,.03);}
function synthDrum(v){try{const ac=getAC(),now=ac.currentTime,buf=ac.createBuffer(1,ac.sampleRate*.08,ac.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);const src=ac.createBufferSource(),g=ac.createGain();src.buffer=buf;src.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(v*1.2,now);g.gain.exponentialRampToValueAtTime(.001,now+.08);src.start(now);}catch(e){}}
function synthFanfare(v){try{const ac=getAC();[[523.25,0],[659.25,.12],[783.99,.24],[1046.5,.36],[1318.5,.5]].forEach(([f,d])=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.value=f;const t=ac.currentTime+d;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.04);g.gain.exponentialRampToValueAtTime(.001,t+.5);o.start(t);o.stop(t+.55);});}catch(e){}}
function synthChime(v){try{const ac=getAC();[1047,1319,1568,2093,2637].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.value=f;const t=ac.currentTime+i*.1;g.gain.setValueAtTime(v*.6,t);g.gain.exponentialRampToValueAtTime(.001,t+1.2);o.start(t);o.stop(t+1.3);});}catch(e){}}
function synthTrumpet(v){try{const ac=getAC();[[523.25,0,.2],[659.25,.18,.2],[783.99,.36,.4],[880,.76,.6]].forEach(([f,d,dur])=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sawtooth';o.frequency.value=f;const t=ac.currentTime+d;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v*.45,t+.03);g.gain.setValueAtTime(v*.4,t+dur-.04);g.gain.linearRampToValueAtTime(0,t+dur);o.start(t);o.stop(t+dur+.05);});}catch(e){}}
function playCustomAudio(el,v){if(!el)return;try{el.volume=v;el.currentTime=0;el.play().catch(()=>{});}catch(e){}}
function playDrawSound(){const v=state.drawVolume;if(!v)return;switch(state.drawSoundType){case'tick':synthTick(v);break;case'drum':synthDrum(v);break;case'click':synthClick(v);break;case'custom':playCustomAudio(state.customDrawAudio,v);break;}}
function playWinSound(){const v=state.winVolume;if(!v)return;switch(state.winSoundType){case'fanfare':synthFanfare(v);break;case'chime':synthChime(v);break;case'trumpet':synthTrumpet(v);break;case'custom':playCustomAudio(state.customWinAudio,v);break;}}
drawSoundSel.addEventListener('change',()=>{state.drawSoundType=drawSoundSel.value;drawSoundUpRow.classList.toggle('hidden',state.drawSoundType!=='custom');if(state.drawSoundType==='custom')drawSoundFile.click();});
winSoundSel.addEventListener('change',()=>{state.winSoundType=winSoundSel.value;winSoundUpRow.classList.toggle('hidden',state.winSoundType!=='custom');if(state.winSoundType==='custom')winSoundFile.click();});
drawSoundUpRow.addEventListener('click',()=>drawSoundFile.click());winSoundUpRow.addEventListener('click',()=>winSoundFile.click());
drawSoundFile.addEventListener('change',e=>{const f=e.target.files[0];if(f)state.customDrawAudio=new Audio(URL.createObjectURL(f));});
winSoundFile.addEventListener('change',e=>{const f=e.target.files[0];if(f)state.customWinAudio=new Audio(URL.createObjectURL(f));});
drawVolSlider.addEventListener('input',()=>{state.drawVolume=+drawVolSlider.value;drawVolVal.textContent=Math.round(state.drawVolume*100)+'%';});
winVolSlider.addEventListener('input',()=>{state.winVolume=+winVolSlider.value;winVolVal.textContent=Math.round(state.winVolume*100)+'%';});

// Sidebar tabs
document.querySelectorAll('.sb-tab').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.sb-tab').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.sb-panel').forEach(p=>p.classList.add('hidden'));btn.classList.add('active');$('tab'+btn.dataset.tab[0].toUpperCase()+btn.dataset.tab.slice(1)).classList.remove('hidden');if(btn.dataset.tab==='history')renderHistory();});});

function lockUI(){spinLock.classList.add('active');mainLayout.classList.add('spinning-lock');menuBtn.style.pointerEvents='none';menuBtn.style.opacity='.5';}
function unlockUI(){spinLock.classList.remove('active');mainLayout.classList.remove('spinning-lock');menuBtn.style.pointerEvents='';menuBtn.style.opacity='';}

function getPhotoForName(name){if(!name)return null;const key=name.trim().toLowerCase(),url=state.photos[key];if(!url)return null;if(state.photoCache[key])return state.photoCache[key];const img=new Image();img.src=url;state.photoCache[key]=img;return img;}

function drawWheelOn(c,c2d,angle){
  const W=c.width,H=c.height,cx=W/2,cy=H/2,r=cx-8;
  c2d.clearRect(0,0,W,H);const names=state.names;
  if(!names.length){c2d.save();c2d.beginPath();c2d.arc(cx,cy,r,0,Math.PI*2);c2d.fillStyle='rgba(200,180,130,.35)';c2d.fill();c2d.strokeStyle='rgba(180,140,60,.5)';c2d.lineWidth=3;c2d.stroke();for(let i=0;i<8;i++){const s=angle+(i/8)*Math.PI*2,e=angle+((i+1)/8)*Math.PI*2;c2d.beginPath();c2d.moveTo(cx,cy);c2d.arc(cx,cy,r,s,e);c2d.closePath();c2d.strokeStyle='rgba(150,110,40,.3)';c2d.lineWidth=1.5;c2d.stroke();}drawCenterOn(c,c2d);c2d.restore();return;}
  const n=names.length,sa=(Math.PI*2)/n;
  names.forEach((name,i)=>{
    const start=angle+i*sa,end=start+sa,mid=start+sa/2;
    c2d.beginPath();c2d.moveTo(cx,cy);c2d.arc(cx,cy,r,start,end);c2d.closePath();c2d.fillStyle=WHEEL_COLORS[i%WHEEL_COLORS.length];c2d.fill();c2d.strokeStyle='rgba(255,230,120,.55)';c2d.lineWidth=1.5;c2d.stroke();
    const photo=getPhotoForName(name);
    if(photo&&photo.complete&&photo.naturalWidth>0){c2d.save();c2d.translate(cx,cy);c2d.rotate(mid);const pr=Math.min(r*.13,26),px=r*.73;c2d.save();c2d.beginPath();c2d.arc(px,0,pr,0,Math.PI*2);c2d.closePath();c2d.clip();c2d.drawImage(photo,px-pr,-pr,pr*2,pr*2);c2d.restore();c2d.beginPath();c2d.arc(px,0,pr+1.5,0,Math.PI*2);c2d.strokeStyle='rgba(255,255,255,.85)';c2d.lineWidth=2;c2d.stroke();c2d.restore();}
    c2d.save();c2d.translate(cx,cy);c2d.rotate(mid);c2d.textAlign='right';
    const hasPhoto=photo&&photo.complete&&photo.naturalWidth>0;
    const textEnd=r-14,textStart=hasPhoto?r*.55:r*.12,availLen=textEnd-textStart;
    let fs=Math.min(Math.max(11,Math.floor(r*.22)),22);c2d.font=`bold ${fs}px 'Crimson Pro',Georgia,serif`;
    while(fs>8&&c2d.measureText(name).width>availLen){fs--;c2d.font=`bold ${fs}px 'Crimson Pro',Georgia,serif`;}
    c2d.fillStyle='#fff';c2d.shadowColor='rgba(0,0,0,.7)';c2d.shadowBlur=5;c2d.fillText(name,textEnd,fs/3);c2d.restore();
  });
  c2d.beginPath();c2d.arc(cx,cy,r,0,Math.PI*2);c2d.strokeStyle='rgba(255,210,80,.65)';c2d.lineWidth=5;c2d.stroke();drawCenterOn(c,c2d);
}
function drawCenterOn(c,c2d){const cx=c.width/2,cy=c.height/2,cr=Math.min(cx,cy)*.165;const g=c2d.createRadialGradient(cx-cr*.15,cy-cr*.15,cr*.1,cx,cy,cr);g.addColorStop(0,'#fff8e8');g.addColorStop(.5,'#e8c860');g.addColorStop(1,'#b8820a');c2d.beginPath();c2d.arc(cx,cy,cr,0,Math.PI*2);c2d.fillStyle=g;c2d.fill();c2d.strokeStyle='rgba(255,200,50,.5)';c2d.lineWidth=3;c2d.stroke();}
function drawWheel(a=0){drawWheelOn(canvas,ctx,a);}
function drawWheelFS(a=0){drawWheelOn(canvasFS,ctxFS,a);}
function redrawBoth(){drawWheel(state.currentAngle);drawWheelFS(state.fsAngle);}

function parseNames(t){return t.split('\n').map(l=>l.trim()).filter(l=>l.length>0);}
function syncNamesFromBox(){state.names=parseNames(namesBox.innerText||'');nameCount.textContent=state.names.length;redrawBoth();}
namesBox.addEventListener('input',syncNamesFromBox);
function setNames(names,photosMap=null){state.names=[...names];namesBox.innerText=names.join('\n');nameCount.textContent=names.length;if(photosMap){state.photos={};state.photoCache={};Object.entries(photosMap).forEach(([n,url])=>{if(url)state.photos[n.toLowerCase()]=url;});}redrawBoth();}

// File import
dropZone.addEventListener('click',()=>fileInput.click());fileInput.addEventListener('change',e=>handleFile(e.target.files[0]));
dropZone.addEventListener('dragover',e=>{e.preventDefault();dropZone.classList.add('drag-over');});dropZone.addEventListener('dragleave',()=>dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop',e=>{e.preventDefault();dropZone.classList.remove('drag-over');handleFile(e.dataTransfer.files[0]);});
function handleFile(f){if(!f)return;const ext=f.name.split('.').pop().toLowerCase();if(ext==='xlsx'||ext==='xls')readExcel(f);else if(ext==='csv'||ext==='txt')readText(f);else if(ext==='docx')readDocx(f);else showToast('Unsupported file type');}
function readExcel(f){const r=new FileReader();r.onload=e=>{const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'});const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1});const names=[];rows.forEach(row=>row.forEach(cell=>{const v=String(cell||'').trim();if(v)names.push(v);}));setNames(names);};r.readAsArrayBuffer(f);}
function readText(f){const r=new FileReader();r.onload=e=>setNames(parseNames(e.target.result));r.readAsText(f);}
async function readDocx(f){try{const buf=await f.arrayBuffer();const{default:JSZip}=await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');const zip=await JSZip.loadAsync(buf);const xml=await zip.file('word/document.xml').async('string');const doc=new DOMParser().parseFromString(xml,'application/xml');const paras=Array.from(doc.querySelectorAll('p')).map(p=>Array.from(p.querySelectorAll('t')).map(t=>t.textContent).join('').trim()).filter(v=>v.length>0);setNames(paras);}catch(e){showToast('Could not read .docx – paste names manually.');}}

// ZIP import (fully browser-side, no server)
zipDropZone.addEventListener('click',()=>zipFileInput.click());zipFileInput.addEventListener('change',e=>{const f=e.target.files[0];if(f)processZip(f);});
zipDropZone.addEventListener('dragover',e=>{e.preventDefault();zipDropZone.classList.add('drag-over');});zipDropZone.addEventListener('dragleave',()=>zipDropZone.classList.remove('drag-over'));
zipDropZone.addEventListener('drop',e=>{e.preventDefault();zipDropZone.classList.remove('drag-over');const f=e.dataTransfer.files[0];if(f)processZip(f);});
async function processZip(file){
  showToast(t('toast_uploading'));
  try{
    const{default:JSZip}=await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
    const zip=await JSZip.loadAsync(file);
    const IMAGE_EXTS=['jpg','jpeg','png','gif','webp'];
    let names=[];const photoBlobs={};
    const nameFiles=Object.keys(zip.files).filter(n=>{const ext=n.split('.').pop().toLowerCase();return(ext==='csv'||ext==='txt')&&!n.startsWith('__MACOSX');});
    if(nameFiles.length){const content=await zip.file(nameFiles[0]).async('string');names=content.split(/\r?\n/).map(l=>l.trim()).filter(l=>l.length>0);}
    const imgFiles=Object.keys(zip.files).filter(n=>{const ext=n.split('.').pop().toLowerCase();return IMAGE_EXTS.includes(ext)&&!n.startsWith('__MACOSX');});
    await Promise.all(imgFiles.map(async path=>{const blob=await zip.file(path).async('blob');const fname=path.split('/').pop();const key=fname.replace(/\.[^.]+$/,'').trim().toLowerCase();photoBlobs[key]=URL.createObjectURL(blob);}));
    if(!names.length){showToast('❌ No names.csv found in ZIP');return;}
    const photosMap={};names.forEach(n=>{const key=n.trim().toLowerCase();photosMap[n]=photoBlobs[key]||null;});
    setNames(names,photosMap);renderPhotoPreview(photosMap);
    const photoCount=Object.values(photosMap).filter(Boolean).length;
    showToast(`${t('toast_upload_ok')} ${names.length} ${t('toast_names')}, ${photoCount} ${t('toast_photos')}`);
  }catch(e){showToast('❌ '+e.message);}
}
function renderPhotoPreview(photosMap){
  photoThumbs.innerHTML='';const matched=Object.entries(photosMap).filter(([,u])=>u);
  if(!matched.length){photoPreviewGrid.style.display='none';return;}
  photoPreviewCount.textContent=matched.length+' '+t('photos_matched');
  matched.forEach(([name,url])=>{const div=document.createElement('div');div.className='photo-thumb';const img=document.createElement('img');img.src=url;img.alt=name;const span=document.createElement('span');span.textContent=name;div.append(img,span);photoThumbs.appendChild(div);});
  photoPreviewGrid.style.display='block';
}
photoClearBtn.addEventListener('click',()=>{state.photos={};state.photoCache={};photoPreviewGrid.style.display='none';redrawBoth();});

shuffleBtn.addEventListener('click',()=>{
  if(!state.names.length)return;
  for(let i=state.names.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[state.names[i],state.names[j]]=[state.names[j],state.names[i]];}
  namesBox.innerText=state.names.join('\n');nameCount.textContent=state.names.length;redrawBoth();
  shuffleBtn.textContent=t('toast_shuffled');setTimeout(()=>shuffleBtn.textContent=t('shuffle'),1500);
});

function renderHistory(){
  if(!state.history.length){historyList.innerHTML=`<p class="empty-msg">${t('no_draws_yet')}</p>`;return;}
  historyList.innerHTML=state.history.map((h,i)=>{
    const ph=h.photo?`<img class="hi-photo" src="${h.photo}" alt=""/>` :`<span style="width:28px;height:28px;border-radius:50%;background:rgba(200,160,60,.3);display:inline-flex;align-items:center;justify-content:center;font-size:14px">🏆</span>`;
    return`<div class="history-item"><span class="hi-num">#${state.history.length-i}</span>${ph}<div class="hi-info"><span class="hi-name">${h.name}</span><span class="hi-time">${h.time}</span></div></div>`;
  }).join('');
}
clearHistoryBtn.addEventListener('click',()=>{state.history=[];renderHistory();});

// Spin
spinBtn.addEventListener('click',doSpin);spinBtnFS.addEventListener('click',doSpin);
function doSpin(){
  if(state.spinning)return;if(state.names.length<2){showToast(t('min_names'));return;}
  getAC();state.spinning=true;spinBtn.disabled=true;spinBtnFS.disabled=true;lockUI();
  winnerTicker.textContent='';winnerTickerFS.textContent='';
  const n=state.names.length,sa=(Math.PI*2)/n;
  const targetIdx=Math.floor(Math.random()*n);
  const exactFinal=-Math.PI/2-targetIdx*sa-sa/2;
  let delta=((exactFinal-state.currentAngle)%(Math.PI*2));if(delta<=0)delta+=Math.PI*2;
  const totalRot=(5+Math.floor(Math.random()*6))*Math.PI*2+delta;
  const finalAngle=state.currentAngle+totalRot,startAngle=state.currentAngle,duration=state.spinDuration*1000;
  let startTime=null,lastTick=0,tickInt=sa,customLoop=null;
  if(state.drawSoundType==='custom'&&state.customDrawAudio){customLoop=state.customDrawAudio.cloneNode?state.customDrawAudio.cloneNode():null;if(customLoop){customLoop.loop=true;customLoop.volume=state.drawVolume;customLoop.play().catch(()=>{});}}
  function easeOut(x){return 1-Math.pow(1-x,4);}
  function animate(ts){
    if(!startTime)startTime=ts;const prog=Math.min((ts-startTime)/duration,1);
    const angle=startAngle+totalRot*easeOut(prog);state.currentAngle=angle;state.fsAngle=angle;
    drawWheel(angle);drawWheelFS(angle);
    const norm=((angle%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
    if(Math.abs(norm-lastTick)>tickInt){if(state.drawSoundType!=='custom')playDrawSound();lastTick=norm;tickInt=sa*(0.5+prog*1.5);}
    if(prog<1){requestAnimationFrame(animate);}
    else{if(customLoop){customLoop.pause();customLoop.currentTime=0;}
      state.currentAngle=finalAngle;state.fsAngle=finalAngle;drawWheel(finalAngle);drawWheelFS(finalAngle);
      finishSpin(getSliceAtPointer(finalAngle,n,sa));}
  }
  requestAnimationFrame(animate);
}
function getSliceAtPointer(angle,n,sa){const local=((-Math.PI/2-angle)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);return Math.min(Math.floor(local/sa),n-1);}
function finishSpin(idx){
  const winner=state.names[idx],winnerPhoto=state.photos[winner.trim().toLowerCase()]||null;
  state.names.splice(idx,1);namesBox.innerText=state.names.join('\n');nameCount.textContent=state.names.length;
  drawWheel(state.currentAngle);drawWheelFS(state.fsAngle);
  state.spinning=false;spinBtn.disabled=false;spinBtnFS.disabled=false;unlockUI();playWinSound();
  winnerTicker.textContent=`🎉 ${winner}`;winnerTickerFS.textContent=`🎉 ${winner}`;
  const now=new Date();
  state.history.unshift({name:winner,photo:winnerPhoto,time:now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})+' '+now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})});
  showWinnerScreen(winner,winnerPhoto);
}

function showWinnerScreen(name,photoUrl){
  wsName.textContent=name;
  if(photoUrl){const img=document.createElement('img');img.src=photoUrl;wsPhotoBox.innerHTML='';wsPhotoBox.appendChild(img);}
  else{const photo=getPhotoForName(name);if(photo){const set=()=>{const i=document.createElement('img');i.src=photo.src;wsPhotoBox.innerHTML='';wsPhotoBox.appendChild(i);};if(photo.complete&&photo.naturalWidth>0)set();else{photo.onload=set;wsPhotoBox.innerHTML='<span class="ws-photo-placeholder">🏆</span>';}}else wsPhotoBox.innerHTML='<span class="ws-photo-placeholder">🏆</span>';}
  const fsEl=document.fullscreenElement||document.webkitFullscreenElement;
  if(fsEl){if(winnerScreen.parentElement!==fsEl)fsEl.appendChild(winnerScreen);if(cfCanvas.parentElement!==fsEl)fsEl.appendChild(cfCanvas);}
  else{if(winnerScreen.parentElement!==document.body)document.body.appendChild(winnerScreen);if(cfCanvas.parentElement!==document.body)document.body.appendChild(cfCanvas);}
  winnerScreen.classList.add('show');setTimeout(()=>triggerWinnerBurst(),400);setTimeout(()=>launchConfetti(),500);
}
function closeWinnerScreen(){winnerScreen.classList.remove('show');stopConfetti();if(winnerScreen.parentElement!==document.body)document.body.appendChild(winnerScreen);if(cfCanvas.parentElement!==document.body)document.body.appendChild(cfCanvas);}
wsCloseBtn.addEventListener('click',closeWinnerScreen);winnerScreen.addEventListener('click',e=>{if(e.target===winnerScreen)closeWinnerScreen();});

function triggerWinnerBurst(){
  wsFwRing.classList.remove('pop');void wsFwRing.offsetWidth;wsFwRing.classList.add('pop');
  winnerScreen.querySelectorAll('.ws-star').forEach(s=>s.remove());
  const sc=['#ffd700','#ff6b35','#ff3399','#00cfff','#88ff44','#ffffff','#f5d98a','#ffaa00'];
  for(let i=0;i<28;i++){const star=document.createElement('div');star.className='ws-star';const angle=360*(i/28),dist=180+Math.random()*160,color=sc[Math.floor(Math.random()*sc.length)];star.style.cssText=`--a:${angle}deg;--d:${dist}px;--sc:${color};--delay:${(Math.random()*.3).toFixed(2)}s;width:${6+Math.random()*6}px;height:${6+Math.random()*6}px;`;winnerScreen.appendChild(star);setTimeout(()=>star.remove(),1400);}
}

let cfParts=[],cfRAF=null;
function launchConfetti(){cfCanvas.width=window.innerWidth;cfCanvas.height=window.innerHeight;cfCanvas.style.display='block';const colors=['#f5d98a','#d4570a','#e8a020','#fff3c0','#c9913a','#ff6b35','#ffd700','#fff'];cfParts=Array.from({length:180},()=>({x:Math.random()*cfCanvas.width,y:-20,r:4+Math.random()*8,dx:(Math.random()-.5)*4,dy:2+Math.random()*5,color:colors[Math.floor(Math.random()*colors.length)],rot:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.22,shape:Math.random()>.5?'rect':'circle'}));cancelAnimationFrame(cfRAF);animateCF();setTimeout(stopConfetti,5500);}
function stopConfetti(){cancelAnimationFrame(cfRAF);cfCtx.clearRect(0,0,cfCanvas.width,cfCanvas.height);cfCanvas.style.display='none';cfParts=[];}
function animateCF(){cfCtx.clearRect(0,0,cfCanvas.width,cfCanvas.height);cfParts.forEach(p=>{p.x+=p.dx;p.y+=p.dy;p.rot+=p.spin;cfCtx.save();cfCtx.translate(p.x,p.y);cfCtx.rotate(p.rot);cfCtx.fillStyle=p.color;if(p.shape==='rect')cfCtx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);else{cfCtx.beginPath();cfCtx.arc(0,0,p.r/2,0,Math.PI*2);cfCtx.fill();}cfCtx.restore();});cfParts=cfParts.filter(p=>p.y<cfCanvas.height+30);if(cfParts.length)cfRAF=requestAnimationFrame(animateCF);else cfCanvas.style.display='none';}

menuBtn.addEventListener('click',()=>{sidebar.classList.add('open');backdrop.classList.add('show');});
closeSidebar.addEventListener('click',closeBar);backdrop.addEventListener('click',closeBar);
function closeBar(){sidebar.classList.remove('open');backdrop.classList.remove('show');}
spinDurSlider.addEventListener('input',()=>{state.spinDuration=+spinDurSlider.value;spinDurVal.textContent=spinDurSlider.value+'s';});
logoSizeSlider.addEventListener('input',()=>{const size=+logoSizeSlider.value;state.logoSize=size;logoSizeVal.textContent=size+'px';const sc=size/90;logoImg.style.transform=`scale(${sc})`;fsLogoImg.style.transform=`scale(${sc})`;});

function applyBg(file){const url=URL.createObjectURL(file);bgOverlay.style.backgroundImage=`url('${url}')`;bgOverlayFS.style.backgroundImage=`url('${url}')`;bgPreviewThumb.src=url;bgPreviewName.textContent=file.name;bgPreviewRow.style.display='flex';bgDropZone.style.display='none';}
bgDropZone.addEventListener('click',()=>bgFileInput.click());bgFileInput.addEventListener('change',e=>{const f=e.target.files[0];if(f)applyBg(f);});
bgDropZone.addEventListener('dragover',e=>{e.preventDefault();bgDropZone.classList.add('drag-over');});bgDropZone.addEventListener('dragleave',()=>bgDropZone.classList.remove('drag-over'));
bgDropZone.addEventListener('drop',e=>{e.preventDefault();bgDropZone.classList.remove('drag-over');const f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/'))applyBg(f);});
resetBg.addEventListener('click',()=>{bgOverlay.style.backgroundImage=`url('assets/bg-default.svg')`;bgOverlayFS.style.backgroundImage=`url('assets/bg-default.svg')`;bgPreviewRow.style.display='none';bgDropZone.style.display='';bgFileInput.value='';});

function applyLogo(file){const url=URL.createObjectURL(file);logoImg.src=url;fsLogoImg.src=url;logoPreviewThumb.src=url;logoPreviewName.textContent=file.name;logoPreviewRow.style.display='flex';logoDropZone.style.display='none';}
logoDropZone.addEventListener('click',()=>logoFileInput.click());logoFileInput.addEventListener('change',e=>{const f=e.target.files[0];if(f)applyLogo(f);});
logoDropZone.addEventListener('dragover',e=>{e.preventDefault();logoDropZone.classList.add('drag-over');});logoDropZone.addEventListener('dragleave',()=>logoDropZone.classList.remove('drag-over'));
logoDropZone.addEventListener('drop',e=>{e.preventDefault();logoDropZone.classList.remove('drag-over');const f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/'))applyLogo(f);});
resetLogo.addEventListener('click',()=>{logoImg.src='assets/logo-placeholder.svg';fsLogoImg.src='assets/logo-placeholder.svg';logoPreviewRow.style.display='none';logoDropZone.style.display='';logoFileInput.value='';});

function enterFS(){fsOverlay.classList.add('show');resizeFSCanvas();drawWheelFS(state.fsAngle);(fsOverlay.requestFullscreen||fsOverlay.webkitRequestFullscreen||function(){}).call(fsOverlay).catch(()=>{});}
function exitFS(){fsOverlay.classList.remove('show');if(document.fullscreenElement||document.webkitFullscreenElement)(document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(document);}
fullscreenBtn.addEventListener('click',enterFS);fsExitBtn.addEventListener('click',exitFS);
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)fsOverlay.classList.remove('show');});
document.addEventListener('webkitfullscreenchange',()=>{if(!document.webkitFullscreenElement)fsOverlay.classList.remove('show');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&fsOverlay.classList.contains('show'))exitFS();});
function resizeFSCanvas(){const s=Math.min(window.innerWidth*.82,window.innerHeight*.82,820);canvasFS.width=Math.round(s);canvasFS.height=Math.round(s);canvasFS.style.width=s+'px';canvasFS.style.height=s+'px';const b=Math.round(s*.2);spinBtnFS.style.width=b+'px';spinBtnFS.style.height=b+'px';spinBtnFS.style.fontSize=Math.round(b*.18)+'px';}
window.addEventListener('resize',()=>{resizeCanvas();if(fsOverlay.classList.contains('show')){resizeFSCanvas();drawWheelFS(state.fsAngle);}});
function resizeCanvas(){const s=Math.min(480,window.innerWidth*.78,window.innerHeight*.58);canvas.style.width=s+'px';canvas.style.height=s+'px';}

resizeCanvas();resizeFSCanvas();drawWheel(0);drawWheelFS(0);
