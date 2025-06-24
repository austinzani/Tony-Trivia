import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';

export interface TableProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export const Table: React.FC<TableProps> = ({
  children,
  className,
  animate = false,
}) => {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      <table className={cn('w-full divide-y divide-gray-200', className)}>
        {children}
      </table>
    </div>
  );
};

export interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  className,
}) => {
  return (
    <thead className={cn('bg-gray-50', className)}>
      {children}
    </thead>
  );
};

export interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const TableBody: React.FC<TableBodyProps> = ({
  children,
  className,
}) => {
  return (
    <tbody className={cn('bg-white divide-y divide-gray-200', className)}>
      {children}
    </tbody>
  );
};

export interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  selected?: boolean;
  animate?: boolean;
  index?: number;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  className,
  onClick,
  hoverable = true,
  selected = false,
  animate = false,
  index = 0,
}) => {
  const Component = animate ? motion.tr : 'tr';
  const animationProps = animate
    ? {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        transition: { delay: index * 0.05 },
      }
    : {};

  return (
    <Component
      className={cn(
        'transition-colors',
        hoverable && 'hover:bg-gray-50',
        selected && 'bg-electric-50',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...animationProps}
    >
      {children}
    </Component>
  );
};

export interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  variant?: 'default' | 'header';
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className,
  align = 'left',
  variant = 'default',
}) => {
  const Component = variant === 'header' ? 'th' : 'td';
  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <Component
      className={cn(
        'px-6 py-4 whitespace-nowrap',
        alignmentClasses[align],
        variant === 'header'
          ? 'text-xs font-medium text-gray-500 uppercase tracking-wider'
          : 'text-sm text-gray-900',
        className
      )}
    >
      {children}
    </Component>
  );
};