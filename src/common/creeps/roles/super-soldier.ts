import {getObjectsByPrototype, findClosestByPath, getRange} from 'game/utils';
import {Creep, OwnedStructure, StructureContainer, StructureSpawn} from 'game/prototypes';
import {BOTTOM, ERR_BUSY, ERR_INVALID_TARGET, ERR_NO_BODYPART, HEAL, LEFT, RANGED_ATTACK, RIGHT, TOP, TOUGH} from 'game/constants';
import {action, getAttack} from '../../utils/utils';
import {ATTACK, ERR_NOT_IN_RANGE, MOVE} from 'game/constants';
import type {RoleConfig} from '../types';
import {getCurrentArmyOrCreate} from '../../strategy/army';
import {guardRunner} from './guard';

export function superSoldierRunner(creep: Creep): void {
    const enemies = getObjectsByPrototype(Creep).filter((c) => c.my === false);
    //@ts-ignore
    const structures = getObjectsByPrototype(OwnedStructure).filter((c) => c.my === false);

    const army = getCurrentArmyOrCreate(creep);

    if (army.state === 'attack') {
        if (creep.hits < creep.hitsMax) {
            action(() => creep.heal(creep));
        }

        const twoMuchBodyPartDamaged = creep.body.filter((b) => b.type === MOVE && b.hits <= 0).length >= 3
        if (twoMuchBodyPartDamaged) {
            moveAwayFromEnemies(creep, enemies);
        }

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

function moveAwayFromEnemies(creep: Creep, enemies: Creep[]) {
    const target = findClosestByPath(creep, enemies);
    if (target) {
        const direction = Math.atan2(creep.y - target.y, creep.x - target.x);
        const moveX = Math.cos(direction) * 5;
        const moveY = Math.sin(direction) * 5;
        const targetPos = {x: creep.x + moveX, y: creep.y + moveY};
        action(() => creep.moveTo(targetPos));
    }
}

const superSoldierBodies = [[MOVE, MOVE, MOVE, MOVE, MOVE, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE, MOVE, MOVE, HEAL]];

export const superSoldierConfig: RoleConfig = {
    role: 'super-soldier',
    runner: superSoldierRunner,
    bodies: superSoldierBodies,
    min: 1,
    max: 999,
    weight: 5,
};
