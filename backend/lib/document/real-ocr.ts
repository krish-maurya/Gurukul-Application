import { createWorker } from "tesseract.js";
import type { ExtractedDocument, ExtractedField } from "./ocr-engine";

// Version marker — if you do NOT see this in the browser console when the
// documents page loads, the OLD file is still being served (stale .next
// cache or wrong folder).
export const REAL_OCR_VERSION = "v2.1-improved-pipeline";

export interface RealOCRResult {
  overallConfidence: number;
  extracted: ExtractedDocument;
  rawText: string;
  imagePreviewUrl?: string;
}

/* ============================================================================
 * IMAGE PREPROCESSING (browser canvas)
 * Upscales the image ~2x, converts to grayscale and applies a contrast
 * stretch. This alone recovers most handwritten fields that plain Tesseract
 * misses (Nationality, Religion, Email, Last School, etc.).
 * Falls back gracefully to the original input during SSR or on any error.
 * ==========================================================================*/

async function loadImageElement(
  input: File | string,
): Promise<HTMLImageElement> {
  const url = typeof input === "string" ? input : URL.createObjectURL(input);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

async function preprocessForOCR(
  input: File | string,
): Promise<HTMLCanvasElement | File | string> {
  if (typeof document === "undefined") return input; // SSR guard
  try {
    const img = await loadImageElement(input);
    const MAX_DIM = 4200;
    let scale = Math.min(
      2.2,
      MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight),
    );
    if (scale < 1) scale = Math.max(scale, 0.9); // never shrink drastically
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return input;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;

    // 1) grayscale + histogram
    const hist = new Uint32Array(256);
    for (let i = 0; i < d.length; i += 4) {
      const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
      d[i] = d[i + 1] = d[i + 2] = g;
      hist[g]++;
    }

    // 2) contrast stretch between the 2nd and 98th percentile
    const total = w * h;
    let lo = 0,
      hi = 255,
      acc = 0;
    for (let i = 0; i < 256; i++) {
      acc += hist[i];
      if (acc >= total * 0.02) {
        lo = i;
        break;
      }
    }
    acc = 0;
    for (let i = 255; i >= 0; i--) {
      acc += hist[i];
      if (acc >= total * 0.02) {
        hi = i;
        break;
      }
    }
    const range = Math.max(1, hi - lo);
    const lut = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) {
      let v = ((i - lo) / range) * 255;
      // mild gamma to darken ink strokes
      v = 255 * Math.pow(Math.min(1, Math.max(0, v / 255)), 1.15);
      lut[i] = v;
    }
    for (let i = 0; i < d.length; i += 4) {
      const v = lut[d[i]];
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  } catch (err) {
    console.warn("OCR preprocessing failed, using original image:", err);
    return input;
  }
}

/* ============================================================================
 * MAIN ENTRY
 * ==========================================================================*/

