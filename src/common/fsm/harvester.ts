import { getObjectsByPrototype, findClosestByPath } from "game/utils";
import { Creep, Source, Structure, StructureContainer, StructureSpawn } from "game/prototypes";
import { ERR_BUSY, ERR_INVALID_TARGET, ERR_NOT_IN_RANGE, RESOURCE_ENERGY } from "game/constants";
import { action } from "../utils/utils";

export function harvesterUpdate(creep: Creep): void {
  const sources = getObjectsByPrototype(Source).filter(source => source.energy > 0);
  const containers = getObjectsByPrototype(StructureContainer).filter(container => 
    container.store.getUsedCapacity(RESOURCE_ENERGY) > 0
  );
  const allTargets = [...sources, ...containers];

  if (creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
    // Try to harvest from source
    const sourceTarget = findClosestByPath(creep, sources);
    if (sourceTarget) {
      action(
        () => creep.harvest(sourceTarget),
        new Map([
          [ERR_NOT_IN_RANGE, () => action(() => creep.moveTo(sourceTarget))],
          [ERR_INVALID_TARGET, () => ({})],
          [ERR_BUSY, () => ({})]
        ])
      );
    }

    // Try to withdraw from container
    const containerTarget = findClosestByPath(creep, containers);
    if (containerTarget) {
      action(
        () => creep.withdraw(containerTarget, RESOURCE_ENERGY),
        new Map([
          [ERR_NOT_IN_RANGE, () => action(() => creep.moveTo(containerTarget))],
          [ERR_INVALID_TARGET, () => ({})],
          [ERR_BUSY, () => ({})]
        ])
      );
    }
  } else {
    const spawnTarget = getObjectsByPrototype(StructureSpawn).filter(spawn => spawn.my)[0];
    if (spawnTarget) {
      action(
        () => creep.transfer(spawnTarget, RESOURCE_ENERGY),
        new Map([[ERR_NOT_IN_RANGE, () => action(() => creep.moveTo(spawnTarget))]])
      );
    }
  }
} 