// ============================================================
// CLASS PRACTICE TEST — Configuration Flow
// ============================================================

// ============================================================
// CURRICULUM — derived from the loaded question bank
// ============================================================
// Structure:
//   CURRICULUM = {
//     computerScience: {
//       name: "Computer Science",
//       emoji: "💻",
//       topics: ["Computer Ethics", "Word Processing", "Applications of ICT"]
//     },
//     ...
//   }

const CURRICULUM = {};

// Subject metadata — cosmetic only.
// The KEY must match the slug you use in `QUESTION_FILES` below.
const SUBJECT_META = {
    computerScience: {
        name: "Computer Science",
        emoji: "💻"
    }
    // Add more subjects here as you add more JSON files:
    // mathematics:  { name: "Mathematics",       emoji: "📐" },
    // english:      { name: "English Language",  emoji: "📖" },
    // physics:      { name: "Physics",           emoji: "⚛️" },
    // chemistry:    { name: "Chemistry",         emoji: "🧪" },
    // biology:      { name: "Biology",           emoji: "🧬" },
    // economics:    { name: "Economics",         emoji: "📊" }
};

// Which JSON files to load, mapped by subject key.
// To add a new subject: drop a JSON file into data/ and add a line here.
const QUESTION_FILES = {
    computerScience: 'data/computer-science.json'
    // mathematics:  'data/mathematics.json',
    // english:      'data/english.json',
    // ...
};

// Loaded per-subject question banks.
//   QUESTION_BANKS = {
//     computerScience: { "Computer Ethics": [...], "Word Processing": [...], ... },
//     ...
//   }
const QUESTION_BANKS = {};

// Active subject's topic → questions map.
// Kept as a live reference so `buildPracticeQuestions()` works unchanged.
let QUESTION_BANK = {};

// Track loading state.
const QuestionBankState = {
    loaded: false,
    error: null
};


// ------------------------------------------------------------
// 2. APPLICATION STATE
// ------------------------------------------------------------
const AppState = {
    mode: null,             // "class" | "individual"
    subjectKey: null,       // e.g. "mathematics"
    selectedTopics: {}      // { topicName: questionCount }
};

// ------------------------------------------------------------
// 3. SCREEN NAVIGATION
// ------------------------------------------------------------
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.toggle('active', screen.id === screenId);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ------------------------------------------------------------
// 4. FLOW — WELCOME → MODE
// ------------------------------------------------------------
document.getElementById('beginBtn').addEventListener('click', () => {
    showScreen('modeScreen');
});



// ------------------------------------------------------------
// 6. RENDER SUBJECTS
// ------------------------------------------------------------
function renderSubjects() {
    const grid = document.getElementById('subjectGrid');
    grid.innerHTML = '';

    Object.entries(CURRICULUM).forEach(([key, subject]) => {
        const btn = document.createElement('button');
        btn.className = 'subject-card';
        btn.innerHTML = `
            <span class="subject-emoji">${subject.emoji}</span>
            <span class="subject-name">${subject.name}</span>
        `;
        btn.addEventListener('click', () => {
    AppState.subjectKey = key;
    AppState.selectedTopics = {};

    // Point QUESTION_BANK at the chosen subject's topics
    QUESTION_BANK = QUESTION_BANKS[key] || {};

    renderTopics();
    showScreen('topicScreen');
});
        grid.appendChild(btn);
    });
}

// ------------------------------------------------------------
// 7. RENDER TOPICS (with per-topic question count)
// ------------------------------------------------------------
function renderTopics() {
    const subject = CURRICULUM[AppState.subjectKey];
    document.getElementById('topicScreenTitle').textContent =
        `Choose ${subject.name} Topics`;

    const list = document.getElementById('topicList');
    list.innerHTML = '';

    subject.topics.forEach(topic => {
        const row = document.createElement('div');
        row.className = 'topic-row';
        row.innerHTML = `
            <div class="topic-left">
                <div class="custom-check"></div>
                <span class="topic-name">${topic}</span>
            </div>
            <div class="topic-count-wrap">
                <label>Questions</label>
                <input type="number" min="1" max="100" value="5" class="topic-count-input">
            </div>
        `;

        const countWrap = row.querySelector('.topic-count-wrap');
        const countInput = row.querySelector('.topic-count-input');

        // Toggle selection
        row.addEventListener('click', (e) => {
            // Ignore clicks that originate inside the count input
            if (e.target === countInput) return;

            const isSelected = row.classList.toggle('selected');

            if (isSelected) {
                const val = parseInt(countInput.value, 10) || 5;
                AppState.selectedTopics[topic] = val;
                // Focus the input so the user can adjust right away
                setTimeout(() => countInput.focus(), 50);
            } else {
                delete AppState.selectedTopics[topic];
            }
            updateTopicTotal();
        });

        // Prevent count input clicks from toggling the row
        countWrap.addEventListener('click', (e) => e.stopPropagation());

        // Update count when the user types
        countInput.addEventListener('input', () => {
    const val = Math.max(1, Math.min(100, parseInt(countInput.value, 10) || 1));
    AppState.selectedTopics[topic] = val;
    updateTopicTotal();
});

countInput.addEventListener('blur', () => {
    const val = Math.max(1, Math.min(100, parseInt(countInput.value, 10) || 1));
    countInput.value = val;
    AppState.selectedTopics[topic] = val;
    updateTopicTotal();
});

        list.appendChild(row);
    });

    updateTopicTotal();
}

// ------------------------------------------------------------
// 8. UPDATE TOPIC TOTAL (live)
// ------------------------------------------------------------
// ------------------------------------------------------------
// UPDATE TOPIC TOTAL (live, with 20-question cap)
// ------------------------------------------------------------
const MAX_TOTAL_QUESTIONS = 20;

function updateTopicTotal() {
    const total = Object.values(AppState.selectedTopics)
        .reduce((sum, n) => sum + (parseInt(n, 10) || 0), 0);

    const totalEl = document.getElementById('topicTotalQuestions');
    const continueBtn = document.getElementById('continueToSummaryBtn');

    totalEl.textContent = total;

    // Visual feedback when over the cap
    const chip = totalEl.closest('.summary-chip');
    if (chip) {
        chip.classList.toggle('over-limit', total > MAX_TOTAL_QUESTIONS);
    }

    // Disable Continue when empty OR over the cap
    continueBtn.disabled =
        total === 0 || total > MAX_TOTAL_QUESTIONS;
}

// ------------------------------------------------------------
// 9. CONTINUE → SUMMARY SCREEN
// ------------------------------------------------------------
document.getElementById('continueToSummaryBtn')
    .addEventListener('click', () => {
        if (Object.keys(AppState.selectedTopics).length === 0) return;
        renderSummary();
        showScreen('summaryScreen');
    });

