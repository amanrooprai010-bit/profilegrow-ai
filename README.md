# ProfileGrow AI

A Vercel-ready MVP that analyzes an Instagram business profile using a public link plus screenshots. It produces an English audit, prioritized fixes, an improved bio, content pillars, a 30-day roadmap, a printable report, and an AI follow-up coach.

## Deploy to Vercel

1. Create a new GitHub repository.
2. Upload the contents of this folder to the repository.
3. In Vercel, choose **Add New → Project** and import the repository.
4. In **Project Settings → Environment Variables**, add:
   - `OPENAI_API_KEY` — your API key (keep it private; never add it to GitHub).
   - `AI_MODEL` — optional. If omitted, the server uses its configured default.
5. Deploy the project.

No build command or output directory is required.

## Test without an API key

Click **Preview with a sample business**. The sample audit works without external services.

## How the MVP works

- Users provide an Instagram URL, business type, location, goal, and up to six screenshots.
- Screenshots are converted in the browser and sent to the serverless analysis endpoint.
- The endpoint asks the AI to return structured JSON.
- The dashboard renders scores, problems, solutions, content pillars, and a 30-day plan.
- The report can be saved as PDF using the browser’s print dialog.
- The AI coach uses the completed audit as context.

## Current limitations

- The app does not scrape Instagram or access private account analytics.
- Recommendations depend on the screenshots and details supplied by the user.
- Files are limited to six images and 4 MB per image in the interface.
- Before a public launch, add authentication, rate limits, a privacy policy, analytics, and persistent storage if you want users to save reports.

## Files

- `index.html` — application interface
- `styles.css` — responsive visual design
- `app.js` — upload, rendering, report and chat behavior
- `api/analyze.js` — Vercel serverless AI endpoint
- `vercel.json` — serverless configuration and security headers
