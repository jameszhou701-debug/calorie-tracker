// ============================================================
// 食物热量数据库
// 数据来源：中国食物成分表（第6版）、USDA National Nutrient Database
// 单位：大卡(kcal)/100克 可食部
// ============================================================

const FOOD_DATABASE = [
  // ===== 主食 =====
  { name: "白米饭", kcal: 116, category: "主食" },
  { name: "馒头", kcal: 223, category: "主食" },
  { name: "面条(煮)", kcal: 110, category: "主食" },
  { name: "全麦面包", kcal: 246, category: "主食" },
  { name: "白面包", kcal: 280, category: "主食" },
  { name: "小米粥", kcal: 46, category: "主食" },
  { name: "燕麦片", kcal: 367, category: "主食" },
  { name: "玉米(煮)", kcal: 112, category: "主食" },
  { name: "红薯", kcal: 86, category: "主食" },
  { name: "土豆", kcal: 76, category: "主食" },
  { name: "糙米饭", kcal: 123, category: "主食" },
  { name: "饺子(猪肉)", kcal: 250, category: "主食" },
  { name: "包子(猪肉)", kcal: 227, category: "主食" },
  { name: "油条", kcal: 386, category: "主食" },
  { name: "煎饼", kcal: 336, category: "主食" },
  { name: "粽子", kcal: 180, category: "主食" },

  // ===== 肉类 =====
  { name: "鸡胸肉", kcal: 133, category: "肉类" },
  { name: "鸡腿肉", kcal: 181, category: "肉类" },
  { name: "猪瘦肉", kcal: 143, category: "肉类" },
  { name: "猪五花肉", kcal: 375, category: "肉类" },
  { name: "牛肉(瘦)", kcal: 125, category: "肉类" },
  { name: "牛腩", kcal: 276, category: "肉类" },
  { name: "羊肉", kcal: 203, category: "肉类" },
  { name: "鸭肉", kcal: 240, category: "肉类" },
  { name: "培根", kcal: 541, category: "肉类" },
  { name: "火腿肠", kcal: 212, category: "肉类" },
  { name: "猪排骨", kcal: 264, category: "肉类" },
  { name: "腊肉", kcal: 500, category: "肉类" },

  // ===== 水产 =====
  { name: "三文鱼", kcal: 208, category: "水产" },
  { name: "虾仁", kcal: 99, category: "水产" },
  { name: "带鱼", kcal: 127, category: "水产" },
  { name: "鲫鱼", kcal: 108, category: "水产" },
  { name: "金枪鱼", kcal: 130, category: "水产" },
  { name: "鲈鱼", kcal: 105, category: "水产" },
  { name: "螃蟹", kcal: 87, category: "水产" },
  { name: "生蚝", kcal: 57, category: "水产" },

  // ===== 蛋奶 =====
  { name: "鸡蛋(煮)", kcal: 144, category: "蛋奶" },
  { name: "鸡蛋(炒)", kcal: 196, category: "蛋奶" },
  { name: "鸡蛋白", kcal: 60, category: "蛋奶" },
  { name: "全脂牛奶", kcal: 61, category: "蛋奶" },
  { name: "脱脂牛奶", kcal: 33, category: "蛋奶" },
  { name: "酸奶(原味)", kcal: 72, category: "蛋奶" },
  { name: "奶酪", kcal: 328, category: "蛋奶" },

  // ===== 蔬菜 =====
  { name: "西兰花", kcal: 34, category: "蔬菜" },
  { name: "菠菜", kcal: 23, category: "蔬菜" },
  { name: "番茄", kcal: 18, category: "蔬菜" },
  { name: "黄瓜", kcal: 15, category: "蔬菜" },
  { name: "胡萝卜", kcal: 41, category: "蔬菜" },
  { name: "白菜", kcal: 13, category: "蔬菜" },
  { name: "芹菜", kcal: 14, category: "蔬菜" },
  { name: "生菜", kcal: 15, category: "蔬菜" },
  { name: "青椒", kcal: 22, category: "蔬菜" },
  { name: "南瓜", kcal: 22, category: "蔬菜" },
  { name: "茄子", kcal: 21, category: "蔬菜" },
  { name: "豆芽", kcal: 18, category: "蔬菜" },
  { name: "洋葱", kcal: 40, category: "蔬菜" },
  { name: "蘑菇", kcal: 22, category: "蔬菜" },
  { name: "莲藕", kcal: 70, category: "蔬菜" },

  // ===== 水果 =====
  { name: "苹果", kcal: 52, category: "水果" },
  { name: "香蕉", kcal: 89, category: "水果" },
  { name: "橙子", kcal: 47, category: "水果" },
  { name: "葡萄", kcal: 69, category: "水果" },
  { name: "西瓜", kcal: 30, category: "水果" },
  { name: "草莓", kcal: 32, category: "水果" },
  { name: "芒果", kcal: 60, category: "水果" },
  { name: "蓝莓", kcal: 57, category: "水果" },
  { name: "猕猴桃", kcal: 61, category: "水果" },
  { name: "梨", kcal: 42, category: "水果" },
  { name: "牛油果", kcal: 160, category: "水果" },
  { name: "榴莲", kcal: 147, category: "水果" },
  { name: "樱桃", kcal: 63, category: "水果" },
  { name: "菠萝", kcal: 50, category: "水果" },

  // ===== 零食/饮品 =====
  { name: "薯片", kcal: 536, category: "零食" },
  { name: "巧克力", kcal: 546, category: "零食" },
  { name: "饼干", kcal: 435, category: "零食" },
  { name: "冰淇淋", kcal: 207, category: "零食" },
  { name: "蛋糕", kcal: 348, category: "零食" },
  { name: "可乐(听)", kcal: 42, category: "饮品" },
  { name: "果汁(橙汁)", kcal: 45, category: "饮品" },
  { name: "啤酒", kcal: 43, category: "饮品" },
  { name: "奶茶", kcal: 65, category: "饮品" },
  { name: "美式咖啡", kcal: 2, category: "饮品" },
  { name: "拿铁(全脂)", kcal: 54, category: "饮品" },

  // ===== 油脂/坚果/调味 =====
  { name: "花生油", kcal: 899, category: "油脂" },
  { name: "橄榄油", kcal: 899, category: "油脂" },
  { name: "黄油", kcal: 717, category: "油脂" },
  { name: "花生", kcal: 567, category: "坚果" },
  { name: "核桃", kcal: 654, category: "坚果" },
  { name: "杏仁", kcal: 579, category: "坚果" },
  { name: "腰果", kcal: 553, category: "坚果" },
  { name: "白砂糖", kcal: 400, category: "调味" },
  { name: "蜂蜜", kcal: 304, category: "调味" },
  { name: "酱油", kcal: 53, category: "调味" },

  // ===== 豆制品 =====
  { name: "豆腐", kcal: 76, category: "豆制品" },
  { name: "豆浆", kcal: 31, category: "豆制品" },
  { name: "豆腐干", kcal: 140, category: "豆制品" },
  { name: "腐竹", kcal: 459, category: "豆制品" },
];

