import type {Creep} from 'game/prototypes';

type Army = {
    state: 'rally' | 'attack';
    creeps: string[];
};
const MAX_CREEPS_PER_ARMY = 6;
export const armies: Army[] = [{state: 'rally', creeps: []}];

export function getCurrentArmyOrCreate(creep: Creep): Army {
    const currentArmy = armies.find((army) => army.creeps.includes(creep.id.toString()));
    if (!currentArmy) {
        const armyAvailable = getArmyAvailableOrCreate();
        armyAvailable.creeps.push(creep.id.toString());
        if (armyAvailable.creeps.length >= MAX_CREEPS_PER_ARMY) {
            armyAvailable.state = 'attack';
        }
        return armyAvailable;
    }
    return currentArmy;
}

function getArmyAvailableOrCreate(): Army {
    const armyAvailable = armies.find((army) => army.creeps.length < MAX_CREEPS_PER_ARMY && army.state === 'rally');
    if (!armyAvailable) {
        const length = armies.push({state: 'rally', creeps: []});
        return armies[length - 1];
    }
    return armyAvailable;
}
