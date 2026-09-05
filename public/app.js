/* ═══════════════════════════════════════════════════════════
   TalatSuite v2 — Frontend SPA (ภาษาไทยทั้งหมด)
   3 บทบาทในแอปเดียว:
   🏪 ผู้จัดการตลาด · 🍜 ร้านค้า/แม่ค้า · 🛒 ลูกค้าสั่งอาหาร
   ═══════════════════════════════════════════════════════════ */
'use strict';

/* ─────────────── utilities ─────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));
const overlayRoot = $('#overlay-root');
const toastRoot = $('#toast-root');
const viewEl = $('#view');

const CAT_TH = { food: 'อาหาร/เครื่องดื่ม', clothes: 'เสื้อผ้า', fresh: 'ของสด', general: 'ทั่วไป' };
const METHOD_TH = { cash: 'เงินสด', promptpay: 'สแกน PromptPay' };
const STATUS_TH = { pending: 'รอดำเนินการ', preparing: 'กำลังอบ/กำลังทำ', ready: 'พร้อมรับ/ส่ง', completed: 'เสร็จสิ้น' };
const STATUS_CU = { pending: 'ร้านกำลังดูออเดอร์', preparing: 'กำลังทำอยู่', ready: 'พร้อมรับแล้ว 🎉', completed: 'เสร็จสิ้น' };
const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'completed'];
const EMOJI_CHOICES = ['🍕', '🍍', '🦐', '🍜', '🍗', '🍚', '🥤', '☕', '🍰', '🌶️', '🥗', '🍢', '🧋', '🍵', '🥩', '🍟', '🥐', 'BBQ'];

const TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const TH_MONTHS_S = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const TH_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const TH_DAYS_S = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

const parseDate = (s) => {
  const str = String(s || '');
  if (str.includes('T')) { const dt = new Date(str); return isNaN(dt.getTime()) ? new Date(NaN) : dt; }
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const todayStr = () => toISO(new Date());
const beYear = (y) => y + 543;

const fmtDateLong = (s) => { const d = parseDate(s); return `วัน${TH_DAYS[d.getDay()]}ที่ ${d.getDate()} ${TH_MONTHS[d.getMonth()]} พ.ศ. ${beYear(d.getFullYear())}`; };
const fmtDateMedium = (s) => { const d = parseDate(s); return `${d.getDate()} ${TH_MONTHS_S[d.getMonth()]} ${beYear(d.getFullYear())}`; };
const fmtDateShort = (s) => { const d = parseDate(s); return `${TH_DAYS_S[d.getDay()]} ${d.getDate()} ${TH_MONTHS_S[d.getMonth()]} ${beYear(d.getFullYear())}`; };
const baht = (n) => '฿' + Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 });

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'เมื่อสักครู่';
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชม. ที่แล้ว`;
  return `${Math.floor(hr / 24)} วันที่แล้ว`;
}
const fmtTime = (iso) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
/* build ออฟไลน์ (ไฟล์เดียว/APK): แผนที่เปิดเป็นแอป/เบราว์เซอร์แทนการฝัง iframe */
const OFFLINE_BUILD = !!window.TALAT_OFFLINE;
/* คัดลอกข้อความเข้าคลิปบอร์ด (รองรับ WebView เก่า) */
function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text); return true; }
  } catch (e) { /* ไปทางสำรอง */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (e) { return false; }
}
/* v5.1 — Google Maps: ลิงก์เปิดแผนที่/นำทาง (มือถือเด้งแอป Google Maps ให้เอง) */
const mapsQueryOf = (mk) => (mk && mk.lat != null && mk.lng != null) ? `${mk.lat},${mk.lng}` : ((mk && mk.address) || '');
const mapsUrlOf = (mk, dir) => {
  const q = encodeURIComponent(mapsQueryOf(mk) || '');
  return dir ? `https://www.google.com/maps/dir/?api=1&destination=${q}`
             : `https://www.google.com/maps/search/?api=1&query=${q}`;
};

/* ═══════════ v5 · ภาษา / ส่งออกข้อมูล / ตรวจเบอร์โทร ═══════════ */
/* ตรวจเบร์โทรไทย (0 + 9-10 หลัก / +66) — คืนตัวเลขปกติหรือ '' */
function normalizeThaiPhone(raw) {
  let d = String(raw || '').replace(/[^0-9+]/g, '');
  if (d.startsWith('+66')) d = '0' + d.slice(3);
  else if (d.startsWith('66') && d.length === 11) d = '0' + d.slice(2);
  d = d.replace(/\D/g, '');
  return /^0[2689]\d{8}$/.test(d) || /^0[2-57]\d{7}$/.test(d) ? d : '';
}

/* สลับภาษา (ไทย ↔ EN) — ปุ่ม [data-lang] ทุกที่ */
function bindLangSwitch() {
  $$('#lang-switch-side, #lang-switch-start, #lang-switch-login, #lang-switch-acct').forEach((box) => {
    if (!box || box.__bound) return;
    box.__bound = true;
    box.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-lang]');
      if (!b) return;
      TS.setLang(b.dataset.lang);
      syncLangButtons();
      toast(b.dataset.lang === 'en' ? 'Switched to English' : 'เปลี่ยนเป็นภาษาไทยแล้ว', 'ok');
    });
  });
  syncLangButtons();
}
function syncLangButtons() {
  $$('[data-lang]').forEach((b) => b.classList.toggle('on', b.dataset.lang === (window.TS ? TS.lang : 'th')));
}
function langSwitchHTML(id) {
  return `<div class="lang-switch" id="${id}" role="group" aria-label="ภาษา / Language">
    <button type="button" data-lang="th">ไทย</button><button type="button" data-lang="en">EN</button>
  </div>`;
}

/* ── ระบบส่งออก v5.4: บันทึกไฟล์ได้จริงทั้งบนเบราว์เซอร์และ APK ──
   APK (WebView): ส่ง base64 ให้ฝั่ง Java เขียนลง Downloads ผ่าน TalatNative
   เบราว์เซอร์: สร้าง blob + คลิกลิงก์โหลดตามปกติ */
function b64FromStr(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  return btoa(bin);
}
function saveFileAny(filename, mime, content) {
  if (window.TalatNative && TalatNative.saveFile) {
    try {
      const r = TalatNative.saveFile(filename, mime, b64FromStr(content));
      if (r && r.indexOf('ok:') === 0) return { ok: true, path: r.slice(3) };
      return { ok: false, err: r || 'บันทึกไฟล์ไม่สำเร็จ (APK)' };
    } catch (e) { return { ok: false, err: e.message }; }
  }
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { ok: true, browser: true };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}
function toastSavedFile(res, doneMsg) {
  if (!res || !res.ok) { toast((res && res.err) || 'ส่งออกไม่สำเร็จ', 'err'); return; }
  if (res.path) toast((TS.translate('บันทึกไฟล์แล้ว') + ': ' + res.path + ' — ' + TS.translate('เปิดดูได้ในแอป "ไฟล์" → Downloads')), 'ok');
  else toast(doneMsg, 'ok');
}

/* ส่งออก CSV (มี BOM — เปิดใน Excel ได้ทันที) — หัวคอลัมน์/ค่าไทยแปลตามภาษาที่เลือก */
function downloadCSV(filename, headers, rows) {
  const tr = (s) => (window.TS && TS.translate ? TS.translate(String(s)) : String(s));
  const esc = (v) => '"' + tr(v).replace(/"/g, '""') + '"';
  const csv = '\uFEFF' + [headers.map(tr), ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  return saveFileAny(filename, 'text/csv;charset=utf-8', csv);
}

/* คัดลอกตารางเป็น TSV ไปคลิปบอร์ด (วางใน Excel/Sheets/แชทได้เลย) */
async function copyRows(headers, rows) {
  const tsv = [headers, ...rows].map((r) => r.join('\t')).join('\n');
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(tsv);
      return true;
    }
  } catch (e) { /* ไป fallback */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = tsv;
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    const okCopy = document.execCommand('copy');
    ta.remove();
    return okCopy;
  } catch (e) { return false; }
}
async function exportCopyRows(headers, rows, n) {
  const okCopy = await copyRows(headers, rows);
  toast(okCopy
    ? TS.translate(`คัดลอกแล้ว — วางได้ทุกที่ (Excel/แชท)`) + ' (' + n + ' ' + TS.translate('รายการ') + ')'
    : TS.translate('คัดลอกไม่สำเร็จ'), okCopy ? 'ok' : 'err');
}

/* โมดัลรวมส่งออก: ปุ่มเดียว → เลือก CSV / PDF / คัดลอก */
function openExportModal(items) {
  const m = openModal({
    title: 'ส่งออก / พิมพ์รายงาน',
    sub: 'เลือกรูปแบบที่ต้องการ',
    icon: '⬇️',
    center: true,
    body: `<div class="export-list">${items.map((it, i) => `
      <button type="button" class="export-opt" data-xi="${i}">
        <span class="xo-ic">${it.icon}</span>
        <span class="xo-tx"><b>${it.name}</b><small>${it.desc}</small></span>
        <span class="xo-go" aria-hidden="true">›</span>
      </button>`).join('')}</div>`,
  });
  m.body.querySelectorAll('.export-opt').forEach((b) => {
    b.addEventListener('click', () => {
      const it = items[Number(b.dataset.xi)];
      m.close();
      if (it && it.run) setTimeout(it.run, 60);
    });
  });
}
const EXPORT_FORMATS = {
  csv: { icon: '📊', name: 'CSV — เปิดใน Excel ได้ทันที', desc: 'ไฟล์ตารางข้อมูล เปิดใน Excel / Google Sheets ได้เลย' },
  pdf: { icon: '🖨️', name: 'PDF — พิมพ์หรือบันทึกรายงาน', desc: 'รายงานจัดหน้าสวยงาม พร้อมพิมพ์กระดาษ / บันทึกเป็น PDF' },
  copy: { icon: '📋', name: 'คัดลอกทั้งหมด (คลิปบอร์ด)', desc: 'คัดลอกข้อมูลไปวางใน Excel / แชทได้เลย' },
};
function exportOptions(list) {
  /* list = [['csv', run], ['pdf', run], ['copy', run]] */
  return list.map(([k, run]) => ({ ...EXPORT_FORMATS[k], run }));
}

/* พิมพ์รายงาน (เปิดหน้าต่างใหม่สไตล์กระดาษ → Ctrl+P / บันทึกเป็น PDF ได้) — แปลตามภาษาที่เลือก */
function printReport(title, sub, bodyHtml) {
  const tr = (s) => (window.TS && TS.translate ? TS.translate(String(s)) : String(s));
  title = tr(title);
  sub = tr(sub);
  if (window.TS && TS.translateNode) {
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = bodyHtml;
      TS.translateNode(tmp);
      bodyHtml = tmp.innerHTML;
    } catch (e) { /* แปลไม่ได้ก็ใช้ต้นฉบับ */ }
  }
  const css = `
    * { box-sizing: border-box; }
    body { font-family: 'IBM Plex Sans Thai', 'Segoe UI', Tahoma, sans-serif; color: #1c2a22; margin: 0; padding: 28px 30px; }
    h1 { font-size: 21px; margin: 0 0 2px; }
    .sub { color: #556; font-size: 12.5px; margin-bottom: 16px; }
    .meta { font-size: 11.5px; color: #889; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    th { background: #0e3729; color: #fff; text-align: left; padding: 7px 9px; }
    td { padding: 6px 9px; border-bottom: 1px solid #dde5df; }
    tr:nth-child(even) td { background: #f4f8f5; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .totals { margin-top: 14px; font-size: 13px; }
    .totals b { font-size: 15px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; background: #e9f3ec; font-size: 11px; }
    @media print { body { padding: 0; } }
  `;
  const fullHtml =
    '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>' + css + '</style></head><body>' +
    '<h1>🏪 TalatSuite — ' + esc(title) + '</h1>' +
    '<p class="sub">' + esc(sub) + '</p>' +
    '<p class="meta">' + tr('ออกรายงานเมื่อ') + ' ' + tr(fmtDateMedium(todayStr())) + ' ' + tr(fmtTime(new Date().toISOString()) + ' น.') + ' · TalatSuite v5</p>' +
    bodyHtml +
    '</body></html>';
  /* APK: ส่ง HTML ให้ฝั่งแอปเปิดหน้าจอ "พิมพ์" ของระบบ (เลือกเครื่องพิมพ์ / บันทึกเป็น PDF ได้) */
  if (window.TalatNative && TalatNative.printReport) {
    try {
      const r = TalatNative.printReport(title, b64FromStr(fullHtml));
      if (r && r.indexOf('ok') === 0) return;
      toast(r || 'เปิดหน้าจอพิมพ์ไม่สำเร็จ', 'err');
    } catch (e) { toast(e.message, 'err'); }
    return;
  }
  /* เบราว์เซอร์: เปิดหน้าต่างใหม่สไตล์กระดาษ → สั่งพิมพ์อัตโนมัติ */
  const w = window.open('', '_blank');
  if (!w) {
    openModal({
      title: 'พิมพ์รายงาน', sub, icon: IC.receipt, center: true,
      body: `<div class="hint" style="padding:6px 2px">ป๊อปอัปถูกบล็อก — อนุญาตป๊อปอัปของหน้านี้แล้วกดอีกครั้ง หรือเลือกรูปแบบอื่นในหน้าส่งออก</div>`,
    });
    return;
  }
  w.document.write(fullHtml + '<script>setTimeout(function(){window.print()}, 250)<\/script>');
  w.document.close();
}

/* โหลด/บันทึกออเดอร์แขก (ไม่สมัคร) */
function loadGuestOrders() {
  try {
    state.customer.guestOrders = JSON.parse(store.get('talatsuite.guestOrders') || '[]');
  } catch (e) { state.customer.guestOrders = []; }
  return state.customer.guestOrders;
}
function saveGuestOrder(entry) {
  const list = loadGuestOrders();
  list.unshift(entry);
  state.customer.guestOrders = list.slice(0, 20);
  store.set('talatsuite.guestOrders', JSON.stringify(state.customer.guestOrders));
}

async function api(path, { method = 'GET', body } = {}) {
  const token = store.get('talatsuite.token');
  const opts = {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  };
  /* เน็ตขัดข้อง (เซิร์ฟเวอร์กำลังตื่นจากโหมดพักของแผนฟรี / รีสตาร์ทสั้น ๆ)
     — GET ลองใหม่อัตโนมัติ 1 ครั้ง · POST ไม่ส่งซ้ำอัตโนมัติ (กันออเดอร์ซ้ำ) แต่แจ้งเตือนเป็นภาษาคน */
  let res;
  try {
    res = await fetch(path, opts);
  } catch (netErr) {
    if (method === 'GET') {
      await new Promise((r) => setTimeout(r, 4000));
      try { res = await fetch(path, opts); }
      catch (e2) { throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — ระบบอาจกำลังตื่นจากโหมดพัก (แผนฟรี) รอสักครู่แล้วลองใหม่ครับ'); }
    } else {
      throw new Error('การเชื่อมต่อขัดข้องกลางคัน — ระบบอาจกำลังตื่นจากโหมดพัก กรุณารอ 1 นาทีแล้วกดส่งใหม่ครับ (ห้ามรีเฟรชซ้ำ ๆ)');
    }
  }
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  /* 401 จาก endpoint ยืนยันตัวตน (รหัสผ่าน/รหัสล็อคผิด) เป็นเรื่องปกติ — ห้ามไล่ออก */
  const isAuthProbe = /^\/api\/auth\/(login|register|password|passcode|verify-passcode)/.test(path);
  if (res.status === 401 && state.user && !isAuthProbe) {
    /* เซสชันหมดอายุ — ล้างแล้วให้เข้าสู่ระบบใหม่ */
    logoutLocal();
    toast('เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง', 'err');
  }
  if (!res.ok) throw new Error(
    (data && data.error)
    || (res.status >= 500 ? 'ระบบขัดข้องชั่วคราว — รอสักครู่แล้วลองใหม่ครับ' : `เกิดข้อผิดพลาด (${res.status})`)
  );
  return data;
}

/* ที่เก็บข้อมูลในเครื่อง (ปลอดภัยเมื่อ localStorage ถูกบล็อก เช่น iframe sandbox) */
const store = (() => {
  let ok = false; const mem = {};
  try { const t = '__talat_probe__'; localStorage.setItem(t, '1'); localStorage.removeItem(t); ok = true; } catch (e) { ok = false; }
  return {
    ok,
    get(k) { try { return ok ? localStorage.getItem(k) : (k in mem ? mem[k] : null); } catch (e) { return null; } },
    set(k, v) { try { if (ok) localStorage.setItem(k, v); else mem[k] = v; } catch (e) {} },
    del(k) { try { if (ok) localStorage.removeItem(k); else delete mem[k]; } catch (e) {} },
  };
})();

/* ─────────────── icons (inline SVG) ─────────────── */
const IC = {
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/></svg>',
  money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>',
  store: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1.2-5h15.6L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/><path d="M3 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.5 20h19L12 3z"/><path d="M12 10v4M12 17.2v.01"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/><path d="M10 11v5M14 11v5"/></svg>',
  receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h14v18l-2.3-1.6L14.4 21l-2.4-1.6L9.6 21l-2.3-1.6L5 21V3z"/><path d="M9 8h6M9 12h6"/></svg>',
  chevL: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  chevR: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  down: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9.5 9-7 9 7V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20z"/><path d="M9.5 21.5v-8h5v8"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
  food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v7a3 3 0 0 0 6 0V3"/><path d="M10 13v8"/><path d="M17 3c1.5 2 2 3.5 2 5.5S18 11 17.5 12l-.5 9"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.6"/><circle cx="19" cy="21" r="1.6"/><path d="M2.5 3h2.6l2.4 12.4a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 7H6"/></svg>',
};

/* ─────────────── เสียงแจ้งเตือน (WebAudio สั้น ๆ) ─────────────── */
function beep(kind = 'new') {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    beep.ctx = beep.ctx || new AC();
    const ctx = beep.ctx;
    if (ctx.state === 'suspended') ctx.resume();
    const seq = kind === 'new' ? [[880, 0], [1318, 0.14]] : [[660, 0], [880, 0.12]];
    for (const [freq, at] of seq) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = freq;
      const t = ctx.currentTime + at;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      o.start(t); o.stop(t + 0.45);
    }
  } catch (e) { /* เงียบได้ */ }
}

/* ─────────────── toast ─────────────── */
function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="t-ic">${type === 'ok' ? '✓' : type === 'err' ? '!' : 'ⓘ'}</span><span>${esc(msg)}</span>`;
  toastRoot.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 280); }, 2700);
  while (toastRoot.children.length > 3) toastRoot.firstChild.remove();
}

/* ─────────────── modal system ─────────────── */
let modalZ = 100;
function openModal({ title = '', sub = '', icon = '', body = '', className = '', center = false, onDismiss } = {}) {
  const bd = document.createElement('div');
  bd.className = 'modal-backdrop' + (center ? ' center' : '');
  bd.style.zIndex = ++modalZ;
  bd.innerHTML = `
    <div class="sheet ${className}" role="dialog" aria-modal="true">
      ${center ? '' : '<div class="sheet-grab"><i></i></div>'}
      <div class="sheet-head">
        ${icon ? `<span class="sh-ic">${icon}</span>` : ''}
        <div style="min-width:0;flex:1"><h3>${esc(title)}</h3>${sub ? `<p>${sub}</p>` : ''}</div>
        <button class="x-btn" type="button" aria-label="ปิดหน้าต่าง">✕</button>
      </div>
      <div class="sheet-body"></div>
    </div>`;
  overlayRoot.appendChild(bd);
  const sheetEl = bd.querySelector('.sheet');
  const bodyEl = sheetEl.querySelector('.sheet-body');
  bodyEl.innerHTML = body;
  const modal = {
    el: sheetEl, body: bodyEl, backdrop: bd,
    close() { bd.remove(); },
  };
  const dismiss = () => { modal.close(); if (onDismiss) onDismiss(); };
  bd.addEventListener('pointerdown', (e) => { if (e.target === bd) dismiss(); });
  sheetEl.querySelector('.x-btn').addEventListener('click', dismiss);
  return modal;
}

/* ป็อปอัปยืนยัน */
function confirmDialog({ title, message = '', confirmText = 'ใช่', cancelText = 'ยกเลิก', danger = false }) {
  return new Promise((resolve) => {
    let done = false;
    const fin = (v) => { if (!done) { done = true; resolve(v); } };
    const m = openModal({
      center: true,
      title,
      body: `<div class="dialog-tx">
          <div class="confirm-ic ${danger ? 'danger' : 'warn'}">${danger ? IC.trash : IC.alert}</div>
          <h3>${esc(title)}</h3>
          ${message ? `<p>${message}</p>` : ''}
          <div class="btn-row" style="margin-top:18px">
            <button class="btn ghost" id="cd-no" type="button">${esc(cancelText)}</button>
            <button class="btn ${danger ? 'danger' : 'primary'}" id="cd-yes" type="button">${esc(confirmText)}</button>
          </div>
        </div>`,
      onDismiss: () => fin(false),
    });
    m.body.querySelector('#cd-yes').addEventListener('click', () => { fin(true); m.close(); });
    m.body.querySelector('#cd-no').addEventListener('click', () => { fin(false); m.close(); });
  });
}

/* ─────────────── ปฏิทิน ─────────────── */
function openCalendar(selected) {
  return new Promise((resolve) => {
    let done = false;
    const fin = (v) => { if (!done) { done = true; resolve(v); } };
    const sel = parseDate(selected);
    let vy = sel.getFullYear(), vm = sel.getMonth();
    let token = 0;

    const m = openModal({
      title: 'เลือกวันที่ใช้งาน',
      sub: 'จุดสีเขียว = วันที่มีรายการชำระเงิน',
      icon: IC.calendar,
      className: 'cal-box',
      body: `
        <div class="cal-head">
          <button class="cal-nav" id="cal-prev" type="button" aria-label="เดือนก่อนหน้า">${IC.chevL}</button>
          <h4 id="cal-title"></h4>
          <button class="cal-nav" id="cal-next" type="button" aria-label="เดือนถัดไป">${IC.chevR}</button>
        </div>
        <div class="cal-dow">${['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((d) => `<span>${d}</span>`).join('')}</div>
        <div class="cal-grid" id="cal-grid"></div>
        <div class="cal-foot">
          <button class="btn ghost block" id="cal-today" type="button">ใช้วันนี้ (${fmtDateMedium(todayStr())})</button>
        </div>`,
      onDismiss: () => fin(null),
    });

    const grid = m.body.querySelector('#cal-grid');

    async function renderMonth() {
      const myToken = ++token;
      m.body.querySelector('#cal-title').textContent = `${TH_MONTHS[vm]} ${beYear(vy)}`;
      const lead = new Date(vy, vm, 1).getDay();
      const dim = new Date(vy, vm + 1, 0).getDate();
      let html = '';
      for (let i = 0; i < lead; i++) html += '<span></span>';
      for (let d = 1; d <= dim; d++) {
        const ds = toISO(new Date(vy, vm, d));
        const cls = ['cal-day'];
        if (ds === selected) cls.push('sel');
        if (ds === todayStr()) cls.push('today');
        html += `<button type="button" class="${cls.join(' ')}" data-d="${ds}">${d}<span class="pay-dot" hidden></span></button>`;
      }
      grid.innerHTML = html;
      try {
        const from = toISO(new Date(vy, vm, 1));
        const to = toISO(new Date(vy, vm + 1, 0));
        const mid = state.role === 'manager' ? `&market_id=${state.manager.marketId || 1}` : '';
        const data = await api(`/api/market/payments?from=${from}&to=${to}${mid}`);
        if (myToken !== token) return;
        const days = new Set(data.payments.map((p) => p.day));
        $$('.cal-day', grid).forEach((b) => {
          if (days.has(b.dataset.d)) b.querySelector('.pay-dot').hidden = false;
        });
      } catch { /* ไม่แสดงจุดก็ได้ */ }
    }

    m.body.querySelector('#cal-prev').addEventListener('click', () => { vm--; if (vm < 0) { vm = 11; vy--; } renderMonth(); });
    m.body.querySelector('#cal-next').addEventListener('click', () => { vm++; if (vm > 11) { vm = 0; vy++; } renderMonth(); });
    m.body.querySelector('#cal-today').addEventListener('click', () => {
      const t = new Date();
      vy = t.getFullYear(); vm = t.getMonth();
      renderMonth();
    });
    grid.addEventListener('click', (e) => {
      const b = e.target.closest('.cal-day');
      if (!b) return;
      fin(b.dataset.d);
      m.close();
    });
    renderMonth();
  });
}

/* ═══════════════════════════════════════════════════════════
   สถานะแอปพลิเคชัน + ระบบ 3 บทบาท
   ═══════════════════════════════════════════════════════════ */
const state = {
  role: null,
  user: null,          /* ผู้ใช้ที่ล็อกอิน: {id, login, role, display_name, phone, email, market_id, shop_id} */
  manager: {
    marketId: null, tab: 'home', markets: [],
    date: todayStr(), period: 'daily', data: null, error: null, loading: false,
    shops: [], layout: [],
  },
  vendor: {
    shopId: null, shop: null, tab: 'orders', menu: [], orders: [], cart: {},
    error: null, loading: false, draft: { name: '', note: '' },
    knownIds: null,
  },
  customer: {
    tab: 'browse', markets: [], marketId: null, market: null, shopId: null, shop: null,
    menu: [], carts: {}, myOrders: [], knownStatus: null,
    guestOrders: [], guestStatus: null, /* ออเดอร์แขก: [{id, token, shop, total, ts}] */
  },
  admin: {
    tab: 'home', stats: null, users: null, userFilter: 'all', customers: null,
    audit: null, auditFilter: { market_id: '', role: '', q: '' },
  },
};

/* ───────── จัดการเซสชัน ───────── */
function setSession(token, user) {
  state.user = user;
  if (token) store.set('talatsuite.token', token);
  renderSideUser();
}
function logoutLocal() {
  state.user = null;
  store.del('talatsuite.token');
  renderSideUser();
}
async function doLogout() {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch (e) { /* ไม่เป็นไร */ }
  const name = state.user ? state.user.display_name : '';
  logoutLocal();
  state.role = null;
  /* รีเซ็ตแท็บต่างๆ เพื่อให้ผู้ใช้คนถัดไปเริ่มที่หน้าแรกของแต่ละบทบาท */
  state.customer.tab = 'browse';
  state.customer.marketId = null; state.customer.shopId = null; state.customer.shop = null; state.customer.myOrders = []; state.customer.knownStatus = null;
  state.vendor.shopId = null; state.vendor.shop = null; state.vendor.tab = 'orders';
  state.manager.marketId = null; state.manager.tab = 'home';
  state.admin.tab = 'home'; state.admin.stats = null; state.admin.users = null; state.admin.customers = null;
  try { history.replaceState(null, '', '#/start'); } catch (e) {}
  toast(name ? `ออกจากระบบแล้ว — ลาก่อน ${name} 👋` : 'ออกจากระบบแล้ว', 'info');
  showStart();
}
let lastVendorSnapshot = '';

const NAV = {
  manager: [
    { id: 'home', ic: IC.grid, b: 'หน้าหลัก', s: 'ภาพรวมรายรับและผังล็อค' },
    { id: 'apps', ic: IC.store, b: 'ใบสมัครร้านค้า', s: 'พิจารณาคำขอเข้าร่วมตลาด' },
    { id: 'shops', ic: IC.store, b: 'ร้านค้าในตลาด', s: 'ทะเบียนร้านและช่องทางติดต่อ' },
    { id: 'settings', ic: IC.gear, b: 'ตั้งค่าตลาด', s: 'ข้อมูล · เวลาเปิด · ผังแถวล็อค' },
  ],
  vendor: [
    { id: 'orders', ic: IC.receipt, b: 'รับออร์ดอร์', s: 'POS สั่งหน้าร้าน' },
    { id: 'queue', ic: IC.clock, b: 'คิวครัว', s: 'ออเดอร์เรียลไทม์' },
    { id: 'menu', ic: IC.food, b: 'เมนูสินค้า', s: 'ราคา รูปภาพ สต็อก' },
    { id: 'profile', ic: IC.store, b: 'ร้านของฉัน', s: 'โปรไฟล์และติดต่อ' },
  ],
  customer: [
    { id: 'browse', ic: IC.pin, b: 'สั่งอาหาร', s: 'เลือกตลาดและร้าน' },
    { id: 'orders', ic: IC.bell, b: 'ออเดอร์ของฉัน', s: 'ติดตามสถานะเรียลไทม์' },
  ],
  admin: [
    { id: 'home', ic: IC.grid, b: 'ภาพรวมระบบ', s: 'สถิติทุกตลาดแบบเรียลไทม์' },
    { id: 'apps', ic: IC.store, b: 'ใบสมัคร', s: 'พิจารณาตลาดใหม่และร้านค้าใหม่' },
    { id: 'markets', ic: IC.pin, b: 'จัดการตลาด', s: 'สร้าง · ลบ · ผูกบัญชีผู้จัดการ' },
    { id: 'users', ic: IC.store, b: 'บัญชีผู้ใช้', s: 'ผจก. · ร้านค้า · ลูกค้า' },
    { id: 'customers', ic: IC.money, b: 'ข้อมูลลูกค้า', s: 'เพื่อการตลาด + ส่งออก CSV' },
    { id: 'audit', ic: IC.clock, b: 'บันทึกกิจกรรม', s: 'ทุกการกระทำในระบบ ตรวจสอบได้' },
  ],
};

const ROLE_TH = { admin: 'แอดมินระบบ', manager: 'ผู้จัดการตลาด', vendor: 'ร้านค้า/แม่ค้า', customer: 'ลูกค้า' };
const ROLE_EMOJI = { admin: '🛡️', manager: '🏪', vendor: '🍜', customer: '🛒' };

function currentTabId() {
  if (state.role === 'manager') return state.manager.tab;
  if (state.role === 'vendor') return state.vendor.tab;
  if (state.role === 'customer') return state.customer.tab;
  if (state.role === 'admin') return state.admin.tab;
  return '';
}

function renderNav() {
  const items = NAV[state.role] || [];
  const sideHome = state.role ? `
    <button class="nav-pad nav-home" data-nav="__home" type="button">
      <span class="nav-ic" aria-hidden="true">${IC.home}</span>
      <span class="nav-tx"><b>🏠 หน้าหลัก</b><small>กลับหน้าเลือกบทบาท (ไม่ออกจากระบบ)</small></span>
    </button>` : '';
  const bbHome = state.role ? `
    <button class="bb-pad bb-home" data-nav="__home" type="button" aria-label="กลับหน้าหลัก">
      <span class="bb-ic" aria-hidden="true">${IC.home}</span><b>หน้าหลัก</b>
    </button>` : '';
  $('#side-nav').innerHTML = sideHome + items.map((it) => `
    <button class="nav-pad" data-nav="${it.id}" type="button">
      <span class="nav-ic" aria-hidden="true">${it.ic}</span>
      <span class="nav-tx"><b>${it.b}</b><small>${it.s}</small></span>
    </button>`).join('');
  $('#bottombar').innerHTML = bbHome + items.map((it) => `
    <button class="bb-pad" data-nav="${it.id}" type="button">
      <span class="bb-ic" aria-hidden="true">${it.ic}</span>
      <b>${it.b}</b>
    </button>`).join('');
  /* ปรับจำนวนคอลัมน์ตามจำนวนแผ่น (แอดมิน 6 แผ่นก็ยังอยู่ในแถวเดียว) */
  const bb = $('#bottombar');
  if (bb) {
    const n = Math.min(1 + items.length, 6);
    bb.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
    bb.classList.toggle('bb-many', 1 + items.length >= 5);
  }
  updateNavOn();
  /* ป้ายใบสมัครรอพิจารณา — แอดมิน/ผจก. เห็นทันทีที่เปิดแอป */
  refreshAppBadge();
}

/* ── ป้ายจำนวนใบสมัครรอพิจารณา (ปุ่ม "ใบสมัคร" บน nav) ── */
function paintAppBadge(n) {
  state.pendingApps = n;
  $$('#side-nav .nav-pad[data-nav="apps"], #bottombar .bb-pad[data-nav="apps"]').forEach((b) => {
    let el = b.querySelector('.nav-badge');
    if (!el) {
      el = document.createElement('span');
      el.className = 'nav-badge';
      b.appendChild(el);
    }
    el.textContent = n > 99 ? '99+' : String(n);
    el.style.display = n > 0 ? '' : 'none';
  });
}

async function refreshAppBadge() {
  try {
    if (state.user && state.user.role === 'admin') {
      const all = await api('/api/admin/applications');
      let apps = (all.applications || []).filter((a) => a.status === 'pending');
      /* แอดมินที่เปิดคอนโซลตลาด → นับเฉพาะตลาดนั้น (เหมือนหน้าใบสมัคร) */
      if (state.role === 'manager') apps = apps.filter((a) => a.kind === 'shop' && Number(a.market_id) === Number(state.manager.marketId));
      paintAppBadge(apps.length);
    } else if (state.role === 'manager') {
      const data = await api('/api/manager/applications');
      paintAppBadge((data.applications || []).filter((a) => a.status === 'pending').length);
    }
  } catch (e) { /* แค่ป้าย — เงียบไว้ */ }
}

function updateNavOn() {
  const cur = currentTabId();
  $$('#side-nav .nav-pad, #bottombar .bb-pad').forEach((b) => {
    b.classList.toggle('on', b.dataset.nav === cur);
  });
  const sub = $('#brand-sub');
  if (sub) sub.textContent = state.role ? `${ROLE_EMOJI[state.role]} ${ROLE_TH[state.role]}` : 'แพลตฟอร์มจัดการตลาด';
}

/* ── หน้าเลือกบทบาท (ครั้งแรก / เปลี่ยนบทบาท) ── */
function showStart() {
  state.role = null;
  try { history.replaceState(null, '', '#/start'); } catch (e) {}
  viewEl.dataset.app = 'start';
  overlayRoot.innerHTML = '';
  renderNav();
  const u = state.user;
  viewEl.innerHTML = `
    <div class="start-wrap">
      <div class="start-hero">
        <div class="start-logo" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="52" height="52" fill="none">
            <path d="M6 20 L10 8 H38 L42 20" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 20 C6 24.4 9.1 28 13 28 C16.9 28 20 24.4 20 20 C20 24.4 23.1 28 27 28 C30.9 28 34 24.4 34 20 C34 24.4 37.1 28 41 28" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 8 L38 8 M9 28 V40 H39 V28" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M20 40 V32 H28 V40" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1>TalatSuite</h1>
        <p>แพลตฟอร์มตลาดสำหรับทุกคน — ผู้จัดการ · ร้านค้า · ลูกค้า</p>
        ${langSwitchHTML('lang-switch-start')}
      </div>

      <div class="welcome-actions">
        <p class="ro-q">คุณคือใคร? — เลือกเพื่อเริ่มใช้งาน</p>
        <div class="ro-grid">
          <button class="ro-card wa-main" data-start="browse" type="button">
            <span class="ro-emo" aria-hidden="true">🛒</span>
            <span class="ro-tx"><b>ลูกค้า</b><small>ดูตลาด · เดินดูร้าน · สั่งอาหาร — เริ่มได้เลยไม่ต้องสมัคร</small></span>
            <span class="wa-go">→</span>
          </button>
          <button class="ro-card" data-start="vendor-apply" type="button">
            <span class="ro-emo" aria-hidden="true">🍜</span>
            <span class="ro-tx"><b>ร้านค้า</b><small>สมัครเปิดร้านในตลาดที่คุณชอบ — รอผจก.ตลาดอนุมัติ</small></span>
            <span class="wa-go">→</span>
          </button>
          <button class="ro-card" data-start="manager-apply" type="button">
            <span class="ro-emo" aria-hidden="true">🧑‍💼</span>
            <span class="ro-tx"><b>ผู้จัดการตลาด</b><small>ยื่นเปิดตลาดของคุณเอง — แอดมินอนุมัติก่อนเผยแพร่</small></span>
            <span class="wa-go">→</span>
          </button>
        </div>
        <div class="start-links">
          <button class="linklike" data-start="login" type="button">🔑 เข้าสู่ระบบ — แอดมิน / สมาชิกเดิม</button>
          <span> · </span>
          <button class="linklike" data-start="register" type="button">📝 สมัครสมาชิก (ลูกค้า)</button>
        </div>
      </div>

      ${u ? `
      <div class="start-resume">
        <p>กลับมาต่อในฐานะ <b>${esc(u.display_name)}</b> (${ROLE_TH[u.role] || u.role})</p>
        <button class="btn gold" data-start="resume" type="button">เข้าใช้งานต่อ →</button>
      </div>` : ''}

      <p class="start-foot">ร้านค้าและผู้จัดการตลาดสมัครเองได้เลย — ทุกใบสมัครจะได้รับการอนุมัติก่อนเผยแพร่ · ลูกค้าสั่งอาหารสมัครฟรีด้วยเบอร์โทร</p>
    </div>`;
  bindLangSwitch();
}

/* ── เข้าสู่ระบบ (หน้าเต็ม) ── */
function openLoginScreen() {
  viewEl.dataset.app = 'start';
  overlayRoot.innerHTML = '';
  renderNav();
  viewEl.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <button class="back-link" data-start="back" type="button">← กลับหน้าเริ่มต้น</button>
        ${langSwitchHTML('lang-switch-login')}
        <div class="login-emo" aria-hidden="true">🔑</div>
        <h2>เข้าสู่ระบบ</h2>
        <p class="login-sub">ผู้จัดการตลาด · ร้านค้า · ลูกค้าสมาชิก · แอดมิน</p>
        <div class="field"><label for="lg-login">ชื่อผู้ใช้ หรือ เบอร์โทร</label>
          <input class="tin" id="lg-login" maxlength="60" autocomplete="username" placeholder="เช่น somchai / 0891234567"></div>
        <div class="field"><label for="lg-pass">รหัสผ่าน</label>
          <input class="tin" id="lg-pass" type="password" maxlength="100" autocomplete="current-password" placeholder="••••••••"></div>
        <button class="btn primary block" id="lg-go" type="button">เข้าสู่ระบบ</button>
        <div class="login-links">
          <button class="linklike" data-start="register" type="button">สมัครสมาชิกใหม่</button>
          <span> · </span>
          <button class="linklike" data-start="browse" type="button">เข้าชมตลาดแบบไม่สมัคร</button>
        </div>
        <div class="login-demo">
          <b>บัญชีทดลอง (แตะเพื่อกรอกให้อัตโนมัติ)</b>
          <div class="demo-accounts">
            <button type="button" class="demo-acct" data-lg="admin|admin123">🛡️ admin / admin123</button><button type="button" class="demo-acct" data-lg="somchai|market123">🏪 somchai / market123</button><button type="button" class="demo-acct" data-lg="pizzabee|vendor123">🍜 pizzabee / vendor123</button><button type="button" class="demo-acct" data-lg="0890000001|cust123">🛒 0890000001 / cust123</button>
          </div>
        </div>
      </div>
    </div>`;
  const go = async () => {
    const btn = $('#lg-go');
    const login = $('#lg-login').value.trim();
    const password = $('#lg-pass').value;
    if (!login || !password) { toast('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', 'err'); return; }
    btn.disabled = true;
    try {
      const r = await api('/api/auth/login', { method: 'POST', body: { login, password } });
      setSession(r.token, r.user);
      toast(`ยินดีต้อนรับ ${r.user.display_name} 🎉`, 'ok');
      routeAfterLogin(r.user);
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  };
  $('#lg-go').addEventListener('click', go);
  $('#lg-pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  $$('.demo-acct').forEach((b) => b.addEventListener('click', () => {
    const parts = (b.dataset.lg || '').split('|');
    $('#lg-login').value = parts[0] || '';
    $('#lg-pass').value = parts[1] || '';
    toast('กรอกบัญชีทดลองให้แล้ว — กด "เข้าสู่ระบบ" ได้เลย', 'info');
    $('#lg-go').focus();
  }));
  $('#lg-login').focus();
  bindLangSwitch();
}

