import type {ReactNode} from 'react';

export function EditorialSection({number, title, heading: Heading = 'h3', className = '', id, children}: {
  number: string;
  title: ReactNode;
  heading?: 'h2' | 'h3';
  className?: string;
  id?: string;
  children: ReactNode;
}) {
  return <section className={`editorial-row ${className}`} id={id}>
    <span className="editorial-index" aria-hidden="true">{number}</span>
    <div className="editorial-copy"><Heading>{title}</Heading>{children}</div>
  </section>;
}
