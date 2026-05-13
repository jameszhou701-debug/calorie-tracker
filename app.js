// ============================================================
// 热量追踪 v3 - 主逻辑
// 新增：头像选择、膳食指南、运动记录、历史日历
// ============================================================

const $ = (id) => document.getElementById(id);

// --- State ---
let state = {
  avatar: 'pig',
  bodyType: 'standard',
  bodyGoal: 'slim',
  gender: 'male', goalType: 'lose',
  age: 30, height: 170, weight: 70,
  bmr: null, standardWeight: null, bmi: null,
  targetWeight: 65, targetDays: 60,
  exerciseType: 'running', exerciseDays: 4,
  dailyCalorieTarget: null, dailyExerciseBurn: null,
  dailyExerciseMinutes: null, dailyDeficit: null,
  // food: { "2026-05-06": [{name,grams,kcal,protein,fat,carbs,time,meal}] }
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

function foodTotalToday() { return todayFoods().reduce((s, f) => s + (f.kcal || 0), 0); }
function proteinToday() { return todayFoods().reduce((s, f) => s + (f.protein || 0), 0); }
function fatToday() { return todayFoods().reduce((s, f) => s + (f.fat || 0), 0); }
function carbsToday() { return todayFoods().reduce((s, f) => s + (f.carbs || 0), 0); }
function exTotalToday() { return todayExercise().reduce((s, e) => s + (e.kcal || 0), 0); }

// --- Persistence ---
function saveState() {
  const toSave = {
    avatar: state.avatar, bodyType: state.bodyType, bodyGoal: state.bodyGoal, gender: state.gender, goalType: state.goalType,
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
  const totalCal = foods.reduce((s, f) => s + (f.kcal || 0), 0);
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
  if (name === 'progress') { renderProgress(); renderCalendar(); }
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

  // Close modals on overlay click
  $('aiModal')?.addEventListener('click', (e) => {
    if (e.target === $('aiModal')) cancelAIResult();
  });
  $('settingsModal')?.addEventListener('click', (e) => {
    if (e.target === $('settingsModal')) closeSettings();
  });
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

// --- Body Type ---
function renderBodyTypes() {
  const grid = document.getElementById('bodyTypeGrid');
  if (!grid) return;
  grid.innerHTML = BODY_TYPES.map(b =>
    '<div class="body-type-option' + (b.id === state.bodyType ? ' selected' : '') + '" onclick="selectBodyType(\'' + b.id + '\')">' +
    '<span class="bt-emoji">' + b.emoji + '</span>' +
    '<span class="bt-name">' + b.name + '</span>' +
    '<span class="bt-desc">' + b.desc + '</span></div>'
  ).join('');
}

function selectBodyType(id) {
  state.bodyType = id;
  renderBodyTypes();
  saveState();
  if (state.bmr) calculateBMR();
}

function renderBodyGoals() {
  const grid = document.getElementById('bodyGoalGrid');
  if (!grid) return;
  grid.innerHTML = BODY_GOALS.map(g =>
    '<div class="body-goal-option' + (g.id === state.bodyGoal ? ' selected' : '') + '" onclick="selectBodyGoal(\'' + g.id + '\')">' +
    '<span class="bg-emoji">' + g.emoji + '</span>' +
    '<span class="bg-name">' + g.name + '</span>' +
    '<span class="bg-desc">' + g.desc + '</span></div>'
  ).join('');
}

function selectBodyGoal(id) {
  state.bodyGoal = id;
  renderBodyGoals();
  saveState();
  if (state.dailyCalorieTarget) generatePlan();
}

function renderExerciseGuide() {
  const guide = EXERCISE_GUIDES[state.bodyGoal];
  const card = document.getElementById('exerciseGuideCard');
  if (!card || !guide) return;
  const dayNames = ['周一','周二','周三','周四','周五','周六','周日'];
  document.getElementById('exerciseGuide').innerHTML =
    '<div class="ex-guide-title">' + guide.title + '</div>' +
    '<div class="ex-guide-week">' +
    guide.weekly.map(function(w, i) {
      return '<div class="ex-guide-day">' +
        '<span class="ex-day-icon">' + w.icon + '</span>' +
        '<span class="ex-day-name">' + dayNames[i] + '</span>' +
        '<span class="ex-day-detail">' + w.detail + '</span></div>';
    }).join('') +
    '</div>' +
    '<div class="ex-guide-tips">' + guide.tips + '</div>';
  card.style.display = 'block';
}

// =====================================================
// BMR
// =====================================================
function calculateBMR() {
  state.age = parseInt($('age').value) || 30;
  state.height = parseInt($('height').value) || 170;
  state.weight = parseFloat($('weight').value) || 70;

  const bt = BODY_TYPES.find(b => b.id === state.bodyType) || { bmrFactor: 1.0 };
  state.bmr = Math.round(calcBMR(state.weight, state.height, state.age, state.gender) * bt.bmrFactor);
  state.standardWeight = Math.round(calcStandardWeight(state.height, state.gender));
  state.bmi = calcBMI(state.weight, state.height);

  $('valBMR').textContent = state.bmr;
  $('valStdWeight').textContent = state.standardWeight;
  $('valBMI').textContent = state.bmi.toFixed(1);
  const bmiInfo = getBMICategory(state.bmi, state.bodyType);
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
  renderExerciseGuide();
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
  if (results.length === 0) {
    dd.innerHTML = '<div class="food-dropdown-item food-search-online" onclick="searchFoodOnline()">🔍 在线搜索「' + q + '」的热量和营养数据' +
      '<span style="font-size:0.62rem;color:var(--accent);">使用 AI 获取数据</span></div>' +
      '<div class="food-dropdown-item" style="color:var(--text-tertiary);">本地未找到，你也可以手动输入</div>';
  } else {
    dd.innerHTML = results.map(f => '<div class="food-dropdown-item" onclick="selectFood(\'' + f.name.replace(/'/g, "\\'") + '\', ' + f.kcal + ', ' + (f.protein||0) + ', ' + (f.fat||0) + ', ' + (f.carbs||0) + ')">' + f.name + '<span class="kcal-badge">' + f.kcal + ' 大卡/100g</span></div>').join('');
  }
  dd.classList.add('show');
}

function selectFood(name, kcalPer100, proteinPer100, fatPer100, carbsPer100) {
  $('foodSearch').value = name;
  $('foodGrams').dataset.kcalPer100 = kcalPer100;
  $('foodGrams').dataset.proteinPer100 = proteinPer100 || 0;
  $('foodGrams').dataset.fatPer100 = fatPer100 || 0;
  $('foodGrams').dataset.carbsPer100 = carbsPer100 || 0;
  const g = parseFloat($('foodGrams').value) || 100;
  $('foodCalories').value = Math.round(kcalPer100 * g / 100);
  updateMacroPreview();
  $('foodDropdown').classList.remove('show');
}

function addFood() {
  const name = $('foodSearch').value.trim();
  let kcal = parseInt($('foodCalories').value);
  const grams = parseFloat($('foodGrams').value) || 100;
  const date = $('foodDate').value || getToday();
  const meal = $('foodMeal').value || 'snack';
  if (!name) return;

  // Get macros from dataset (set by selectFood or searchFoodOnline)
  const p100 = parseFloat($('foodGrams').dataset.proteinPer100) || 0;
  const f100 = parseFloat($('foodGrams').dataset.fatPer100) || 0;
  const c100 = parseFloat($('foodGrams').dataset.carbsPer100) || 0;

  if (!kcal || kcal <= 0) {
    const m = FOOD_DATABASE.find(f => f.name === name);
    if (m) kcal = Math.round(m.kcal * grams / 100);
    else return;
  }
  const protein = Math.round(p100 * grams / 100);
  const fat = Math.round(f100 * grams / 100);
  const carbs = Math.round(c100 * grams / 100);
  if (!state.foodHistory[date]) state.foodHistory[date] = [];
  state.foodHistory[date].push({ name, grams, kcal, protein, fat, carbs, time: new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}), meal });
  $('foodSearch').value = ''; $('foodGrams').value = '100'; $('foodCalories').value = '';
  delete $('foodGrams').dataset.kcalPer100;
  renderFoodList(); updateFoodTotal(); saveState();
}

function removeFood(date, index) {
  state.foodHistory[date].splice(index, 1);
  if (state.foodHistory[date].length === 0) delete state.foodHistory[date];
  renderFoodList(); updateFoodTotal(); saveState();
}

// --- 在线搜索食物营养数据 ---
async function searchFoodOnline() {
  const q = $('foodSearch').value.trim();
  if (!q) return;
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) { openSettings(); return; }

  const dd = $('foodDropdown');
  dd.innerHTML = '<div class="food-dropdown-item" style="color:var(--accent);"><span class="spinner"></span> AI 正在搜索「' + q + '」的营养数据…</div>';
  dd.classList.add('show');

  const prompt = '你是一个营养师。请查询食物「' + q + '」的营养数据（每100克）。\n\n请严格按照以下JSON格式返回，不要包含任何其他文字、markdown或代码块标记：\n\n{\n  "name": "食物中文名称",\n  "kcal": 每100克热量(整数大卡),\n  "protein": 每100克蛋白质(整数克),\n  "fat": 每100克脂肪(整数克),\n  "carbs": 每100克碳水(整数克),\n  "note": "数据来源(如中国食物成分表/USDA/估算，10字以内)"\n}\n\n要求：\n- 返回纯JSON，不要有markdown代码块\n- 数据尽可能准确，基于公开营养数据库\n- 如果找不到精确数据，给出合理估算';

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 512 }
        })
      }
    );

    if (!response.ok) {
      throw new Error('API 错误 (' + response.status + ')');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let jsonStr = text.trim();
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const result = JSON.parse(jsonStr);

    // Populate fields
    const name = result.name || q;
    $('foodSearch').value = name;
    $('foodGrams').dataset.kcalPer100 = result.kcal || 0;
    $('foodGrams').dataset.proteinPer100 = result.protein || 0;
    $('foodGrams').dataset.fatPer100 = result.fat || 0;
    $('foodGrams').dataset.carbsPer100 = result.carbs || 0;
    const g = parseFloat($('foodGrams').value) || 100;
    $('foodCalories').value = Math.round((result.kcal || 0) * g / 100);

    dd.innerHTML = '<div class="food-dropdown-item food-search-result">' +
      '✅ 「' + name + '」每100g: <strong>' + (result.kcal||0) + '</strong>大卡 ' +
      '| 蛋白质<strong>' + (result.protein||0) + 'g</strong> ' +
      '| 脂肪<strong>' + (result.fat||0) + 'g</strong> ' +
      '| 碳水<strong>' + (result.carbs||0) + 'g</strong>' +
      '<span style="font-size:0.62rem;color:var(--text-tertiary);display:block;">' + (result.note || 'AI估算') + '</span></div>' +
      '<div class="food-dropdown-item" style="color:var(--text-tertiary);">确认数据后点击 ✓ 添加</div>';
  } catch (error) {
    dd.innerHTML = '<div class="food-dropdown-item" style="color:var(--red);">❌ 搜索失败: ' + error.message + '</div>' +
      '<div class="food-dropdown-item" style="color:var(--text-tertiary);">请检查API Key或手动输入</div>';
  }
}

