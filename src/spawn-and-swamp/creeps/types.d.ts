import type {BodyPartType, Creep} from 'game/prototypes';

export type CreepState = {
    role: Role;
    runner: (creep: Creep) => void;
};

export type Role = 'harvester' | 'builder' | 'attacker' | 'guard' | 'attacker-ranged' | 'super-soldier';

export interface RoleConfig {
    role: Role;
    bodies: BodyPartType[][];
    min: number;
    max: number;
    runner: (creep: Creep) => void;
    weight: number;
}

/*
BODYPART_COST = {
    [WORK]: 100,
    [MOVE]: 50,
    [CARRY]: 50,
    [ATTACK]: 80,
    [RANGED_ATTACK]: 150,
    [HEAL]: 250,
    [TOUGH]: 10,
}
*/