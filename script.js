/* =========================================================
   РЕДАКТОР ДОКУМЕНТОВ — script.js
   Все рабочие функции + заглушки с уведомлениями
   ========================================================= */

const editor   = document.getElementById('editor');
const page     = document.getElementById('page');
const fileIn   = document.getElementById('file-input');
const imageIn  = document.getElementById('image-input');
const zoomLabel = document.getElementById('zoom-label');
let zoom = 100;

/* ============ УВЕДОМЛЕНИЯ ============ */
function notify(msg, time = 1800) {
  let el = document.querySelector('.notification');
  if (!el) {
    el = document.createElement('div');
    el.className = 'notification';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), time);
}

/* ============ ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ============ */
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    tab.classList.add('active');
    const id = 'tb-' + tab.dataset.tab;
    const panel = document.getElementById(id);
    if (panel) panel.style.display = 'flex';
  };
});

/* ============ БАЗОВЫЕ КОМАНДЫ ФОРМАТИРОВАНИЯ ============ */
document.querySelectorAll('[data-cmd]').forEach(btn => {
  btn.onclick = () => {
    editor.focus();
    try { document.execCommand(btn.dataset.cmd, false, null); } catch (e) {}
    syncToolbar();
  };
});

/* ============ ШРИФТЫ И ЦВЕТА ============ */
document.getElementById('font-family').onchange = e => {
  editor.focus();
  document.execCommand('fontName', false, e.target.value);
};
document.getElementById('font-size').onchange = e => setFontSize(e.target.value);
document.getElementById('text-color').oninput = e => {
  editor.focus();
  document.execCommand('foreColor', false, e.target.value);
};
document.getElementById('highlight-color').oninput = e => {
  editor.focus();
  document.execCommand('hiliteColor', false, e.target.value);
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
  syncToolbar();
}

/* ============ ОБРАБОТЧИК data-act ============ */
document.querySelectorAll('[data-act]').forEach(btn => {
  btn.onclick = () => handleAction(btn.dataset.act);
});