// ------------------------------------------------------------
// 10. RENDER SUMMARY
// ------------------------------------------------------------
function renderSummary() {
    const subject = CURRICULUM[AppState.subjectKey];
    const totalQuestions = Object.values(AppState.selectedTopics)
        .reduce((sum, n) => sum + (parseInt(n, 10) || 0), 0);

    // Rule: 1 question = 1.2 minutes (adjustable)
    const timeLimitSeconds = Math.round(totalQuestions * 72); // 72s per question
    const minutes = Math.floor(timeLimitSeconds / 60);
    const seconds = timeLimitSeconds % 60;

    const modeLabel = AppState.mode === 'class' ? 'Class' : 'Individual';

    const topicLines = Object.entries(AppState.selectedTopics)
        .map(([topic, count]) => `
            <div class="summary-topic-line">
                <span>${topic}</span>
                <strong>${count} question${count > 1 ? 's' : ''}</strong>
            </div>
        `)
        .join('');

    const card = document.getElementById('summaryCard');
    card.innerHTML = `
        <div class="summary-meta">
            <div class="summary-meta-item">
                <div class="label">Mode</div>
                <div class="value">${modeLabel}</div>
            </div>
            <div class="summary-meta-item">
                <div class="label">Subject</div>
                <div class="value">${subject.name}</div>
            </div>
            <div class="summary-meta-item">
                <div class="label">Duration</div>
                <div class="value">${minutes}m ${String(seconds).padStart(2, '0')}s</div>
            </div>
        </div>

        <div class="summary-topics-title">Topics & Questions</div>
        ${topicLines}

        <div class="summary-topics-title" style="margin-top:22px;">
            Total Questions
        </div>
        <div class="summary-meta-item">
            <div class="value" style="font-size:1.6rem; color:var(--navy);">
                ${totalQuestions}
            </div>
        </div>
    `;
}

// ------------------------------------------------------------
// 11. START PRACTICE (placeholder — next step)
// ------------------------------------------------------------
document.getElementById('startPracticeBtn')
    .addEventListener('click', () => {
        const sessionConfig = buildSessionConfig();
        startPracticeSession(sessionConfig);
    });

// ------------------------------------------------------------
// 12. BUILD SESSION CONFIG (handed to next step)
// ------------------------------------------------------------
function buildSessionConfig() {
    const totalQuestions = Object.values(AppState.selectedTopics)
        .reduce((sum, n) => sum + (parseInt(n, 10) || 0), 0);

    return {
        mode: AppState.mode,
        subjectKey: AppState.subjectKey,
        subjectName: CURRICULUM[AppState.subjectKey].name,
        topics: { ...AppState.selectedTopics }, // { topicName: count }
        totalQuestions,
        timeLimit: totalQuestions * 72   // seconds
    };
}

// ------------------------------------------------------------
// 13. BACK BUTTONS
// ------------------------------------------------------------
document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
        showScreen(btn.dataset.back);
    });
});

// ============================================================
// PRACTICE ENGINE
// ============================================================

// ============================================================
// QUESTION BANK — loaded from data/computer-science.json
// ============================================================

// Loaded question bank: { "Topic Name": [ {question objects...} ] }


// Track loading state so the UI can react if needed.


// ------------------------------------------------------------
// Load all question banks referenced in QUESTION_FILES.
// Builds CURRICULUM dynamically from each loaded JSON's metadata.
// Returns a Promise that resolves when everything is loaded.
// ------------------------------------------------------------
async function loadQuestionBank() {
    const subjectKeys = Object.keys(QUESTION_FILES);

    const results = await Promise.all(
        subjectKeys.map(async key => {
            try {
                const response = await fetch(QUESTION_FILES[key]);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();

                if (!data || !data.topics || typeof data.topics !== 'object') {
                    throw new Error('Missing "topics" object.');
                }

                // Validate
                for (const [topic, questions] of Object.entries(data.topics)) {
                    if (!Array.isArray(questions)) {
                        throw new Error(`Topic "${topic}" is not an array.`);
                    }
                    questions.forEach((q, i) => {
                        if (
                            typeof q.question !== 'string' ||
                            !Array.isArray(q.options) ||
                            typeof q.correct !== 'number'
                        ) {
                            throw new Error(`Invalid question at ${topic}[${i}].`);
                        }
                    });
                }

                return { key, ok: true, data };
            } catch (err) {
                return { key, ok: false, error: err };
            }
        })
    );

    let successCount = 0;
    let totalQuestions = 0;

    results.forEach(result => {
        const { key } = result;
        const meta = SUBJECT_META[key] || { name: key, emoji: "📚" };

        if (!result.ok) {
            console.error(`❌ Failed to load ${key}:`, result.error);
            return;
        }

        const data = result.data;
        const topics = data.topics;
        const topicNames = Object.keys(topics);

        // Save the bank for this subject
        QUESTION_BANKS[key] = topics;

        // Build the curriculum entry
        CURRICULUM[key] = {
            name: data.subject || meta.name,
            emoji: meta.emoji,
            topics: topicNames
        };

        successCount++;
        totalQuestions += Object.values(topics).reduce((s, arr) => s + arr.length, 0);
    });

    // Point QUESTION_BANK at the first successfully loaded subject.
    const firstKey = subjectKeys.find(k => QUESTION_BANKS[k]);
    if (firstKey) {
        QUESTION_BANK = QUESTION_BANKS[firstKey];
    }

    QuestionBankState.loaded = successCount > 0;
    QuestionBankState.error = successCount === 0 ? 'No subjects loaded.' : null;

    if (successCount > 0) {
        console.log(
            `✅ Loaded ${successCount} subject${successCount > 1 ? 's' : ''}, ` +
            `${totalQuestions} questions total.`
        );
    } else {
        alert(
            'Could not load any question bank.\n\n' +
            'Make sure you are running the app from a web server ' +
            '(not by opening the HTML file directly), and that your ' +
            'JSON files exist in the data/ folder.'
        );
    }

    return QUESTION_BANKS;
}

// ------------------------------------------------------------
// UTILITY: Random sampling without replacement (Fisher–Yates)
// ------------------------------------------------------------
function pickRandom(arr, count) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(count, copy.length));
}

// ------------------------------------------------------------
// UTILITY: Shuffle a question's options and remap `correct`
// ------------------------------------------------------------
function shuffleOptions(question) {
    if (!question.options || question.options.length < 2) return { ...question };

    const correctText = question.options[question.correct];
    const shuffled = [...question.options];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return {
        ...question,
        options: shuffled,
        correct: shuffled.indexOf(correctText)
    };
}

// ------------------------------------------------------------
// BUILD QUESTIONS FROM SESSION CONFIG
// ------------------------------------------------------------
// Rules:
//  - For each selected topic, randomly pick `count` questions.
//  - No repeats within a topic (Fisher–Yates).
//  - Shuffle the options of every picked question.
//  - Preserve explanation + source.
//  - Shuffle the final combined list so topics are interleaved.
// ------------------------------------------------------------
function buildPracticeQuestions(config) {
    const picked = [];

    Object.entries(config.topics).forEach(([topic, count]) => {
        const bank = QUESTION_BANK[topic] || [];

        console.log('🔍 Topic:', topic, '| Bank length:', bank.length, '| Want:', count);

        if (bank.length === 0) {
            for (let i = 0; i < count; i++) {
                picked.push({
                    topic,
                    q: `[No questions available for "${topic}" yet]`,
                    options: ["OK", "Skip", "Placeholder", "Placeholder"],
                    correct: 0,
                    explanation: null,
                    source: null
                });
            }
            return;
        }

        const chosen = pickRandom(bank, count);

        console.log('  🎯 First chosen raw item:', chosen[0]);

        chosen.forEach(source => {
            const shuffled = shuffleOptions(source);

            console.log('  ✨ After shuffleOptions:', shuffled);

            picked.push({
                topic,
                q: shuffled.question,
                options: shuffled.options,
                correct: shuffled.correct,
                explanation: shuffled.explanation || null,
                source: shuffled.source || null
            });
        });
    });

    return pickRandom(picked, picked.length);
}




