import { getObjectsByPrototype, findClosestByPath, getRange } from "game/utils";
import { Creep, OwnedStructure } from "game/prototypes";
import { BOTTOM, LEFT, RIGHT, TOP } from "game/constants";
import { action } from "../../utils/utils";
import { ATTACK, MOVE } from "game/constants";

export const attackerBodies = [[ATTACK, MOVE], [ATTACK, ATTACK, MOVE], [ATTACK, ATTACK, ATTACK, MOVE, MOVE], [ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE]];
export function attackerRunner(creep: Creep): void {
  const enemies = getObjectsByPrototype(Creep).filter(c => c.my === false);
  //@ts-ignore
  const structures = getObjectsByPrototype(OwnedStructure).filter(c => c.my === false);
  const target = findClosestByPath(creep, [...enemies, ...structures]);

  if (target) {
    if (getRange(creep, target) <= 1) {
      action(() => creep.attack(target));
    } else {
      action(() => creep.moveTo(target));
    }
  } else {
    const dirs = [TOP, RIGHT, BOTTOM, LEFT] as const;
    const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
    action(() => creep.move(randomDir));
  }
} 