# MM Dairy Farm 🥛

Farm-fresh dairy products delivered to your doorstep.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js / Express (local-server.js — port 5001)
- **Database**: Supabase (PostgreSQL)
- **Payments**: Razorpay
- **AI Agent**: Google Gemini 1.5 Flash (FREE) — standalone microservice on port 3001

---

## Getting Started

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in:
| Variable | Where to get it |
|----------|----------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `VITE_SUPABASE_PROJECT_ID` | The part of URL before `.supabase.co` |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → Settings → API Keys |
| `VITE_AI_AGENT_URL` | `http://localhost:3001` for development |

### 3. Start all services

**Terminal 1 — Vite frontend (port 8080):**
```bash
npm run dev
```

**Terminal 2 — Express API (port 5001):**
```bash
npm run server
```

**Terminal 3 — AI Agent (port 3001):**
```bash
cd ai-agent
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
npm install
npm run dev
```

---

## AI Agent Setup

The AI agent lives in `ai-agent/` and runs as a separate microservice.

### Get your FREE Gemini API Key

1. Go to **https://aistudio.google.com**
2. Sign in with your Google account
3. Click **"Get API Key"** → **"Create API key"**
4. Copy the key (starts with `AIza...`)

### `ai-agent/.env`

```env
SUPABASE_URL=https://your_project_id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=AIzaSy...
PORT=3001
FRONTEND_URL=http://localhost:8080
```

### Test the agent

```bash
cd ai-agent
node src/test.js

# With a real user ID to test order queries:
TEST_USER_ID=your-supabase-uuid node src/test.js
```

### API

```
POST http://localhost:3001/chat
Content-Type: application/json

{
  "message": "What is my latest order?",
  "userId": "supabase-user-uuid",
  "history": []
}

→ { "reply": "Your latest order was...", "toolsUsed": ["getOrderByIndex"] }
```

---

## AI Agent Tools

| Tool | When Gemini calls it |
|------|---------------------|
| `getOrders` | "Show my orders", "order history" |
| `getOrderByIndex` | "My 2nd order", "latest order" |
| `getOrderById` | Specific order UUID |
| `getProducts` | "What do you sell?", "prices?" |
| `getUserProfile` | "My account", "my address" |
| `getWebsiteInfo` | "Delivery info", "payment methods" |
| `searchOrdersByProduct` | "Did I order milk?", "last ghee order" |

---

## Project Structure

```
mmdairyfarm/
├── src/
│   ├── components/
│   │   └── chat/
│   │       └── ChatWidget.tsx   ← AI-powered chat widget
│   ├── pages/
│   ├── contexts/
│   └── integrations/supabase/
├── api/                          Express API (Vercel serverless)
├── supabase/                     Migrations + Edge Functions
├── ai-agent/                     ← AI Agent microservice (Gemini)
│   ├── config/supabaseClient.js
│   └── src/
│       ├── index.js              Express server POST /chat
│       ├── agent.js              Gemini agentic loop
│       ├── tools/
│       │   ├── definitions.js    Function schemas
│       │   └── executor.js       Supabase queries
│       └── utils/systemPrompt.js
├── local-server.js
├── vite.config.ts
└── .env.example
```

---

## Deployment

### Frontend → Vercel
```bash
npm run build
# deploy via vercel CLI or GitHub
```
Set `VITE_AI_AGENT_URL` to your deployed agent URL in Vercel environment settings.

### AI Agent → Railway / Render / Fly.io
```bash
cd ai-agent
# set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY in dashboard
# start command: npm start
```
