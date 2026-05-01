/* ==========================================================================
   Expense & Budget Visualizer — javascript/script.js
   Pure vanilla JS, no external dependencies, works via file:// protocol.
   ========================================================================== */

/* --------------------------------------------------------------------------
   3.1  Constants and state object
   -------------------------------------------------------------------------- */

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Health', 'Other'];

const CATEGORY_COLORS = {
  Food:          '#FF6384',
  Transport:     '#36A2EB',
  Entertainment: '#FFCE56',
  Health:        '#4BC0C0',
  Other:         '#9966FF',
};

const STORAGE_KEY = 'expense_visualizer_transactions';

const state = {
  transactions: [],
  filter: { category: 'all', type: 'all' },
  sort: 'date-desc',
  storageAvailable: true,
};

/* --------------------------------------------------------------------------
   3.2  Storage module
   -------------------------------------------------------------------------- */

/**
 * Validates a single item against the Transaction schema.
 * Returns true only if all required fields are present.
 * @param {*} item
 * @returns {boolean}
 */
function isValidTransaction(item) {
  if (!item || typeof item !== 'object') return false;
  const required = ['id', 'description', 'amount', 'category', 'type', 'date'];
  return required.every((field) => Object.prototype.hasOwnProperty.call(item, field));
}

/**
 * Loads transactions from localStorage.
 * Sets state.storageAvailable = false on any error.
 * Discards items that fail schema validation.
 * @returns {Array}
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidTransaction);
  } catch (_err) {
    state.storageAvailable = false;
    return [];
  }
}

/**
 * Persists the transactions array to localStorage.
 * Sets state.storageAvailable = false on any error.
 * @param {Array} transactions
 */
function saveToStorage(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (_err) {
    state.storageAvailable = false;
  }
}

/* --------------------------------------------------------------------------
   6.1  Form validation
   -------------------------------------------------------------------------- */

/**
 * Validates form data for adding a transaction.
 * @param {{ description: string, amount: any, category: string, type: string, date: string }} formData
 * @returns {{ valid: boolean, errors: Object.<string, string> }}
 */
