import { system, world, BlockPermutation, ItemStack, Player, BlockTypes } from "@minecraft/server";
import { text } from '../config/text'
import Extra from '../extension/Extra'

const EXPIRE_HOURS = 24
const EXPIRE_TICKS = EXPIRE_HOURS * 60 * 60 * 20
const EXPIRE_MS = EXPIRE_HOURS * 60 * 60 * 1000

function tryEquipItem(player, item) {
    const equip = player.getComponent('equippable')
    const inv = player.getComponent('inventory').container
    
    // === ARMOR ===
    if (item.typeId.includes('_helmet')) {
        if (!equip.getEquipment('Head')) {
            equip.setEquipment('Head', item)
            return true
        }
    }
    
    if (item.typeId.includes('_chestplate')) {
        if (!equip.getEquipment('Chest')) {
            equip.setEquipment('Chest', item)
            return true
        }
    }
    
    if (item.typeId.includes('_leggings')) {
        if (!equip.getEquipment('Legs')) {
            equip.setEquipment('Legs', item)
            return true
        }
    }
    
    if (item.typeId.includes('_boots')) {
        if (!equip.getEquipment('Feet')) {
            equip.setEquipment('Feet', item)
            return true
        }
    }
    
    // === OFFHAND (shield, totem) ===
    if (
        item.typeId === 'minecraft:shield' ||
        item.typeId === 'minecraft:totem_of_undying'
    ) {
        if (!equip.getEquipment('Offhand')) {
            equip.setEquipment('Offhand', item)
            return true
        }
    }
    
    // === INVENTORY ===
    const leftover = inv.addItem(item)
    return !leftover
}

function getBlockTypeAt(dim, x, y, z) {
    return dim.getBlock({ x, y, z })?.typeId
}

function isLiquid(block) {
    if (!block) return false
    return block.typeId === 'minecraft:lava' || block.typeId === 'minecraft:water'
}

function isAir(block) {
    return !block || block.typeId === 'minecraft:air'
}

/**
 * Cari posisi aman untuk gravestone
 */
function findGravestoneLocation(dim, x, y, z) {
    let base = dim.getBlock({ x, y, z })
    if (!base) return { x, y, z }
    
    /* ===== VOID ===== */
    if (y <= -64) {
        const safe = dim.findSafeLocation({ x, y: 320, z })
        if (safe) return safe
        return { x, y: 64, z }
    }
    
    /* ===== LAVA ===== */
    if (base.typeId === 'minecraft:lava') {
        let checkY = y
        while (checkY < 320) {
            const b = dim.getBlock({ x, y: checkY, z })
            if (b && b.typeId === 'minecraft:air') {
                return {
                    x,
                    y: checkY,
                    z,
                    placeStoneBelow: true
                }
            }
            checkY++
        }
    }
    
    /* ===== AIR ===== */
    if (base.typeId === 'minecraft:water') {
        let checkY = y
        while (checkY > -64) {
            const below = dim.getBlock({ x, y: checkY - 1, z })
            if (below && below.typeId !== 'minecraft:water') {
                return {
                    x,
                    y: checkY,
                    z
                }
            }
            checkY--
        }
    }
    
    /* ===== NORMAL ===== */
    return { x, y, z }
}

function isPassable(block) {
    if (!block) return true;
    
    const id = block.typeId;
    
    return (
        id === 'minecraft:air' ||
        id === 'minecraft:water' ||
        id === 'minecraft:lava'
    );
}

function findNearbySafeSpot(dim, x, y, z) {
    const radius = 6;
    
    for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
                
                const bx = x + dx;
                const by = y + dy;
                const bz = z + dz;
                
                const below = dim.getBlock({ x: bx, y: by - 1, z: bz });
                const at = dim.getBlock({ x: bx, y: by, z: bz });
                const above = dim.getBlock({ x: bx, y: by + 1, z: bz });
                
                if (
                    below &&
                    !isPassable(below) && // tanah solid
                    isPassable(at) &&
                    isPassable(above)
                ) {
                    return { x: bx, y: by, z: bz };
                }
            }
        }
    }
    
    return { x, y, z }; // fallback
}

const GRAVESTONE_ENTITY = 'drk:gravestone_item'
const GRAVESTONE_BLOCK = 'drk:gravestone_block'
const GRAVESTONE_KEY = 'drk:gravestone_key'

