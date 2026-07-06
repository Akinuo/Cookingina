# 🍳 CookingINA — Complete Setup Guide

**AI-powered Filipino Recipe Platform**
React + Vite · Firebase Auth + Firestore + Hosting · Cloudinary · Groq (Llama) · PWA · Android

---

## 🌟 Features

| Feature | Description | AI / Service |
|---|---|---|
| **Discover** | 40+ Filipino recipes + live MealDB API | TheMealDB API |
| **AI Recipe Guide** | Generate recipes from your ingredients | Llama 3.3 70B |
| **Cooking Assistant** | Chat with "Ina" for cooking help | Llama 3.1 8B |
| **Price Checker** | DTI/market-based Philippine grocery prices | Llama 3.1 8B |
| **My Cookbook** | Personal recipe CRUD with AI auto-fill | Llama 3.1 8B |
| **Favorites** | Save and organize recipes | — |
| **Community** | Social feed with posts, likes, comments | Cloudinary |
| **Meal Planner** | Budget meal plans with shopping list | Llama 3.3 70B |
| **Profile** | Edit profile + upload photo | Cloudinary |
| **PWA** | Installable, offline-capable web app | — |
| **Android** | Native APK/AAB via CapacitorJS | — |

---

## 🚀 Quick Start (3 steps)

```bash
# 1. Install
npm install

# 2. Set up credentials
cp .env.example .env
# Open .env and fill in all values (see sections below)

# 3. Run
npm run dev
# → http://localhost:5173
```

---

## 📋 All Environment Variables

Open `.env` and fill in every variable:

```env
# AI Proxy — Cloudflare Worker URL, NOT a raw Groq key (see worker/README.md)
VITE_GROQ_PROXY_URL=https://cookingina-groq-proxy.your-subdomain.workers.dev

# Firebase (Auth + Database + Hosting)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123...

# Cloudinary (Image uploads)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=cookingina_unsigned
```

---

## ☁️ Cloudinary Setup (Image Uploads)

Cloudinary handles all photo uploads — profile photos, recipe images, community posts.
**Free tier:** 25GB storage + 25GB bandwidth/month. No credit card needed.

