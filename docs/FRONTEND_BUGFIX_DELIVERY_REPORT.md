# Cyber Rakhwala Frontend Bug Fix and Integration Report

Prepared on: 2026-05-25

## 1. Executive Summary

The Cyber Rakhwala frontend was visually built, but it had multiple production-blocking runtime, routing, authentication, integration, and deployment issues. The work completed in this rescue/fix pass focused on stabilizing the React/Vite frontend, reconnecting it to the Node/Express backend, removing broken mock behavior from critical flows, improving the hidden admin console, and preparing the platform for local and production deployment.

This was not a simple cosmetic pass. It included authentication bug fixes, admin route corrections, API-client fixes, tool execution repairs, provider-engine alignment, debug tooling, deployment env cleanup, and admin profile management.

## 2. High-Level Result

- Frontend build is passing
- Backend startup and Mongo connectivity are working
- Hidden admin login path is working
- Normal login refresh-token masking bug is fixed
- Debug center is available and more actionable
- Major tool flows are connected to backend APIs instead of only local simulation
- Admin console now supports a broader operational workflow
- Deploy-ready env and provider setup documentation have been added

## 3. Major Bug Categories Found

The issues were grouped into the following major categories:

1. Authentication and session bugs
2. Admin login redirection bugs
3. Broken frontend route/provider order issues
4. Vite build/import/export failures
5. API client response parsing bugs
6. Frontend blank-screen/runtime crash bugs
7. Local mock data and fake tool execution paths
8. Payment and plan resolution issues
9. Debug visibility gaps
10. Credit synchronization issues
11. Deployment/env duplication and mismatch issues
12. Admin panel UX and module coverage gaps
13. Profile/session management gaps
14. Provider configuration and tool activation gaps

## 4. Key Bugs Identified and Fixed

### 4.1 Authentication and Session

- Fixed the login bug where a normal `/auth/login` failure was incorrectly followed by a refresh-token retry.
- Fixed the user-facing error where `Invalid email or password` was being masked as `Refresh token is invalid or expired`.
- Fixed stale-session restore behavior so the login page does not show a false expired-session error after local auth cleanup.
- Verified that the affected local test account password was out of sync and corrected it in MongoDB.

### 4.2 Admin Login and Hidden Route

- Fixed the hidden admin login flow so a logged-in normal user session no longer incorrectly redirects away from the admin login page.
- Ensured admin auth is persisted properly after successful hidden admin login.
- Preserved the hidden admin route design using the configured secret path.

### 4.3 Routing and Context Bugs

- Fixed a runtime provider ordering issue causing:
  - `useSearchHistory must be used within SearchHistoryProvider`
- Repaired context loading behavior so protected dashboard data is not aggressively requested during unauthenticated states.

### 4.4 Vite / Import / Build Failures

- Fixed broken tool service exports that were causing dependency scanning and build failure.
- Repaired additional frontend import mismatches that were preventing the app from loading correctly.

### 4.5 API Client and Response Handling

- Fixed response body double-read behavior causing:
  - `Failed to execute 'json' on 'Response': body stream already read`
- Improved API failure logging and request tracing.
- Prevented refresh retry from running on public auth endpoints.

### 4.6 Frontend Runtime and Blank-Screen Issues

- Added a safer application error boundary flow.
- Improved frontend diagnostics so runtime problems are easier to inspect.
- Reduced noisy analytics/debug behavior that made root-cause identification harder.

### 4.7 Mock Data and Tool Execution

Critical investigation tools were still using local fake results. These were migrated toward real backend-driven execution:

- Phone Lookup
- Domain Analysis
- IP Intelligence
- Breach Database

This included:

- replacing local `setTimeout`/fake result logic
- using real backend service calls
- adapting backend payloads into frontend UI-friendly structures
- improving result handling and history recording

### 4.8 Payment and Plan Bugs

- Fixed the `Plan not found` failure path by aligning billing behavior with plan availability and backend plan readiness.
- Improved payment-order flow resilience around plan resolution.

### 4.9 Debug Center Improvements

