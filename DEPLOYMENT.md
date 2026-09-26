# Deploy GCC Compass to Vercel

Repository: https://github.com/singhrahul7988/Gcc-Compass

The Vite frontend is served from dist/. AI and research endpoints run in api/ai.js. vercel.json routes /api/ai/* to that function and includes the processed CSV data it reads.

## 1. Verify the code

Use Node.js 22.12 or newer within Node.js 22.x:

~~~sh
npm ci
npm run check
npm audit --audit-level=high
~~~

The check command runs server regression tests, opportunity data verification, TypeScript checks, and the production build. GitHub Actions runs these checks on pushes and pull requests.

Ensure the deployment fixes are on your Vercel branch and its **Deployment checks / verify** job passes. Merge the deployment pull request before importing main, or deploy its branch for an initial preview.

## 2. Set up persistent sessions

Create an Upstash Redis database using [Upstash](https://console.upstash.com/) or [Vercel Marketplace](https://vercel.com/marketplace/upstash), and connect it to your Vercel project.

Copy its **REST URL** and **REST token**. Use a token with write permissions, not a read-only token. The application uses Redis GET and EVAL commands.

Generate the encryption secret on your own computer:

~~~sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
~~~

Save the output as GCC_SESSION_SECRET. It must contain exactly 64 hexadecimal characters.

| Environment variable | Value |
| --- | --- |
| UPSTASH_REDIS_REST_URL | Database's HTTPS REST URL |
| UPSTASH_REDIS_REST_TOKEN | Database's REST token with write permissions |
| GCC_SESSION_SECRET | Generated 64-character encryption secret |

Add all three to **Production** and **Preview** in Vercel's environment settings. Do not prefix them with VITE_ or commit their values. Preview and production use separate Redis namespaces.

Users enter their own AI and research API keys through **Manage API keys** in the app. Redis stores these sessions encrypted with AES-256-GCM for 12 hours. Browsers receive only a random session identifier in an HttpOnly, SameSite=Strict cookie, with Secure enabled over HTTPS.

Keep the encryption secret stable between redeployments. Changing it makes existing sessions unreadable; users must clear the gcc_ai_session cookie and reconnect. Sessions expire after 12 hours regardless.

Local development works without Redis using temporary in-memory sessions. Vercel requires persistent storage and returns JSON 503 errors if configuration is missing or incomplete.

## 3. Import and deploy

1. Sign in to [Vercel](https://vercel.com/) with GitHub.
2. Choose **Add New / New Project**, grant access to Gcc-Compass, and import it.
3. Use these settings:

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Root directory | Repository root (./) |
| Node.js version | 22.x |
| Install command | npm ci |
| Build command | npm run build |
| Output directory | dist |
| Production branch | main, after the fixes are merged |

4. Add the three environment variables above before deploying.
5. Keep **Fluid Compute** enabled. The function has a maximum duration of 300 seconds; research stops after 280 seconds to allow its response to finish.
6. Select **Deploy** and wait for the build and API function to succeed.

vercel.json supplies the build settings, API rewrite, duration, and CSV inclusion. Do not use npm start as the build command: Vercel runs the exported function directly.

References: [Git deployment](https://vercel.com/docs/git), [Node.js functions](https://vercel.com/docs/functions/runtimes/node-js), and [function duration limits](https://vercel.com/docs/functions/limitations).

## 4. Check the deployed app

- Visit every navigation tab and reload shared links such as /#cities=Hyderabad,Pune.
- Open /api/ai/status. It should return JSON, initially with configured: false.
- In AI Analyst, ask a local research question without keys. Local evidence should stream and the request should finish.
- Add your provider key and a model ID your account can access in **Manage API keys**. Save, reload, and use **Test connection**.
- For live web research, connect a research service and submit a focused question. This uses your providers' normal API quota.
- Open a second browser profile and confirm it starts without your saved keys.

With local Chrome or Playwright Chromium installed, run the existing navigation check against a public deployment in PowerShell:

~~~powershell
$env:APP_URL = 'https://your-project.vercel.app'
node scripts/verify_page_navigation.mjs
Remove-Item Env:APP_URL
~~~

For protected previews, sign in and check manually or configure a deployment-protection bypass for automated testing.

## Troubleshooting

- **npm ci fails:** commit package.json and package-lock.json together and select Node.js 22.x.
- **API returns 404 or HTML:** confirm api/ai.js and vercel.json are deployed and the root directory is the repository root.
- **API returns 503:** verify all three storage variables, Redis connectivity, token write permissions, and secret format. Redeploy after changing environment variables. After secret rotation, clear the gcc_ai_session cookie.
- **Missing local CSV data:** ensure dataset/processed/ is committed and includeFiles is present in the function settings.
- **Research reaches the duration limit:** enable Fluid Compute and try a narrower question.
- **Provider rejects a key or model:** check account quota, permissions, and the exact model ID.
- **Vite warns about a large JavaScript chunk:** the build still succeeds. Bundle splitting is a performance improvement to consider after launch.

Automated tests mock Redis and provider responses. They do not deploy to Vercel or make paid AI requests. Verify real credentials and hosting in the deployed app.
