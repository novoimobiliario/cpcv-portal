// ============================================================================
// publicar-social.js · Modal partilhado de publicação social
// ============================================================================
// Para integração nos exercícios m4-01 (Studio) e m4-02 (Almanaque).
// O m4-03 (Copywriter) tem o seu próprio modal especializado para LinkedIn.
//
// Uso típico:
//   await CPCVPublicarSocial.init({ sb, user, session });
//   CPCVPublicarSocial.abrir({
//     texto: '...',
//     media_url: '...',
//     primeiro_comentario: '...',           // opcional · só se incluir LinkedIn
//     content_studio_id: '...',             // opcional · liga ao projecto de origem
//     plataformas: ['linkedin','meta'],     // ou ['meta'] ou ['linkedin']
//     dataPreFill: '2026-05-12T09:00',      // opcional · pré-preenche datetime
//     onSuccess: (resultado) => {...},      // callback após sucesso
//   });
//
// Depende de:
//   - sb (cliente Supabase)
//   - RPCs: social_token_list · social_quota_status
//   - Edge function: social-publish
//   - Tabela configuracoes (chave='meta_app_status')
// ============================================================================

(function (global) {
  const SB_URL = 'https://zsfgnzowdkwupsevsjbr.supabase.co';
  const PUBLISH_ENDPOINT = SB_URL + '/functions/v1/social-publish';

  let _sb = null;
  let _user = null;
  let _session = null;
  let _mentorado = null;          // para detectar role admin
  let _tokens = [];
  let _metaAppStatus = 'review';  // 'review' | 'live' | 'live_limited'
  let _quota = null;
  let _state = null;

  // Override de status efectivo:
  //   1. Admins têm sempre acesso "live" (para demos do App Review)
  //   2. Se o user já tem token Meta ligado, passou pelo OAuth com sucesso
  //      → não faz sentido apresentar como "em aprovação"
  function _statusEfectivo() {
    if (_mentorado && _mentorado.role === 'admin') return 'live';
    const temFb = _tokens.some(t => t.plataforma === 'facebook' && t.esta_ativo);
    if (temFb) return 'live';
    return _metaAppStatus;
  }

  // ── Helpers ─────────────────────────────────────────────────────────
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);

  function _toLocalDt(d) {
    const pad = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function _toast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1916;border:1px solid #c9a96e;color:#c9a96e;padding:10px 18px;border-radius:8px;font-size:12px;font-family:DM Sans,sans-serif;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,.3)';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  // ── Init: carrega tokens + flag Meta + quota ────────────────────────
  async function init(opts) {
    _sb = opts.sb;
    _user = opts.user;
    _mentorado = opts.mentorado || null;
    _session = opts.session || (await _sb.auth.getSession()).data.session;
    await _refreshTokens();
    await _refreshFlag();
    _injectStyles();
  }

  async function _refreshTokens() {
    try {
      const { data, error } = await _sb.rpc('social_token_list');
      if (error) throw error;
      _tokens = data || [];
    } catch (e) {
      console.warn('[publicar-social] social_token_list:', e);
      _tokens = [];
    }
  }

  async function _refreshFlag() {
    try {
      const { data } = await _sb.from('configuracoes').select('valor').eq('chave', 'meta_app_status').maybeSingle();
      _metaAppStatus = (data && data.valor) || 'review';
    } catch (_) { _metaAppStatus = 'review'; }
  }

  async function _refreshQuota() {
    try {
      const { data } = await _sb.rpc('social_quota_status');
      _quota = data;
    } catch (_) { _quota = null; }
  }

  function _tokenDe(plataforma) {
    return _tokens.find(t => t.plataforma === plataforma && t.esta_ativo);
  }

  function _temLinkedin() { return !!_tokenDe('linkedin'); }
  function _temFacebook() { return !!_tokenDe('facebook'); }
  function _temInstagram() { return !!_tokenDe('instagram'); }

  // ── CSS injection (uma vez) ─────────────────────────────────────────
  let _cssInjected = false;
  function _injectStyles() {
    if (_cssInjected) return;
    const css = `
      .cpcv-pub-ov{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:99000;display:none;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(2px)}
      .cpcv-pub-ov.open{display:flex}
      .cpcv-pub-modal{background:#1a1916;border:1px solid #2a2826;border-radius:14px;padding:24px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;color:#e8e3d2;font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.5}
      .cpcv-pub-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
      .cpcv-pub-title{font-family:'Instrument Serif',Georgia,serif;font-size:22px;color:#fff;margin:0;font-weight:400}
      .cpcv-pub-x{background:none;border:none;color:#9a9282;font-size:22px;cursor:pointer;padding:4px 8px;border-radius:6px}
      .cpcv-pub-x:hover{color:#fff;background:#2a2826}
      .cpcv-pub-quota{font-size:10px;font-family:'DM Mono',monospace;letter-spacing:.06em;color:#9a9282;padding:3px 10px;border:1px solid #2a2826;border-radius:12px;display:inline-block;margin-bottom:12px}
      .cpcv-pub-quota.warn{color:#c9a96e;border-color:rgba(201,169,110,.4)}
      .cpcv-pub-quota.full{color:#e08080;border-color:rgba(224,128,128,.4)}
      .cpcv-pub-preview{background:#0c0c0b;border:1px solid #2a2826;border-radius:8px;padding:14px;margin-bottom:14px}
      .cpcv-pub-preview .lbl{font-size:9px;font-family:'DM Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#7a7468;margin-bottom:6px}
      .cpcv-pub-preview .body{font-size:13px;color:#d0c9b8;white-space:pre-wrap;max-height:140px;overflow-y:auto}
      .cpcv-pub-preview img{max-width:100%;max-height:140px;border-radius:6px;border:1px solid #2a2826;margin-top:8px;display:block}
      .cpcv-pub-section{margin-bottom:14px}
      .cpcv-pub-section-label{font-size:10px;font-family:'DM Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:#c9a96e;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid #2a2826}
      .cpcv-pub-row{display:flex;align-items:flex-start;gap:10px;padding:8px 0;font-size:13px;color:#d0c9b8;cursor:pointer;user-select:none}
      .cpcv-pub-row.disabled{opacity:.5;cursor:not-allowed}
      .cpcv-pub-row input[type=checkbox]{margin-top:2px;flex-shrink:0;cursor:pointer}
      .cpcv-pub-row.disabled input{cursor:not-allowed}
      .cpcv-pub-row strong{color:#f0e9d8}
      .cpcv-pub-row small{display:block;font-size:11px;color:#7a7468;margin-top:2px}
      .cpcv-pub-row a{color:#c9a96e;text-decoration:none;border-bottom:1px dotted #c9a96e}
      .cpcv-pub-toggle{display:flex;gap:4px;background:#0c0c0b;border:1px solid #2a2826;border-radius:8px;padding:4px;margin-bottom:10px}
      .cpcv-pub-toggle button{flex:1;background:none;border:none;color:#9a9282;padding:8px;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif}
      .cpcv-pub-toggle button.active{background:#c9a96e;color:#0c0c0b;font-weight:500}
      .cpcv-pub-quick{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px}
      .cpcv-pub-quick button{background:#0c0c0b;border:1px solid #2a2826;color:#d0c9b8;padding:6px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif}
      .cpcv-pub-quick button:hover{border-color:#c9a96e;color:#c9a96e}
      .cpcv-pub-input{width:100%;background:#0c0c0b;border:1px solid #2a2826;border-radius:8px;padding:10px 12px;color:#e8e3d2;font-family:'DM Sans',sans-serif;font-size:13px;box-sizing:border-box}
      .cpcv-pub-input:focus{outline:none;border-color:#c9a96e}
      .cpcv-pub-msg{min-height:18px;margin:8px 0;font-size:12px}
      .cpcv-pub-msg.info{color:#9a9282}
      .cpcv-pub-msg.ok{color:#4a9e6b}
      .cpcv-pub-msg.err{color:#e08080}
      .cpcv-pub-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
      .cpcv-pub-btn{background:none;border:1px solid #2a2826;color:#d0c9b8;padding:10px 18px;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer}
      .cpcv-pub-btn:hover{border-color:#c9a96e;color:#c9a96e}
      .cpcv-pub-btn.primary{background:#c9a96e;color:#0c0c0b;border-color:#c9a96e;font-weight:500}
      .cpcv-pub-btn.primary:hover{opacity:.9;color:#0c0c0b}
      .cpcv-pub-btn:disabled{opacity:.5;cursor:not-allowed}
    `;
    const style = document.createElement('style');
    style.id = 'cpcv-publicar-social-css';
    style.textContent = css;
    document.head.appendChild(style);
    _cssInjected = true;
  }

  // ── Modal HTML ──────────────────────────────────────────────────────
  function _ensureModalDom() {
    if (document.getElementById('cpcv-pub-ov')) return;
    const ov = document.createElement('div');
    ov.id = 'cpcv-pub-ov';
    ov.className = 'cpcv-pub-ov';
    ov.innerHTML = `
      <div class="cpcv-pub-modal" id="cpcv-pub-modal">
        <div class="cpcv-pub-head">
          <h3 class="cpcv-pub-title">Publicar</h3>
          <button class="cpcv-pub-x" onclick="CPCVPublicarSocial.fechar()">&times;</button>
        </div>
        <div id="cpcv-pub-quota-wrap"></div>
        <div id="cpcv-pub-preview"></div>
        <div id="cpcv-pub-secs"></div>
        <div class="cpcv-pub-section">
          <div class="cpcv-pub-section-label">Quando</div>
          <div class="cpcv-pub-toggle">
            <button data-tipo="imediato" class="active" onclick="CPCVPublicarSocial._setTipo('imediato')">&#9889; Publicar agora</button>
            <button data-tipo="agendado" onclick="CPCVPublicarSocial._setTipo('agendado')">&#9201; Agendar</button>
          </div>
          <div id="cpcv-pub-agendar" style="display:none">
            <div class="cpcv-pub-quick">
              <button onclick="CPCVPublicarSocial._quick('hoje-tarde')">Hoje 17h</button>
              <button onclick="CPCVPublicarSocial._quick('amanha-9h')">Amanh&atilde; 9h</button>
              <button onclick="CPCVPublicarSocial._quick('amanha-tarde')">Amanh&atilde; 17h</button>
              <button onclick="CPCVPublicarSocial._quick('proxima-segunda-9h')">Pr&oacute;x. 2&ordf; 9h</button>
            </div>
            <input class="cpcv-pub-input" id="cpcv-pub-dt" type="datetime-local">
            <small style="display:block;color:#7a7468;font-size:11px;margin-top:6px">Pode demorar at&eacute; 5 min ap&oacute;s a hora marcada (precis&atilde;o do cron). Cancelar antes pelo hist&oacute;rico.</small>
          </div>
        </div>
        <div class="cpcv-pub-msg" id="cpcv-pub-msg"></div>
        <div class="cpcv-pub-actions">
          <button class="cpcv-pub-btn" onclick="CPCVPublicarSocial.fechar()">Cancelar</button>
          <button class="cpcv-pub-btn primary" id="cpcv-pub-submit" onclick="CPCVPublicarSocial._submit()">Publicar agora</button>
        </div>
      </div>
    `;
    document.body.appendChild(ov);
    // Click no overlay (fora do modal) fecha
    ov.addEventListener('click', (e) => {
      if (e.target === ov) fechar();
    });
  }

  // ── Abrir o modal ───────────────────────────────────────────────────
  async function abrir(payload) {
    _ensureModalDom();
    if (!payload || typeof payload.texto !== 'string') {
      console.warn('[publicar-social] abrir: texto obrigatório');
      return;
    }
    // Refresh tokens + quota antes de abrir
    await Promise.all([_refreshTokens(), _refreshQuota()]);

    _state = {
      texto: payload.texto,
      media_url: payload.media_url || null,
      primeiro_comentario: payload.primeiro_comentario || null,
      content_studio_id: payload.content_studio_id || null,
      plataformas: payload.plataformas && payload.plataformas.length ? payload.plataformas : ['linkedin', 'meta'],
      dataPreFill: payload.dataPreFill || null,
      onSuccess: payload.onSuccess || null,
      tipo: 'imediato',
      // Selecções (preenchidas pelos checkboxes)
      sel_linkedin: false,
      sel_facebook: false,
      sel_instagram: false,
      sel_comment: !!payload.primeiro_comentario,
    };

    _renderQuota();
    _renderPreview();
    _renderSecoes();
    _setTipo('imediato');

    // Datetime picker
    const dt = document.getElementById('cpcv-pub-dt');
    const now = new Date();
    const min = new Date(Date.now() + 11 * 60_000);
    const max = new Date(Date.now() + 180 * 86400_000);
    dt.min = _toLocalDt(min);
    dt.max = _toLocalDt(max);
    if (_state.dataPreFill) {
      dt.value = _state.dataPreFill;
      _setTipo('agendado');
    } else {
      dt.value = _toLocalDt(new Date(Date.now() + 60 * 60_000));
    }

    _msg('', '');
    _setSubmitButton();

    document.getElementById('cpcv-pub-ov').classList.add('open');
  }

  function fechar() {
    document.getElementById('cpcv-pub-ov')?.classList.remove('open');
    _state = null;
  }

  function _renderQuota() {
    const wrap = document.getElementById('cpcv-pub-quota-wrap');
    if (!_quota) { wrap.innerHTML = ''; return; }
    const usado = _quota.usado_hoje || 0;
    const limite = _quota.limite || 100;
    const resta = _quota.resta || 0;
    const pct = Math.round((usado / limite) * 100);
    let cls = 'cpcv-pub-quota';
    if (resta === 0) cls += ' full';
    else if (pct >= 80) cls += ' warn';
    wrap.innerHTML = `<span class="${cls}">Quota Meta hoje · ${usado}/${limite}</span>`;
  }

  function _renderPreview() {
    const el = document.getElementById('cpcv-pub-preview');
    el.innerHTML = `
      <div class="cpcv-pub-preview">
        <div class="lbl">Preview</div>
        <div class="body">${esc(_state.texto)}</div>
        ${_state.media_url ? `<img src="${esc(_state.media_url)}" alt="">` : ''}
      </div>
    `;
  }

  function _renderSecoes() {
    const el = document.getElementById('cpcv-pub-secs');
    let html = '';

    if (_state.plataformas.includes('linkedin')) {
      html += _renderSecaoLinkedin();
    }
    if (_state.plataformas.includes('meta')) {
      html += _renderSecaoMeta();
    }

    el.innerHTML = html;

    // Bind handlers (delegação simples)
    el.querySelectorAll('.cpcv-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const k = e.target.dataset.k;
        _state[k] = e.target.checked;
        _setSubmitButton();
      });
    });
  }

  function _renderSecaoLinkedin() {
    const t = _tokenDe('linkedin');
    let body = '<div class="cpcv-pub-section">';
    body += '<div class="cpcv-pub-section-label">LinkedIn</div>';
    if (t) {
      _state.sel_linkedin = true;
      body += `<label class="cpcv-pub-row">
        <input type="checkbox" class="cpcv-chk" data-k="sel_linkedin" checked>
        <div><strong>Publicar no LinkedIn</strong><small>${esc(t.account_name || 'LinkedIn')}</small></div>
      </label>`;
      if (_state.primeiro_comentario) {
        body += `<label class="cpcv-pub-row">
          <input type="checkbox" class="cpcv-chk" data-k="sel_comment" checked>
          <div><strong>Incluir 1.&ordm; coment&aacute;rio</strong><small>Booster do algoritmo · adicionado automaticamente ap&oacute;s o post</small></div>
        </label>`;
      }
    } else {
      body += `<label class="cpcv-pub-row disabled">
        <input type="checkbox" disabled>
        <div><strong>LinkedIn</strong><small>Conta n&atilde;o ligada · <a href="/perfil.html#integracoes">Liga no Perfil</a></small></div>
      </label>`;
    }
    body += '</div>';
    return body;
  }

  function _renderSecaoMeta() {
    const fb = _tokenDe('facebook');
    const ig = _tokenDe('instagram');
    let body = '<div class="cpcv-pub-section">';
    body += '<div class="cpcv-pub-section-label">Meta</div>';

    // Facebook
    if (fb) {
      _state.sel_facebook = true;
      body += `<label class="cpcv-pub-row">
        <input type="checkbox" class="cpcv-chk" data-k="sel_facebook" checked>
        <div><strong>Facebook</strong><small>${esc(fb.account_name || 'Page')}</small></div>
      </label>`;
    } else if (_statusEfectivo() === 'review') {
      body += `<label class="cpcv-pub-row disabled">
        <input type="checkbox" disabled>
        <div><strong>Facebook</strong><small>&#128274; Em aprova&ccedil;&atilde;o Meta · ~5-15 dias</small></div>
      </label>`;
    } else {
      body += `<label class="cpcv-pub-row disabled">
        <input type="checkbox" disabled>
        <div><strong>Facebook</strong><small>Conta n&atilde;o ligada · <a href="/perfil.html#integracoes">Liga no Perfil</a></small></div>
      </label>`;
    }

    // Instagram (depende de imagem · IG não publica só texto)
    const igNeedsImage = !_state.media_url;
    if (ig && !igNeedsImage) {
      _state.sel_instagram = true;
      body += `<label class="cpcv-pub-row">
        <input type="checkbox" class="cpcv-chk" data-k="sel_instagram" checked>
        <div><strong>Instagram</strong><small>${esc('@' + (ig.account_name || 'instagram'))}</small></div>
      </label>`;
    } else if (ig && igNeedsImage) {
      body += `<label class="cpcv-pub-row disabled">
        <input type="checkbox" disabled>
        <div><strong>Instagram</strong><small>Requer imagem · adiciona uma para publicar</small></div>
      </label>`;
    } else if (_statusEfectivo() === 'review') {
      body += `<label class="cpcv-pub-row disabled">
        <input type="checkbox" disabled>
        <div><strong>Instagram</strong><small>&#128274; Em aprova&ccedil;&atilde;o Meta · ~5-15 dias</small></div>
      </label>`;
    } else {
      body += `<label class="cpcv-pub-row disabled">
        <input type="checkbox" disabled>
        <div><strong>Instagram</strong><small>Conta n&atilde;o ligada · <a href="/perfil.html#integracoes">Liga no Perfil</a></small></div>
      </label>`;
    }
    body += '</div>';
    return body;
  }

  function _setTipo(tipo) {
    if (!_state) return;
    _state.tipo = tipo;
    document.querySelectorAll('.cpcv-pub-toggle button').forEach(b => {
      b.classList.toggle('active', b.dataset.tipo === tipo);
    });
    document.getElementById('cpcv-pub-agendar').style.display = tipo === 'agendado' ? '' : 'none';
    _setSubmitButton();
  }

  function _quick(qual) {
    const dt = new Date();
    dt.setSeconds(0, 0);
    if (qual === 'hoje-tarde') {
      dt.setHours(17, 0);
      if (dt <= new Date()) dt.setDate(dt.getDate() + 1);
    } else if (qual === 'amanha-9h') {
      dt.setDate(dt.getDate() + 1); dt.setHours(9, 0);
    } else if (qual === 'amanha-tarde') {
      dt.setDate(dt.getDate() + 1); dt.setHours(17, 0);
    } else if (qual === 'proxima-segunda-9h') {
      const dia = dt.getDay();
      const diasAteSegunda = (8 - dia) % 7 || 7;
      dt.setDate(dt.getDate() + diasAteSegunda);
      dt.setHours(9, 0);
    }
    document.getElementById('cpcv-pub-dt').value = _toLocalDt(dt);
  }

  function _setSubmitButton() {
    const btn = document.getElementById('cpcv-pub-submit');
    if (!btn || !_state) return;
    const algumSelected = _state.sel_linkedin || _state.sel_facebook || _state.sel_instagram;
    btn.disabled = !algumSelected;
    btn.textContent = _state.tipo === 'imediato' ? 'Publicar agora' : 'Agendar';
  }

  function _msg(cls, txt) {
    const el = document.getElementById('cpcv-pub-msg');
    el.className = 'cpcv-pub-msg ' + (cls || '');
    el.innerHTML = txt || '';
  }

  // ── Submit ──────────────────────────────────────────────────────────
  async function _submit() {
    if (!_state) return;
    const plataformas = [];
    if (_state.sel_linkedin) plataformas.push('linkedin');
    if (_state.sel_facebook) plataformas.push('facebook');
    if (_state.sel_instagram) plataformas.push('instagram');

    if (plataformas.length === 0) {
      _msg('err', 'Escolhe pelo menos uma plataforma.');
      return;
    }

    let agendadoParaIso = null;
    if (_state.tipo === 'agendado') {
      const dtVal = document.getElementById('cpcv-pub-dt').value;
      if (!dtVal) { _msg('err', 'Escolhe data e hora para agendar.'); return; }
      const dt = new Date(dtVal);
      if (dt.getTime() < Date.now() + 10 * 60_000) {
        _msg('err', 'Tem de ser pelo menos 10 minutos no futuro.');
        return;
      }
      agendadoParaIso = dt.toISOString();
    }

    const btn = document.getElementById('cpcv-pub-submit');
    btn.disabled = true;
    btn.textContent = _state.tipo === 'imediato' ? 'A publicar...' : 'A agendar...';
    _msg('info', _state.tipo === 'imediato' ? 'A publicar...' : 'A agendar...');

    try {
      if (!_session) _session = (await _sb.auth.getSession()).data.session;
      const body = {
        texto: _state.texto,
        media_url: _state.media_url || undefined,
        media_tipo: _state.media_url ? 'imagem' : undefined,
        primeiro_comentario: (_state.sel_comment && _state.primeiro_comentario) ? _state.primeiro_comentario : undefined,
        plataformas,
        tipo: _state.tipo,
        agendado_para: agendadoParaIso || undefined,
        content_studio_id: _state.content_studio_id || undefined,
      };
      const resp = await fetch(PUBLISH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + _session.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await resp.json();

      if (resp.status === 429) {
        _msg('err', '✗ ' + esc(data.mensagem || 'Limite diário atingido') + ' &middot; <a href="#" onclick="CPCVPublicarSocial._setTipo(\'agendado\');CPCVPublicarSocial._quick(\'amanha-9h\');return false">Agendar para amanhã 9h</a>');
        btn.disabled = false;
        btn.textContent = _state.tipo === 'imediato' ? 'Publicar agora' : 'Agendar';
        return;
      }

      if (!resp.ok || !data.ok) {
        throw new Error(data.erro || data.error || 'Falha ao publicar');
      }

      _msg('ok', _state.tipo === 'imediato' ? '✓ Publicado com sucesso' : '✓ Agendado com sucesso');
      const onSuccess = _state.onSuccess;
      const tipoFinal = _state.tipo;
      const resultados = data.resultados;

      setTimeout(() => {
        fechar();
        _toast(tipoFinal === 'imediato' ? 'Publicado' : 'Agendado · vê no histórico');
        // Abre primeiro post URL imediato
        if (tipoFinal === 'imediato' && resultados) {
          const url = resultados.linkedin?.post_url || resultados.facebook?.post_url || resultados.instagram?.permalink;
          if (url) window.open(url, '_blank');
        }
        if (typeof onSuccess === 'function') onSuccess(data);
      }, 1200);
    } catch (e) {
      const msg = String(e.message || e);
      _msg('err', '✗ ' + esc(msg));
      btn.disabled = false;
      btn.textContent = _state.tipo === 'imediato' ? 'Publicar agora' : 'Agendar';
    }
  }

  // ── API exposta ─────────────────────────────────────────────────────
  global.CPCVPublicarSocial = {
    init,
    abrir,
    fechar,
    refreshTokens: _refreshTokens,
    // internal handlers (chamados pelo HTML)
    _setTipo,
    _quick,
    _submit,
  };
})(window);
