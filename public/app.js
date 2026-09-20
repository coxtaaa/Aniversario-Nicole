// Removed <script> wrapper for standalone JS file
// ── Endpoints da API ───────────────────────────────────────────────────────
// O navegador conhece apenas estas rotas locais.
// Os endereços reais do n8n ficam somente no .env do servidor.
const API = Object.freeze({
  RSVP: '/api/rsvp',
  FAMILIA: '/api/familia',
  FAMILIA_RSVP: '/api/familia/rsvp',
  FOTOS: '/api/fotos',
  PRESENTES: '/api/presentes'
});

// Edite apenas esta lista para mudar os presentes exibidos no site.
const PRESENTES_PREDEFINIDOS = [
  { id: 'Tinta', nome: 'Kit de tinta a óleo', descricao: 'Para transformar criatividade em cores e dar vida a novas obras de arte.', icone: '🎨' },
  { id: 'Quadro', nome: 'Quadros (pintados ou não)', descricao: 'Para decorar o cantinho dela ou servir de tela para novas criações.', icone: '🖼️' },
  { id: 'perfume', nome: 'Perfumes doces', descricao: 'Uma fragrância doce e marcante para acompanhar momentos especiais.', icone: '🌸' },
  { id: 'Livro', nome: 'Livros (romance ou filosofia)', descricao: 'Para viajar por grandes histórias, reflexões e novas ideias através da leitura.', icone: '📚' },
  { id: 'Pelucia', nome: 'Pelúcias', descricao: 'Um presente fofo e aconchegante para fazer companhia e decorar o quarto.', icone: '🧸' },
  { id: 'Acessórios', nome: 'Acessórios (ouro)', descricao: 'Um detalhe especial e elegante para complementar seus looks favoritos.', icone: '💍' },
  { id: 'Salto', nome: 'Salto (tamanho 36)', descricao: 'Um toque de elegância para deixar ocasiões especiais ainda mais bonitas.', icone: '👠' },
  { id: 'Tenis', nome: 'Tênis (tamanho 37)', descricao: 'Conforto e estilo para acompanhar a rotina e os passeios do dia a dia.', icone: '👟' },
  { id: 'Grafite', nome: 'Kit de grafites e lapiseiras', descricao: 'Para desenhar, esboçar e colocar novas ideias no papel com ainda mais precisão.', icone: '✏️' },
  { id: 'Boneco', nome: 'Action figure (Chainsaw Man)', descricao: 'Um item especial para a coleção de quem é fã do universo de Chainsaw Man.', icone: '🪚' },
  { id: 'manga', nome: 'Mangás', descricao: 'Para aumentar a coleção e mergulhar em novas histórias e aventuras.', icone: '📖' },
  { id: 'Canetas', nome: 'Canetas acrílicas', descricao: 'Mais cores e possibilidades para desenhos, pinturas e projetos criativos.', icone: '🖌️' },
  { id: 'Pinceis', nome: 'Kit de pincéis', descricao: 'Novas ferramentas para explorar técnicas, detalhes e diferentes estilos de pintura.', icone: '🎨' },
  { id: 'Imagens', nome: 'Imagens católicas', descricao: 'Um presente cheio de significado para representar e fortalecer sua fé.', icone: '🙏' },
  { id: 'GiftCard', nome: 'Gift card (Xbox, leitura e Play Store)', descricao: 'Liberdade para escolher jogos, livros, aplicativos ou aquele conteúdo que ela está querendo.', icone: '🎮' },
  { id: 'Vitrola', nome: 'Vitrola', descricao: 'Para curtir músicas favoritas de um jeito especial, clássico e cheio de personalidade.', icone: '🎶' },
  { id: 'Dinheiro', nome: 'Dinheiro', descricao: 'Uma contribuição para ela escolher exatamente aquilo que deseja ou guardar para um sonho especial.', icone: '💵' },
  { id: 'Pijamas', nome: 'Pijamas estilo macacão', descricao: 'Para noites mais confortáveis e divertidas, especialmente com um macacão de dinossauro.', icone: '🦖' }

];




// ── Stars ──
const starsEl = document.getElementById('stars');
if (starsEl) {
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() * 2.5 + 0.5;
    s.style.cssText = `width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--d:${2+Math.random()*4}s;--op:${0.3+Math.random()*0.6};animation-delay:${Math.random()*5}s;`;
    starsEl.appendChild(s);
  }
}

