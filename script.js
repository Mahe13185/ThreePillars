/**
 * Three Pillars Daily Tracker – DSA Spaced Repetition Engine
 * Technology: Pure Vanilla JavaScript & Browser LocalStorage
 * Safe Date Handling: Midday local calendar date math (No UTC off-by-one errors)
 */

// =============================================================================
// 1. CONFIGURATION & CONSTANTS
// =============================================================================

const STORAGE_KEYS = {
  PROBLEMS: 'tp_dsa_problems_v1',
  PILLARS: 'tp_pillars_data_v1',
  SETTINGS: 'tp_settings_v1',
  // Legacy keys to check and preserve during migration
  LEGACY_KEYS: [
    'three_pillars_tasks',
    'three_pillars_logs',
    'three_pillars_notes',
    'threePillarsData',
    'threePillars',
    'pillars_history',
    'dsa_problems'
  ]
};

// Spaced Repetition Intervals in Days
const SP_INTERVALS = {
  1: 1,  // R1: 1 day
  2: 3,  // R2: 3 days
  3: 7,  // R3: 7 days
  4: 14, // R4: 14 days
  5: 30  // R5: 30 days
};

const WEEKDAY_SCHEDULE = {
  0: { name: 'Sunday', pillars: 'Weekly revision + Rest/planning', tags: ['Rev', 'Rest'] },
  1: { name: 'Monday', pillars: 'DSA + Spring Boot', tags: ['DSA', 'Java'] },
  2: { name: 'Tuesday', pillars: 'DSA + SW360', tags: ['DSA', 'SW360'] },
  3: { name: 'Wednesday', pillars: 'DSA + Spring Boot', tags: ['DSA', 'Java'] },
  4: { name: 'Thursday', pillars: 'DSA + SW360', tags: ['DSA', 'SW360'] },
  5: { name: 'Friday', pillars: 'DSA + Spring Boot', tags: ['DSA', 'Java'] },
  6: { name: 'Saturday', pillars: 'DSA revision/test + SW360', tags: ['DSA Rev', 'SW360'] }
};

const TOPICS_LIST = [
  'Arrays',
  'Strings',
  'Binary Search',
  'Two Pointers',
  'Sliding Window',
  'Recursion',
  'Linked List',
  'Bit Manipulation',
  'Stack & Queue',
  'Trees',
  'Binary Search Trees',
  'Graphs',
  'Dynamic Programming',
  'Greedy',
  'Heaps / Priority Queue',
  'Backtracking',
  'Tries',
  'Maths',
  'Other'
];

// =============================================================================
// 2. TIMEZONE-SAFE LOCAL DATE UTILITIES
// =============================================================================

/**
 * Returns today's date in local YYYY-MM-DD format
 */
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD into a midday Date object (12:00:00)
 * Setting midday prevents any DST shift or timezone boundary bugs.
 */
function parseLocalDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return new Date();
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return new Date(y, m, d, 12, 0, 0);
}

/**
 * Formats a Date object to YYYY-MM-DD string
 */
function formatLocalDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds N calendar days to a YYYY-MM-DD string
 */
function addDaysToDate(dateStr, numDays) {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + numDays);
  return formatLocalDate(d);
}

/**
 * Computes calendar difference in days: targetDateStr - baseDateStr
 */
function getDaysDifference(targetDateStr, baseDateStr) {
  const target = parseLocalDate(targetDateStr);
  const base = parseLocalDate(baseDateStr);
  const diffMs = target.getTime() - base.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats YYYY-MM-DD for human display (e.g. "Nov 3, 2026")
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Formats date for header display (e.g. "Monday, Nov 3")
 */
function formatHeaderDate(dateStr) {
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// =============================================================================
// 3. APPLICATION STATE & STORAGE MANAGER
// =============================================================================

const AppState = {
  currentTab: 'dashboard',
  currentQueueFilter: 'due',
  selectedPillarDate: getTodayDateString(),
  searchQuery: '',
  filterTopic: 'ALL',
  filterDifficulty: 'ALL',
  sortBy: 'solved-desc',
  activeProblemForRevision: null,
  activeProblemForDetails: null,
  problemToDeleteId: null,
  selectedHeatmapDate: null,

  problems: [],
  pillarsData: {} // keyed by YYYY-MM-DD: { dsa: { done, task }, java: { done, task }, sw360: { done, task }, reflection: '' }
};

/**
 * Safe LocalStorage loader with legacy migration & data integrity validation
 */
function loadDataFromStorage() {
  try {
    // 1. Load Problems
    const storedProblems = localStorage.getItem(STORAGE_KEYS.PROBLEMS);
    if (storedProblems !== null) {
      try {
        const parsed = JSON.parse(storedProblems);
        AppState.problems = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Error parsing stored problems:', e);
        AppState.problems = [];
      }
    } else {
      // Check legacy dsa_problems key if present
      const legacyProblems = localStorage.getItem('dsa_problems');
      if (legacyProblems) {
        try {
          const parsed = JSON.parse(legacyProblems);
          if (Array.isArray(parsed)) AppState.problems = parsed;
        } catch (e) {
          console.warn('Error reading legacy problems', e);
        }
      }
    }

    // Ensure every problem has a valid non-empty string ID, approaches array, and history array
    AppState.problems.forEach((prob, idx) => {
      if (!prob) return;
      if (!prob.id || typeof prob.id !== 'string') {
        prob.id = prob.id ? String(prob.id) : ('prob_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substring(2, 7));
      }
      if (!Array.isArray(prob.history)) {
        prob.history = [];
      }
      if (!Array.isArray(prob.approaches)) {
        prob.approaches = [];
      }
    });

    // 2. Load Pillars Data
    const storedPillars = localStorage.getItem(STORAGE_KEYS.PILLARS);
    if (storedPillars !== null) {
      try {
        AppState.pillarsData = JSON.parse(storedPillars) || {};
      } catch (e) {
        AppState.pillarsData = {};
      }
    } else {
      // Check legacy three pillars data
      AppState.pillarsData = {};
      STORAGE_KEYS.LEGACY_KEYS.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const parsed = JSON.parse(item);
            if (typeof parsed === 'object' && parsed !== null) {
              // Merge non-destructively
              Object.assign(AppState.pillarsData, parsed);
            }
          } catch (e) {}
        }
      });
    }

    // Ensure initial structure for today's pillars if not set
    ensurePillarsDayRecord(getTodayDateString());

  } catch (err) {
    console.error('Error loading data from LocalStorage:', err);
    AppState.problems = [];
    AppState.pillarsData = {};
  }
}

/**
 * Safe LocalStorage saver
 */
function saveProblemsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.PROBLEMS, JSON.stringify(AppState.problems));
  } catch (err) {
    console.error('Error saving problems to LocalStorage:', err);
    alert('Warning: Unable to save data to LocalStorage. Please check browser storage permissions.');
  }
}

function savePillarsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.PILLARS, JSON.stringify(AppState.pillarsData));
  } catch (err) {
    console.error('Error saving pillars to LocalStorage:', err);
  }
}

function ensurePillarsDayRecord(dateStr) {
  if (!AppState.pillarsData[dateStr]) {
    AppState.pillarsData[dateStr] = {
      dsa: { done: false, task: '' },
      java: { done: false, task: '' },
      sw360: { done: false, task: '' },
      reflection: ''
    };
  }
}

// =============================================================================
// 4. SPACED REPETITION ENGINE
// =============================================================================

/**
 * Calculates next revision schedule based on Recall Outcome
 * Intervals:
 * R1 = 1d
 * R2 = 3d
 * R3 = 7d
 * R4 = 14d
 * R5 = 30d
 * After R5: Well Retained
 */
function calculateNextRevisionSchedule(currentStage, outcome, revisionDateStr) {
  let nextStage = currentStage || 1;
  let nextDate = '';
  let newStatus = 'Revising';

  if (outcome === 'Again') {
    // Could not remember: Review tomorrow
    nextDate = addDaysToDate(revisionDateStr, 1);
    // Keep current stage or reset to R1
    nextStage = Math.max(1, currentStage);
    newStatus = 'Revising';
  } else if (outcome === 'Hard') {
    // Remembered idea but needed hints: Review in 2 days
    nextDate = addDaysToDate(revisionDateStr, 2);
    nextStage = currentStage;
    newStatus = 'Revising';
  } else if (outcome === 'Good' || outcome === 'Easy') {
    // Solved independently: Advance to next interval
    if (currentStage >= 5) {
      // Completed R5 successfully -> Well Retained
      newStatus = 'Well Retained';
      nextStage = 6;
      nextDate = null; // No mandatory revision scheduled
    } else {
      nextStage = currentStage + 1;
      const intervalDays = SP_INTERVALS[nextStage] || 30;
      nextDate = addDaysToDate(revisionDateStr, intervalDays);
      newStatus = 'Revising';
    }
  }

  return { nextStage, nextDate, newStatus };
}

/**
 * Submits a revision result for a problem
 */
function recordRevisionAttempt(problemId, outcome, notes = '') {
  const problem = AppState.problems.find(p => p.id === problemId);
  if (!problem) return false;

  const todayStr = getTodayDateString();
  const currentStage = problem.stage || 1;

  const schedule = calculateNextRevisionSchedule(currentStage, outcome, todayStr);

  if (!Array.isArray(problem.history)) {
    problem.history = [];
  }

  // Record history entry
  problem.history.push({
    revisionDate: todayStr,
    revisionNumber: currentStage,
    result: outcome,
    notes: (notes || '').trim(),
    timestamp: new Date().toISOString()
  });

  // Update problem schedule & status
  problem.stage = schedule.nextStage;
  problem.nextRevisionDate = schedule.nextDate;
  problem.status = schedule.newStatus;
  problem.updatedAt = new Date().toISOString();

  saveProblemsToStorage();
  refreshUI();
  return true;
}

// =============================================================================
// 5. QUEUE CATEGORIZATION & QUERIES
// =============================================================================