function updateMacroPreview() {
  // Updates the calorie field when grams change, using stored per-100g values
  const g = parseFloat($('foodGrams').value) || 100;
  const k100 = parseFloat($('foodGrams').dataset.kcalPer100) || 0;
  if (k100 > 0) {
    $('foodCalories').value = Math.round(k100 * g / 100);
  }
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
        <span class="fi-grams">${f.grams}g</span><span class="ai-food-macros"><span class="macro-tag p">${f.protein||0}g</span><span class="macro-tag f">${f.fat||0}g</span><span class="macro-tag c">${f.carbs||0}g</span></span>
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
  $('totalProtein').textContent = proteinToday();
  $('totalFat').textContent = fatToday();
  $('totalCarbs').textContent = carbsToday();
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
    ${foods.length > 0 ? `<div style="margin-top:8px;font-size:0.78rem;color:var(--text-tertiary);">食物: ${foods.map(f=>f.name+'('+f.kcal+'kcal P'+ (f.protein||0)+')').join(', ')}</div>` : ''}
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
  const totalCalIn = foodTotalToday();
  const totalExOut = exTotalToday();

  // Current-hour BMR: BMR * (hours elapsed today / 24)
  const now = new Date();
  const hoursElapsed = now.getHours() + now.getMinutes() / 60;
  const currentBmr = Math.round((state.bmr || 0) * Math.min(hoursElapsed / 24, 1));
  
  // Current net: intake - exercise - current BMR
  const currentNet = totalCalIn - totalExOut - currentBmr;
  // Daily target net: target - exercise target - full BMR
  const dailyTargetNet = state.dailyCalorieTarget - (state.dailyExerciseBurn || 0) - (state.bmr || 0);

  // Update energy summary
  $('progCalIn').textContent = totalCalIn;
  $('progExOut').textContent = totalExOut;
  $('progBmrNow').textContent = currentBmr;
  $('progBmrLabel').textContent = '基础代谢 (' + Math.round(hoursElapsed) + 'h)';
  $('progNet').textContent = (currentNet >= 0 ? '+' : '') + currentNet;
  const netWrap = $('progNetWrap');
  netWrap.className = 'energy-item energy-net ' + (currentNet > 0 ? 'positive' : 'negative');

  // Calories intake bar (no encouragement)
  const pct = Math.min(Math.round(totalCalIn / state.dailyCalorieTarget * 100), 120);
  $('dailyLabel').textContent = totalCalIn + ' / ' + state.dailyCalorieTarget + ' 大卡';
  $('dailyTargetDisplay').textContent = state.dailyCalorieTarget;
  const bar = $('dailyBar');
  bar.style.width = Math.min(pct, 100) + '%';
  bar.className = 'progress-fill ' + (pct <= 75 ? 'safe' : pct <= 100 ? 'caution' : 'over');

  // Energy diff line
  const diff = $('energyDiff');
  const diffText = $('diffText');
  diff.style.display = 'block';
  if (currentNet < 0) {
    diff.className = 'energy-diff deficit';
    diffText.textContent = '🔥 当前热量缺口 ' + Math.abs(currentNet) + ' 大卡（日目标缺口 ' + Math.abs(dailyTargetNet) + ' 大卡）';
  } else if (currentNet > 0) {
    diff.className = 'energy-diff surplus';
    diffText.textContent = '⚠ 当前热量盈余 +' + currentNet + ' 大卡（日目标缺口 ' + dailyTargetNet + ' 大卡）';
  } else {
    diff.className = 'energy-diff';
    diffText.textContent = '✅ 当前能量平衡（日目标缺口 ' + dailyTargetNet + ' 大卡）';
  }

  // Exercise progress bar (WITH encouragement + milestones)
  if (state.dailyExerciseBurn && state.dailyExerciseBurn > 0) {
    const exPct = Math.min(Math.round(totalExOut / state.dailyExerciseBurn * 100), 120);
    $('exPct').textContent = exPct + '%';
    $('exLabel').textContent = totalExOut + ' / ' + state.dailyExerciseBurn + ' 大卡';
    const exBar = $('exBar');
    exBar.style.width = Math.min(exPct, 100) + '%';
    exBar.className = 'progress-fill ' + (exPct <= 50 ? 'caution' : exPct <= 100 ? 'safe' : 'over');

    // Exercise milestones
    document.querySelectorAll('#tab-progress .milestone-dot').forEach(m => {
      const th = parseInt(m.dataset.threshold);
      if (exPct >= th && !m.classList.contains('reached')) {
        m.classList.add('reached');
        const c = m.querySelector('.milestone-circle');
        c.classList.add('boom');
        setTimeout(() => c.classList.remove('boom'), 500);
      }
    });

    // Exercise encouragement
    const exEnc = $('exEnc');
    const ths = [0, 25, 50, 75, 100, 110];
    for (const t of ths) {
      if (exPct <= t) {
        const e = ENCOURAGEMENTS.daily[t] || ENCOURAGEMENTS.daily[110];
        exEnc.textContent = e.text;
        exEnc.className = 'enc-banner ' + e.type;
        break;
      }
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

  // Avatars & Body Types
  renderAvatars();
  renderBodyTypes();
  renderBodyGoals();

  // Restore BMR display
  if (state.bmr) {
    $('valBMR').textContent = state.bmr;
    $('valStdWeight').textContent = state.standardWeight;
    $('valBMI').textContent = state.bmi.toFixed(1);
    const bi = getBMICategory(state.bmi, state.bodyType);
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
    renderExerciseGuide();
  }

  renderFoodList();
  updateFoodTotal();
  renderExerciseList();
  updateExEstimate();
  renderProgress();
}

// =====================================================
// AI CAMERA - Gemini Vision 食物识别
// =====================================================

// Food name to emoji mapping for AI results
const FOOD_EMOJI_MAP = {
  '米饭':'🍚','馒头':'🥟','面条':'🍜','面包':'🍞','燕麦':'🥣','玉米':'🌽','红薯':'🍠','土豆':'🥔',
  '鸡肉':'🍗','猪肉':'🥩','牛肉':'🥩','羊肉':'🥩','鱼肉':'🐟','虾':'🦐','蟹':'🦀','蛋':'🥚',
  '西兰花':'🥦','菠菜':'🥬','番茄':'🍅','黄瓜':'🥒','胡萝卜':'🥕','白菜':'🥬','芹菜':'🥬','生菜':'🥬',
  '苹果':'🍎','香蕉':'🍌','橙子':'🍊','葡萄':'🍇','西瓜':'🍉','草莓':'🍓','芒果':'🥭','蓝莓':'🫐','猕猴桃':'🥝',
  '牛奶':'🥛','酸奶':'🥛','奶酪':'🧀','豆浆':'🥛',
  '蛋糕':'🍰','饼干':'🍪','巧克力':'🍫','冰淇淋':'🍦',
  '豆腐':'🧈','汤':'🥣','沙拉':'🥗','水饺':'🥟','包子':'🥟',
};

function getFoodEmoji(name) {
  for (const [k, v] of Object.entries(FOOD_EMOJI_MAP)) {
    if (name.includes(k)) return v;
  }
  return '🍽';
}

let pendingAIResults = [];

function triggerCamera() {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    openSettings();
    return;
  }
  $('cameraInput').click();
}

function triggerAlbum() {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    openSettings();
    return;
  }
  $('albumInput').click();
}

function handleCameraImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  $('cameraStatus').style.display = 'block';
  $('cameraStatus').innerHTML = '<span class="spinner"></span>AI 正在识别食物…';

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result.split(',')[1];
    callGeminiVision(base64);
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

async function callGeminiVision(base64Image) {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    $('cameraStatus').style.display = 'none';
    openSettings();
    return;
  }

  const prompt = '你是一个营养师。请分析这张食物照片。\n\n请严格按照以下JSON格式返回，不要包含任何其他文字、markdown或代码块标记：\n\n{\n  "foods": [\n    {\n      "name": "食物中文名称",\n      "grams": 估算克数(整数),\n      "kcal": 估算热量(整数大卡),\n      "protein": 蛋白质克数(整数),\n      "fat": 脂肪克数(整数),\n      "carbs": 碳水克数(整数)\n    }\n  ],\n  "totalKcal": 总热量(整数),\n  "totalProtein": 总蛋白质(整数克),\n  "totalFat": 总脂肪(整数克),\n  "totalCarbs": 总碳水(整数克),\n  "note": "简短说明(10字以内)"\n}\n\n要求：\n- name 用中文\n- grams 估算食物的大概克数\n- protein/fat/carbs 基于常见食物的营养成分估算\n- 如果无法确定，给出合理估算\n- 蛋白质: 肉蛋奶豆约含较高, 蔬菜水果较低\n- 返回纯JSON，不要有markdown代码块';

  $('cameraStatus').innerHTML = '<span class="spinner"></span>AI 正在识别食物…';

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + apiKey,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
              ]
            }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
          })
        }
      );

      if (response.status === 429) {
        const waitMs = (attempt + 1) * 4000;
        $('cameraStatus').innerHTML = '<span class="spinner"></span>请求太频繁，等待 ' + (waitMs/1000) + ' 秒后重试…';
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }

      if (!response.ok) {
        if (response.status === 403) throw new Error('API Key 无效，请检查设置');
        throw new Error('API 错误 (' + response.status + ')');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      let jsonStr = text.trim();
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      const result = JSON.parse(jsonStr);

      if (!result.foods || result.foods.length === 0) {
        throw new Error('未能识别出食物，请拍更清晰的照片');
      }

      pendingAIResults = result.foods.map(f => ({
        name: f.name,
        grams: f.grams || 100,
        kcal: f.kcal || 0,
        protein: f.protein || 0,
        fat: f.fat || 0,
        carbs: f.carbs || 0,
      }));

      showAIResultModal(pendingAIResults, result.note || '');
      $('cameraStatus').style.display = 'none';
      return;

    } catch (error) {
      if (attempt === 2) {
        $('cameraStatus').style.display = 'block';
        $('cameraStatus').style.color = 'var(--red)';
        $('cameraStatus').innerHTML = '❌ ' + error.message;
        setTimeout(() => {
          $('cameraStatus').style.display = 'none';
          $('cameraStatus').style.color = 'var(--accent)';
        }, 5000);
      }
    }
  }
}

