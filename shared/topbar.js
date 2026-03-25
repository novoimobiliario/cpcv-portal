/**
 * topbar.js — Topbar partilhada · Ecossistema CPCV
 * Repositório: github.com/novoimobiliario/cpcv-portal
 * Versão: 1.1 · Março 2026
 *
 * Uso num exercício autónomo:
 *   <div id="topbar-root"></div>
 *   <script src="https://cdn.jsdelivr.net/gh/novoimobiliario/cpcv-portal@main/shared/topbar.js"></script>
 *   <script>
 *     CPCVTopbar.init({
 *       modulo: 'Módulo 00',          // label do módulo activo
 *       onComprar: () => abrirComprar()  // opcional: callback ao clicar Comprar
 *     });
 *   </script>
 */

(function() {
  'use strict';

  // ── CSS ──────────────────────────────────────────────────────────────────
  const CSS = `
/* ══ CPCV TOPBAR ══ */
.cpcv-topbar {
  height: 56px;
  background: var(--bg, #141413);
  border-bottom: 1px solid var(--border, rgba(255,255,255,0.10));
  display: flex;
  align-items: center;
  padding: 0 28px;
  gap: 20px;
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
  font-family: 'DM Sans', sans-serif;
}
.cpcv-topbar * { box-sizing: border-box; }
.cpcv-tb-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  cursor: pointer;
  text-decoration: none;
}
.cpcv-tb-logo-icon {
  width: 28px; height: 28px;
  border-radius: 6px;
  background: #111;
  border: 1px solid var(--border, rgba(255,255,255,0.10));
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.cpcv-tb-logo-icon img {
  width: 18px; height: 18px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}
.cpcv-tb-logo-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text, #f0ede8);
  letter-spacing: -0.01em;
  white-space: nowrap;
}
.cpcv-tb-logo-name span { color: var(--accent, #c9a96e); font-weight: 300; }
.cpcv-tb-nav {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 2px;
}
.cpcv-tb-btn {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-muted, #a8a5a0);
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: color .12s, background .12s;
}
.cpcv-tb-btn:hover { color: var(--text, #f0ede8); background: var(--bg3, #1c1c1a); }
.cpcv-tb-btn.active {
  color: var(--accent, #c9a96e);
  background: rgba(201,169,110,0.06);
  font-weight: 500;
}
.cpcv-tb-cred {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg2, #141413);
  border: 1px solid var(--border, rgba(255,255,255,0.10));
  border-radius: 8px;
  padding: 4px 10px;
  font-family: 'DM Mono', monospace;
}
.cpcv-tb-cred-icon { font-size: 13px; }
.cpcv-tb-cred-preview {
  display: none;
  font-size: 10px;
  color: #e05c5c;
  padding: 1px 5px;
  background: rgba(224,92,92,0.12);
  border-radius: 3px;
}
.cpcv-tb-cred-val {
  font-size: 12px;
  font-weight: 500;
  color: var(--accent, #c9a96e);
  white-space: nowrap;
}
.cpcv-tb-cred-btn {
  height: 22px;
  padding: 0 10px;
  background: var(--accent, #c9a96e);
  color: #0c0c0b;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
}
.cpcv-tb-cred-btn:hover { opacity: 0.85; }
.cpcv-tb-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  background: var(--bg3, #1c1c1a);
  border: 1px solid var(--border, rgba(255,255,255,0.10));
  display: flex; align-items: center; justify-content: center;
  font-size: 10px;
  font-weight: 500;
  color: var(--text-muted, #a8a5a0);
  font-family: 'DM Mono', monospace;
  cursor: pointer;
  flex-shrink: 0;
}
.cpcv-tb-back {
  width: 28px; height: 28px;
  border-radius: 6px;
  background: none;
  border: 1px solid var(--border, rgba(255,255,255,0.10));
  color: var(--text-muted, #a8a5a0);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: color .12s, border-color .12s;
  flex-shrink: 0;
}
.cpcv-tb-back:hover { color: #e06060; border-color: rgba(224,96,96,0.3); }
`;

  // ── HTML ─────────────────────────────────────────────────────────────────
  function buildHTML(opts) {
    return `
<div class="cpcv-topbar" id="cpcv-topbar">
  <div class="cpcv-tb-logo" onclick="history.back()" title="Voltar ao portal">
    <div class="cpcv-tb-logo-icon">
      <img src="https://cpcv.pt/logo-cpcv.png" alt="CPCV">
    </div>
    <span class="cpcv-tb-logo-name">Ecossistema <span>CPCV</span></span>
  </div>
  <nav class="cpcv-tb-nav">
    <button class="cpcv-tb-btn" onclick="history.back()">Modulos</button>
    ${opts.modulo ? `<button class="cpcv-tb-btn active">${opts.modulo}</button>` : ''}
  </nav>
  <div class="cpcv-tb-cred" id="cpcv-tb-cred" style="display:none">
    <span class="cpcv-tb-cred-icon">🤖</span>
    <span class="cpcv-tb-cred-preview" id="cpcv-tb-cred-preview"></span>
    <span class="cpcv-tb-cred-val" id="cpcv-tb-cred-val">—</span>
    <button class="cpcv-tb-cred-btn" id="cpcv-tb-cred-btn" onclick="CPCVTopbar._onComprar()">Comprar</button>
  </div>
  <div class="cpcv-tb-avatar" id="cpcv-tb-avatar" onclick="CPCVTopbar._onAvatar()" title="Area de utilizador" style="cursor:pointer">??</div>
  <button class="cpcv-tb-back" onclick="history.back()" title="Voltar ao portal">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M10 14H13a1 1 0 001-1V3a1 1 0 00-1-1h-3M6 11l-3-3 3-3M3 8h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
</div>`;
  }

  // ── API PÚBLICA ───────────────────────────────────────────────────────────
  window.CPCVTopbar = {
    _onComprar: function() {
      window.location.href = 'https://cpcv.pt/portal.html#creditos';
    },

    _onAvatar: function() {
      window.location.href = 'https://cpcv.pt/portal.html#perfil';
    },

    init: function(opts) {
      opts = opts || {};

      // Injectar CSS
      if (!document.getElementById('cpcv-topbar-css')) {
        const style = document.createElement('style');
        style.id = 'cpcv-topbar-css';
        style.textContent = CSS;
        document.head.appendChild(style);
      }

      // Injectar HTML
      const root = document.getElementById('topbar-root') || document.body;
      const wrapper = document.createElement('div');
      wrapper.innerHTML = buildHTML(opts);
      root.parentNode.insertBefore(wrapper.firstElementChild, root.nextSibling);

      // Callbacks opcionais
      if (opts.onComprar) this._onComprar = opts.onComprar;
      if (opts.onAvatar) this._onAvatar = opts.onAvatar;
    },

    // Actualizar créditos na topbar — botão Comprar sempre visível
    setCreditos: function(creditos, acessoIlimitado) {
      const wrap = document.getElementById('cpcv-tb-cred');
      const val  = document.getElementById('cpcv-tb-cred-val');
      const btn  = document.getElementById('cpcv-tb-cred-btn');
      if (!wrap || !val) return;
      wrap.style.display = 'flex';
      if (acessoIlimitado) {
        val.textContent = 'Ilimitado';
        val.style.color = 'var(--ok, #4a9e6b)';
        if (btn) btn.style.display = 'none';
      } else {
        const c = creditos || 0;
        val.textContent = c.toLocaleString('pt-PT') + ' cr.';
        val.style.color = c > 500
          ? 'var(--ok, #4a9e6b)'
          : c > 100
            ? 'var(--accent, #c9a96e)'
            : '#e05c5c';
        if (btn) btn.style.display = 'inline-block';
      }
    },

    // Mostrar previsão de créditos (antes de chamar IA)
    showPreview: function(estimativa) {
      const el = document.getElementById('cpcv-tb-cred-preview');
      if (!el) return;
      const val = parseInt(estimativa);
      if (isNaN(val) || val <= 0) return;
      el.textContent = '~' + val.toLocaleString('pt-PT') + ' cr.';
      el.style.display = 'inline';
    },

    // Esconder previsão (depois de gerar)
    hidePreview: function() {
      const el = document.getElementById('cpcv-tb-cred-preview');
      if (el) el.style.display = 'none';
    },

    // Definir avatar com iniciais
    setAvatar: function(nome) {
      const el = document.getElementById('cpcv-tb-avatar');
      if (el && nome) el.textContent = nome.split(' ').map(p => p[0]).join('').substring(0,2).toUpperCase();
    }
  };

})();
