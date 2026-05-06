// ============================================================
// 热量追踪 v3 - 主逻辑
// 新增：头像选择、膳食指南、运动记录、历史日历
// ============================================================

const $ = (id) => document.getElementById(id);

// --- State ---
let state = {
  avatar: 'pig',
  gender: 'male', goalType: 'lose',
  age: 30, height: 170, weight: 70,
  bmr: null, standardWeight: null, bmi: null,
  targetWeight: 65, targetDays: 60,
  exerciseType: 'running', exerciseDays: 4,
  dailyCalorieTarget: null, dailyExerciseBurn: null,
  dailyExerciseMinutes: null, dailyDeficit: null,
  // food: { "2026-05-06": [{name,grams,kcal,time,meal}] }
  // exercise: { "2026-05-06": [{type,minutes,kcal,time}] }
  foodHistory: {},
  exerciseHistory: {},
  waterHistory: {},
  calendarMonth: null,
};

const STORAGE_KEY = 'calorie_tracker_v3';

function getToday() { return new Date().toISOString().slice(0, 10); }

function todayFoods() { return state.foodHistory[getToday()] || []; }
function todayExercise() { return state.exerciseHistory[getToday()] || []; }
function todayWater() { return state.waterHistory[getToday()] || 0; }

function foodTotalToday() { return todayFoods().reduce((s, f) => s + f.kcal, 0); }
function exTotalToday() { return todayExercise().reduce((s, e) => s + e.kcal, 0); }

// --- Persistence ---
function saveState() {
  const toSave = {
    avatar: state.avatar, gender: state.gender, goalType: state.goalType,
    age: state.age, height: state.height, weight: state.weight,
    bmr: state.bmr, standardWeight: state.standardWeight, bmi: state.bmi,
    targetWeight: state.targetWeight, targetDays: state.targetDays,
    exerciseType: state.exerciseType, exerciseDays: state.exerciseDays,
    dailyCalorieTarget: state.dailyCalorieTarget,
    dailyExerciseBurn: state.dailyExerciseBurn,
    dailyExerciseMinutes: state.dailyExerciseMinutes,
    dailyDeficit: state.dailyDeficit,
    foodHistory: state.foodHistory,
    exerciseHistory: state.exerciseHistory,
    waterHistory: state.waterHistory,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  updateWeekHistory();
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    for (const k of Object.keys(d)) {
      if (d[k] !== undefined) state[k] = d[k];
    }
  } catch(e) {}
}

function getWeekKey() {
  const dt = new Date();
  const day = dt.getDay();
  const mon = new Date(dt);
  mon.setDate(dt.getDate() - (day === 0 ? 6 : day - 1));
  return mon.toISOString().slice(0, 10);
}

function updateWeekHistory() {
  const today = getToday();
  const weekKey = getWeekKey();
  const history = JSON.parse(localStorage.getItem('calorie_week_history_v3') || '{}');
  if (!history[weekKey]) history[weekKey] = {};
  const foods = state.foodHistory[today] || [];
  const totalCal = foods.reduce((s, f) => s + f.kcal, 0);
  history[weekKey][today] = {
    totalCal,
    target: state.dailyCalorieTarget,
    onTrack: state.dailyCalorieTarget ? (totalCal <= state.dailyCalorieTarget + 100) : true,
  };
  const weeks = Object.keys(history).sort();
  while (weeks.length > 6) delete history[weeks.shift()];
  localStorage.setItem('calorie_week_history_v3', JSON.stringify(history));
}

// =====================================================
// NAVIGATION
// =====================================================
function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  $(`tab-${name}`).classList.add('active');
  document.querySelector(`.nav-btn[data-tab="${name}"]`).classList.add('active');
  if (name === 'progress') renderProgress();
  if (name === 'food') { renderFoodList(); updateFoodTotal(); }
}

