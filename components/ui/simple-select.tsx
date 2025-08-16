import React from 'react';

interface SimpleSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function SimpleSelect({ value, onValueChange, children, className }: SimpleSelectProps) {
  return (
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)}
      className={`w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 ${className}`}
    >
      {children}
    </select>
  );
}

export function SimpleSelectContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function SimpleSelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>;
}

export function SimpleSelectTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function SimpleSelectValue() {
  return null;
}
