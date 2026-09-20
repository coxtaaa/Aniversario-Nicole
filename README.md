# Site Nicole — Front-end + API + n8n

A estrutura foi separada para que os endereços reais dos webhooks do n8n não fiquem no JavaScript enviado ao navegador.

## Arquitetura

```text
Navegador
  |
  |  /api/*
  v
Node.js + Express
  |
  |  process.env.WEBHOOK_*
  v
n8n
```

## Pastas

```text
site_nicole_arquitetura_api/
├── public/
│   ├── index.html
│   ├── nicole-style.css
│   └── app.js
├── server/
│   └── server.js
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Requisitos

- Node.js 20.6 ou superior
- npm

Confira:

```powershell
node --version
npm --version
```

## Rodar o projeto

No terminal, entre na pasta do projeto:

```powershell
npm install
npm start
```

Depois acesse:

```text
http://localhost:3000
```

Não abra o `index.html` com duplo clique. O front-end deve ser servido pelo Node para que `/api/*` funcione.

Durante desenvolvimento:

```powershell
npm run dev
```

## .env

O `.env` agora é lido somente pelo Node. Ele não fica disponível no navegador.

Os três webhooks que já existiam no projeto foram mantidos no `.env`. Os webhooks de fotos e presentes continuam com os placeholders e precisam ser preenchidos quando esses fluxos existirem.

Nunca envie o `.env` para o GitHub. O `.gitignore` já o ignora.

Use `.env.example` como modelo público.

## Rotas

| Front-end | Servidor encaminha para |
|---|---|
| `POST /api/rsvp` | `WEBHOOK_RSVP` |
| `GET /api/familia?id=...` | `WEBHOOK_FAMILIA_GET` |
| `POST /api/familia/rsvp` | `WEBHOOK_FAMILIA_RSVP` |
| `POST /api/fotos` | `WEBHOOK_FOTOS` |
| `POST /api/presentes` | `WEBHOOK_PRESENTES` |
| `GET /api/health` | teste da própria API |

Teste a API:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Resposta esperada:

```json
{"ok":true}
```

## Segurança incluída

- webhooks reais fora do front-end;
- validação básica de payload;
- limites de tamanho;
- rate limit simples em memória;
- erro do n8n não expõe a URL interna;
- upload limitado a 25 MB por requisição;
- `.env` ignorado pelo Git.

### Limitação importante

Esconder os webhooks protege o endereço do n8n, mas `/api/*` continua sendo uma API pública do site. O rate limit reduz abuso básico, mas para uma publicação maior é recomendável adicionar CAPTCHA/Turnstile, logs e um rate limiter com armazenamento compartilhado.

## Deploy

O servidor que hospedar esse projeto precisa executar Node.js. Serviços de hospedagem apenas estática (que servem somente HTML/CSS/JS) não executam `server/server.js`.

No ambiente de produção, configure as mesmas variáveis `WEBHOOK_*` no painel do provedor, em vez de publicar o `.env`.
