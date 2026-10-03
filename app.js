const vocabulary = [
  { word: "見識", reading: "けんしき", meaning: "見解與識見；判斷事物的能力", category: "抽象概念", example: "彼は幅広い見識を持っている。", translation: "他擁有廣泛的見識。" },
  { word: "懸念", reading: "けねん", meaning: "擔心、掛念；令人憂慮的事", category: "抽象概念", example: "計画の遅れが懸念されている。", translation: "人們擔心計畫會延遲。" },
  { word: "促進", reading: "そくしん", meaning: "促進；推動事物向前發展", category: "表達・行動", example: "地域交流を促進する。", translation: "促進地區間的交流。" },
  { word: "著しい", reading: "いちじるしい", meaning: "顯著的；非常明顯的", category: "表達・行動", example: "技術の進歩は著しい。", translation: "技術的進步十分顯著。" },
  { word: "根拠", reading: "こんきょ", meaning: "根據；作為判斷基礎的依據", category: "抽象概念", example: "その説には根拠がない。", translation: "那個說法沒有根據。" },
  { word: "普及", reading: "ふきゅう", meaning: "普及；廣泛傳播、使用", category: "社會・文化", example: "スマートフォンが急速に普及した。", translation: "智慧型手機迅速普及了。" },
  { word: "配慮", reading: "はいりょ", meaning: "關照；為他人或情況設想", category: "表達・行動", example: "周囲への配慮を忘れない。", translation: "別忘了體諒身邊的人。" },
  { word: "傾向", reading: "けいこう", meaning: "傾向；事情發展的方向或特徵", category: "抽象概念", example: "若者の読書離れの傾向がある。", translation: "有年輕人逐漸遠離閱讀的趨勢。" },
  { word: "緩和", reading: "かんわ", meaning: "緩和；使緊張或程度減輕", category: "表達・行動", example: "規制を緩和する方針だ。", translation: "方針是放寬管制。" },
  { word: "維持", reading: "いじ", meaning: "維持；讓狀態持續不變", category: "表達・行動", example: "健康を維持するために運動する。", translation: "為了維持健康而運動。" },
  { word: "慣習", reading: "かんしゅう", meaning: "慣例；長久以來形成的習俗", category: "社會・文化", example: "地域独自の慣習が残っている。", translation: "仍保留著地區特有的習俗。" },
  { word: "著作", reading: "ちょさく", meaning: "著作；寫作完成的作品", category: "社會・文化", example: "彼の著作は多くの言語に訳された。", translation: "他的著作被翻譯成多種語言。" }
];

const STORAGE_KEY = "kotoba-n1-progress";
const DAILY_GOAL = 12;
const today = new Date();
const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
const savedProgress = readProgress();
let progress = savedProgress;
let activeCategory = "全部";
let cardIndex = 0;
let cardRevealed = false;
let sessionAnswers = 0;
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

const elements = {
  date: document.querySelector("#today-date"),
  reviewedCount: document.querySelector("#reviewed-count"),
  progressBar: document.querySelector("#daily-progress-bar"),
  progressFill: document.querySelector("#daily-progress-fill"),
  progressPercent: document.querySelector("#progress-percent"),
  goalCount: document.querySelector("#goal-count"),
  goalFill: document.querySelector("#goal-rule-fill"),
  goalMessage: document.querySelector("#goal-message"),
  streak: document.querySelector("#streak-count"),
  sessionCount: document.querySelector("#session-count"),
  card: document.querySelector("#flashcard"),
  kanji: document.querySelector("#word-kanji"),
  reading: document.querySelector("#word-reading"),
  category: document.querySelector("#word-category"),
  cardNumber: document.querySelector("#card-number"),
  cardTotal: document.querySelector("#card-total"),
  hint: document.querySelector("#word-hint"),
  detail: document.querySelector("#word-detail"),
  meaning: document.querySelector("#word-meaning"),
  example: document.querySelector("#word-example"),
  translation: document.querySelector("#word-example-translation"),
  libraryRows: document.querySelector("#library-rows"),
  libraryTotal: document.querySelector("#library-total"),
  quizOptions: document.querySelector("#quiz-options"),
  quizFeedback: document.querySelector("#quiz-feedback"),
  nextQuestion: document.querySelector("#next-question")
};

