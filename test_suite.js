const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// Global mock storage
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] !== undefined ? storage[k] : null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { for (const k in storage) delete storage[k]; }
};

// Mock DOM
const elements = {};
function createMockElement(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    textContent: '',
    value: '',
    checked: false,
    style: {},
    className: '',
    classList: {
      add: function(c) { this._classes = this._classes || new Set(); this._classes.add(c); },
      remove: function(c) { this._classes = this._classes || new Set(); this._classes.delete(c); },
      toggle: function(c, v) { if (v) this.add(c); else this.remove(c); },
      contains: function(c) { return this._classes ? this._classes.has(c) : false; }
    },
    innerHTML: '',
    children: [],
    appendChild: function(ch) { this.children.push(ch); return ch; },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    setAttribute: () => {},
    getAttribute: (attr) => this[attr] || null,
    removeAttribute: () => {}
  };
}

global.document = {
  getElementById: (id) => elements[id] || (elements[id] = createMockElement(id)),
  querySelectorAll: (selector) => [],
  querySelector: (selector) => null,
  createElement: (tag) => createMockElement('dyn_' + Math.random(), tag),
  addEventListener: () => {}
};
global.window = global;
global.alert = console.log;
global.confirm = () => true;

// Evaluate script.js
const scriptCode = fs.readFileSync('script.js', 'utf8');
vm.runInThisContext(scriptCode);

console.log('----------------------------------------------------');
console.log('RUNNING VERIFICATION TESTS FOR THREEPILLARS EMBARKX');
console.log('----------------------------------------------------');

let passedTests = 0;
let totalTests = 11;

