Window Into The World - Vercel Deployment Guide

Current architecture
Frontend: React (CRA + TypeScript + Tailwind)
Backend: Vercel Functions in /api
Database: Supabase
Email provider: Resend

API routes now in Vercel Functions
/api/health
/api/signup
/api/prompts/send-weekly
/api/webhooks/resend/inbound

What you need
Supabase account
Resend account
Vercel account
Domain with DNS access

Supabase setup
1) Create project.
2) Run db/phase1_schema.sql in SQL editor.
3) Save these values:
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
4) Confirm tables exist:
subscribers
prompts
responses

Resend setup
1) Verify sending domain in Resend.
2) Add SPF and DKIM DNS records from Resend.
3) Create sender identity, example:
hello@yourdomain.com
4) Save:
RESEND_API_KEY
RESEND_FROM_EMAIL

Inbound reply setup
1) In Resend inbound routing, set webhook URL:
https://YOUR_DOMAIN/api/webhooks/resend/inbound
2) Save inbound secret as:
RESEND_WEBHOOK_SECRET
3) Send test email and reply.
4) Confirm row appears in Supabase responses table.

Vercel environment variables
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_WEBHOOK_SECRET
APP_URL
MANUAL_SEND_SECRET

Local development
npm install
npm run dev

How local dev works
react-scripts runs frontend on localhost:3000
vercel dev runs functions on localhost:8787
CRA proxy forwards /api requests to 8787

Weekly prompt send security
Set MANUAL_SEND_SECRET in production.
Calls to /api/prompts/send-weekly must include header:
x-manual-send-secret: <your secret>

Pre-launch checklist
1) Domain verified in Resend.
2) SPF/DKIM passing.
3) Signup creates subscriber row.
4) Welcome email is delivered.
5) Reply to welcome email creates responses row.
6) Weekly prompt endpoint sends to active subscribers.
7) All env vars are set in Vercel project.

Security notes
Never expose SUPABASE_SERVICE_ROLE_KEY in client-side code.
Rotate keys immediately if leaked.
