import { getObjectsByPrototype } from "game/utils";
import { Creep } from "game/prototypes";
import { harvesterUpdate } from "../common/fsm/harvester";
import { creepFSMs } from "../common/creeps/registry";
import { runStrategy } from "../common/strategy/controller";

let tickCounter = 0;

function logInfos(): void {
  tickCounter = tickCounter + 1;
  if (tickCounter >= 20) {
    console.log('creepFSMs', creepFSMs);
    tickCounter = 0;
  }
}

function getUpdater(id: string): (creep: Creep) => void {
  const updater = creepFSMs.get(id)?.updater;
  return updater ?? harvesterUpdate;
}

export function loop(): void {
  logInfos();
  runStrategy();

  const creeps = getObjectsByPrototype(Creep).filter(c => c.my);
  for (const creep of creeps) {
    getUpdater(creep.id.toString())(creep);
  }
} 