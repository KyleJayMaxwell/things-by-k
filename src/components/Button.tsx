// src/components/Button.tsx

import { forwardRef } from 'react'
import Spinner from './Spinner'

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

  // All variants share one black style for now (Kyle's call); kept separate so they can diverge later
  const solidBlack = 'bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-800'
  const variants: Record<ButtonVariant, string> = {
    primary: solidBlack,
    secondary: solidBlack,
    white: solidBlack,
    black: solidBlack,
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
      {loading && <Spinner />}
      {children}
    </button>
  )
})

export default Button
