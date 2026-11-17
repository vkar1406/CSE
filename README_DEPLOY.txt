INTERVIEW COMMAND CENTER — ZERO INSTALL DEPLOYMENT

FILES INCLUDED
public/index.html           Full 601 Q&A dashboard with voice and streaming AI
public/login.html           Password login screen
functions/_middleware.js    Secures pages and API with a signed session cookie
functions/api/login.js      Verifies your private dashboard password
functions/api/answer.js     Streams OpenAI answers from server-side secret key

NO LOCAL SOFTWARE REQUIRED: GITHUB + CLOUDFLARE PAGES
1. In a browser, sign up/sign in at github.com. Create a NEW PRIVATE repository, e.g. interview-command-center.
2. Open repository > Add file > Upload files. Drag the contents of this extracted project into the upload area, preserving the public/ and functions/ folder paths. GitHub's web upload can support dragging a folder on compatible desktop browsers; otherwise use Add file > Create new file and type each path, pasting the corresponding file content. Ensure all five files appear in their proper paths. Commit changes.
3. Sign in to dash.cloudflare.com. Navigate to Workers & Pages > Create > Pages > Connect to Git (UI labels may vary). Authorize GitHub and select the private repository.
4. Build configuration: Framework preset = None; build command = blank; build output directory = public; root directory = / (repository root). Deploy.
5. In the Pages project Settings > Variables and Secrets (or Environment Variables), add encrypted SECRET values:
   OPENAI_API_KEY = your OpenAI API key (do NOT put it in GitHub or the HTML)
   APP_PASSWORD = a long unique dashboard password (at least 16 characters)
   Optional OPENAI_MODEL = gpt-4.1-mini
   Apply to Production, and Preview if you intend to use preview deployments.
6. Redeploy the project after setting secrets if needed (Deployments > Retry deployment).
7. Open the *.pages.dev URL. You should see a password sign-in page. Enter APP_PASSWORD and the 601-question dashboard will load.
8. Test a known question, then enter a new question in Live AI and click Generate answer here. Allow microphone access to test voice mode in Chrome/Edge.

SECURITY AND COST
- The API key is used ONLY by Cloudflare server-side Functions. It is never included in public HTML or JavaScript.
- The dashboard has a password login and signed 12-hour cookie. Anyone with your password can use the AI endpoint and incur API costs. Use a strong password, don't share it, and rotate it if exposed.
- Configure a budget/usage alerts on the OpenAI Platform; rate limits/WAF rules in Cloudflare are recommended for extra protection. The included password gate does not implement account lockout or request-rate limits.
- ChatGPT Plus does not include API credits. OpenAI API usage is billed separately.
- Voice recognition uses the browser Web Speech API and may rely on the browser provider's speech service; browser support varies.
- AI answers are not guaranteed in milliseconds. Existing 601 answers appear immediately; AI text streams as generated.
- The 601 question bank is embedded in the deployed HTML. The private repository is private, but the hosted HTML is accessible to anyone who signs in with the password.
- Custom Q&A notes are saved in browser localStorage, not synchronized across devices. Use the dashboard's export/import tools to transfer them.
- Do not use covert recording during an interview. Obtain consent and follow employer rules.

TROUBLESHOOTING
- 503: Set both APP_PASSWORD and OPENAI_API_KEY secrets and redeploy.
- 401 API: Refresh and sign in again.
- 502 AI: Verify API key, billing, model access and OpenAI availability.
- If a deployed page shows 404, check that build output directory is public.
- If the HTML loads but API 404s, check that functions/ is at the repository root and Cloudflare Pages Functions are enabled.
