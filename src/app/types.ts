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
  fieldPositions?: FieldPosition[];
  benchPlayers?: Player[];
  formation?: FormationName;
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

export const FORMATIONS = {
  "3-1-4-2": ["GK","CB","CB","CB","CDM","LM","CM","RM","CAM","ST","ST"],
  "3-4-1-2": ["GK","CB","CB","CB","LWB","CDM","CDM","RWB","CAM","ST","ST"],
  "3-4-2-1": ["GK","CB","CB","CB","LWB","CDM","CDM","RWB","CAM","CAM","ST"],
  "3-4-3": ["GK","CB","CB","CB","LWB","CDM","CDM","RWB","LW","ST","RW"],
  "3-5-2": ["GK","CB","CB","CB","LWB","CM","CM","CM","RWB","ST","ST"],
  "4-1-2-1-2 Narrow": ["GK","LB","CB","CB","RB","CDM","LCM","RCM","CAM","ST","ST"],
  "4-1-2-1-2 Wide": ["GK","LB","CB","CB","RB","CDM","LCM","RCM","CAM","ST","ST"],
  "4-1-3-2": ["GK","LB","CB","CB","RB","CDM","CM","CM","CAM","ST","ST"],
  "4-1-4-1": ["GK","LB","CB","CB","RB","CDM","LM","CM","RM","CAM","ST"],
  "4-2-2-2": ["GK","LB","CB","CB","RB","CDM","CDM","LAM","RAM","ST","ST"],
  "4-2-3-1 Wide": ["GK","LB","CB","CB","RB","CDM","CDM","LM","CAM","RM","ST"],
  "4-2-3-1 Narrow": ["GK","LB","CB","CB","RB","CDM","CDM","LM","CAM","RM","ST"],
  "4-2-4": ["GK","LB","CB","CB","RB","LM","LCM","RCM","RM","ST","ST"],
  "4-3-1-2": ["GK","LB","CB","CB","RB","LCM","CM","RCM","CAM","ST","ST"],
  "4-3-2-1": ["GK","LB","CB","CB","RB","LCM","CM","RCM","CAM","CAM","ST"],
  "4-3-3 Flat": ["GK","LB","CB","CB","RB","LCM","CM","RCM","LW","ST","RW"],
  "4-3-3 Attacking": ["GK","LB","CB","CB","RB","LCM","CAM","RCM","LW","ST","RW"],
  "4-3-3 Defending": ["GK","LB","CB","CB","RB","LCM","CDM","RCM","LW","ST","RW"],
  "4-3-3 Holding": ["GK","LB","CB","CB","RB","CDM","LCM","RCM","LW","ST","RW"],
  "4-3-3 False 9": ["GK","LB","CB","CB","RB","LCM","CM","RCM","LW","CF","RW"],
  "4-3-3 Wide": ["GK","LB","CB","CB","RB","LCM","CM","RCM","LW","ST","RW"],
  "4-4-1-1": ["GK","LB","CB","CB","RB","LM","LCM","RCM","RM","CAM","ST"],
  "4-4-2": ["GK","LB","CB","CB","RB","LM","LCM","RCM","RM","ST","ST"],
  "4-4-2 Holding": ["GK","LB","CB","CB","RB","LM","LCM","RCM","RM","ST","ST"],
  "4-5-1": ["GK","LB","CB","CB","RB","LM","LCM","CM","RCM","RM","ST"],
  "4-5-1 Flat": ["GK","LB","CB","CB","RB","LM","LCM","CM","RCM","RM","ST"],
  "5-2-1-2": ["GK","LWB","CB","CB","CB","RWB","CDM","CDM","CAM","ST","ST"],
  "5-2-3": ["GK","LWB","CB","CB","CB","RWB","CDM","CDM","LM","CAM","RM"],
  "5-2-2-1": ["GK","LWB","CB","CB","CB","RWB","CDM","CDM","LAM","RAM","ST"],
  "5-3-2": ["GK","LWB","CB","CB","CB","RWB","CM","CM","CM","ST","ST"],
  "5-4-1": ["GK","LWB","CB","CB","CB","RWB","LM","LCM","RCM","RM","ST"]
} as const;

export type FormationName = keyof typeof FORMATIONS;

// Position coordinates mapping for different formations
export const POSITION_COORDINATES: Record<string, { x: number; y: number }> = {
  // Attackers
  'ST': { x: 50, y: 15 },
  'CF': { x: 50, y: 20 },
  'LW': { x: 15, y: 20 },
  'RW': { x: 85, y: 20 },

  // Attacking midfielders
  'CAM': { x: 50, y: 35 },
  'LAM': { x: 35, y: 35 },
  'RAM': { x: 65, y: 35 },

  // Wide midfielders
  'LM': { x: 15, y: 45 },
  'RM': { x: 85, y: 45 },

  // Central midfielders
  'CM': { x: 50, y: 50 },
  'LCM': { x: 35, y: 50 },
  'RCM': { x: 65, y: 50 },

  // Defensive midfielders
  'CDM': { x: 50, y: 60 },

  // Wing backs
  'LWB': { x: 15, y: 65 },
  'RWB': { x: 85, y: 65 },

  // Fullbacks
  'LB': { x: 20, y: 75 },
  'RB': { x: 80, y: 75 },

  // Center backs
  'CB': { x: 50, y: 75 },

  // Goalkeeper
  'GK': { x: 50, y: 90 }
};

export const mainStatsMap = {
  pace: ['acceleration', 'sprintSpeed'],
  shooting: ['positioning', 'finishing', 'shotPower', 'longShots', 'volleys', 'penalties'],
  passing: ['vision', 'crossing', 'freeKickAccuracy', 'shortPassing', 'longPassing', 'curve'],
  dribbling: ['agility', 'balance', 'reactions', 'ballControl', 'dribbling', 'composure'],
  defending: ['interceptions', 'headingAccuracy', 'defensiveAwareness', 'standingTackle', 'slidingTackle'],
  physicality: ['jumping', 'stamina', 'strength', 'aggression'],
};

export type MainStats = Record<keyof typeof mainStatsMap, number>;
