import { world, Player, EntityComponentTypes, EquipmentSlot, EntityDamageCause } from "@minecraft/server";

const itemList = [
    'rex:ice',
    'rex:soul'
]

world.beforeEvents.entityHurt.subscribe(data => {
    const player = data.damageSource.damagingEntity
    const target = data.hurtEntity

    if ((target instanceof Player) && (player instanceof Player)) {
        if (!target.hasTag('pvp')) {
            data.cancel = true;
        }
        if (!player.hasTag('pvp')) {
            data.cancel = true
        }
    }

    if (!(player instanceof Player)) return

    if (data.damageSource.cause !== EntityDamageCause.entityAttack) return

    const mainhand = player.getComponent(EntityComponentTypes.Equippable).getEquipment(EquipmentSlot.Mainhand)
    if (itemList.includes(mainhand.typeId)) {
        data.cancel = true;
    }
})