document.addEventListener('DOMContentLoaded', () => {
  // Main nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Sub nav
  document.querySelectorAll('.sub-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.sub-tab').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      $(`sub-${btn.dataset.sub}`).classList.add('active');
      if (btn.dataset.sub === 'calendar') renderCalendar();
      if (btn.dataset.sub === 'exercise') renderExerciseList();
      if (btn.dataset.sub === 'eat') { renderFoodList(); updateFoodTotal(); }
    });
  });

  // Gender toggle
  document.getElementById('genderToggle').addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    state.gender = btn.dataset.val;
    document.querySelectorAll('#genderToggle .toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    saveState();
  });

  // Goal toggle
  document.getElementById('goalToggle').addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    state.goalType = btn.dataset.val;
    document.querySelectorAll('#goalToggle .toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    saveState();
    if (state.dailyCalorieTarget) renderDietGuide();
  });

  // Food gram auto-calc
  $('foodGrams').addEventListener('input', () => {
    const kcalPer100 = $('foodGrams').dataset.kcalPer100;
    if (kcalPer100) {
      const g = parseFloat($('foodGrams').value) || 0;
      $('foodCalories').value = Math.round(kcalPer100 * g / 100);
    }
  });

  // Exercise burn estimate
  $('exMinutes').addEventListener('input', updateExEstimate);
  $('exType').addEventListener('change', updateExEstimate);

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.food-search-wrapper')) {
      $('foodDropdown').classList.remove('show');
    }
  });

  init();
});

// =====================================================
// AVATAR
// =====================================================
function renderAvatars() {
  const grid = $('avatarGrid');
  grid.innerHTML = AVATARS.map(a => `
    <div class="avatar-option${a.id === state.avatar ? ' selected' : ''}" 
         onclick="selectAvatar('${a.id}')" title="${a.name}">${a.emoji}</div>
  `).join('');
  updateAvatarDisplay();
}

function selectAvatar(id) {
  state.avatar = id;
  document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
  const target = Array.from(document.querySelectorAll('.avatar-option')).find(o => o.textContent.trim() === AVATARS.find(a=>a.id===id).emoji);
  if (target) target.classList.add('selected');
  updateAvatarDisplay();
  saveState();
}

function updateAvatarDisplay() {
  const a = AVATARS.find(a => a.id === state.avatar);
  $('avatarDisplay').textContent = a ? a.emoji : '🐷';
}

// =====================================================
// BMR
// =====================================================
function calculateBMR() {
  state.age = parseInt($('age').value) || 30;
  state.height = parseInt($('height').value) || 170;
  state.weight = parseFloat($('weight').value) || 70;

  state.bmr = Math.round(calcBMR(state.weight, state.height, state.age, state.gender));
  state.standardWeight = Math.round(calcStandardWeight(state.height, state.gender));
  state.bmi = calcBMI(state.weight, state.height);

  $('valBMR').textContent = state.bmr;
  $('valStdWeight').textContent = state.standardWeight;
  $('valBMI').textContent = state.bmi.toFixed(1);
  const bmiInfo = getBMICategory(state.bmi);
  $('valBodyType').textContent = bmiInfo.cat;
  $('valBodyType').style.color = bmiInfo.color;
  $('bmrResults').style.display = 'block';

  animateNum($('valBMR'), state.bmr);
  animateNum($('valStdWeight'), state.standardWeight);
  saveState();
  renderProgress();
}

