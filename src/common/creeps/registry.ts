import { Creep } from "game/prototypes";

/**
 * Registry for creep finite state machines
 */
// TODO rename creepFSMs + change name to role
export const creepFSMs = new Map<string, { name: string; updater: (creep: Creep) => void }>(); 