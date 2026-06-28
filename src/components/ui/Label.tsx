import { LabelHTMLAttributes } from 'react';

export default function Label({ className = '', children, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`block text-sm font-medium text-gray-700 ${className}`} {...props}>
      {children}
    </label>
  );
}
