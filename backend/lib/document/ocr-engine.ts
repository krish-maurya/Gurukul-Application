/* ============================================================================
 * ocr-engine.ts
 * Shared types + demo simulator + helpers.
 *
 * REAL OCR lives in ./real-ocr (processRealImageOCR). This module keeps the
 * demo "Quick Samples" working and provides the shared field schema.
 * ==========================================================================*/

export interface ExtractedField {
  value: string;
  confidence: number; // 0 - 100
}

export interface ExtractedDocument {
  // Form Header & Metadata
  academicYear: ExtractedField;
  applicationDate: ExtractedField;

  // Student Information
  studentName: ExtractedField;
  dob: ExtractedField;
  gender: ExtractedField;
  nationality: ExtractedField;
  religion: ExtractedField;
  address: ExtractedField;
  cityStateZip: ExtractedField;

  // Class & Academic Details
  grade: ExtractedField;
  previousSchool: ExtractedField;
  mediumOfInstruction: ExtractedField;
  tcNumber: ExtractedField;

  // Parent / Guardian Details
  fatherName: ExtractedField;
  fatherOccupation: ExtractedField;
  motherName: ExtractedField;
  motherOccupation: ExtractedField;
  parentName: ExtractedField; // Alias / aggregated for backward compatibility
  contact: ExtractedField;
  email: ExtractedField;
  emergencyContactPerson: ExtractedField;
  emergencyPhone: ExtractedField;

  // Legacy / Additional
  medicalNotes: ExtractedField;
}

export interface DocumentRecordData {
  id: string;
  fileName: string;
  documentType: string;
  status: "UPLOADING" | "PROCESSING" | "NEEDS_REVIEW" | "APPROVED" | "REJECTED";
  confidenceScore: number;
  rawText: string;
  extractedFields: ExtractedDocument;
  fileUrl?: string;
  createdAt: string;
}

/** Blank field constant */
const BLANK: ExtractedField = { value: "", confidence: 0 };

/**
 * Builds a complete ExtractedDocument from a partial one — every missing
 * field becomes blank (""/0%). Handy for mock queue items and demo data.
 */
export function makeExtracted(
  partial: Partial<ExtractedDocument>,
): ExtractedDocument {
  return {
    academicYear: BLANK,
    applicationDate: BLANK,
    studentName: BLANK,
    dob: BLANK,
    gender: BLANK,
    nationality: BLANK,
    religion: BLANK,
    address: BLANK,
    cityStateZip: BLANK,
    grade: BLANK,
    previousSchool: BLANK,
    mediumOfInstruction: BLANK,
    tcNumber: BLANK,
    fatherName: BLANK,
    fatherOccupation: BLANK,
    motherName: BLANK,
    motherOccupation: BLANK,
    parentName: BLANK,
    contact: BLANK,
    email: BLANK,
    emergencyContactPerson: BLANK,
    emergencyPhone: BLANK,
    medicalNotes: BLANK,
    ...partial,
  };
}

export interface ParseResult {
  overallConfidence: number;
  extracted: ExtractedDocument;
  rawText: string;
  imagePreviewUrl?: string;
}

/**
 * Demo / sample-document simulator (used by the "Quick Samples" buttons).
 * For REAL uploads, the documents page calls processRealImageOCR() from
 * ./real-ocr directly with the actual File.
 */
