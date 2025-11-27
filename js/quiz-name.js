import { generateChordNotes, generateChordName, UI_MESSAGES, ROOT_NOTES, CHORD_TYPES, NOTE_MAP } from './constants.js';
import { renderKeyboard } from './keyboard-renderer.js';
import { playChord, setVolume, getVolume, isAutoPlayEnabled } from './audio-player.js';
import { ChordSelectionModal, createModalButton } from './chord-modal.js';

const QUIZ_TOTAL = 15;

let selectedRoots = [];  // クイズで使用するルート音
let selectedTypes = [];  // クイズで使用するコードタイプ
let quizChords = [];
let currentQuestionIndex = 0;
let currentChord = null;
let correctCount = 0;
let answered = false;
let startTime = null;
let timerInterval = null;
let modal = null;

// ユーザーの選択状態
let chosenRoot = null;
let chosenType = null;

/**
 * 進捗バーを更新
 */
function updateProgressBar() {
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressText = document.getElementById('progress-text');
  
  if (progressBarFill && progressText) {
    const progress = ((currentQuestionIndex + 1) / QUIZ_TOTAL) * 100;
    progressBarFill.style.width = `${progress}%`;
    progressText.textContent = `問題 ${currentQuestionIndex + 1} / ${QUIZ_TOTAL}`;
  }
}

/**
 * クイズ用のコードリストを生成
 */
function generateQuiz(roots, types) {
  selectedRoots = roots;
  selectedTypes = types;
  
  const allChords = [];
  
  roots.forEach(root => {
    types.forEach(type => {
      const chordName = generateChordName(root, type);
      const notes = generateChordNotes(root, type);
      if (chordName && notes.length > 0) {
        allChords.push({ name: chordName, notes: notes, root: root, type: type });
      }
    });
  });

  if (allChords.length === 0) {
    return [];
  }

  // 15問分をランダム抽出
  quizChords = [];
  for (let i = 0; i < QUIZ_TOTAL; i++) {
    const randomChord = allChords[Math.floor(Math.random() * allChords.length)];
    quizChords.push(randomChord);
  }

  return quizChords;
}

/**
 * クイズ開始
 */
function startQuiz(selection) {
  const { roots, types } = selection;
  const chords = generateQuiz(roots, types);

  if (chords.length === 0) {
    alert('有効なコードがありません');
    return;
  }

  currentQuestionIndex = 0;
  correctCount = 0;
  startTime = Date.now();
  
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);

  document.getElementById('next').disabled = false;
  document.getElementById('replay').disabled = false;
  
  renderChoices();
  updateProgressBar();
  newQuestion(isAutoPlayEnabled());
}

/**
 * タイマー更新
 */
