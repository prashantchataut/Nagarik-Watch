---
name: live-data-widget-integration-skill
description: Use when adding weather, AQI, NEPSE, bullion, forex, sports, election, exam, disaster, parliament or YouTube live widgets.
---

# Live Data Widget Integration

Every widget must show source, timestamp, loading state, error state and mock status when not backed by a real provider.

Providers must be non-blocking and cacheable. A failed provider must not break the homepage.

Use environment variables for credentials. Never hardcode API keys, provider tokens or scraped endpoints.