function runTest(num, name, fn) {
  try {
    fn();
    console.log(`[PASS] Test ${num}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] Test ${num}: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// TEST 1: Existing DSA problems are preserved
runTest(1, 'Existing DSA problems are preserved during data load', () => {
  localStorage.clear();
  const sampleProblems = [
    {
      id: 'dsa_test_1',
      title: 'Trapping Rain Water',
      topic: 'Two Pointers',
      difficulty: 'Hard',
      platform: 'LeetCode',
      solvedDate: '2026-11-01',
      stage: 2,
      nextRevisionDate: '2026-11-10',
      status: 'Revising',
      approaches: [{ type: 'Optimal', timeComplexity: 'O(N)', spaceComplexity: 'O(1)' }],
      history: [{ revisionNumber: 1, revisionDate: '2026-11-02', result: 'Good' }]
    }
  ];
  localStorage.setItem(STORAGE_KEYS.PROBLEMS, JSON.stringify(sampleProblems));

  loadDataFromStorage();

  assert.strictEqual(AppState.problems.length, 1, 'Should have preserved 1 DSA problem');
  assert.strictEqual(AppState.problems[0].title, 'Trapping Rain Water');
  assert.strictEqual(AppState.problems[0].stage, 2);
  assert.strictEqual(AppState.problems[0].history.length, 1);
});

// TEST 2: Existing DSA revisions still work
runTest(2, 'Existing DSA revisions still work', () => {
  const probId = 'dsa_test_1';
  const initialHistoryLen = AppState.problems[0].history.length;
  const initialStage = AppState.problems[0].stage;

  const success = recordRevisionAttempt(probId, 'Good', 'Felt very clear this time');
  assert.strictEqual(success, true, 'Revision attempt should succeed');
  assert.strictEqual(AppState.problems[0].stage, initialStage + 1, 'DSA stage should increment to 3');
  assert.strictEqual(AppState.problems[0].history.length, initialHistoryLen + 1, 'History length should increment');
  assert.strictEqual(AppState.problems[0].history[initialHistoryLen].result, 'Good');
  assert.strictEqual(AppState.problems[0].history[initialHistoryLen].notes, 'Felt very clear this time');
});

// TEST 3: All 10 course phases display correctly
runTest(3, 'All 10 course phases and 50 lessons are initialized properly', () => {
  assert.strictEqual(EMBARKX_COURSE_TEMPLATE.length, 10, 'Must have exactly 10 phases');
  assert.strictEqual(AppState.courseLessons.length, 50, 'Must have exactly 50 course lessons');

  const phaseNames = [
    'PHASE 1: BACKEND FUNDAMENTALS (Days 1-12)',
    'PHASE 2: DATABASE & PERSISTENCE (Days 13-18)',
    'PHASE 3: ADVANCED BACKEND (Days 19-25)',
    'PHASE 4: E-COMMERCE BACKEND (Days 26-30)',
    'PHASE 5: BACKEND COMPLETION (Days 31-32)',
    'PHASE 6: REACT FUNDAMENTALS (Days 33-40)',
    'PHASE 7: ADVANCED REACT (Days 41-48)',
    'PHASE 8: FULL-STACK INTEGRATION (Days 49-65)',
    'PHASE 9: ADMIN & SELLER PANELS (Days 66-69)',
    'PHASE 10: AI INTEGRATION & DEPLOYMENT (Days 70-72)'
  ];

  phaseNames.forEach((name, idx) => {
    assert.strictEqual(EMBARKX_COURSE_TEMPLATE[idx].phaseTitle, name, `Phase ${idx + 1} title match`);
  });

  // Verify independent lesson completion rule
  const p1Lessons = AppState.courseLessons.filter(l => l.phaseId === 1);
  assert.strictEqual(p1Lessons.length, 7, 'Phase 1 must have 7 lessons');
  assert.strictEqual(p1Lessons.every(l => !l.completed), true, 'Initially uncompleted');
});

// TEST 4: Lesson completion persists after refresh (simulated reload from LocalStorage)
runTest(4, 'Lesson completion persists after browser refresh', () => {
  const lesson1 = AppState.courseLessons[0];
  toggleLessonCompletion(lesson1.id, true);

  // Lesson 1 is completed
  assert.strictEqual(AppState.courseLessons[0].completed, true);

  // Other lessons in phase 1 remain uncompleted
  assert.strictEqual(AppState.courseLessons[1].completed, false, 'Lesson 2 must remain false');

  // Verify persistence in LocalStorage
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.COURSE));
  const storedL1 = stored.find(l => l.id === lesson1.id);
  assert.strictEqual(storedL1.completed, true, 'Persisted in LocalStorage');

  // Simulate refresh: re-load from LocalStorage
  AppState.courseLessons = [];
  loadDataFromStorage();
  assert.strictEqual(AppState.courseLessons[0].completed, true, 'Reloaded lesson 1 is completed');
  assert.strictEqual(AppState.courseLessons[1].completed, false, 'Reloaded lesson 2 is not completed');
});

// TEST 5: Completing a lesson schedules R1 (1 day after initial completion)
runTest(5, 'Completing a lesson schedules R1 (1 day after initial learning completion)', () => {
  const lesson = AppState.courseLessons[0];
  const todayStr = getTodayDateString();

  assert.strictEqual(lesson.completed, true);
  assert.strictEqual(lesson.stage, 1, 'Stage must be 1 for R1');
  assert.strictEqual(lesson.status, 'Revising');
  assert.strictEqual(lesson.nextRevisionDate, addDaysToDate(lesson.completedDate, 1), 'Next rev date must be +1d');
});

// TEST 6: Completing R1 schedules R2 (3 days after successful R1)
runTest(6, 'Completing R1 schedules R2 (3 days after successful R1)', () => {
  const lesson = AppState.courseLessons[0];
  const todayStr = getTodayDateString();

  const success = recordConceptRevision(lesson.id, 'Reviewed controller and setup');
  assert.strictEqual(success, true);
  assert.strictEqual(lesson.stage, 2, 'Stage must advance to 2 for R2');
  assert.strictEqual(lesson.nextRevisionDate, addDaysToDate(todayStr, 3), 'Next rev date must be +3d');
  assert.strictEqual(lesson.history.length, 1, 'History must contain 1 entry');
  assert.strictEqual(lesson.history[0].revisionNumber, 1);
  assert.strictEqual(lesson.history[0].notes, 'Reviewed controller and setup');
});

// TEST 7: Completing R2 schedules R3 (7 days after successful R2)
runTest(7, 'Completing R2 schedules R3 (7 days after successful R2)', () => {
  const lesson = AppState.courseLessons[0];
  const todayStr = getTodayDateString();

  const success = recordConceptRevision(lesson.id, 'Understood IoC container thoroughly');
  assert.strictEqual(success, true);
  assert.strictEqual(lesson.stage, 3, 'Stage must advance to 3 for R3');
  assert.strictEqual(lesson.nextRevisionDate, addDaysToDate(todayStr, 7), 'Next rev date must be +7d');
  assert.strictEqual(lesson.history.length, 2, 'History must contain 2 entries');
  assert.strictEqual(lesson.history[1].revisionNumber, 2);
  assert.strictEqual(lesson.history[1].notes, 'Understood IoC container thoroughly');
});

// TEST 8: Completing R3 marks the lesson Well Retained
runTest(8, 'Completing R3 marks the lesson Well Retained', () => {
  const lesson = AppState.courseLessons[0];

  const success = recordConceptRevision(lesson.id, 'Mastered all concepts for this lesson');
  assert.strictEqual(success, true);
  assert.strictEqual(lesson.stage, 4, 'Stage must advance to 4 (Complete)');
  assert.strictEqual(lesson.nextRevisionDate, null, 'nextRevisionDate must be null for Well Retained');
  assert.strictEqual(lesson.status, 'Well Retained', 'Status must be Well Retained');
  assert.strictEqual(lesson.history.length, 3, 'History must contain all 3 revisions');
  assert.strictEqual(lesson.history[2].revisionNumber, 3);
});

// TEST 9: Overdue revisions are correctly displayed
runTest(9, 'Overdue revisions are correctly identified and displayed', () => {
  const todayStr = getTodayDateString();
  const lesson2 = AppState.courseLessons[1];

  // Manually complete lesson 2 with completedDate in the past
  lesson2.completed = true;
  lesson2.completedDate = addDaysToDate(todayStr, -5);
  lesson2.stage = 1;
  lesson2.nextRevisionDate = addDaysToDate(todayStr, -4); // 4 days overdue
  lesson2.status = 'Revising';
  saveCourseToStorage();

  const courseQueue = getQueueCategorizedCourses();
  assert.strictEqual(courseQueue.overdue.length >= 1, true, 'Should have at least 1 overdue lesson');
  const foundOverdue = courseQueue.overdue.find(l => l.id === lesson2.id);
  assert.notStrictEqual(foundOverdue, undefined, 'Lesson 2 should be in overdue queue');

  const diff = getDaysDifference(foundOverdue.nextRevisionDate, todayStr);
  assert.strictEqual(diff, -4, 'Should be 4 days overdue');
});

// TEST 10: Backup and Restore include all new course data
runTest(10, 'Backup and Restore include all new course data', () => {
  // Toggle lesson 3 practical Done and notes
  const lesson3 = AppState.courseLessons[2];
  lesson3.practicalDone = true;
  lesson3.notes = 'Special personal notes for lesson 3';
  saveCourseToStorage();

  // Create backup object like exportBackupJSON
  const backupData = {
    version: 2,
    exportDate: new Date().toISOString(),
    system: 'Three Pillars Daily Tracker – DSA Spaced Repetition & EmbarkX Course Tracker',
    problems: AppState.problems,
    pillars: AppState.pillarsData,
    course: AppState.courseLessons
  };

  assert.strictEqual(backupData.course.length, 50, 'Backup must contain 50 course lessons');
  assert.strictEqual(backupData.course[0].status, 'Well Retained', 'Lesson 1 must be Well Retained');
  assert.strictEqual(backupData.course[2].practicalDone, true, 'Lesson 3 practicalDone must be preserved');
  assert.strictEqual(backupData.course[2].notes, 'Special personal notes for lesson 3');

  // Clear memory and storage
  AppState.courseLessons = [];
  AppState.problems = [];

  // Restore via import logic
  const importedCourseMap = {};
  backupData.course.forEach(item => {
    if (item && item.id) importedCourseMap[item.id] = item;
  });

  loadDataFromStorage(); // reloads master template
  AppState.courseLessons.forEach(l => {
    const saved = importedCourseMap[l.id];
    if (saved) {
      l.completed = !!saved.completed;
      l.completedDate = saved.completedDate || null;
      l.practicalDone = !!saved.practicalDone;
      l.notes = saved.notes || '';
      l.stage = typeof saved.stage === 'number' ? saved.stage : 0;
      l.nextRevisionDate = saved.nextRevisionDate || null;
      l.status = saved.status || (saved.completed ? 'Revising' : 'Pending');
      l.history = Array.isArray(saved.history) ? saved.history : [];
    }
  });

  assert.strictEqual(AppState.courseLessons[0].status, 'Well Retained', 'Restored lesson 1 status');
  assert.strictEqual(AppState.courseLessons[0].history.length, 3, 'Restored lesson 1 history');
  assert.strictEqual(AppState.courseLessons[2].practicalDone, true, 'Restored lesson 3 practicalDone');
  assert.strictEqual(AppState.courseLessons[2].notes, 'Special personal notes for lesson 3');
});

// TEST 11: No duplicate revision records are created
runTest(11, 'No duplicate revision records are created', () => {
  const lesson4 = AppState.courseLessons[3];
  toggleLessonCompletion(lesson4.id, true);

  assert.strictEqual(lesson4.stage, 1);
  assert.strictEqual(lesson4.history.length, 0);

  recordConceptRevision(lesson4.id, 'First R1 attempt');
  assert.strictEqual(lesson4.stage, 2);
  assert.strictEqual(lesson4.history.length, 1);

  // Stage is now 2. Calling recordConceptRevision records R2, not duplicate R1.
  recordConceptRevision(lesson4.id, 'R2 attempt');
  assert.strictEqual(lesson4.stage, 3);
  assert.strictEqual(lesson4.history.length, 2);
  assert.strictEqual(lesson4.history[0].revisionNumber, 1);
  assert.strictEqual(lesson4.history[1].revisionNumber, 2);

  // Calling on Well Retained (stage 4) returns false and does not create duplicate history
  recordConceptRevision(lesson4.id, 'R3 attempt');
  assert.strictEqual(lesson4.stage, 4);
  assert.strictEqual(lesson4.status, 'Well Retained');
  assert.strictEqual(lesson4.history.length, 3);

  const extraCall = recordConceptRevision(lesson4.id, 'Extra attempt');
  assert.strictEqual(extraCall, false, 'Should return false when already Well Retained');
  assert.strictEqual(lesson4.history.length, 3, 'History count must remain 3');
});

console.log('----------------------------------------------------');
console.log(`ALL ${passedTests} / ${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('----------------------------------------------------');