export async function parseAdmissionDocument(
  fileName: string,
  fileSize?: number,
  fileOrUrl?: File | string,
  progressCallback?: (status: string, progress: number) => void,
): Promise<ParseResult> {
  // If an actual file/URL is provided, always run REAL OCR.
  if (fileOrUrl) {
    const { processRealImageOCR } = await import("./real-ocr");
    const result = await processRealImageOCR(fileOrUrl, progressCallback);
    return {
      overallConfidence: result.overallConfidence,
      extracted: result.extracted,
      rawText: result.rawText,
      imagePreviewUrl: result.imagePreviewUrl,
    };
  }

  // ---------- Demo simulation (no file — filename-triggered samples) ----------
  await new Promise((res) => setTimeout(res, 800));

  const isSophia =
    fileName.toLowerCase().includes("sophia") ||
    fileName.toLowerCase().includes("chen");

  if (isSophia) {
    const extracted = makeExtracted({
      academicYear: { value: "2025 – 2026", confidence: 96 },
      applicationDate: { value: "12/08/2025", confidence: 95 },
      studentName: { value: "Sophia Chen", confidence: 98 },
      dob: { value: "28/09/2009", confidence: 95 },
      gender: { value: "Female", confidence: 97 },
      nationality: { value: "Canadian", confidence: 94 },
      religion: { value: "Christianity", confidence: 92 },
      address: { value: "128 Oakridge Lane", confidence: 91 },
      cityStateZip: { value: "Metro City / CA / 90210", confidence: 90 },
      grade: { value: "Grade 10A", confidence: 96 },
      previousSchool: { value: "Metro Central Middle School", confidence: 94 },
      mediumOfInstruction: { value: "English", confidence: 98 },
      tcNumber: { value: "TC-2025-8841", confidence: 93 },
      fatherName: { value: "David Chen", confidence: 94 },
      fatherOccupation: { value: "Software Architect", confidence: 92 },
      motherName: { value: "Grace Chen", confidence: 95 },
      motherOccupation: { value: "Physician", confidence: 91 },
      parentName: { value: "David Chen", confidence: 94 },
      contact: { value: "+1 (555) 876-5432", confidence: 97 },
      email: { value: "david.chen@example.com", confidence: 96 },
      emergencyContactPerson: { value: "Grace Chen", confidence: 95 },
      emergencyPhone: { value: "+1 (555) 876-5433", confidence: 94 },
      medicalNotes: { value: "No known allergies", confidence: 89 },
    });
    return {
      overallConfidence: 94.2,
      extracted,
      rawText: `SCHOOL ADMISSION APPLICATION FORM Academic Year: 2025 – 2026 | Application Date: 12/08/2025\nFull Name: Sophia Chen\nDate of Birth: 28/09/2009\nGender: Female\nNationality: Canadian | Religion: Christianity\nResidential Address: 128 Oakridge Lane\nCity / State / Zip: Metro City / CA / 90210\nGrade/Class Applied For: Grade 10A\nLast School Attended: Metro Central Middle School\nMedium of Instruction: English\nTransfer Certificate Number: TC-2025-8841\nFather's Name: David Chen | Occupation: Software Architect\nMother's Name: Grace Chen | Occupation: Physician\nPrimary Contact Number: +1 (555) 876-5432\nEmail Address: david.chen@example.com\nEmergency Contact Person: Grace Chen | Phone: +1 (555) 876-5433`,
    };
  }

  const extracted = makeExtracted({
    academicYear: { value: "2026 – 2027", confidence: 94 },
    applicationDate: { value: "15/08/2026", confidence: 92 },
    studentName: { value: "Aarav Sharma", confidence: 96 },
    dob: { value: "05/11/2008", confidence: 93 },
    gender: { value: "Male", confidence: 98 },
    nationality: { value: "Indian", confidence: 95 },
    religion: { value: "Hindu", confidence: 91 },
    address: { value: "45 Lotus Parkway", confidence: 64 }, // Needs review (< 85%)
    cityStateZip: { value: "Techville / MH / 400001", confidence: 88 },
    grade: { value: "Grade 11B", confidence: 90 },
    previousSchool: { value: "Valley Heights High", confidence: 88 },
    mediumOfInstruction: { value: "English", confidence: 97 },
    tcNumber: { value: "TC-99120", confidence: 85 },
    fatherName: { value: "Rajesh Sharma", confidence: 89 },
    fatherOccupation: { value: "Business", confidence: 86 },
    motherName: { value: "Priya Sharma", confidence: 88 },
    motherOccupation: { value: "Teacher", confidence: 84 },
    parentName: { value: "Priya Sharma", confidence: 88 },
    contact: { value: "+1 (555) 345-6789", confidence: 91 },
    email: { value: "priya.sharma@example.com", confidence: 92 },
    emergencyContactPerson: { value: "Rajesh Sharma", confidence: 89 },
    emergencyPhone: { value: "+1 (555) 345-6790", confidence: 90 },
    medicalNotes: { value: "Mild Asthma - Needs Inhaler", confidence: 58 },
  });

  return {
    overallConfidence: 81.9,
    extracted,
    rawText: `SCHOOL ADMISSION APPLICATION FORM Academic Year: 2026 – 2027 | Application Date: 15/08/2026\nFull Name: Aarav Sharma\nDate of Birth: 05/11/2008\nGender: Male\nNationality: Indian | Religion: Hindu\nResidential Address: 45 Lotus Parkway\nCity / State / Zip: Techville / MH / 400001\nGrade/Class Applied For: Grade 11B\nLast School Attended: Valley Heights High\nMedium of Instruction: English\nTransfer Certificate Number: TC-99120\nFather's Name: Rajesh Sharma | Occupation: Business\nMother's Name: Priya Sharma | Occupation: Teacher\nPrimary Contact Number: +1 (555) 345-6789\nEmail Address: priya.sharma@example.com\nEmergency Contact Person: Rajesh Sharma | Phone: +1 (555) 345-6790`,
  };
}
