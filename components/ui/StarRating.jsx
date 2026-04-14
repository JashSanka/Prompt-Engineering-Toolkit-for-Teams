'use client';
import { useState } from 'react';

export default function StarRating({ value = 0, onChange, size = 'md' }) {
  const [hover, setHover] = useState(0);
  const fontSize = size === 'lg' ? '1.4rem' : size === 'sm' ? '0.9rem' : '1.1rem';

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`star ${i <= (hover || value) ? 'filled' : ''}`}
          style={{ fontSize, cursor: onChange ? 'pointer' : 'default' }}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange && onChange(i)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
