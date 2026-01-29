# 🍽️ boo.x.eat - Complete Setup Guide

## Overview

boo.x.eat is a SaaS F&B vendor booking & POS platform with 3 tiers:
- **Starter (Free)**: Basic booking, menu management, analytics
- **Professional (RM99/mo)**: POS, advanced analytics, integrations
- **Enterprise (Premium)**: White-label, multi-location, API access

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- (Optional) Stripe account
- (Optional) Resend account for emails

### 1. Install Dependencies

```bash
cd boo.x.eat
npm install
```

### 2. Environment Setup

Create `.env` file (already created):

```env
VITE_SUPABASE_URL=https://dsbicjidumvvgqwaxzzm.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### 3. Database Setup

Run the SQL schema in Supabase Dashboard:

1. Go to https://supabase.com/dashboard
2. Select your project: `dsbicjidumvvgqwaxzzm`
3. Navigate to **SQL Editor**
4. Open `supabase/starter-schema.sql`
5. Copy and paste the entire content
6. Click **Run**

### 4. Storage Buckets

Create these storage buckets in Supabase Dashboard:

1. Go to **Storage** → **New Bucket**
2. Create these buckets:
   - `logos` (Public)
   - `menu-images` (Public)
   - `package-images` (Public)
   - `gallery` (Public)

### 5. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:5173

---

## 📁 Project Structure

```
boo.x.eat/
├── src/
│   ├── components/
│   │   ├── booking/
│   │   │   └── PaymentForm.tsx      # Stripe payment UI
│   │   ├── layout/
│   │   │   └── DashboardLayout.tsx  # Main dashboard layout
│   │   ├── sections/
│   │   │   └── *                    # Landing page sections
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       ├── GradientText.tsx
│   │       ├── ImageUpload.tsx      # Image upload component
│   │       └── index.ts
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx          # Authentication state
│   │
│   ├── lib/
│   │   ├── supabase.ts              # Supabase client
│   │   ├── database.ts              # Type-safe DB operations
│   │   ├── storage.ts               # Image upload utilities
│   │   ├── email.ts                 # Email templates & sending
│   │   ├── whatsapp.ts              # WhatsApp integration
│   │   └── stripe.ts                # Payment processing
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── dashboard/
│   │   │   ├── HomePage.tsx         # Dashboard home
│   │   │   ├── BookingsPage.tsx     # Booking management
│   │   │   ├── MenuPage.tsx         # Menu management
│   │   │   ├── PackagesPage.tsx     # Package deals
│   │   │   ├── TimeSlotsPage.tsx    # Time slot config
│   │   │   ├── BlockedDatesPage.tsx # Block dates
│   │   │   ├── AnalyticsPage.tsx    # Analytics dashboard
│   │   │   ├── SettingsPage.tsx     # Vendor settings
│   │   │   └── index.ts
│   │   ├── public/
│   │   │   └── BookingPage.tsx      # Customer booking page
│   │   └── LandingPage.tsx          # Marketing landing page
│   │
│   ├── types/
│   │   └── database.ts              # TypeScript types
│   │
│   ├── App.tsx                      # Main app with routes
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Tailwind + custom styles
│
├── supabase/
│   ├── starter-schema.sql           # Database schema
│   └── functions/
│       ├── send-email/
│       │   └── index.ts             # Email edge function
│       └── create-payment-intent/
│           └── index.ts             # Stripe edge function
│
├── .env                             # Environment variables
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## 🔐 Authentication

### Supabase Auth Setup

1. Go to Supabase Dashboard → **Authentication**
2. Enable **Email** provider
3. Configure email templates (optional)
4. Enable **Social Auth** providers if needed (Google, Facebook)

### Routes

| Route | Description |
|-------|-------------|
| `/login` | User login |
| `/register` | New vendor registration |
| `/dashboard` | Protected dashboard |
| `/:vendorSlug` | Public booking page |

---

## 🗄️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `vendors` | Vendor profiles & settings |
| `menu_categories` | Menu organization |
| `menu_items` | Individual menu items |
| `packages` | Package deals & set menus |
| `time_slots` | Available booking times |
| `blocked_dates` | Holidays & closures |
| `bookings` | Customer bookings |
| `booking_notifications` | Notification logs |
| `analytics_events` | Analytics tracking |