function animateNum(el, target) {
  const start = parseInt(el.textContent) || 0;
  if (start === target) return;
  const dur = 600, st = performance.now();
  function step(now) {
    const p = Math.min((now - st) / dur, 1);
    el.textContent = Math.round(start + (target - start) * (1 - Math.pow(1-p, 3)));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// =====================================================
// PLAN + DIET GUIDE
// =====================================================
function generatePlan() {
  if (!state.bmr) calculateBMR();

  state.targetWeight = parseFloat($('targetWeight').value) || 65;
  state.targetDays = parseInt($('targetDays').value) || 60;
  state.exerciseType = $('exerciseType').value;
  state.exerciseDays = parseInt($('exerciseDays').value) || 4;

  const diff = state.targetWeight - state.weight;
  state.dailyDeficit = Math.round(Math.abs(diff) * 7700 / state.targetDays);
  const tdee = Math.round(state.bmr * 1.2);
  state.dailyCalorieTarget = state.goalType === 'lose' ? Math.round(tdee - state.dailyDeficit) : Math.round(tdee + state.dailyDeficit);
  if (state.dailyCalorieTarget < 1200) state.dailyCalorieTarget = 1200;

  const ex = EXERCISE_DATABASE[state.exerciseType];
  state.dailyExerciseBurn = Math.round(state.dailyDeficit * 0.3);
  state.dailyExerciseMinutes = Math.round((state.dailyExerciseBurn / (ex.met * state.weight)) * 60);
  const dmps = Math.round(state.dailyExerciseMinutes * 7 / parseInt(state.exerciseDays));

  $('planCalTarget').textContent = state.dailyCalorieTarget;
  $('planExBurn').textContent = state.dailyExerciseBurn;
  $('planExTime').textContent = dmps + ' min';
  $('planDeficit').textContent = state.dailyDeficit;
  $('planDeficitLabel').textContent = state.goalType === 'lose' ? '每日热量缺口' : '每日热量盈余';
  $('planDeficit').style.color = state.goalType === 'lose' ? 'var(--red)' : 'var(--green)';
  $('planResults').style.display = 'block';

  renderDietGuide();
  updateFoodTotal();
  saveState();
}

function renderDietGuide() {
  const guide = DIET_GUIDELINES[state.goalType] || DIET_GUIDELINES.lose;
  $('dietGrid').innerHTML = guide.map(g => `
    <div class="diet-item">
      <div class="diet-item-icon">${g.icon}</div>
      <div class="diet-item-info">
        <div class="diet-item-name">${g.name}</div>
        <div class="diet-item-grams">${g.grams}${g.unit}/天</div>
        <div class="diet-item-desc">${g.desc}</div>
      </div>
    </div>
  `).join('');
  $('dietGuideCard').style.display = 'block';
}

// =====================================================
// FOOD DIARY
// =====================================================
function searchFood() {
  const q = $('foodSearch').value.toLowerCase().trim();
  const dd = $('foodDropdown');
  if (!q) { dd.classList.remove('show'); return; }
  const results = FOOD_DATABASE.filter(f => f.name.includes(q) || f.category.includes(q)).slice(0, 10);
  dd.innerHTML = results.length === 0
    ? '<div class="food-dropdown-item" style="color:var(--text-tertiary);">未找到，请手动输入热量</div>'
    : results.map(f => `<div class="food-dropdown-item" onclick="selectFood('${f.name}', ${f.kcal})">${f.name}<span class="kcal-badge">${f.kcal} 大卡/100g</span></div>`).join('');
  dd.classList.add('show');
}

function selectFood(name, kcalPer100) {
  $('foodSearch').value = name;
  $('foodGrams').dataset.kcalPer100 = kcalPer100;
  const g = parseFloat($('foodGrams').value) || 100;
  $('foodCalories').value = Math.round(kcalPer100 * g / 100);
  $('foodDropdown').classList.remove('show');
}

function addFood() {
  const name = $('foodSearch').value.trim();
  let kcal = parseInt($('foodCalories').value);
  const grams = parseFloat($('foodGrams').value) || 100;
  const date = $('foodDate').value || getToday();
  const meal = $('foodMeal').value || 'snack';
  if (!name) return;
  if (!kcal || kcal <= 0) {
    const m = FOOD_DATABASE.find(f => f.name === name);
    if (m) kcal = Math.round(m.kcal * grams / 100);
    else return;
  }
  if (!state.foodHistory[date]) state.foodHistory[date] = [];
  state.foodHistory[date].push({ name, grams, kcal, time: new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}), meal });
  $('foodSearch').value = ''; $('foodGrams').value = '100'; $('foodCalories').value = '';
  delete $('foodGrams').dataset.kcalPer100;
  renderFoodList(); updateFoodTotal(); saveState();
}

function removeFood(date, index) {
  state.foodHistory[date].splice(index, 1);
  if (state.foodHistory[date].length === 0) delete state.foodHistory[date];
  renderFoodList(); updateFoodTotal(); saveState();
}

function clearTodayFood() {
  const t = getToday();
  delete state.foodHistory[t];
  delete state.waterHistory[t];
  renderFoodList(); updateFoodTotal(); saveState();
}

function addQuickWater() {
  const t = getToday();
  state.waterHistory[t] = (state.waterHistory[t] || 0) + 1;
  saveState();
  renderFoodList();
}

function renderFoodList() {
  const t = getToday();
  const foods = state.foodHistory[t] || [];
  const list = $('foodList');
  if (foods.length === 0) {
    list.innerHTML = '<div class="empty-state"><span class="empty-icon">🍽</span>还没有食物记录</div>';
    $('foodTotal').style.display = 'none';
    return;
  }
  const mealLabels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };
  const mealClasses = { breakfast: 'bf', lunch: 'lu', dinner: 'di', snack: 'sn' };
  list.innerHTML = foods.map((f, i) => `
    <div class="food-item">
      <div class="fi-left">
        <span class="fi-badge ${mealClasses[f.meal]||'sn'}">${mealLabels[f.meal]||'加餐'}</span>
        <span class="fi-time">${f.time}</span>
        <span class="fi-name">${f.name}</span>
        <span class="fi-grams">${f.grams}g</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <span class="fi-cal">${f.kcal} 大卡</span>
        <button class="fi-del" onclick="removeFood('${t}',${i})">✕</button>
      </div>
    </div>
  `).join('');
  $('foodTotal').style.display = 'block';
}

