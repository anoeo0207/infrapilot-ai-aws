"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import type { ExecutionResult } from "@/types/data"; // Đảm bảo bạn có type này

interface ExecutionResultViewerProps {
  result: ExecutionResult;
}

export function ExecutionResultViewer({ result }: ExecutionResultViewerProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Lấy danh sách các bước từ object `outputs`
  const steps = Object.entries(result.outputs || {});

  if (steps.length === 0) {
    return <p className="text-muted-foreground italic">No execution steps found in the result.</p>;
  }

  return (
    <div className="space-y-3">
      {steps.map(([stepId, stepResult], i) => (
        <div key={stepId} className="border rounded-xl overflow-hidden shadow-sm">
          <div
            onClick={() => setExpandedStep(expandedStep === stepId ? null : stepId)}
            className="p-4 bg-card hover:bg-muted/50 cursor-pointer flex items-start gap-4 border-l-4 border-l-green-500" // Màu xanh cho thành công
          >
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {i + 1}
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{stepId.replace(/[-_]/g, " ")}</h3> {/* Làm cho tên step dễ đọc hơn */}
              <p className="text-sm text-muted-foreground mt-1">
                Step executed successfully.
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs font-medium capitalize">
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground transition-transform ${
                expandedStep === stepId ? "rotate-180" : ""
              }`}
            />
          </div>

          {expandedStep === stepId && (
            <div className="border-t p-4 bg-muted/30">
              <h4 className="font-bold text-sm mb-2">Output Details</h4>
              <pre className="p-3 bg-background rounded-md border text-sm font-mono overflow-x-auto">
                <code>{JSON.stringify(stepResult, null, 2)}</code>
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}