export async function processRealImageOCR(
  fileOrUrl: File | string,
  progressCallback?: (status: string, progress: number) => void,
): Promise<RealOCRResult> {
  let imagePreviewUrl: string | undefined;
  if (typeof fileOrUrl !== "string") {
    imagePreviewUrl = URL.createObjectURL(fileOrUrl);
  } else {
    imagePreviewUrl = fileOrUrl;
  }

  let rawText = "";
  let baseConfidence = 0;

  try {
    if (progressCallback) progressCallback("Enhancing Image for OCR...", 5);
    const source = await preprocessForOCR(fileOrUrl);

    if (progressCallback)
      progressCallback("Initializing Tesseract OCR Engine...", 12);

    // SELF-HOSTED assets (no CDN downloads in production).
    // Served from /public/tesseract — kept in sync by scripts/copy-tesseract-assets.js
    // which runs on `npm install` (postinstall). Applied only in the browser.
    const selfHosted =
      typeof window !== "undefined"
        ? {
            workerPath: "/tesseract/worker.min.js",
            corePath: "/tesseract/core",
            langPath: "/tesseract/lang",
          }
        : {};

    const worker = await createWorker("eng", 1, {
      ...selfHosted,
      logger: (m) => {
        if (progressCallback && m.status) {
          const pct = Math.round((m.progress || 0) * 100);
          const statusText = m.status.replace(/_/g, " ");
          progressCallback(
            `${statusText} (${pct}%)`,
            15 + Math.round(pct * 0.7),
          );
        }
      },
      errorHandler: (err) => console.warn("Tesseract Worker Warning:", err),
    });

    // PSM 4 (single column, variable sizes) handles this form layout far
    // better than the default; preserve spaces so column values stay apart.
    await worker.setParameters({
      tessedit_pageseg_mode: "4" as any,
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });

    if (progressCallback)
      progressCallback("Scanning Image & Extracting Text...", 40);
    const ret = await worker.recognize(source as any);
    rawText = ret.data.text || "";
    baseConfidence = ret.data.confidence || 0;

    // If the enhanced pass produced almost nothing, retry on the original.
    if (rawText.replace(/\s/g, "").length < 40 && source !== fileOrUrl) {
      if (progressCallback)
        progressCallback("Retrying on original image...", 60);
      const retry = await worker.recognize(fileOrUrl as any);
      if ((retry.data.text || "").length > rawText.length) {
        rawText = retry.data.text || "";
        baseConfidence = retry.data.confidence || baseConfidence;
      }
    }

    await worker.terminate();
  } catch (error) {
    console.error("Tesseract OCR Processing Error:", error);
    rawText = "";
  }

  if (progressCallback)
    progressCallback("Parsing Structured Form Fields...", 90);

  const extracted = parseAdmissionFormText(rawText, baseConfidence || 85);

  const matchedFields = Object.values(extracted).filter(
    (f) => f.value.trim().length > 0,
  );
  let overallConfidence = 0;
  if (matchedFields.length > 0) {
    const sum = matchedFields.reduce((acc, curr) => acc + curr.confidence, 0);
    overallConfidence = Math.round((sum / matchedFields.length) * 10) / 10;
  }

  if (progressCallback) progressCallback("Complete", 100);

  return { overallConfidence, extracted, rawText, imagePreviewUrl };
}

/* ============================================================================
 * TEXT UTILITIES
 * ==========================================================================*/

/** Common OCR digit confusions, applied only inside numeric-looking tokens. */
const DIGIT_MAP: Record<string, string> = {
  O: "0",
  o: "0",
  Q: "0",
  D: "0",
  l: "1",
  I: "1",
  i: "1",
  "|": "1",
  "!": "1",
  "]": "1",
  "[": "1",
  "}": "1",
  "{": "1",
  Z: "2",
  z: "2",
  A: "4",
  S: "5",
  s: "5",
  G: "6",
  b: "6",
  é: "6",
  T: "7",
  B: "8",
  g: "9",
  q: "9",
};

function digitRatio(tok: string): number {
  const chars = tok.replace(/[\s\/\-.+()]/g, "");
  if (!chars.length) return 0;
  let n = 0;
  for (const c of chars) if (/[0-9]/.test(c) || DIGIT_MAP[c]) n++;
  return n / chars.length;
}

/** Fix a token that is *mostly* digits: "il"->"11", "1134S"->"11345". */
function fixNumericToken(tok: string): string {
  if (!/[0-9]/.test(tok) && !/^[OolIiSZB|!]{1,4}$/.test(tok)) return tok;
  if (digitRatio(tok) < 0.5) return tok;
  return tok
    .split("")
    .map((c) => (/[0-9\s\/\-.+()]/.test(c) ? c : (DIGIT_MAP[c] ?? c)))
    .join("");
}

/** Apply numeric fixing to every token of a string. */
function fixNumbersInString(s: string): string {
  return s
    .split(/(\s+)/)
    .map((t) => (/\S/.test(t) ? fixNumericToken(t) : t))
    .join("");
}

function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return dp[n];
}

const OCCUPATIONS = [
  "Engineer",
  "Teacher",
  "Doctor",
  "Lawyer",
  "Accountant",
  "Business",
  "Businessman",
  "Businesswoman",
  "Homemaker",
  "Housewife",
  "Professor",
  "Nurse",
  "Farmer",
  "Manager",
  "Architect",
  "Pilot",
  "Service",
  "Banker",
  "Clerk",
  "Advocate",
  "Pharmacist",
  "Dentist",
  "Consultant",
  "Designer",
  "Developer",
  "Officer",
  "Self-Employed",
  "Entrepreneur",
  "Shopkeeper",
];