function updateFoodTotal() {
  const total = foodTotalToday();
  $('totalCalories').textContent = `${total} 大卡`;
  $('foodTotal').style.display = 'block';
  if (state.dailyCalorieTarget) {
    const rem = state.dailyCalorieTarget - total;
    const re = $('remainingCalories');
    re.textContent = rem >= 0 ? `还可摄入 ${rem} 大卡` : `已超出 ${Math.abs(rem)} 大卡`;
    re.className = 'remain ' + (rem >= 0 ? 'safe' : 'warn');
  } else {
    $('remainingCalories').textContent = '请先生成目标计划';
    $('remainingCalories').className = 'remain safe';
  }
}

// =====================================================
// EXERCISE DIARY (NEW)
// =====================================================
function updateExEstimate() {
  const type = $('exType').value;
  const minutes = parseFloat($('exMinutes').value) || 0;
  if (!state.weight || !type || !minutes) { $('exBurnEst').textContent = '-'; return; }
  const ex = EXERCISE_DATABASE[type];
  if (!ex) return;
  const burn = calcExerciseBurn(ex.met, state.weight, minutes);
  $('exBurnEst').textContent = burn;
}

function addExercise() {
  const type = $('exType').value;
  const minutes = parseFloat($('exMinutes').value) || 0;
  const date = $('exDate').value || getToday();
  if (!minutes || minutes <= 0) return;
  if (!state.weight) { alert('请先在"我的数据"中填写体重并计算BMR'); return; }
  const ex = EXERCISE_DATABASE[type];
  if (!ex) return;
  const burn = calcExerciseBurn(ex.met, state.weight, minutes);
  if (!state.exerciseHistory[date]) state.exerciseHistory[date] = [];
  state.exerciseHistory[date].push({
    type, name: ex.name, minutes, kcal: burn,
    time: new Date().toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'})
  });
  renderExerciseList(); saveState();
}

function removeExercise(date, index) {
  state.exerciseHistory[date].splice(index, 1);
  if (state.exerciseHistory[date].length === 0) delete state.exerciseHistory[date];
  renderExerciseList(); saveState();
}

function renderExerciseList() {
  const t = getToday();
  const items = state.exerciseHistory[t] || [];
  const list = $('exerciseList');
  if (items.length === 0) {
    list.innerHTML = '<div class="empty-state"><span class="empty-icon">🏃</span>还没有运动记录</div>';
    $('exerciseTotal').style.display = 'none';
  } else {
    list.innerHTML = items.map((e, i) => `
      <div class="ex-item">
        <div class="fi-left">
          <span class="fi-time">${e.time}</span>
          <span class="fi-name">${e.name}</span>
          <span class="fi-grams">${e.minutes}分钟</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="fi-cal">🔥 ${e.kcal} 大卡</span>
          <button class="fi-del" onclick="removeExercise('${t}',${i})">✕</button>
        </div>
      </div>
    `).join('');
    $('exerciseTotal').style.display = 'block';
  }
  $('totalExBurn').textContent = `${exTotalToday()} 大卡`;
}

// =====================================================
// CALENDAR VIEW (NEW)
// =====================================================
function renderCalendar() {
  const now = new Date();
  const year = state.calendarMonth ? state.calendarMonth.year : now.getFullYear();
  const month = state.calendarMonth ? state.calendarMonth.month : now.getMonth();
  state.calendarMonth = { year, month };

  $('calMonth').textContent = `${year}年${month+1}月`;

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = getToday();

  let html = '';
  const headers = ['日','一','二','三','四','五','六'];
  headers.forEach(h => { html += `<div class="cal-day-header">${h}</div>`; });

  // Previous month tail
  const prevDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i;
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    // actually this is prev month, correct date
    const pm = month === 0 ? 11 : month - 1;
    const py = month === 0 ? year - 1 : year;
    const pd = String(py) + '-' + String(pm+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    html += renderCalCell(pd, d, true, todayStr);
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    html += renderCalCell(dateStr, d, false, todayStr);
  }

  // Next month head
  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let d = 1; d <= remaining; d++) {
    const nm = month === 11 ? 0 : month + 1;
    const ny = month === 11 ? year + 1 : year;
    const nd = String(ny) + '-' + String(nm+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    html += renderCalCell(nd, d, true, todayStr);
  }

  $('calendarGrid').innerHTML = html;
}

