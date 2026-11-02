const editor = document.getElementById('editor');
const fileInput = document.getElementById('file-input');

// Переключение вкладок
document.querySelectorAll('.tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    // В реальном коде тут будет подгрузка панели под каждую вкладку
  };
});

// Форматирование
document.querySelectorAll('[data-cmd]').forEach(btn => {
  btn.onclick = () => {
    editor.focus();
    document.execCommand(btn.dataset.cmd, false, null);
  };
});

// Обработчики действий
document.querySelectorAll('[data-act]').forEach(btn => {
  btn.onclick = () => handleAction(btn.dataset.act);
});

function handleAction(act) {
  switch (act) {
    case 'save-html':
      const html = `<!DOCTYPE html><html><body>${editor.innerHTML}</body></html>`;
      const blob = new Blob([html], {type: 'text/html'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'документ.html';
      a.click();
      break;
    case 'open':
      fileInput.click();
      break;
    case 'clear-format':
      document.execCommand('removeFormat');
      break;
    case 'find':
      const q = prompt('Что найти?');
      if (q) window.find(q);
      break;
    case 'spell':
      editor.spellcheck = !editor.spellcheck;
      alert('Орфография: ' + (editor.spellcheck ? 'вкл' : 'выкл'));
      break;
    case 'select-all':
      document.execCommand('selectAll');
      break;
    case 'highlight':
      document.execCommand('hiliteColor', false, '#ffff00');
      break;
    case 'format-painter':
      alert('Кисть формата активирована');
      break;
    case 'style-normal':
      document.execCommand('formatBlock', false, 'p');
      break;
    case 'style-heading':
      document.execCommand('formatBlock', false, 'h1');
      break;
    case 'checklist':
      document.execCommand('insertHTML', false, '<div>☐ Пункт</div>');
      break;
    case 'line-spacing':
      editor.style.lineHeight = '1.5';
      break;
    case 'borders':
      editor.style.border = '1px solid #ccc';
      break;
    case 'grow-font':
    case 'shrink-font':
      alert('Изменение размера шрифта');
      break;
    case 'change-case':
      alert('Изменение регистра');
      break;
    default:
      alert('Функция в разработке: ' + act);
  }
}

// Загрузка файлов
fileInput.onchange = async () => {
  const file = fileInput.files[0];
  if (!file) return;
  if (file.name.endsWith('.docx')) {
    const ab = await file.arrayBuffer();
    const res = await mammoth.convertToHtml({arrayBuffer: ab});
    editor.innerHTML = res.value;
  } else {
    editor.innerText = await file.text();
  }
};

// Цвет
document.getElementById('text-color').oninput = (e) => {
  editor.focus();
  document.execCommand('foreColor', false, e.target.value);
};

// Шрифты
document.getElementById('font-family').onchange = (e) => {
  editor.focus();
  document.execCommand('fontName', false, e.target.value);
};

// Статистика
editor.addEventListener('input', () => {
  const text = editor.innerText.trim();
  document.getElementById('stat-words').textContent = 'Слов: ' + (text ? text.split(/\s+/).length : 0);
  document.getElementById('stat-chars').textContent = 'Символов: ' + text.length;
});
