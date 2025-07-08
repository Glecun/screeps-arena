import {getObjectsByPrototype, findClosestByPath, getRange} from 'game/utils';
import {Creep, OwnedStructure} from 'game/prototypes';
import {BOTTOM, LEFT, RIGHT, TOP} from 'game/constants';
import {action} from '../../utils/utils';
import {ATTACK, MOVE} from 'game/constants';
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
            if (getRange(creep, target) <= 1) {
                action(() => creep.attack(target));
            } else {
                action(() => creep.moveTo(target));
            }
        }
    }
    if (army.state === 'rally') {
        guardRunner(creep);
    }
}

const attackerBodies = [
    [ATTACK, MOVE],
    [ATTACK, ATTACK, MOVE],
    [ATTACK, ATTACK, ATTACK, MOVE, MOVE],
    [ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE],
];

export const attackerConfig: RoleConfig = {role: 'attacker', runner: attackerRunner, bodies: attackerBodies, min: 1, max: 999, weight: 5};
