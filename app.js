import { firebaseConfig, isDemoMode } from './firebase-config.js';

const $ = (id) => document.getElementById(id);
const form = $('recordForm');
const toast = $('toast');
const LS_KEY = 'math_growth_tracker_DEMO_records_v1';
const topics = ['집합과 명제', '함수', '유리함수와 무리함수', '도형의 방정식'];
let records = [];
let backend = null;
let activeUser = null;
let unsubscribeRecords = null;
let toastTimer;

function setBanner(message, kind = '') {
  $('modeBanner').textContent = message;
  $('modeBanner').className = 'notice' + (kind ? ` ${kind}` : '');
}
function notify(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3800);
}
function showWorkspace(visible) {
  $('workspace').classList.toggle('hidden', !visible);
  $('loginPanel').classList.toggle('hidden', visible || isDemoMode);
  $('signOutButton').classList.toggle('hidden', !visible || isDemoMode);
}
function average(data) {
  return data.length ? data.reduce((sum, item) => sum + item, 0) / data.length : 0;
}
function formatDate(value) {
  if (!value) return '저장 중';
  let dt;
  if (typeof value.toDate === 'function') dt = value.toDate();
  else dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? '-' : dt.toLocaleString('ko-KR', {year:'numeric', month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
}
function timestampValue(value) {
  if (value?.toMillis) return value.toMillis();
  const n = new Date(value || 0).getTime();
  return Number.isFinite(n) ? n : 0;
}
function sortedRecords(list) { return [...list].sort((a, b) => timestampValue(b.createdAt) - timestampValue(a.createdAt)); }
function cleanCsvCell(value) {
  // CSV 스프레드시트 수식 인젝션 방지
  let s = String(value ?? '');
  if (/^[\s]*[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
function renderStatistics() {
  $('totalRecords').innerHTML = `${records.length}<small>건</small>`;
  $('averageAccuracy').innerHTML = `${Math.round(average(records.map(r => r.accuracy)))}<small>%</small>`;
  $('averageConfidence').innerHTML = `${average(records.map(r => r.confidence)).toFixed(1)}<small>/5</small>`;
  $('totalMinutes').innerHTML = `${records.reduce((n, r) => n + r.minutes, 0)}<small>분</small>`;
  $('aiCount').textContent = `${records.filter(r => r.usedAI).length}건`;
  $('latestAccuracy').textContent = records.length ? `${records[0].accuracy}%` : '-';
  const topicCounts = new Map();
  records.forEach(r => topicCounts.set(r.topic, (topicCounts.get(r.topic) || 0) + 1));
  $('topTopic').textContent = [...topicCounts].sort((a,b) => b[1]-a[1])[0]?.[0] || '-';
  $('updatedLabel').textContent = `최근 갱신: ${new Date().toLocaleTimeString('ko-KR')}`;
}
function filteredRecords() {
  const q = $('searchInput').value.trim().toUpperCase();
  const topic = $('topicFilter').value;
  return records.filter(r => r.alias.toUpperCase().includes(q) && (topic === 'all' || topic === r.topic));
}
function cell(tr, text) {
  const td = document.createElement('td');
  td.textContent = text;
  tr.appendChild(td);
  return td;
}
function renderTable() {
  const data = filteredRecords();
  const tbody = $('recordsBody');
  tbody.replaceChildren();
  $('emptyState').classList.toggle('hidden', data.length > 0);
  if (!data.length) $('emptyState').textContent = records.length ? '검색 결과가 없습니다.' : '아직 기록이 없습니다. 왼쪽 입력창에서 첫 기록을 저장해 보세요.';
  for (const row of data) {
    const tr = document.createElement('tr');
    cell(tr, row.alias);
    cell(tr, row.topic);
    cell(tr, `${row.accuracy}%`);
    cell(tr, `${row.confidence}/5`);
    const aiCell = document.createElement('td');
    const pill = document.createElement('span');
    pill.className = 'pill' + (row.usedAI ? '' : ' off');
    pill.textContent = row.usedAI ? '활용' : '미활용';
    aiCell.appendChild(pill);
    tr.appendChild(aiCell);
    cell(tr, `${row.minutes}분`);
    const dateCell = cell(tr, formatDate(row.createdAt));
    dateCell.title = row.note || '';
    const actionCell = document.createElement('td');
    const del = document.createElement('button');
    del.type = 'button'; del.textContent = '삭제'; del.className = 'delete-button';
    del.addEventListener('click', () => removeRecord(row.id));
    actionCell.appendChild(del); tr.appendChild(actionCell);
    tbody.appendChild(tr);
  }
}
function drawChart() {
  const canvas = $('accuracyChart');
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(260, Math.round(rect.width || 520));
  const height = Math.max(200, Math.round(rect.height || 250));
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr; canvas.height = height * dpr;
  const ctx = canvas.getContext('2d'); ctx.scale(dpr,dpr);
  const L=39,R=16,T=15,B=32,w=width-L-R,h=height-T-B;
  ctx.font = '11px sans-serif';ctx.textAlign='right';ctx.lineWidth=1;
  for(let score=0;score<=100;score+=25){
    const y=T+h-h*score/100;
    ctx.strokeStyle='#e6edf7'; ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(width-R,y);ctx.stroke();
    ctx.fillStyle='#8192a7';ctx.fillText(String(score),L-10,y+4);
  }
  const data=records.slice(0,12).reverse();
  if(!data.length){ctx.textAlign='center';ctx.fillStyle='#9cacc1';ctx.fillText('학습 기록을 저장하면 그래프가 표시됩니다.',width/2,height/2);return;}
  const coords=data.map((r,i)=>({ x: L+(data.length===1?w/2:(i/(data.length-1))*w),y:T+h-(r.accuracy/100)*h}));
  ctx.lineWidth=3;ctx.strokeStyle='#2a75d7';ctx.lineJoin='round';
  ctx.beginPath();coords.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
  coords.forEach((p,i)=>{
    ctx.beginPath();ctx.arc(p.x,p.y,4.3,0,2*Math.PI);ctx.fillStyle='#ffffff';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle='#2a75d7';ctx.stroke();
    const k=i+1; if(data.length<=7 || i%2===0 || i===data.length-1){ctx.fillStyle='#8192a7';ctx.textAlign='center';ctx.font='10px sans-serif';ctx.fillText(String(k),p.x,height-10);}
  });
}
function render() { records = sortedRecords(records); renderStatistics(); renderTable(); drawChart(); }
function inputData() {
  const fd = new FormData(form);
  const alias = String(fd.get('alias') || '').trim().toUpperCase();
  const note = String(fd.get('note') || '').trim();
  const topic = String(fd.get('topic') || '');
  const accuracy = Number(fd.get('accuracy'));
  const confidence = Number(fd.get('confidence'));
  const minutes = Number(fd.get('minutes'));
  if (!/^S\d{3}$/.test(alias)) throw new Error('학생 코드는 S001처럼 S와 숫자 3자리로 입력하세요.');
  if (!topics.includes(topic)) throw new Error('올바른 수학 단원을 선택하세요.');
  if (!Number.isInteger(accuracy) || accuracy < 0 || accuracy > 100 || accuracy % 5 !== 0) throw new Error('정답률은 0~100 사이로 선택하세요.');
  if (!Number.isInteger(confidence) || confidence < 1 || confidence > 5) throw new Error('자신감은 1~5 사이여야 합니다.');
  if (!Number.isInteger(minutes) || minutes < 10 || minutes > 120 || minutes % 10 !== 0) throw new Error('학습 시간은 10~120분입니다.');
  if (note.length > 200) throw new Error('소감은 200자 이내로 작성하세요.');
  return { alias, topic, accuracy, confidence, minutes, usedAI: fd.get('usedAI') === 'on', note };
}
function resetForm() {
  form.reset();
  document.querySelector('input[name=alias]').focus();
  updateSliders();
}
async function saveRecord(evt) {
  evt.preventDefault();
  const btn=$('saveButton');
  try {
    const data=inputData();btn.disabled=true;
    if(isDemoMode){
      records.unshift({...data,id:crypto.randomUUID(),createdAt:new Date().toISOString()});
      localStorage.setItem(LS_KEY,JSON.stringify(records));
      render();notify('체험 모드: 브라우저에 저장했습니다. 실제 DB 저장은 아닙니다.');
    } else {
      if(!activeUser) throw new Error('로그인이 필요합니다.');
      await backend.addDoc(backend.collection(backend.db,'learningRecords'), {...data, createdAt:backend.serverTimestamp()});
      notify('Firebase DB에 저장했습니다.');
    }
    resetForm();
  } catch(e){notify(e.message || '저장에 실패했습니다.');console.error(e);}
  finally{btn.disabled=false;}
}
async function removeRecord(id) {
  if(!window.confirm('이 기록을 삭제할까요? 복구할 수 없습니다.')) return;
  try {
    if(isDemoMode){records=records.filter(r=>r.id!==id);localStorage.setItem(LS_KEY,JSON.stringify(records));render();}
    else {if(!activeUser) throw new Error('로그인이 필요합니다.');await backend.deleteDoc(backend.doc(backend.db,'learningRecords',id));}
    notify('기록을 삭제했습니다.');
  } catch(e){console.error(e);notify('삭제에 실패했습니다: '+(e.code||e.message));}
}
function exportCsv() {
  if(!records.length){notify('내보낼 학습 기록이 없습니다.');return;}
  const rows=[['식별코드','단원','정답률(%)','자신감(5점)','학습시간(분)','AI 코스웨어 활용','학습 소감','기록일시'],
    ...filteredRecords().map(r=>[r.alias,r.topic,r.accuracy,r.confidence,r.minutes,r.usedAI?'예':'아니요',r.note,formatDate(r.createdAt)])];
  const csv='\uFEFF'+rows.map(line=>line.map(cleanCsvCell).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='공통수학2_학습기록.csv';a.click();URL.revokeObjectURL(url);
  notify('현재 검색된 학습 기록을 CSV로 내보냈습니다.');
}
function updateSliders() {
  $('accuracyValue').textContent=$('accuracyInput').value+'%';
  $('confidenceValue').textContent=$('confidenceInput').value+' / 5';
  $('minutesValue').textContent=$('minutesInput').value+'분';
}
function attachListeners() {
  form.addEventListener('submit',saveRecord);
  $('loginForm').addEventListener('submit',login);
  $('signOutButton').addEventListener('click',async()=>{if(backend) await backend.signOut(backend.auth);});
  ['accuracyInput','confidenceInput','minutesInput'].forEach(id=>$(id).addEventListener('input',updateSliders));
  ['searchInput','topicFilter'].forEach(id=>$(id).addEventListener('input',renderTable));
  $('exportButton').addEventListener('click',exportCsv);
  window.addEventListener('resize',drawChart);
  updateSliders();
}
async function login(evt){
  evt.preventDefault();
  if(!backend) return;
  const button=$('loginForm').querySelector('button');button.disabled=true;
  try {await backend.signInWithEmailAndPassword(backend.auth,$('emailInput').value.trim(),$('passwordInput').value);$('passwordInput').value='';}
  catch(e){console.error(e);notify('로그인 실패: 이메일·비밀번호 또는 Firebase 인증 설정을 확인하세요.');}
  finally{button.disabled=false;}
}
async function initFirebase(){
  try {
    const [core,authApi,firestoreApi]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js')
    ]);
    const app=core.initializeApp(firebaseConfig);
    backend={...authApi,...firestoreApi, auth:authApi.getAuth(app), db:firestoreApi.getFirestore(app)};
    setBanner('실제 Firebase 연동 모드 · 승인된 교사 계정으로 로그인해야 학습 기록을 사용할 수 있습니다.','success');
    authApi.onAuthStateChanged(backend.auth,(user)=>{
      if(unsubscribeRecords){unsubscribeRecords();unsubscribeRecords=null;}
      activeUser=user;
      showWorkspace(!!user);
      if(!user){$('sessionLabel').textContent='로그인이 필요합니다';records=[];render();return;}
      $('sessionLabel').textContent='로그인: '+(user.email||'교사 계정');
      unsubscribeRecords=firestoreApi.onSnapshot(firestoreApi.collection(backend.db,'learningRecords'),(snapshot)=>{
        records=snapshot.docs.map(d=>({id:d.id,...d.data()}));render();
      },(error)=>{
        console.error(error);records=[];render();
        setBanner('DB 접근 거부 · Firestore 규칙에 승인된 사용자 UID가 정확히 등록되었는지 확인하세요.','warning');
        notify('데이터 읽기 거부: '+(error.code||error.message));
      });
    });
  }catch(e){console.error(e);setBanner('Firebase 로딩 실패 · 구성값 또는 인터넷 연결을 확인하세요.','warning');showWorkspace(false);}
}
function initDemo(){
  try {records=JSON.parse(localStorage.getItem(LS_KEY)||'[]');if(!Array.isArray(records))records=[];}
  catch{records=[];}
  $('sessionLabel').textContent='화면 체험 모드';
  setBanner('현재는 체험 모드입니다. 데이터는 이 브라우저에만 저장되며 Firebase DB와 연결되지 않습니다. 교수님 제출 전 반드시 firebase-config.js를 설정하고 실제 DB 모드로 시험하세요.','warning');
  showWorkspace(true);render();
}
attachListeners();
if(isDemoMode) initDemo(); else initFirebase();
