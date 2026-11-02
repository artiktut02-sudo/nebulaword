const editor = document.getElementById('editor');
const page = document.getElementById('page');
const fileInput = document.getElementById('file-input');
const imageInput = document.getElementById('image-input');
let zoom = 100;

/* ===== ВКЛАДКИ ===== */
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById('tb-' + tab.dataset.tab);
    if (panel) panel.classList.add('active');
  };
});

/* ===== ФОРМАТИРОВАНИЕ ===== */
document.querySelectorAll('[data-cmd]').forEach(btn => {
  btn.onclick = () => {
    editor.focus();
    document.execCommand(btn.dataset.cmd, false, null);
  };
});

document.getElementById('font-family').onchange = (e) => {
  editor.focus();
  document.execCommand('fontName', false, e.target.value);
};

document.getElementById('font-size').onchange = (e) => {
  editor.focus();
  const size = e.target.value;
  document.execCommand('fontSize', false, '7');
  editor.querySelectorAll('font[size="7"]').forEach(el => {
    const span = document.createElement('span');
    span.style.fontSize = size + 'pt';
    span.innerHTML = el.innerHTML;
    el.replaceWith(span);
  });
};

document.getElementById('text-color').oninput = (e) => {
  editor.focus();
  document.execCommand('foreColor', false, e.target.value);
};

document.getElementById('highlight-color').oninput = (e) => {
  editor.focus();
  document.execCommand('hiliteColor', false, e.target.value);
};

/* ===== ДЕЙСТВИЯ ===== */
document.querySelectorAll('[data-act]').forEach(btn => {
  btn.onclick = () => handleAction(btn.dataset.act);
});

