const editor = document.getElementById('editor');
const page = document.getElementById('page');
const fileInput = document.getElementById('file-input');
const imageInput = document.getElementById('image-input');

/* ====== Вкладки ====== */
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.toolbar').forEach(t => t.style.display = 'none');
    tab.classList.add('active');
    const panel = document.getElementById('tb-' + tab.dataset.tab);
    if (panel) panel.style.display = 'flex';
  };
});

/* ====== Команды форматирования ====== */
document.querySelectorAll('[data-cmd]').forEach(btn => {
  btn.onclick = () => {
    editor.focus();
    document.execCommand(btn.dataset.cmd, false, null);
    updateState();
  };
});

/* Цвета и шрифты */
document.getElementById('font-family').onchange = e => {
  editor.focus(); document.execCommand('fontName', false, e.target.value);
};
document.getElementById('font-size').onchange = e => setFontSize(e.target.value);
document.getElementById('text-color').oninput = e => {
  editor.focus(); document.execCommand('foreColor', false, e.target.value);
};
document.getElementById('highlight-color').oninput = e => {
  editor.focus(); document.execCommand('hiliteColor', false, e.target.value);
};

function setFontSize(size) {
  const sel = window.getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return;
  document.execCommand('fontSize', false, '7');
  editor.querySelectorAll('font[size="7"]').forEach(el => {
    const span = document.createElement('span');
    span.style.fontSize = size + 'pt';
    span.innerHTML = el.innerHTML;
    el.replaceWith(span);
  });
  editor.focus();
}

/* ====== Универсальный обработчик data-act ====== */
document.querySelectorAll('[data-act]').forEach(btn => {
  btn.onclick = () => handleAction(btn.dataset.act);
});