function routeAfterLogin(user) {
  if (user.role === 'admin') chooseRole('admin');
  else if (user.role === 'manager') chooseRole('manager');
  else if (user.role === 'vendor') chooseRole('vendor');
  else chooseRole('customer');
}

/* ── สมัครสมาชิกลูกค้า (modal) — ร้านค้า/ผจก.สมัครผ่านหน้า "สมัครเปิดร้าน/ยื่นตลาด" (v6) ── */
function openRegisterSheet() {
  const md = openModal({
    title: 'สมัครสมาชิก (ลูกค้า)',
    sub: 'ฟรี — ใช้เบอร์โทรเป็นบัญชี สั่งอาหารและเก็บประวัติได้',
    icon: IC.food,
    className: 'register-sheet',
    body: `
      <div class="field"><label for="rg-name">ชื่อ-นามสกุล / ชื่อที่ใช้แสดง</label>
        <input class="tin" id="rg-name" maxlength="120" placeholder="เช่น สมหญิง ใจดี"></div>
      <div class="field"><label for="rg-login">เบอร์โทรศัพท์ (ใช้เข้าสู่ระบบ)</label>
        <input class="tin" id="rg-login" maxlength="60" inputmode="tel" placeholder="08x-xxx-xxxx"></div>
      <div class="field"><label for="rg-email">อีเมล</label>
        <input class="tin" id="rg-email" maxlength="120" placeholder="you@email.com (ไม่บังคับ)"></div>
      <div class="field"><label for="rg-pass">รหัสผ่าน (4 ตัวขึ้นไป)</label>
        <input class="tin" id="rg-pass" type="password" maxlength="100" placeholder="••••••••"></div>
      <button class="btn primary block" id="rg-go" type="button">สมัครสมาชิก</button>
      <p class="hint" style="text-align:center;margin:10px 0 0">ต้องการเปิดร้านค้าหรือยื่นเปิดตลาดของคุณเอง? — กลับหน้าแรกแล้วเลือกบทบาท "ร้านค้า" หรือ "ผู้จัดการตลาด" ครับ</p>`,
  });

  md.body.querySelector('#rg-go').addEventListener('click', async () => {
    const btn = md.body.querySelector('#rg-go');
    const body = {
      role: 'customer',
      display_name: md.body.querySelector('#rg-name').value.trim(),
      login: md.body.querySelector('#rg-login').value.trim(),
      email: md.body.querySelector('#rg-email').value.trim(),
      password: md.body.querySelector('#rg-pass').value,
    };
    if (!body.display_name) { toast('กรุณากรอกชื่อ', 'err'); return; }
    if (!body.login) { toast('กรุณากรอกเบอร์โทร', 'err'); return; }
    if (body.password.length < 4) { toast('รหัสผ่านต้องยาวอย่างน้อย 4 ตัวอักษร', 'err'); return; }
    btn.disabled = true;
    try {
      const r = await api('/api/auth/register', { method: 'POST', body });
      setSession(r.token, r.user);
      md.close();
      toast(`สมัครสำเร็จ! ยินดีต้อนรับ ${r.user.display_name} 🎉`, 'ok');
      chooseRole('customer');
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });
}

/* ── ประตูล็อกอินระหว่างสั่งอาหาร (guest แตะส่งออเดอร์) ── */
function openAuthGate(onDone) {
  const md = openModal({
    title: 'เข้าสู่ระบบเพื่อสั่งอาหาร',
    sub: 'สมาชิกเท่านั้น เพื่อร้านติดต่อคุณกลับได้เมื่ออาหารพร้อม',
    icon: IC.bell,
    className: 'auth-gate',
    body: `
      <div class="seg field-seg" id="ag-tabs">
        <button type="button" data-ag="login" class="on">🔑 เข้าสู่ระบบ</button>
        <button type="button" data-ag="register">📝 สมัครใหม่</button>
        <button type="button" data-ag="guest">🚀 สั่งเป็นแขก</button>
      </div>
      <div id="ag-login-pane">
        <div class="field"><label for="ag-login">เบอร์โทร / ชื่อผู้ใช้</label>
          <input class="tin" id="ag-login" maxlength="60" placeholder="0891234567"></div>
        <div class="field"><label for="ag-pass">รหัสผ่าน</label>
          <input class="tin" id="ag-pass" type="password" maxlength="100" placeholder="••••••••"></div>
        <button class="btn primary block" id="ag-go" type="button">เข้าสู่ระบบ</button>
      </div>
      <div id="ag-reg-pane" hidden>
        <div class="field"><label for="ag-name">ชื่อของคุณ</label>
          <input class="tin" id="ag-name" maxlength="120" placeholder="เช่น พี่บอล"></div>
        <div class="field"><label for="ag-rlogin">เบอร์โทร (ใช้เข้าสู่ระบบ)</label>
          <input class="tin" id="ag-rlogin" maxlength="60" inputmode="tel" placeholder="08x-xxx-xxxx"></div>
        <div class="field"><label for="ag-rpass">รหัสผ่าน (4 ตัวขึ้นไป)</label>
          <input class="tin" id="ag-rpass" type="password" maxlength="100" placeholder="••••••••"></div>
        <button class="btn gold block" id="ag-go2" type="button">สมัครสมาชิก</button>
      </div>
      <div id="ag-guest-pane" hidden>
        <p class="hint" style="margin:0 0 10px">สั่งได้เลยไม่ต้องสมัคร — แต่ต้องกรอกชื่อและ<b>เบอร์โทรจริง</b> เพื่อให้ร้านติดต่อคุณได้เมื่ออาหารพร้อม</p>
        <div class="field"><label for="ag-gname">ชื่อของคุณ</label>
          <input class="tin" id="ag-gname" maxlength="80" placeholder="เช่น พี่บอล"></div>
        <div class="field"><label for="ag-gphone">เบอร์โทร (จำเป็น)</label>
          <input class="tin" id="ag-gphone" maxlength="20" inputmode="tel" placeholder="08x-xxx-xxxx"></div>
        <button class="btn primary block" id="ag-go3" type="button">🚀 สั่งเป็นแขก (ไม่ต้องสมัคร)</button>
      </div>`,
  });
  let mode = 'login';

  md.body.querySelector('#ag-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-ag]');
    if (!b) return;
    mode = b.dataset.ag;
    $$('#ag-tabs button', md.body).forEach((x) => x.classList.toggle('on', x === b));
    md.body.querySelector('#ag-login-pane').hidden = mode !== 'login';
    md.body.querySelector('#ag-reg-pane').hidden = mode !== 'register';
    md.body.querySelector('#ag-guest-pane').hidden = mode !== 'guest';
  });

  const finish = (user) => {
    md.close();
    toast(`ยินดีต้อนรับ ${user.display_name}! ข้อมูลจะเติมให้อัตโนมัติ`, 'ok');
    if (onDone) onDone(user);
  };

  md.body.querySelector('#ag-go').addEventListener('click', async () => {
    const btn = md.body.querySelector('#ag-go');
    try {
      btn.disabled = true;
      const r = await api('/api/auth/login', {
        method: 'POST',
        body: { login: md.body.querySelector('#ag-login').value.trim(), password: md.body.querySelector('#ag-pass').value },
      });
      setSession(r.token, r.user);
      finish(r.user);
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });
  md.body.querySelector('#ag-go3').addEventListener('click', () => {
    const gname = md.body.querySelector('#ag-gname').value.trim();
    const gphone = normalizeThaiPhone(md.body.querySelector('#ag-gphone').value);
    if (!gname || gname.length < 2) return toast('กรุณากรอกชื่อของคุณ (อย่างน้อย 2 ตัวอักษร)', 'err');
    if (!gphone) return toast('กรุณากรอกเบอร์โทรที่ถูกต้อง เช่น 0812345678 — เพื่อให้ร้านติดต่อคุณได้', 'err');
    md.close();
    if (onDone) onDone({ guest: true, display_name: gname, phone: gphone });
  });
  md.body.querySelector('#ag-go2').addEventListener('click', async () => {
    const btn = md.body.querySelector('#ag-go2');
    const body = {
      role: 'customer',
      display_name: md.body.querySelector('#ag-name').value.trim(),
      login: md.body.querySelector('#ag-rlogin').value.trim(),
      password: md.body.querySelector('#ag-rpass').value,
    };
    if (!body.display_name || !body.login || body.password.length < 4) {
      toast('กรุณากรอกชื่อ เบอร์โทร และรหัสผ่าน (4 ตัวขึ้นไป)', 'err');
      return;
    }
    try {
      btn.disabled = true;
      const r = await api('/api/auth/register', { method: 'POST', body });
      setSession(r.token, r.user);
      finish(r.user);
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });
}

function chooseRole(role) {
  /* บทบาทที่ต้องล็อกอิน */
  const u = state.user;
  if (['admin', 'manager', 'vendor'].includes(role) && (!u || u.role !== role)) {
    if (u && u.role === 'admin') {
      /* แอดมินทดสอบมุมมองผู้จัดการ/ร้านค้า/ลูกค้าได้ */
    } else {
      toast('กรุณาเข้าสู่ระบบด้วยบัญชี' + (ROLE_TH[role] || role) + 'ก่อน', 'err');
      openLoginScreen();
      return;
    }
  }
  if (role === 'manager' && u && u.role === 'manager') state.manager.marketId = u.market_id;
  state.role = role;
  const want = '#/' + role;
  if (location.hash !== want) {
    try { history.replaceState(null, '', want); } catch (e) {}
  }
  renderNav();
  window.scrollTo(0, 0);
  if (role === 'admin') enterAdmin();
  else if (role === 'manager') enterManager();
  else if (role === 'vendor') enterVendor();
  else enterCustomer();
}

function enterRole(role) { chooseRole(role); }

/* ═══════════════════════════════════════════════════════════
   บทบาทที่ 1 · 🏪 ผู้จัดการตลาด
   ═══════════════════════════════════════════════════════════ */
async function enterManager() {
  const m = state.manager;
  viewEl.dataset.app = 'manager';
  const u = state.user;
  try {
    const data = await api('/api/markets');
    m.markets = data.markets;
  } catch (e) {
    m.markets = [];
  }
  if (u && u.role === 'manager' && !u.market_id) {
    /* v6: ผจก.ยังไม่มีตลาด (รอแอดมินอนุมัติ หรือถูกปฏิเสธ) — แสดงสถานะใบสมัคร */
    renderManagerApplyStatus();
    return;
  }
  if (u && u.role === 'manager' && u.market_id) {
    /* ผู้จัดการ: เข้าถึงตลาดของตัวเองเท่านั้น */
    m.markets = m.markets.filter((mk) => mk.id === Number(u.market_id));
    m.marketId = Number(u.market_id);
  } else {
    const savedMid = Number(store.get('talatsuite.market') || 0) || null;
    if (savedMid && m.markets.some((mk) => mk.id === savedMid)) m.marketId = savedMid;
  }
  renderManager();
}

function switchManagerTab(tab) {
  state.manager.tab = tab;
  updateNavOn();
  overlayRoot.innerHTML = '';
  window.scrollTo(0, 0);
  renderManager();
}

function marketById(id) {
  return state.manager.markets.find((mk) => mk.id === id) || null;
}

function renderManager() {
  const m = state.manager;
  if (!m.markets.length) {
    viewEl.dataset.app = 'manager';
    viewEl.innerHTML = `
      <header class="pagehead">
        <div class="ph-top">
          <div class="ph-title"><h2>ผู้จัดการตลาด</h2><p>จัดการตลาดของคุณ</p></div>
          ${roleBtnHTML()}
        </div>
      </header>
      <div class="empty" style="margin-top:18px">
        <div class="e-emo">🏪</div><b>ยังไม่มีตลาดในระบบ</b>
        <p>สร้างตลาดแรกของคุณเพื่อเริ่มจัดการล็อคและร้านค้า</p>
        <div style="margin-top:14px"><button class="btn gold" id="mk-new-empty" type="button">＋ สร้างตลาดใหม่</button></div>
      </div>`;
    return;
  }
  if (!m.marketId) { renderMarketPicker(); return; }
  if (m.tab === 'apps') { renderManagerApplications(); return; }
  if (m.tab === 'home') renderManagerHome();
  else if (m.tab === 'shops') renderManagerShops();
  else renderManagerSettings();
}

function roleBtnHTML() {
  const u = state.user;
  /* ปุ่มมุมขวาบน — เปลี่ยนตามสถานะ */
  if (u && u.role === 'admin' && state.role !== 'admin') {
    return `<button class="ph-chip role-chip" id="role-btn" data-rolebtn="back-admin" type="button" title="กลับคอนโซลแอดมิน">🛡️ หน้าแอดมิน</button>`;
  }
  if (u) {
    return `<button class="ph-chip role-chip" id="role-btn" data-rolebtn="logout" type="button" title="ออกจากระบบ">⏻ ${esc(u.display_name)} · ออกจากระบบ</button>`;
  }
  return `<button class="ph-chip role-chip" id="role-btn" data-rolebtn="login" type="button" title="เข้าสู่ระบบ">🔑 เข้าสู่ระบบ</button>`;
}

/* ── กล่องผู้ใช้ที่แถบข้างล่าง ── */
function renderSideUser() {
  const el = $('#side-user');
  if (!el) return;
  const u = state.user;
  if (!u) {
    el.innerHTML = `
      <button class="side-login-btn" data-rolebtn="login" type="button">
        <span class="rs-ic" aria-hidden="true">🔑</span>
        <span class="rs-tx">เข้าสู่ระบบ</span>
      </button>`;
    return;
  }
  const scopeTxt =
    u.role === 'admin' ? 'ผู้ดูแลทุกตลาด'
    : u.role === 'manager' ? (state.manager.marketId && marketById(state.manager.marketId) ? marketById(state.manager.marketId).name : 'ผู้จัดการตลาด')
    : u.role === 'vendor' ? 'ร้านค้า'
    : 'สมาชิก';
  el.innerHTML = `
    <div class="side-user">
      <span class="su-ava" aria-hidden="true">${ROLE_EMOJI[u.role] || '👤'}</span>
      <div class="su-tx">
        <b>${esc(u.display_name)}</b>
        <small>${ROLE_TH[u.role] || u.role} · ${esc(scopeTxt)}</small>
      </div>
      <button class="su-out" data-rolebtn="logout" type="button" title="ออกจากระบบ">⏻</button>
    </div>`;
}

/* ── วันที่สร้างบัญชี (พ.ศ.) ── */
function memberSince(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${beYear(d.getFullYear())}`;
}

/* ── ชีตบัญชีของฉัน: ข้อมูล + เปลี่ยนรหัสผ่าน + รหัสล็อคหน้าจอ ── */
function openAccountSheet() {
  const u = state.user;
  if (!u) return;
  const md = openModal({
    title: 'บัญชีของฉัน',
    sub: `${ROLE_TH[u.role] || u.role} · @${u.login}`,
    icon: '👤',
    className: 'acct-sheet',
    body: `
      <div class="acct-head">
        <span class="acct-ava" aria-hidden="true">${ROLE_EMOJI[u.role] || '👤'}</span>
        <div>
          <b>${esc(u.display_name)}</b>
          <small>${ROLE_TH[u.role] || u.role}</small>
          <small>สมาชิกตั้งแต่ ${memberSince(u.created_at)}</small>
          ${u.phone ? `<small>📞 ${esc(u.phone)}</small>` : ''}
          ${u.email ? `<small>✉️ ${esc(u.email)}</small>` : ''}
        </div>
      </div>

      <section class="acct-sec">
        <h4>🌐 ภาษา / Language</h4>
        ${langSwitchHTML('lang-switch-acct')}
        <p class="hint">เปลี่ยนภาษาได้ทุกเมื่อ — ใช้ได้ทั้งไทยและอังกฤษ (EN)</p>
      </section>

      <section class="acct-sec">
        <h4>🔑 เปลี่ยนรหัสผ่าน</h4>
        <div class="field"><label for="ac-old">รหัสผ่านปัจจุบัน</label>
          <input class="tin" id="ac-old" type="password" autocomplete="current-password"></div>
        <div class="field"><label for="ac-new">รหัสผ่านใหม่ (4 ตัวขึ้นไป)</label>
          <input class="tin" id="ac-new" type="password" autocomplete="new-password"></div>
        <div class="field"><label for="ac-new2">ยืนยันรหัสผ่านใหม่</label>
          <input class="tin" id="ac-new2" type="password" autocomplete="new-password"></div>
        <button class="btn primary block" id="ac-pw-save" type="button">เปลี่ยนรหัสผ่าน</button>
        <p class="hint">เปลี่ยนแล้วทุกเครื่องที่เข้าอยู่จะถูกออกจากระบบ ยกเว้นเครื่องนี้</p>
      </section>

      <section class="acct-sec">
        <h4>🔒 รหัสล็อคหน้าจอ</h4>
        <p class="set-sub">${u.has_passcode
          ? 'เปิดใช้งานอยู่ — แอปจะขอรหัสทุกครั้งที่เปิดใหม่'
          : 'ยังไม่ได้ตั้ง — ตั้งเพื่อล็อคหน้าจอเวลาเปิดแอป (ตัวเลข 4–8 หลัก)'}</p>
        <div class="field"><label for="ac-pc">รหัสล็อค${u.has_passcode ? 'ใหม่' : ''} (ตัวเลข 4–8 หลัก)</label>
          <input class="tin" id="ac-pc" type="password" inputmode="numeric" maxlength="8" autocomplete="off" placeholder="• • • •"></div>
        <div class="field"><label for="ac-pc-pw">ยืนยันด้วยรหัสผ่านบัญชี</label>
          <input class="tin" id="ac-pc-pw" type="password" autocomplete="current-password" placeholder="รหัสผ่านปัจจุบันของบัญชี"></div>
        <div class="btn-row">
          ${u.has_passcode ? '<button class="btn danger" id="ac-pc-del" type="button">ลบรหัสล็อค</button>' : ''}
          <button class="btn gold" id="ac-pc-save" type="button">${u.has_passcode ? 'เปลี่ยนรหัสล็อค' : 'ตั้งรหัสล็อค'}</button>
        </div>
      </section>

      <button class="btn ghost block" id="ac-logout" type="button">⏻ ออกจากระบบ</button>
      <button class="btn danger-ghost block" id="ac-del" type="button">🗑 ลบบัญชีของฉัน</button>`,
  });

  bindLangSwitch();
  md.body.querySelector('#ac-del').addEventListener('click', async () => {
    const ok = await confirmDialog({
      title: 'ลบบัญชีถาวร',
      message: `ลบบัญชี <b>@${esc(u.login)}</b> พร้อมประวัติออเดอร์และข้อมูลทั้งหมด<br>ไม่สามารถเรียกคืนได้ — ยืนยันเพื่อลบถาวร`,
      danger: true,
      confirmText: 'ลบบัญชี',
    });
    if (!ok) return;
    try {
      await api('/api/auth/me', { method: 'DELETE', body: {} });
      md.close();
      store.set('talatsuite.token', '');
      toast('ลบบัญชีเรียบร้อย — แล้วเจอกันใหม่ 👋', 'ok');
      setTimeout(() => location.reload(), 900);
    } catch (e) { toast(e.message || 'ลบบัญชีไม่สำเร็จ', 'err'); }
  });

  md.body.querySelector('#ac-pw-save').addEventListener('click', async () => {
    const btn = md.body.querySelector('#ac-pw-save');
    const oldPw = md.body.querySelector('#ac-old').value;
    const n1 = md.body.querySelector('#ac-new').value;
    const n2 = md.body.querySelector('#ac-new2').value;
    if (!oldPw || !n1) return toast('กรอกรหัสผ่านให้ครบ', 'err');
    if (n1 !== n2) return toast('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน', 'err');
    btn.disabled = true;
    try {
      await api('/api/auth/password', { method: 'PUT', body: { old_password: oldPw, new_password: n1 } });
      toast('เปลี่ยนรหัสผ่านเรียบร้อย — เครื่องอื่นถูกออกจากระบบแล้ว', 'ok');
      md.close();
    } catch (e) { toast(e.message, 'err'); btn.disabled = false; }
  });

  md.body.querySelector('#ac-pc-save').addEventListener('click', async () => {
    const btn = md.body.querySelector('#ac-pc-save');
    const pc = md.body.querySelector('#ac-pc').value.trim();
    const pw = md.body.querySelector('#ac-pc-pw').value;
    if (!/^[0-9]{4,8}$/.test(pc)) return toast('รหัสล็อคต้องเป็นตัวเลข 4–8 หลัก', 'err');
    if (!pw) return toast('กรอกรหัสผ่านบัญชีเพื่อยืนยัน', 'err');
    btn.disabled = true;
    try {
      const r = await api('/api/auth/passcode', { method: 'PUT', body: { password: pw, passcode: pc } });
      if (state.user) state.user.has_passcode = r.has_passcode;
      toast(r.has_passcode ? 'ตั้งรหัสล็อคหน้าจอเรียบร้อย' : 'อัปเดตรหัสล็อคเรียบร้อย', 'ok');
      md.close();
    } catch (e) { toast(e.message, 'err'); btn.disabled = false; }
  });

  const delBtn = md.body.querySelector('#ac-pc-del');
  if (delBtn) delBtn.addEventListener('click', async () => {
    const pw = md.body.querySelector('#ac-pc-pw').value;
    if (!pw) return toast('กรอกรหัสผ่านบัญชีเพื่อยืนยัน', 'err');
    try {
      const r = await api('/api/auth/passcode', { method: 'PUT', body: { password: pw, passcode: null } });
      if (state.user) state.user.has_passcode = r.has_passcode;
      toast('ลบรหัสล็อคหน้าจอแล้ว', 'info');
      md.close();
    } catch (e) { toast(e.message, 'err'); }
  });

  md.body.querySelector('#ac-logout').addEventListener('click', () => { md.close(); doLogout(); });
}

/* ── ล็อคหน้าจอ (passcode) ── */
function showLockScreen() {
  const u = state.user;
  const el = $('#lock-screen');
  if (!el || !u || !u.has_passcode) return;
  $('#lock-who').textContent = `บัญชี ${u.display_name} ตั้งรหัสล็อคไว้ — กรอกรหัสเพื่อใช้งานต่อ`;
  const input = $('#lock-input');
  const errEl = $('#lock-err');
  input.value = ''; errEl.textContent = '';
  el.hidden = false;
  const tryUnlock = async () => {
    const pc = input.value.trim();
    if (!pc) return;
    errEl.textContent = '';
    try {
      await api('/api/auth/verify-passcode', { method: 'POST', body: { passcode: pc } });
      el.hidden = true;
      toast('ปลดล็อคแล้ว ยินดีต้อนรับกลับ 👋', 'ok');
    } catch (e) {
      errEl.textContent = e.message + ' — ลองอีกครั้ง';
      input.value = ''; input.focus();
    }
  };
  $('#lock-unlock').onclick = tryUnlock;
  input.onkeydown = (e) => { if (e.key === 'Enter') tryUnlock(); };
  $('#lock-exit').onclick = () => { el.hidden = true; doLogout(); };
  setTimeout(() => input.focus(), 60);
}

function marketChipHTML() {
  const mk = marketById(state.manager.marketId);
  if (!mk) return '';
  return `<button class="ph-chip mk-chip" id="mk-btn" type="button" title="เปลี่ยนตลาด">${esc(mk.emoji)} ${esc(mk.name)} ▾</button>`;
}

/* ───────── ตัวช่วย UI ตารางเปิดทำการ ───────── */
const TH_DAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']; /* 0=อาทิตย์ */

/* สร้างข้อความตาราง (มิเรอร์ฝั่งเซิร์ฟเวอร์ ใช้พรีวิวสด) */
function schedTextClient(days, ot, ct) {
  const hasTime = !!(ot && ct);
  const time = hasTime ? `${ot}–${ct}` : '';
  let dayTxt;
  if (!days.length || days.length === 7) dayTxt = 'เปิดทุกวัน';
  else if (days.length === 1) dayTxt = `เปิดวัน${TH_DAY_LABELS[days[0]]}`;
  else {
    let sorted = days.slice().sort((a, b) => a - b);
    if (sorted.includes(0) && sorted.includes(6)) {
      const set = new Set(sorted);
      for (const s of sorted) {
        const chain = []; let d = s;
        while (chain.length < sorted.length && set.has(d)) { chain.push(d); d = (d + 1) % 7; }
        if (chain.length === sorted.length) { sorted = chain; break; }
      }
    }
    const ranges = []; let start = sorted[0], prev = sorted[0];
    for (let i = 1; i <= sorted.length; i++) {
      const d = sorted[i];
      if (d === (prev + 1) % 7) { prev = d; continue; }
      ranges.push(start === prev ? TH_DAY_LABELS[start] : `${TH_DAY_LABELS[start]}–${TH_DAY_LABELS[prev]}`);
      start = prev = d;
    }
    dayTxt = 'เปิด ' + ranges.join(' · ');
  }
  return time ? `${dayTxt} ${time} น.` : dayTxt;
}

function scheduleEditorHTML(p, mk = {}) {
  const days = Array.isArray(mk.open_days) ? mk.open_days : [];
  const force = mk.force_open == null ? 'auto' : (mk.force_open ? 'open' : 'close');
  return `
    <div class="field">
      <label>วันเปิดทำการ</label>
      <div class="day-chips" id="${p}-days" role="group" aria-label="วันเปิดทำการ">
        ${TH_DAY_LABELS.map((d, i) => `<button type="button" class="day-chip ${days.includes(i) ? 'on' : ''}" data-d="${i}" aria-pressed="${days.includes(i)}">${d}</button>`).join('')}
      </div>
      <p class="hint">แตะเลือกวันที่ตลาดเปิด — ลูกค้าจะเห็นป้าย "เปิดวันนี้ / ปิดวันนี้" ตามวันจริง</p>
    </div>
    <div class="field-pair">
      <div class="field"><label for="${p}-ot">เวลาเปิด</label>
        <input class="tin" id="${p}-ot" maxlength="5" inputmode="numeric" placeholder="16:00" value="${esc(mk.open_time || '')}"></div>
      <div class="field"><label for="${p}-ct">เวลาปิด</label>
        <input class="tin" id="${p}-ct" maxlength="5" inputmode="numeric" placeholder="23:00" value="${esc(mk.close_time || '')}"></div>
    </div>
    <div class="field">
      <label>สถานะวันนี้</label>
      <div class="seg field-seg" id="${p}-force">
        <button type="button" data-v="auto" class="${force === 'auto' ? 'on' : ''}">📅 ตามตาราง</button>
        <button type="button" data-v="open" class="${force === 'open' ? 'on' : ''}">🟢 เปิดวันนี้</button>
        <button type="button" data-v="close" class="${force === 'close' ? 'on' : ''}">🔴 ปิดวันนี้</button>
      </div>
      <p class="hint" id="${p}-sched-preview"></p>
    </div>`;
}

function wireScheduleEditor(scope, prefix) {
  const daysEl = scope.querySelector('#' + prefix + '-days');
  const forceEl = scope.querySelector('#' + prefix + '-force');
  const otEl = scope.querySelector('#' + prefix + '-ot');
  const ctEl = scope.querySelector('#' + prefix + '-ct');
  const pvEl = scope.querySelector('#' + prefix + '-sched-preview');
  const update = () => {
    if (!pvEl) return;
    const days = readScheduleEditor(scope, prefix).open_days;
    const today = new Date().getDay();
    const auto = !forceEl.querySelector('button.on') || forceEl.querySelector('button.on').dataset.v === 'auto';
    const openToday = auto ? days.includes(today) : forceEl.querySelector('button.on').dataset.v === 'open';
    pvEl.innerHTML = `ตอนนี้แสดงเป็น: <b>${openToday ? '🟢 เปิดวันนี้' : '🔴 ปิดวันนี้'}</b> · ${esc(schedTextClient(days, otEl.value.trim(), ctEl.value.trim()))}`;
  };
  if (daysEl) daysEl.addEventListener('click', (e) => {
    const b = e.target.closest('.day-chip'); if (!b) return;
    b.classList.toggle('on'); b.setAttribute('aria-pressed', b.classList.contains('on')); update();
  });
  if (forceEl) forceEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]'); if (!b) return;
    forceEl.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); update();
  });
  if (otEl) otEl.addEventListener('input', update);
  if (ctEl) ctEl.addEventListener('input', update);
  update();
}

function readScheduleEditor(scope, prefix) {
  const on = scope.querySelector('#' + prefix + '-force button.on');
  return {
    open_days: [...scope.querySelectorAll('#' + prefix + '-days .day-chip.on')].map((b) => Number(b.dataset.d)),
    open_time: (scope.querySelector('#' + prefix + '-ot') || {}).value || '',
    close_time: (scope.querySelector('#' + prefix + '-ct') || {}).value || '',
    force_open: !on || on.dataset.v === 'auto' ? null : on.dataset.v === 'open',
  };
}

/* ── ตัวเลือกตลาด (ผู้จัดการ) ── */
function renderMarketPicker() {
  const m = state.manager;
  viewEl.innerHTML = `
    <header class="pagehead">
      <div class="ph-top">
        <div class="ph-title"><h2>เลือกตลาดที่คุณดูแล</h2><p>แตะเพื่อเข้าไปจัดการ หรือสร้างตลาดใหม่</p></div>
        ${m.marketId || (state.user && state.user.role === 'admin') ? '<button class="ph-chip action-chip" id="mp-back" type="button" title="ย้อนกลับ">← ย้อนกลับ</button>' : ''}
        ${roleBtnHTML()}
      </div>
    </header>
    <div class="mk-grid">
      ${m.markets.map((mk) => `
        <button class="mk-card" data-mk="${mk.id}" type="button">
          <span class="mkc-emo">${esc(mk.emoji)}</span>
          <div class="mkc-tx">
            <b>${esc(mk.name)}</b>
            <small>${esc(mk.area || '—')}</small>
            <span class="mkc-meta">🕒 ${esc(mk.schedule_text || mk.hours_text || '—')}</span>
            <span class="mkc-meta">${mk.lots_total} ล็อค · ${mk.shops_total} ร้าน</span>
          </div>
          <span class="open-badge ${mk.open_today ? 'on' : 'off'}">${mk.open_today ? 'เปิดวันนี้' : 'ปิดวันนี้'}</span>
        </button>`).join('')}
      ${state.user && state.user.role === 'admin' ? `
      <button class="mk-card mk-add" id="mk-new" type="button">
        <span class="mkc-emo">＋</span>
        <div class="mkc-tx"><b>สร้างตลาดใหม่</b><small>ตั้งชื่อ เพิ่มแถวล็อค แล้วเริ่มรับร้านค้า</small></div>
      </button>` : ''}
    </div>`;
}

function openMarketCreateSheet() {
  const md = openModal({
    title: 'สร้างตลาดใหม่',
    sub: 'กรอกข้อมูลพื้นฐาน — แก้ไขเพิ่มเติมได้ที่ "ตั้งค่าตลาด"',
    icon: IC.pin,
    className: 'mk-form-sheet',
    body: `
      <div class="field"><label for="nmp-name">ชื่อตลาด</label>
        <input class="tin" id="nmp-name" maxlength="120" placeholder="เช่น ตลาดนัดหมู่บ้านสวนสยาม"></div>
      <div class="field"><label for="nmp-area">ที่ตั้ง</label>
        <input class="tin" id="nmp-area" maxlength="160" placeholder="เช่น นนทบุรี · ปากเกร็ด"></div>
      <div class="field"><label for="nmp-hours">เวลาเปิดทำการ</label>
        <input class="tin" id="nmp-hours" maxlength="120" placeholder="เช่น เปิดเสาร์–อาทิตย์ 08:00 – 15:00"></div>
      <div class="field"><label for="nmp-emoji">อิโมจิประจำตลาด</label>
        <input class="tin" id="nmp-emoji" maxlength="8" value="🏪"></div>
      <div class="field"><label for="nmp-type">ประเภทตลาด</label>
        <select class="tin" id="nmp-type">
          <option value="night" selected>🌙 ตลาดกลางคืน (ตลาดนัด)</option>
          <option value="day">☀️ ตลาดกลางวัน (ตลาดสด · ตลาดเช้า)</option>
        </select></div>
      <h4 class="sheet-sec-title">🗓️ ตารางเปิดทำการ</h4>
      ${scheduleEditorHTML('nmp-sch', { open_days: [0, 1, 2, 3, 4, 5, 6], open_time: '', close_time: '', force_open: null })}
      <button class="btn primary block" id="nmp-save" type="button">สร้างตลาด</button>`,
  });
  wireScheduleEditor(md.body, 'nmp-sch');
  md.body.querySelector('#nmp-save').addEventListener('click', async () => {
    const btn = md.body.querySelector('#nmp-save');
    const name = md.body.querySelector('#nmp-name').value.trim();
    if (!name) { toast('กรุณากรอกชื่อตลาด', 'err'); return; }
    const sched = readScheduleEditor(md.body, 'nmp-sch');
    const tm = /^([01]?\d|2[0-3]):[0-5]\d$/;
    if (sched.open_time && !tm.test(sched.open_time)) { toast('รูปแบบเวลาเปิดต้องเป็น HH:MM เช่น 16:00', 'err'); return; }
    if (sched.close_time && !(tm.test(sched.close_time) || sched.close_time === '24:00')) { toast('รูปแบบเวลาปิดต้องเป็น HH:MM เช่น 23:00', 'err'); return; }
    btn.disabled = true;
    try {
      const r = await api('/api/markets', {
        method: 'POST',
        body: {
          name,
          area: md.body.querySelector('#nmp-area').value,
          hours_text: md.body.querySelector('#nmp-hours').value,
          emoji: md.body.querySelector('#nmp-emoji').value,
          market_type: md.body.querySelector('#nmp-type').value,
          ...sched,
        },
      });
      md.close();
      toast(`สร้างตลาด “${r.market.name}” แล้ว — ไปตั้งค่าผังล็อคได้เลย`, 'ok');
      state.manager.markets.push(r.market);
      if (state.role === 'admin') {
        /* อยู่ในคอนโซลแอดมิน → รีเฟรชหน้าจัดการตลาด */
        renderAdminMarkets();
        return;
      }
      state.manager.marketId = r.market.id;
      store.set('talatsuite.market', String(r.market.id));
      state.manager.tab = 'settings';
      renderManager();
      updateNavOn();
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });
}

/* ── แท็บหน้าหลัก: แดชบอร์ดรายรับ + ผังล็อค (โครงจาก v1) ── */
function renderManagerHome() {
  const m = state.manager;
  viewEl.dataset.app = 'manager';
  const myMk = m.markets.find((mk) => mk.id === m.marketId);
  const mkPending = myMk && myMk.status && myMk.status !== 'approved';
  viewEl.innerHTML = `
    ${mkPending ? `<div class="notice-banner warn" style="margin:12px 0 0">⏳ <b>ตลาดของคุณ${myMk.status === 'pending' ? 'รอแอดมินอนุมัติ' : 'ถูกปฏิเสธ'}</b>${myMk.status === 'pending' ? ' — จะเผยแพร่ให้ลูกค้าเห็นทันทีที่อนุมัติ (จัดการข้อมูลภายในได้ตามปกติ)' : ': ' + esc(myMk.deny_reason || '')}</div>` : ''}
    <header class="pagehead">
      <div class="ph-top">
        <div class="ph-title">
          <h2>ระบบจัดการตลาด</h2>
          <p>ล็อคแผง ค่าเช่า และสถานะชำระเงินรายวัน</p>
        </div>
        ${marketChipHTML()}
        ${roleBtnHTML()}
      </div>
      <div class="metrics" id="m-metrics">
        <div class="metric revenue"><div class="m-label"><span class="m-ic">${IC.money}</span>รายได้รวม</div><div class="skel" style="height:30px;margin-top:6px"></div></div>
        <div class="metric total"><div class="m-label"><span class="m-ic">${IC.grid}</span>ล็อคทั้งหมด</div><div class="skel" style="height:30px;margin-top:6px"></div></div>
        <div class="metric unpaidm"><div class="m-label"><span class="m-ic">${IC.alert}</span>ค้างชำระ</div><div class="skel" style="height:30px;margin-top:6px"></div></div>
        <div class="metric shopsm"><div class="m-label"><span class="m-ic">${IC.store}</span>ร้านเปิดตอนนี้</div><div class="skel" style="height:30px;margin-top:6px"></div></div>
      </div>
      <div class="controls">
        <div class="seg" id="period-seg" role="tablist">
          <button type="button" data-p="daily" class="${m.period === 'daily' ? 'on' : ''}">รายวัน</button>
          <button type="button" data-p="weekly" class="${m.period === 'weekly' ? 'on' : ''}">รายสัปดาห์</button>
          <button type="button" data-p="monthly" class="${m.period === 'monthly' ? 'on' : ''}">รายเดือน</button>
        </div>
        <button class="datebtn" id="date-btn" type="button">
          <span class="d-ic">${IC.calendar}</span>
          <span class="d-tx"><b id="date-label">${fmtDateShort(m.date)}</b><small>แตะเพื่อเปลี่ยนวันที่</small></span>
          <span class="d-chev">${IC.down}</span>
        </button>
      </div>
    </header>
    <div id="m-floor">
      <div class="legend"><span class="skel" style="width:90px;height:30px"></span><span class="skel" style="width:90px;height:30px"></span></div>
      <div class="lots-grid">${'<div class="skel" style="min-height:92px"></div>'.repeat(10)}</div>
    </div>`;
  loadMarket();
}

async function loadMarket() {
  const m = state.manager;
  m.loading = true; m.error = null;
  try {
    m.data = await api(`/api/market/dashboard?date=${m.date}&period=${m.period}&market_id=${m.marketId || 1}`);
    m.error = null;
    if (state.role === 'manager' && m.tab === 'home') renderMarketData();
  } catch (e) {
    m.error = e.message;
    if (state.role === 'manager' && m.tab === 'home') renderMarketError();
  } finally {
    m.loading = false;
  }
}

function rangeLabel(data) {
  const { period, range, date } = data;
  if (period === 'daily') return fmtDateMedium(date);
  if (period === 'weekly') return `${fmtDateMedium(range.from)} – ${fmtDateMedium(range.to)}`;
  const d = parseDate(range.from);
  return `${TH_MONTHS[d.getMonth()]} ${beYear(d.getFullYear())}`;
}

function renderMarketData() {
  const m = state.manager;
  const d = m.data;
  if (!d) return;
  const met = d.metrics;
  const lbl = rangeLabel(d);

  $('#m-metrics').innerHTML = `
    <div class="metric revenue">
      <div class="m-label"><span class="m-ic">${IC.money}</span>รายได้รวม</div>
      <div class="m-val">${baht(met.revenue)}</div>
      <div class="m-sub">${met.payment_count} รายการชำระ · ${esc(lbl)}<button class="m-link" id="rev-history" type="button">ดูประวัติ</button></div>
    </div>
    <div class="metric total">
      <div class="m-label"><span class="m-ic">${IC.grid}</span>ล็อคทั้งหมด</div>
      <div class="m-val">${met.total_lots}</div>
      <div class="m-sub">มีผู้เช่า ${met.occupied} ล็อค</div>
    </div>
    <div class="metric unpaidm">
      <div class="m-label"><span class="m-ic">${IC.alert}</span>ค้างชำระ</div>
      <div class="m-val">${met.unpaid}</div>
      <div class="m-sub">จากผู้เช่า ${met.occupied} ล็อคในวันนี้</div>
    </div>
    <div class="metric shopsm">
      <div class="m-label"><span class="m-ic">${IC.store}</span>ร้านเปิดตอนนี้</div>
      <div class="m-val">${met.shops_open != null ? met.shops_open + '/' + met.shops_total : '—'}</div>
      <div class="m-sub">จากทุกร้านในตลาด</div>
    </div>`;

  $('#date-label').textContent = fmtDateShort(d.date);

  /* ── ผังตลาด (แถวไดนามิกตาม layout ของตลาด) ── */
  const rows = {};
  d.lots.forEach((l) => { (rows[l.row] = rows[l.row] || []).push(l); });
  const rowKeys = Object.keys(rows).sort();

  const lotHTML = (l) => {
    const s = l.state;
    const occupied = !!(s && s.vendor_name && s.vendor_name.trim());
    const paid = occupied && s.payment_status === 'paid';
    const absent = occupied && s.attendance === 'absent';
    const cls = ['lot', occupied ? (paid ? 'paid' : 'unpaid') : 'vacant'];
    if (absent) cls.push('absent');
    const catDot = occupied ? `<span class="cat-dot c-${s.category}" title="${esc(CAT_TH[s.category])}"></span>` : '';
    const badge = occupied
      ? (paid ? '✓ ชำระแล้ว' : 'ค้างชำระ')
      : 'เปิดรับผู้เช่า';
    const vendor = occupied ? esc(s.vendor_name) : 'ว่าง';
    const lbl = l.label ? `<span class="lot-label" title="ชื่อล็อค">${esc(l.label)}</span>` : '';
    return `<button type="button" class="${cls.join(' ')}" data-code="${l.code}" aria-label="ล็อค ${l.code}${l.label ? ' · ' + l.label : ''}">
      ${absent ? '<span class="absent-tag">ไม่มา</span>' : ''}
      <span class="lot-code">${l.code}${catDot}${lbl}</span>
      <span class="lot-vendor">${vendor}</span>
      <span class="lot-badge">${badge}</span>
    </button>`;
  };

  $('#m-floor').innerHTML = `
    <div class="legend">
      <span><i class="lg-v"></i> ว่าง</span>
      <span><i class="lg-p"></i> ชำระแล้ว</span>
      <span><i class="lg-u"></i> ค้างชำระ</span>
      <span><i style="background:repeating-linear-gradient(-45deg,#7bc98f 0 3.5px,#1b7a3c 3.5px 7px)"></i> ไม่มาขาย (แถบลาย)</span>
      <span style="margin-left:auto;color:var(--muted)">แตะล็อคเพื่อแก้ไขข้อมูล</span>
    </div>
    <div class="export-row">
      <button class="btn sm ghost" id="mk-export" type="button">⬇️ ส่งออก / พิมพ์รายงาน</button>
    </div>
    ${rowKeys.map((r) => `
      <section class="row-section">
        <div class="row-head">
          <span class="rh-badge">${r}</span>
          <h3>แถว ${r} (${r}1–${r}${rows[r].length})</h3>
          <span class="rh-count">${rows[r].filter((l) => l.state && l.state.vendor_name).length}/${rows[r].length} มีผู้เช่า</span>
        </div>
        <div class="lots-grid">${rows[r].map(lotHTML).join('')}</div>
      </section>`).join('')}`;
  wireManagerExports();
}

function renderMarketError() {
  $('#m-floor').innerHTML = `
    <div class="err-banner">
      <b>โหลดข้อมูลตลาดไม่สำเร็จ</b>
      ${esc(state.manager.error || '')}<br><br>
      <button class="btn ghost sm" id="m-retry" type="button">ลองใหม่อีกครั้ง</button>
    </div>`;
}

/* ── เลือกวันที่: ปฏิทิน → ยืนยัน → โหลดข้อมูลวันนั้น ── */
async function chooseDate() {
  for (;;) {
    const picked = await openCalendar(state.manager.date);
    if (!picked) return;
    const yes = await confirmDialog({
      title: 'ยืนยันการเปลี่ยนวันที่ใช่หรือไม่?',
      message: `เปลี่ยนวันที่ที่ใช้งานเป็น <b>${esc(fmtDateLong(picked))}</b> ใช่หรือไม่?`,
      confirmText: 'ใช่',
    });
    if (!yes) continue;
    if (picked !== state.manager.date) {
      state.manager.date = picked;
      toast(`เปลี่ยนวันที่เป็น ${fmtDateMedium(picked)} แล้ว`, 'info');
      loadMarket();
    }
    return;
  }
}

/* ── sheet แก้ไขข้อมูลล็อค ── */
function openLotSheet(code) {
  const m = state.manager;
  const lot = m.data && m.data.lots.find((l) => l.code === code);
  if (!lot) return;
  const s = lot.state || {};
  const t = {
    vendor_name: s.vendor_name || '',
    category: s.category || 'general',
    attendance: s.attendance || 'present',
    payment_status: s.payment_status || 'unpaid',
    payment_method: s.payment_method || 'cash',
    rent_amount: s.rent_amount != null ? s.rent_amount : lot.default_rent,
  };
  const existed = !!(lot.state && lot.state.vendor_name);

  const md = openModal({
    title: `ล็อค ${code}${lot.label ? ' · ' + lot.label : ''}`,
    sub: `แถว ${code[0]} · ตลาด ${marketById(m.marketId) ? marketById(m.marketId).name : ''} · วันที่ ${fmtDateMedium(m.date)}`,
    icon: IC.store,
    className: 'lot-sheet',
    body: `
      <div class="state-preview vacant" id="lp-preview"></div>
      <div class="field">
        <label for="lp-label">ชื่อล็อค (ป้ายกำหนดเอง)</label>
        <input class="tin" id="lp-label" maxlength="60" autocomplete="off" placeholder="เช่น ป้ายแดง / มุมปลาเผา" value="${esc(lot.label || '')}">
        <p class="hint">แสดงเป็นป้ายเล็กบนการ์ดล็อค — เว้นว่างได้</p>
      </div>
      <div class="field">
        <label for="lp-name">ชื่อร้านค้า/ผู้เช่า</label>
        <input class="tin" id="lp-name" maxlength="120" autocomplete="off" placeholder="เช่น ข้าวมันไก่ป้าแดง" value="${esc(t.vendor_name)}">
        <p class="hint">ถ้าเว้นว่าง = ล็อคนี้ไม่มีผู้เช่า</p>
      </div>
      <div class="field">
        <label for="lp-cat">ประเภทสินค้า</label>
        <select class="tsel" id="lp-cat">
          ${Object.entries(CAT_TH).map(([v, th]) => `<option value="${v}" ${t.category === v ? 'selected' : ''}>${th}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>เช็คอินการมาขาย</label>
        <div class="seg field-seg" id="lp-att">
          <button type="button" data-v="present">✓ มา</button>
          <button type="button" data-v="absent">✕ ไม่มา</button>
        </div>
      </div>
      <div class="field">
        <label>สถานะชำระเงิน</label>
        <div class="switch-row">
          <div class="sw-tx"><b id="lp-pay-label"></b><small id="lp-pay-sub"></small></div>
          <label class="sw"><input type="checkbox" id="lp-paid"><span class="knob"></span></label>
        </div>
      </div>
      <div class="field">
        <label>วิธีชำระเงิน</label>
        <div class="seg field-seg" id="lp-method">
          <button type="button" data-v="cash">💵 เงินสด</button>
          <button type="button" data-v="promptpay">📱 สแกน PromptPay</button>
        </div>
      </div>
      <div class="field">
        <label for="lp-rent">ค่าเช่าของวันนี้ (บาท)</label>
        <div class="input-prefix"><span class="pre">฿</span>
          <input class="tin" id="lp-rent" type="number" inputmode="decimal" min="0" step="1" value="${t.rent_amount}">
        </div>
        <p class="hint">ค่าเช่ามาตรฐานของล็อคนี้ ${baht(lot.default_rent)} — แก้ได้ตามจริง</p>
      </div>
      <div class="btn-row">
        <button class="btn danger" id="lp-clear" type="button" ${existed ? '' : 'disabled'}>เคลียร์ข้อมูลล็อค</button>
        <button class="btn primary" id="lp-save" type="button">บันทึก</button>
      </div>`,
  });

  const nameEl = md.body.querySelector('#lp-name');
  const catEl = md.body.querySelector('#lp-cat');
  const attEl = md.body.querySelector('#lp-att');
  const paidEl = md.body.querySelector('#lp-paid');
  const methodEl = md.body.querySelector('#lp-method');
  const rentEl = md.body.querySelector('#lp-rent');

  function refreshUI() {
    $$('#lp-att button', md.body).forEach((b) => b.classList.toggle('on', b.dataset.v === t.attendance));
    $$('#lp-method button', md.body).forEach((b) => b.classList.toggle('on', b.dataset.v === t.payment_method));
    paidEl.checked = t.payment_status === 'paid';
    const occupied = !!nameEl.value.trim();
    const pv = $('#lp-preview', md.body);
    const payLabel = $('#lp-pay-label', md.body);
    const paySub = $('#lp-pay-sub', md.body);
    if (!occupied) {
      pv.className = 'state-preview vacant';
      pv.innerHTML = `🟠 สถานะ: <b>ว่าง — ยังไม่มีผู้เช่า</b>`;
      payLabel.textContent = 'ยังไม่มีการชำระเงิน';
      paySub.textContent = 'เนื่องจากยังไม่มีผู้เช่าในล็อคนี้';
    } else if (t.payment_status === 'paid') {
      pv.className = 'state-preview paid';
      pv.innerHTML = `🟢 สถานะ: <b>ชำระแล้ว</b> ผ่าน${METHOD_TH[t.payment_method]} ${baht(t.rent_amount)}`;
      payLabel.textContent = 'ชำระเงินแล้ว';
      paySub.textContent = `บันทึกรายได้ ${baht(t.rent_amount)} เข้าระบบทันที`;
    } else {
      pv.className = 'state-preview unpaid';
      pv.innerHTML = `🔴 สถานะ: <b>ค้างชำระ</b> ${baht(t.rent_amount)} (${METHOD_TH[t.payment_method]})`;
      payLabel.textContent = 'ค้างชำระ';
      paySub.textContent = 'ยังไม่บันทึกรายได้จนกว่าจะสลับเป็นชำระแล้ว';
    }
  }

  nameEl.addEventListener('input', refreshUI);
  catEl.addEventListener('change', () => { t.category = catEl.value; });
  attEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    t.attendance = b.dataset.v;
    refreshUI();
  });
  paidEl.addEventListener('change', () => { t.payment_status = paidEl.checked ? 'paid' : 'unpaid'; refreshUI(); });
  methodEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    t.payment_method = b.dataset.v;
    refreshUI();
  });
  rentEl.addEventListener('input', () => { t.rent_amount = Number(rentEl.value) || 0; refreshUI(); });
  refreshUI();

  md.body.querySelector('#lp-save').addEventListener('click', async () => {
    const btn = md.body.querySelector('#lp-save');
    btn.disabled = true;
    try {
      await api(`/api/market/lots/${code}?market_id=${m.marketId}`, {
        method: 'PUT',
        body: {
          date: m.date,
          label: md.body.querySelector('#lp-label').value,
          vendor_name: nameEl.value,
          category: catEl.value,
          attendance: t.attendance,
          payment_status: paidEl.checked ? 'paid' : 'unpaid',
          payment_method: t.payment_method,
          rent_amount: Number(rentEl.value) || 0,
        },
      });
      md.close();
      toast(`บันทึกข้อมูลล็อค ${code} เรียบร้อย`, 'ok');
      loadMarket();
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });

  md.body.querySelector('#lp-clear').addEventListener('click', async () => {
    const yes = await confirmDialog({
      title: 'ยืนยันการเคลียร์ข้อมูลล็อค?',
      message: `ข้อมูลของ <b>ล็อค ${code}</b> ในวันที่ ${fmtDateMedium(m.date)} (รวมประวัติการชำระเงินของวันนี้) จะถูกลบทั้งหมด`,
      confirmText: 'ลบข้อมูล',
      danger: true,
    });
    if (!yes) return;
    try {
      await api(`/api/market/lots/${code}?market_id=${m.marketId}&date=${m.date}`, { method: 'DELETE' });
      md.close();
      toast(`เคลียร์ข้อมูลล็อค ${code} แล้ว`, 'info');
      loadMarket();
    } catch (e) {
      toast(e.message, 'err');
    }
  });
}