// ============================================================
// 运动热量消耗数据库
// 数据来源：Compendium of Physical Activities (2011)
// MET = 代谢当量，热量消耗 = MET × 体重(kg) × 时间(h)
// ============================================================

const EXERCISE_DATABASE = {
  running:     { name: "跑步 (8km/h)", met: 8.0, icon: "🏃", category: "有氧" },
  running_fast:{ name: "跑步 (12km/h)", met: 12.0, icon: "🏃‍♂️", category: "有氧" },
  swimming:    { name: "游泳 (自由泳)", met: 9.8, icon: "🏊", category: "有氧" },
  walking:     { name: "慢走 (5km/h)", met: 3.5, icon: "🚶", category: "日常" },
  brisk_walk:  { name: "快走 (7km/h)", met: 5.0, icon: "🚶‍♂️", category: "有氧" },
  cycling:     { name: "骑行 (16km/h)", met: 6.0, icon: "🚴", category: "有氧" },
  cycling_fast:{ name: "骑行 (22km/h)", met: 8.5, icon: "🚴‍♂️", category: "有氧" },
  hiking:      { name: "爬山", met: 7.0, icon: "⛰", category: "户外" },
  jumping_rope:{ name: "跳绳", met: 11.0, icon: "🪢", category: "有氧" },
  hiit:        { name: "HIIT训练", met: 8.0, icon: "💦", category: "高强度" },
  yoga:        { name: "瑜伽", met: 2.5, icon: "🧘", category: "柔韧" },
  strength:    { name: "力量训练", met: 5.0, icon: "🏋️", category: "力量" },
  badminton:   { name: "羽毛球", met: 5.5, icon: "🏸", category: "球类" },
  basketball:  { name: "篮球", met: 6.5, icon: "🏀", category: "球类" },
  tennis:      { name: "网球", met: 7.3, icon: "🎾", category: "球类" },
  soccer:      { name: "足球", met: 7.0, icon: "⚽", category: "球类" },
  dance:       { name: "跳舞", met: 4.8, icon: "💃", category: "娱乐" },
  pilates:     { name: "普拉提", met: 3.0, icon: "🧎", category: "柔韧" },
  stair_climb: { name: "爬楼梯", met: 8.0, icon: "🪜", category: "日常" },
  elliptical:  { name: "椭圆机", met: 5.0, icon: "🔵", category: "有氧" },
};

