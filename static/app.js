let allQuestions = [];
let currentQuiz = [];
let currentIndex = 0;
let userAnswers = []; // {questionIndex, selectedOption, isCorrect, chapter}

const views = {
    welcome: document.getElementById('welcome-view'),
    quiz: document.getElementById('quiz-view'),
    result: document.getElementById('result-view')
};

// Initialize
async function init() {
    try {
        const res = await fetch('/api/questions');
        allQuestions = await res.json();
        
        const chaptersRes = await fetch('/api/chapters');
        const chapters = await chaptersRes.json();
        
        renderChapterMenu(chapters);
    } catch (err) {
        console.error('Failed to load data', err);
    }
}

function renderChapterMenu(chapters) {
    const menu = document.getElementById('chapter-menu');
    chapters.forEach(ch => {
        const btn = document.createElement('div');
        btn.className = 'chapter-btn';
        btn.textContent = `Chapter ${ch}`;
        btn.onclick = () => startQuiz(ch);
        menu.appendChild(btn);
    });
}

function switchView(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[viewName].classList.add('active');
}

function startQuiz(chapter = null) {
    if (chapter) {
        currentQuiz = allQuestions.filter(q => q.chapter === chapter);
    } else {
        // Full random test: pick 3 random from each chapter (total 18) or all
        currentQuiz = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 30);
    }
    
    currentIndex = 0;
    userAnswers = [];
    switchView('quiz');
    showQuestion();
}

document.getElementById('start-full-test').onclick = () => startQuiz();

function showQuestion() {
    const q = currentQuiz[currentIndex];
    
    // UI Update
    document.getElementById('chapter-tag').textContent = `Chapter ${q.chapter}`;
    document.getElementById('progress-text').textContent = `${currentIndex + 1} / ${currentQuiz.length}`;
    document.getElementById('progress-bar').style.width = `${((currentIndex + 1) / currentQuiz.length) * 100}%`;
    document.getElementById('question-text').textContent = q.question;
    
    const optionsList = document.getElementById('options-list');
    optionsList.innerHTML = '';
    
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = `${String.fromCharCode(65 + idx)}. ${opt}`;
        btn.onclick = () => handleAnswer(idx);
        optionsList.appendChild(btn);
    });

    // Reset feedback
    document.getElementById('feedback').classList.add('hidden');
    document.getElementById('next-btn').disabled = true;
}

function handleAnswer(selectedIdx) {
    const q = currentQuiz[currentIndex];
    const options = document.querySelectorAll('.option-btn');
    
    // Disable all options
    options.forEach(btn => btn.disabled = true);
    
    const isCorrect = selectedIdx === q.answer;
    options[selectedIdx].classList.add(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) {
        options[q.answer].classList.add('correct');
    }

    // Show feedback
    const feedback = document.getElementById('feedback');
    const feedbackText = document.getElementById('feedback-text');
    feedback.classList.remove('hidden');
    feedbackText.textContent = isCorrect ? '✅ 正確！' : '❌ 錯誤';
    feedbackText.style.color = isCorrect ? 'var(--success)' : 'var(--error)';
    document.getElementById('explanation-text').textContent = q.explanation;

    // Save answer
    userAnswers.push({
        chapter: q.chapter,
        isCorrect: isCorrect
    });

    document.getElementById('next-btn').disabled = false;
}

document.getElementById('next-btn').onclick = () => {
    currentIndex++;
    if (currentIndex < currentQuiz.length) {
        showQuestion();
    } else {
        showResults();
    }
};

function showResults() {
    switchView('result');
    
    const total = userAnswers.length;
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    const score = Math.round((correctCount / total) * 100);
    
    document.getElementById('total-score').textContent = score;
    
    // Comment
    let comment = "";
    if (score >= 90) comment = "卓越！你對類別資料分析有深刻的理解。";
    else if (score >= 70) comment = "不錯！大部分核心觀念已掌握，建議複習錯誤章節。";
    else if (score >= 60) comment = "及格，但部分理論細節仍需加強。";
    else comment = "需要更多複習，請點擊下方條狀圖查看弱項。";
    document.getElementById('result-comment').textContent = comment;

    // Analytics by chapter
    const statsContainer = document.getElementById('chapter-stats');
    statsContainer.innerHTML = '';
    
    const chapterData = {};
    userAnswers.forEach(ans => {
        if (!chapterData[ans.chapter]) chapterData[ans.chapter] = { correct: 0, total: 0 };
        chapterData[ans.chapter].total++;
        if (ans.isCorrect) chapterData[ans.chapter].correct++;
    });

    Object.keys(chapterData).sort().forEach(ch => {
        const data = chapterData[ch];
        const percent = Math.round((data.correct / data.total) * 100);
        
        const row = document.createElement('div');
        row.className = 'chapter-stat-row';
        row.innerHTML = `
            <div class="stat-header">
                <span>Chapter ${ch}</span>
                <span>${percent}% (${data.correct}/${data.total})</span>
            </div>
            <div class="stat-bar-container">
                <div class="stat-bar" style="width: ${percent}%"></div>
            </div>
        `;
        statsContainer.appendChild(row);
    });
}

init();