function getQueueCategorizedProblems() {
  const todayStr = getTodayDateString();
  const due = [];
  const overdue = [];
  const upcoming = [];

  AppState.problems.forEach(problem => {
    // "Well Retained" problems are not in the active mandatory queue unless user explicitly reschedules
    if (problem.status === 'Well Retained' || !problem.nextRevisionDate) {
      return;
    }

    const diff = getDaysDifference(problem.nextRevisionDate, todayStr);

    if (diff === 0) {
      due.push(problem);
    } else if (diff < 0) {
      overdue.push(problem);
    } else if (diff > 0 && diff <= 7) {
      upcoming.push(problem);
    }
  });

  // Sort safely: overdue by most overdue first, due by title or difficulty, upcoming by soonest
  overdue.sort((a, b) => String(a.nextRevisionDate || '').localeCompare(String(b.nextRevisionDate || '')));
  due.sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));
  upcoming.sort((a, b) => String(a.nextRevisionDate || '').localeCompare(String(b.nextRevisionDate || '')));

  return { due, overdue, upcoming, todayStr };
}

// =============================================================================
// 6. UI RENDERING & COMPONENT UPDATES
// =============================================================================

function refreshUI() {
  renderHeader();
  renderDashboard();
  renderDSATracker();
  renderRevisionQueue();
  renderThreePillars();
}

/**
 * Render Header and badge counts
 */
function renderHeader() {
  const todayStr = getTodayDateString();
  const headerDateEl = document.getElementById('current-date-display');
  if (headerDateEl) {
    headerDateEl.textContent = formatHeaderDate(todayStr);
  }

  const { due, overdue } = getQueueCategorizedProblems();
  const totalQueueAlert = due.length + overdue.length;
  const queueBadge = document.getElementById('nav-queue-badge');
  if (queueBadge) {
    if (totalQueueAlert > 0) {
      queueBadge.textContent = totalQueueAlert;
      queueBadge.style.display = 'inline-block';
    } else {
      queueBadge.style.display = 'none';
    }
  }

  // Pillars daily status indicator
  ensurePillarsDayRecord(todayStr);
  const todayPillars = AppState.pillarsData[todayStr];
  const allPillarsDone = todayPillars.dsa.done && todayPillars.java.done && todayPillars.sw360.done;
  const navIndicator = document.getElementById('nav-pillars-indicator');
  if (navIndicator) {
    if (allPillarsDone) {
      navIndicator.classList.add('complete');
    } else {
      navIndicator.classList.remove('complete');
    }
  }
}

/**
 * Render Section 1: Dashboard
 */
function renderDashboard() {
  const todayStr = getTodayDateString();
  ensurePillarsDayRecord(todayStr);
  const todayPillars = AppState.pillarsData[todayStr];

  // 1. Pillars Quick Checkboxes
  const chkDsa = document.getElementById('dash-check-dsa');
  const chkJava = document.getElementById('dash-check-java');
  const chkSw360 = document.getElementById('dash-check-sw360');

  const cardDsa = document.getElementById('dash-pillar-dsa');
  const cardJava = document.getElementById('dash-pillar-java');
  const cardSw360 = document.getElementById('dash-pillar-sw360');

  const statusDsa = document.getElementById('dash-status-dsa');
  const statusJava = document.getElementById('dash-status-java');
  const statusSw360 = document.getElementById('dash-status-sw360');

  if (chkDsa && cardDsa && statusDsa) {
    chkDsa.checked = !!todayPillars.dsa.done;
    cardDsa.classList.toggle('completed', !!todayPillars.dsa.done);
    statusDsa.textContent = todayPillars.dsa.done ? 'Done' : 'Pending';
  }
  if (chkJava && cardJava && statusJava) {
    chkJava.checked = !!todayPillars.java.done;
    cardJava.classList.toggle('completed', !!todayPillars.java.done);
    statusJava.textContent = todayPillars.java.done ? 'Done' : 'Pending';
  }
  if (chkSw360 && cardSw360 && statusSw360) {
    chkSw360.checked = !!todayPillars.sw360.done;
    cardSw360.classList.toggle('completed', !!todayPillars.sw360.done);
    statusSw360.textContent = todayPillars.sw360.done ? 'Done' : 'Pending';
  }

  // 2. Metrics
  const { due, overdue } = getQueueCategorizedProblems();
  const totalSolved = AppState.problems.length;
  const wellRetained = AppState.problems.filter(p => p.status === 'Well Retained').length;

  document.getElementById('stat-total-solved').textContent = totalSolved;
  document.getElementById('stat-due-today').textContent = due.length;
  document.getElementById('stat-overdue').textContent = overdue.length;
  document.getElementById('stat-well-retained').textContent = wellRetained;

  // 3. Today's Revision Focus
  const focusContainer = document.getElementById('dash-focus-list');
  if (focusContainer) {
    focusContainer.innerHTML = '';
    const focusItems = [...overdue, ...due];

    if (focusItems.length === 0) {
      focusContainer.innerHTML = `
        <div style="padding: 20px 12px; text-align: center; color: var(--text-muted);">
          <p style="font-weight: 500;">No revisions due today</p>
          <p style="font-size: 0.78rem; color: var(--text-light); margin-top: 2px;">All scheduled recalls are up to date.</p>
        </div>
      `;
    } else {
      // Display up to 5 priority items
      focusItems.slice(0, 5).forEach(prob => {
        const isOverdue = overdue.includes(prob);
        const row = document.createElement('div');
        row.className = 'focus-problem-row';
        row.innerHTML = `
          <div class="focus-problem-left">
            <div>
              <span class="focus-problem-name">${escapeHtml(prob.title)}</span>
              <div class="focus-problem-meta">
                <span class="badge ${getDifficultyBadgeClass(prob.difficulty)}">${prob.difficulty}</span>
                <span>${escapeHtml(prob.topic)}</span>
                <span>•</span>
                <span class="badge ${isOverdue ? 'status-overdue' : 'status-due'}">
                  ${isOverdue ? 'Overdue' : 'Due Today'}
                </span>
                <span>Stage: R${prob.stage || 1}</span>
              </div>
            </div>
          </div>
          <div>
            <button class="btn btn-primary btn-sm btn-dash-revise" data-id="${prob.id}">
              Revise Now →
            </button>
          </div>
        `;
        focusContainer.appendChild(row);
      });

      if (focusItems.length > 5) {
        const moreDiv = document.createElement('div');
        moreDiv.style.textAlign = 'center';
        moreDiv.style.paddingTop = '8px';
        moreDiv.innerHTML = `
          <button class="btn btn-ghost btn-sm" id="btn-dash-more-revisions">
            + ${focusItems.length - 5} more in Revision Queue
          </button>
        `;
        focusContainer.appendChild(moreDiv);
        moreDiv.querySelector('#btn-dash-more-revisions')?.addEventListener('click', () => {
          switchTab('queue');
        });
      }
    }
  }

  // 4. GitHub-Style DSA Contribution Heatmap
  renderDSAContributionHeatmap();
}

/**
 * GitHub-Style DSA Contribution Calendar Heatmap
 * - 12-month calendar (53 weeks, 371 days)
 * - Layout: Columns = weeks, Rows = weekdays (Sun=0 to Sat=6)
 * - Intensity levels: 0 (Grey), 1 (Light Green), 2 (Medium Green), 3 (Dark Green), 4 (Deep Green)
 * - Month labels and Weekday labels
 * - Hover tooltips
 * - Day click inspection displaying problems solved on that date
 * - Total solved in the 12-month calendar period
 */
function renderDSAContributionHeatmap() {
  const gridEl = document.getElementById('heatmap-grid');
  const monthsStripEl = document.getElementById('heatmap-months-strip');
  const totalSolvedEl = document.getElementById('heatmap-total-solved-period');
  if (!gridEl || !monthsStripEl) return;

  gridEl.innerHTML = '';
  monthsStripEl.innerHTML = '';

  const todayStr = getTodayDateString();
  const todayDate = parseLocalDate(todayStr);
  const dayOfWeek = todayDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  // Calendar boundaries: 53 weeks ending with current week's Saturday
  const currentSundayStr = addDaysToDate(todayStr, -dayOfWeek);
  const startSundayStr = addDaysToDate(currentSundayStr, -52 * 7);

  // 1. Build lookup map of problems by solvedDate
  const problemsByDate = {};
  let periodSolvedCount = 0;

  AppState.problems.forEach(prob => {
    if (prob && prob.solvedDate && typeof prob.solvedDate === 'string') {
      if (!problemsByDate[prob.solvedDate]) {
        problemsByDate[prob.solvedDate] = [];
      }
      problemsByDate[prob.solvedDate].push(prob);

      // Count if in the 12-month period up to today
      if (prob.solvedDate >= startSundayStr && prob.solvedDate <= todayStr) {
        periodSolvedCount++;
      }
    }
  });

  // Update total solved badge
  if (totalSolvedEl) {
    const plural = periodSolvedCount === 1 ? 'problem' : 'problems';
    totalSolvedEl.textContent = `${periodSolvedCount} ${plural} solved in the last year`;
  }

  // 2. Month Labels across the 53 weeks
  // GitHub places month label on the week where day 1 of that month occurs
  const monthLabels = [];
  let lastCol = -99;

  for (let col = 0; col < 53; col++) {
    for (let row = 0; row < 7; row++) {
      const dStr = addDaysToDate(startSundayStr, col * 7 + row);
      const d = parseLocalDate(dStr);
      if (d.getDate() === 1) {
        // Month begins this week
        if (col - lastCol >= 2 && col <= 51) {
          monthLabels.push({
            col: col + 1,
            text: d.toLocaleDateString('en-US', { month: 'short' })
          });
          lastCol = col;
        }
        break;
      }
    }
  }

  // Ensure first column has a month label if early columns don't have one
  if (monthLabels.length === 0 || monthLabels[0].col > 3) {
    const d0 = parseLocalDate(startSundayStr);
    monthLabels.unshift({
      col: 1,
      text: d0.toLocaleDateString('en-US', { month: 'short' })
    });
  }

  monthLabels.forEach(m => {
    const span = document.createElement('span');
    span.className = 'heatmap-month-label';
    span.style.gridColumn = String(m.col);
    span.textContent = m.text;
    monthsStripEl.appendChild(span);
  });

  // 3. Grid Cells: 53 columns (weeks) x 7 rows (weekdays)
  for (let col = 0; col < 53; col++) {
    for (let row = 0; row < 7; row++) {
      const cellDateStr = addDaysToDate(startSundayStr, col * 7 + row);
      const isFuture = cellDateStr > todayStr;
      const isToday = cellDateStr === todayStr;
      const problemsOnDate = problemsByDate[cellDateStr] || [];
      const count = isFuture ? 0 : problemsOnDate.length;
      const level = isFuture ? 0 : getHeatmapLevel(count);

      const cell = document.createElement('div');
      cell.className = `heatmap-cell level-${level}${isToday ? ' today' : ''}${isFuture ? ' future' : ''}`;
      cell.style.gridColumn = String(col + 1);
      cell.style.gridRow = String(row + 1);
      cell.setAttribute('data-date', cellDateStr);

      if (cellDateStr === AppState.selectedHeatmapDate) {
        cell.classList.add('selected');
      }

      if (!isFuture) {
        const cellDateObj = parseLocalDate(cellDateStr);
        const formattedFullDate = cellDateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        const tooltipText = count === 0
          ? `No problems solved on ${formattedFullDate}`
          : `${count} problem${count === 1 ? '' : 's'} solved on ${formattedFullDate}`;

        cell.setAttribute('title', tooltipText);
        cell.setAttribute('data-tooltip', tooltipText);
        cell.setAttribute('aria-label', tooltipText);

        // Click handler
        cell.addEventListener('click', () => {
          handleHeatmapCellClick(cellDateStr, cell);
        });

        // Hover events for custom floating tooltip
        cell.addEventListener('mouseenter', (e) => {
          showHeatmapTooltip(e, tooltipText);
        });
        cell.addEventListener('mouseleave', () => {
          hideHeatmapTooltip();
        });
        cell.addEventListener('mousemove', (e) => {
          moveHeatmapTooltip(e);
        });
      }

      gridEl.appendChild(cell);
    }
  }

  // If a day was selected, re-render its details (e.g. after adding/deleting a problem)
  if (AppState.selectedHeatmapDate) {
    renderHeatmapDayDetails(AppState.selectedHeatmapDate);
  }
}