/* ── ผจก.: ส่งออกค่าเช่า CSV + พิมพ์รายงานตลาด ── */
async function fetchManagerPayments() {
  const m = state.manager;
  if (!m.data) return null;
  const { range } = m.data;
  const data = await api(`/api/market/payments?from=${range.from}&to=${range.to}&market_id=${m.marketId || 1}`);
  if (!data.payments.length) { toast('ยังไม่มีรายการชำระเงินในช่วงนี้', 'err'); return null; }
  return {
    range,
    count: data.count,
    total: data.total,
    headers: ['วันที่', 'ร้าน/ผู้เช่า', 'ล็อค', 'จำนวนเงิน (บาท)', 'ช่องทาง'],
    rows: data.payments.map((p) => [fmtDateMedium(p.day), p.vendor_name || 'ไม่ระบุชื่อ', p.lot_code, p.amount, METHOD_TH[p.method] || p.method]),
  };
}
async function exportManagerPaymentsCSV() {
  try {
    toast(TS.translate('กำลังเตรียม…'));
    const d = await fetchManagerPayments();
    if (!d) return;
    const res = downloadCSV(`talatsuite-khachu-${d.range.from}_${d.range.to}.csv`, d.headers, d.rows);
    toastSavedFile(res, `ส่งออก ${d.count} รายการ (${baht(d.total)}) เป็น CSV แล้ว`);
  } catch (e) { toast(e.message, 'err'); }
}
async function copyManagerPayments() {
  try {
    const d = await fetchManagerPayments();
    if (!d) return;
    await exportCopyRows(d.headers, d.rows, d.count);
  } catch (e) { toast(e.message, 'err'); }
}
async function printMarketReport() {
  const m = state.manager;
  const d = m.data;
  if (!d) return;
  const mk = marketById(m.marketId) || {};
  const met = d.metrics;
  const rows = {};
  d.lots.forEach((l) => { (rows[l.row] = rows[l.row] || []).push(l); });
  const rowKeys = Object.keys(rows).sort();
  const today = d.lots.filter((l) => l.state && l.state.vendor_name);
  printReport(
    `รายงานตลาด ${mk.name || ''}`,
    `ช่วง: ${rangeLabel(d)} · ล็อค ${met.total_lots} ช่อง (มีผู้เช่า ${met.occupied}) · รายได้ ${baht(met.revenue)} · ค้างชำระ ${met.unpaid} ล็อค`,
    `<table><thead><tr><th>ล็อค</th><th>ร้าน/ผู้เช่า</th><th>หมวด</th><th>ค่าเช่า (บาท)</th><th>สถานะชำระ</th></tr></thead><tbody>
      ${today.map((l) => {
        const s = l.state || {};
        return `<tr>
          <td class="nowrap">${esc(l.code)}${l.label ? ' (' + esc(l.label) + ')' : ''}</td>
          <td>${esc(s.vendor_name || 'ว่าง')}</td>
          <td>${esc(CAT_TH[s.category] || '—')}</td>
          <td class="num">${s.rent != null ? Number(s.rent).toLocaleString('th-TH') : '—'}</td>
          <td>${s.payment_status === 'paid' ? '<span class="badge">ชำระแล้ว</span>' : (s.vendor_name ? 'ค้างชำระ' : '—')}</td>
        </tr>`;
      }).join('')}
    </tbody></table>
    <p class="totals">รวมล็อคที่มีผู้เช่า <b>${met.occupied}</b> ช่อง จาก <b>${met.total_lots}</b> ช่อง · แถวทั้งหมด ${rowKeys.length} แถว (${rowKeys.join(', ')})</p>`);
}

function wireManagerExports() {
  const ex = $('#mk-export');
  if (ex) ex.addEventListener('click', () => {
    openExportModal(exportOptions([
      ['csv', exportManagerPaymentsCSV],
      ['pdf', printMarketReport],
      ['copy', copyManagerPayments],
    ]));
  });
}

/* ── sheet ประวัติการชำระเงิน ── */
async function openPaymentsSheet() {
  const m = state.manager;
  if (!m.data) return;
  const lbl = rangeLabel(m.data);
  const md = openModal({
    title: 'ประวัติการชำระเงิน',
    sub: `ช่วง: ${lbl}`,
    icon: IC.receipt,
    className: 'pay-sheet',
    body: `<div class="skel" style="height:64px"></div><div class="skel" style="height:64px;margin-top:10px"></div>`,
  });
  try {
    const { range } = m.data;
    const data = await api(`/api/market/payments?from=${range.from}&to=${range.to}&market_id=${m.marketId || 1}`);
    if (!document.body.contains(md.el)) return;
    if (!data.payments.length) {
      md.body.innerHTML = `<div class="empty"><div class="e-emo">🧾</div><b>ยังไม่มีรายการชำระเงินในช่วงนี้</b><p>ลองเปลี่ยนช่วงเวลา หรือบันทึกการชำระจากล็อคที่มีผู้เช่า</p></div>`;
      return;
    }
    md.body.innerHTML = `
      <div class="cart-total" style="padding-top:2px">
        <span>รวมทั้งหมด ${data.count} รายการ</span><b style="color:var(--ok-deep)">${baht(data.total)}</b>
      </div>
      ${data.payments.map((p) => `
        <div class="pay-row">
          <span class="pr-ic">${p.method === 'promptpay' ? '📱' : '💵'}</span>
          <div class="pr-tx">
            <b>${esc(p.vendor_name) || 'ไม่ระบุชื่อ'} · ล็อค ${p.lot_code}</b>
            <small>${fmtDateMedium(p.day)} · ${METHOD_TH[p.method]}</small>
          </div>
          <span class="pr-amt">${baht(p.amount)}</span>
        </div>`).join('')}`;
  } catch (e) {
    md.body.innerHTML = `<div class="err-banner"><b>โหลดประวัติไม่สำเร็จ</b>${esc(e.message)}</div>`;
  }
}

/* ── แท็บร้านค้าในตลาด ── */
async function renderManagerShops() {
  const m = state.manager;
  viewEl.dataset.app = 'manager';
  viewEl.innerHTML = `
    <header class="pagehead">
      <div class="ph-top">
        <div class="ph-title"><h2>ร้านค้าในตลาด</h2><p>ทะเบียนร้าน ช่องทางติดต่อ และการเปิดรับออเดอร์</p></div>
        ${marketChipHTML()}
        ${roleBtnHTML()}
      </div>
    </header>
    <div class="menu-mgmt-head">
      <button class="btn gold" id="msh-add" type="button">＋ เพิ่มร้านค้าใหม่</button>
    </div>
    <div id="msh-list"><div class="skel" style="height:88px;margin-bottom:10px"></div><div class="skel" style="height:88px"></div></div>`;
  try {
    const data = await api(`/api/shops?market_id=${m.marketId || 1}`);
    m.shops = data.shops;
    const box = $('#msh-list');
    if (!box) return;
    if (!m.shops.length) {
      box.innerHTML = `<div class="empty"><div class="e-emo">🍽️</div><b>ยังไม่มีร้านค้าในตลาดนี้</b><p>กด "เพิ่มร้านค้าใหม่" เพื่อเปิดรับร้านเข้าตลาด</p></div>`;
      return;
    }
    box.innerHTML = m.shops.map((s) => `
      <div class="msh-row" data-id="${s.id}">
        <span class="mm-emo">${esc(s.emoji)}</span>
        <div class="msh-info">
          <b>${esc(s.name)} <span class="lot-tag">${esc(s.lot_code || 'ไม่ระบุล็อค')}</span></b>
          <small>${esc(CAT_TH[s.category] || s.category)} · เมนู ${s.menu_count} รายการ</small>
          <div class="msh-contacts">
            ${s.phone ? `<span title="โทร">📞 ${esc(s.phone)}</span>` : ''}
            ${s.line_id ? `<span title="LINE">💬 ${esc(s.line_id)}</span>` : ''}
            ${s.whatsapp ? `<span title="WhatsApp">🟢 ${esc(s.whatsapp)}</span>` : ''}
            ${s.facebook ? `<span title="Facebook">📘 ${esc(s.facebook)}</span>` : ''}
            ${s.email ? `<span title="อีเมล">✉️ ${esc(s.email)}</span>` : ''}
          </div>
        </div>
        <span class="open-badge ${s.is_open ? 'on' : 'off'}">${s.is_open ? 'เปิดร้าน' : 'ปิดอยู่'}</span>
        <div class="msh-acts">
          <button class="icbtn" data-msh="edit" title="แก้ไขข้อมูลร้าน" aria-label="แก้ไข">✎</button>
          <button class="icbtn msh-del" data-msh="del" title="ลบร้าน" aria-label="ลบร้าน">${IC.trash}</button>
        </div>
      </div>`).join('');
  } catch (e) {
    const box = $('#msh-list');
    if (box) box.innerHTML = `<div class="err-banner"><b>โหลดรายชื่อร้านไม่สำเร็จ</b>${esc(e.message)}</div>`;
  }
}

