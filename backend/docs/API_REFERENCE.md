# API Reference

## Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/demo`
- `POST /api/auth/google`
- `POST /api/auth/refresh-token`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `POST /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-email`
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `GET /api/auth/sessions`
- `DELETE /api/auth/sessions`
- `DELETE /api/auth/sessions/:id`

## Account

- `GET /api/account/dashboard`
- `GET /api/account/notifications`
- `PATCH /api/account/notifications/:id/read`
- `GET /api/account/activities`
- `GET /api/account/searches`
- `GET /api/account/credits`
- `GET /api/account/subscriptions`
- `GET /api/account/tickets`

## Cases

- `GET /api/cases`
- `GET /api/cases/statistics`
- `GET /api/cases/export`
- `GET /api/cases/:id`
- `POST /api/cases`
- `PUT /api/cases/:id`
- `DELETE /api/cases/:id`
- `POST /api/cases/:id/evidence`
- `DELETE /api/cases/:id/evidence/:evidenceId`
- `POST /api/cases/:id/notes`
- `POST /api/cases/:id/team`

## Evidence

- `GET /api/evidence`
- `GET /api/evidence/statistics`
- `GET /api/evidence/export`
- `GET /api/evidence/:id`
- `POST /api/evidence`
- `PUT /api/evidence/:id`
- `DELETE /api/evidence/:id`
- `POST /api/evidence/:id/verify`
- `POST /api/evidence/:id/unverify`
- `POST /api/evidence/:id/tags`
- `DELETE /api/evidence/:id/tags/:tag`
- `POST /api/evidence/:id/correlations`
- `DELETE /api/evidence/:id/correlations/:correlatedId`
- `POST /api/evidence/bulk-delete`
- `POST /api/evidence/bulk-verify`

## Billing

- `GET /api/plans`
- `POST /api/redeem/validate`
- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `POST /api/payments/webhooks/stripe`
- `POST /api/payments/webhooks/razorpay`
- `GET /api/payments/my`
- `GET /api/subscriptions/my`
- `GET /api/invoices/my`

## Public / Support / Analytics

- `GET /api/public/bootstrap`
- `POST /api/contact`
- `POST /api/feedback`
- `POST /api/chatbot/message`
- `GET /api/chatbot/history/:conversationId`
- `DELETE /api/chatbot/history/:conversationId`
- `POST /api/analytics/events`
- `POST /api/verify-captcha`
- `POST /api/verify-turnstile`

## Tools / OSINT

- `POST /api/osint/:action`
- `GET /api/osint/history`
- `DELETE /api/osint/history`
- `GET /api/osint/results/:id`
- `GET /api/osint/export`
- `GET /api/tools/search-history`
- `DELETE /api/tools/search-history`
- `PATCH /api/tools/search-history/:id/bookmark`
- `GET /api/tools/:category/:action`
- `GET /api/tools/:category/:action/:entityId`
- `POST /api/tools/:category/:action`
- `POST /api/tools/:category/:action/:entityId`

## Threat Map

- `GET /api/threat-map/cities`
- `GET /api/threat-map/cities/:id`
- `GET /api/threat-map/attacks/live`
- `POST /api/threat-map/attacks/filter`
- `GET /api/threat-map/attacks/history`
- `GET /api/threat-map/stats/global`
- `GET /api/threat-map/stats/global/attack-types`
- `GET /api/threat-map/stats/history`
- `GET /api/threat-map/threat-level`
- `GET /api/threat-map/intel`
- `GET /api/threat-map/actors`
- `GET /api/threat-map/actors/:id`
- `GET /api/threat-map/ioc`
- `GET /api/threat-map/regions`
- `GET /api/threat-map/regions/:region/stats`
- `GET /api/threat-map/alerts`
- `PATCH /api/threat-map/alerts/:id`
- `POST /api/threat-map/alerts/subscribe`
- `POST /api/threat-map/search`

## Uploads

- `POST /api/uploads/file`
- `POST /api/uploads/image`
- `POST /api/<ADMIN_PANEL_PATH>/datasets/:id/import`

## Admin

- `POST /api/<ADMIN_PANEL_PATH>/auth/login`
- `GET /api/<ADMIN_PANEL_PATH>/dashboard`
- `GET /api/<ADMIN_PANEL_PATH>/analytics`
- `GET /api/<ADMIN_PANEL_PATH>/users`
- `PATCH /api/<ADMIN_PANEL_PATH>/users/:id`
- `POST /api/<ADMIN_PANEL_PATH>/users/:id/ban`
- `POST /api/<ADMIN_PANEL_PATH>/users/:id/unban`
- `GET /api/<ADMIN_PANEL_PATH>/plans`
- `POST /api/<ADMIN_PANEL_PATH>/plans`
- `PUT /api/<ADMIN_PANEL_PATH>/plans/:id`
- `GET /api/<ADMIN_PANEL_PATH>/payments`
- `GET /api/<ADMIN_PANEL_PATH>/subscriptions`
- `GET /api/<ADMIN_PANEL_PATH>/providers`
- `POST /api/<ADMIN_PANEL_PATH>/providers`
- `PUT /api/<ADMIN_PANEL_PATH>/providers/:id`
- `GET /api/<ADMIN_PANEL_PATH>/datasets`
- `POST /api/<ADMIN_PANEL_PATH>/datasets`
- `PUT /api/<ADMIN_PANEL_PATH>/datasets/:id`
- `GET /api/<ADMIN_PANEL_PATH>/coupons`
- `POST /api/<ADMIN_PANEL_PATH>/coupons`
- `PUT /api/<ADMIN_PANEL_PATH>/coupons/:id`
- `GET /api/<ADMIN_PANEL_PATH>/api-keys`
- `POST /api/<ADMIN_PANEL_PATH>/api-keys`
- `PUT /api/<ADMIN_PANEL_PATH>/api-keys/:id`
- `GET /api/<ADMIN_PANEL_PATH>/settings`
- `POST /api/<ADMIN_PANEL_PATH>/settings`
- `PUT /api/<ADMIN_PANEL_PATH>/settings/:id`
- `GET /api/<ADMIN_PANEL_PATH>/feature-toggles`
- `POST /api/<ADMIN_PANEL_PATH>/feature-toggles`
- `PUT /api/<ADMIN_PANEL_PATH>/feature-toggles/:id`
- `GET /api/<ADMIN_PANEL_PATH>/content`
- `POST /api/<ADMIN_PANEL_PATH>/content`
- `PUT /api/<ADMIN_PANEL_PATH>/content/:id`
- `GET /api/<ADMIN_PANEL_PATH>/search-logs`
- `GET /api/<ADMIN_PANEL_PATH>/tickets`
- `PUT /api/<ADMIN_PANEL_PATH>/tickets/:id`
- `GET /api/<ADMIN_PANEL_PATH>/threat-events`
- `GET /api/<ADMIN_PANEL_PATH>/threat-alerts`
- `POST /api/<ADMIN_PANEL_PATH>/threat-alerts`
- `PUT /api/<ADMIN_PANEL_PATH>/threat-alerts/:id`
