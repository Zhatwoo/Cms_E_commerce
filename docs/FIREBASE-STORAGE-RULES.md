# Fix Firebase Storage "storage/unauthorized" Error

If you see:
`Firebase Storage: User does not have permission to access 'Clients/...' (storage/unauthorized)`

do this:

## 1. Open Storage Rules in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project **cms-e-commerce-75653**
3. In the left sidebar click **Storage**
4. Open the **Rules** tab

## 2. Replace the rules

Replace **everything** in the editor with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 3. Publish

Click **Publish**. Wait until it says the rules are published.

## 4. Use the app again

- Make sure you are **logged in** in your app (dashboard/login).
- Open a project in the design editor and try uploading an image again.

---

**Why this works:** Your app signs you in to Firebase (via email/password or custom token from the backend). These rules allow any signed-in user to read and write in Storage. Uploads will go to `Clients/{clientName}/{websiteName}/...` as configured in your app.
