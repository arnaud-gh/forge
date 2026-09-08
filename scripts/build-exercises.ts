/**
 * Build src/data/exercises.json from free-exercise-db (PRD LIB-1/LIB-2).
 *
 * Includes: exercises referenced by the program, their declared alternatives, and
 * the swap pool (every exercise sharing a primary muscle with a referenced one).
 * Images for referenced + alternative exercises are downloaded into
 * public/exercises/<id>/ (runtime-cached by the service worker, warmed by the
 * "Download for offline" step). Pool-only exercises keep remote image URLs.
 *
 * Run: npm run build:exercises
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROGRAM = join(ROOT, 'docs/program/forge-program-arms-neck-core-2026q4.json');
const OUT = join(ROOT, 'public/data/exercises.json');
const IMG_DIR = join(ROOT, 'public/exercises');
const DB_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

interface DbExercise {
  id: string;
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[];
  category: string;
  mechanic: string | null;
}

interface Program {
  exercises?: { id: string }[];
  sessions: { sections: { blocks: { exerciseId: string; alternatives?: string[] }[] }[] }[];
  library?: Program['sessions'];
}

async function main() {
  const { readFileSync } = await import('node:fs');
  const program = JSON.parse(readFileSync(PROGRAM, 'utf8')) as Program;
  const custom = new Set((program.exercises ?? []).map((e) => e.id));

  const referenced = new Set<string>();
  const alternatives = new Set<string>();
  for (const s of [...program.sessions, ...(program.library ?? [])]) {
    for (const sec of s.sections) {
      for (const b of sec.blocks) {
        if (!custom.has(b.exerciseId)) referenced.add(b.exerciseId);
        for (const a of b.alternatives ?? []) if (!custom.has(a)) alternatives.add(a);
      }
    }
  }

  console.log(
    `Fetching free-exercise-db (${referenced.size} referenced, ${alternatives.size} alternatives)...`,
  );
  const db = (await (await fetch(DB_URL)).json()) as DbExercise[];
  const byId = new Map(db.map((e) => [e.id, e]));

  const missing = [...referenced, ...alternatives].filter((id) => !byId.has(id));
  if (missing.length > 0) {
    console.error('Unknown exercise ids in program:', missing.join(', '));
    process.exit(1);
  }

  const muscles = new Set<string>();
  for (const id of referenced) byId.get(id)!.primaryMuscles.forEach((m) => muscles.add(m));

  const local = new Set([...referenced, ...alternatives]);
  const subset = db.filter((e) => local.has(e.id) || e.primaryMuscles.some((m) => muscles.has(m)));

  // Download images for local exercises with modest concurrency.
  mkdirSync(IMG_DIR, { recursive: true });
  const jobs: Array<() => Promise<void>> = [];
  for (const id of local) {
    const ex = byId.get(id)!;
    ex.images.forEach((rel, i) => {
      const dest = join(IMG_DIR, id, `${i}.jpg`);
      if (existsSync(dest)) return;
      jobs.push(async () => {
        const res = await fetch(IMG_BASE + rel);
        if (!res.ok) throw new Error(`Image ${rel}: ${res.status}`);
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      });
    });
  }
  console.log(`Downloading ${jobs.length} images...`);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (cursor < jobs.length) {
        const job = jobs[cursor++]!;
        await job();
      }
    }),
  );

  const out = subset.map((e) => ({
    id: e.id,
    name: e.name,
    equipment: e.equipment ?? 'body only',
    primaryMuscles: e.primaryMuscles,
    secondaryMuscles: e.secondaryMuscles,
    instructions: e.instructions,
    images: local.has(e.id)
      ? e.images.map((_, i) => `/exercises/${e.id}/${i}.jpg`)
      : e.images.map((rel) => IMG_BASE + rel),
    category: e.category,
    mechanic: e.mechanic ?? null,
    local: local.has(e.id),
  }));

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out));
  console.log(
    `Wrote ${out.length} exercises (${local.size} with local images) to public/data/exercises.json`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
