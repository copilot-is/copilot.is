'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  className
}: OtpInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  React.useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const focusInput = (index: number) => {
    const targetIndex = Math.max(0, Math.min(index, length - 1));
    inputRefs.current[targetIndex]?.focus();
  };

  const handleChange = (index: number, char: string) => {
    // Only allow digits
    const digit = char.replace(/\D/g, '').slice(-1);

    const newValue = value.split('');
    newValue[index] = digit;
    const result = newValue.join('').slice(0, length);
    onChange(result);

    // Move to next input if digit entered
    if (digit && index < length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newValue = value.split('');
      if (value[index]) {
        // Clear current input
        newValue[index] = '';
        onChange(newValue.join(''));
      } else if (index > 0) {
        // Move to previous input and clear it
        newValue[index - 1] = '';
        onChange(newValue.join(''));
        focusInput(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focusInput(index + 1);
    } else if (e.key === 'Delete') {
      e.preventDefault();
      const newValue = value.split('');
      newValue[index] = '';
      onChange(newValue.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, length);
    onChange(pastedData);

    // Focus on the next empty input or last input
    const nextIndex = Math.min(pastedData.length, length - 1);
    focusInput(nextIndex);
  };

  const handleClick = (index: number) => {
    // Focus on clicked input or the first empty one
    const firstEmpty = value.length;
    const targetIndex = Math.min(index, firstEmpty, length - 1);
    focusInput(targetIndex);
  };

  return (
    <div className={cn('flex justify-center gap-2', className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={el => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          value={value[index] || ''}
          onChange={e => handleChange(index, e.target.value)}
          onKeyDown={e => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onClick={() => handleClick(index)}
          disabled={disabled}
          className={cn(
            'size-12 rounded-md border border-input bg-background text-center text-xl font-semibold',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-150'
          )}
          maxLength={1}
        />
      ))}
    </div>
  );
}
