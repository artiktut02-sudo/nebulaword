const editor = document.getElementById('editor');

// Команда форматирования
function exec(cmd, value = null) {
  document.execCommand(cmd, false, value);
  editor.focus();
  updateToolbarState();
}

// Жирный / курсив / подчёркнутый / зачёркнутый
document.getElementById('btn-bold').onclick      = () => exec('bold');
document.getElementById('btn-italic').onclick    = () => exec('italic');
document.getElementById('btn-underline').onclick = () => exec('underline');
document.getElementById('btn-strike').onclick    = () => exec('strikeThrough');

// Выравнивание
document.getElementById('btn-align-left').onclick    = () => exec('justifyLeft');
document.getElementById('btn-align-center').onclick  = () => exec('justifyCenter');
document.getElementById('btn-align-right').onclick   = () => exec('justifyRight');
document.getElementById('btn-align-justify').onclick = () => exec('justifyFull');

// Списки
document.getElementById('btn-ul').onclick = () => exec('insertUnorderedList');
document.getElementById('btn-ol').onclick = () => exec('insertOrderedList');

// Отмена / повтор
document.getElementById('btn-undo').onclick = () => exec('undo');
document.getElementById('btn-redo').onclick = () => exec('redo');

// Шрифт и размер
document.getElementById('font-family').onchange = e => exec('fontName', e.target.value);
document.getElementById('font-size').onchange   = e => {
  // execCommand fontSize принимает 1-7, поэтому через CSS
  const size = e.target.value + 'pt';
  document.execCommand('fontSize', false, '7');
  // Исправляем через span с реальным размером
  editor.querySelectorAll('font[size="7"]').forEach(el => {
    const span = document.createElement('span');
    span.style.fontSize = size;
    span.innerHTML = el.innerHTML;
    el.replaceWith(span);
  });
  editor.focus();
};

// Подсветка активных кнопок
function updateToolbarState() {
  const map = {
    'btn-bold': 'bold',
    'btn-italic': 'italic',
    'btn-underline': 'underline',
    'btn-strike': 'strikeThrough',
    'btn-align-left': 'justifyLeft',
    'btn-align-center': 'justifyCenter',
    'btn-align-right': 'justifyRight',
    'btn-align-justify': 'justifyFull',
    'btn-ul': 'insertUnorderedList',
    'btn-ol': 'insertOrderedList'
  };
  for (const [id, cmd] of Object.entries(map)) {
    document.getElementById(id).classList.toggle(
      'active', document.queryCommandState(cmd)
    );
  }
}
editor.addEventListener('keyup', updateToolbarState);
editor.addEventListener('mouseup', updateToolbarState);

// Сохранить как .html (можно открыть обратно)
document.getElementById('btn-save').onclick = () => {
  const blob = new Blob([editor.innerHTML], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'документ.html';
  a.click();
  URL.revokeObjectURL(a.href);
};

// Открыть файл
const fileInput = document.getElementById('file-input');
document.getElementById('btn-open').onclick = () => fileInput.click();
fileInput.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    if (file.name.endsWith('.txt')) {
      editor.innerText = ev.target.result;
    } else {
      editor.innerHTML = ev.target.result;
    }
  };
  reader.readAsText(file, 'utf-8');
  fileInput.value = ''; // чтобы можно было открыть тот же файл ещё раз
};

// Печать
document.getElementById('btn-print').onclick = () => window.print();