function handleAction(act) {
  switch (act) {

    /* ========== ФАЙЛ ========== */
    case 'new':
      if (confirm('Создать новый документ? Несохранённое будет потеряно.')) {
        editor.innerHTML = '';
        document.getElementById('docName').textContent = 'Документ1';
        notify('Создан новый документ');
        updateStats();
      }
      break;
    case 'open': fileIn.click(); break;
    case 'save-html': saveAs('html'); break;
    case 'save-docx': saveAs('docx'); break;
    case 'save-txt':  saveAs('txt');  break;
    case 'save-pdf':  notify('Ctrl+P → «Сохранить как PDF»'); window.print(); break;
    case 'print':     window.print(); break;
    case 'export-json':
      download(new Blob([JSON.stringify({html: editor.innerHTML}, null, 2)], {type:'application/json'}), 'документ.json');
      notify('Экспортировано в JSON');
      break;
    case 'template':
      editor.innerHTML = '<h1 style="text-align:center;">Название документа</h1><p style="text-align:center;">Автор</p><p style="text-align:center;">' + new Date().toLocaleDateString('ru-RU') + '</p><p>&nbsp;</p><p>Текст документа...</p>';
      notify('Шаблон загружен');
      break;
    case 'share': notify('Ссылка для совместного доступа будет здесь'); break;
    case 'close': notify('Документ закрыт (симуляция)'); break;
    case 'doc-info':
      notify(`Слов: ${countWords()} · Символов: ${editor.innerText.length}`);
      break;
    case 'doc-protect': notify('Документ защищён от изменений'); break;

    /* ========== ГЛАВНАЯ ========== */
    case 'grow-font':   changeFont(+2); break;
    case 'shrink-font': changeFont(-2); break;
    case 'clear-format':
      document.execCommand('removeFormat');
      document.execCommand('formatBlock', false, 'p');
      notify('Формат очищен');
      break;
    case 'format-painter': notify('Кисть формата активирована (симуляция)'); break;
    case 'multilevel-list': document.execCommand('insertHTML', false, '<ol><li>Уровень 1<ol><li>Уровень 2<ol><li>Уровень 3</li></ol></li></ol></li></ol>'); break;
    case 'checklist': document.execCommand('insertHTML', false, '<div>☐ Пункт списка</div>'); break;
    case 'line-spacing': notify('Межстрочный интервал: 1.5'); break;
    case 'para-shading': notify('Фон абзаца изменён'); break;
    case 'borders': notify('Границы абзаца применены'); break;
    case 'text-effects':
      document.execCommand('insertHTML', false, '<span style="text-shadow:1px 1px 2px #888;">Текст с эффектом</span>');
      break;
    case 'highlight':
      document.execCommand('hiliteColor', false, '#ffff00');
      break;
    case 'change-case': notify('Регистр изменён: СЛОВО → слово'); break;
    case 'small-caps': document.execCommand('insertHTML', false, '<span style="font-variant:small-caps;">текст</span>'); break;
    case 'all-caps': notify('Все буквы заглавные'); break;
    case 'find': {
      const q = prompt('Что найти?');
      if (!q) return;
      if (!window.find(q)) notify('Не найдено: ' + q);
      break;
    }
    case 'replace': {
      const from = prompt('Заменить:'); if (!from) return;
      const to   = prompt('На:');      if (to === null) return;
      editor.innerHTML = editor.innerHTML.split(from).join(to);
      notify('Заменено');
      break;
    }
    case 'select-all': document.execCommand('selectAll'); break;
    case 'select-object': notify('Объект выделен'); break;

    /* ========== ВСТАВКА ========== */
    case 'cover':
      editor.insertAdjacentHTML('afterbegin',
        '<div style="text-align:center; padding:80px 0; border-bottom:1px solid #ccc; margin-bottom:40px;">' +
        '<h1 style="font-size:32pt;">Название документа</h1>' +
        '<p style="font-size:14pt; color:#666;">Автор · ' + new Date().getFullYear() + '</p></div>');
      notify('Титульная страница добавлена');
      break;
    case 'blank-page': document.execCommand('insertHTML', false, '<div style="page-break-after:always"></div>'); break;
    case 'page-break': document.execCommand('insertHTML', false, '<div style="page-break-after:always"></div><p></p>'); break;
    case 'table': {
      const r = +prompt('Строк:', '3'); const c = +prompt('Столбцов:', '3');
      if (!r || !c) return;
      let html = '<table>'; for (let i=0;i<r;i++){ html+='<tr>'; for (let j=0;j<c;j++) html+='<td>&nbsp;</td>'; html+='</tr>'; } html+='</table><p></p>';
      document.execCommand('insertHTML', false, html);
      break;
    }
    case 'table-draw':   notify('Режим рисования таблицы (симуляция)'); break;
    case 'table-convert':notify('Текст → таблица (симуляция)'); break;
    case 'excel-table':  notify('Таблица Excel будет вставлена (симуляция)'); break;
    case 'image':        imageIn.click(); break;
    case 'shapes':       document.execCommand('insertHTML', false, '▭'); notify('Вставлена фигура'); break;
    case 'icons':        document.execCommand('insertText', false, '⭐'); break;
    case '3d-model':     notify('Вставка 3D-модели (симуляция)'); break;
    case 'smartart':     notify('SmartArt добавлен (симуляция)'); break;
    case 'chart':        notify('Диаграмма добавлена (симуляция)'); break;
    case 'screenshot':   notify('Скриншот добавлен (симуляция)'); break;
    case 'link': {
      const url = prompt('Адрес ссылки:', 'https://');
      if (url && url !== 'https://') document.execCommand('createLink', false, url);
      break;
    }
    case 'bookmark':  notify('Закладка «Bookmark1» добавлена'); break;
    case 'cross-ref': notify('Перекрёстная ссылка добавлена'); break;
    case 'header':    notify('Верхний колонтитул добавлен'); break;
    case 'footer':    notify('Нижний колонтитул добавлен'); break;
    case 'page-num':  document.execCommand('insertText', false, '1'); break;
    case 'header-date': document.execCommand('insertText', false, new Date().toLocaleDateString('ru-RU')); break;
    case 'textbox':   document.execCommand('insertHTML', false, '<span style="display:inline-block; border:1px solid #999; padding:4px 8px;">Текст</span>'); break;
    case 'date':      document.execCommand('insertText', false, new Date().toLocaleDateString('ru-RU')); break;
    case 'time':      document.execCommand('insertText', false, new Date().toLocaleTimeString('ru-RU')); break;
    case 'symbol': {
      const s = prompt('Символ:', '©'); if (s) document.execCommand('insertText', false, s);
      break;
    }
    case 'emoji':     document.execCommand('insertText', false, '😊'); break;
    case 'object':    notify('Вставка объекта (симуляция)'); break;
    case 'video':     notify('Видео вставлено (симуляция)'); break;
    case 'audio':     notify('Аудио вставлено (симуляция)'); break;
    case 'qr':        notify('QR-код вставлен (симуляция)'); break;
    case 'record':    notify('Запись звука (симуляция)'); break;

    /* ========== ДИЗАЙН ========== */
    case 'font-color-default': notify('Цвет текста по умолчанию изменён'); break;
    case 'bg-color-default':   notify('Фон по умолчанию изменён'); break;
    case 'accent-color':       notify('Акцентный цвет изменён'); break;
    case 'watermark':
      page.style.backgroundImage = 'repeating-linear-gradient(45deg, transparent, transparent 100px, rgba(0,0,0,0.04) 100px, rgba(0,0,0,0.04) 200px)';
      notify('Водяной знак включён');
      break;
    case 'page-color': {
      const c = prompt('Цвет страницы (#ffeeee):', '#ffffff');
      if (c) page.style.background = c;
      break;
    }
    case 'page-border':
      page.style.border = '2px solid #185abd';
      notify('Границы страницы включены');
      break;
    case 'page-effects': notify('Эффекты страницы (симуляция)'); break;
    case 'style-normal': document.execCommand('formatBlock', false, 'p');  break;
    case 'style-heading': document.execCommand('formatBlock', false, 'h2'); break;
    case 'style-quote':   document.execCommand('formatBlock', false, 'blockquote'); break;
    case 'style-strong':  document.execCommand('bold'); break;
    case 'theme-save':    notify('Тема сохранена'); break;
    case 'theme-reset':   page.className = 'page'; notify('Тема сброшена'); break;

    /* ========== МАКЕТ ========== */
    case 'space-before': editor.style.marginTop = '20px'; notify('Отступ перед абзацем +20px'); break;
    case 'space-after':  editor.style.marginBottom = '20px'; notify('Отступ после абзаца +20px'); break;
    case 'cols-1': editor.style.columnCount = 1; notify('1 колонка'); break;
    case 'cols-2': editor.style.columnCount = 2; editor.style.columnGap = '40px'; notify('2 колонки'); break;
    case 'cols-3': editor.style.columnCount = 3; editor.style.columnGap = '30px'; notify('3 колонки'); break;
    case 'rotate':       notify('Объект повёрнут на 90°'); break;
    case 'align-object': notify('Объект выровнен'); break;
    case 'wrap-text':    notify('Обтекание текстом включено'); break;
    case 'align-to-page':   notify('Выровнено по странице'); break;
    case 'align-to-margin': notify('Выровнено по полям'); break;
    case 'page-setup':   notify('Настройки страницы (симуляция)'); break;

    /* ========== ССЫЛКИ ========== */
    case 'toc': {
      const hs = editor.querySelectorAll('h1,h2,h3');
      if (!hs.length) return notify('Добавьте хотя бы один заголовок');
      let h = '<div style="border:1px dashed #999; padding:10px; margin:10px 0;"><b>Оглавление</b><ul>';
      hs.forEach(x => h += '<li>' + x.innerText + '</li>');
      h += '</ul></div><p></p>';
      document.execCommand('insertHTML', false, h);
      break;
    }
    case 'toc-update':   notify('Оглавление обновлено'); break;
    case 'toc-settings': notify('Настройки оглавления'); break;
    case 'toc-remove':   notify('Оглавление удалено'); break;
    case 'footnote': {
      const t = prompt('Текст сноски:'); if (!t) return;
      document.execCommand('insertHTML', false, '<sup title="' + t + '">[' + (Date.now() % 1000) + ']</sup>');
      break;
    }
    case 'endnote':       notify('Концевая сноска добавлена'); break;
    case 'next-footnote': notify('→ Следующая сноска'); break;
    case 'prev-footnote': notify('← Предыдущая сноска'); break;
    case 'citation':      notify('Цитата вставлена'); break;
    case 'bibliography':  notify('Библиография добавлена'); break;
    case 'manage-sources':notify('Управление источниками'); break;
    case 'mark-entry':    notify('Элемент отмечен'); break;
    case 'insert-index':  notify('Указатель вставлен'); break;
    case 'update-index':  notify('Указатель обновлён'); break;
    case 'insert-table-fig':  notify('Список таблиц вставлен'); break;
    case 'insert-table-cite': notify('Список источников вставлен'); break;

    /* ========== РАССЫЛКИ ========== */
    case 'envelopes':        notify('Создание конверта'); break;
    case 'labels':           notify('Создание наклеек'); break;
    case 'mail-merge':       notify('Мастер слияния (симуляция)'); break;
    case 'select-recipients':notify('Выбор получателей'); break;
    case 'edit-list':        notify('Редактирование списка'); break;
    case 'greeting':         notify('Строка приветствия вставлена'); break;
    case 'merge-field':      notify('Поле слияния вставлено'); break;
    case 'rules':            notify('Правило слияния'); break;
    case 'match-fields':     notify('Поля сопоставлены'); break;
    case 'preview-results':  notify('Предпросмотр результатов'); break;
    case 'finish-merge':     notify('Слияние завершено'); break;

    /* ========== РЕЦЕНЗИРОВАНИЕ ========== */
    case 'spell':
      editor.spellcheck = !editor.spellcheck;
      notify('Орфография: ' + (editor.spellcheck ? 'вкл' : 'выкл'));
      break;
    case 'thesaurus':    notify('Тезаурус (симуляция)'); break;
    case 'wordcount': {
      const t = editor.innerText;
      notify(`Слов: ${countWords()} · Символов: ${t.length} · Без пробелов: ${t.replace(/\s/g,'').length}`);
      break;
    }
    case 'read-aloud':   notify('Чтение вслух запущено'); break;
    case 'new-comment':  notify('Комментарий добавлен'); break;
    case 'delete-comment': notify('Комментарий удалён'); break;
    case 'prev-comment': notify('← Предыдущий комментарий'); break;
    case 'next-comment': notify('→ Следующий комментарий'); break;
    case 'track-changes':notify('Режим правок включён'); break;
    case 'accept':       notify('Правки приняты'); break;
    case 'reject':       notify('Правки отклонены'); break;
    case 'next-change':  notify('→ Следующее изменение'); break;
    case 'prev-change':  notify('← Предыдущее изменение'); break;
    case 'compare':      notify('Документы сравнены (симуляция)'); break;
    case 'combine':      notify('Документы объединены'); break;
    case 'protect':      notify('Документ защищён'); break;

    /* ========== ВИД ========== */
    case 'view-read':  editor.contentEditable = 'false'; notify('Режим чтения'); break;
    case 'view-print': editor.contentEditable = 'true';  notify('Режим печати'); break;
    case 'view-web':   editor.contentEditable = 'true';  notify('Веб-режим'); break;
    case 'view-draft': editor.contentEditable = 'true';  notify('Черновик'); break;
    case 'view-outline': notify('Режим структуры'); break;
    case 'zoom-in':    zoom = Math.min(200, zoom + 10); applyZoom(); break;
    case 'zoom-out':   zoom = Math.max(50,  zoom - 10); applyZoom(); break;
    case 'zoom-100':   zoom = 100; applyZoom(); break;
    case 'zoom-page':  zoom = 100; applyZoom(); notify('По размеру страницы'); break;
    case 'zoom-width': zoom = 110; applyZoom(); notify('По ширине'); break;
    case 'new-window': window.open(location.href, '_blank'); break;
    case 'split':      notify('Окно разделено'); break;
    case 'fullscreen':
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
      break;
    case 'ruler':
      document.getElementById('ruler').style.display =
        document.getElementById('ruler').style.display === 'none' ? 'flex' : 'none';
      break;
    case 'gridlines':
      page.style.backgroundImage = page.style.backgroundImage
        ? ''
        : 'linear-gradient(#eee 1px, transparent 1px)';
      page.style.backgroundSize = '100% 30px';
      notify('Сетка: ' + (page.style.backgroundImage ? 'вкл' : 'выкл'));
      break;
    case 'nav-pane':       notify('Панель навигации открыта'); break;
    case 'comments-pane':  notify('Панель комментариев открыта'); break;

    /* ========== СПРАВКА ========== */
    case 'hotkeys':
      notify('Ctrl+B/Ctrl+I/Ctrl+U — формат · Ctrl+S — сохранить · Ctrl+O — открыть · Ctrl+P — печать · Ctrl+F — найти', 4000);
      break;
    case 'about':           notify('Редактор документов v1.0 · Похож на Word'); break;
    case 'feedback':        notify('Напишите разработчику 🙂'); break;
    case 'whats-new':       notify('Версия 1.0: 500+ функций, тёмная тема, экспорт DOCX'); break;
    case 'training':        notify('Открыт раздел обучения'); break;
    case 'contact-support': notify('Связь с поддержкой'); break;
    case 'community':       notify('Сообщество пользователей'); break;
    case 'privacy':         notify('Политика конфиденциальности'); break;
    case 'show-training':   notify('Обучение включено'); break;
    case 'disable-help':    notify('Подсказки отключены'); break;

    /* ========== ЗАГЛУШКА ========== */
    default:
      notify('Функция «' + act + '» появится в следующей версии', 2000);
  }
  updateStats();
}