function handleAction(act) {
  switch (act) {
    // Файл
    case 'new':
      if (confirm('Создать новый документ?')) {
        editor.innerHTML = '';
        document.getElementById('docName').textContent = 'Документ1';
        updateStats();
      }
      break;
    case 'open': fileInput.click(); break;
    case 'save-html':
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${editor.innerHTML}</body></html>`;
      downloadBlob(new Blob([html], {type:'text/html'}), 'документ.html');
      break;
    case 'save-docx':
      const docxHtml = `<html><head><meta charset="utf-8"></head><body>${editor.innerHTML}</body></html>`;
      downloadBlob(htmlDocx.asBlob(docxHtml), 'документ.docx');
      break;
    case 'print': window.print(); break;

    // Главная
    case 'grow-font': changeFont(+2); break;
    case 'shrink-font': changeFont(-2); break;
    case 'format-painter': alert('Кисть формата активирована (кликните по тексту)'); break;
    case 'style-normal': document.execCommand('formatBlock', false, 'p'); break;
    case 'style-heading': document.execCommand('formatBlock', false, 'h1'); break;
    case 'style-quote': document.execCommand('formatBlock', false, 'blockquote'); break;
    case 'find': {
      const q = prompt('Что найти?');
      if (q) window.find(q);
      break;
    }
    case 'replace': {
      const from = prompt('Заменить:');
      const to = prompt('На:');
      if (from && to) editor.innerHTML = editor.innerHTML.split(from).join(to);
      break;
    }
    case 'select-all': document.execCommand('selectAll'); break;

    // Вставка
    case 'image': imageInput.click(); break;
    case 'table': {
      const r = +prompt('Строк:', '3');
      const c = +prompt('Столбцов:', '3');
      if (!r || !c) return;
      let t = '<table>';
      for (let i = 0; i < r; i++) {
        t += '<tr>';
        for (let j = 0; j < c; j++) t += '<td>&nbsp;</td>';
        t += '</tr>';
      }
      t += '</table><p></p>';
      document.execCommand('insertHTML', false, t);
      break;
    }
    case 'link': {
      const url = prompt('Адрес ссылки:', 'https://');
      if (url && url !== 'https://') document.execCommand('createLink', false, url);
      break;
    }
    case 'bookmark': alert('Закладка добавлена'); break;
    case 'date': document.execCommand('insertText', false, new Date().toLocaleDateString('ru-RU')); break;
    case 'symbol': {
      const s = prompt('Символ:', '©');
      if (s) document.execCommand('insertText', false, s);
      break;
    }
    case 'shapes': document.execCommand('insertHTML', false, '<div style="border:1px solid #999;width:100px;height:50px;"></div>'); break;

    // Макет
    case 'toc': {
      const hs = editor.querySelectorAll('h1,h2,h3');
      if (!hs.length) return alert('Нет заголовков. Сделайте текст заголовком.');
      let h = '<div style="border:1px dashed #999;padding:10px;margin:10px 0"><b>Оглавление</b><ul>';
      hs.forEach(x => h += `<li>${x.innerText}</li>`);
      h += '</ul></div>';
      document.execCommand('insertHTML', false, h);
      break;
    }
    case 'footnote': {
      const t = prompt('Текст сноски:');
      if (t) document.execCommand('insertHTML', false, `<sup title="${t}">[${Date.now()%1000}]</sup>`);
      break;
    }

    // Рецензирование
    case 'spell': editor.spellcheck = !editor.spellcheck; alert('Орфография: ' + (editor.spellcheck ? 'вкл' : 'выкл')); break;
    case 'wordcount': alert(`Слов: ${countWords()}\nСимволов: ${editor.innerText.length}`); break;

    // Вид
    case 'zoom-in': zoom = Math.min(200, zoom + 10); applyZoom(); break;
    case 'zoom-out': zoom = Math.max(50, zoom - 10); applyZoom(); break;
  }
  updateStats();
}

/* ===== УТИЛИТЫ ===== */
function changeFont(delta) {
  const sel = document.getElementById('font-size');
  let v = Math.max(8, Math.min(72, (parseInt(sel.value) || 14) + delta));
  sel.value = v;
  editor.focus();
  document.execCommand('fontSize', false, '7');
  editor.querySelectorAll('font[size="7"]').forEach(el => {
    const span = document.createElement('span');
    span.style.fontSize = v + 'pt';
    span.innerHTML = el.innerHTML;
    el.replaceWith(span);
  });
}

function applyZoom() {
  page.style.transform = `scale(${zoom / 100})`;
  page.style.transformOrigin = 'top center';
  document.getElementById('zoom-label').textContent = zoom + '%';
}

function countWords() {
  const t = editor.innerText.trim();
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}

function updateStats() {
  document.getElementById('stat-words').textContent = 'Слов: ' + countWords();
  document.getElementById('stat-chars').textContent = 'Символов: ' + editor.innerText.length;
  document.getElementById('stat-page').textContent = 'Стр. ' + Math.max(1, Math.ceil(editor.scrollHeight / 1000));
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ===== ОТКРЫТИЕ ФАЙЛОВ ===== */
fileInput.onchange = async () => {
  const f = fileInput.files[0];
  if (!f) return;
  document.getElementById('docName').textContent = f.name.replace(/\.[^.]+$/, '');
  if (f.name.endsWith('.docx')) {
    const ab = await f.arrayBuffer();
    const r = await mammoth.convertToHtml({arrayBuffer: ab});
    editor.innerHTML = r.value;
  } else if (f.name.endsWith('.html')) {
    editor.innerHTML = await f.text();
  } else {
    editor.innerText = await f.text();
  }
  fileInput.value = '';
  updateStats();
};

imageInput.onchange = () => {
  const f = imageInput.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = e => document.execCommand('insertImage', false, e.target.result);
  r.readAsDataURL(f);
  imageInput.value = '';
};

/* ===== СЕЛЕКТОРЫ ===== */
document.getElementById('theme-select').onchange = (e) => {
  page.className = 'page';
  if (e.target.value !== 'default') page.classList.add(e.target.value);
};
document.getElementById('margins').onchange = (e) => page.style.padding = e.target.value;
document.getElementById('orientation').onchange = (e) => page.classList.toggle('landscape', e.target.value === 'landscape');

/* ===== ГОРЯЧИЕ КЛАВИШИ ===== */
document.addEventListener('keydown', (e) => {
  if (!e.ctrlKey) return;
  const k = e.key.toLowerCase();
  if (k === 'b') { e.preventDefault(); document.execCommand('bold'); }
  if (k === 'i') { e.preventDefault(); document.execCommand('italic'); }
  if (k === 'u') { e.preventDefault(); document.execCommand('underline'); }
  if (k === 's') { e.preventDefault(); handleAction('save-html'); }
  if (k === 'o') { e.preventDefault(); handleAction('open'); }
  if (k === 'p') { e.preventDefault(); handleAction('print'); }
});

/* ===== СЛУШАТЕЛИ ===== */
editor.addEventListener('input', updateStats);
editor.addEventListener('keyup', updateStats);
editor.addEventListener('mouseup', updateStats);
updateStats();
