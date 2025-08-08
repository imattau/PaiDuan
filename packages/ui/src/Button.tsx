import React from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button: React.FC<ButtonProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <button className={`btn ${className}`} {...props}>
      {children}
    </button>
  );
};