function validateForm(formData) {
  const errors = {};

  // Description: non-empty after trim
  if (!formData.description || String(formData.description).trim() === '') {
    errors.description = 'Description is required.';
  }

  // Amount: must be a positive finite number
  const amt = Number(formData.amount);
  if (
    formData.amount === undefined ||
    formData.amount === null ||
    formData.amount === '' ||
    !isFinite(amt) ||
    isNaN(amt) ||
    amt <= 0
  ) {
    errors.amount = 'Amount must be a positive number.';
  }

  // Category: must be one of CATEGORIES
  if (!formData.category || !CATEGORIES.includes(formData.category)) {
    errors.category = 'Please select a valid category.';
  }

  // Type: must be 'income' or 'expense'
  if (formData.type !== 'income' && formData.type !== 'expense') {
    errors.type = 'Please select a type (income or expense).';
  }

  // Date: must be a valid ISO date string (YYYY-MM-DD)
  if (!formData.date || !/^\d{4}-\d{2}-\d{2}$/.test(formData.date) || isNaN(Date.parse(formData.date))) {
    errors.date = 'Please enter a valid date.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/* --------------------------------------------------------------------------
   6.4  Add transaction
   -------------------------------------------------------------------------- */

/**
 * Generates a UUID using crypto.randomUUID() with a Date.now()-based fallback.
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: timestamp + random hex
  return (
    Date.now().toString(16) +
    '-' +
    Math.random().toString(16).slice(2, 10) +
    '-' +
    Math.random().toString(16).slice(2, 10)
  );
}

/**
 * Adds a new transaction to state, persists, and re-renders.
 * @param {{ description: string, amount: number, category: string, type: string, date: string }} data
 */
function addTransaction(data) {
  const transaction = {
    id: generateId(),
    description: String(data.description).trim(),
    amount: Number(data.amount),
    category: data.category,
    type: data.type,
    date: data.date,
    createdAt: Date.now(),
  };
  state.transactions.unshift(transaction);
  saveToStorage(state.transactions);
  render();
}

/* --------------------------------------------------------------------------
   7.1  Delete transaction
   -------------------------------------------------------------------------- */

/**
 * Removes a transaction by id, persists, and re-renders.
 * @param {string} id
 */
function deleteTransaction(id) {
  state.transactions = state.transactions.filter((t) => t.id !== id);
  saveToStorage(state.transactions);
  render();
}

/* --------------------------------------------------------------------------
   4.1  renderBalance()
   -------------------------------------------------------------------------- */

/**
 * Computes and renders the balance overview cards.
 */
function renderBalance() {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of state.transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else if (t.type === 'expense') {
      totalExpenses += t.amount;
    }
  }

  const netBalance = totalIncome - totalExpenses;

  const balanceEl = document.getElementById('balance');
  const incomeEl = document.getElementById('total-income');
  const expensesEl = document.getElementById('total-expenses');

  if (balanceEl) {
    balanceEl.textContent = formatRupiah(netBalance);
    balanceEl.classList.remove('positive', 'negative', 'zero');
    if (netBalance > 0) {
      balanceEl.classList.add('positive');
    } else if (netBalance < 0) {
      balanceEl.classList.add('negative');
    } else {
      balanceEl.classList.add('zero');
    }
  }

  if (incomeEl) {
    incomeEl.textContent = formatRupiah(totalIncome);
  }

  if (expensesEl) {
    expensesEl.textContent = formatRupiah(totalExpenses);
  }
}

/* --------------------------------------------------------------------------
   4.3  renderTransactionList()
   -------------------------------------------------------------------------- */

/**
 * Returns the filtered and sorted list of transactions based on state.filter.
 * Sorted newest-first by date, then by createdAt descending for ties.
 * @returns {Array}
 */
function getFilteredTransactions() {
  let list = state.transactions.slice();

  if (state.filter.category !== 'all') {
    list = list.filter((t) => t.category === state.filter.category);
  }

  if (state.filter.type !== 'all') {
    list = list.filter((t) => t.type === state.filter.type);
  }

  switch (state.sort) {
    case 'date-asc':
      list.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : (a.createdAt || 0) - (b.createdAt || 0));
      break;
    case 'name-asc':
      list.sort((a, b) => a.description.localeCompare(b.description, 'id'));
      break;
    case 'name-desc':
      list.sort((a, b) => b.description.localeCompare(a.description, 'id'));
      break;
    case 'amount-asc':
      list.sort((a, b) => a.amount - b.amount);
      break;
    case 'amount-desc':
      list.sort((a, b) => b.amount - a.amount);
      break;
    case 'date-desc':
    default:
      list.sort((a, b) => a.date > b.date ? -1 : a.date < b.date ? 1 : (b.createdAt || 0) - (a.createdAt || 0));
      break;
  }

  return list;
}

/**
 * Rebuilds the transaction list DOM from filtered state.
 */
function renderTransactionList() {
  const listEl = document.getElementById('transaction-list');
  const emptyEl = document.getElementById('list-empty');

  if (!listEl) return;

  const filtered = getFilteredTransactions();

  // Rebuild list HTML
  listEl.innerHTML = '';

  for (const t of filtered) {
    const li = document.createElement('li');
    li.className = t.type; // 'income' or 'expense'

    // Highlight jika expense melebihi limit
    const SPENDING_LIMIT = 100000;
    const isOverLimit = t.type === 'expense' && t.amount > SPENDING_LIMIT;
    if (isOverLimit) {
      li.classList.add('danger');
    }

    // Date
    const dateSpan = document.createElement('span');
    dateSpan.className = 'transaction-date';
    dateSpan.textContent = t.date;

    // Description
    const descSpan = document.createElement('span');
    descSpan.className = 'transaction-description';
    descSpan.textContent = t.description;

    // Category badge
    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.setAttribute('data-category', t.category);
    badge.textContent = t.category;

    // Amount
    const amtSpan = document.createElement('span');
    amtSpan.className = 'transaction-amount';
    const sign = t.type === 'income' ? '+' : '-';
    amtSpan.textContent = (t.type === 'income' ? '+' : '-') + formatRupiah(t.amount);

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.setAttribute('data-id', t.id);
    delBtn.setAttribute('aria-label', 'Delete transaction: ' + t.description);
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', function () {
      deleteTransaction(this.getAttribute('data-id'));
    });

    li.appendChild(dateSpan);
    li.appendChild(descSpan);
    li.appendChild(badge);
    li.appendChild(amtSpan);
    li.appendChild(delBtn);

    // Badge peringatan jika melebihi limit
    if (isOverLimit) {
      const warnBadge = document.createElement('span');
      warnBadge.className = 'limit-warning';
      warnBadge.textContent = '⚠️ WOI BOROS BANGET!';
      li.appendChild(warnBadge);
    }

    listEl.appendChild(li);
  }

  // Show/hide empty state
  if (emptyEl) {
    emptyEl.hidden = filtered.length > 0;
  }
}

