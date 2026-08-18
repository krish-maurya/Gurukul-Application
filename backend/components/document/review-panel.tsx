"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  ArrowLeft,
  Image as ImageIcon,
  Edit3,
  FileText,
} from "lucide-react";
import { DocumentRecordData } from "@/lib/document/ocr-engine";

interface ReviewPanelProps {
  document: DocumentRecordData;
  onApprove: (updatedFields: Record<string, string>) => void;
  onBack?: () => void;
}

export function ReviewPanel({ document, onApprove, onBack }: ReviewPanelProps) {
  const [fields, setFields] = useState<
    Record<string, { value: string; confidence: number }>
  >(() => ({ ...document.extractedFields }));

  const FIELD_LABELS: Record<string, string> = {
    academicYear: "Academic Year",
    applicationDate: "Application Date",
    studentName: "Full Name",
    dob: "Date of Birth",
    gender: "Gender",
    nationality: "Nationality",
    religion: "Religion",
    address: "Residential Address",
    cityStateZip: "City / State / Zip",
    grade: "Grade / Class Applied For",
    previousSchool: "Last School Attended",
    mediumOfInstruction: "Medium of Instruction",
    tcNumber: "Transfer Certificate No.",
    fatherName: "Father's Name",
    fatherOccupation: "Father's Occupation",
    motherName: "Mother's Name",
    motherOccupation: "Mother's Occupation",
    parentName: "Parent / Guardian",
    contact: "Primary Contact Number",
    email: "Email Address",
    emergencyContactPerson: "Emergency Contact Person",
    emergencyPhone: "Emergency Contact Phone",
    medicalNotes: "Medical Notes",
  };

  const handleFieldChange = (key: string, newValue: string) => {
    setFields((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: newValue,
        confidence: 100,
      },
    }));
  };

  const handleApprove = () => {
    const finalValues: Record<string, string> = {};
    Object.keys(fields).forEach((k) => {
      finalValues[k] = fields[k].value;
    });
    onApprove(finalValues);
  };

  const lowConfidenceCount = Object.values(fields).filter(
    (f) => f.confidence < 85,
  ).length;

  return (
    <div
      className="bg-white rounded-xl overflow-hidden"
      style={{
        border: "1px solid var(--line)",
        boxShadow: "0 0 0 0.5px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* Header Bar */}
      <div
        className="px-5 py-3.5 border-b flex items-center justify-between"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 rounded-md transition-colors"
              style={{ color: "var(--faint)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--soft)";
                e.currentTarget.style.color = "var(--ink)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--faint)";
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2
                className="text-sm font-semibold text-gurukul-ink"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {document.fileName}
              </h2>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide"
                style={
                  lowConfidenceCount > 0
                    ? {
                        background: "var(--amber-soft)",
                        color: "var(--amber-text)",
                        border: "1px solid rgba(183, 121, 31, 0.25)",
                      }
                    : { background: "var(--soft)", color: "var(--muted)" }
                }
              >
                {lowConfidenceCount > 0
                  ? `${lowConfidenceCount} field(s) need review`
                  : "High confidence"}
              </span>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
              Confidence:{" "}
              <span className="font-medium text-gurukul-ink">
                {document.confidenceScore.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={handleApprove}
          className="btn-primary font-medium text-xs px-4 py-2 rounded-lg flex items-center gap-1.5"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Approve & Create Record</span>
        </button>
      </div>

      {/* Side-by-Side Review Grid */}
      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x h-[720px]"
        style={{ borderColor: "var(--line)" }}
      >
        {/* Left Column: Scanned Image Preview */}
        <div
          className="lg:col-span-6 p-5 flex flex-col h-full overflow-hidden"
          style={{ background: "var(--soft)" }}
        >
          <div className="flex items-center justify-between mb-2.5 shrink-0">
            <span
              className="text-[11px] font-medium uppercase tracking-wider flex items-center gap-1.5"
              style={{ color: "var(--muted)" }}
            >
              <ImageIcon className="w-3 h-3" />
              <span>Scanned Document</span>
            </span>
          </div>

          <div
            className="flex-1 bg-white rounded-lg p-2.5 flex items-center justify-center overflow-hidden relative"
            style={{ border: "1px solid var(--line)" }}
          >
            {document.fileUrl ? (
              <img
                src={document.fileUrl}
                alt="Original Document Preview"
                className="w-full h-full object-contain rounded"
              />
            ) : (
              <div className="text-center p-8">
                <FileText
                  className="w-12 h-12 mx-auto mb-2"
                  style={{ color: "var(--line-strong)" }}
                />
                <div
                  className="text-xs font-semibold text-gurukul-ink"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  GURUKUL ACADEMY
                </div>
                <div className="text-[11px]" style={{ color: "var(--faint)" }}>
                  Official Student Intake Record
                </div>
              </div>
            )}
          </div>

          <div
            className="mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] shrink-0"
            style={{ borderColor: "var(--line)", color: "var(--faint)" }}
          >
            <span>Uploaded scan</span>
            <span className="font-medium" style={{ color: "var(--muted)" }}>
              Original Upload
            </span>
          </div>
        </div>

        {/* Right Column: Interactive Extracted Fields Form */}
        <div className="lg:col-span-6 p-5 bg-white flex flex-col h-full overflow-hidden justify-between">
          <div className="flex flex-col h-full min-h-0">
            <div
              className="flex items-center justify-between mb-3 pb-2 border-b shrink-0"
              style={{ borderColor: "var(--hover)" }}
            >
              <h3
                className="text-[11px] font-medium uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                Extracted Fields
              </h3>
              <span className="text-[11px]" style={{ color: "var(--faint)" }}>
                Edit inline
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {Object.entries(fields).map(([key, fieldData]) => {
                const label =
                  FIELD_LABELS[key] ||
                  key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (str) => str.toUpperCase());
                const isHighConfidence = fieldData.confidence >= 85;
                const isBlank =
                  !fieldData.value || fieldData.value.trim().length === 0;

                return (
                  <div
                    key={key}
                    className="p-2.5 rounded-lg border transition-colors"
                    style={
                      isBlank
                        ? {
                            borderColor: "rgba(183, 121, 31, 0.25)",
                            background: "var(--amber-soft)",
                          }
                        : isHighConfidence
                          ? {
                              borderColor: "var(--line)",
                              background: "var(--hover)",
                            }
                          : {
                              borderColor: "var(--line)",
                              background: "#ffffff",
                            }
                    }
                  >
                    <div className="flex items-center justify-between mb-1">
                      <label
                        className="text-[11px] font-medium flex items-center gap-1.5"
                        style={{ color: "var(--muted)" }}
                      >
                        <span>{label}</span>
                        {isBlank && (
                          <span
                            className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                            style={{
                              color: "var(--amber-text)",
                              background: "var(--amber-soft)",
                              border: "1px solid rgba(183, 121, 31, 0.25)",
                            }}
                          >
                            Needs input
                          </span>
                        )}
                      </label>

                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={
                          isBlank
                            ? {
                                background: "var(--amber-soft)",
                                color: "var(--amber-text)",
                              }
                            : isHighConfidence
                              ? {
                                  background: "var(--soft)",
                                  color: "var(--muted)",
                                }
                              : {
                                  background: "var(--hover)",
                                  color: "var(--faint)",
                                }
                        }
                      >
                        {isBlank
                          ? "Empty"
                          : isHighConfidence
                            ? `${fieldData.confidence}%`
                            : `${fieldData.confidence}%`}
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={fieldData.value}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        placeholder="[Not detected — enter manually]"
                        className="w-full text-xs py-1.5 px-2.5 rounded-md border transition-colors bg-white text-gurukul-ink focus:outline-none"
                        style={{
                          borderColor: isBlank
                            ? "rgba(183, 121, 31, 0.25)"
                            : "var(--line)",
                        }}
                      />
                      <Edit3
                        className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "var(--line-strong)" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="mt-3 pt-2.5 border-t flex items-center justify-between shrink-0"
            style={{ borderColor: "var(--hover)" }}
          >
            <p className="text-[11px]" style={{ color: "var(--faint)" }}>
              Review details, edit if needed, then approve.
            </p>
            <button
              onClick={handleApprove}
              className="btn-primary font-medium text-xs px-4 py-2 rounded-lg flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Approve & Create Record</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