// ============================================================
// 膳食指南 - 数据来源：中国居民膳食指南(2022)
// https://www.cnsoc.org/
// 每日推荐摄入量（克/天），基于2000大卡标准
// ============================================================
const DIET_GUIDELINES = {
  lose: [
    { name: "谷薯类", grams: 250, unit: "g", icon: "🌾", desc: "其中全谷物和杂豆50-150g" },
    { name: "蔬菜", grams: 500, unit: "g", icon: "🥬", desc: "深色蔬菜应占一半" },
    { name: "水果", grams: 250, unit: "g", icon: "🍎", desc: "优先选择低GI水果" },
    { name: "畜禽肉", grams: 100, unit: "g", icon: "🥩", desc: "优先鱼禽，减少红肉" },
    { name: "蛋类", grams: 50, unit: "g", icon: "🥚", desc: "约1个鸡蛋" },
    { name: "奶类", grams: 300, unit: "ml", icon: "🥛", desc: "可选低脂/脱脂奶" },
    { name: "大豆坚果", grams: 30, unit: "g", icon: "🥜", desc: "原味坚果一小把" },
    { name: "烹调油", grams: 20, unit: "g", icon: "🫒", desc: "优选植物油" },
  ],
  gain: [
    { name: "谷薯类", grams: 350, unit: "g", icon: "🌾", desc: "增加碳水摄入" },
    { name: "蔬菜", grams: 400, unit: "g", icon: "🥬", desc: "保证维生素摄入" },
    { name: "水果", grams: 300, unit: "g", icon: "🍎", desc: "多样化选择" },
    { name: "畜禽肉", grams: 180, unit: "g", icon: "🥩", desc: "增加优质蛋白" },
    { name: "水产类", grams: 75, unit: "g", icon: "🐟", desc: "三文鱼、虾仁等" },
    { name: "蛋类", grams: 100, unit: "g", icon: "🥚", desc: "约2个鸡蛋" },
    { name: "奶类", grams: 500, unit: "ml", icon: "🥛", desc: "全脂牛奶优先" },
    { name: "大豆坚果", grams: 40, unit: "g", icon: "🥜", desc: "坚果和豆制品" },
  ],
};

// ============================================================
// 体型选择
// ============================================================
const BODY_TYPES = [
  { id: "standard", name: "匀称型", emoji: "🧍", desc: "身材比例均衡", bmiAdjust: 0, bmrFactor: 1.0 },
  { id: "muscular", name: "肌肉型", emoji: "💪", desc: "肌肉含量较高", bmiAdjust: 0.3, bmrFactor: 1.08 },
  { id: "chubby", name: "微胖型", emoji: "🐻", desc: "体脂略高", bmiAdjust: -0.3, bmrFactor: 0.95 },
  { id: "apple", name: "苹果型", emoji: "🍎", desc: "腹部脂肪较多", bmiAdjust: -0.5, bmrFactor: 0.93 },
  { id: "pear", name: "梨型", emoji: "🍐", desc: "下半身脂肪较多", bmiAdjust: 0, bmrFactor: 0.97 },
  { id: "slim", name: "苗条型", emoji: "🧘", desc: "骨架小体脂低", bmiAdjust: 0.5, bmrFactor: 1.02 },
  { id: "athletic", name: "运动型", emoji: "🏃", desc: "体能好肌肉适中", bmiAdjust: 0.2, bmrFactor: 1.06 },
  { id: "stocky", name: "结实型", emoji: "🦍", desc: "骨架大体质壮", bmiAdjust: -0.2, bmrFactor: 1.04 },
];

// ============================================================
// 目标体型（用于计划目标）
// ============================================================
const BODY_GOALS = [
  { id: "slim", name: "苗条型", emoji: "🧘", desc: "低体脂，线条清晰" },
  { id: "muscular", name: "肌肉型", emoji: "💪", desc: "增肌塑形，结实有力" },
  { id: "toned", name: "紧致型", emoji: "✨", desc: "匀称有线条，健康活力" },
  { id: "athletic", name: "运动型", emoji: "🏃", desc: "体能优先，灵活敏捷" },
  { id: "curvy", name: "曲线型", emoji: "🌊", desc: "保持曲线，丰满匀称" },
];

