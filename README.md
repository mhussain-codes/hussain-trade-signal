# Hussain Trade Signal (HTS) - Developer Setup Guide

A complete guide to testing, running, and deploying HTS locally and in production.

## 1. Installation

1. Make sure you have Node.js (v18+) installed.
2. Navigate to the project directory:
   \`\`\`bash
   cd hts-app
   \`\`\`
3. Install all dependencies:
   \`\`\`bash
   npm install
   \`\`\`
4. Install Netlify CLI for backend function emulation:
   \`\`\`bash
   npm install -g netlify-cli
   \`\`\`

## 2. Environment Setup

1. Copy the `.env.local` template:
   \`\`\`bash
   cp .env.local .env
   \`\`\`
2. Open `.env` and fill in your keys:
   - \`SUPABASE_URL\`: Your Supabase project URL.
   - \`SUPABASE_ANON_KEY\`: Your Supabase Anon Key.
   - \`GEMINI_API_KEY\`: Your Google Gemini API Key.

**Security Note:** Never expose \`GEMINI_API_KEY\` to the frontend. It is only read by the Netlify Functions on the backend.

## 3. Supabase Setup & Seeding

The platform requires a \`licenses\` table.
1. Run the SQL from \`supabase_schema.sql\` in your Supabase SQL Editor.
2. Seed test licenses locally:
   \`\`\`bash
   node seed.js
   \`\`\`
   *This automatically inserts \`HTS_TEST_LICENSE_001\`, \`002\`, and \`003\` for testing.*

## 4. Localhost Testing (Development Server)

Run the project with Netlify Dev. This starts both the Vite frontend and the Netlify backend functions simultaneously:
\`\`\`bash
ntl dev
\`\`\`
*(or \`npx netlify-cli dev\`)*

- **Frontend:** http://localhost:8888
- **Developer Panel:** http://localhost:8888/dev (Hidden panel to verify API, Gemini, and Supabase connections)

## 5. Building & Running Production Locally

Before deploying to Netlify, verify the production build locally:

1. Build the production version:
   \`\`\`bash
   npm run build
   \`\`\`
2. Run the local production build using Netlify CLI:
   \`\`\`bash
   ntl serve
   \`\`\`

## 6. Production Deployment (Netlify)

The project is fully configured for Netlify via \`netlify.toml\`.

1. Push your repository to GitHub.
2. Log into Netlify -> Add New Site -> Import an existing project.
3. Add your Environment Variables (\`GEMINI_API_KEY\`, \`SUPABASE_URL\`, \`SUPABASE_ANON_KEY\`) in Site Settings > Environment Variables.
4. Deploy! Netlify will automatically build the React app and deploy the secure functions.

## 7. Troubleshooting

- **"API Service Unavailable"**: Ensure \`GEMINI_API_KEY\` is correct in your \`.env\` and you are using \`ntl dev\` instead of \`npm run dev\`.
- **License Suspended**: Go to your Supabase dashboard and ensure \`active\` is set to \`true\` for your test license.
- **Tailwind Build Errors**: Run \`npm install @tailwindcss/postcss -D\` if Tailwind v4 caching fails.
