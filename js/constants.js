// コード定義と音楽理論の定数を管理

// ルート音の定義
export const ROOT_NOTES = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"];

// コードタイプの定義
export const CHORD_TYPES = {
  "major": { name: "メジャー", intervals: [0, 4, 7], suffix: "" },
  "minor": { name: "マイナー", intervals: [0, 3, 7], suffix: "m" },
  "seventh": { name: "セブンス", intervals: [0, 4, 7, 10], suffix: "7" },
  "major7": { name: "メジャーセブンス", intervals: [0, 4, 7, 11], suffix: "maj7" },
  "minor7": { name: "マイナーセブンス", intervals: [0, 3, 7, 10], suffix: "m7" },
  "sus4": { name: "サスフォー", intervals: [0, 5, 7], suffix: "sus4" },
  "dim": { name: "ディミニッシュ", intervals: [0, 3, 6], suffix: "dim" },
  "aug": { name: "オーギュメント", intervals: [0, 4, 8], suffix: "aug" }
};

// 音名のマッピング（半音単位）
export const NOTE_MAP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * コードの構成音を生成する関数
 * @param {string} root - ルート音（例: "C", "C#/Db"）
 * @param {string} type - コードタイプ（例: "major", "minor"）
 * @returns {string[]} - 構成音の配列
 */
export function generateChordNotes(root, type) {
  const chordType = CHORD_TYPES[type];
  if (!chordType) return [];

  // ルート音のインデックスを取得
  let rootIndex;
  if (root.includes('/')) {
    // シャープ表記を優先（例: "C#/Db" → "C#"）
    const sharpNote = root.split('/')[0];
    rootIndex = NOTE_MAP.indexOf(sharpNote);
  } else {
    rootIndex = NOTE_MAP.indexOf(root);
  }

  if (rootIndex === -1) return [];

  // インターバルに基づいて構成音を生成
  return chordType.intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return NOTE_MAP[noteIndex];
  });
}

/**
 * コード名を生成する関数
 * @param {string} root - ルート音
 * @param {string} type - コードタイプ
 * @returns {string} - コード名（例: "C", "Dm", "G7"）
 */
export function generateChordName(root, type) {
  const chordType = CHORD_TYPES[type];
  if (!chordType) return "";

  // ルート音の表示名を取得（シャープ/フラット表記を含む場合は最初を使用）
  let displayRoot = root;
  if (root.includes('/')) {
    displayRoot = root.split('/')[0];
  }

  return displayRoot + chordType.suffix;
}

// 鍵盤の音名定義
export const whiteNotes = ["C", "D", "E", "F", "G", "A", "B"];
export const blackNotes = ["C#", "D#", "F#", "G#", "A#"];

// 黒鍵の位置（白鍵との相対位置）
export const blackPositions = {
  "C#": 1,
  "D#": 2,
  "F#": 4,
  "G#": 5,
  "A#": 6
};

// 異名同音（エンハーモニック）の変換マップ
export const enharmonics = {
  "C#": "Db", "Db": "C#",
  "D#": "Eb", "Eb": "D#",
  "F#": "Gb", "Gb": "F#",
  "G#": "Ab", "Ab": "G#",
  "A#": "Bb", "Bb": "A#"
};

// 音名と周波数のマッピング（中音域）
export const noteFreq = {
  "C": 261.63, "C#": 277.18, "Db": 277.18,
  "D": 293.66, "D#": 311.13, "Eb": 311.13,
  "E": 329.63,
  "F": 349.23, "F#": 369.99, "Gb": 369.99,
  "G": 392.00, "G#": 415.30, "Ab": 415.30,
  "A": 440.00, "A#": 466.16, "Bb": 466.16,
  "B": 493.88
};

// 音声再生の設定値
export const AUDIO_CONSTANTS = {
  CHORD_DURATION: 0.8,
  SINGLE_NOTE_DURATION: 0.2,
  CHORD_GAIN: 0.5,
  SINGLE_NOTE_GAIN: 0.4,
  MIN_VOLUME: 0,
  MAX_VOLUME: 1,
  DEFAULT_VOLUME: 0.5
};

// UIメッセージの定数
export const UI_MESSAGES = {
  NO_SELECTION: '⚠️ 音を選択してください',
  ELEMENT_NOT_FOUND: 'アプリの読み込みに失敗しました。\nページを更新してもう一度お試しください。',
  MIDI_NOT_SUPPORTED: '電子ピアノやキーボードの接続はこのブラウザでは使えません',
  MIDI_ACCESS_DENIED: '電子ピアノやキーボードを使うには、ブラウザの許可が必要です',
  MIDI_CONNECTED: '🎹 電子ピアノ・キーボードが接続されました',
  MIDI_DISCONNECTED: '🎹 電子ピアノ・キーボードが切断されました',
  MIDI_READY: '🎹 電子ピアノ・キーボードを接続できます',
  SELECT_CHORD: 'コードを選んでください',
  CORRECT_PREFIX: '🎉 正解！',
  INCORRECT_PREFIX: '❌ 不正解… 正解は',
  NO_CHORDS_SELECTED: '⚠️ コードを1つ以上選択してください',
  QUIZ_COMPLETE: '🎊 クイズ完了！',
  TIME_TAKEN: '⏱️ かかった時間: '
};
