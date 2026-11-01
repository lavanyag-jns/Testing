/**
 * NutriTrack - Vanilla Calorie & Macro Tracker
 * Pure vanilla JavaScript with persistent localStorage storage
 */

(function () {
  'use strict';

  // --- Constants & Defaults ---
  const STORAGE_KEY = 'nutritrack_app_data_v1';

  const DEFAULT_DATA = {
    goals: {
      calories: 2000,
      protein: 140,
      carbs: 220,
      fat: 65,
    },
    days: {},
  };

  const PRESET_LIBRARY = {
    egg: { name: 'Boiled Egg', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, serving: '1 large' },
    banana: { name: 'Medium Banana', calories: 105, protein: 1.3, carbs: 27.0, fat: 0.3, serving: '1 medium (118g)' },
    chicken: { name: 'Grilled Chicken Breast', calories: 247, protein: 46.5, carbs: 0.0, fat: 5.4, serving: '150g' },
    rice: { name: 'Cooked White Rice', calories: 195, protein: 4.1, carbs: 42.0, fat: 0.4, serving: '150g' },
    oats: { name: 'Oatmeal Bowl', calories: 210, protein: 7.0, carbs: 38.0, fat: 3.5, serving: '1 bowl (40g dry)' },
    shake: { name: 'Whey Protein Shake', calories: 130, protein: 25.0, carbs: 3.0, fat: 1.5, serving: '1 scoop + water' },
    apple: { name: 'Fresh Apple', calories: 95, protein: 0.5, carbs: 25.0, fat: 0.3, serving: '1 medium' },
    almonds: { name: 'Raw Almonds', calories: 145, protein: 5.3, carbs: 5.4, fat: 12.5, serving: '25g handful' },
  };

  // --- Application State ---
  let appState = loadState();
  let selectedDate = getTodayDateString();

  // Seed sample data for today if user is completely new
  seedInitialDataIfEmpty();

  // --- DOM Element References ---
  const elements = {
    // Date navigation
    datePicker: document.getElementById('date-picker'),
    dateDisplay: document.getElementById('date-display'),
    prevDayBtn: document.getElementById('prev-day-btn'),
    nextDayBtn: document.getElementById('next-day-btn'),
    todayBtn: document.getElementById('today-btn'),

    // Calorie stats
    goalCaloriesVal: document.getElementById('goal-calories-val'),
    consumedCaloriesVal: document.getElementById('consumed-calories-val'),
    remainingCaloriesVal: document.getElementById('remaining-calories-val'),
    calorieProgressFill: document.getElementById('calorie-progress-fill'),
    progressPercentLabel: document.getElementById('progress-percent-label'),
    calorieStatusLabel: document.getElementById('calorie-status-label'),

    // Macros
    consumedProtein: document.getElementById('consumed-protein'),
    goalProtein: document.getElementById('goal-protein'),
    proteinProgressFill: document.getElementById('protein-progress-fill'),

    consumedCarbs: document.getElementById('consumed-carbs'),
    goalCarbs: document.getElementById('goal-carbs'),
    carbsProgressFill: document.getElementById('carbs-progress-fill'),

    consumedFat: document.getElementById('consumed-fat'),
    goalFat: document.getElementById('goal-fat'),
    fatProgressFill: document.getElementById('fat-progress-fill'),

    macroDistributionText: document.getElementById('macro-distribution-text'),

    // Presets
    presetPillsContainer: document.getElementById('preset-pills-container'),

    // Food Entry Form
    foodForm: document.getElementById('food-form'),
    mealTypeSelect: document.getElementById('meal-type'),
    foodNameInput: document.getElementById('food-name'),
    foodCaloriesInput: document.getElementById('food-calories'),
    foodServingInput: document.getElementById('food-serving'),
    foodProteinInput: document.getElementById('food-protein'),
    foodCarbsInput: document.getElementById('food-carbs'),
    foodFatInput: document.getElementById('food-fat'),

    // Meal lists & totals
    listBreakfast: document.getElementById('list-breakfast'),
    totalBreakfastCals: document.getElementById('total-breakfast-cals'),
    subBreakfastMacros: document.getElementById('sub-breakfast-macros'),

    listLunch: document.getElementById('list-lunch'),
    totalLunchCals: document.getElementById('total-lunch-cals'),
    subLunchMacros: document.getElementById('sub-lunch-macros'),

    listDinner: document.getElementById('list-dinner'),
    totalDinnerCals: document.getElementById('total-dinner-cals'),
    subDinnerMacros: document.getElementById('sub-dinner-macros'),

    listSnacks: document.getElementById('list-snacks'),
    totalSnacksCals: document.getElementById('total-snacks-cals'),
    subSnacksMacros: document.getElementById('sub-snacks-macros'),

    // Goals Modal
    goalsModal: document.getElementById('goals-modal'),
    openGoalsBtn: document.getElementById('open-goals-btn'),
    closeGoalsBtn: document.getElementById('close-goals-btn'),
    cancelGoalsBtn: document.getElementById('cancel-goals-btn'),
    goalsForm: document.getElementById('goals-form'),
    calcMacrosBtn: document.getElementById('calc-macros-btn'),
    targetCaloriesInput: document.getElementById('target-calories-input'),
    targetProteinInput: document.getElementById('target-protein-input'),
    targetCarbsInput: document.getElementById('target-carbs-input'),
    targetFatInput: document.getElementById('target-fat-input'),

    // Footer actions
    clearDayBtn: document.getElementById('clear-day-btn'),
    exportDataBtn: document.getElementById('export-data-btn'),
    importDataInput: document.getElementById('import-data-input'),
    resetAllBtn: document.getElementById('reset-all-btn'),
  };

  // --- Date Utility Functions ---
  function getTodayDateString() {
    const now = new Date();
    return formatDateKey(now);
  }

  function formatDateKey(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseDateKey(dateStr) {
    const parts = dateStr.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  function formatDisplayDate(dateStr) {
    const todayStr = getTodayDateString();
    const targetDate = parseDateKey(dateStr);

    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = formatDateKey(yesterdayObj);

    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowStr = formatDateKey(tomorrowObj);

    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    const dateFormatted = targetDate.toLocaleDateString(undefined, options);

    if (dateStr === todayStr) {
      return `Today (${dateFormatted})`;
    } else if (dateStr === yesterdayStr) {
      return `Yesterday (${dateFormatted})`;
    } else if (dateStr === tomorrowStr) {
      return `Tomorrow (${dateFormatted})`;
    }
    return dateFormatted;
  }

  function changeDay(deltaDays) {
    const current = parseDateKey(selectedDate);
    current.setDate(current.getDate() + deltaDays);
    selectedDate = formatDateKey(current);
    syncDateAndRender();
  }

  // --- Storage Functions ---
  function loadState() {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
      }
      const parsed = JSON.parse(serialized);
      // Ensure expected structure
      return {
        goals: { ...DEFAULT_DATA.goals, ...(parsed.goals || {}) },
        days: parsed.days || {},
      };
    } catch (err) {
      console.error('Failed to parse localStorage data:', err);
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      alert('Local storage is full or disabled. Changes may not be saved.');
    }
  }

  function seedInitialDataIfEmpty() {
    const allDays = Object.keys(appState.days);
    if (allDays.length === 0) {
      const today = getTodayDateString();
      appState.days[today] = [
        {
          id: 'sample-1',
          name: 'Oatmeal with Blueberries & Honey',
          meal: 'breakfast',
          calories: 320,
          protein: 8,
          carbs: 58,
          fat: 5,
          serving: '1 bowl',
          timestamp: Date.now() - 3600000 * 3,
        },
        {
          id: 'sample-2',
          name: 'Black Coffee',
          meal: 'breakfast',
          calories: 5,
          protein: 0,
          carbs: 1,
          fat: 0,
          serving: '1 cup',
          timestamp: Date.now() - 3600000 * 3 + 60000,
        },
        {
          id: 'sample-3',
          name: 'Grilled Chicken Salad with Olive Oil',
          meal: 'lunch',
          calories: 460,
          protein: 42,
          carbs: 12,
          fat: 24,
          serving: '1 plate',
          timestamp: Date.now() - 3600000,
        },
      ];
      saveState();
    }
  }

  // --- State Accessors & Mutations ---
  function getEntriesForDate(dateStr) {
    return appState.days[dateStr] || [];
  }

  function addFoodEntry(entry) {
    if (!appState.days[selectedDate]) {
      appState.days[selectedDate] = [];
    }
    appState.days[selectedDate].push(entry);
    saveState();
    render();
  }

  function deleteFoodEntry(entryId) {
    if (!appState.days[selectedDate]) return;
    appState.days[selectedDate] = appState.days[selectedDate].filter(item => item.id !== entryId);
    saveState();
    render();
  }

  // --- Rendering UI ---
  function syncDateAndRender() {
    elements.datePicker.value = selectedDate;
    elements.dateDisplay.textContent = formatDisplayDate(selectedDate);
    render();
  }

  function render() {
    const entries = getEntriesForDate(selectedDate);
    const goals = appState.goals;

    // Totals accumulation
    let totalCals = 0;
    let totalP = 0;
    let totalC = 0;
    let totalF = 0;

    const mealBuckets = {
      breakfast: { items: [], cals: 0, p: 0, c: 0, f: 0 },
      lunch: { items: [], cals: 0, p: 0, c: 0, f: 0 },
      dinner: { items: [], cals: 0, p: 0, c: 0, f: 0 },
      snacks: { items: [], cals: 0, p: 0, c: 0, f: 0 },
    };

    entries.forEach(item => {
      const cals = Number(item.calories) || 0;
      const p = Number(item.protein) || 0;
      const c = Number(item.carbs) || 0;
      const f = Number(item.fat) || 0;

      totalCals += cals;
      totalP += p;
      totalC += c;
      totalF += f;

      const bucket = mealBuckets[item.meal] || mealBuckets.snacks;
      bucket.items.push(item);
      bucket.cals += cals;
      bucket.p += p;
      bucket.c += c;
      bucket.f += f;
    });

    // 1. Render Calorie Summary Card
    elements.goalCaloriesVal.textContent = goals.calories;
    elements.consumedCaloriesVal.textContent = Math.round(totalCals);

    const remaining = goals.calories - totalCals;
    elements.remainingCaloriesVal.textContent = Math.round(Math.abs(remaining));

    if (remaining < 0) {
      elements.remainingCaloriesVal.classList.add('over-budget');
      elements.calorieStatusLabel.textContent = `Over goal by ${Math.round(Math.abs(remaining))} kcal`;
      elements.calorieStatusLabel.style.color = '#ef4444';
    } else {
      elements.remainingCaloriesVal.classList.remove('over-budget');
      elements.calorieStatusLabel.textContent = `${Math.round(remaining)} kcal remaining`;
      elements.calorieStatusLabel.style.color = '#059669';
    }

    const pctCalories = goals.calories > 0 ? (totalCals / goals.calories) * 100 : 0;
    const clampedPct = Math.min(Math.max(pctCalories, 0), 100);
    elements.calorieProgressFill.style.width = `${clampedPct}%`;

    if (pctCalories > 100) {
      elements.calorieProgressFill.className = 'progress-bar-fill exceeded';
    } else if (pctCalories > 85) {
      elements.calorieProgressFill.className = 'progress-bar-fill warning';
    } else {
      elements.calorieProgressFill.className = 'progress-bar-fill';
    }
    elements.progressPercentLabel.textContent = `${Math.round(pctCalories)}% of daily goal`;

    // 2. Render Macronutrients
    elements.consumedProtein.textContent = totalP.toFixed(1).replace('.0', '');
    elements.goalProtein.textContent = goals.protein;
    const proteinPct = goals.protein > 0 ? Math.min((totalP / goals.protein) * 100, 100) : 0;
    elements.proteinProgressFill.style.width = `${proteinPct}%`;

    elements.consumedCarbs.textContent = totalC.toFixed(1).replace('.0', '');
    elements.goalCarbs.textContent = goals.carbs;
    const carbsPct = goals.carbs > 0 ? Math.min((totalC / goals.carbs) * 100, 100) : 0;
    elements.carbsProgressFill.style.width = `${carbsPct}%`;

    elements.consumedFat.textContent = totalF.toFixed(1).replace('.0', '');
    elements.goalFat.textContent = goals.fat;
    const fatPct = goals.fat > 0 ? Math.min((totalF / goals.fat) * 100, 100) : 0;
    elements.fatProgressFill.style.width = `${fatPct}%`;

    // Macro Energy Distribution (4 kcal/g for P & C, 9 kcal/g for F)
    const pKcal = totalP * 4;
    const cKcal = totalC * 4;
    const fKcal = totalF * 9;
    const macroKcalTotal = pKcal + cKcal + fKcal;

    if (macroKcalTotal > 0) {
      const pShare = Math.round((pKcal / macroKcalTotal) * 100);
      const cShare = Math.round((cKcal / macroKcalTotal) * 100);
      const fShare = Math.round((fKcal / macroKcalTotal) * 100);
      elements.macroDistributionText.textContent = `Macro Energy Split: Protein ${pShare}% · Carbs ${cShare}% · Fat ${fShare}%`;
    } else {
      elements.macroDistributionText.textContent = `P: 0% · C: 0% · F: 0% of energy`;
    }

    // 3. Render Meal Lists
    renderMealGroup('breakfast', mealBuckets.breakfast, elements.listBreakfast, elements.totalBreakfastCals, elements.subBreakfastMacros);
    renderMealGroup('lunch', mealBuckets.lunch, elements.listLunch, elements.totalLunchCals, elements.subLunchMacros);
    renderMealGroup('dinner', mealBuckets.dinner, elements.listDinner, elements.totalDinnerCals, elements.subDinnerMacros);
    renderMealGroup('snacks', mealBuckets.snacks, elements.listSnacks, elements.totalSnacksCals, elements.subSnacksMacros);
  }

  function renderMealGroup(mealName, bucket, listEl, totalCalsEl, subMacrosEl) {
    totalCalsEl.textContent = `${Math.round(bucket.cals)} kcal`;
    subMacrosEl.textContent = `${bucket.p.toFixed(0)}g P · ${bucket.c.toFixed(0)}g C · ${bucket.f.toFixed(0)}g F`;

    listEl.innerHTML = '';

    if (bucket.items.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'empty-list-placeholder';
      emptyLi.textContent = `No items logged for ${mealName} yet.`;
      listEl.appendChild(emptyLi);
      return;
    }

    bucket.items.forEach(item => {
      const li = document.createElement('li');
      li.className = 'food-item';

      const infoDiv = document.createElement('div');
      infoDiv.className = 'food-item-info';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'food-item-name';
      nameSpan.textContent = item.name;
      infoDiv.appendChild(nameSpan);

      const metaDiv = document.createElement('div');
      metaDiv.className = 'food-item-meta';

      if (item.serving) {
        const servingSpan = document.createElement('span');
        servingSpan.textContent = item.serving;
        metaDiv.appendChild(servingSpan);
      }

      const pVal = Number(item.protein) || 0;
      const cVal = Number(item.carbs) || 0;
      const fVal = Number(item.fat) || 0;

      if (pVal > 0 || cVal > 0 || fVal > 0) {
        const macroSpan = document.createElement('span');
        macroSpan.textContent = `(${pVal}g P / ${cVal}g C / ${fVal}g F)`;
        metaDiv.appendChild(macroSpan);
      }

      infoDiv.appendChild(metaDiv);

      const rightDiv = document.createElement('div');
      rightDiv.className = 'food-item-right';

      const calsBadge = document.createElement('span');
      calsBadge.className = 'food-item-calories';
      calsBadge.textContent = `${Math.round(item.calories)} kcal`;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete-item';
      deleteBtn.type = 'button';
      deleteBtn.title = 'Remove item';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.addEventListener('click', () => {
        deleteFoodEntry(item.id);
      });

      rightDiv.appendChild(calsBadge);
      rightDiv.appendChild(deleteBtn);

      li.appendChild(infoDiv);
      li.appendChild(rightDiv);
      listEl.appendChild(li);
    });
  }

  // --- Event Listeners Setup ---
  function initEventListeners() {
    // Date Nav
    elements.prevDayBtn.addEventListener('click', () => changeDay(-1));
    elements.nextDayBtn.addEventListener('click', () => changeDay(1));
    elements.todayBtn.addEventListener('click', () => {
      selectedDate = getTodayDateString();
      syncDateAndRender();
    });

    elements.datePicker.addEventListener('change', (e) => {
      if (e.target.value) {
        selectedDate = e.target.value;
        syncDateAndRender();
      }
    });

    // Preset Pills
    elements.presetPillsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.preset-btn');
      if (!btn) return;
      const key = btn.dataset.preset;
      const preset = PRESET_LIBRARY[key];
      if (!preset) return;

      // Populate form fields
      elements.foodNameInput.value = preset.name;
      elements.foodCaloriesInput.value = preset.calories;
      elements.foodServingInput.value = preset.serving || '';
      elements.foodProteinInput.value = preset.protein;
      elements.foodCarbsInput.value = preset.carbs;
      elements.foodFatInput.value = preset.fat;

      // Focus calories or submit
      elements.foodCaloriesInput.focus();
    });

    // Food Submit Form
    elements.foodForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = elements.foodNameInput.value.trim();
      const calories = parseFloat(elements.foodCaloriesInput.value);
      if (!name || isNaN(calories) || calories < 0) {
        alert('Please enter a valid food name and calorie amount.');
        return;
      }

      const newEntry = {
        id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name: name,
        meal: elements.mealTypeSelect.value,
        calories: calories,
        serving: elements.foodServingInput.value.trim(),
        protein: parseFloat(elements.foodProteinInput.value) || 0,
        carbs: parseFloat(elements.foodCarbsInput.value) || 0,
        fat: parseFloat(elements.foodFatInput.value) || 0,
        timestamp: Date.now(),
      };

      addFoodEntry(newEntry);

      // Reset form but retain current meal category
      const currentMeal = elements.mealTypeSelect.value;
      elements.foodForm.reset();
      elements.mealTypeSelect.value = currentMeal;
      elements.foodNameInput.focus();
    });

    // Goals Modal open / close
    elements.openGoalsBtn.addEventListener('click', openGoalsModal);
    elements.closeGoalsBtn.addEventListener('click', closeGoalsModal);
    elements.cancelGoalsBtn.addEventListener('click', closeGoalsModal);

    elements.goalsModal.addEventListener('click', (e) => {
      if (e.target === elements.goalsModal) {
        closeGoalsModal();
      }
    });

    // Auto calculate 30/40/30 macros
    elements.calcMacrosBtn.addEventListener('click', () => {
      const cals = parseFloat(elements.targetCaloriesInput.value) || 2000;
      // 30% Protein = (cals * 0.3) / 4
      const p = Math.round((cals * 0.3) / 4);
      // 40% Carbs = (cals * 0.4) / 4
      const c = Math.round((cals * 0.4) / 4);
      // 30% Fat = (cals * 0.3) / 9
      const f = Math.round((cals * 0.3) / 9);

      elements.targetProteinInput.value = p;
      elements.targetCarbsInput.value = c;
      elements.targetFatInput.value = f;
    });

    // Save goals form
    elements.goalsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cals = parseFloat(elements.targetCaloriesInput.value);
      const p = parseFloat(elements.targetProteinInput.value);
      const c = parseFloat(elements.targetCarbsInput.value);
      const f = parseFloat(elements.targetFatInput.value);

      if (isNaN(cals) || cals <= 0) {
        alert('Please enter a valid daily calorie goal.');
        return;
      }

      appState.goals = {
        calories: Math.round(cals),
        protein: Math.round(p) || 0,
        carbs: Math.round(c) || 0,
        fat: Math.round(f) || 0,
      };

      saveState();
      closeGoalsModal();
      render();
    });

    // Footer actions
    elements.clearDayBtn.addEventListener('click', () => {
      const count = (appState.days[selectedDate] || []).length;
      if (count === 0) {
        alert('No entries to clear for this day.');
        return;
      }
      if (confirm(`Are you sure you want to clear all ${count} food items logged for ${formatDisplayDate(selectedDate)}?`)) {
        appState.days[selectedDate] = [];
        saveState();
        render();
      }
    });

    elements.exportDataBtn.addEventListener('click', exportDataAsJson);
    elements.importDataInput.addEventListener('change', importDataFromJson);

    elements.resetAllBtn.addEventListener('click', () => {
      const confirmFirst = confirm('WARNING: This will permanently delete ALL logged days, history, and goals.\n\nAre you sure you want to proceed?');
      if (confirmFirst) {
        localStorage.removeItem(STORAGE_KEY);
        appState = JSON.parse(JSON.stringify(DEFAULT_DATA));
        saveState();
        syncDateAndRender();
        alert('All data has been reset.');
      }
    });
  }

  function openGoalsModal() {
    elements.targetCaloriesInput.value = appState.goals.calories;
    elements.targetProteinInput.value = appState.goals.protein;
    elements.targetCarbsInput.value = appState.goals.carbs;
    elements.targetFatInput.value = appState.goals.fat;
    elements.goalsModal.classList.remove('hidden');
  }

  function closeGoalsModal() {
    elements.goalsModal.classList.add('hidden');
  }

  // --- Data Export & Import ---
  function exportDataAsJson() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchor = document.createElement('a');
    const filename = `nutritrack_backup_${getTodayDateString()}.json`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function importDataFromJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const imported = JSON.parse(e.target.result);
        if (typeof imported !== 'object' || !imported.goals || !imported.days) {
          throw new Error('Invalid backup file schema.');
        }

        if (confirm('Importing this file will merge with your existing data. Proceed?')) {
          appState.goals = { ...appState.goals, ...imported.goals };
          appState.days = { ...appState.days, ...imported.days };
          saveState();
          syncDateAndRender();
          alert('Data imported successfully!');
        }
      } catch (err) {
        alert('Failed to parse backup file: ' + err.message);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  // --- Initial Launch ---
  function init() {
    initEventListeners();
    syncDateAndRender();
  }

  // Start the application when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

