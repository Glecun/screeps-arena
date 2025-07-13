import {getObjectsByPrototype, findClosestByPath, getRange, findInRange} from 'game/utils';
import {Creep, OwnedStructure, StructureContainer, StructureExtension, StructureRampart, StructureRoad, StructureSpawn, StructureTower, StructureWall} from 'game/prototypes';
import {BOTTOM, CARRY, ERR_BUSY, ERR_INVALID_TARGET, ERR_NO_BODYPART, HEAL, LEFT, RANGED_ATTACK, RESOURCE_ENERGY, RIGHT, TOP, TOUGH, WORK} from 'game/constants';
import {action, getAttack} from '../../../common/utils/utils';
import {ATTACK, ERR_NOT_IN_RANGE, MOVE} from 'game/constants';
import type {RoleConfig} from '../types';
import {getCurrentArmyOrCreate} from '../../strategy/army';

export function superSoldierRunner(creep: Creep): void {
    const enemies = getObjectsByPrototype(Creep).filter((c) => c.my === false);
    //@ts-ignore
    const structures = getObjectsByPrototype(OwnedStructure).filter((c) => c.my === false);
    const walls = getObjectsByPrototype(StructureWall);
    const spawn = getObjectsByPrototype(StructureSpawn).filter((spawn) => spawn.my)[0];

    const army = getCurrentArmyOrCreate(creep);


    healIfNeeded(creep);
    moveAwayFromEnemiesIfNeeded(creep, enemies);

    const allEnemies = [...enemies, ...structures, ...walls].filter(e => army.state !== 'rally' || findInRange(e, [spawn], 25).length > 0);

    const targets = orderTargetsByWeight(creep, allEnemies, spawn);
    if (targets.length > 0) {
        moveToCloseRangeIfNeeded(creep, targets[0]);
        attackTargetOrFirstInRange(creep, targets);
    }

    if (army.state === 'rally' && targets.length === 0) {
        stayButMoveAwayFromStructures(creep, spawn);
    }
}

function healIfNeeded(creep: Creep) {
    if (creep.hits < creep.hitsMax) {
        action(() => creep.heal(creep));
        return;
    }
    const aCloseDamagedAlly = getObjectsByPrototype(Creep).filter((c) => c.my === true && c.id !== creep.id && getRange(creep, c) <= 2 && c.hits < c.hitsMax)[0];
    if (aCloseDamagedAlly) {
        action(() => creep.heal(aCloseDamagedAlly), {
            [ERR_NOT_IN_RANGE]: () => {},
        });
    }
}