// ------------------------------------------------------------
// PRACTICE SESSION STATE
// ------------------------------------------------------------
const PracticeState = {
    config: null,          // from buildSessionConfig()
    questions: [],         // [{ topic, q, options, correct }]
    answers: [],           // selected option index or null
    currentIndex: 0,
    timeRemaining: 0,
    timerId: null,
    isSubmitted: false
};





// Optional helper
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// ------------------------------------------------------------
// START PRACTICE
// ------------------------------------------------------------
function startPracticeSession(config) {
    console.log('🚀 Starting session. QUESTION_BANK =', QUESTION_BANK);
    console.log('📋 Config:', config);

    if (!QUESTION_BANK || Object.keys(QUESTION_BANK).length === 0) {
        alert('No questions loaded. Please try again.');
        return;
    }
  
    PracticeState.config = config;
    PracticeState.questions = buildPracticeQuestions(config);
    PracticeState.answers = new Array(PracticeState.questions.length).fill(null);
    PracticeState.currentIndex = 0;
    PracticeState.timeRemaining = config.timeLimit;
    PracticeState.isSubmitted = false;

    // Header info
    document.getElementById('practiceSubject').textContent = config.subjectName;
    document.getElementById('practiceModeBadge').textContent =
        config.mode === 'class' ? 'Class' : 'Individual';

    showScreen('practiceScreen');
    renderPracticeQuestion();
    startPracticeTimer();
    console.log(PracticeState.questions[3]);
}

// ------------------------------------------------------------
// RENDER CURRENT QUESTION
// ------------------------------------------------------------
function renderPracticeQuestion() {
    const required = [
        'questionTopicTag','questionSource','questionText','optionsList',
        'practiceCurrent','practiceTotal','progressFill',
        'practicePrevBtn','practiceNextBtn','practiceSubmitBtn','questionDots'
    ];
    const missing = required.filter(id => !document.getElementById(id));
    if (missing.length) {
        console.error('❌ Missing practice-screen elements:', missing);
        return;
    }
    // ...rest unchanged

    const idx = PracticeState.currentIndex;
    const q = PracticeState.questions[idx];
    if (!q) return;

    // Topic tag
document.getElementById('questionTopicTag').textContent = q.topic;

// Source badge (exam body + year) — hidden if not available
const sourceEl = document.getElementById('questionSource');
if (sourceEl) {
    if (q.source && q.source.body) {
        const yearPart = q.source.year ? ` ${q.source.year}` : '';
        sourceEl.textContent = `📌 ${q.source.body}${yearPart}`;
        sourceEl.style.display = 'inline-flex';
    } else {
        sourceEl.textContent = '';
        sourceEl.style.display = 'none';
    }
}
    

    // Question text
    document.getElementById('questionText').textContent = q.q;

    // Options
    const optionsList = document.getElementById('optionsList');
    optionsList.innerHTML = '';

    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-btn';
        if (PracticeState.answers[idx] === i) btn.classList.add('selected');

        btn.innerHTML = `
            <span class="option-letter">${String.fromCharCode(65 + i)}</span>
            <span>${opt}</span>
        `;

        btn.addEventListener('click', () => {
            PracticeState.answers[idx] = i;
            // Re-render just the option selection state
            optionsList.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            renderQuestionDots();
        });

        optionsList.appendChild(btn);
    });

    // Counter
    document.getElementById('practiceCurrent').textContent = idx + 1;
    document.getElementById('practiceTotal').textContent = PracticeState.questions.length;

    // Progress
    const progress = ((idx + 1) / PracticeState.questions.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';

    // Nav buttons
    document.getElementById('practicePrevBtn').disabled = idx === 0;

    const isLast = idx === PracticeState.questions.length - 1;
    document.getElementById('practiceNextBtn').style.display = isLast ? 'none' : 'inline-flex';
    document.getElementById('practiceSubmitBtn').style.display = isLast ? 'inline-flex' : 'none';

    renderQuestionDots();
}

// ------------------------------------------------------------
// QUESTION DOT NAVIGATOR
// ------------------------------------------------------------
function renderQuestionDots() {
    const dotsWrap = document.getElementById('questionDots');
    dotsWrap.innerHTML = '';

    PracticeState.questions.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'dot';
        if (PracticeState.answers[i] !== null) dot.classList.add('answered');
        if (i === PracticeState.currentIndex) dot.classList.add('current');
        dot.title = `Question ${i + 1}`;

        dot.addEventListener('click', () => {
            PracticeState.currentIndex = i;
            renderPracticeQuestion();
        });

        dotsWrap.appendChild(dot);
    });
}

// ------------------------------------------------------------
// NAVIGATION
// ------------------------------------------------------------
document.getElementById('practiceNextBtn').addEventListener('click', () => {
    if (PracticeState.currentIndex < PracticeState.questions.length - 1) {
        PracticeState.currentIndex++;
        renderPracticeQuestion();
    }
});

document.getElementById('practicePrevBtn').addEventListener('click', () => {
    if (PracticeState.currentIndex > 0) {
        PracticeState.currentIndex--;
        renderPracticeQuestion();
    }
});

// ------------------------------------------------------------
// TIMER
// ------------------------------------------------------------
function startPracticeTimer() {
    if (PracticeState.timerId) clearInterval(PracticeState.timerId);

    updateTimerDisplay();

    PracticeState.timerId = setInterval(() => {
        PracticeState.timeRemaining--;
        updateTimerDisplay();

        if (PracticeState.timeRemaining <= 0) {
            clearInterval(PracticeState.timerId);
            submitPractice(true); // auto-submit
        }
    }, 1000);
}

function updateTimerDisplay() {
    const el = document.getElementById('practiceTimer');
    const t = Math.max(0, PracticeState.timeRemaining);
    const m = Math.floor(t / 60);
    const s = t % 60;
    el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    if (t <= 60) {
        el.classList.add('warning');
    } else {
        el.classList.remove('warning');
    }
}

// ------------------------------------------------------------
// SUBMIT PRACTICE
// ------------------------------------------------------------
document.getElementById('practiceSubmitBtn').addEventListener('click', () => {
    submitPractice(false);
});

function submitPractice(autoSubmitted) {
    if (PracticeState.isSubmitted) return;
    PracticeState.isSubmitted = true;

    if (PracticeState.timerId) clearInterval(PracticeState.timerId);

    const unanswered = PracticeState.answers.filter(a => a === null).length;

    if (!autoSubmitted && unanswered > 0) {
        const ok = confirm(
            `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. ` +
            `Submit anyway?`
        );
        if (!ok) {
            PracticeState.isSubmitted = false;
            // Restart timer if it was cleared
            if (!PracticeState.timerId) startPracticeTimer();
            return;
        }
    }

    renderResults();
    showScreen('resultsScreen');
}

