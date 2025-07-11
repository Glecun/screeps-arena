import {getObjectsByPrototype, findClosestByPath} from 'game/utils';
import {type Creep, Source, ConstructionSite} from 'game/prototypes';
import {ERR_NOT_IN_RANGE} from 'game/constants';
import {harvesterRunner} from './harvester';
import {action} from '../../../common/utils/utils';
import {CARRY, MOVE, WORK} from 'game/constants';
import type {RoleConfig} from '../types';

export const builderBodies = [
    [WORK, CARRY, MOVE],
    [WORK, CARRY, CARRY, MOVE],
];

export function builderRunner(creep: Creep): void {
    const sites = getObjectsByPrototype(ConstructionSite);
    const site = findClosestByPath(creep, sites);
    if (!site) {
        harvesterRunner(creep);
        return;
    }

    if (creep.store.getUsedCapacity() === 0) {
        const source = findClosestByPath(creep, getObjectsByPrototype(Source));
        if (source) {
            action(() => creep.harvest(source), {[ERR_NOT_IN_RANGE]: () => action(() => creep.moveTo(source))});
        }
    } else {
        action(() => creep.build(site), {[ERR_NOT_IN_RANGE]: () => action(() => creep.moveTo(site))});
    }
}

export const builderConfig: RoleConfig = {role: 'builder', runner: builderRunner, bodies: builderBodies, min: 0, max: 0, weight: 1};
