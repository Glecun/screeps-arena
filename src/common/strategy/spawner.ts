import {getObjectsByPrototype} from 'game/utils';
import {type Creep, StructureSpawn, type BodyPartType, type SpawnCreepResult} from 'game/prototypes';
import {BODYPART_COST, ERR_BUSY} from 'game/constants';
import {harvesterConfig} from '../creeps/roles/harvester';
import {builderConfig} from '../creeps/roles/builder';
import {guardConfig} from '../creeps/roles/guard';
import {myCreeps} from '../creeps/registry';
import {action} from '../utils/utils';
import type {CreepState, Role, RoleConfig} from '../creeps/types';
import {attackerConfig} from '../creeps/roles/attacker';
import {attackerRangedConfig} from '../creeps/roles/attacker-ranged';

const creepSkeletons: RoleConfig[] = [harvesterConfig, builderConfig, guardConfig, attackerConfig, attackerRangedConfig];

let creepBeingSpawed: (CreepState & {creep: Creep}) | undefined;

export function spawnCreeps(): void {
    updateCreepBeingSpawned();

    const spawn = getObjectsByPrototype(StructureSpawn).filter((spawn) => spawn.my)[0];
    if (!spawn || spawn.spawning) return;

    const {counts, total} = getCreepCounts();

    spawnAccordingToMin(counts, spawn);
    if (spawn.spawning) return;

    spawnAccordingToRatio(counts, total, spawn);
}

function spawnAccordingToRatio(counts: Record<Role, number>, total: number, spawn: StructureSpawn) {
    const ratios = creepSkeletons
        .filter((skeleton) => (counts[skeleton.role] || 0) < skeleton.max)
        .map((skeleton) => {
            const actual = counts[skeleton.role] || 0;
            const ideal = total === 0 ? 1 : (skeleton.weight / creepSkeletons.reduce((a, b) => a + b.weight, 0)) * total;
            return {skeleton, ratio: actual / ideal};
        });

    ratios.sort((a, b) => a.ratio - b.ratio);
    trySpawn(ratios[0].skeleton, spawn);
}

function spawnAccordingToMin(counts: Record<Role, number>, spawn: StructureSpawn) {
    for (const skeleton of creepSkeletons) {
        if (counts[skeleton.role] < skeleton.min) {
            trySpawn(skeleton, spawn);
        }
    }
}

function updateCreepBeingSpawned() {
    if (creepBeingSpawed?.creep.exists) {
        myCreeps.set(creepBeingSpawed.creep.id.toString(), {
            role: creepBeingSpawed.role,
            runner: creepBeingSpawed.runner,
        });
        creepBeingSpawed = undefined;
    }
}

export function getCreepCounts(): {counts: Record<Role, number>; total: number} {
    const all = [...myCreeps.values()];
    const counts = {
        harvester: all.filter((c) => c.role === 'harvester').length,
        builder: all.filter((c) => c.role === 'builder').length,
        attacker: all.filter((c) => c.role === 'attacker').length,
        guard: all.filter((c) => c.role === 'guard').length,
        'attacker-ranged': all.filter((c) => c.role === 'attacker-ranged').length,
    };
    return {counts, total: Object.values(counts).reduce((a, b) => a + b, 0)};
}

function trySpawn(skeleton: RoleConfig, spawn: StructureSpawn): void {
    const body = mostExpensiveAffordableBody(skeleton.bodies, spawn.store.energy);
    if (!body) return;
    const {result} = action<SpawnCreepResult>(() => spawn.spawnCreep(body), {[ERR_BUSY]: () => {}});

    if (result && typeof result === 'object' && 'object' in result && result.object) {
        creepBeingSpawed = {
            role: skeleton.role,
            runner: skeleton.runner,
            creep: result.object,
        };
    }
}

function mostExpensiveAffordableBody(bodies: BodyPartType[][], energy: number): BodyPartType[] | undefined {
    const affordableBodies: BodyPartType[][] = bodies.filter(
        (body) => body.reduce((a: number, b: BodyPartType) => a + BODYPART_COST[b as keyof typeof BODYPART_COST], 0) <= energy,
    );
    if (affordableBodies.length === 0) return undefined;
    const mostExpensiveBodies = affordableBodies.sort(
        (a, b) =>
            b.reduce((a: number, b: BodyPartType) => a + BODYPART_COST[b as keyof typeof BODYPART_COST], 0) -
            a.reduce((a: number, b: BodyPartType) => a + BODYPART_COST[b as keyof typeof BODYPART_COST], 0),
    );
    return mostExpensiveBodies[0]!;
}