world.beforeEvents.playerBreakBlock.subscribe(async data => {
    const player = data.player
    const block = data.block
    const dim = player.dimension
    
    if (block.typeId !== GRAVESTONE_BLOCK) return
    await null
    
    const graves = dim.getEntities({
        location: block.location,
        type: GRAVESTONE_ENTITY,
        maxDistance: 1
    })
    
    if (graves.length === 0) return
    
    const grave = graves[0]
    const ownerTag = `owner:${player.id}`
    
    /* === CEK OWNER === */
    if (!grave.hasTag(ownerTag)) {
        data.cancel = true
        player.sendMessage(
            text('Ini bukan gravestone milikmu!').System.fail
        )
        block.setPermutation(BlockPermutation.resolve(GRAVESTONE_BLOCK))
        return
    }
    
    data.cancel = true // stop default break
    
    /* === SAFETY CHECK === */
    const x = block.location.x
    const y = block.location.y
    const z = block.location.z
    
    const blockBelow = dim.getBlock({ x, y: y - 1, z })?.typeId
    const blockAt = dim.getBlock({ x, y, z })?.typeId
    
    if (blockBelow === 'minecraft:lava' || blockAt === 'minecraft:lava') {
        player.addEffect('fire_resistance', 6 * 20, {
            showParticles: false
        })
    }
    
    if (blockAt === 'minecraft:water') {
        player.addEffect('water_breathing', 8 * 20, {
            showParticles: false
        })
    }
    
    /* === PINDAHKAN ITEM === */
    const graveInv = grave.getComponent('inventory').container
    const playerInv = player.getComponent('inventory').container
    
    for (let i = 0; i < graveInv.size; i++) {
        const item = graveInv.getItem(i)
        if (!item) continue
        
        const success = tryEquipItem(player, item)
        
        // kalau masih gagal, jatuhkan ke dunia (anti lost)
        if (!success) {
            dim.spawnItem(item, player.location)
        }
    }
    const storedXP = grave.getDynamicProperty('stored_xp') ?? 0
    
    if (storedXP > 0) {
        player.addLevels(storedXP)
        grave.setDynamicProperty('stored_xp', 0);
    }
    player.playSound('random.levelup')
    player.sendMessage(
        text(`XP dikembalikan: §a+${storedXP}`).System.succ
    )
    
    /* === HAPUS GRAVESTONE === */
    block.setPermutation(BlockPermutation.resolve('minecraft:air'))
    grave.remove()
})

world.beforeEvents.playerInteractWithBlock.subscribe(async data => {
    const player = data.player
    const block = data.block
    const dim = player.dimension
    
    if (block.typeId !== GRAVESTONE_BLOCK) return
    await null
    
    const grave = dim.getEntities({
        type: GRAVESTONE_ENTITY,
        location: block.location,
        maxDistance: 1
    })[0]
    
    if (!grave) return
    
    const ownerTag = 'owner:' + player.id
    
    if (!grave.hasTag(ownerTag)) {
        data.cancel = true
        player.sendMessage(
            text('Ini bukan gravestone milikmu!').System.fail
        )
        return
    }
    
    /* === SAFETY CHECK BLOK === */
    const x = block.location.x
    const y = block.location.y
    const z = block.location.z
    
    const blockBelow = dim.getBlock({ x, y: y - 1, z })?.typeId
    const blockAt = dim.getBlock({ x, y, z })?.typeId
    
    /* === PROTEKSI PLAYER === */
    if (blockBelow === 'minecraft:lava' || blockAt === 'minecraft:lava') {
        player.addEffect('fire_resistance', 6 * 20, {
            showParticles: false
        })
    }
    
    if (blockAt === 'minecraft:water') {
        player.addEffect('water_breathing', 8 * 20, {
            showParticles: false
        })
    }
    
    /* === PINDAHKAN ITEM === */
    const graveInv = grave.getComponent('inventory').container
    const playerInv = player.getComponent('inventory').container
    
    for (let i = 0; i < graveInv.size; i++) {
        const item = graveInv.getItem(i)
        if (!item) continue
        
        const success = tryEquipItem(player, item)
        
        // kalau masih gagal, jatuhkan ke dunia (anti lost)
        if (!success) {
            dim.spawnItem(item, player.location)
        }
    }
    const storedXP = grave.getDynamicProperty('stored_xp') ?? 0
    
    if (storedXP > 0) {
        player.addLevels(storedXP)
        grave.setDynamicProperty('stored_xp', 0);
    }
    player.playSound('random.levelup')
    player.sendMessage(
        text(`XP dikembalikan: §a+${storedXP}`).System.succ
    )
    
    /* === HAPUS GRAVESTONE === */
    block.setPermutation(BlockPermutation.resolve('minecraft:air'))
    grave.remove()
})