// ============================================================
// 头像选择
// ============================================================
const AVATARS = [
  { id: "pig", emoji: "🐷", name: "小猪" },
  { id: "fish", emoji: "🐟", name: "小鱼" },
  { id: "dog", emoji: "🐶", name: "小狗" },
  { id: "horse", emoji: "🐴", name: "小马" },
  { id: "cat", emoji: "🐱", name: "小猫" },
  { id: "rabbit", emoji: "🐰", name: "小兔" },
  { id: "bear", emoji: "🐻", name: "小熊" },
  { id: "panda", emoji: "🐼", name: "熊猫" },
  { id: "monkey", emoji: "🐵", name: "小猴" },
  { id: "lion", emoji: "🦁", name: "小狮" },
  { id: "tiger", emoji: "🐯", name: "小虎" },
  { id: "cow", emoji: "🐮", name: "小牛" },
];

// ============================================================
// BMR 计算公式 - Mifflin-St Jeor Equation
// 男: BMR = 10×体重 + 6.25×身高 - 5×年龄 + 5
// 女: BMR = 10×体重 + 6.25×身高 - 5×年龄 - 161
// ============================================================
function calcBMR(weight, height, age, gender) {
  if (gender === 'male') return 10 * weight + 6.25 * height - 5 * age + 5;
  else return 10 * weight + 6.25 * height - 5 * age - 161;
}

function calcStandardWeight(height, gender) {
  if (gender === 'male') return (height - 100) * 0.9;
  else return (height - 100) * 0.9 - 2.5;
}

function calcBMI(weight, height) {
  const h = height / 100;
  return weight / (h * h);
}

function getBMICategory(bmi, bodyTypeId) {
  // Adjust BMI based on body type (muscle weighs more than fat)
  const bt = BODY_TYPES.find(b => b.id === bodyTypeId) || { bmiAdjust: 0 };
  const adjBmi = bmi + (bt.bmiAdjust || 0);
  if (adjBmi < 18.5) return { cat: "偏瘦", color: "#ff9f43" };
  if (adjBmi < 24.0) return { cat: "正常", color: "#00ce7c" };
  if (adjBmi < 28.0) return { cat: "偏胖", color: "#ff9f43" };
  return { cat: "肥胖", color: "#ff6b6b" };
}

function calcExerciseBurn(met, weight, minutes) {
  return Math.round(met * weight * (minutes / 60));
}

function calcDailyDeficit(currentWeight, targetWeight, days) {
  return Math.round(Math.abs(targetWeight - currentWeight) * 7700 / days);
}


