import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card = ({ children, className = '', hover = false }: CardProps) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden ${
        hover ? 'hover:shadow-xl transition-shadow duration-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
