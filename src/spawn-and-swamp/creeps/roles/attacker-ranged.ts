import {MOVE, RANGED_ATTACK, TOUGH} from 'game/constants';
import {Creep} from 'game/prototypes';
import type {RoleConfig} from '../types';
import {attackerRunner} from './attacker';

function attackerRangedRunner(creep: Creep): void {
    attackerRunner(creep);
}

const attackerRangedBodies = [
    [TOUGH, RANGED_ATTACK, MOVE, MOVE],
    [TOUGH, TOUGH, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE],
    [TOUGH, TOUGH, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE],
    [TOUGH, TOUGH, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE],
];

export const attackerRangedConfig: RoleConfig = {
    role: 'attacker-ranged',
    runner: attackerRangedRunner,
    bodies: attackerRangedBodies,
    min: 0,
    max: 0,
    weight: 5,
};
