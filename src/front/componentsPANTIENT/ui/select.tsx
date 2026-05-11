import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            value,
            onValueChange,
            isOpen,
            setIsOpen
          } as any);
        }
        return child;
      })}
    </div>
  );
}

export function SelectTrigger({ children, isOpen, setIsOpen }: any) {
  return (
    <button
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''
      }`}
      onClick={() => setIsOpen(!isOpen)}
    >
      {children}
      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder: string }) {
  return <span className="text-slate-400">{placeholder}</span>;
}

export function SelectContent({ children, isOpen, setIsOpen, onValueChange }: any) {
  if (!isOpen) return null;

  return (
    <div className="absolute z-50 top-full mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
      <div className="p-1 max-h-60 overflow-auto">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              onValueChange,
              setIsOpen
            } as any);
          }
          return child;
        })}
      </div>
    </div>
  );
}

export function SelectItem({ children, value, onValueChange, setIsOpen }: any) {
  return (
    <div
      className="relative flex w-full cursor-pointer items-center rounded-md px-2 py-1.5 text-sm hover:bg-slate-100 transition-colors duration-150"
      onClick={() => {
        onValueChange(value);
        setIsOpen(false);
      }}
    >
      {children}
    </div>
  );
}