/* --------------------------------------------------------------------------
   4.8  renderEmptyStates()
   -------------------------------------------------------------------------- */

/**
 * Shows/hides empty-state messages for the list and chart.
 */
function renderEmptyStates() {
  const listEmptyEl = document.getElementById('list-empty');
  const chartEmptyEl = document.getElementById('chart-empty');
  const chartCanvasEl = document.getElementById('chart-canvas');

  const filtered = getFilteredTransactions();
  const hasExpenses = state.transactions.some((t) => t.type === 'expense');

  if (listEmptyEl) {
    listEmptyEl.hidden = filtered.length > 0;
  }

  if (chartEmptyEl && chartCanvasEl) {
    if (hasExpenses) {
      chartEmptyEl.hidden = true;
      chartCanvasEl.hidden = false;
    } else {
      chartEmptyEl.hidden = false;
      chartCanvasEl.hidden = true;
    }
  }
}

/* --------------------------------------------------------------------------
   5.1  drawDonutSegment()
   -------------------------------------------------------------------------- */

/**
 * Draws a single filled donut arc segment on a canvas context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx  - Center x
 * @param {number} cy  - Center y
 * @param {number} r   - Outer radius
 * @param {number} innerR - Inner radius (hole)
 * @param {number} startAngle - Start angle in radians
 * @param {number} endAngle   - End angle in radians
 * @param {string} color      - Fill color
 */
function drawDonutSegment(ctx, cx, cy, r, innerR, startAngle, endAngle, color) {
  ctx.beginPath();
  // Outer arc (clockwise)
  ctx.arc(cx, cy, r, startAngle, endAngle, false);
  // Inner arc (counter-clockwise) creates the hole
  ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/* --------------------------------------------------------------------------
   5.2  renderChart()
   -------------------------------------------------------------------------- */

/**
 * Aggregates expense totals by category and returns a map.
 * @param {Array} transactions
 * @returns {Object.<string, number>}
 */
function aggregateExpensesByCategory(transactions) {
  const totals = {};
  for (const t of transactions) {
    if (t.type === 'expense') {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    }
  }
  return totals;
}

/**
 * Renders the donut chart and legend from current state.
 */
function renderChart() {
  const canvas = document.getElementById('chart-canvas');
  const chartEmptyEl = document.getElementById('chart-empty');
  const legendEl = document.getElementById('chart-legend');

  if (!canvas) return;

  // Check for canvas support
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    if (chartEmptyEl) chartEmptyEl.hidden = false;
    canvas.hidden = true;
    return;
  }

  const totals = aggregateExpensesByCategory(state.transactions);
  const categories = Object.keys(totals).filter((cat) => totals[cat] > 0);
  const grandTotal = categories.reduce((sum, cat) => sum + totals[cat], 0);

  if (grandTotal === 0 || categories.length === 0) {
    // No expense data — empty state handled by renderEmptyStates()
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (legendEl) legendEl.innerHTML = '';
    return;
  }

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 10;
  const innerR = r * 0.5;

  ctx.clearRect(0, 0, w, h);

  let startAngle = -Math.PI / 2; // Start from top

  // Draw segments and labels
  for (const cat of categories) {
    const value = totals[cat];
    const fraction = value / grandTotal;
    const endAngle = startAngle + fraction * 2 * Math.PI;
    const color = CATEGORY_COLORS[cat] || '#cccccc';

    drawDonutSegment(ctx, cx, cy, r, innerR, startAngle, endAngle, color);

    // Draw percentage label at midpoint of arc
    const midAngle = startAngle + (endAngle - startAngle) / 2;
    const labelR = (r + innerR) / 2;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);
    const pct = Math.round(fraction * 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Only draw label if segment is large enough
    if (fraction > 0.05) {
      ctx.fillText(cat + ' ' + pct + '%', lx, ly);
    }

    startAngle = endAngle;
  }

  // Rebuild legend
  if (legendEl) {
    legendEl.innerHTML = '';
    for (const cat of categories) {
      const value = totals[cat];
      const pct = Math.round((value / grandTotal) * 100);
      const li = document.createElement('li');

      const swatch = document.createElement('span');
      swatch.className = 'legend-swatch';
      swatch.style.backgroundColor = CATEGORY_COLORS[cat] || '#cccccc';

      const label = document.createTextNode(cat + ' — ' + pct + '%');

      li.appendChild(swatch);
      li.appendChild(label);
      legendEl.appendChild(li);
    }
  }
}