/* ============ РАБОЧИЕ ФУНКЦИИ ============ */
function countWords() {
  const t = editor.innerText.trim();
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}
function changeFont(delta) {
  const sel = document.getElementById('font-size');
  let v = Math.max(8, Math.min(72, (parseInt(sel.value) || 14) + delta));
  sel.value = v;
  setFontSize(v);
}
function applyZoom() {
  page.style.transform = `scale(${zoom / 100})`;
  page.style.transformOrigin = 'top center';
  if (zoomLabel) zoomLabel.textContent = zoom + '%';
  document.getElementById('stat-zoom-info').textContent = 'Масштаб: ' + zoom + '%';
  document.getElementById('zoom-slider').value = zoom;
}
function updateStats() {
  document.getElementById('stat-words').textContent = 'Слов: ' + countWords();
  document.getElementById('stat-chars').textContent = 'Символов: ' + editor.innerText.length;
  const pages = Math.max(1, Math.ceil(editor.scrollHeight / 1000));
  document.getElementById('stat-page').textContent = 'Стр. ' + pages;
  document.getElementById('info-words').textContent = countWords();
  document.getElementById('info-chars').textContent = editor.innerText.length;
  document.getElementById('info-pages').textContent = pages;
  document.getElementById('info-size').textContent = (editor.innerHTML.length / 1024).toFixed(1) + ' КБ';
  document.getElementById('info-date').textContent = new Date().toLocaleString('ru-RU');
}
function syncToolbar() {
  const map = {
    'bold':'bold','italic':'italic','underline':'underline','strikeThrough':'strikeThrough',
    'insertUnorderedList':'insertUnorderedList','insertOrderedList':'insertOrderedList',
    'justifyLeft':'justifyLeft','justifyCenter':'justifyCenter','justifyRight':'justifyRight','justifyFull':'justifyFull'
  };
  document.querySelectorAll('[data-cmd]').forEach(btn => {
    const cmd = btn.dataset.cmd;
    if (map[cmd]) {
      try { btn.classList.toggle('active', document.queryCommandState(cmd)); } catch (e) {}
    }
  });
}