// ------------------------------------------------------------
// RESULTS
// ------------------------------------------------------------
function computeResults() {
    let correct = 0, wrong = 0, skipped = 0;

    PracticeState.questions.forEach((q, i) => {
        const ans = PracticeState.answers[i];
        if (ans === null) skipped++;
        else if (ans === q.correct) correct++;
        else wrong++;
    });

    const total = PracticeState.questions.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { total, correct, wrong, skipped, score };
}

function renderResults() {
    const r = computeResults();

    let message;
    if (r.score >= 80)      message = "Excellent work! 🌟";
    else if (r.score >= 60) message = "Good effort — keep practising!";
    else if (r.score >= 40) message = "Nice try. Review and try again!";
    else                    message = "Keep going — practice makes perfect!";

    const card = document.getElementById('resultsCard');
    card.innerHTML = `
        <div class="results-score-big">${r.score}%</div>
        <div class="results-score-label">Your Score</div>

        <div class="results-stats">
            <div class="results-stat correct">
                <div class="stat-num">${r.correct}</div>
                <div class="stat-label">Correct</div>
            </div>
            <div class="results-stat wrong">
                <div class="stat-num">${r.wrong}</div>
                <div class="stat-label">Wrong</div>
            </div>
            <div class="results-stat skipped">
                <div class="stat-num">${r.skipped}</div>
                <div class="stat-label">Skipped</div>
            </div>
        </div>

        <div class="results-message">${message}</div>
    `;
    
    // save session to history right after Rendering
    saveSessionToHistory()
}

// ------------------------------------------------------------
// REVIEW
// ------------------------------------------------------------

document.getElementById('resultsReviewBtn').addEventListener('click', () => {
    openReview(PracticeState.questions, PracticeState.answers, 'resultsScreen');
});

// ------------------------------------------------------------
// QUIT PRACTICE
// ------------------------------------------------------------
document.getElementById('quitPracticeBtn').addEventListener('click', () => {
    const ok = confirm('Quit this practice session? Your progress will be lost.');
    if (!ok) return;

    if (PracticeState.timerId) clearInterval(PracticeState.timerId);
    resetPracticeState();
    showScreen('summaryScreen');
});

// ------------------------------------------------------------
// NEW PRACTICE (from results)
// ------------------------------------------------------------
document.getElementById('resultsNewBtn').addEventListener('click', () => {
    resetPracticeState();
    // Reset config flow
    AppState.mode = null;
    AppState.subjectKey = null;
    AppState.selectedTopics = {};
    showScreen('welcomeScreen');
});

function resetPracticeState() {
    PracticeState.config = null;
    PracticeState.questions = [];
    PracticeState.answers = [];
    PracticeState.currentIndex = 0;
    PracticeState.timeRemaining = 0;
    PracticeState.isSubmitted = false;
    if (PracticeState.timerId) {
        clearInterval(PracticeState.timerId);
        PracticeState.timerId = null;
    }
}









// ------------------------------------------------------------
// 14. INITIALISE
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async() => {
    showScreen('welcomeScreen');
    
    // load question bank in the background
    await loadQuestionBank()
});

// ============================================================
// HISTORY / PAST RESULTS
// ============================================================

const HISTORY_KEY = 'cpt_history_v1';

// ------------------------------------------------------------
// 1. SAVE A COMPLETED SESSION
// ------------------------------------------------------------
function saveSessionToHistory() {
    const r = computeResults();

    const entry = {
        id: 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        date: new Date().toISOString(),

        // 👇 NEW: which user owns this entry (null for class mode)
        user: AppState.user ? {
            name: AppState.user.name,
            gender: AppState.user.gender,
            avatar: AppState.user.avatar
        } : null,

        mode: PracticeState.config.mode,
        subjectKey: PracticeState.config.subjectKey,
        subjectName: PracticeState.config.subjectName,
        topics: { ...PracticeState.config.topics },
        totalQuestions: r.total,
        correct: r.correct,
        wrong: r.wrong,
        skipped: r.skipped,
        score: r.score,
        timeLimitSeconds: PracticeState.config.timeLimit,
        // Store full snapshot for later review
        questions: PracticeState.questions.map((q, i) => ({
    topic: q.topic,
    q: q.q,
    options: [...q.options],
    correct: q.correct,
    explanation: q.explanation || null,   // ← add this
    userAnswer: PracticeState.answers[i]
}))
    };

    const all = loadHistory();
    all.unshift(entry); // newest first
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
    } catch (err) {
        console.error('Failed to save history:', err);
        alert('Could not save this result (storage may be full).');
    }
}

// ------------------------------------------------------------
// 2. LOAD HISTORY
// ------------------------------------------------------------
function loadHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error('Failed to load history:', err);
        return [];
    }
}

