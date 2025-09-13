"use client";

import { useState } from 'react';
import { Artifact } from '@/lib/orchestrator';
import { downloadArtifactsAsMarkdown, copyArtifactsToClipboard, getExportStats } from '@/lib/export';

interface ExportButtonProps {
  artifacts: Record<string, Artifact>;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showStats?: boolean;
}

export default function ExportButton({ 
  artifacts, 
  className = '',
  variant = 'primary',
  size = 'md',
  showStats = false
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const stats = getExportStats(artifacts);
  const hasArtifacts = Object.keys(artifacts).length > 0;

  const handleDownload = async () => {
    if (!hasArtifacts) return;
    
    setIsExporting(true);
    try {
      downloadArtifactsAsMarkdown(artifacts);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setShowDropdown(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!hasArtifacts) return;
    
    setIsExporting(true);
    try {
      const success = await copyArtifactsToClipboard(artifacts);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (error) {
      console.error('Copy failed:', error);
    } finally {
      setIsExporting(false);
      setShowDropdown(false);
    }
  };

  // Style variants
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${variants[variant]}
    ${sizes[size]}
    ${className}
  `;

  if (!hasArtifacts) {
    return (
      <button
        disabled
        className={baseClasses}
        title="No artifacts to export"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Pack
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Main Export Button */}
      <button
        onClick={handleDownload}
        disabled={isExporting}
        className={baseClasses}
        title={`Export ${stats.totalArtifacts} artifacts as Markdown`}
      >
        {isExporting ? (
          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {isExporting ? 'Exporting...' : 'Export Pack'}
      </button>

      {/* Dropdown Toggle */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`
          ml-1 px-2 py-2 rounded-r-lg border-l border-opacity-20
          ${variants[variant]} ${variant === 'outline' ? 'border-gray-300' : 'border-white'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
        title="More export options"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-100">
            <h4 className="font-medium text-gray-900">Export Options</h4>
            {showStats && (
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <div>{stats.totalArtifacts} artifacts • {stats.totalWords} words</div>
                <div>~{stats.estimatedReadTime} min read</div>
              </div>
            )}
          </div>
          
          <div className="p-1">
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download as Markdown
            </button>
            
            <button
              onClick={handleCopyToClipboard}
              disabled={isExporting}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
            >
              {copySuccess ? (
                <svg className="w-4 h-4 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
          
          <div className="p-3 border-t border-gray-100 text-xs text-gray-500">
            File will be saved as "Startup-Kickoff-Pack.md"
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
