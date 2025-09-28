export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  commonName: string | null;
  overallRating: number;
  skillMoves: number;
  weakFootAbility: number;
  preferredFoot: string;
  position: {
    id: string;
    shortLabel: string;
    label: string;
    positionType: {
      id: string;
      name: string;
    };
  };
  alternatePositions: {
    id: string;
    label: string;
    shortLabel: string;
  }[] | null;
  playerAbilities: {
    id: string;
    label: string;
    description: string;
    imageUrl: string;
    type: {
      id: string;
      label: string;
    };
  }[];
  team: {
    id: number;
    label: string;
    imageUrl: string;
    isPopular: boolean;
  };
  nationality: {
    id: number;
    label: string;
    imageUrl: string;
  };
  stats: {
    [key: string]: {
      value: number;
      diff: number;
    };
  };
  shieldUrl: string;
}

export interface DraftManager {
  id: number;
  name: string;
  team: Player[];
}

export interface DraftSettings {
  managers: DraftManager[];
  currentManagerIndex: number;
  currentRound: number;
  isSnakeDirection: boolean;
  maxRounds: number;
}

export interface FieldPosition {
  id: string;
  x: number;
  y: number;
  player?: Player;
}

export const AVAILABLE_POSITIONS = ['GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RM', 'LM', 'RW', 'LW', 'ST'] as const;
export type PositionFilter = typeof AVAILABLE_POSITIONS[number] | 'ALL';

export const mainStatsMap = {
  pace: ['acceleration', 'sprintSpeed'],
  shooting: ['positioning', 'finishing', 'shotPower', 'longShots', 'volleys', 'penalties'],
  passing: ['vision', 'crossing', 'freeKickAccuracy', 'shortPassing', 'longPassing', 'curve'],
  dribbling: ['agility', 'balance', 'reactions', 'ballControl', 'dribbling', 'composure'],
  defending: ['interceptions', 'headingAccuracy', 'defensiveAwareness', 'standingTackle', 'slidingTackle'],
  physicality: ['jumping', 'stamina', 'strength', 'aggression'],
};

export type MainStats = Record<keyof typeof mainStatsMap, number>;