function readProgress() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.date === todayKey) return { ...stored, mastered: stored.mastered || [] };
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
    return { date: todayKey, reviewed: 0, mastered: [], streak: stored?.date === yesterdayKey ? stored.streak || 0 : 0 };
  } catch {
    return { date: todayKey, reviewed: 0, mastered: [], streak: 0 };
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // The session remains usable when browser storage is unavailable.
  }
}

function getFilteredVocabulary() {
  return activeCategory === "全部" ? vocabulary : vocabulary.filter((item) => item.category === activeCategory);
}

function currentWord() {
  const words = getFilteredVocabulary();
  return words[cardIndex % words.length];
}

function renderCard() {
  const words = getFilteredVocabulary();
  const item = currentWord();
  cardRevealed = false;
  elements.card.classList.remove("revealed");
  elements.card.setAttribute("aria-label", `翻開單字卡：${item.word}`);
  elements.kanji.textContent = item.word;
  elements.reading.textContent = item.reading;
  elements.category.textContent = item.category;
  elements.cardNumber.textContent = String((cardIndex % words.length) + 1).padStart(2, "0");
  elements.cardTotal.textContent = String(words.length).padStart(2, "0");
  elements.hint.hidden = false;
  elements.detail.hidden = true;
  elements.meaning.textContent = item.meaning;
  elements.example.textContent = item.example;
  elements.translation.textContent = item.translation;
}

function renderProgress() {
  const reviewed = Math.min(progress.reviewed, DAILY_GOAL);
  const percent = Math.round((reviewed / DAILY_GOAL) * 100);
  elements.reviewedCount.textContent = String(reviewed);
  elements.goalCount.textContent = String(reviewed);
  elements.progressFill.style.width = `${percent}%`;
  elements.goalFill.style.width = `${percent}%`;
  elements.progressPercent.textContent = `${percent}%`;
  elements.progressBar.setAttribute("aria-valuenow", String(reviewed));
  elements.streak.textContent = String(progress.streak);
  elements.sessionCount.textContent = `${sessionAnswers} 個字`;
  document.querySelector("#nav-review-count").textContent = String(Math.max(0, DAILY_GOAL - reviewed));
  elements.goalMessage.textContent = reviewed >= DAILY_GOAL
    ? "今日目標達成，做得很好。明天再繼續累積。"
    : reviewed === 0
      ? "穩穩來，今天的練習從第一個字開始。"
      : `再完成 ${DAILY_GOAL - reviewed} 個單字，就達成今日目標。`;
}

function toggleCard() {
  cardRevealed = !cardRevealed;
  elements.card.classList.toggle("revealed", cardRevealed);
  elements.hint.hidden = cardRevealed;
  elements.detail.hidden = !cardRevealed;
  elements.card.setAttribute("aria-label", cardRevealed ? `單字意思：${currentWord().meaning}` : `翻開單字卡：${currentWord().word}`);
}

function answerCard(known) {
  if (!cardRevealed) toggleCard();
  const wasStudiedToday = progress.reviewed > 0;
  progress.reviewed += 1;
  if (known && !progress.mastered.includes(currentWord().word)) progress.mastered.push(currentWord().word);
  if (!wasStudiedToday) progress.streak += 1;
  sessionAnswers += 1;
  saveProgress();
  renderProgress();
  cardIndex += 1;
  renderCard();
}