world.afterEvents.itemUse.subscribe(ev => {
    const item = ev.itemStack
    const player = ev.source
    
    if (item.typeId !== GRAVESTONE_KEY) return
    
    let gravestoneLocation = item.getDynamicProperty('gravestone_location') ?? '{}'
    let raw;
    try {
        raw = JSON.parse(gravestoneLocation);
    } catch {
        return;
    }
    
    if (!raw.dimension) return player.sendMessage(text('Data dimension error! Gagal melakukan teleport').System.fail);
    
    const dim = world.getDimension(raw.dimension)
    
    /* === TELEPORT AMAN (1 TICK DELAY) === */
    system.run(() => {
        player.tryTeleport(
        {
            x: raw.x + 0.5,
            y: raw.y + 1,
            z: raw.z + 0.5
        },
        {
            dimension: dim,
            keepVelocity: false,
            checkForBlocks: true
        })
        /* === HAPUS KEY === */
        const equip = player.getComponent('equippable')
        equip.setEquipment('Mainhand', undefined)
        
        /* === CEK KONDISI BLOK === */
        const blockBelow = getBlockTypeAt(dim, raw.x, raw.y - 1, raw.z)
        const blockAt = getBlockTypeAt(dim, raw.x, raw.y, raw.z)
        const blockHead = getBlockTypeAt(dim, raw.x, raw.y + 1, raw.z)
        
        /* === LAVA === */
        if (blockBelow === 'minecraft:lava' || blockAt === 'minecraft:lava') {
            player.addEffect('fire_resistance', 8 * 20, {
                showParticles: false
            })
        }
        
        /* === AIR === */
        if (blockAt === 'minecraft:water' || blockHead === 'minecraft:water') {
            player.addEffect('water_breathing', 10 * 20, {
                showParticles: false
            })
        }
    })
})

const GRAVE_POS = {
    x: 24,
    y: 113,
    z: -49,
    dimension: 'overworld'
}

