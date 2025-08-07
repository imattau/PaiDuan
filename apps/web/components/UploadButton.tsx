import React from 'react';

interface UploadButtonProps {
  onClick: () => void;
}

export const UploadButton: React.FC<UploadButtonProps> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="fixed bottom-8 right-8 z-50 rounded-full bg-accent p-4 text-white shadow-lg"
  >
    +
  </button>
);

export default UploadButton;