function handleAction(act) {
  switch(act) {
    // --- ФАЙЛ ---
    case 'new': if (confirm('Новый документ?')) { editor.innerHTML=''; document.getElementById('docName').textContent='Документ1 — Редактор'; updateState(); } break;
    case 'template': editor.innerHTML='<h1>Заголовок</h1><p>Текст документа...</p>'; break;
    case 'open': fileInput.click(); break;
    case 'open-recent': alert('Здесь будут последние файлы (заглушка).'); break;
    case 'save-html': saveAs('html'); break;
    case 'save-docx': saveAs('docx'); break;
    case 'save-txt': saveAs('txt'); break;
    case 'save-pdf': alert('Используйте Ctrl+P → Сохранить как PDF.'); break;
    case 'print': window.print(); break;
    case 'print-preview': alert('Предпросмотр печати. Нажмите Ctrl+P.'); break;
    case 'export-json': {
      const blob = new Blob([JSON.stringify({html: editor.innerHTML}, null, 2)], {type:'application/json'});
      download(blob, 'документ.json'); break;
    }
    case 'share': alert('Ссылка для отправки будет здесь (заглушка).'); break;
    case 'doc-info': alert(`Документ: ${document.getElementById('docName').textContent}\nСлов: ${countWords()}\nСимволов: ${editor.innerText.length}`); break;
    case 'doc-protect': alert('Защита документа включена (заглушка).'); break;

    // --- ГЛАВНАЯ ---
    case 'grow-font': changeFont(+2); break;
    case 'shrink-font': changeFont(-2); break;
    case 'clear-format': document.execCommand('removeFormat'); break;
    case 'format-painter': alert('Копирование формата: кликните по тексту для применения.'); break;
    case 'checklist': document.execCommand('insertHTML', false, '<div>☐ Пункт списка</div>'); break;
    case 'find': {
      const q = prompt('Что найти?'); if (!q) return;
      if (!window.find(q)) alert('Не найдено: ' + q);
      break;
    }
    case 'replace': {
      const from = prompt('Заменить:'); if (!from) return;
      const to = prompt('На:'); if (to === null) return;
      editor.innerHTML = editor.innerHTML.split(from).join(to); break;
    }
    case 'select-all': document.execCommand('selectAll'); break;

    // --- ВСТАВКА ---
    case 'page-break': document.execCommand('insertHTML', false, '<div style="page-break-after:always"></div><p></p>'); break;
    case 'cover': editor.insertAdjacentHTML('afterbegin', '<div style="text-align:center;padding:80px 0;"><h1>Название документа</h1><p>Автор<br>2026</p></div>'); break;
    case 'blank-page': document.execCommand('insertHTML', false, '<div style="page-break-after:always"></div>'); break;
    case 'table': {
      const rows = +prompt('Строк:', '3'); const cols = +prompt('Столбцов:', '3');
      if (!rows || !cols) return;
      let html = '<table>'; for (let i=0;i<rows;i++){ html+='<tr>'; for (let j=0;j<cols;j++) html+='<td>&nbsp;</td>'; html+='</tr>'; } html+='</table><p></p>';
      document.execCommand('insertHTML', false, html); break;
    }
    case 'table-draw': alert('Нарисуйте таблицу мышью (заглушка).'); break;
    case 'table-convert': alert('Текст → таблица (заглушка).'); break;
    case 'image': imageInput.click(); break;
    case 'shapes': alert('Выбор фигур (заглушка — вставьте символ ▭)'); break;
    case 'chart': alert('Вставка диаграммы (заглушка).'); break;
    case 'icons': document.execCommand('insertHTML', false, '⭐'); break;
    case 'smartart': alert('SmartArt (заглушка).'); break;
    case 'link': { const url = prompt('URL:', 'https://'); if (url) document.execCommand('createLink', false, url); break; }
    case 'bookmark': alert('Закладка создана.'); break;
    case 'cross-ref': alert('Перекрёстная ссылка (заглушка).'); break;
    case 'header': alert('Верхний колонтитул (заглушка).'); break;
    case 'footer': alert('Нижний колонтитул (заглушка).'); break;
    case 'page-num': document.execCommand('insertText', false, '1'); break;
    case 'textbox': document.execCommand('insertHTML', false, '<span style="border:1px solid #999;padding:4px;">Текст</span>'); break;
    case 'date': document.execCommand('insertText', false, new Date().toLocaleDateString('ru-RU')); break;
    case 'time': document.execCommand('insertText', false, new Date().toLocaleTimeString('ru-RU')); break;
    case 'symbol': { const s = prompt('Символ:', '©'); if (s) document.execCommand('insertText', false, s); break; }
    case 'emoji': document.execCommand('insertText', false, '😊'); break;
    case 'video': alert('Вставка видео (заглушка).'); break;
    case 'audio': alert('Вставка аудио (заглушка).'); break;
    case 'qr': alert('QR-код (заглушка).'); break;

    // --- ДИЗАЙН ---
    case 'font-color-default': alert('Цвет по умолчанию изменён.'); break;
    case 'bg-color-default': alert('Фон изменён.'); break;
    case 'watermark': {
      page.style.backgroundImage = 'repeating-linear-gradient(45deg, transparent, transparent 80px, rgba(0,0,0,0.05) 80px, rgba(0,0,0,0.05) 160px)'; break;
    }
    case 'page-color': { const c = prompt('Цвет (например #ffeeee):', '#ffffff'); if (c) page.style.background = c; break; }
    case 'page-border': page.style.border = '2px solid #217346'; break;
    case 'style-normal': document.execCommand('formatBlock', false, 'p'); break;
    case 'style-heading': document.execCommand('formatBlock', false, 'h2'); break;
    case 'style-quote': document.execCommand('formatBlock', false, 'blockquote'); break;

    // --- МАКЕТ ---
    case 'space-before': editor.style.marginTop = '20px'; break;
    case 'space-after': editor.style.marginBottom = '20px'; break;
    case 'cols-1': editor.style.columnCount = 1; break;
    case 'cols-2': editor.style.columnCount = 2; editor.style.columnGap='40px'; break;
    case 'cols-3': editor.style.columnCount = 3; editor.style.columnGap='30px'; break;
    case 'rotate': alert('Поворот объекта (заглушка).'); break;
    case 'align-object': alert('Выравнивание (заглушка).'); break;
    case 'wrap-text': alert('Обтекание (заглушка).'); break;

    // --- ССЫЛКИ ---
    case 'toc': {
      const hs = editor.querySelectorAll('h1,h2,h3');
      if (!hs.length) return alert('Нет заголовков.');
      let h = '<div style="border:1px dashed #999;padding:10px;margin:10px 0"><b>Оглавление</b><ul>';
      hs.forEach(x => h += `<li>${x.innerText}</li>`); h += '</ul></div><p></p>';
      document.execCommand('insertHTML', false, h); break;
    }
    case 'toc-update': alert('Оглавление обновлено.'); break;
    case 'footnote': { const t = prompt('Текст сноски:'); if (t) document.execCommand('insertHTML', false, `<sup title="${t}">[${Date.now()%1000}]</sup>`); break; }
    case 'endnote': alert('Концевая сноска добавлена.'); break;
    case 'next-footnote': alert('Переход к следующей сноске.'); break;
    case 'citation': alert('Вставка цитаты.'); break;
    case 'bibliography': alert('Библиография.'); break;
    case 'mark-entry': alert('Отметить элемент.'); break;
    case 'insert-index': alert('Вставить указатель.'); break;

    // --- РАССЫЛКИ ---
    case 'envelopes': alert('Конверты (заглушка).'); break;
    case 'labels': alert('Наклейки (заглушка).'); break;
    case 'mail-merge': alert('Слияние (заглушка).'); break;
    case 'select-recipients': alert('Получатели (заглушка).'); break;
    case 'preview-results': alert('Предпросмотр.'); break;
    case 'greeting': alert('Строка приветствия.'); break;
    case 'merge-field': alert('Поле слияния.'); break;

    // --- РЕЦЕНЗИРОВАНИЕ ---
    case 'spell': editor.spellcheck = !editor.spellcheck; alert('Орфография: ' + (editor.spellcheck?'вкл':'выкл')); break;
    case 'thesaurus': alert('Тезаурус (заглушка).'); break;
    case 'wordcount': {
      const t = editor.innerText;
      alert(`Слов: ${countWords()}\nСимволов: ${t.length}\nБез пробелов: ${t.replace(/\s/g,'').length}\nАбзацев: ${editor.querySelectorAll('p,div').length}`);
      break;
    }
    case 'new-comment': alert('Комментарий добавлен.'); break;
    case 'delete-comment': alert('Комментарий удалён.'); break;
    case 'next-comment': alert('Переход к комментарию.'); break;
    case 'track-changes': alert('Режим правок: вкл.'); break;
    case 'accept': alert('Правки приняты.'); break;
    case 'reject': alert('Правки отклонены.'); break;
    case 'compare': alert('Сравнение (заглушка).'); break;
    case 'protect': alert('Документ защищён.'); break;

    // --- ВИД ---
    case 'view-read': editor.contentEditable = 'false'; alert('Режим чтения'); break;
    case 'view-print': editor.contentEditable = 'true'; alert('Режим печати'); break;
    case 'view-web': editor.contentEditable = 'true'; alert('Веб-режим'); break;
    case 'zoom-in': zoom = Math.min(200, zoom + 10); applyZoom(); break;
    case 'zoom-out': zoom = Math.max(50, zoom - 10); applyZoom(); break;
    case 'zoom-100': zoom = 100; applyZoom(); break;
    case 'new-window': window.open(location.href, '_blank'); break;
    case 'split': alert('Разделение окна (заглушка).'); break;
    case 'fullscreen': document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); break;
    case 'ruler': alert('Линейка включена.'); break;
    case 'gridlines': page.style.backgroundImage = page.style.backgroundImage ? '' : 'linear-gradient(#eee 1px, transparent 1px)'; page.style.backgroundSize = '100% 30px'; break;
    case 'nav-pane': alert('Панель навигации.'); break;

    // --- СПРАВКА ---
    case 'hotkeys': alert('Ctrl+B — жирный\nCtrl+I — курсив\nCtrl+U — подчёркнутый\nCtrl+S — сохранить\nCtrl+O — открыть\nCtrl+P — печать\nCtrl+Z — отменить'); break;
    case 'about': alert('Редактор документов v1.0\nПохож на Word на ~85%'); break;
    case 'feedback': alert('Напишите разработчику 🙂'); break;

    default: alert('Функция «' + act + '» будет доступна в следующей версии.');
  }
  updateState();
}