/* sheet เพิ่ม/แก้ไขร้าน (ผู้จัดการ) */
function openShopFormSheet(existing) {
  const m = state.manager;
  const s = existing || { name: '', category: 'food', lot_code: '', description: '', phone: '', email: '', line_id: '', whatsapp: '', facebook: '', emoji: '🍽️', is_open: true };
  const md = openModal({
    title: existing ? `แก้ไขร้าน “${existing.name}”` : 'เพิ่มร้านค้าใหม่',
    sub: 'ข้อมูลนี้ลูกค้าจะเห็นในแอปลูกค้า (ติดต่อ + เมนู)',
    icon: IC.store,
    className: 'shop-form-sheet',
    body: `
      <div class="field"><label for="sf-name">ชื่อร้าน</label>
        <input class="tin" id="sf-name" maxlength="120" placeholder="เช่น ก๋วยเตี๋ยวเรือเจ๊แป๊วะ" value="${esc(s.name)}"></div>
      <div class="field"><label for="sf-emoji">อิโมจิประจำร้าน</label>
        <input class="tin" id="sf-emoji" maxlength="8" value="${esc(s.emoji)}"></div>
      <div class="field"><label for="sf-cat">ประเภทร้าน</label>
        <select class="tsel" id="sf-cat">
          ${Object.entries(CAT_TH).map(([v, th]) => `<option value="${v}" ${s.category === v ? 'selected' : ''}>${th}</option>`).join('')}
        </select></div>
      <div class="field"><label for="sf-lot">ล็อคที่ตั้งแผง (ถ้ามี)</label>
        <input class="tin" id="sf-lot" maxlength="10" placeholder="เช่น A7" value="${esc(s.lot_code)}">
        <p class="hint">ล็อคที่มีผู้เช่าจะแสดงชื่อร้านในผังตลาดได้</p></div>
      <div class="field"><label for="sf-desc">คำอธิบายร้าน</label>
        <textarea class="tarea" id="sf-desc" maxlength="500" placeholder="เช่น ข้าวมันไก่สูตรโบราณ นึ่งไก่ทุก 2 ชม.">${esc(s.description)}</textarea></div>
      <div class="field"><label>ช่องทางติดต่อ (ลูกค้ากดติดต่อได้จากแอป)</label>
        <input class="tin" id="sf-phone" maxlength="32" placeholder="📞 เบอร์โทร เช่น 081-234-5678" value="${esc(s.phone)}" style="margin-bottom:8px">
        <input class="tin" id="sf-line" maxlength="60" placeholder="💬 LINE ID เช่น @kaimunkai" value="${esc(s.line_id)}" style="margin-bottom:8px">
        <input class="tin" id="sf-wa" maxlength="32" placeholder="🟢 WhatsApp (ขึ้นต้น 66…) เช่น 66812345678" value="${esc(s.whatsapp)}" style="margin-bottom:8px">
        <input class="tin" id="sf-fb" maxlength="120" placeholder="📘 Facebook (ชื่อเพจ หรือ URL)" value="${esc(s.facebook)}" style="margin-bottom:8px">
        <input class="tin" id="sf-email" maxlength="120" placeholder="✉️ อีเมล" value="${esc(s.email)}"></div>
      <div class="field">
        <div class="switch-row">
          <div class="sw-tx"><b>เปิดร้านรับออเดอร์</b><small>ปิดชั่วคราวได้เมื่อร้านไม่พร้อม</small></div>
          <label class="sw"><input type="checkbox" id="sf-open" ${s.is_open ? 'checked' : ''}><span class="knob"></span></label>
        </div>
      </div>
      <button class="btn primary block" id="sf-save" type="button">${existing ? 'บันทึกการแก้ไข' : 'เพิ่มร้านค้า'}</button>`,
  });

  md.body.querySelector('#sf-save').addEventListener('click', async () => {
    const btn = md.body.querySelector('#sf-save');
    const body = {
      name: md.body.querySelector('#sf-name').value,
      emoji: md.body.querySelector('#sf-emoji').value,
      category: md.body.querySelector('#sf-cat').value,
      lot_code: md.body.querySelector('#sf-lot').value.trim().toUpperCase(),
      description: md.body.querySelector('#sf-desc').value,
      phone: md.body.querySelector('#sf-phone').value,
      line_id: md.body.querySelector('#sf-line').value,
      whatsapp: md.body.querySelector('#sf-wa').value,
      facebook: md.body.querySelector('#sf-fb').value,
      email: md.body.querySelector('#sf-email').value,
      is_open: md.body.querySelector('#sf-open').checked,
    };
    if (!body.name.trim()) { toast('กรุณากรอกชื่อร้าน', 'err'); return; }
    btn.disabled = true;
    try {
      if (existing) {
        await api(`/api/shops/${existing.id}`, { method: 'PUT', body });
        toast(`บันทึกข้อมูลร้าน “${body.name}” แล้ว`, 'ok');
      } else {
        await api('/api/shops', { method: 'POST', body: { ...body, market_id: m.marketId } });
        toast(`เพิ่มร้าน “${body.name}” เข้าตลาดแล้ว`, 'ok');
      }
      md.close();
      renderManagerShops();
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });
}

/* ── แท็บตั้งค่าตลาด: ข้อมูล + ผังแถวล็อค ── */
async function renderManagerSettings() {
  const m = state.manager;
  const mk = marketById(m.marketId) || {};
  viewEl.dataset.app = 'manager';
  viewEl.innerHTML = `
    <header class="pagehead">
      <div class="ph-top">
        <div class="ph-title"><h2>ตั้งค่าตลาด</h2><p>ข้อมูลตลาด เวลาเปิด และผังแถวล็อค</p></div>
        ${marketChipHTML()}
        ${roleBtnHTML()}
      </div>
    </header>

    <section class="set-card">
      <h3>📋 ข้อมูลตลาด</h3>
      <div class="field"><label for="st-name">ชื่อตลาด</label>
        <input class="tin" id="st-name" maxlength="120" value="${esc(mk.name || '')}"></div>
      <div class="field"><label for="st-area">ที่ตั้ง</label>
        <input class="tin" id="st-area" maxlength="160" value="${esc(mk.area || '')}" placeholder="เช่น กรุงเทพฯ · เขตบางบอน"></div>
      <div class="field"><label for="st-hours">เวลาเปิดทำการ</label>
        <input class="tin" id="st-hours" maxlength="120" value="${esc(mk.hours_text || '')}" placeholder="เช่น เปิดทุกวัน 16:00 – 23:00"></div>
      <div class="field"><label for="st-desc">คำอธิบาย</label>
        <textarea class="tarea" id="st-desc" maxlength="500">${esc(mk.description || '')}</textarea></div>
      <div class="field"><label for="st-emoji">อิโมจิประจำตลาด</label>
        <input class="tin" id="st-emoji" maxlength="8" value="${esc(mk.emoji || '🏪')}"></div>
      <div class="field"><label for="st-type">ประเภทตลาด (ลูกค้าใช้กรอง ☀️/🌙)</label>
        <select class="tin" id="st-type">
          <option value="night" ${mk.market_type !== 'day' ? 'selected' : ''}>🌙 ตลาดกลางคืน (ตลาดนัด)</option>
          <option value="day" ${mk.market_type === 'day' ? 'selected' : ''}>☀️ ตลาดกลางวัน (ตลาดสด · ตลาดเช้า)</option>
        </select></div>
      <button class="btn primary block" id="st-save" type="button">บันทึกข้อมูลตลาด</button>
    </section>

    <section class="set-card">
      <h3>📍 ที่อยู่และแผนที่</h3>
      <p class="set-sub">ลูกค้าเห็นที่อยู่ + แผนที่และปุ่มนำทางในหน้าตลาด — กรอกพิกัดเพื่อแสดงแผนที่ (ไม่กรอกก็ใช้ได้)</p>
      <div class="field"><label for="st-address">ที่อยู่ตลาด</label>
        <input class="tin" id="st-address" maxlength="240" value="${esc(mk.address || '')}" placeholder="เช่น 123 ถ.เพชรเกษม แขวงบางไผ่ เขตบางแค กรุงเทพฯ 10160"></div>
      <div class="field-row2">
        <div class="field"><label for="st-lat">ละติจูด (lat)</label>
          <input class="tin" id="st-lat" inputmode="decimal" maxlength="12" value="${mk.lat != null ? esc(String(mk.lat)) : ''}" placeholder="เช่น 13.7052"></div>
        <div class="field"><label for="st-lng">ลองจิจูด (lng)</label>
          <input class="tin" id="st-lng" inputmode="decimal" maxlength="12" value="${mk.lng != null ? esc(String(mk.lng)) : ''}" placeholder="เช่น 100.4118"></div>
      </div>
      <div class="btn-row">
        <button class="btn ghost" id="st-gps" type="button">📡 ใช้พิกัดปัจจุบัน</button>
        <a class="btn ghost" id="st-map-link" target="_blank" rel="noopener" href="https://www.google.com/maps">🔎 ดูบนแผนที่</a>
      </div>
      <div id="st-map-prev"></div>
      <div class="field"><label for="st-ann">📢 ประกาศถึงลูกค้า</label>
        <input class="tin" id="st-ann" maxlength="160" value="${esc(mk.announcement || '')}" placeholder="เช่น สัปดาห์นี้มีรถไฟตลาดนัดสุดสัปดาห์นี้!"></div>
      <button class="btn primary block" id="st-geo-save" type="button">บันทึกที่อยู่และแผนที่</button>
    </section>

    <section class="set-card">
      <h3>🗓️ ตารางเปิดทำการ</h3>
      <p class="set-sub">ตลาดนี้เปิดวันไหน เวลาอะไร — ลูกค้าเห็นในแอปทันที และระบบเปลี่ยนป้าย เปิด/ปิดวันนี้ ให้เองตามวัน</p>
      ${scheduleEditorHTML('st-sch', mk)}
      <button class="btn gold block" id="st-sch-save" type="button">บันทึกตารางเปิดทำการ</button>
    </section>

    <section class="set-card">
      <h3>🧱 ผังแถวล็อคของตลาด</h3>
      <p class="set-sub">กำหนดจำนวนแถว จำนวนล็อคต่อแถว และค่าเช่ามาตรฐาน — แถวหนึ่งใช้ตัวอักษรกำกับ (A, B, C…)</p>
      <div id="lay-rows"></div>
      <div class="btn-row" style="margin-top:6px">
        <button class="btn ghost" id="lay-add" type="button">＋ เพิ่มแถว</button>
        <button class="btn gold" id="lay-save" type="button">บันทึกผังตลาด</button>
      </div>
    </section>`;

  /* ตารางเปิดทำการ — wiring ชิปวัน + พรีวิวสด */
  wireScheduleEditor(viewEl, 'st-sch');

  /* โหลด layout ปัจจุบัน */
  try {
    const data = await api(`/api/market/layout?market_id=${m.marketId || 1}`);
    m.layout = data.rows.map((r) => ({ ...r }));
  } catch (e) {
    m.layout = [];
  }
  renderLayoutRows();

  const applyMarketUpdate = (patch) => {
    const idx = m.markets.findIndex((x) => x.id === m.marketId);
    if (idx >= 0) m.markets[idx] = { ...m.markets[idx], ...patch };
    renderNav();
  };

  $('#st-save').addEventListener('click', async () => {
    const btn = $('#st-save');
    btn.disabled = true;
    try {
      await api(`/api/markets/${m.marketId}`, {
        method: 'PUT',
        body: {
          name: $('#st-name').value,
          area: $('#st-area').value,
          hours_text: $('#st-hours').value,
          description: $('#st-desc').value,
          emoji: $('#st-emoji').value,
          market_type: $('#st-type').value,
        },
      });
      toast('บันทึกข้อมูลตลาดแล้ว', 'ok');
      applyMarketUpdate({
        name: $('#st-name').value, area: $('#st-area').value,
        hours_text: $('#st-hours').value, emoji: $('#st-emoji').value,
        market_type: $('#st-type').value,
      });
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });

  /* พรีวิวแผนที่ + ลิงก์ดูบนแผนที่ (อัปเดตสดขณะพิมพ์) */
  const geoPreview = () => {
    const lat = parseFloat($('#st-lat').value);
    const lng = parseFloat($('#st-lng').value);
    const okGeo = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    const addr = $('#st-address').value.trim();
    const q = okGeo ? `${lat},${lng}` : addr;
    $('#st-map-link').href = q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : 'https://www.google.com/maps';
    const prev = $('#st-map-prev');
    if (okGeo) {
      prev.innerHTML = OFFLINE_BUILD ? `
      <a class="map-frame sm map-frame-link" data-maplink href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" rel="noopener">
        <div class="map-fallback"><span>🗺️ ${lat.toFixed(5) + ', ' + lng.toFixed(5)}</span><small class="mf-tap">แตะเพื่อเปิดใน Google Maps</small></div>
      </a>` : `
      <div class="map-frame sm">
        <div class="map-fallback"><span>🗺️ ${okGeo ? lat.toFixed(5) + ', ' + lng.toFixed(5) : ''}</span></div>
        <iframe src="https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed" title="พรีวิวแผนที่" loading="lazy"></iframe>
      </div>`;
    } else {
      prev.innerHTML = `<p class="hint" style="padding:4px 2px">ยังไม่ได้ใส่พิกัด — ${addr ? 'ลูกค้าจะเห็นที่อยู่พร้อมปุ่มเปิดใน Google Maps' : 'กรอกที่อยู่หรือพิกัดเพื่อให้ลูกค้าหาตลาดเจอง่าย ๆ'}</p>`;
    }
  };
  $('#st-lat').addEventListener('input', geoPreview);
  $('#st-lng').addEventListener('input', geoPreview);
  geoPreview();

  /* ปุ่มใช้พิกัดปัจจุบัน (GPS ของเครื่อง) */
  $('#st-gps').addEventListener('click', () => {
    if (!navigator.geolocation) return toast('เครื่องนี้ไม่รองรับการระบุตำแหน่ง', 'err');
    toast('กำลังขอตำแหน่งปัจจุบัน…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        $('#st-lat').value = pos.coords.latitude.toFixed(6);
        $('#st-lng').value = pos.coords.longitude.toFixed(6);
        geoPreview();
        toast('ได้พิกัดปัจจุบันแล้ว — ตรวจสอบแล้วกดบันทึก', 'ok');
      },
      () => toast('ไม่สามารถระบุตำแหน่งได้ (ไม่อนุญาตหรือสัญญาณอ่อน) — ใส่พิกัดเองก็ได้', 'err'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  $('#st-geo-save').addEventListener('click', async () => {
    const btn = $('#st-geo-save');
    const latRaw = $('#st-lat').value.trim();
    const lngRaw = $('#st-lng').value.trim();
    let lat = null, lng = null;
    if (latRaw || lngRaw) {
      lat = latRaw === '' ? null : Number(latRaw);
      lng = lngRaw === '' ? null : Number(lngRaw);
      if (lat === null || lng === null) return toast('กรอกละติจูดและลองจิจูดให้ครบคู่กัน (หรือเว้นว่างทั้งสองช่อง)', 'err');
      if (!Number.isFinite(lat) || Math.abs(lat) > 90) return toast('ละติจูดต้องเป็นตัวเลข -90 ถึง 90 เช่น 13.7052', 'err');
      if (!Number.isFinite(lng) || Math.abs(lng) > 180) return toast('ลองจิจูดต้องเป็นตัวเลข -180 ถึง 180 เช่น 100.4118', 'err');
    }
    btn.disabled = true;
    try {
      await api(`/api/markets/${m.marketId}`, {
        method: 'PUT',
        body: { address: $('#st-address').value.trim(), lat, lng, announcement: $('#st-ann').value.trim() },
      });
      toast('บันทึกที่อยู่และแผนที่แล้ว — ลูกค้าเห็นทันที', 'ok');
      applyMarketUpdate({ address: $('#st-address').value.trim(), lat, lng, announcement: $('#st-ann').value.trim() });
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });

  $('#st-sch-save').addEventListener('click', async () => {
    const btn = $('#st-sch-save');
    const sched = readScheduleEditor(viewEl, 'st-sch');
    const tm = /^([01]?\d|2[0-3]):[0-5]\d$/;
    if (sched.open_time && !tm.test(sched.open_time)) return toast('รูปแบบเวลาเปิดต้องเป็น HH:MM เช่น 16:00', 'err');
    if (sched.close_time && !(tm.test(sched.close_time) || sched.close_time === '24:00')) return toast('รูปแบบเวลาปิดต้องเป็น HH:MM เช่น 23:00', 'err');
    if ((sched.open_time && !sched.close_time) || (!sched.open_time && sched.close_time))
      return toast('กรอกเวลาเปิดและเวลาปิดให้ครบคู่กัน', 'err');
    btn.disabled = true;
    try {
      const r = await api(`/api/markets/${m.marketId}`, { method: 'PUT', body: sched });
      const mk2 = r.market || {};
      toast(`บันทึกตารางแล้ว — ${mk2.schedule_text || ''}`, 'ok');
      applyMarketUpdate({
        open_days: mk2.open_days || sched.open_days,
        open_time: mk2.open_time || '', close_time: mk2.close_time || '',
        force_open: mk2.force_open == null ? null : mk2.force_open,
        open_today: mk2.open_today, schedule_text: mk2.schedule_text,
      });
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });

  $('#lay-add').addEventListener('click', () => {
    const used = new Set(m.layout.map((r) => r.row_label));
    let label = 'A';
    for (let i = 0; i < 26; i++) {
      const c = String.fromCharCode(65 + i);
      if (!used.has(c)) { label = c; break; }
    }
    m.layout.push({ row_label: label, count: 10, rent: 150 });
    renderLayoutRows();
  });

  $('#lay-save').addEventListener('click', async () => {
    const yes = await confirmDialog({
      title: 'บันทึกผังตลาดใหม่?',
      message: 'ล็อคที่ถูกลบออก <b>จะลบประวัติการเช่า/ชำระของล็อคนั้นด้วย</b> — ล็อคที่ยังอยู่จะคงข้อมูลเดิมไว้',
      confirmText: 'บันทึกผัง',
      danger: true,
    });
    if (!yes) return;
    try {
      const rows = m.layout.map((r) => ({
        row_label: r.row_label, count: r.count, rent: r.rent,
      }));
      const r = await api(`/api/market/layout?market_id=${m.marketId}`, { method: 'PUT', body: { rows } });
      toast(`บันทึกผังตลาดแล้ว — รวม ${r.count} ล็อค`, 'ok');
    } catch (e) {
      toast(e.message, 'err');
    }
  });
}

function renderLayoutRows() {
  const m = state.manager;
  const box = $('#lay-rows');
  if (!box) return;
  if (!m.layout.length) {
    box.innerHTML = `<div class="empty" style="margin-bottom:12px"><div class="e-emo">🧱</div><b>ยังไม่มีแถวล็อค</b><p>กด "＋ เพิ่มแถว" เพื่อเริ่มสร้างผังตลาด</p></div>`;
    return;
  }
  box.innerHTML = m.layout.map((r, idx) => `
    <div class="lay-row" data-idx="${idx}">
      <span class="lay-badge">${esc(r.row_label)}</span>
      <div class="lay-count">
        <button type="button" data-lay="minus" aria-label="ลดจำนวนล็อค">−</button>
        <b class="num">${r.count}</b>
        <button type="button" data-lay="plus" aria-label="เพิ่มจำนวนล็อค">+</button>
        <small>ล็อค</small>
      </div>
      <div class="input-prefix" style="flex:1;min-width:110px">
        <span class="pre">฿</span>
        <input class="tin lay-rent" type="number" inputmode="decimal" min="0" step="1" value="${r.rent}" aria-label="ค่าเช่าต่อล็อคแถว ${esc(r.row_label)}">
      </div>
      <button class="icbtn lay-del" type="button" data-lay="del" title="ลบแถวนี้" aria-label="ลบแถว">${IC.trash}</button>
    </div>`).join('');
}

/* ประมวลผลปุ่มใน layout editor */
function handleLayoutClick(e) {
  const btn = e.target.closest('[data-lay]');
  if (!btn) return;
  const row = btn.closest('.lay-row');
  if (!row) return;
  const idx = Number(row.dataset.idx);
  const r = state.manager.layout[idx];
  if (!r) return;
  if (btn.dataset.lay === 'plus') r.count = Math.min(30, r.count + 1);
  else if (btn.dataset.lay === 'minus') r.count = Math.max(1, r.count - 1);
  else if (btn.dataset.lay === 'del') {
    if (state.manager.layout.length <= 1) { toast('ต้องมีอย่างน้อย 1 แถว', 'err'); return; }
    state.manager.layout.splice(idx, 1);
  }
  renderLayoutRows();
}

/* ═══════════════════════════════════════════════════════════
   บทบาทที่ 2 · 🍜 ร้านค้า/แม่ค้า (Vendor)
   ═══════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════
   v6 — ระบบสมัคร-อนุมัติ (ฝั่งหน้าเว็บ)
   ร้านค้า: เลือกตลาด → กรอกข้อมูลร้าน → เลือกล็อค → รอผจก./แอดมินอนุมัติ
   ผจก.: ยื่นข้อมูลตลาด → รอแอดมินอนุมัติ → จัดการตลาดตัวเอง
   ══════════════════════════════════════════════════════════ */
const APP_STATUS_TH = {
  pending: '📋 รอพิจารณา', approved: '✅ อนุมัติแล้ว', denied: '❌ ปฏิเสธ',
};

/* ── หน้า "เลือกตลาดที่จะเปิดร้าน" (ทางเข้าร้านค้าใหม่ + ร้านเดิมขยายตลาด) ── */
async function renderVendorApply({ fromDashboard = false } = {}) {
  viewEl.dataset.app = 'vendor-apply';
  const u = state.user;
  const isVendor = u && u.role === 'vendor';
  let shops = [];
  if (isVendor) {
    try { shops = (await api('/api/auth/me')).vendor_shops || []; } catch (e) {}
  }
  const statusCards = shops.map((sh) => `
    <div class="vstat ${sh.status}">
      <span class="vs-emo">${sh.status === 'pending' ? '⏳' : sh.status === 'denied' ? '❌' : '✅'}</span>
      <div class="vs-tx">
        <b>${esc(sh.emoji)} ${esc(sh.name)} — ${esc(sh.market_name)}${sh.lot_code ? ` (ล็อค ${esc(sh.lot_code)})` : ''}</b>
        ${sh.status === 'pending' ? '<small>คำขอเข้าร่วมตลาดนี้รอผจก.ตลาด/แอดมินพิจารณา — เราจะแจ้งในแอปทันทีที่มีผล</small>'
          : sh.status === 'denied' ? `<small><b>ถูกปฏิเสธ:</b> ${esc(sh.deny_reason || '—')} · <span>ยื่นใหม่ตลาดนี้หรือเลือกตลาดอื่นได้เลยด้านล่าง</span></small>`
          : '<small>ร้านของคุณเปิดให้ลูกค้าเห็นในตลาดนี้แล้ว</small>'}
      </div>
    </div>`).join('');

  viewEl.innerHTML = `
    <header class="pagehead">
      <div class="ph-top">
        <div class="ph-title">
          <h2>${fromDashboard ? 'ขยายร้านไปตลาดใหม่ 🚀' : 'เปิดร้านในตลาด 🍜'}</h2>
          <p>3 ขั้นตอน — เลือกตลาด · กรอกข้อมูลร้าน · เลือกล็อค แล้วรอผจก.ตลาดอนุมัติ</p>
        </div>
        ${(u && state.role) ? roleBtnHTML() : ''}
      </div>
      ${fromDashboard ? '<div style="margin-top:10px"><button class="back-btn" id="va-back" type="button">' + IC.back + ' กลับร้านของฉัน</button></div>' : ''}
    </header>
    ${statusCards ? `<div class="vstat-list">${statusCards}</div>` : ''}
    <div id="va-markets"><div class="skel" style="height:140px"></div></div>
    <div class="apply-steps">
      <div class="astep"><span>1</span><b>เลือกตลาด</b><small>กลางวัน ☀️ หรือ กลางคืน 🌙</small></div>
      <div class="astep"><span>2</span><b>กรอกข้อมูลร้าน</b><small>ชื่อ · ประเภท · ติดต่อ</small></div>
      <div class="astep"><span>3</span><b>เลือกล็อค</b><small>เห็นล็อคว่าง-ราคาเช่าจริง</small></div>
      <div class="astep"><span>4</span><b>รออนุมัติ</b><small>ผจก.ตลาดพิจารณาเร็วที่สุด</small></div>
    </div>`;
  const back = $('#va-back');
  if (back) back.addEventListener('click', () => { chooseRole('vendor'); });
  const box = $('#va-markets');
  if (!box) return;
  const loadMarkets = async () => {
    let markets = null;
    try { markets = (await api('/api/markets')).markets || []; } catch (e) { markets = null; }
    if (markets === null) {
      box.innerHTML = `<div class="empty"><div class="e-emo">📡</div><b>เชื่อมต่อระบบไม่สำเร็จ</b><p>เซิร์ฟเวอร์อาจกำลังตื่นจากโหมดพัก (แผนฟรี) — รอสักครู่แล้วกดลองใหม่ครับ</p><button class="btn sm" id="va-retry" type="button">🔄 ลองใหม่</button></div>`;
      const rb = $('#va-retry');
      if (rb) rb.addEventListener('click', () => {
        rb.disabled = true;
        box.innerHTML = '<div class="skel" style="height:140px"></div>';
        loadMarkets();
      });
      return;
    }
    if (!markets.length) {
      box.innerHTML = `<div class="empty"><div class="e-emo">🏪</div><b>ยังไม่มีตลาดที่เปิดรับร้านค้า</b><p>โปรดกลับมาใหม่อีกครั้ง — หรือถ้าคุณเป็นเจ้าของพื้นที่ ลอง "ยื่นเปิดตลาดใหม่" ที่หน้าแรกครับ</p></div>`;
      return;
    }
    box.innerHTML = `
    <div class="mk-grid va">
      ${markets.map((mk) => `
        <div class="mk-card va">
          <span class="mkc-emo">${esc(mk.emoji)}</span>
          <div class="mkc-tx">
            <b><span class="nm">${esc(mk.name)}</span> <span class="mtype ${mk.market_type}">${mk.market_type === 'day' ? '☀️ กลางวัน' : '🌙 กลางคืน'}</span></b>
            <small>${esc(mk.area || '—')}</small>
            <span class="mkc-meta">🕒 ${esc(mk.schedule_text || mk.hours_text || '—')}</span>
            <span class="mkc-meta">🏪 ${mk.shops_total} ร้านในตลาด${mk.lots_total ? ` · ${mk.lots_total} ล็อค` : ''}</span>
          </div>
          <button class="btn gold sm" data-va-apply="${mk.id}" type="button">สมัครเปิดร้าน</button>
        </div>`).join('')}
    </div>`;
    $$('[data-va-apply]').forEach((b) => b.addEventListener('click', () => {
      const mk = markets.find((x) => String(x.id) === b.dataset.vaApply);
      if (mk) openVendorApplySheet(mk);
    }));
  };
  await loadMarkets();
}

/* ── ชีตสมัครเปิดร้านในตลาด (บัญชี + ข้อมูลร้าน + เลือกล็อค) ── */
async function openVendorApplySheet(market) {
  const u = state.user;
  const isVendor = u && u.role === 'vendor';
  /* โหลดผังล็อค */
  let lots = [];
  try { lots = (await api(`/api/public/market-lots?market_id=${market.id}`)).lots || []; }
  catch (e) { toast(e.message, 'err'); return; }
  const freeLots = lots.filter((l) => !l.taken);
  const md = openModal({
    title: `สมัครเปิดร้านใน "${market.name}"`,
    sub: 'กรอกให้ครบเพื่อผจก.ตลาดพิจารณาไวขึ้น',
    icon: IC.store,
    center: true,
    className: 'apply-sheet',
    body: `
      ${isVendor ? '' : `
      <p class="as-sec">👤 บัญชีร้านค้า (สร้างใหม่อัตโนมัติ)</p>
      <div class="field"><label for="va-name">ชื่อเจ้าของร้าน</label>
        <input class="tin" id="va-oname" maxlength="120" placeholder="เช่น สมหญิง ใจดี"></div>
      <div class="field-row">
        <div class="field"><label for="va-login">ชื่อผู้ใช้ (a-z, 0-9)</label>
          <input class="tin" id="va-login" maxlength="60" placeholder="เช่น somying"></div>
        <div class="field"><label for="va-pass">รหัสผ่าน (4 ตัวขึ้นไป)</label>
          <input class="tin" id="va-pass" type="password" maxlength="100" placeholder="••••••••"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="va-phone">เบอร์โทร</label>
          <input class="tin" id="va-phone" maxlength="32" inputmode="tel" placeholder="08x-xxx-xxxx"></div>
        <div class="field"><label for="va-email">อีเมล (ไม่บังคับ)</label>
          <input class="tin" id="va-email" maxlength="120" placeholder="you@email.com"></div>
      </div>`}
      <p class="as-sec">🏪 ข้อมูลร้าน</p>
      <div class="field-row">
        <div class="field"><label for="va-sname">ชื่อร้าน</label>
          <input class="tin" id="va-sname" maxlength="120" placeholder="เช่น ก๋วยเตี๋ยวเรือส้มตำป้านิด"></div>
        <div class="field"><label for="va-cat">ประเภทร้าน</label>
          <select class="tin" id="va-cat">
            <option value="food">🍳 อาหาร &amp; เครื่องดื่ม</option>
            <option value="clothes">👕 เสื้อผ้า &amp; แฟชั่น</option>
            <option value="fresh">🥬 ของสด &amp; ผักผลไม้</option>
            <option value="general">🧺 ของใช้ &amp; อื่น ๆ</option>
          </select></div>
      </div>
      <div class="field"><label for="va-desc">แนะนำร้านสั้น ๆ (ผจก.จะเห็นตอนพิจารณา)</label>
        <input class="tin" id="va-desc" maxlength="500" placeholder="เช่น ขายก๋วยเตี๋ยวเรือสูตรเด็ด เปิดมา 10 ปี"></div>
      <div class="field"><label for="va-line">LINE ID (ไม่บังคับ)</label>
        <input class="tin" id="va-line" maxlength="60" placeholder="@yourshop"></div>
      <p class="as-sec">📍 เลือกล็อคที่ต้องการ</p>
      ${freeLots.length ? `
      <div class="lp-grid" id="va-lots">
        ${lots.map((l) => `
          <button type="button" class="lp-cell ${l.taken ? 'taken' : 'free'}" data-lot="${esc(l.code)}" ${l.taken ? 'disabled' : ''}
                  title="${l.taken ? 'ถูกจองโดย ' + esc(l.taken_by) : 'ว่าง — ค่าเช่า ' + l.rent + ' ฿/วัน'}">
            <b>${esc(l.code)}</b><small>${l.taken ? '🔒 ' + esc((l.taken_by || '').slice(0, 10)) : '฿' + l.rent + '/วัน'}</small>
          </button>`).join('')}
      </div>
      <p class="hint">เลือกล็อคว่างที่ต้องการ — หรือไม่เลือกก็ได้ ผจก.จะจัดล็อคให้ตอนอนุมัติ</p>` : `
      <p class="hint">ตลาดนี้ยังไม่มีผังล็อค — ยื่นไว้ก่อนได้เลย ผจก.ตลาดจะจัดล็อคให้ตอนอนุมัติครับ</p>`}
      <button class="btn gold block" id="va-go" type="button">📨 ส่งใบสมัคร</button>`,
  });

  let pickedLot = '';
  md.body.querySelector('#va-lots')?.addEventListener('click', (e) => {
    const c = e.target.closest('.lp-cell.free');
    if (!c) return;
    pickedLot = pickedLot === c.dataset.lot ? '' : c.dataset.lot;
    $$('.lp-cell', md.body).forEach((x) => x.classList.toggle('sel', x.dataset.lot === pickedLot));
  });

  md.body.querySelector('#va-go').addEventListener('click', async () => {
    const btn = md.body.querySelector('#va-go');
    const body = {
      market_id: market.id,
      lot_code: pickedLot,
      name: md.body.querySelector('#va-sname').value.trim(),
      category: md.body.querySelector('#va-cat').value,
      description: md.body.querySelector('#va-desc').value.trim(),
      line_id: md.body.querySelector('#va-line').value.trim(),
      phone: isVendor ? '' : md.body.querySelector('#va-phone').value.trim(),
    };
    if (!body.name) { toast('กรุณากรอกชื่อร้าน', 'err'); return; }
    if (!isVendor) {
      body.display_name = md.body.querySelector('#va-oname').value.trim();
      body.login = md.body.querySelector('#va-login').value.trim();
      body.password = md.body.querySelector('#va-pass').value;
      body.email = md.body.querySelector('#va-email').value.trim();
      if (!body.display_name) { toast('กรุณากรอกชื่อเจ้าของร้าน', 'err'); return; }
      if (!body.login) { toast('กรุณาตั้งชื่อผู้ใช้', 'err'); return; }
      if (body.password.length < 4) { toast('รหัสผ่านต้องยาวอย่างน้อย 4 ตัวอักษร', 'err'); return; }
      if (!body.phone) { toast('กรุณากรอกเบอร์โทรติดต่อ', 'err'); return; }
    }
    btn.disabled = true;
    try {
      const r = await api('/api/apply/shop', { method: 'POST', body });
      md.close();
      if (r.token) setSession(r.token, r.user);
      openModal({
        title: 'ส่งใบสมัครแล้ว 🎉',
        sub: 'ขอบคุณครับ!',
        icon: IC.bell,
        center: true,
        body: `
          <div class="ok-emo">📨</div>
          <p style="text-align:center;margin:0 0 6px"><b>"${esc(r.shop.name)}"</b> ยื่นเข้าร่วม <b>${esc(market.name)}</b>${pickedLot ? ` ล็อค <b>${esc(pickedLot)}</b>` : ''} เรียบร้อย</p>
          <p class="hint" style="text-align:center">ผจก.ตลาดหรือแอดมินจะพิจารณาใบสมัครของคุณ — สถานะจะแสดงในหน้าร้านของคุณทันทีที่อัปเดต</p>
          <button class="btn primary block" id="va-view" type="button">ดูสถานะใบสมัครของฉัน</button>`,
        onDismiss: () => {},
      });
      $('#va-view').addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach((m) => m.remove());
        chooseRole('vendor');
      });
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });
}

/* ── หน้ายื่นเปิดตลาด (ผจก.ใหม่) ── */
function renderManagerApply() {
  viewEl.dataset.app = 'manager-apply';
  const u = state.user;
  const isExistingMgr = u && u.role === 'manager' && !u.market_id;
  viewEl.innerHTML = `
    <header class="pagehead">
      <div class="ph-top">
        <div class="ph-title">
          <h2>${isExistingMgr ? 'ยื่นเปิดตลาดใหม่อีกครั้ง 🧑‍💼' : 'ยื่นเปิดตลาดของคุณ 🧑‍💼'}</h2>
          <p>กรอกข้อมูลตลาด — แอดมินระบบจะพิจารณาและอนุมัติก่อนเผยแพร่ให้ลูกค้าเห็น</p>
        </div>
        ${(u && state.role) ? roleBtnHTML() : ''}
      </div>
      <div class="back-link-row"><button class="back-link" data-start="back" type="button">← กลับหน้าเริ่มต้น</button></div>
    </header>
    <div class="apply-card">
      ${isExistingMgr ? `<p class="hint" style="margin:0 0 6px">ใช้บัญชี <b>${esc(u.display_name)}</b> ของคุณอยู่แล้ว — กรอกเฉพาะข้อมูลตลาดใหม่ได้เลยครับ</p>` : `
      <p class="as-sec">👤 บัญชีผู้จัดการตลาด</p>
      <div class="field"><label for="ma-name">ชื่อ-นามสกุลผู้จัดการ</label>
        <input class="tin" id="ma-name" maxlength="120" placeholder="เช่น สมชาย ใจดี"></div>
      <div class="field-row">
        <div class="field"><label for="ma-login">ชื่อผู้ใช้ (a-z, 0-9)</label>
          <input class="tin" id="ma-login" maxlength="60" placeholder="เช่น somchai"></div>
        <div class="field"><label for="ma-pass">รหัสผ่าน (4 ตัวขึ้นไป)</label>
          <input class="tin" id="ma-pass" type="password" maxlength="100" placeholder="••••••••"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="ma-phone">เบอร์โทรติดต่อ</label>
          <input class="tin" id="ma-phone" maxlength="32" inputmode="tel" placeholder="08x-xxx-xxxx"></div>
        <div class="field"><label for="ma-email">อีเมล (ไม่บังคับ)</label>
          <input class="tin" id="ma-email" maxlength="120" placeholder="you@email.com"></div>
      </div>`}
      <p class="as-sec">🏪 ข้อมูลตลาด</p>
      <div class="field"><label for="ma-mkname">ชื่อตลาด</label>
        <input class="tin" id="ma-mkname" maxlength="120" placeholder="เช่น ตลาดนัดริมคลองบางบอน"></div>
      <div class="field"><label for="ma-area">ที่ตั้ง / ย่าน</label>
        <input class="tin" id="ma-area" maxlength="160" placeholder="เช่น กรุงเทพฯ · เขตบางบอน"></div>
      <div class="field"><label for="ma-address">ที่อยู่ (ลูกค้าจะใช้นำทาง)</label>
        <input class="tin" id="ma-address" maxlength="300" placeholder="บ้านเลขที่ ซอย ถนน แขวง เขต"></div>
      <div class="field">
        <label>ตลาดแบบไหน?</label>
        <div class="seg field-seg" id="ma-type">
          <button type="button" data-t="day">☀️ ตลาดกลางวัน</button>
          <button type="button" data-t="night" class="on">🌙 ตลาดกลางคืน</button>
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label for="ma-open">เวลาเปิด</label>
          <input class="tin" id="ma-open" type="time" value="16:00"></div>
        <div class="field"><label for="ma-close">เวลาปิด</label>
          <input class="tin" id="ma-close" type="time" value="23:00"></div>
      </div>
      <div class="field"><label>เปิดทำการวันไหน?</label>
        <div class="day-chips" id="ma-days">
          ${TH_DAYS.map((d, i) => `<button type="button" class="dchip on" data-d="${i}">${d}</button>`).join('')}
        </div>
      </div>
      <div class="field"><label for="ma-desc">แนะนำตลาดสั้น ๆ (แอดมินจะเห็นตอนพิจารณา)</label>
        <input class="tin" id="ma-desc" maxlength="500" placeholder="เช่น ตลาดสด+ตลาดนัดย้อนหลังริมคลอง มีของกินของใช้ครบ"></div>
      <button class="btn gold block" id="ma-go" type="button">📨 ยื่นใบสมัครเปิดตลาด</button>
      <p class="hint" style="text-align:center">หลังอนุมัติ คุณจะได้หน้าจัดการตลาดเต็มรูปแบบ — ผังล็อค ค่าเช่า อนุมัติร้านค้า และรายงาน</p>
    </div>`;
  let mkType = 'night';
  $('#ma-type').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-t]');
    if (!b) return;
    mkType = b.dataset.t;
    $$('#ma-type button').forEach((x) => x.classList.toggle('on', x === b));
    $('#ma-open').value = mkType === 'day' ? '06:00' : '16:00';
    $('#ma-close').value = mkType === 'day' ? '13:00' : '23:00';
  });
  $('#ma-days').addEventListener('click', (e) => {
    const c = e.target.closest('.dchip');
    if (c) c.classList.toggle('on');
  });
  $('#ma-go').addEventListener('click', async () => {
    const btn = $('#ma-go');
    const days = $$('#ma-days .dchip.on').map((c) => c.dataset.d);
    if (!days.length) { toast('เลือกวันเปิดทำการอย่างน้อย 1 วัน', 'err'); return; }
    const body = {
      display_name: $('#ma-name').value.trim(),
      login: $('#ma-login').value.trim(),
      password: $('#ma-pass').value,
      phone: $('#ma-phone').value.trim(),
      email: $('#ma-email').value.trim(),
      market: {
        name: $('#ma-mkname').value.trim(),
        area: $('#ma-area').value.trim(),
        address: $('#ma-address').value.trim(),
        market_type: mkType,
        open_days: days.join(','),
        open_time: $('#ma-open').value,
        close_time: $('#ma-close').value,
        description: $('#ma-desc').value.trim(),
      },
    };
    if (!isExistingMgr) {
      if (!body.display_name) { toast('กรุณากรอกชื่อผู้จัดการ', 'err'); return; }
      if (!body.login || body.password.length < 4) { toast('กรุณาตั้งชื่อผู้ใช้และรหัสผ่าน (4 ตัวขึ้นไป)', 'err'); return; }
      if (!body.phone) { toast('กรุณากรอกเบอร์โทรติดต่อ', 'err'); return; }
    }
    if (!body.market.name) { toast('กรุณากรอกชื่อตลาด', 'err'); return; }
    if (!body.market.area) { toast('กรุณากรอกที่ตั้ง/ย่านของตลาด', 'err'); return; }
    btn.disabled = true;
    try {
      const r = await api('/api/apply/market', { method: 'POST', body });
      setSession(r.token, r.user);
      openModal({
        title: 'ยื่นใบสมัครแล้ว 🎉',
        sub: 'ขอบคุณครับ!',
        icon: IC.bell,
        center: true,
        body: `
          <div class="ok-emo">📨</div>
          <p style="text-align:center;margin:0 0 6px">ตลาด <b>"${esc(body.market.name)}"</b> ถูกส่งให้แอดมินพิจารณาแล้ว</p>
          <p class="hint" style="text-align:center">หลังอนุมัติ ตลาดของคุณจะเผยแพร่ให้ลูกค้าเห็นทันที และคุณจะได้หน้าจัดการตลาดเต็มรูปแบบ</p>
          <button class="btn primary block" id="ma-view" type="button">ไปหน้าจัดการตลาดของฉัน</button>`,
      });
      $('#ma-view').addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach((m) => m.remove());
        chooseRole('manager');
      });
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });
  bindLangSwitch();
}

/* ── ผจก.ยังไม่มีตลาด (รอพิจารณา / ถูกปฏิเสธ) ── */
async function renderManagerApplyStatus() {
  viewEl.dataset.app = 'manager';
  viewEl.innerHTML = `
    <header class="pagehead">
      <div class="ph-top">
        <div class="ph-title"><h2>ใบสมัครตลาดของคุณ</h2><p>สถานะการยื่นเปิดตลาด</p></div>
        ${roleBtnHTML()}
      </div>
    </header>
    <div id="mm-apps"><div class="skel" style="height:140px"></div></div>`;
  let apps = [];
  try { apps = (await api('/api/applications/mine')).applications || []; } catch (e) {}
  const box = $('#mm-apps');
  if (!box) return;
  box.innerHTML = apps.length ? apps.map((a) => `
    <div class="vstat ${a.status}">
      <span class="vs-emo">${a.status === 'pending' ? '⏳' : a.status === 'denied' ? '❌' : '✅'}</span>
      <div class="vs-tx">
        <b>${esc(a.market_name || (a.payload && a.payload.market_name) || 'ตลาด')}</b>
        ${a.status === 'pending' ? '<small>รอแอดมินพิจารณา — ตลาดจะเผยแพร่ทันทีที่อนุมัติ</small>'
          : a.status === 'denied' ? `<small><b>ถูกปฏิเสธ:</b> ${esc(a.deny_reason || '—')}</small>`
          : '<small>อนุมัติแล้ว — ตลาดพร้อมใช้งาน</small>'}
        <small class="vs-date">ยื่นเมื่อ ${fmtDateMedium(a.created_at)}</small>
      </div>
    </div>`).join('')
    : `<div class="empty"><div class="e-emo">🏪</div><b>ยังไม่มีใบสมัคร</b><p>ยื่นเปิดตลาดใหม่ได้เลย</p></div>`;
  box.innerHTML += `<button class="btn gold block" id="mm-reapply" type="button" style="margin-top:14px">📨 ยื่นเปิดตลาดใหม่</button>`;
  $('#mm-reapply').addEventListener('click', () => {
    renderManagerApply();
  });
}

/* ── ผจก.: ใบสมัครร้านค้าเข้าร่วมตลาด ── */
function appLoadErrorState(box, retryFn) {
  box.innerHTML = `<div class="empty"><div class="e-emo">📡</div><b>เชื่อมต่อระบบไม่สำเร็จ</b><p>เซิร์ฟเวอร์อาจกำลังตื่นจากโหมดพัก — รอสักครู่แล้วกดลองใหม่ครับ</p><button class="btn sm" type="button">🔄 ลองใหม่</button></div>`;
  const rb = box.querySelector('button');
  if (rb) rb.addEventListener('click', () => { box.innerHTML = '<div class="skel" style="height:180px"></div>'; retryFn(); });
}

async function renderManagerApplications() {
  viewEl.dataset.app = 'manager';
  viewEl.innerHTML = `
    <header class="pagehead">
      <div class="ph-top">
        <div class="ph-title"><h2>ใบสมัครร้านค้า 📨</h2><p>ร้านค้าที่ยื่นขอเข้าร่วมตลาดของคุณ</p></div>
        ${roleBtnHTML()}
      </div>
    </header>
    <div id="mgr-apps"><div class="skel" style="height:180px"></div></div>`;
  let data = null;
  try {
    if (state.user && state.user.role === 'admin') {
      /* แอดมินที่เปิดคอนโซลตลาด — endpoint ผจก.ใช้ไม่ได้ (403) ให้ดึงของแอดมินแล้วกรองเฉพาะตลาดนี้ */
      const all = await api('/api/admin/applications');
      data = { applications: (all.applications || []).filter((a) => a.kind === 'shop' && Number(a.market_id) === Number(state.manager.marketId)) };
    } else {
      data = await api('/api/manager/applications');
    }
  } catch (e) { data = null; }
  const box = $('#mgr-apps');
  if (!box) return;
  if (data === null) { appLoadErrorState(box, () => renderManagerApplications()); return; }
  const apps = data.applications || [];
  paintAppBadge(apps.filter((a) => a.status === 'pending').length);
  if (!apps.length) {
    box.innerHTML = `<div class="empty"><div class="e-emo">📭</div><b>ยังไม่มีใบสมัคร</b><p>เมื่อร้านค้าสมัครเข้าร่วมตลาดของคุณ ใบสมัครจะแสดงที่นี่พร้อมปุ่มอนุมัติ/ปฏิเสธ</p></div>`;
    return;
  }
  const pending = apps.filter((a) => a.status === 'pending');
  const done = apps.filter((a) => a.status !== 'pending');
  box.innerHTML = `
    ${pending.length ? `<p class="as-sec">⏳ รอพิจารณา (${pending.length})</p>` + pending.map((a) => applicationCardHTML(a, 'mgr')).join('')
      : '<div class="empty"><div class="e-emo">📭</div><b>ไม่มีใบสมัครรอพิจารณา</b><p>เมื่อร้านค้าสมัครเข้าร่วมตลาดของคุณ ใบสมัครจะแสดงที่นี่ทันที</p></div>'}
    ${done.length ? `<p class="as-sec" style="margin-top:18px">📚 พิจารณาแล้ว</p>` + done.map((a) => applicationCardHTML(a, 'mgr')).join('') : ''}`;
  wireApplicationActions(box, 'mgr');
}

/* ── แอดมิน: ใบสมัครทั้งหมด (ตลาดใหม่ + ร้านค้าใหม่) ── */
async function renderAdminApplications() {
  viewEl.dataset.app = 'admin';
  viewEl.innerHTML = `
    <header class="pagehead">
      <div class="ph-top">
        <div class="ph-title"><h2>ใบสมัครเข้าใหม่ 📨</h2><p>ตลาดใหม่ (คุณอนุมัติ) และร้านค้าใหม่ (คุณหรือผจก.ตลาดอนุมัติ)</p></div>
        ${roleBtnHTML()}
      </div>
    </header>
    <div id="adm-apps"><div class="skel" style="height:180px"></div></div>`;
  let data = null;
  try { data = await api('/api/admin/applications'); } catch (e) { data = null; }
  const box = $('#adm-apps');
  if (!box) return;
  if (data === null) { appLoadErrorState(box, () => renderAdminApplications()); return; }
  const apps = data.applications || [];
  paintAppBadge(apps.filter((a) => a.status === 'pending').length);
  if (!apps.length) {
    box.innerHTML = `<div class="empty"><div class="e-emo">📭</div><b>ยังไม่มีใบสมัคร</b><p>ใบสมัครตลาดใหม่และร้านค้าใหม่จะแสดงที่นี่</p></div>`;
    return;
  }
  const pending = apps.filter((a) => a.status === 'pending');
  const done = apps.filter((a) => a.status !== 'pending');
  box.innerHTML = `
    ${pending.length ? `<p class="as-sec">⏳ รอพิจารณา (${pending.length})</p>` + pending.map((a) => applicationCardHTML(a, 'adm')).join('') : ''}
    ${done.length ? `<p class="as-sec" style="margin-top:18px">📚 พิจารณาแล้ว</p>` + done.map((a) => applicationCardHTML(a, 'adm')).join('') : ''}`;
  wireApplicationActions(box, 'adm');
}

/* ── การ์ดใบสมัคร (ใช้ร่วม ผจก./แอดมิน) ── */
function applicationCardHTML(a, ctx) {
  const isMarket = a.kind === 'market';
  const p = a.payload || {};
  const title = isMarket ? `ตลาดใหม่: ${esc(a.market_name || p.market_name || '—')}` : `ร้านค้าใหม่: ${esc(a.shop_name || '—')}`;
  const sub = isMarket
    ? `${esc(a.market_area || p.area || '')} · ${p.market_type === 'day' ? '☀️ กลางวัน' : '🌙 กลางคืน'} · เปิด ${esc(p.open_time || '')}–${esc(p.close_time || '')}`
    : `ในตลาด ${esc(a.market_name || '')}${a.lot_code ? ` · ล็อค ${esc(a.lot_code)}` : ' · ให้ผจก.จัดล็อค'} · ${catLabel(p.category)}`;
  return `
    <div class="app-card ${a.status}">
      <div class="ac-head">
        <div class="ac-title">
          <b>${title}</b>
          <small>${sub}</small>
          <small class="ac-who">👤 ${esc(a.applicant || '')} · 📞 ${esc(a.applicant_phone || p.phone || '—')}${a.applicant_email || p.email ? ' · ✉️ ' + esc(a.applicant_email || p.email) : ''}</small>
          ${p.description ? `<small class="ac-desc">“${esc(p.description)}”</small>` : ''}
          ${p.line_id ? `<small>💬 LINE: ${esc(p.line_id)}</small>` : ''}
        </div>
        <span class="ac-st ${a.status}">${APP_STATUS_TH[a.status] || a.status}</span>
      </div>
      ${a.status === 'pending' ? `
      <div class="ac-actions">
        <button class="btn primary sm" data-app-ok="${a.id}" type="button">✅ อนุมัติ</button>
        <button class="btn ghost sm" data-app-no="${a.id}" type="button">❌ ปฏิเสธ</button>
        ${ctx === 'adm' && isMarket ? '<small class="hint" style="align-self:center">อนุมัติแล้วตลาดจะเผยแพร่ทันที</small>' : ''}
      </div>` : a.status === 'denied' ? `<div class="ac-deny">เหตุผล: ${esc(a.deny_reason || '—')}</div>` : ''}
    </div>`;
}

function catLabel(c) {
  return { food: '🍳 อาหาร', clothes: '👕 เสื้อผ้า', fresh: '🥬 ของสด', general: '🧺 ทั่วไป' }[c] || '🍳 อาหาร';
}

/* ── ปุ่มอนุมัติ/ปฏิเสธ + ชีตเหตุผล ── */
function wireApplicationActions(box, ctx) {
  box.querySelectorAll('[data-app-ok]').forEach((b) => b.addEventListener('click', async () => {
    b.disabled = true;
    try {
      await api(`/api/applications/${b.dataset.appOk}/approve`, { method: 'POST', body: {} });
      toast('อนุมัติเรียบร้อย ✅ — แจ้งเจ้าของใบสมัครในแอปแล้ว', 'ok');
    } catch (e) { toast(e.message, 'err'); b.disabled = false; return; }
    if (ctx === 'mgr') renderManagerApplications(); else renderAdminApplications();
  }));
  box.querySelectorAll('[data-app-no]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.appNo;
    const md = openModal({
      title: 'ปฏิเสธใบสมัคร',
      sub: 'เหตุผลจะแสดงให้ผู้สมัครเห็น — ช่วยให้เขาแก้ไขแล้วยื่นใหม่ได้',
      icon: IC.alert,
      center: true,
      body: `
        <div class="field"><label for="deny-reason">เหตุผลที่ปฏิเสธ</label>
          <textarea class="tin" id="deny-reason" rows="3" maxlength="300" placeholder="เช่น ล็อคที่เลือกอยู่ในโซนที่ปิดปรับปรุง — เลือกล็อคอื่นแล้วยื่นใหม่ได้เลยครับ"></textarea></div>
        <button class="btn ghost block" id="deny-go" type="button">ยืนยันปฏิเสธ</button>`,
    });
    md.body.querySelector('#deny-go').addEventListener('click', async () => {
      const reason = md.body.querySelector('#deny-reason').value.trim();
      if (!reason) { toast('กรุณากรอกเหตุผล', 'err'); return; }
      try {
        await api(`/api/applications/${id}/deny`, { method: 'POST', body: { reason } });
        md.close();
        toast('ปฏิเสธแล้ว — ผู้สมัครจะเห็นเหตุผลและยื่นใหม่ได้', 'info');
        if (ctx === 'mgr') renderManagerApplications(); else renderAdminApplications();
      } catch (e) { toast(e.message, 'err'); }
    });
  }));
}

