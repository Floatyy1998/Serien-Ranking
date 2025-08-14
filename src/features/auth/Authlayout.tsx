import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';
export const AuthLayout = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) => {
  return (
    <div className='w-full  bg-black text-white flex flex-col items-center px-4 py-8'>
      <Link to='/' className='mb-12'></Link>
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className='bg-gray-900/50 rounded-xl p-8 max-w-md w-full backdrop-blur-sm'
      >
        <h2 className='text-2xl font-semibold mb-6 text-center'>{title}</h2>
        {children}
      </motion.div>
    </div>
  );
};
