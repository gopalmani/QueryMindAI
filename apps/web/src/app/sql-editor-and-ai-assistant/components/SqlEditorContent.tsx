'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  CheckCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  Zap,
  ArrowRight,
  BrainCircuit
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';

const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'INNER', 'ON', 'GROUP', 'BY', 'ORDER', 'LIMIT', 'AS', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'CASE', 'WHEN', 'THEN', 'END', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'ROUND', 'DATE_TRUNC', 'INTERVAL', 'NULLIF', 'NOW', 'BETWEEN', 'WITH', 'INSERT', 'UPDATE', 'DELETE', 'HAVING', 'UNION', 'ALL', 'CURRENT_DATE'];

function syntaxHighlight(sql: string): React.ReactNode[] {
  const lines = sql.split('\n');
  return lines.map((line, li) => {
    const parts = line.split(/(\s+|[(),;])/);
    return (
      <div key={`line-${li + 1}`} className="flex">
        <span className="select-none w-8 text-right pr-4 flex-shrink-0 text-gray-400 text-sm">
          {li + 1}
        </span>
        <span className="flex-1">
          {parts.map((part, pi) => {
            if (keywords.includes(part.toUpperCase())) {
              return <span key={`p-${li}-${pi}`} className="font-semibold text-blue-600">{part}</span>;
            }
            if (/^'[^']*'$/.test(part)) {
              return <span key={`p-${li}-${pi}`} className="text-orange-500">{part}</span>;
            }
            if (/^\d+(\.\d+)?$/.test(part)) {
              return <span key={`p-${li}-${pi}`} className="text-purple-600">{part}</span>;
            }
            return <span key={`p-${li}-${pi}`} className="text-gray-700">{part}</span>;
          })}
        </span>
      </div>
    );
  });
}

export default function SQLEditorContent() {
  // Input State
  const [prompt, setPrompt] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  
  // Pipeline State
  const [isRunning, setIsRunning] = useState(false);
  const [isSavingExample, setIsSavingExample] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  
  // Data State
  const [generatedSql, setGeneratedSql] = useState('-- Ask the AI to generate SQL...');
  const [queryResults, setQueryResults] = useState<Array<Record<string, unknown>>>([]);
  const [explanation, setExplanation] = useState('Enter a natural language prompt to generate a query, retrieve data, and see the explanation here.');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const totalRows = queryResults.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  // Handle Pipeline Execution
  const handleGenerateAndRun = async () => {
    if (!prompt.trim()) return;
    setIsRunning(true);
    setLastQuestion(prompt);
    setErrorMessage('');
    setWarnings([]);

    try {
      const data = await api.executeQuery(prompt);
      setGeneratedSql(data.sql);
      setQueryResults(data.rows || []);
      setExplanation(data.explanation || 'Query generated successfully.');
      setWarnings(data.warnings || []);
      setHasResults(true);
      setCurrentPage(1);
    } catch (error) {
      setGeneratedSql('-- Error generating SQL. Check connection.');
      const message = error instanceof ApiError ? error.message : 'The pipeline failed to generate or execute the query.';
      setExplanation(message);
      setErrorMessage(message);
      setQueryResults([]);
      setHasResults(false);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveVerifiedExample = async () => {
    if (!lastQuestion || !generatedSql) {
      alert("Please generate a query first.");
      return;
    }
    setIsSavingExample(true);
    try {
      await api.saveVerifiedExample(lastQuestion, generatedSql);
      alert('Verified example saved for semantic retrieval.');
    } catch (error) {
      alert(error instanceof ApiError ? error.message : 'Failed to save verified example.');
    } finally {
      setIsSavingExample(false);
    }
  };

  // Pagination slice
  const paginatedResults = queryResults.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">AI Query Assistant</h1>
        <p className="text-sm text-gray-500 mt-1">Ask questions, not SQL. Generated queries are validated before execution.</p>
      </div>
      {errorMessage && <div role="alert" className="mx-8 mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>}

      {/* AI Prompt Bar */}
      <div className="px-8 pb-6 flex-shrink-0">
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
          <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateAndRun()}
            placeholder="e.g., Show me the top 10 customers by revenue last month"
            className="flex-1 text-sm text-gray-600 placeholder-gray-400 bg-transparent outline-none"
          />
          <button 
            onClick={handleGenerateAndRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex-shrink-0"
          >
            {isRunning ? 'Processing...' : 'Generate & Run'}
            {!isRunning && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main two-column area */}
      <div className="px-8 pb-6 flex gap-5 flex-shrink-0">
        {/* SQL Editor Panel */}
        <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Editor header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 tracking-widest uppercase">Generated SQL · PostgreSQL</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs text-gray-600 font-medium">demo_ecom_db</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigator.clipboard.writeText(generatedSql)}
                title="Copy SQL"
                className="p-1.5 rounded-md hover:bg-gray-200 transition-colors text-gray-500"
              >
                <Copy className="w-4 h-4" />
              </button>
              
              {/* NEW TRAIN AI BUTTON */}
              <button 
                onClick={handleSaveVerifiedExample}
                disabled={isSavingExample || !hasResults}
                title="Approve as verified example"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors text-xs font-semibold ml-2 disabled:opacity-50"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                {isSavingExample ? 'Saving...' : 'Approve as verified example'}
              </button>
            </div>
          </div>

          {/* Code area - Made editable */}
          <div className="relative flex-1 bg-white min-h-[260px]">
            <textarea
              value={generatedSql}
              onChange={(e) => setGeneratedSql(e.target.value)}
              className="absolute inset-0 w-full h-full p-4 font-mono text-sm leading-relaxed bg-transparent text-transparent caret-gray-800 resize-none focus:outline-none z-10"
              spellCheck={false}
            />
            <div className="absolute inset-0 pointer-events-none p-4 font-mono text-sm leading-relaxed z-0 overflow-hidden">
              {syntaxHighlight(generatedSql)}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4">
          {/* Query Explanation */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="text-base">💡</span>
              </div>
              <span className="text-sm font-semibold text-gray-800">Explanation</span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {explanation}
            </p>
          </div>

          {/* Instructions Block */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Feedback Loop</p>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-xs font-semibold text-gray-800">Correct the AI</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">Review the generated SQL. If you correct it, save the approved prompt/SQL pair as a <b>Verified Example</b>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Query Results */}
      {hasResults && (
        <div className="px-8 pb-8 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Results header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-800">Query Results</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Returned {totalRows} rows</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-500">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dynamic Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {queryResults.length > 0 && Object.keys(queryResults[0]).map((col) => (
                      <th key={col} className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedResults.map((row, i) => (
                    <tr key={`row-${i}`} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      {Object.values(row).map((val, vi) => (
                        <td key={`cell-${i}-${vi}`} className="px-6 py-4 text-sm text-gray-700 font-mono">
                          {val !== null ? String(val) : <span className="text-gray-400 italic">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {queryResults.length === 0 && (
                    <tr>
                      <td className="px-6 py-8 text-center text-sm text-gray-500">No data returned by query.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalRows > 0 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalRows)} of {totalRows} rows
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 transition-colors text-gray-500"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-40 transition-colors text-gray-500"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {warnings.length > 0 && <div className="mx-8 mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{warnings.join(' ')}</div>}
    </div>
  );
}
