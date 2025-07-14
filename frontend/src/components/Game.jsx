import { useState, useEffect } from 'react';
import axios from 'axios';

const Game = ({ session }) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [gameCompleted, setGameCompleted] = useState(false);

  useEffect(() => {
    // Initialize 8 cards (4 pairs)
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
          // Award tokens
          axios.post(`${import.meta.env.VITE_BACKEND_URL}/complete-task`, { task_type: 'game' }, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }).then(() => alert('Game completed! Tokens awarded.')).catch(console.error);
        }
      }
      setTimeout(() => setFlipped([]), 1000);
    }
  };

  return (
    <div>
      <h1>Memory Game</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 50px)' }}>
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => handleFlip(index)}
            style={{ height: '50px', border: '1px solid', textAlign: 'center' }}
          >
            {(flipped.includes(index) || matched.includes(index)) ? card : '?'}
          </div>
        ))}
      </div>
      {gameCompleted && <p>Congratulations! Game completed.</p>}
    </div>
  );
};

export default Game;