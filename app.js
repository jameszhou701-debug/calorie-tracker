// ============================================================
// 热量追踪 - 主逻辑 (v2)
// ============================================================

const $ = (id) => document.getElementById(id);

// --- State ---
let state = {
  gender: 'male',
  goalType: 'lose',
  age: 30,
  height: 170,
  weight: 70,
  bmr: null,
  standardWeight: null,
  bmi: null,
  targetWeight: 65,
  targetDays: 60,
  exerciseType: 'running',
  exerciseDays: 4,
  dailyCalorieTarget: null,
  dailyExerciseBurn: null,
  dailyExerciseMinutes: null,
  dailyDeficit: null,
  todayFoods: [],
  waterCount: 0,
  lastMilestoneReached: null,
};

// --- Persistence ---
const STORAGE_KEY = 'calorie_tracker_data_v2';

function saveState() {
  const toSave = {
    gender: state.gender,
    goalType: state.goalType,
    age: state.age, height: state.height, weight: state.weight,
    bmr: state.bmr, standardWeight: state.standardWeight, bmi: state.bmi,
    targetWeight: state.targetWeight, targetDays: state.targetDays,
    exerciseType: state.exerciseType, exerciseDays: state.exerciseDays,
    dailyCalorieTarget: state.dailyCalorieTarget,
    dailyExerciseBurn: state.dailyExerciseBurn,
    dailyExerciseMinutes: state.dailyExerciseMinutes,
    dailyDeficit: state.dailyDeficit,
    today: state.todayFoods,
    waterCount: state.waterCount,
    date: getToday(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  updateWeekHistory();
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    if (d.date !== getToday()) {
      state.todayFoods = [];
      state.waterCount = 0;
    } else {
      state.todayFoods = d.today || [];
      state.waterCount = d.waterCount || 0;
    }
    for (const k of [
      'gender','goalType','age','height','weight','bmr','standardWeight','bmi',
      'targetWeight','targetDays','exerciseType','exerciseDays',
      'dailyCalorieTarget','dailyExerciseBurn','dailyExerciseMinutes','dailyDeficit'
    ]) {
      if (d[k] !== undefined) state[k] = d[k];
    }
  } catch(e) {}
}

function getToday() { return new Date().toISOString().slice(0, 10); }

function getWeekKey() {
  const d = new Date();
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return monday.toISOString().slice(0, 10);
}

function updateWeekHistory() {
  const today = getToday();
  const weekKey = getWeekKey();
  const history = JSON.parse(localStorage.getItem('calorie_week_history_v2') || '{}');
  if (!history[weekKey]) history[weekKey] = {};
  history[weekKey][today] = {
    totalCal: state.todayFoods.reduce((s, f) => s + f.kcal, 0),
    target: state.dailyCalorieTarget,
    onTrack: state.dailyCalorieTarget
      ? (state.todayFoods.reduce((s,f)=>s+f.kcal,0) <= state.dailyCalorieTarget + 100)
      : true,
  };
  const weeks = Object.keys(history).sort();
  while (weeks.length > 4) delete history[weeks.shift()];
  localStorage.setItem('calorie_week_history_v2', JSON.stringify(history));
}

// --- Navigation ---
function switchTab(name) {
  document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  $(`tab-${name}`).classList.add('active');
  document.querySelector(`.nav-btn[data-tab="${name}"]`).classList.add('active');
  if (name === 'progress') renderProgress();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Toggle groups
  document.getElementById('genderToggle').addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    state.gender = btn.dataset.val;
    document.querySelectorAll('#genderToggle .toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    saveState();
  });

  document.getElementById('goalToggle').addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;
    state.goalType = btn.dataset.val;
    document.querySelectorAll('#goalToggle .toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    saveState();
  });

  // Food gram auto-calc
  $('foodGrams').addEventListener('input', () => {
    const kcalPer100 = $('foodGrams').dataset.kcalPer100;
    if (kcalPer100) {
      const g = parseFloat($('foodGrams').value) || 0;
      $('foodCalories').value = Math.round(kcalPer100 * g / 100);
    }
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.food-search-wrapper')) {
      $('foodDropdown').classList.remove('show');
    }
  });

  init();
});