async function enterVendor() {
  const v = state.vendor;
  viewEl.dataset.app = 'vendor';
  const u = state.user;
  /* บัญชีร้านค้า: ร้านของตัวเอง (อาจหลายตลาด — v6) */
  if (u && u.role === 'vendor') {
    let shops = [];
    try { shops = (await api('/api/auth/me')).vendor_shops || []; } catch (e) {}
    v.shops = shops;
    const approved = shops.filter((x) => x.status === 'approved');
    if (!approved.length) { renderVendorApply({ fromDashboard: false }); return; }
    const saved = Number(store.get('talatsuite.vshop') || 0) || null;
    const active = approved.find((x) => x.id === saved) || approved[0];
    if (v.shopId !== active.id) { v.shopId = active.id; v.tab = 'orders'; }
    try {
      const data = await api(`/api/shops/${v.shopId}`);
      v.shop = data.shop;
    } catch (e) {
      v.shopId = null; v.shop = null;
      renderVendorApply({ fromDashboard: false });
      return;
    }
    renderVendor();
    return;
  }
  /* แอดมินทดสอบมุมมองร้านค้า: เลือกร้านได้ทุกร้าน */
  const savedShop = Number(store.get('talatsuite.shop') || 0) || null;
  if (savedShop && v.shopId !== savedShop) v.shopId = savedShop;
  if (v.shopId) {
    try {
      const data = await api(`/api/shops/${v.shopId}`);
      v.shop = data.shop;
    } catch (e) {
      v.shopId = null; v.shop = null;
      store.del('talatsuite.shop');
    }
  }
  renderVendor();
}

/* ── ร้านค้ายังไม่มีร้าน (v6: พาไปเลือกตลาดและสมัคร — แทนการสร้างร้านทันที) ── */
async function renderVendorSetup() {
  renderVendorApply({ fromDashboard: false });
}

function switchVendorTab(tab) {
  const v = state.vendor;
  v.tab = tab;
  updateNavOn();
  overlayRoot.innerHTML = '';
  dragCtx = null;
  window.scrollTo(0, 0);
  renderVendor();
}

function renderVendor() {
  const v = state.vendor;
  viewEl.dataset.app = 'vendor';
  if (!v.shopId || !v.shop) {
    if (state.user && state.user.role === 'vendor') renderVendorSetup();
    else renderVendorShopPicker();
    return;
  }
  const s = v.shop;
  viewEl.innerHTML = `
    <header class="pagehead">
      <div class="ph-top">
        <div class="ph-title">
          <h2>${esc(s.emoji)} ${esc(s.name)}</h2>
          <p>${esc(s.market_name || '')}${s.lot_code ? ' · ล็อค ' + esc(s.lot_code) : ''} · ${s.is_open ? '🟢 เปิดรับออเดอร์' : '🔴 ปิดร้านชั่วคราว'}</p>
        </div>
        ${state.user && (state.user.role === 'admin' || (state.user.role === 'vendor' && (state.vendor.shops || []).filter((x) => x.status === 'approved').length > 1)) ? '<button class="ph-chip" id="v-shop-btn" type="button" title="เปลี่ยนร้าน/สลับตลาด">⇄ สลับตลาด</button>' : ''}
        ${state.user && state.user.role === 'vendor' ? '<button class="ph-chip" id="v-expand" type="button" title="สมัครเปิดร้านในตลาดอื่น">🚀 ขยายไปตลาดอื่น</button>' : ''}
        ${roleBtnHTML()}
      </div>
      <div class="subtabs" id="v-subtabs">
        <button type="button" data-t="orders" class="${v.tab === 'orders' ? 'on' : ''}">🧾 รับออร์ดอร์</button>
        <button type="button" data-t="queue" class="${v.tab === 'queue' ? 'on' : ''}">🔥 คิวครัว <span class="badge-n" id="q-badge" hidden>0</span></button>
        <button type="button" data-t="menu" class="${v.tab === 'menu' ? 'on' : ''}">🍕 เมนูสินค้า <span class="badge-n low-stock" id="low-badge" hidden>0</span></button>
        <button type="button" data-t="profile" class="${v.tab === 'profile' ? 'on' : ''}">🏪 ร้านของฉัน</button>
      </div>
      <div class="export-row vend">
        <button class="btn sm ghost" id="vd-export" type="button">⬇️ ส่งออก / พิมพ์รายงาน</button>
      </div>
    </header>
    <div id="pos-content"></div>`;
  updateQueueBadge();
  wireVendorExports();
  loadVendorData();
}

/* ── ร้านค้า: ส่งออกยอดขาย CSV + พิมพ์รายงาน ── */
async function fetchVendorOrdersAll() {
  const v = state.vendor;
  const data = await api(`/api/orders?shop_id=${v.shopId}`);
  return data.orders || [];
}
function vendorSalesRows(orders) {
  return orders.map((o) => [
    `#${o.id}`, fmtDateMedium(o.created_at), fmtTime(o.created_at),
    o.is_guest ? `${o.customer_name || 'แขก'} (แขก)` : (o.customer_name || 'ลูกค้าหน้าร้าน'),
    o.customer_contact || '',
    STATUS_TH[o.status] || o.status,
    (o.items || []).map((i) => `${i.name}×${i.qty}`).join(', '),
    Number(o.total),
  ]);
}
async function exportVendorSalesCSV() {
  try {
    toast(TS.translate('กำลังเตรียม…'));
    const orders = await fetchVendorOrdersAll();
    if (!orders.length) return toast('ยังไม่มีออเดอร์ให้ส่งออก', 'err');
    const res = downloadCSV(`talatsuite-sales-${state.vendor.shopId}-${todayStr()}.csv`,
      ['ออร์เดอร์', 'วันที่', 'เวลา', 'ลูกค้า', 'ติดต่อ', 'สถานะ', 'รายการ', 'ยอด (บาท)'],
      vendorSalesRows(orders));
    const tot = orders.reduce((sum, o) => sum + Number(o.total), 0);
    toastSavedFile(res, `ส่งออก ${orders.length} ออเดอร์ (ยอดรวม ${baht(tot)}) เป็น CSV แล้ว`);
  } catch (e) { toast(e.message, 'err'); }
}
async function copyVendorSales() {
  try {
    const orders = await fetchVendorOrdersAll();
    if (!orders.length) return toast('ยังไม่มีออเดอร์ให้ส่งออก', 'err');
    await exportCopyRows(['ออร์เดอร์', 'วันที่', 'เวลา', 'ลูกค้า', 'ติดต่อ', 'สถานะ', 'รายการ', 'ยอด (บาท)'], vendorSalesRows(orders), orders.length);
  } catch (e) { toast(e.message, 'err'); }
}
async function printVendorSalesReport() {
  {

    try {
      const orders = await fetchVendorOrdersAll();
      if (!orders.length) return toast('ยังไม่มีออร์เดอร์ให้พิมพ์', 'err');
      const v = state.vendor;
      const s = v.shop || {};
      const todayKey = todayStr();
      const todays = orders.filter((o) => String(o.created_at).slice(0, 10) === todayKey);
      const tot = orders.reduce((sum, o) => sum + Number(o.total), 0);
      const totToday = todays.reduce((sum, o) => sum + Number(o.total), 0);
      printReport(
        `ยอดขาย ${s.name || 'ร้านค้า'}`,
        `ทั้งหมด ${orders.length} ออร์เดอร์ · ยอดรวม ${baht(tot)} — วันนี้ ${todays.length} ออร์เดอร์ · ${baht(totToday)}`,
        `<table><thead><tr><th>ออร์เดอร์</th><th>วันที่</th><th>เวลา</th><th>ลูกค้า</th><th>รายการ</th><th>สถานะ</th><th class="num">ยอด (บาท)</th></tr></thead><tbody>
          ${orders.slice(0, 200).map((o) => `<tr>
            <td class="nowrap">#${o.id}</td>
            <td class="nowrap">${fmtDateMedium(o.created_at)}</td>
            <td class="nowrap">${fmtTime(o.created_at)}</td>
            <td>${esc(o.customer_name || 'ลูกค้าหน้าร้าน')}${o.is_guest ? ' <span class="badge">แขก</span>' : ''}</td>
            <td>${(o.items || []).map((i) => esc(i.name) + ' ×' + i.qty).join(', ')}</td>
            <td class="nowrap">${STATUS_TH[o.status] || o.status}</td>
            <td class="num">${Number(o.total).toLocaleString('th-TH')}</td>
          </tr>`).join('')}
        </tbody></table>
        <p class="totals">ยอดรวมทั้งหมด <b>${baht(tot)}</b> · วันนี้ <b>${baht(totToday)}</b> จาก ${todays.length} ออร์เดอร์${orders.length > 200 ? ' · (แสดง 200 รายการล่าสุดในรายงาน)' : ''}</p>`);
  } catch (e) { toast(e.message, 'err'); }
  }
}
function wireVendorExports() {
  const ex = $('#vd-export');
  if (ex) ex.addEventListener('click', () => {
    openExportModal(exportOptions([
      ['csv', exportVendorSalesCSV],
      ['pdf', printVendorSalesReport],
      ['copy', copyVendorSales],
    ]));
  });
}

/* ── หน้าเลือกร้าน (ครั้งแรก / เปลี่ยนร้าน) ── */
async function renderVendorShopPicker() {
  const v = state.vendor;
  v.shopId = null; v.shop = null;
  viewEl.dataset.app = 'vendor';
  viewEl.innerHTML = `
    <header class="pagehead">
      <div class="ph-top">
        <div class="ph-title"><h2>เลือกร้านของคุณ</h2><p>แตะเพื่อเข้าไปจัดการร้าน หรือเปิดร้านใหม่ในตลาด</p></div>
        ${v.prevShopId || (state.user && state.user.role === 'admin') ? '<button class="ph-chip action-chip" id="vsp-back" type="button" title="ย้อนกลับ">← ย้อนกลับ</button>' : ''}
        ${roleBtnHTML()}
      </div>
    </header>
    <div id="vsp-list"><div class="skel" style="height:84px;margin-bottom:10px"></div><div class="skel" style="height:84px"></div></div>
    <div class="menu-mgmt-head" style="margin-top:14px">
      <button class="btn gold" id="vsp-new" type="button">＋ เปิดร้านใหม่</button>
    </div>`;
  try {
    const data = await api('/api/shops');
    const shops = data.shops;
    const box = $('#vsp-list');
    if (!box) return;
    if (!shops.length) {
      box.innerHTML = `<div class="empty"><div class="e-emo">🍽️</div><b>ยังไม่มีร้านค้าในระบบ</b><p>กด "เปิดร้านใหม่" เพื่อเริ่มต้น</p></div>`;
      return;
    }
    /* จัดกลุ่มตามตลาด */
    const byMarket = {};
    shops.forEach((s) => { (byMarket[s.market_name] = byMarket[s.market_name] || { open: s.market_open, sched: s.market_schedule || '', list: [] }).list.push(s); });
    box.innerHTML = Object.entries(byMarket).map(([mname, g]) => `
      <div class="vsp-group">
        <h4>${esc(mname)} ${g.open ? '<span class="open-badge on">เปิดวันนี้</span>' : '<span class="open-badge off">ปิดวันนี้</span>'}</h4>
        ${g.sched ? `<p class="vsp-sched">🕒 ${esc(g.sched)}</p>` : ''}
        ${g.list.map((s) => `
          <button class="vsp-card" data-id="${s.id}" type="button">
            <span class="mm-emo">${esc(s.emoji)}</span>
            <div class="msh-info">
              <b>${esc(s.name)} ${s.lot_code ? `<span class="lot-tag">${esc(s.lot_code)}</span>` : ''}</b>
              <small>${esc(CAT_TH[s.category] || s.category)} · เมนู ${s.menu_count} รายการ</small>
            </div>
            <span class="open-badge ${s.is_open ? 'on' : 'off'}">${s.is_open ? 'เปิดร้าน' : 'ปิดอยู่'}</span>
            <span class="vsp-go">→</span>
          </button>`).join('')}
      </div>`).join('');
  } catch (e) {
    const box = $('#vsp-list');
    if (box) box.innerHTML = `<div class="err-banner"><b>โหลดรายชื่อร้านไม่สำเร็จ</b>${esc(e.message)}</div>`;
  }
}

/* sheet เปิดร้านใหม่ */
async function openNewShopSheet() {
  let markets = [];
  try {
    const data = await api('/api/markets');
    markets = data.markets;
  } catch (e) { toast(e.message, 'err'); return; }
  const md = openModal({
    title: 'เปิดร้านใหม่',
    sub: 'เลือกตลาด ตั้งชื่อร้าน แล้วเพิ่มเมนูได้เลย',
    icon: IC.store,
    className: 'shop-form-sheet',
    body: `
      <div class="field"><label for="ns-market">ตลาดที่จะตั้งแผง</label>
        <select class="tsel" id="ns-market">
          ${markets.map((mk) => `<option value="${mk.id}">${esc(mk.emoji)} ${esc(mk.name)}</option>`).join('')}
        </select></div>
      <div class="field"><label for="ns-name">ชื่อร้าน</label>
        <input class="tin" id="ns-name" maxlength="120" placeholder="เช่น ส้มตำแม่ประนอม"></div>
      <div class="field"><label for="ns-emoji">อิโมจิประจำร้าน</label>
        <input class="tin" id="ns-emoji" maxlength="8" value="🍽️"></div>
      <div class="field"><label for="ns-cat">ประเภทร้าน</label>
        <select class="tsel" id="ns-cat">
          ${Object.entries(CAT_TH).map(([v2, th]) => `<option value="${v2}">${th}</option>`).join('')}
        </select></div>
      <div class="field"><label for="ns-lot">ล็อคที่ตั้งแผง (ถ้ารู้ ไม่บังคับ)</label>
        <input class="tin" id="ns-lot" maxlength="10" placeholder="เช่น B4"></div>
      <button class="btn primary block" id="ns-save" type="button">เปิดร้าน</button>`,
  });
  md.body.querySelector('#ns-save').addEventListener('click', async () => {
    const btn = md.body.querySelector('#ns-save');
    const name = md.body.querySelector('#ns-name').value.trim();
    if (!name) { toast('กรุณากรอกชื่อร้าน', 'err'); return; }
    btn.disabled = true;
    try {
      const r = await api('/api/shops', {
        method: 'POST',
        body: {
          market_id: Number(md.body.querySelector('#ns-market').value),
          name,
          emoji: md.body.querySelector('#ns-emoji').value,
          category: md.body.querySelector('#ns-cat').value,
          lot_code: md.body.querySelector('#ns-lot').value.trim().toUpperCase(),
        },
      });
      md.close();
      toast(`เปิดร้าน “${r.shop.name}” แล้ว — เพิ่มเมนูและช่องทางติดต่อได้เลย`, 'ok');
      state.vendor.shopId = r.shop.id;
      store.set('talatsuite.shop', String(r.shop.id));
      enterVendor();
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });
}

async function selectVendorShop(id) {
  state.vendor.shopId = id;
  store.set('talatsuite.shop', String(id));
  state.vendor.tab = 'orders';
  enterVendor();
}

/* ── โหลดข้อมูลร้าน (เมนู + ออเดอร์) ── */
async function loadVendorData({ silent = false } = {}) {
  const v = state.vendor;
  if (!v.shopId) return;
  v.loading = true;
  try {
    const [menu, orders] = await Promise.all([
      api(`/api/shops/${v.shopId}/menu`),
      api(`/api/orders?shop_id=${v.shopId}`),
    ]);
    const snapshot = JSON.stringify([menu.items, orders.orders]);
    const changed = snapshot !== lastVendorSnapshot;
    lastVendorSnapshot = snapshot;
    v.menu = menu.items;
    v.orders = orders.orders;
    v.error = null;

    /* แจ้งเตือนออเดอร์ใหม่เข้า (เฉพาะที่เพิ่งเข้า ไม่ใช่รอบแรก) */
    const ids = new Set(v.orders.map((o) => o.id));
    if (v.knownIds) {
      for (const o of v.orders) {
        if (!v.knownIds.has(o.id) && o.status === 'pending') {
          beep('new');
          toast(`🔔 ออเดอร์ใหม่ #${o.id} จาก ${o.customer_name || 'ลูกค้า'} (${baht(o.total)})`, 'ok');
        }
      }
    }
    v.knownIds = ids;

    if ($('#pos-content') && state.role === 'vendor' && (changed || !silent)) renderVendorContent();
  } catch (e) {
    v.error = e.message;
    if (!silent && $('#pos-content')) renderVendorError();
  } finally {
    v.loading = false;
  }
}

function renderVendorContent() {
  const v = state.vendor;
  updateQueueBadge();
  if (v.error) { renderVendorError(); return; }
  if (v.tab === 'orders') renderVendorPosTab();
  else if (v.tab === 'queue') renderQueueTab();
  else if (v.tab === 'menu') renderMenuTab();
  else renderVendorProfileTab();
}

function renderVendorError() {
  const c = $('#pos-content');
  if (!c) return;
  c.innerHTML = `<div class="err-banner">
      <b>โหลดข้อมูลร้านไม่สำเร็จ</b>${esc(state.vendor.error || '')}<br><br>
      <button class="btn ghost sm" id="pos-retry" type="button">ลองใหม่อีกครั้ง</button>
    </div>`;
}

function updateQueueBadge() {
  const badge = $('#q-badge');
  if (!badge) return;
  const n = state.vendor.orders.filter((o) => o.status !== 'completed').length;
  badge.hidden = n === 0;
  badge.textContent = n;
  /* v5.2 — ป้าย "เหลือน้อย" บนแท็บเมนู: เตือนแม่ค้าก่อนของหมด */
  const low = $('#low-badge');
  if (low) {
    const nLow = state.vendor.menu.filter((it) => it.available && it.stock != null && it.stock > 0 && it.stock <= 3).length;
    low.hidden = nLow === 0;
    low.textContent = nLow;
    low.title = 'มี ' + nLow + ' เมนูที่สต็อกเหลือ 3 ชิ้นหรือน้อยกว่า';
  }
}

/* ── แท็บรับออร์ดอร์ (POS หน้าร้าน) ── */
function renderVendorPosTab() {
  const c = $('#pos-content');
  const v = state.vendor;
  if (!c) return;
  if (!v.menu.length) {
    c.innerHTML = `<div class="empty"><div class="e-emo">🍕</div><b>ยังไม่มีเมนูในระบบ</b><p>ไปที่แท็บ “เมนูสินค้า” เพื่อเพิ่มเมนูแรกของร้าน</p></div>`;
    return;
  }
  const cartCount = Object.values(v.cart).reduce((s, q) => s + q, 0);
  c.innerHTML = `
    <div class="pos-layout">
      <div class="menu-grid">
        ${v.menu.map((it) => {
          const qty = v.cart[it.id] || 0;
          const visual = it.image
            ? `<span class="mc-img"><img src="${esc(it.image)}" alt=""></span>`
            : `<span class="mc-emo">${esc(it.emoji)}</span>`;
          return `
          <div class="menu-card ${it.available ? '' : 'off'}" data-id="${it.id}">
            ${it.available ? '' : '<span class="mc-off-tag">สินค้าหมด</span>'}
            ${it.stock != null ? `<span class="mc-stock ${it.stock === 0 ? 'zero' : it.stock <= 3 ? 'low' : ''}">${it.stock === 0 ? 'หมดสต็อก' : 'เหลือ ' + it.stock}</span>` : ''}
            ${visual}
            <span class="mc-name">${esc(it.name)}</span>
            <span class="mc-price">${baht(it.price)}</span>
            ${it.available ? `
              <div class="mc-qty">
                <button class="mc-step" type="button" data-cact="minus" data-id="${it.id}" ${qty ? '' : 'disabled'} aria-label="ลดจำนวน">−</button>
                <span class="mc-n num">${qty}</span>
                <button class="mc-step plus" type="button" data-cact="plus" data-id="${it.id}" aria-label="เพิ่มจำนวน">+</button>
              </div>` : ''}
          </div>`;
        }).join('')}
      </div>
      <aside class="pos-cart cart-region" id="pos-cart"></aside>
    </div>
    <div class="pos-cartbar" id="pos-cartbar" ${cartCount ? '' : 'hidden'}>
      <div class="cb-tx"><small id="cb-count"></small><b class="num" id="cb-total"></b></div>
      <button class="btn gold" id="cb-open" type="button">🧾 ดูตะกร้า</button>
    </div>`;
  mountCart($('#pos-cart'), { staticPanel: true });
  updateCartUI();
}

function adjustCart(id, delta) {
  const v = state.vendor;
  const cur = v.cart[id] || 0;
  const next = Math.max(0, Math.min(99, cur + delta));
  if (next === 0) delete v.cart[id]; else v.cart[id] = next;
  updateCartUI();
}

function cartEntries() {
  const v = state.vendor;
  return Object.entries(v.cart)
    .map(([id, qty]) => ({ item: v.menu.find((m) => m.id === Number(id)), qty }))
    .filter((e) => e.item);
}

function cartLinesHTML() {
  const entries = cartEntries();
  if (!entries.length) {
    return `<div class="cart-empty">ยังไม่ได้เลือกอาหาร — แตะ “＋” ที่เมนูด้านบน</div>`;
  }
  return entries.map(({ item, qty }) => `
    <div class="cart-line">
      <div class="cl-name"><b>${esc(item.emoji)} ${esc(item.name)}</b><small>${baht(item.price)} × ${qty}</small></div>
      <div class="cl-qty">
        <button type="button" data-cact="minus" data-id="${item.id}" aria-label="ลด">−</button>
        <b>${qty}</b>
        <button type="button" data-cact="plus" data-id="${item.id}" aria-label="เพิ่ม">+</button>
      </div>
      <span class="cl-amt">${baht(item.price * qty)}</span>
    </div>`).join('');
}

function mountCart(region, { staticPanel = false } = {}) {
  const draft = state.vendor.draft;
  const inputsHTML = `
      <div class="field"><label>ชื่อลูกค้า / หมายเลขโต๊ะ</label>
        <input class="tin cc-name" maxlength="80" placeholder="เช่น คุณสมชาย / โต๊ะ 5" value="${esc(draft.name)}"></div>
      <div class="field"><label>หมายเหตุถึงครัว</label>
        <input class="tin cc-note" maxlength="300" placeholder="เช่น ไม่ใส่หัวหอม (ไม่บังคับ)" value="${esc(draft.note)}"></div>`;
  region.innerHTML = staticPanel ? `
    <h3>🧾 ตะกร้าออเดอร์</h3>
    <div class="pc-body">
      ${inputsHTML}
      <div class="pc-lines"></div>
      <div class="cart-total"><span>รวมทั้งหมด</span><b class="pc-total num"></b></div>
      <button class="btn primary block cc-submit" type="button">🚀 ส่งออเดอร์เข้าคิว</button>
    </div>` : `
    <div class="pc-body">
      ${inputsHTML}
      <div class="pc-lines"></div>
      <div class="cart-total"><span>รวมทั้งหมด</span><b class="pc-total num"></b></div>
      <button class="btn primary block cc-submit" type="button">🚀 ส่งออเดอร์เข้าคิว</button>
    </div>`;
  updateCartUI();
}

function updateCartUI() {
  const entries = cartEntries();
  const count = entries.reduce((s, e) => s + e.qty, 0);
  const total = entries.reduce((s, e) => s + e.item.price * e.qty, 0);

  $$('#pos-content .menu-card').forEach((card) => {
    const id = Number(card.dataset.id);
    const item = state.vendor.menu.find((m) => m.id === id);
    if (!item || !item.available) return;
    const qty = state.vendor.cart[id] || 0;
    const n = card.querySelector('.mc-n');
    if (n) n.textContent = qty;
    const minus = card.querySelector('[data-cact="minus"]');
    if (minus) minus.disabled = qty === 0;
  });

  const bar = $('#pos-cartbar');
  if (bar) {
    bar.hidden = count === 0;
    const cb = $('#cb-count'); const ct = $('#cb-total');
    if (cb) cb.textContent = `${count} รายการในตะกร้า`;
    if (ct) ct.textContent = baht(total);
  }

  $$('.cart-region').forEach((region) => {
    const lines = region.querySelector('.pc-lines');
    if (lines) lines.innerHTML = cartLinesHTML();
    const tot = region.querySelector('.pc-total');
    if (tot) tot.textContent = baht(total);
  });
}

function openCartSheet() {
  const md = openModal({
    title: 'ตะกร้าออเดอร์',
    sub: 'ตรวจรายการก่อนส่งเข้าคิวครัว',
    icon: IC.receipt,
    className: 'cart-sheet cart-region',
    body: '',
  });
  mountCart(md.body, { staticPanel: false });
  updateCartUI();
}

async function submitOrder(region) {
  const v = state.vendor;
  const name = region.querySelector('.cc-name') ? region.querySelector('.cc-name').value.trim() : '';
  const note = region.querySelector('.cc-note') ? region.querySelector('.cc-note').value.trim() : '';
  const entries = cartEntries();
  if (!entries.length) { toast('ยังไม่ได้เลือกรายการอาหาร', 'err'); return; }
  try {
    const r = await api('/api/orders', {
      method: 'POST',
      body: {
        shop_id: v.shopId,
        customer_name: name,
        note,
        items: entries.map(({ item, qty }) => ({ menu_item_id: item.id, qty })),
      },
    });
    v.cart = {};
    $$('.modal-backdrop').forEach((bd) => { if (bd.querySelector('.cart-sheet')) bd.remove(); });
    toast(`ส่งออเดอร์ #${r.id} เข้าคิว รอดำเนินการ แล้ว (ยอด ${baht(r.total)})`, 'ok');
    await loadVendorData({ silent: true });
    switchVendorTab('queue');
  } catch (e) {
    toast(e.message, 'err');
  }
}

/* ── แท็บคิวครัว Kanban (โครงจาก v1) ── */
function renderQueueTab() {
  const c = $('#pos-content');
  if (!c) return;
  const orders = state.vendor.orders;

  const prevBoard = $('#kanban');
  const prevScroll = prevBoard ? prevBoard.scrollLeft : null;

  const colOrders = (s) => orders
    .filter((o) => o.status === s)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const cardHTML = (o) => {
    const posIdx = ORDER_STATUSES.indexOf(o.status);
    const canPrev = posIdx > 0;
    const canNext = posIdx < ORDER_STATUSES.length - 1;
    const fromApp = o.customer_id && (o.customer_id.startsWith('u:') || o.customer_id.startsWith('g:') || o.customer_id.startsWith('cu-'));
    const fresh = o.status === 'pending' && (Date.now() - new Date(o.created_at).getTime()) < 120000;
    return `
    <article class="kcard ${fromApp ? 'from-app' : ''}" data-id="${o.id}" data-status="${o.status}">
      <div class="kc-top"><span class="kc-no">#${o.id}</span>${fresh ? '<span class="kc-fresh" title="ออเดอร์ใหม่">● ใหม่</span>' : ''}${fromApp ? '<span class="kc-src">📱 แอป</span>' : ''}<span class="kc-time">${timeAgo(o.created_at)}</span></div>
      <div class="kc-customer">${esc(o.customer_name || 'ลูกค้าหน้าร้าน')}${o.customer_contact ? ` <small>· <a class="kc-call" href="tel:${esc(o.customer_contact)}" title="แตะเพื่อโทรหาลูกค้า" data-tel>${esc(o.customer_contact)}</a></small>` : ''}</div>
      ${o.note ? `<div class="kc-note">📝 ${esc(o.note)}</div>` : ''}
      <ul class="kc-items">${o.items.map((i) => `<li><span class="nm">${esc(i.emoji)} ${esc(i.name)}</span><b>×${i.qty}</b></li>`).join('')}</ul>
      <div class="kc-foot">
        <span class="kc-total">${baht(o.total)}</span>
        <div class="kc-nav">
          <button type="button" data-move="prev" ${canPrev ? '' : 'disabled'} aria-label="ย้ายไปขั้นก่อนหน้า">${IC.chevL}</button>
          <button type="button" data-move="next" ${canNext ? '' : 'disabled'} aria-label="ย้ายไปขั้นถัดไป">${IC.chevR}</button>
        </div>
      </div>
    </article>`;
  };

  c.innerHTML = `
    <div class="kanban" id="kanban">
      ${ORDER_STATUSES.map((s) => {
        const list = colOrders(s);
        return `
        <section class="kcol" data-status="${s}">
          <header class="kcol-head"><span class="k-dot"></span><h4>${STATUS_TH[s]}</h4><span class="k-count">${list.length}</span></header>
          <div class="kcards">
            ${list.length ? list.map(cardHTML).join('') : `<div class="kc-empty">ยังไม่มีออเดอร์</div>`}
          </div>
        </section>`;
      }).join('')}
    </div>
    <p class="drag-tip">ลากบัตร (กดค้างแล้วลาก) หรือใช้ปุ่ม ◀ ▶ เพื่อย้ายสถานะ · แตะบัตรเพื่อแก้ไขรายละเอียด · การ์ดที่ลูกค้าสั่งจากแอปมีป้าย 📱</p>`;

  if (prevScroll != null && $('#kanban')) $('#kanban').scrollLeft = prevScroll;

  const board = $('#kanban');
  board.addEventListener('click', onBoardClick);
  board.addEventListener('pointerdown', onBoardPointerDown);
  board.addEventListener('touchmove', (e) => { if (dragCtx && dragCtx.active) e.preventDefault(); }, { passive: false });
  board.addEventListener('contextmenu', (e) => { if (dragCtx) e.preventDefault(); });
}

function onBoardClick(e) {
  if (suppressClick) return;
  const nav = e.target.closest('[data-move]');
  if (nav) {
    const card = nav.closest('.kcard');
    const o = state.vendor.orders.find((x) => x.id === Number(card.dataset.id));
    if (!o) return;
    const idx = ORDER_STATUSES.indexOf(o.status);
    const next = nav.dataset.move === 'next' ? idx + 1 : idx - 1;
    if (next >= 0 && next < ORDER_STATUSES.length) moveOrder(o.id, ORDER_STATUSES[next]);
    return;
  }
  const card = e.target.closest('.kcard');
  if (card) openOrderSheet(Number(card.dataset.id));
}

async function moveOrder(id, status) {
  const o = state.vendor.orders.find((x) => x.id === id);
  if (!o || o.status === status) return;
  const prev = o.status;
  o.status = status;
  o.completed_at = status === 'completed' ? new Date().toISOString() : null;
  renderQueueTab();
  try {
    await api(`/api/orders/${id}`, { method: 'PUT', body: { status } });
    toast(`ออเดอร์ #${id} → ${STATUS_TH[status]}`, 'ok');
    updateQueueBadge();
    /* รีเฟรชเพื่อดึง events ใหม่ */
    loadVendorData({ silent: true });
  } catch (e) {
    o.status = prev;
    o.completed_at = null;
    renderQueueTab();
    toast(e.message, 'err');
  }
}

/* ── ลากวางบัตรคิว (pointer events + กดค้าง) ── */
let dragCtx = null;
let suppressClick = false;

function onBoardPointerDown(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const card = e.target.closest('.kcard');
  if (!card || e.target.closest('button')) return;
  dragCtx = {
    card, id: Number(card.dataset.id), pid: e.pointerId,
    startX: e.clientX, startY: e.clientY,
    active: false, ghost: null, colRects: [], offX: 0, offY: 0, timer: null,
  };
  dragCtx.timer = setTimeout(() => beginDrag(e), 300);
}

function beginDrag(e) {
  if (!dragCtx) return;
  dragCtx.active = true;
  const r = dragCtx.card.getBoundingClientRect();
  const g = dragCtx.card.cloneNode(true);
  g.classList.add('ghost');
  g.style.width = r.width + 'px';
  g.style.margin = '0';
  document.body.appendChild(g);
  dragCtx.ghost = g;
  dragCtx.offX = e.clientX - r.left;
  dragCtx.offY = e.clientY - r.top;
  moveGhost(e.clientX, e.clientY);
  dragCtx.card.classList.add('drag-src');
  const board = $('#kanban');
  dragCtx.boardTop = board ? board.getBoundingClientRect().top : 0;
  dragCtx.colRects = $$('.kcol').map((col) => ({ el: col, status: col.dataset.status, r: col.getBoundingClientRect() }));
  if (navigator.vibrate) navigator.vibrate(12);
}

function moveGhost(x, y) {
  if (!dragCtx || !dragCtx.ghost) return;
  dragCtx.ghost.style.transform = `translate(${x - dragCtx.offX}px, ${y - dragCtx.offY}px) rotate(2deg) scale(1.04)`;
}

function colAt(x, y) {
  if (!dragCtx) return null;
  if (y < dragCtx.boardTop - 90) return null;
  for (const c of dragCtx.colRects) {
    if (x >= c.r.left && x <= c.r.right) return c;
  }
  return null;
}

window.addEventListener('pointermove', (e) => {
  if (!dragCtx) return;
  if (!dragCtx.active) {
    if (Math.hypot(e.clientX - dragCtx.startX, e.clientY - dragCtx.startY) > 12) {
      clearTimeout(dragCtx.timer);
      dragCtx = null;
    }
    return;
  }
  if (e.pointerId !== dragCtx.pid) return;
  e.preventDefault();
  moveGhost(e.clientX, e.clientY);
  const hit = colAt(e.clientX, e.clientY);
  dragCtx.colRects.forEach((c) => c.el.classList.toggle('drop-hint', c === hit));
}, { passive: false });

window.addEventListener('pointerup', (e) => {
  if (!dragCtx) return;
  clearTimeout(dragCtx.timer);
  if (dragCtx.active) {
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 350);
    const hit = colAt(e.clientX, e.clientY);
    const id = dragCtx.id;
    cleanupDrag();
    if (hit) {
      const o = state.vendor.orders.find((x) => x.id === id);
      if (o && o.status !== hit.status) moveOrder(id, hit.status);
    }
  }
  dragCtx = null;
});

window.addEventListener('pointercancel', () => {
  if (!dragCtx) return;
  clearTimeout(dragCtx.timer);
  cleanupDrag();
  dragCtx = null;
});

function cleanupDrag() {
  if (!dragCtx) return;
  if (dragCtx.ghost) dragCtx.ghost.remove();
  dragCtx.card.classList.remove('drag-src');
  $$('.kcol.drop-hint').forEach((el) => el.classList.remove('drop-hint'));
}

