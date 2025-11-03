import React from 'react';
import { buttonStyles } from '../../utils/designSystem';

const cx = (...classes) => classes.filter(Boolean).join(' ');

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}) => {
  return (
    <button
      className={cx(buttonStyles.base, buttonStyles.sizes[size], buttonStyles.variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;