// --- BMR Calculation ---
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

  // Animate numbers
  animateNumber($('valBMR'), state.bmr);
  animateNumber($('valStdWeight'), state.standardWeight);

  saveState();
  renderProgress();
}

function animateNumber(el, target) {
  const start = parseInt(el.textContent) || 0;
  if (start === target) return;
  const duration = 600;
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// --- Plan Generation ---
function generatePlan() {
  if (!state.bmr) calculateBMR();

  state.targetWeight = parseFloat($('targetWeight').value) || 65;
  state.targetDays = parseInt($('targetDays').value) || 60;
  state.exerciseType = $('exerciseType').value;
  state.exerciseDays = parseInt($('exerciseDays').value) || 4;

  const weightDiff = state.targetWeight - state.weight;
  const totalDeficit = Math.abs(weightDiff) * 7700;
  state.dailyDeficit = Math.round(totalDeficit / state.targetDays);
  const tdee = Math.round(state.bmr * 1.2);

  if (state.goalType === 'lose') {
    state.dailyCalorieTarget = Math.round(tdee - state.dailyDeficit);
  } else {
    state.dailyCalorieTarget = Math.round(tdee + state.dailyDeficit);
  }
  if (state.dailyCalorieTarget < 1200) state.dailyCalorieTarget = 1200;

  const ex = EXERCISE_DATABASE[state.exerciseType];
  state.dailyExerciseBurn = Math.round(state.dailyDeficit * 0.3);
  state.dailyExerciseMinutes = Math.round(
    (state.dailyExerciseBurn / (ex.met * state.weight)) * 60
  );
  const daysPerWeek = parseInt(state.exerciseDays);
  const dailyMinutesPerSession = Math.round(state.dailyExerciseMinutes * 7 / daysPerWeek);

  $('planCalTarget').textContent = state.dailyCalorieTarget;
  $('planExBurn').textContent = state.dailyExerciseBurn;
  $('planExTime').textContent = dailyMinutesPerSession + ' min';
  $('planDeficit').textContent = state.dailyDeficit;
  $('planDeficitLabel').textContent = state.goalType === 'lose'
    ? '每日热量缺口'
    : '每日热量盈余';
  $('planDeficit').style.color = state.goalType === 'lose' ? 'var(--red)' : 'var(--green)';
  $('planResults').style.display = 'block';

  updateFoodTotal();
  saveState();
}

// --- Food Search ---
function searchFood() {
  const query = $('foodSearch').value.toLowerCase().trim();
  const dropdown = $('foodDropdown');
  if (!query) { dropdown.classList.remove('show'); return; }

  const results = FOOD_DATABASE.filter(f =>
    f.name.includes(query) || f.category.includes(query)
  ).slice(0, 10);

  if (results.length === 0) {
    dropdown.innerHTML = '<div class="food-dropdown-item" style="color:var(--text-tertiary);">未找到匹配食物，请手动输入热量</div>';
  } else {
    dropdown.innerHTML = results.map(f =>
      `<div class="food-dropdown-item" onclick="selectFood('${f.name}', ${f.kcal})">
        ${f.name} <span class="kcal-badge">${f.kcal} 大卡/100g</span>
      </div>`
    ).join('');
  }
  dropdown.classList.add('show');
}

function selectFood(name, kcalPer100) {
  $('foodSearch').value = name;
  $('foodGrams').dataset.kcalPer100 = kcalPer100;
  const grams = parseFloat($('foodGrams').value) || 100;
  $('foodCalories').value = Math.round(kcalPer100 * grams / 100);
  $('foodDropdown').classList.remove('show');
}

// --- Add Food ---
function addFood() {
  const name = $('foodSearch').value.trim();
  let kcal = parseInt($('foodCalories').value);
  const grams = parseFloat($('foodGrams').value) || 100;

  if (!name) return;
  if (!kcal || kcal <= 0) {
    const match = FOOD_DATABASE.find(f => f.name === name);
    if (match) kcal = Math.round(match.kcal * grams / 100);
    else return;
  }

  state.todayFoods.push({
    name, grams, kcal,
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  });

  $('foodSearch').value = '';
  $('foodGrams').value = '100';
  $('foodCalories').value = '';
  delete $('foodGrams').dataset.kcalPer100;

  renderFoodList();
  updateFoodTotal();
  saveState();
  renderProgress();
}

function removeFood(index) {
  state.todayFoods.splice(index, 1);
  renderFoodList();
  updateFoodTotal();
  saveState();
  renderProgress();
}

function clearTodayFood() {
  state.todayFoods = [];
  state.waterCount = 0;
  renderFoodList();
  updateFoodTotal();
  saveState();
  renderProgress();
}

function addQuickWater() {
  state.waterCount++;
  renderFoodList();
  saveState();
}

function renderFoodList() {
  const list = $('foodList');
  if (state.todayFoods.length === 0 && state.waterCount === 0) {
    list.innerHTML = `<div class="empty-state">
      <span class="empty-icon">🍽</span>还没有食物记录<br>搜索并添加你今天吃的东西吧
    </div>`;
    return;
  }

  let html = state.todayFoods.map((f, i) => `
    <div class="food-item">
      <div class="food-item-left">
        <span class="food-item-time">${f.time}</span>
        <span class="food-item-name">${f.name}</span>
        <span class="food-item-grams">${f.grams}g</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="food-item-cal">${f.kcal} 大卡</span>
        <button class="food-item-del" onclick="removeFood(${i})">✕</button>
      </div>
    </div>
  `).join('');

  if (state.waterCount > 0) {
    html += `<div class="food-item" style="opacity:0.6;">
      <div class="food-item-left">
        <span class="food-item-time">💧</span>
        <span class="food-item-name">饮水记录</span>
      </div>
      <span class="food-item-cal">${state.waterCount * 250}ml · ${state.waterCount}杯</span>
    </div>`;
  }

  list.innerHTML = html;
}

function updateFoodTotal() {
  const total = state.todayFoods.reduce((s, f) => s + f.kcal, 0);
  $('totalCalories').textContent = `${total} 大卡`;
  $('foodTotal').style.display = 'block';

  if (state.dailyCalorieTarget) {
    const remaining = state.dailyCalorieTarget - total;
    const remEl = $('remainingCalories');
    remEl.textContent = remaining >= 0
      ? `还可摄入 ${remaining} 大卡`
      : `已超出 ${Math.abs(remaining)} 大卡`;
    remEl.className = 'remain ' + (remaining >= 0 ? 'safe' : 'warn');
  } else {
    $('remainingCalories').textContent = '请先生成目标计划';
    $('remainingCalories').className = 'remain safe';
  }
}

// --- Progress ---
function renderProgress() {
  if (!state.dailyCalorieTarget) return;

  const todayTotal = state.todayFoods.reduce((s, f) => s + f.kcal, 0);
  const pct = Math.min(Math.round(todayTotal / state.dailyCalorieTarget * 100), 120);

  // Daily bar
  $('dailyPct').textContent = pct + '%';
  $('dailyLabel').textContent = `${todayTotal} / ${state.dailyCalorieTarget} 大卡`;
  const bar = $('dailyBar');
  bar.style.width = Math.min(pct, 100) + '%';
  bar.className = 'progress-fill';
  if (pct <= 75) bar.classList.add('safe');
  else if (pct <= 100) bar.classList.add('caution');
  else bar.classList.add('over');

  // Milestones with pop animation
  const milestones = document.querySelectorAll('#tab-progress .milestone-dot');
  milestones.forEach(m => {
    const threshold = parseInt(m.dataset.threshold);
    const wasReached = m.classList.contains('reached');
    const nowReached = pct >= threshold;

    if (nowReached && !wasReached) {
      m.classList.add('reached');
      const circle = m.querySelector('.milestone-circle');
      circle.classList.add('boom');
      setTimeout(() => circle.classList.remove('boom'), 500);
    }
  });

  // Daily encouragement
  const thresholds = [0, 25, 50, 75, 100, 110];
  const enc = $('dailyEnc');
  let msg = '';
  let cls = '';
  for (const t of thresholds) {
    if (pct <= t) {
      const e = ENCOURAGEMENTS.daily[t];
      msg = e ? e.text : ENCOURAGEMENTS.daily[110].text;
      cls = e ? e.type : ENCOURAGEMENTS.daily[110].type;
      break;
    }
  }
  enc.textContent = msg;
  enc.className = 'enc-banner ' + cls;

  renderWeekly();
}

function renderWeekly() {
  const weekKey = getWeekKey();
  const history = JSON.parse(localStorage.getItem('calorie_week_history_v2') || '{}');
  const weekData = history[weekKey] || {};
  const today = getToday();
  const monday = new Date(weekKey + 'T00:00:00');
  const dayNames = ['一','二','三','四','五','六','日'];

  let html = '';
  let onTrackDays = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateKey = d.toISOString().slice(0, 10);
    const data = weekData[dateKey];
    const isToday = dateKey === today;
    const isFuture = dateKey > today;

    if (data && data.onTrack) onTrackDays++;

    let cls = '';
    if (isToday) cls = 'today';
    if (data && data.onTrack) cls += ' done';

    const pct = data && data.target ? Math.min(data.totalCal / data.target * 100, 100) : 0;
    const overCls = pct > 100 ? ' over' : '';

    html += `<div class="week-day ${cls.trim()}">
      <div class="week-day-name">周${dayNames[i]}</div>
      <div class="week-day-cal">${data ? data.totalCal : (isFuture ? '-' : '0')}</div>
      <div class="week-day-bar">
        <div class="week-day-fill${overCls}" style="width:${Math.min(pct,100)}%"></div>
      </div>
    </div>`;
  }

  $('weekGrid').innerHTML = html;
  $('weeklyPct').textContent = Math.round(onTrackDays / 7 * 100) + '%';
  $('weeklyLabel').textContent = `${onTrackDays}/7 天达标`;

  const wBar = $('weeklyBar');
  wBar.style.width = Math.round(onTrackDays / 7 * 100) + '%';
  wBar.className = 'progress-fill ' + (onTrackDays >= 4 ? 'safe' : 'caution');

  const wEnc = ENCOURAGEMENTS.weekly[onTrackDays] || ENCOURAGEMENTS.weekly[7];
  const wDiv = $('weeklyEnc');
  if (wEnc) {
    wDiv.textContent = wEnc.text;
    wDiv.className = 'enc-banner ' + wEnc.type;
  }
}

