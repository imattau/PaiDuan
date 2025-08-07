import React from 'react';
import { motion } from 'framer-motion';

interface UploadButtonProps {
  onClick: () => void;
  isOpen?: boolean;
}

export const UploadButton: React.FC<UploadButtonProps> = ({ onClick, isOpen }) => {
  if (isOpen) return null;
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-brand to-purple-600 text-white shadow-xl lg:hidden"
      onClick={onClick}
    >
      +
    </motion.button>
  );
};

export default UploadButton;