// ============================================================
// 运动指南 - 基于体型+目标
// ============================================================
const EXERCISE_GUIDES = {
  muscular: {
    title: "增肌塑形训练方案",
    weekly: [
      { day: "力量训练", detail: "大重量低次数(6-8次), 胸/背/腿分化", icon: "🏋️", type: "strength" },
      { day: "力量训练", detail: "肩/手臂, 中等重量(10-12次)", icon: "💪", type: "strength" },
      { day: "有氧运动", detail: "30分钟慢跑或骑行, 保持心肺", icon: "🏃", type: "running" },
      { day: "力量训练", detail: "腿/核心, 深蹲硬拉为主", icon: "🦵", type: "strength" },
      { day: "有氧+拉伸", detail: "HIIT 20分钟 + 瑜伽拉伸", icon: "🧘", type: "hiit" },
      { day: "休息", detail: "充分休息, 肌肉生长日", icon: "😴", type: null },
      { day: "轻度活动", detail: "散步或游泳, 促进恢复", icon: "🚶", type: "walking" },
    ],
    tips: "蛋白质摄入目标: 1.6-2.0g/kg体重, 碳水: 4-6g/kg体重"
  },
  slim: {
    title: "减脂塑形训练方案",
    weekly: [
      { day: "HIIT训练", detail: "30分钟高强度间歇, 全身燃脂", icon: "💦", type: "hiit" },
      { day: "有氧运动", detail: "45分钟慢跑, 心率130-150", icon: "🏃", type: "running" },
      { day: "力量+有氧", detail: "轻重量(15-20次)+ 30分钟快走", icon: "🏋️", type: "strength" },
      { day: "有氧运动", detail: "40分钟游泳或骑行", icon: "🚴", type: "cycling" },
      { day: "HIIT训练", detail: "25分钟, 核心+全身", icon: "💦", type: "hiit" },
      { day: "休息或瑜伽", detail: "轻度拉伸瑜伽, 恢复日", icon: "🧘", type: "yoga" },
      { day: "户外活动", detail: "爬山或羽毛球, 趣味运动", icon: "⛰", type: "hiking" },
    ],
    tips: "保持热量缺口300-500大卡/天, 蛋白质1.5g/kg体重"
  },
  toned: {
    title: "紧致塑形训练方案",
    weekly: [
      { day: "力量训练", detail: "中等重量(12-15次), 全身热身", icon: "🏋️", type: "strength" },
      { day: "有氧运动", detail: "35分钟跑步或椭圆机", icon: "🏃", type: "running" },
      { day: "普拉提/瑜伽", detail: "核心力量+柔韧性", icon: "🧘", type: "yoga" },
      { day: "力量训练", detail: "臀腿+核心重点", icon: "🦵", type: "strength" },
      { day: "有氧运动", detail: "30分钟跳绳或快走", icon: "🪢", type: "jumping_rope" },
      { day: "休息", detail: "身体修复日", icon: "😴", type: null },
      { day: "户外运动", detail: "羽毛球/篮球等球类运动", icon: "🏸", type: "badminton" },
    ],
    tips: "均衡饮食, 蛋白质1.2-1.5g/kg, 保持热量接近维持水平"
  },
  athletic: {
    title: "综合体能训练方案",
    weekly: [
      { day: "力量+HIIT", detail: "复合动作+ 15分钟HIIT", icon: "💪", type: "hiit" },
      { day: "跑步训练", detail: "40分钟间歇跑或长跑", icon: "🏃", type: "running_fast" },
      { day: "力量训练", detail: "爆发力训练, 快速动作", icon: "🏋️", type: "strength" },
      { day: "游泳/骑行", detail: "45分钟有氧耐力", icon: "🏊", type: "swimming" },
      { day: "球类/登山", detail: "团队运动或户外登山", icon: "⛰", type: "hiking" },
      { day: "休息", detail: "充分恢复", icon: "😴", type: null },
      { day: "柔韧训练", detail: "瑜伽+拉伸, 防伤", icon: "🧘", type: "yoga" },
    ],
    tips: "碳水4-5g/kg, 蛋白质1.5g/kg, 保证充足睡眠"
  },
  curvy: {
    title: "曲线保持训练方案",
    weekly: [
      { day: "有氧运动", detail: "30分钟快走或慢跑", icon: "🚶", type: "brisk_walk" },
      { day: "力量训练", detail: "臀腿+腰腹重点, 中等重量", icon: "🦵", type: "strength" },
      { day: "瑜伽/普拉提", detail: "塑形拉伸, 改善体态", icon: "🧘", type: "yoga" },
      { day: "有氧运动", detail: "35分钟骑行或游泳", icon: "🚴", type: "cycling" },
      { day: "力量训练", detail: "上肢+核心, 轻重量(15-20次)", icon: "💪", type: "strength" },
      { day: "休息", detail: "放松恢复", icon: "😴", type: null },
      { day: "户外活动", detail: "爬山或散步1小时", icon: "⛰", type: "hiking" },
    ],
    tips: "保持热量平衡, 蛋白质1.2g/kg, 健康脂肪适量摄入"
  }
};
// ============================================================
// 鼓励语库
// ============================================================
const ENCOURAGEMENTS = {
  daily: {
    0:  { text: "新的一天，从记录开始！每一次记录都是对自己的承诺 ✨", type: "motivate" },
    25: { text: "不错！完成了四分之一，好习惯正在形成 🌱", type: "good" },
    50: { text: "进度过半！坚持下去，今天就是明天的标杆 🔥", type: "fire" },
    75: { text: "只剩最后一段路，胜利就在前方！⚡", type: "fire" },
    90: { text: "接近完成！今天的表现令人骄傲 💪", type: "good" },
    100:{ text: "今日目标达成！给自己一个大大的赞 🏆🌟", type: "good" },
    110:{ text: "今天略超标了，没关系，明天调整回来 😊", type: "warn" },
  },
  weekly: {
    0:  { text: "新的一周，七天后看到一个更好的自己！", type: "motivate" },
    1:  { text: "第一天打卡！万事开头难，最难的一步已经迈出 🌱", type: "good" },
    2:  { text: "坚持两天了！好习惯正在悄悄形成 🌿", type: "good" },
    3:  { text: "三天连续！21天养成习惯，你走了1/7 🔥", type: "fire" },
    4:  { text: "四天！正在超越大多数人的意志力 ⚡", type: "fire" },
    5:  { text: "五天不中断！自律已成生活的一部分 💪", type: "good" },
    6:  { text: "六天！再坚持一天就完成一周目标！🏆", type: "fire" },
    7:  { text: "🎉 完成一周目标！自律的化身！下周继续！🌟", type: "good" },
  },
};
