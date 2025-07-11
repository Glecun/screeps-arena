import {getObjectsByPrototype} from 'game/utils';
import {Creep} from 'game/prototypes';
import {harvesterRunner} from './creeps/roles/harvester';
import {myCreeps} from './creeps/registry';
import {runStrategy} from './strategy/controller';
import {logInfos} from '../common/utils/utils';

export function loop(): void {
    logInfos();
    runStrategy();
    runScreeps();
}

function getRunner(id: string): (creep: Creep) => void {
    const runner = myCreeps.get(id)?.runner;
    return runner ?? harvesterRunner;
}

function runScreeps() {
    const creeps = getObjectsByPrototype(Creep).filter((c) => c.my);
    for (const creep of creeps) {
        getRunner(creep.id.toString())(creep);
    }
}
