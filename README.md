# 🎯 JobTrackr

A modern, fast, and secure job application tracker built with React, Vite, and Supabase. Keep your job search organized, track your application statuses, and never lose track of a potential opportunity.

![JobTrackr Demo](https://via.placeholder.com/800x400.png?text=JobTrackr+Screenshot)

## ✨ Features

- **☁️ Cloud Synced**: Data is instantly saved to Supabase (PostgreSQL) and accessible from anywhere.
- **⚡ Fast Performance**: Powered by Vite and React for lightning-fast load times.
- **🎨 Modern UI**: Clean, dark-mode design with beautiful status indicators.
- **🔍 Search & Filter**: Easily find applications by company, role, or resume name. Filter by application status.
- **📊 Key Stats**: Quick overview of your total applications, active processes, interviews, and offers.

## 🛠️ Tech Stack

- **Frontend**: React (v19)
- **Build Tool**: Vite
- **Database / Backend**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Hosting**: Vercel
- **Styling**: Vanilla CSS (Inline styles with a custom design system)

## 🚀 Getting Started

Follow these steps to run the app locally on your machine.

### 1. Clone the repository

```bash
git clone https://github.com/piyushga/job-tracker-app.git
cd job-tracker-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Database Setup (Supabase)

This app uses Supabase for the database. You need your own Supabase project to run it.

1. Create a free account at [supabase.com](https://supabase.com/).
2. Create a new project.
3. Go to the **SQL Editor** in your Supabase dashboard and run the following query to create the table and set up security:

```sql
-- Create the job applications table
CREATE TABLE job_applications (
  id          TEXT PRIMARY KEY,
  company     TEXT NOT NULL,
  role        TEXT NOT NULL,
  job_link    TEXT,
  resume_used TEXT,
  status      TEXT DEFAULT 'Applied',
  applied_date DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone with the anon key to read/write their own data
CREATE POLICY "Allow all operations for anon users"
  ON job_applications
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 4. Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and add your Supabase credentials (found in **Project Settings -> API**).

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run the Development Server

```bash
npm run dev
```

The app will be running at `http://localhost:5173`.

## 🌐 Deployment (Vercel)

This project is configured for easy deployment on Vercel.

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel login`
3. Link your project: `vercel`
4. Add your environment variables to Vercel:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```
5. Deploy to production:
   ```bash
   vercel --prod
   ```

## 🔒 Security Note

Ensure you never commit `.env.local` to version control. The repository already includes an `.env.example` file and ignores `.local` files via `.gitignore`.
