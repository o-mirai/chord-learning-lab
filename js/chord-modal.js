// モーダルコンポーネント
import { ROOT_NOTES, CHORD_TYPES } from './constants.js';

const STORAGE_KEY = 'chord-quiz-selection';

/**
 * コード選択モーダルクラス
 */
export class ChordSelectionModal {
  constructor(options = {}) {
    this.onStart = options.onStart || null;
    this.autoOpen = options.autoOpen || false;
    this.buttonText = options.buttonText || 'クイズを開始';
    
    this.modal = null;
    this.overlay = null;
    this.selectedRoots = new Set();
    this.selectedTypes = new Set();
    
    this.init();
  }

  /**
   * 初期化
   */
  init() {
    this.createModal();
    this.loadSelection();
    this.attachEvents();
    
    if (this.autoOpen) {
      setTimeout(() => this.open(), 100);
    }
  }

  /**
   * モーダルHTML作成
   */
  createModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>出題するコードを選択</h2>
          <button class="modal-close" aria-label="閉じる">×</button>
        </div>
        <div class="modal-body">
          <div class="modal-selection-count">
            選択中: <strong class="selection-count-value">0</strong>個のコード
          </div>
          
          <div class="modal-section">
            <div class="modal-section-header">
              <h3>ルート音</h3>
              <div class="modal-quick-buttons">
                <button class="modal-quick-button select-all-roots">全選択</button>
                <button class="modal-quick-button deselect-all-roots">全解除</button>
              </div>
            </div>
            <div class="modal-checkbox-grid roots" id="modal-roots">
              ${this.createRootCheckboxes()}
            </div>
          </div>

          <div class="modal-section">
            <div class="modal-section-header">
              <h3>コードの種類</h3>
              <div class="modal-quick-buttons">
                <button class="modal-quick-button select-all-types">全選択</button>
                <button class="modal-quick-button deselect-all-types">全解除</button>
              </div>
            </div>
            <div class="modal-checkbox-grid types" id="modal-types">
              ${this.createTypeCheckboxes()}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-button modal-button-cancel">キャンセル</button>
          <button class="modal-button modal-button-primary start-quiz">${this.buttonText}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.modal = overlay.querySelector('.modal-content');
  }

  /**
   * ルート音チェックボックス生成
   */
  createRootCheckboxes() {
    return ROOT_NOTES.map(note => `
      <label class="modal-checkbox-label">
        <input type="checkbox" class="root-checkbox" value="${note}">
        <span>${note}</span>
      </label>
    `).join('');
  }

  /**
   * コードタイプチェックボックス生成
   */
  createTypeCheckboxes() {
    return Object.entries(CHORD_TYPES).map(([key, value]) => `
      <label class="modal-checkbox-label">
        <input type="checkbox" class="type-checkbox" value="${key}">
        <span>${value.name} ${value.degreeNotation}</span>
      </label>
    `).join('');
  }

  /**
   * イベント登録
   */
  attachEvents() {
    // オーバーレイクリックで閉じる
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // 閉じるボタン
    this.overlay.querySelector('.modal-close').addEventListener('click', () => {
      this.close();
    });

    // キャンセルボタン
    this.overlay.querySelector('.modal-button-cancel').addEventListener('click', () => {
      this.close();
    });

    // 開始ボタン
    this.overlay.querySelector('.start-quiz').addEventListener('click', () => {
      this.handleStart();
    });

    // チェックボックス変更
    this.overlay.querySelectorAll('.root-checkbox, .type-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateCount();
      });
    });

    // 全選択・全解除ボタン
    this.overlay.querySelector('.select-all-roots').addEventListener('click', () => {
      this.overlay.querySelectorAll('.root-checkbox').forEach(cb => cb.checked = true);
      this.updateCount();
    });

    this.overlay.querySelector('.deselect-all-roots').addEventListener('click', () => {
      this.overlay.querySelectorAll('.root-checkbox').forEach(cb => cb.checked = false);
      this.updateCount();
    });

    this.overlay.querySelector('.select-all-types').addEventListener('click', () => {
      this.overlay.querySelectorAll('.type-checkbox').forEach(cb => cb.checked = true);
      this.updateCount();
    });

    this.overlay.querySelector('.deselect-all-types').addEventListener('click', () => {
      this.overlay.querySelectorAll('.type-checkbox').forEach(cb => cb.checked = false);
      this.updateCount();
    });

    // Escキーで閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.close();
      }
    });
  }

  /**
   * 選択数更新
   */
  updateCount() {
    const rootCount = this.overlay.querySelectorAll('.root-checkbox:checked').length;
    const typeCount = this.overlay.querySelectorAll('.type-checkbox:checked').length;
    const total = rootCount * typeCount;
    
    this.overlay.querySelector('.selection-count-value').textContent = total;
  }

  /**
   * 選択状態を保存
   */
  saveSelection() {
    const roots = Array.from(this.overlay.querySelectorAll('.root-checkbox:checked'))
      .map(cb => cb.value);
    const types = Array.from(this.overlay.querySelectorAll('.type-checkbox:checked'))
      .map(cb => cb.value);
    
    const selection = { roots, types };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    } catch (e) {
      console.warn('選択状態の保存に失敗しました', e);
    }
  }

  /**
   * 選択状態を読み込み
   */
  loadSelection() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { roots, types } = JSON.parse(saved);
        
        this.overlay.querySelectorAll('.root-checkbox').forEach(cb => {
          cb.checked = roots.includes(cb.value);
        });
        
        this.overlay.querySelectorAll('.type-checkbox').forEach(cb => {
          cb.checked = types.includes(cb.value);
        });
        
        this.updateCount();
      }
    } catch (e) {
      console.warn('選択状態の読み込みに失敗しました', e);
    }
  }

  /**
   * 選択中のコードを取得
   */
  getSelectedChords() {
    const roots = Array.from(this.overlay.querySelectorAll('.root-checkbox:checked'))
      .map(cb => cb.value);
    const types = Array.from(this.overlay.querySelectorAll('.type-checkbox:checked'))
      .map(cb => cb.value);
    
    return { roots, types };
  }

  /**
   * 開始処理
   */
  handleStart() {
    const { roots, types } = this.getSelectedChords();
    
    if (roots.length === 0 || types.length === 0) {
      alert('ルート音とコードの種類を1つ以上選択してください');
      return;
    }
    
    this.saveSelection();
    this.close();
    
    if (this.onStart) {
      this.onStart({ roots, types });
    }
  }

  /**
   * モーダルを開く
   */
  open() {
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * モーダルを閉じる
   */
  close() {
    this.overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * モーダルを破棄
   */
  destroy() {
    if (this.overlay) {
      this.overlay.remove();
    }
  }
}

/**
 * モーダルを開くボタンを作成
 */
export function createModalButton(text = '🎵 コードを選択してクイズ開始', className = 'open-modal-button') {
  const button = document.createElement('button');
  button.className = className;
  button.textContent = text;
  button.style.cssText = `
    padding: 1rem 2rem;
    font-size: 1.2rem;
    font-weight: bold;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    margin: 2rem auto;
    display: block;
  `;
  
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
  });
  
  return button;
}
