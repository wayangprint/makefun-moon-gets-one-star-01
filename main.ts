// "The Moon Gets One Star" — make.fun entry runner.
//
// The entry is a single one-star review of the Moon, written as one
// fixed line of exactly 109 characters. It is assembled from three
// short fragments, each carrying one job in the joke:
//
//   1. STAR_RATING — the verdict up front, one filled star out of five.
//   2. COMPLAINT   — what arrived: a sliver instead of the full moon
//      ordered, and it keeps shrinking every night (the waning phase).
//   3. VERDICT     — why no second star: support sits 384,400 km away,
//      the real average Earth–Moon distance, so no refund is coming.
//
// The fragments are joined, normalised to single spaces, checked
// against the competition gate (1–120 characters, one non-blank
// line), and finally written byte-for-byte to entry.txt with no
// trailing newline — the file the grader reads is exactly that line.
//
// Deterministic by construction: no clock, no randomness, no network,
// no input files. Every run writes the same bytes.
//
// Where the file lands:
//   - MAKEFUN_OUTPUT_DIR when set (the grading sandbox sets it to
//     /output; scratch dirs are used while verifying determinism),
//   - otherwise /output when that directory already exists,
//   - otherwise next to this script (entry.txt in the repo folder,
//     local runs only). The script folder is never written when an
//     output folder is available: the grading sandbox mounts the
//     repository read-only, so a write there would throw.

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The gate in RULES.txt: entry.txt must be UTF-8 text of 1 to 120
// characters, not only white space. Counted in code points (Array.from)
// so the ★/☆ glyphs count as one character each, not two UTF-16 units.
const ENTRY_MIN_LENGTH = 1;
const ENTRY_MAX_LENGTH = 120;

const STAR_RATING = "★☆☆☆☆";
const COMPLAINT =
  "Ordered a full moon, got a sliver. It keeps shrinking nightly";
const VERDICT = "and support is 384,400 km away. One star.";

// Collapse any run of whitespace to a single space and drop leading /
// trailing space. The fragments are already single-spaced, so this is
// a safety net, not a transformation: it guarantees the joined line
// can never contain a double space even if a fragment is edited later.
function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// Join the review fragments in reading order and normalise the result.
function assembleReview(fragments: readonly string[]): string {
  return normalizeWhitespace(fragments.join(" "));
}

// Validate the finished line against the competition gate. Throws on
// the first violation, so a bad line never reaches the output file.
function validateReview(line: string): void {
  const charCount = Array.from(line).length;
  if (charCount < ENTRY_MIN_LENGTH || charCount > ENTRY_MAX_LENGTH) {
    throw new Error(
      `entry is ${charCount} characters, outside the ${ENTRY_MIN_LENGTH}-${ENTRY_MAX_LENGTH} range`,
    );
  }
  if (line.trim().length === 0) {
    throw new Error("entry must not be blank");
  }
  if (/[\r\n]/.test(line)) {
    throw new Error("entry must be a single line");
  }
}

// Resolve where entry.txt goes: an explicit override wins, then the
// sandbox mount, then the script's own folder as a local fallback.
function resolveOutputDir(): string {
  const override = (process.env.MAKEFUN_OUTPUT_DIR ?? "").trim();
  if (override.length > 0) {
    return override;
  }
  if (existsSync("/output")) {
    return "/output";
  }
  return new URL(".", import.meta.url).pathname;
}

// Write the validated line to entry.txt (UTF-8, no trailing newline)
// and echo it so the run log shows exactly what was submitted.
function writeEntry(line: string): void {
  const outDir = resolveOutputDir();
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.txt"), line, "utf8");
  console.log(line);
}

// Pipeline: assemble -> validate -> write. Each stage is a separate
// function so a future edit touches one concern at a time.
function runEntry(): void {
  const review = assembleReview([STAR_RATING, COMPLAINT, VERDICT]);
  validateReview(review);
  writeEntry(review);
}

runEntry();
