// src/components/Button.tsx

import { forwardRef } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'white' | 'black'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled,
    className = '',
    children,
    ...props
  },
  ref
) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg shadow-sm hover:shadow-md hover:-translate-y-px active:shadow-sm active:translate-y-0 transition-[color,background-color,border-color,box-shadow,transform] duration-150 focus-ring disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0'

  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-hover',
    secondary: 'bg-transparent text-primary border border-primary hover:bg-primary-light active:bg-primary-light',
    white: 'bg-white text-primary hover:bg-primary-light active:bg-primary-light',
    black: 'bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-800',
  }

  const sizes: Record<ButtonSize, string> = {
    sm: 'text-sm px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2',
  }

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  )
})

export default Button
