<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1sd2qDReNDvtr3PclJsM-wB2cHdll_kJP

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. **Important:** Add the environment variable `GEMINI_API_KEY` in your Vercel project settings:
   - Go to your project settings → Environment Variables
   - Add `GEMINI_API_KEY` with your Gemini API key value
   - Make sure to select all environments (Production, Preview, Development)
4. Deploy!
