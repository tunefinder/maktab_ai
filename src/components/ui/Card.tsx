import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = "", ...props }) => {
  return (
    <div 
      className={`glass-panel rounded-3xl p-6 sm:p-8 transition-all duration-500 hover:shadow-2xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