function renderCalCell(dateStr, dayNum, isOther, todayStr) {
  const foods = state.foodHistory[dateStr] || [];
  const exs = state.exerciseHistory[dateStr] || [];
  const hasFood = foods.length > 0;
  const hasEx = exs.length > 0;
  const hasData = hasFood || hasEx;
  const foodCal = foods.reduce((s,f) => s+f.kcal, 0);
  const exCal = exs.reduce((s,e) => s+e.kcal, 0);
  const def = state.dailyCalorieTarget ? state.dailyCalorieTarget - foodCal : 0;

  let cls = '';
  if (dateStr === todayStr) cls += ' today';
  if (isOther) cls += ' other-month';
  if (hasData) cls += ' has-data';

  return `<div class="cal-day${cls}" onclick="showCalDetail('${dateStr}')">
    <span class="cal-num">${dayNum}</span>
    <div class="cal-dots">
      ${hasFood ? '<span class="cal-dot eat"></span>' : ''}
      ${hasEx ? '<span class="cal-dot ex"></span>' : ''}
    </div>
  </div>`;
}

function showCalDetail(dateStr) {
  const foods = state.foodHistory[dateStr] || [];
  const exs = state.exerciseHistory[dateStr] || [];
  const foodCal = foods.reduce((s,f) => s+f.kcal, 0);
  const exCal = exs.reduce((s,e) => s+e.kcal, 0);
  const def = state.dailyCalorieTarget ? Math.abs(state.dailyCalorieTarget - foodCal) : 0;
  const defLabel = state.dailyCalorieTarget ? (state.dailyCalorieTarget >= foodCal ? '缺口' : '超出') : '-';

  const detail = $('calendarDetail');
  detail.innerHTML = `
    <div style="font-weight:700;margin-bottom:8px;">📅 ${dateStr}</div>
    <div class="cal-detail-row"><span>🍽 饮食摄入</span><span class="cal-detail-val" style="color:var(--green);">${foodCal} 大卡</span></div>
    <div class="cal-detail-row"><span>🏃 运动消耗</span><span class="cal-detail-val" style="color:var(--orange);">${exCal} 大卡</span></div>
    <div class="cal-detail-row"><span>⚖ 热量${defLabel}</span><span class="cal-detail-val" style="color:${state.dailyCalorieTarget && state.dailyCalorieTarget >= foodCal ? 'var(--green)' : 'var(--red)'};">${def} 大卡</span></div>
    ${foods.length > 0 ? `<div style="margin-top:8px;font-size:0.78rem;color:var(--text-tertiary);">食物: ${foods.map(f=>f.name+'('+f.kcal+'kcal)').join(', ')}</div>` : ''}
    ${exs.length > 0 ? `<div style="margin-top:4px;font-size:0.78rem;color:var(--text-tertiary);">运动: ${exs.map(e=>e.name+'('+e.minutes+'min)').join(', ')}</div>` : ''}
  `;
  detail.classList.add('show');
}

function calPrevMonth() {
  if (!state.calendarMonth) return;
  const { year, month } = state.calendarMonth;
  state.calendarMonth = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  renderCalendar();
}

function calNextMonth() {
  if (!state.calendarMonth) return;
  const { year, month } = state.calendarMonth;
  state.calendarMonth = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
  renderCalendar();
}

// =====================================================
// PROGRESS
// =====================================================
function renderProgress() {
  if (!state.dailyCalorieTarget) return;
  const total = foodTotalToday();
  const pct = Math.min(Math.round(total / state.dailyCalorieTarget * 100), 120);

  $('dailyPct').textContent = pct + '%';
  $('dailyLabel').textContent = `${total} / ${state.dailyCalorieTarget} 大卡`;
  const bar = $('dailyBar');
  bar.style.width = Math.min(pct, 100) + '%';
  bar.className = 'progress-fill ' + (pct <= 75 ? 'safe' : pct <= 100 ? 'caution' : 'over');

  // Milestones
  document.querySelectorAll('.milestone-dot').forEach(m => {
    const th = parseInt(m.dataset.threshold);
    if (pct >= th && !m.classList.contains('reached')) {
      m.classList.add('reached');
      const c = m.querySelector('.milestone-circle');
      c.classList.add('boom');
      setTimeout(() => c.classList.remove('boom'), 500);
    }
  });

  // Daily encouragement
  const enc = $('dailyEnc');
  const ths = [0, 25, 50, 75, 100, 110];
  for (const t of ths) {
    if (pct <= t) {
      const e = ENCOURAGEMENTS.daily[t] || ENCOURAGEMENTS.daily[110];
      enc.textContent = e.text;
      enc.className = 'enc-banner ' + e.type;
      break;
    }
  }

  renderWeekly();
}

