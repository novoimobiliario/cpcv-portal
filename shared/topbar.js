/**
 * topbar.js — Topbar partilhada · Ecossistema CPCV
 * Repositorio: github.com/novoimobiliario/cpcv-portal
 * Versao: 1.2 · Marco 2026
 */

(function() {
  'use strict';

  const CSS = `
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
.cpcv-tb-logo { display: flex; align-items: center; gap: 10px; flex-shrink: 0; cursor: pointer; }
.cpcv-tb-logo-icon { width: 28px; height: 28px; border-radius: 6px; background: #111; border: 1px solid var(--border, rgba(255,255,255,0.10)); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.cpcv-tb-logo-icon img { width: 18px; height: 18px; object-fit: contain; filter: brightness(0) invert(1); }
.cpcv-tb-logo-name { font-size: 13px; font-weight: 500; color: var(--text, #f0ede8); letter-spacing: -0.01em; white-space: nowrap; }
.cpcv-tb-logo-name span { color: var(--accent, #c9a96e); font-weight: 300; }
.cpcv-tb-nav { margin-left: auto; display: flex; align-items: center; gap: 2px; }
.cpcv-tb-btn { padding: 5px 12px; border-radius: 6px; font-size: 13px; color: var(--text-muted, #a8a5a0); background: none; border: none; cursor: pointer; font-family: inherit; transition: color .12s, background .12s; }
.cpcv-tb-btn:hover { color: var(--text, #f0ede8); background: var(--bg3, #1c1c1a); }
.cpcv-tb-btn.active { color: var(--accent, #c9a96e); background: rgba(201,169,110,0.06); font-weight: 500; }
.cpcv-tb-cred { display: flex; align-items: center; gap: 8px; background: var(--bg2, #141413); border: 1px solid var(--border, rgba(255,255,255,0.10)); border-radius: 8px; padding: 4px 10px; font-family: 'DM Mono', monospace; }
.cpcv-tb-cred-icon { font-size: 13px; }
.cpcv-tb-cred-preview { display: none; font-size: 10px; color: #e05c5c; padding: 1px 5px; background: rgba(224,92,92,0.12); border-radius: 3px; }
.cpcv-tb-cred-val { font-size: 12px; font-weight: 500; color: var(--accent, #c9a96e); white-space: nowrap; }
.cpcv-tb-cred-btn { height: 22px; padding: 0 10px; background: var(--accent, #c9a96e); color: #0c0c0b; border: none; border-radius: 4px; font-size: 11px; font-weight: 500; cursor: pointer; font-family: inherit; }
.cpcv-tb-cred-btn:hover { opacity: 0.85; }
.cpcv-tb-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--bg3, #1c1c1a); border: 1px solid var(--border, rgba(255,255,255,0.10)); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 500; color: var(--text-muted, #a8a5a0); font-family: 'DM Mono', monospace; cursor: pointer; flex-shrink: 0; }
.cpcv-tb-back { width: 28px; height: 28px; border-radius: 6px; background: none; border: 1px solid var(--border, rgba(255,255,255,0.10)); color: var(--text-muted, #a8a5a0); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color .12s, border-color .12s; flex-shrink: 0; }
.cpcv-tb-back:hover { color: #e06060; border-color: rgba(224,96,96,0.3); }
/* POPUP CREDITOS */
.cpcv-popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: none; align-items: center; justify-content: center; padding: 20px; }
.cpcv-popup-overlay.open { display: flex; }
.cpcv-popup-modal { background: var(--bg2, #141413); border: 1px solid var(--border, rgba(255,255,255,0.10)); border-radius: 16px; padding: 28px; max-width: 480px; width: 100%; font-family: 'DM Sans', sans-serif; }
.cpcv-popup-title { font-size: 18px; font-weight: 500; color: var(--text, #f0ede8); margin-bottom: 6px; }
.cpcv-popup-sub { font-size: 13px; color: var(--text-muted, #a8a5a0); margin-bottom: 20px; }
.cpcv-popup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.cpcv-popup-card { background: var(--bg, #0c0c0b); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 14px 16px; cursor: pointer; transition: border-color .12s, background .12s; position: relative; }
.cpcv-popup-card:hover { border-color: rgba(201,169,110,0.3); background: rgba(201,169,110,0.03); }
.cpcv-popup-card.selected { border-color: var(--accent, #c9a96e); background: rgba(201,169,110,0.06); }
.cpcv-popup-card-cred { font-family: 'DM Mono', monospace; font-size: 22px; font-weight: 500; color: var(--accent, #c9a96e); }
.cpcv-popup-card-label { font-size: 11px; color: var(--text-muted, #a8a5a0); margin-bottom: 8px; }
.cpcv-popup-card-preco { font-size: 14px; font-weight: 500; color: var(--text, #f0ede8); }
.cpcv-popup-card-popular { position: absolute; top: -8px; right: 10px; background: var(--accent, #c9a96e); color: #0c0c0b; font-size: 9px; font-weight: 600; padding: 2px 8px; border-radius: 4px; letter-spacing: .04em; text-transform: uppercase; }
.cpcv-popup-nota { font-size: 11px; color: var(--text-faint, #4a4845); margin-bottom: 16px; }
.cpcv-popup-btns { display: flex; gap: 8px; }
.cpcv-popup-btn-send { flex: 1; height: 44px; background: var(--accent, #c9a96e); color: #0c0c0b; border: none; border-radius: 8px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: opacity .15s; }
.cpcv-popup-btn-send:hover { opacity: 0.85; }
.cpcv-popup-btn-send:disabled { opacity: 0.4; cursor: not-allowed; }
.cpcv-popup-btn-cancel { height: 44px; padding: 0 20px; background: none; border: 1px solid rgba(255,255,255,0.10); border-radius: 8px; color: var(--text-muted, #a8a5a0); font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; }
.cpcv-popup-sent { font-size: 12px; color: #4a9e6b; text-align: center; margin-top: 10px; min-height: 16px; }
`;

  function buildHTML(opts) {
    return `<div class="cpcv-topbar" id="cpcv-topbar">
  <div class="cpcv-tb-logo" onclick="history.back()" title="Voltar ao portal">
    <div class="cpcv-tb-logo-icon"><img src="https://cpcv.pt/logo-cpcv.png" alt="CPCV"></div>
    <span class="cpcv-tb-logo-name">Ecossistema <span>CPCV</span></span>
  </div>
  <nav class="cpcv-tb-nav">
    <button class="cpcv-tb-btn" onclick="history.back()">Modulos</button>
    ${opts.modulo ? `<button class="cpcv-tb-btn active">${opts.modulo}</button>` : ''}
  </nav>
  <div class="cpcv-tb-cred" id="cpcv-tb-cred" style="display:none">
    <span class="cpcv-tb-cred-icon">🤖</span>
    <span class="cpcv-tb-cred-preview" id="cpcv-tb-cred-preview"></span>
    <span class="cpcv-tb-cred-val" id="cpcv-tb-cred-val">-</span>
    <button class="cpcv-tb-cred-btn" id="cpcv-tb-cred-btn" onclick="CPCVTopbar._onComprar()">Comprar</button>
  </div>
  <div class="cpcv-tb-avatar" id="cpcv-tb-avatar" onclick="CPCVTopbar._onAvatar()" title="Area de utilizador">??</div>
  <button class="cpcv-tb-back" onclick="history.back()" title="Voltar ao portal">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 14H13a1 1 0 001-1V3a1 1 0 00-1-1h-3M6 11l-3-3 3-3M3 8h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </button>
</div>
<div class="cpcv-popup-overlay" id="cpcv-popup-overlay">
  <div class="cpcv-popup-modal">
    <div class="cpcv-popup-title">Comprar creditos IA</div>
    <div class="cpcv-popup-sub">Cada credito corresponde a uma accao de IA. Apos enviares o pedido, recebes as instrucoes de pagamento.</div>
    <div class="cpcv-popup-grid" id="cpcv-popup-grid">
      <div style="color:var(--text-muted,#a8a5a0);font-size:12px;grid-column:span 2;text-align:center;padding:20px">A carregar...</div>
    </div>
    <div class="cpcv-popup-nota">Pagamento por transferencia bancaria. Creditos atribuidos apos confirmacao.</div>
    <div class="cpcv-popup-btns">
      <button class="cpcv-popup-btn-send" id="cpcv-popup-btn-send" disabled onclick="CPCVTopbar._enviarPedido()">Solicitar compra</button>
      <button class="cpcv-popup-btn-cancel" onclick="CPCVTopbar._fecharPopup()">Cancelar</button>
    </div>
    <div class="cpcv-popup-sent" id="cpcv-popup-sent"></div>
  </div>
</div>`;
  }

  window.CPCVTopbar = {
    _sb: null,
    _user: null,
    _pacoteSeleccionado: null,

    _onComprar: function() {
      CPCVTopbar._abrirPopup();
    },
    _onAvatar: function() {
      window.location.href = 'https://cpcv.pt/portal.html#perfil';
    },

    _abrirPopup: async function() {
      var overlay = document.getElementById('cpcv-popup-overlay');
      var btn = document.getElementById('cpcv-popup-btn-send');
      var sent = document.getElementById('cpcv-popup-sent');
      if (!overlay) return;
      CPCVTopbar._pacoteSeleccionado = null;
      if (btn) { btn.disabled = true; btn.textContent = 'Solicitar compra'; }
      if (sent) sent.textContent = '';
      overlay.classList.add('open');
      await CPCVTopbar._carregarPacotes();
    },

    _fecharPopup: function() {
      var overlay = document.getElementById('cpcv-popup-overlay');
      if (overlay) overlay.classList.remove('open');
    },

    _carregarPacotes: async function() {
      var grid = document.getElementById('cpcv-popup-grid');
      if (!grid || !CPCVTopbar._sb) return;
      grid.innerHTML = '<div style="color:var(--text-muted,#a8a5a0);font-size:12px;grid-column:span 2;text-align:center;padding:20px">A carregar...</div>';
      try {
        var result = await CPCVTopbar._sb.from('pacotes_creditos').select('*').eq('ativo', true).order('ordem');
        var pacotes = result.data || [];
        if (!pacotes.length) { grid.innerHTML = '<div style="color:var(--text-muted,#a8a5a0);font-size:12px;grid-column:span 2;text-align:center;padding:20px">Sem pacotes disponiveis.</div>'; return; }
        grid.innerHTML = pacotes.map(function(p) {
          var preco = typeof p.preco === 'number' ? p.preco.toFixed(2).replace('.', ',') + 'EUR' : p.preco;
          return '<div class="cpcv-popup-card" data-id="' + p.id + '" data-label="' + p.creditos + ' creditos - ' + preco + '" onclick="CPCVTopbar._selecionarPacote(this)">'
            + (p.popular ? '<div class="cpcv-popup-card-popular">Popular</div>' : '')
            + '<div class="cpcv-popup-card-cred">' + (p.creditos || 0).toLocaleString('pt-PT') + '</div>'
            + '<div class="cpcv-popup-card-label">creditos</div>'
            + '<div class="cpcv-popup-card-preco">' + preco + '</div>'
            + '</div>';
        }).join('');
      } catch(e) {
        grid.innerHTML = '<div style="color:#e05c5c;font-size:12px;grid-column:span 2;text-align:center;padding:20px">Erro ao carregar pacotes.</div>';
      }
    },

    _selecionarPacote: function(el) {
      document.querySelectorAll('.cpcv-popup-card').forEach(function(c) { c.classList.remove('selected'); });
      el.classList.add('selected');
      CPCVTopbar._pacoteSeleccionado = { id: el.dataset.id, label: el.dataset.label };
      var btn = document.getElementById('cpcv-popup-btn-send');
      if (btn) btn.disabled = false;
    },

    _enviarPedido: async function() {
      if (!CPCVTopbar._pacoteSeleccionado || !CPCVTopbar._sb || !CPCVTopbar._user) return;
      var btn = document.getElementById('cpcv-popup-btn-send');
      var sent = document.getElementById('cpcv-popup-sent');
      if (btn) { btn.disabled = true; btn.textContent = 'A enviar...'; }
      try {
        await CPCVTopbar._sb.from('pedidos').insert({
          user_id: CPCVTopbar._user.id,
          tipo: 'compra_creditos',
          mensagem: 'Pedido de compra: ' + CPCVTopbar._pacoteSeleccionado.label,
          estado: 'pendente'
        });
        if (sent) sent.textContent = 'Pedido enviado! Recebes as instrucoes de pagamento em breve.';
        if (btn) btn.textContent = 'Enviado';
      } catch(e) {
        if (sent) sent.textContent = 'Erro ao enviar pedido. Tenta novamente.';
        if (btn) { btn.disabled = false; btn.textContent = 'Solicitar compra'; }
      }
    },

    init: function(opts) {
      opts = opts || {};
      if (!document.getElementById('cpcv-topbar-css')) {
        var style = document.createElement('style');
        style.id = 'cpcv-topbar-css';
        style.textContent = CSS;
        document.head.appendChild(style);
      }
      var root = document.getElementById('topbar-root') || document.body;
      var wrapper = document.createElement('div');
      wrapper.innerHTML = buildHTML(opts);
      while (wrapper.firstChild) root.parentNode.insertBefore(wrapper.firstChild, root.nextSibling);
      if (opts.onComprar) CPCVTopbar._onComprar = opts.onComprar;
      if (opts.onAvatar) CPCVTopbar._onAvatar = opts.onAvatar;
      // Fechar ao clicar fora
      var overlay = document.getElementById('cpcv-popup-overlay');
      if (overlay) overlay.addEventListener('click', function(e) { if (e.target === overlay) CPCVTopbar._fecharPopup(); });
    },

    setCreditos: function(creditos, acessoIlimitado) {
      var wrap = document.getElementById('cpcv-tb-cred');
      var val  = document.getElementById('cpcv-tb-cred-val');
      var btn  = document.getElementById('cpcv-tb-cred-btn');
      if (!wrap || !val) return;
      wrap.style.display = 'flex';
      if (acessoIlimitado) {
        val.textContent = 'Ilimitado';
        val.style.color = 'var(--ok, #4a9e6b)';
        if (btn) btn.style.display = 'none';
      } else {
        var c = creditos || 0;
        val.textContent = c.toLocaleString('pt-PT') + ' cr.';
        val.style.color = c > 500 ? 'var(--ok, #4a9e6b)' : c > 100 ? 'var(--accent, #c9a96e)' : '#e05c5c';
        if (btn) btn.style.display = 'inline-block';
      }
    },

    setUser: function(sb, user) {
      CPCVTopbar._sb = sb;
      CPCVTopbar._user = user;
    },

    showPreview: function(estimativa) {
      var el = document.getElementById('cpcv-tb-cred-preview');
      if (!el) return;
      var val = parseInt(estimativa);
      if (isNaN(val) || val <= 0) return;
      el.textContent = '~' + val.toLocaleString('pt-PT') + ' cr.';
      el.style.display = 'inline';
    },

    hidePreview: function() {
      var el = document.getElementById('cpcv-tb-cred-preview');
      if (el) el.style.display = 'none';
    },

    setAvatar: function(nome) {
      var el = document.getElementById('cpcv-tb-avatar');
      if (el && nome) el.textContent = nome.split(' ').map(function(p) { return p[0]; }).join('').substring(0,2).toUpperCase();
    }
  };

})();
