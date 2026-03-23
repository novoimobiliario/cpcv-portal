/* ============================================================
   portal.js — CPCV Portal
   Biblioteca partilhada — carregada por todos os exercícios
   https://cdn.jsdelivr.net/gh/[repo]@main/shared/portal.js
   ============================================================ */

(() => {
  const SUPABASE_URL  = 'https://zsfgnzowdkwupsevsjbr.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZmduem93ZGt3dXBzZXZzamJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzcyMTIsImV4cCI6MjA4OTYxMzIxMn0.nQIQnwIdVZjoTPOVmDNIAbS7_jT5WxYs9DBGQWV2CEw';

  const CTA = {
    urls: {
      comunidade: 'https://maisimobiliario.pt/comunidade',
      start:      'https://cpcv.pt/start',
      contacto:   'mailto:augusto@pinheirinho.pt',
    },
    mensagem: 'O teu acesso a esta ferramenta expirou. Para continuares, junta-te à comunidade, entra na mentoria ou fala diretamente connosco.',
    botoes: [
      { label: 'Comunidade Mais Imobiliário', url: 'https://maisimobiliario.pt/comunidade' },
      { label: 'CPCV START',                  url: 'https://cpcv.pt/start'                },
      { label: 'Falar connosco',              url: 'mailto:augusto@pinheirinho.pt'        },
    ],
  };

  /* ----------------------------------------------------------
     Utilitários Supabase (sem SDK — fetch directo)
  ---------------------------------------------------------- */
  async function sbGet(path, token) {
    const headers = {
      apikey:        SUPABASE_ANON,
      Authorization: token ? `Bearer ${token}` : `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json',
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    return res.json();
  }

  async function sbRpc(fn, params, token) {
    const headers = {
      apikey:        SUPABASE_ANON,
      Authorization: token ? `Bearer ${token}` : `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json',
    };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`RPC error: ${res.status}`);
    return res.json();
  }

  /* ----------------------------------------------------------
     Sessão
  ---------------------------------------------------------- */
  function getSession() {
    try {
      const raw = localStorage.getItem(
        `sb-${SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`
      );
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function getToken() {
    const s = getSession();
    return s?.access_token || null;
  }

  function getUserId() {
    const s = getSession();
    return s?.user?.id || null;
  }

  /* ----------------------------------------------------------
     UI — overlay de bloqueio
  ---------------------------------------------------------- */
  function injectStyles() {
    if (document.getElementById('cpcv-styles')) return;
    const style = document.createElement('style');
    style.id = 'cpcv-styles';
    style.textContent = `
      [data-cpcv-nivel] { position: relative; }

      .cpcv-overlay {
        position: absolute;
        inset: 0;
        background: rgba(255,255,255,0.72);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        border-radius: inherit;
        cursor: not-allowed;
      }

      @media (prefers-color-scheme: dark) {
        .cpcv-overlay { background: rgba(20,20,20,0.72); }
      }

      .cpcv-lock-icon {
        font-size: 22px;
        opacity: 0.5;
      }

      .cpcv-cta-modal {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 24px;
      }

      .cpcv-cta-box {
        background: #fff;
        border-radius: 16px;
        padding: 36px 32px;
        max-width: 420px;
        width: 100%;
        text-align: center;
        font-family: sans-serif;
      }

      @media (prefers-color-scheme: dark) {
        .cpcv-cta-box { background: #1e1e1e; color: #e5e5e5; }
      }

      .cpcv-cta-box p {
        font-size: 15px;
        line-height: 1.6;
        margin: 0 0 24px;
        color: inherit;
      }

      .cpcv-cta-btn {
        display: block;
        width: 100%;
        padding: 12px 16px;
        margin-bottom: 10px;
        border-radius: 8px;
        border: none;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        color: #fff;
      }

      .cpcv-cta-btn.primary   { background: #534AB7; }
      .cpcv-cta-btn.secondary { background: #0F6E56; }
      .cpcv-cta-btn.tertiary  { background: #444441; }

      .cpcv-cta-close {
        margin-top: 16px;
        font-size: 13px;
        color: #888;
        cursor: pointer;
        background: none;
        border: none;
        text-decoration: underline;
      }

      .cpcv-readonly-badge {
        display: inline-block;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.04em;
        padding: 2px 8px;
        border-radius: 4px;
        background: #EEEDFE;
        color: #3C3489;
        margin-left: 8px;
        vertical-align: middle;
      }

      @media (prefers-color-scheme: dark) {
        .cpcv-readonly-badge { background: #26215C; color: #AFA9EC; }
      }
    `;
    document.head.appendChild(style);
  }

  function mostrarCTA() {
    if (document.getElementById('cpcv-modal')) return;
    const modal = document.createElement('div');
    modal.className = 'cpcv-cta-modal';
    modal.id = 'cpcv-modal';

    const btns = CTA.botoes.map((b, i) => {
      const cls = ['primary', 'secondary', 'tertiary'][i] || 'tertiary';
      return `<a href="${b.url}" class="cpcv-cta-btn ${cls}" target="_blank">${b.label}</a>`;
    }).join('');

    modal.innerHTML = `
      <div class="cpcv-cta-box">
        <p>${CTA.mensagem}</p>
        ${btns}
        <button class="cpcv-cta-close" onclick="document.getElementById('cpcv-modal').remove()">Fechar</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });
  }

  function aplicarBloqueio(el) {
    el.style.position = 'relative';
    if (el.querySelector('.cpcv-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'cpcv-overlay';
    overlay.innerHTML = '<span class="cpcv-lock-icon">🔒</span>';
    overlay.addEventListener('click', mostrarCTA);
    el.appendChild(overlay);
  }

  function aplicarNivel(acesso) {
    // acesso: 'interativo' | 'readonly' | 'expirado' | 'sem_acesso'
    document.body.setAttribute('data-cpcv-acesso', acesso);

    const bloqueados = ['readonly', 'expirado', 'sem_acesso'];
    if (!bloqueados.includes(acesso)) return;

    // Bloqueia todos os elementos marcados com data-cpcv-nivel
    document.querySelectorAll('[data-cpcv-nivel]').forEach(el => {
      aplicarBloqueio(el);
    });

    // Se expirado, mostra o modal automaticamente ao fim de 1s
    if (acesso === 'expirado') {
      setTimeout(mostrarCTA, 1000);
    }
  }

  /* ----------------------------------------------------------
     Chamada à Edge Function (IA)
  ---------------------------------------------------------- */
  async function usarIA({ messages, system, max_tokens = 1000, ferramenta = 'geral' }) {
    const token = getToken();
    if (!token) throw new Error('Não autenticado');

    const res = await fetch(`${SUPABASE_URL}/functions/v1/claude-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${token}`,
      },
      body: JSON.stringify({ messages, system, max_tokens, ferramenta }),
    });

    if (res.status === 402) {
      mostrarCTA();
      throw new Error('sem_creditos');
    }

    if (!res.ok) throw new Error(`Erro IA: ${res.status}`);
    return res.json();
  }

  /* ----------------------------------------------------------
     Init principal
  ---------------------------------------------------------- */
  async function init() {
    injectStyles();

    const token  = getToken();
    const userId = getUserId();

    // Sem sessão → redireciona para login
    if (!token || !userId) {
      const loginUrl = document.body.dataset.cpcvLogin || '/login.html';
      window.location.href = loginUrl;
      return;
    }

    // Obter exercício actual (atributo no <body>)
    const exercicioId = document.body.dataset.cpcvExercicio;

    // Obter dados do mentorado
    let mentorado = null;
    try {
      const rows = await sbGet(
        `mentorados?user_id=eq.${userId}&select=id,nome,email,role,creditos_ia,acesso_ia`,
        token
      );
      mentorado = rows[0] || null;
    } catch (e) {
      console.error('CPCV: erro ao carregar mentorado', e);
    }

    if (!mentorado) {
      window.location.href = document.body.dataset.cpcvLogin || '/login.html';
      return;
    }

    // Verificar acesso ao exercício (se houver ID definido)
    let acesso = 'interativo';
    if (exercicioId) {
      try {
        acesso = await sbRpc('verificar_acesso_exercicio', {
          p_user_id:      userId,
          p_exercicio_id: exercicioId,
        }, token);
      } catch (e) {
        console.error('CPCV: erro ao verificar acesso', e);
        acesso = 'sem_acesso';
      }
    }

    // Expor objecto global CPCV
    window.CPCV = {
      user:     mentorado,
      nivel:    mentorado.role,
      acesso,
      creditos: mentorado.creditos_ia,
      usarIA,
      mostrarCTA,
      ui: {
        bloquearElemento: aplicarBloqueio,
        mostrarModal:     mostrarCTA,
      },
    };

    // Aplicar bloqueios visuais
    aplicarNivel(acesso);

    // Evento para os exercícios saberem que o CPCV está pronto
    document.dispatchEvent(new CustomEvent('cpcv:pronto', { detail: window.CPCV }));
  }

  // Arrancar após o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