/** Fuzzy-match a token to a known occupation ("Feather"/"Heathen" -> "Teacher"). */
function matchOccupation(token: string): string | null {
  const t = token.replace(/[^A-Za-z-]/g, "");
  if (t.length < 4) return null;
  const maxDist = t.length >= 7 ? 3 : 2;
  let best: string | null = null;
  let bestDist = maxDist + 1;
  for (const occ of OCCUPATIONS) {
    if (Math.abs(occ.length - t.length) > 2) continue;
    const d = levenshtein(t.toLowerCase(), occ.toLowerCase());
    if (d < bestDist) {
      bestDist = d;
      best = occ;
    }
  }
  return bestDist <= maxDist ? best : null;
}

/** Fix a token that is mostly LETTERS: "Cohoo|" -> "Cohool", "Schoo1" -> "Schooo l". */
function fixAlphaToken(tok: string): string {
  const letters = (tok.match(/[A-Za-z]/g) || []).length;
  if (!tok.length || letters / tok.length < 0.6) return tok;
  return tok
    .replace(/[|!1]/g, "l")
    .replace(/0/g, "o")
    .replace(/\$/g, "s")
    .replace(/[\/\\]+$/g, "");
}

const SCHOOL_WORDS = [
  "School",
  "Public",
  "Academy",
  "Vidyalaya",
  "High",
  "Convent",
  "English",
  "Primary",
  "Secondary",
  "International",
];

/** Canonicalize garbled school-name words: "Cohoo|/" -> "School". */
function fixSchoolWords(s: string): string {
  return s
    .split(/\s+/)
    .map((tok) => {
      const t = fixAlphaToken(tok).replace(/[^A-Za-z]/g, "");
      if (t.length < 4) return tok;
      for (const w of SCHOOL_WORDS) {
        if (t.toLowerCase() === w.toLowerCase()) return w;
        if (
          Math.abs(w.length - t.length) <= 1 &&
          levenshtein(t.toLowerCase(), w.toLowerCase()) <= 2
        )
          return w;
      }
      return tok;
    })
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/* ============================================================================
 * LINE CLASSIFICATION
 * ==========================================================================*/

const LABEL_PHRASES = [
  "Academic Year",
  "Application Date",
  "Full Name",
  "Student Name",
  "Date of Birth",
  "DD/MM/YYYY",
  "Gender",
  "Nationality",
  "Religion",
  "Residential Address",
  "Res. Address",
  "City",
  "State",
  "Zip",
  "Grade / Class Applied For",
  "Grade/Class Applied For",
  "Class Applied For",
  "Last School Attended",
  "Medium of Instruction",
  "Transfer Certificate Number",
  "Transfer Certificate",
  "Father's Name",
  "Fathers Name",
  "Mother's Name",
  "Mothers Name",
  "Occupation",
  "Primary Contact Number",
  "Email Address",
  "Emergency Contact Person",
  "Phone",
  "Parent / Guardian Signature",
  "Signature",
  "Medical Notes",
  "Medical / Health Notes",
];

const SECTION_RE =
  /(?:^\|?\s*[0-9]\s*[.)]\s)|STUDENT\s+INFORMATION|ACADEMIC\s+DETAILS|GUARDIAN\s+DETAILS|ADMISSION\s+APPLICATION|VERIFIED|REGISTRAR/i;

