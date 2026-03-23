/*
 * portal.js — Lógica partilhada CPCV
 * Versão: 1.1.0 · Março 2026
 */

(function () {
  'use strict';

  const SUPABASE_URL = 'https://zsfgnzowdkwupsevsjbr.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzZmduem93ZGt3dXBzZXZzamJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzcyMTIsImV4cCI6MjA4OTYxMzIxMn0.nQIQnwIdVZjoTPOVmDNIAbS7_jT5WxYs9DBGQWV2CEw';
  const CLAUDE_PROXY = SUPABASE_URL + '/functions/v1/claude-proxy';

  window.CPCV = {
    user:     null,
    perfil:   null,
    nivel:    'visitante',
    acesso:   'sem_acesso',
    creditos: 0,
    sb:       null,
    usarIA:   usarIA,
  };

  async function init() {
    // Supabase já está carregado pelo exercício
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    window.CPCV.sb = sb;

    // Verificar sessão
    const { data: { session } } = await sb.auth.getSession();

    if (!session) {
      // Sem sessão — disparar evento para o exercício tratar
      document.dispatchEvent(new CustomEvent('cpcv:pronto', {
        detail: { acesso: 'sem_acesso', nivel: 'visitante' }
      }));
      return;
    }

    window.CPCV.user = session.user;

    // Carregar perfil
    const { data: perfil } = await sb
      .from('mentorados')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (perfil) {
      window.CPCV.perfil   = perfil;
      window.CPCV.nivel    = perfil.nivel || 'start';
      window.CPCV.creditos = perfil.creditos_ia || 0;
      window._perfilNome   = perfil.nome ? perfil.nome.split(' ')[0] : '';
    }

    // Acesso concedido — sem verificação complexa por agora
    window.CPCV.acesso = 'interativo';

    // Actualizar topbar
    actualizarTopbar();

    // Exercício pode arrancar
    document.dispatchEvent(new CustomEvent('cpcv:pronto', {
      detail: window.CPCV
    }));
  }

  function actualizarTopbar() {
    const credEl = document.getElementById('topbar-creditos');
    if (credEl) credEl.textContent = window.CPCV.creditos.toLocaleString('pt-PT') + ' cr.';

    const userEl = document.getElementById('topbar-user');
    if (userEl && window.CPCV.perfil) {
      const nome = window.CPCV.perfil.nome || window.CPCV.user.email;
      userEl.textContent = nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
    }
  }

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

    if (data._creditos_restantes !== undefined) {
      window.CPCV.creditos = data._creditos_restantes;
      actualizarTopbar();
    }

    return data.content[0].text;
  }

  // Arrancar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
