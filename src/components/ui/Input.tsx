import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={`block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400
          shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0
          ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'}
          disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  ),
);
Input.displayName = 'Input';

export default Input;
