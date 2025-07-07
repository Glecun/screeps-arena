import { getObjectsByPrototype } from "game/utils";
import { type Creep, StructureSpawn, type BodyPartType, type SpawnCreepResult } from "game/prototypes";
import { ATTACK, BODYPART_COST, CARRY, ERR_BUSY, MOVE, WORK } from "game/constants";
import { harvesterUpdate } from "../fsm/harvester";
import { builderUpdate } from "../fsm/builder";
import { attackerUpdate } from "../fsm/attacker";
import { myCreeps } from "./registry";
import { action } from "../utils/utils";
import type { CreepState, Role, RoleConfig } from "./types";
import { guardUpdate } from "../fsm/guard";

let creepBeingSpawed: CreepState & { creep: Creep } | undefined ;

const harvesterBodies = [[WORK, CARRY, MOVE], [WORK, CARRY, MOVE, MOVE], [WORK, CARRY, CARRY, MOVE, MOVE], [WORK, WORK, CARRY, CARRY, MOVE, MOVE]];
const builderBodies = [[WORK, CARRY, MOVE], [WORK, CARRY, CARRY, MOVE]];
const attackerBodies = [[ATTACK, MOVE], [ATTACK, ATTACK, MOVE], [ATTACK, ATTACK, ATTACK, MOVE, MOVE], [ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE]];
const guardBodies = [[ATTACK, MOVE], [ATTACK, ATTACK, MOVE], [ATTACK, ATTACK, ATTACK, MOVE, MOVE], [ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE]];
const creepSkeletons: RoleConfig[] = [
  { role: "harvester", run: harvesterUpdate, bodies: harvesterBodies, min: 2, weight: 3 },
  { role: "builder", run: builderUpdate, bodies: builderBodies, min: 1, weight: 1 },
  { role: "guard", run: guardUpdate, bodies: guardBodies, min: 1, weight: 1 },
  { role: "attacker", run: attackerUpdate, bodies: attackerBodies, min: 1, weight: 5 },
];

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
      run: creepBeingSpawed.run
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
      run: skeleton.run,
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