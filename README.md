# Event App

**Multi-tenant live audience engagement platform for any event.**

---

## What It Does

Attendees scan a QR code at the venue, enter their name, and instantly get a premium mobile experience — live reactions, trivia, shoutouts, program schedule, photo sharing, and a donation pledge system — all synchronized in real time. An admin/emcee panel backstage controls the entire experience.

Before the event, share the RSVP link so guests can confirm attendance. On event day, switch to live mode and attendees join the full experience.

Anyone can create an event and share a join code with their audience.

### Three Interfaces

- **📱 Attendee App** — Mobile-first experience with live reactions, trivia, shoutouts, photos, pledges, and program schedule
- **🎛️ Admin Panel** — Backstage control for emcee and volunteers: manage programs, push trivia, moderate shoutouts, control big screen
- **📺 Big Screen** — Projector view for the venue display: reaction streams, leaderboards, photo wall, pledge meter

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Firebase Firestore |
| Auth | Firebase Anonymous Auth |
| Storage | Firebase Storage |
| Hosting | Vercel |

## Features

- 📩 **RSVP** — Pre-event RSVP page with event flyer, Going/Maybe/Can't Make It, guest count, and edit-on-return
- 🎉 **Live Reactions** — Floating emoji animations synced across all phones
- 🧠 **Live Trivia** — Timed questions with leaderboard, pushed by emcee
- 💬 **Shoutouts** — Audience messages with upvotes, moderated by admin
- 📸 **Photo Wall** — Shared photo grid displayed on venue screen
- 💚 **Pledge System** — Donation pledge tracker with live progress meter
- 📋 **Program Schedule** — Real-time agenda with "Now Playing" indicator
- 📢 **Announcements** — Push banners to all attendee phones
- 🔲 **QR Code** — Auto-generated for venue entry

### Event Phases

Events have three admin-controlled phases:

| Phase | What visitors see | Use when |
|-------|------------------|----------|
| **RSVP** | Event flyer + RSVP form | Weeks before the event |
| **Live** | Join flow → full app experience | Day of the event |
| **Ended** | "Event has ended" thank you page | After the event |

---

## Setup Guide

Follow these steps to deploy your own instance of Event App.

### Quick Setup (Recommended)

An interactive setup script automates Firebase project creation, config generation, and rules deployment:

```bash
git clone https://github.com/vtsseattle/event-app.git
cd event-app
npm install -g firebase-tools   # if not already installed
firebase login                  # authenticate with Google
npm install
node scripts/setup.mjs
```

The script will:
- Create or select a Firebase project
- Set up Firestore and prompt you to enable Anonymous Auth
- Create a web app and extract the SDK config automatically
- Optionally read your service account JSON to get admin credentials
- Write `.env.local` with all the right values
- Deploy Firestore and Storage security rules

After it finishes, just run `npm run dev` and open [http://localhost:3000](http://localhost:3000).

### Manual Setup

<details>
<summary>Click to expand full manual steps</summary>

#### 1. Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Firebase](https://console.firebase.google.com/) account (free Spark plan works)
- A [Vercel](https://vercel.com/) account (free tier works) — or any Node.js host
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`

#### 2. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project**
2. Name it whatever you like (e.g. `my-event-app`)
3. Enable **Google Analytics** if you want (optional)

#### 3. Enable Firebase Services

In your Firebase project:

1. **Authentication** → Sign-in method → Enable **Anonymous**
2. **Firestore Database** → Create database → Start in **production mode** → Pick a region
3. **Storage** → Get started → Start in **production mode**

#### 4. Get Firebase Config

1. In Firebase Console → Project Settings → **General** → Your apps → **Add app** → Web
2. Register the app (any nickname is fine)
3. Copy the config values — you'll need them for `.env.local`

#### 5. Get a Service Account Key (for admin API)

1. Firebase Console → Project Settings → **Service accounts**
2. Click **Generate new private key** → Download the JSON
3. From that JSON, you need `client_email` and `private_key`

#### 6. Clone & Install

```bash
git clone https://github.com/vtsseattle/event-app.git
cd event-app
npm install
```

#### 7. Configure Environment Variables

Create `.env.local` in the project root:

```env
# Firebase client SDK (from step 4)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin SDK (from step 5 — needed for admin password verification)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
```

> **Note:** Wrap `FIREBASE_PRIVATE_KEY` in double quotes and keep the `\n` line breaks as-is.

#### 8. Deploy Firestore & Storage Rules

```bash
firebase login
firebase use --add   # select your project, alias it as "default"
firebase deploy --only firestore:rules
firebase deploy --only storage
```

This deploys the security rules from `firestore.rules` and `storage.rules`.

#### 9. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the landing page with **Join Event** / **Create Event** tabs.

</details>

### Deploy to Vercel

1. Push your repo to GitHub (or fork this one)
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo
3. Add all the environment variables from `.env.local` to Vercel's **Environment Variables** settings
4. Deploy — Vercel auto-detects Next.js

Your app will be live at `https://your-app.vercel.app`.

---

## How to Use

### Creating an Event

1. Go to your deployed app
2. Click **Create Event**
3. Fill in: **Event ID** (URL slug, e.g. `spring-gala-2026`), **Event Name**, optional **Tagline**, and an **Admin Password**
4. Choose which features to enable for your event:
   - **Agenda** (always on) — Program schedule with "Now Playing"
   - **RSVPs** — Pre-event RSVP page with flyer and guest tracking
   - **Shoutouts** — Audience messages with upvotes
   - **Reactions** — Live floating emoji animations
   - **Photos** — Shared photo wall
   - **Trivia** — Timed quiz questions with leaderboard
   - **Pledges** — Donation pledge tracker
5. If RSVP is enabled, the event starts in **RSVP phase** — visitors see the RSVP page first
6. You'll be taken to the admin dashboard

Only enabled features appear in attendee navigation, the event home page, and the admin dashboard.

### Sharing with Attendees

From the admin dashboard:
1. Go to **QR Code** — it generates a QR code linking to `yourapp.com/your-event-id/join`
2. Print it, project it, or share the link directly
3. Attendees scan → enter their name → they're in

### Running the Event

As the admin/emcee:
- **Event Phase** — Switch between RSVP / Live / Ended from the dashboard overview
- **RSVPs** — View RSVP list with Going/Maybe/Not Going counts, upload event flyer
- **Programs** — Add your agenda items, mark what's playing now
- **Now Playing** — Switch the active program in one tap
- **Trivia** — Push timed questions, see live answers, reveal results
- **Shoutouts** — Moderate audience messages
- **Photos** — Approve/reject submitted photos
- **Screen** — Control what appears on the big screen (reactions, trivia, photos, pledges, shoutouts)
- **Announcements** — Push banner messages to all attendees
- **QR Code** — Show join QR at the venue

### Big Screen

Open `yourapp.com/your-event-id/screen` on the venue projector. It auto-rotates between content modes controlled from the admin panel.

---

## Running Tests

```bash
npm test
```

## License

MIT
