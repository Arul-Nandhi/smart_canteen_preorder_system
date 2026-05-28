import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function DataTable({
  columns,
  data = [],
  searchable = true,
  searchFields = [],
  itemsPerPage = 10,
  onRowClick,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm || !searchable) return data;
    return data.filter(row =>
      searchFields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], row);
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, searchable, searchFields]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Search Bar */}
      {searchable && (
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-text-3" size={20} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-border rounded-lg text-text-1 placeholder-text-3 focus:outline-none focus:border-lime-main transition"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-2 border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-4 text-left text-sm font-semibold text-text-2 whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick?.(row)}
                  className="border-b border-border hover:bg-surface-2 transition cursor-pointer"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-6 py-4 text-sm text-text-1"
                    >
                      {col.render ? col.render(row) : row[col.key] || '-'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-text-3">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredData.length > itemsPerPage && (
        <div className="p-4 border-t border-border flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <p className="text-sm text-text-3">
            Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, filteredData.length)} of {filteredData.length}
          </p>
          <div className="flex gap-2" style={{ alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded bg-surface-2 text-text-2 disabled:opacity-50 transition"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center" style={{ gap: '4px' }}>
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                // Only show a window of pages around current
                if (Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className="transition"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--r-sm)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: currentPage === page ? 'var(--teal)' : 'var(--surface-2)',
                      color: currentPage === page ? '#0B0F14' : 'var(--text-2)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded bg-surface-2 text-text-2 disabled:opacity-50 transition"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