### Step 1 — Create a Cloudinary account
1. Go to **[https://cloudinary.com](https://cloudinary.com)**
2. Click **Sign Up for Free**
3. Fill in your details — choose **Programmable Media** as the product
4. Verify your email

### Step 2 — Get your Cloud Name
1. After logging in, you land on the **Dashboard**
2. Look for the box that says **"Cloud name"** — it looks like `dxxxxxxxx`
3. Copy it into your `.env`:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=dxxxxxxxx
   ```

   > ⚠️ Your Cloud Name is visible on the Dashboard homepage top-left.
   > It's NOT your username or email.

### Step 3 — Create an Upload Preset
An **Upload Preset** is what allows your React app to upload images directly without a backend.

1. In the Cloudinary Dashboard, click **Settings** (gear icon, top-right)
2. Click the **Upload** tab in the left sidebar
3. Scroll down to **"Upload presets"**
4. Click **"Add upload preset"**
5. Configure it:

   | Setting | Value |
   |---|---|
   | **Preset name** | `cookingina_unsigned` |
   | **Signing Mode** | `Unsigned` ← **IMPORTANT** |
   | **Folder** | `cookingina` |
   | **Allowed formats** | `jpg, jpeg, png, webp, gif` |
   | **Max file size** | `10485760` (10MB) |

6. Click **Save**
7. Copy the preset name into your `.env`:
   ```
   VITE_CLOUDINARY_UPLOAD_PRESET=cookingina_unsigned
   ```

   > ⚠️ **Signing Mode MUST be "Unsigned"** or uploads will fail with 401 errors.
   > Unsigned means the app can upload without a secret key — safe for frontend use.

### Step 4 — (Optional) Configure image transformations
In the preset settings you can also set:
- **Incoming Transformation** → `c_limit,w_1200,q_auto,f_auto`
  This auto-compresses all uploaded images to save storage.

### Step 5 — Verify it works
After filling in `.env`, run `npm run dev` and go to your Profile page.
Try uploading a photo. If you see your photo update, Cloudinary is working! ✅

### Where images are stored in Cloudinary
```
cookingina/
├── avatars/     ← Profile photos (300×300, face-cropped)
├── recipes/     ← Recipe images (800×600)
└── posts/       ← Community post images (1200px wide)
```

### Cloudinary Free Tier Limits
| Limit | Amount |
|---|---|
| Storage | 25 GB |
| Bandwidth | 25 GB / month |
| Transformations | 25,000 / month |
| Images | Unlimited (within storage) |

25GB is enough for **~50,000 profile photos** or **~12,000 recipe images**.

---

## 🤖 Groq API Setup (AI Features)

⚠️ **The Groq key does NOT go in `.env` directly.** If it did, it would ship
inside the JS bundle and anyone could steal it from devtools. Instead it's
set as a secret on a small Cloudflare Worker that proxies the requests —
free, no credit card, ~5 minutes to set up. Full walkthrough: `worker/README.md`.

### Step 1 — Create account
1. Go to **[https://console.groq.com](https://console.groq.com)**
2. Sign up with Google or email
3. Verify your email

### Step 2 — Create API Key
1. In the console, click **"API Keys"** in the left sidebar
2. Click **"Create API Key"**
3. Name it `cookingina`
4. Copy the key — **you only see it once!**

### Step 3 — Deploy the proxy and give it the key
Follow `worker/README.md`. Short version:
```
npm install -g wrangler
cd worker
wrangler login
wrangler secret put GROQ_API_KEY    # paste your gsk_... key here
wrangler deploy                      # prints your proxy URL
```

### Step 4 — Point the app at the proxy
Paste the printed URL into `.env`:
```
VITE_GROQ_PROXY_URL=https://cookingina-groq-proxy.your-subdomain.workers.dev
```

### AI Models Used
| Model | Used For | Speed |
|---|---|---|
| `llama-3.3-70b-versatile` | Recipe generation, Meal Planner | ~8s |
| `llama-3.1-8b-instant` | Cooking Assistant, Price Checker | ~1s |
| `llama-guard-3-8b` | Content moderation | ~0.5s |

### Groq Free Tier Limits
| Model | Requests/min | Tokens/min | Tokens/day |
|---|---|---|---|
| llama-3.3-70b | 30 | 6,000 | 1,000,000 |
| llama-3.1-8b | 30 | 20,000 | 1,000,000 |

This is generous — more than enough for personal use.

---

## 🔥 Firebase Setup (Auth + Database + Hosting)

Firebase is used ONLY for:
- ✅ **Authentication** — Google Sign-In
- ✅ **Firestore** — storing user profiles, cookbooks, community posts
- ✅ **Hosting** — deploying the web app

> 📝 We do NOT use Firebase Storage — Cloudinary handles all image uploads.

### Step 1 — Create Firebase Project
1. Go to **[https://console.firebase.google.com](https://console.firebase.google.com)**
2. Click **"Add project"**
3. Name it `cookingina` (or anything you like)
4. Disable Google Analytics (not needed)
5. Click **"Create project"**

### Step 2 — Enable Google Authentication
1. In your project, click **Build → Authentication**
2. Click **"Get started"**
3. Click **"Sign-in method"** tab
4. Click **Google** → Toggle **Enable** → click **Save**
5. Click **"Settings"** tab → **"Authorized domains"**
6. Add `localhost` (already there) and your Firebase Hosting domain later

### Step 3 — Create Firestore Database
1. Click **Build → Firestore Database**
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose region:
   - Philippines users → `asia-southeast1` (Singapore)
5. Click **"Enable"**

### Step 4 — Deploy Security Rules
In your project terminal:
```bash
firebase login           # Log in to Firebase CLI
firebase init firestore  # Select your project, accept defaults
firebase deploy --only firestore:rules,firestore:indexes
```

Or paste these rules manually in Firebase Console → Firestore → Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /cookbooks/{docId} {
      allow read:   if request.auth != null && resource.data.uid == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.uid == request.auth.uid;
    }
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow update: if request.auth != null;
      allow delete: if request.auth != null && resource.data.uid == request.auth.uid;
    }
    match /posts/{postId}/comments/{commentId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow delete: if request.auth != null && resource.data.uid == request.auth.uid;
    }
  }
}
```

### Step 5 — Create Composite Indexes
Run:
```bash
firebase deploy --only firestore:indexes
```

Or create manually in Firestore → Indexes → Add Index:
| Collection | Field 1 | Field 2 | Query Scope |
|---|---|---|---|
| `cookbooks` | `uid` ASC | `createdAt` DESC | Collection |
| `posts` | `createdAt` DESC | — | Collection |

> 💡 When you first open My Cookbook, you may see an error with a link.
> Click that link to auto-create the index. Wait ~2 minutes for it to build.

### Step 6 — Get Web App Credentials
1. In Firebase Console → **Project Settings** (gear icon)
2. Scroll to **"Your apps"** → Click **"Add app"** → Choose **Web** (`</>`)
3. Register with nickname `CookingINA Web`
4. Copy the `firebaseConfig` object values into your `.env`:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=cookingina-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cookingina-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=cookingina-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

---

## 🌐 Deploy to Firebase Hosting

```bash
# Install Firebase CLI (once)
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting (once)
firebase init hosting
# → ? What do you want to use as your public directory? dist
# → ? Configure as a single-page app? Yes
# → ? Set up automatic builds with GitHub? No

# Build + Deploy
npm run build
firebase deploy
```

Your live app URL: `https://YOUR-PROJECT-ID.web.app`

**Add your live domain to Firebase Auth:**
1. Firebase Console → Authentication → Settings → Authorized domains
2. Click **"Add domain"** → paste `YOUR-PROJECT-ID.web.app`
3. Save

**Shortcut:**
```bash
npm run firebase:deploy   # runs build + deploy in one command
```

---

## 📱 Android Build (CapacitorJS)

### Prerequisites
- Android Studio (download at [developer.android.com/studio](https://developer.android.com/studio))
- Java JDK 17+ (`java -version` to check)
- Android SDK (installed automatically with Android Studio)

### First-time Setup
```bash
# 1. Build the web app
npm run build

# 2. Add Android platform
npx cap add android

# 3. Sync
npx cap sync android

# 4. Open in Android Studio
npx cap open android
```

In Android Studio:
- Wait for Gradle sync to complete (~2-3 minutes first time)
- Click **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Update after code changes
```bash
npm run android:build    # Build + sync → generates debug APK
npm run android:release  # Build + sync → generates release AAB for Play Store
```

### Install on your phone
```bash
# Make sure USB debugging is enabled on your Android phone
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📦 Project Structure

```
cookingina2/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── Sidebar.jsx         Desktop sidebar + mobile nav + topbar
│   │   ├── recipe/
│   │   │   ├── RecipeCard.jsx      Recipe grid card (image/emoji + like/save)
│   │   │   └── RecipeDetail.jsx    Full recipe modal with tabs
│   │   └── ui/
│   │       └── ToastContainer.jsx  Toast notifications
│   ├── data/
│   │   └── recipes.js              40+ Filipino recipes database
│   ├── hooks/
│   │   ├── useAuth.jsx             Firebase Auth context + Google sign-in
│   │   └── useToast.js             Toast notification hook
│   ├── pages/
│   │   ├── AuthPage.jsx            Google sign-in screen
│   │   ├── HomePage.jsx            Discover — recipes + MealDB Filipino API
│   │   ├── AIRecipePage.jsx        AI recipe generator (Llama 3.3 70B)
│   │   ├── AIAssistPage.jsx        "Ina" cooking chatbot (Llama 3.1 8B)
│   │   ├── PriceCheckerPage.jsx    Philippine grocery price checker
│   │   ├── CookbookPage.jsx        Personal cookbook CRUD + AI fill
│   │   ├── CommunityPage.jsx       Social feed (Firestore real-time)
│   │   ├── ProfilePage.jsx         Profile editor + Cloudinary photo upload
│   │   └── OtherPages.jsx          Favorites + Budget Meal Planner
│   ├── services/
│   │   ├── firebase.js             Firebase init (Auth + Firestore only)
│   │   ├── cloudinary.js           Image upload service (avatar/recipe/post)
│   │   ├── ai.js                   Groq API (all Llama models)
│   │   └── mealdb.js               TheMealDB Filipino recipe API
│   ├── styles/
│   │   └── global.css              Full design system (clay+cream+leaf)
│   └── App.jsx                     Root shell with auth guard
├── public/
│   └── icons/                      PWA icons (SVG)
├── firestore.rules                 Firestore security rules
├── firestore.indexes.json          Composite indexes
├── firebase.json                   Firebase Hosting config
├── capacitor.config.ts             Android build config
├── vite.config.js                  Vite + PWA plugin
├── .env.example                    Template for environment variables
└── SETUP.md                        This file
```

---

## 🎨 Design System

| Token | Value | Use |
|---|---|---|
| `--clay` | `#C4622D` | Primary brand, buttons, accents |
| `--clay-lt` | `#E8845A` | Hover states, avatars |
| `--clay-dk` | `#9B4520` | Dark variant, gradients |
| `--leaf` | `#2D5A27` | Success, healthy badges |
| `--cream` | `#FDF8F2` | Page background |
| `--parch` | `#F5EDE0` | Card surfaces, inputs |
| `--border` | `#E2D5C3` | Borders, dividers |

**Fonts:**
- **Playfair Display** — headings, recipe titles, brand name
- **DM Sans** — all body text, UI labels

**Responsive:**
- **Desktop (>768px)** — Fixed 260px sidebar, full layout
- **Mobile (≤768px)** — Slide-in drawer + sticky topbar + bottom nav bar

---

## 🗄️ Firestore Collections Schema

```
users/{uid}
  displayName    string
  email          string
  photoURL       string   ← Cloudinary URL
  bio            string
  followers      number
  following      number
  recipesCount   number
  savedRecipes   string[]
  likedRecipes   string[]
  joinedAt       timestamp

cookbooks/{docId}
  uid            string
  title          string
  description    string
  category       string
  difficulty     Easy|Medium|Hard
  prep_time      number (minutes)
  cook_time      number (minutes)
  servings       number
  total_cost_php number
  ingredients    string (raw text)
  steps          string (raw text)
  notes          string
  image          string   ← Cloudinary URL (optional)
  createdAt      timestamp
  updatedAt      timestamp

posts/{postId}
  uid            string
  userName       string
  userHandle     string
  photoURL       string   ← Cloudinary URL
  text           string
  emoji          string
  recipe         string
  image          string   ← Cloudinary URL (optional)
  likes          number
  likedBy        string[]
  comments       number
  createdAt      timestamp

posts/{postId}/comments/{commentId}
  uid            string
  userName       string
  photoURL       string
  text           string
  createdAt      timestamp
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite 5 | Fast dev, code splitting |
| Styling | Custom CSS (no UI lib) | Full design control |
| Auth | Firebase Authentication | Google OAuth, free forever |
| Database | Firestore (NoSQL) | Real-time, offline sync |
| Image Storage | **Cloudinary** | 25GB free, auto-optimize |
| Hosting | Firebase Hosting | CDN, HTTPS, free |
| AI | Groq + Llama models | Fast inference, free tier |
| Recipe API | TheMealDB (Filipino) | Free, no key needed |
| PWA | vite-plugin-pwa + Workbox | Offline, installable |
| Android | CapacitorJS | APK/AAB from web code |
| Icons | Lucide React | MIT license |

---

## 🔒 Security Notes

| Concern | Status |
|---|---|
| `.env` committed to git | ❌ `.gitignore` already excludes it |
| Groq key exposed in browser | ⚠️ OK for dev/personal use. For production: proxy via Firebase Functions |
| Cloudinary unsigned preset | ✅ Safe — preset restricts folder, format, size |
| Firestore rules | ✅ Users can only read/write their own data |
| Firebase Storage | ✅ Not used — Cloudinary handles all uploads |

---

## 📞 Commands Reference

```bash
# Development
npm run dev                 # Start dev server → http://localhost:5173
npm run build               # Production build → dist/
npm run preview             # Preview production build locally

# Firebase
firebase login              # Authenticate with Firebase CLI
firebase deploy             # Deploy hosting + rules + indexes
npm run firebase:deploy     # npm run build + firebase deploy (shortcut)

# Android
npm run cap:sync            # Build + sync to Capacitor
npm run android:build       # Build debug APK
npm run android:release     # Build release AAB (for Play Store)
npx cap open android        # Open Android Studio
```

---

## ❓ Troubleshooting

### "Cloudinary upload fails with 401"
→ Your upload preset is set to **Signed** instead of **Unsigned**.
→ Fix: Cloudinary Console → Settings → Upload → Upload Presets → Edit → Set **Signing Mode = Unsigned**

### "Cloudinary upload fails with 400"
→ Wrong `VITE_CLOUDINARY_CLOUD_NAME` or `VITE_CLOUDINARY_UPLOAD_PRESET` in `.env`
→ Double-check both values in Cloudinary Dashboard

### "Google Sign-In popup closes immediately"
→ `localhost` is not in Firebase Authorized Domains
→ Fix: Firebase Console → Authentication → Settings → Authorized Domains → Add `localhost`

### "Cookbook fails to load with index error"
→ Firestore composite index not created yet
→ Click the auto-generated link in the browser console error, wait 2 minutes

### "AI features say 'proxy URL not set'"
→ `VITE_GROQ_PROXY_URL` is missing from `.env`
→ Deploy the Worker first (`worker/README.md`), then paste its URL into `.env`

### "AI features say 'Origin not allowed'"
→ Your site's URL isn't in the Worker's `ALLOWED_ORIGINS` (in `worker/wrangler.toml`)
→ Add it, then run `wrangler deploy` again from the `worker/` folder

### "MealDB recipes not loading"
→ TheMealDB free API is rate-limited
→ Wait 30 seconds and refresh. Or check [status.themealdb.com](https://www.themealdb.com)

### Build error: "Missing export"
→ Run `npm install` to ensure all packages are installed
→ Check that node_modules/ exists

---

*Last updated: CookingINA v8 · Firebase Auth + Firestore + Cloudinary + Groq + MealDB*
