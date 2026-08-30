/* Botanic Inventory — lightweight shared application layer
 * Static/GitHub Pages friendly: all state is kept locally in localStorage.
 */
(function () {
  'use strict';

  const KEY = 'botanic-inventory:v2';
  const FILES = {
    home: 'Dashboard.html',
    receipt: 'Příjem (Receipt).html',
    issuance: 'Výdej (Issuance).html',
    packMove: 'Přesun packu (Pack Move).html',
    boxMove: 'Přesun boxu (Box Move).html',
    warehouse: 'Přehled skladu (Warehouse Overview).html',
    pack: 'Detail packu (Pack Detail).html',
    material: 'Detail suroviny (Material Detail).html',
    history: 'Historie (History).html'
  };

  const seed = {
    materials: [
      { id: 'MAT-001', name: 'Měsíček lékařský' },
      { id: 'MAT-002', name: 'Heřmánek pravý' },
      { id: 'MAT-003', name: 'Meduňka lékařská' }
    ],
    boxes: [
      { id: 'BOX-42', position: 'A12-3' },
      { id: 'BOX-15', position: 'B05-1' },
      { id: 'BOX-16', position: 'B05-2' }
    ],
    packs: [
      { id: 'Z3R4', materialId: 'MAT-001', material: 'Měsíček lékařský', lot: '145-2023-A', expiry: '2026-11-30', qtyInitial: 3.3, qtyCurrent: 0.8, boxId: 'BOX-42', position: 'A12-3', status: 'OPEN', note: '' },
      { id: 'B7K2', materialId: 'MAT-001', material: 'Měsíček lékařský', lot: '145-2023-B', expiry: '2026-09-04', qtyInitial: 10, qtyCurrent: 8.2, boxId: 'BOX-42', position: 'A12-3', status: 'OPEN', note: '' },
      { id: 'C4M1', materialId: 'MAT-001', material: 'Měsíček lékařský', lot: '146-2024-A', expiry: '2027-04-15', qtyInitial: 25, qtyCurrent: 25, boxId: 'BOX-42', position: 'A12-3', status: 'NEW', note: '' },
      { id: 'X9P2', materialId: 'MAT-002', material: 'Heřmánek pravý', lot: '88-2026', expiry: '2027-01-31', qtyInitial: 12.5, qtyCurrent: 12.5, boxId: 'BOX-15', position: 'B05-1', status: 'NEW', note: '' },
      { id: 'M2L8', materialId: 'MAT-003', material: 'Meduňka lékařská', lot: '51-2026', expiry: '2027-05-31', qtyInitial: 45, qtyCurrent: 45, boxId: 'BOX-16', position: 'B05-2', status: 'NEW', note: '' }
    ],
    events: [
      { id: 'EV-1', type: 'RECEIPT', at: '2026-08-30T08:15:00', actor: 'Systém', packId: 'X9P2', material: 'Heřmánek pravý', delta: 12.5, note: 'Počáteční zásoba' },
      { id: 'EV-2', type: 'MOVE_BOX', at: '2026-08-30T10:41:00', actor: 'Systém', boxId: 'BOX-42', from: 'A12-3', to: 'A12-3' },
      { id: 'EV-3', type: 'ISSUE', at: '2026-08-30T12:22:00', actor: 'Systém', packId: 'Z3R4', material: 'Měsíček lékařský', delta: -2.5, note: 'Počáteční výdej' }
    ],
    lastSync: null
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && Array.isArray(saved.packs)) return saved;
    } catch (_) {}
    const initial = clone(seed);
    save(initial);
    return initial;
  }

  function save(next) {
    next.lastSync = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }

  let db = load();
  let selectedPackId = null;

  const page = document.querySelector('[data-page]')?.dataset.page || '';

  function esc(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function notify(message, kind = 'ok') {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.className = `app-toast app-toast-${kind}`;
    toast.textContent = message;
    requestAnimationFrame(() => toast.classList.add('show'));
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function go(name, query) {
    const target = FILES[name] || FILES.home;
    const suffix = query ? `?${new URLSearchParams(query).toString()}` : '';
    window.location.href = encodeURI(target) + suffix;
  }

  function wireNavigation() {
    document.querySelectorAll('button').forEach((button) => {
      const text = button.textContent.trim().replace(/\s+/g, ' ');
      if (text === 'Domů') button.addEventListener('click', () => go('home'));
      else if (text === 'Sklad' || text === 'Přehled skladu') button.addEventListener('click', () => go('warehouse'));
      else if (text === 'Historie' || text === 'Historie pohybu') button.addEventListener('click', () => go('history'));
      else if (text === 'Výdej') button.addEventListener('click', () => go('issuance'));
      else if (text === 'Příjem') button.addEventListener('click', () => go('receipt'));
      else if (text === 'Přesun packu' || text === 'Přesun') button.addEventListener('click', () => go('packMove'));
      else if (text === 'Přesun boxu') button.addEventListener('click', () => go('boxMove'));
      else if (text === 'Nastavení') button.addEventListener('click', () => notify('Nastavení bude doplněno v další vrstvě aplikace.'));
      else if (button.querySelector('iconify-icon[icon="lucide:arrow-left"]')) button.addEventListener('click', () => history.back());
    });
  }

  function isoDate(date) {
    return new Date(date).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  }

  function expiryDays(expiry) {
    const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
    return days;
  }

  function nextPackId() {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = db.packs.filter((p) => p.id.startsWith(`P-${stamp}`)).length + 1;
    return `P-${stamp}-${String(count).padStart(3, '0')}`;
  }

  function addEvent(event) {
    db.events.unshift({ id: `EV-${Date.now()}`, at: new Date().toISOString(), actor: 'Lokální uživatel', ...event });
  }

  function fillSelect(select, values, selectedValue) {
    if (!select) return;
    select.innerHTML = values.map((v) => `<option value="${esc(v.value)}" ${v.value === selectedValue ? 'selected' : ''}>${esc(v.label)}</option>`).join('');
  }

  function enhanceReceipt() {
    const form = document.querySelector('form');
    const inputs = form ? [...form.querySelectorAll('input, select, textarea')] : [];
    if (!form || inputs.length < 7) return;

    const material = inputs[0];
    const packId = inputs[1];
    const weight = inputs[2];
    const lot = inputs[3];
    const expiry = inputs[4];
    const box = inputs[5];
    const position = inputs[6];
    const note = inputs[7];

    packId.value = nextPackId();
    packId.title = 'ID se vygeneruje při uložení';
    material.setAttribute('list', 'materials-list');
    let list = document.getElementById('materials-list');
    if (!list) {
      list = document.createElement('datalist');
      list.id = 'materials-list';
      document.body.appendChild(list);
    }
    list.innerHTML = db.materials.map((m) => `<option value="${esc(m.name)}">`).join('');

    fillSelect(box, db.boxes.map((b) => ({ value: b.id, label: b.id })), box.value);
    fillSelect(position, db.boxes.map((b) => ({ value: b.position, label: `${b.position} — ${b.id}` })), position.value);

    material.addEventListener('input', () => {
      const match = db.materials.find((m) => m.name.toLowerCase() === material.value.trim().toLowerCase());
      if (!match) return;
      const already = db.packs.filter((p) => p.materialId === match.id && p.status !== 'EMPTY');
      const recommendedBox = already[0]?.boxId || db.boxes[0]?.id;
      if (recommendedBox) box.value = recommendedBox;
    });

    const saveButton = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('ULOŽIT PACK'));
    if (saveButton) saveButton.addEventListener('click', () => {
      const name = material.value.trim();
      const qty = Number(weight.value);
      if (!name || !qty || qty <= 0) return notify('Vyplňte surovinu a kladnou hmotnost.', 'error');
      let mat = db.materials.find((m) => m.name.toLowerCase() === name.toLowerCase());
      if (!mat) {
        mat = { id: `MAT-${String(db.materials.length + 1).padStart(3, '0')}`, name };
        db.materials.push(mat);
      }
      const id = nextPackId();
      const chosenBox = db.boxes.find((b) => b.id === box.value) || db.boxes[0];
      const chosenPosition = position.value || chosenBox?.position || '';
      const pack = {
        id, materialId: mat.id, material: mat.name, lot: lot.value.trim(),
        expiry: expiry.value ? new Date(expiry.value).toISOString() : '',
        qtyInitial: qty, qtyCurrent: qty, boxId: chosenBox?.id || '', position: chosenPosition,
        status: 'NEW', note: note?.value.trim() || ''
      };
      db.packs.push(pack);
      addEvent({ type: 'RECEIPT', packId: id, material: mat.name, delta: qty, note: pack.note });
      save(db);
      notify(`Pack ${id} byl uložen.`);
      setTimeout(() => go('pack', { id }), 450);
    });
  }

  function sortFifo(packs) {
    return [...packs].filter((p) => p.status !== 'EMPTY' && p.qtyCurrent > 0).sort((a, b) => {
      const ad = a.expiry ? new Date(a.expiry).getTime() : Infinity;
      const bd = b.expiry ? new Date(b.expiry).getTime() : Infinity;
      return ad - bd;
    });
  }

  function enhanceIssuance() {
    const main = document.querySelector('main');
    const inputs = main ? [...main.querySelectorAll('input, textarea')] : [];
    const search = inputs[0];
    const amount = inputs[1];
    if (!search || !amount) return;

    const candidates = sortFifo(db.packs.filter((p) => p.qtyCurrent > 0));
    selectedPackId = candidates[0]?.id || null;

    main.querySelectorAll('[data-live-pack]').forEach((el) => el.remove());
    const wrap = document.createElement('section');
    wrap.dataset.livePack = '1';
    wrap.className = 'app-live-list';
    wrap.innerHTML = `<div class="app-section-title">Aktuální FIFO výběr</div>${candidates.slice(0, 8).map((p) => {
      const days = p.expiry ? expiryDays(p.expiry) : null;
      return `<button class="app-pack-row ${p.id === selectedPackId ? 'selected' : ''}" data-pack-id="${esc(p.id)}"><span><b>${esc(p.id)}</b><small>${esc(p.material)} · ${esc(p.boxId)}</small></span><strong>${p.qtyCurrent.toFixed(1)} kg${days !== null && days <= 7 ? `<em> · ${days} d</em>` : ''}</strong></button>`;
    }).join('') || '<p class="app-empty">Žádné dostupné packy.</p>'}`;
    main.insertBefore(wrap, main.querySelector('section') || main.firstChild);
    wrap.querySelectorAll('[data-pack-id]').forEach((row) => row.addEventListener('click', () => {
      selectedPackId = row.dataset.packId;
      wrap.querySelectorAll('[data-pack-id]').forEach((r) => r.classList.toggle('selected', r === row));
      amount.max = String(db.packs.find((p) => p.id === selectedPackId)?.qtyCurrent || 0);
    }));

    search.addEventListener('input', () => {
      const q = search.value.toLowerCase().trim();
      wrap.querySelectorAll('[data-pack-id]').forEach((row) => {
        row.hidden = !row.textContent.toLowerCase().includes(q);
      });
    });

    const confirm = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('POTVRDIT VÝDEJ'));
    if (confirm) confirm.addEventListener('click', () => {
      const pack = db.packs.find((p) => p.id === selectedPackId);
      const qty = Number(amount.value);
      if (!pack) return notify('Vyberte pack.', 'error');
      if (!qty || qty <= 0 || qty > pack.qtyCurrent) return notify(`Zadejte množství 0–${pack.qtyCurrent.toFixed(1)} kg.`, 'error');
      pack.qtyCurrent = Math.max(0, Number((pack.qtyCurrent - qty).toFixed(3)));
      pack.status = pack.qtyCurrent === 0 ? 'EMPTY' : 'OPEN';
      const note = inputs[2]?.value || '';
      addEvent({ type: 'ISSUE', packId: pack.id, material: pack.material, delta: -qty, note });
      save(db);
      notify(`Výdej ${qty.toFixed(1)} kg z ${pack.id} potvrzen.`);
      setTimeout(() => go('history'), 500);
    });
  }

  function enhancePackMove() {
    const inputs = [...document.querySelectorAll('input, select, textarea')];
    if (inputs.length < 3) return;
    const search = inputs[0], targetBox = inputs[2];
    const currentBox = document.querySelector('main')?.querySelector('.text-lg.font-bold');
    search.addEventListener('input', () => {
      const match = db.packs.find((p) => p.id.toLowerCase() === search.value.trim().toLowerCase());
      if (!match) return;
      selectedPackId = match.id;
      if (currentBox) currentBox.textContent = match.boxId;
      targetBox.value = db.boxes.find((b) => b.id !== match.boxId)?.id || targetBox.value;
      notify(`Pack ${match.id}: ${match.boxId} / ${match.position}`);
    });
    fillSelect(targetBox, db.boxes.map((b) => ({ value: b.id, label: b.id })), targetBox.value);
    const confirm = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('POTVRDIT PŘESUN'));
    if (confirm) confirm.addEventListener('click', () => {
      const packId = selectedPackId || search.value.trim();
      const pack = db.packs.find((p) => p.id.toLowerCase() === String(packId).toLowerCase());
      const box = db.boxes.find((b) => b.id === targetBox.value);
      if (!pack || !box || pack.boxId === box.id) return notify('Vyberte platný pack a jiný box.', 'error');
      const from = pack.boxId;
      pack.boxId = box.id;
      pack.position = box.position;
      addEvent({ type: 'MOVE_PACK', packId: pack.id, from, to: box.id });
      save(db);
      notify(`Pack ${pack.id} přesunut do ${box.id}.`);
      setTimeout(() => go('warehouse'), 500);
    });
  }

  function enhanceBoxMove() {
    const select = document.querySelector('select');
    if (!select) return;
    fillSelect(select, db.boxes.map((b) => ({ value: b.position, label: `${b.position} — volná pozice` })), '');
    const current = document.querySelector('main')?.textContent.match(/BOX-\d+/)?.[0] || 'BOX-42';
    const box = db.boxes.find((b) => b.id === current) || db.boxes[0];
    const confirm = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('POTVRDIT PŘESUN'));
    if (confirm) confirm.addEventListener('click', () => {
      const target = select.value;
      if (!target || target === box.position) return notify('Vyberte jinou pozici.', 'error');
      const from = box.position;
      box.position = target;
      db.packs.filter((p) => p.boxId === box.id).forEach((p) => { p.position = target; });
      addEvent({ type: 'MOVE_BOX', boxId: box.id, from, to: target });
      save(db);
      notify(`Box ${box.id}: ${from} → ${target}`);
      setTimeout(() => go('warehouse'), 500);
    });
  }

  function injectDashboard() {
    const root = document.querySelector('[data-page]');
    if (!root) return;
    const stats = root.querySelectorAll('.grid.grid-cols-2.gap-y-4.gap-x-8 .font-bold');
    const uniqueMaterials = new Set(db.packs.filter((p) => p.qtyCurrent > 0).map((p) => p.materialId)).size;
    const activePacks = db.packs.filter((p) => p.qtyCurrent > 0).length;
    const boxes = new Set(db.packs.filter((p) => p.qtyCurrent > 0).map((p) => p.boxId).filter(Boolean)).size;
    if (stats[0]) stats[0].textContent = uniqueMaterials;
    if (stats[1]) stats[1].textContent = activePacks;
    if (stats[2]) stats[2].textContent = boxes;
    if (stats[3]) stats[3].textContent = db.boxes.length;

    const expired = db.packs.filter((p) => p.qtyCurrent > 0 && p.expiry && expiryDays(p.expiry) < 0).length;
    const expiring = db.packs.filter((p) => p.qtyCurrent > 0 && p.expiry && expiryDays(p.expiry) >= 0 && expiryDays(p.expiry) <= 7).length;
    const counters = root.querySelectorAll('section .text-2xl.font-bold');
    if (counters[0]) counters[0].textContent = db.packs.filter((p) => p.qtyCurrent === 0).length;
    if (counters[1]) counters[1].textContent = expiring;
    const danger = root.querySelector('.bg-destructive\\/10 span') || root.querySelector('[class*="bg-destructive/10"] span');
    if (danger) danger.textContent = `${expired} Expirovaný pack${expired === 1 ? '' : 'y'}`;
  }

  function injectWarehouse() {
    const main = document.querySelector('main');
    if (!main) return;
    const existing = main.querySelector('[data-live-warehouse]');
    if (existing) existing.remove();
    const section = document.createElement('section');
    section.dataset.liveWarehouse = '1';
    section.className = 'app-live-list';
    const groups = db.materials.map((m) => {
      const packs = db.packs.filter((p) => p.materialId === m.id && p.qtyCurrent > 0);
      if (!packs.length) return '';
      const total = packs.reduce((s, p) => s + Number(p.qtyCurrent), 0);
      return `<div class="app-material-block"><div class="app-material-head"><span><b>${esc(m.name)}</b><small>${total.toFixed(1)} kg · ${packs.length} pack${packs.length === 1 ? '' : 'y'}</small></span><span>${packs.some((p) => p.expiry && expiryDays(p.expiry) <= 7) ? '<em>Kontrola expirace</em>' : 'OK'}</span></div>${packs.map((p) => `<button class="app-pack-row" data-open-pack="${esc(p.id)}"><span><b>${esc(p.id)}</b><small>${esc(p.boxId)} · ${esc(p.position)}</small></span><strong>${p.qtyCurrent.toFixed(1)} kg</strong></button>`).join('')}</div>`;
    }).join('');
    section.innerHTML = `<div class="app-section-title">Živá data zařízení</div>${groups || '<p class="app-empty">Sklad je prázdný.</p>'}`;
    main.prepend(section);
    section.querySelectorAll('[data-open-pack]').forEach((row) => row.addEventListener('click', () => go('pack', { id: row.dataset.openPack })));

    const search = main.querySelector('input[placeholder*="Hledat surovinu"]');
    if (search) search.addEventListener('input', () => {
      const q = search.value.toLowerCase().trim();
      section.querySelectorAll('.app-material-block').forEach((block) => block.hidden = q && !block.textContent.toLowerCase().includes(q));
    });
  }

  function injectHistory() {
    const main = document.querySelector('main');
    if (!main) return;
    const existing = main.querySelector('[data-live-history]');
    if (existing) existing.remove();
    const section = document.createElement('section');
    section.dataset.liveHistory = '1';
    section.className = 'app-live-list';
    const recent = db.events.slice(0, 30);
    const label = { RECEIPT: 'Příjem', ISSUE: 'Výdej', MOVE_PACK: 'Přesun packu', MOVE_BOX: 'Přesun boxu' };
    section.innerHTML = `<div class="app-section-title">Lokální auditní log</div>${recent.map((e) => `<div class="app-history-row"><span><b>${esc(label[e.type] || e.type)}</b><small>${isoDate(e.at)} · ${formatTime(e.at)} · ${esc(e.packId || e.boxId || '')}</small></span><strong class="${e.delta < 0 ? 'negative' : ''}">${e.delta ? `${e.delta > 0 ? '+' : ''}${Number(e.delta).toFixed(1)} kg` : e.to ? `${esc(e.from)} → ${esc(e.to)}` : 'Dokončeno'}</strong></div>`).join('')}`;
    main.prepend(section);

    const csvButtons = [...document.querySelectorAll('button')].filter((b) => /Export (CSV|Excel)/.test(b.textContent));
    csvButtons.forEach((button) => button.addEventListener('click', () => exportCsv()));
  }

  function exportCsv() {
    const rows = [['Datum','Typ','Pack','Box','Materiál','Změna kg','Poznámka']];
    db.events.forEach((e) => rows.push([e.at, e.type, e.packId || '', e.boxId || '', e.material || '', e.delta ?? '', e.note || '']));
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `botanic-inventory-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function enhancePackDetail() {
    const id = new URLSearchParams(location.search).get('id') || 'Z3R4';
    const pack = db.packs.find((p) => p.id === id) || db.packs[0];
    if (!pack) return;
    const title = document.querySelector('h1');
    const headings = document.querySelectorAll('h2');
    const body = document.querySelector('main');
    if (title) title.textContent = `Pack ${pack.id}`;
    if (headings[0]) headings[0].textContent = pack.material;
    if (body) body.dataset.currentPack = pack.id;
    const text = body?.querySelectorAll('span');
    if (!text) return;
    const replaceIf = (needle, value) => [...text].filter((s) => s.textContent.trim() === needle).forEach((s) => s.textContent = value);
    replaceIf('0.8', pack.qtyCurrent.toFixed(1));
    replaceIf('Z3R4', pack.id);
    replaceIf('BOX-42 (A12-3)', `${pack.boxId} (${pack.position})`);
    replaceIf('145-2023-A', pack.lot || '—');
  }

  function initialize() {
    db = load();
    wireNavigation();
    injectDashboard();
    if (page.includes('p-jem-receipt')) enhanceReceipt();
    else if (page.includes('v-dej-issuance')) enhanceIssuance();
    else if (page.includes('p-esun-packu-pack-move')) enhancePackMove();
    else if (page.includes('p-esun-boxu-box-move')) enhanceBoxMove();
    else if (page.includes('warehouse-overview')) injectWarehouse();
    else if (page.includes('historie-history')) injectHistory();
    else if (page.includes('detail-packu')) enhancePackDetail();

    document.querySelectorAll('form').forEach((form) => form.addEventListener('submit', (e) => e.preventDefault()));
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }));

    window.addEventListener('storage', () => location.reload());
  }

  window.InventoryApp = {
    getState: () => clone(db),
    reset: () => { localStorage.removeItem(KEY); location.reload(); },
    exportCsv,
    navigate: go,
    notify
  };
  window.UIUtils = { toggleElement: (selector) => { const el = document.querySelector(selector); if (el) el.hidden = !el.hidden; } };

  document.addEventListener('DOMContentLoaded', initialize);
})();