// ------------------------------------------------------------
// 3. DELETE / CLEAR
// ------------------------------------------------------------
function deleteHistoryEntry(id) {
    const all = loadHistory().filter(e => e.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
}

function clearAllHistory() {
    localStorage.removeItem(HISTORY_KEY);
}

// ------------------------------------------------------------
// 4. HOOK INTO SUBMIT — auto-save after results are shown
// ------------------------------------------------------------


// ------------------------------------------------------------
// 5. RENDER HISTORY LIST
// ------------------------------------------------------------
// ============================================================
// HISTORY FILTERING
// ============================================================

// Returns { type: 'user' | 'class' | 'all', label, user: {...} | null }
function getHistoryFilter() {
    if (AppState.user) {
        // Logged-in user → only their individual sessions
        return {
            type: 'user',
            label: `${AppState.user.name}'s Results`,
            user: AppState.user
        };
    }
    if (AppState.mode === 'class') {
        return {
            type: 'class',
            label: 'Class Results',
            user: null
        };
    }
    return {
        type: 'all',
        label: 'All Past Results',
        user: null
    };
}

// Apply the filter to the raw entries
function filterHistory(entries) {
    const f = getHistoryFilter();

    if (f.type === 'user') {
        const key = f.user.name.trim().toLowerCase();
        return entries.filter(e =>
            e.user &&
            e.user.name.trim().toLowerCase() === key &&
            e.mode === 'individual'
        );
    }

    if (f.type === 'class') {
        return entries.filter(e => e.mode === 'class');
    }

    return entries; // 'all'
}

// Builds the subtitle line under the "Past Results" heading
function buildHistorySubtitle(filter, totalCount, filteredCount) {
    if (filter.type === 'user') {
        if (filteredCount === 0) {
            return `No sessions saved for ${filter.user.name} yet.`;
        }
        return `${filteredCount} session${filteredCount > 1 ? 's' : ''} for ${filter.user.name}.`;
    }
    if (filter.type === 'class') {
        if (filteredCount === 0) {
            return 'No class sessions saved yet.';
        }
        return `${filteredCount} class session${filteredCount > 1 ? 's' : ''}.`;
    }
    return `Showing all ${totalCount} saved session${totalCount !== 1 ? 's' : ''}.`;
}

// Builds the empty-state markup
function buildHistoryEmptyState(filter, totalCount) {
    // Case 1: user view but they have nothing
    if (filter.type === 'user') {
        return `
            <div class="history-empty">
                <span class="emoji">📭</span>
                <h3>No results for ${escapeHtml(filter.user.name)} yet</h3>
                <p>Complete a practice session and it will show up here.</p>
            </div>
        `;
    }

    // Case 2: class view but no class results
    if (filter.type === 'class') {
        // If there ARE results but they're individual
        if (totalCount > 0) {
            return `
                <div class="history-empty">
                    <span class="emoji">👥</span>
                    <h3>No class sessions yet</h3>
                    <p>
                        There ${totalCount === 1 ? 'is' : 'are'} ${totalCount}
                        saved individual result${totalCount === 1 ? '' : 's'},
                        but nothing from Class mode.
                    </p>
                </div>
            `;
        }
        return `
            <div class="history-empty">
                <span class="emoji">📭</span>
                <h3>No class results yet</h3>
                <p>Complete a Class-mode session and it will show up here.</p>
            </div>
        `;
    }

    // Case 3: nothing at all
    return `
        <div class="history-empty">
            <span class="emoji">📭</span>
            <h3>No past results yet</h3>
            <p>Complete a practice session and it will show up here.</p>
        </div>
    `;
}





// ------------------------------------------------------------
// RENDER HISTORY LIST (filtered by context)
// ------------------------------------------------------------
function renderHistoryList() {
    const list = document.getElementById('historyList');
    const footer = document.getElementById('historyFooter');
    const headerTitle = document.querySelector('#historyScreen .screen-header h2');
    const headerSub = document.querySelector('#historyScreen .screen-sub');

    const all = loadHistory();
    const filter = getHistoryFilter();
    const entries = filterHistory(all);

    // Update header
    headerTitle.textContent = filter.label;
    headerSub.textContent = buildHistorySubtitle(filter, all.length, entries.length);

    // Empty state
    if (entries.length === 0) {
        list.innerHTML = buildHistoryEmptyState(filter, all.length);
        footer.style.display = 'none';
        return;
    }

    // Toggle "Clear All" visibility:
    // - If admin (all) → allow clearing everything
    // - If user → allow clearing their results
    // - If class → allow clearing class results
    footer.style.display = 'flex';
    const clearBtn = document.getElementById('clearHistoryBtn');
    clearBtn.textContent =
        filter.type === 'all'   ? 'Clear All History' :
        filter.type === 'user'  ? `Clear ${filter.user.name}'s Results` :
                                  'Clear Class Results';

    list.innerHTML = '';

    entries.forEach(entry => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'history-item';

        const d = new Date(entry.date);
        const dateStr = d.toLocaleDateString(undefined, {
            day: 'numeric', month: 'short', year: 'numeric'
        });
        const timeStr = d.toLocaleTimeString(undefined, {
            hour: '2-digit', minute: '2-digit'
        });

        const scoreClass = entry.score >= 70 ? 'high'
                         : entry.score >= 40 ? 'mid'
                         : 'low';

        const topicCount = Object.keys(entry.topics || {}).length;

        // Avatar column — shown when:
        //  - we're in "all" view (needs identifying), OR
        //  - the entry has a user (nice touch even in user view)
        let avatarHtml = '';
        if (entry.user && entry.user.avatar) {
            avatarHtml = `
                <img class="history-item-avatar"
                     src="${escapeHtml(entry.user.avatar)}"
                     alt="">
            `;
        } else {
            avatarHtml = `
                <div class="history-item-avatar history-item-avatar-class"
                     title="Class session">👥</div>
            `;
        }

        // Mode tag (only in "all" view — otherwise it's redundant)
        const modeTag = filter.type === 'all'
            ? `<span class="tag tag-${entry.mode}">${
                  entry.mode === 'class' ? '👥 Class' : '👤 Individual'
              }</span>`
            : '';

        // User name (only in "all" view and only if entry has a user)
        const userNameLine = (filter.type === 'all' && entry.user)
            ? `<span class="history-item-user">${escapeHtml(entry.user.name)}</span>`
            : '';

        btn.innerHTML = `
            ${avatarHtml}
            <div class="history-item-left">
                <div class="history-item-subject">${escapeHtml(entry.subjectName)}</div>
                <div class="history-item-meta">
                    ${userNameLine}
                    ${userNameLine ? '<span class="dot-sep">•</span>' : ''}
                    ${modeTag}
                    <span>${topicCount} topic${topicCount > 1 ? 's' : ''}</span>
                    <span class="dot-sep">•</span>
                    <span>${entry.totalQuestions} questions</span>
                    <span class="dot-sep">•</span>
                    <span>${dateStr} · ${timeStr}</span>
                </div>
            </div>
            <div class="history-item-right">
                <div class="history-score ${scoreClass}">${entry.score}%</div>
                <div class="history-arrow">›</div>
            </div>
        `;

        btn.addEventListener('click', () => {
            openHistoryDetail(entry.id);
        });

        list.appendChild(btn);
    });
}


// ------------------------------------------------------------
// 6. OPEN HISTORY DETAIL
// ------------------------------------------------------------
let _currentHistoryEntry = null;

function openHistoryDetail(id) {
    const entry = loadHistory().find(e => e.id === id);
    if (!entry) return;

    _currentHistoryEntry = entry;

    const d = new Date(entry.date);
    document.getElementById('historyDetailSub').textContent =
        `Completed on ${d.toLocaleDateString()} at ${d.toLocaleTimeString()}`;

    const topicLines = Object.entries(entry.topics || {})
        .map(([t, c]) => `
            <div class="summary-topic-line">
                <span>${escapeHtml(t)}</span>
                <strong>${c} question${c > 1 ? 's' : ''}</strong>
            </div>
        `).join('') || '<div class="summary-topic-line"><span>—</span></div>';

    const modeLabel = entry.mode === 'class' ? 'Class' : 'Individual';
    const minutes = Math.floor((entry.timeLimitSeconds || 0) / 60);
    const seconds = (entry.timeLimitSeconds || 0) % 60;

    const card = document.getElementById('historyDetailCard');
    card.innerHTML = `
        <div class="results-score-big">${entry.score}%</div>
        <div class="results-score-label">Score</div>

        <div class="results-stats">
            <div class="results-stat correct">
                <div class="stat-num">${entry.correct}</div>
                <div class="stat-label">Correct</div>
            </div>
            <div class="results-stat wrong">
                <div class="stat-num">${entry.wrong}</div>
                <div class="stat-label">Wrong</div>
            </div>
            <div class="results-stat skipped">
                <div class="stat-num">${entry.skipped}</div>
                <div class="stat-label">Skipped</div>
            </div>
        </div>

        <div class="history-detail-meta">
            <div class="meta-item">
                <div class="label">Mode</div>
                <div class="value">${modeLabel}</div>
            </div>
            <div class="meta-item">
                <div class="label">Subject</div>
                <div class="value">${escapeHtml(entry.subjectName)}</div>
            </div>
            <div class="meta-item">
                <div class="label">Duration</div>
                <div class="value">${minutes}m ${String(seconds).padStart(2, '0')}s</div>
            </div>
        </div>

        <div class="summary-topics-title" style="text-align:left;">Topics</div>
        ${topicLines}
    `;

    showScreen('historyDetailScreen');
}

