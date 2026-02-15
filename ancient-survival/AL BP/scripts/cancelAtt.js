import { world, Player, EntityComponentTypes, EquipmentSlot, EntityDamageCause } from "@minecraft/server";


world.beforeEvents.entityHurt.subscribe(data => {
    const attacker = data.damageSource.damagingEntity
    const target = data.hurtEntity
    
    if (!(attacker instanceof Player)) return
    if (!(target instanceof Player)) return
    
    if (attacker.hasTag('pvp') && target.hasTag('pvp')) return
    
    // Batasi PvP hanya player dengan tag 'pvp'
    if (!attacker.hasTag('pvp') || !target.hasTag('pvp')) {
        data.cancel = true
    }
})