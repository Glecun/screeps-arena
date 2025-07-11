import {getObjectsByPrototype, findClosestByPath, getRange} from 'game/utils';
import {Creep, OwnedStructure} from 'game/prototypes';
import {BOTTOM, ERR_BUSY, ERR_INVALID_TARGET, ERR_NO_BODYPART, LEFT, RIGHT, TOP, TOUGH} from 'game/constants';
import {action, getAttack} from '../../../common/utils/utils';
import {ATTACK, ERR_NOT_IN_RANGE, MOVE} from 'game/constants';
import type {RoleConfig} from '../types';
import {getCurrentArmyOrCreate} from '../../strategy/army';
import {guardRunner} from './guard';

export function attackerRunner(creep: Creep): void {
    const enemies = getObjectsByPrototype(Creep).filter((c) => c.my === false);
    //@ts-ignore
    const structures = getObjectsByPrototype(OwnedStructure).filter((c) => c.my === false);

    const army = getCurrentArmyOrCreate(creep);

    if (army.state === 'attack') {
        const target = findClosestByPath(creep, [...enemies, ...structures]);
        if (target) {
            action(() => getAttack(creep)(target), {
                [ERR_NOT_IN_RANGE]: () => action(() => creep.moveTo(target)),
                [ERR_INVALID_TARGET]: () => ({}),
                [ERR_NO_BODYPART]: () => ({}),
            });
        }
    }
    if (army.state === 'rally') {
        guardRunner(creep);
    }
}

const attackerBodies = [
    [TOUGH, ATTACK, ATTACK, MOVE, MOVE],
    [TOUGH, TOUGH, ATTACK, ATTACK, ATTACK, MOVE, MOVE],
    [TOUGH, TOUGH, TOUGH, ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE],
];

export const attackerConfig: RoleConfig = {role: 'attacker', runner: attackerRunner, bodies: attackerBodies, min: 0, max: 0, weight: 5};
