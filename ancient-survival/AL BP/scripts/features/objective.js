import { world } from '@minecraft/server';
import Obj from '../extension/Objective.js';

world.afterEvents.worldLoad.subscribe(() => {
  Obj.add('money')
  Obj.add('moneyRaw')
  Obj.add('killMonster')
  Obj.add('killMob')
  Obj.add('ping')
  Obj.add('timePlayed')
})