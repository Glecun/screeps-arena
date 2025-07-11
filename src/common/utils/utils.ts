import {
    ATTACK,
    ERR_BUSY,
    ERR_FULL,
    ERR_INVALID_ARGS,
    ERR_INVALID_TARGET,
    ERR_NO_BODYPART,
    ERR_NOT_ENOUGH_ENERGY,
    ERR_NOT_ENOUGH_EXTENSIONS,
    ERR_NOT_ENOUGH_RESOURCES,
    ERR_NOT_FOUND,
    ERR_NOT_IN_RANGE,
    ERR_NOT_OWNER,
    ERR_TIRED,
    RANGED_ATTACK,
} from 'game/constants';
import {myCreeps} from '../../spawn-and-swamp/creeps/registry';
import type {Creep, SpawnCreepResult, Structure} from 'game/prototypes';
import { armies } from '../../spawn-and-swamp/strategy/army';

export function action<T extends SpawnCreepResult | number>(
    action: () => T,
    errorBehaviors?: Record<number, () => void>,
): {result: T; executed: boolean} {
    const result = action();
    const error = result && typeof result === 'object' && ('error' in result || 'object' in result) ? result.error : (result as number);

    if (!error || error >= 0) {
        return {result, executed: true};
    }

    if (!errorBehaviors || !Object.keys(errorBehaviors).includes(error.toString())) {
        const err = new Error('Action ' + toStringError(error));
        console.log(err.stack);
        return {result, executed: false};
    }

    errorBehaviors[error]?.();
    return {result, executed: true};
}

let tickCounter = 0;
export function logInfos(): void {
    tickCounter = tickCounter + 1;
    if (tickCounter >= 20) {
        console.log('myCreeps', myCreeps);
        console.log('armies', armies);
        tickCounter = 0;
    }
}

function toStringError(error: number): string {
    switch (error) {
        case ERR_NOT_OWNER:
            return 'ERR_NOT_OWNER';
        case ERR_INVALID_ARGS:
            return 'ERR_INVALID_ARGS';
        case ERR_NOT_ENOUGH_ENERGY:
            return 'ERR_NOT_ENOUGH_ENERGY';
        case ERR_BUSY:
            return 'ERR_BUSY';
        case ERR_NOT_IN_RANGE:
            return 'ERR_NOT_IN_RANGE';
        case ERR_INVALID_TARGET:
            return 'ERR_INVALID_TARGET';
        case ERR_FULL:
            return 'ERR_FULL';
        case ERR_NOT_ENOUGH_EXTENSIONS:
            return 'ERR_NOT_ENOUGH_EXTENSIONS';
        case ERR_NOT_ENOUGH_RESOURCES:
            return 'ERR_NOT_ENOUGH_RESOURCES';
        case ERR_NOT_FOUND:
            return 'ERR_NOT_FOUND';
        case ERR_NOT_ENOUGH_ENERGY:
            return 'ERR_NOT_ENOUGH_ENERGY';
        case ERR_TIRED:
            return 'ERR_TIRED';
        case ERR_NO_BODYPART:
            return 'ERR_NO_BODYPART';
        default:
            return 'UNKNOWN';
    }
}

export function getAttack(creep: Creep) {
    if(creep.body.find(b => b.type === ATTACK)) {
        return (target: any) => creep.attack(target);
    }
    if(creep.body.find(b => b.type === RANGED_ATTACK)) {
        return (target: any) => creep.rangedAttack(target);
    }
    return (target: any) => {return ERR_NO_BODYPART};
}