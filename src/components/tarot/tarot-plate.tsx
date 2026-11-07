import type {ComponentProps} from 'react';

export function TarotPlate({className, ...image}: ComponentProps<'img'>) {
  return <span className="tarot-plate">
    <img {...image} className={className ? `tarot-plate-img ${className}` : 'tarot-plate-img'}/>
  </span>;
}
