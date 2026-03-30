# OAuth Integration Implementation Summary

## Files Created

### 1. Environment Configuration
- **`.env.example`** - Template for required environment variables
  - Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
  - Meta OAuth: `META_CLIENT_ID`, `META_CLIENT_SECRET`, `META_REDIRECT_URI`

### 2. Database Migration
- **`ADD_META_ADS.sql`** - SQL migration to add `meta_ads` to integrations platform constraint

### 3. Core Components

#### Settings Page
- **`src/app/(dashboard)/settings/page.tsx`** - Updated with tab navigation
  - Tabs: Branding | Integrations | Team
  - Default tab: Branding
  - Integrations tab shows connection UI

#### Integrations Tab Component
- **`src/components/settings/IntegrationsTab.tsx`** - Main integration UI
  - Displays 3 integration cards: Google Analytics 4, Google Ads, Meta Ads
  - Shows status (Connected/Not Connected)
  - Connect/Disconnect buttons with loading states
  - Fetches connection status from database

### 4. OAuth Routes

#### Google OAuth
- **`src/app/api/integrations/google/connect/route.ts`**
  - Generates Google OAuth authorization URL
  - Scopes: analytics.readonly, adwords
  - Returns authUrl for redirect

- **`src/app/api/integrations/google/callback/route.ts`**
  - Exchanges authorization code for access/refresh tokens
  - Upserts integration into database
  - Redirects to settings with success/error parameters

#### Meta OAuth
- **`src/app/api/integrations/meta/connect/route.ts`**
  - Generates Facebook OAuth authorization URL
  - Scopes: ads_read, business_management
  - Returns authUrl for redirect

- **`src/app/api/integrations/meta/callback/route.ts`**
  - Exchanges authorization code for access token
  - Upserts integration into database
  - Redirects to settings with success/error parameters

#### Disconnect
- **`src/app/api/integrations/[platform]/disconnect/route.ts`**
  - DELETE route to remove integration
  - Removes row from integrations table
  - Returns success status

### 5. Utilities
- **`src/lib/integrations/refreshToken.ts`**
  - `refreshGoogleToken(integrationId)` - Refreshes Google OAuth tokens
  - Updates access_token and token_expires_at in database
  - Used for renewing expired tokens

## Database Schema
Expected `integrations` table structure:
```sql
- id (UUID)
- agency_id (UUID, FK)
- platform (platform CHECK - now includes 'meta_ads')
- access_token (TEXT)
- refresh_token (TEXT, nullable)
- token_expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

## Setup Instructions

1. **Set environment variables in `.env.local`:**
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback

   META_CLIENT_ID=your_meta_app_id
   META_CLIENT_SECRET=your_meta_app_secret
   META_REDIRECT_URI=http://localhost:3000/api/integrations/meta/callback
   ```

2. **Apply database migration:**
   ```sql
   -- Run ADD_META_ADS.sql in Supabase
   ```

3. **Test the flow:**
   - Navigate to `/settings?tab=integrations`
   - Click "Connect" on any platform
   - Complete OAuth flow
   - Integration should appear as "Connected"

## Flow Diagram

```
User clicks "Connect" on platform card
→ Calls /api/integrations/{platform}/connect
→ Returns OAuth authUrl
→ Redirects to OAuth provider (Google/Meta)
→ User authorizes
→ Redirected to /api/integrations/{platform}/callback
→ Exchange code for tokens
→ Upsert to integrations table
→ Redirect to /settings?tab=integrations&connected={platform}
→ Component refreshes and shows "Connected" status
```

## Notes

- Google tokens include refresh_token for long-term access
- Meta tokens don't expire but set 60-day refresh interval
- All error cases redirect to settings with error parameter
- Disconnect requires user confirmation
- Token refresh utility ready for background job integration