world.afterEvents.entityDie.subscribe(data => {
    const player = data.deadEntity
    if (!(player instanceof Player)) return
    
    let dim = player.dimension
    const pos = player.location
    
    const isVoidDeath = pos.y < -64
    
    const bx = Math.floor(pos.x)
    const by = Math.floor(pos.y)
    const bz = Math.floor(pos.z)
    
    let gx, gy, gz, safe;
    
    if (isVoidDeath) {
        const sp = player.getSpawnPoint();
        
        if (sp) {
            dim = world.getDimension(sp.dimension.id);
            
            const sx = Math.floor(sp.x);
            const sy = Math.floor(sp.y);
            const sz = Math.floor(sp.z);
            
            // cek block spawn
            const spawnBlock = dim.getBlock({ x: sx, y: sy, z: sz });
            
            if (!isPassable(spawnBlock)) {
                const safeSpot = findNearbySafeSpot(dim, sx, sy, sz);
                gx = safeSpot.x;
                gy = safeSpot.y;
                gz = safeSpot.z;
            } else {
                gx = sx;
                gy = sy;
                gz = sz;
            }
            
        } else {
            dim = world.getDimension(GRAVE_POS.dimension)
            
            const sx = Math.floor(GRAVE_POS.x);
            const sy = Math.floor(GRAVE_POS.y);
            const sz = Math.floor(GRAVE_POS.z);
            
            const spawnBlock = dim.getBlock({ x: sx, y: sy, z: sz });
            
            if (!isPassable(spawnBlock)) {
                const safeSpot = findNearbySafeSpot(dim, sx, sy, sz);
                gx = safeSpot.x;
                gy = safeSpot.y;
                gz = safeSpot.z;
            } else {
                gx = sx;
                gy = sy;
                gz = sz;
            }
        }
    } else {
        
        // 🔹 CEK BLOCK DI TEMPAT MATI
        const blockAtDeath = dim.getBlock({ x: bx, y: by, z: bz });
        
        // kalau block bukan passable → cari spot aman
        if (!isPassable(blockAtDeath)) {
            const safeSpot = findNearbySafeSpot(dim, bx, by, bz);
            
            gx = safeSpot.x;
            gy = safeSpot.y;
            gz = safeSpot.z;
        }
        else {
            safe = findGravestoneLocation(dim, bx, by, bz);
            
            gx = safe.x;
            gy = safe.y;
            gz = safe.z;
        }
    }
    
    const playerInv = player.getComponent('inventory').container
    
    /* === KEY === */
    const keyItem = new ItemStack(GRAVESTONE_KEY, 1)
    keyItem.nameTag = `§r§6${player.name}'s Key`
    keyItem.setDynamicProperty('gravestone_location', JSON.stringify({
        x: gx,
        y: gy,
        z: gz,
        dimension: dim.id
    }))
    keyItem.setLore([`${gx} ${gy} ${gz}`])
    
    /* === BLOCK GRAVESTONE === */
    const graveBlock = dim.getBlock({ x: gx, y: gy, z: gz })
    if (graveBlock) {
        graveBlock.setPermutation(BlockPermutation.resolve(GRAVESTONE_BLOCK))
    }
    
    if (safe?.placeStoneBelow) {
        const below = dim.getBlock({ x: gx, y: gy - 1, z: gz })
        below.setPermutation(BlockPermutation.resolve('minecraft:stone'))
    }
    
    /* === ENTITY GRAVESTONE === */
    const grave = dim.spawnEntity(GRAVESTONE_ENTITY, {
        x: gx + 0.5,
        y: gy,
        z: gz + 0.5
    })
    
    grave.nameTag = player.name
    grave.addTag('owner:' + player.id)
    
    grave.setDynamicProperty(
        'expire_tick',
        system.currentTick + EXPIRE_TICKS
    )
    grave.setDynamicProperty(
        'expire_time',
        Date.now() + EXPIRE_MS
    )
    
    grave.setDynamicProperty(
        'stored_xp',
        Math.floor(player.level * 0.5) // simpan 50%
    )
    /* === PINDAHKAN ITEM DROP === */
    const graveInv = grave.getComponent('inventory').container
    const near = dim.getEntities({
        location: pos,
        type: 'minecraft:item',
        maxDistance: 6
    })
    
    for (const item of near) {
        if (graveInv.emptySlotsCount <= 0) break
        graveInv.addItem(item.getComponent('item').itemStack)
        item.remove()
    }
    
    playerInv.addItem(keyItem)
    
    player.sendMessage(
        text(`Kamu mati di §e${gx} ${gy} ${gz}\n§6Gravestone akan menghilang dalam 24 jam jika tidak diambil`).System.fail
    )
})

const CLEAN_INTERVAL = 20 * 60 // cek tiap 1 menit

system.runInterval(() => {
    const nowTick = system.currentTick
    const nowTime = Date.now()
    
    for (const dim of [
            world.getDimension('overworld'),
            world.getDimension('nether'),
            world.getDimension('the_end')
        ]) {
        const graves = dim.getEntities({
            type: GRAVESTONE_ENTITY
        })
        
        for (const grave of graves) {
            const expireTick = grave.getDynamicProperty('expire_tick')
            const expireTime = grave.getDynamicProperty('expire_time')
            
            if (!expireTick && !expireTime) {
                // gravestone lama (sebelum sistem expire)
                grave.setDynamicProperty(
                    'expire_tick',
                    system.currentTick + (EXPIRE_HOURS * 60 * 60 * 20)
                )
                
                grave.setDynamicProperty(
                    'expire_time',
                    Date.now() + (EXPIRE_HOURS * 60 * 60 * 1000)
                )
                
                continue
            }
            
            if (
                (expireTick && nowTick >= expireTick) ||
                (expireTime && nowTime >= expireTime)
            ) {
                const loc = grave.location
                const bx = Math.floor(loc.x)
                const by = Math.floor(loc.y)
                const bz = Math.floor(loc.z)
                
                const block = dim.getBlock({ x: bx, y: by, z: bz })
                
                if (block?.typeId === GRAVESTONE_BLOCK) {
                    block.setPermutation(
                        BlockPermutation.resolve('minecraft:air')
                    )
                }
                
                grave.remove()
            }
        }
    }
}, CLEAN_INTERVAL)