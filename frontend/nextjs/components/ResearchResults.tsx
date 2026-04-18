import React, { useState } from 'react';
import Question from './ResearchBlocks/Question';
import Report from './ResearchBlocks/Report';
import Sources from './ResearchBlocks/Sources';
import ImageSection from './ResearchBlocks/ImageSection';
import SubQuestions from './ResearchBlocks/elements/SubQuestions';
import LogsSection from './ResearchBlocks/LogsSection';
import AccessReport from './ResearchBlocks/AccessReport';
import PerplexityAnswer from './ResearchBlocks/PerplexityAnswer';
import { preprocessOrderedData } from '../utils/dataProcessing';
import { Data } from '../types/data';

interface ResearchResultsProps {
  orderedData: Data[];
  answer: string;
  allLogs: any[];
  chatBoxSettings: any;
  handleClickSuggestion: (value: string) => void;
  currentResearchId?: string;
  isProcessingChat?: boolean;
  onShareClick?: () => void;
}

export const ResearchResults: React.FC<ResearchResultsProps> = ({
  orderedData,
  answer,
  allLogs,
  chatBoxSettings,
  handleClickSuggestion,
  currentResearchId,
  isProcessingChat: _isProcessingChat = false,
  onShareClick
}) => {
  const [showFullReport, setShowFullReport] = useState(false);
  const groupedData = preprocessOrderedData(orderedData);
  const pathData = groupedData.find(data => data.type === 'path');
  const initialQuestion = groupedData.find(data => data.type === 'question');

  const chatComponents = groupedData
    .filter(data => {
      if (data.type === 'question' && data === initialQuestion) {
        return false;
      }
      return (data.type === 'question' || data.type === 'chat');
    })
    .map((data, index) => {
      if (data.type === 'question') {
        return <Question key={`question-${index}`} question={data.content} />;
      } else {
        return <Report key={`chat-${index}`} answer={data.content} />;
      }
    });

  const imageComponents = groupedData
    .filter(data => data.type === 'imagesBlock')
    .map((data, index) => (
      <ImageSection key={`images-${index}-${data.metadata?.length || 0}`} metadata={data.metadata} />
    ));

  const finalReport = groupedData
    .filter(data => data.type === 'reportBlock')
    .pop();

  const subqueriesComponent = groupedData.find(data => data.content === 'subqueries');

  // Perplexity response (new structured answer)
  const perplexityBlock = groupedData.find(data => data.type === 'perplexityResponseBlock');

  // Collect all sources for the Perplexity component
  const allSources = groupedData
    .filter(data => data.type === 'sourceBlock')
    .flatMap((data: any) => data.items || []);

  return (
    <>
      {initialQuestion && <Question question={initialQuestion.content} />}
      {orderedData.length > 0 && <LogsSection logs={allLogs} />}
      {subqueriesComponent && (
        <SubQuestions
          metadata={subqueriesComponent.metadata}
          handleClickSuggestion={handleClickSuggestion}
        />
      )}

      {imageComponents}

      {/* Perplexity-style answer (primary view after research completes) */}
      {perplexityBlock ? (
        <>
          <PerplexityAnswer
            data={(perplexityBlock as any).output}
            sources={allSources}
            onFollowUp={handleClickSuggestion}
          />

          {/* Full report collapsible */}
          {finalReport && (
            <div className="container rounded-lg border border-solid border-gray-700/30 bg-black/20 backdrop-blur-md overflow-hidden">
              <button
                onClick={() => setShowFullReport(v => !v)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Full Research Report
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  className={`transition-transform duration-200 ${showFullReport ? 'rotate-180' : ''}`}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showFullReport && (
                <div className="px-5 pb-5">
                  <Report answer={finalReport.content} researchId={currentResearchId} />
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Fallback: show old sources + report while perplexity response is loading */
        <>
          {groupedData
            .filter(data => data.type === 'sourceBlock')
            .map((data, index) => (
              <Sources key={`sourceBlock-${index}`} sources={(data as any).items} />
            ))}
          {finalReport && <Report answer={finalReport.content} researchId={currentResearchId} />}
        </>
      )}

      {pathData && (
        <AccessReport
          accessData={(pathData as any).output}
          report={answer}
          chatBoxSettings={chatBoxSettings}
          onShareClick={onShareClick}
        />
      )}
      {chatComponents}
    </>
  );
};
