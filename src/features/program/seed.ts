import rawSeed from '../../../docs/program/forge-program-arms-neck-core-2026q4.json';
import { importProgram } from './importer';
import type { Program } from './types';

// The development seed program, bundled at build time (PRD PRG-1, assumption 9).
// Validated through the importer so a malformed seed fails loudly in dev.
let cached: Program | null = null;

export function getSeedProgram(): Program {
  cached ??= importProgram(rawSeed);
  return cached;
}
