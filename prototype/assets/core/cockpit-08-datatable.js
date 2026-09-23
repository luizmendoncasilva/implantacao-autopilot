/* ============================================================
   DATATABLE — componente novo (não existia no cockpit-core original).
   Tabela com ordenação, busca, paginação e seleção de linhas, seguindo
   os tokens de :root e o mesmo padrão imperativo (registro global por id,
   re-render completo a cada interação) usado no resto do cockpit-core.
   Uso:
     dtCreate('minha-tabela', {
       columns: [
         { key: 'nome', label: 'Cliente', sortable: true },
         { key: 'cnpj', label: 'CNPJ', mono: true },
         { key: 'status', label: 'Status', render: (row) => `<span class="badge badge-success">${row.status}</span>` },
       ],
       rows: [...],
       rowKey: 'id',
       pageSize: 10,
       selectable: true,
       searchable: true,
       onRowClick: (row) => abrirDetalhe(row.id),
       emptyMessage: 'Nenhum registro encontrado.',
     });
   Depois, monte o container: <div id="dt-minha-tabela"></div> (prefixo "dt-" + id).
   ============================================================ */
(function () {
  const style = document.createElement('style');
  style.textContent = `
  .dt-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
  .dt-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
  .dt-search-wrap { position: relative; flex: 1; max-width: 320px; min-width: 180px; }
  .dt-search-wrap i[data-lucide] { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: var(--text-tertiary); }
  .dt-search { width: 100%; height: 34px; padding: 0 10px 0 32px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; font-family: inherit; outline: none; background: #fff; color: var(--text-primary); }
  .dt-search:focus { border-color: var(--brand-pink); box-shadow: 0 0 0 2px var(--brand-pink-soft); }
  .dt-count { font-size: 12px; color: var(--text-tertiary); white-space: nowrap; }
  .dt-bulk { font-size: 12.5px; color: var(--brand-pink); font-weight: 600; white-space: nowrap; }
  .dt-scroll { overflow-x: auto; }
  .dt-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .dt-table thead th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); padding: 10px 16px; background: var(--surface-subtle); border-bottom: 1px solid var(--border); white-space: nowrap; }
  .dt-th-sortable { cursor: pointer; user-select: none; display: inline-flex; align-items: center; gap: 4px; }
  .dt-th-sortable:hover { color: var(--text-secondary); }
  .dt-th-sortable i[data-lucide] { width: 12px; height: 12px; opacity: 0.5; }
  .dt-th-sortable.active i[data-lucide] { opacity: 1; color: var(--brand-pink); }
  .dt-table tbody td { padding: 12px 16px; border-bottom: 1px solid var(--border); color: var(--text-primary); vertical-align: middle; }
  .dt-table tbody tr:last-child td { border-bottom: none; }
  .dt-row-clickable { cursor: pointer; transition: background .12s; }
  .dt-row-clickable:hover { background: var(--surface-subtle); }
  .dt-row-selected { background: var(--brand-pink-soft) !important; }
  .dt-td-mono { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; }
  .dt-checkbox-cell { width: 36px; }
  .dt-checkbox { width: 16px; height: 16px; accent-color: var(--brand-pink); cursor: pointer; }
  .dt-empty { padding: 48px 24px; text-align: center; color: var(--text-tertiary); font-size: 13px; }
  .dt-footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--border); background: var(--surface-subtle); }
  .dt-footer-info { font-size: 12px; color: var(--text-tertiary); margin-right: auto; }
  `;
  document.head.appendChild(style);
})();

const _dt = {};

function dtCreate(id, cfg) {
  _dt[id] = Object.assign({
    columns: [],
    rows: [],
    rowKey: 'id',
    pageSize: 10,
    page: 1,
    selectable: false,
    searchable: false,
    search: '',
    sortKey: null,
    sortDir: 'asc',
    selectedIds: new Set(),
    onRowClick: null,
    emptyMessage: 'Nenhum registro encontrado.',
  }, cfg || {});
  dtRender(id);
}

function dtSetRows(id, rows) {
  const t = _dt[id]; if (!t) return;
  t.rows = rows || []; t.page = 1; t.selectedIds = new Set();
  dtRender(id);
}

function _dtFilteredSorted(t) {
  let rows = t.rows;
  if (t.searchable && t.search) {
    const q = t.search.toLowerCase();
    rows = rows.filter(r => t.columns.some(c => String(r[c.key] ?? '').toLowerCase().includes(q)));
  }
  if (t.sortKey) {
    rows = [...rows].sort((a, b) => {
      const av = a[t.sortKey], bv = b[t.sortKey];
      const cmp = (av > bv) - (av < bv);
      return t.sortDir === 'asc' ? cmp : -cmp;
    });
  }
  return rows;
}

function dtSort(id, key) {
  const t = _dt[id]; if (!t) return;
  if (t.sortKey === key) { t.sortDir = t.sortDir === 'asc' ? 'desc' : 'asc'; }
  else { t.sortKey = key; t.sortDir = 'asc'; }
  dtRender(id);
}

function dtSearch(id, value) {
  const t = _dt[id]; if (!t) return;
  t.search = value; t.page = 1;
  dtRender(id);
}

