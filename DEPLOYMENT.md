# 🚀 EduMethod AI - Deployment Guide

Complete step-by-step guide to deploy EduMethod AI to production on Vercel.

---

## ✅ Pre-Deployment Checklist

- [x] Production build passes: `npm run build` ✓
- [x] Error handling implemented (app/error.tsx) ✓
- [x] Rate limiting error handling added ✓
- [x] README.md documentation complete ✓
- [x] .env.local NOT in git history ✓
- [x] Local development tested ✓
- [x] Git repository initialized ✓
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] Live deployment tested

---

## Step 1: Create GitHub Repository

### Option A: Via GitHub Web Interface (Recommended)

1. Go to [github.com/new](https://github.com/new)
2. Fill in:
   - **Repository name**: `edumethod-ai`
   - **Description**: "AI-powered personalized learning platform"
   - **Public**: Select (so it's visible as a portfolio project)
   - **Initialize with**: None (we already have code)
3. Click "Create repository"
4. **Copy the repository URL** (you'll need it next)

### Option B: Via GitHub CLI

```bash
gh repo create edumethod-ai --public --remote=origin --source=. --remote-name=origin --push
```

---

## Step 2: Connect Local Git to GitHub

Replace `YOUR_USERNAME` with your GitHub username, and use the URL from Step 1:

```bash
cd /Users/rajendrabist/Desktop/EduMethod\ AI/edu-method-ai

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/edumethod-ai.git

# Verify remote was added
git remote -v

# Rename branch to main (if needed)
git branch -M main

# Push code to GitHub
git push -u origin main
```

**You should see:**

```
Enumerating objects: 50, done.
Counting objects: 100% (50/50), done.
...
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## Step 3: Set Up Vercel Deployment

### 3.1 Connect GitHub to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Continue with GitHub"** (login if needed)
4. Authorize Vercel to access your GitHub account
5. Search for **`edumethod-ai`** repository
6. Click **"Import"**

### 3.2 Configure Project Settings

On the Vercel import screen:

1. **Project name**: `edumethod-ai` (auto-filled)
2. **Framework preset**: `Next.js` (auto-detected)
3. **Root directory**: `./` (auto-detected)

Keep defaults, click **"Deploy"**

---

## Step 4: Add Environment Variables to Vercel

**After clicking Deploy**, Vercel will start building. While it builds, you need to add environment variables:

### 4.1 Go to Project Settings

1. In Vercel dashboard, click your `edumethod-ai` project
2. Click **"Settings"** (top menu)
3. Click **"Environment Variables"** (left sidebar)

### 4.2 Add All Variables

Copy these from your `.env.local` file and add them one by one:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_value
CLERK_SECRET_KEY=your_value
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_SUPABASE_URL=your_value
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
SUPABASE_SECRET_KEY=your_value
GROQ_API_KEY=your_value
GEMINI_API_KEY=your_value
```

**For each variable:**

1. Paste the name in **"Key"** field
2. Paste the value in **"Value"** field
3. Select environments: **"Production"**, **"Preview"**, **"Development"**
4. Click **"Save"**

---

## Step 5: Redeploy with Environment Variables

After adding environment variables:

1. Go to **"Deployments"** tab
2. Find the failed/incomplete deployment
3. Click **"..."** (three dots)
4. Click **"Redeploy"**

Vercel will rebuild with the environment variables. This should take 2-3 minutes.

---

## Step 6: Get Your Live URL

When deployment succeeds:

1. Click the **green checkmark** next to the deployment
2. Your live URL will be displayed (e.g., `https://edumethod-ai.vercel.app`)
3. Click the URL or **"Visit"** button to test

---

## Step 7: Test Live Deployment

### 7.1 Test Authentication

1. Open your live URL
2. Click **"Sign Up"** or **"Sign In"**
3. Create a test account
4. Verify you're logged in

### 7.2 Test Core Features

- [ ] Topic extraction works (upload syllabus text)
- [ ] 7-day plan generation works
- [ ] Quiz generation works
- [ ] Quiz submission & scoring works
- [ ] Doubt solver chat works (text-based at minimum)
- [ ] Error messages display (no blank screens)
- [ ] Mobile UI is responsive

### 7.3 Check Performance

- Open DevTools (F12)
- Go to **"Network"** tab
- Refresh page
- Look for HTTP 200 responses (no 5xx errors)
- Check API response times (should be < 5 seconds)

---

## Step 8: Configure Clerk Production

### 8.1 Get Production Keys

1. Go to [clerk.com/dashboard](https://clerk.com/dashboard)
2. Click your application
3. Go to **"API Keys"** (left sidebar)
4. Find **"Production"** section
5. Copy the keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### 8.2 Update Vercel Environment Variables

1. In Vercel dashboard → Your project → **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` with production value
3. Update `CLERK_SECRET_KEY` with production value
4. Click **"Save"**
5. **Redeploy** in Deployments tab

### 8.3 Configure Vercel Domain in Clerk

1. In Clerk dashboard, go to **"Domains"** (left sidebar)
2. Click **"Add domain"**
3. Enter your Vercel domain: `edumethod-ai.vercel.app`
4. Save

---

## Step 9: Set Up Custom Domain (Optional)

If you have a custom domain (e.g., `edumethod.ai`):

### In Vercel Dashboard

1. Project → **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain name
4. Follow Vercel's DNS configuration instructions

### In Clerk Dashboard

1. Go to **"Domains"**
2. Add your custom domain (same as Step 8.3)

---

## 🎉 Deployment Complete!

Your live URL is: **`https://edumethod-ai.vercel.app`**

### Next Steps

1. **Share with portfolio**: Add link to your GitHub profile README
2. **Monitor performance**: Check Vercel dashboard for errors/performance
3. **Collect feedback**: Share with friends/classmates for user testing
4. **Track usage**: Monitor API quotas (Groq & Gemini have rate limits)

---

## 📊 Deployment Checklist - Final

- [ ] GitHub repository created and public
- [ ] Code pushed to GitHub main branch
- [ ] Vercel project created
- [ ] Build succeeds on Vercel
- [ ] All environment variables set
- [ ] Authentication working on live
- [ ] All AI features working on live
- [ ] Clerk production keys configured
- [ ] Custom domain (optional) set up
- [ ] Live URL shared in portfolio

---

## 🔍 Troubleshooting

### Build Fails on Vercel

**Error**: "Cannot find module '@/components/...'"

**Solution**:

- Vercel might have different Node version
- Try setting `NODE_VERSION=18.17.0` in Environment Variables
- Redeploy

### Authentication Not Working

**Error**: "Error loading Clerk"

**Solution**:

- Verify Clerk keys in Environment Variables
- Make sure domain is added in Clerk dashboard
- Clear browser cache and try again

### API Returns 500 Error

**Error**: "AI service error" or "Database connection failed"

**Solution**:

- Check environment variables (especially API keys)
- Verify Supabase is online
- Check API quotas (Groq/Gemini might be rate-limited)
- Check Vercel logs: Click deployment → "Functions" tab

### Database Queries Fail

**Error**: "Learning path not found" or similar

**Solution**:

- Verify Supabase URL and keys are correct
- Make sure database tables exist (learning_paths, quizzes, doubt_sessions)
- Check Supabase database is not in read-only mode

---

## 📱 Testing on Mobile

1. Open live URL on phone/tablet
2. Test each page in portrait and landscape
3. Verify buttons are tappable (min 48px size)
4. Check text doesn't overflow
5. Verify images load properly

---

## 📊 Monitoring After Deployment

### Vercel Dashboard

- **Deployments**: See build status and logs
- **Functions**: Monitor API route performance
- **Analytics**: Track page load times
- **Error Tracking**: See runtime errors

### Supabase Dashboard

- **Database**: Monitor query performance
- **Auth**: Check user signups/logins
- **Storage**: Track file uploads (if applicable)

### Groq/Gemini Dashboards

- Check API usage vs. quotas
- Monitor costs
- Set up alerts for quota usage

---

## 🚀 Post-Deployment Improvements

### Phase 9 (Future)

- [ ] Analytics dashboard (track student progress)
- [ ] Export learning path as PDF
- [ ] Share learning paths with friends
- [ ] Email notifications for quiz results
- [ ] Mobile app (React Native)
- [ ] Offline support (PWA)

---

_Your AI-powered learning platform is now live! 🎓_
