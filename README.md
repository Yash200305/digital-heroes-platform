# Digital Heroes - Charity Golf Platform

A modern, full-stack web application designed to drive charitable impact through sports. This platform combines a subscription engine, golf performance tracking, and a dynamic monthly prize draw.

Built as a submission for the Digital Heroes Full-Stack Developer challenge.

## 🚀 Live Demo & Credentials
* **Live Site:** https://digital-heroes-platform.vercel.app/
* **Test User Account:** `123@gmail.com` / `123456` *(Has 5 scores & verified wins)*
* **Admin Access:** Navigate to `/admin` to view the master dashboard.

## 🛠️ Tech Stack
* **Frontend:** React, Vite, Tailwind CSS, React Router DOM
* **Backend & Auth:** Supabase (PostgreSQL)
* **Hosting:** Vercel

## ✅ PRD Compliance & Features

### 1. Subscription Engine & Gateway (Section 04)
* Integrated role-based access. Only active subscribers can enter scores.
* Created a seamless UI toggle for Monthly vs. Yearly plans.
* *Note: Stripe payment integration is visually mocked in the Auth flow for prototype purposes.*

### 2. Rolling Score Management (Section 05)
* Built a custom Stableford score entry form with strict `1-45` range validation.
* Implemented the **"Rolling 5" constraint**: The system dynamically retains only the 5 most recent scores, automatically deleting older entries upon new submissions.
* Database-level unique constraints prevent duplicate score dates.

### 3. Charity Integration (Section 08)
* Integrated the charity directory directly into the Auth/Signup flow.
* Enforced the mandatory minimum 10% contribution rule via a constrained UI slider.

### 4. Dynamic Draw Simulator (Sections 06 & 07)
* Developed an Admin simulator that automatically filters the database for eligible users (exactly 5 scores).
* **Auto-Calculating Prize Pool:** The draw engine dynamically calculates the Match-5 prize (40%) based on the live count of *active* subscribers, abandoning hardcoded values for real business logic.

### 5. Winner Verification Flow (Sections 09, 10, 11)
* **User Dashboard:** Winners receive a high-impact, conditional "Winner's Circle" notification allowing them to upload proof of their scores.
* **Admin Verification Queue:** Admins can review pending wins and instantly update the database state from `PENDING` to `PAID`.
* **Admin Analytics:** Live calculations of Total Users, All-Time Prize Pool, and Monthly Charity Generated.

### 6. UI/UX Design (Section 12)
* Strictly adhered to the PRD's anti-golf-cliché rule. Delivered a clean, high-contrast, modern aesthetic with subtle glassmorphism, aggressive typography, and motion-enhanced interfaces.

## 🗄️ Database Schema
* `users`: Tied to Supabase Auth.
* `subscriptions`: Tracks plan type, active status, and charity allocation percentages.
* `charities`: Directory of available charities.
* `scores`: Relational table tracking user Stableford entries (constrained to 5 per user).
* `winnings`: Records draw results, dynamic prize amounts, and payment states.
