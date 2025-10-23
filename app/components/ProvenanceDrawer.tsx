"use client";

import { useState } from "react";
import { X, FileText, ArrowRight, Clock, CheckCircle } from "lucide-react";
import { SourceAttribution } from "@/types";

interface ProvenanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  attribution: SourceAttribution;
}

export default function ProvenanceDrawer({
  isOpen,
  onClose,
  attribution,
}: ProvenanceDrawerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Source Provenance
                </h2>
                <p className="text-sm text-gray-600">
                  Trace care plan statements back to patient record sources
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {attribution && attribution.sections ? (
              <div className="space-y-6">
                {attribution.sections.map((section, sectionIndex) => (
                  <div
                    key={sectionIndex}
                    className="border border-gray-200 rounded-lg"
                  >
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(section.section)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {sectionIndex + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {section.section}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {section.statements.length} statement
                            {section.statements.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedSections.has(section.section)
                            ? "rotate-90"
                            : ""
                        }`}
                      />
                    </button>

                    {/* Section Content */}
                    {expandedSections.has(section.section) && (
                      <div className="border-t border-gray-200 p-4 space-y-4">
                        {section.statements.map((statement, statementIndex) => (
                          <div
                            key={statementIndex}
                            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-semibold text-green-600">
                                  {statementIndex + 1}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-2">
                                  Care Plan Statement
                                </h4>
                                <p className="text-gray-800 mb-3 italic">
                                  "{statement.statement}"
                                </p>

                                <div>
                                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Supporting Sources (
                                    {statement.sources.length})
                                  </h5>
                                  <div className="bg-white border border-gray-200 rounded-md p-3 text-sm">
                                    <ul className="space-y-1">
                                      {statement.sources.map(
                                        (source, sourceIndex) => (
                                          <li
                                            key={sourceIndex}
                                            className="text-gray-800"
                                          >
                                            {source}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Source Attribution Available
                </h3>
                <p className="text-gray-600">
                  Source attribution is still being generated or is not
                  available for this care plan.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {attribution && (
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Generated: {formatDate(attribution.generated_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Model: {attribution.model_used}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
