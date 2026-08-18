"use client";

import React, { useEffect, useState } from "react";
import { FileDropzone } from "@/components/document/file-dropzone";
import { ReviewPanel } from "@/components/document/review-panel";
import {
  DocumentRecordData,
  parseAdmissionDocument,
  makeExtracted,
} from "@/lib/document/ocr-engine";
import { processRealImageOCR } from "@/lib/document/real-ocr";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";

// Initial Mock Queue
const INITIAL_QUEUE: DocumentRecordData[] = [];
/* Historical mock examples retained below for OCR field-shape reference only; they are not rendered.
const MOCK_EXAMPLES: DocumentRecordData[] = [
  {
    id: "doc-101",
    fileName: "Admission_Form_Aarav_Sharma.pdf",
    documentType: "Admission Application",
    status: "NEEDS_REVIEW",
    confidenceScore: 78.5,
    rawText: `GURUKUL HIGH SCHOOL ADMISSION FORM\nStudent Name: Aarav Sharma\nDate of Birth: 05/11/2008\nApplying Grade: Grade 11B\nParent/Guardian: Priya Sharma\nPhone: +1 555-345-6789\nMedical Notes: Mild Asthma - Needs Inhaler\nPrevious Institution: Valley Heights High`,
    extractedFields: makeExtracted({
      studentName: { value: "Aarav Sharma", confidence: 96 },
      dob: { value: "2008-11-05", confidence: 92 },
      grade: { value: "Grade 11B", confidence: 89 },
      parentName: { value: "Priya Sharma", confidence: 85 },
      contact: { value: "+1 (555) 345-6789", confidence: 91 },
      address: { value: "45 Lotus Parkway, Techville", confidence: 64 },
      medicalNotes: { value: "Mild Asthma - Needs Inhaler", confidence: 58 },
      previousSchool: { value: "Valley Heights High", confidence: 88 },
    }),
    createdAt: "2026-08-13 10:30 AM",
  },
  {
    id: "doc-102",
    fileName: "Transfer_Cert_Sophia_Chen.pdf",
    documentType: "Transfer Certificate",
    status: "APPROVED",
    confidenceScore: 94.2,
    rawText: `TRANSFER CERTIFICATE\nStudent: Sophia Chen\nDOB: 28/09/2009\nGrade: Grade 10A\nStatus: Clear Conduct`,
    extractedFields: makeExtracted({
      studentName: { value: "Sophia Chen", confidence: 98 },
      dob: { value: "2009-09-28", confidence: 95 },
      grade: { value: "Grade 10A", confidence: 96 },
      parentName: { value: "David Chen", confidence: 94 },
      contact: { value: "+1 (555) 876-5432", confidence: 97 },
      address: { value: "128 Oakridge Lane, Metro City", confidence: 91 },
      medicalNotes: { value: "No known allergies", confidence: 89 },
      previousSchool: { value: "Metro Central Middle School", confidence: 94 },
    }),
    createdAt: "2026-08-13 09:15 AM",
  },
]; */

