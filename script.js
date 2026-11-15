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
  COURSE: 'tp_course_data_v1',
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

// Spaced Repetition Intervals in Days (DSA: 5 levels)
const SP_INTERVALS = {
  1: 1,  // R1: 1 day
  2: 3,  // R2: 3 days
  3: 7,  // R3: 7 days
  4: 14, // R4: 14 days
  5: 30  // R5: 30 days
};

// Spaced Repetition Intervals in Days (Course Concepts: R1 -> R2 -> R3 -> Well Retained)
const COURSE_SP_INTERVALS = {
  1: 1,  // R1: 1 day after learning completion
  2: 3,  // R2: 3 days after successful R1
  3: 7   // R3: 7 days after successful R2
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

const EMBARKX_COURSE_TEMPLATE = [
  {
    "phaseId": 1,
    "phaseNumber": 1,
    "phaseTitle": "PHASE 1: BACKEND FUNDAMENTALS (Days 1-12)",
    "dayRange": "Days 1-12",
    "outcome": "Junior Backend Developer (Basic Spring Boot)",
    "skills": "Development environment, Internet fundamentals, Dependency Injection, Spring Core concepts, REST API development, Spring Boot basics, Database concepts",
    "lessons": [
      {
        "id": "c_p1_l1",
        "title": "Introduction and Setup",
        "dayRange": "DAY 1 - DAY 2"
      },
      {
        "id": "c_p1_l2",
        "title": "Basics of Web Development and Internet | Pre Spring Boot",
        "dayRange": "DAY 1 - DAY 2"
      },
      {
        "id": "c_p1_l3",
        "title": "Spring Framework - The Basics | Before Spring Boot",
        "dayRange": "DAY 3 - DAY 5"
      },
      {
        "id": "c_p1_l4",
        "title": "Spring Framework: Working with Spring Annotations",
        "dayRange": "DAY 3 - DAY 5"
      },
      {
        "id": "c_p1_l5",
        "title": "Spring Boot 101: Building Our First REST API",
        "dayRange": "DAY 6 - DAY 8"
      },
      {
        "id": "c_p1_l6",
        "title": "Getting Started With Ecommerce Application | Building Category Module",
        "dayRange": "DAY 9 - DAY 12"
      },
      {
        "id": "c_p1_l7",
        "title": "Fundamentals of Databases and Persistence",
        "dayRange": "DAY 9 - DAY 12"
      }
    ]
  },
  {
    "phaseId": 2,
    "phaseNumber": 2,
    "phaseTitle": "PHASE 2: DATABASE & PERSISTENCE (Days 13-18)",
    "dayRange": "Days 13-18",
    "outcome": "Mid-Level Backend Developer (Security + Complex features)",
    "skills": "ORM concepts, Code optimization, Data validation, Performance optimization, Complex data modeling, Business logic, Enterprise security, Authentication/Authorization",
    "lessons": [
      {
        "id": "c_p2_l1",
        "title": "Getting Started with JPA | Jakarta Persistence API",
        "dayRange": "DAY 13 - DAY 15"
      },
      {
        "id": "c_p2_l2",
        "title": "Reduce Boilerplate Code: Introducing Lombok",
        "dayRange": "DAY 13 - DAY 15"
      },
      {
        "id": "c_p2_l3",
        "title": "Validations in Spring Boot API | Backend Validations",
        "dayRange": "DAY 16 - DAY 18"
      },
      {
        "id": "c_p2_l4",
        "title": "Implementing Pagination and Sorting in Our Ecommerce Project",
        "dayRange": "DAY 16 - DAY 18"
      }
    ]
  },
  {
    "phaseId": 3,
    "phaseNumber": 3,
    "phaseTitle": "PHASE 3: ADVANCED BACKEND (Days 19-25)",
    "dayRange": "Days 19-25",
    "outcome": "",
    "skills": "",
    "lessons": [
      {
        "id": "c_p3_l1",
        "title": "Working with Multiple Entities and Relationships With JPA",
        "dayRange": "DAY 19 - DAY 21"
      },
      {
        "id": "c_p3_l2",
        "title": "Managing Products in Our Ecommerce Application",
        "dayRange": "DAY 19 - DAY 21"
      },
      {
        "id": "c_p3_l3",
        "title": "Spring Security | Securing Our Spring Boot Application",
        "dayRange": "DAY 22 - DAY 25"
      },
      {
        "id": "c_p3_l4",
        "title": "Managing User Profiles and Roles | User Management For Spring Security",
        "dayRange": "DAY 22 - DAY 25"
      },
      {
        "id": "c_p3_l5",
        "title": "Implementing Our Own Custom Authentication in E-commerce App",
        "dayRange": "DAY 22 - DAY 25"
      }
    ]
  },
  {
    "phaseId": 4,
    "phaseNumber": 4,
    "phaseTitle": "PHASE 4: E-COMMERCE BACKEND (Days 26-30)",
    "dayRange": "Days 26-30",
    "outcome": "Senior Backend Developer (Complete backend skills)",
    "skills": "Complex business logic, Multi-database support, Payment processing, Cloud deployment, API documentation, Interview preparation",
    "lessons": [
      {
        "id": "c_p4_l1",
        "title": "Implementing Shopping Cart in Ecommerce Application",
        "dayRange": "DAY 26 - DAY 28"
      },
      {
        "id": "c_p4_l2",
        "title": "Different Databases - PostgreSQL and MySQL",
        "dayRange": "DAY 26 - DAY 28"
      },
      {
        "id": "c_p4_l3",
        "title": "Manage User Address to Ship Orders",
        "dayRange": "DAY 29 - DAY 30"
      },
      {
        "id": "c_p4_l4",
        "title": "Orders and Payments in Our Ecommerce Application",
        "dayRange": "DAY 29 - DAY 30"
      },
      {
        "id": "c_p4_l5",
        "title": "Deploying on AWS | Deploy Spring Boot Application on AWS",
        "dayRange": "DAY 29 - DAY 30"
      }
    ]
  },
  {
    "phaseId": 5,
    "phaseNumber": 5,
    "phaseTitle": "PHASE 5: BACKEND COMPLETION (Days 31-32)",
    "dayRange": "Days 31-32",
    "outcome": "",
    "skills": "",
    "lessons": [
      {
        "id": "c_p5_l1",
        "title": "API Documentation with Swagger and Spring Boot",
        "dayRange": "DAY 31 - DAY 32"
      },
      {
        "id": "c_p5_l2",
        "title": "Prove Your Backend Skills | Backend Interview Simulation",
        "dayRange": "DAY 31 - DAY 32"
      }
    ]
  },
  {
    "phaseId": 6,
    "phaseNumber": 6,
    "phaseTitle": "PHASE 6: REACT FUNDAMENTALS (Days 33-40)",
    "dayRange": "Days 33-40",
    "outcome": "Junior Full-Stack Developer (React basics)",
    "skills": "React fundamentals, Component architecture, Advanced React concepts, State management",
    "lessons": [
      {
        "id": "c_p6_l1",
        "title": "Don't Skip | Becoming a Spring Boot Full Stack Java Developer | A Note",
        "dayRange": "DAY 33 - DAY 35"
      },
      {
        "id": "c_p6_l2",
        "title": "[REACT BEGINNER] Introduction to React",
        "dayRange": "DAY 33 - DAY 35"
      },
      {
        "id": "c_p6_l3",
        "title": "[REACT BEGINNER] Getting Started with JSX",
        "dayRange": "DAY 33 - DAY 35"
      },
      {
        "id": "c_p6_l4",
        "title": "[REACT BEGINNER] Components and Props in React",
        "dayRange": "DAY 33 - DAY 35"
      },
      {
        "id": "c_p6_l5",
        "title": "[REACT INTERMEDIATE] Introduction to React Hooks",
        "dayRange": "DAY 36 - DAY 40"
      },
      {
        "id": "c_p6_l6",
        "title": "[REACT INTERMEDIATE] Introduction to useEffect Hook",
        "dayRange": "DAY 36 - DAY 40"
      },
      {
        "id": "c_p6_l7",
        "title": "[REACT INTERMEDIATE] Introduction to useRef Hook",
        "dayRange": "DAY 36 - DAY 40"
      },
      {
        "id": "c_p6_l8",
        "title": "[REACT INTERMEDIATE] Introduction to useContext Hook",
        "dayRange": "DAY 36 - DAY 40"
      }
    ]
  },
  {
    "phaseId": 7,
    "phaseNumber": 7,
    "phaseTitle": "PHASE 7: ADVANCED REACT (Days 41-48)",
    "dayRange": "Days 41-48",
    "outcome": "Mid-Level Full-Stack Developer (Advanced React)",
    "skills": "Custom hooks, API integration, Styling, Navigation, Global state management",
    "lessons": [
      {
        "id": "c_p7_l1",
        "title": "[REACT ADVANCE] Custom Hooks in React",
        "dayRange": "DAY 41 - DAY 44"
      },
      {
        "id": "c_p7_l2",
        "title": "[REACT ADVANCE] APIs and React",
        "dayRange": "DAY 41 - DAY 44"
      },
      {
        "id": "c_p7_l3",
        "title": "[REACT ADVANCE] React Hook Forms",
        "dayRange": "DAY 41 - DAY 44"
      },
      {
        "id": "c_p7_l4",
        "title": "[REACT ADVANCE] React with Tailwind CSS",
        "dayRange": "DAY 41 - DAY 44"
      },
      {
        "id": "c_p7_l5",
        "title": "[REACT ADVANCE] Routing with React",
        "dayRange": "DAY 45 - DAY 48"
      },
      {
        "id": "c_p7_l6",
        "title": "[REACT ADVANCE] React Router Hooks to Know",
        "dayRange": "DAY 45 - DAY 48"
      },
      {
        "id": "c_p7_l7",
        "title": "[REACT ADVANCE] Redux",
        "dayRange": "DAY 45 - DAY 48"
      }
    ]
  },
  {
    "phaseId": 8,
    "phaseNumber": 8,
    "phaseTitle": "PHASE 8: FULL-STACK INTEGRATION (Days 49-65)",
    "dayRange": "Days 49-65",
    "outcome": "Senior Full-Stack Developer (Complete e-commerce)",
    "skills": "Implementing things learned into a project, Understand how things work in project, Payment processing, Authentication flow",
    "lessons": [
      {
        "id": "c_p8_l1",
        "title": "Setting up Project & Building Home Page",
        "dayRange": "DAY 49 - DAY 55"
      },
      {
        "id": "c_p8_l2",
        "title": "Building Product StoreFront",
        "dayRange": "DAY 49 - DAY 55"
      },
      {
        "id": "c_p8_l3",
        "title": "Building HomePage and Navigation",
        "dayRange": "DAY 49 - DAY 55"
      },
      {
        "id": "c_p8_l4",
        "title": "Building Advance Shopping Cart Using React + Redux",
        "dayRange": "DAY 49 - DAY 55"
      },
      {
        "id": "c_p8_l5",
        "title": "Authenticating Users On Frontend Using React",
        "dayRange": "DAY 56 - DAY 65"
      },
      {
        "id": "c_p8_l6",
        "title": "Checkout Flow On Frontend Using React",
        "dayRange": "DAY 56 - DAY 65"
      },
      {
        "id": "c_p8_l7",
        "title": "Payment [Stripe] Integration On Frontend Using React",
        "dayRange": "DAY 56 - DAY 65"
      }
    ]
  },
  {
    "phaseId": 9,
    "phaseNumber": 9,
    "phaseTitle": "PHASE 9: ADMIN & SELLER PANELS (Days 66-69)",
    "dayRange": "Days 66-69",
    "outcome": "Enterprise Full-Stack Developer (AI + Modern deployment)",
    "skills": "Role-based access, Admin interfaces, AI integration, Modern deployment",
    "lessons": [
      {
        "id": "c_p9_l1",
        "title": "Building a Full-Stack Admin Panel with Role-Based Authorization",
        "dayRange": "DAY 66 - DAY 69"
      },
      {
        "id": "c_p9_l2",
        "title": "Building a Full-Stack Seller Panel with Role-Based Authorization",
        "dayRange": "DAY 66 - DAY 69"
      }
    ]
  },
  {
    "phaseId": 10,
    "phaseNumber": 10,
    "phaseTitle": "PHASE 10: AI INTEGRATION & DEPLOYMENT (Days 70-72)",
    "dayRange": "Days 70-72",
    "outcome": "",
    "skills": "",
    "lessons": [
      {
        "id": "c_p10_l1",
        "title": "Welcome to the World of AI | Building Applications using Spring AI",
        "dayRange": "DAY 70 - DAY 72"
      },
      {
        "id": "c_p10_l2",
        "title": "Welcome to the World of AI | Building Audio Transcriber | Spring AI",
        "dayRange": "DAY 70 - DAY 72"
      },
      {
        "id": "c_p10_l3",
        "title": "TIPS: Deploying Full Stack Applications for FREE",
        "dayRange": "DAY 70 - DAY 72"
      }
    ]
  }
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
  currentQueueCategory: 'all', // 'all' | 'dsa' | 'course'
  currentQueueFilter: 'due',    // 'due' | 'overdue' | 'upcoming' | 'retained'
  selectedPillarDate: getTodayDateString(),
  searchQuery: '',
  filterTopic: 'ALL',
  filterDifficulty: 'ALL',
  sortBy: 'solved-desc',
  activeProblemForRevision: null,
  activeProblemForDetails: null,
  problemToDeleteId: null,
  selectedHeatmapDate: null,

  // Course Tracker State
  courseFilterPhase: 'ALL',
  courseFilterStatus: 'ALL',
  courseSearchQuery: '',
  courseExpandedPhases: { 1: true },
  activeLessonForRevision: null,
  activeLessonForDetails: null,

  problems: [],
  courseLessons: [],
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

    // 3. Load Course Data (EmbarkX Spring Boot Tracker)
    const storedCourse = localStorage.getItem(STORAGE_KEYS.COURSE);
    let loadedCourseMap = {};
    if (storedCourse !== null) {
      try {
        const parsedCourse = JSON.parse(storedCourse);
        if (Array.isArray(parsedCourse)) {
          parsedCourse.forEach(item => {
            if (item && item.id) {
              loadedCourseMap[item.id] = item;
            }
          });
        }
      } catch (e) {
        console.error('Error parsing stored course data:', e);
      }
    }

    // Merge with master template to guarantee all 10 phases and 50 lessons
    AppState.courseLessons = [];
    EMBARKX_COURSE_TEMPLATE.forEach(phase => {
      phase.lessons.forEach(lTemplate => {
        const saved = loadedCourseMap[lTemplate.id] || {};
        AppState.courseLessons.push({
          id: lTemplate.id,
          phaseId: phase.phaseId,
          phaseNumber: phase.phaseNumber,
          phaseTitle: phase.phaseTitle,
          phaseDayRange: phase.dayRange,
          phaseOutcome: phase.outcome || '',
          phaseSkills: phase.skills || '',
          title: lTemplate.title,
          dayRange: lTemplate.dayRange,
          completed: !!saved.completed,
          completedDate: saved.completedDate || null,
          practicalDone: !!saved.practicalDone,
          notes: saved.notes || '',
          stage: typeof saved.stage === 'number' ? saved.stage : 0,
          nextRevisionDate: saved.nextRevisionDate || null,
          status: saved.status || (saved.completed ? 'Revising' : 'Pending'),
          history: Array.isArray(saved.history) ? saved.history : []
        });
      });
    });

    // Save initialized or migrated course data back to LocalStorage
    saveCourseToStorage();

  } catch (err) {
    console.error('Error loading data from LocalStorage:', err);
    AppState.problems = [];
    AppState.pillarsData = {};
    AppState.courseLessons = [];
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

function saveCourseToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.COURSE, JSON.stringify(AppState.courseLessons));
  } catch (err) {
    console.error('Error saving course to LocalStorage:', err);
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

/**
 * Calculates next course concept revision schedule:
 * Initial Learning -> R1 (1d after initial completion)
 * R1 -> R2 (3d after R1)
 * R2 -> R3 (7d after R2)
 * R3 -> Well Retained
 */
function calculateCourseNextRevision(currentStage, revisionDateStr) {
  let nextStage = currentStage || 1;
  let nextDate = null;
  let newStatus = 'Revising';

  if (currentStage === 1) {
    // R1 completed -> R2 in 3 days
    nextStage = 2;
    nextDate = addDaysToDate(revisionDateStr, COURSE_SP_INTERVALS[2]); // 3 days
    newStatus = 'Revising';
  } else if (currentStage === 2) {
    // R2 completed -> R3 in 7 days
    nextStage = 3;
    nextDate = addDaysToDate(revisionDateStr, COURSE_SP_INTERVALS[3]); // 7 days
    newStatus = 'Revising';
  } else if (currentStage >= 3) {
    // R3 completed -> Well Retained
    nextStage = 4;
    nextDate = null;
    newStatus = 'Well Retained';
  }

  return { nextStage, nextDate, newStatus };
}

/**
 * Marks a course lesson completed or incomplete independently
 */
function toggleLessonCompletion(lessonId, isCompleted) {
  const lesson = AppState.courseLessons.find(l => l.id === lessonId);
  if (!lesson) return;

  const todayStr = getTodayDateString();

  if (isCompleted) {
    lesson.completed = true;
    if (!lesson.completedDate) {
      lesson.completedDate = todayStr;
    }
    // Schedule R1: 1 day after initial learning completion
    if (!lesson.stage || lesson.stage === 0) {
      lesson.stage = 1;
      lesson.nextRevisionDate = addDaysToDate(lesson.completedDate, COURSE_SP_INTERVALS[1]); // 1 day
      lesson.status = 'Revising';
    }

    // Auto mark Pillar 2 daily habit for today
    ensurePillarsDayRecord(todayStr);
    AppState.pillarsData[todayStr].java.done = true;
    savePillarsToStorage();
  } else {
    // Unchecking
    if (lesson.history && lesson.history.length > 0) {
      const confirmReset = confirm(`Marking "${lesson.title}" incomplete will reset its spaced repetition revision schedule. Do you want to continue?`);
      if (!confirmReset) {
        refreshUI();
        return;
      }
    }
    lesson.completed = false;
    lesson.completedDate = null;
    lesson.stage = 0;
    lesson.nextRevisionDate = null;
    lesson.status = 'Pending';
  }

  lesson.updatedAt = new Date().toISOString();
  saveCourseToStorage();
  refreshUI();
}

/**
 * Toggles practical coding status for a lesson
 */
function toggleLessonPractical(lessonId, isPractical) {
  const lesson = AppState.courseLessons.find(l => l.id === lessonId);
  if (!lesson) return;
  lesson.practicalDone = (typeof isPractical === 'boolean') ? isPractical : !lesson.practicalDone;
  lesson.updatedAt = new Date().toISOString();
  saveCourseToStorage();
  refreshUI();
}

/**
 * Saves personal notes for a course lesson
 */
function saveLessonNotes(lessonId, notes) {
  const lesson = AppState.courseLessons.find(l => l.id === lessonId);
  if (!lesson) return;
  lesson.notes = notes;
  lesson.updatedAt = new Date().toISOString();
  saveCourseToStorage();
}

/**
 * Submits a concept revision result for a course lesson
 * Initial -> R1 (1d) -> R2 (3d) -> R3 (7d) -> Well Retained
 */
function recordConceptRevision(lessonId, notes = '') {
  const lesson = AppState.courseLessons.find(l => l.id === lessonId);
  if (!lesson || !lesson.completed) return false;

  const todayStr = getTodayDateString();
  const currentStage = lesson.stage || 1;

  if (currentStage > 3 || lesson.status === 'Well Retained') {
    return false; // Already well retained
  }

  if (!Array.isArray(lesson.history)) {
    lesson.history = [];
  }

  // Record history attempt
  lesson.history.push({
    revisionNumber: currentStage,
    revisionDate: todayStr,
    result: 'Completed',
    notes: (notes || '').trim(),
    timestamp: new Date().toISOString()
  });

  const schedule = calculateCourseNextRevision(currentStage, todayStr);
  lesson.stage = schedule.nextStage;
  lesson.nextRevisionDate = schedule.nextDate;
  lesson.status = schedule.newStatus;
  lesson.updatedAt = new Date().toISOString();

  saveCourseToStorage();
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

function getQueueCategorizedCourses() {
  const todayStr = getTodayDateString();
  const due = [];
  const overdue = [];
  const upcoming = [];
  const retained = [];

  AppState.courseLessons.forEach(lesson => {
    if (lesson.status === 'Well Retained') {
      retained.push(lesson);
      return;
    }
    if (!lesson.completed || !lesson.nextRevisionDate) {
      return;
    }

    const diff = getDaysDifference(lesson.nextRevisionDate, todayStr);
    if (diff === 0) {
      due.push(lesson);
    } else if (diff < 0) {
      overdue.push(lesson);
    } else if (diff > 0 && diff <= 7) {
      upcoming.push(lesson);
    }
  });

  overdue.sort((a, b) => String(a.nextRevisionDate || '').localeCompare(String(b.nextRevisionDate || '')));
  due.sort((a, b) => a.phaseNumber - b.phaseNumber);
  upcoming.sort((a, b) => String(a.nextRevisionDate || '').localeCompare(String(b.nextRevisionDate || '')));

  return { due, overdue, upcoming, retained, todayStr };
}

function getUnifiedRevisionQueue() {
  const todayStr = getTodayDateString();
  const dsaQueue = getQueueCategorizedProblems();
  const courseQueue = getQueueCategorizedCourses();

  // Also collect retained for DSA
  const dsaRetained = AppState.problems.filter(p => p.status === 'Well Retained');

  // Wrap with item type indicator
  const wrapDsa = (list) => list.map(p => ({ type: 'dsa', data: p }));
  const wrapCourse = (list) => list.map(l => ({ type: 'course', data: l }));

  const allDue = [...wrapDsa(dsaQueue.due), ...wrapCourse(courseQueue.due)];
  const allOverdue = [...wrapDsa(dsaQueue.overdue), ...wrapCourse(courseQueue.overdue)];
  const allUpcoming = [...wrapDsa(dsaQueue.upcoming), ...wrapCourse(courseQueue.upcoming)];
  const allRetained = [...wrapDsa(dsaRetained), ...wrapCourse(courseQueue.retained)];

  // Category counts (due + overdue + upcoming + retained)
  const countDsaTotal = dsaQueue.due.length + dsaQueue.overdue.length + dsaQueue.upcoming.length + dsaRetained.length;
  const countCourseTotal = courseQueue.due.length + courseQueue.overdue.length + courseQueue.upcoming.length + courseQueue.retained.length;
  const countAllTotal = countDsaTotal + countCourseTotal;

  // Filter by AppState.currentQueueCategory
  let activeDue = allDue;
  let activeOverdue = allOverdue;
  let activeUpcoming = allUpcoming;
  let activeRetained = allRetained;

  if (AppState.currentQueueCategory === 'dsa') {
    activeDue = wrapDsa(dsaQueue.due);
    activeOverdue = wrapDsa(dsaQueue.overdue);
    activeUpcoming = wrapDsa(dsaQueue.upcoming);
    activeRetained = wrapDsa(dsaRetained);
  } else if (AppState.currentQueueCategory === 'course') {
    activeDue = wrapCourse(courseQueue.due);
    activeOverdue = wrapCourse(courseQueue.overdue);
    activeUpcoming = wrapCourse(courseQueue.upcoming);
    activeRetained = wrapCourse(courseQueue.retained);
  }

  return {
    todayStr,
    due: activeDue,
    overdue: activeOverdue,
    upcoming: activeUpcoming,
    retained: activeRetained,
    counts: {
      all: countAllTotal,
      dsa: countDsaTotal,
      course: countCourseTotal,
      dsaDue: dsaQueue.due.length,
      dsaOverdue: dsaQueue.overdue.length,
      courseDue: courseQueue.due.length,
      courseOverdue: courseQueue.overdue.length
    }
  };
}

// =============================================================================
// 6. UI RENDERING & COMPONENT UPDATES
// =============================================================================

function refreshUI() {
  renderHeader();
  renderDashboard();
  renderDSATracker();
  renderCourseTracker();
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

  const uQueue = getUnifiedRevisionQueue();
  const totalQueueAlert = uQueue.counts.dsaDue + uQueue.counts.dsaOverdue + uQueue.counts.courseDue + uQueue.counts.courseOverdue;
  const queueBadge = document.getElementById('nav-queue-badge');
  if (queueBadge) {
    if (totalQueueAlert > 0) {
      queueBadge.textContent = totalQueueAlert;
      queueBadge.style.display = 'inline-block';
    } else {
      queueBadge.style.display = 'none';
    }
  }

  const courseBadge = document.getElementById('nav-course-badge');
  const courseAlert = uQueue.counts.courseDue + uQueue.counts.courseOverdue;
  if (courseBadge) {
    if (courseAlert > 0) {
      courseBadge.textContent = courseAlert;
      courseBadge.style.display = 'inline-block';
    } else {
      courseBadge.style.display = 'none';
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

  // 2. Pillar 1: DSA Metrics
  const { due: dsaDue, overdue: dsaOverdue } = getQueueCategorizedProblems();
  const totalSolved = AppState.problems.length;
  const dsaWellRetained = AppState.problems.filter(p => p.status === 'Well Retained').length;

  document.getElementById('stat-total-solved').textContent = totalSolved;
  document.getElementById('stat-due-today').textContent = dsaDue.length;
  document.getElementById('stat-overdue').textContent = dsaOverdue.length;
  document.getElementById('stat-well-retained').textContent = dsaWellRetained;

  // 3. Pillar 2: Course Metrics
  const courseQueue = getQueueCategorizedCourses();
  const totalCourseLessons = AppState.courseLessons.length || 50;
  const completedLessons = AppState.courseLessons.filter(l => l.completed).length;
  const pendingLessons = totalCourseLessons - completedLessons;
  const coursePct = Math.round((completedLessons / totalCourseLessons) * 100);
  const courseWellRetained = AppState.courseLessons.filter(l => l.status === 'Well Retained').length;

  const statCourseTotal = document.getElementById('stat-course-total');
  const statCourseCompleted = document.getElementById('stat-course-completed');
  const statCourseRate = document.getElementById('stat-course-rate');
  const statCoursePending = document.getElementById('stat-course-pending');
  const statCourseDue = document.getElementById('stat-course-due');
  const statCourseOverdue = document.getElementById('stat-course-overdue');
  const statCourseRetained = document.getElementById('stat-course-retained');

  if (statCourseTotal) statCourseTotal.textContent = totalCourseLessons;
  if (statCourseCompleted) statCourseCompleted.textContent = completedLessons;
  if (statCourseRate) statCourseRate.textContent = `${coursePct}% Done`;
  if (statCoursePending) statCoursePending.textContent = pendingLessons;
  if (statCourseDue) statCourseDue.textContent = courseQueue.due.length;
  if (statCourseOverdue) statCourseOverdue.textContent = courseQueue.overdue.length;
  if (statCourseRetained) statCourseRetained.textContent = courseWellRetained;

  // 4. Course Progress View: Phase-wise Completion
  const phaseProgressSummary = document.getElementById('dash-phase-progress-summary');
  if (phaseProgressSummary) {
    phaseProgressSummary.textContent = `${completedLessons} / ${totalCourseLessons} Lessons Completed (${coursePct}%)`;
  }

  const phaseProgressGrid = document.getElementById('dash-course-phase-progress');
  if (phaseProgressGrid) {
    phaseProgressGrid.innerHTML = '';
    EMBARKX_COURSE_TEMPLATE.forEach(phase => {
      const pLessons = AppState.courseLessons.filter(l => l.phaseId === phase.phaseId);
      const pTotal = pLessons.length;
      const pDone = pLessons.filter(l => l.completed).length;
      const pPct = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
      const isComplete = pDone === pTotal && pTotal > 0;

      const item = document.createElement('div');
      item.className = 'phase-progress-item';
      item.setAttribute('data-phase-id', phase.phaseId);
      item.title = `Click to view Phase ${phase.phaseId} in Course Tracker`;
      item.innerHTML = `
        <div class="phase-progress-top">
          <span class="phase-progress-title">Phase ${phase.phaseId}: ${escapeHtml(phase.phaseTitle.replace(/^PHASE \d+:\s*/i, '').replace(/\s*\([^)]*\)$/, ''))}</span>
          <span class="phase-progress-pct ${isComplete ? 'complete' : ''}">${pPct}%</span>
        </div>
        <div class="phase-progress-sub">
          <span>${phase.dayRange || ''}</span>
          <span>•</span>
          <span>${pDone}/${pTotal} lessons</span>
        </div>
        <div class="progress-bar-outer">
          <div class="progress-bar-inner ${isComplete ? 'success' : ''}" style="width: ${pPct}%;"></div>
        </div>
      `;
      phaseProgressGrid.appendChild(item);
    });
  }

  // 5. Today's Revision Focus (Combined DSA & Course Concepts)
  const focusContainer = document.getElementById('dash-focus-list');
  if (focusContainer) {
    focusContainer.innerHTML = '';

    // Unified focus items: Overdue first, then Due today
    const focusItems = [];
    dsaOverdue.forEach(prob => focusItems.push({ type: 'dsa', isOverdue: true, item: prob }));
    courseQueue.overdue.forEach(lesson => focusItems.push({ type: 'course', isOverdue: true, item: lesson }));
    dsaDue.forEach(prob => focusItems.push({ type: 'dsa', isOverdue: false, item: prob }));
    courseQueue.due.forEach(lesson => focusItems.push({ type: 'course', isOverdue: false, item: lesson }));

    if (focusItems.length === 0) {
      focusContainer.innerHTML = `
        <div style="padding: 20px 12px; text-align: center; color: var(--text-muted);">
          <p style="font-weight: 500;">No revisions due today</p>
          <p style="font-size: 0.78rem; color: var(--text-light); margin-top: 2px;">All DSA and Course concept spaced recalls are up to date.</p>
        </div>
      `;
    } else {
      // Display up to 6 priority items
      focusItems.slice(0, 6).forEach(fObj => {
        const row = document.createElement('div');
        row.className = 'focus-problem-row';

        if (fObj.type === 'dsa') {
          const prob = fObj.item;
          row.innerHTML = `
            <div class="focus-problem-left">
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="pillar-tag dsa-tag" style="font-size: 0.7rem; padding: 1px 6px;">DSA</span>
                  <span class="focus-problem-name">${escapeHtml(prob.title)}</span>
                </div>
                <div class="focus-problem-meta" style="margin-top: 3px;">
                  <span class="badge ${getDifficultyBadgeClass(prob.difficulty)}">${prob.difficulty}</span>
                  <span>${escapeHtml(prob.topic)}</span>
                  <span>•</span>
                  <span class="badge ${fObj.isOverdue ? 'status-overdue' : 'status-due'}">
                    ${fObj.isOverdue ? 'Overdue' : 'Due Today'}
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
        } else {
          const lesson = fObj.item;
          row.innerHTML = `
            <div class="focus-problem-left">
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="pillar-tag java-tag" style="font-size: 0.7rem; padding: 1px 6px;">Spring Boot</span>
                  <span class="focus-problem-name">${escapeHtml(lesson.title)}</span>
                </div>
                <div class="focus-problem-meta" style="margin-top: 3px;">
                  <span class="badge badge-neutral">Phase ${lesson.phaseNumber || 1}</span>
                  <span>${escapeHtml(lesson.dayRange || '')}</span>
                  <span>•</span>
                  <span class="badge ${fObj.isOverdue ? 'status-overdue' : 'status-due'}">
                    ${fObj.isOverdue ? 'Overdue' : 'Due Today'}
                  </span>
                  <span>Stage: R${lesson.stage || 1}</span>
                </div>
              </div>
            </div>
            <div>
              <button class="btn btn-primary btn-sm btn-dash-concept-revise" data-id="${lesson.id}">
                Revise Concept →
              </button>
            </div>
          `;
        }
        focusContainer.appendChild(row);
      });

      if (focusItems.length > 6) {
        const moreDiv = document.createElement('div');
        moreDiv.style.textAlign = 'center';
        moreDiv.style.paddingTop = '8px';
        moreDiv.innerHTML = `
          <button class="btn btn-ghost btn-sm" id="btn-dash-more-revisions">
            + ${focusItems.length - 6} more in Revision Queue
          </button>
        `;
        focusContainer.appendChild(moreDiv);
        moreDiv.querySelector('#btn-dash-more-revisions')?.addEventListener('click', () => {
          switchTab('queue');
        });
      }
    }
  }

  // 6. GitHub-Style DSA Contribution Heatmap
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
 * Render Section: EmbarkX Spring Boot Course Tracker
 */
function renderCourseTracker() {
  const container = document.getElementById('course-phases-container');
  if (!container) return;

  const todayStr = getTodayDateString();
  const totalLessons = AppState.courseLessons.length || 50;
  const completedLessons = AppState.courseLessons.filter(l => l.completed).length;
  const pendingLessons = totalLessons - completedLessons;
  const completionPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const practicalCount = AppState.courseLessons.filter(l => l.practicalDone).length;
  const wellRetainedCount = AppState.courseLessons.filter(l => l.status === 'Well Retained').length;

  // Update Overview Banner Elements
  const totalEl = document.getElementById('course-total-lessons');
  const compEl = document.getElementById('course-completed-lessons');
  const rateEl = document.getElementById('course-completion-rate');
  const pendEl = document.getElementById('course-pending-lessons');
  const practEl = document.getElementById('course-practical-count');
  const retainEl = document.getElementById('course-retained-lessons');
  const progBar = document.getElementById('course-overall-progress-bar');

  if (totalEl) totalEl.textContent = totalLessons;
  if (compEl) compEl.textContent = completedLessons;
  if (rateEl) rateEl.textContent = `${completionPct}% Complete`;
  if (pendEl) pendEl.textContent = pendingLessons;
  if (practEl) practEl.textContent = practicalCount;
  if (retainEl) retainEl.textContent = wellRetainedCount;
  if (progBar) progBar.style.width = `${completionPct}%`;

  container.innerHTML = '';
  let visibleLessonsCount = 0;

  const searchQ = (AppState.courseSearchQuery || '').toLowerCase();
  const phaseFilter = AppState.courseFilterPhase;
  const statusFilter = AppState.courseFilterStatus;

  EMBARKX_COURSE_TEMPLATE.forEach(phase => {
    // Check phase filter
    if (phaseFilter !== 'ALL' && String(phase.phaseId) !== String(phaseFilter)) {
      return;
    }

    const phaseLessons = AppState.courseLessons.filter(l => l.phaseId === phase.phaseId);
    const pTotal = phaseLessons.length;
    const pDone = phaseLessons.filter(l => l.completed).length;
    const pPct = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;

    // Filter lessons inside phase based on status and search query
    const filteredLessons = phaseLessons.filter(lesson => {
      // Status filter
      if (statusFilter === 'completed' && !lesson.completed) return false;
      if (statusFilter === 'pending' && lesson.completed) return false;
      if (statusFilter === 'practical' && !lesson.practicalDone) return false;
      if (statusFilter === 'revising' && (lesson.status !== 'Revising' || !lesson.completed)) return false;
      if (statusFilter === 'due') {
        if (!lesson.completed || !lesson.nextRevisionDate || lesson.status === 'Well Retained') return false;
        const diff = getDaysDifference(lesson.nextRevisionDate, todayStr);
        if (diff !== 0) return false;
      }
      if (statusFilter === 'overdue') {
        if (!lesson.completed || !lesson.nextRevisionDate || lesson.status === 'Well Retained') return false;
        const diff = getDaysDifference(lesson.nextRevisionDate, todayStr);
        if (diff >= 0) return false;
      }
      if (statusFilter === 'retained' && lesson.status !== 'Well Retained') return false;

      // Search query filter
      if (searchQ) {
        const matchesTitle = lesson.title.toLowerCase().includes(searchQ);
        const matchesDay = (lesson.dayRange || '').toLowerCase().includes(searchQ);
        const matchesPhase = phase.phaseTitle.toLowerCase().includes(searchQ);
        const matchesNotes = (lesson.notes || '').toLowerCase().includes(searchQ);
        if (!matchesTitle && !matchesDay && !matchesPhase && !matchesNotes) {
          return false;
        }
      }

      return true;
    });

    // If search/status filter active and 0 lessons match in this phase, don't show the phase
    if ((searchQ || statusFilter !== 'ALL') && filteredLessons.length === 0) {
      return;
    }

    visibleLessonsCount += filteredLessons.length;
    const isOpen = !!AppState.courseExpandedPhases[phase.phaseId];

    const phaseCard = document.createElement('div');
    phaseCard.className = `phase-accordion-card ${isOpen ? 'open' : ''}`;
    phaseCard.setAttribute('data-phase-id', phase.phaseId);

    // Build Phase Header
    let outcomeHtml = '';
    if (phase.outcome) {
      outcomeHtml = `<span class="badge diff-medium" style="font-size: 0.72rem;">${escapeHtml(phase.outcome)}</span>`;
    }

    phaseCard.innerHTML = `
      <button type="button" class="phase-header-btn" data-toggle-phase="${phase.phaseId}">
        <div class="phase-header-left">
          <span class="phase-chevron">›</span>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span class="phase-title-text">${escapeHtml(phase.phaseTitle)}</span>
              ${phase.dayRange ? `<span class="badge badge-neutral" style="font-size: 0.72rem;">${escapeHtml(phase.dayRange)}</span>` : ''}
              ${outcomeHtml}
            </div>
          </div>
        </div>
        <div class="phase-header-right">
          <div class="phase-progress-info">
            <span class="phase-progress-text">${pDone} / ${pTotal} (${pPct}%)</span>
            <div class="phase-progress-mini-bar">
              <div class="progress-bar-inner ${pDone === pTotal && pTotal > 0 ? 'success' : ''}" style="width: ${pPct}%;"></div>
            </div>
          </div>
        </div>
      </button>

      <div class="phase-accordion-body">
        ${phase.skills ? `
          <div class="phase-meta-banner">
            ${phase.outcome ? `<div class="phase-meta-banner-top"><span class="phase-outcome-text">Outcome: ${escapeHtml(phase.outcome)}</span></div>` : ''}
            <div class="phase-skills-text"><strong>Skills Gained:</strong> ${escapeHtml(phase.skills)}</div>
          </div>
        ` : ''}

        <table class="course-lessons-table">
          <tbody>
            ${filteredLessons.map(lesson => {
              const diff = lesson.nextRevisionDate ? getDaysDifference(lesson.nextRevisionDate, todayStr) : null;
              let revBadgeHtml = '';

              if (!lesson.completed) {
                revBadgeHtml = `<span class="badge badge-neutral">Not Completed</span>`;
              } else if (lesson.status === 'Well Retained') {
                revBadgeHtml = `<span class="badge diff-easy">★ Well Retained</span>`;
              } else if (diff !== null) {
                if (diff < 0) {
                  revBadgeHtml = `<span class="schedule-due-tag tag-overdue">R${lesson.stage} Overdue (${Math.abs(diff)}d)</span>`;
                } else if (diff === 0) {
                  revBadgeHtml = `<span class="schedule-due-tag tag-due">R${lesson.stage} Due Today</span>`;
                } else {
                  revBadgeHtml = `<span class="schedule-due-tag tag-upcoming">R${lesson.stage} in ${diff}d (${formatDisplayDate(lesson.nextRevisionDate)})</span>`;
                }
              }

              const hasNotes = (lesson.notes || '').trim().length > 0;
              const historyCount = Array.isArray(lesson.history) ? lesson.history.length : 0;
              const isDueOrOverdue = lesson.completed && lesson.status !== 'Well Retained' && diff !== null && diff <= 0;

              return `
                <tr class="lesson-row ${lesson.completed ? 'completed' : ''}" data-lesson-id="${lesson.id}">
                  <td class="lesson-cell-check">
                    <input type="checkbox" class="custom-checkbox chk-lesson-completion" data-lesson-id="${lesson.id}" ${lesson.completed ? 'checked' : ''} title="Mark lesson completed independently">
                  </td>
                  <td class="lesson-cell-main">
                    <div class="lesson-title-line">
                      <span class="lesson-title-text">${escapeHtml(lesson.title)}</span>
                      ${lesson.dayRange ? `<span class="badge badge-neutral" style="font-size: 0.72rem;">${escapeHtml(lesson.dayRange)}</span>` : ''}
                      ${lesson.practicalDone ? `<span class="badge badge-practical-done" style="font-size: 0.7rem;">💻 Practical Done</span>` : ''}
                    </div>
                    <div class="lesson-meta-line">
                      ${lesson.completed ? `<span class="lesson-meta-item">Completed: ${formatDisplayDate(lesson.completedDate)}</span><span>•</span>` : ''}
                      <span class="lesson-meta-item">${revBadgeHtml}</span>
                      ${hasNotes ? `<span>•</span><span class="lesson-meta-item text-muted" title="${escapeHtml(lesson.notes)}">📝 Notes saved</span>` : ''}
                    </div>
                  </td>
                  <td class="lesson-cell-actions">
                    <div class="lesson-actions-wrap">
                      <button type="button" class="btn-practical-toggle ${lesson.practicalDone ? 'active' : ''}" data-lesson-id="${lesson.id}" title="Toggle hands-on practical coding completion">
                        ${lesson.practicalDone ? '✓ Practical' : '+ Practical'}
                      </button>
                      <button type="button" class="btn btn-secondary btn-sm btn-lesson-details" data-lesson-id="${lesson.id}" title="View lesson details & personal notes">
                        ${hasNotes ? 'Notes ✓' : 'Notes'}
                      </button>
                      <button type="button" class="btn btn-secondary btn-sm btn-lesson-history" data-lesson-id="${lesson.id}" title="View revision history (${historyCount})">
                        Hist (${historyCount})
                      </button>
                      ${lesson.completed && lesson.status !== 'Well Retained' ? `
                        <button type="button" class="btn btn-sm ${isDueOrOverdue ? 'btn-primary' : 'btn-secondary'} btn-lesson-revise" data-lesson-id="${lesson.id}" title="Revise this concept now">
                          Revise R${lesson.stage || 1} →
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.appendChild(phaseCard);
  });

  // Meta count & filter summary
  const tableCountEl = document.getElementById('course-table-count');
  if (tableCountEl) {
    tableCountEl.textContent = `Showing ${visibleLessonsCount} of ${totalLessons} lessons`;
  }
  const filterSummaryEl = document.getElementById('course-filter-summary');
  if (filterSummaryEl) {
    const parts = [];
    if (phaseFilter !== 'ALL') parts.push(`Phase ${phaseFilter}`);
    if (statusFilter !== 'ALL') parts.push(`Status: ${statusFilter}`);
    if (searchQ) parts.push(`Search: "${searchQ}"`);
    filterSummaryEl.textContent = parts.length > 0 ? parts.join(', ') : 'No filters applied';
  }
}

/**
 * Render Section 3: Revision Queue (Unified DSA + Course Concepts)
 */
function renderRevisionQueue() {
  const uQueue = getUnifiedRevisionQueue();
  const todayStr = uQueue.todayStr;

  // 1. Update Category Filter Buttons Active State & Counts
  document.querySelectorAll('.category-pill-btn').forEach(btn => {
    const cat = btn.getAttribute('data-queue-cat');
    btn.classList.toggle('active', cat === AppState.currentQueueCategory);
  });
  const bAll = document.getElementById('badge-cat-all');
  const bDsa = document.getElementById('badge-cat-dsa');
  const bCourse = document.getElementById('badge-cat-course');
  if (bAll) bAll.textContent = uQueue.counts.all;
  if (bDsa) bDsa.textContent = uQueue.counts.dsa;
  if (bCourse) bCourse.textContent = uQueue.counts.course;

  // 2. Banner counts (for currently filtered items)
  document.getElementById('queue-banner-due-count').textContent = uQueue.due.length;
  document.getElementById('queue-banner-overdue-count').textContent = uQueue.overdue.length;
  document.getElementById('queue-banner-upcoming-count').textContent = uQueue.upcoming.length;
  const bannerRetained = document.getElementById('queue-banner-retained-count');
  if (bannerRetained) bannerRetained.textContent = uQueue.retained.length;

  // 3. Sub-tab counts
  document.getElementById('badge-due-count').textContent = uQueue.due.length;
  document.getElementById('badge-overdue-count').textContent = uQueue.overdue.length;
  document.getElementById('badge-upcoming-count').textContent = uQueue.upcoming.length;
  const badgeRetained = document.getElementById('badge-retained-count');
  if (badgeRetained) badgeRetained.textContent = uQueue.retained.length;

  // Highlight active sub-tab
  document.querySelectorAll('.queue-nav-tabs .sub-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-queue-group') === AppState.currentQueueFilter);
  });

  const container = document.getElementById('queue-cards-container');
  const emptyState = document.getElementById('queue-empty-state');
  if (!container) return;

  container.innerHTML = '';

  let activeList = [];
  if (AppState.currentQueueFilter === 'due') {
    activeList = uQueue.due;
  } else if (AppState.currentQueueFilter === 'overdue') {
    activeList = uQueue.overdue;
  } else if (AppState.currentQueueFilter === 'upcoming') {
    activeList = uQueue.upcoming;
  } else if (AppState.currentQueueFilter === 'retained') {
    activeList = uQueue.retained;
  }

  if (activeList.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  } else {
    if (emptyState) emptyState.style.display = 'none';
  }

  activeList.forEach(wrapper => {
    const card = document.createElement('div');
    card.className = 'queue-card';

    if (wrapper.type === 'dsa') {
      const prob = wrapper.data;
      const diff = prob.nextRevisionDate ? getDaysDifference(prob.nextRevisionDate, todayStr) : null;
      let dueTagHtml = '';
      if (prob.status === 'Well Retained') {
        dueTagHtml = `<span class="badge diff-easy">★ Well Retained</span>`;
      } else if (diff !== null) {
        if (diff < 0) {
          dueTagHtml = `<span class="schedule-due-tag tag-overdue">${Math.abs(diff)}d overdue</span>`;
        } else if (diff === 0) {
          dueTagHtml = `<span class="schedule-due-tag tag-due">Due Today</span>`;
        } else {
          dueTagHtml = `<span class="schedule-due-tag tag-upcoming">In ${diff}d (${formatDisplayDate(prob.nextRevisionDate)})</span>`;
        }
      }

      card.innerHTML = `
        <div class="queue-card-top">
          <div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap;">
              <span class="pillar-tag dsa-tag" style="font-size: 0.7rem; padding: 1px 6px;">DSA Problem</span>
              <span class="badge badge-neutral">${escapeHtml(prob.topic)}</span>
              <span class="badge ${getDifficultyBadgeClass(prob.difficulty)}">${prob.difficulty}</span>
              <span class="badge badge-neutral">${escapeHtml(prob.platform || 'LeetCode')}</span>
            </div>
            <div class="queue-card-title">${escapeHtml(prob.title)}</div>
          </div>
        </div>

        <div class="queue-card-meta">
          <div><strong>Solved Date:</strong> ${formatDisplayDate(prob.solvedDate)}</div>
          <div><strong>Scheduled Stage:</strong> Revision ${prob.stage || 1} (${SP_INTERVALS[prob.stage || 1] || 1}d interval)</div>
          <div><strong>Scheduled Date:</strong> ${formatDisplayDate(prob.nextRevisionDate)}</div>
        </div>

        <div class="queue-card-footer">
          ${dueTagHtml}
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm btn-queue-details" data-id="${prob.id}">Details</button>
            ${prob.status !== 'Well Retained' ? `<button class="btn btn-primary btn-sm btn-queue-revise" data-id="${prob.id}">Revise Now →</button>` : ''}
          </div>
        </div>
      `;
    } else {
      // Course Concept Card
      const lesson = wrapper.data;
      const diff = lesson.nextRevisionDate ? getDaysDifference(lesson.nextRevisionDate, todayStr) : null;
      let dueTagHtml = '';
      if (lesson.status === 'Well Retained') {
        dueTagHtml = `<span class="badge diff-easy">★ Well Retained</span>`;
      } else if (diff !== null) {
        if (diff < 0) {
          dueTagHtml = `<span class="schedule-due-tag tag-overdue">R${lesson.stage} Overdue (${Math.abs(diff)}d)</span>`;
        } else if (diff === 0) {
          dueTagHtml = `<span class="schedule-due-tag tag-due">R${lesson.stage} Due Today</span>`;
        } else {
          dueTagHtml = `<span class="schedule-due-tag tag-upcoming">R${lesson.stage} in ${diff}d (${formatDisplayDate(lesson.nextRevisionDate)})</span>`;
        }
      }

      card.innerHTML = `
        <div class="queue-card-top">
          <div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap;">
              <span class="pillar-tag java-tag" style="font-size: 0.7rem; padding: 1px 6px;">Java / Spring Boot</span>
              <span class="badge badge-neutral">Phase ${lesson.phaseNumber || 1}</span>
              ${lesson.dayRange ? `<span class="badge badge-neutral">${escapeHtml(lesson.dayRange)}</span>` : ''}
              ${lesson.practicalDone ? `<span class="badge badge-practical-done" style="font-size: 0.7rem;">💻 Practical Done</span>` : ''}
            </div>
            <div class="queue-card-title">${escapeHtml(lesson.title)}</div>
          </div>
        </div>

        <div class="queue-card-meta">
          <div><strong>Completed Date:</strong> ${formatDisplayDate(lesson.completedDate)}</div>
          <div><strong>Revision Stage:</strong> Revision ${lesson.stage || 1} of 3 (${COURSE_SP_INTERVALS[lesson.stage || 1] || 1}d interval)</div>
          <div><strong>Scheduled Date:</strong> ${formatDisplayDate(lesson.nextRevisionDate)}</div>
        </div>

        <div class="queue-card-footer">
          ${dueTagHtml}
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm btn-queue-concept-details" data-id="${lesson.id}">Details / Notes</button>
            ${lesson.status !== 'Well Retained' ? `<button class="btn btn-primary btn-sm btn-queue-concept-revise" data-id="${lesson.id}">Revise Concept →</button>` : ''}
          </div>
        </div>
      `;
    }

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

  // Update Pillar 2 EmbarkX Course Progress Bar & Stat
  const completedLessons = AppState.courseLessons.filter(l => l.completed).length;
  const totalCourseLessons = AppState.courseLessons.length || 50;
  const coursePct = totalCourseLessons > 0 ? Math.round((completedLessons / totalCourseLessons) * 100) : 0;
  const courseStatText = document.getElementById('pillar-course-stat-text');
  const courseMiniBar = document.getElementById('pillar-course-mini-bar');
  if (courseStatText) {
    courseStatText.textContent = `${completedLessons} / ${totalCourseLessons} Lessons Completed (${coursePct}%)`;
  }
  if (courseMiniBar) {
    courseMiniBar.style.width = `${coursePct}%`;
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

// =============================================================================
// 7.1 COURSE CONCEPT MODALS (REVISE & DETAILS)
// =============================================================================

function openConceptReviseModal(lessonId) {
  const lesson = AppState.courseLessons.find(l => l.id === lessonId);
  if (!lesson) return;

  AppState.activeLessonForRevision = lesson;

  const modal = document.getElementById('modal-concept-revise');
  if (!modal) return;

  document.getElementById('concept-revise-lesson-id').value = lesson.id;
  document.getElementById('concept-revise-title').textContent = lesson.title;
  document.getElementById('concept-revise-phase-badge').textContent = `Phase ${lesson.phaseNumber || 1}`;
  document.getElementById('concept-revise-day-badge').textContent = lesson.dayRange || 'Day N/A';
  document.getElementById('concept-revise-stage-badge').textContent = `Revision ${lesson.stage || 1}`;

  const practicalBadge = document.getElementById('concept-revise-practical-badge');
  if (practicalBadge) {
    practicalBadge.textContent = lesson.practicalDone ? '💻 Practical Done' : 'Practical Pending';
    practicalBadge.className = `badge ${lesson.practicalDone ? 'badge-practical-done' : 'badge-neutral'}`;
  }

  // Spaced recall interval description
  const intervalDescEl = document.getElementById('concept-revise-interval-desc');
  if (intervalDescEl) {
    if (lesson.stage === 1) {
      intervalDescEl.innerHTML = `<strong>R1 (1-Day Interval):</strong> Recall and reconstruct key architectural concepts & annotations 1 day after learning.<br>Completing this schedules <strong>R2 in 3 days</strong>.`;
    } else if (lesson.stage === 2) {
      intervalDescEl.innerHTML = `<strong>R2 (3-Day Interval):</strong> Consolidate concept retention and verify hands-on execution.<br>Completing this schedules <strong>R3 in 7 days</strong>.`;
    } else if (lesson.stage >= 3) {
      intervalDescEl.innerHTML = `<strong>R3 (7-Day Interval):</strong> Final spaced recall verification.<br>Completing this marks the concept <strong>Well Retained</strong>!`;
    }
  }

  // Saved lesson notes
  const notesBox = document.getElementById('concept-revise-notes-box');
  const notesText = document.getElementById('concept-revise-notes-text');
  if (notesBox && notesText) {
    if ((lesson.notes || '').trim()) {
      notesText.textContent = lesson.notes;
      notesBox.style.display = 'block';
    } else {
      notesBox.style.display = 'none';
    }
  }

  const logNotesInput = document.getElementById('concept-revise-log-notes');
  if (logNotesInput) logNotesInput.value = '';

  modal.style.display = 'flex';
}

function closeConceptReviseModal() {
  const modal = document.getElementById('modal-concept-revise');
  if (modal) modal.style.display = 'none';
  AppState.activeLessonForRevision = null;
}

function openConceptDetailsModal(lessonId) {
  const lesson = AppState.courseLessons.find(l => l.id === lessonId);
  if (!lesson) return;

  AppState.activeLessonForDetails = lesson;

  const modal = document.getElementById('modal-concept-details');
  if (!modal) return;

  document.getElementById('concept-details-lesson-id').value = lesson.id;
  document.getElementById('concept-details-phase-pretitle').textContent = lesson.phaseTitle || `Phase ${lesson.phaseNumber || 1}`;
  document.getElementById('concept-details-title').textContent = lesson.title;

  document.getElementById('concept-details-phase').textContent = `Phase ${lesson.phaseNumber || 1}`;
  document.getElementById('concept-details-day').textContent = lesson.dayRange || 'N/A';
  document.getElementById('concept-details-status').textContent = lesson.status || (lesson.completed ? 'Completed' : 'Pending');
  document.getElementById('concept-details-date').textContent = lesson.completedDate ? formatDisplayDate(lesson.completedDate) : 'Not completed';
  document.getElementById('concept-details-practical').textContent = lesson.practicalDone ? 'Done (Practical Code Completed)' : 'Pending';

  const todayStr = getTodayDateString();
  let nextRevText = 'N/A';
  if (lesson.status === 'Well Retained') {
    nextRevText = 'Well Retained (Passed R1, R2, R3)';
  } else if (lesson.nextRevisionDate) {
    const diff = getDaysDifference(lesson.nextRevisionDate, todayStr);
    if (diff < 0) {
      nextRevText = `${formatDisplayDate(lesson.nextRevisionDate)} (Overdue by ${Math.abs(diff)}d)`;
    } else if (diff === 0) {
      nextRevText = `${formatDisplayDate(lesson.nextRevisionDate)} (Due Today)`;
    } else {
      nextRevText = `${formatDisplayDate(lesson.nextRevisionDate)} (in ${diff} days)`;
    }
  }
  document.getElementById('concept-details-next-rev').textContent = nextRevText;

  // Notes textarea
  const notesTextarea = document.getElementById('concept-details-notes-input');
  if (notesTextarea) {
    notesTextarea.value = lesson.notes || '';
  }
  const notesSaveStatus = document.getElementById('concept-notes-save-status');
  if (notesSaveStatus) {
    notesSaveStatus.textContent = 'Saved';
  }

  // Revision History Table
  const tbody = document.getElementById('concept-history-tbody');
  const countBadge = document.getElementById('concept-history-count');
  if (tbody) {
    tbody.innerHTML = '';
    const historyList = Array.isArray(lesson.history) ? lesson.history : [];
    if (countBadge) {
      countBadge.textContent = `${historyList.length} Revision${historyList.length === 1 ? '' : 's'}`;
    }

    if (historyList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 16px;">
            No revisions recorded yet for this lesson.
          </td>
        </tr>
      `;
    } else {
      historyList.forEach((entry, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-family: var(--font-mono); font-size: 0.8rem;">${formatDisplayDate(entry.revisionDate)}</td>
          <td><span class="badge badge-neutral">R${entry.revisionNumber || (idx + 1)}</span></td>
          <td><span class="badge diff-easy">${escapeHtml(entry.result || 'Completed')}</span></td>
          <td style="font-size: 0.82rem; color: var(--text-muted);">${entry.notes ? escapeHtml(entry.notes) : '<span class="text-muted">–</span>'}</td>
        `;
        tbody.appendChild(tr);
      });
    }
  }

  // Revise Now button in details modal
  const btnReviseNow = document.getElementById('btn-concept-details-revise-now');
  if (btnReviseNow) {
    if (lesson.completed && lesson.status !== 'Well Retained') {
      btnReviseNow.style.display = 'inline-block';
      btnReviseNow.textContent = `Revise R${lesson.stage || 1} Now →`;
    } else {
      btnReviseNow.style.display = 'none';
    }
  }

  modal.style.display = 'flex';
}

function closeConceptDetailsModal() {
  const modal = document.getElementById('modal-concept-details');
  if (modal) modal.style.display = 'none';
  AppState.activeLessonForDetails = null;
}

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
    version: 2,
    exportDate: new Date().toISOString(),
    system: 'Three Pillars Daily Tracker – DSA Spaced Repetition & EmbarkX Course Tracker',
    problems: AppState.problems,
    pillars: AppState.pillarsData,
    course: AppState.courseLessons
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
      let courseCount = 0;

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

      // Safe restore course data
      if (Array.isArray(imported.course)) {
        const importedCourseMap = {};
        imported.course.forEach(item => {
          if (item && item.id) importedCourseMap[item.id] = item;
        });
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
            courseCount++;
          }
        });
        saveCourseToStorage();
      }

      showBackupStatus(`Import complete! Restored ${problemsCount} problems, ${pillarsCount} daily logs, and ${courseCount} course lessons.`, 'success');
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
  if (tabName === 'course') renderCourseTracker();
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
  document.getElementById('btn-dash-open-course')?.addEventListener('click', () => switchTab('course'));
  document.getElementById('btn-pillar-open-course')?.addEventListener('click', () => switchTab('course'));

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

  // Dashboard Phase Progress Card Click Delegation
  document.getElementById('dash-course-phase-progress')?.addEventListener('click', (e) => {
    const item = e.target.closest('.phase-progress-item');
    if (item) {
      const phaseId = parseInt(item.getAttribute('data-phase-id'), 10);
      if (phaseId) {
        AppState.courseFilterPhase = String(phaseId);
        AppState.courseExpandedPhases[phaseId] = true;
        const phaseSelect = document.getElementById('course-filter-phase');
        if (phaseSelect) phaseSelect.value = String(phaseId);
        switchTab('course');
      }
    }
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
    const conceptReviseBtn = e.target.closest('.btn-dash-concept-revise');

    if (reviseBtn) {
      openReviseModal(reviseBtn.getAttribute('data-id'));
    } else if (conceptReviseBtn) {
      openConceptReviseModal(conceptReviseBtn.getAttribute('data-id'));
    }
  });

  // Queue Category Filter Buttons
  document.querySelectorAll('.category-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.currentQueueCategory = btn.getAttribute('data-queue-cat');
      renderRevisionQueue();
    });
  });

  // Queue Sub-Tabs
  document.querySelectorAll('.queue-nav-tabs .sub-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.queue-nav-tabs .sub-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      AppState.currentQueueFilter = tab.getAttribute('data-queue-group');
      renderRevisionQueue();
    });
  });

  // Delegate Queue Cards Revise & Details (DSA + Course Concept)
  document.getElementById('queue-cards-container')?.addEventListener('click', (e) => {
    const reviseBtn = e.target.closest('.btn-queue-revise');
    const detailsBtn = e.target.closest('.btn-queue-details');
    const conceptReviseBtn = e.target.closest('.btn-queue-concept-revise');
    const conceptDetailsBtn = e.target.closest('.btn-queue-concept-details');

    if (reviseBtn) {
      openReviseModal(reviseBtn.getAttribute('data-id'));
    } else if (detailsBtn) {
      openDetailsModal(detailsBtn.getAttribute('data-id'));
    } else if (conceptReviseBtn) {
      openConceptReviseModal(conceptReviseBtn.getAttribute('data-id'));
    } else if (conceptDetailsBtn) {
      openConceptDetailsModal(conceptDetailsBtn.getAttribute('data-id'));
    }
  });

  // Course Search & Filters
  const courseSearchInput = document.getElementById('course-search-input');
  const btnClearCourseSearch = document.getElementById('btn-clear-course-search');

  courseSearchInput?.addEventListener('input', (e) => {
    AppState.courseSearchQuery = e.target.value.trim();
    if (btnClearCourseSearch) btnClearCourseSearch.style.display = AppState.courseSearchQuery ? 'block' : 'none';
    renderCourseTracker();
  });

  btnClearCourseSearch?.addEventListener('click', () => {
    if (courseSearchInput) courseSearchInput.value = '';
    AppState.courseSearchQuery = '';
    btnClearCourseSearch.style.display = 'none';
    renderCourseTracker();
  });

  const courseFilterPhase = document.getElementById('course-filter-phase');
  courseFilterPhase?.addEventListener('change', (e) => {
    AppState.courseFilterPhase = e.target.value;
    renderCourseTracker();
  });

  const courseFilterStatus = document.getElementById('course-filter-status');
  courseFilterStatus?.addEventListener('change', (e) => {
    AppState.courseFilterStatus = e.target.value;
    renderCourseTracker();
  });

  document.getElementById('btn-reset-course-filters')?.addEventListener('click', () => {
    if (courseSearchInput) courseSearchInput.value = '';
    if (btnClearCourseSearch) btnClearCourseSearch.style.display = 'none';
    if (courseFilterPhase) courseFilterPhase.value = 'ALL';
    if (courseFilterStatus) courseFilterStatus.value = 'ALL';

    AppState.courseSearchQuery = '';
    AppState.courseFilterPhase = 'ALL';
    AppState.courseFilterStatus = 'ALL';

    renderCourseTracker();
  });

  document.getElementById('btn-course-expand-all')?.addEventListener('click', () => {
    EMBARKX_COURSE_TEMPLATE.forEach(p => {
      AppState.courseExpandedPhases[p.phaseId] = true;
    });
    renderCourseTracker();
  });

  document.getElementById('btn-course-collapse-all')?.addEventListener('click', () => {
    AppState.courseExpandedPhases = {};
    renderCourseTracker();
  });

  // Course Phases Accordion & Lesson Actions Delegation
  document.getElementById('course-phases-container')?.addEventListener('click', (e) => {
    const headerBtn = e.target.closest('[data-toggle-phase]');
    const practicalBtn = e.target.closest('.btn-practical-toggle');
    const detailsBtn = e.target.closest('.btn-lesson-details');
    const historyBtn = e.target.closest('.btn-lesson-history');
    const reviseBtn = e.target.closest('.btn-lesson-revise');

    if (headerBtn) {
      const phaseId = parseInt(headerBtn.getAttribute('data-toggle-phase'), 10);
      AppState.courseExpandedPhases[phaseId] = !AppState.courseExpandedPhases[phaseId];
      const card = headerBtn.closest('.phase-accordion-card');
      if (card) card.classList.toggle('open', !!AppState.courseExpandedPhases[phaseId]);
    } else if (practicalBtn) {
      e.stopPropagation();
      const lessonId = practicalBtn.getAttribute('data-lesson-id');
      toggleLessonPractical(lessonId);
    } else if (detailsBtn) {
      e.stopPropagation();
      const lessonId = detailsBtn.getAttribute('data-lesson-id');
      openConceptDetailsModal(lessonId);
    } else if (historyBtn) {
      e.stopPropagation();
      const lessonId = historyBtn.getAttribute('data-lesson-id');
      openConceptDetailsModal(lessonId);
    } else if (reviseBtn) {
      e.stopPropagation();
      const lessonId = reviseBtn.getAttribute('data-lesson-id');
      openConceptReviseModal(lessonId);
    }
  });

  document.getElementById('course-phases-container')?.addEventListener('change', (e) => {
    const chk = e.target.closest('.chk-lesson-completion');
    if (chk) {
      const lessonId = chk.getAttribute('data-lesson-id');
      toggleLessonCompletion(lessonId, chk.checked);
    }
  });

  // Concept Revision Modal Handlers
  document.getElementById('btn-close-concept-revise')?.addEventListener('click', closeConceptReviseModal);
  document.getElementById('btn-cancel-concept-revise')?.addEventListener('click', closeConceptReviseModal);
  document.getElementById('btn-submit-concept-revise')?.addEventListener('click', () => {
    const lessonId = document.getElementById('concept-revise-lesson-id').value;
    const notes = document.getElementById('concept-revise-log-notes').value;
    if (lessonId) {
      recordConceptRevision(lessonId, notes);
      closeConceptReviseModal();
    }
  });

  // Concept Details Modal Handlers
  document.getElementById('btn-close-concept-details')?.addEventListener('click', closeConceptDetailsModal);
  document.getElementById('btn-concept-details-save-notes')?.addEventListener('click', () => {
    const lessonId = document.getElementById('concept-details-lesson-id').value;
    const notes = document.getElementById('concept-details-notes-input').value;
    if (lessonId) {
      saveLessonNotes(lessonId, notes);
      const saveStatus = document.getElementById('concept-notes-save-status');
      if (saveStatus) {
        saveStatus.textContent = 'Saved!';
        setTimeout(() => { saveStatus.textContent = 'Saved'; }, 1500);
      }
      refreshUI();
    }
  });
  document.getElementById('btn-concept-details-revise-now')?.addEventListener('click', () => {
    const lessonId = document.getElementById('concept-details-lesson-id').value;
    if (lessonId) {
      closeConceptDetailsModal();
      openConceptReviseModal(lessonId);
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
