import { world, Player, EntityComponentTypes, Entity } from '@minecraft/server'
import Score from '../extension/Score';


world.afterEvents.entityHitEntity.subscribe(data => {
    const player = data.damagingEntity;
    const hit = data.hitEntity;
    const inv = player.getComponent(EntityComponentTypes.Inventory).container;
    if (player instanceof Player) {
        if (hit.typeId === 'npc:npc_custom') {
            const hand = inv.getItem(player.selectedSlotIndex)
            if (!hand) return;
            if (!player.hasTag('admin')) return;
            if (hand.typeId === 'minecraft:stick') {
                if (hand.nameTag === 'variant') {
                    const variant = hit.getComponent(EntityComponentTypes.Variant)
                    if (!variant) return;
                    const current = variant.value;
                    const max = 4;
                    const next = (current + 1) % max;
                    hit.triggerEvent(`set_variant_${next}`);
                } else if (hand.nameTag === 'size') {
                    let size = Score.get(hit, 'size') ?? 0
                    let tog = 1 - size;
                    const index = ['statue', 'normal']
                    hit.triggerEvent('minecraft:' + index[size])
                    Score.set(hit, 'size', tog)
                } else if (hand.nameTag === 'look') {
                    let look = Score.get(hit, 'look') ?? 0
                    let tog = 1 - look;
                    const index = ['can_look', 'no_look']
                    hit.triggerEvent('minecraft:' + index[look])
                    Score.set(hit, 'look', tog)
                } else if (hand.nameTag === 'direction') {
                    faceEntityToPlayer8Dir(hit, player)
                }
            }
        }
    }
})

/**
 * 
 * @param {Entity} entity 
 * @param {Player} player 
 */
function getSnappedYaw(entity, player) {
    const ex = entity.location.x;
    const ez = entity.location.z;
    const px = player.location.x;
    const pz = player.location.z;
    
    const dx = px - ex;
    const dz = pz - ez;
    
    let yaw = Math.atan2(-dx, dz) * (180 / Math.PI);
    
    yaw = (yaw + 360) % 360;
    
    const snappedYaw = Math.round(yaw / 45) * 45;
    
    return snappedYaw % 360;
}

/**
 * 
 * @param {Entity} entity 
 * @param {Player} player 
 */
function faceEntityToPlayer8Dir(entity, player) {
    const yaw = getSnappedYaw(entity, player);
    
    entity.setRotation({
        x: 0,
        y: yaw
    })
}