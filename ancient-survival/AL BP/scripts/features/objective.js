import { world } from '@minecraft/server';
import Obj from '../extension/Objective.js';
import { OBJECTIVES } from '../config/system';

world.afterEvents.worldLoad.subscribe(() => {
  const objectives = world.scoreboard.getObjectives().map(o => o.id)
  
  for (const obj of OBJECTIVES) {
    if (!objectives.includes(obj)) {
      Obj.add(obj)
    }
  }
})