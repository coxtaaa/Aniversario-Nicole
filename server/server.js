import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = Number(process.env.PORT || 3000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

app.disable('x-powered-by');

// JSON routes. Keeps accidental/request-abuse payloads small.
app.use(express.json({ limit: '100kb' }));

// Small in-memory rate limiter.
// Good enough for a personal site/small event; for multiple server instances,
// use a shared store (Redis, Upstash, etc.).
const buckets = new Map();

function rateLimit({ windowMs = 60_000, max = 30 } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.path}`;
    const current = buckets.get(key);

    if (!current || now >= current.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;

    if (current.count > max) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        ok: false,
        error: 'Muitas requisições. Aguarde alguns segundos e tente novamente.'
      });
    }

    next();
  };
}

function getWebhook(envName) {
  const value = process.env[envName]?.trim();

  if (!value || value.includes('COLE_AQUI')) {
    return null;
  }

  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

function requiredText(value, maxLength = 200) {
  return typeof value === 'string'
    && value.trim().length > 0
    && value.trim().length <= maxLength;
}

function optionalTextIsValid(value, maxLength = 1000) {
  return value == null
    || (typeof value === 'string' && value.length <= maxLength);
}

function validEmail(value) {
  return requiredText(value, 254)
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function requestN8n(url, options = {}, timeoutMs = 15_000) {
  return fetch(url, {
    ...options,
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(timeoutMs)
  });
}

async function relaySuccessOrError(upstream, res, successBody = { ok: true }) {
  if (!upstream.ok) {
    console.error(`n8n respondeu HTTP ${upstream.status}`);
    return res.status(502).json({
      ok: false,
      error: 'O serviço de automação não aceitou a requisição.'
    });
  }

  return res.status(200).json(successBody);
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// RSVP individual
app.post('/api/rsvp', rateLimit({ max: 12 }), async (req, res) => {
  const webhook = getWebhook('WEBHOOK_RSVP');
  if (!webhook) {
    return res.status(503).json({ ok: false, error: 'RSVP não configurado no servidor.' });
  }

  const {
    nome,
    sobrenome = '',
    email,
    whatsapp = '',
    confirmacao,
    mensagem = ''
  } = req.body || {};

  if (
    !requiredText(nome, 120)
    || !validEmail(email)
    || typeof confirmacao !== 'boolean'
    || !optionalTextIsValid(sobrenome, 120)
    || !optionalTextIsValid(whatsapp, 40)
    || !optionalTextIsValid(mensagem, 1500)
  ) {
    return res.status(400).json({ ok: false, error: 'Dados de RSVP inválidos.' });
  }

  try {
    const upstream = await requestN8n(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: nome.trim(),
        sobrenome: sobrenome.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        confirmacao,
        mensagem: mensagem.trim()
      })
    });

    return relaySuccessOrError(upstream, res);
  } catch (error) {
    console.error('Erro ao encaminhar RSVP:', error.message);
    return res.status(502).json({ ok: false, error: 'Falha de comunicação com o serviço de automação.' });
  }
});

// Busca dos membros da família
app.get('/api/familia', rateLimit({ max: 30 }), async (req, res) => {
  const webhook = getWebhook('WEBHOOK_FAMILIA_GET');
  if (!webhook) {
    return res.status(503).json({ ok: false, error: 'Busca de família não configurada no servidor.' });
  }

  const familiaId = typeof req.query.id === 'string' ? req.query.id.trim() : '';

  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(familiaId)) {
    return res.status(400).json({ ok: false, error: 'Identificador de família inválido.' });
  }

  try {
    const upstreamUrl = new URL(webhook);
    upstreamUrl.searchParams.set('id', familiaId);

    const upstream = await requestN8n(upstreamUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!upstream.ok) {
      console.error(`n8n família respondeu HTTP ${upstream.status}`);
      return res.status(502).json({ ok: false, error: 'Não foi possível buscar a família.' });
    }

    const contentType = upstream.headers.get('content-type') || '';
    const body = await upstream.text();

    if (contentType.includes('application/json')) {
      res.type('application/json');
    }

    return res.status(200).send(body);
  } catch (error) {
    console.error('Erro ao buscar família:', error.message);
    return res.status(502).json({ ok: false, error: 'Falha de comunicação com o serviço de automação.' });
  }
});

// RSVP da família
app.post('/api/familia/rsvp', rateLimit({ max: 12 }), async (req, res) => {
  const webhook = getWebhook('WEBHOOK_FAMILIA_RSVP');
  if (!webhook) {
    return res.status(503).json({ ok: false, error: 'RSVP de família não configurado no servidor.' });
  }

  const {
    familia_id,
    email,
    whatsapp = '',
    mensagem = '',
    confirmacoes
  } = req.body || {};

  const confirmacoesValidas = Array.isArray(confirmacoes)
    && confirmacoes.length > 0
    && confirmacoes.length <= 50
    && confirmacoes.every(item =>
      item
      && (typeof item.id === 'string' || typeof item.id === 'number')
      && requiredText(String(item.nome ?? ''), 160)
      && typeof item.confirmacao === 'boolean'
    );

  if (
    !requiredText(String(familia_id ?? ''), 100)
    || !validEmail(email)
    || !optionalTextIsValid(whatsapp, 40)
    || !optionalTextIsValid(mensagem, 1500)
    || !confirmacoesValidas
  ) {
    return res.status(400).json({ ok: false, error: 'Dados da família inválidos.' });
  }

  try {
    const upstream = await requestN8n(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        familia_id,
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        mensagem: mensagem.trim(),
        confirmacoes
      })
    });

    return relaySuccessOrError(upstream, res);
  } catch (error) {
    console.error('Erro ao encaminhar RSVP da família:', error.message);
    return res.status(502).json({ ok: false, error: 'Falha de comunicação com o serviço de automação.' });
  }
});

// Presentes
app.post('/api/presentes', rateLimit({ max: 10 }), async (req, res) => {
  const webhook = getWebhook('WEBHOOK_PRESENTES');
  if (!webhook) {
    return res.status(503).json({ ok: false, error: 'Presentes ainda não configurados no servidor.' });
  }

  const {
    presente_id,
    presente_nome,
    valor,
    nome,
    email,
    whatsapp = '',
    mensagem = ''
  } = req.body || {};

  if (
    !requiredText(presente_id, 100)
    || !requiredText(presente_nome, 200)
    || !Number.isFinite(Number(valor))
    || Number(valor) < 0
    || !requiredText(nome, 160)
    || !validEmail(email)
    || !optionalTextIsValid(whatsapp, 40)
    || !optionalTextIsValid(mensagem, 1500)
  ) {
    return res.status(400).json({ ok: false, error: 'Dados do presente inválidos.' });
  }

  try {
    const upstream = await requestN8n(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        presente_id,
        presente_nome,
        valor: Number(valor),
        nome: nome.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        mensagem: mensagem.trim()
      })
    });

    return relaySuccessOrError(upstream, res);
  } catch (error) {
    console.error('Erro ao encaminhar presente:', error.message);
    return res.status(502).json({ ok: false, error: 'Falha de comunicação com o serviço de automação.' });
  }
});

// Upload de fotos.
// IMPORTANTE: esta rota precisa receber o corpo multipart sem transformá-lo.
// Por isso o express.raw() é aplicado apenas aqui.
app.post(
  '/api/fotos',
  rateLimit({ windowMs: 5 * 60_000, max: 8 }),
  express.raw({ type: 'multipart/form-data', limit: '25mb' }),
  async (req, res) => {
    const webhook = getWebhook('WEBHOOK_FOTOS');
    if (!webhook) {
      return res.status(503).json({ ok: false, error: 'Upload de fotos ainda não configurado no servidor.' });
    }

    const contentType = req.headers['content-type'];

    if (!contentType?.startsWith('multipart/form-data') || !Buffer.isBuffer(req.body)) {
      return res.status(415).json({ ok: false, error: 'Envie as fotos como multipart/form-data.' });
    }

    try {
      const upstream = await requestN8n(webhook, {
        method: 'POST',
        headers: { 'Content-Type': contentType },
        body: req.body
      }, 60_000);

      return relaySuccessOrError(upstream, res);
    } catch (error) {
      console.error('Erro ao encaminhar fotos:', error.message);
      return res.status(502).json({ ok: false, error: 'Falha de comunicação com o serviço de automação.' });
    }
  }
);

// Rotas de API inexistentes não devem cair no index.html.
app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, error: 'Rota de API não encontrada.' });
});

// Front-end
app.use(express.static(publicDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Erro de JSON / payload grande etc.
app.use((error, _req, res, _next) => {
  console.error('Erro na API:', error.message);

  if (error.type === 'entity.too.large') {
    return res.status(413).json({ ok: false, error: 'Arquivo ou requisição maior que o limite permitido.' });
  }

  return res.status(400).json({ ok: false, error: 'Requisição inválida.' });
});

app.listen(PORT, () => {
  console.log(`Site + API rodando em http://localhost:${PORT}`);
});