function moveAwayFromEnemiesIfNeeded(creep: Creep, enemies: Creep[]) {
    const twoMuchBodyPartDamaged = creep.body.filter((b) => b.type === MOVE && b.hits <= 0).length >= 3
    if (twoMuchBodyPartDamaged) {
        moveAwayFromEnemies(creep, enemies);
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


function orderTargetsByWeight(creep: Creep, targets: (Creep | OwnedStructure)[], spawn: StructureSpawn) {
    //console.log("-- creep", creep.id); // FOR DEBUGGING
    return targets
       .map(target => ({target, weight: computeWeight(creep, target, targets, spawn) }))
       .sort((a, b) => b.weight - a.weight)
       //.map(t => {console.log(t.target.id, t.weight); return t}) // FOR DEBUGGING
       .map(t => t.target);
}

const weights = {
    notInteresting: -10,
    anecdotic: 1,
    low: 2,
    medium: 3,
    high: 4,
    veryHigh: 5,
};
function computeWeight(creep: Creep, target: Creep | OwnedStructure, targets: (Creep | OwnedStructure)[], spawn: StructureSpawn): number {
    let weight = 0;

    // type
    if(target instanceof Creep) {
        const bodyParts = target.body.map(b => b.type);
        if (bodyParts.includes(RANGED_ATTACK) || bodyParts.includes(HEAL) || bodyParts.includes(ATTACK)) {
            weight += weights.veryHigh;
        }
        if (bodyParts.includes(WORK) || bodyParts.includes(CARRY)) {
            weight += weights.high;
        }

        if(isProtectedByRampart(targets, target)) {
            weight += weights.notInteresting;
        }

        weight += weightCloseToSpawn(spawn, target);
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
            if(isProtectedByRampart(targets, target)) {
                weight += weights.low;
            } else {
                weight += weights.medium;
            }
        }
    }
    if(target instanceof StructureWall) {
        weight += (weights.notInteresting * 2);

        if(isBlockingContainer(creep, target)) {
            weight += weights.low;
        }
    }

    // life
    if (target.hits && target.hitsMax) {
        const damaged = target.hits < target.hitsMax;
        if(damaged) {
            weight += weights.veryHigh;
        }

        weight += weightLowLife(target);
    }
    
    // distance
    weight += weightDistance(creep, target);

    return weight;
}

function isProtectedByRampart(targets: (Creep | OwnedStructure)[], target: Creep | OwnedStructure) {
    const ramparts = targets.filter(s => s instanceof StructureRampart);
    const protectedByRampart = ramparts.some(r => target.x === r.x && target.y === r.y);
    return protectedByRampart;
}

function weightCloseToSpawn(spawn: StructureSpawn, target: Creep | OwnedStructure) {
    if (getRange(spawn, target) <= 25) {
        return weights.veryHigh;
    }

    if (getRange(spawn, target) <= 45) {
        return weights.low;
    }
    return 0;
}

function weightLowLife(target: Creep | OwnedStructure) {
    if (!target.hits || !target.hitsMax) return 0;
    const veryLowLife = target.hits < target.hitsMax * 0.1;
    if(veryLowLife) {
        return weights.veryHigh;
    }
    const lowLife = target.hits < target.hitsMax * 0.3;
    if(lowLife) {
        return weights.high;
    }
    const mediumLife = target.hits < target.hitsMax * 0.7;
    if(mediumLife) {
        return weights.medium;
    }
    return 0;
}

function weightDistance(creep: Creep, target: Creep | OwnedStructure) {
    if(target instanceof StructureWall) {
        return 0;
    }
    const targetInCloseRange = findInRange(creep, [target], 1).length > 0;
    if(targetInCloseRange) {
        return weights.veryHigh;
    }
    const targetInRange = findInRange(creep, [target], 3).length > 0;
    if(targetInRange) {
        return weights.high;
    }
    const notTooFar = findInRange(creep, [target], 10).length > 0;
    if(notTooFar) {
        return weights.low;
    }
    const aBitFar = findInRange(creep, [target], 20).length > 0;
    if(aBitFar) {
        return weights.anecdotic;
    }
    return 0;
}

function moveToCloseRangeIfNeeded(creep: Creep, target: Creep | OwnedStructure) {
    const notInCloseRange = getRange(creep, target) > 2;
    if (notInCloseRange) {
        creep.moveTo(target)
    }
}

function attackTargetOrFirstInRange(creep: Creep, targets: Creep[] | OwnedStructure[]) {
    action(() => getAttack(creep)(targets[0]), {
        [ERR_NOT_IN_RANGE]: () => {
            action(() => creep.moveTo(targets[0]));
            const mostWeightedTargetInRange = firstInRange(creep, targets)
            if (mostWeightedTargetInRange && !(mostWeightedTargetInRange instanceof StructureWall)) {
                action(() => getAttack(creep)(mostWeightedTargetInRange));
            }
        } ,
        [ERR_INVALID_TARGET]: () => {},
        [ERR_NO_BODYPART]: () => ({}),
    });
}

function firstInRange(creep: Creep, targets: Creep[] | OwnedStructure[]) {
    return targets.find(t => findInRange(creep, [t], 3).length > 0) as Creep | OwnedStructure;
}

function stayButMoveAwayFromStructures(creep: Creep, spawn: StructureSpawn) {
    const containers = getObjectsByPrototype(StructureContainer).filter((container) => container.my);
    const obstacles = [spawn, ...containers];
    const target = findClosestByPath(creep, obstacles);

    if (target && getRange(creep, target) < 5) {
        const direction = Math.atan2(creep.y - target.y, creep.x - target.x);
        const moveX = Math.cos(direction) * 5;
        const moveY = Math.sin(direction) * 5;
        const targetPos = {x: creep.x + moveX, y: creep.y + moveY};
        action(() => creep.moveTo(targetPos));
    }
}

let wallsBlockingContainer: string[] | undefined = undefined;
function isBlockingContainer(creep: Creep, target: StructureWall) {
    const walls = getObjectsByPrototype(StructureWall)
    const someWallsAreDead = wallsBlockingContainer && wallsBlockingContainer.some(wall => !walls.map(w => w.id.toString()).includes(wall));
    if(!wallsBlockingContainer || someWallsAreDead) {
        const containersCloseToWalls = getObjectsByPrototype(StructureContainer).filter((container) => (container.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0 > 0) && walls.some(wall => getRange(wall, container) <= 2));
        if (containersCloseToWalls.length === 0) {
            wallsBlockingContainer = [];
            return false;
        }
        //@ts-ignore
        const notAccessibleContainers = containersCloseToWalls.filter((container) => findClosestByPath(creep, [container]) === null);
        if (notAccessibleContainers.length === 0) {
            wallsBlockingContainer = [];
            return false;
        }
        wallsBlockingContainer = walls.filter(wall => notAccessibleContainers.some(container => getRange(container, wall) <= 2)).map(wall => wall.id.toString());
    }

    return wallsBlockingContainer.includes(target.id.toString());
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