/* --------------------------------------------------------------------------
   9.2  renderFilterBadge()
   -------------------------------------------------------------------------- */

/**
 * Updates the transaction count badge.
 */
function renderFilterBadge() {
  const countEl = document.getElementById('transaction-count');
  if (!countEl) return;
  const filtered = getFilteredTransactions();
  countEl.textContent = 'Showing ' + filtered.length + ' transaction(s)';
}

/* --------------------------------------------------------------------------
   4.9  render() — top-level coordinator
   -------------------------------------------------------------------------- */

/**
 * Re-renders the entire UI from current state.
 */
function render() {
  renderBalance();
  renderTransactionList();
  renderChart();
  renderFilterBadge();
  renderEmptyStates();
  renderIncomeExpenseChart();
  renderCategoryDetailChart();
}

/* --------------------------------------------------------------------------
   9.1  applyFilter()
   -------------------------------------------------------------------------- */

/**
 * Reads filter selects, updates state.filter, and re-renders.
 */
function applyFilter() {
  const catEl = document.getElementById('filter-category');
  const typeEl = document.getElementById('filter-type');

  if (catEl) state.filter.category = catEl.value;
  if (typeEl) state.filter.type = typeEl.value;

  render();
}

/**
 * Reads sort select, updates state.sort, and re-renders.
 */
function applySort() {
  const sortEl = document.getElementById('sort-by');
  if (sortEl) state.sort = sortEl.value;
  render();
}

/* --------------------------------------------------------------------------
   10.1  clearAllTransactions()
   -------------------------------------------------------------------------- */

/**
 * Prompts for confirmation, then clears all transactions.
 */
function clearAllTransactions() {
  const confirmed = window.confirm(
    'Are you sure you want to delete ALL transactions? This cannot be undone.'
  );
  if (!confirmed) return;

  state.transactions = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_err) {
    state.storageAvailable = false;
  }
  render();
}

/* --------------------------------------------------------------------------
   6.5  Form submit handler
   -------------------------------------------------------------------------- */

/**
 * Handles the add-transaction form submission.
 * @param {Event} event
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;

  const formData = {
    description: form.querySelector('#description') ? form.querySelector('#description').value : '',
    amount:      form.querySelector('#amount')      ? form.querySelector('#amount').value      : '',
    category:    form.querySelector('#category')    ? form.querySelector('#category').value    : '',
    type:        form.querySelector('#type')        ? form.querySelector('#type').value        : '',
    date:        form.querySelector('#date')        ? form.querySelector('#date').value        : '',
  };

  const { valid, errors } = validateForm(formData);

  // Clear all previous errors
  const errorFields = ['description', 'amount', 'category', 'type', 'date'];
  for (const field of errorFields) {
    const errEl = document.getElementById(field + '-error');
    if (errEl) {
      errEl.textContent = '';
    }
    const inputEl = document.getElementById(field);
    if (inputEl) {
      inputEl.removeAttribute('aria-invalid');
    }
  }

  if (!valid) {
    // Populate error spans and focus first invalid field
    let firstInvalidEl = null;
    for (const field of errorFields) {
      if (errors[field]) {
        const errEl = document.getElementById(field + '-error');
        if (errEl) errEl.textContent = errors[field];
        const inputEl = document.getElementById(field);
        if (inputEl) {
          inputEl.setAttribute('aria-invalid', 'true');
          if (!firstInvalidEl) firstInvalidEl = inputEl;
        }
      }
    }
    if (firstInvalidEl) firstInvalidEl.focus();
    return;
  }

  // Success: add transaction
  addTransaction({
    description: formData.description,
    amount:      Number(formData.amount),
    category:    formData.category,
    type:        formData.type,
    date:        formData.date,
  });

  // Clear form fields
  form.reset();

  // Reset error spans
  for (const field of errorFields) {
    const errEl = document.getElementById(field + '-error');
    if (errEl) errEl.textContent = '';
    const inputEl = document.getElementById(field);
    if (inputEl) inputEl.removeAttribute('aria-invalid');
  }

  // Set date to today
  const dateEl = document.getElementById('date');
  if (dateEl) {
    dateEl.value = new Date().toISOString().slice(0, 10);
  }

  // Re-focus description
  const descEl = document.getElementById('description');
  if (descEl) descEl.focus();
}

/* --------------------------------------------------------------------------
   Chart 1: Income vs Expense (Chart.js bar chart)
   -------------------------------------------------------------------------- */