// ── Countdown ──
function tick() {
  const diff = new Date('2026-12-05T20:00:00') - new Date();
  const ids = ['cd-days', 'cd-hours', 'cd-mins', 'cd-secs'];
  
  if (diff <= 0) { 
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '00';
    });
    return; 
  }
  
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');
  
  if (daysEl) daysEl.textContent = String(Math.floor(diff/86400000)).padStart(2,'0');
  if (hoursEl) hoursEl.textContent = String(Math.floor((diff%86400000)/3600000)).padStart(2,'0');
  if (minsEl) minsEl.textContent = String(Math.floor((diff%3600000)/60000)).padStart(2,'0');
  if (secsEl) secsEl.textContent = String(Math.floor((diff%60000)/1000)).padStart(2,'0');
}

if (document.getElementById('cd-days')) {
  tick(); 
  setInterval(tick, 1000);
}

// ── Toast ──
function showToast(msg, error = false) {
  const t = document.getElementById('toast');
  if (!t) return; // Proteção se elemento não existir
  t.textContent = msg;
  t.style.background = error
    ? 'linear-gradient(135deg,#c0392b,#e74c3c)'
    : 'linear-gradient(135deg,#c9a84c,#ffd966)';
  t.style.color = error ? '#fff' : '#060f3a';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4000);
}

// ── Confirmação individual (botões Sim/Não) ──
let indConfirmacao = null; // true | false
let famConfirmacoes = {}; // { membroId: true | false }

function selectConfirm(prefix, val) {
  if (val === undefined) {
    val = prefix;
    prefix = 'ind';
  }

  const isYes = val === true || val === 'sim';
  const isNo = val === false || val === 'nao';

  indConfirmacao = isYes;
  const simBtn = document.getElementById(`${prefix}-sim`);
  const naoBtn = document.getElementById(`${prefix}-nao`);
  if (simBtn) simBtn.classList.toggle('active', isYes);
  if (naoBtn) naoBtn.classList.toggle('active', isNo);
}

function selectMembroConfirm(membroId, val) {
  const isYes = val === true || val === 'sim';
  const isNo = val === false || val === 'nao';

  famConfirmacoes[membroId] = isYes;
  const simBtn = document.getElementById(`msim-${membroId}`);
  const naoBtn = document.getElementById(`mnao-${membroId}`);
  if (simBtn) simBtn.classList.toggle('active', isYes);
  if (naoBtn) naoBtn.classList.toggle('active', isNo);
}

function selectMembro(membroId, val) {
  selectMembroConfirm(membroId, val === 'sim');
}

// ── RSVP Individual — Submit ──
async function submitIndividual() {
  const nomeEl     = document.getElementById('ind-nome');
  const emailEl    = document.getElementById('ind-email');
  const whatsappEl = document.getElementById('ind-whatsapp');
  const mensagemEl = document.getElementById('ind-mensagem');
  
  if (!nomeEl || !emailEl) {
    showToast('Elementos do formulário não encontrados.', true);
    return;
  }

  const nome      = nomeEl.value.trim();
  const sobrenome = document.getElementById('ind-sobrenome')?.value.trim() || '';
  const email     = emailEl.value.trim();
  const whatsapp  = whatsappEl?.value.trim() || '';
  const mensagem  = mensagemEl?.value.trim() || '';

  if (!nome || !email || indConfirmacao === null) {
    showToast('Preencha nome, e-mail e confirmação.', true);
    return;
  }

  const btn = document.querySelector('#rsvp-individual .submit-btn');
  if (!btn) {
    showToast('Botão de envio não encontrado.', true);
    return;
  }

  btn.textContent = 'Enviando… ♛';
  btn.disabled = true;

  try {
    const res = await fetch(API.RSVP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, sobrenome, email, whatsapp, confirmacao: indConfirmacao, mensagem })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    showToast(indConfirmacao === true ? 'Presença confirmada! ♛ Até lá!' : 'Resposta registrada. Que pena, vai fazer falta!');
    btn.textContent = 'Enviado ✓';
  } catch (err) {
    console.error('Erro ao enviar RSVP individual:', err);
    showToast('Erro ao enviar. Tente novamente.', true);
    btn.textContent = 'Confirmar Presença ♛';
    btn.disabled = false;
  }
}

