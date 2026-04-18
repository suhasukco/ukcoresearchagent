"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { markdownToHtml } from "../../helpers/markdownHelper";

interface PerplexityData {
  answer: string;
  key_points: string[];
  follow_up_questions: string[];
  confidence: "high" | "medium" | "low";
}

interface Source {
  name: string;
  url: string;
}

interface PerplexityAnswerProps {
  data: PerplexityData;
  sources: Source[];
  onFollowUp?: (question: string) => void;
}

const confidenceConfig = {
  high: { label: "High confidence", color: "text-green-400", dot: "bg-green-400" },
  medium: { label: "Medium confidence", color: "text-yellow-400", dot: "bg-yellow-400" },
  low: { label: "Low confidence", color: "text-red-400", dot: "bg-red-400" },
};

export default function PerplexityAnswer({ data, sources, onFollowUp }: PerplexityAnswerProps) {
  const [answerHtml, setAnswerHtml] = useState("");

  useEffect(() => {
    if (data?.answer) {
      // Replace [n] with citation spans before converting to HTML
      const withCitations = data.answer.replace(/\[(\d+)\]/g, (_, num) => {
        const idx = parseInt(num) - 1;
        const src = sources[idx];
        const url = src?.url || "#";
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="ukco-citation">[${num}]</a>`;
      });
      markdownToHtml(withCitations).then(setAnswerHtml);
    }
  }, [data?.answer, sources]);

  if (!data) return null;

  const conf = confidenceConfig[data.confidence] || confidenceConfig.medium;

  return (
    <div className="container w-full bg-black/30 backdrop-blur-md shadow-lg rounded-lg border border-solid border-gray-700/40 p-5 space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
            <span className="text-white text-xs font-bold">U</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">UKCOResearcher</span>
          <span className="flex items-center gap-1 text-xs ml-1">
            <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
            <span className={conf.color}>{conf.label}</span>
          </span>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(data.answer);
            toast("Answer copied to clipboard", { icon: "✂️" });
          }}
          title="Copy answer"
          className="text-gray-500 hover:text-white transition-colors p-1 rounded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {/* Answer text */}
      <div
        className="text-gray-100 text-[15px] leading-[1.75] markdown-content prose prose-invert max-w-none prose-p:my-2 prose-strong:text-white [&_.ukco-citation]:inline-flex [&_.ukco-citation]:items-center [&_.ukco-citation]:justify-center [&_.ukco-citation]:w-5 [&_.ukco-citation]:h-5 [&_.ukco-citation]:rounded-full [&_.ukco-citation]:bg-teal-900/70 [&_.ukco-citation]:text-teal-300 [&_.ukco-citation]:text-[10px] [&_.ukco-citation]:font-semibold [&_.ukco-citation]:no-underline [&_.ukco-citation]:hover:bg-teal-700/70 [&_.ukco-citation]:transition-colors [&_.ukco-citation]:mx-0.5 [&_.ukco-citation]:align-middle [&_.ukco-citation]:cursor-pointer"
        dangerouslySetInnerHTML={{
          __html:
            answerHtml ||
            '<div class="space-y-2 animate-pulse"><div class="h-4 bg-gray-700/40 rounded w-full"/><div class="h-4 bg-gray-700/40 rounded w-5/6"/><div class="h-4 bg-gray-700/40 rounded w-4/5"/><div class="h-4 bg-gray-700/40 rounded w-full"/></div>',
        }}
      />

      {/* Key points */}
      {data.key_points?.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-gray-700/30">
          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Key Findings</h4>
          <ul className="space-y-1.5">
            {data.key_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="mt-[7px] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span
                  dangerouslySetInnerHTML={{
                    __html: point.replace(
                      /\[(\d+)\]/g,
                      '<span class="text-teal-400 text-xs font-medium">[$1]</span>'
                    ),
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources */}
      {sources?.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-gray-700/30">
          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            Sources ({sources.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {sources.slice(0, 10).map((src, i) => {
              let domain = src.name;
              try {
                domain = new URL(src.url).hostname.replace("www.", "");
              } catch {}
              return (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={src.name}
                  className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/60 hover:bg-gray-700/70 rounded border border-gray-700/40 text-xs text-gray-300 hover:text-teal-300 transition-colors"
                >
                  <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-teal-900/60 text-teal-400 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="max-w-[120px] truncate">{domain}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Follow-up questions */}
      {data.follow_up_questions?.length > 0 && onFollowUp && (
        <div className="space-y-2 pt-1 border-t border-gray-700/30">
          <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            Related Research
          </h4>
          <div className="flex flex-col gap-1.5">
            {data.follow_up_questions.map((q, i) => (
              <button
                key={i}
                onClick={() => onFollowUp(q)}
                className="flex items-center gap-2 text-left text-sm text-gray-400 hover:text-teal-300 group transition-colors py-0.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className="flex-shrink-0 text-teal-700 group-hover:text-teal-400 transition-colors"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