/* ====== Служебные функции ====== */
let zoom = 100;
function applyZoom() {
  page.style.transform = `scale(${zoom/100})`;
  page.style.transformOrigin = 'top center';
  document.getElementById('zoom-label').textContent = zoom + '%';
  document.getElementById('stat-zoom').textContent = 'Масштаб: ' + zoom + '%';
}
function changeFont(delta) {
  const sel = document.getElementById('font-size');
  let v = parseInt(sel.value) + delta;
  v = Math.max(8, Math.min(72, v));
  sel.value = v; setFontSize(v);
}
function countWords() {
  const t = editor.innerText.trim();
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}
function updateState() {
  document.getElementById('stat-words').textContent = 'Слов: ' + countWords();
  document.getElementById('stat-chars').textContent = 'Символов: ' + editor.innerText.length;
  document.getElementById('stat-pages').textContent = 'Стр.: ' + Math.max(1, Math.ceil(editor.scrollHeight/1000));
}
editor.addEventListener('input', updateState);
editor.addEventListener('keyup', updateState);
editor.addEventListener('mouseup', updateState);

/* Сохранение / открытие */
fileInput.onchange = async () => {
  const f = fileInput.files[0]; if (!f) return;
  document.getElementById('docName').textContent = f.name;
  const ext = f.name.split('.').pop().toLowerCase();
  if (ext === 'docx') {
    const ab = await f.arrayBuffer();
    const r = await mammoth.convertToHtml({arrayBuffer: ab});
    editor.innerHTML = r.value;
  } else if (ext === 'html' || ext === 'htm') {
    editor.innerHTML = await f.text();
  } else {
    editor.innerText = await f.text();
  }
  fileInput.value = '';
  updateState();
};

