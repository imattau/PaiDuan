import React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', children, ...props }, ref) => (
    <button ref={ref} className={`btn ${className}`} {...props}>
      {children}
    </button>
  )
);

Button.displayName = 'Button';
