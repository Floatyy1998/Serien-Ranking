import { motion } from 'framer-motion';
import { List, Star, Tv } from 'lucide-react';
import { Link } from 'react-router-dom';
const StartPage = () => {
  const container = {
    hidden: {
      opacity: 0,
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  const item = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    show: {
      opacity: 1,
      y: 0,
    },
  };
  return (
    <div className='w-full  bg-black text-white flex flex-col items-center px-4 py-8'>
      <motion.div
        initial={{
          opacity: 0,
          y: -20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className='text-center mb-16 mt-8'
      >
        <h1 className='text-3xl font-semibold mb-4'>Willkommen bei TV-RANK</h1>
        <p className='text-gray-400 text-lg'>
          Entdecke, bewerte und verwalte deine Lieblingsserien und -filme.
        </p>
      </motion.div>
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        className='bg-gray-900/50 rounded-xl p-8 max-w-2xl w-full mb-12 backdrop-blur-sm'
      >
        <p className='text-center text-lg mb-6'>
          Mit TV-RANK findest du neue Serien und Filme, führst deine Watchlist
          und verpasst keine Folge oder keinen Film mehr.
        </p>
        <div className='flex gap-4 justify-center'>
          <motion.div
            whileHover={{
              scale: 1.05,
            }}
            whileTap={{
              scale: 0.95,
            }}
          >
            <Link
              to='/login'
              className='block bg-[var(--theme-primary)] text-black px-8 py-3 rounded-lg font-semibold hover:bg-[var(--theme-accent)] transition-colors'
              aria-label='Login'
            >
              LOGIN
            </Link>
          </motion.div>
          <motion.div
            whileHover={{
              scale: 1.05,
            }}
            whileTap={{
              scale: 0.95,
            }}
          >
            <Link
              to='/register'
              className='block border-2 border-[var(--theme-primary)] text-[var(--theme-primary)] px-8 py-3 rounded-lg font-semibold hover:bg-[var(--theme-primary)]/10 transition-colors'
              aria-label='Registrieren'
            >
              REGISTRIEREN
            </Link>
          </motion.div>
        </div>
      </motion.div>
      <div className='max-w-5xl w-full'>
        <motion.h2
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          className='text-[var(--theme-primary)] text-xl font-semibold mb-8 text-center'
        >
          Unsere Funktionen
        </motion.h2>
        <motion.div
          variants={container}
          initial='hidden'
          animate='show'
          className='grid md:grid-cols-3 gap-6'
        >
          {[
            {
              icon: <Star className='w-8 h-8 text-[var(--theme-primary)] mx-auto mb-4' />,
              title: 'Bewertungen',
              description:
                'Bewerte deine Lieblingsserien und -filme und teile deine Meinung.',
            },
            {
              icon: <Tv className='w-8 h-8 text-[var(--theme-primary)] mx-auto mb-4' />,
              title: 'Entdeckungen',
              description:
                'Finde neue Serien und Filme, die perfekt zu deinem Geschmack passen.',
            },
            {
              icon: <List className='w-8 h-8 text-[var(--theme-primary)] mx-auto mb-4' />,
              title: 'Watchlist',
              description:
                'Verwalte deine persönliche Watchlist und behalte den Überblick.',
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              className='bg-gray-900/30 p-6 rounded-xl text-center hover:bg-gray-900/40 transition-colors'
            >
              {feature.icon}
              <h3 className='text-[var(--theme-primary)] font-medium mb-2'>
                {feature.title}
              </h3>
              <p className='text-gray-400'>{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
export default StartPage;