function stripLabelPhrases(line: string): string {
  let out = line;
  for (const p of LABEL_PHRASES) {
    const esc = p.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&").replace(/'/g, "'?");
    out = out.replace(new RegExp(esc, "gi"), " ");
  }
  return out
    .replace(/\(DD\/MM\/YYYY\)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** A line that is only form labels (no user data). */
function isLabelOnlyLine(line: string): boolean {
  const rest = stripLabelPhrases(line).replace(/[^A-Za-z0-9]/g, "");
  return rest.length <= 2;
}

/** Garbage lines like "= = 8 ae a" or ". 3," produced by OCR noise. */
function isNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  const alnum = (trimmed.match(/[A-Za-z0-9]/g) || []).length;
  if (alnum / trimmed.length < 0.45) return true;
  const tokens = trimmed.split(/\s+/);
  const avgLen =
    tokens.reduce((a, t) => a + t.replace(/[^A-Za-z0-9]/g, "").length, 0) /
    tokens.length;
  if (tokens.length >= 3 && avgLen < 2.2) return true;
  if (trimmed.length <= 2 && !/^\d\d$/.test(trimmed)) return true;
  return false;
}

function isValueLine(line: string): boolean {
  return !isNoiseLine(line) && !SECTION_RE.test(line) && !isLabelOnlyLine(line);
}

/* ============================================================================
 * STRUCTURED PARSER
 * ==========================================================================*/

export function parseAdmissionFormText(
  rawText: string,
  baseConfidence: number,
): ExtractedDocument {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const base = Math.min(96, Math.max(55, Math.round(baseConfidence)));

  const field = (val: string, conf?: number): ExtractedField => {
    const cleaned = cleanFieldValue(val);
    if (!cleaned) return { value: "", confidence: 0 };
    return {
      value: cleaned,
      confidence: Math.min(98, Math.max(40, conf ?? base)),
    };
  };

  const findLine = (regex: RegExp, from = 0): number => {
    for (let i = from; i < lines.length; i++)
      if (regex.test(lines[i])) return i;
    return -1;
  };

  /** Collect up to `max` value lines after a label index, stopping at a boundary. */
  const valuesAfter = (idx: number, max = 2, stop?: RegExp): string[] => {
    const out: string[] = [];
    if (idx < 0) return out;
    for (let i = idx + 1; i < lines.length && out.length < max; i++) {
      if (stop && stop.test(lines[i])) break;
      if (SECTION_RE.test(lines[i])) break;
      if (isValueLine(lines[i])) out.push(lines[i]);
      else if (isLabelOnlyLine(lines[i]) && out.length === 0)
        continue; // skip adjacent label rows
      else if (isNoiseLine(lines[i])) continue;
      else break;
    }
    return out;
  };

  /* ---- 1. Academic Year --------------------------------------------------*/
  let academicYear = "";
  {
    const m =
      rawText.match(
        /Academic\s*Year[^0-9]{0,10}(20\d{2})\s*[-–—~]?\s*([0-9]{2,4})?/i,
      ) || rawText.match(/(20\d{2})\s*[-–—]\s*(20\d{2})/);
    if (m) {
      const y1 = m[1];
      let y2 = m[2] || "";
      if (!/^20\d{2}$/.test(y2)) y2 = String(parseInt(y1, 10) + 1); // repair "202t"/"202"
      academicYear = `${y1} - ${y2}`;
    }
  }

  /* ---- 2. Application Date ----------------------------------------------*/
  let applicationDate = "";
  {
    const appIdx = findLine(/Application\s*Date/i);
    const scan =
      appIdx >= 0 ? lines[appIdx] + " " + (lines[appIdx + 1] || "") : rawText;
    const m = fixNumbersInString(scan).match(
      /(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(20\d{2})/,
    );
    if (m)
      applicationDate = `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[3]}`;
  }

  /* ---- 3. Full Name -------------------------------------------------------*/
  let studentName = "";
  {
    const idx = findLine(/Full\s*Name|Student\s*Name/i);
    const same = idx >= 0 ? stripLabelPhrases(lines[idx]) : "";
    if (same && same.length > 3) studentName = same;
    else studentName = valuesAfter(idx, 1, /Date\s*of\s*Birth/i)[0] || "";
  }

  /* ---- 4. Date of Birth ---------------------------------------------------*/
  let dob = "";
  {
    const idx = findLine(/Date\s*of\s*Birth|D\.?O\.?B/i);
    if (idx >= 0) {
      const stopIdx = findLine(/Nationality|Religion/i, idx + 1);
      const end = stopIdx > idx ? stopIdx : Math.min(lines.length, idx + 4);
      for (let i = idx; i < end; i++) {
        const fixed = fixNumbersInString(lines[i]);
        const m = fixed.match(
          /(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*((?:19|20)\d{2})/,
        );
        if (m) {
          const cand = `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[3]}`;
          if (cand !== applicationDate) {
            dob = cand;
            break;
          } // never reuse the app date
        }
      }
    }
  }

  /* ---- 5. Gender (circled options disappear from OCR) --------------------*/
  let gender = "";
  {
    const gIdx = findLine(/Gender|Date\s*of\s*Birth/i);
    const endIdx = findLine(
      /Nationality|Religion|Residential/i,
      Math.max(0, gIdx),
    );
    const region =
      gIdx >= 0
        ? lines.slice(gIdx, endIdx > gIdx ? endIdx : gIdx + 4).join(" ")
        : rawText;
    // explicit circle artifact: "(Male", "CMale)", "@Male"
    const circled = region.match(/[C(@©]\s*(Male|Female|Other)\b/i);
    if (circled) {
      gender = circled[1][0].toUpperCase() + circled[1].slice(1).toLowerCase();
    } else {
      // A circled word is usually destroyed by the ellipse stroke, so the
      // MISSING option among Male/Female/Other is the selected one.
      const hasMale = /\bmale\b/i.test(region);
      const hasFemale = /\bfemale\b/i.test(region);
      const hasOther = /\bother\b/i.test(region);
      const missing = [
        !hasMale && "Male",
        !hasFemale && "Female",
        !hasOther && "Other",
      ].filter(Boolean) as string[];
      if (missing.length === 1) gender = missing[0];
      else if (hasMale && !hasFemale) gender = "Male";
      else if (hasFemale && !hasMale) gender = "Female";
    }
  }

  /* ---- 6/7. Nationality & Religion ----------------------------------------*/
  let nationality = "";
  let religion = "";
  {
    const idx = findLine(/Nationality/i);
    if (idx >= 0) {
      const inline = stripLabelPhrases(lines[idx]);
      const vals =
        inline.length > 2
          ? [inline]
          : valuesAfter(idx, 2, /Residential|Address/i);
      if (vals.length) {
        const tokens = vals[0].split(/\s+/).filter((t) => /[A-Za-z]/.test(t));
        if (tokens.length >= 2) {
          nationality = tokens[0];
          religion = tokens.slice(1).join(" ");
        } else {
          nationality = vals[0];
          if (vals[1] && !/Residential|Address/i.test(vals[1]))
            religion = vals[1];
        }
      }
    }
    if (!religion) {
      const rIdx = findLine(/^Religion/i);
      const inline = rIdx >= 0 ? stripLabelPhrases(lines[rIdx]) : "";
      religion = inline || (rIdx >= 0 ? valuesAfter(rIdx, 1)[0] || "" : "");
    }
  }

  /* ---- 8. Residential Address ---------------------------------------------*/
  let address = "";
  {
    const idx = findLine(/Residential\s*Address|Res\.?\s*Address/i);
    const inline = idx >= 0 ? stripLabelPhrases(lines[idx]) : "";
    address =
      inline.length > 4 ? inline : valuesAfter(idx, 1, /^City\b/i)[0] || "";
    // frequent confusions in addresses
    address = address
      .replace(/^8-/, "B-")
      .replace(/Apartmente/gi, "Apartments");
  }

  /* ---- 9. City / State / Zip ------------------------------------------------*/
  let cityStateZip = "";
  let zipRepaired = false;
  {
    const idx = findLine(/^City\b/i);
    const endIdx = findLine(
      /CLASS\s*&|ACADEMIC\s*DETAILS|Grade/i,
      Math.max(0, idx),
    );
    if (idx >= 0) {
      const collected: string[] = [];
      const stop = endIdx > idx ? endIdx : Math.min(lines.length, idx + 7);
      for (let i = idx; i < stop; i++) {
        const rest = stripLabelPhrases(lines[i]);
        if (rest && !isNoiseLine(rest)) collected.push(rest);
      }
      let tokens = collected
        .join(" ")
        .split(/\s+/)
        .filter(
          (t) =>
            t.replace(/[^A-Za-z0-9]/g, "").length > 1 ||
            /^\d$/.test(t) === false,
        );
      tokens = tokens.filter((t) => /[A-Za-z0-9]/.test(t));
      let zip = "";
      // zip = last mostly-numeric token
      for (let i = tokens.length - 1; i >= 0; i--) {
        const fx = fixNumericToken(tokens[i]).replace(/\D/g, "");
        if (fx.length >= 4 && fx.length <= 8 && digitRatio(tokens[i]) > 0.6) {
          zip = fx;
          if (fx !== tokens[i]) zipRepaired = true;
          tokens.splice(i, 1);
          break;
        }
      }
      const words = tokens.filter((t) => /^[A-Za-z][A-Za-z.'-]*$/.test(t));
      const city = words[0] || "";
      const state = words.slice(1).join(" ");
      cityStateZip = [city, state, zip].filter(Boolean).join(", ");
    }
  }

  /* ---- 10/11. Grade & Last School -------------------------------------------*/
  let grade = "";
  let previousSchool = "";
  {
    const idx = findLine(/Class\s*Applied|Grade\s*Applied|Last\s*School/i);
    const vals = valuesAfter(idx, 2, /Medium|Transfer/i);
    const joined = vals.join(" ");
    const gm = joined.match(
      /\b(Grade|Class|Std\.?)\s*[:\-]?\s*([0-9]{1,2}|[IVX]{1,4})\s*([A-Z]\b)?/i,
    );
    if (gm) {
      grade =
        `${gm[1][0].toUpperCase() + gm[1].slice(1).toLowerCase()} ${gm[2]}${gm[3] ? " " + gm[3] : ""}`.trim();
      previousSchool = joined.replace(gm[0], " ").replace(/\s+/g, " ").trim();
    } else if (vals.length >= 2) {
      grade = vals[0];
      previousSchool = vals[1];
    } else {
      grade = vals[0] || "";
    }
    // canonical fixes for common school-word garbling ("Schoo!" / "Cohoo|" -> "School")
    previousSchool = fixSchoolWords(
      previousSchool.replace(/^[\s,.;:|\-]+|[\s,.;:\-]+$/g, ""),
    );
  }

  /* ---- 12. Medium of Instruction (circled option) ----------------------------*/
  let medium = "";
  {
    const idx = findLine(/Medium\s*of\s*Instruction/i);
    const endIdx = findLine(/PARENT|GUARDIAN|Father/i, Math.max(0, idx));
    const region =
      idx >= 0
        ? lines
            .slice(idx, endIdx > idx ? endIdx : Math.min(lines.length, idx + 4))
            .join(" ")
        : "";
    const circled = region.match(/[C(@©]\s*(English|Hindi)\)?/i);
    if (circled) {
      medium = circled[1][0].toUpperCase() + circled[1].slice(1).toLowerCase();
    } else if (region) {
      const hasEnglish = /English/i.test(region);
      const hasHindi = /Hindi/i.test(region);
      // Same missing-option logic: the circled choice vanishes from OCR.
      if (!hasEnglish && hasHindi) medium = "English";
      else if (hasEnglish && !hasHindi) medium = "Hindi";
      else if (hasEnglish && hasHindi) medium = "English"; // both readable: default cautious
    }
  }

  /* ---- 13. Transfer Certificate Number ---------------------------------------*/
  let tcNumber = "";
  let tcRepaired = false;
  {
    const idx = findLine(/Transfer\s*Certificate/i);
    if (idx >= 0) {
      for (let i = idx; i < Math.min(lines.length, idx + 4); i++) {
        const cand = stripLabelPhrases(lines[i]);
        if (!cand || !/[0-9]/.test(cand)) continue;
        if (!/\//.test(cand) && !/20\d\d/.test(fixNumbersInString(cand)))
          continue;
        // must be digit-heavy: prevents grabbing neighbouring text lines
        if (digitRatio(cand) < 0.4) continue;
        // split into slash groups and repair digits
        const groups = cand
          .split(/[\/\\]/)
          .map((g) => g.trim())
          .filter(Boolean);
        const fixedGroups = groups.map((g) =>
          fixNumericToken(g.replace(/\s+/g, "")),
        );
        const year = fixedGroups.find((g) => /^(?:19|20)\d{2}$/.test(g));
        const serial = [...fixedGroups]
          .reverse()
          .find((g) => g !== year && /^\d{2,6}$/.test(g));
        if (year) {
          tcNumber = `TC / ${year} / ${serial || ""}`
            .replace(/\/\s*$/, "")
            .trim();
          tcRepaired = true;
        } else {
          tcNumber = cand;
        }
        break;
      }
    }
  }

  /* ---- helper: split "<name> <occupation>" value lines ------------------------*/
  const splitNameOccupation = (
    vals: string[],
  ): { name: string; occ: string } => {
    let name = "";
    let occ = "";
    const rest: string[] = [];
    for (const v of vals) {
      const tokens = v.split(/\s+/);
      if (tokens.length === 1) {
        const m = matchOccupation(tokens[0]);
        if (m && !occ) {
          occ = m;
          continue;
        }
      }
      rest.push(v);
    }
    if (rest.length) {
      const tokens = rest[0].split(/\s+/);
      // check the trailing token(s) for an occupation word
      for (let take = 1; take <= 2 && tokens.length - take >= 2; take++) {
        const tail = tokens.slice(tokens.length - take).join(" ");
        const m = matchOccupation(tail.replace(/\s+/g, ""));
        const direct = OCCUPATIONS.find(
          (o) => o.toLowerCase() === tail.toLowerCase(),
        );
        if (direct || m) {
          if (!occ) occ = direct || (m as string);
          tokens.splice(tokens.length - take, take);
          break;
        }
      }
      name = tokens.join(" ");
      if (!name && rest[1]) name = rest[1];
    }
    if (!name && rest.length > 1) name = rest[1];
    return { name, occ };
  };

  /* ---- 14/15. Father -----------------------------------------------------------*/
  let fatherName = "";
  let fatherOcc = "";
  {
    const idx = findLine(/Father'?s?\s*Name/i);
    const vals = valuesAfter(idx, 2, /Mother'?s?\s*Name/i);
    const r = splitNameOccupation(vals);
    fatherName = r.name;
    fatherOcc = r.occ;
  }

  /* ---- 16/17. Mother -------------------------------------------------------------*/
  let motherName = "";
  let motherOcc = "";
  {
    const idx = findLine(/Mother'?s?\s*Name/i);
    const vals = valuesAfter(idx, 2, /Primary\s*Contact|Email/i);
    const r = splitNameOccupation(vals);
    motherName = r.name;
    motherOcc = r.occ;
  }

  /* ---- 18/19. Contact & Email ------------------------------------------------------*/
  let contact = "";
  let email = "";
  {
    const idx = findLine(/Primary\s*Contact/i);
    const region =
      idx >= 0
        ? lines.slice(idx, Math.min(lines.length, idx + 4)).join(" ")
        : rawText;
    // email first (so its digits don't pollute the phone match)
    let em =
      region.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/) ||
      rawText.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    let emRawMatch = em ? em[0] : "";
    if (!em) {
      // tolerant matcher: OCR sometimes inserts spaces/accents before the @
      // e.g. "deshmukh.rohan2 é @gmail.com" -> "deshmukh.rohan26@gmail.com"
      const tol =
        region.match(
          /([A-Za-z0-9._%+\-]+(?:\s[A-Za-z0-9._%+\-é]{1,4})*)\s*@\s*([A-Za-z0-9.\-]+\.[A-Za-z]{2,})/,
        ) ||
        rawText.match(
          /([A-Za-z0-9._%+\-]+(?:\s[A-Za-z0-9._%+\-é]{1,4})*)\s*@\s*([A-Za-z0-9.\-]+\.[A-Za-z]{2,})/,
        );
      if (tol) {
        emRawMatch = tol[0];
        const local = tol[1].replace(/\s+/g, "").replace(/é/g, "6");
        em = [`${local}@${tol[2]}`] as RegExpMatchArray;
      }
    }
    if (em) {
      email = em[0]
        .replace(/@q+gmail/i, "@gmail")
        .replace(/gmai[l1|]\.com$/i, "gmail.com")
        .replace(/\.corn$/i, ".com")
        .replace(/\.c0m$/i, ".com");
    }
    const phoneRegion = emRawMatch ? region.replace(emRawMatch, " ") : region;
    const pm = fixNumbersInString(phoneRegion).match(
      /\+?\d{1,3}[\s-]?\d{4,5}[\s-]?\d{4,6}|\d{10,12}/,
    );
    if (pm) {
      contact = pm[0].trim();
      // "+91" is very often misread as "+11"/"+41"/"+31" on handwritten Indian
      // forms; repair only when a full 10-digit number follows.
      contact = contact.replace(/^\+[1-8]1(?=[\s-]?\d{5}[\s-]?\d{5}$)/, "+91");
    }
  }

  /* ---- 20/21. Emergency contact -------------------------------------------------------*/
  let emergPerson = "";
  let emergPhone = "";
  {
    const idx = findLine(/Emergency\s*Contact/i);
    const vals = valuesAfter(idx, 3, /Signature|Parent\s*\//i);
    for (const v of vals) {
      const fixed = fixNumbersInString(v);
      const pm = fixed.match(/\d[\d\s.\/\-]{5,}\d/);
      const hasWords = /[A-Za-z]{3,}/.test(v.replace(/\bPhone\b/gi, ""));
      if (pm && !emergPhone) {
        emergPhone = pm[0]
          .replace(/[^\d\s]/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();
      }
      if (hasWords && !emergPerson) {
        let person = v;
        if (pm) person = v.slice(0, fixed.indexOf(pm[0])).trim();
        // keep only up to a closing parenthesis; drop trailing OCR garbage
        const par = person.match(/^(.*?\))/);
        if (par) person = par[1];
        // repair broken spacing inside parentheses: "(Grandfath er )" -> "(Grandfather)"
        person = person.replace(/\(\s*([^)]*?)\s*\)/g, (_s, inner) => {
          const w = inner.replace(/(\w)\s+(\w{1,3})\s*$/, "$1$2");
          return `(${w})`;
        });
        emergPerson = person;
      }
    }
    if (!emergPhone) {
      // sometimes the phone lands on a "Phone" labelled line further down
      const pIdx = findLine(/^Phone\b/i, Math.max(0, idx));
      const v = pIdx >= 0 ? valuesAfter(pIdx, 1)[0] : "";
      if (v) {
        const pm = fixNumbersInString(v).match(/\d[\d\s.\-]{6,}\d/);
        if (pm) emergPhone = pm[0].replace(/\./g, "").trim();
      }
    }
  }

  /* ---- Medical notes ---------------------------------------------------------------------*/
  let medicalNotes = "";
  {
    const idx = findLine(/Medical\s*(?:\/\s*Health\s*)?Notes/i);
    medicalNotes = idx >= 0 ? valuesAfter(idx, 1)[0] || "" : "";
  }

  /* ---- assemble with per-field confidence tuning -------------------------------------------*/
  const boost = (v: string, ok: boolean) =>
    v ? (ok ? Math.min(97, base + 6) : Math.max(45, base - 15)) : 0;

  return {
    academicYear: field(
      academicYear,
      boost(academicYear, /^20\d{2} - 20\d{2}$/.test(academicYear)),
    ),
    applicationDate: field(
      applicationDate,
      boost(applicationDate, /^\d{2}\/\d{2}\/20\d{2}$/.test(applicationDate)),
    ),
    studentName: field(studentName),
    dob: field(dob, boost(dob, /^\d{2}\/\d{2}\/(?:19|20)\d{2}$/.test(dob))),
    gender: field(gender, gender ? base : 0),
    nationality: field(nationality),
    religion: field(religion),
    address: field(address),
    cityStateZip: field(
      cityStateZip,
      zipRepaired ? Math.max(45, base - 10) : undefined,
    ),
    grade: field(grade),
    previousSchool: field(previousSchool),
    mediumOfInstruction: field(medium, medium ? Math.max(50, base - 5) : 0),
    tcNumber: field(
      tcNumber,
      tcNumber
        ? tcRepaired
          ? Math.max(45, base - 12)
          : Math.max(45, base - 20)
        : 0,
    ),
    fatherName: field(fatherName),
    fatherOccupation: field(fatherOcc),
    motherName: field(motherName),
    motherOccupation: field(motherOcc),
    parentName: field(fatherName || motherName),
    contact: field(contact, contact ? Math.max(48, base - 8) : 0),
    email: field(email, email ? Math.min(97, base + 5) : 0),
    emergencyContactPerson: field(emergPerson),
    emergencyPhone: field(emergPhone, emergPhone ? Math.max(48, base - 8) : 0),
    medicalNotes: field(medicalNotes),
  };
}

/* ============================================================================
 * VALUE CLEANING
 * ==========================================================================*/

function cleanFieldValue(val: string): string {
  if (!val) return "";
  let cleaned = val
    .replace(/\(DD\/MM\/YYYY\)/gi, "")
    .replace(
      /(?:1\.\s*STUDENT INFORMATION|2\.\s*CLASS & ACADEMIC DETAILS|3\.\s*PARENT \/ GUARDIAN DETAILS)/gi,
      "",
    )
    .replace(/_{2,}/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s:\-|_,.;]+|[\s:\-|_,.;]+$/g, "")
    .trim();

  if (
    /^[\/_\-\s.,|]*$/.test(cleaned) ||
    cleaned === "//20" ||
    cleaned === "20" ||
    /^DD\/MM\/YYYY$/i.test(cleaned) ||
    /^(?:Full Name|Date of Birth|Gender|Nationality|Religion|Residential Address|City|State|Zip|Grade|Last School(?:\s*Attended)?|Medium(?:\s*of\s*Instruction)?|Transfer(?:\s*Certificate(?:\s*Number)?)?|Father'?s? Name|Mother'?s? Name|Primary Contact(?:\s*Number)?|Email(?:\s*Address)?|Emergency Contact(?:\s*Person)?|Occupation|Phone|Other|Date)$/i.test(
      cleaned,
    )
  ) {
    return "";
  }
  return cleaned;
}
