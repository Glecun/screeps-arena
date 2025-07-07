import { getObjectsByPrototype, findClosestByPath } from "game/utils";
import { type Creep, Source, ConstructionSite } from "game/prototypes";
import { ERR_NOT_IN_RANGE } from "game/constants";
import { harvesterUpdate } from "./harvester";
import { action } from "../utils/utils";

export function builderUpdate(creep: Creep): void {
  const sites = getObjectsByPrototype(ConstructionSite);
  const site = findClosestByPath(creep, sites);
  if (!site) {
    harvesterUpdate(creep);
    return;
  }

  if (creep.store.getUsedCapacity() === 0) {
    const source = findClosestByPath(creep, getObjectsByPrototype(Source));
    if (source) {
      action(
        () => creep.harvest(source),
        new Map([[ERR_NOT_IN_RANGE, () => action(() => creep.moveTo(source))]])
      );
    }
  } else {
    action(
      () => creep.build(site),
      new Map([[ERR_NOT_IN_RANGE, () => action(() => creep.moveTo(site))]])
    );
  }
} 