- Added better frontend debug collection
- Added backend debug snapshot/status endpoint
- Improved auto report generation and API failure capture
- Improved layout and usability of the debug panel
- Added clearer separation of frontend errors, API failures, and backend errors

### 4.10 Credit / Dashboard Synchronization

- Fixed stale credit balance issues after tool execution
- Improved dashboard refresh behavior after investigation tool usage

### 4.11 Deployment and Env Cleanup

- Cleaned duplicate keys from backend env
- Aligned local frontend/backend default URLs to `localhost:3000` and `localhost:5000`
- Added cleaner production env templates
- Added provider setup documentation for deployment

### 4.12 Admin Console Expansion

Expanded the admin console with real operational modules for:

- users
- roles
- plans
- subscriptions
- payments
- providers
- tools
- API keys
- datasets
- content
- settings
- tickets
- search logs
- analytics
- threat map
- departments
- profile management

### 4.13 Admin Profile Management

Added a proper admin profile section supporting:

- name change
- email change
- phone change
- organization change
- bio update
- avatar/photo upload
- password change
- active session review
- single-session revoke
- revoke-all sessions

## 5. Major Files Edited

The following are major files that were edited as part of the fix and stabilization effort.

### Frontend

- `frontend/src/services/api.js`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/context/CaseContext.jsx`
- `frontend/src/context/EvidenceContext.jsx`
- `frontend/src/context/SearchHistoryContext.jsx`
- `frontend/src/context/SessionContext.jsx`
- `frontend/src/context/ActivityContext.jsx`
- `frontend/src/pages/auth/routes/AppRoutes.jsx`
- `frontend/src/pages/auth/AdminLogin.jsx`
- `frontend/src/services/adminService.js`
- `frontend/src/pages/dashboards/admin/AdminDashboard.jsx`
- `frontend/src/components/admin/AdminProfilePanel.jsx`
- `frontend/src/pages/dashboards/user/ProfileSettings.jsx`
- `frontend/src/pages/dashboards/user/CyberAvatarDashboard.jsx`
- `frontend/src/pages/dashboards/user/CaseDetailPage.jsx`
- `frontend/src/components/common/DebugPanel.jsx`
- `frontend/src/components/common/ErrorBoundary.jsx`
- `frontend/src/utils/debugStore.js`
- `frontend/src/utils/analytics.js`
- `frontend/src/utils/requestQueue.js`
- `frontend/src/utils/toolResponseAdapters.js`
- `frontend/src/services/tools/index.js`
- `frontend/src/services/tools/breachDatabaseService.js`
- `frontend/src/components/tools/PhoneLookupTool.jsx`
- `frontend/src/components/tools/DomainAnalysisTool.jsx`
- `frontend/src/components/tools/IPIntelligenceTool.jsx`
- `frontend/src/components/tools/BreachDatabaseTool.jsx`
- `frontend/src/components/tools/SocialProfilerTool.jsx`

### Backend

- `backend/src/config/env.js`
- `backend/src/config/database.js`
- `backend/src/app.js`
- `backend/src/middleware/debug.middleware.js`
- `backend/src/utils/debug.store.js`
- `backend/src/services/auth.service.js`
- `backend/src/validators/auth.validator.js`
- `backend/src/services/provider.service.js`
- `backend/src/models/User.js`
- `backend/src/models/Session.js`
- `backend/src/models/RefreshToken.js`
- `backend/src/models/VerificationToken.js`
- `backend/src/models/OtpCode.js`
- `backend/src/models/Case.js`
- `backend/src/services/billing.service.js`
- `backend/src/controllers/billing.controller.js`
- `backend/src/routes/modules/admin.routes.js`
- `backend/src/controllers/admin.controller.js`
- `backend/src/services/admin.service.js`
- `backend/src/routes/modules/auth.routes.js`
- `backend/src/routes/modules/upload.routes.js`
- `backend/src/controllers/upload.controller.js`
- `backend/docs/DEPLOYMENT.md`
- `backend/docs/PROVIDER_SETUP.md`
- `backend/docs/PRODUCTION_ENV.md`
- `backend/.env.example`

## 6. Estimated Engineering Effort

No formal stopwatch/time tracker was running for every pass, so the number below is an engineering estimate based on the implemented scope.

Estimated senior full-stack effort equivalent:

- Triage and architecture recovery: 4 to 6 hours
- Auth/session/admin routing fixes: 5 to 8 hours
- API client and debug system fixes: 4 to 6 hours
- Tool integration and mock-removal for critical tools: 8 to 14 hours
- Admin console expansion and operational modules: 8 to 12 hours
- Profile/session/account management improvements: 4 to 6 hours
- Deployment/env/docs cleanup: 4 to 6 hours
- Validation and re-testing: 3 to 5 hours

Estimated total equivalent effort:

- 40 to 63 senior engineering hours

## 7. Market Pricing Estimate

This is an estimate, not an invoice rule. It depends on urgency, developer seniority, and whether the work is done by a freelancer or an agency.

### Current Market Signals Used

- Codingclave reports short-task hourly React developer pricing in India around `Rs.1,500 to Rs.3,500 per hour` for freelance/direct work: [https://codingclave.com/guides/hire-react-developer-india-2026](https://codingclave.com/guides/hire-react-developer-india-2026)
- Aexaware’s 2026 India outsourcing guide places senior React/Next style frontend work roughly in the `USD 35 to 50 per hour` band and senior Node/backend work roughly in the `USD 40 to 60 per hour` band for India-market delivery: [https://aexaware.com/blog/outsource-web-development-to-india-2026-the-no-burn-guide/](https://aexaware.com/blog/outsource-web-development-to-india-2026-the-no-burn-guide/)
- Cadence’s 2026 freelance benchmarks place full-stack work materially above junior ad-hoc rates, with India often priced below Western headline rates through regional adjustment: [https://cadence.withremote.ai/blog/freelance-developer-rates-2026](https://cadence.withremote.ai/blog/freelance-developer-rates-2026)

### Practical India Direct-Client Estimate

For this scope, a reasonable direct freelance valuation is:

- `Rs.60,000 to Rs.2,20,000`

More realistic negotiated range for a strong senior rescue/deploy pass:

- `Rs.90,000 to Rs.1,60,000`

If billed as emergency turnaround, architecture recovery, and deploy hardening together:

- `Rs.1,25,000 to Rs.2,50,000`

### International Freelance Equivalent

Using a rough `USD 35 to 60 per hour` blended senior rate over `40 to 63 hours`:

- `USD 1,400 to USD 3,780`

## 8. Deliverable Value Statement

This work should be positioned not as "small bug fixing" but as:

- frontend rescue and stabilization
- backend reconnection
- enterprise auth correction
- admin operations console expansion
- deployment and provider activation preparation

That is materially more valuable than only changing UI text or fixing one screen.

## 9. Remaining Known Issues / Pending Work

The project is much more stable now, but a few items still remain if full backend-driven maturity is required:

1. Some secondary tools still need full migration away from local simulation:
   - Email Forensics
   - URL Scanner
   - Geolocation
   - DNS Records
   - Social Profiler
   - Data Mining

2. Payment gateways still need real live credentials and webhook validation for full production billing.

3. SMTP and Google OAuth still need real production credentials if those flows are to be enabled.

4. The frontend bundle is large, and Vite still warns about chunk size. This is not a runtime blocker, but performance optimization is still pending.

5. A few legacy/local-storage-oriented student-side screens may still need deeper backend unification depending on final production requirements.

## 10. Recommended Next Billing Position

If this report is being sent to a client or stakeholder, the work can honestly be described as:

"Production rescue, auth stabilization, admin-control expansion, API integration hardening, deployment preparation, and frontend runtime bug fixing for an enterprise cyber intelligence platform."

## 11. Final Note

Before production deployment, rotate any credentials that were ever shared in plain text, including:

- MongoDB credentials
- JWT secrets
- default admin/demo passwords
- any API provider secrets