// --- Init ---
function init() {
  loadState();

  $('age').value = state.age;
  $('height').value = state.height;
  $('weight').value = state.weight;
  $('targetWeight').value = state.targetWeight;
  $('targetDays').value = state.targetDays;
  $('exerciseType').value = state.exerciseType;
  $('exerciseDays').value = state.exerciseDays;

  // Set toggle states
  document.querySelectorAll('#genderToggle .toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.val === state.gender);
  });
  document.querySelectorAll('#goalToggle .toggle-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.val === state.goalType);
  });

  if (state.bmr) {
    $('valBMR').textContent = state.bmr;
    $('valStdWeight').textContent = state.standardWeight;
    $('valBMI').textContent = state.bmi.toFixed(1);
    const bmiInfo = getBMICategory(state.bmi);
    $('valBodyType').textContent = bmiInfo.cat;
    $('valBodyType').style.color = bmiInfo.color;
    $('bmrResults').style.display = 'block';
  }

  if (state.dailyCalorieTarget) {
    $('planCalTarget').textContent = state.dailyCalorieTarget;
    $('planExBurn').textContent = state.dailyExerciseBurn;
    const ex = EXERCISE_DATABASE[state.exerciseType];
    const daysPerWeek = parseInt(state.exerciseDays);
    const dmps = Math.round(state.dailyExerciseMinutes * 7 / daysPerWeek);
    $('planExTime').textContent = dmps + ' min';
    $('planDeficit').textContent = state.dailyDeficit;
    $('planDeficitLabel').textContent = state.goalType === 'lose' ? '每日热量缺口' : '每日热量盈余';
    $('planDeficit').style.color = state.goalType === 'lose' ? 'var(--red)' : 'var(--green)';
    $('planResults').style.display = 'block';
  }

  renderFoodList();
  updateFoodTotal();
  renderProgress();
}
