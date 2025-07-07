import type { BodyPartType, Creep } from "game/prototypes";

export type CreepState = {
    role: Role;
    run: (creep: Creep) => void;
  }

export type Role = "harvester" | "builder" | "attacker" | "guard";

export interface RoleConfig {
    role: Role;
    bodies: BodyPartType[][];
    min: number;
    run: (creep: Creep) => void;
    weight: number;
  }