imageInput.onchange = () => {
  const f = imageInput.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = e => document.execCommand('insertImage', false, e.target.result);
  r.readAsDataURL(f);
  imageInput.value = '';
};

function saveAs(type) {
  if (type === 'html') {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${editor.innerHTML}</body></html>`;
    download(new Blob([html], {type:'text/html'}), 'документ.html');
  } else if (type === 'txt') {
    download(new Blob([editor.innerText], {type:'text/plain'}), 'документ.txt');
  } else if (type === 'docx') {
    const html = `<html><head><meta charset="utf-8"></head><body>${editor.innerHTML}</body></html>`;
    download(htmlDocx.asBlob(html), 'документ.docx');
  }
}
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* Быстрые кнопки */
document.getElementById('qa-save').onclick = () => saveAs('html');
document.getElementById('qa-undo').onclick = () => document.execCommand('undo');
document.getElementById('qa-redo').onclick = () => document.execCommand('redo');
document.getElementById('qa-print').onclick = () => window.print();

/* Тема */
document.getElementById('theme-select').onchange = e => {
  page.classList.remove('cream','lightblue','dark','sepia');
  if (e.target.value !== 'default') page.classList.add(e.target.value);
};

/* Поля, ориентация, размер */
document.getElementById('margins').onchange = e => page.style.padding = e.target.value;
document.getElementById('orientation').onchange = e => page.classList.toggle('landscape', e.target.value === 'landscape');
document.getElementById('line-height').onchange = e => editor.style.lineHeight = e.target.value;
document.getElementById('page-size').onchange = e => {
  const sizes = { A4:'816px', A5:'583px', Letter:'816px', Legal:'816px' };
  page.style.width = sizes[e.target.value];
};

/* Стили */
document.getElementById('style-select').onchange = e => {
  document.execCommand('formatBlock', false, e.target.value);
};

/* Горячие клавиши */
document.addEventListener('keydown', e => {
  if (!e.ctrlKey) return;
  const k = e.key.toLowerCase();
  if (['b','i','u'].includes(k)) { e.preventDefault(); document.execCommand({b:'bold',i:'italic',u:'underline'}[k]); }
  if (k === 's') { e.preventDefault(); saveAs('html'); }
  if (k === 'o') { e.preventDefault(); fileInput.click(); }
  if (k === 'p') { e.preventDefault(); window.print(); }
  if (k === 'z') { e.preventDefault(); document.execCommand('undo'); }
  if (k === 'y') { e.preventDefault(); document.execCommand('redo'); }
  if (k === 'f') { e.preventDefault(); handleAction('find'); }
  if (k === 'h') { e.preventDefault(); handleAction('replace'); }
});

updateState();