function showAIResultModal(foods, note) {
  $('aiResultBody').innerHTML = note 
    ? `<div style="font-size:0.82rem;color:var(--text-secondary);text-align:center;margin-bottom:4px;">${note}</div>`
    : '';

  $('aiFoodList').innerHTML = foods.map((f, i) => `
    <div class="ai-food-item">
      <span class="ai-food-emoji">${getFoodEmoji(f.name)}</span>
      <div class="ai-food-info">
        <div class="ai-food-name">${f.name}</div>
        <div class="ai-food-detail">约 ${f.grams}g · ${f.kcal} kcal</div>
        <div class="ai-food-macros">
          <span class="macro-tag p">${f.protein||0}g蛋白</span>
          <span class="macro-tag f">${f.fat||0}g脂肪</span>
          <span class="macro-tag c">${f.carbs||0}g碳水</span>
        </div>
      </div>
      <div class="ai-food-edit">
        <input type="number" value="${f.grams}" min="1" max="5000" 
               onchange="updateAIResultGram(${i}, this.value)" 
               onclick="event.stopPropagation()">
        <span style="font-size:0.72rem;color:var(--text-tertiary);">g</span>
      </div>
      <span class="ai-food-kcal">${f.kcal} kcal</span>
    </div>
  `).join('');
  
  const totalP = foods.reduce((s,f) => s + (f.protein||0), 0);
  const totalF = foods.reduce((s,f) => s + (f.fat||0), 0);
  const totalC = foods.reduce((s,f) => s + (f.carbs||0), 0);
  $('aiMacroSum').innerHTML = '<span><span class="macro-dot" style="background:var(--red)"></span>蛋白质 <strong>' + totalP + 'g</strong></span><span><span class="macro-dot" style="background:var(--orange)"></span>脂肪 <strong>' + totalF + 'g</strong></span><span><span class="macro-dot" style="background:var(--blue)"></span>碳水 <strong>' + totalC + 'g</strong></span>';

  $('aiModal').style.display = 'flex';
}