// ── RSVP Família — Submit ──
async function submitFamilia() {
  const emailEl    = document.getElementById('fam-email');
  const whatsappEl = document.getElementById('fam-whatsapp');
  const mensagemEl = document.getElementById('fam-mensagem');
  
  if (!emailEl) {
    showToast('Elementos do formulário não encontrados.', true);
    return;
  }

  const email    = emailEl.value.trim();
  const whatsapp = whatsappEl?.value.trim() || '';
  const mensagem = mensagemEl?.value.trim() || '';
  const familiaId = new URLSearchParams(window.location.search).get('familia');

  if (!email) { 
    showToast('Informe o e-mail da família.', true); 
    return; 
  }

  const membros = window._familiaMembros || [];
  if (membros.length === 0) {
    showToast('Nenhum membro da família encontrado.', true);
    return;
  }

  const semResposta = membros.filter(m => !(m.id in famConfirmacoes));
  if (semResposta.length > 0) {
    showToast(`Confirme a presença de: ${semResposta.map(m => m.nome.split(' ')[0]).join(', ')}`, true);
    return;
  }

  const confirmacoes = membros.map(m => ({
    id: m.id,
    nome: m.nome,
    confirmacao: famConfirmacoes[m.id]
  }));

  const btn = document.querySelector('#rsvp-familia .submit-btn');
  if (!btn) {
    showToast('Botão de envio não encontrado.', true);
    return;
  }

  btn.textContent = 'Enviando… ♛';
  btn.disabled = true;

  try {
    const res = await fetch(API.FAMILIA_RSVP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ familia_id: familiaId, email, whatsapp, mensagem, confirmacoes })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    showToast('Presenças confirmadas! ♛ Até lá!');
    btn.textContent = 'Enviado ✓';
  } catch (err) {
    console.error('Erro ao enviar RSVP família:', err);
    showToast('Erro ao enviar. Tente novamente.', true);
    btn.textContent = 'Confirmar Presenças ♛';
    btn.disabled = false;
  }
}

