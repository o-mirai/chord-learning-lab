// UI_MESSAGESをインポート（メッセージの統一管理）
import { UI_MESSAGES } from './constants.js';

// MIDIノート番号と音名のマッピング配列（12音階を定義）
const noteMap = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];

// MIDI接続状態を管理する変数
let midiStatusCallback = null; // MIDI接続状態変化を通知するコールバック関数

/**
 * MIDIノートナンバーを音名（例: "C", "C#"）に変換する（オクターブ情報なし）
 * @param {number} noteNumber - MIDIノートナンバー (例: 60 = C4)
 * @returns {string} - オクターブなしの音名 (例: "C")
 */
function noteNumberToNoteName(noteNumber) {
  // 12で割った余りが noteMap のインデックスになる
  // 例: 60 % 12 = 0 → noteMap[0] = "C"
  // 例: 61 % 12 = 1 → noteMap[1] = "C#"
  const noteIndex = noteNumber % 12; // 0〜11の値を取得
  return noteMap[noteIndex]; // 対応する音名を返す
}

/**
 * MIDI入力を初期化し、コールバック関数にNote On/Offイベントを渡す
 * @param {function(string, boolean): void} callback - MIDIイベント発生時に呼び出すコールバック
 * @param {function(boolean, string): void} statusCallback - MIDI接続状態変化時のコールバック (省略可)
 *                                                            第1引数: 接続状態 (true=接続, false=切断)
 *                                                            第2引数: デバイス名
 */
export function initMidiInput(callback, statusCallback = null) {
  console.log('initMidiInput called'); // デバッグログ追加

  // 状態通知用のコールバックを保存
  midiStatusCallback = statusCallback;

  // Web MIDI API がサポートされているかチェック
  if (!navigator.requestMIDIAccess) {
    // エラーメッセージを定数から取得（利用者向けに分かりやすく）
    console.warn(UI_MESSAGES.MIDI_NOT_SUPPORTED);

    // MIDI非対応の場合、状態コールバックで通知
    if (midiStatusCallback) {
      midiStatusCallback(false, UI_MESSAGES.MIDI_NOT_SUPPORTED);
    }
    return; // サポートされていない場合は処理を終了
  }

  // MIDIアクセスを要求（ブラウザにMIDIデバイスへのアクセス許可を求める）
  navigator.requestMIDIAccess()
    .then(midiAccess => { // アクセスが許可された場合
      console.log("MIDIアクセスが許可されました。入力ポートを監視します...");

      // 接続されているデバイスの数をカウント
      let connectedDevices = 0;

      // 入力ポートを全て取得（接続されているMIDIキーボードなど）
      const inputs = midiAccess.inputs.values(); // イテレータを取得

      for (let input of inputs) { // 全ての入力ポートに対して
        console.log(`MIDI入力デバイスを検出: ${input.name}`); // デバイス名をログ出力
        connectedDevices++; // デバイス数をカウント

        // 全ての入力ポートでメッセージをリッスン
        input.onmidimessage = (message) => { // MIDIメッセージを受信したときの処理
          console.log(`Message from ${input.name}`); // デバッグログ追加
          handleMidiMessage(message, callback); // メッセージを処理する関数を呼び出す
        };
      }

      // 初期接続状態を通知
      if (midiStatusCallback) {
        if (connectedDevices > 0) {
          // メッセージを分かりやすく修正
          midiStatusCallback(true, `${connectedDevices}台の電子ピアノ・キーボードが接続されています`);
        } else {
          midiStatusCallback(false, UI_MESSAGES.MIDI_READY);
        }
      }

      // デバイスの接続/切断イベントも監視
      midiAccess.onstatechange = (event) => { // デバイスの状態が変化したとき
        console.log(`MIDIデバイスの状態が変更されました: ${event.port.name}, ${event.port.state}`);
        // event.port.state は "connected" または "disconnected"

        // 接続/切断時に新しいデバイスのメッセージハンドラを設定
        if (event.port.type === 'input' && event.port.state === 'connected') {
          // 新しいデバイスが接続された場合
          event.port.onmidimessage = (message) => {
            handleMidiMessage(message, callback);
          };

          // 接続通知を送信
          if (midiStatusCallback) {
            midiStatusCallback(true, `${UI_MESSAGES.MIDI_CONNECTED}: ${event.port.name}`);
          }
        } else if (event.port.type === 'input' && event.port.state === 'disconnected') {
          // 切断通知を送信
          if (midiStatusCallback) {
            midiStatusCallback(false, `${UI_MESSAGES.MIDI_DISCONNECTED}: ${event.port.name}`);
          }
        }
      };

    })
    .catch(error => { // アクセスが拒否された場合やエラー発生時
      // ユーザーが許可しなかった場合やエラー発生時の処理
      console.error(`MIDIアクセスに失敗しました: ${error}`);

      // エラーメッセージを定数から取得（利用者向けに分かりやすく）
      alert(UI_MESSAGES.MIDI_ACCESS_DENIED);

      // エラー状態を通知
      if (midiStatusCallback) {
        // エラーメッセージを分かりやすく修正
        midiStatusCallback(false, `電子ピアノ・キーボードの接続でエラーが発生しました`);
      }
    });
}

/**
 * MIDIメッセージを処理し、コールバック関数を実行する
 */
function handleMidiMessage(message, callback) {
  const [command, noteNumber, velocity] = message.data; // MIDIメッセージから3つの値を取得
  // command: コマンドバイト（Note On/Off など）
  // noteNumber: ノート番号（0〜127）
  // velocity: 強さ（0〜127）

  // タイミングメッセージ（MIDI Clock, Active Sensingなど）を除外
  // 0xF8 = 248 (MIDI Clock), 0xFE = 254 (Active Sensing)
  if (command >= 0xF0) { // システムメッセージの場合
    // システムメッセージは無視（ログも出さない）
    return; // 処理を終了
  }

  console.log(`MIDI message: command=${command}, note=${noteNumber}, velocity=${velocity}`); // デバッグログ追加

  // Note On (command 144-159) または Note Off (command 128-143) かどうかを判断
  // velocityが0のNote Onメッセージ (0x90) はNote Offとして扱われる
  const isNoteOn = (command & 0xf0) === 0x90 && velocity > 0; // Note Onかつvelocityが0より大きい
  const isNoteOff = (command & 0xf0) === 0x80 || ((command & 0xf0) === 0x90 && velocity === 0); // Note Offまたはvelocity=0のNote On

  if (isNoteOn || isNoteOff) { // Note OnまたはNote Offイベントの場合
    const noteName = noteNumberToNoteName(noteNumber); // ノート番号を音名に変換
    console.log(`MIDI event: ${noteName} ${isNoteOn ? 'ON' : 'OFF'}`); // デバッグログ追加
    // callback(音名, isNoteOn) を実行
    callback(noteName, isNoteOn); // コールバック関数に音名とOn/Off情報を渡す
  }
}