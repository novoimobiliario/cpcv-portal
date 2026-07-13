// ═══════════════════════════════════════════════════════════════════════
// CPCV · Selector de Ofertas partilhado (M5: m5-03 página de captação + m5-04 conector)
// Fonte única do UI "Que oferta?": linhas .of-row + pesquisa + tags de estado + apagar.
//
// A página cria uma instância e mantém wrappers GLOBAIS com os nomes
// listarOfertas / renderOfertasGrid / setOfTag / escolherOferta / apagarOferta
// (o HTML renderizado usa onclick inline com estes nomes).
//
//   const _ofSel = CPCVOfertaSelector.criar({
//     sb:   () => sb,                    // lazy: só existe após cpcv:pronto
//     user: () => currentUser,
//     toast: (msg, kind) => _toast(msg, kind),
//     lmId: () => _lm?.id,               // oferta seleccionada (marca a linha .on)
//     confirmApagar: (titulo) => '…',    // mensagem completa do confirm()
//     onEscolhida: async (data, estado) => { …estado da página: chip, flags, tab… },
//     onApagadaSelecionada: () => { …limpeza quando a apagada era a seleccionada… },
//     pillsExtra: (o, estado) => ''      // opcional: pills extra por linha (ex.: "sem página")
//   });
//
// IDs de DOM esperados na página: of-loading · of-vazio · of-grid · of-filtros · of-q · of-tags
// Classes .pill/.pill-ok/.pill-warn/.pill-info/.pill-faint vêm do CSS da página
// (são partilhadas com outros componentes); o CSS .of-* é injectado por este ficheiro.
// ═══════════════════════════════════════════════════════════════════════
(function(){
'use strict';

// ── CSS do selector (antes duplicado inline em m5-03 + m5-04) ──
var CSS =
".of-filtros{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px}" +
".of-filtros input{flex:1;min-width:200px;background:var(--bg3);border:1px solid var(--border);color:var(--text);border-radius:var(--radius);padding:10px 13px;font-size:13px;font-family:inherit;outline:none;transition:border-color .15s}" +
".of-filtros input:focus{border-color:var(--accent)}" +
".of-tag{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--text-muted);border:1px dashed var(--border);border-radius:20px;padding:5px 12px;cursor:pointer;user-select:none;white-space:nowrap;transition:all .12s;font-family:'DM Mono',monospace}" +
".of-tag:hover{color:var(--text);border-color:var(--border-hover)}" +
".of-tag.on{color:var(--accent);border-style:solid;border-color:var(--accent);background:rgba(201,169,110,.08)}" +
".of-list{display:flex;flex-direction:column;gap:8px}" +
".of-row{display:flex;align-items:center;gap:12px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;cursor:pointer;transition:border-color .15s}" +
".of-row:hover{border-color:var(--border-hover)}" +
".of-row.on{border-color:var(--accent);background:linear-gradient(90deg,rgba(201,169,110,.07),var(--bg3))}" +
".of-row .of-tit{flex:1;min-width:0;font-size:13.5px;font-weight:600;line-height:1.35}" +
".of-row .of-pills{display:flex;gap:5px;align-items:center;flex-wrap:wrap;justify-content:flex-end}" +
".of-row .of-data{font-size:10px;color:var(--text-faint);font-family:'DM Mono',monospace;white-space:nowrap}" +
".of-row .of-del{background:none;border:1px solid transparent;border-radius:6px;padding:4px 7px;cursor:pointer;font-size:12px;opacity:.35;transition:all .12s;flex-shrink:0}" +
".of-row:hover .of-del{opacity:1}" +
".of-row .of-del:hover{border-color:var(--danger);background:rgba(224,96,96,.08)}" +
".of-row .of-arrow{color:var(--text-faint);font-size:14px;flex-shrink:0}" +
".of-row.on .of-arrow{color:var(--accent)}" +
".of-nada{text-align:center;padding:26px;color:var(--text-faint);font-size:12px}" +
"@media(max-width:640px){.of-row{flex-wrap:wrap}.of-row .of-pills{justify-content:flex-start}}";

if (!document.getElementById('cpcv-of-selector-css')) {
  var st = document.createElement('style');
  st.id = 'cpcv-of-selector-css';
  st.textContent = CSS;
  document.head.appendChild(st);
}

var SUB_LAB = { checklist:'Checklist', 'x-erros':'X erros', 'y-motivos':'Y motivos', 'guia-simples':'Guia', 'ebook-curto':'eBook' };
var TAGS = [['todas','Todas'], ['publicado','✓ Publicadas'], ['pronta','Prontas a publicar'], ['rascunho','Rascunhos']];
var EST_PILL = {
  publicado: '<span class="pill pill-ok">publicado</span>',
  pronta:    '<span class="pill pill-info">pronta</span>',
  rascunho:  '<span class="pill pill-faint">rascunho</span>'
};

function $(id){ return document.getElementById(id); }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }

function estadoLogico(o){
  if (o.estado === 'publicado') return 'publicado';
  if (o.ficheiro_path) return 'pronta';
  return 'rascunho';
}
function norm(t){ return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

function criar(cfg){
  // estado interno; exposto às hooks via 2º argumento e em instancia.estado
  var S = { ofertas: [], canaisPorLm: {}, paginasPorLm: {}, tag: 'todas' };

  async function listar(){
    try {
      var res = await Promise.all([
        cfg.sb().from('leadmagnets')
          .select('id, titulo, subtipo, estado, ficheiro_path, actualizado_em')
          .eq('user_id', cfg.user().id)
          .neq('estado', 'arquivado')
          .order('actualizado_em', { ascending: false }),
        cfg.sb().from('leadmagnet_canais')
          .select('leadmagnet_id, tipo_canal, publicado')
          .eq('user_id', cfg.user().id)
      ]);
      if (res[0].error) throw res[0].error;
      S.ofertas = res[0].data || [];
      S.canaisPorLm = {};
      S.paginasPorLm = {};
      (res[1].data || []).forEach(function(c){
        if (!c.publicado) return;
        S.paginasPorLm[c.leadmagnet_id] = (S.paginasPorLm[c.leadmagnet_id] || 0) + 1;
        if (!S.canaisPorLm[c.leadmagnet_id]) S.canaisPorLm[c.leadmagnet_id] = {};
        S.canaisPorLm[c.leadmagnet_id][c.tipo_canal] = true;
      });
    } catch(e){ console.warn('ofertas:', e && e.message); S.ofertas = []; }
    var load = $('of-loading'); if (load) load.style.display = 'none';
    if (!S.ofertas.length){ $('of-vazio').style.display = 'block'; $('of-grid').style.display = 'none'; return; }
    render();
  }

  function render(){
    var filtros = $('of-filtros'); if (filtros) filtros.style.display = S.ofertas.length ? 'flex' : 'none';

    // Tags com contagem (só as que existem)
    var counts = { todas: S.ofertas.length, publicado: 0, pronta: 0, rascunho: 0 };
    S.ofertas.forEach(function(o){ counts[estadoLogico(o)]++; });
    var tagsEl = $('of-tags');
    if (tagsEl) tagsEl.innerHTML = TAGS
      .filter(function(t){ return t[0] === 'todas' || counts[t[0]] > 0; })
      .map(function(t){ return '<span class="of-tag' + (S.tag === t[0] ? ' on' : '') + '" onclick="setOfTag(\'' + t[0] + '\')">' + t[1] + ' <b>' + counts[t[0]] + '</b></span>'; }).join(' ');

    var qEl = $('of-q');
    var q = norm(qEl && qEl.value);
    var vis = S.ofertas.filter(function(o){
      if (S.tag !== 'todas' && estadoLogico(o) !== S.tag) return false;
      if (q && !norm(o.titulo).includes(q)) return false;
      return true;
    });

    var g = $('of-grid');
    g.style.display = 'flex';
    if (!vis.length){
      g.innerHTML = '<div class="of-nada">Nenhuma oferta ' + (q ? 'com "' + esc(qEl.value) + '"' : 'neste filtro') + '.</div>';
      return;
    }
    var selId = cfg.lmId();
    g.innerHTML = vis.map(function(o){
      var est = estadoLogico(o);
      var data = o.actualizado_em ? new Date(o.actualizado_em).toLocaleDateString('pt-PT', { day:'2-digit', month:'short' }) : '';
      return '<div class="of-row' + (selId === o.id ? ' on' : '') + '" onclick="escolherOferta(\'' + o.id + '\')">' +
        '<div class="of-tit">' + esc(o.titulo || '(sem título)') + '</div>' +
        '<div class="of-pills">' +
          '<span class="pill pill-faint">' + esc(SUB_LAB[o.subtipo] || o.subtipo || '—') + '</span>' +
          '<span class="pill ' + (o.ficheiro_path ? 'pill-ok' : 'pill-warn') + '">' + (o.ficheiro_path ? 'PDF ✓' : 'sem PDF') + '</span>' +
          ((S.canaisPorLm[o.id] || {}).formulario ? '<span class="pill pill-ok">📄 formulário</span>' : '') +
          ((S.canaisPorLm[o.id] || {}).landing_page ? '<span class="pill pill-ok">🖼 landing</span>' : '') +
          (cfg.pillsExtra ? cfg.pillsExtra(o, S) : '') +
          EST_PILL[est] +
          (data ? '<span class="of-data">' + data + '</span>' : '') +
        '</div>' +
        '<button class="of-del" onclick="apagarOferta(\'' + o.id + '\', event)" title="Apagar esta oferta">🗑</button>' +
        '<span class="of-arrow">→</span>' +
      '</div>';
    }).join('');
  }

  function setTag(t){ S.tag = t; render(); }

  async function escolher(id){
    try {
      var res = await cfg.sb().from('leadmagnets').select('*').eq('id', id).eq('user_id', cfg.user().id).maybeSingle();
      if (res.error) throw res.error;
      if (!res.data){ cfg.toast('Não encontrei essa oferta.', 'err'); return; }
      await cfg.onEscolhida(res.data, S);
      if (S.ofertas.length) render();
    } catch(e){ cfg.toast('Erro a carregar a oferta: ' + (e.message || e), 'err'); }
  }

  async function apagar(id, ev){
    if (ev){ ev.stopPropagation(); ev.preventDefault(); }
    var o = S.ofertas.find(function(x){ return x.id === id; });
    if (!confirm(cfg.confirmApagar((o && o.titulo) || ''))) return;
    try {
      var res = await cfg.sb().from('leadmagnets').delete().eq('id', id).eq('user_id', cfg.user().id);
      if (res.error) throw res.error;
      S.ofertas = S.ofertas.filter(function(x){ return x.id !== id; });
      delete S.canaisPorLm[id];
      delete S.paginasPorLm[id];
      if (cfg.lmId() === id) cfg.onApagadaSelecionada();
      if (!S.ofertas.length){ $('of-grid').style.display = 'none'; $('of-filtros').style.display = 'none'; $('of-vazio').style.display = 'block'; }
      else render();
      cfg.toast('✓ Oferta apagada', 'ok');
    } catch(e){ cfg.toast('Erro a apagar: ' + (e.message || e), 'err'); }
  }

  return { listar: listar, render: render, setTag: setTag, escolher: escolher, apagar: apagar, estado: S, estadoLogico: estadoLogico, norm: norm };
}

window.CPCVOfertaSelector = { criar: criar };
})();
