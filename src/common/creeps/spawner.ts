import { getObjectsByPrototype } from "game/utils";
import { Creep, StructureSpawn } from "game/prototypes";
import { ATTACK, CARRY, ERR_BUSY, MOVE, WORK } from "game/constants";
import { harvesterUpdate } from "../fsm/harvester";
import { builderUpdate } from "../fsm/builder";
import { attackerUpdate } from "../fsm/attacker";
import { creepFSMs } from "./registry";
import { action } from "../utils/utils";

export type Role = "harvester" | "builder" | "attacker";

// Define body part type based on available constants
type BodyPartType = typeof ATTACK | typeof CARRY | typeof MOVE | typeof WORK;

export interface RoleConfig {
  role: Role;
  prefix: string;
  body: BodyPartType[];
  min: number;
  updater: (creep: Creep) => void;
  weight: number;
}

export function getCreepCounts(): Record<Role, number> {
  const all = [...creepFSMs.values()];
  return {
    harvester: all.filter(c => c.name.startsWith("harv")).length,
    builder: all.filter(c => c.name.startsWith("build")).length,
    attacker: all.filter(c => c.name.startsWith("atk")).length,
  };
}

let creepBeingSpawed: { name: string; updater: (creep: Creep) => void; creep: Creep } | undefined = undefined;

export function spawnCreeps(): void {
  if (creepBeingSpawed?.creep.exists) {
    creepFSMs.set(creepBeingSpawed.creep.id.toString(), {
      name: creepBeingSpawed.name,
      updater: creepBeingSpawed.updater
    });
    creepBeingSpawed = undefined;
  }

  const spawn = getObjectsByPrototype(StructureSpawn).filter(spawn => spawn.my)[0];
  if (!spawn || spawn.spawning) return;

  const roleConfigs: RoleConfig[] = [
    { role: "harvester", updater: harvesterUpdate, prefix: "harv", body: [WORK, CARRY, MOVE], min: 2, weight: 3 },
    { role: "builder", updater: builderUpdate, prefix: "build", body: [WORK, CARRY, MOVE], min: 1, weight: 1 },
    { role: "attacker", updater: attackerUpdate, prefix: "atk", body: [ATTACK, MOVE], min: 1, weight: 5 },
  ];

  const counts = getCreepCounts();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  for (const cfg of roleConfigs) {
    if (counts[cfg.role] < cfg.min) {
      return trySpawn(cfg, spawn);
    }
  }

  const ratios = roleConfigs.map(cfg => {
    const actual = counts[cfg.role] || 0;
    const ideal = total === 0 ? 1 : (cfg.weight / roleConfigs.reduce((a, b) => a + b.weight, 0)) * total;
    return { cfg, ratio: actual / ideal };
  });

  ratios.sort((a, b) => a.ratio - b.ratio);
  trySpawn(ratios[0].cfg, spawn);
}

function trySpawn(cfg: RoleConfig, spawn: StructureSpawn): void {
  const name = `${cfg.prefix}_${Date.now().toString(36).slice(-4)}`;
  const result = action(() => spawn.spawnCreep(cfg.body), new Map([[ERR_BUSY, () => {}]]));
  
  if (result && typeof result === 'object' && 'object' in result && result.object) {
    creepBeingSpawed = {
      name,
      updater: cfg.updater,
      creep: result.object
    };
  }
} 