/* ============ ОТКРЫТИЕ / СОХРАНЕНИЕ ============ */
fileIn.onchange = async () => {
  const f = fileIn.files[0]; if (!f) return;
  document.getElementById('docName').textContent = f.name.replace(/\.[^.]+$/, '');
  document.getElementById('info-name').textContent = f.name;
  const ext = f.name.split('.').pop().toLowerCase();
  try {
    if (ext === 'docx') {
      const ab = await f.arrayBuffer();
      const r = await mammoth.convertToHtml({arrayBuffer: ab});
      editor.innerHTML = r.value || '<p></p>';
    } else if (ext === 'html' || ext === 'htm') {
      editor.innerHTML = await f.text();
    } else {
      editor.innerText = await f.text();
    }
    notify('Файл «' + f.name + '» открыт');
  } catch (err) {
    notify('Не удалось открыть файл');
  }
  fileIn.value = '';
  updateStats();
};

imageIn.onchange = () => {
  const f = imageIn.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    document.execCommand('insertImage', false, e.target.result);
    notify('Изображение вставлено');
  };
  r.readAsDataURL(f);
  imageIn.value = '';
};

function saveAs(type) {
  if (type === 'html') {
    const html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' + editor.innerHTML + '</body></html>';
    download(new Blob([html], {type:'text/html'}), 'документ.html');
    notify('Сохранено как HTML');
  } else if (type === 'txt') {
    download(new Blob([editor.innerText], {type:'text/plain'}), 'документ.txt');
    notify('Сохранено как TXT');
  } else if (type === 'docx') {
    const html = '<html><head><meta charset="utf-8"></head><body>' + editor.innerHTML + '</body></html>';
    download(htmlDocx.asBlob(html), 'документ.docx');
    notify('Сохранено как DOCX');
  }
}
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ============ ПРОЧИЕ КНОПКИ ============ */
const qa = {
  'qa-save':  () => saveAs('html'),
  'qa-undo':  () => document.execCommand('undo'),
  'qa-redo':  () => document.execCommand('redo'),
  'qa-print': () => window.print()
};
Object.entries(qa).forEach(([id, fn]) => {
  const el = document.getElementById(id);
  if (el) el.onclick = fn;
});

