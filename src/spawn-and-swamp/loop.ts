import { getObjectsByPrototype } from "game/utils";
import { Creep } from "game/prototypes";
import { harvesterUpdate } from "../common/fsm/harvester";
import { myCreeps } from "../common/creeps/registry";
import { runStrategy } from "../common/strategy/controller";
import { logInfos } from "../common/utils/utils";

export function loop(): void {
  logInfos();
  runStrategy();
  runScreeps();
} 

function getRunner(id: string): (creep: Creep) => void {
  const runner = myCreeps.get(id)?.run;
  return runner ?? harvesterUpdate;
}

function runScreeps() {
  const creeps = getObjectsByPrototype(Creep).filter(c => c.my);
  for (const creep of creeps) {
    getRunner(creep.id.toString())(creep);
  }
}
