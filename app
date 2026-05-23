<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>加班費精算機</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Microsoft JhengHei',sans-serif;background:#f0f2f5}
.container{max-width:390px;margin:0 auto;background:#fff;padding:16px;min-height:100vh}
h1{font-size:20px;text-align:center;margin-bottom:16px}
label{font-size:14px;margin-bottom:4px;display:block}

input{width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-bottom:10px;font-size:16px}
input[type="date"]{width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;margin-bottom:10px;font-size:16px;background:#fff;color:#000}

.type-group{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}
.type-btn{padding:10px 6px;border-radius:8px;font-size:14px;border:none;background:#eee;color:#333}
.type-btn.active{background:#3498db;color:#fff}
.type-rest.active{background:#27ae60;color:#fff}
.type-holiday.active{background:#e67e22;color:#fff}

.btn-group{display:flex;gap:8px;margin-bottom:16px}
button{flex:1;padding:12px;border:none;border-radius:8px;background:#3498db;color:#fff;font-size:16px}
.btn-reset{background:#e74c3c}
.btn-settle{background:#27ae60}

.btn-del{background:#e74c3c;color:#fff;border:none;border-radius:6px;padding:6px 8px;font-size:13px}
h2{font-size:16px;margin-bottom:8px}
table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px}
th,td{border:1px solid #eee;padding:8px;text-align:center}
th{background:#f5f7fa}
.total{background:#f8f9fa;padding:12px;border-radius:8px;font-weight:bold;color:#e74c3c}
.festival{font-size:12px;color:#e67e22;margin-bottom:10px}
.day-stat{color:#0066cc;margin-top:8px;font-size:15px}
</style>
</head>
<body>
<div class="container">
    <h1>加班費精算機</h1>

    <label>基本時薪</label>
    <input type="number" id="wage" value="260">

    <label>日期</label>
    <input type="date" id="date">
    <div class="festival" id="festival"></div>

    <label>加班類型</label>
    <div class="type-group">
        <button class="type-btn type-weekday" onclick="selectType('weekday')">平日</button>
        <button class="type-btn type-rest" onclick="selectType('rest')">休息日</button>
        <button class="type-btn type-holiday" onclick="selectType('holiday')">國定假日</button>
    </div>

    <label>加班時數</label>
    <input type="number" id="hours" step="0.5" placeholder="平日可留空">

    <div class="btn-group">
        <button onclick="add()">新增</button>
        <button class="btn-settle" onclick="settle()">結算</button>
        <button class="btn-reset" onclick="resetAll()">重置</button>
    </div>

    <h2>明細</h2>
    <table>
        <tr><th>日期</th><th>時數</th><th>類</th><th>金額</th><th>刪除</th></tr>
        <tbody id="list"></tbody>
    </table>

    <div class="total">
        平日工資：<span id="baseTotal">0.0000</span><br>
        加班費：<span id="otTotal">0.0000</span><br>
        結算金額：<span id="final">0</span>
        <div class="day-stat" id="dayStat"></div>
    </div>
</div>

<script>
const TW_HOLIDAYS = {
  "2025-01-01":"元旦","2025-01-28":"除夕","2025-01-29":"春節","2025-01-30":"春節","2025-01-31":"春節","2025-02-01":"春節","2025-02-02":"春節","2025-02-03":"春節","2025-02-04":"春節","2025-02-28":"和平紀念日","2025-04-04":"兒童節/清明","2025-05-01":"勞動節","2025-05-31":"端午節","2025-09-28":"教師節","2025-10-06":"中秋節","2025-10-10":"國慶日","2025-10-25":"光復節","2025-12-25":"行憲紀念日",
  "2026-01-01":"元旦","2026-02-14":"春節","2026-02-15":"春節","2026-02-16":"除夕","2026-02-17":"春節","2026-02-18":"春節","2026-02-19":"春節","2026-02-20":"春節","2026-02-21":"春節","2026-02-22":"春節","2026-02-28":"和平紀念日","2026-04-03":"清明","2026-04-04":"兒童節","2026-04-05":"清明","2026-05-01":"勞動節","2026-06-19":"端午節","2026-09-25":"中秋節","2026-09-28":"教師節","2026-10-10":"國慶日","2026-10-25":"光復節","2026-12-25":"行憲紀念日"
};

let data = [];
let selectedType = 'weekday';
let lastHours = '';

const typeShort = {weekday:'平', rest:'休', holiday:'國'};
const typeClass = {weekday:'type-weekday', rest:'type-rest', holiday:'type-holiday'};

function loadData() {
  const saved = localStorage.getItem('overtimeData_final');
  if (saved) {
    try { data = JSON.parse(saved); } catch(e) { data = []; }
  }
  const savedWage = localStorage.getItem('defaultWage');
  if (savedWage) document.getElementById('wage').value = savedWage;
  show();
}

function saveData() {
  localStorage.setItem('overtimeData_final', JSON.stringify(data));
  localStorage.setItem('defaultWage', document.getElementById('wage').value);
}

function checkDate(ymd) {
  const [y,m,d] = ymd.split('-');
  const dt = new Date(y, m-1, d);
  const day = dt.getDay();
  const isWeekend = (day === 0 || day === 6);
  const holidayName = TW_HOLIDAYS[ymd] || '';
  const isHoliday = !!holidayName;
  return { isWeekend, isHoliday, holidayName };
}

document.getElementById('date').addEventListener('change', function() {
  const ymd = this.value;
  if (!ymd) return;
  const { isWeekend, isHoliday, holidayName } = checkDate(ymd);
  document.getElementById('festival').textContent = holidayName ? `🎊 ${holidayName}` : '';
  let autoType = 'weekday';
  if (isHoliday) autoType = 'holiday';
  else if (isWeekend) autoType = 'rest';
  selectType(autoType);
});

const today = new Date();
const todayYmd = today.getFullYear() + '-' +
  String(today.getMonth()+1).padStart(2,'0') + '-' +
  String(today.getDate()).padStart(2,'0');
document.getElementById('date').value = todayYmd;
document.getElementById('date').dispatchEvent(new Event('change'));

function selectType(t) {
  selectedType = t;
  document.querySelectorAll('.type-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector(`.${typeClass[t]}`).classList.add('active');
}

function calcOT(hourly, h, type) {
  h = parseFloat(h)||0;
  hourly = parseFloat(hourly)||0;
  if(type === 'weekday'){
    const p1 = Math.min(h,2); const p2 = Math.max(h-2,0);
    return p1*hourly*1.334 + p2*hourly*1.667;
  }
  if(type === 'rest'){
    const p1 = Math.min(h,2); const p2 = Math.min(Math.max(h-2,0),6); const p3 = Math.max(h-8,0);
    return p1*hourly*1.334 + p2*hourly*1.667 + p3*hourly*2.667;
  }
  if(type === 'holiday'){
    const p1 = Math.min(h,8); const p2 = Math.min(Math.max(h-8,0),2); const p3 = Math.max(h-10,0);
    return p1*hourly*2.0 + p2*hourly*1.334 + p3*hourly*1.667;
  }
  return 0;
}

function add() {
  const d = document.getElementById('date').value;
  const t = selectedType;
  let h = document.getElementById('hours').value.trim();
  const wage = document.getElementById('wage').value;

  if(!d)return alert('請選擇日期');

  if(t === 'weekday'){
    if(h === '' || isNaN(parseFloat(h))) h = '0';
  } else {
    if(!h || isNaN(parseFloat(h)) || parseFloat(h)<=0) return alert('休息日/國定假日請輸入加班時數');
  }

  lastHours = h;
  const hourly = parseFloat(wage)||0;
  const ot = calcOT(hourly, h, t);

  data.push({ d, t, h, ot });
  saveData();
  show();
}

function show() {
  const tb = document.getElementById('list');
  tb.innerHTML='';
  let sumOT = 0, sumBase = 0;
  let cntWeekday = 0, cntRest = 0, cntHoliday = 0;
  const wage = parseFloat(document.getElementById('wage').value) || 0;

  data.forEach((it,i)=>{
    sumOT += it.ot;
    let displayAmt = it.ot;
    // 平日明細金額 = 基本8小時 + 加班
    if(it.t === 'weekday') displayAmt = wage * 8 + it.ot;

    tb.innerHTML+=`<tr>
      <td>${it.d}</td>
      <td>${it.h}</td>
      <td>${typeShort[it.t]}</td>
      <td>${displayAmt.toFixed(4)}</td>
      <td><button class="btn-del" onclick="del(${i})">刪</button></td>
    </tr>`;

    if(it.t === 'weekday'){ cntWeekday++; sumBase += wage * 8; }
    else if(it.t === 'rest') cntRest++;
    else if(it.t === 'holiday') cntHoliday++;
  });

  document.getElementById('baseTotal').innerText = sumBase.toFixed(4);
  document.getElementById('otTotal').innerText = sumOT.toFixed(4);
  document.getElementById('dayStat').innerText = 
    `天數統計：平日${cntWeekday} / 休息日${cntRest} / 國定假日${cntHoliday}`;
  document.getElementById('hours').value = lastHours;
}

function del(i){
  data.splice(i,1);
  saveData();
  show();
}

function settle(){
  const wage = parseFloat(document.getElementById('wage').value) || 0;
  let sumBase = 0, sumOT = 0;
  data.forEach(it=>{
    sumOT += it.ot;
    if(it.t === 'weekday') sumBase += wage * 8;
  });
  const final = sumBase + sumOT;
  document.getElementById('final').innerText = Math.round(final);
}

function resetAll(){
  if(confirm('確定清空整月紀錄？')){
    data=[]; saveData(); show();
    document.getElementById('final').innerText='0';
  }
}

window.addEventListener('DOMContentLoaded', loadData);
</script>
</body>
</html>