import {getObjectsByPrototype, findClosestByPath} from 'game/utils';
import {type Creep, Source, StructureContainer, StructureSpawn} from 'game/prototypes';
import {ERR_BUSY, ERR_FULL, ERR_INVALID_TARGET, ERR_NOT_IN_RANGE, RESOURCE_ENERGY} from 'game/constants';
import {action} from '../../utils/utils';
import {CARRY, MOVE, WORK} from 'game/constants';
import type {RoleConfig} from '../types';

export function harvesterRunner(creep: Creep): void {
    const sources = getObjectsByPrototype(Source).filter((source) => source.energy > 0);
    const containers = getObjectsByPrototype(StructureContainer).filter((container) => container.store.getUsedCapacity(RESOURCE_ENERGY) ?? 0 > 0);

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
        // Try to harvest from source
        const sourceTarget = findClosestByPath(creep, sources);
        if (sourceTarget) {
            action(() => creep.harvest(sourceTarget), {
                [ERR_NOT_IN_RANGE]: () => action(() => creep.moveTo(sourceTarget)),
                [ERR_INVALID_TARGET]: () => ({}),
                [ERR_BUSY]: () => ({}),
            });
        }

        // Try to withdraw from container
        const containerTarget = findClosestByPath(creep, containers);
        if (containerTarget) {
            action(() => creep.withdraw(containerTarget, RESOURCE_ENERGY), {
                [ERR_NOT_IN_RANGE]: () => action(() => creep.moveTo(containerTarget)),
                [ERR_INVALID_TARGET]: () => ({}),
                [ERR_BUSY]: () => ({}),
            });
        }
    } else {
        const spawnTarget = getObjectsByPrototype(StructureSpawn).filter((spawn) => spawn.my)[0];
        if (spawnTarget) {
            action(() => creep.transfer(spawnTarget, RESOURCE_ENERGY), {
                [ERR_NOT_IN_RANGE]: () => action(() => creep.moveTo(spawnTarget)),
                [ERR_INVALID_TARGET]: () => ({}),
                [ERR_BUSY]: () => ({}),
                [ERR_FULL]: () => ({}),
            });
        }
    }
}

const harvesterBodies = [
    [CARRY, MOVE],
    [CARRY, MOVE, MOVE],
    [CARRY, CARRY, MOVE, MOVE],
    [CARRY, CARRY, CARRY, MOVE, MOVE],
    [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
];

export const harvesterConfig: RoleConfig = {role: 'harvester', runner: harvesterRunner, bodies: harvesterBodies, min: 2, max: 6, weight: 3};
