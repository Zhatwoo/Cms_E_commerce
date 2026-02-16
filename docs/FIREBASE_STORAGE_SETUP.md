# Firebase Storage setup for Web Builder uploads

When a client uploads images, videos, or other files in the web builder, files go to **Firebase Storage**. Each **new project (scratch)** automatically gets its own folder — you don’t create folders manually. This guide explains what to configure in Firebase and how it works.

---

## What to configure in Firebase (step-by-step)

Follow these steps so the web builder can upload files and show **real-time upload progress**.

### Step 1: Open Firebase Console

1. Go to **[Firebase Console](https://console.firebase.google.com/)**.
2. Select your project (e.g. **cms-e-commerce-75653**).

### Step 2: Enable Storage

1. In the left menu, click **Build** → **Storage**.
2. If you see **Get started**, click it.
3. Choose **Start in production mode** (we’ll add rules in the next step).
4. Select a **location** (e.g. same region as your app) and click **Done**.
5. Wait until Storage is ready. You’ll see an empty **Files** tab.

Your bucket name will look like:

- `cms-e-commerce-75653.firebasestorage.app`  
  or  
- `cms-e-commerce-75653.appspot.com`

You’ll need this for the env variable (Step 5).

### Step 3: Set Security Rules

1. In **Storage**, open the **Rules** tab.
2. Replace the rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Web builder: clients/{clientName}/{projectName}/uploads/...
    match /clients/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    allow read, write: if false;
  }
}
```

3. Click **Publish**.

What this does:

- **Read**: Anyone can read (so image/video URLs work on your site).
- **Write**: Only **logged-in users** can upload under `clients/`.

### Step 4: (Optional) Note your bucket name

1. In **Storage** → **Files**, check the bucket name at the top (e.g. `cms-e-commerce-75653.firebasestorage.app`).
2. If your project uses the **default** bucket (`<projectId>.appspot.com`), you can skip the env variable in Step 5.

### Step 5: Environment variables (frontend)

1. Open **`.env.local`** in your **frontend** project root.
2. You need **Firebase app config** so the app can talk to Storage. At minimum:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=cms-e-commerce-75653.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=cms-e-commerce-75653
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=cms-e-commerce-75653.firebasestorage.app
```

Get these from **Firebase Console** → Project **Settings** (gear) → **General** → “Your apps” → Web app config. Use the **exact** bucket name (no `gs://`).

3. Restart the Next.js dev server after changing env.

### Step 5b: Backend (optional — for delete project cleanup)

When a project is **deleted**, the backend can remove its folder in Firebase Storage so you don't leave orphan files. For that, set in your **backend** `.env`:

```env
FIREBASE_STORAGE_BUCKET=cms-e-commerce-75653.firebasestorage.app
```

(Or the backend will fall back to `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` if set.) If the bucket is not set, project delete still works; only the Storage folder is not cleaned up.

---

## How folders work (automatic)

- Path used by the app:

  `clients/{clientName}/{projectName}/uploads/{images|videos|files}/{filename}`

- **clientName** = logged-in user’s name (or username). **projectName** = project title. Both are slugified for the path (e.g. spaces → dashes, safe characters only).
- When you upload an image in the web builder and save, the file goes to that path. Folders are created **automatically** on first upload (Storage has no “create folder” step).
- Example: client name “Juan Dela Cruz”, website title “My Store” → path `clients/juan-dela-cruz/my-store/uploads/images/...`.

Under **`clients`** you’ll see one folder per **client name**; under each client, **project folders** (by project title), then **`uploads`** → **`images`** (or `videos` / `files`). Click a client to see their projects.

---

## Deleting a project

When you **delete a project** (from the dashboard or API), the backend also deletes all files in Firebase Storage under that project's path: `clients/{client}/{project}/`. This keeps Storage in sync and avoids leftover folders. The backend needs `FIREBASE_STORAGE_BUCKET` (or `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`) set in its `.env` for this cleanup; if not set, the project is still deleted but the Storage folder is left as-is.

---

## Real-time upload progress

- The app uses **resumable uploads** and reports progress (0–100%) while the file is uploading.
- In the Image component settings you’ll see a **progress bar** and “X% uploaded” during upload.

---

## Summary checklist

- [ ] **Storage** enabled in Firebase Console (Build → Storage → Get started).
- [ ] **Rules** updated and **Published** (read: true for `uploads/...` under clients, write: authenticated only).
- [ ] **Bucket name** copied (and set in `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` in `.env.local` if not using default).
- [ ] **Restart** the Next.js dev server after changing env.
- [ ] **Test**: open a project in the web builder, add an Image, upload a file → progress bar appears, then file shows under **Storage → Files → clients/<clientName>/<projectName>/uploads/images/**.

If uploads fail, check:

- User is **logged in** (rules require `request.auth != null`). Your app login must use Firebase Auth (email/password → idToken) so Storage sees the user.
- **Env vars**: `NEXT_PUBLIC_FIREBASE_API_KEY` (and authDomain, projectId) must be set; otherwise the app won’t use Storage and images stay local only.
- Browser console (F12) for the exact error (e.g. “Permission denied” = rules or not logged in with Firebase).
- Storage **Rules** published and allowing `match /clients/{allPaths=**}` with `allow write: if request.auth != null`.
