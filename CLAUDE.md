# Instructions for Claude

## Always link a demo at the end of a task

When a task changes something visible in the app, end the task — the chat reply and the PR
description alike — with a link to see it live, not just a description of the change:

- On an open PR: the Netlify deploy-preview URL (`https://deploy-preview-<pr-number>--food-origins.netlify.app`).
- Once merged to `main`: the production URL, https://food-origins.netlify.app.

Point the link at the specific view being demonstrated, not just the bare root — e.g. "open
Forage, then use your location" rather than only the domain — so whoever opens it lands on the
state being shown off, the same way the PR body's `Preview:` line already does.