function updateAIResultGram(index, value) {
  const grams = parseInt(value) || 0;
  if (grams <= 0) return;
  const originalGrams = pendingAIResults[index].grams;
  const originalKcal = pendingAIResults[index].kcal;
  const originalProtein = pendingAIResults[index].protein || 0;
  const originalFat = pendingAIResults[index].fat || 0;
  const originalCarbs = pendingAIResults[index].carbs || 0;
  const ratio = grams / originalGrams;
  if (originalGrams) {
    pendingAIResults[index].grams = grams;
    pendingAIResults[index].kcal = Math.round(originalKcal * ratio);
    pendingAIResults[index].protein = Math.round(originalProtein * ratio);
    pendingAIResults[index].fat = Math.round(originalFat * ratio);
    pendingAIResults[index].carbs = Math.round(originalCarbs * ratio);
  }
  // Refresh display
  const kcalEls = document.querySelectorAll('.ai-food-kcal');
  if (kcalEls[index]) kcalEls[index].textContent = pendingAIResults[index].kcal + ' kcal';
  const detailEls = document.querySelectorAll('.ai-food-detail');
  if (detailEls[index]) {
    detailEls[index].textContent = '约 ' + grams + 'g · ' + pendingAIResults[index].kcal + ' kcal · 蛋白' + pendingAIResults[index].protein + 'g';
  }
}

