import type { ReactNode } from 'react';

interface ContentShelfProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function ContentShelf({ title, children, className = '' }: ContentShelfProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {/* Section title */}
      <h2 className="text-lg font-semibold text-white/80 mb-3 uppercase tracking-wider px-8">
        {title}
      </h2>

      {/* Horizontal scrolling container */}
      <div className="netflix-shelf px-8">
        {children}
      </div>
    </div>
  );
}