/**
 * Returns intensity level 0-4 based on problems solved:
 * 0: Grey (0)
 * 1: Light green (1)
 * 2: Medium green (2-3)
 * 3: Dark green (4-5)
 * 4: Deep green (6+)
 */
function getHeatmapLevel(count) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

/**
 * Handles clicking a heatmap cell
 */
function handleHeatmapCellClick(dateStr, cellElement) {
  document.querySelectorAll('.heatmap-cell.selected').forEach(c => c.classList.remove('selected'));
  if (cellElement) {
    cellElement.classList.add('selected');
  }
  AppState.selectedHeatmapDate = dateStr;
  renderHeatmapDayDetails(dateStr);
}

/**
 * Renders problem details for the selected heatmap date
 */
function renderHeatmapDayDetails(dateStr) {
  const detailsEl = document.getElementById('heatmap-day-details');
  if (!detailsEl) return;

  const dateObj = parseLocalDate(dateStr);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const problemsOnDate = AppState.problems.filter(p => p.solvedDate === dateStr);
  const count = problemsOnDate.length;

  detailsEl.style.display = 'block';

  let html = `
    <div class="heatmap-details-header">
      <div class="heatmap-details-header-left">
        <span class="heatmap-details-title">Solved on ${formattedDate}</span>
        <span class="badge ${count > 0 ? 'badge-primary' : 'badge-neutral'}">
          ${count === 0 ? '0 problems' : `${count} problem${count === 1 ? '' : 's'}`}
        </span>
      </div>
      <button class="btn btn-ghost btn-sm" id="btn-close-heatmap-details" title="Close details">✕</button>
    </div>
  `;

  if (count === 0) {
    html += `
      <div class="heatmap-empty-day">
        <p class="text-muted" style="margin: 0; font-size: 0.85rem;">
          No DSA problems were recorded as solved on this date.
        </p>
      </div>
    `;
  } else {
    html += `<div class="heatmap-problem-list">`;
    problemsOnDate.forEach(prob => {
      let approachesSummary = '';
      if (Array.isArray(prob.approaches) && prob.approaches.length > 0) {
        approachesSummary = prob.approaches.map(a => `
          <span class="approach-pill">
            <strong>${escapeHtml(a.type || 'Optimal')}</strong>: ${escapeHtml(a.timeComplexity || 'O(N)')} / ${escapeHtml(a.spaceComplexity || 'O(1)')}
          </span>
        `).join(' ');
      } else {
        approachesSummary = `<span class="text-muted">No approach details recorded</span>`;
      }

      html += `
        <div class="heatmap-problem-item">
          <div class="heatmap-prob-main">
            <div class="heatmap-prob-header">
              <span class="heatmap-prob-title">${escapeHtml(prob.title)}</span>
              <span class="badge ${getDifficultyBadgeClass(prob.difficulty)}">${prob.difficulty}</span>
              <span class="badge badge-neutral">${escapeHtml(prob.topic)}</span>
              <span class="badge badge-neutral">${escapeHtml(prob.platform || 'LeetCode')}</span>
              <span class="badge ${prob.status === 'Well Retained' ? 'badge-success' : 'badge-neutral'}">
                ${prob.status === 'Well Retained' ? 'Well Retained' : `Stage: R${prob.stage || 1}`}
              </span>
            </div>
            <div class="heatmap-prob-approaches">
              ${approachesSummary}
            </div>
          </div>
          <div class="heatmap-prob-actions">
            <button class="btn btn-secondary btn-sm btn-open-problem-details" data-id="${prob.id}">
              View Details
            </button>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  detailsEl.innerHTML = html;

  // Close button handler
  document.getElementById('btn-close-heatmap-details')?.addEventListener('click', () => {
    detailsEl.style.display = 'none';
    AppState.selectedHeatmapDate = null;
    document.querySelectorAll('.heatmap-cell.selected').forEach(c => c.classList.remove('selected'));
  });

  // "View Details" button handler
  detailsEl.querySelectorAll('.btn-open-problem-details').forEach(btn => {
    btn.addEventListener('click', () => {
      const probId = btn.getAttribute('data-id');
      if (probId) {
        openDetailsModal(probId);
      }
    });
  });
}

/**
 * Floating tooltip management
 */
function showHeatmapTooltip(e, text) {
  let tip = document.getElementById('heatmap-floating-tooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'heatmap-floating-tooltip';
    tip.className = 'heatmap-tooltip';
    document.body.appendChild(tip);
  }
  tip.textContent = text;
  tip.style.display = 'block';
  moveHeatmapTooltip(e);
}

function moveHeatmapTooltip(e) {
  const tip = document.getElementById('heatmap-floating-tooltip');
  if (!tip || tip.style.display === 'none') return;
  const tipWidth = tip.offsetWidth || 180;
  const tipHeight = tip.offsetHeight || 30;
  let left = e.clientX - tipWidth / 2;
  let top = e.clientY - tipHeight - 10;
  if (left < 10) left = 10;
  if (left + tipWidth > window.innerWidth - 10) left = window.innerWidth - tipWidth - 10;
  if (top < 10) top = e.clientY + 18;
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function hideHeatmapTooltip() {
  const tip = document.getElementById('heatmap-floating-tooltip');
  if (tip) tip.style.display = 'none';
}

/**
 * Render Section 2: DSA Tracker Table
 */
function renderDSATracker() {
  const tbody = document.getElementById('dsa-table-body');
  const emptyState = document.getElementById('dsa-table-empty');
  const countEl = document.getElementById('dsa-table-count');
  const summaryEl = document.getElementById('dsa-filter-summary');

  if (!tbody) return;

  // Filter and Sort Problems
  let filtered = [...AppState.problems];

  // Search filter
  if (AppState.searchQuery) {
    const q = AppState.searchQuery.toLowerCase();
    filtered = filtered.filter(p => {
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchTopic = (p.topic || '').toLowerCase().includes(q);
      const matchNotes = (p.personalNotes || '').toLowerCase().includes(q);
      return matchTitle || matchTopic || matchNotes;
    });
  }

  // Topic filter
  if (AppState.filterTopic !== 'ALL') {
    filtered = filtered.filter(p => p.topic === AppState.filterTopic);
  }

  // Difficulty filter
  if (AppState.filterDifficulty !== 'ALL') {
    filtered = filtered.filter(p => p.difficulty === AppState.filterDifficulty);
  }

  // Sorting safely
  filtered.sort((a, b) => {
    if (!a || !b) return 0;
    if (AppState.sortBy === 'solved-desc') {
      return String(b.solvedDate || '').localeCompare(String(a.solvedDate || ''));
    } else if (AppState.sortBy === 'solved-asc') {
      return String(a.solvedDate || '').localeCompare(String(b.solvedDate || ''));
    } else if (AppState.sortBy === 'next-rev-asc') {
      if (!a.nextRevisionDate) return 1;
      if (!b.nextRevisionDate) return -1;
      return String(a.nextRevisionDate || '').localeCompare(String(b.nextRevisionDate || ''));
    } else if (AppState.sortBy === 'title-asc') {
      return String(a.title || '').localeCompare(String(b.title || ''));
    } else if (AppState.sortBy === 'difficulty-desc') {
      const rank = { Hard: 3, Medium: 2, Easy: 1 };
      return (rank[b.difficulty] || 0) - (rank[a.difficulty] || 0);
    }
    return 0;
  });

  // Update counts
  if (countEl) countEl.textContent = `Showing ${filtered.length} of ${AppState.problems.length} problems`;

  const activeFilters = [];
  if (AppState.searchQuery) activeFilters.push(`Search: "${AppState.searchQuery}"`);
  if (AppState.filterTopic !== 'ALL') activeFilters.push(`Topic: ${AppState.filterTopic}`);
  if (AppState.filterDifficulty !== 'ALL') activeFilters.push(`Difficulty: ${AppState.filterDifficulty}`);
  if (summaryEl) {
    summaryEl.textContent = activeFilters.length ? activeFilters.join(' • ') : 'No filters applied';
  }

  tbody.innerHTML = '';

  if (filtered.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  } else {
    if (emptyState) emptyState.style.display = 'none';
  }

  const todayStr = getTodayDateString();

  filtered.forEach(prob => {
    const tr = document.createElement('tr');

    // Approaches badge pills
    let approachesHtml = '';
    if (Array.isArray(prob.approaches) && prob.approaches.length > 0) {
      approachesHtml = prob.approaches.map(app => {
        const cls = app.type === 'Optimal' ? 'approach-optimal' :
                    (app.type === 'Better' ? 'approach-better' : 'approach-brute');
        const cText = app.timeComplexity ? ` (${escapeHtml(app.timeComplexity)})` : '';
        return `<span class="approach-pill ${cls}" title="${escapeHtml(app.notes || app.type)}">${escapeHtml(app.type)}${cText}</span>`;
      }).join('');
    } else {
      approachesHtml = '<span class="text-muted" style="font-size:0.75rem;">Standard</span>';
    }

    // Next revision calculation & status pill
    let nextRevHtml = '';
    if (prob.status === 'Well Retained') {
      nextRevHtml = '<span class="badge diff-easy">Mastered</span>';
    } else if (prob.nextRevisionDate) {
      const diff = getDaysDifference(prob.nextRevisionDate, todayStr);
      let diffTag = '';
      if (diff < 0) {
        diffTag = `<span class="badge diff-hard">${Math.abs(diff)}d overdue</span>`;
      } else if (diff === 0) {
        diffTag = `<span class="badge diff-medium">Due Today</span>`;
      } else {
        diffTag = `<span class="badge badge-neutral">In ${diff}d</span>`;
      }
      nextRevHtml = `<div>${formatDisplayDate(prob.nextRevisionDate)}</div>${diffTag}`;
    } else {
      nextRevHtml = '<span class="text-muted">-</span>';
    }

    // Status Badge
    const statusClass = prob.status === 'Well Retained' ? 'status-retained' : 'status-revising';
    const statusText = prob.status === 'Well Retained' ? 'Well Retained' : `Revising (R${prob.stage || 1})`;

    tr.innerHTML = `
      <td>
        <div>
          ${prob.url ? 
            `<a href="${escapeHtml(prob.url)}" target="_blank" rel="noopener noreferrer" class="table-problem-title">${escapeHtml(prob.title)} ↗</a>` :
            `<span class="table-problem-title">${escapeHtml(prob.title)}</span>`
          }
          <div class="table-sub-detail">
            ${escapeHtml(prob.platform || 'LeetCode')}
            ${prob.history && prob.history.length ? `• ${prob.history.length} revs` : ''}
          </div>
        </div>
      </td>
      <td><span class="badge badge-neutral">${escapeHtml(prob.topic)}</span></td>
      <td><span class="badge ${getDifficultyBadgeClass(prob.difficulty)}">${prob.difficulty}</span></td>
      <td>${approachesHtml}</td>
      <td><span style="font-family: var(--font-mono); font-size: 0.8rem;">${formatDisplayDate(prob.solvedDate)}</span></td>
      <td>${nextRevHtml}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>
        <div class="table-actions">
          <button class="action-btn btn-action-revise btn-table-revise" data-id="${prob.id}" title="Revise this problem">Revise</button>
          <button class="action-btn btn-table-view" data-id="${prob.id}" title="View details and history">View</button>
          <button class="action-btn btn-table-edit" data-id="${prob.id}" title="Edit problem">Edit</button>
          <button class="action-btn btn-action-delete btn-table-delete" data-id="${prob.id}" title="Delete problem">Delete</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

/**
 * Render Section 3: Revision Queue
 */
function renderRevisionQueue() {
  const { due, overdue, upcoming, todayStr } = getQueueCategorizedProblems();

  // Banner counts
  document.getElementById('queue-banner-due-count').textContent = due.length;
  document.getElementById('queue-banner-overdue-count').textContent = overdue.length;
  document.getElementById('queue-banner-upcoming-count').textContent = upcoming.length;

  // Sub-tab counts
  document.getElementById('badge-due-count').textContent = due.length;
  document.getElementById('badge-overdue-count').textContent = overdue.length;
  document.getElementById('badge-upcoming-count').textContent = upcoming.length;

  const container = document.getElementById('queue-cards-container');
  const emptyState = document.getElementById('queue-empty-state');
  if (!container) return;

  container.innerHTML = '';

  let activeList = [];
  if (AppState.currentQueueFilter === 'due') {
    activeList = due;
  } else if (AppState.currentQueueFilter === 'overdue') {
    activeList = overdue;
  } else if (AppState.currentQueueFilter === 'upcoming') {
    activeList = upcoming;
  }

  if (activeList.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  } else {
    if (emptyState) emptyState.style.display = 'none';
  }

  activeList.forEach(prob => {
    const card = document.createElement('div');
    card.className = 'queue-card';

    const diff = getDaysDifference(prob.nextRevisionDate, todayStr);
    let dueTagHtml = '';
    if (diff < 0) {
      dueTagHtml = `<span class="schedule-due-tag tag-overdue">${Math.abs(diff)}d overdue</span>`;
    } else if (diff === 0) {
      dueTagHtml = `<span class="schedule-due-tag tag-due">Due Today</span>`;
    } else {
      dueTagHtml = `<span class="schedule-due-tag tag-upcoming">In ${diff}d (${formatDisplayDate(prob.nextRevisionDate)})</span>`;
    }

    card.innerHTML = `
      <div class="queue-card-top">
        <div>
          <div class="queue-card-title">${escapeHtml(prob.title)}</div>
          <div class="queue-card-badges">
            <span class="badge badge-neutral">${escapeHtml(prob.topic)}</span>
            <span class="badge ${getDifficultyBadgeClass(prob.difficulty)}">${prob.difficulty}</span>
            <span class="badge badge-neutral">${escapeHtml(prob.platform || 'LeetCode')}</span>
          </div>
        </div>
      </div>

      <div class="queue-card-meta">
        <div><strong>Solved Date:</strong> ${formatDisplayDate(prob.solvedDate)}</div>
        <div><strong>Scheduled Stage:</strong> Revision ${prob.stage || 1} (${SP_INTERVALS[prob.stage || 1] || 1} day interval)</div>
        <div><strong>Scheduled Date:</strong> ${formatDisplayDate(prob.nextRevisionDate)}</div>
      </div>

      <div class="queue-card-footer">
        ${dueTagHtml}
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-secondary btn-sm btn-queue-details" data-id="${prob.id}">Details</button>
          <button class="btn btn-primary btn-sm btn-queue-revise" data-id="${prob.id}">Revise Now →</button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * Render Section 4: Three Pillars Daily Checklist & Weekly Schedule
 */
function renderThreePillars() {
  const selectedDate = AppState.selectedPillarDate;
  ensurePillarsDayRecord(selectedDate);
  const dayRecord = AppState.pillarsData[selectedDate];

  // Header Date Text
  const dateObj = parseLocalDate(selectedDate);
  const weekdayNum = dateObj.getDay();
  const weekdayName = WEEKDAY_SCHEDULE[weekdayNum].name;
  const dateTextEl = document.getElementById('pillar-selected-date-text');
  if (dateTextEl) {
    dateTextEl.textContent = `${weekdayName}, ${formatDisplayDate(selectedDate)}`;
  }

  // Schedule focus pill
  const focusPill = document.getElementById('pillar-today-focus-tag');
  if (focusPill) {
    focusPill.textContent = `Schedule: ${WEEKDAY_SCHEDULE[weekdayNum].pillars}`;
  }

  // Highlight current weekday in weekly schedule list
  const scheduleRows = document.querySelectorAll('.schedule-day-row');
  scheduleRows.forEach(row => {
    const day = parseInt(row.getAttribute('data-day'), 10);
    if (day === weekdayNum) {
      row.classList.add('current-weekday');
    } else {
      row.classList.remove('current-weekday');
    }
  });

  // Checkboxes and Task descriptions
  const chkDsa = document.getElementById('chk-pillar-dsa');
  const taskDsa = document.getElementById('input-pillar-dsa-task');
  const boxDsa = document.getElementById('pitem-dsa');

  const chkJava = document.getElementById('chk-pillar-java');
  const taskJava = document.getElementById('input-pillar-java-task');
  const boxJava = document.getElementById('pitem-java');

  const chkSw360 = document.getElementById('chk-pillar-sw360');
  const taskSw360 = document.getElementById('input-pillar-sw360-task');
  const boxSw360 = document.getElementById('pitem-sw360');

  const reflectionEl = document.getElementById('pillar-daily-reflection');
  const countBadge = document.getElementById('pillars-day-completion-badge');

  if (chkDsa && taskDsa && boxDsa) {
    chkDsa.checked = !!dayRecord.dsa.done;
    taskDsa.value = dayRecord.dsa.task || '';
    boxDsa.classList.toggle('completed', !!dayRecord.dsa.done);
  }

  if (chkJava && taskJava && boxJava) {
    chkJava.checked = !!dayRecord.java.done;
    taskJava.value = dayRecord.java.task || '';
    boxJava.classList.toggle('completed', !!dayRecord.java.done);
  }

  if (chkSw360 && taskSw360 && boxSw360) {
    chkSw360.checked = !!dayRecord.sw360.done;
    taskSw360.value = dayRecord.sw360.task || '';
    boxSw360.classList.toggle('completed', !!dayRecord.sw360.done);
  }

  if (reflectionEl) {
    reflectionEl.value = dayRecord.reflection || '';
  }

  const completedCount = (dayRecord.dsa.done ? 1 : 0) + (dayRecord.java.done ? 1 : 0) + (dayRecord.sw360.done ? 1 : 0);
  if (countBadge) {
    countBadge.textContent = `${completedCount} / 3 Done`;
    if (completedCount === 3) {
      countBadge.className = 'badge diff-easy';
    } else {
      countBadge.className = 'badge badge-neutral';
    }
  }
}

// =============================================================================
// 7. MODALS LOGIC
// =============================================================================

/**
 * Open Problem Form Modal (Add or Edit)
 */
function openProblemModal(problemId = null) {
  const modal = document.getElementById('modal-problem');
  const titleEl = document.getElementById('modal-problem-title');
  const form = document.getElementById('form-problem');
  const approachesContainer = document.getElementById('approaches-container');

  if (!modal || !form || !approachesContainer) return;

  approachesContainer.innerHTML = '';

  if (problemId) {
    // Edit mode
    const prob = AppState.problems.find(p => p.id === problemId);
    if (!prob) return;

    titleEl.textContent = 'Edit DSA Problem';
    document.getElementById('input-prob-id').value = prob.id;
    document.getElementById('input-prob-name').value = prob.title;
    document.getElementById('input-prob-topic').value = prob.topic;
    document.getElementById('input-prob-difficulty').value = prob.difficulty;
    document.getElementById('input-prob-platform').value = prob.platform || 'LeetCode';
    document.getElementById('input-prob-date').value = prob.solvedDate || getTodayDateString();
    document.getElementById('input-prob-url').value = prob.url || '';
    document.getElementById('input-prob-notes').value = prob.personalNotes || '';

    if (Array.isArray(prob.approaches) && prob.approaches.length > 0) {
      prob.approaches.forEach(app => addApproachRow(app));
    } else {
      addApproachRow({ type: 'Optimal', timeComplexity: '', spaceComplexity: '', notes: '' });
    }
  } else {
    // Add mode
    titleEl.textContent = 'Add DSA Problem';
    form.reset();
    document.getElementById('input-prob-id').value = '';
    document.getElementById('input-prob-date').value = getTodayDateString();
    document.getElementById('input-prob-difficulty').value = 'Medium';
    document.getElementById('input-prob-platform').value = 'LeetCode';

    // Add 1 default approach row
    addApproachRow({ type: 'Optimal', timeComplexity: 'O(N)', spaceComplexity: 'O(1)', notes: '' });
  }

  modal.style.display = 'flex';
}

function closeProblemModal() {
  const modal = document.getElementById('modal-problem');
  if (modal) modal.style.display = 'none';
}

/**
 * Add an approach row in Problem modal
 */
function addApproachRow(data = {}) {
  const container = document.getElementById('approaches-container');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'approach-row-item';

  row.innerHTML = `
    <div class="approach-row-top">
      <span style="font-weight: 600; font-size: 0.82rem;">Approach Record</span>
      <button type="button" class="btn btn-ghost btn-sm btn-remove-approach" style="color: var(--danger); padding: 2px 6px;">Remove ✕</button>
    </div>
    <div class="approach-row-fields">
      <div>
        <label class="form-label">Type</label>
        <select class="form-select form-control-sm app-type-select">
          <option value="Optimal" ${data.type === 'Optimal' ? 'selected' : ''}>Optimal</option>
          <option value="Better" ${data.type === 'Better' ? 'selected' : ''}>Better</option>
          <option value="Brute Force" ${data.type === 'Brute Force' ? 'selected' : ''}>Brute Force</option>
        </select>
      </div>
      <div>
        <label class="form-label">Time Complexity</label>
        <input type="text" class="form-control form-control-sm app-time-input" placeholder="e.g. O(N log N)" value="${escapeHtml(data.timeComplexity || '')}">
      </div>
      <div>
        <label class="form-label">Space Complexity</label>
        <input type="text" class="form-control form-control-sm app-space-input" placeholder="e.g. O(1)" value="${escapeHtml(data.spaceComplexity || '')}">
      </div>
    </div>
    <div>
      <input type="text" class="form-control form-control-sm app-notes-input" placeholder="Quick logic / pattern (e.g. Two Pointers with left & right index)" value="${escapeHtml(data.notes || '')}">
    </div>
  `;

  row.querySelector('.btn-remove-approach').addEventListener('click', () => {
    row.remove();
  });

  container.appendChild(row);
}

/**
 * Handle Problem Form Submit (Add / Edit)
 */
function handleProblemFormSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('input-prob-id').value;
  const title = document.getElementById('input-prob-name').value.trim();
  const topic = document.getElementById('input-prob-topic').value;
  const difficulty = document.getElementById('input-prob-difficulty').value;
  const platform = document.getElementById('input-prob-platform').value;
  const solvedDate = document.getElementById('input-prob-date').value || getTodayDateString();
  const url = document.getElementById('input-prob-url').value.trim();
  const personalNotes = document.getElementById('input-prob-notes').value.trim();

  // Gather approaches
  const approachRows = document.querySelectorAll('.approach-row-item');
  const approaches = [];
  approachRows.forEach(row => {
    const type = row.querySelector('.app-type-select').value;
    const timeComplexity = row.querySelector('.app-time-input').value.trim();
    const spaceComplexity = row.querySelector('.app-space-input').value.trim();
    const notes = row.querySelector('.app-notes-input').value.trim();
    if (type) {
      approaches.push({ type, timeComplexity, spaceComplexity, notes });
    }
  });

  if (!title || !topic || !difficulty) {
    alert('Please complete all required fields.');
    return;
  }

  if (id) {
    // Edit existing
    const prob = AppState.problems.find(p => p.id === id);
    if (prob) {
      prob.title = title;
      prob.topic = topic;
      prob.difficulty = difficulty;
      prob.platform = platform;
      prob.solvedDate = solvedDate;
      prob.url = url;
      prob.personalNotes = personalNotes;
      prob.approaches = approaches;
      prob.updatedAt = new Date().toISOString();
    }
  } else {
    // New problem -> automatically schedule R1 = 1 day after solvedDate
    const newId = 'prob_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const nextRevisionDate = addDaysToDate(solvedDate, SP_INTERVALS[1]);

    const newProblem = {
      id: newId,
      title,
      topic,
      difficulty,
      platform,
      solvedDate,
      url,
      personalNotes,
      approaches,
      stage: 1, // Ready for R1
      nextRevisionDate,
      status: 'Revising',
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    AppState.problems.unshift(newProblem);
  }

  saveProblemsToStorage();
  closeProblemModal();
  refreshUI();
}

/**
 * Open Revise Now Modal (Active Recall Flashcard Mode)
 */
function openReviseModal(problemId) {
  const prob = AppState.problems.find(p => p.id === problemId);
  if (!prob) return;

  AppState.activeProblemForRevision = prob;

  const modal = document.getElementById('modal-revise');
  document.getElementById('revise-problem-id').value = prob.id;
  document.getElementById('modal-revise-title').textContent = prob.title;
  document.getElementById('revise-topic-badge').textContent = prob.topic;
  
  const diffBadge = document.getElementById('revise-diff-badge');
  diffBadge.textContent = prob.difficulty;
  diffBadge.className = `badge ${getDifficultyBadgeClass(prob.difficulty)}`;

  document.getElementById('revise-stage-badge').textContent = `Revision ${prob.stage || 1}`;
  document.getElementById('revise-platform-badge').textContent = prob.platform || 'LeetCode';

  const linkEl = document.getElementById('revise-link');
  if (prob.url) {
    linkEl.href = prob.url;
    linkEl.style.display = 'inline-block';
  } else {
    linkEl.style.display = 'none';
  }

  // Personal notes as clues
  const notesBox = document.getElementById('revise-personal-notes-box');
  const notesText = document.getElementById('revise-personal-notes-text');
  if (prob.personalNotes && prob.personalNotes.trim()) {
    notesText.textContent = prob.personalNotes;
    notesBox.style.display = 'block';
  } else {
    notesBox.style.display = 'none';
  }

  // Reset hide/show solution state
  document.getElementById('revise-reveal-area').style.display = 'block';
  document.getElementById('revise-solution-section').style.display = 'none';
  document.getElementById('revise-log-note').value = '';

  // Populate Next Interval hints for the 4 outcome buttons
  const todayStr = getTodayDateString();
  const currentStage = prob.stage || 1;
  const goodSchedule = calculateNextRevisionSchedule(currentStage, 'Good', todayStr);

  document.getElementById('outcome-next-again').textContent = 'Next: Tomorrow (+1d)';
  document.getElementById('outcome-next-hard').textContent = 'Next: in 2 days (+2d)';
  
  if (goodSchedule.newStatus === 'Well Retained') {
    document.getElementById('outcome-next-good').textContent = 'Well Retained';
    document.getElementById('outcome-next-easy').textContent = 'Well Retained';
  } else {
    const days = SP_INTERVALS[goodSchedule.nextStage] || 30;
    document.getElementById('outcome-next-good').textContent = `In ${days}d (R${goodSchedule.nextStage})`;
    document.getElementById('outcome-next-easy').textContent = `In ${days}d (R${goodSchedule.nextStage})`;
  }

  // Populate Approaches
  const approachesList = document.getElementById('revise-approaches-list');
  approachesList.innerHTML = '';
  if (Array.isArray(prob.approaches) && prob.approaches.length > 0) {
    prob.approaches.forEach(app => {
      const card = document.createElement('div');
      card.className = 'revealed-approach-card';
      const cTime = app.timeComplexity ? `Time: ${escapeHtml(app.timeComplexity)}` : '';
      const cSpace = app.spaceComplexity ? `Space: ${escapeHtml(app.spaceComplexity)}` : '';
      const compLabel = [cTime, cSpace].filter(Boolean).join(' • ');

      card.innerHTML = `
        <div class="revealed-app-header">
          <span class="approach-pill ${app.type === 'Optimal' ? 'approach-optimal' : (app.type === 'Better' ? 'approach-better' : 'approach-brute')}">
            ${escapeHtml(app.type)}
          </span>
          ${compLabel ? `<span class="complexity-tag">${compLabel}</span>` : ''}
        </div>
        ${app.notes ? `<p style="font-size: 0.85rem; color: var(--text-main); margin-top: 4px;">${escapeHtml(app.notes)}</p>` : ''}
      `;
      approachesList.appendChild(card);
    });
  } else {
    approachesList.innerHTML = '<p class="text-muted" style="font-size: 0.85rem;">No specific approach details saved for this problem.</p>';
  }

  modal.style.display = 'flex';
}

function closeReviseModal() {
  const modal = document.getElementById('modal-revise');
  if (modal) modal.style.display = 'none';
  AppState.activeProblemForRevision = null;
}

/**
 * Open Problem Details & History Modal
 */
function openDetailsModal(problemId) {
  const prob = AppState.problems.find(p => p.id === problemId);
  if (!prob) return;

  AppState.activeProblemForDetails = prob;

  const modal = document.getElementById('modal-details');
  document.getElementById('details-topic-pretitle').textContent = `${prob.topic} • ${prob.platform || 'LeetCode'}`;
  document.getElementById('details-problem-title').textContent = prob.title;
  document.getElementById('details-topic').textContent = prob.topic;
  document.getElementById('details-difficulty').textContent = prob.difficulty;
  document.getElementById('details-platform').textContent = prob.platform || 'LeetCode';
  document.getElementById('details-solved-date').textContent = formatDisplayDate(prob.solvedDate);
  document.getElementById('details-status').textContent = prob.status === 'Well Retained' ? 'Well Retained' : `Revising (R${prob.stage || 1})`;
  document.getElementById('details-next-rev').textContent = prob.nextRevisionDate ? formatDisplayDate(prob.nextRevisionDate) : 'Completed / Mastered';

  const linkWrap = document.getElementById('details-link-wrap');
  const urlLink = document.getElementById('details-url-link');
  if (prob.url) {
    urlLink.href = prob.url;
    linkWrap.style.display = 'block';
  } else {
    linkWrap.style.display = 'none';
  }

  // Approaches
  const approachesContainer = document.getElementById('details-approaches-container');
  approachesContainer.innerHTML = '';
  if (Array.isArray(prob.approaches) && prob.approaches.length > 0) {
    prob.approaches.forEach(app => {
      const div = document.createElement('div');
      div.className = 'revealed-approach-card';
      const cTime = app.timeComplexity ? `Time: ${escapeHtml(app.timeComplexity)}` : '';
      const cSpace = app.spaceComplexity ? `Space: ${escapeHtml(app.spaceComplexity)}` : '';
      const compLabel = [cTime, cSpace].filter(Boolean).join(' • ');

      div.innerHTML = `
        <div class="revealed-app-header">
          <span class="approach-pill ${app.type === 'Optimal' ? 'approach-optimal' : (app.type === 'Better' ? 'approach-better' : 'approach-brute')}">
            ${escapeHtml(app.type)}
          </span>
          ${compLabel ? `<span class="complexity-tag">${compLabel}</span>` : ''}
        </div>
        ${app.notes ? `<p style="font-size: 0.85rem; color: var(--text-main); margin-top: 4px;">${escapeHtml(app.notes)}</p>` : ''}
      `;
      approachesContainer.appendChild(div);
    });
  } else {
    approachesContainer.innerHTML = '<p class="text-muted" style="font-size:0.85rem;">No saved approaches.</p>';
  }

  // Personal notes
  const notesSection = document.getElementById('details-notes-section');
  const notesContent = document.getElementById('details-personal-notes');
  if (prob.personalNotes && prob.personalNotes.trim()) {
    notesContent.textContent = prob.personalNotes;
    notesSection.style.display = 'block';
  } else {
    notesSection.style.display = 'none';
  }

  // Revision History Table
  const historyTbody = document.getElementById('details-history-tbody');
  const historyCount = document.getElementById('details-history-count');
  historyTbody.innerHTML = '';

  const history = prob.history || [];
  historyCount.textContent = `${history.length} Revision${history.length !== 1 ? 's' : ''}`;

  if (history.length === 0) {
    historyTbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 16px;">
          No revisions recorded yet. Problem is currently scheduled for Revision ${prob.stage || 1}.
        </td>
      </tr>
    `;
  } else {
    // Show newest revisions first
    [...history].reverse().forEach(h => {
      const tr = document.createElement('tr');
      const resBadgeClass = h.result === 'Again' ? 'diff-hard' :
                            (h.result === 'Hard' ? 'diff-medium' :
                            (h.result === 'Good' ? 'status-revising' : 'diff-easy'));
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-size: 0.8rem;">${formatDisplayDate(h.revisionDate)}</td>
        <td><span class="badge badge-neutral">R${h.revisionNumber}</span></td>
        <td><span class="badge ${resBadgeClass}">${escapeHtml(h.result)}</span></td>
        <td style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(h.notes || '-')}</td>
      `;
      historyTbody.appendChild(tr);
    });
  }

  modal.style.display = 'flex';
}

function closeDetailsModal() {
  const modal = document.getElementById('modal-details');
  if (modal) modal.style.display = 'none';
  AppState.activeProblemForDetails = null;
}

/**
 * Open Delete Modal with safe ID validation
 */
function openDeleteModal(problemId) {
  if (problemId === null || problemId === undefined || problemId === '') {
    console.warn('Invalid problemId passed to openDeleteModal');
    return;
  }
  const idStr = String(problemId).trim();
  const prob = AppState.problems.find(p => p && String(p.id).trim() === idStr);
  if (!prob) {
    console.warn('Problem not found for ID:', problemId);
    return;
  }

  AppState.problemToDeleteId = idStr;
  const modal = document.getElementById('modal-delete');
  const nameEl = document.getElementById('delete-problem-name');

  if (modal && nameEl) {
    nameEl.textContent = `"${prob.title || 'Untitled'}"`;
    modal.style.display = 'flex';
  } else {
    // Fallback to native confirmation if modal DOM element is unavailable
    if (window.confirm(`Are you sure you want to delete "${prob.title || 'this problem'}"?`)) {
      confirmDeleteProblem();
    }
  }
}

function closeDeleteModal() {
  const modal = document.getElementById('modal-delete');
  if (modal) modal.style.display = 'none';
  AppState.problemToDeleteId = null;
}

function confirmDeleteProblem() {
  if (AppState.problemToDeleteId === null || AppState.problemToDeleteId === undefined) return;

  const targetId = String(AppState.problemToDeleteId).trim();

  // 1. Remove problem from AppState.problems safely
  AppState.problems = AppState.problems.filter(p => p && String(p.id).trim() !== targetId);

  // 2. Persist to LocalStorage immediately
  saveProblemsToStorage();

  // 3. Close delete modal
  closeDeleteModal();

  // 4. Clean up any open detail/revision modals if they reference the deleted problem
  if (AppState.activeProblemForDetails && String(AppState.activeProblemForDetails.id).trim() === targetId) {
    closeDetailsModal();
  }
  if (AppState.activeProblemForRevision && String(AppState.activeProblemForRevision.id).trim() === targetId) {
    closeReviseModal();
  }

  // 5. Update UI immediately (Dashboard, Table, Queue, Header)
  refreshUI();
}

/**
 * Direct delete function with optional confirmation
 */
function deleteProblem(problemId, confirmFirst = true) {
  if (problemId === null || problemId === undefined || problemId === '') return false;
  const idStr = String(problemId).trim();
  const prob = AppState.problems.find(p => p && String(p.id).trim() === idStr);
  if (!prob) {
    console.warn('Problem not found for deletion:', problemId);
    return false;
  }

  if (confirmFirst) {
    openDeleteModal(idStr);
    return true;
  } else {
    AppState.problemToDeleteId = idStr;
    confirmDeleteProblem();
    return true;
  }
}

window.deleteProblem = deleteProblem;

/**
 * Open Backup & Restore Modal
 */
function openBackupModal() {
  const modal = document.getElementById('modal-backup');
  const statusEl = document.getElementById('backup-status-message');
  if (statusEl) statusEl.style.display = 'none';
  if (modal) modal.style.display = 'flex';
}

function closeBackupModal() {
  const modal = document.getElementById('modal-backup');
  if (modal) modal.style.display = 'none';
}

/**
 * Export JSON Backup
 */
function exportBackupJSON() {
  const backupData = {
    version: 1,
    exportDate: new Date().toISOString(),
    system: 'Three Pillars Daily Tracker – DSA Spaced Repetition',
    problems: AppState.problems,
    pillars: AppState.pillarsData
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
  const downloadAnchor = document.createElement('a');
  const filename = `three-pillars-backup-${getTodayDateString()}.json`;
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  showBackupStatus(`Successfully downloaded backup: ${filename}`, 'success');
}

/**
 * Import JSON Backup
 */
function handleImportFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported || typeof imported !== 'object') {
        throw new Error('Invalid JSON structure');
      }

      let problemsCount = 0;
      let pillarsCount = 0;

      // Safe restore problems
      if (Array.isArray(imported.problems)) {
        AppState.problems = imported.problems;
        problemsCount = imported.problems.length;
        saveProblemsToStorage();
      }

      // Safe restore pillars data
      if (imported.pillars && typeof imported.pillars === 'object') {
        // Merge without breaking
        Object.assign(AppState.pillarsData, imported.pillars);
        pillarsCount = Object.keys(imported.pillars).length;
        savePillarsToStorage();
      }

      showBackupStatus(`Import complete! Restored ${problemsCount} problems and ${pillarsCount} daily logs.`, 'success');
      refreshUI();
    } catch (err) {
      console.error('Import parse error:', err);
      showBackupStatus('Error restoring backup file: Invalid JSON format.', 'error');
    }
  };

  reader.readAsText(file);
}

/**
 * Import CSV (Notion / Striver Sheet)
 */
function handleImportCSV(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let csvText = e.target.result;
      if (csvText.charCodeAt(0) === 0xFEFF) {
        csvText = csvText.slice(1);
      }
      const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        showBackupStatus('CSV file has no data rows.', 'error');
        return;
      }

      function parseLine(line) {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      }

      const headers = parseLine(lines[0]).map(h => h.trim().toLowerCase());
      const todayStr = getTodayDateString();
      let importedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        const title = row['problem'] || row['problem name'] || row['title'];
        if (!title) continue;

        // Skip if already exists
        if (AppState.problems.some(p => p.title.toLowerCase() === title.toLowerCase())) {
          continue;
        }

        const rawTopic = row['topic'] || 'Arrays';
        // Normalize difficulty
        let diff = (row['difficulty'] || 'Medium').trim();
        if (/easy/i.test(diff)) diff = 'Easy';
        else if (/hard/i.test(diff)) diff = 'Hard';
        else diff = 'Medium';

        const platform = row['platform'] || 'LeetCode';
        const url = row['leetcode link'] || row['github link'] || row['problem url'] || row['url'] || '';
        const solvedDate = row['date solved'] && /^\d{4}-\d{2}-\d{2}$/.test(row['date solved']) ? row['date solved'] : todayStr;
        const notes = row['notes'] || '';

        const approaches = [];
        if (row['optimal approach']) {
          approaches.push({
            type: 'Optimal',
            timeComplexity: row['time complexity'] || '',
            spaceComplexity: row['space complexity'] || '',
            notes: row['optimal approach']
          });
        }
        if (row['better approach']) {
          approaches.push({
            type: 'Better',
            timeComplexity: '',
            spaceComplexity: '',
            notes: row['better approach']
          });
        }
        if (row['brute approach']) {
          approaches.push({
            type: 'Brute Force',
            timeComplexity: '',
            spaceComplexity: '',
            notes: row['brute approach']
          });
        }
        if (approaches.length === 0) {
          approaches.push({
            type: 'Optimal',
            timeComplexity: row['time complexity'] || '',
            spaceComplexity: row['space complexity'] || '',
            notes: row['pattern'] || ''
          });
        }

        const newProblem = {
          id: 'prob_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          title,
          topic: rawTopic,
          difficulty: diff,
          platform,
          solvedDate,
          url,
          personalNotes: notes,
          approaches,
          stage: 1,
          nextRevisionDate: addDaysToDate(solvedDate, 1),
          status: 'Revising',
          history: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        AppState.problems.push(newProblem);
        importedCount++;
      }

      saveProblemsToStorage();
      showBackupStatus(`CSV Import complete! Added ${importedCount} problems.`, 'success');
      refreshUI();
    } catch (err) {
      console.error('CSV import error:', err);
      showBackupStatus('Failed to parse CSV file.', 'error');
    }
  };

  reader.readAsText(file);
}

function showBackupStatus(message, type) {
  const el = document.getElementById('backup-status-message');
  if (!el) return;
  el.textContent = message;
  el.className = `backup-status-message ${type}`;
  el.style.display = 'block';
}

/**
 * Optional starter sample data from Striver A2Z
 */
function seedSampleProblems() {
  const today = getTodayDateString();
  const yesterday = addDaysToDate(today, -1);
  const twoDaysAgo = addDaysToDate(today, -2);

  const samples = [
    {
      id: 'sample_1',
      title: 'Two Sum',
      topic: 'Arrays',
      difficulty: 'Easy',
      platform: 'LeetCode',
      url: 'https://leetcode.com/problems/two-sum/',
      solvedDate: twoDaysAgo,
      personalNotes: 'Use Hash Map (complement = target - nums[i]) to achieve O(N) one pass.',
      approaches: [
        { type: 'Optimal', timeComplexity: 'O(N)', spaceComplexity: 'O(N)', notes: 'Hash Map single pass storing value to index' },
        { type: 'Brute Force', timeComplexity: 'O(N^2)', spaceComplexity: 'O(1)', notes: 'Nested loops checking all pairs' }
      ],
      stage: 1,
      nextRevisionDate: today, // Due today!
      status: 'Revising',
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sample_2',
      title: '3Sum',
      topic: 'Arrays',
      difficulty: 'Medium',
      platform: 'LeetCode',
      url: 'https://leetcode.com/problems/3sum/',
      solvedDate: yesterday,
      personalNotes: 'Sort array first! Fix nums[i], then use two pointers left and right. Skip duplicate values to avoid duplicate triplets.',
      approaches: [
        { type: 'Optimal', timeComplexity: 'O(N^2)', spaceComplexity: 'O(1) extra', notes: 'Sort + Two Pointers with duplicate skipping' },
        { type: 'Better', timeComplexity: 'O(N^2 log M)', spaceComplexity: 'O(N)', notes: 'HashSet looking for -(nums[i] + nums[j])' }
      ],
      stage: 1,
      nextRevisionDate: addDaysToDate(yesterday, 1), // Due today
      status: 'Revising',
      history: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sample_3',
      title: 'Longest Substring Without Repeating Characters',
      topic: 'Sliding Window',
      difficulty: 'Medium',
      platform: 'LeetCode',
      url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
      solvedDate: addDaysToDate(today, -4),
      personalNotes: 'Keep map of character -> last seen index. Move left pointer to max(left, map.get(ch) + 1).',
      approaches: [
        { type: 'Optimal', timeComplexity: 'O(N)', spaceComplexity: 'O(min(N, M))', notes: 'Sliding Window with Hash Map jumping left pointer' }
      ],
      stage: 2,
      nextRevisionDate: addDaysToDate(today, -1), // Overdue by 1 day!
      status: 'Revising',
      history: [
        { revisionDate: addDaysToDate(today, -3), revisionNumber: 1, result: 'Good', notes: 'Remembered the index jump logic' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'sample_4',
      title: 'Binary Search',
      topic: 'Binary Search',
      difficulty: 'Easy',
      platform: 'LeetCode',
      url: 'https://leetcode.com/problems/binary-search/',
      solvedDate: addDaysToDate(today, -35),
      personalNotes: 'mid = low + (high - low) / 2 to avoid integer overflow.',
      approaches: [
        { type: 'Optimal', timeComplexity: 'O(log N)', spaceComplexity: 'O(1)', notes: 'Standard iterative binary search' }
      ],
      stage: 6,
      nextRevisionDate: null,
      status: 'Well Retained',
      history: [
        { revisionDate: addDaysToDate(today, -34), revisionNumber: 1, result: 'Easy', notes: 'Smooth' },
        { revisionDate: addDaysToDate(today, -31), revisionNumber: 2, result: 'Good', notes: 'No issues' },
        { revisionDate: addDaysToDate(today, -24), revisionNumber: 3, result: 'Good', notes: 'Remembered bounds' },
        { revisionDate: addDaysToDate(today, -10), revisionNumber: 4, result: 'Easy', notes: 'Clear explanation' },
        { revisionDate: today, revisionNumber: 5, result: 'Easy', notes: 'Mastered' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Merge without duplicates
  samples.forEach(sample => {
    if (!AppState.problems.some(p => p.title === sample.title)) {
      AppState.problems.push(sample);
    }
  });

  saveProblemsToStorage();
  localStorage.setItem('tp_initialized', 'true');
  showBackupStatus('Loaded Striver sample problems successfully!', 'success');
  refreshUI();
}

// =============================================================================
// 8. NAVIGATION & TAB SWITCHING
// =============================================================================

function switchTab(tabName) {
  AppState.currentTab = tabName;

  // Nav buttons
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
  });

  // Content sections
  document.querySelectorAll('.content-section').forEach(sec => {
    sec.classList.remove('active');
  });

  const targetSection = document.getElementById(`section-${tabName}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Refresh current view
  if (tabName === 'dashboard') renderDashboard();
  if (tabName === 'dsa') renderDSATracker();
  if (tabName === 'queue') renderRevisionQueue();
  if (tabName === 'pillars') renderThreePillars();
}

// =============================================================================
// 9. EVENT LISTENERS INITIALIZATION
// =============================================================================

function setupEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Top Action Buttons
  document.getElementById('btn-add-problem-top')?.addEventListener('click', () => openProblemModal());
  document.getElementById('btn-add-problem-main')?.addEventListener('click', () => openProblemModal());
  document.getElementById('btn-add-problem-empty')?.addEventListener('click', () => openProblemModal());
  document.getElementById('btn-open-backup')?.addEventListener('click', () => openBackupModal());
  document.getElementById('btn-close-backup-modal')?.addEventListener('click', () => closeBackupModal());
  document.getElementById('btn-close-backup-done')?.addEventListener('click', () => closeBackupModal());
  document.getElementById('btn-export-json')?.addEventListener('click', () => exportBackupJSON());

  // Import trigger
  const fileInput = document.getElementById('input-import-file');
  document.getElementById('btn-trigger-import')?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImportFile(e.target.files[0]);
    }
  });

  // CSV Import trigger
  const csvFileInput = document.getElementById('input-import-csv');
  document.getElementById('btn-trigger-import-csv')?.addEventListener('click', () => csvFileInput?.click());
  csvFileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImportCSV(e.target.files[0]);
    }
  });

  document.getElementById('btn-seed-sample')?.addEventListener('click', () => seedSampleProblems());

  // Dashboard quick triggers
  document.getElementById('btn-jump-to-pillars')?.addEventListener('click', () => switchTab('pillars'));
  document.getElementById('btn-dash-open-queue')?.addEventListener('click', () => switchTab('queue'));

  // Dashboard Pillar Checkbox Toggles
  document.getElementById('dash-check-dsa')?.addEventListener('change', (e) => {
    const todayStr = getTodayDateString();
    ensurePillarsDayRecord(todayStr);
    AppState.pillarsData[todayStr].dsa.done = e.target.checked;
    savePillarsToStorage();
    refreshUI();
  });

  document.getElementById('dash-check-java')?.addEventListener('change', (e) => {
    const todayStr = getTodayDateString();
    ensurePillarsDayRecord(todayStr);
    AppState.pillarsData[todayStr].java.done = e.target.checked;
    savePillarsToStorage();
    refreshUI();
  });

  document.getElementById('dash-check-sw360')?.addEventListener('change', (e) => {
    const todayStr = getTodayDateString();
    ensurePillarsDayRecord(todayStr);
    AppState.pillarsData[todayStr].sw360.done = e.target.checked;
    savePillarsToStorage();
    refreshUI();
  });

  // DSA Tracker Filters & Search
  const searchInput = document.getElementById('dsa-search-input');
  const btnClearSearch = document.getElementById('btn-clear-dsa-search');

  searchInput?.addEventListener('input', (e) => {
    AppState.searchQuery = e.target.value.trim();
    if (btnClearSearch) btnClearSearch.style.display = AppState.searchQuery ? 'block' : 'none';
    renderDSATracker();
  });

  btnClearSearch?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    AppState.searchQuery = '';
    btnClearSearch.style.display = 'none';
    renderDSATracker();
  });

  // Populate topics dropdown
  const filterTopicSelect = document.getElementById('dsa-filter-topic');
  if (filterTopicSelect) {
    TOPICS_LIST.forEach(topic => {
      const opt = document.createElement('option');
      opt.value = topic;
      opt.textContent = topic;
      filterTopicSelect.appendChild(opt);
    });
    filterTopicSelect.addEventListener('change', (e) => {
      AppState.filterTopic = e.target.value;
      renderDSATracker();
    });
  }

  document.getElementById('dsa-filter-difficulty')?.addEventListener('change', (e) => {
    AppState.filterDifficulty = e.target.value;
    renderDSATracker();
  });

  document.getElementById('dsa-sort-by')?.addEventListener('change', (e) => {
    AppState.sortBy = e.target.value;
    renderDSATracker();
  });

  document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (btnClearSearch) btnClearSearch.style.display = 'none';
    if (filterTopicSelect) filterTopicSelect.value = 'ALL';
    const diffSelect = document.getElementById('dsa-filter-difficulty');
    if (diffSelect) diffSelect.value = 'ALL';
    const sortSelect = document.getElementById('dsa-sort-by');
    if (sortSelect) sortSelect.value = 'solved-desc';

    AppState.searchQuery = '';
    AppState.filterTopic = 'ALL';
    AppState.filterDifficulty = 'ALL';
    AppState.sortBy = 'solved-desc';

    renderDSATracker();
  });

  // Delegate DSA Table Row Actions
  document.getElementById('dsa-table-body')?.addEventListener('click', (e) => {
    const reviseBtn = e.target.closest('.btn-table-revise');
    const viewBtn = e.target.closest('.btn-table-view');
    const editBtn = e.target.closest('.btn-table-edit');
    const deleteBtn = e.target.closest('.btn-table-delete');

    if (reviseBtn) {
      openReviseModal(reviseBtn.getAttribute('data-id'));
    } else if (viewBtn) {
      openDetailsModal(viewBtn.getAttribute('data-id'));
    } else if (editBtn) {
      openProblemModal(editBtn.getAttribute('data-id'));
    } else if (deleteBtn) {
      openDeleteModal(deleteBtn.getAttribute('data-id'));
    }
  });

  // Delegate Dashboard Focus List Revise
  document.getElementById('dash-focus-list')?.addEventListener('click', (e) => {
    const reviseBtn = e.target.closest('.btn-dash-revise');
    if (reviseBtn) {
      openReviseModal(reviseBtn.getAttribute('data-id'));
    }
  });

  // Queue Sub-Tabs
  document.querySelectorAll('.sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      AppState.currentQueueFilter = tab.getAttribute('data-queue-group');
      renderRevisionQueue();
    });
  });

  // Delegate Queue Cards Revise & Details
  document.getElementById('queue-cards-container')?.addEventListener('click', (e) => {
    const reviseBtn = e.target.closest('.btn-queue-revise');
    const detailsBtn = e.target.closest('.btn-queue-details');

    if (reviseBtn) {
      openReviseModal(reviseBtn.getAttribute('data-id'));
    } else if (detailsBtn) {
      openDetailsModal(detailsBtn.getAttribute('data-id'));
    }
  });

  // Problem Modal Handlers
  document.getElementById('btn-close-problem-modal')?.addEventListener('click', closeProblemModal);
  document.getElementById('btn-cancel-problem')?.addEventListener('click', closeProblemModal);
  document.getElementById('btn-add-approach-row')?.addEventListener('click', () => {
    addApproachRow({ type: 'Better', timeComplexity: '', spaceComplexity: '', notes: '' });
  });
  document.getElementById('form-problem')?.addEventListener('submit', handleProblemFormSubmit);

  // Revise Modal Handlers
  document.getElementById('btn-close-revise-modal')?.addEventListener('click', closeReviseModal);
  document.getElementById('btn-reveal-solution')?.addEventListener('click', () => {
    document.getElementById('revise-reveal-area').style.display = 'none';
    document.getElementById('revise-solution-section').style.display = 'block';
  });

  // Outcome buttons
  document.querySelectorAll('.btn-outcome').forEach(btn => {
    btn.addEventListener('click', () => {
      const outcome = btn.getAttribute('data-outcome');
      const probId = document.getElementById('revise-problem-id').value;
      const notes = document.getElementById('revise-log-note').value;
      if (probId && outcome) {
        recordRevisionAttempt(probId, outcome, notes);
        closeReviseModal();
      }
    });
  });

  // Details Modal Handlers
  document.getElementById('btn-close-details-modal')?.addEventListener('click', closeDetailsModal);
  document.getElementById('btn-details-edit')?.addEventListener('click', () => {
    if (AppState.activeProblemForDetails) {
      const id = AppState.activeProblemForDetails.id;
      closeDetailsModal();
      openProblemModal(id);
    }
  });
  document.getElementById('btn-details-revise-now')?.addEventListener('click', () => {
    if (AppState.activeProblemForDetails) {
      const id = AppState.activeProblemForDetails.id;
      closeDetailsModal();
      openReviseModal(id);
    }
  });

  // Delete Modal Handlers
  document.getElementById('btn-close-delete-modal')?.addEventListener('click', closeDeleteModal);
  document.getElementById('btn-cancel-delete')?.addEventListener('click', closeDeleteModal);
  document.getElementById('btn-confirm-delete')?.addEventListener('click', confirmDeleteProblem);

  // Three Pillars Date Navigation
  document.getElementById('btn-pillar-prev-day')?.addEventListener('click', () => {
    AppState.selectedPillarDate = addDaysToDate(AppState.selectedPillarDate, -1);
    renderThreePillars();
  });
  document.getElementById('btn-pillar-next-day')?.addEventListener('click', () => {
    AppState.selectedPillarDate = addDaysToDate(AppState.selectedPillarDate, 1);
    renderThreePillars();
  });
  document.getElementById('btn-pillar-today')?.addEventListener('click', () => {
    AppState.selectedPillarDate = getTodayDateString();
    renderThreePillars();
  });

  // Three Pillars Checkbox and Task Inputs
  const chkPillarDsa = document.getElementById('chk-pillar-dsa');
  const inputPillarDsa = document.getElementById('input-pillar-dsa-task');

  const chkPillarJava = document.getElementById('chk-pillar-java');
  const inputPillarJava = document.getElementById('input-pillar-java-task');

  const chkPillarSw360 = document.getElementById('chk-pillar-sw360');
  const inputPillarSw360 = document.getElementById('input-pillar-sw360-task');

  const reflectionTextarea = document.getElementById('pillar-daily-reflection');
  const reflectionStatus = document.getElementById('reflection-save-status');

  function updatePillarEntry() {
    const selDate = AppState.selectedPillarDate;
    ensurePillarsDayRecord(selDate);

    AppState.pillarsData[selDate].dsa.done = chkPillarDsa.checked;
    AppState.pillarsData[selDate].dsa.task = inputPillarDsa.value.trim();

    AppState.pillarsData[selDate].java.done = chkPillarJava.checked;
    AppState.pillarsData[selDate].java.task = inputPillarJava.value.trim();

    AppState.pillarsData[selDate].sw360.done = chkPillarSw360.checked;
    AppState.pillarsData[selDate].sw360.task = inputPillarSw360.value.trim();

    AppState.pillarsData[selDate].reflection = reflectionTextarea.value.trim();

    savePillarsToStorage();
    renderThreePillars();
    renderHeader();
    renderDashboard();

    if (reflectionStatus) {
      reflectionStatus.textContent = 'Saved';
      setTimeout(() => { reflectionStatus.textContent = 'Saved'; }, 1500);
    }
  }

  [chkPillarDsa, chkPillarJava, chkPillarSw360].forEach(chk => {
    chk?.addEventListener('change', updatePillarEntry);
  });

  [inputPillarDsa, inputPillarJava, inputPillarSw360].forEach(input => {
    input?.addEventListener('change', updatePillarEntry);
  });

  reflectionTextarea?.addEventListener('input', () => {
    if (reflectionStatus) reflectionStatus.textContent = 'Saving...';
  });
  reflectionTextarea?.addEventListener('change', updatePillarEntry);

  // Close modals on outside backdrop click or Escape key
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop').forEach(modal => {
        modal.style.display = 'none';
      });
    }
  });
}

// =============================================================================
// 10. HELPER UTILITIES
// =============================================================================

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getDifficultyBadgeClass(difficulty) {
  if (difficulty === 'Easy') return 'diff-easy';
  if (difficulty === 'Medium') return 'diff-medium';
  if (difficulty === 'Hard') return 'diff-hard';
  return 'badge-neutral';
}

// =============================================================================
// 11. INITIALIZATION ON DOM READY
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  loadDataFromStorage();
  setupEventListeners();

  // If brand new installation (no previous storage), seed starter problems
  const isFirstInstall = localStorage.getItem(STORAGE_KEYS.PROBLEMS) === null && !localStorage.getItem('tp_initialized');
  if (isFirstInstall && AppState.problems.length === 0) {
    seedSampleProblems();
  } else {
    refreshUI();
  }
});