/* ── sheet แก้ไขออเดอร์ (+ ไทม์ไลน์ + ช่องทางติดต่อลูกค้า) ── */
function openOrderSheet(id) {
  const o = state.vendor.orders.find((x) => x.id === id);
  if (!o) return;
  const t = {
    customer_name: o.customer_name,
    customer_contact: o.customer_contact,
    note: o.note,
    status: o.status,
    items: o.items.map((i) => ({ ...i })),
  };

  const md = openModal({
    title: `ออเดอร์ #${o.id}`,
    sub: `รับออเดอร์ ${timeAgo(o.created_at)} · ยอด ${baht(o.total)}`,
    icon: IC.receipt,
    className: 'order-sheet',
    body: `
      ${o.events && o.events.length ? `
      <div class="field"><label>ไทม์ไลน์ออเดอร์</label>
        <div class="ev-track">
          ${o.events.map((ev, i) => `
            <div class="ev-node ${i === o.events.length - 1 ? 'now' : ''}">
              <span class="ev-dot"></span>
              <div class="ev-tx"><b>${esc(STATUS_TH[ev.status] || ev.status)}</b>
                <small>${esc(ev.text)} · ${fmtTime(ev.created_at)} น.</small></div>
            </div>`).join('')}
        </div></div>` : ''}
      <div class="field">
        <label>สถานะออเดอร์</label>
        <div class="seg field-seg os-status">
          ${ORDER_STATUSES.map((s) => `<button type="button" data-s="${s}" class="${s === o.status ? 'on' : ''}">${STATUS_TH[s]}</button>`).join('')}
        </div>
      </div>
      <div class="field"><label for="os-name">ชื่อลูกค้า / หมายเลขโต๊ะ</label>
        <input class="tin" id="os-name" maxlength="80" value="${esc(o.customer_name)}" placeholder="เช่น คุณสมชาย / โต๊ะ 5"></div>
      <div class="field"><label for="os-contact">เบอร์ติดต่อลูกค้า (ถ้ามี)</label>
        <input class="tin" id="os-contact" maxlength="60" value="${esc(o.customer_contact)}" placeholder="เช่น 081-234-5678"></div>
      <div class="field"><label for="os-note">หมายเหตุถึงครัว</label>
        <input class="tin" id="os-note" maxlength="300" value="${esc(o.note)}" placeholder="เช่น ไม่ใส่หัวหอม"></div>
      <div class="field"><label>รายการอาหาร</label>
        <div class="os-items"></div>
        <div class="add-item-row">
          <select class="tsel" id="os-addsel"></select>
          <button class="btn ghost" id="os-addbtn" type="button">＋ เพิ่ม</button>
        </div>
      </div>
      <div class="cart-total"><span>ยอดรวม</span><b class="os-total num"></b></div>
      ${o.status !== 'completed' ? '<button class="btn gold block" id="os-complete" type="button" style="margin-top:8px">✓ ยืนยันเสร็จสิ้น (ส่งของถึงลูกค้าแล้ว)</button>' : ''}
      <div class="btn-row" style="margin-top:10px">
        <button class="btn danger" id="os-del" type="button">ลบออเดอร์</button>
        <button class="btn primary" id="os-save" type="button">บันทึกการแก้ไข</button>
      </div>`,
  });

  const itemsBox = md.body.querySelector('.os-items');
  const totalBox = md.body.querySelector('.os-total');
  const addSel = md.body.querySelector('#os-addsel');

  const itemsTotal = () => t.items.reduce((s, i) => s + i.unit_price * i.qty, 0);

  function renderItems() {
    itemsBox.innerHTML = t.items.length ? t.items.map((i, idx) => `
      <div class="oi-row">
        <span class="oi-emo">${esc(i.emoji)}</span>
        <div class="oi-name"><b>${esc(i.name)}</b><small>${baht(i.unit_price)} / ชิ้น</small></div>
        <div class="oi-qty">
          <button type="button" data-oi="minus" data-idx="${idx}" aria-label="ลด">−</button>
          <b>${i.qty}</b>
          <button type="button" data-oi="plus" data-idx="${idx}" aria-label="เพิ่ม">+</button>
        </div>
        <button type="button" class="oi-x" data-oi="del" data-idx="${idx}" aria-label="ลบรายการ">✕</button>
      </div>`).join('')
      : '<div class="cart-empty">ไม่มีรายการอาหารในออเดอร์นี้</div>';
    totalBox.textContent = baht(itemsTotal());
    renderAddSelect();
  }

  function renderAddSelect() {
    const avail = state.vendor.menu.filter((m) => m.available && !t.items.some((i) => i.menu_item_id === m.id));
    addSel.innerHTML = avail.length
      ? avail.map((m) => `<option value="${m.id}">${esc(m.emoji)} ${esc(m.name)} — ${baht(m.price)}</option>`).join('')
      : '<option value="">— ไม่มีเมนูที่เพิ่มได้ —</option>';
    md.body.querySelector('#os-addbtn').disabled = !avail.length;
  }

  itemsBox.addEventListener('click', (e) => {
    const b = e.target.closest('[data-oi]');
    if (!b) return;
    const idx = Number(b.dataset.idx);
    const it = t.items[idx];
    if (!it) return;
    if (b.dataset.oi === 'plus') it.qty = Math.min(99, it.qty + 1);
    else if (b.dataset.oi === 'minus') it.qty = Math.max(1, it.qty - 1);
    else if (b.dataset.oi === 'del') t.items.splice(idx, 1);
    renderItems();
  });

  md.body.querySelector('#os-addbtn').addEventListener('click', () => {
    const m = state.vendor.menu.find((x) => x.id === Number(addSel.value));
    if (!m) return;
    t.items.push({ menu_item_id: m.id, name: m.name, emoji: m.emoji, unit_price: m.price, qty: 1 });
    renderItems();
  });

  md.body.querySelector('.os-status').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-s]');
    if (!b) return;
    t.status = b.dataset.s;
    $$('.os-status button', md.body).forEach((x) => x.classList.toggle('on', x === b));
  });

  const itemsChanged = () => {
    if (t.items.length !== o.items.length) return true;
    return t.items.some((i, idx) => {
      const orig = o.items[idx];
      return (i.menu_item_id || null) !== (orig.menu_item_id || null) || i.qty !== orig.qty;
    });
  };

  md.body.querySelector('#os-save').addEventListener('click', async () => {
    const btn = md.body.querySelector('#os-save');
    btn.disabled = true;
    try {
      const body = {
        customer_name: md.body.querySelector('#os-name').value,
        customer_contact: md.body.querySelector('#os-contact').value,
        note: md.body.querySelector('#os-note').value,
        status: t.status,
      };
      if (itemsChanged()) {
        body.items = t.items.map((i) => ({
          menu_item_id: i.menu_item_id, name: i.name, emoji: i.emoji,
          unit_price: i.unit_price, qty: i.qty,
        }));
      }
      const r = await api(`/api/orders/${o.id}`, { method: 'PUT', body });
      o.customer_name = body.customer_name;
      o.customer_contact = body.customer_contact;
      o.note = body.note;
      o.status = r.status;
      o.total = r.total;
      o.updated_at = new Date().toISOString();
      if (o.status === 'completed' && !o.completed_at) o.completed_at = new Date().toISOString();
      if (o.status !== 'completed') o.completed_at = null;
      if (itemsChanged()) o.items = t.items.map((i) => ({ ...i }));
      md.close();
      toast(`บันทึกการแก้ไขออเดอร์ #${o.id} เรียบร้อย`, 'ok');
      renderQueueTab();
      updateQueueBadge();
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });

  const completeBtn = md.body.querySelector('#os-complete');
  if (completeBtn) {
    completeBtn.addEventListener('click', async () => {
      try {
        await api(`/api/orders/${o.id}`, { method: 'PUT', body: { status: 'completed' } });
        o.status = 'completed';
        o.completed_at = new Date().toISOString();
        md.close();
        toast(`ออเดอร์ #${o.id} เสร็จสิ้นเรียบร้อย 🎉`, 'ok');
        renderQueueTab();
        updateQueueBadge();
      } catch (e) {
        toast(e.message, 'err');
      }
    });
  }

  md.body.querySelector('#os-del').addEventListener('click', async () => {
    const yes = await confirmDialog({
      title: 'ยืนยันการลบออเดอร์?',
      message: `ออเดอร์ <b>#${o.id}</b> (${esc(o.customer_name || 'ลูกค้าหน้าร้าน')}) จะถูกลบออกจากระบบถาวร`,
      confirmText: 'ลบออเดอร์',
      danger: true,
    });
    if (!yes) return;
    try {
      await api(`/api/orders/${o.id}`, { method: 'DELETE' });
      state.vendor.orders = state.vendor.orders.filter((x) => x.id !== o.id);
      md.close();
      toast(`ลบออเดอร์ #${o.id} แล้ว`, 'info');
      renderQueueTab();
      updateQueueBadge();
    } catch (e) {
      toast(e.message, 'err');
    }
  });

  renderItems();
}

/* ── แท็บเมนูสินค้า (+ รูปภาพ) ── */
function renderMenuTab() {
  const c = $('#pos-content');
  const items = state.vendor.menu;
  if (!c) return;
  c.innerHTML = `
    <div class="menu-mgmt-head">
      <button class="btn gold" id="mm-add" type="button">＋ เพิ่มเมนูสินค้าใหม่</button>
    </div>
    <div class="mm-note">💡 แตะที่รายการเพื่อแก้ไขละเอียด (ชื่อ ราคา รูปภาพ อิโมจิ) · แก้ราคาได้ทันทีในช่องราคา · สลับ "พร้อมขาย/สินค้าหมด" ได้ทุกเมื่อ</div>
    ${items.length ? items.map((it) => `
      <div class="mm-row ${it.available ? '' : 'off'}" data-id="${it.id}">
        <span class="mm-emo">${it.image ? `<img src="${esc(it.image)}" alt="">` : esc(it.emoji)}</span>
        <div class="mm-info">
          <b>${esc(it.name)}</b>
          <span class="mm-status ${it.available ? 'on' : 'off'}">${it.available ? '● พร้อมขาย' : '● สินค้าหมด'}</span>
        </div>
        <div class="mm-ctrl">
          <div class="mm-price-wrap">
            <div style="position:relative">
              <span style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--muted);font-weight:600">฿</span>
              <input class="mm-price" type="number" inputmode="decimal" min="0" step="1" value="${it.price}" aria-label="ราคา ${esc(it.name)}">
            </div>
            <span class="mm-savemark">✓ บันทึกแล้ว</span>
          </div>
          <label class="sw" title="สถานะการขาย">
            <input type="checkbox" class="mm-avail" ${it.available ? 'checked' : ''} aria-label="สถานะการขาย ${esc(it.name)}">
            <span class="knob"></span>
          </label>
          <button class="mm-edit" type="button" data-mmi="edit" title="แก้ไขรายละเอียด" aria-label="แก้ไข ${esc(it.name)}">✎</button>
          <button class="mm-del" type="button" aria-label="ลบเมนู ${esc(it.name)}">${IC.trash}</button>
        </div>
      </div>`).join('')
    : '<div class="empty"><div class="e-emo">🍕</div><b>ยังไม่มีเมนู</b><p>กดปุ่ม “เพิ่มเมนูสินค้าใหม่” ด้านบนเพื่อเริ่ม</p></div>'}`;
}

/* แก้ไขราคา/สถานะขายของเมนู (event delegation) */
async function handleMenuChange(e) {
  const row = e.target.closest('.mm-row');
  if (!row) return;
  const id = Number(row.dataset.id);
  if (e.target.classList.contains('mm-price')) {
    const price = Number(e.target.value);
    const it = state.vendor.menu.find((m) => m.id === id);
    if (!it) return;
    if (!Number.isFinite(price) || price < 0 || price > 1000000) {
      toast('ราคาไม่ถูกต้อง (0 – 1,000,000)', 'err');
      e.target.value = it.price;
      return;
    }
    try {
      const r = await api(`/api/menu/${id}`, { method: 'PUT', body: { price } });
      it.price = r.item.price;
      const mark = row.querySelector('.mm-savemark');
      if (mark) { mark.classList.add('show'); setTimeout(() => mark.classList.remove('show'), 1600); }
      toast(`อัปเดตราคา “${it.name}” เป็น ${baht(r.item.price)} แล้ว`, 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  }
  if (e.target.classList.contains('mm-avail')) {
    const available = e.target.checked;
    try {
      await api(`/api/menu/${id}`, { method: 'PUT', body: { available } });
      const it = state.vendor.menu.find((m) => m.id === id);
      it.available = available;
      row.classList.toggle('off', !available);
      const st = row.querySelector('.mm-status');
      st.className = `mm-status ${available ? 'on' : 'off'}`;
      st.textContent = available ? '● พร้อมขาย' : '● สินค้าหมด';
      toast(`“${it.name}” → ${available ? 'พร้อมขาย' : 'สินค้าหมด'}`, 'info');
    } catch (err) {
      toast(err.message, 'err');
    }
  }
}

async function handleMenuDelete(delBtn) {
  const row = delBtn.closest('.mm-row');
  const id = Number(row.dataset.id);
  const it = state.vendor.menu.find((m) => m.id === id);
  if (!it) return;
  const yes = await confirmDialog({
    title: 'ยืนยันการลบเมนู?',
    message: `ลบ <b>${esc(it.name)}</b> ออกจากเมนู? (ออเดอร์เก่าที่สั่งไปแล้วจะยังคงประวัติไว้)`,
    confirmText: 'ลบเมนู',
    danger: true,
  });
  if (!yes) return;
  try {
    await api(`/api/menu/${id}`, { method: 'DELETE' });
    state.vendor.menu = state.vendor.menu.filter((m) => m.id !== id);
    toast(`ลบเมนู “${it.name}” แล้ว`, 'info');
    renderMenuTab();
  } catch (err) {
    toast(err.message, 'err');
  }
}

/* อ่านไฟล์รูป → ย่อ → data URI */
function readImageAsDataURI(file, max = 480) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) { reject(new Error('กรุณาเลือกไฟล์รูปภาพ')); return; }
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('ไฟล์รูปไม่ถูกต้อง'));
      img.onload = () => {
        try {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          cv.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(cv.toDataURL('image/jpeg', 0.82));
        } catch (err) { reject(err); }
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* sheet เพิ่ม/แก้ไขเมนู (มีรูปภาพ) */
function openMenuItemSheet(existing) {
  const it = existing || { name: '', price: '', emoji: '🍕', image: '', available: true };
  let imageData = it.image || '';
  const md = openModal({
    title: existing ? `แก้ไขเมนู “${existing.name}”` : 'เพิ่มเมนูสินค้าใหม่',
    sub: 'ใส่รูปจริงของอาหาร หรือเลือกอิโมจิแทนได้',
    icon: IC.food,
    className: 'menu-item-sheet',
    body: `
      <div class="field"><label>รูปถ่ายเมนู (ถ้ามี)</label>
        <div class="mi-photo">
          <div class="mi-preview" id="mi-preview">${imageData ? `<img src="${esc(imageData)}" alt="">` : '<span>🍽️</span>'}</div>
          <div class="mi-photo-btns">
            <label class="btn ghost sm" style="margin:0">📷 เลือกรูป<input type="file" id="mi-file" accept="image/*" hidden></label>
            ${imageData ? '<button class="btn danger sm" id="mi-rmimg" type="button" style="margin:0">ลบรูป</button>' : ''}
          </div>
          <p class="hint">รูปจะถูกย่ออัตโนมัติ — ลูกค้าเห็นรูปนี้ตอนสั่งอาหาร</p>
        </div>
      </div>
      <div class="field"><label for="mi-name">ชื่อเมนู</label>
        <input class="tin" id="mi-name" maxlength="120" placeholder="เช่น ก๋วยเตี๋ยวต้มยำกุ้ง" value="${esc(it.name)}"></div>
      <div class="field"><label for="mi-price">ราคา (บาท)</label>
        <div class="input-prefix"><span class="pre">฿</span>
          <input class="tin" id="mi-price" type="number" inputmode="decimal" min="0" step="1" placeholder="0" value="${esc(it.price)}"></div>
      </div>
      <div class="field"><label>ไอคอนของเมนู (ใช้เมื่อไม่มีรูป)</label>
        <div class="emoji-pick" id="mi-emoji">
          ${EMOJI_CHOICES.map((em) => `<button type="button" data-em="${em}" class="${(!imageData && em === it.emoji) || (!existing && em === '🍕') ? 'on' : ''}">${em}</button>`).join('')}
        </div>
      </div>
      <div class="field"><label for="mi-stock">📦 สต็อกคงเหลือ (ไม่จำกัด = เว้นว่าง)</label>
        <input class="tin" id="mi-stock" type="number" inputmode="numeric" min="0" step="1" maxlength="6" placeholder="ไม่จำกัด" value="${it.stock != null ? esc(String(it.stock)) : ''}"></div>
      <div class="field">
        <div class="switch-row">
          <div class="sw-tx"><b>พร้อมขาย</b><small>ปิด = สินค้าหมด ลูกค้าสั่งไม่ได้</small></div>
          <label class="sw"><input type="checkbox" id="mi-avail" ${it.available ? 'checked' : ''}><span class="knob"></span></label>
        </div>
      </div>
      <p class="hint">💡 ถ้าตั้งสต็อกไว้ ระบบจะตัดยอดอัตโนมัติเมื่อมีออร์เดอร์ และปิดขายเองเมื่อหมด</p>
      <button class="btn primary block" id="mi-save" type="button">${existing ? 'บันทึกการแก้ไข' : 'เพิ่มเมนู'}</button>`,
  });

  md.body.querySelector('#mi-file').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      imageData = await readImageAsDataURI(file);
      const pv = md.body.querySelector('#mi-preview');
      pv.innerHTML = `<img src="${esc(imageData)}" alt="">`;
      if (!md.body.querySelector('#mi-rmimg')) {
        const rm = document.createElement('button');
        rm.className = 'btn danger sm'; rm.id = 'mi-rmimg'; rm.type = 'button';
        rm.textContent = 'ลบรูป'; rm.style.margin = '0';
        rm.addEventListener('click', () => {
          imageData = '';
          pv.innerHTML = '<span>🍽️</span>';
          rm.remove();
        });
        md.body.querySelector('.mi-photo-btns').appendChild(rm);
      }
      toast('ใส่รูปเรียบร้อย', 'ok');
    } catch (err) {
      toast(err.message, 'err');
    }
  });
  const rmBtn = md.body.querySelector('#mi-rmimg');
  if (rmBtn) rmBtn.addEventListener('click', () => {
    imageData = '';
    md.body.querySelector('#mi-preview').innerHTML = '<span>🍽️</span>';
    rmBtn.remove();
  });

  md.body.querySelector('#mi-emoji').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-em]');
    if (!b) return;
    $$('#mi-emoji button', md.body).forEach((x) => x.classList.toggle('on', x === b));
  });

  md.body.querySelector('#mi-save').addEventListener('click', async () => {
    const btn = md.body.querySelector('#mi-save');
    const name = md.body.querySelector('#mi-name').value.trim();
    const price = Number(md.body.querySelector('#mi-price').value);
    const emojiEl = md.body.querySelector('#mi-emoji button.on');
    if (!name) { toast('กรุณากรอกชื่อเมนู', 'err'); return; }
    if (!Number.isFinite(price) || price < 0) { toast('กรุณากรอกราคาให้ถูกต้อง', 'err'); return; }
    btn.disabled = true;
    try {
      const stockRaw = md.body.querySelector('#mi-stock').value.trim();
      if (stockRaw !== '' && (!/^\d+$/.test(stockRaw) || Number(stockRaw) > 100000)) {
        toast('สต็อกต้องเป็นจำนวนเต็ม 0 ขึ้นไป (เว้นว่าง = ไม่จำกัด)', 'err'); return;
      }
      const body = {
        name, price,
        emoji: emojiEl ? emojiEl.dataset.em : '🍽️',
        image: imageData,
        available: md.body.querySelector('#mi-avail').checked,
        stock: stockRaw === '' ? null : Number(stockRaw),
      };
      if (existing) {
        const r = await api(`/api/menu/${existing.id}`, { method: 'PUT', body });
        Object.assign(existing, r.item);
        toast(`บันทึกการแก้ไข “${r.item.name}” แล้ว`, 'ok');
      } else {
        const r = await api(`/api/shops/${state.vendor.shopId}/menu`, { method: 'POST', body });
        state.vendor.menu.push(r.item);
        toast(`เพิ่มเมนู “${r.item.name}” เรียบร้อย`, 'ok');
      }
      md.close();
      renderMenuTab();
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });
}

/* ── แท็บร้านของฉัน (โปรไฟล์ + ช่องทางติดต่อ) ── */
function renderVendorProfileTab() {
  const c = $('#pos-content');
  const s = state.vendor.shop;
  if (!c || !s) return;
  c.innerHTML = `
    <section class="set-card">
      <h3>🏪 ข้อมูลร้าน</h3>
      <p class="set-sub">ลูกค้าจะเห็นข้อมูลนี้ตอนเข้าดูร้านในแอปลูกค้า</p>
      <div class="field"><label for="vp-name">ชื่อร้าน</label>
        <input class="tin" id="vp-name" maxlength="120" value="${esc(s.name)}"></div>
      <div class="field"><label for="vp-emoji">อิโมจิประจำร้าน</label>
        <input class="tin" id="vp-emoji" maxlength="8" value="${esc(s.emoji)}"></div>
      <div class="field"><label for="vp-desc">คำอธิบายร้าน</label>
        <textarea class="tarea" id="vp-desc" maxlength="500">${esc(s.description)}</textarea></div>
      <div class="field">
        <div class="switch-row">
          <div class="sw-tx"><b>เปิดร้านรับออเดอร์</b><small>ปิดชั่วคราวได้เมื่อของหมดหรือครัวไม่พร้อม</small></div>
          <label class="sw"><input type="checkbox" id="vp-open" ${s.is_open ? 'checked' : ''}><span class="knob"></span></label>
        </div>
      </div>
      <button class="btn primary block" id="vp-save" type="button">บันทึกข้อมูลร้าน</button>
    </section>
    <section class="set-card">
      <h3>📞 ช่องทางติดต่อของร้าน</h3>
      <p class="set-sub">ลูกค้ากดปุ่มติดต่อคุณได้จากหน้าร้านในแอป</p>
      <div class="field"><label for="vp-phone">เบอร์โทร</label>
        <input class="tin" id="vp-phone" maxlength="32" placeholder="081-234-5678" value="${esc(s.phone)}"></div>
      <div class="field"><label for="vp-line">LINE ID</label>
        <input class="tin" id="vp-line" maxlength="60" placeholder="@ร้านของคุณ" value="${esc(s.line_id)}"></div>
      <div class="field"><label for="vp-wa">WhatsApp</label>
        <input class="tin" id="vp-wa" maxlength="32" placeholder="66812345678" value="${esc(s.whatsapp)}"></div>
      <div class="field"><label for="vp-fb">Facebook (เพจหรือลิงก์)</label>
        <input class="tin" id="vp-fb" maxlength="120" placeholder="ชื่อเพจ หรือ facebook.com/..." value="${esc(s.facebook)}"></div>
      <div class="field"><label for="vp-email">อีเมล</label>
        <input class="tin" id="vp-email" maxlength="120" placeholder="ร้าน@อีเมล.com" value="${esc(s.email)}"></div>
      <button class="btn gold block" id="vp-save2" type="button">บันทึกช่องทางติดต่อ</button>
    </section>`;
}

async function saveVendorProfile() {
  const s = state.vendor.shop;
  try {
    const r = await api(`/api/shops/${s.id}`, {
      method: 'PUT',
      body: {
        name: $('#vp-name').value,
        emoji: $('#vp-emoji').value,
        description: $('#vp-desc').value,
        is_open: $('#vp-open').checked,
        phone: $('#vp-phone').value,
        line_id: $('#vp-line').value,
        whatsapp: $('#vp-wa').value,
        facebook: $('#vp-fb').value,
        email: $('#vp-email').value,
      },
    });
    Object.assign(s, r.shop);
    toast('บันทึกข้อมูลร้านเรียบร้อย', 'ok');
    renderVendor();
  } catch (e) {
    toast(e.message, 'err');
  }
}

/* ═══════════════════════════════════════════════════════════
   บทบาทที่ 3 · 🛒 ลูกค้า (Customer)
   ═══════════════════════════════════════════════════════════ */
async function enterCustomer() {
  const cu = state.customer;
  viewEl.dataset.app = 'customer';
  renderCustomer();
  try {
    const data = await api('/api/markets');
    cu.markets = data.markets;
    if (cu.tab === 'browse') renderCustomer();
  } catch (e) { /* แสดง error ใน renderCustomer */ }
}

function switchCustomerTab(tab) {
  const cu = state.customer;
  /* แตะแท็บ "สั่งอาหาร" ซ้ำ (ตอนอยู่ใน browse อยู่แล้ว) = กลับไปรากรายการตลาด */
  if (tab === 'browse' && cu.tab === 'browse') {
    cu.marketId = null;
    cu.shopId = null;
  }
  cu.tab = tab;
  updateNavOn();
  overlayRoot.innerHTML = '';
  window.scrollTo(0, 0);
  renderCustomer();
}

function renderCustomer() {
  const cu = state.customer;
  viewEl.dataset.app = 'customer';
  if (cu.tab === 'orders') renderCustomerOrders();
  else if (cu.shopId) renderCustomerShop();
  else if (cu.marketId) renderCustomerMarket();
  else renderCustomerMarkets();
}

function customerHead(title, sub, extra = '') {
  return `
    <header class="pagehead">
      <div class="ph-top">
        ${extra}
        <div class="ph-title"><h2>${title}</h2><p>${sub}</p></div>
        ${roleBtnHTML()}
      </div>
    </header>`;
}

/* ── หน้ารวมตลาด ── */
function renderCustomerMarkets() {
  const cu = state.customer;
  if (!cu.mkFilter) cu.mkFilter = 'all';
  const filtered = (cu.markets || []).filter((mk) =>
    cu.mkFilter === 'all' ? true : (mk.market_type || 'night') === cu.mkFilter);
  viewEl.innerHTML = customerHead('เลือกตลาด', 'ดูตลาดที่เปิดวันนี้ แล้วเข้าไปสั่งอาหารจากร้านในตลาด');
  if (!cu.markets.length) {
    viewEl.innerHTML += `<div class="empty"><div class="e-emo">🏪</div><b>ยังไม่มีตลาดในระบบ</b><p>กรุณาลองใหม่ภายหลัง</p></div>`;
    return;
  }
  viewEl.innerHTML += `
    <div class="seg field-seg mk-filter" id="cu-mk-filter">
      <button type="button" data-f="all" class="${cu.mkFilter === 'all' ? 'on' : ''}">🏪 ทุกตลาด</button>
      <button type="button" data-f="day" class="${cu.mkFilter === 'day' ? 'on' : ''}">☀️ กลางวัน</button>
      <button type="button" data-f="night" class="${cu.mkFilter === 'night' ? 'on' : ''}">🌙 กลางคืน</button>
    </div>
    ${filtered.length ? '' : '<div class="empty"><div class="e-emo">🔎</div><b>ไม่มีตลาดประเภทนี้</b><p>ลองเลือกตัวกรองอื่นดูครับ</p></div>'}
    <div class="mk-grid cu">
      ${filtered.map((mk) => `
        <div class="mk-card" role="button" tabindex="0" data-cmk="${mk.id}">
          <span class="mkc-emo">${esc(mk.emoji)}</span>
          <div class="mkc-tx">
            <b>${esc(mk.name)} <span class="mtype ${mk.market_type || 'night'}">${(mk.market_type || 'night') === 'day' ? '☀️ กลางวัน' : '🌙 กลางคืน'}</span></b>
            <small>${esc(mk.area || '—')}</small>
            ${mk.address ? `<span class="mkc-meta">📍 ${esc(mk.address)}</span>` : ''}
            <span class="mkc-meta">🕒 ${esc(mk.schedule_text || mk.hours_text || '—')}</span>
            <span class="mkc-meta">${mk.shops_open}/${mk.shops_total} ร้านเปิด</span>
            ${(mk.lat != null && mk.lng != null) || mk.address ? `<a class="map-chip" data-maplink href="${mapsUrlOf(mk)}" target="_blank" rel="noopener">🗺 เปิดแผนที่ · นำทาง</a>` : ''}
          </div>
          <span class="open-badge ${mk.open_today ? 'on' : 'off'}">${mk.open_today ? 'เปิดวันนี้' : 'ปิดวันนี้'}</span>
        </div>`).join('')}
    </div>`;
  const flt = $('#cu-mk-filter');
  if (flt) flt.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-f]');
    if (!b) return;
    state.customer.mkFilter = b.dataset.f;
    renderCustomerMarkets();
  });
}

/* ── หน้าตลาด: ร้านค้าในตลาด ── */
async function renderCustomerMarket() {
  const cu = state.customer;
  const marketId = cu.marketId;
  const mk = cu.markets.find((x) => x.id === marketId);
  viewEl.innerHTML = customerHead(
    mk ? `${esc(mk.emoji)} ${esc(mk.name)}` : 'ตลาด',
    mk ? `${esc(mk.area || '')} · 🕒 ${esc(mk.schedule_text || mk.hours_text || '')}` : '',
    '<button class="back-btn" id="cu-back-markets" type="button" aria-label="กลับ">' + IC.back + '</button>'
  );
  if (mk && mk.announcement && String(mk.announcement).trim()) {
    viewEl.innerHTML += `<div class="notice-banner ann">📢 <b>ประกาศจากตลาด:</b> ${esc(mk.announcement)}</div>`;
  }
  if (mk && !mk.open_today) {
    viewEl.innerHTML += `<div class="notice-banner warn">🌙 ตลาดนี้ <b>ปิดทำการวันนี้</b> — เดินดูร้านและเมนูได้ แต่ยังสั่งอาหารไม่ได้</div>`;
  }
  if (mk && (mk.address || (mk.lat != null && mk.lng != null))) {
    const q = (mk.lat != null && mk.lng != null) ? `${mk.lat},${mk.lng}` : (mk.address || '');
    viewEl.innerHTML += `
    <div class="map-card">
      <div class="map-head">
        <div class="map-tx">
          <b>📍 ที่ตั้งตลาด</b>
          <small>${esc(mk.address || `พิกัด ${mk.lat}, ${mk.lng}`)}</small>
        </div>
      </div>
      <div class="map-actions">
        <a class="btn ghost sm" data-maplink href="${mapsUrlOf(mk)}" target="_blank" rel="noopener">🧭 เปิดแผนที่</a>
        <a class="btn primary sm" data-maplink href="${mapsUrlOf(mk, true)}" target="_blank" rel="noopener">🚗 นำทางถึงตลาด</a>
      </div>
      ${mk.lat != null && mk.lng != null ? (OFFLINE_BUILD ? `
      <a class="map-frame map-frame-link" data-maplink href="${mapsUrlOf(mk)}" target="_blank" rel="noopener" aria-label="เปิดแผนที่ ${esc(mk.name)}">
        <div class="map-fallback"><span class="mf-emo">🗺️</span><b>แผนที่ ${esc(mk.name)}</b><small>${mk.lat.toFixed(5)}, ${mk.lng.toFixed(5)}</small><small class="mf-tap">แตะเพื่อเปิดใน Google Maps</small></div>
      </a>` : `
      <div class="map-frame">
        <iframe src="https://maps.google.com/maps?q=${mk.lat},${mk.lng}&z=15&output=embed" title="แผนที่ ${esc(mk.name)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        <div class="map-fallback"><span>🗺️ ${esc(mk.name)}<br><small>${mk.lat.toFixed(5)}, ${mk.lng.toFixed(5)}</small></span></div>
      </div>`) : ''}
    </div>`;
  }
  viewEl.innerHTML += `<div id="cu-shops" class="shop-grid"><div class="skel" style="height:110px"></div><div class="skel" style="height:110px"></div></div>`;
  try {
    const data = await api(`/api/shops?market_id=${marketId}`);
    if (state.role !== 'customer' || cu.marketId !== marketId || cu.shopId) return; /* ผู้ใช้ไปหน้าอื่นแล้ว */
    const box = $('#cu-shops');
    if (!box) return;
    if (!data.shops.length) {
      box.innerHTML = `<div class="empty"><div class="e-emo">🍽️</div><b>ยังไม่มีร้านค้าในตลาดนี้</b></div>`;
      return;
    }
    box.innerHTML = data.shops.map((s) => `
      <button class="shop-card" data-cshop="${s.id}" type="button">
        <span class="sc-emo">${esc(s.emoji)}</span>
        <div class="sc-tx">
          <b>${esc(s.name)}</b>
          <small>${esc(CAT_TH[s.category] || s.category)}${s.lot_code ? ' · ล็อค ' + esc(s.lot_code) : ''}</small>
          <span class="sc-meta">${s.menu_count} รายการในเมนู</span>
        </div>
        <span class="open-badge ${s.is_open ? 'on' : 'off'}">${s.is_open ? 'เปิดอยู่' : 'ปิดอยู่'}</span>
      </button>`).join('');
  } catch (e) {
    const box = $('#cu-shops');
    if (box) box.innerHTML = `<div class="err-banner"><b>โหลดร้านค้าไม่สำเร็จ</b>${esc(e.message)}</div>`;
  }
}

/* ── หน้าร้าน: ข้อมูล + ช่องทางติดต่อ + เมนู ── */
async function renderCustomerShop() {
  const cu = state.customer;
  const shopId = cu.shopId;
  viewEl.innerHTML = customerHead('ร้านค้า', 'กำลังโหลด…',
    '<button class="back-btn" id="cu-back-market" type="button" aria-label="กลับ">' + IC.back + '</button>');
  let s;
  try {
    const data = await api(`/api/shops/${shopId}`);
    s = data.shop;
    cu.shop = s;
  } catch (e) {
    cu.shopId = null;
    renderCustomer();
    toast(e.message, 'err');
    return;
  }
  if (state.role !== 'customer' || cu.shopId !== shopId) return; /* ผู้ใช้กดกลับไปแล้ว */
  const menuData = await api(`/api/shops/${shopId}/menu`).catch(() => ({ items: [] }));
  if (state.role !== 'customer' || cu.shopId !== shopId) return;
  cu.menu = menuData.items;

  const canOrder = s.market_open && s.is_open;
  const waLink = (num) => `https://wa.me/${num.replace(/[^\d]/g, '')}`;
  const fbLink = (f) => /^https?:\/\//.test(f) ? f : `https://facebook.com/${f}`;
  const lineLink = (l) => `https://line.me/R/ti/p/~${l.replace(/^@/, '')}`;

  viewEl.innerHTML = `
    <header class="pagehead">
      <div class="ph-top">
        <button class="back-btn" id="cu-back-market" type="button" aria-label="กลับ">${IC.back}</button>
        <div class="ph-title">
          <h2>${esc(s.emoji)} ${esc(s.name)}</h2>
          <p>${esc(s.market_name || '')}${s.lot_code ? ' · ล็อค ' + esc(s.lot_code) : ''} · ${esc(s.market_hours || '')}</p>
        </div>
        ${roleBtnHTML()}
      </div>
    </header>

    <div class="shop-hero">
      <div class="sh-row">
        <p class="sh-desc">${esc(s.description || 'ยังไม่มีคำอธิบายร้าน')}</p>
        <span class="open-badge ${s.is_open ? 'on' : 'off'}">${s.is_open ? 'เปิดอยู่' : 'ปิดอยู่'}</span>
      </div>
      ${s.phone || s.line_id || s.whatsapp || s.facebook || s.email ? `
      <div class="contact-row">
        ${s.phone ? `<a class="ct-btn ct-call" href="tel:${esc(s.phone)}" target="_blank" rel="noopener">${IC.phone} โทร</a>` : ''}
        ${s.line_id ? `<a class="ct-btn ct-line" href="${esc(lineLink(s.line_id))}" target="_blank" rel="noopener">💬 LINE</a>` : ''}
        ${s.whatsapp ? `<a class="ct-btn ct-wa" href="${esc(waLink(s.whatsapp))}" target="_blank" rel="noopener">🟢 WhatsApp</a>` : ''}
        ${s.facebook ? `<a class="ct-btn ct-fb" href="${esc(fbLink(s.facebook))}" target="_blank" rel="noopener">📘 Facebook</a>` : ''}
        ${s.email ? `<a class="ct-btn ct-mail" href="mailto:${esc(s.email)}" target="_blank" rel="noopener">✉️ อีเมล</a>` : ''}
      </div>` : '<div class="contact-row none">ร้านยังไม่ได้ใส่ช่องทางติดต่อ</div>'}
    </div>

    ${s.market_schedule ? `<div class="mk-schedule-line">🕒 ตารางตลาด: <b>${esc(s.market_schedule)}</b>${(s.market_lat != null && s.market_lng != null) || s.market_address ? ` · <a class="map-chip" data-maplink href="${mapsUrlOf({ lat: s.market_lat, lng: s.market_lng, address: s.market_address })}" target="_blank" rel="noopener">🗺 แผนที่ตลาด</a>` : ''}</div>` : ''}
    ${!canOrder ? `<div class="notice-banner warn">${!s.market_open ? '🌙 ตลาดนี้ปิดทำการวันนี้ — ดูเมนูได้ แต่ยังสั่งไม่ได้' : '🔴 ร้านนี้ปิดอยู่ในขณะนี้ — ดูเมนูได้ แต่ยังสั่งไม่ได้'}</div>` : ''}

    <h3 class="sec-title">🍕 เมนูของร้าน</h3>
    ${cu.menu.length ? `
    <div class="menu-grid cu">
      ${cu.menu.map((it) => {
        const qty = (cu.carts[cu.shopId] || {})[it.id] || 0;
        const itemOrderable = canOrder && it.available;
        const visual = it.image
          ? `<span class="mc-img"><img src="${esc(it.image)}" alt=""></span>`
          : `<span class="mc-emo">${esc(it.emoji)}</span>`;
        return `
        <div class="menu-card cmenu ${it.available ? '' : 'off'}" data-id="${it.id}">
          ${it.available ? '' : '<span class="mc-off-tag">สินค้าหมด</span>'}
          ${it.stock != null ? `<span class="mc-stock ${it.stock === 0 ? 'zero' : it.stock <= 3 ? 'low' : ''}">${it.stock === 0 ? 'หมดสต็อก' : 'เหลือ ' + it.stock + ' ชิ้น'}</span>` : ''}
          ${visual}
          <span class="mc-name">${esc(it.name)}</span>
          <span class="mc-price">${baht(it.price)}</span>
          ${itemOrderable ? `
            <div class="mc-qty">
              <button class="mc-step" type="button" data-cadd="minus" data-id="${it.id}" ${qty ? '' : 'disabled'} aria-label="ลด">−</button>
              <span class="mc-n num">${qty}</span>
              <button class="mc-step plus" type="button" data-cadd="plus" data-id="${it.id}" aria-label="เพิ่ม">+</button>
            </div>` : (it.available ? '' : '')}
        </div>`;
      }).join('')}
    </div>` : `<div class="empty"><div class="e-emo">🍽️</div><b>ร้านยังไม่มีเมนู</b><p>ลองกลับมาใหม่ภายหลังนะ</p></div>`}
    <div class="pos-cartbar" id="cu-cartbar" hidden>
      <div class="cb-tx"><small id="cu-count"></small><b class="num" id="cu-total"></b></div>
      <button class="btn gold" id="cu-open" type="button">🛒 ดูตะกร้า</button>
    </div>`;
  updateCustomerCartUI();
}

/* ตะกร้าของลูกค้า (แยกตามร้าน) */
function customerCartEntries() {
  const cu = state.customer;
  const cart = cu.carts[cu.shopId] || {};
  return Object.entries(cart)
    .map(([id, qty]) => ({ item: cu.menu.find((m) => m.id === Number(id)), qty }))
    .filter((e) => e.item);
}

function adjustCustomerCart(id, delta) {
  const cu = state.customer;
  const cart = cu.carts[cu.shopId] = cu.carts[cu.shopId] || {};
  const next = Math.max(0, Math.min(99, (cart[id] || 0) + delta));
  if (next === 0) delete cart[id]; else cart[id] = next;
  updateCustomerCartUI();
}