function cancelAIResult() {
  pendingAIResults = [];
  $('aiModal').style.display = 'none';
}

function confirmAIResult() {
  const date = $('foodDate').value || getToday();
  const meal = $('foodMeal').value || 'snack';
  
  if (!state.foodHistory[date]) state.foodHistory[date] = [];
  
  const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  
  pendingAIResults.forEach(f => {
    state.foodHistory[date].push({
      name: f.name,
      grams: f.grams,
      kcal: f.kcal,
      protein: f.protein || 0,
      fat: f.fat || 0,
      carbs: f.carbs || 0,
      time: now,
      meal: meal
    });
  });

  pendingAIResults = [];
  $('aiModal').style.display = 'none';
  
  renderFoodList();
  updateFoodTotal();
  saveState();
  renderProgress();
}

// =====================================================
// SETTINGS
// =====================================================
function openSettings() {
  const savedKey = localStorage.getItem('gemini_api_key') || '';
  $('apiKeyInput').value = savedKey;
  $('settingsModal').style.display = 'flex';
}

function closeSettings() {
  $('settingsModal').style.display = 'none';
}

function saveApiKey() {
  const key = $('apiKeyInput').value.trim();
  if (key) {
    localStorage.setItem('gemini_api_key', key);
  } else {
    localStorage.removeItem('gemini_api_key');
  }
  $('settingsModal').style.display = 'none';
}
