# Edge Functions - DISABLED

This directory contains Supabase Edge Functions that are currently **disabled** to prevent deployment errors.

## Why Disabled?

The edge functions were causing a 403 Forbidden error during deployment:
```
Error while deploying: XHR for "/api/integrations/supabase/.../edge_functions/make-server/deploy" failed with status 403
```

This project doesn't require Supabase Edge Functions for its core functionality, as it's a frontend-only application using Supabase as a database backend.

## How to Re-enable

If you need to enable edge functions in the future:

1. Rename this directory back to `functions`:
   ```bash
   mv supabase/functions.disabled supabase/functions
   ```

2. Ensure you have proper Supabase project permissions for edge function deployment

3. Configure your edge functions according to Supabase documentation:
   https://supabase.com/docs/guides/functions

## Current Status

- **Deployment Status**: DISABLED
- **Reason**: Preventing 403 deployment errors
- **Impact**: None - application uses direct database access, not edge functions