// ------------------------------------------------------------
// 7b. REVIEW A HISTORY ENTRY (via the new review engine)
// ------------------------------------------------------------
document.getElementById('historyDetailReviewBtn')
    .addEventListener('click', () => {
        if (!_currentHistoryEntry) return;

        const entry = _currentHistoryEntry;

        // Reconstruct questions/answers from the stored snapshot
        const questions = entry.questions.map(q => ({
            topic: q.topic,
            q: q.q,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation || null   // may be undefined in older entries
        }));

        const answers = entry.questions.map(q =>
            (q.userAnswer === undefined ? null : q.userAnswer)
        );

        // Open the review, with return-to-history-detail as the back target
        openReview(questions, answers, 'historyDetailScreen');
    });

// ------------------------------------------------------------
// 7. REVIEW A HISTORY ENTRY (re-uses the review screen)
// ------------------------------------------------------------
// ============================================================
// REVIEW ENGINE — one card at a time, ordered for learning
// ============================================================

const ReviewState = {
    items: [],       // ordered review items
    index: 0,        // current position
    direction: 1     // 1 = forward, -1 = back
};

// Build the ordered review list from questions + answers.
// Order: wrong → correct → skipped
function buildReviewItems(questions, answers) {
    const enriched = questions.map((q, i) => {
        const userAns = answers[i];
        const isSkipped = userAns === null || userAns === undefined;
        const isCorrect = !isSkipped && userAns === q.correct;
        const outcome = isSkipped ? 'skipped'
                      : isCorrect ? 'correct'
                      : 'wrong';
        return {
    index: i,
    topic: q.topic,
    q: q.q,
    options: q.options,
    correct: q.correct,
    userAnswer: isSkipped ? null : userAns,
    explanation: q.explanation || null,
    source: q.source || null,          // ← add this
    outcome
};
    });

    const wrong     = enriched.filter(e => e.outcome === 'wrong');
    const correct   = enriched.filter(e => e.outcome === 'correct');
    const skipped   = enriched.filter(e => e.outcome === 'skipped');

    return [...wrong, ...correct, ...skipped];
}

// Open the review for a given set of questions + answers.
function openReview(questions, answers, returnScreenId) {
    ReviewState.items = buildReviewItems(questions, answers);
    ReviewState.index = 0;
    ReviewState.direction = 1;
    ReviewState.returnScreen = returnScreenId || 'resultsScreen';

    renderReviewProgress();
    renderReviewCard({ animate: 'slide-in-right' });
    updateReviewNav();
    showScreen('reviewScreen');
}

// ---- Rendering --------------------------------------------------

function renderReviewProgress() {
    const wrap = document.getElementById('reviewProgress');
    wrap.innerHTML = '';

    ReviewState.items.forEach((item, i) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = `review-pill ${item.outcome}`;
        if (i === ReviewState.index) pill.classList.add('current');
        pill.title = `Q${item.index + 1} — ${item.outcome}`;
        pill.addEventListener('click', () => {
            if (i === ReviewState.index) return;
            ReviewState.direction = i > ReviewState.index ? 1 : -1;
            ReviewState.index = i;
            renderReviewProgress();
            renderReviewCard({ animate: 'slide-in-right' });
            updateReviewNav();
        });
        wrap.appendChild(pill);
    });
}

function renderReviewCard({ animate } = {}) {
    const stage = document.getElementById('reviewStage');
    const item = ReviewState.items[ReviewState.index];

    // Short-circuit for edge case (should not happen)
    if (!item) {
        stage.innerHTML = '';
        return;
    }

    // Compose answer rows
    const answerRows = [];

    // Your answer
    if (item.outcome === 'skipped') {
        answerRows.push(`
            <div class="review-answer your-skipped">
                <div class="answer-label">Your answer</div>
                <div class="answer-text">Not answered</div>
            </div>
        `);
        answerRows.push(`
            <div class="review-answer correct-answer">
                <div class="answer-label">Correct answer</div>
                <div class="answer-text">${escapeHtml(item.options[item.correct])}</div>
            </div>
        `);
    } else if (item.outcome === 'correct') {
        answerRows.push(`
            <div class="review-answer your-correct">
                <div class="answer-label">Your answer</div>
                <div class="answer-text">${escapeHtml(item.options[item.userAnswer])}</div>
            </div>
        `);
    } else {
        // wrong
        answerRows.push(`
            <div class="review-answer your-wrong">
                <div class="answer-label">Your answer</div>
                <div class="answer-text">${escapeHtml(item.options[item.userAnswer])}</div>
            </div>
        `);
        answerRows.push(`
            <div class="review-answer correct-answer">
                <div class="answer-label">Correct answer</div>
                <div class="answer-text">${escapeHtml(item.options[item.correct])}</div>
            </div>
        `);
    }

    // Explanation block — use provided text, or a kind fallback
    const explanationText = item.explanation
        ? item.explanation
        : (item.outcome === 'correct'
            ? `You got this one right. Well done.`
            : `Review this topic carefully — the correct answer is shown above.`);

    // Outcome badge
    const badge = item.outcome === 'wrong'   ? 'Needs review'
                : item.outcome === 'correct' ? 'Correct ✓'
                :                              'Skipped';

    // Build card
    const card = document.createElement('div');
    card.className = `review-card outcome-${item.outcome} ${animate || ''}`;
    // Build source label (if present)
const sourceLabel = (item.source && item.source.body)
    ? `<span class="review-source">📌 ${escapeHtml(item.source.body)}${item.source.year ? ' ' + escapeHtml(item.source.year) : ''}</span>`
    : '';

card.innerHTML = `
    <div class="review-card-top">
        <span class="review-card-topic">${escapeHtml(item.topic)}</span>
        <div class="review-card-top-right">
            ${sourceLabel}
            <span class="review-outcome-badge ${item.outcome}">${badge}</span>
        </div>
    </div>
    

        <div class="review-card-question">
            <span class="review-q-number">Q${item.index + 1}.</span>
            ${escapeHtml(item.q)}
        </div>

        <div class="review-answers">
            ${answerRows.join('')}
        </div>

        <div class="review-explanation">
            <span class="review-explanation-label">Explanation</span>
            ${escapeHtml(explanationText)}
        </div>
    `;

    // Swap in (slide animation is CSS-driven)
    stage.innerHTML = '';
    stage.appendChild(card);
}

function updateReviewNav() {
    const total = ReviewState.items.length;
    document.getElementById('reviewCurrent').textContent = ReviewState.index + 1;
    document.getElementById('reviewTotal').textContent = total;

    document.getElementById('reviewPrevBtn').disabled = ReviewState.index === 0;
    document.getElementById('reviewNextBtn').disabled = ReviewState.index === total - 1;
}

// ---- Navigation -------------------------------------------------

document.getElementById('reviewPrevBtn').addEventListener('click', () => {
    if (ReviewState.index === 0) return;
    ReviewState.index--;
    renderReviewProgress();
    renderReviewCard({ animate: 'slide-in-right' });
    updateReviewNav();
});

document.getElementById('reviewNextBtn').addEventListener('click', () => {
    if (ReviewState.index >= ReviewState.items.length - 1) return;
    ReviewState.index++;
    renderReviewProgress();
    renderReviewCard({ animate: 'slide-in-right' });
    updateReviewNav();
});

// ---- Back button ------------------------------------------------

