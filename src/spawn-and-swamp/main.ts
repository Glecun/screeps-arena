import { ATTACK, MOVE } from 'game/constants'
import { type Creep, StructureSpawn } from 'game/prototypes'
import { getObjectsByPrototype } from 'game/utils'

let attacker: Creep | undefined

export function loop() {
  if (attacker) {
    const enemySpawn = getObjectsByPrototype(StructureSpawn).find(i => !i.my)
    if (enemySpawn) {
      attacker.moveTo(enemySpawn)
      attacker.attack(enemySpawn)
    }
  } else {
    const mySpawn = getObjectsByPrototype(StructureSpawn).find(i => i.my)
    if (mySpawn) {
      attacker = mySpawn.spawnCreep([MOVE, ATTACK]).object
    }
  }
}
