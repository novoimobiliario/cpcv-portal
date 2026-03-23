/*
 * portal.js — Lógica partilhada CPCV
 * Autenticação · Controlo de acesso · Créditos IA
 * Versão: 1.0.0 · Março 2026
 *
 * Como usar:
 * <script src="https://cdn.jsdelivr.net/gh/novoimobiliario/cpcv-portal@main/shared/portal.js"></script>
 *
 * Expõe o objecto global window.CPCV:
 *   CPCV.user      → utilizador Supabase
 *   CPCV.perfil    → dados da tabela mentorados
 *   CPCV.nivel     → 'visitante' | 'comunidade' | 'avulso' | 'start' | 'mais' | 'operacional' | 'admin'
 *   CPCV.acesso    → 'interativo' | 'readonly' | 'expirado' | 'sem_acesso'
 *   CPCV.creditos  → número de créditos IA disponíveis
 *   CPCV.usarIA()  → função para chamar a API IA (debita créditos)
 *
 * O exercício ouve o evento: document.addEventListener('cpcv:pronto', () => { ... })
 */

(function () {
  'use strict';

  // ── CONFIGURAÇÃO ──────────────────────────────────────────
  const SUPABASE_URL = 'https://zsfgnzowdkwupsevsjbr.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZmduem93ZGt3dXBzZXZzamJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzcyMTIsImV4cCI6MjA4OTYxMzIxMn0.nQIQnwIdVZjoTPOVmDNIAbS7_jT5WxYs9DBGQWV2CEw';
  const CLAUDE_PROXY  = SUPABASE_URL + '/functions/v1/claude-proxy';

  // Hierarquia de níveis (quanto maior o índice, mais acesso tem)
  const NIVEIS = ['visitante', 'comunidade', 'avulso', 'start', 'mais', 'operacional', 'admin'];

  // ── ESTADO GLOBAL ─────────────────────────────────────────
  window.CPCV = {
    user:     null,
    perfil:   null,
    nivel:    'visitante',
    acesso:   'sem_acesso',
    creditos: 0,
    sb:       null,
    usarIA:   usarIA,
  };

  // ── INICIALIZAÇÃO ─────────────────────────────────────────
  async function init() {
    // 1. Carregar Supabase (se não estiver já carregado)
    if (!window.supabase) {
      await carregarScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
    }

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    window.CPCV.sb = sb;

    // 2. Verificar sessão
    const { data: { session } } = await sb.auth.getSession();

    if (!session) {
      // Sem login — mostrar ecrã de login ou acesso limitado
      mostrarEcrãLogin();
      return;
    }

    window.CPCV.user = session.user;

    // 3. Carregar perfil do mentorado
    const { data: perfil } = await sb
      .from('mentorados')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (perfil) {
      window.CPCV.perfil   = perfil;
      window.CPCV.nivel    = perfil.nivel || 'visitante';
      window.CPCV.creditos = perfil.creditos_ia || 0;
      // Guardar nome globalmente para prompts IA
      window._perfilNome = perfil.nome ? perfil.nome.split(' ')[0] : '';
    }

    // 4. Verificar acesso ao exercício actual
    const exercicioId = document.body.dataset.exercicioId;
    if (exercicioId) {
      await verificarAcesso(sb, session.user.id, exercicioId);
    } else {
      // Sem exercício específico — acesso baseado no nível
      window.CPCV.acesso = 'interativo';
    }

    // 5. Aplicar restrições visuais (elementos com data-cpcv-nivel)
    aplicarRestricoes();

    // 6. Actualizar topbar se existir
    actualizarTopbar();

    // 7. Disparar evento — o exercício pode arrancar
    document.dispatchEvent(new CustomEvent('cpcv:pronto', {
      detail: window.CPCV
    }));
  }

  // ── VERIFICAR ACESSO VIA SUPABASE ─────────────────────────
  async function verificarAcesso(sb, userId, exercicioId) {
    try {
      const { data, error } = await sb.rpc('verificar_acesso_exercicio', {
        p_user_id:     userId,
        p_exercicio_id: exercicioId
      });

      if (error) throw error;

      window.CPCV.acesso = data || 'sem_acesso';

      if (data === 'expirado') {
        mostrarEcrãExpirado();
      } else if (data === 'sem_acesso') {
        mostrarEcrãSemAcesso();
      } else if (data === 'readonly') {
        bloquearInteracoes();
      }
    } catch (e) {
      console.warn('CPCV: erro a verificar acesso', e);
      window.CPCV.acesso = 'sem_acesso';
    }
  }

  // ── RESTRIÇÕES VISUAIS ────────────────────────────────────
  function aplicarRestricoes() {
    const nivelIdx = NIVEIS.indexOf(window.CPCV.nivel);

    document.querySelectorAll('[data-cpcv-nivel]').forEach(el => {
      const nivelRequerido = el.dataset.cpcvNivel;
      const requerIdx = NIVEIS.indexOf(nivelRequerido);
      if (nivelIdx < requerIdx) {
        el.classList.add('cpcv-bloqueado');
        el.setAttribute('title', 'Requer nível ' + nivelRequerido);
      }
    });
  }

  function bloquearInteracoes() {
    // readonly: ver mas não interagir
    document.querySelectorAll('button, input, textarea, select').forEach(el => {
      if (!el.closest('.acesso-overlay')) {
        el.disabled = true;
      }
    });
  }

  // ── TOPBAR ────────────────────────────────────────────────
  function actualizarTopbar() {
    const credEl = document.getElementById('topbar-creditos');
    if (credEl) credEl.textContent = window.CPCV.creditos.toLocaleString('pt-PT') + ' cr.';

    const userEl = document.getElementById('topbar-user');
    if (userEl && window.CPCV.perfil) {
      const nome = window.CPCV.perfil.nome || window.CPCV.user.email;
      userEl.textContent = nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
    }
  }

  // ── ECRÃS DE ESTADO ───────────────────────────────────────
  function mostrarEcrãLogin() {
    // Redirigir para o portal com o URL actual como parâmetro de retorno
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = 'https://cpcv.pt/portal.html?return=' + returnUrl;
  }

  function mostrarEcrãExpirado() {
    mostrarOverlay(
      'O teu acesso expirou',
      'O período de acesso a este exercício terminou. Para continuar a usar os exercícios do ecossistema CPCV, escolhe uma das opções abaixo.',
      [
        { label: 'Comunidade Mais Imobiliário', url: 'https://maisimobiliario.pt/comunidade', primary: true },
        { label: 'CPCV START', url: 'https://cpcv.pt/start', primary: false },
        { label: 'Falar connosco', url: 'mailto:augusto@pinheirinho.pt', primary: false },
      ]
    );
  }

  function mostrarEcrãSemAcesso() {
    mostrarOverlay(
      'Conteúdo não incluído no teu plano',
      'Este exercício não está disponível no teu nível de acesso actual.',
      [
        { label: 'Comunidade Mais Imobiliário', url: 'https://maisimobiliario.pt/comunidade', primary: true },
        { label: 'CPCV START', url: 'https://cpcv.pt/start', primary: false },
        { label: 'Falar connosco', url: 'mailto:augusto@pinheirinho.pt', primary: false },
      ]
    );
  }

  function mostrarOverlay(titulo, descricao, botoes) {
    // Remover overlay anterior se existir
    document.getElementById('cpcv-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'cpcv-overlay';
    overlay.className = 'acesso-overlay';

    const btnsHtml = botoes.map(b =>
      `<a href="${b.url}" class="acesso-btn ${b.primary ? 'acesso-btn-primary' : 'acesso-btn-secondary'}" target="_blank">${b.label}</a>`
    ).join('');

    overlay.innerHTML = `
      <div class="acesso-card">
        <h2>${titulo}</h2>
        <p>${descricao}</p>
        <div class="acesso-btns">${btnsHtml}</div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  // ── FUNÇÃO IA ─────────────────────────────────────────────
  async function usarIA({ mensagens, ferramenta, maxTokens = 1000 }) {
    if (!window.CPCV.user) throw new Error('Sem sessão');
    if (window.CPCV.creditos <= 0) throw new Error('sem_creditos');

    const sb = window.CPCV.sb;
    const { data: { session } } = await sb.auth.getSession();

    const res = await fetch(CLAUDE_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + (session ? session.access_token : ''),
      },
      body: JSON.stringify({
        messages:   mensagens,
        max_tokens: maxTokens,
        ferramenta: ferramenta || 'exercicio',
      }),
    });

    const data = await res.json();

    if (data.error === 'sem_creditos') throw new Error('sem_creditos');
    if (!data.content || !data.content[0]) throw new Error('Resposta inválida da IA');

    // Actualizar créditos localmente
    if (data._creditos_restantes !== undefined) {
      window.CPCV.creditos = data._creditos_restantes;
      actualizarTopbar();
    }

    return data.content[0].text;
  }

  // ── UTILITÁRIOS ───────────────────────────────────────────
  function carregarScript(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // ── ARRANCAR ──────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
