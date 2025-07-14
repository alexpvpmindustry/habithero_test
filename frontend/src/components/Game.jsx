import { useState, useEffect } from 'react';
import axios from 'axios';

const Game = ({ session }) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [gameCompleted, setGameCompleted] = useState(false);

  useEffect(() => {
    const symbols = ['A', 'B', 'C', 'D'];
    const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
    setCards(deck);
  }, []);

  const handleFlip = (index) => {
    if (flipped.length === 2 || matched.includes(index) || flipped.includes(index)) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first] === cards[second]) {
        setMatched([...matched, first, second]);
        if (matched.length + 2 === cards.length) {
          setGameCompleted(true);
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/complete-task`, { task_type: 'game' }, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }).then(() => alert('Game completed! Tokens awarded.')).catch(console.error);
        }
      }
      setTimeout(() => setFlipped([]), 1000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-3xl font-bold text-secondary mb-6">Memory Game</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => handleFlip(index)}
            className={`card h-24 flex items-center justify-center text-2xl cursor-pointer transition-transform duration-300 ${
              flipped.includes(index) || matched.includes(index) ? 'bg-primary text-white' : 'bg-gray-200'
            } ${flipped.includes(index) || matched.includes(index) ? '' : 'hover:scale-105'}`}
          >
            {(flipped.includes(index) || matched.includes(index)) ? card : '?'}
          </div>
        ))}
      </div>
      {gameCompleted && (
        <p className="mt-6 text-lg text-center text-secondary font-semibold">Congratulations! Game completed.</p>
      )}
    </div>
  );
};

export default Game;