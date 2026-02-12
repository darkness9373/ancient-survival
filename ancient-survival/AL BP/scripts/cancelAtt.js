import { world, Player, EntityComponentTypes, EquipmentSlot } from "@minecraft/server";

const itemList = [
    'drk:shadow',
    'rex:bluf',
    'rex:darkn',
    'rex:ice',
    'rex:soul'
]

world.beforeEvents.entityHurt.subscribe(data => {
    const player = data.damageSource.damagingEntity
    const target = data.hurtEntity
    if (!(player instanceof Player)) return

    const mainhand = player.getComponent(EntityComponentTypes.Equippable).getEquipment(EquipmentSlot.Mainhand)
    if (itemList.includes(mainhand.typeId)) {
        data.cancel = true;
    }
})