function updateTimer() {
  if (!startTime) return;
  
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  const timerElement = document.getElementById('timer');
  if (timerElement) {
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

/**
 * ルート音のインデックスを取得（鍵盤順）
 */
function getRootIndex(root) {
  // "C#/Db" のような形式に対応
  const normalized = root.split('/')[0];
  const noteMap = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11
  };
  return noteMap[normalized] || 0;
}

/**
 * コードタイプの順序を取得
 */
function getTypeOrder(type) {
  const order = ['major', 'minor', 'seventh', 'major7', 'minor7', 'sus4', 'dim', 'aug'];
  return order.indexOf(type);
}

/**
 * 選択肢を描画（プルダウン方式）
 */
function renderChoices() {
  const choicesContainer = document.getElementById('choices');
  if (!choicesContainer) return;

  choicesContainer.innerHTML = '';

  // セレクターコンテナ（横並び）
  const selectorsContainer = document.createElement('div');
  selectorsContainer.className = 'selectors-container';

  // ルート音プルダウン
  const rootGroup = document.createElement('div');
  rootGroup.className = 'selector-group';
  
  const rootLabel = document.createElement('label');
  rootLabel.className = 'selector-label';
  rootLabel.textContent = 'ルート音';
  rootLabel.htmlFor = 'root-select';
  
  const rootSelect = document.createElement('select');
  rootSelect.className = 'selector-select root-select';
  rootSelect.id = 'root-select';
  
  const rootDefaultOption = document.createElement('option');
  rootDefaultOption.value = '';
  rootDefaultOption.textContent = '選択してください';
  rootSelect.appendChild(rootDefaultOption);
  
  // 選択されたルート音を鍵盤順にソート
  const sortedRoots = [...selectedRoots].sort((a, b) => getRootIndex(a) - getRootIndex(b));
  
  sortedRoots.forEach(root => {
    const option = document.createElement('option');
    option.value = root;
    option.textContent = root.split('/')[0];
    rootSelect.appendChild(option);
  });
  
  rootSelect.addEventListener('change', (e) => selectRoot(e.target.value));
  
  rootGroup.appendChild(rootLabel);
  rootGroup.appendChild(rootSelect);
  selectorsContainer.appendChild(rootGroup);

  // コードタイププルダウン
  const typeGroup = document.createElement('div');
  typeGroup.className = 'selector-group';
  
  const typeLabel = document.createElement('label');
  typeLabel.className = 'selector-label';
  typeLabel.textContent = 'コードの種類';
  typeLabel.htmlFor = 'type-select';
  
  const typeSelect = document.createElement('select');
  typeSelect.className = 'selector-select type-select';
  typeSelect.id = 'type-select';
  
  const typeDefaultOption = document.createElement('option');
  typeDefaultOption.value = '';
  typeDefaultOption.textContent = '選択してください';
  typeSelect.appendChild(typeDefaultOption);
  
  // 選択されたコードタイプを順番にソート
  const sortedTypes = [...selectedTypes].sort((a, b) => getTypeOrder(a) - getTypeOrder(b));
  
  sortedTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = `${CHORD_TYPES[type].name} ${CHORD_TYPES[type].degreeNotation}`;
    typeSelect.appendChild(option);
  });
  
  typeSelect.addEventListener('change', (e) => selectType(e.target.value));
  
  typeGroup.appendChild(typeLabel);
  typeGroup.appendChild(typeSelect);
  selectorsContainer.appendChild(typeGroup);

  choicesContainer.appendChild(selectorsContainer);
}

/**
 * ルート音を選択
 */
function selectRoot(root) {
  if (answered) return;
  
  chosenRoot = root || null;
  
  checkIfComplete();
}

/**
 * コードタイプを選択
 */
function selectType(type) {
  if (answered) return;
  
  chosenType = type || null;
  
  checkIfComplete();
}

/**
 * 両方選択されたか確認し、自動判定
 */
function checkIfComplete() {
  if (chosenRoot && chosenType) {
    handleAnswer();
  }
}

/**
 * 回答処理
 */
function handleAnswer() {
  if (answered) return;

  answered = true;
  const result = document.getElementById('result');
  if (!result) return;

  const selectedChordName = generateChordName(chosenRoot, chosenType);
  const isCorrect = selectedChordName === currentChord.name;

  // プルダウンを無効化
  const rootSelect = document.getElementById('root-select');
  const typeSelect = document.getElementById('type-select');
  if (rootSelect) rootSelect.disabled = true;
  if (typeSelect) typeSelect.disabled = true;

  if (isCorrect) {
    correctCount++;
    
    result.innerHTML = `${UI_MESSAGES.CORRECT_PREFIX} [${currentChord.name}: ${currentChord.notes.join(', ')}]`;
    result.style.color = 'green';
    result.className = 'correct';

    playChord(currentChord.notes);

    setTimeout(() => {
      currentQuestionIndex++;
      newQuestion(isAutoPlayEnabled());
    }, 1000);
    
  } else {
    result.innerHTML = `${UI_MESSAGES.INCORRECT_PREFIX} [${currentChord.name}: ${currentChord.notes.join(', ')}]`;
    result.style.color = 'red';
    result.className = 'incorrect';
  }
}