// Simpan instance Chart.js supaya bisa di-destroy sebelum re-render
let _chartIncomeExpense = null;
let _chartCategoryDetail = null;

/**
 * Render bar chart Income vs Expense menggunakan Chart.js.
 */
function renderIncomeExpenseChart() {
  const canvas  = document.getElementById('chart-income-expense');
  const emptyEl = document.getElementById('chart-income-expense-empty');

  if (!canvas) return;

  const totalIncome  = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const grandTotal   = totalIncome + totalExpense;

  // Destroy instance lama sebelum buat baru
  if (_chartIncomeExpense) {
    _chartIncomeExpense.destroy();
    _chartIncomeExpense = null;
  }

  if (grandTotal === 0) {
    canvas.hidden = true;
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  canvas.hidden = false;
  if (emptyEl) emptyEl.hidden = true;

  const pctIncome  = Math.round((totalIncome  / grandTotal) * 100);
  const pctExpense = Math.round((totalExpense / grandTotal) * 100);

  _chartIncomeExpense = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: [
        `Income (${pctIncome}%)`,
        `Expense (${pctExpense}%)`
      ],
      datasets: [{
        label: 'Jumlah (Rp)',
        data: [totalIncome, totalExpense],
        backgroundColor: ['#16a34a', '#dc2626'],
        borderColor:     ['#15803d', '#b91c1c'],
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      animation: { duration: 600, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ' ' + formatRupiah(ctx.parsed.y) +
              '  (' + (ctx.dataIndex === 0 ? pctIncome : pctExpense) + '%)'
          }
        },
        // Label persentase di atas bar
        datalabels: false,
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (val) => formatRupiah(val),
            maxTicksLimit: 6,
          },
          grid: { color: 'rgba(0,0,0,0.06)' }
        },
        x: {
          grid: { display: false }
        }
      }
    },
    plugins: [{
      // Plugin inline: gambar persentase di atas tiap bar
      id: 'topLabel',
      afterDatasetsDraw(chart) {
        const { ctx: c, data } = chart;
        const pcts = [pctIncome, pctExpense];
        chart.getDatasetMeta(0).data.forEach((bar, i) => {
          const val = data.datasets[0].data[i];
          if (!val) return;
          c.save();
          c.font = 'bold 12px system-ui, sans-serif';
          c.fillStyle = data.datasets[0].backgroundColor[i];
          c.textAlign = 'center';
          c.textBaseline = 'bottom';
          c.fillText(pcts[i] + '%', bar.x, bar.y - 4);
          c.restore();
        });
      }
    }]
  });
}

/* --------------------------------------------------------------------------
   Chart 2: Spending by Category Detail (Chart.js horizontal bar)
   -------------------------------------------------------------------------- */

/**
 * Render horizontal bar chart pengeluaran per kategori menggunakan Chart.js.
 */
