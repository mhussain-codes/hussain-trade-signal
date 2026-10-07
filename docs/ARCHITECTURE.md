# Hussain Trade Signal (HTS) - Architecture & Security Audit

## 1. Security Enhancements Implemented
- **Backend Enforced AI:** The Flutter application NEVER contacts the Gemini API directly. `GEMINI_API_KEY` is exclusively managed via Netlify Environment Variables.
- **License-Gated Endpoints:** Every AI Netlify function (`generate-signal`, `analyze-news`) strictly verifies the user's `licenseKey` and `deviceId` against the Supabase database before executing the request.
- **Device Locking (Scalability & Security):** Added `device_id` tracking in the `licenses` table. When a user first activates a license, the backend ties it to their specific device UUID. If a second user attempts to use the same license key from a different device, access is automatically rejected.
- **Data Integrity:** The Supabase Row Level Security (RLS) policies prevent unauthorized modifications. The backend utilizes the Anon key securely, and future integrations can upgrade to the Service Role key for deeper admin operations.

## 2. Supabase Database Design
The `licenses` table serves as the Single Source of Truth.
\`\`\`sql
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT UNIQUE NOT NULL,
    active BOOLEAN DEFAULT true,
    user_email TEXT,
    device_id TEXT, 
    activated_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    notes TEXT
);
\`\`\`
*To manage 100+ licenses, the Admin can utilize the Supabase Dashboard, or a lightweight internal tool interacting directly with the Supabase Service Role Key.*

## 3. Flutter Application Architecture
- **State Management:** Fully integrated `flutter_riverpod` for scalable, predictable state management.
- **Routing:** Implemented `go_router` for robust navigation and declarative deep-linking, including automatic redirection to the `/license` screen if the license is revoked or missing.
- **UI/UX:** Built on top of Material 3 with a customized dark theme matching the "Premium fintech style" with Gold (`#EAB308`), Dark Navy (`#0B0F19`), and Glassmorphism accents.
- **Local Storage:** `shared_preferences` securely caches the user's validated license state to prevent redundant lookups, while still validating against the server on mission-critical AI calls.

## 4. Next Steps for Production
1. **Run `flutter pub get`** in the `hts_flutter` directory to download all dependencies.
2. **Launch the app** using `flutter run` to test the License Activation flow against the live backend.
3. Deploy the backend (already configured in the `hts-app` folder) to Netlify.
4. Expand the `DashboardScreen` widget tree with the TradingView/Candlesticks charting package and complete the Signal UI flow following the Riverpod patterns established in `auth_provider.dart`.
