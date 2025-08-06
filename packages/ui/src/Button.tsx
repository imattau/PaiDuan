import React from 'react';

export interface ButtonProps {
  label?: string;
}

export const Button: React.FC<ButtonProps> = ({ label = 'Shared Button' }) => {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded">{label}</button>
  );
};