function renderCategoryDetailChart() {
  const canvas  = document.getElementById('chart-category-detail');
  const emptyEl = document.getElementById('chart-category-detail-empty');

  if (!canvas) return;

  const totals     = aggregateExpensesByCategory(state.transactions);
  const categories = Object.keys(totals).filter(c => totals[c] > 0)
                       .sort((a, b) => totals[b] - totals[a]); // urutkan besar ke kecil
  const grandTotal = categories.reduce((s, c) => s + totals[c], 0);

  if (_chartCategoryDetail) {
    _chartCategoryDetail.destroy();
    _chartCategoryDetail = null;
  }

  if (grandTotal === 0) {
    canvas.hidden = true;
    if (emptyEl) emptyEl.hidden = false;
    return;
  }

  canvas.hidden = false;
  if (emptyEl) emptyEl.hidden = true;

  // Warna: terbesar → merah, terkecil → hijau, sisanya → oranye
  const colors = categories.map((cat, i) => {
    if (i === 0)                      return '#dc2626'; // merah — terbesar
    if (i === categories.length - 1)  return '#16a34a'; // hijau — terkecil
    return '#f59e0b';                                    // oranye — tengah
  });

  const pcts = categories.map(c => Math.round((totals[c] / grandTotal) * 100));
  const labels = categories.map((c, i) => `${c}  ${pcts[i]}%`);

  _chartCategoryDetail = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Pengeluaran (Rp)',
        data: categories.map(c => totals[c]),
        backgroundColor: colors,
        borderColor: colors.map(c => c),
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      animation: { duration: 600, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ' ' + formatRupiah(ctx.parsed.x) +
              '  (' + pcts[ctx.dataIndex] + '%)'
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: (val) => formatRupiah(val),
            maxTicksLimit: 5,
          },
          grid: { color: 'rgba(0,0,0,0.06)' }
        },
        y: {
          grid: { display: false }
        }
      }
    },
    plugins: [{
      // Plugin inline: gambar nilai Rupiah di ujung kanan tiap bar
      id: 'rightLabel',
      afterDatasetsDraw(chart) {
        const { ctx: c } = chart;
        chart.getDatasetMeta(0).data.forEach((bar, i) => {
          const val = categories[i] ? totals[categories[i]] : 0;
          if (!val) return;
          c.save();
          c.font = 'bold 10px system-ui, sans-serif';
          c.fillStyle = colors[i];
          c.textAlign = 'left';
          c.textBaseline = 'middle';
          c.fillText(formatRupiah(val), bar.x + 6, bar.y);
          c.restore();
        });
      }
    }]
  });
}

/* --------------------------------------------------------------------------
   12.  bindEvents()
   -------------------------------------------------------------------------- */

/**
 * Attaches all event listeners (called once on DOMContentLoaded).
 */
function bindEvents() {
  const form = document.getElementById('transaction-form');
  if (form) form.addEventListener('submit', handleFormSubmit);

  const filterCat = document.getElementById('filter-category');
  if (filterCat) filterCat.addEventListener('change', applyFilter);

  const filterType = document.getElementById('filter-type');
  if (filterType) filterType.addEventListener('change', applyFilter);

  const clearBtn = document.getElementById('clear-all-btn');
  if (clearBtn) clearBtn.addEventListener('click', clearAllTransactions);

  const sortBy = document.getElementById('sort-by');
  if (sortBy) sortBy.addEventListener('change', applySort);
}

/* --------------------------------------------------------------------------
   3.4  DOMContentLoaded bootstrap
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', function () {
  state.transactions = loadFromStorage();
  bindEvents();
  render();

  // Show storage warning if localStorage is unavailable
  const warningEl = document.getElementById('storage-warning');
  if (warningEl) {
    warningEl.hidden = state.storageAvailable !== false;
  }

  // Set default date to today
  const dateEl = document.getElementById('date');
  if (dateEl && !dateEl.value) {
    dateEl.value = new Date().toISOString().slice(0, 10);
  }
});

const toggleBtn = document.getElementById("toggleTheme");

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  toggleBtn.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

/* --------------------------------------------------------------------------
   Test surface — expose internals for browser-based tests
   (only used by tests/index.html; harmless in production)
   -------------------------------------------------------------------------- */

window._app = {
  STORAGE_KEY,
  CATEGORIES,
  CATEGORY_COLORS,
  loadFromStorage,
  saveToStorage,
  validateForm,
  addTransaction,
  deleteTransaction,
  renderBalance,
  renderTransactionList,
  renderChart,
  renderEmptyStates,
  renderFilterBadge,
  aggregateExpensesByCategory,
  getFilteredTransactions,
  render,
  bindEvents,
  applyFilter,
  clearAllTransactions,
};

// Format angka ke Rupiah
function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(angka);
}


// Expose state so tests can read and mutate it
window._appState = state;
