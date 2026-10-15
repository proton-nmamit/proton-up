# PROTON Association — Official Website & Platform CMS

Official web platform and content management system for **PROTON**, the student technical and cybersecurity association of the Department of Computer Science & Engineering (Cybersecurity) at NMAM Institute of Technology, Nitte.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom PROTON obsidian (`#000000`) & phosphor green (`#00d05a`) cyber theme
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database Engine**: [Neon PostgreSQL](https://neon.tech/) (Serverless PostgreSQL via `@neondatabase/serverless`)
- **Authentication & Sessions**: [Better Auth](https://www.better-auth.com/) + Neon Auth (HTTP-only secure session cookies, Argon2/scrypt/bcrypt multi-hash verification)
- **Transactional Email**: [Resend](https://resend.com/) (Member password reset dispatch and invitation links)
- **Asset Storage & CDN**: [Cloudinary](https://cloudinary.com/) (Namespace-isolated secure media delivery)
- **Image Processing & Sanitization**: [Sharp](https://sharp.pixelplumbing.com/) (Server-side binary magic-byte validation, EXIF stripping, decompression-bomb defense, WebP auto-conversion)
- **Language**: TypeScript 5+ (Strict mode)

---

## 🛡️ Architecture Overview

The platform is structured into three distinct zero-trust security and access layers:

```text
┌────────────────────────────────────────────────────────┐
│                   PUBLIC WEBSITE                       │
│  /  •  /about  •  /events  •  /gallery  •  /teams      │
│  (Zero-Trust: Exposes ONLY approved, public fields)    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                 MEMBER SELF-SERVICE                    │
│      /member/login  •  /member/dashboard               │
│  (Profile editing, avatar upload, status tracker)      │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                   ADMIN ROOT CMS                       │
│    /admin  •  /admin/members  •  /admin/designations   │
│    /admin/events  •  /admin/gallery  •  /admin/logs    │
│  (Role-gated: Hierarchical RBAC verified server-side)  │
└────────────────────────────────────────────────────────┘
```

---

## 🔑 Access Control & Administrative Hierarchy

| Role | Scope & Permissions |
|---|---|
| **Public Visitor** | Access to public landing, about, events, gallery, and teams directory. No credentials required. |
| **`member`** | Invitation-gated account. Can log in, edit personal profile, upload avatar, and check approval state (`pending`, `approved`, `rejected`). Cannot alter roles, approval status, or access administrative endpoints. |
| **`events_manager`** | Scoped administrator access restricted strictly to managing **Events** and **Gallery** assets. Blocked from members, invitations, designations, and logs. |
| **`vice_president`** | Executive administrator access restricted to **Member Approvals** and **Invitations**. Blocked from deleting members, publishing events, or viewing audit logs. |
| **`admin` / `core_executive`** | Full administrative authority across member management, event publishing, gallery archives, designation taxonomy, and invitation dispatches. |

---

## 🔄 Member Lifecycle Workflow

Public unrestricted registration is disabled to preserve club integrity and zero-trust boundaries:

```text
Admin creates single-use invitation link in /admin/invitations
                         ↓
Cryptographic token (SHA-256 hashed) stored with 7-day expiration
                         ↓
Member opens link: /member/register?token=<raw_token>
                         ↓
Server validates token (unexpired, unaccepted, unrevoked)
                         ↓
Member sets password and completes academic details
                         ↓
Neon Auth identity established + Profile created (status = 'pending', role = 'member')
                         ↓
Invitation marked as accepted (single-use enforced)
                         ↓
Member logs into /member/dashboard (status: PENDING REVIEW)
                         ↓
Admin reviews in /admin/members:
   ├── APPROVE ──► Profile status = 'approved' ──► Visible on /teams
   └── REJECT  ──► Profile status = 'rejected' + admin reason
                         ↓
   (Member fixes profile on dashboard and resubmits ──► status returns to 'pending')
```

---

## 🗄️ Database Schema & Storage Architecture

### Neon PostgreSQL Tables (`public` & `neon_auth`)
- `public.profiles`: Member profiles linked to `neon_auth.user(id)` via `user_id`. Includes private fields (`usn`, `phone`, `role`, `status`, `rejection_reason`).
- `public.designations`: Organizational posts and taxonomy with `display_order` hierarchy (e.g., President, Technical Head, Media Head).
- `public.invitations`: Cryptographic invitation registry storing `token_hash`, `email`, `expires_at`, `accepted_at`, and `revoked_at`.
- `public.events`: Technical workshops, competitions, talks, and CTFs with timeline states, poster URLs, and registration links.
- `public.gallery_albums`: Groupings for club event archives.
- `public.gallery_images`: Curated event photographs with captions, alt text, and Cloudinary URLs.
- `public.audit_logs`: Immutable security journal recording all administrative and authentication activities.
- `neon_auth.*`: User identity, credential accounts, sessions, and password-reset verification tokens.

### Cloudinary Asset Storage & Hardening
- **Namespace Isolation**: All uploads are strictly constrained to `proton/*` paths (`proton/members/avatars/`, `proton/events/posters/`, `proton/gallery/`). Deletions outside `proton/` are forbidden.
- **Server-Side Image Processing**: Every incoming buffer is decoded with **Sharp**, inspected for magic bytes (rejecting disguised PHP/HTML/SVG/JS/shell scripts), stripped of all EXIF/camera metadata, checked against decompression-bomb limits, and re-encoded to clean WebP.
- **Atomic Rollbacks**: If a Neon database insert/update fails following an upload, the uploaded Cloudinary asset is automatically purged to prevent orphaned files.

---

## 🔒 Security & Privacy Guarantees

1. **Strict Public Data Projections**: Public Teams queries explicitly project only approved public fields. Sensitive identifiers (`usn`, `phone`, `user_id`, `role`, `rejection_reason`, and auth emails) are **never** exposed.
2. **Server-Side Session Authorization**: Every administrative Server Action independently validates credentials via `requireAdminSession()`. Client-side roles are never trusted.
3. **Password Reset Security**: Self-service password recovery via Resend is restricted exclusively to members. Administrator password resets are disabled via self-service. Reset tokens are single-use, 32-byte cryptographic hashes that expire in 1 hour.
4. **Open Redirect Mitigation**: All authentication redirect parameters are validated for relative leading slashes and sanitized against protocol-relative (`//`) or backslash (`\`) bypasses.
5. **Private Credentials**: Database connection strings, auth secrets, Resend API keys, and Cloudinary secrets remain strictly server-side.

---

## 🛠️ Local Setup & Development

### 1. Prerequisites
- Node.js 20+
- npm or pnpm

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/proton-nmamit/PROTON.git
cd PROTON
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Neon PostgreSQL Connection
DATABASE_URL=postgres://<user>:<password>@<host>/<database>?sslmode=require

# Better Auth Configuration
BETTER_AUTH_SECRET=your-32-character-random-secret
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Resend Transactional Email
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL="PROTON CMS <onboarding@resend.dev>"

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:3000` in your browser.

### 5. Typecheck & Build
```bash
npm run typecheck
npm run build
```

---

## 🧪 Security & Verification Test Suites

To execute the comprehensive automated security matrices:

```bash
# Run the 24-vector security matrix
npx tsx scripts/test-comprehensive-security-matrix.mjs

# Run the image sanitization & WebP pipeline tests
npx tsx scripts/test-image-pipeline-security.mjs

# Run the adversarial RBAC and database audit
npx tsx scripts/run-adversarial-audit.mjs
```

---

## 📄 License
© 2024–2026 PROTON Association, Department of CSE (Cybersecurity), NMAMIT. All rights reserved.