### Row Level Security (RLS)

All tables have RLS policies:
- Vendors can only access their own data
- Public can view active vendor info for booking

---

## 🖼️ Image Upload

### Usage

```tsx
import { ImageUpload } from '@/components/ui';
import { BUCKETS } from '@/lib/storage';

<ImageUpload
  bucket={BUCKETS.MENU_IMAGES}
  vendorId={vendor.id}
  currentUrl={item.image_url}
  onUpload={(url) => setImageUrl(url)}
  onRemove={() => setImageUrl(null)}
  aspectRatio="16:9"
/>
```

### Features
- Drag & drop support
- Auto compression
- Preview before upload
- Multiple file upload (gallery)
- File validation (type, size)

---

## 📧 Email Notifications

### Setup Resend

1. Create account at https://resend.com
2. Verify domain or use test domain
3. Get API key
4. Add to Supabase secrets:

```bash
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set FROM_EMAIL=noreply@yourdomain.com
```

### Deploy Edge Function

```bash
supabase functions deploy send-email
```

### Email Templates

| Template | Trigger |
|----------|---------|
| `booking_confirmation` | New booking created |
| `booking_reminder` | 24h before booking |
| `booking_cancelled` | Booking cancelled |
| `vendor_new_booking` | Vendor notification |

---

## 💬 WhatsApp Integration

### Click-to-Chat (Basic)

Works immediately - opens WhatsApp with pre-filled message:

```tsx
import { sendWhatsAppConfirmation } from '@/lib/whatsapp';

sendWhatsAppConfirmation({
  customerName: 'John',
  customerPhone: '+60123456789',
  vendorName: 'My Restaurant',
  // ... booking details
});
```

### WhatsApp Business API (Advanced)

For automated messages, setup WhatsApp Business API:

1. Create Meta Business account
2. Setup WhatsApp Business API
3. Create message templates
4. Add credentials to Supabase secrets

---

## 💳 Stripe Payments

### Setup

1. Create Stripe account
2. Get API keys from Dashboard
3. Add to environment:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

4. Add secret to Supabase:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
```

### Deploy Edge Function

```bash
supabase functions deploy create-payment-intent
```

### Features

- Deposit collection
- Stripe Connect for multi-vendor
- 3% platform fee
- Refund processing

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
# Deploy dist/ folder
```

### Environment Variables

Set in deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

---

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 📊 Dashboard Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/dashboard` | Overview & stats |
| Bookings | `/dashboard/bookings` | Manage bookings |
| Menu | `/dashboard/menu` | Menu items & categories |
| Packages | `/dashboard/packages` | Package deals |
| Time Slots | `/dashboard/time-slots` | Configure availability |
| Blocked Dates | `/dashboard/blocked-dates` | Block dates |
| Analytics | `/dashboard/analytics` | Business insights |
| Settings | `/dashboard/settings` | Vendor profile |

---

## 🎨 Theme Colors

```javascript
colors: {
  primary: {
    500: '#7c3aed', // Purple
    600: '#6d28d9',
  },
  accent: {
    500: '#14b8a6', // Teal
    600: '#0d9488',
  },
  dark: {
    900: '#1e1e1e',
    700: '#4a4a4a',
    500: '#6b6b6b',
    400: '#8c8c8c',
    100: '#f5f5f5',
  }
}
```

---

## 🆘 Troubleshooting

### "Supabase URL required"

Make sure `.env` file exists with valid Supabase credentials.

### TypeScript errors with Supabase

Use the type-safe helpers in `src/lib/database.ts` instead of direct Supabase calls.

### Images not uploading

1. Check storage bucket exists
2. Check bucket is public
3. Check file size (max 5MB)

### Emails not sending

1. Check Resend API key
2. Check FROM_EMAIL is verified
3. Check Edge Function logs in Supabase

---

## 📞 Support

For issues, create a GitHub issue or contact support.

---

Built with ❤️ using React, TypeScript, Supabase, and Tailwind CSS
