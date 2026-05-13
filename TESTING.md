# Testing Strategy

This codebase had no automated tests at the start of the cleanup
work on the `miks` branch. That's the single biggest blocker to
the next round of refactors — splitting `webRenderer.tsx`,
`editorShell.tsx`, the product modals, building a backend service
layer — because there's nothing to catch a regression except a
human clicking through the app.

This file describes the recommended test setup. Each section
includes the install commands, the config files that need to
exist, and one runnable example test. Adopt incrementally:
**one passing test for the critical happy-path of each
controller / each top-level page is far more valuable than
chasing 100% coverage.**

---

## Backend — Jest + Supertest

**Why these tools.** Jest is already a Node-standard test runner
with watch mode, snapshot support, and good Firestore-mock
ergonomics. Supertest lets you make HTTP calls against the
Express app without binding to a port — fast and isolated.

**Install (devDeps only):**

```bash
cd backend
npm install --save-dev jest supertest jest-mock-extended
```

**Add to `backend/package.json` scripts:**

```json
"test": "jest",
"test:watch": "jest --watch"
```

**Create `backend/jest.config.js`:**

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEach: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
  ],
  // Firestore + email service are external; mock them per-test.
};
```

**Create `backend/tests/setup.js`** (silences logger noise):

```js
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
```

### Mocking Firestore

The controllers `require('../models/<Model>')` directly. Each
model file calls `require('../config/firebase')` for the `db`
object. In tests, mock `config/firebase` once at the top of the
test file:

```js
jest.mock('../../config/firebase', () => ({
  db: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  auth: {
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
  },
}));
```

For richer interactions, replace each `jest.fn()` with one
returning the shape the controller expects. The mock survives the
controller's transitive `require` graph.

### Example: `tests/controllers/auth.test.js`

```js
const request = require('supertest');

jest.mock('../../config/firebase', () => ({
  db: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ exists: false }),
  },
  auth: {
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
  },
}));

jest.mock('../../utils/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue({ sent: true }),
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ sent: true }),
  sendCollaborationInviteEmail: jest.fn().mockResolvedValue({ sent: true }),
  sendAdminActionEmail: jest.fn().mockResolvedValue({ sent: true }),
}));

// Import AFTER mocks
const app = require('../../server');

describe('POST /api/auth/login (validation)', () => {
  it('rejects missing email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'irrelevant' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
```

This test alone establishes:
- Jest works
- Firestore is mocked
- The Express app boots in-process
- The error handler is wired (returns proper status code)

Add one such test per controller's happy path before doing any
controller→service refactor.

---

## Frontend — Playwright (E2E)

**Why Playwright.** The frontend is a Next.js App Router app
with a heavy Craft.js editor. Unit-testing the editor in
isolation is painful (it depends on real DOM measurement,
drag-and-drop events, animation frames). Playwright drives a
real browser so the test exercises what users actually do.

**Install (devDeps only):**

```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install chromium  # one-time browser download
```

**Add to `frontend/package.json` scripts:**

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

**Create `frontend/playwright.config.ts`:**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false, // editor state is heavy; serial first
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

### Example: `frontend/e2e/landing.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/); // any title
});

test('auth modal opens', async ({ page }) => {
  await page.goto('/landing');
  // Adjust selector to match your CTA
  const cta = page.getByRole('button', { name: /sign in|log in/i }).first();
  if (await cta.count()) {
    await cta.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  }
});
```

### Example: `frontend/e2e/editor-smoke.spec.ts` (skeleton)

```ts
import { test, expect } from '@playwright/test';

// This is the test that protects the drag-and-drop code path
// the user reported as laggy. Even just "it loads and a drag
// doesn't throw" catches a wide class of regressions.

test.skip('editor loads a project and a drag completes', async ({ page }) => {
  // 1. Auth flow — log in as a known test user
  // 2. Navigate to /design?projectId=<seeded-id>
  // 3. Wait for the canvas to render
  // 4. Drag a Container from the left panel onto the canvas
  // 5. Assert the new node exists in the document
  //
  // Until a seeded test user/project is available in the test
  // environment, this test stays `.skip`. Wiring that up is part
  // of the test-harness work that needs to happen before the
  // editor can be safely refactored.
});
```

The `.skip` is intentional — the test cannot run until there is
a deterministic test fixture (a seeded user with a seeded
project). That fixture is its own piece of work.

---

## CI

Once `npm test` works locally, add to GitHub Actions:

```yaml
# .github/workflows/test.yml
name: test
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: backend/package-lock.json }
      - run: cd backend && npm ci && npm test
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: frontend/package-lock.json }
      - run: cd frontend && npm ci && npx playwright install --with-deps chromium && npm run test:e2e
```

---

## Why this order

The five remaining big refactors (split webRenderer, split
editorShell, merge productAdd/Edit modals, build backend service
layer, /features/ folder reorg) all share the same problem:
**they're invasive enough that no human can verify them by
clicking around**, and there are no tests to do it for them.

A 30-line happy-path test for a controller catches 80% of
regressions and takes 15 minutes to write. A Playwright editor
smoke test catches "drag still works" and takes longer to set up
but pays for itself the first time someone changes the drag
handler.

**The order to do it:**

1. Backend: one happy-path test per controller (~12 tests, half a day)
2. Frontend: one Playwright smoke test per top-level page (~8 tests, one day)
3. Then start the big refactors with a real safety net.

Without step 1+2, every big refactor is gambling.
