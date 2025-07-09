import {findClosestByPath, getObjectsByPrototype, getRange} from 'game/utils';
import {Creep, OwnedStructure, StructureContainer, StructureSpawn, StructureWall, type CreepAttackResult} from 'game/prototypes';
import {ERR_INVALID_TARGET, ERR_NOT_IN_RANGE, OK} from 'game/constants';
import {action, getAttack} from '../../utils/utils';
import {ATTACK, MOVE} from 'game/constants';
import type {RoleConfig} from '../types';

export function guardRunner(creep: Creep): void {
    const spawn = getObjectsByPrototype(StructureSpawn).filter((spawn) => spawn.my)[0];

    if (attackCloseFromSpawnEnemies(creep, spawn)) return;
    if (destroyBlockingWalls(creep, spawn)) return;
    stayButMoveAwayFromStructures(creep, spawn);
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

function attackCloseFromSpawnEnemies(creep: Creep, spawn: StructureSpawn): boolean {
    const enemies = getObjectsByPrototype(Creep).filter((c) => c.my === false);
    //@ts-ignore
    const structures = getObjectsByPrototype(OwnedStructure).filter((c) => c.my === false);
    const target = findClosestByPath(creep, [...enemies, ...structures]);

    if (target) {
        if (getRange(spawn, target) <= 20) {
            const {executed} = action(() => getAttack(creep)(target), {
                [ERR_NOT_IN_RANGE]: () => {
                    action(() => creep.moveTo(target));
                },
                [ERR_INVALID_TARGET]: () => ({}),
            });
            return executed;
        }
    }
    return false;
}

function destroyBlockingWalls(creep: Creep, spawn: StructureSpawn): boolean {
    const walls = getObjectsByPrototype(StructureWall).filter((wall) => getRange(spawn, wall) <= 40);

    if (walls.length > 0) {
        const minHits = Math.min(...walls.map((wall) => wall.hits || 0));
        const wallsWithMinHits = walls.filter((wall) => (wall.hits || 0) === minHits);
        const targetWall = findClosestByPath(creep, wallsWithMinHits);
        const {executed} = action(() => getAttack(creep)(targetWall), {
            [ERR_NOT_IN_RANGE]: () => {
                action(() => creep.moveTo(targetWall));
            },
            [ERR_INVALID_TARGET]: () => ({}),
        });
        return executed;
    }
    return false;
}

export const guardBodies = [
    [ATTACK, MOVE],
    [ATTACK, ATTACK, MOVE],
    [ATTACK, ATTACK, ATTACK, MOVE, MOVE],
    [ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE],
];

export const guardConfig: RoleConfig = {
    role: 'guard',
    runner: guardRunner,
    bodies: guardBodies,
    min: 1,
    max: 3,
    weight: 1,
};
