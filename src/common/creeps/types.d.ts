import type { BodyPartType, Creep } from "game/prototypes";

export type CreepState = {
    role: Role;
    runner: (creep: Creep) => void;
}

export type Role = "harvester" | "builder" | "attacker" | "guard";
