import {MOVE, RANGED_ATTACK} from 'game/constants';
import {Creep} from 'game/prototypes';
import type {RoleConfig} from '../types';
import {attackerRunner} from './attacker';

function attackerRangedRunner(creep: Creep): void {
    attackerRunner(creep);
}

const attackerRangedBodies = [
    [RANGED_ATTACK, MOVE],
    [RANGED_ATTACK, RANGED_ATTACK, MOVE],
    [RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE],
    [RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE],
];

export const attackerRangedConfig: RoleConfig = {
    role: 'attacker-ranged',
    runner: attackerRangedRunner,
    bodies: attackerRangedBodies,
    min: 1,
    max: 999,
    weight: 5,
};