// ── Roteamento: detecta ?familia= na URL ──
async function init() {
  const params = new URLSearchParams(window.location.search);
  const familiaId = params.get('familia');
  if (!familiaId) return;

  const indDiv = document.getElementById('rsvp-individual');
  const loadingDiv = document.getElementById('rsvp-loading');
  const erroDiv = document.getElementById('rsvp-erro');
  const familiaDiv = document.getElementById('rsvp-familia');

  if (indDiv) indDiv.style.display = 'none';
  if (loadingDiv) loadingDiv.style.display = 'block';

  try {
    const res = await fetch(`${API.FAMILIA}?id=${encodeURIComponent(familiaId)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const raw = await res.json();
    console.log('✦ Resposta bruta do webhook:', JSON.stringify(raw, null, 2));

    // Suporta tanto array [ {...} ] quanto objeto direto { ... }
    const data = Array.isArray(raw) ? raw[0] : raw;
    console.log('✦ Dados normalizados:', data);

    // Mapeamento flexível de chaves
    const nomeFamilia =
      data.nome_familia || data.nomeFamilia || data.nome ||
      data.family_name  || data.familyName  || data.slug || familiaId;

    const membros =
      data.membros   || data.members    ||
      data.convidados|| data.guests     || [];

    console.log('✦ Nome família:', nomeFamilia);
    console.log('✦ Membros:', membros);

    window._familiaMembros = membros;
    
    const tituloEl = document.getElementById('familia-titulo');
    const subtituloEl = document.getElementById('familia-subtitulo');
    const sectionTitleEl = document.querySelector('#rsvp .section-title');
    const containerEl = document.getElementById('familia-membros');

    if (tituloEl) tituloEl.textContent = `Família ${nomeFamilia}`;
    if (subtituloEl) subtituloEl.textContent =
      `Nicole Marie convida a Família ${nomeFamilia} para uma noite mágica e inesquecível na celebração dos seus 15 anos. ✦`;
    if (sectionTitleEl) sectionTitleEl.textContent = `Família ${nomeFamilia}, Vocês Vêm?`;

    if (containerEl) {
      containerEl.innerHTML = '';
      membros.forEach(m => {
        const membroId   = m.id   || m.uuid || m.member_id || Math.random().toString(36).slice(2);
        const membroNome = m.nome || m.name || m.full_name  || m.nome_completo || '—';
        const div = document.createElement('div');
        div.className = 'membro-row';
        div.innerHTML = `
          <span class="membro-nome">${membroNome}</span>
          <div class="membro-btns">
            <button type="button" id="msim-${membroId}" class="confirm-btn" onclick="selectMembro('${membroId}','sim')">✓ Sim</button>
            <button type="button" id="mnao-${membroId}" class="confirm-btn confirm-btn-no" onclick="selectMembro('${membroId}','nao')">✗ Não</button>
          </div>`;
        div.addEventListener('click', (e) => {
          if (e.target.tagName === 'BUTTON') {
            e.preventDefault();
          }
        });
        containerEl.appendChild(div);
      });
    }

    if (loadingDiv) loadingDiv.style.display = 'none';
    if (familiaDiv) familiaDiv.style.display = 'block';

  } catch(err) {
    console.error('✦ Erro ao carregar família:', err);
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (erroDiv) erroDiv.style.display = 'block';
  }
}

init();

// ── Presentes ──
let selectedGift = null;

function formatBRL(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderGifts() {
  const grid = document.getElementById('gift-grid');
  if (!grid) return;

  grid.innerHTML = '';
  PRESENTES_PREDEFINIDOS.forEach(gift => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gift-card';
    button.dataset.giftId = gift.id;
    button.innerHTML = `
      <span class="gift-icon">${gift.icone}</span>
      <span class="gift-name">${gift.nome}</span>
      <span class="gift-description">${gift.descricao}</span>
      <span class="gift-value">${formatBRL(gift.valor)}</span>`;
    button.addEventListener('click', () => selectGift(gift.id));
    grid.appendChild(button);
  });
}

function selectGift(giftId) {
  selectedGift = PRESENTES_PREDEFINIDOS.find(g => g.id === giftId) || null;
  document.querySelectorAll('.gift-card').forEach(card => {
    card.classList.toggle('active', !!selectedGift && card.dataset.giftId === selectedGift.id);
  });

  const selectedEl = document.getElementById('gift-selected');
  if (selectedEl && selectedGift) {
    selectedEl.textContent = `${selectedGift.nome} — ${formatBRL(selectedGift.valor)}`;
  }

  document.getElementById('gift-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function submitGift() {
  const nome = document.getElementById('gift-nome')?.value.trim() || '';
  const email = document.getElementById('gift-email')?.value.trim() || '';
  const whatsapp = document.getElementById('gift-whatsapp')?.value.trim() || '';
  const mensagem = document.getElementById('gift-mensagem')?.value.trim() || '';
  const btn = document.getElementById('gift-submit');

  if (!selectedGift) {
    showToast('Escolha um presente antes de enviar.', true);
    return;
  }
  if (!nome || !email) {
    showToast('Informe seu nome e e-mail para registrar o presente.', true);
    return;
  }
  if (!btn) return;

  btn.disabled = true;
  btn.textContent = 'Enviando… 🎁';

  try {
    const res = await fetch(API.PRESENTES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        presente_id: selectedGift.id,
        presente_nome: selectedGift.nome,
        valor: selectedGift.valor,
        nome,
        email,
        whatsapp,
        mensagem
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    showToast('Presente registrado com carinho! 🎁');
    btn.textContent = 'Presente Registrado ✓';
  } catch (err) {
    console.error('Erro ao registrar presente:', err);
    showToast('Erro ao registrar o presente. Tente novamente.', true);
    btn.disabled = false;
    btn.textContent = 'Registrar Presente 🎁';
  }
}

renderGifts();

// ── Gallery / Upload de fotos ──
let photos = [], lbIdx = 0;

function handlePhotoUpload(e) {
  if (!e || !e.target || !e.target.files) {
    showToast('Erro ao selecionar arquivo.', true);
    return;
  }

  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  const validFiles = files.filter(file => {
    if (!file.type.startsWith('image/')) {
      showToast(`"${file.name}" não é uma imagem válida.`, true);
      return false;
    }
    return true;
  });

  validFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      if (!ev.target?.result) return;
      photos.push({ src: ev.target.result, file, status: 'pending' });
      renderGallery();
    };
    reader.onerror = () => showToast(`Erro ao ler "${file.name}".`, true);
    reader.readAsDataURL(file);
  });

  e.target.value = '';
}

function updatePhotoSendState() {
  const btn = document.getElementById('photo-submit');
  const statusEl = document.getElementById('photo-status');
  const pendingCount = photos.filter(p => p.status === 'pending').length;
  const sentCount = photos.filter(p => p.status === 'sent').length;

  if (btn) {
    btn.disabled = pendingCount === 0;
    btn.textContent = pendingCount > 0
      ? `Enviar ${pendingCount} Foto${pendingCount > 1 ? 's' : ''} ♛`
      : 'Enviar Fotos ♛';
  }

  if (statusEl) {
    if (pendingCount > 0) {
      statusEl.textContent = `${pendingCount} foto${pendingCount > 1 ? 's' : ''} pronta${pendingCount > 1 ? 's' : ''} para envio${sentCount ? ` · ${sentCount} já enviada${sentCount > 1 ? 's' : ''}` : ''}.`;
    } else if (sentCount > 0) {
      statusEl.textContent = `${sentCount} foto${sentCount > 1 ? 's' : ''} enviada${sentCount > 1 ? 's' : ''} com sucesso. Você pode selecionar mais fotos.`;
    } else {
      statusEl.textContent = 'Selecione uma ou mais fotos para preencher os quadrados antes de enviar.';
    }
  }
}

async function submitPhotos() {
  const pendingPhotos = photos.filter(p => p.status === 'pending');
  const btn = document.getElementById('photo-submit');

  if (pendingPhotos.length === 0) {
    showToast('Selecione pelo menos uma foto antes de enviar.', true);
    return;
  }
  if (!btn) return;

  const formData = new FormData();
  pendingPhotos.forEach(photo => formData.append('photos', photo.file, photo.file.name));
  formData.append('total_fotos', String(pendingPhotos.length));
  formData.append('origem', 'site_nicole_15_anos');
  formData.append('enviado_em', new Date().toISOString());

  btn.disabled = true;
  btn.textContent = 'Enviando fotos…';

  try {
    const res = await fetch(API.FOTOS, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    pendingPhotos.forEach(photo => { photo.status = 'sent'; });
    renderGallery();
    showToast(`${pendingPhotos.length} foto${pendingPhotos.length > 1 ? 's enviadas' : ' enviada'} com sucesso! ✦`);
  } catch (err) {
    console.error('Erro ao enviar fotos:', err);
    showToast('Erro ao enviar as fotos. Tente novamente.', true);
    updatePhotoSendState();
  }
}

function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  const noteEl = document.getElementById('gallery-note');
  if (!grid) return;

  if (noteEl) noteEl.style.display = photos.length ? 'none' : '';
  grid.innerHTML = '';

  photos.forEach((photo, i) => {
    const c = document.createElement('div');
    c.className = `gallery-cell${photo.status === 'sent' ? ' sent' : ''}`;
    c.style.cssText = 'background:none;border:1px solid rgba(201,168,76,0.35);cursor:pointer;';
    c.innerHTML = `<img src="${photo.src}" alt="Momento selecionado ${i + 1}" />`;
    c.onclick = () => openLb(i);
    c.onmouseenter = () => {
      const img = c.querySelector('img');
      if (img) img.style.transform = 'scale(1.07)';
    };
    c.onmouseleave = () => {
      const img = c.querySelector('img');
      if (img) img.style.transform = 'scale(1)';
    };
    grid.appendChild(c);
  });

  for (let i = 0; i < Math.max(0, 6 - photos.length); i++) {
    const c = document.createElement('div');
    c.className = 'gallery-cell';
    c.textContent = '✦';
    grid.appendChild(c);
  }

  updatePhotoSendState();
}

function openLb(i) {
  const lb = document.getElementById('lightbox');
  if (!lb || !photos[i]) return;
  lbIdx = i;
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  updateLb();
}

function updateLb() {
  const imgEl = document.getElementById('lightbox-img');
  const counterEl = document.getElementById('lightbox-counter');
  if (imgEl && photos[lbIdx]) imgEl.src = photos[lbIdx].src;
  if (counterEl) counterEl.textContent = `${lbIdx + 1} / ${photos.length}`;
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.style.display = 'none';
  document.body.style.overflow = '';
}

function prevPhoto() {
  if (photos.length === 0) return;
  lbIdx = (lbIdx - 1 + photos.length) % photos.length;
  updateLb();
}

function nextPhoto() {
  if (photos.length === 0) return;
  lbIdx = (lbIdx + 1) % photos.length;
  updateLb();
}

const lightbox = document.getElementById('lightbox');
if (lightbox) {
  lightbox.addEventListener('click', function(e) {
    if (e.target === this) closeLightbox();
  });
}

document.addEventListener('keydown', e => {
  const lb = document.getElementById('lightbox');
  if (lb && lb.style.display === 'flex') {
    if (e.key === 'ArrowLeft') prevPhoto();
    if (e.key === 'ArrowRight') nextPhoto();
    if (e.key === 'Escape') closeLightbox();
  }
});

renderGallery();
// End of file
