export interface IHandCards {
  Add<T>(handCards: T[], newCards: T[]): void;
  Remove<T>(handCards: T[], discardCards: T[]): void;
}

function filterInplace<T>(array: T[], condition: (t: T, i: number, thisArg: T[]) => boolean) {
  let write_ptr = 0;
  let read_ptr = 0;
  while (read_ptr < array.length) {
    if (condition(array[read_ptr], read_ptr, array)) {
      array[write_ptr] = array[read_ptr];
      write_ptr++;
    }
    read_ptr++;
  }
  array.length = write_ptr;
}

export const HandCards: IHandCards = {
  Add<T>(handCards: T[], newCards: T[]): void {
    handCards.push(...newCards);
  },
  Remove<T>(handCards: T[], discardCards: T[]): void {
    // O(M+N)
    // convert discard cards to card => number map
    const discardCardsMap = new Map<T, number>();
    for (let discardCard of discardCards) {
      discardCardsMap.set(discardCard, (discardCardsMap.get(discardCard) ?? 0) + 1);
    }
    // remove discard card as empty in hand cards
    filterInplace(handCards, (handCard) => {
      if ((discardCardsMap.get(handCard) ?? 0) > 0) {
        discardCardsMap.set(handCard, discardCardsMap.get(handCard)! - 1);
        return false;
      }
      return true;
    });
  },
}
