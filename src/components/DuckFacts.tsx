import { Box, Button, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import Duck from '../assets/duck.png';
import quack from '../assets/duck_quack.mp3';
const duckFacts = [
  'Enten können Farben besser sehen als Menschen.',
  'Die meisten Enten nisten in hohem Gras und in der Nähe von Wasser.',
  'Enten kommunizieren durch verschiedene Laute und Körperhaltungen.',
  'Die schnatternden Enten halten ihre Jungen gemeinsam warm.',
  'Ein Enten-Schwarm kann hunderte Vögel umfassen, die synchron fliegen.',
  'Enten haben wasserabweisende Federn durch ein spezielles Öl.',
  'Manche Entenarten können sehr weit reisen.',
  'Enten können sich unter Wasser bis zu 10 Sekunden lang halten.',
  'Enten sind sozial und bilden enge Familienbande.',
  'Ein Entenquaken kann in freier Natur sehr laut sein.',
  'Enten haben einen sehr guten Orientierungssinn und finden oft zu ihrem Ursprungsort zurück.',
  'Die Vielzahl der unterschiedlichen Entenarten zeigt eine große Vielfalt in Größe und Farbe.',
  'Enten haben spezielle Drüsen, die ihre Federn ölen und dadurch wasserdicht machen.',
  'Einige Entenarten legen bis zu 12 Eier pro Gelege.',
  'Enten versorgen ihre Jungen intensiv und schützen sie vor Fressfeinden.',
  'Die Flügelspannweite mancher Enten kann über 1 Meter betragen.',
  'Enten können sowohl im Wasser als auch an Land sehr geschickte Schwimmer sein.',
  'Durch ihr Federkleid sind Enten gut an wechselnde Klimabedingungen angepasst.',
  'Enten nutzen oft das gleiche Brutgebiet Jahr für Jahr.',
  'Viele Entenarten kommunizieren mit einem komplexen Lautsystem.',
];
export const DuckFacts = () => {
  const [fact, setFact] = useState<string>('');
  useEffect(() => {
    const randomFact = duckFacts[Math.floor(Math.random() * duckFacts.length)];
    setFact(randomFact);
    const audio = new Audio(quack);
    const playAudio = () => {
      audio
        .play()
        .catch((error) => console.error('Audio playback failed:', error));
      document.removeEventListener('click', playAudio);
    };
    document.addEventListener('click', playAudio);
  }, []);
  const handleNewFact = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    const newFact = duckFacts[Math.floor(Math.random() * duckFacts.length)];
    setFact(newFact);
    const audio = new Audio(quack);
    audio
      .play()
      .catch((error) => console.error('Audio playback failed:', error));
  };
  return (
    <>
      {}
      <style>
        {`
          @keyframes duckRun {
            0% { left: 100vw; }
            100% { left: -150px; }
          }
        `}
      </style>
      {}
      <style>
        {`
          body { 
            cursor: url('/assets/duck_cursor.png') 16 16, auto !important; 
          }
        `}
      </style>
      {}
      <Box
        sx={{
          position: 'fixed',
          top: '20%',
          left: '100vw',
          animation: 'duckRun 5s linear',
          zIndex: 9999,
        }}
      >
        <img src={Duck} alt='Duck' style={{ width: '100px' }} />
      </Box>
      {}
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant='h4' gutterBottom>
          Duck Facts
        </Typography>
        <Typography variant='h6'>{fact}</Typography>
        <Button variant='contained' onClick={handleNewFact} sx={{ mt: 2 }}>
          Neuen Fakt anzeigen
        </Button>
      </Box>
    </>
  );
};
export default DuckFacts;
