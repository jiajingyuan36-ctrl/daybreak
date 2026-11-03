/** Uniform integers from the browser's secure entropy source, without modulo bias. */
export function randomInteger(n:number,word:()=>number=()=>crypto.getRandomValues(new Uint32Array(1))[0]):number {
 if(!Number.isSafeInteger(n)||n<1||n>2**32)throw new RangeError('Invalid random range');
 const limit=Math.floor(2**32/n)*n;
 let value:number;do{value=word()}while(value>=limit);
 return value%n;
}

/** Shuffle a complete physical deck; orientation belongs to the card before selection. */
export function shuffleDeck<T>(cards:readonly T[],integer:(n:number)=>number=randomInteger):{card:T;reversed:boolean}[] {
 const deck=cards.map(card=>({card,reversed:integer(2)===0}));
 for(let i=deck.length-1;i>0;i--){const j=integer(i+1);[deck[i],deck[j]]=[deck[j],deck[i]]}
 return deck;
}

/** Move the top packet underneath, preserving each card's orientation and relative order. */
export function cutDeck<T>(deck:readonly T[],at:number):T[] {
 if(!Number.isInteger(at)||at<1||at>=deck.length)throw new RangeError('Cut must be inside the deck');
 return [...deck.slice(at),...deck.slice(0,at)];
}