function renderLibrary() {
  const query = document.querySelector("#library-search").value.trim().toLocaleLowerCase();
  const matches = vocabulary.filter((item) => `${item.word} ${item.reading} ${item.meaning} ${item.category}`.toLocaleLowerCase().includes(query));
  elements.libraryTotal.textContent = `${matches.length} 個單字`;
  elements.libraryRows.replaceChildren();
  if (matches.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty-row";
    cell.textContent = "找不到符合的單字。";
    row.append(cell);
    elements.libraryRows.append(row);
    return;
  }
  matches.forEach((item) => {
    const row = document.createElement("tr");
    const values = [item.word, item.reading, item.meaning, item.category];
    values.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    const mastered = progress.mastered.includes(item.word);
    status.className = `word-status${mastered ? " mastered" : ""}`;
    status.textContent = mastered ? "已掌握" : "待複習";
    statusCell.append(status);
    row.append(statusCell);
    elements.libraryRows.append(row);
  });
}

function shuffled(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function renderQuiz() {
  const item = vocabulary[quizIndex % vocabulary.length];
  const wrongAnswers = shuffled(vocabulary.filter((word) => word.word !== item.word)).slice(0, 3).map((word) => word.meaning);
  const options = shuffled([item.meaning, ...wrongAnswers]);
  document.querySelector("#quiz-word").textContent = item.word;
  document.querySelector("#quiz-reading").textContent = item.reading;
  document.querySelector("#quiz-progress-label").textContent = `第 ${quizIndex + 1} 題`;
  document.querySelector("#quiz-score-label").textContent = `答對 ${quizScore} 題`;
  elements.quizFeedback.textContent = "";
  elements.quizFeedback.className = "quiz-feedback";
  elements.nextQuestion.hidden = true;
  quizAnswered = false;
  elements.quizOptions.replaceChildren();
  options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "quiz-option";
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => answerQuiz(button, option, item.meaning));
    elements.quizOptions.append(button);
  });
}

function answerQuiz(selectedButton, selected, correct) {
  if (quizAnswered) return;
  quizAnswered = true;
  const isCorrect = selected === correct;
  if (isCorrect) quizScore += 1;
  [...elements.quizOptions.children].forEach((button) => {
    button.disabled = true;
    if (button.textContent === correct) button.classList.add("correct");
  });
  if (!isCorrect) selectedButton.classList.add("incorrect");
  elements.quizFeedback.textContent = isCorrect ? "答對了，記得這個用法。" : `正確答案：${correct}`;
  elements.quizFeedback.classList.add(isCorrect ? "correct" : "incorrect");
  document.querySelector("#quiz-score-label").textContent = `答對 ${quizScore} 題`;
  elements.nextQuestion.hidden = false;
}

function setView(viewName) {
  document.querySelectorAll(".view").forEach((view) => {
    const active = view.id === `${viewName}-view`;
    view.hidden = !active;
    view.classList.toggle("active", active);
  });
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
  const labels = { study: "今日複習", library: "單字庫", quiz: "快速測驗", exercises: "練習題" };
  document.querySelector("#breadcrumb-current").textContent = labels[viewName];
  if (viewName === "library") renderLibrary();
  if (viewName === "quiz") renderQuiz();
}

document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
document.querySelectorAll(".category-chip").forEach((button) => button.addEventListener("click", () => {
  activeCategory = button.dataset.category;
  cardIndex = 0;
  document.querySelectorAll(".category-chip").forEach((chip) => chip.classList.toggle("selected", chip === button));
  renderCard();
}));
elements.card.addEventListener("click", toggleCard);
document.querySelector("#again-button").addEventListener("click", () => answerCard(false));
document.querySelector("#known-button").addEventListener("click", () => answerCard(true));
document.querySelector("#library-search").addEventListener("input", renderLibrary);
elements.nextQuestion.addEventListener("click", () => { quizIndex += 1; renderQuiz(); });
document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !event.repeat && !event.target.matches("input, button")) {
    event.preventDefault();
    if (!document.querySelector("#study-view").hidden) toggleCard();
  }
  if (event.key === "1" && !document.querySelector("#study-view").hidden) answerCard(false);
  if (event.key === "2" && !document.querySelector("#study-view").hidden) answerCard(true);
});

elements.date.textContent = new Intl.DateTimeFormat("zh-TW", { month: "long", day: "numeric", weekday: "short" }).format(today);
renderCard();
renderProgress();