function updateCustomerCartUI() {
  const cu = state.customer;
  const entries = customerCartEntries();
  const count = entries.reduce((s, e) => s + e.qty, 0);
  const total = entries.reduce((s, e) => s + e.item.price * e.qty, 0);
  $$('#view .cmenu').forEach((card) => {
    const id = Number(card.dataset.id);
    const qty = (cu.carts[cu.shopId] || {})[id] || 0;
    const n = card.querySelector('.mc-n');
    if (n) n.textContent = qty;
    const minus = card.querySelector('[data-cadd="minus"]');
    if (minus) minus.disabled = qty === 0;
  });
  const bar = $('#cu-cartbar');
  if (bar) {
    bar.hidden = count === 0;
    const cb = $('#cu-count'); const ct = $('#cu-total');
    if (cb) cb.textContent = `${count} รายการ`;
    if (ct) ct.textContent = baht(total);
  }
}

function openCustomerCartSheet() {
  const cu = state.customer;
  const entries = customerCartEntries();
  if (!cu.shop) return;
  const md = openModal({
    title: 'ยืนยันออเดอร์',
    sub: `${cu.shop.emoji} ${cu.shop.name}`,
    icon: IC.cart,
    className: 'cart-sheet cu-cart-region',
    body: `
      <div class="pc-lines">${entries.map(({ item, qty }) => `
        <div class="cart-line">
          <div class="cl-name"><b>${esc(item.emoji)} ${esc(item.name)}</b><small>${baht(item.price)} × ${qty}</small></div>
          <div class="cl-qty">
            <button type="button" data-cadd="minus" data-id="${item.id}" aria-label="ลด">−</button>
            <b>${qty}</b>
            <button type="button" data-cadd="plus" data-id="${item.id}" aria-label="เพิ่ม">+</button>
          </div>
          <span class="cl-amt">${baht(item.price * qty)}</span>
        </div>`).join('')}</div>
      <div class="cart-total"><span>รวมทั้งหมด</span><b class="cu-total num">${baht(entries.reduce((s, e) => s + e.item.price * e.qty, 0))}</b></div>
      <div class="field"><label for="cu-name">ชื่อของคุณ (ร้านใช้เรียกเมื่ออาหารพร้อม)</label>
        <input class="tin" id="cu-name" maxlength="80" placeholder="เช่น พี่บอล / คุณสมหญิง" value="${state.user ? esc(state.user.display_name) : ''}"></div>
      <div class="field"><label for="cu-contact">${state.user ? 'เบอร์โทร (ไม่บังคับ — ร้านติดต่อกลับได้)' : 'เบอร์โทร <span class="req">*</span>(จำเป็น — ร้านใช้ติดต่อเมื่ออาหารพร้อม)'}</label>
        <input class="tin" id="cu-contact" maxlength="60" inputmode="tel" placeholder="08x-xxx-xxxx" value="${state.user && state.user.phone && state.user.phone !== state.user.login ? esc(state.user.phone) : (state.user && state.user.role === 'customer' ? esc(state.user.login) : '')}"></div>
      <div class="field"><label for="cu-note">หมายเหตุถึงร้าน</label>
        <input class="tin" id="cu-note" maxlength="300" placeholder="เช่น ไม่ใส่หัวหอม หวานน้อย"></div>
      ${state.user ? '' : `<p class="hint">🚀 <b>สั่งเป็นแขกได้เลย</b> — กรอกชื่อ + เบอร์โทรจริงก็ส่งได้ทันที หรือ <button class="linklike" data-cu="auth" type="button">เข้าสู่ระบบ</button> เพื่อเก็บประวัติออเดอร์ทุกร้านไว้ดูย้อนหลัง</p>`}
      <button class="btn primary block cu-submit" type="button">🚀 ส่งออเดอร์ถึงร้าน${state.user ? '' : ' (เป็นแขก)'}</button>`,
  });

  md.body.querySelector('[data-cu="auth"]') && md.body.querySelector('[data-cu="auth"]').addEventListener('click', () => {
    md.close();
    openAuthGate(() => { if (!state.user) return; openCustomerCartSheet(); });
  });
  md.body.querySelector('.cu-submit').addEventListener('click', async () => {
    const btn = md.body.querySelector('.cu-submit');
    const name = md.body.querySelector('#cu-name').value.trim();
    const entries2 = customerCartEntries();
    if (!entries2.length) { toast('ยังไม่ได้เลือกรายการอาหาร', 'err'); return; }
    if (!name || name.length < 2) { toast('กรุณากรอกชื่อของคุณ (ร้านใช้เรียกตอนอาหารพร้อม)', 'err'); return; }
    const phoneRaw = md.body.querySelector('#cu-contact').value.trim();
    /* แขก: ต้องมีเบอร์โทรจริง — กันสั่งแล้วหาย / ไม่มารับ */
    let guestPhone = '';
    if (!state.user) {
      guestPhone = normalizeThaiPhone(phoneRaw);
      if (!guestPhone) { toast('กรุณากรอกเบอร์โทรที่ถูกต้อง เช่น 0812345678 — เพื่อให้ร้านติดต่อคุณได้จริง', 'err'); return; }
    }
    btn.disabled = true;
    try {
      const r = await api('/api/orders', {
        method: 'POST',
        body: {
          shop_id: cu.shopId,
          customer_name: name,
          customer_contact: state.user ? phoneRaw : guestPhone,
          guest_phone: guestPhone,
          note: md.body.querySelector('#cu-note').value.trim(),
          items: entries2.map(({ item, qty }) => ({ menu_item_id: item.id, qty })),
        },
      });
      delete cu.carts[cu.shopId];
      md.close();
      if (!state.user) {
        /* แขก: เก็บรหัสติดตามไว้ในเครื่องนี้ */
        saveGuestOrder({ id: r.id, token: r.track_token, shop: cu.shop.name, total: Number(r.total), ts: Date.now() });
        toast(`🎉 ส่งออเดอร์ #${r.id} ถึงร้านแล้ว (ยอด ${baht(r.total)}) — ติดตามสถานะได้เลย`, 'ok');
        beep('new');
        switchCustomerTab('orders');
        openGuestUpsell(name, guestPhone);
        return;
      }
      toast(`🎉 ส่งออเดอร์ #${r.id} ถึงร้านแล้ว (ยอด ${baht(r.total)}) — ติดตามสถานะได้เลย`, 'ok');
      beep('new');
      switchCustomerTab('orders');
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });
}

/* ── การ์ดออร์เดอร์ของฉัน (สมาชิก + แขก ใช้ร่วมกัน) ── */
function myOrderCardHTML(o, events, isGuest, gToken) {
  return `
      <div class="myo-card" data-id="${o.id}">
        <div class="myo-top">
          <span class="myo-shop">${esc(o.shop_emoji)} ${esc(o.shop_name)} <small>· ออร์เดอร์ #${o.id} · ${esc(o.market_name || '')}${(isGuest || o.is_guest) ? ' · แขก' : ''}</small></span>
          <span class="st-chip st-${o.status}">${STATUS_CU[o.status]}</span>
        </div>
        <div class="myo-items">
          ${(o.items || []).map((i) => `<span class="myo-item">${esc(i.emoji)} ${esc(i.name)} ×${i.qty}</span>`).join('')}
        </div>
        ${o.note ? `<div class="myo-note">📝 ${esc(o.note)}</div>` : ''}
        <div class="myo-foot">
          <span class="myo-time">สั่งเมื่อ ${timeAgo(o.created_at)}</span>
          ${isGuest && gToken ? `<span class="myo-track">🔑 รหัสติดตาม <code>${esc(gToken)}</code><button class="linklike" data-copy="${esc(gToken)}" type="button">คัดลอก</button></span>` : ''}
          ${o.status === 'completed' && o.shop_id ? `<button class="linklike myo-reorder" data-reorder="${o.id}" type="button">🔁 สั่งอีกครั้ง</button>` : ''}
          <b class="num">${baht(o.total)}</b>
        </div>
        <div class="ev-track mini">
          ${events.map((ev, i, arr) => `
            <div class="ev-node ${i === arr.length - 1 ? 'now' : 'done'}">
              <span class="ev-dot"></span>
              <div class="ev-tx"><b>${esc(STATUS_CU[ev.status] || ev.status)}</b><small>${esc(ev.text)} · ${fmtTime(ev.created_at)} น.</small></div>
            </div>`).join('')}
        </div>
      </div>`;
}

/* แจ้งเตือนสถานะออเดอร์: toast + เสียง + แจ้งเตือนระบบ (ถ้าอนุญาต) */
function notifyOrderStatus(o) {
  const label = STATUS_CU[o.status] || o.status;
  toast(o.status === 'completed'
    ? `✅ ออร์เดอร์ #${o.id} เสร็จสิ้นแล้ว — ขอบคุณค่ะ`
    : `🔔 ออร์เดอร์ #${o.id} (${o.shop_name}): ${label}`, 'ok');
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const nt = (s) => (window.TS && TS.translate ? TS.translate(s) : s);
      new Notification(nt('TalatSuite — อัปเดตออเดอร์'), {
        body: nt(o.status === 'completed'
          ? `ออร์เดอร์ #${o.id} จาก ${o.shop_name} เสร็จสิ้นแล้ว — ขอบคุณที่ใช้บริการ`
          : `ออร์เดอร์ #${o.id} จาก ${o.shop_name} → ${label}`),
        tag: 'ts-order-' + o.id,
      });
    }
  } catch (e) { /* Notification ใช้ไม่ได้ในบางสภาพแวดล้อม */ }
}
async function askNotifyPermission() {
  try {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'default') await Notification.requestPermission();
    return Notification.permission === 'granted';
  } catch (e) { return false; }
}

/* ── เสนอสมัครหลังสั่งเป็นแขก (สมัครฟรี 1 แตะ) ── */
function openGuestUpsell(name, phone) {
  setTimeout(() => {
    if (state.user) return;
    const md = openModal({
      title: 'อยากเก็บประวัติออเดอร์ไหม?',
      sub: 'สมัครฟรีด้วยเบอร์เดิม — ประวัติ/สถานะ/แต้มถูกเก็บทุกร้าน',
      icon: '🎁',
      className: 'guest-upsell',
      body: `
        <div class="hint" style="padding:2px 2px 10px">ตั้งรหัสผ่าน 4 ตัวขึ้นไป — เบอร์ <b>${esc(phone)}</b> พร้อมใช้แล้ว</div>
        <div class="field"><label for="gu-pass">รหัสผ่าน (4 ตัวขึ้นไป)</label>
          <input class="tin" id="gu-pass" type="password" maxlength="100" placeholder="••••••••"></div>
        <button class="btn gold block" id="gu-go" type="button">📝 สมัครสมาชิก (เบอร์นี้)</button>
        <button class="btn ghost block" id="gu-no" type="button" style="margin-top:8px">ไว้คราวหน้า</button>`,
    });
    md.body.querySelector('#gu-no').addEventListener('click', () => md.close());
    md.body.querySelector('#gu-go').addEventListener('click', async () => {
      const btn = md.body.querySelector('#gu-go');
      const pw = md.body.querySelector('#gu-pass').value;
      if (!pw || pw.length < 4) return toast('ตั้งรหัสผ่านอย่างน้อย 4 ตัว', 'err');
      try {
        btn.disabled = true;
        const r = await api('/api/auth/register', {
          method: 'POST',
          body: { role: 'customer', display_name: name, login: phone, password: pw },
        });
        setSession(r.token, r.user);
        md.close();
        toast(`ยินดีต้อนรับสมาชิกใหม่ ${r.user.display_name}! 🎉`, 'ok');
        renderSideUser();
        renderCustomerOrders({ silent: true });
      } catch (e) {
        toast(e.message, 'err');
        btn.disabled = false;
      }
    });
  }, 1200);
}

/* ── หน้าออเดอร์ของฉัน ── */
async function renderCustomerOrders({ silent = false } = {}) {
  const cu = state.customer;
  if (!silent) {
    viewEl.innerHTML = customerHead('ออเดอร์ของฉัน', 'ติดตามสถานะออเดอร์แบบเรียลไทม์ — ร้านอัปเดตทุกขั้นตอน',
      '<button class="head-ic" id="cu-notify-btn" type="button" title="เปิดแจ้งเตือนออร์เดอร์" aria-label="เปิดแจ้งเตือนออร์เดอร์">🔔</button>');
    const nb = $('#cu-notify-btn');
    if (nb) {
      const paint = () => {
        const on = typeof Notification !== 'undefined' && Notification.permission === 'granted';
        nb.classList.toggle('on', on);
        nb.textContent = on ? '🔔' : '🔕';
        nb.title = on ? 'แจ้งเตือนออร์เดอร์เปิดอยู่' : 'เปิดแจ้งเตือนเมื่ออาหารพร้อม';
      };
      paint();
      nb.addEventListener('click', async () => {
        const ok = await askNotifyPermission();
        paint();
        toast(ok ? '🔔 เปิดแจ้งเตือนแล้ว — จะแจ้งเมื่อออร์เดอร์พร้อม/เสร็จสิ้น' : 'ไม่ได้รับสิทธิ์แจ้งเตือน (ยังดูสถานะในแอปได้ตามปกติ)', ok ? 'ok' : 'err');
      });
    }
    viewEl.innerHTML += `<div id="cu-orders"><div class="skel" style="height:130px;margin-bottom:10px"></div><div class="skel" style="height:130px"></div></div>`;
  } else if (!$('#cu-orders')) return;
  /* ดูออเดอร์ของฉัน = ต้องเป็นสมาชิก (ยืนยันตัวตนด้วยเบอร์โทร) */
  /* ไม่ได้ล็อกอิน: แขกดูออเดอร์ที่เคยสั่งจากเครื่องนี้ได้ (track ด้วยรหัสในเครื่อง) */
  if (!state.user) {
    const box = $('#cu-orders');
    if (!box) return;
    const gList = loadGuestOrders().filter((g) => g.id && g.token);
    if (!gList.length) {
      box.innerHTML = `
        <div class="empty">
          <div class="e-emo" aria-hidden="true">📱</div>
          <b>ออเดอร์ของฉัน</b>
          <p>สั่งเป็นแขกได้เลย (กรอกชื่อ + เบอร์โทร) — สถานะจะแสดงที่หน้านี้บนเครื่องนี้<br>หรือเข้าสู่ระบบเพื่อเก็บประวัติออเดอร์ทุกร้านแบบถาวร</p>
          <div class="es-actions">
            <button class="btn primary" data-start="login" type="button">🔑 เข้าสู่ระบบ</button>
            <button class="btn ghost" data-start="register" type="button">📝 สมัครฟรีด้วยเบอร์โทร</button>
          </div>
        </div>`;
      return;
    }
    /* ดึงสถานะล่าสุดของออร์เดอร์แขกทีละรายการ */
    const fetched = await Promise.all(gList.map((g) =>
      api(`/api/orders/track/${g.id}?token=${encodeURIComponent(g.token)}`)
        .then((r) => ({ o: r.order, events: r.events || [], token: g.token }))
        .catch(() => null)
    ));
    const rows = fetched.filter(Boolean);
    if (cu.guestStatus) {
      for (const { o } of rows) {
        const prev = cu.guestStatus[o.id];
        if (prev && prev !== o.status) { beep('status'); notifyOrderStatus(o); }
      }
    }
    cu.guestStatus = {};
    rows.forEach(({ o }) => { cu.guestStatus[o.id] = o.status; });
    const active = rows.filter((r) => r.o.status !== 'completed').length;
    box.innerHTML = `
      <div class="notice-banner guest">👤 โหมดแขก — แสดงออร์เดอร์ที่สั่งจากเครื่องนี้ (ไม่มีบัญชี) · <button class="linklike" data-start="login" type="button">เข้าสู่ระบบเก็บประวัติถาวร</button></div>
      ${active ? `<div class="notice-banner ok"><b>${active}</b> ออร์เดอร์กำลังดำเนินการ — หน้านี้อัปเดตสถานะอัตโนมัติ</div>` : ''}
      ${rows.map(({ o, events, token }) => myOrderCardHTML(o, events, true, token)).join('')}`;
    cu.lastOrders = rows.map(({ o }) => o);
    return;
  }
  try {
    const data = await api('/api/orders/mine');
    cu.myOrders = data.orders;

    /* แจ้งเตือนเมื่อสถานะเปลี่ยน (ไม่ใช่รอบแรก) */
    if (cu.knownStatus) {
      for (const o of cu.myOrders) {
        const prev = cu.knownStatus[o.id];
        if (prev && prev !== o.status) { beep('status'); notifyOrderStatus(o); }
      }
    }
    cu.knownStatus = {};
    cu.myOrders.forEach((o) => { cu.knownStatus[o.id] = o.status; });

    const box = $('#cu-orders');
    if (!box) return;
    if (!cu.myOrders.length) {
      box.innerHTML = `
        <div class="empty"><div class="e-emo">🛒</div><b>ยังไม่มีออเดอร์</b>
          <p>เลือกตลาดและร้านโปรด แล้วสั่งอาหารสด ๆ ได้เลย</p>
          <div style="margin-top:14px"><button class="btn gold" id="cu-go-browse" type="button">เริ่มสั่งอาหาร</button></div>
        </div>`;
      return;
    }
    const active = cu.myOrders.filter((o) => o.status !== 'completed').length;
    box.innerHTML = `
      ${active ? `<div class="notice-banner ok"><b>${active}</b> ออร์เดอร์กำลังดำเนินการ — หน้านี้อัปเดตสถานะอัตโนมัติ</div>` : ''}
      ${cu.myOrders.map((o) => myOrderCardHTML(o, o.events || [], false)).join('')}`;
    cu.lastOrders = cu.myOrders;
  } catch (e) {
    if (!silent) {
      const box = $('#cu-orders');
      if (box) box.innerHTML = `<div class="err-banner"><b>โหลดออเดอร์ไม่สำเร็จ</b>${esc(e.message)}</div>`;
    }
  }
}

/* ── สั่งอีกครั้ง: เติมรายการเดิมลงตะกร้า (เฉพาะที่ยังมีในเมนู) แล้วพาไปหน้าร้าน ── */
async function reorderFrom(o) {
  const cu = state.customer;
  try {
    const [data, menuData] = await Promise.all([
      api(`/api/shops/${o.shop_id}`),
      api(`/api/shops/${o.shop_id}/menu`).catch(() => ({ items: [] })),
    ]);
    const s = data.shop;
    const ids = new Set(menuData.items.map((it) => it.id));
    const cart = {};
    let gone = 0;
    (o.items || []).forEach((it) => {
      if (it.menu_item_id && ids.has(it.menu_item_id)) cart[it.menu_item_id] = (cart[it.menu_item_id] || 0) + it.qty;
      else gone++;
    });
    const n = Object.values(cart).reduce((a, b) => a + b, 0);
    if (n) {
      cu.carts[o.shop_id] = cart;
      toast(`🔁 เติม ${n} รายการเดิมลงตะกร้าแล้ว${gone ? ` (${gone} รายการถูกถอดจากเมนูแล้ว)` : ''} — ตรวจแล้วกดส่งได้เลย`, 'ok');
    } else {
      toast('เมนูเปลี่ยนไปจากออเดอร์เดิม — เลือกใหม่ในหน้าร้านได้เลย', 'err');
    }
    cu.marketId = s.market_id; /* ปุ่มกลับจะพากลับไปหน้าร้านในตลาดเดิม */
    cu.shopId = o.shop_id;
    renderCustomerShop();
  } catch (e) { toast(e.message, 'err'); }
}

/* ═══════════════════════════════════════════════════════════
   Health check + polling + init
   ═══════════════════════════════════════════════════════════ */
async function checkHealth() {
  let ok = false;
  try {
    const r = await api('/api/health');
    ok = !!r.db;
  } catch { ok = false; }
  const side = $('#db-chip-side');
  if (side) {
    side.className = 'db-chip ' + (ok ? 'ok' : 'err');
    side.querySelector('.tx').textContent = ok ? 'เชื่อมต่อ PostgreSQL แล้ว' : 'ฐานข้อมูลออฟไลน์';
  }
  const head = $('#db-chip-head');
  if (head) {
    head.innerHTML = `<span class="dot" style="background:${ok ? '#7dffa8' : '#ff8d80'}"></span>${ok ? 'ออนไลน์' : 'ออฟไลน์'}`;
  }
}

/* รีเฟรชเบา ๆ เพื่อความ "เรียลไทม์" */
setInterval(() => {
  if (document.visibilityState !== 'visible') return;
  if (dragCtx && dragCtx.active) return;
  if (overlayRoot.children.length) return;
  if (state.role === 'vendor' && state.vendor.shopId) {
    loadVendorData({ silent: true });
  } else if (state.role === 'customer' && state.customer.tab === 'orders') {
    renderCustomerOrders({ silent: !!$('#cu-orders') });
  }
}, 6000);

setInterval(checkHealth, 30000);
window.addEventListener('focus', () => {
  if (dragCtx && dragCtx.active) return;
  if (state.role === 'manager' && state.manager.tab === 'home') loadMarket();
  else if (state.role === 'vendor' && state.vendor.shopId) loadVendorData({ silent: true });
  else if (state.role === 'customer' && state.customer.tab === 'orders') renderCustomerOrders({ silent: !!$('#cu-orders') });
  if (state.role === 'admin' || state.role === 'manager') refreshAppBadge();
});

window.addEventListener('hashchange', () => {
  const target = location.hash.replace('#/', '') || 'start';
  if (['manager', 'vendor', 'customer'].includes(target) && target !== state.role) {
    chooseRole(target);
  } else if (target === 'start' && state.role) {
    showStart();
  }
});

/* ── ย้อนกลับกลาง (v4.1) — ใช้ทั้งปุ่มฮาร์ดแวร์ Android, ปุ่ม Esc และ WebView bridge ──
   ลำดับ: ปิดชีตที่เปิดอยู่ → ออกจากหน้าล็อกอิน → ถอยหลังมุมมองลูกค้า (ร้าน→ตลาด→รายการ)
   → กลับคอนโซลแอดมิน (ถ้าแอดมินมามุมมองอื่น) → กลับหน้าหลัก
   คืน true ถ้าจัดการเองแล้ว / false ถ้าไม่มีอะไรให้ถอย */
function appBack() {
  const lock = $('#lock-screen');
  if (lock && !lock.hidden) return true; /* ล็อคหน้าจออยู่ — ต้องปลดล็อคก่อน */
  const sheets = $$('.modal-backdrop');
  if (sheets.length) {
    const x = sheets[sheets.length - 1].querySelector('.x-btn');
    if (x) x.click();
    return true;
  }
  if ($('#lg-go')) { showStart(); return true; } /* หน้าล็อกอินเต็มจอ */
  if (state.role === 'customer' && state.customer.tab === 'browse') {
    const cu = state.customer;
    if (cu.shopId) {
      const b = $('#cu-back-market');
      if (b) { b.click(); return true; }
    } else if (cu.marketId) {
      const b = $('#cu-back-markets');
      if (b) { b.click(); return true; }
    }
  }
  if (state.role === 'manager' && !state.manager.marketId && state.user && state.user.role === 'admin') {
    chooseRole('admin'); return true; /* แอดมินที่เข้าไปดูหน้าเลือกตลาด */
  }
  if (state.role === 'vendor' && !state.vendor.shopId && state.user && state.user.role === 'admin') {
    chooseRole('admin'); return true; /* แอดมินที่เข้าไปดูหน้าเลือกร้าน */
  }
  if (state.user && state.user.role === 'admin' && state.role !== 'admin') {
    chooseRole('admin'); return true; /* แอดมินที่ทดสอบมุมมองอื่น */
  }
  if (state.role) { showStart(); return true; }
  return false;
}
window.appBack = appBack;
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const t = e.target;
  if (t && t.matches && t.matches('input, textarea, select')) return;
  appBack();
});

/* ปุ่มนำทาง + central event delegation (ผูกครั้งเดียว กัน listener ซ้ำ) */
$('#side-nav').addEventListener('click', (e) => {
  if (e.target.closest('[data-nav="__home"]')) { showStart(); return; }
  const b = e.target.closest('.nav-pad');
  if (!b) return;
  if (state.role === 'manager') switchManagerTab(b.dataset.nav);
  else if (state.role === 'vendor') switchVendorTab(b.dataset.nav);
  else if (state.role === 'customer') switchCustomerTab(b.dataset.nav);
  else if (state.role === 'admin') switchAdminTab(b.dataset.nav);
});
$('#bottombar').addEventListener('click', (e) => {
  if (e.target.closest('[data-nav="__home"]')) { showStart(); return; }
  const b = e.target.closest('.bb-pad');
  if (!b) return;
  if (state.role === 'manager') switchManagerTab(b.dataset.nav);
  else if (state.role === 'vendor') switchVendorTab(b.dataset.nav);
  else if (state.role === 'customer') switchCustomerTab(b.dataset.nav);
  else if (state.role === 'admin') switchAdminTab(b.dataset.nav);
});
$('#side-user').addEventListener('click', (e) => {
  /* แตะกล่องผู้ใช้ (ไม่ใช่ปุ่มออกจากระบบ) → เปิดชีตบัญชี */
  if (!e.target.closest('[data-rolebtn]') && e.target.closest('.side-user')) { openAccountSheet(); return; }
  const b = e.target.closest('[data-rolebtn]');
  if (!b) return;
  if (b.dataset.rolebtn === 'logout') doLogout();
  else if (b.dataset.rolebtn === 'login') openLoginScreen();
});

/* ── คอนโซลแอดมิน: ปุ่มต่างๆ ── */
document.addEventListener('click', async (e) => {
  const adm = e.target.closest('[data-adm]');
  if (adm) {
    const a = adm.dataset.adm;
    if (a === 'goto-markets') switchAdminTab('markets');
    else if (a === 'goto-customers') switchAdminTab('customers');
    else if (a === 'new-market') openMarketCreateSheet();
    else if (a === 'new-user') openAdminUserSheet(null);
    return;
  }
  const flt = e.target.closest('[data-adm-filter]');
  if (flt) {
    state.admin.userFilter = flt.dataset.admFilter;
    renderAdminUsers();
    return;
  }
  const mkBtn = e.target.closest('[data-adm-mk]');
  if (mkBtn) {
    /* เข้าไปจัดการตลาดนี้ (มุมมองผู้จัดการ) */
    state.manager.marketId = Number(mkBtn.dataset.admMk);
    state.manager.tab = 'home';
    store.set('talatsuite.market', String(state.manager.marketId));
    chooseRole('manager');
    return;
  }
  const mgrBtn = e.target.closest('[data-adm-mgr]');
  if (mgrBtn) {
    /* สร้าง/ดูบัญชีผจก. ของตลาดนี้ */
    const mid = Number(mgrBtn.dataset.admMgr);
    const u = (state.admin.users || []).find((x) => x.role === 'manager' && Number(x.market_id) === mid);
    if (u) openAdminUserSheet(u);
    else openAdminUserSheet(null, mid);
    return;
  }
  const delMk = e.target.closest('[data-adm-del]');
  if (delMk) {
    confirmDeleteMarket(Number(delMk.dataset.admDel), delMk.dataset.name || 'ตลาดนี้');
    return;
  }
  const editU = e.target.closest('[data-adm-edit]');
  if (editU) {
    const u = (state.admin.users || []).find((x) => x.id === Number(editU.dataset.admEdit));
    if (u) openAdminUserSheet(u);
    return;
  }
  const delU = e.target.closest('[data-adm-delu]');
  if (delU) {
    const id = Number(delU.dataset.admDelu);
    const name = delU.dataset.name || 'บัญชีนี้';
    confirmDialog({
      title: `ลบบัญชี "${name}"?`,
      message: 'บัญชีนี้จะไม่สามารถเข้าสู่ระบบได้อีก (ออเดอร์ที่เคยผูกไว้ยังคงอยู่ในประวัติ)',
      confirmText: 'ลบบัญชี',
      danger: true,
    }).then(async (yes) => {
      if (!yes) return;
      try {
        await api(`/api/admin/users/${id}`, { method: 'DELETE' });
        toast('ลบบัญชีแล้ว', 'ok');
        renderAdminUsers();
      } catch (err) {
        toast(err.message, 'err');
      }
    });
    return;
  }
});

document.addEventListener('click', (e) => {
  /* v5.1 — ลิงก์แผนที่ (Google Maps): ปล่อยให้เบราว์เซอร์/แอป Maps จัดการ ไม่เปิดหน้าในแอป */
  if (e.target.closest && e.target.closest('a[data-maplink]')) return;
  /* ปุ่มคัดลอก (รหัสติดตาม ฯลฯ) */
  const cp = e.target.closest('[data-copy]');
  if (cp) { e.preventDefault(); copyText(cp.dataset.copy) ? toast('คัดลอกแล้ว 📋', 'ok') : toast('คัดลอกไม่สำเร็จ', 'err'); return; }
  const roBtn = e.target.closest('.myo-reorder');
  if (roBtn) {
    const o = ((state.customer && state.customer.lastOrders) || []).find((x) => x.id === Number(roBtn.dataset.reorder));
    if (o && state.role === 'customer') reorderFrom(o);
    return;
  }
  /* หน้าแรก: เข้าชม / ล็อกอิน / สมัคร / เข้าต่อ */
  const st = e.target.closest('[data-start]');
  if (st && (st.dataset.start === 'vendor-apply' || st.dataset.start === 'manager-apply')) {
    /* v6: ทางเข้าสมัครร้านค้า / ผจก.ตลาด */
    const u = state.user;
    if (st.dataset.start === 'vendor-apply') {
      if (u && u.role === 'vendor') { chooseRole('vendor'); return; }
      renderVendorApply();
    } else {
      if (u && u.role === 'manager') { chooseRole('manager'); return; }
      renderManagerApply();
    }
    return;
  }
  if (st) {
    const a = st.dataset.start;
    if (a === 'browse') { chooseRole('customer'); }
    else if (a === 'login') { openLoginScreen(); }
    else if (a === 'register') { openRegisterSheet('customer'); }
    else if (a === 'resume' && state.user) { routeAfterLogin(state.user); }
    else if (a === 'back') { showStart(); }
    return;
  }

  /* ปุ่มเปลี่ยนบทบาท / เปลี่ยนตลาด / เปลี่ยนร้าน */
  const rb = e.target.closest('[data-rolebtn], #role-btn');
  if (rb) {
    const kind = rb.dataset.rolebtn || (state.user ? 'logout' : 'login');
    if (kind === 'logout') doLogout();
    else if (kind === 'login') openLoginScreen();
    else if (kind === 'back-admin') chooseRole('admin');
    return;
  }
  if (e.target.closest('#mk-btn')) { state.manager.tab = 'none'; renderMarketPicker(); return; }
  if (e.target.closest('#mp-back')) {
    /* ย้อนกลับจากหน้าเลือกตลาด */
    if (state.manager.marketId) { state.manager.tab = 'home'; updateNavOn(); renderManagerHome(); }
    else if (state.user && state.user.role === 'admin') chooseRole('admin');
    else showStart();
    return;
  }
  if (e.target.closest('#v-shop-btn')) {
    if (state.user && state.user.role === 'vendor') {
      /* v6: ร้านค้าสลับร้านของตัวเองระหว่างหลายตลาด */
      const shops = (state.vendor.shops || []).filter((x) => x.status === 'approved');
      const md = openModal({
        title: 'สลับตลาด',
        sub: 'ร้านของคุณในแต่ละตลาด',
        icon: IC.store,
        center: true,
        body: shops.map((x) => `
          <button class="vsp-row ${x.id === state.vendor.shopId ? 'on' : ''}" data-vspick="${x.id}" type="button">
            <span class="vsp-emo">${esc(x.emoji || '🍽️')}</span>
            <span class="vsp-tx"><b>${esc(x.name)}</b><small>${esc(x.market_name)}${x.lot_code ? ' · ล็อค ' + esc(x.lot_code) : ''}</small></span>
            <span class="vsp-go">${x.id === state.vendor.shopId ? '✓' : '→'}</span>
          </button>`).join(''),
      });
      md.body.querySelectorAll('[data-vspick]').forEach((b) => b.addEventListener('click', () => {
        const id = Number(b.dataset.vspick);
        if (id !== state.vendor.shopId) {
          state.vendor.shopId = id;
          state.vendor.tab = 'orders';
          store.set('talatsuite.vshop', String(id));
          lastVendorSnapshot = '';
        }
        md.close();
        enterVendor();
      }));
      return;
    }
    if (state.vendor.shopId) state.vendor.prevShopId = state.vendor.shopId;
    lastVendorSnapshot = '';
    renderVendorShopPicker();
    return;
  }
  if (e.target.closest('#v-expand')) {
    renderVendorApply({ fromDashboard: true });
    return;
  }
  if (e.target.closest('#vsp-back')) {
    /* ย้อนกลับจากหน้าเลือกร้าน */
    if (state.vendor.prevShopId) {
      const pid = state.vendor.prevShopId;
      state.vendor.prevShopId = null;
      selectVendorShop(pid);
    }
    else if (state.user && state.user.role === 'admin') chooseRole('admin');
    else showStart();
    return;
  }
  if (e.target.closest('#mk-new') || e.target.closest('#mk-new-empty')) {
    if (!(state.user && state.user.role === 'admin')) {
      toast('เฉพาะแอดมินที่สร้างตลาดใหม่ได้ — ติดต่อผู้ดูแลระบบ', 'err');
      return;
    }
    openMarketCreateSheet();
    return;
  }

  /* ตลาด (ผู้จัดการ) */
  const mkCard = e.target.closest('[data-mk]');
  if (mkCard) {
    state.manager.marketId = Number(mkCard.dataset.mk);
    store.set('talatsuite.market', String(state.manager.marketId));
    state.manager.tab = 'home';
    updateNavOn();
    renderManagerHome();
    return;
  }

  /* ตลาด (ลูกค้า) */
  const cMk = e.target.closest('[data-cmk]');
  if (cMk) {
    state.customer.marketId = Number(cMk.dataset.cmk);
    state.customer.shopId = null;
    renderCustomerMarket();
    return;
  }
  if (e.target.closest('#cu-back-markets')) {
    state.customer.marketId = null;
    state.customer.shopId = null;
    renderCustomerMarkets();
    return;
  }

  /* ร้าน (ลูกค้า) */
  const cShop = e.target.closest('[data-cshop]');
  if (cShop) {
    state.customer.shopId = Number(cShop.dataset.cshop);
    renderCustomerShop();
    return;
  }
  if (e.target.closest('#cu-back-market')) {
    state.customer.shopId = null;
    renderCustomerMarket();
    return;
  }

  /* ตะกร้าลูกค้า */
  if (e.target.closest('#cu-open')) { openCustomerCartSheet(); return; }
  if (e.target.closest('#cu-go-browse')) { switchCustomerTab('browse'); return; }
  const cStep = e.target.closest('button[data-cadd]');
  if (cStep) {
    adjustCustomerCart(Number(cStep.dataset.id), cStep.dataset.cadd === 'plus' ? 1 : -1);
    const lines = $$('.cu-cart-region .pc-lines');
    const md = cStep.closest('.modal-backdrop');
    if (md && md.querySelector('.cu-cart-region')) {
      const entries = customerCartEntries();
      const linesBox = md.querySelector('.pc-lines');
      if (linesBox) linesBox.innerHTML = entries.map(({ item, qty }) => `
        <div class="cart-line">
          <div class="cl-name"><b>${esc(item.emoji)} ${esc(item.name)}</b><small>${baht(item.price)} × ${qty}</small></div>
          <div class="cl-qty">
            <button type="button" data-cadd="minus" data-id="${item.id}" aria-label="ลด">−</button>
            <b>${qty}</b>
            <button type="button" data-cadd="plus" data-id="${item.id}" aria-label="เพิ่ม">+</button>
          </div>
          <span class="cl-amt">${baht(item.price * qty)}</span>
        </div>`).join('');
      const tot = md.querySelector('.cu-total');
      if (tot) tot.textContent = baht(entries.reduce((s, x) => s + x.item.price * x.qty, 0));
    }
    return;
  }

  /* POS ร้านค้า: stepper + ส่งออเดอร์ */
  const step = e.target.closest('button[data-cact]');
  if (step) {
    adjustCart(Number(step.dataset.id), step.dataset.cact === 'plus' ? 1 : -1);
    return;
  }
  const submit = e.target.closest('.cc-submit');
  if (submit) {
    const region = submit.closest('.cart-region');
    if (region) submitOrder(region);
    return;
  }

  /* เลือกร้าน (vendor) */
  const vsp = e.target.closest('.vsp-card[data-id]');
  if (vsp) { selectVendorShop(Number(vsp.dataset.id)); return; }
  if (e.target.closest('#vsp-new')) { openNewShopSheet(); return; }

  /* ร้านค้าในตลาด (manager) */
  if (e.target.closest('#msh-add')) { openShopFormSheet(null); return; }
  const mshEdit = e.target.closest('[data-msh="edit"]');
  if (mshEdit) {
    const id = Number(mshEdit.closest('.msh-row').dataset.id);
    const shop = state.manager.shops.find((x) => x.id === id);
    if (shop) openShopFormSheet(shop);
    return;
  }
  const mshDel = e.target.closest('[data-msh="del"]');
  if (mshDel) {
    const id = Number(mshDel.closest('.msh-row').dataset.id);
    const shop = state.manager.shops.find((x) => x.id === id);
    if (!shop) return;
    confirmDialog({
      title: 'ยืนยันการลบร้าน?',
      message: `ลบ <b>${esc(shop.name)}</b> ออกจากตลาด? เมนูและออเดอร์ทั้งหมดของร้านจะถูกลบด้วย`,
      confirmText: 'ลบร้าน',
      danger: true,
    }).then(async (yes) => {
      if (!yes) return;
      try {
        await api(`/api/shops/${id}`, { method: 'DELETE' });
        toast(`ลบร้าน “${shop.name}” แล้ว`, 'info');
        renderManagerShops();
      } catch (err) { toast(err.message, 'err'); }
    });
    return;
  }

  /* layout editor */
  handleLayoutClick(e);

  /* เมนู (vendor) */
  if (e.target.closest('#mm-add')) { openMenuItemSheet(null); return; }
  const mmiEdit = e.target.closest('[data-mmi="edit"]');
  if (mmiEdit) {
    const id = Number(mmiEdit.closest('.mm-row').dataset.id);
    const it = state.vendor.menu.find((x) => x.id === id);
    if (it) openMenuItemSheet(it);
    return;
  }
  const del = e.target.closest('.mm-del');
  if (del) { handleMenuDelete(del); return; }

  if (e.target.closest('#cb-open')) { openCartSheet(); return; }

  /* โปรไฟล์ร้าน (vendor) */
  if (e.target.closest('#vp-save') || e.target.closest('#vp-save2')) { saveVendorProfile(); return; }
});

