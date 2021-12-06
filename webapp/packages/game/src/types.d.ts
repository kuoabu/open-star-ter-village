import { PlayerID } from 'boardgame.io';

export declare namespace OpenStarTerVillageType {
  export declare namespace Card {
    export type Project = string;
    export type Resource = string;
    export type Job = string;
    export type Force = string;
    export type Event = string;
  }

  export declare namespace State {
    export interface Root {
      rules: Rule;
      decks: {
        projects: Deck<Card.Project>;
        resources: Deck<Card.Resource>;
        events: Deck<Card.Event>;
      };
      table: Table;
      players: Record<PlayerID, Player>;
    }

    export interface Rule {
    }

    export interface Deck<T> {
      pile: T[];
      discardPile: T[];
    }

    export interface Table {
    }

    export interface Player {
      hand: Hand;
      workerTokens: number;
      closedProjects: number;
    }

    export interface Hand {
      projects: Card.Project[];
      resources: Card.Resource[];
    }
  }
}
