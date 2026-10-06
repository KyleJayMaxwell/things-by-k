'use client'

// src/components/TextField.tsx
// Labeled input that shows its error once the person has left the field

import { useState } from 'react'

export const inputClass =
  'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors bg-white'

export function inputBorder(showError: boolean) {
  return showError
    ? 'border-error focus:ring-error/20 focus:border-error'
    : 'border-border focus:ring-primary/30 focus:border-primary'
}

// Tracks whether a field has been left, so errors don't shout while someone is still typing
export function useTouched() {
  const [touched, setTouched] = useState(false)
  return { touched, onBlur: () => setTouched(true) }
}

export function FieldMessage({ id, error, hint }: { id: string; error?: string | null; hint?: string }) {
  if (error) return <p id={id} className="mt-1.5 text-xs text-error">{error}</p>
  if (hint) return <p id={id} className="mt-1.5 text-xs text-text-secondary">{hint}</p>
  return null
}

interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null  // shown after the field is left
  hint?: string
}

export default function TextField({ id, label, value, onChange, error, hint, className = '', ...props }: TextFieldProps) {
  const { touched, onBlur } = useTouched()
  const showError = touched && !!error
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text-primary mb-1.5">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={showError}
        aria-describedby={showError || hint ? `${id}-message` : undefined}
        className={`${inputClass} ${inputBorder(showError)} ${className}`}
        {...props}
      />
      <FieldMessage id={`${id}-message`} error={showError ? error : null} hint={hint} />
    </div>
  )
}