document.getElementById('reviewBackBtn').addEventListener('click', () => {
    showScreen(ReviewState.returnScreen || 'resultsScreen');
});

// ------------------------------------------------------------
// 8. DELETE CURRENT ENTRY FROM DETAIL VIEW
// ------------------------------------------------------------
document.getElementById('historyDetailDeleteBtn')
    .addEventListener('click', () => {
        if (!_currentHistoryEntry) return;
        const ok = confirm('Delete this result permanently?');
        if (!ok) return;

        deleteHistoryEntry(_currentHistoryEntry.id);
        _currentHistoryEntry = null;
        renderHistoryList();
        showScreen('historyScreen');
    });

// ------------------------------------------------------------
// 9. CLEAR ALL FROM LIST VIEW
// ------------------------------------------------------------
document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    const filter = getHistoryFilter();

    let confirmMsg = 'This will permanently delete ALL saved practice results. Continue?';
    if (filter.type === 'user') {
        confirmMsg = `Delete all of ${filter.user.name}'s saved results?`;
    } else if (filter.type === 'class') {
        confirmMsg = 'Delete all saved Class-mode results?';
    }

    const ok = confirm(confirmMsg);
    if (!ok) return;

    const all = loadHistory();

    if (filter.type === 'user') {
        const key = filter.user.name.trim().toLowerCase();
        const kept = all.filter(e =>
            !(e.user && e.user.name.trim().toLowerCase() === key && e.mode === 'individual')
        );
        localStorage.setItem(HISTORY_KEY, JSON.stringify(kept));
    } else if (filter.type === 'class') {
        const kept = all.filter(e => e.mode !== 'class');
        localStorage.setItem(HISTORY_KEY, JSON.stringify(kept));
    } else {
        clearAllHistory();
    }

    renderHistoryList();
});

// ------------------------------------------------------------
// 10. NAVIGATION TO HISTORY
// ------------------------------------------------------------
document.getElementById('viewHistoryFromWelcome')
    .addEventListener('click', () => {
        renderHistoryList();
        showScreen('historyScreen');
    });

document.getElementById('viewHistoryFromResults')
    .addEventListener('click', () => {
        renderHistoryList();
        showScreen('historyScreen');
    });



// ------------------------------------------------------------
// 11. SAFE TEXT HELPER
// ------------------------------------------------------------
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================================
// ACCOUNTS & AUTHENTICATION (Individual mode only)
// ============================================================

const ACCOUNTS_KEY = 'cpt_accounts_v1';
const SESSION_KEY   = 'cpt_session_v1';

// ============================================================
// SESSION EXPIRY CONFIG
// ============================================================
// How long a user can remain inactive before being logged out.
// 30 minutes is a good default for shared school devices.
const SESSION_TIMEOUT_MS = 0.5 * 60 * 1000;

// How often we check for expiry (in ms). 60s is plenty.
const SESSION_CHECK_INTERVAL_MS = 60 * 1000;

// localStorage keys
const SESSION_ACTIVITY_KEY = 'cpt_session_activity_v1';

// ------------------------------------------------------------
// 1. SHA-256 HASH (no external libs)
// ------------------------------------------------------------
async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// ------------------------------------------------------------
// 2. ACCOUNT STORE
// ------------------------------------------------------------
function loadAccounts() {
    try {
        const raw = localStorage.getItem(ACCOUNTS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
}

function saveAccounts(list) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

function findAccount(name) {
    const key = name.trim().toLowerCase();
    return loadAccounts().find(a => a.name.toLowerCase() === key);
}

// ------------------------------------------------------------
// 3. SESSION STORE
// ------------------------------------------------------------
// ------------------------------------------------------------
// 3. SESSION STORE (with activity-based expiry)
// ------------------------------------------------------------
function saveSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    touchSession(); // record activity immediately
}

function loadSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;

        // Check if this session has expired
        if (isSessionExpired()) {
            clearSession();
            return null;
        }

        touchSession(); // still valid → refresh activity
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_ACTIVITY_KEY);
}

// Records "now" as the last activity time.
function touchSession() {
    localStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
}

// True if the stored session has been idle longer than the timeout.
function isSessionExpired() {
    const last = parseInt(localStorage.getItem(SESSION_ACTIVITY_KEY) || '0', 10);
    if (!last) return true;
    return (Date.now() - last) > SESSION_TIMEOUT_MS;
}

