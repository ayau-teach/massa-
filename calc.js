/* Қалқымалы калькулятор (Math.js). Тек оқушы енгізген өрнекті есептейді — есептің жауабын өзі көрсетпейді. */
window.PL = window.PL || {};
PL.calc = (function () {
  let win, expr, res, hist, fab;

  function toMathJs(s) {
    return s
      .replace(/×/g, '*').replace(/·/g, '*').replace(/÷/g, '/').replace(/:/g, '/').replace(/−/g, '-').replace(/√/g, 'sqrt')
      .replace(/(\d),(\d)/g, '$1.$2').replace(/,/g, '.')
      .replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)')
      .replace(/(\d)\s*e\s*([+-]?\d)/gi, '$1e$2');
  }

  function format(v) {
    if (typeof v === 'number') {
      if (!isFinite(v)) return PL.t('calcDiv0');
      const s = math.format(v, { precision: 12, lowerExp: -9, upperExp: 15 });
      return s.replace(/\./g, ',');
    }
    return String(v);
  }

  function evaluate(commit) {
    const raw = expr.value.trim();
    if (!raw) { res.textContent = '0'; res.classList.remove('err'); return; }
    if (!window.math) { res.textContent = PL.t('calcLib'); res.classList.add('err'); return; }
    try {
      const v = math.evaluate(toMathJs(raw));
      if (typeof v === 'function' || v === undefined) throw new Error('bad');
      const out = format(typeof v === 'object' && v && v.re !== undefined ? v : v);
      res.textContent = (typeof v === 'object' && v && v.re !== undefined) ? PL.t('calcNotReal') : out;
      res.classList.remove('err');
      if (commit) {
        hist.textContent = raw + ' =';
        expr.value = out.replace(/\s/g, '');
      }
    } catch (e) {
      if (commit) { res.textContent = PL.t('calcErr'); res.classList.add('err'); }
    }
  }

  function press(k) {
    const s = expr.selectionStart ?? expr.value.length, e = expr.selectionEnd ?? expr.value.length;
    if (k === 'C') { expr.value = ''; hist.textContent = ''; evaluate(); expr.focus(); return; }
    if (k === 'back') {
      if (s === e && s > 0) { expr.value = expr.value.slice(0, s - 1) + expr.value.slice(e); expr.selectionStart = expr.selectionEnd = s - 1; }
      else { expr.value = expr.value.slice(0, s) + expr.value.slice(e); expr.selectionStart = expr.selectionEnd = s; }
      evaluate(); expr.focus(); return;
    }
    if (k === '=') { evaluate(true); expr.focus(); return; }
    const ins = { '*': '×', '/': '÷', '-': '−', 'sqrt(': '√(', 'e': '·10^' }[k] || k;
    expr.value = expr.value.slice(0, s) + ins + expr.value.slice(e);
    expr.selectionStart = expr.selectionEnd = s + ins.length;
    if (k === 'e') { /* ×10ⁿ: 2,5·10^-5 түрі */ }
    evaluate(); expr.focus();
  }

  function drag(handle) {
    let sx, sy, ox, oy, on = false;
    handle.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      on = true; handle.setPointerCapture(e.pointerId);
      const r = win.getBoundingClientRect(); sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top;
    });
    handle.addEventListener('pointermove', e => {
      if (!on) return;
      const x = Math.min(Math.max(0, ox + e.clientX - sx), window.innerWidth - win.offsetWidth);
      const y = Math.min(Math.max(0, oy + e.clientY - sy), window.innerHeight - 50);
      win.style.left = x + 'px'; win.style.top = y + 'px'; win.style.right = 'auto'; win.style.bottom = 'auto';
    });
    handle.addEventListener('pointerup', () => { on = false; });
  }

  function toggle(show) {
    const vis = show != null ? show : win.hidden;
    win.hidden = !vis;
    fab.setAttribute('aria-expanded', String(vis));
    if (vis) setTimeout(() => expr.focus(), 0);
  }

  function init() {
    win = document.getElementById('calc'); expr = document.getElementById('calcExpr');
    res = document.getElementById('calcRes'); hist = document.getElementById('calcHist'); fab = document.getElementById('btnCalc');
    fab.addEventListener('click', () => toggle());
    document.getElementById('calcClose').addEventListener('click', () => toggle(false));
    document.getElementById('calcKeys').addEventListener('click', e => { const b = e.target.closest('button'); if (b) press(b.dataset.k); });
    document.getElementById('calcKeys').addEventListener('mousedown', e => e.preventDefault());
    expr.addEventListener('input', () => evaluate());
    expr.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); evaluate(true); }
      if (e.key === 'Escape') toggle(false);
    });
    drag(document.getElementById('calcHead'));
  }

  return { init, toggle, _toMathJs: toMathJs };
})();
