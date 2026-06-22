"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Copy, FileSpreadsheet, Database, FileText, ChevronDown } from 'lucide-react';

export interface ColumnOption {
  key: string;
  label: string;
}

interface TableToolbarProps {
  totalEntries: number;
  filteredEntriesCount: number;
  currentPage: number;
  pageSize: number; // -1 for ALL
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
  
  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  // Actions
  columns: ColumnOption[];
  visibleColumns: string[]; // List of visible column keys
  onVisibleColumnsChange: (visible: string[]) => void;
  onCopyData: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
}

export default function TableToolbar({
  totalEntries,
  filteredEntriesCount,
  currentPage,
  pageSize,
  onPageSizeChange,
  onPageChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  columns,
  visibleColumns,
  onVisibleColumnsChange,
  onCopyData,
  onExportExcel,
  onExportCSV
}: TableToolbarProps) {
  const [showLengthDropdown, setShowLengthDropdown] = useState(false);
  const [showColvisDropdown, setShowColvisDropdown] = useState(false);
  const lengthRef = useRef<HTMLDivElement>(null);
  const colvisRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (lengthRef.current && !lengthRef.current.contains(event.target as Node)) {
        setShowLengthDropdown(false);
      }
      if (colvisRef.current && !colvisRef.current.contains(event.target as Node)) {
        setShowColvisDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredEntriesCount / pageSize) || 1;
  const startEntry = filteredEntriesCount === 0 ? 0 : pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1;
  const endEntry = pageSize === -1 ? filteredEntriesCount : Math.min(currentPage * pageSize, filteredEntriesCount);

  const lengthOptions = [5, 10, 25, 50, -1];

  const handleLengthSelect = (size: number) => {
    onPageSizeChange(size);
    setShowLengthDropdown(false);
  };

  const toggleColumn = (key: string) => {
    if (visibleColumns.includes(key)) {
      // Keep at least one column visible
      if (visibleColumns.length > 1) {
        onVisibleColumnsChange(visibleColumns.filter(c => c !== key));
      }
    } else {
      onVisibleColumnsChange([...visibleColumns, key]);
    }
  };

  const getLengthLabel = (size: number) => {
    return size === -1 ? "Show all rows" : `Show ${size} rows`;
  };

  return (
    <div className="space-y-4 no-print select-none">
      {/* Buttons and Search container */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full border-b border-slate-800/60 pb-3">
        {/* Buttons Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Show rows length menu */}
          <div className="relative" ref={lengthRef}>
            <button
              type="button"
              onClick={() => setShowLengthDropdown(!showLengthDropdown)}
              className="px-3 h-8 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none"
            >
              <span>{getLengthLabel(pageSize)}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>
            {showLengthDropdown && (
              <div className="absolute left-0 mt-1 w-40 bg-slate-950 border border-slate-800 shadow-2xl rounded-lg py-1 z-50 animate-fadeIn">
                {lengthOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleLengthSelect(opt)}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-slate-850 hover:text-white ${
                      pageSize === opt ? 'text-blue-400 font-bold bg-blue-500/5' : 'text-slate-350'
                    }`}
                  >
                    {getLengthLabel(opt)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Colvis Column Visibility */}
          <div className="relative" ref={colvisRef}>
            <button
              type="button"
              onClick={() => setShowColvisDropdown(!showColvisDropdown)}
              className="w-8 h-8 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg flex items-center justify-center transition-colors cursor-pointer focus:outline-none"
              title="Column Visibility"
            >
              <Search size={14} className="text-blue-500 stroke-[3px]" />
            </button>
            {showColvisDropdown && (
              <div className="absolute left-0 mt-1 w-48 bg-slate-950 border border-slate-800 shadow-2xl rounded-lg py-1.5 z-50 max-h-60 overflow-y-auto animate-fadeIn">
                <div className="px-3 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-900 mb-1.5">
                  Select Columns
                </div>
                {columns.map(col => {
                  const isVisible = visibleColumns.includes(col.key);
                  return (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 px-3 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-850 cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded border-slate-800 bg-slate-900 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span>{col.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Copy Button */}
          <button
            type="button"
            onClick={onCopyData}
            className="w-8 h-8 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg flex items-center justify-center transition-colors cursor-pointer focus:outline-none"
            title="Copy Table"
          >
            <Copy size={14} className="text-fuchsia-500" />
          </button>

          {/* Excel Button */}
          <button
            type="button"
            onClick={onExportExcel}
            className="w-8 h-8 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg flex items-center justify-center transition-colors cursor-pointer focus:outline-none"
            title="Excel Export"
          >
            <FileSpreadsheet size={14} className="text-emerald-500" />
          </button>

          {/* CSV Database Button */}
          <button
            type="button"
            onClick={onExportCSV}
            className="w-8 h-8 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg flex items-center justify-center transition-colors cursor-pointer focus:outline-none"
            title="CSV Export"
          >
            <Database size={14} className="text-orange-500" />
          </button>

          {/* PDF / Print Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="w-8 h-8 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg flex items-center justify-center transition-colors cursor-pointer focus:outline-none"
            title="Print Table"
          >
            <FileText size={14} className="text-rose-500" />
          </button>
        </div>

        {/* Search Right Section */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 select-none">
          <label className="text-xs font-semibold text-slate-400" htmlFor="table-search">Search:</label>
          <input
            id="table-search"
            type="text"
            className="w-full md:w-56 h-8 px-3 bg-slate-950 border border-slate-800 focus:border-blue-500/80 focus:outline-none rounded-lg text-xs text-white placeholder-slate-650 transition-colors"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// Reusable entry counter and pagination footer component
interface TableFooterProps {
  filteredEntriesCount: number;
  totalEntries: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function TableFooter({
  filteredEntriesCount,
  totalEntries,
  currentPage,
  pageSize,
  onPageChange
}: TableFooterProps) {
  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredEntriesCount / pageSize) || 1;
  const startEntry = filteredEntriesCount === 0 ? 0 : pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1;
  const endEntry = pageSize === -1 ? filteredEntriesCount : Math.min(currentPage * pageSize, filteredEntriesCount);

  return (
    <div className="py-3 px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 select-none no-print border-t border-slate-800/40 bg-slate-900/10">
      <div>
        Showing {startEntry} to {endEntry} of {filteredEntriesCount} entries
        {filteredEntriesCount !== totalEntries && ` (filtered from ${totalEntries} total entries)`}
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3 py-1 bg-slate-800/50 border border-slate-700/60 rounded text-xs font-semibold text-slate-350 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-slate-800/50 disabled:hover:text-slate-355 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
          >
            Previous
          </button>
          
          <span className="px-3 py-1 bg-blue-600 border border-blue-500/35 rounded text-xs font-bold text-white shadow-sm shadow-blue-500/10">
            {currentPage}
          </span>
          
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3 py-1 bg-slate-800/50 border border-slate-700/60 rounded text-xs font-semibold text-slate-350 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-slate-800/50 disabled:hover:text-slate-355 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
