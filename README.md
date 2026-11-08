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
├── .env.test
├── .env.test.example
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

## Ambientes e webhooks

Os arquivos `.env` são lidos somente pelo Node. Eles não ficam disponíveis no navegador.

O `.env` contém os webhooks de produção. O `.env.test` é usado por padrão nos comandos
`start` e `dev` e deve conter somente webhooks de teste (`/webhook-test/...`).
Preencha os valores locais a partir de `.env.test.example`.

Nunca envie `.env` ou `.env.test` para o GitHub. O `.gitignore` já ignora os dois.

Para trocar de teste para produção, altere uma linha em `package.json`:

```json
"start": "node --env-file=.env server/server.js"
```

Ou use os scripts prontos, sem editar o arquivo:

```powershell
npm start             # teste: .env.test
npm run start:production
npm run dev           # teste: .env.test
npm run dev:production
```

Os webhooks de fotos e presentes também precisam ser preenchidos no ambiente em que forem usados.

## Rotas

| Front-end | Servidor encaminha para |
|---|---|
| `POST /api/rsvp` | `WEBHOOK_RSVP` |
| `GET /api/familia?id=...` | `WEBHOOK_FAMILIA_GET` |
| `POST /api/familia/rsvp` | `WEBHOOK_FAMILIA_RSVP` |
| `POST /api/fotos` | `WEBHOOK_FOTOS` |
| `POST /api/presentes` | `WEBHOOK_PRESENTES` |
| `GET /api/health` | teste da própria API |

### Payload do RSVP

O formulário individual envia para `POST /api/rsvp` o payload padronizado:

```json
{
  "nome": "João",
  "sobrenome": "Silva",
  "email": "joao@exemplo.com",
  "telefone": "61999999999",
  "status": "true"
}
```

O valor de `status` é `"true"` para presença confirmada e `"false"` para ausência.
O RSVP familiar envia `idGrupo`, `email`, `telefone`, `mensagem` e `confirmacoes`.
As respostas do n8n são repassadas sem alteração de status HTTP ou corpo, no formato JSend
(`successes`, `status` e `message`). O front-end apresenta a mensagem correspondente aos códigos
`200`, `201`, `400`, `404`, `409`, `422`, `500`, `502` e `503`.

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