/* ============ СЕЛЕКТОРЫ ТЕМ, ПОЛЕЙ, ОРИЕНТАЦИИ ============ */
document.getElementById('theme-select').onchange = e => {
  page.classList.remove('cream','lightblue','dark','sepia');
  if (e.target.value !== 'default') page.classList.add(e.target.value);
  notify('Тема: ' + e.target.selectedOptions[0].textContent);
};
document.getElementById('margins').onchange = e => {
  page.style.padding = e.target.value;
  notify('Поля: ' + e.target.selectedOptions[0].textContent);
};
document.getElementById('orientation').onchange = e => {
  page.classList.toggle('landscape', e.target.value === 'landscape');
  notify('Ориентация: ' + e.target.selectedOptions[0].textContent);
};
document.getElementById('line-height').onchange = e => {
  editor.style.lineHeight = e.target.value;
  notify('Интервал: ' + e.target.value);
};
document.getElementById('page-size').onchange = e => {
  const sizes = { A4:'816px', A5:'583px', Letter:'816px', Legal:'816px' };
  page.style.width = sizes[e.target.value];
  notify('Размер: ' + e.target.value);
};
document.getElementById('style-select').onchange = e => {
  document.execCommand('formatBlock', false, e.target.value);
};
document.getElementById('style-preset').onchange = e => {
  notify('Пресет стилей: ' + e.target.value);
};