// ------------------------------------------------------------
// 4. SVG AVATAR GENERATOR
//    Builds a lightweight SVG data-URL based on gender + initial.
// ------------------------------------------------------------
function generateAvatar(name, gender) {
    const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';

    // Palette based on gender
    const palettes = {
        female: { bg: '#f8bbd0', fg: '#880e4f' },
        male:   { bg: '#bbdefb', fg: '#0d47a1' },
        other:  { bg: '#d1c4e9', fg: '#311b92' }
    };
    const { bg, fg } = palettes[gender] || palettes.other;

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect width="100" height="100" rx="50" fill="${bg}"/>
            <text x="50" y="50" text-anchor="middle" dominant-baseline="central"
                  font-family="Arial, sans-serif" font-size="44" font-weight="700"
                  fill="${fg}">${initial}</text>
        </svg>
    `.trim();

    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// ------------------------------------------------------------
// 5. USER CHIP
// ------------------------------------------------------------
function showUserChip(user) {
    const chip = document.getElementById('userChip');
    const avatar = document.getElementById('userChipAvatar');
    const name = document.getElementById('userChipName');

    avatar.src = user.avatar || generateAvatar(user.name, user.gender);
    name.textContent = user.name;
    chip.style.display = 'flex';
}

function hideUserChip() {
    document.getElementById('userChip').style.display = 'none';
}

// ------------------------------------------------------------
// 6. HOOK INTO MODE SELECTION
//    Individual → login (if not already logged in)
//    Class      → straight to subject
// ------------------------------------------------------------


document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
        AppState.mode = card.dataset.mode;

        if (AppState.mode === 'individual') {
            const session = loadSession();
            if (session) {
                // Already logged in — skip login screen
                AppState.user = session;
                showUserChip(session);
                renderSubjects();
                showScreen('subjectScreen');
            } else {
                showScreen('loginScreen');
            }
        } else {
            // Class mode — no login
            AppState.user = null;
            hideUserChip();
            renderSubjects();
            showScreen('subjectScreen');
        }
    });
});

// ------------------------------------------------------------
// 7. LOGIN FORM
// ------------------------------------------------------------
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameEl = document.getElementById('loginName');
    const passEl = document.getElementById('loginPassword');
    const errorEl = document.getElementById('loginError');

    errorEl.style.display = 'none';

    const name = nameEl.value.trim();
    const pass = passEl.value;

    if (!name || !pass) {
        return showAuthError(errorEl, 'Please enter both your name and password.');
    }

    const account = findAccount(name);
    if (!account) {
        return showAuthError(errorEl, 'No account found with that name.');
    }

    const hash = await sha256(pass);
    if (hash !== account.passwordHash) {
        return showAuthError(errorEl, 'Incorrect password. Please try again.');
    }

    // Success
    const session = {
        name: account.name,
        gender: account.gender,
        avatar: account.avatar
    };
    saveSession(session);
    AppState.user = session;
    showUserChip(session);

    // Reset form
    nameEl.value = '';
    passEl.value = '';

    renderSubjects();
    showScreen('subjectScreen');
});

// ------------------------------------------------------------
// 8. REGISTER FORM
// ------------------------------------------------------------
let _registerAvatarDataUrl = null;

// Live preview when name/gender changes
const regName   = document.getElementById('registerName');
const regGender = document.getElementById('registerGender');
const regPhoto  = document.getElementById('registerPhoto');
const previewImg = document.getElementById('registerAvatarPreview');
const previewName = document.getElementById('registerAvatarName');
const previewGender = document.getElementById('registerAvatarGender');

function updateRegisterPreview() {
    const name = regName.value.trim();
    const gender = regGender.value || 'other';

    previewName.textContent = name || 'Your Name';
    previewGender.textContent = gender === 'other' ? 'Not specified' : gender;

    if (_registerAvatarDataUrl) {
        previewImg.src = _registerAvatarDataUrl;
    } else {
        previewImg.src = generateAvatar(name || '?', gender);
    }
}

regName.addEventListener('input', updateRegisterPreview);
regGender.addEventListener('change', updateRegisterPreview);

regPhoto.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) {
        _registerAvatarDataUrl = null;
        updateRegisterPreview();
        return;
    }
    if (file.size > 1024 * 1024) {
        alert('Image too large. Please choose an image under 1 MB.');
        regPhoto.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
        _registerAvatarDataUrl = ev.target.result;
        updateRegisterPreview();
    };
    reader.readAsDataURL(file);
});

// Password strength meter
const regPassword = document.getElementById('registerPassword');
const strengthFill = document.getElementById('strengthFill');
const strengthLabel = document.getElementById('strengthLabel');

regPassword.addEventListener('input', () => {
    const val = regPassword.value;
    const { score, label, color } = scorePassword(val);
    strengthFill.style.width = (score * 25) + '%';
    strengthFill.style.background = color;
    strengthLabel.textContent = val ? label : 'Use a strong password';
    strengthLabel.style.color = color;
});

function scorePassword(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const map = {
        0: { label: 'Too weak',        color: '#c62828' },
        1: { label: 'Weak',            color: '#ef5350' },
        2: { label: 'Fair',            color: '#ff9800' },
        3: { label: 'Good',            color: '#4caf50' },
        4: { label: 'Strong 💪',       color: '#2e7d32' }
    };
    return { score, ...map[score] };
}

// Show/hide password toggles
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.textContent = input.type === 'password' ? '👁' : '🙈';
    });
});

// Register submit
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const errEl = document.getElementById('registerError');
    errEl.style.display = 'none';

    const name = regName.value.trim();
    const gender = regGender.value;
    const pass = regPassword.value;
    const confirm = document.getElementById('registerConfirm').value;

    if (!name)         return showAuthError(errEl, 'Please enter your full name.');
    if (!gender)       return showAuthError(errEl, 'Please select your gender.');
    if (pass.length < 8) return showAuthError(errEl, 'Password must be at least 8 characters.');
    if (pass !== confirm) return showAuthError(errEl, 'Passwords do not match.');
    if (findAccount(name)) return showAuthError(errEl, 'An account with that name already exists.');

    const passwordHash = await sha256(pass);
    const avatar = _registerAvatarDataUrl || generateAvatar(name, gender);

    const account = {
        name,
        gender,
        avatar,
        passwordHash,
        createdAt: new Date().toISOString()
    };

    const accounts = loadAccounts();
    accounts.push(account);
    saveAccounts(accounts);

    // Auto-login
    const session = { name, gender, avatar };
    saveSession(session);
    AppState.user = session;
    showUserChip(session);

    // Reset register form
    document.getElementById('registerForm').reset();
    _registerAvatarDataUrl = null;
    updateRegisterPreview();

    renderSubjects();
    showScreen('subjectScreen');
});

// ------------------------------------------------------------
// 9. SWITCH BETWEEN LOGIN AND REGISTER
// ------------------------------------------------------------
document.getElementById('goToRegister').addEventListener('click', (e) => {
    e.preventDefault();
    updateRegisterPreview();
    showScreen('registerScreen');
});

document.getElementById('goToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    showScreen('loginScreen');
});

// ------------------------------------------------------------
// 10. LOGOUT
// ------------------------------------------------------------
document.getElementById('userChipLogout').addEventListener('click', () => {
    const ok = confirm('Log out of your account?');
    if (!ok) return;

    clearSession();
    AppState.user = null;
    hideUserChip();

    // Reset flow
    AppState.mode = null;
    AppState.subjectKey = null;
    AppState.selectedTopics = {};
    resetPracticeState();

    showScreen('welcomeScreen');
});

// ------------------------------------------------------------
// 11. HELPER
// ------------------------------------------------------------
function showAuthError(el, msg) {
    el.textContent = msg;
    el.style.display = 'block';
}

// ------------------------------------------------------------
// 12. AUTO-RESTORE SESSION ON LOAD (with expiry check)
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Clean up an expired session before doing anything else.
    if (localStorage.getItem(SESSION_KEY) && isSessionExpired()) {
        clearSession();
        // No toast here — this is a fresh visit, not an in-session expiry.
    }

    const session = loadSession();
    if (session) {
        AppState.user = session;
        showUserChip(session);
    }
})


// ============================================================
// SESSION EXPIRY — ACTIVITY TRACKING & BACKGROUND CHECK
// ============================================================

// Any of these events counts as "the user is still here".
const ACTIVITY_EVENTS = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'];

let _lastTouchWrite = 0;
function onUserActivity() {
    // Throttle writes to once every 15 seconds — plenty for a 30-min timeout.
    const now = Date.now();
    if (now - _lastTouchWrite < 15000) return;
    _lastTouchWrite = now;
    touchSession();
}

ACTIVITY_EVENTS.forEach(evt => {
    document.addEventListener(evt, onUserActivity, { passive: true });
});

// Background check: if a session exists but has expired, log out quietly.
function checkSessionExpiry() {
    if (!localStorage.getItem(SESSION_KEY)) return;
    if (!isSessionExpired()) return;

    // Session has expired
    performAutoLogout();
}

function performAutoLogout() {
    clearSession();
    AppState.user = null;
    hideUserChip();

    // Reset the flow so the user lands on Welcome
    AppState.mode = null;
    AppState.subjectKey = null;
    AppState.selectedTopics = {};

    // If they were mid-practice, stop the timer too
    if (typeof resetPracticeState === 'function') {
        resetPracticeState();
    }

    // Return to the welcome screen
    showScreen('welcomeScreen');

    // Notify the user gently
    notifySessionExpired();
}

setInterval(checkSessionExpiry, SESSION_CHECK_INTERVAL_MS);

// Also check whenever the tab becomes visible again.
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkSessionExpiry();
});


// ============================================================
// TOAST NOTIFICATION
// ============================================================
function notifySessionExpired() {
    showToast('You were logged out due to inactivity. Please log in again.');
}

function showToast(message, duration = 4000) {
    // Remove any existing toast
    const existing = document.getElementById('appToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'app-toast';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Fade in
    requestAnimationFrame(() => toast.classList.add('visible'));

    // Fade out & remove
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

