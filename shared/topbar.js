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
    _email: null,

    _onComprar: function() {
      if (!document.getElementById('cpcv-painel-creditos')) CPCVTopbar._injectPainel();
      var p = document.getElementById('cpcv-painel-creditos');
      if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
    },

    _injectPainel: function() {
      var s = document.createElement('style');
      s.textContent = '#cpcv-painel-creditos{background:var(--bg2,#141413);border-bottom:1px solid var(--border,rgba(255,255,255,.1));padding:16px 28px;}'
        + '#cpcv-modal-checkout{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;display:none;align-items:center;justify-content:center;padding:20px;}'
        + '#cpcv-modal-checkout.open{display:flex;}'
        + '.cpcv-modal-box{background:var(--bg2,#141413);border:1px solid var(--border,rgba(255,255,255,.1));border-radius:16px;padding:28px;max-width:460px;width:100%;font-family:\'DM Sans\',sans-serif;}'
        + '.cpcv-pacote{flex:1;min-width:110px;background:var(--bg,#0c0c0b);border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:12px;text-align:center;display:flex;flex-direction:column;gap:6px;cursor:pointer;transition:border-color .12s;}'
        + '.cpcv-pacote:hover{border-color:rgba(201,169,110,.4);}'
        + '.cpcv-pacote.popular{border-color:rgba(201,169,110,.4);position:relative;}'
        + '.cpcv-pacote-cr{font-family:\'DM Mono\',monospace;font-size:14px;font-weight:500;color:var(--accent,#c9a96e);}'
        + '.cpcv-pacote-preco{font-size:12px;color:var(--text-muted,#8a8880);}'
        + '.cpcv-pacote-btn{margin-top:4px;background:var(--accent,#c9a96e);color:#0c0c0b;font-size:11px;font-weight:500;padding:5px 10px;border-radius:5px;}'
        + '.cpcv-popular-badge{position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:var(--accent,#c9a96e);color:#0c0c0b;font-size:8px;font-weight:700;padding:2px 8px;border-radius:3px;white-space:nowrap;letter-spacing:.04em;}';
      document.head.appendChild(s);

      var pacotes = [
        {offer:'mn6j3971',cr:'100 cr.',preco:'8€'},
        {offer:'mn6j4jwg',cr:'300 cr.',preco:'13€'},
        {offer:'mn6j4u4l',cr:'500 cr.',preco:'20€'},
        {offer:'mn6j5cjt',cr:'1000 cr.',preco:'34€',popular:true},
      ];
      var cards = pacotes.map(function(p) {
        return '<div class="cpcv-pacote' + (p.popular?' popular':'') + '" onclick="CPCVTopbar._abrirModal(\'' + p.offer + '\',\'' + p.cr + ' &mdash; ' + p.preco + '\')">'
          + (p.popular ? '<div class="cpcv-popular-badge">POPULAR</div>' : '')
          + '<div class="cpcv-pacote-cr">' + p.cr + '</div>'
          + '<div class="cpcv-pacote-preco">' + p.preco + '</div>'
          + '<div class="cpcv-pacote-btn">Comprar</div>'
          + '</div>';
      }).join('');

      var painel = document.createElement('div');
      painel.id = 'cpcv-painel-creditos';
      painel.style.display = 'none';
      painel.innerHTML = '<div style="max-width:860px;margin:0 auto">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
        + '<span style="font-size:13px;font-weight:500;color:var(--text,#f0ede8)">Comprar cr&eacute;ditos IA</span>'
        + '<button onclick="document.getElementById(\'cpcv-painel-creditos\').style.display=\'none\'" style="background:none;border:none;color:var(--text-faint,#4a4845);cursor:pointer;font-size:18px;padding:0;line-height:1">&times;</button>'
        + '</div>'
        + '<div style="display:flex;gap:10px;flex-wrap:wrap">' + cards + '</div>'
        + '</div>';

      var modal = document.createElement('div');
      modal.id = 'cpcv-modal-checkout';
      modal.innerHTML = '<div class="cpcv-modal-box">'
        + '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px">'
        + '<div><div style="font-size:15px;font-weight:500;color:var(--text,#f0ede8);margin-bottom:4px">Continuar para pagamento</div>'
        + '<div style="font-size:12px;color:var(--text-muted,#8a8880)" id="cpcv-modal-pacote"></div></div>'
        + '<button onclick="CPCVTopbar._fecharModal()" style="background:none;border:none;color:var(--text-faint,#4a4845);cursor:pointer;font-size:20px;padding:0;line-height:1;margin-left:16px">&times;</button>'
        + '</div>'
        + '<div style="background:rgba(201,169,110,.08);border:1px solid rgba(201,169,110,.25);border-radius:10px;padding:14px 16px;margin-bottom:20px">'
        + '<div style="display:flex;gap:10px;align-items:flex-start">'
        + '<div style="font-size:16px;flex-shrink:0">&#9888;&#65039;</div>'
        + '<div><div style="font-size:12px;font-weight:600;color:var(--accent,#c9a96e);letter-spacing:.02em;margin-bottom:6px;text-transform:uppercase">Aten&ccedil;&atilde;o &mdash; l&ecirc; antes de continuar</div>'
        + '<div style="font-size:13px;color:var(--text,#f0ede8);line-height:1.6">Vais ser reencaminhado para o nosso parceiro de pagamentos. Para que os cr&eacute;ditos sejam atribu&iacute;dos automaticamente &agrave; tua conta, <strong>tens de utilizar exactamente este email no checkout:</strong></div>'
        + '<div style="margin-top:10px;display:flex;align-items:center;gap:8px">'
        + '<div style="flex:1;background:var(--bg,#0c0c0b);border:1px solid var(--border,rgba(255,255,255,.1));border-radius:6px;padding:8px 12px;font-family:\'DM Mono\',monospace;font-size:13px;color:var(--accent,#c9a96e);text-align:center" id="cpcv-modal-email">&mdash;</div>'
        + '<button onclick="var e=document.getElementById(\'cpcv-modal-email\');navigator.clipboard.writeText(e.textContent);this.textContent=\'✓\';setTimeout(()=>this.textContent=\'Copiar\',2000)" style="height:36px;padding:0 12px;background:var(--bg3,#1c1c1a);border:1px solid var(--border,rgba(255,255,255,.1));border-radius:6px;color:var(--text-muted,#8a8880);font-family:\'DM Sans\',sans-serif;font-size:12px;cursor:pointer;white-space:nowrap;flex-shrink:0">Copiar</button>'
        + '</div>'
        + '<div style="margin-top:8px;font-size:12px;color:var(--text-muted,#8a8880);line-height:1.5">Se utilizares um email diferente, os cr&eacute;ditos n&atilde;o ser&atilde;o atribu&iacute;dos automaticamente e ter&aacute;s de contactar o suporte.</div>'
        + '</div></div></div>'
        + '<div style="display:flex;gap:10px">'
        + '<a id="cpcv-modal-link" href="#" target="_blank" onclick="CPCVTopbar._fecharModal()" style="flex:1;height:44px;background:var(--accent,#c9a96e);color:#0c0c0b;border:none;border-radius:8px;font-family:\'DM Sans\',sans-serif;font-size:14px;font-weight:500;cursor:pointer;text-decoration:none;display:flex;align-items:center;justify-content:center">Continuar para o pagamento &rarr;</a>'
        + '<button onclick="CPCVTopbar._fecharModal()" style="height:44px;padding:0 20px;background:none;border:1px solid var(--border,rgba(255,255,255,.1));border-radius:8px;color:var(--text-muted,#8a8880);font-family:\'DM Sans\',sans-serif;font-size:14px;cursor:pointer">Cancelar</button>'
        + '</div></div>';
      modal.addEventListener('click', function(e) { if (e.target === modal) CPCVTopbar._fecharModal(); });

      var topbar = document.getElementById('cpcv-topbar');
      if (topbar && topbar.parentNode) topbar.parentNode.insertBefore(painel, topbar.nextSibling);
      else document.body.appendChild(painel);
      document.body.appendChild(modal);
    },

    _abrirModal: function(offer, pacote) {
      var modal = document.getElementById('cpcv-modal-checkout');
      var link = document.getElementById('cpcv-modal-link');
      var pacoteEl = document.getElementById('cpcv-modal-pacote');
      var emailEl = document.getElementById('cpcv-modal-email');
      if (!modal) return;
      if (link) link.href = 'https://checkout.salespark.io/I41MN6J193U/?offer=' + offer;
      // Extrair créditos do pacote (ex: "300 cr. — 13€" → 300)
      var match = pacote.match(/^(\d+)/);
      var creditosPacote = match ? parseInt(match[1]) : 0;
      var creditosActuais = CPCVTopbar._creditos || 0;
      var creditosDepois = creditosActuais + creditosPacote;
      if (pacoteEl) pacoteEl.innerHTML = pacote
        + (creditosPacote > 0 && CPCVTopbar._creditos !== null
          ? ' &nbsp;&middot;&nbsp; <span style="color:var(--ok,#4a9e6b)">Cr&eacute;ditos ap&oacute;s a compra: ' + creditosDepois.toLocaleString('pt-PT') + '</span>'
          : '');
      // Email do utilizador
      var email = CPCVTopbar._email || window._cpvcUserEmail || '—';
      if (emailEl) emailEl.textContent = email;
      modal.classList.add('open');
    },

    _fecharModal: function() {
      var modal = document.getElementById('cpcv-modal-checkout');
      if (modal) modal.classList.remove('open');
      var painel = document.getElementById('cpcv-painel-creditos');
      if (painel) painel.style.display = 'none';
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
        CPCVTopbar._creditos = null;
        val.textContent = 'Ilimitado';
        val.style.color = 'var(--ok, #4a9e6b)';
        if (btn) btn.style.display = 'none';
      } else {
        const c = creditos || 0;
        CPCVTopbar._creditos = c;
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
    },

    setEmail: function(email) {
      CPCVTopbar._email = email;
      window._cpvcUserEmail = email;
    }
  };

})();