document.addEventListener('input', (e) => {
  if (e.target.classList.contains('cc-name')) state.vendor.draft.name = e.target.value;
  if (e.target.classList.contains('cc-note')) state.vendor.draft.note = e.target.value;
});

/* delegation หลักภายใน view */
viewEl.addEventListener('click', (e) => {
  const periodBtn = e.target.closest('#period-seg button[data-p]');
  if (periodBtn && periodBtn.dataset.p !== state.manager.period) {
    state.manager.period = periodBtn.dataset.p;
    $$('#period-seg button').forEach((x) => x.classList.toggle('on', x === periodBtn));
    loadMarket();
    return;
  }
  if (e.target.closest('#date-btn')) { chooseDate(); return; }
  const sub = e.target.closest('#v-subtabs button[data-t]');
  if (sub) { switchVendorTab(sub.dataset.t); return; }
  if (e.target.closest('#m-retry')) { loadMarket(); return; }
  if (e.target.closest('#pos-retry')) { loadVendorData(); return; }
  if (e.target.closest('#rev-history')) { openPaymentsSheet(); return; }
  if (e.target.closest('#st-save')) return; /* จัดการใน renderManagerSettings */
  const lot = e.target.closest('.lot');
  if (lot) { openLotSheet(lot.dataset.code); return; }
});

viewEl.addEventListener('change', handleMenuChange);
viewEl.addEventListener('change', (e) => {
  if (e.target.classList.contains('lay-rent')) {
    const row = e.target.closest('.lay-row');
    if (row) {
      const r = state.manager.layout[Number(row.dataset.idx)];
      if (r) r.rent = Number(e.target.value) || 0;
    }
  }
});

/* ═══════════════════════════════════════════════════════════
   บทบาทแอดมิน · 🛡️ คอนโซลเจ้าของระบบ — ทุกตลาดในมือเดียว
   ═══════════════════════════════════════════════════════════ */
async function enterAdmin() {
  const a = state.admin;
  viewEl.dataset.app = 'admin';
  a.stats = null;
  renderAdmin();
  try {
    a.stats = (await api('/api/admin/stats'));
  } catch (e) {
    viewEl.innerHTML = adminHead('ภาพรวมระบบ', 'สถิติทุกตลาดแบบเรียลไทม์') + `<div class="empty"><div class="e-emo">😵</div><b>โหลดสถิติไม่สำเร็จ</b><p>${esc(e.message)}</p></div>`;
    return;
  }
  renderAdmin();
}

function adminHead(title, sub) {
  return `
    <header class="pagehead admin-head">
      <div class="ph-top">
        <div class="ph-title"><h2>🛡️ ${esc(title)}</h2><p>${esc(sub)}</p></div>
        ${roleBtnHTML()}
      </div>
    </header>`;
}

/* ── แท็บบันทึกกิจกรรม (audit log) — แอดมินเห็นทุกการกระทำ ── */
const AUDIT_ACTION_TH = {
  'auth.login': 'เข้าสู่ระบบ', 'auth.register': 'สมัครสมาชิก', 'auth.password': 'เปลี่ยนรหัสผ่าน', 'auth.passcode': 'ตั้ง/ลบรหัสล็อค',
  'market.create': 'สร้างตลาด', 'market.update': 'แก้ไขตลาด', 'market.delete': 'ลบตลาด', 'market.layout': 'แก้ผังตลาด',
  'lot.payment': 'บันทึกค่าเช่า', 'lot.update': 'แก้ไขล็อค',
  'shop.create': 'สร้างร้าน', 'shop.update': 'แก้ไขร้าน', 'shop.delete': 'ลบร้าน',
  'menu.create': 'เพิ่มเมนู', 'menu.update': 'แก้ไขเมนู', 'menu.delete': 'ลบเมนู',
  'order.create': 'สร้างออร์เดอร์', 'order.status': 'เปลี่ยนสถานะออร์เดอร์', 'order.delete': 'ลบออร์เดอร์',
  'user.create': 'สร้างบัญชี', 'user.update': 'แก้ไขบัญชี', 'user.delete': 'ลบบัญชี',
};
const AUDIT_ROLE_EMOJI = { admin: '🛡️', manager: '🏪', vendor: '🍜', customer: '🛒', guest: '👤', system: '⚙️' };

/* บันทึกกิจกรรม: ส่งออก CSV / พิมพ์ PDF / คัดลอก (v5.4) */
function auditExportEntries() {
  const a = state.admin;
  return a.audit || [];
}
function auditRowsData() {
  return auditExportEntries().map((e) => [
    `${fmtDateShort(e.ts)} ${fmtTime(e.ts)}`, e.actor_name, ROLE_TH[e.actor_role] || e.actor_role,
    AUDIT_ACTION_TH[e.action] || e.action, e.detail, e.target || '', e.market_name || '',
  ]);
}
function exportAuditCSV() {
  const rows = auditRowsData();
  if (!rows.length) return toast('ยังไม่มีบันทึกให้ส่งออก — กดรีเฟรชก่อน', 'err');
  const res = downloadCSV(`talatsuite-audit-${todayStr()}.csv`,
    ['วันเวลา', 'ผู้กระทำ', 'บทบาท', 'การกระทำ', 'รายละเอียด', 'เป้าหมาย', 'ตลาด'], rows);
  toastSavedFile(res, `ส่งออกบันทึก ${rows.length} รายการเป็น CSV แล้ว`);
}
async function copyAuditRows() {
  const rows = auditRowsData();
  if (!rows.length) return toast('ยังไม่มีบันทึกให้ส่งออก — กดรีเฟรชก่อน', 'err');
  await exportCopyRows(['วันเวลา', 'ผู้กระทำ', 'บทบาท', 'การกระทำ', 'รายละเอียด', 'เป้าหมาย', 'ตลาด'], rows, rows.length);
}
function printAuditReport() {
  const entries = auditExportEntries();
  if (!entries.length) return toast('ยังไม่มีบันทึกให้พิมพ์ — กดรีเฟรชก่อน', 'err');
  const ctx = (state.admin && state.admin.auditExportCtx) || { f: {}, mkList: [] };
  const f = ctx.f || {};
  const mkName = f.market_id ? ((ctx.mkList || []).find((mk) => String(mk.id) === String(f.market_id)) || {}).name : 'ทุกตลาด';
  printReport('บันทึกกิจกรรม',
    `ตัวกรอง: ${mkName || 'ทุกตลาด'} · ${f.role ? ROLE_TH[f.role] : 'ทุกบทบาท'}${f.q ? ' · ค้นหา "' + esc(f.q) + '"' : ''} · ${entries.length} รายการล่าสุด`,
    `<table><thead><tr><th>วันเวลา</th><th>ผู้กระทำ</th><th>การกระทำ</th><th>รายละเอียด</th><th>ตลาด</th></tr></thead><tbody>
      ${entries.map((e) => `<tr>
        <td class="nowrap">${fmtDateShort(e.ts)} ${fmtTime(e.ts)}</td>
        <td class="nowrap">${esc(e.actor_name)}<br><small>${ROLE_TH[e.actor_role] || e.actor_role}</small></td>
        <td class="nowrap"><span class="badge">${AUDIT_ACTION_TH[e.action] || e.action}</span></td>
        <td>${esc(e.detail)}</td>
        <td>${e.market_name ? esc(e.market_name) : '—'}</td>
      </tr>`).join('')}
    </tbody></table>`);
}

async function renderAdminAudit() {
  const a = state.admin;
  const f = a.auditFilter || { market_id: '', role: '', q: '' };
  const mkList = (a.stats && a.stats.markets) || [];
  viewEl.innerHTML = adminHead('บันทึกกิจกรรม', 'ทุกการกระทำของผู้จัดการ ร้านค้า และลูกค้า — ตรวจสอบย้อนหลังได้') + `
    <div class="panel">
      <div class="panel-head"><h3>🔎 กรองบันทึก</h3>
        <div class="btn-row">
          <button class="btn sm ghost" id="aud-refresh" type="button">↻ รีเฟรช</button>
          <button class="btn sm ghost" id="aud-export" type="button">⬇️ ส่งออก / พิมพ์รายงาน</button>
        </div>
      </div>
      <div class="aud-filters">
        <select class="tin" id="aud-mk" aria-label="กรองตามตลาด">
          <option value="">ทุกตลาด</option>
          ${mkList.map((mk) => `<option value="${mk.id}" ${String(f.market_id) === String(mk.id) ? 'selected' : ''}>${esc(mk.name)}</option>`).join('')}
        </select>
        <select class="tin" id="aud-role" aria-label="กรองตามบทบาท">
          <option value="">ทุกบทบาท</option>
          ${['admin', 'manager', 'vendor', 'customer', 'guest'].map((r) => `<option value="${r}" ${f.role === r ? 'selected' : ''}>${ROLE_EMOJI[r] || ''} ${ROLE_TH[r] || r}</option>`).join('')}
        </select>
        <input class="tin" id="aud-q" maxlength="100" placeholder="ค้นหา ชื่อ/รายละเอียด/ออร์เดอร์…" value="${esc(f.q || '')}">
      </div>
      <div id="aud-list"><div class="skel" style="height:220px"></div></div>
    </div>`;

  const load = async () => {
    const box = $('#aud-list');
    if (!box) return;
    try {
      const q = new URLSearchParams();
      if (f.market_id) q.set('market_id', f.market_id);
      if (f.role) q.set('role', f.role);
      if (f.q) q.set('q', f.q);
      q.set('limit', '200');
      const data = await api('/api/admin/audit?' + q.toString());
      a.audit = data.entries;
      if (!a.audit.length) {
        box.innerHTML = `<div class="empty"><div class="e-emo">🗂️</div><b>ไม่พบบันทึกที่ตรงเงื่อนไข</b><p>ลองเปลี่ยนตัวกรอง หรือกดรีเฟรช</p></div>`;
        return;
      }
      box.innerHTML = `<div class="aud-table-wrap"><table class="aud-table">
        <thead><tr><th>เวลา</th><th>ผู้กระทำ</th><th>การกระทำ</th><th>รายละเอียด</th><th>ตลาด</th></tr></thead>
        <tbody>
          ${a.audit.map((e) => `
          <tr>
            <td class="num nowrap">${fmtDateShort(e.ts)}<br>${fmtTime(e.ts)}</td>
            <td class="nowrap"><span class="aud-actor">${AUDIT_ROLE_EMOJI[e.actor_role] || '·'} ${esc(e.actor_name)}</span><br><small class="aud-role">${ROLE_TH[e.actor_role] || e.actor_role}</small></td>
            <td class="nowrap"><span class="badge aud-act">${AUDIT_ACTION_TH[e.action] || e.action}</span></td>
            <td>${esc(e.detail)}${e.target ? ` <small class="aud-target">→ ${esc(e.target)}</small>` : ''}</td>
            <td class="nowrap">${e.market_name ? esc(e.market_name) : '—'}</td>
          </tr>`).join('')}
        </tbody></table></div>`;
    } catch (e) {
      box.innerHTML = `<div class="err-banner"><b>โหลดบันทึกกิจกรรมไม่สำเร็จ</b>${esc(e.message)}</div>`;
    }
  };

  const setFilter = () => {
    f.market_id = $('#aud-mk') ? $('#aud-mk').value : '';
    f.role = $('#aud-role') ? $('#aud-role').value : '';
    f.q = $('#aud-q') ? $('#aud-q').value.trim() : '';
    a.auditFilter = f;
    load();
  };
  $('#aud-mk').addEventListener('change', setFilter);
  $('#aud-role').addEventListener('change', setFilter);
  $('#aud-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') setFilter(); });
  $('#aud-refresh').addEventListener('click', load);

  /* ส่งออกบันทึกกิจกรรม: CSV / PDF / คัดลอก — ผ่านโมดัลเดียว */
  a.auditExportCtx = { f, mkList };
  $('#aud-export').addEventListener('click', () => {
    openExportModal(exportOptions([
      ['csv', exportAuditCSV],
      ['pdf', printAuditReport],
      ['copy', copyAuditRows],
    ]));
  });

  await load();
}

function switchAdminTab(tab) {
  state.admin.tab = tab;
  updateNavOn();
  overlayRoot.innerHTML = '';
  window.scrollTo(0, 0);
  renderAdmin();
}

async function renderAdmin() {
  const a = state.admin;
  viewEl.dataset.app = 'admin';
  if (a.tab === 'markets') return renderAdminMarkets();
  if (a.tab === 'apps') return renderAdminApplications();
  if (a.tab === 'users') return renderAdminUsers();
  if (a.tab === 'customers') return renderAdminCustomers();
  if (a.tab === 'audit') return renderAdminAudit();
  return renderAdminHome();
}

/* ── แท็บภาพรวม ── */
function renderAdminHome() {
  const a = state.admin;
  const s = a.stats;
  if (!s) {
    viewEl.innerHTML = adminHead('ภาพรวมระบบ', 'สถิติทุกตลาดแบบเรียลไทม์') + `<div class="skel" style="height:300px"></div>`;
    return;
  }
  const t = s.totals;
  viewEl.innerHTML = adminHead('ภาพรวมระบบ', `ทุกตลาดในมือเดียว — อัปเดต ${fmtTime(new Date().toISOString())} น.`) + `
    <div class="stat-grid">
      <div class="stat-card gold"><small>ยอดขายวันนี้ (ทุกตลาด)</small><b class="num">${baht(t.gmv_today)}</b><span>${t.orders_today} ออเดอร์</span></div>
      <div class="stat-card"><small>ค่าเช่า-ค่าบริการวันนี้</small><b class="num">${baht(t.rent_today)}</b><span>เก็บจาก ${t.markets} ตลาด</span></div>
      <div class="stat-card"><small>ยอดขายสะสม</small><b class="num">${baht(t.gmv_all)}</b><span>${t.orders_all} ออเดอร์</span></div>
      <div class="stat-card"><small>รายได้ค่าเช่าสะสม</small><b class="num">${baht(t.rent_all)}</b><span>&nbsp;</span></div>
      <div class="stat-card ppl"><small>👥 ลูกค้าสมาชิก</small><b class="num">${t.customers}</b><span>ฐานข้อมูลการตลาดของคุณ</span></div>
      <div class="stat-card ppl"><small>🏪 ผู้จัดการตลาด</small><b class="num">${t.managers}</b><span>${t.markets} ตลาด</span></div>
      <div class="stat-card ppl"><small>🍜 ร้านค้า</small><b class="num">${t.vendors}</b><span>บัญชีร้านค้า · ${t.shops} ร้าน</span></div>
    </div>

    <div class="panel">
      <div class="panel-head"><h3>📊 รายตลาด — วันนี้</h3><button class="btn sm ghost" data-adm="goto-markets">จัดการตลาด →</button></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>ตลาด</th><th>ผู้จัดการ</th><th class="num">ล็อค</th><th class="num">เข้าอยู่</th><th class="num">ร้าน</th><th class="num">ออเดอร์วันนี้</th><th class="num">ยอดขายวันนี้</th><th class="num">ค่าเช่าวันนี้</th><th></th></tr></thead>
        <tbody>
          ${s.markets.map((m) => `
          <tr>
            <td><b>${esc(m.emoji)} ${esc(m.name)}</b><small>${m.open_today ? '🟢 เปิดวันนี้' : '🔴 ปิดวันนี้'}</small><small>🕒 ${esc(m.schedule_text || '')}</small></td>
            <td>${esc(m.manager)}</td>
            <td class="num">${m.lots}</td>
            <td class="num">${m.occupied}</td>
            <td class="num">${m.shops} <small>(${m.shops_open} เปิด)</small></td>
            <td class="num">${m.orders_today}</td>
            <td class="num"><b>${baht(m.gmv_today)}</b></td>
            <td class="num">${baht(m.rent_today)}</td>
            <td><button class="btn sm" data-adm-mk="${m.id}">จัดการ</button></td>
          </tr>`).join('')}
        </tbody>
      </table></div>
    </div>

    <div class="admin-2col">
      <div class="panel">
        <div class="panel-head"><h3>🧾 ออเดอร์ล่าสุด</h3></div>
        ${s.recent_orders.length ? `<div class="tbl-wrap"><table class="tbl slim">
          <thead><tr><th>#</th><th>ลูกค้า</th><th>ร้าน</th><th>สถานะ</th><th class="num">ยอด</th></tr></thead>
          <tbody>${s.recent_orders.map((o) => `
            <tr><td>${o.id}</td><td>${esc(o.customer_name)}</td><td>${esc(o.shop_emoji)} ${esc(o.shop_name)}<small>${esc(o.market_name)}</small></td>
            <td><span class="st st-${o.status}">${STATUS_TH[o.status]}</span></td><td class="num">${baht(o.total)}</td></tr>`).join('')}
          </tbody></table></div>` : '<div class="empty"><div class="e-emo">🧾</div><b>ยังไม่มีออเดอร์</b></div>'}
      </div>
      <div class="panel">
        <div class="panel-head"><h3>🆕 สมาชิกใหม่ล่าสุด</h3><button class="btn sm ghost" data-adm="goto-customers">ดูทั้งหมด →</button></div>
        ${s.recent_customers.length ? `<div class="tbl-wrap"><table class="tbl slim">
          <thead><tr><th>ชื่อ</th><th>เบอร์/ผู้ใช้</th><th class="num">ออเดอร์</th><th class="num">ยอดใช้จ่าย</th></tr></thead>
          <tbody>${s.recent_customers.map((c) => `
            <tr><td>${esc(c.display_name)}</td><td class="num">${esc(c.login)}</td><td class="num">${c.orders}</td><td class="num">${baht(c.spend)}</td></tr>`).join('')}
          </tbody></table></div>` : '<div class="empty"><div class="e-emo">👋</div><b>ยังไม่มีสมาชิก</b></div>'}
      </div>
    </div>`;
}

/* ── แท็บจัดการตลาด ── */
async function renderAdminMarkets() {
  const a = state.admin;
  viewEl.innerHTML = adminHead('จัดการตลาด', 'สร้าง · ลบ · ผูกบัญชีผู้จัดการ') + `<div id="adm-markets"><div class="skel" style="height:220px"></div></div>`;
  let stats;
  try { stats = await api('/api/admin/stats'); a.stats = stats; } catch (e) {
    $('#adm-markets').innerHTML = `<div class="empty"><div class="e-emo">😵</div><b>โหลดไม่สำเร็จ</b><p>${esc(e.message)}</p></div>`;
    return;
  }
  const box = $('#adm-markets');
  if (!box) return;
  box.innerHTML = `
    <div class="menu-mgmt-head">
      <p>คุณเป็นเจ้าของทุกตลาด — เพิ่ม/ลบ/แก้ไขได้ตลอดเวลา และมอบบัญชีผู้จัดการให้คนที่คุณไว้ใจ</p>
      <button class="btn gold" data-adm="new-market">＋ สร้างตลาดใหม่</button>
    </div>
    <div class="mk-grid">
      ${stats.markets.map((m) => `
        <div class="mk-card adm-mk">
          <span class="mkc-emo">${esc(m.emoji)}</span>
          <div class="mkc-tx">
            <b>${esc(m.name)}</b>
            <small>ผจก. ${esc(m.manager)}</small>
            <span class="mkc-meta">🕒 ${esc(m.schedule_text || '—')}</span>
            <span class="mkc-meta">${m.lots} ล็อค · ${m.shops} ร้าน · วันนี้ ${m.orders_today} ออเดอร์ ${baht(m.gmv_today)}</span>
          </div>
          <span class="open-badge ${m.open_today ? 'on' : 'off'}">${m.open_today ? 'เปิดวันนี้' : 'ปิดวันนี้'}</span>
          <div class="adm-mk-actions">
            <button class="btn sm" data-adm-mk="${m.id}">⚙️ จัดการ</button>
            <button class="btn sm ghost" data-adm-mgr="${m.id}">👤 บัญชีผจก.</button>
            <button class="btn sm danger" data-adm-del="${m.id}" data-name="${esc(m.name)}">🗑 ลบ</button>
          </div>
        </div>`).join('')}
    </div>`;
}

/* ── แท็บบัญชีผู้ใช้ ── */
async function renderAdminUsers() {
  const a = state.admin;
  viewEl.innerHTML = adminHead('บัญชีผู้ใช้ทั้งหมด', 'ผู้จัดการ · ร้านค้า · ลูกค้า · แอดมิน') + `<div id="adm-users"><div class="skel" style="height:220px"></div></div>`;
  let users;
  try { users = (await api('/api/admin/users')).users; a.users = users; } catch (e) {
    const box = $('#adm-users');
    if (box) box.innerHTML = `<div class="empty"><div class="e-emo">😵</div><b>โหลดไม่สำเร็จ</b><p>${esc(e.message)}</p></div>`;
    return;
  }
  const box = $('#adm-users');
  if (!box) return;
  const f = a.userFilter;
  const filtered = f === 'all' ? users : users.filter((u) => u.role === f);
  const chips = [['all', 'ทั้งหมด'], ['manager', '🏪 ผู้จัดการ'], ['vendor', '🍜 ร้านค้า'], ['customer', '🛒 ลูกค้า']];
  box.innerHTML = `
    <div class="menu-mgmt-head">
      <div class="seg">
        ${chips.map(([id, label]) => `<button type="button" data-adm-filter="${id}" class="${f === id ? 'on' : ''}">${label} ${id === 'all' ? users.length : users.filter((u) => u.role === id).length}</button>`).join('')}
      </div>
      <button class="btn gold" data-adm="new-user">＋ สร้างบัญชี (ผจก./ร้านค้า)</button>
    </div>
    ${filtered.length ? `<div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>บัญชี</th><th>ชื่อ</th><th>บทบาท</th><th>ขอบเขต</th><th>เข้าใช้ล่าสุด</th><th></th></tr></thead>
      <tbody>
        ${filtered.map((u) => `
        <tr>
          <td><b class="num">${esc(u.login)}</b></td>
          <td>${esc(u.display_name)}${u.phone ? `<small>${esc(u.phone)}</small>` : ''}</td>
          <td><span class="role-tag rt-${u.role}">${ROLE_EMOJI[u.role] || ''} ${ROLE_TH[u.role] || u.role}</span></td>
          <td>${u.role === 'admin' ? '🌍 ทุกตลาด' : u.role === 'manager' ? esc(u.market_name || '—') : u.role === 'vendor' ? esc(u.shop_name || '—') : 'สั่งอาหาร'}</td>
          <td>${u.last_login_at ? timeAgo(u.last_login_at) : '<small>ยังไม่เคย</small>'}</td>
          <td class="row-actions">
            ${u.role !== 'customer' ? `<button class="btn sm ghost" data-adm-edit="${u.id}">✏️ แก้ไข</button>` : ''}
            ${u.id !== (state.user && state.user.id) ? `<button class="btn sm danger" data-adm-delu="${u.id}" data-name="${esc(u.display_name)}">🗑</button>` : '<small>(คุณ)</small>'}
          </td>
        </tr>`).join('')}
      </tbody></table></div>` : '<div class="empty"><div class="e-emo">🔍</div><b>ไม่พบบัญชีประเภทนี้</b></div>'}`;
}

/* ── แท็บข้อมูลลูกค้า (การตลาด) ── */
async function renderAdminCustomers() {
  const a = state.admin;
  viewEl.innerHTML = adminHead('ฐานข้อมูลลูกค้า', 'พลังการตลาดของคุณ — สมาชิกจากทุกตลาดทุกร้าน') + `<div id="adm-custs"><div class="skel" style="height:220px"></div></div>`;
  let customers;
  try { customers = (await api('/api/admin/customers')).customers; a.customers = customers; } catch (e) {
    const box = $('#adm-custs');
    if (box) box.innerHTML = `<div class="empty"><div class="e-emo">😵</div><b>โหลดไม่สำเร็จ</b><p>${esc(e.message)}</p></div>`;
    return;
  }
  const box = $('#adm-custs');
  if (!box) return;
  const totalSpend = customers.reduce((s, c) => s + Number(c.spend || 0), 0);
  const multi = customers.filter((c) => c.markets > 1).length;
  box.innerHTML = `
    <div class="stat-grid three">
      <div class="stat-card gold"><small>สมาชิกทั้งหมด</small><b class="num">${customers.length}</b><span>จากทุกตลาด</span></div>
      <div class="stat-card"><small>ยอดใช้จ่ายรวม</small><b class="num">${baht(totalSpend)}</b><span>ตั้งแต่สมัคร</span></div>
      <div class="stat-card"><small>ลูกค้าข้ามตลาด</small><b class="num">${multi}</b><span>ซื้อ 2 ตลาดขึ้นไป</span></div>
    </div>
    <div class="menu-mgmt-head">
      <p>ส่งออกเป็นไฟล์ CSV เปิดได้ใน Excel/Google Sheets เพื่อทำการตลาดต่อ (LINE Broadcast, SMS ฯลฯ)</p>
      <div class="btn-row">
        <button class="btn gold" id="adm-cust-export">⬇️ ส่งออก / พิมพ์รายงาน</button>
      </div>
    </div>
    ${customers.length ? `<div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>ชื่อ</th><th>เบอร์โทร</th><th>อีเมล</th><th class="num">ตลาดที่ซื้อ</th><th class="num">ออเดอร์</th><th class="num">ยอดใช้จ่าย</th><th>เข้าใช้ล่าสุด</th></tr></thead>
      <tbody>
        ${customers.map((c) => `
        <tr>
          <td><b>${esc(c.display_name)}</b></td>
          <td class="num">${esc(c.login)}</td>
          <td>${c.email ? esc(c.email) : '—'}</td>
          <td class="num">${c.markets}</td>
          <td class="num">${c.orders}</td>
          <td class="num"><b>${baht(c.spend)}</b></td>
          <td>${c.last_login_at ? timeAgo(c.last_login_at) : '<small>ยังไม่เคย</small>'}</td>
        </tr>`).join('')}
      </tbody></table></div>` : '<div class="empty"><div class="e-emo">🛒</div><b>ยังไม่มีสมาชิกลูกค้า</b><p>ลูกค้าจะสมัครอัตโนมัติเมื่อสั่งออเดอร์ครั้งแรก</p></div>'}`;
  /* ส่งออกลูกค้า: CSV / PDF / คัดลอก — ผ่านโมดัลเดียว (v5.4) */
  const exportCtx = { customers, totalSpend, multi };
  const custRows = () => exportCtx.customers.map((c) => [
    c.display_name || '', c.login || '', c.email || '', c.markets, c.orders, Number(c.spend || 0), c.last_login_at || '',
  ]);
  const ex = $('#adm-cust-export');
  if (ex) ex.addEventListener('click', () => {
    openExportModal(exportOptions([
      ['csv', async () => {
        if (!exportCtx.customers.length) return toast('ยังไม่มีข้อมูลลูกค้าให้ส่งออก', 'err');
        const res = downloadCSV(`talatsuite-customers-${todayStr()}.csv`,
          ['ชื่อ', 'เบอร์โทร', 'อีเมล', 'ตลาดที่ซื้อ', 'ออร์เดอร์', 'ยอดใช้จ่าย (บาท)', 'เข้าใช้ล่าสุด'], custRows());
        toastSavedFile(res, `ส่งออกสมาชิก ${exportCtx.customers.length} คนเป็น CSV แล้ว`);
      }],
      ['pdf', () => {
        if (!exportCtx.customers.length) return toast('ยังไม่มีข้อมูลลูกค้าให้พิมพ์', 'err');
        printReport('ฐานข้อมูลลูกค้า',
          `สมาชิก ${exportCtx.customers.length} คน · ยอดใช้จ่ายรวม ${baht(exportCtx.totalSpend)} · ข้ามตลาด ${exportCtx.multi} คน`,
          `<table><thead><tr><th>ชื่อ</th><th>เบอร์โทร</th><th class="num">ออร์เดอร์</th><th class="num">ยอดใช้จ่าย (บาท)</th><th>เข้าใช้ล่าสุด</th></tr></thead><tbody>
            ${exportCtx.customers.map((c) => `<tr>
              <td>${esc(c.display_name)}</td>
              <td class="num">${esc(c.login)}</td>
              <td class="num">${c.orders}</td>
              <td class="num">${Number(c.spend || 0).toLocaleString('th-TH')}</td>
              <td>${c.last_login_at ? fmtDateMedium(c.last_login_at) : '—'}</td>
            </tr>`).join('')}
          </tbody></table>
          <p class="totals">รวม <b>${exportCtx.customers.length}</b> สมาชิก · ยอดใช้จ่ายรวม <b>${baht(exportCtx.totalSpend)}</b></p>`);
      }],
      ['copy', async () => {
        if (!exportCtx.customers.length) return toast('ยังไม่มีข้อมูลลูกค้าให้ส่งออก', 'err');
        await exportCopyRows(['ชื่อ', 'เบอร์โทร', 'อีเมล', 'ตลาดที่ซื้อ', 'ออร์เดอร์', 'ยอดใช้จ่าย (บาท)', 'เข้าใช้ล่าสุด'], custRows(), exportCtx.customers.length);
      }],
    ]));
  });

}

/* ── ชีตสร้าง/แก้บัญชี (แอดมิน) ── */
async function openAdminUserSheet(editUser, presetMarketId) {
  let markets = [];
  let shops = [];
  try { markets = (await api('/api/markets')).markets; } catch (e) {}
  try { shops = (await api('/api/shops')).shops; } catch (e) {}
  const isEdit = !!editUser;
  const role = isEdit ? editUser.role : 'manager';
  const md = openModal({
    title: isEdit ? `แก้ไขบัญชี ${editUser.login}` : 'สร้างบัญชีใหม่',
    sub: isEdit ? 'เปลี่ยนชื่อ / ตลาด / รีเซ็ตรหัสผ่าน' : 'บัญชีผู้จัดการตลาด หรือ ร้านค้า (สร้างให้ทีมงานของคุณ)',
    icon: IC.store,
    className: 'admin-user-sheet',
    body: `
      ${isEdit ? '' : `
      <div class="seg field-seg" id="au-tabs">
        <button type="button" data-au="manager" class="${role === 'manager' ? 'on' : ''}">🏪 ผู้จัดการตลาด</button>
        <button type="button" data-au="vendor" class="${role === 'vendor' ? 'on' : ''}">🍜 ร้านค้า</button>
      </div>`}
      <div class="field"><label for="au-name">ชื่อ-นามสกุล</label>
        <input class="tin" id="au-name" maxlength="120" placeholder="เช่น สมชาย ใจดี" value="${isEdit ? esc(editUser.display_name) : ''}"></div>
      ${isEdit ? '' : `
      <div class="field"><label for="au-login">ชื่อผู้ใช้ (a-z, 0-9 — เข้าสู่ระบบด้วยชื่อนี้)</label>
        <input class="tin" id="au-login" maxlength="60" placeholder="เช่น somchai" autocomplete="off"></div>`}
      <div class="field"><label for="au-phone">เบอร์โทร</label>
        <input class="tin" id="au-phone" maxlength="32" placeholder="08x-xxx-xxxx" value="${isEdit && editUser.phone ? esc(editUser.phone) : ''}"></div>
      <div class="field"><label for="au-pass">${isEdit ? 'รีเซ็ตรหัสผ่าน (เว้นว่าง = ไม่เปลี่ยน)' : 'รหัสผ่าน (4 ตัวขึ้นไป)'}</label>
        <input class="tin" id="au-pass" type="password" maxlength="100" placeholder="••••••••" autocomplete="new-password"></div>
      <div class="field" id="au-market-field"><label for="au-market">ตลาดที่ดูแล</label>
        <select class="tin" id="au-market">
          <option value="">— เลือกตลาด —</option>
          ${markets.map((m) => `<option value="${m.id}" ${(isEdit ? Number(editUser.market_id) === m.id : Number(presetMarketId) === m.id) ? 'selected' : ''}>${esc(m.emoji)} ${esc(m.name)}</option>`).join('')}
        </select></div>
      <div class="field" id="au-shop-field" hidden><label for="au-shop">ร้านค้า (ไม่บังคับ — ผูกภายหลังได้)</label>
        <select class="tin" id="au-shop">
          <option value="">— ยังไม่ผูกร้าน —</option>
          ${shops.map((s) => `<option value="${s.id}" ${isEdit && Number(editUser.shop_id) === s.id ? 'selected' : ''}>${esc(s.emoji)} ${esc(s.name)} (${esc(s.market_name || '')})</option>`).join('')}
        </select></div>
      <button class="btn primary block" id="au-go" type="button">${isEdit ? 'บันทึกการแก้ไข' : 'สร้างบัญชี'}</button>`,
  });

  let mode = role;
  const syncFields = () => {
    const mf = md.body.querySelector('#au-market-field');
    const sf = md.body.querySelector('#au-shop-field');
    if (!mf) return;
    mf.hidden = mode !== 'manager';
    sf.hidden = mode !== 'vendor';
  };
  if (!isEdit) {
    md.body.querySelector('#au-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-au]');
      if (!b) return;
      mode = b.dataset.au;
      $$('#au-tabs button', md.body).forEach((x) => x.classList.toggle('on', x === b));
      syncFields();
    });
  } else {
    mode = editUser.role === 'vendor' ? 'vendor' : 'manager';
    syncFields();
  }

  md.body.querySelector('#au-go').addEventListener('click', async () => {
    const btn = md.body.querySelector('#au-go');
    const getBody = () => ({
      display_name: md.body.querySelector('#au-name').value.trim(),
      phone: md.body.querySelector('#au-phone').value.trim(),
      password: md.body.querySelector('#au-pass').value,
      market_id: Number(md.body.querySelector('#au-market').value) || null,
      shop_id: Number(md.body.querySelector('#au-shop').value) || null,
    });
    btn.disabled = true;
    try {
      if (isEdit) {
        const b = getBody();
        if (b.password === '') delete b.password;
        await api(`/api/admin/users/${editUser.id}`, { method: 'PUT', body: b });
        toast(`บันทึกบัญชี ${editUser.login} แล้ว`, 'ok');
      } else {
        const b = {
          ...getBody(),
          role: mode,
          login: md.body.querySelector('#au-login').value.trim(),
        };
        const r = await api('/api/admin/users', { method: 'POST', body: b });
        toast(`สร้างบัญชี ${r.user.login} แล้ว — ส่งชื่อผู้ใช้+รหัสผ่านให้เขาผ่าน LINE ได้เลย`, 'ok');
      }
      md.close();
      renderAdminUsers();
    } catch (e) {
      toast(e.message, 'err');
      btn.disabled = false;
    }
  });
}

/* ── ลบตลาด (ยืนยัน) ── */
function confirmDeleteMarket(id, name) {
  confirmDialog({
    title: `ลบตลาด "${name}"?`,
    message: 'ล็อค ร้านค้า เมนู ออเดอร์ และข้อมูลการเงินของตลาดนี้ จะถูกลบทั้งหมด — <b>ไม่สามารถย้อนกลับได้</b>',
    confirmText: 'ลบถาวร',
    danger: true,
  }).then(async (yes) => {
    if (!yes) return;
    try {
      await api(`/api/markets/${id}`, { method: 'DELETE' });
      toast(`ลบตลาด "${name}" แล้ว`, 'ok');
      renderAdminMarkets();
    } catch (e) {
      toast(e.message, 'err');
    }
  });
}

/* เริ่มระบบ */
window.__tsRerender = function () {
  /* สลับภาษา → เรนเดอร์หน้าปัจจุบันใหม่ทั้งหมด (UI หลักเป็นไทย แล้ว i18n แปลเป็น EN) */
  renderSideUser();
  renderNav();
  if (!state.role) showStart();
  else if (state.role === 'admin') renderAdmin();
  else if (state.role === 'manager') renderManager();
  else if (state.role === 'vendor') renderVendor();
  else renderCustomer();
};

(async function init() {
  if (window.TS && TS.init) TS.init();
  loadGuestOrders();
  bindLangSwitch();
  checkHealth();
  /* เซสชันที่จำไว้ → ฟื้นผู้ใช้ก่อน */
  const token = store.get('talatsuite.token');
  if (token) {
    try {
      const r = await api('/api/auth/me');
      state.user = r.user;
    } catch (e) {
      /* token ไม่ผ่าน / หมดอายุ */
    }
  }
  renderSideUser();
  const u = state.user;
  const initial = location.hash.replace('#/', '');
  showLockScreen(); /* มีรหัสล็อค → ขอรหัสก่อนใช้งานต่อ */
  if (u && u.role === initial) { chooseRole(initial); return; }
  if (u) {
    if (initial === 'start' || !initial) { showStart(); return; }
    /* ผู้ใช้ล็อกอินแล้วขอมุมมองอื่น: แอดมินดูได้ทุกมุม ส่วน role อื่นๆ ให้กลับมุมตัวเอง */
    if (u.role === 'admin' && ['manager', 'vendor', 'customer'].includes(initial)) { chooseRole(initial); return; }
    routeAfterLogin(u);
    return;
  }
  /* บุคคลทั่วไป: เข้าชมตลาดได้ ส่วนมุมผจก./ร้านค้าต้องล็อกอิน */
  if (initial === 'customer') chooseRole('customer');
  else showStart();
})();
document.addEventListener('click', (e) => {
  if (e.target.closest && e.target.closest('[data-lang]')) {
    const b = e.target.closest('[data-lang]');
    if (b.closest('.lang-switch') && !b.closest('#lang-switch-side, #lang-switch-start, #lang-switch-login, #lang-switch-acct')) {
      TS.setLang(b.dataset.lang);
      syncLangButtons();
    }
  }
}, true);

/* ═══════ v5.1 · ปิด pinch-zoom บน iOS Safari (ไม่สนใจ user-scalable=no) ═══════ */
['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) => {
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
});
