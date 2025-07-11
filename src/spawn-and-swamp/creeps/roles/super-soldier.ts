import {getObjectsByPrototype, findClosestByPath, getRange, findInRange} from 'game/utils';
import {Creep, OwnedStructure, StructureContainer, StructureExtension, StructureRampart, StructureRoad, StructureSpawn, StructureTower} from 'game/prototypes';
import {BOTTOM, CARRY, ERR_BUSY, ERR_INVALID_TARGET, ERR_NO_BODYPART, HEAL, LEFT, RANGED_ATTACK, RIGHT, TOP, TOUGH, WORK} from 'game/constants';
import {action, getAttack} from '../../../common/utils/utils';
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

        const targets = orderTargets(creep, enemies, structures);
        if (targets.length > 0) {
            action(() => getAttack(creep)(targets[0]), {
                [ERR_NOT_IN_RANGE]: () => action(() => creep.moveTo(targets[0])),
                [ERR_INVALID_TARGET]: () => {},
                [ERR_NO_BODYPART]: () => ({}),
            });
        }
    }
    if (army.state === 'rally') {
        guardRunner(creep);
    }
}

function orderTargets(creep: Creep, enemies: Creep[], structures: OwnedStructure[]) {
    return [...enemies, ...structures]
       .map(target => ({target, weight: computeWeight(creep, target, structures) }))
       .sort((a, b) => b.weight - a.weight)
       .map(t => t.target);
}

function computeWeight(creep: Creep, target: Creep | OwnedStructure, structures: OwnedStructure[]): number {
    let weight = 0;
    const weights = {
        notInteresting: -10,
        anecdotic: 1,
        low: 2,
        medium: 3,
        high: 4,
        veryHigh: 5,
    };

    // type
    if(target instanceof Creep) {
        const bodyParts = target.body.map(b => b.type);
        if (bodyParts.includes(RANGED_ATTACK) || bodyParts.includes(HEAL) || bodyParts.includes(ATTACK)) {
            weight += weights.veryHigh;
        }
        if (bodyParts.includes(WORK) || bodyParts.includes(CARRY)) {
            weight += weights.high;
        }

        if(isProtectedByRampart(structures, target)) {
            weight += weights.notInteresting;
        }
    }
    if(target instanceof OwnedStructure) {
        if (target instanceof StructureRampart || target instanceof StructureRoad) {
            weight += weights.notInteresting;
        }
        if(target instanceof StructureExtension || target instanceof StructureTower) {
            if (target.store.getUsedCapacity() ?? 0 > 0) {
                weight += weights.low;
            } else {
                weight += weights.notInteresting;
            }
        }
        if (target instanceof StructureSpawn) {
            if(isProtectedByRampart(structures, target)) {
                weight += weights.low;
            } else {
                weight += weights.medium;
            }
        }
    }

    // life
    if (target.hits && target.hitsMax) {
        const damaged = target.hits < target.hitsMax;
        if(damaged) {
            weight += weights.low;
        }
        const lowLife = target.hits < target.hitsMax * 0.3;
        if(lowLife) {
            weight += weights.low;
        }
        const veryLowLife = target.hits < target.hitsMax * 0.1;
        if(veryLowLife) {
            weight += weights.high;
        }
    }
    
    // distance
    const targetInCloseRange = findInRange(creep, [target], 1).length > 0;
    if(targetInCloseRange) {
        weight += weights.veryHigh;
    }
    const targetInRange = findInRange(creep, [target], 3).length > 0;
    if(targetInRange) {
        weight += weights.high;
    }
    const notTooFar = findInRange(creep, [target], 10).length > 0;
    if(notTooFar) {
        weight += weights.low;
    }
    const aBitFar = findInRange(creep, [target], 20).length > 0;
    if(aBitFar) {
        weight += weights.anecdotic;
    }
    return weight;
}

function isProtectedByRampart(structures: OwnedStructure[], target: Creep | OwnedStructure) {
    const ramparts = structures.filter(s => s instanceof StructureRampart);
    const protectedByRampart = ramparts.some(r => target.x === r.x && target.y === r.y);
    return protectedByRampart;
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
