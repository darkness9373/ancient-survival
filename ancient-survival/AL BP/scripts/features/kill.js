import { world, EntityComponentTypes, Player } from '@minecraft/server'
import Score from '../extension/Score.js'

world.afterEvents.entityDie.subscribe(ev => {
    const killer = ev.damageSource?.damagingEntity
    const dead = ev.deadEntity
    
    if (!(killer instanceof Player)) return
    
    const family = dead.getComponent(EntityComponentTypes.TypeFamily)
    if (!family) return
    
    // MONSTER
    if (family.hasTypeFamily('monster')) {
        Score.add(killer, 'killMonster', 1)
        return
    }
    
    // MOB / HEWAN
    if (
        family.hasTypeFamily('animal') ||
        family.hasTypeFamily('ambient') ||
        family.hasTypeFamily('water_animal')
    ) {
        Score.add(killer, 'killMob', 1)
    }
})