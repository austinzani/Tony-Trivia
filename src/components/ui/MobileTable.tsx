import React from 'react';
import { motion } from 'framer-motion';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  mobileHide?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

interface MobileTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
  cardView?: boolean;
}

function MobileTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
  className = '',
  cardView = true,
}: MobileTableProps<T>) {
  // Sort columns by priority for mobile display
  const sortedColumns = [...columns].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority || 'medium'];
    const bPriority = priorityOrder[b.priority || 'medium'];
    return aPriority - bPriority;
  });

  const visibleColumns = sortedColumns.filter(col => !col.mobileHide);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Card view for mobile (default)
  if (cardView) {
    return (
      <div className={`space-y-3 ${className}`}>
        {data.map((item, index) => (
          <motion.div
            key={keyExtractor(item)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onRowClick?.(item)}
            className={`
              bg-white rounded-card p-4 shadow-game border border-gray-100
              ${onRowClick ? 'cursor-pointer hover:shadow-game-hover hover:border-electric-200 transition-all' : ''}
            `}
          >
            {visibleColumns.map((column, colIndex) => {
              const value = column.render 
                ? column.render(item) 
                : (item as any)[column.key];
              
              return (
                <div
                  key={`${keyExtractor(item)}-${column.key}`}
                  className={`
                    ${colIndex > 0 ? 'mt-3' : ''}
                    ${column.priority === 'high' ? 'text-base font-semibold' : 'text-sm'}
                  `}
                >
                  <span className="text-gray-500 text-xs uppercase tracking-wide">
                    {column.header}
                  </span>
                  <div className="mt-1">
                    {value}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ))}
      </div>
    );
  }

  // Traditional table view (for tablets/desktop)
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key as string}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={`
                ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              `}
            >
              {columns.map((column) => (
                <td
                  key={`${keyExtractor(item)}-${column.key}`}
                  className="px-6 py-4 whitespace-nowrap text-sm"
                >
                  {column.render 
                    ? column.render(item) 
                    : (item as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MobileTable;