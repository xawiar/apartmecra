import React from 'react';
import { cardStyles } from '../../utils/designSystem';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const Card = ({ children, className, padded = true }) => {
  return (
    <div className={cx(cardStyles.base, padded && cardStyles.padded, className)}>
      {children}
    </div>
  );
};

export default Card;