export default function DocumentIntelligencePage() {
  const [queue, setQueue] = useState<DocumentRecordData[]>(INITIAL_QUEUE);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgressStatus, setOcrProgressStatus] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "NEEDS_REVIEW" | "APPROVED"
  >("ALL");

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((rows) => {
        if (!Array.isArray(rows)) return;
        setQueue(
          rows.map((row) => ({
            ...row,
            createdAt: new Date(row.createdAt).toLocaleString(),
            extractedFields:
              typeof row.extractedFields === "string"
                ? JSON.parse(row.extractedFields)
                : row.extractedFields,
          })),
        );
      })
      .catch(() => setQueue([]));
  }, []);

  const handleFileSelect = async (fileOrName: File | string) => {
    setIsProcessing(true);
    let newDoc: DocumentRecordData;

    if (typeof fileOrName === "string") {
      setOcrProgressStatus("Parsing sample document...");
      const parsed = await parseAdmissionDocument(fileOrName);
      newDoc = {
        id: `doc-${Date.now()}`,
        fileName: fileOrName,
        documentType: "Admission Application",
        status: parsed.overallConfidence < 85 ? "NEEDS_REVIEW" : "APPROVED",
        confidenceScore: parsed.overallConfidence,
        rawText: parsed.rawText,
        extractedFields: parsed.extracted,
        createdAt: "Just now",
      };
    } else {
      const realResult = await processRealImageOCR(fileOrName, (status) => {
        setOcrProgressStatus(status);
      });

      const hasEmptyFields = Object.values(realResult.extracted).some(
        (f) => !f.value || f.value.trim().length === 0,
      );

      newDoc = {
        id: `doc-${Date.now()}`,
        fileName: fileOrName.name,
        documentType: "Scanned Document (OCR)",
        status:
          hasEmptyFields || realResult.overallConfidence < 85
            ? "NEEDS_REVIEW"
            : "APPROVED",
        confidenceScore: realResult.overallConfidence,
        rawText: realResult.rawText,
        extractedFields: realResult.extracted,
        fileUrl: realResult.imagePreviewUrl,
        createdAt: "Just now",
      };
    }

    // Persist every OCR job so the queue survives refreshes and is shared by admins.
    const saved = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDoc),
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    if (saved)
      newDoc = {
        ...newDoc,
        id: saved.id,
        status: saved.status,
        confidenceScore: saved.confidenceScore,
        createdAt: new Date(saved.createdAt).toLocaleString(),
      };
    setQueue((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
    setIsProcessing(false);
    setOcrProgressStatus("");
  };

  const handleApproveRecord = async (updatedValues: Record<string, string>) => {
    if (!activeDocId) return;
    const studentResponse = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentName: updatedValues.studentName,
        dob: updatedValues.dob,
        grade: updatedValues.grade,
        parentName:
          updatedValues.parentName ||
          updatedValues.fatherName ||
          updatedValues.motherName,
        parentEmail: updatedValues.email,
        contact: updatedValues.contact || updatedValues.emergencyPhone,
        address: updatedValues.address,
        medicalNotes: updatedValues.medicalNotes,
        previousSchool: updatedValues.previousSchool,
      }),
    });
    if (!studentResponse.ok) {
      alert(
        (await studentResponse.json().catch(() => ({}))).error ||
          "Student record could not be created. Check the required fields.",
      );
      return;
    }
    await fetch("/api/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: activeDocId,
        status: "APPROVED",
        confidenceScore: 100,
        extractedFields: updatedValues,
      }),
    });

    setQueue((prev) =>
      prev.map((doc) => {
        if (doc.id === activeDocId) {
          const updatedFields = { ...doc.extractedFields };
          (
            Object.keys(updatedFields) as (keyof typeof updatedFields)[]
          ).forEach((key) => {
            updatedFields[key] = {
              value:
                updatedValues[key] !== undefined
                  ? updatedValues[key]
                  : updatedFields[key].value,
              confidence: 100,
            };
          });

          return {
            ...doc,
            status: "APPROVED" as const,
            confidenceScore: 100,
            extractedFields: updatedFields,
          };
        }
        return doc;
      }),
    );

    setActiveDocId(null);
  };

  const activeDoc = queue.find((d) => d.id === activeDocId);

  const filteredQueue = queue.filter((d) => {
    if (filterStatus === "NEEDS_REVIEW") return d.status === "NEEDS_REVIEW";
    if (filterStatus === "APPROVED") return d.status === "APPROVED";
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div
        className="flex items-center justify-between border-b pb-4"
        style={{ borderColor: "var(--line)" }}
      >
        <div>
          <h1
            className="text-base font-semibold text-gurukul-ink tracking-tight"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Document Intelligence
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--faint)" }}>
            Automated ingestion, OCR parsing, and human verification.
          </p>
        </div>
      </div>

      {activeDoc ? (
        <ReviewPanel
          document={activeDoc}
          onApprove={handleApproveRecord}
          onBack={() => setActiveDocId(null)}
        />
      ) : (
        <>
          {/* File Upload Dropzone */}
          <FileDropzone
            onFileSelect={handleFileSelect}
            isProcessing={isProcessing}
            ocrProgressStatus={ocrProgressStatus}
          />

          {/* Processing Queue & Records Table */}
          <div
            className="bg-white rounded-xl overflow-hidden"
            style={{
              border: "1px solid var(--line)",
              boxShadow: "0 0 0 0.5px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div
              className="px-5 py-3.5 border-b flex items-center justify-between"
              style={{ borderColor: "var(--line)" }}
            >
              <div>
                <h3
                  className="text-sm font-semibold text-gurukul-ink"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  Processing Queue
                </h3>
                <p
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--faint)" }}
                >
                  Click any document to open the verification view.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div
                className="flex items-center gap-0.5 p-0.5 rounded-lg text-[11px] font-medium"
                style={{
                  background: "var(--hover)",
                  border: "1px solid var(--line)",
                }}
              >
                <button
                  onClick={() => setFilterStatus("ALL")}
                  className="px-3 py-1 rounded-md transition-colors"
                  style={
                    filterStatus === "ALL"
                      ? { background: "var(--accent)", color: "#ffffff" }
                      : { color: "var(--muted)" }
                  }
                >
                  All ({queue.length})
                </button>
                <button
                  onClick={() => setFilterStatus("NEEDS_REVIEW")}
                  className="px-3 py-1 rounded-md transition-colors"
                  style={
                    filterStatus === "NEEDS_REVIEW"
                      ? { background: "var(--accent)", color: "#ffffff" }
                      : { color: "var(--muted)" }
                  }
                >
                  Review (
                  {queue.filter((q) => q.status === "NEEDS_REVIEW").length})
                </button>
                <button
                  onClick={() => setFilterStatus("APPROVED")}
                  className="px-3 py-1 rounded-md transition-colors"
                  style={
                    filterStatus === "APPROVED"
                      ? { background: "var(--accent)", color: "#ffffff" }
                      : { color: "var(--muted)" }
                  }
                >
                  Approved (
                  {queue.filter((q) => q.status === "APPROVED").length})
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className="border-b text-[10px] uppercase tracking-wider"
                  style={{ borderColor: "var(--line)" }}
                >
                  <tr>
                    <th
                      className="px-5 py-2.5"
                      style={{ color: "var(--faint)" }}
                    >
                      Document
                    </th>
                    <th
                      className="px-5 py-2.5"
                      style={{ color: "var(--faint)" }}
                    >
                      Type
                    </th>
                    <th
                      className="px-5 py-2.5"
                      style={{ color: "var(--faint)" }}
                    >
                      Score
                    </th>
                    <th
                      className="px-5 py-2.5"
                      style={{ color: "var(--faint)" }}
                    >
                      Status
                    </th>
                    <th
                      className="px-5 py-2.5"
                      style={{ color: "var(--faint)" }}
                    >
                      Student
                    </th>
                    <th
                      className="px-5 py-2.5 text-right"
                      style={{ color: "var(--faint)" }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y"
                  style={{ borderColor: "var(--hover)" }}
                >
                  {filteredQueue.map((doc) => (
                    <tr
                      key={doc.id}
                      className="transition-colors group cursor-pointer"
                      style={{ background: "transparent" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                      onClick={() => setActiveDocId(doc.id)}
                    >
                      <td className="px-5 py-3 font-medium text-gurukul-ink flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center"
                          style={{
                            background: "var(--soft)",
                            color: "var(--faint)",
                          }}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-medium text-gurukul-ink text-xs">
                            {doc.fileName}
                          </p>
                          <p
                            className="text-[10px]"
                            style={{ color: "var(--faint)" }}
                          >
                            {doc.createdAt}
                          </p>
                        </div>
                      </td>
                      <td
                        className="px-5 py-3 text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {doc.documentType}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-12 rounded-full h-1 overflow-hidden"
                            style={{ background: "var(--soft)" }}
                          >
                            <div
                              className="h-1 rounded-full"
                              style={{
                                width: `${doc.confidenceScore}%`,
                                background:
                                  doc.confidenceScore >= 85
                                    ? "var(--accent)"
                                    : "var(--faint)",
                              }}
                            />
                          </div>
                          <span
                            className="font-mono text-[11px]"
                            style={{ color: "var(--muted)" }}
                          >
                            {doc.confidenceScore.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1"
                          style={
                            doc.status === "APPROVED"
                              ? {
                                  background: "var(--soft)",
                                  color: "var(--muted)",
                                }
                              : {
                                  background: "var(--amber-soft)",
                                  color: "var(--amber-text)",
                                }
                          }
                        >
                          {doc.status === "APPROVED" ? (
                            <>
                              <CheckCircle className="w-2.5 h-2.5" />
                              Approved
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-2.5 h-2.5" />
                              Review
                            </>
                          )}
                        </span>
                      </td>
                      <td
                        className="px-5 py-3 text-xs"
                        style={{ color: "var(--muted)" }}
                      >
                        {doc.extractedFields.studentName.value ? (
                          `${doc.extractedFields.studentName.value} (${doc.extractedFields.grade.value || "—"})`
                        ) : (
                          <span
                            className="italic"
                            style={{ color: "var(--faint)" }}
                          >
                            [Not detected]
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDocId(doc.id);
                          }}
                          className={`text-[11px] px-3 py-1.5 rounded-md font-medium transition-colors ${
                            doc.status === "APPROVED"
                              ? "btn-secondary"
                              : "btn-primary"
                          }`}
                        >
                          {doc.status === "APPROVED" ? "View" : "Review"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
