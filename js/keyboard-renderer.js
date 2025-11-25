// 鍵盤の描画とインタラクション管理
import { whiteNotes, blackNotes, blackPositions, enharmonics, UI_MESSAGES } from './constants.js';

/**
 * 音名がアクティブリストに含まれているかチェック（異名同音も考慮）
 * @param {string} note - チェックする音名
 * @param {string[]} activeNotes - アクティブな音名の配列
 * @returns {boolean}
 */
export function isActive(note, activeNotes) {
  return activeNotes.includes(note) || activeNotes.includes(enharmonics[note]);
}

/**
 * 鍵盤を描画
 * @param {string} containerId - 鍵盤を配置するDOM要素のID
 * @param {string[]} activeNotes - ハイライト表示する音名の配列
 * @param {Object} options - オプション設定
 *   - activeClass: アクティブなキーのCSSクラス名（デフォルト: "active"）
 *   - onClick: キークリック時のコールバック（function(note, element)）
 *   - interactive: 鍵盤をクリック可能にするか（デフォルト: onClickの有無で判定）
 */
export function renderKeyboard(containerId, activeNotes = [], options = {}) {
  const container = document.getElementById(containerId);

  if (!container) {
    const errorMsg = `${UI_MESSAGES.ELEMENT_NOT_FOUND}: #${containerId}`;
    console.error(errorMsg);
    return;
  }

  if (!Array.isArray(activeNotes)) {
    console.warn('activeNotesが配列ではありません。空配列として扱います。', activeNotes);
    activeNotes = [];
  }

  container.innerHTML = "";

  const activeClass = options.activeClass || "active";

  // interactive: true → クリック可能（構成音選択クイズ）
  // interactive: false → 表示のみ（学習モード・コード名当てクイズ）
  const interactive = options.interactive !== undefined
    ? options.interactive
    : (options.onClick !== undefined);

  /**
   * 鍵盤要素を生成
   */
  const createKey = (note, className, textContent, leftPosition) => {
    try {
      const key = document.createElement("div");
      key.className = className;
      key.textContent = textContent;
      key.style.left = leftPosition;
      key.setAttribute('data-note', note);

      if (interactive) {
        // インタラクティブモード: クリック可能
        key.style.cursor = 'pointer';
        key.setAttribute('tabindex', '0');
        key.setAttribute('role', 'button');
        key.setAttribute('aria-label', `${note}の鍵盤`);

        if (options.onClick) {
          key.onclick = () => options.onClick(note, key);

          // キーボード操作対応（Enter/Space）
          key.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              options.onClick(note, key);
            }
          });
        }
      } else {
        // 非インタラクティブモード: 表示のみ
        key.style.cursor = 'default';
        key.setAttribute('aria-label', `${note}の鍵盤（表示のみ）`);
      }

      if (isActive(note, activeNotes)) {
        key.classList.add(activeClass);
      }

      container.appendChild(key);
    } catch (error) {
      console.error(`鍵盤の作成中にエラーが発生しました (note: ${note}):`, error);
    }
  };

  try {
    // 白鍵の描画
    whiteNotes.forEach((note, i) => {
      const leftPosition = `${(i * 100) / 7}%`;
      createKey(note, "white-key", note, leftPosition);
    });

    // 黒鍵の描画（シャープ/フラット両表記）
    blackNotes.forEach(note => {
      const leftPosition = `${(blackPositions[note] * 100) / 7}%`;
      const noteLabel = `${note} (${enharmonics[note]})`;
      createKey(note, "black-key", noteLabel, leftPosition);
    });
  } catch (error) {
    console.error('鍵盤の描画中に予期しないエラーが発生しました:', error);
    if (container) {
      container.innerHTML = '<p style="color: red; padding: 20px;">鍵盤の表示に失敗しました。ページを再読み込みしてください。</p>';
    }
  }
}