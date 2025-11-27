import { ROOT_NOTES, CHORD_TYPES, generateChordNotes, generateChordName, NOTE_MAP } from './constants.js';
import { renderKeyboard } from './keyboard-renderer.js';
import { playChord, setVolume, getVolume } from './audio-player.js';

// 選択状態
let chosenRoot = null;
let chosenType = null;

/**
 * ルート音のインデックスを取得（鍵盤順）
 */
function getRootIndex(root) {
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
 * セレクターを描画（プルダウン方式）
 */
function renderSelectors() {
  const container = document.getElementById('chord-selectors');
  if (!container) return;

  container.innerHTML = '';

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
  
  // ルート音を鍵盤順にソート
  const sortedRoots = [...ROOT_NOTES].sort((a, b) => getRootIndex(a) - getRootIndex(b));
  
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
  
  // コードタイプを順番にソート
  const sortedTypes = Object.keys(CHORD_TYPES).sort((a, b) => getTypeOrder(a) - getTypeOrder(b));
  
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

  container.appendChild(selectorsContainer);
}

/**
 * ルート音を選択
 */
function selectRoot(root) {
  chosenRoot = root || null;
  updateChordDisplay();
}

/**
 * コードタイプを選択
 */
function selectType(type) {
  chosenType = type || null;
  updateChordDisplay();
}

/**
 * コード情報の表示を更新
 */
function updateChordDisplay() {
  const chordNameElement = document.getElementById('chord-name');
  const chordNotesElement = document.getElementById('chord-notes');
  
  if (chosenRoot && chosenType) {
    // 両方選択されている場合
    const chordName = generateChordName(chosenRoot, chosenType);
    const notes = generateChordNotes(chosenRoot, chosenType);
    
    if (chordNameElement) {
      chordNameElement.textContent = `コード：${chordName}`;
    }
    if (chordNotesElement) {
      chordNotesElement.textContent = `構成音：${notes.join(', ')}`;
    }
    
    // 鍵盤を更新
    renderKeyboard('keyboard', notes, {
      activeClass: 'active',
      interactive: false
    });
    
    // 音を再生
    playChord(notes);
    
  } else if (chosenRoot) {
    // ルート音のみ選択
    if (chordNameElement) {
      chordNameElement.textContent = 'コード：コードの種類を選んでください';
    }
    if (chordNotesElement) {
      chordNotesElement.textContent = '構成音：-';
    }
    renderKeyboard('keyboard', [], { interactive: false });
    
  } else if (chosenType) {
    // コードタイプのみ選択
    if (chordNameElement) {
      chordNameElement.textContent = 'コード：ルート音を選んでください';
    }
    if (chordNotesElement) {
      chordNotesElement.textContent = '構成音：-';
    }
    renderKeyboard('keyboard', [], { interactive: false });
    
  } else {
    // 何も選択されていない
    if (chordNameElement) {
      chordNameElement.textContent = 'コード：-';
    }
    if (chordNotesElement) {
      chordNotesElement.textContent = '構成音：-';
    }
    renderKeyboard('keyboard', [], { interactive: false });
  }
}

/**
 * 音量変更時のフィードバック
 */
function handleVolumeChange(volume) {
  setVolume(volume);
  // 音量変更時にCメジャーを再生してフィードバック
  playChord(['C', 'E', 'G']);
}

// イベントリスナー設定
const volumeSlider = document.getElementById('volume-slider');
if (volumeSlider) {
  volumeSlider.value = getVolume() * 100;
  volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    handleVolumeChange(volume);
    
    const volumeDisplay = document.getElementById('volume-display');
    if (volumeDisplay) {
      volumeDisplay.textContent = `${e.target.value}%`;
    }
  });
}

// 初期化
renderKeyboard('keyboard', [], { interactive: false });
renderSelectors();
updateChordDisplay();