import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { isDbConfigured } from '@/lib/db'
import { DbProfile, DbDesignation, DbEvent, DbGalleryImage, DbGalleryAlbum, DbInvitation } from '@/lib/types/database'
import { PROTON_TEAM, PROTON_EVENTS, GALLERY_ITEMS } from '@/lib/proton-data'

export interface LocalUser {
  id: string
  email: string
  passwordHash: string
  role: 'member' | 'admin' | 'super_admin'
  fullName: string
}

export interface LocalDatabaseSchema {
  users: LocalUser[]
  profiles: DbProfile[]
  designations: DbDesignation[]
  events: DbEvent[]
  gallery_images: DbGalleryImage[]
  gallery_albums: DbGalleryAlbum[]
  invitations: DbInvitation[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'local-store.json')

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function getInitialDesignations(): DbDesignation[] {
  return [
    { id: 'des-01', name: 'President', category: 'presidents', category_label: 'Executive Leadership', display_order: 1, is_core: true, is_active: true },
    { id: 'des-02', name: 'Vice President', category: 'presidents', category_label: 'Executive Leadership', display_order: 2, is_core: true, is_active: true },
    { id: 'des-03', name: 'Branch Captain', category: 'presidents', category_label: 'Executive Leadership', display_order: 3, is_core: true, is_active: true },
    { id: 'des-04', name: 'Technical Head', category: 'technical', category_label: 'Technical Division', display_order: 4, is_core: true, is_active: true },
    { id: 'des-05', name: 'Technical Co-ordinator', category: 'technical', category_label: 'Technical Division', display_order: 5, is_core: true, is_active: true },
    { id: 'des-06', name: 'Secretary', category: 'event_mgmt', category_label: 'Operations & Management', display_order: 6, is_core: true, is_active: true },
    { id: 'des-07', name: 'Joint Secretary', category: 'event_mgmt', category_label: 'Operations & Management', display_order: 7, is_core: true, is_active: true },
    { id: 'des-08', name: 'Treasurer', category: 'event_mgmt', category_label: 'Operations & Management', display_order: 8, is_core: true, is_active: true },
    { id: 'des-09', name: 'Joint Treasurer', category: 'event_mgmt', category_label: 'Operations & Management', display_order: 9, is_core: true, is_active: true },
    { id: 'des-10', name: 'Media Head', category: 'media', category_label: 'Media & Branding', display_order: 10, is_core: true, is_active: true },
    { id: 'des-11', name: 'Social Media Head', category: 'media', category_label: 'Media & Branding', display_order: 11, is_core: true, is_active: true },
    { id: 'des-12', name: 'Social Media Co-ordinator', category: 'media', category_label: 'Media & Branding', display_order: 12, is_core: true, is_active: true },
    { id: 'des-13', name: 'Media Co-ordinator', category: 'media', category_label: 'Media & Branding', display_order: 13, is_core: true, is_active: true },
    { id: 'des-14', name: 'Graphic Head', category: 'graphics', category_label: 'Design & Graphics', display_order: 14, is_core: true, is_active: true },
    { id: 'des-15', name: 'Graphic Co-ordinator', category: 'graphics', category_label: 'Design & Graphics', display_order: 15, is_core: true, is_active: true },
    { id: 'des-16', name: 'Event Management Co-ordinator', category: 'event_mgmt', category_label: 'Operations & Management', display_order: 16, is_core: true, is_active: true },
    { id: 'des-17', name: 'Cultural Co-ordinator', category: 'cultural_sports', category_label: 'Cultural & Athletics', display_order: 17, is_core: true, is_active: true },
    { id: 'des-18', name: 'Sports Co-ordinator', category: 'cultural_sports', category_label: 'Cultural & Athletics', display_order: 18, is_core: true, is_active: true },
    { id: 'des-19', name: 'Class Representative', category: 'class_rep', category_label: 'Student Council & CRs', display_order: 19, is_core: true, is_active: true },
    { id: 'des-20', name: 'Cybersecurity Researcher', category: 'technical', category_label: 'Technical Division', display_order: 20, is_core: false, is_active: true },
    { id: 'des-21', name: 'Cadet Member', category: 'technical', category_label: 'Technical Division', display_order: 100, is_core: false, is_active: true },
  ]
}

function getInitialStore(): LocalDatabaseSchema {
  const designations = getInitialDesignations()
  const desByName = new Map(designations.map((d) => [d.name.toLowerCase(), d]))

  const presDes = desByName.get('president') || designations[0]
  const viceDes = desByName.get('vice president') || designations[1]
  const captDes = desByName.get('branch captain') || designations[2]
  const techDes = desByName.get('technical head') || designations[3]

  const adminAccounts: Array<{ user: LocalUser; profile: DbProfile }> = [
    {
      user: {
        id: 'user-admin-president',
        email: 'president@proton',
        passwordHash: hashPassword('proton123'),
        role: 'admin',
        fullName: 'PROTON President',
      },
      profile: {
        id: 'profile-admin-president',
        user_id: 'user-admin-president',
        full_name: 'PROTON President',
        usn: '4NM21CS001',
        branch: 'CSE (Cybersecurity)',
        year: '4th Year',
        joining_year: '2024',
        designation_id: presDes.id,
        custom_role_text: 'President',
        department: 'Executive Leadership',
        avatar_url: '/images/hero-1.png',
        bio: 'Club President — Full executive and administrative authority.',
        phone: '+91 99000 11111',
        github_url: 'https://github.com/proton-nmamit',
        linkedin_url: 'https://linkedin.com/company/proton-nmamit',
        instagram_url: null,
        portfolio_url: null,
        status: 'approved',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        designations: presDes,
      },
    },
    {
      user: {
        id: 'user-admin-branchcaptain',
        email: 'branchcaptain@proton',
        passwordHash: hashPassword('proton123'),
        role: 'admin',
        fullName: 'PROTON Branch Captain',
      },
      profile: {
        id: 'profile-admin-branchcaptain',
        user_id: 'user-admin-branchcaptain',
        full_name: 'PROTON Branch Captain',
        usn: '4NM21CS002',
        branch: 'CSE (Cybersecurity)',
        year: '4th Year',
        joining_year: '2024',
        designation_id: captDes.id,
        custom_role_text: 'Branch Captain',
        department: 'Executive Leadership',
        avatar_url: '/images/hero-1.png',
        bio: 'Branch Captain — Full administrative operations & coordination.',
        phone: '+91 99000 22222',
        github_url: 'https://github.com/proton-nmamit',
        linkedin_url: 'https://linkedin.com/company/proton-nmamit',
        instagram_url: null,
        portfolio_url: null,
        status: 'approved',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        designations: captDes,
      },
    },
    {
      user: {
        id: 'user-admin-tech',
        email: 'tech@proton',
        passwordHash: hashPassword('proton123'),
        role: 'admin',
        fullName: 'PROTON Technical Head',
      },
      profile: {
        id: 'profile-admin-tech',
        user_id: 'user-admin-tech',
        full_name: 'PROTON Technical Head',
        usn: '4NM21CS003',
        branch: 'CSE (Cybersecurity)',
        year: '4th Year',
        joining_year: '2024',
        designation_id: techDes.id,
        custom_role_text: 'Technical Head',
        department: 'Technical Division',
        avatar_url: '/images/hero-1.png',
        bio: 'Technical Head — Systems architecture, CTF infrastructure & development.',
        phone: '+91 99000 33333',
        github_url: 'https://github.com/proton-nmamit',
        linkedin_url: 'https://linkedin.com/company/proton-nmamit',
        instagram_url: null,
        portfolio_url: null,
        status: 'approved',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        designations: techDes,
      },
    },
    {
      user: {
        id: 'user-admin-techteam',
        email: 'techteam@proton',
        passwordHash: hashPassword('proton123'),
        role: 'admin',
        fullName: 'PROTON Tech Team',
      },
      profile: {
        id: 'profile-admin-techteam',
        user_id: 'user-admin-techteam',
        full_name: 'PROTON Tech Team',
        usn: '4NM21CS005',
        branch: 'CSE (Cybersecurity)',
        year: '4th Year',
        joining_year: '2024',
        designation_id: techDes.id,
        custom_role_text: 'Tech Team',
        department: 'Technical Division',
        avatar_url: '/images/hero-1.png',
        bio: 'Tech Team — Systems administration, tooling & development.',
        phone: '+91 99000 55555',
        github_url: 'https://github.com/proton-nmamit',
        linkedin_url: 'https://linkedin.com/company/proton-nmamit',
        instagram_url: null,
        portfolio_url: null,
        status: 'approved',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        designations: techDes,
      },
    },
    {
      user: {
        id: 'user-admin-vicepresident',
        email: 'vicepresident@proton',
        passwordHash: hashPassword('proton123'),
        role: 'admin',
        fullName: 'PROTON Vice President',
      },
      profile: {
        id: 'profile-admin-vicepresident',
        user_id: 'user-admin-vicepresident',
        full_name: 'PROTON Vice President',
        usn: '4NM21CS004',
        branch: 'CSE (Cybersecurity)',
        year: '4th Year',
        joining_year: '2024',
        designation_id: viceDes.id,
        custom_role_text: 'Vice President',
        department: 'Executive Leadership',
        avatar_url: '/images/hero-1.png',
        bio: 'Vice President — Designated with member approval privileges.',
        phone: '+91 99000 44444',
        github_url: 'https://github.com/proton-nmamit',
        linkedin_url: 'https://linkedin.com/company/proton-nmamit',
        instagram_url: null,
        portfolio_url: null,
        status: 'approved',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        designations: viceDes,
      },
    },
    {
      user: {
        id: 'user-admin-events',
        email: 'events@proton',
        passwordHash: hashPassword('proton123'),
        role: 'admin',
        fullName: 'PROTON Events & Media Lead',
      },
      profile: {
        id: 'profile-admin-events',
        user_id: 'user-admin-events',
        full_name: 'PROTON Events & Media Lead',
        usn: '4NM21CS006',
        branch: 'Cybersecurity',
        year: '4th Year',
        joining_year: '2024',
        designation_id: desByName.get('event management co-ordinator')?.id || designations[15].id,
        custom_role_text: 'Events & Media Lead',
        department: 'Operations & Management',
        avatar_url: '/images/hero-1.png',
        bio: 'Events & Media Lead — Designated with events and gallery management privileges.',
        phone: '+91 99000 66666',
        github_url: 'https://github.com/proton-nmamit',
        linkedin_url: 'https://linkedin.com/company/proton-nmamit',
        instagram_url: null,
        portfolio_url: null,
        status: 'approved',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        designations: desByName.get('event management co-ordinator') || designations[15],
      },
    },
    {
      user: {
        id: 'user-admin-01',
        email: 'admin@proton.cyber',
        passwordHash: hashPassword('proton123'),
        role: 'admin',
        fullName: 'PROTON Administrator',
      },
      profile: {
        id: 'profile-admin-01',
        user_id: 'user-admin-01',
        full_name: 'PROTON Administrator',
        usn: '4NM20CS001',
        branch: 'CSE (Cybersecurity)',
        year: '4th Year',
        joining_year: '2021',
        designation_id: designations[0].id,
        custom_role_text: 'Administrator',
        department: 'Administration',
        avatar_url: '/images/hero-1.png',
        bio: 'Lead Administrator for PROTON Cybersecurity Club.',
        phone: '+91 99999 88888',
        github_url: 'https://github.com/proton-nmamit',
        linkedin_url: 'https://linkedin.com/company/proton-nmamit',
        instagram_url: null,
        portfolio_url: null,
        status: 'approved',
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        designations: designations[0],
      },
    },
  ]

  return {
    users: adminAccounts.map((a) => a.user),
    profiles: adminAccounts.map((a) => a.profile),
    designations,
    events: [],
    gallery_images: [],
    gallery_albums: [],
    invitations: [],
  }
}

function ensureAdminAccounts(store: LocalDatabaseSchema): boolean {
  let modified = false
  const initial = getInitialStore()

  for (const defaultUser of initial.users) {
    const existing = store.users.find(
      (u) =>
        u.email.toLowerCase() === defaultUser.email.toLowerCase() ||
        u.email.toLowerCase() === `${defaultUser.email.toLowerCase()}.cyber` ||
        u.email.toLowerCase().replace('.cyber', '') === defaultUser.email.toLowerCase()
    )
    if (!existing) {
      store.users.push(defaultUser)
      const matchingProfile = initial.profiles.find((p) => p.user_id === defaultUser.id)
      if (matchingProfile) {
        store.profiles.push(matchingProfile)
      }
      modified = true
    }
  }

  return modified
}

export function readLocalStore(): LocalDatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialStore()
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8')
      return initial
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8')
    const store = JSON.parse(raw) as LocalDatabaseSchema

    if (ensureAdminAccounts(store)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8')
    }

    return store
  } catch (err) {
    console.error('[Local Store Error] readLocalStore failed, using fallback:', err)
    return getInitialStore()
  }
}

export function writeLocalStore(store: LocalDatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8')
  } catch (err) {
    console.error('[Local Store Error] writeLocalStore failed:', err)
  }
}

export function isLocalDevMode(): boolean {
  if (process.env.NODE_ENV === 'production' || isDbConfigured()) {
    return false
  }
  return true
}
