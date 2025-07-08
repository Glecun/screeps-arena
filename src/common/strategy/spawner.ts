import { getObjectsByPrototype } from "game/utils";
import { type Creep, StructureSpawn, type BodyPartType, type SpawnCreepResult } from "game/prototypes";
import { BODYPART_COST, ERR_BUSY } from "game/constants";
import { harvesterBodies, harvesterRunner } from "../creeps/roles/harvester";
import { builderBodies, builderRunner } from "../creeps/roles/builder";
import { attackerBodies, attackerRunner } from "../creeps/roles/attacker";
import { guardBodies, guardRunner } from "../creeps/roles/guard";
import { myCreeps } from "../creeps/registry";
import { action } from "../utils/utils";
import type { CreepState, Role } from "../creeps/types";

export interface RoleConfig {
    role: Role;
    bodies: BodyPartType[][];
    min: number;
    runner: (creep: Creep) => void;
    weight: number;
}

const creepSkeletons: RoleConfig[] = [
  { role: "harvester", runner: harvesterRunner, bodies: harvesterBodies, min: 2, weight: 3 },
  { role: "builder", runner: builderRunner, bodies: builderBodies, min: 1, weight: 1 },
  { role: "guard", runner: guardRunner, bodies: guardBodies, min: 1, weight: 1 },
  { role: "attacker", runner: attackerRunner, bodies: attackerBodies, min: 1, weight: 5 },
];

let creepBeingSpawed: CreepState & { creep: Creep } | undefined ;

export function spawnCreeps(): void {
  updateCreepBeingSpawned();

  const spawn = getObjectsByPrototype(StructureSpawn).filter(spawn => spawn.my)[0];
  if (!spawn || spawn.spawning) return;

  const { counts, total } = getCreepCounts();

  spawnAccordingToMin(counts, spawn);
  if (spawn.spawning) return;

  spawnAccordingToRatio(counts, total, spawn);
}

function spawnAccordingToRatio(counts: Record<Role, number>, total: number, spawn: StructureSpawn) {
  const ratios = creepSkeletons.map(skeleton => {
    const actual = counts[skeleton.role] || 0;
    const ideal = total === 0 ? 1 : (skeleton.weight / creepSkeletons.reduce((a, b) => a + b.weight, 0)) * total;
    return { skeleton, ratio: actual / ideal };
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
      runner: creepBeingSpawed.runner
    });
    creepBeingSpawed = undefined;
  }
}

export function getCreepCounts(): { counts: Record<Role, number>, total: number } {
  const all = [...myCreeps.values()];
  const counts = {
    harvester: all.filter(c => c.role === "harvester").length,
    builder: all.filter(c => c.role === "builder").length,
    attacker: all.filter(c => c.role === "attacker").length,
    guard: all.filter(c => c.role === "guard").length,
  };
  return { counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
}

function trySpawn(skeleton: RoleConfig, spawn: StructureSpawn): void {
  const body = mostExpensiveAffordableBody(skeleton.bodies, spawn.store.energy);
  if (!body) return;
  const {result} = action<SpawnCreepResult>(() => spawn.spawnCreep(body), { [ERR_BUSY]: () => {} });
  
  if (result && typeof result === 'object' && 'object' in result && result.object) {
    creepBeingSpawed = {
      role: skeleton.role,
      runner: skeleton.runner,
      creep: result.object
    };
  }
} 

function mostExpensiveAffordableBody(bodies: BodyPartType[][], energy: number): BodyPartType[] | undefined {
  const affordableBodies = bodies.filter(body => body.reduce((a, b) => a + BODYPART_COST[b], 0) <= energy);
  if (affordableBodies.length === 0) return undefined;
  const mostExpensiveBodies = affordableBodies.sort((a, b) => b.reduce((a, b) => a + BODYPART_COST[b], 0) - a.reduce((a, b) => a + BODYPART_COST[b], 0));
  return mostExpensiveBodies[0]!;
}