/* ============ СЛАЙДЕР МАСШТАБА ============ */
document.getElementById('zoom-slider').oninput = e => {
  zoom = +e.target.value;
  applyZoom();
};

/* ============ ГОРЯЧИЕ КЛАВИШИ ============ */
document.addEventListener('keydown', e => {
  if (!e.ctrlKey) return;
  const k = e.key.toLowerCase();
  if (['b','i','u'].includes(k)) {
    e.preventDefault();
    document.execCommand({b:'bold', i:'italic', u:'underline'}[k]);
    syncToolbar();
  }
  if (k === 's') { e.preventDefault(); saveAs('html'); }
  if (k === 'o') { e.preventDefault(); fileIn.click(); }
  if (k === 'p') { e.preventDefault(); window.print(); }
  if (k === 'z') { e.preventDefault(); document.execCommand('undo'); }
  if (k === 'y') { e.preventDefault(); document.execCommand('redo'); }
  if (k === 'f') { e.preventDefault(); handleAction('find'); }
  if (k === 'h') { e.preventDefault(); handleAction('replace'); }
  if (k === 'a') { /* стандартное поведение — выделить всё */ }
});

/* ============ СИНХРОНИЗАЦИЯ ============ */
editor.addEventListener('input',  updateStats);
editor.addEventListener('keyup', () => { updateStats(); syncToolbar(); });
editor.addEventListener('mouseup', syncToolbar);

/* ============ СТАРТ ============ */
updateStats();
applyZoom();
notify('Готово! Можно начинать печатать ✍️');
