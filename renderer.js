const editor = document.getElementById('editor');

// ===== Вкладки =====
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.ribbon').forEach(r => r.classList.add('hidden'));
    tab.classList.add('active');
    document.getElementById('ribbon-' + tab.dataset.tab).classList.remove('hidden');
  });
});

// ===== Форматирование (execCommand) =====
document.querySelectorAll('[data-cmd]').forEach(btn => {
  btn.addEventListener('click', () => {
    editor.focus();
    document.execCommand(btn.dataset.cmd, false, null);
    btn.classList.toggle('active');
    updateCount();
  });
});

// Шрифт и размер
document.getElementById('fontFamily').addEventListener('change', e => {
  editor.focus();
  document.execCommand('fontName', false, e.target.value);
});
document.getElementById('fontSize').addEventListener('change', e => {
  editor.focus();
  const size = e.target.value;
  // execCommand fontSize принимает 1..7, эмулируем через span
  const sel = window.getSelection();
  if (sel.rangeCount) {
    const span = document.createElement('span');
    span.style.fontSize = size + 'pt';
    const range = sel.getRangeAt(0);
    range.surroundContents(span);
  }
});

// Цвета
document.getElementById('textColor').addEventListener('input', e => {
  editor.focus();
  document.execCommand('foreColor', false, e.target.value);
});
document.getElementById('bgColor').addEventListener('input', e => {
  editor.focus();
  document.execCommand('hiliteColor', false, e.target.value);
});

// ===== Вставка изображения =====
const imageInput = document.getElementById('imageInput');
document.getElementById('insertImage').addEventListener('click', () => imageInput.click());
imageInput.addEventListener('change', () => {
  const file = imageInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    editor.focus();
    document.execCommand('insertImage', false, ev.target.result);
  };
  reader.readAsDataURL(file);
});

// ===== Вставка ссылки =====
document.getElementById('insertLink').addEventListener('click', () => {
  const url = prompt('Введите URL:', 'https://');
  if (url) {
    editor.focus();
    document.execCommand('createLink', false, url);
  }
});

// ===== Вставка таблицы =====
document.getElementById('insertTable').addEventListener('click', () => {
  const rows = parseInt(prompt('Строк:', '3'), 10);
  const cols = parseInt(prompt('Столбцов:', '3'), 10);
  if (!rows || !cols) return;
  let html = '<table>';
  for (let i = 0; i < rows; i++) {
    html += '<tr>';
    for (let j = 0; j < cols; j++) html += '<td>&nbsp;</td>';
    html += '</tr>';
  }
  html += '</table><p></p>';
  editor.focus();
  document.execCommand('insertHTML', false, html);
});

// ===== Вставка даты =====
document.getElementById('insertDate').addEventListener('click', () => {
  const d = new Date().toLocaleDateString('ru-RU');
  editor.focus();
  document.execCommand('insertText', false, d);
});

// ===== Сохранение / открытие =====
document.getElementById('saveFile').addEventListener('click', () => {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${editor.innerHTML}</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'документ.html';
  a.click();
});

const fileInput = document.getElementById('fileInput');
document.getElementById('openFile').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { editor.innerHTML = ev.target.result; updateCount(); };
  reader.readAsText(file);
});

// ===== Печать =====
document.getElementById('printDoc').addEventListener('click', () => window.print());

// ===== Масштаб =====
let zoom = 100;
const page = document.querySelector('.page');
function applyZoom() {
  page.style.transform = `scale(${zoom / 100})`;
  page.style.transformOrigin = 'top center';
  document.getElementById('zoomLabel').textContent = zoom + '%';
}
document.getElementById('zoomIn').addEventListener('click', () => { zoom = Math.min(200, zoom + 10); applyZoom(); });
document.getElementById('zoomOut').addEventListener('click', () => { zoom = Math.max(50, zoom - 10); applyZoom(); });

// ===== Подсчёт слов =====
function updateCount() {
  const text = editor.innerText.trim();
  const words = text ? text.split(/\s+/).length : 0;
  document.getElementById('wordCount').textContent = 'Слов: ' + words;
  document.getElementById('charCount').textContent = 'Символов: ' + text.length;
}
editor.addEventListener('input', updateCount);

// Горячие клавиши как в Word
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); document.getElementById('saveFile').click(); }
  if (e.ctrlKey && e.key === 'o') { e.preventDefault(); document.getElementById('openFile').click(); }
  if (e.ctrlKey && e.key === 'p') { e.preventDefault(); window.print(); }
  if (e.ctrlKey && e.key === 'b') { e.preventDefault(); document.execCommand('bold'); }
  if (e.ctrlKey && e.key === 'i') { e.preventDefault(); document.execCommand('italic'); }
  if (e.ctrlKey && e.key === 'u') { e.preventDefault(); document.execCommand('underline'); }
});

updateCount();
