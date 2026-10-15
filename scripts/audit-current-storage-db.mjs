import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  }
});

const sql = neon(env.DATABASE_URL);

async function main() {
  console.log('=== AUDITING DATABASE MEDIA STORAGE REFERENCES ===\n');

  // 1. Profiles (avatars)
  const avatars = await sql`
    SELECT id, user_id, full_name, avatar_url 
    FROM public.profiles 
    WHERE avatar_url IS NOT NULL AND avatar_url != ''
  `;
  console.log(`1. Total profiles with avatar_url: ${avatars.length} / 41`);
  avatars.slice(0, 5).forEach((a, i) => {
    console.log(`   [${i + 1}] ${a.full_name}: "${a.avatar_url}"`);
  });

  // 2. Events (posters)
  const events = await sql`
    SELECT id, title, poster_url 
    FROM public.events 
    WHERE poster_url IS NOT NULL AND poster_url != ''
  `;
  console.log(`\n2. Total events with poster_url: ${events.length}`);
  events.forEach((e, i) => {
    console.log(`   [${i + 1}] ${e.title}: "${e.poster_url}"`);
  });

  // 3. Gallery Images
  const galleryImages = await sql`
    SELECT id, album_id, title, image_url 
    FROM public.gallery_images 
    WHERE image_url IS NOT NULL AND image_url != ''
  `;
  console.log(`\n3. Total gallery images: ${galleryImages.length}`);
  galleryImages.slice(0, 5).forEach((g, i) => {
    console.log(`   [${i + 1}] ${g.title || 'Untitled'}: "${g.image_url}"`);
  });

  // 4. Gallery Albums (cover images)
  const albums = await sql`
    SELECT id, title, cover_image_url 
    FROM public.gallery_albums 
    WHERE cover_image_url IS NOT NULL AND cover_image_url != ''
  `;
  console.log(`\n4. Total gallery albums with cover_image_url: ${albums.length}`);
  albums.forEach((a, i) => {
    console.log(`   [${i + 1}] ${a.title}: "${a.cover_image_url}"`);
  });
}

main().catch(console.error);