function dtGoPage(id, page) {
  const t = _dt[id]; if (!t) return;
  t.page = page;
  dtRender(id);
}

function dtToggleRow(id, rowId) {
  const t = _dt[id]; if (!t) return;
  if (t.selectedIds.has(rowId)) t.selectedIds.delete(rowId); else t.selectedIds.add(rowId);
  dtRender(id);
}

function dtToggleAll(id) {
  const t = _dt[id]; if (!t) return;
  const visible = _dtFilteredSorted(t);
  const allSelected = visible.length > 0 && visible.every(r => t.selectedIds.has(r[t.rowKey]));
  if (allSelected) visible.forEach(r => t.selectedIds.delete(r[t.rowKey]));
  else visible.forEach(r => t.selectedIds.add(r[t.rowKey]));
  dtRender(id);
}

function dtRender(id) {
  const t = _dt[id];
  const container = qs('#dt-' + id);
  if (!t || !container) return;

  const filtered = _dtFilteredSorted(t);
  const totalPages = Math.max(1, Math.ceil(filtered.length / t.pageSize));
  t.page = Math.min(t.page, totalPages);
  const pageRows = filtered.slice((t.page - 1) * t.pageSize, t.page * t.pageSize);

  const searchHtml = t.searchable ? `
    <div class="dt-search-wrap">
      <i data-lucide="search"></i>
      <input class="dt-search" placeholder="Buscar…" value="${esc(t.search)}" oninput="dtSearch('${id}', this.value)" />
    </div>` : '<div></div>';

  const selectedCount = t.selectedIds.size;
  const bulkHtml = t.selectable && selectedCount > 0 ? `<span class="dt-bulk">${selectedCount} selecionada${selectedCount > 1 ? 's' : ''}</span>` : '';

  const theadCols = (t.selectable ? [{ checkbox: true }] : []).concat(t.columns);
  const theadHtml = theadCols.map(c => {
    if (c.checkbox) {
      const visible = filtered;
      const allSelected = visible.length > 0 && visible.every(r => t.selectedIds.has(r[t.rowKey]));
      return `<th class="dt-checkbox-cell"><input type="checkbox" class="dt-checkbox" ${allSelected ? 'checked' : ''} onchange="dtToggleAll('${id}')" /></th>`;
    }
    if (!c.sortable) return `<th>${esc(c.label)}</th>`;
    const active = t.sortKey === c.key;
    const icon = active && t.sortDir === 'desc' ? 'arrow-down' : 'arrow-up';
    return `<th><span class="dt-th-sortable${active ? ' active' : ''}" onclick="dtSort('${id}','${c.key}')">${esc(c.label)}<i data-lucide="${icon}"></i></span></th>`;
  }).join('');

  const bodyHtml = pageRows.length === 0
    ? `<tr><td colspan="${theadCols.length}"><div class="dt-empty">${esc(t.emptyMessage)}</div></td></tr>`
    : pageRows.map(row => {
        const rowId = row[t.rowKey];
        const selected = t.selectedIds.has(rowId);
        const cells = (t.selectable ? [`<td class="dt-checkbox-cell"><input type="checkbox" class="dt-checkbox" ${selected ? 'checked' : ''} onclick="event.stopPropagation(); dtToggleRow('${id}','${rowId}')" /></td>`] : [])
          .concat(t.columns.map(c => {
            const val = c.render ? c.render(row) : esc(row[c.key] ?? '—');
            return `<td class="${c.mono ? 'dt-td-mono' : ''}">${val}</td>`;
          }));
        const clickable = !!t.onRowClick;
        const onclick = clickable ? `onclick="_dtRowClick('${id}','${rowId}')"` : '';
        return `<tr class="${clickable ? 'dt-row-clickable' : ''} ${selected ? 'dt-row-selected' : ''}" ${onclick}>${cells.join('')}</tr>`;
      }).join('');

  container.innerHTML = `
    <div class="dt-wrap">
      <div class="dt-toolbar">
        ${searchHtml}
        <div style="display:flex;align-items:center;gap:12px;">
          ${bulkHtml}
          <span class="dt-count">${filtered.length} registro${filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="dt-scroll">
        <table class="dt-table">
          <thead><tr>${theadHtml}</tr></thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </div>
      <div class="dt-footer">
        <span class="dt-footer-info">Página ${t.page} de ${totalPages}</span>
        <button class="btn btn-ghost" style="padding:5px 10px;font-size:12px;" onclick="dtGoPage('${id}', ${t.page - 1})" ${t.page <= 1 ? 'disabled' : ''}>Anterior</button>
        <button class="btn btn-ghost" style="padding:5px 10px;font-size:12px;" onclick="dtGoPage('${id}', ${t.page + 1})" ${t.page >= totalPages ? 'disabled' : ''}>Próxima</button>
      </div>
    </div>`;
  refreshIcons();
}

function _dtRowClick(id, rowId) {
  const t = _dt[id]; if (!t || !t.onRowClick) return;
  const row = t.rows.find(r => String(r[t.rowKey]) === String(rowId));
  if (row) t.onRowClick(row);
}
