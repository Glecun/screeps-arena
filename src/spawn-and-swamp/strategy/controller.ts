import { sendAllArmiesIfTImeIsRunningOut } from './army';
import {spawnCreeps} from './spawner';

export function runStrategy(): void {
    spawnCreeps();
    sendAllArmiesIfTImeIsRunningOut();
}