function renderWeekly() {
  const wk = getWeekKey();
  const hist = JSON.parse(localStorage.getItem('calorie_week_history_v3') || '{}');
  const wd = hist[wk] || {};
  const today = getToday();
  const mon = new Date(wk + 'T00:00:00');
  const dn = ['一','二','三','四','五','六','日'];
  let html = '', onTrack = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    const dk = d.toISOString().slice(0, 10);
    const data = wd[dk];
    const isToday = dk === today;
    const isFuture = dk > today;
    if (data && data.onTrack) onTrack++;

    let cls = isToday ? 'today' : '';
    if (data && data.onTrack) cls += ' done';
    const p = data && data.target ? Math.min(data.totalCal / data.target * 100, 100) : 0;

    html += `<div class="week-day ${cls}">
      <div class="week-day-name">周${dn[i]}</div>
      <div class="week-day-cal">${data ? data.totalCal : isFuture ? '-' : '0'}</div>
      <div class="week-day-bar"><div class="week-day-fill${p > 100 ? ' over' : ''}" style="width:${Math.min(p,100)}%"></div></div>
    </div>`;
  }
  $('weekGrid').innerHTML = html;
  $('weeklyPct').textContent = Math.round(onTrack / 7 * 100) + '%';
  $('weeklyLabel').textContent = `${onTrack}/7 天达标`;
  const wb = $('weeklyBar');
  wb.style.width = Math.round(onTrack / 7 * 100) + '%';
  wb.className = 'progress-fill ' + (onTrack >= 4 ? 'safe' : 'caution');

  const we = ENCOURAGEMENTS.weekly[onTrack] || ENCOURAGEMENTS.weekly[7];
  if (we) {
    $('weeklyEnc').textContent = we.text;
    $('weeklyEnc').className = 'enc-banner ' + we.type;
  }
}

// =====================================================
// INIT
// =====================================================
function init() {
  loadState();

  // Set form values
  $('age').value = state.age;
  $('height').value = state.height;
  $('weight').value = state.weight;
  $('targetWeight').value = state.targetWeight;
  $('targetDays').value = state.targetDays;
  $('exerciseType').value = state.exerciseType;
  $('exerciseDays').value = state.exerciseDays;
  $('foodDate').value = getToday();
  $('exDate').value = getToday();

  // Toggles
  document.querySelectorAll('#genderToggle .toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.val === state.gender));
  document.querySelectorAll('#goalToggle .toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.val === state.goalType));

  // Avatars
  renderAvatars();

  // Restore BMR display
  if (state.bmr) {
    $('valBMR').textContent = state.bmr;
    $('valStdWeight').textContent = state.standardWeight;
    $('valBMI').textContent = state.bmi.toFixed(1);
    const bi = getBMICategory(state.bmi);
    $('valBodyType').textContent = bi.cat;
    $('valBodyType').style.color = bi.color;
    $('bmrResults').style.display = 'block';
  }

  // Restore plan display
  if (state.dailyCalorieTarget) {
    $('planCalTarget').textContent = state.dailyCalorieTarget;
    $('planExBurn').textContent = state.dailyExerciseBurn;
    const dmps = Math.round(state.dailyExerciseMinutes * 7 / parseInt(state.exerciseDays));
    $('planExTime').textContent = dmps + ' min';
    $('planDeficit').textContent = state.dailyDeficit;
    $('planDeficitLabel').textContent = state.goalType === 'lose' ? '每日热量缺口' : '每日热量盈余';
    $('planDeficit').style.color = state.goalType === 'lose' ? 'var(--red)' : 'var(--green)';
    $('planResults').style.display = 'block';
    renderDietGuide();
  }

  renderFoodList();
  updateFoodTotal();
  renderExerciseList();
  updateExEstimate();
  renderProgress();
}
