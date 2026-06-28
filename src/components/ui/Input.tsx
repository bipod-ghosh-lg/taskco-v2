import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={`block w-full rounded-lg border px-3 py-2 text-sm text-heading placeholder-muted
          shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0
          ${error ? 'border-danger focus:ring-danger' : 'border-border-input'}
          disabled:cursor-not-allowed disabled:bg-page disabled:text-muted ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

export default Input;
