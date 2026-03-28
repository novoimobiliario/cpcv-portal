/**
 * auth-check.js — Verificacao de sessao · Ecossistema CPCV
 * Repositorio: github.com/novoimobiliario/cpcv-portal
 * Versao: 1.1 · Marco 2026
 *
 * Uso numa pagina interna:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="https://cdn.jsdelivr.net/gh/novoimobiliario/cpcv-portal@SHA/shared/auth-check.js"></script>
 *   O conteudo da pagina fica oculto ate a sessao ser confirmada.
 *   Expoe: window.CPCV.sb, window.CPCV.currentUser, window.CPCV.mentorado
 *   Dispara: evento 'cpcv:pronto' quando a sessao esta confirmada
 */
(function() {
  'use strict';

  var SB_URL = 'https://zsfgnzowdkwupsevsjbr.supabase.co';
  var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZmduem93ZGt3dXBzZXZzamJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzcyMTIsImV4cCI6MjA4OTYxMzIxMn0.nQIQnwIdVZjoTPOVmDNIAbS7_jT5WxYs9DBGQWV2CEw';

  var MENSAGENS = [
    'A verificar se és mesmo tu…',
    'Só um segundo, o Pinheirinho está a abrir a porta…',
    'A carregar o teu espaço de mentoria…',
    'A confirmar que não és um robot… ou és?',
    'A preparar as tuas ferramentas…',
    'Quase lá. O método CPCV também leva o seu tempo.',
    'A verificar o teu acesso. Prometemos que é rápido.',
    'Um momento. Estamos a afinar os detalhes para ti.',
    'A verificar se mereces aceder…',
  ];

  // ── CSS do loading screen ──────────────────────────────────────────────
  var CSS = '\
#cpcv-auth-loading{\
  position:fixed;inset:0;\
  background:var(--bg,#0c0c0b);\
  z-index:99999;\
  display:flex;\
  flex-direction:column;\
  align-items:center;\
  justify-content:center;\
  gap:20px;\
  font-family:\'DM Sans\',sans-serif;\
  transition:opacity .4s ease;\
}\
#cpcv-auth-loading.fade-out{\
  opacity:0;\
  pointer-events:none;\
}\
.cpcv-auth-logo{\
  width:48px;height:48px;\
  border-radius:12px;\
  background:#111;\
  border:1px solid rgba(255,255,255,.14);\
  display:flex;align-items:center;justify-content:center;\
  margin-bottom:8px;\
}\
.cpcv-auth-logo img{\
  width:30px;height:30px;\
  object-fit:contain;\
  filter:brightness(0) invert(1);\
}\
.cpcv-auth-spinner{\
  width:32px;height:32px;\
  border:2px solid rgba(201,169,110,.2);\
  border-top-color:var(--accent,#c9a96e);\
  border-radius:50%;\
  animation:cpcv-spin .8s linear infinite;\
}\
@keyframes cpcv-spin{to{transform:rotate(360deg)}}\
.cpcv-auth-msg{\
  font-size:13px;\
  color:var(--text-muted,#8a8880);\
  letter-spacing:.01em;\
  text-align:center;\
  max-width:280px;\
  line-height:1.5;\
}\
';

  // ── Injectar CSS e loading screen ────────────────────────────────────
  function injectLoading() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    var msg = MENSAGENS[Math.floor(Math.random() * MENSAGENS.length)];

    var el = document.createElement('div');
    el.id = 'cpcv-auth-loading';
    el.innerHTML = '\
<div class="cpcv-auth-logo">\
  <img src="https://cpcv.pt/logo-cpcv.png" alt="CPCV">\
</div>\
<div class="cpcv-auth-spinner"></div>\
<div class="cpcv-auth-msg" id="cpcv-auth-msg">' + msg + '</div>\
';

    // Esconder o body ate confirmar sessao
    document.body.style.visibility = 'hidden';
    document.body.appendChild(el);
  }

  // ── Remover loading screen ───────────────────────────────────────────
  function removeLoading() {
    var el = document.getElementById('cpcv-auth-loading');
    if (!el) return;
    document.body.style.visibility = '';
    el.classList.add('fade-out');
    setTimeout(function() { el.parentNode && el.parentNode.removeChild(el); }, 450);
  }

  // ── Disparar evento cpcv:pronto com delay para garantir listeners ────
  function dispararPronto(detalhe) {
    // setTimeout 0 garante que todos os scripts inline já registaram listeners
    setTimeout(function() {
      document.dispatchEvent(new CustomEvent('cpcv:pronto', { detail: detalhe }));
    }, 0);
  }

  // ── Inicializar ──────────────────────────────────────────────────────
  function init() {
    injectLoading();

    if (!window.supabase) {
      console.error('[auth-check.js] supabase-js nao encontrado.');
      window.location.href = 'https://cpcv.pt/portal.html';
      return;
    }

    var sb = window.supabase.createClient(SB_URL, SB_KEY);
    window.CPCV = window.CPCV || {};
    window.CPCV.sb = sb;

    sb.auth.getSession().then(function(result) {
      var session = result.data && result.data.session;

      if (!session) {
        window.location.href = 'https://cpcv.pt/portal.html';
        return;
      }

      window.CPCV.currentUser = session.user;

      // Verificar se o portal está activo (excepto para admins)
      sb.from('configuracoes').select('valor').eq('chave','portal_ativo').maybeSingle().then(function(cfg) {
        var portalAtivo = !cfg.data || cfg.data.valor !== 'false';
        if (!portalAtivo) {
          sb.from('mentorados').select('role').eq('user_id', session.user.id).maybeSingle().then(function(r) {
            if (r.data && r.data.role === 'admin') {
              carregarMentorado(sb, session);
            } else {
              window.location.href = 'https://cpcv.pt/manutencao.html';
            }
          });
        } else {
          carregarMentorado(sb, session);
        }
      });
    });
  }

  function carregarMentorado(sb, session) {
    sb.from('mentorados')
      .select('nome,role,creditos_ia,acesso_ia,telefone,email')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(function(res) {
        if (res.data) {
          window.CPCV.mentorado = res.data;
          window._cpvcUserEmail = session.user.email;
        }

        removeLoading();

        dispararPronto({
          user: session.user,
          mentorado: res.data || null,
          sb: sb
        });
      })
      .catch(function(err) {
        console.warn('[auth-check.js] mentorados:', err.message);
        removeLoading();
        dispararPronto({ user: session.user, mentorado: null, sb: sb });
      });
  }

  // Correr quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
