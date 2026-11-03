const TABLE = document.getElementById('periodic-table');
const MODAL = document.getElementById('modal');
const MODAL_BODY = document.getElementById('modal-body');
const MODAL_CLOSE = document.getElementById('modal-close');

let elementsData = [];

/* ---------- Загрузка локальных данных ---------- */
async function loadData() {
  const response = await fetch('data.json');
  if (!response.ok) {
    throw new Error(`Не удалось загрузить data.json: ${response.status}`);
  }
  const data = await response.json();
  elementsData = data.elements
    .slice()
    .sort((a, b) => a.number - b.number);

  buildTable();
}

/* ---------- Построение таблицы ---------- */
function buildTable() {
  TABLE.innerHTML = '';

  const map = new Map();
  elementsData.forEach((el) => {
    if (el.group != null && el.period != null) {
      map.set(`${el.group}-${el.period}`, el);
    }
  });

  for (let period = 1; period <= 7; period++) {
    for (let group = 1; group <= 18; group++) {
      const el = map.get(`${group}-${period}`);
      const cell = document.createElement('div');
      cell.className = 'element-cell';

      if (el) {
        cell.dataset.category = el.category || '';
        cell.tabIndex = 0;
        cell.setAttribute('role', 'button');
        cell.setAttribute('aria-label', `${el.name_ru || el.symbol}, номер ${el.number}`);

        cell.innerHTML = `
          <span class="number">${el.number}</span>
          <span class="symbol">${el.symbol}</span>
          <span class="name">${el.name_ru || ''}</span>
        `;

        cell.addEventListener('click', () => showElement(el));
        cell.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showElement(el);
          }
        });
      } else {
        cell.classList.add('spacer');
      }

      TABLE.appendChild(cell);
    }
  }

  appendSpecialRow(57, 71);
  appendSpecialRow(89, 103);
}

function appendSpecialRow(startZ, endZ) {
  const row = document.createElement('div');
  row.className = 'special-row';
  row.style.display = 'grid';
  row.style.gridTemplateColumns = 'repeat(15, var(--cell))';
  row.style.gap = '4px';
  row.style.marginTop = '8px';

  for (let z = startZ; z <= endZ; z++) {
    const el = elementsData.find((item) => item.number === z);
    const cell = document.createElement('div');
    cell.className = 'element-cell';

    if (el) {
      cell.dataset.category = el.category || '';
      cell.tabIndex = 0;
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-label', `${el.name_ru || el.symbol}, номер ${el.number}`);

      cell.innerHTML = `
        <span class="number">${el.number}</span>
        <span class="symbol">${el.symbol}</span>
        <span class="name">${el.name_ru || ''}</span>
      `;

      cell.addEventListener('click', () => showElement(el));
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showElement(el);
        }
      });
    } else {
      cell.classList.add('spacer');
    }

    row.appendChild(cell);
  }

  TABLE.appendChild(row);
}

/* ---------- Форматирование ---------- */
function fmt(value, unit = '', digits = 2) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') {
    return `${value.toFixed(digits).replace(/\.?0+$/, '')} ${unit}`.trim();
  }
  return `${value} ${unit}`.trim();
}

function fmtTemp(kelvin) {
  if (kelvin === null || kelvin === undefined) return '—';
  const c = kelvin - 273.15;
  return `${kelvin} K (${c.toFixed(1)} °C)`;
}

/* ---------- Модальное окно ---------- */
function showElement(el) {
  const stateMap = { Gas: 'Газ', Liquid: 'Жидкость', Solid: 'Твёрдое' };
  const state = stateMap[el.phase] || el.phase || '—';

  let densityText = '—';
  if (el.phase === 'Solid' || el.phase === 'Liquid') {
    if (el.density_g_cm3 != null) densityText = `${el.density_g_cm3} г/см³`;
  } else if (el.phase === 'Gas') {
    densityText = '— (газ при н.у.)';
  }

  const history =
    el.history_ru ||
    `История открытия этого элемента пока не добавлена. Год открытия: ${
      el.discovery_year || 'неизвестен'
    }.`;

  MODAL_BODY.innerHTML = `
    <h2>${el.name_ru || el.name || el.symbol} (${el.symbol})</h2>
    <div class="subtitle">
      Порядковый номер ${el.number} · Период ${el.period || '—'} ·
      Группа ${el.group || '—'} · ${el.category || ''}
    </div>

    <div class="props-grid">
      <div class="prop">
        <span class="label">Электроотрицательность</span>
        <span class="value">${fmt(el.electronegativity)}</span>
      </div>
      <div class="prop">
        <span class="label">Температура плавления</span>
        <span class="value">${fmtTemp(el.melt)}</span>
      </div>
      <div class="prop">
        <span class="label">Температура кипения</span>
        <span class="value">${fmtTemp(el.boil)}</span>
      </div>
      <div class="prop">
        <span class="label">Агрегатное состояние (н.у.)</span>
        <span class="value">${state}</span>
      </div>
      <div class="prop">
        <span class="label">Плотность (тв./жидк.)</span>
        <span class="value">${densityText}</span>
      </div>
    </div>

    <div class="history-title">История открытия</div>
    <p class="history-text">${history}</p>
  `;

  MODAL.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  MODAL.classList.add('hidden');
  document.body.style.overflow = '';
}

MODAL_CLOSE.addEventListener('click', closeModal);
MODAL.addEventListener('click', (e) => {
  if (e.target === MODAL) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !MODAL.classList.contains('hidden')) closeModal();
});

/* ---------- Запуск ---------- */
loadData().catch((err) => {
  console.error(err);
  TABLE.innerHTML = `<p style="color:#f87171;padding:16px;">Ошибка загрузки data.json: ${err.message}. Убедитесь, что файл лежит рядом с index.html.</p>`;
});