/**
 * 正解のボタンをハイライト（プルダウン方式では不要）
 */
function highlightCorrectAnswer() {
  // プルダウン方式では正解表示はresult欄で行う
}

/**
 * 新しい問題
 */
function newQuestion(autoPlay = true) {
  if (currentQuestionIndex >= quizChords.length) {
    finishQuiz();
    return;
  }

  currentChord = quizChords[currentQuestionIndex];
  answered = false;
  chosenRoot = null;
  chosenType = null;

  updateProgressBar();

  // プルダウンの状態をリセット
  const rootSelect = document.getElementById('root-select');
  const typeSelect = document.getElementById('type-select');
  if (rootSelect) {
    rootSelect.value = '';
    rootSelect.disabled = false;
  }
  if (typeSelect) {
    typeSelect.value = '';
    typeSelect.disabled = false;
  }

  renderKeyboard('keyboard', currentChord.notes, {
    activeClass: 'active',
    interactive: false
  });

  if (autoPlay && isAutoPlayEnabled()) {
    playChord(currentChord.notes);
  }

  const result = document.getElementById('result');
  if (result) {
    result.textContent = UI_MESSAGES.SELECT_CHORD;
    result.style.color = 'black';
    result.className = '';
  }
}

/**
 * クイズ終了
 */
function finishQuiz() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const accuracy = Math.round((correctCount / QUIZ_TOTAL) * 100);

  alert(`${UI_MESSAGES.QUIZ_COMPLETE}\n\n正解数: ${correctCount} / ${QUIZ_TOTAL}\n正答率: ${accuracy}%\n${UI_MESSAGES.TIME_TAKEN}${timeString}`);

  document.getElementById('next').disabled = true;
  document.getElementById('replay').disabled = true;
  document.getElementById('result').textContent = 'コードを選択してクイズを開始してください';
  
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressText = document.getElementById('progress-text');
  if (progressBarFill && progressText) {
    progressBarFill.style.width = '0%';
    progressText.textContent = `問題 0 / ${QUIZ_TOTAL}`;
  }
  
  // クイズ終了後、モーダルボタンを再表示
  showModalButton();
}

/**
 * もう一度聴く
 */
function replayChord() {
  if (!currentChord) return;
  playChord(currentChord.notes);
}

/**
 * モーダルボタンを表示
 */
function showModalButton() {
  const container = document.getElementById('modal-button-container');
  if (container) {
    container.innerHTML = '';
    const button = createModalButton('🎵 コードを選択してクイズ開始');
    button.addEventListener('click', () => modal.open());
    container.appendChild(button);
  }
}

/**
 * モーダルボタンを非表示
 */
function hideModalButton() {
  const container = document.getElementById('modal-button-container');
  if (container) {
    container.innerHTML = '';
  }
}

// イベントリスナー
document.getElementById('next').addEventListener('click', () => {
  currentQuestionIndex++;
  newQuestion(isAutoPlayEnabled());
});

document.getElementById('replay').addEventListener('click', replayChord);

const volumeSlider = document.getElementById('volume-slider');
if (volumeSlider) {
  volumeSlider.value = getVolume() * 100;
  volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    setVolume(volume);
    
    const volumeDisplay = document.getElementById('volume-display');
    if (volumeDisplay) {
      volumeDisplay.textContent = `${e.target.value}%`;
    }
  });
}

// 初期化
renderKeyboard('keyboard', [], { interactive: false });

// モーダル作成
modal = new ChordSelectionModal({
  autoOpen: true,
  buttonText: `クイズを開始 (${QUIZ_TOTAL}問)`,
  onStart: (selection) => {
    hideModalButton();
    startQuiz(selection);
  }
});

showModalButton();