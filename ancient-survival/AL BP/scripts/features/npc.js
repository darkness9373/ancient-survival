import { world, Player, ItemStack, EntityComponentTypes, ItemComponentTypes, system } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from '@minecraft/server-ui'
import OpenUI from '../extension/OpenUI'
import Score from "../extension/Score";
import Extra from "../extension/Extra";
import { text } from '../config/text';


system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const inv = player.getComponent("inventory").container;
        const mainSlot = player.selectedSlotIndex;
        for (let i = 0; i < inv.size; i++) {
            const item = inv.getItem(i);
            if (!item || !item.getLore) continue;
            const lore = item.getLore();
            if (!lore || lore[0] !== "§0[ENCHANT]") continue;
            const [id, lvl] = lore[1].replace("§7", "").split(" ");
            if (i === mainSlot) {
                system.runTimeout(() => {
                    try {
                        player.runCommand(`enchant @s ${id} ${lvl}`)
                    } catch (err) {
                        player.sendMessage(text(`Gagal apply enchant ${id}`).System.fail)
                        return
                    }
                    const itm = inv.getItem(mainSlot);
                    if (!itm) return;
                    itm.setLore([]);
                    inv.setItem(mainSlot, itm);
                }, 1);
                break;
            }
            const oldMain = inv.getItem(mainSlot);
            inv.setItem(mainSlot, item);
            inv.setItem(i, oldMain);
            system.runTimeout(() => {
                try {
                    player.runCommand(`enchant @s ${id} ${lvl}`)
                } catch (err) {
                    player.sendMessage(text(`Gagal apply enchant ${id}`).System.fail)
                    return
                }
                const enchanted = inv.getItem(mainSlot);
                if (!enchanted) return;
                enchanted.setLore([]);
                inv.setItem(i, enchanted);
                inv.setItem(mainSlot, oldMain);
            }, 1);
            break;
        }
    }
}, 20);


/**
 * 
 * @param {Player} player 
 */
export function summonNpc(player) {
    let form = new ModalFormData()
    form.title('Summon NPC')
    form.textField('Nama NPC', 'Shop')
    form.textField('Tag NPC (pisahkan dengan koma dan tanpa spasi)', 'sell,buy,shop')
    form.dropdown(
        'Jenis NPC',
        [
            'Normal',
            'Custom'
        ]
    )
    OpenUI.force(player, form).then(async r => {
        if (r.canceled) return;
        const [name, tagInput, typeIndex] = r.formValues;
        const entityType = [
            'minecraft:npc',
            'npc:npc_custom'
        ][typeIndex]
        spawnNPC(player, entityType, name, tagInput)
    })
}

/**
 * 
 * @param {Player} player 
 * @param {string} type 
 * @param {string} name 
 * @param {string} tagInput 
 */
function spawnNPC(player, type, name, tagInput) {
    const npc = player.dimension.spawnEntity(
        type,
        player.location
    )
    if (!npc) {
        player.sendMessage(text('Gagal spawn NPC!').System.fail)
    }
    
    if (name.trim()) {
        npc.nameTag = name;
    }
    
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean)
    for (const tag of tags) {
        npc.addTag(tag)
    }
    
    player.sendMessage(text(`NPC Berhasil dibuat!\nType: ${type}\nTag: ${tags.join(', ')}`).System.succ)
}


/**
 * 
 * @param {Player} player 
 */
export function npcShopMenu(player) {
    let coin = Score.get(player, 'money')
    let func = []
    let form = new ActionFormData()
    form.title('Ancient Store')
    form.body(`Player: ${player.name}\nCoin: ${coin}\n\nSelamat datang di Ancient Store!\nPilih kategori item yang ingin kamu beli.`)
    {
        form.button('Buy Items', 'textures/items/gold_ingot')
        func.push(() => {
            return buyItem(player)
        })
    }
    {
        form.button('Sell Items', 'textures/items/paper')
        func.push(() => {
            return sellItem(player)
        })
    }
    OpenUI.force(player, form).then(async r => {
        if (r.canceled) return
        func[r.selection]()
    })
}

/**
 * 
 * @param {Player} player 
 */
export function buyItem(player) {
    let coin = Score.get(player, 'money')
    let form = new ActionFormData()
    form.title('Buy Items')
    form.body(`Player: ${player.name}\nCoins: ${coin}\n\nPilih category item yang ingin kamu beli:`)
    const categories = Object.keys(itemListBuy)
    for (const category of categories) {
        form.button(category)
    }
    OpenUI.force(player, form).then(async r => {
        if (r.canceled && r.cancelationReason == 'UserClosed') return npcShopMenu(player)
        const selectCategory = categories[r.selection]
        openBuyItem(player, selectCategory)
    })
}


function openBuyItem(player, category) {
    const coin = Score.get(player, 'money')
    const items = itemListBuy[category]
    const form = new ActionFormData()
        .title(category)
        .body(`Coins: ${coin}\n\nPilih item yang ingin kamu beli.`)
    for (const item of items) {
        if (item.bundle) {
            form.button(
                `${item.bundle.amount}× ${Extra.formatName(item.id)}\n${item.bundle.price} Coins`,
                item.tex
            )
        } else if (category === 'Enchant') {
            form.button(`${item.name}\n${item.price} Coins`, item.tex)
        } else {
            form.button(`${Extra.formatName(item.id)}\n${item.price} Coins`, item.tex)
        }
    }
    OpenUI.force(player, form).then(async r => {
        if (r.canceled && r.cancelationReason == 'UserClosed') return buyItem(player);
        const select = items[r.selection]
        if (select.bundle) {
            buyItemModal(player, select.id, 0, category, null, select.bundle)
        } else {
            buyItemModal(player, select.id, select.price, category, select.name)
        }
    })
}

/**
 * 
 * @param {Player} player 
 * @param {string} id 
 * @param {number} price 
 */
function buyItemModal(player, id, price, category, name, bundle) {
    let form = new ModalFormData()
    form.title('Buy Items')
    if (bundle) {
        form.slider(
            `Berapa kali beli?\n(1x = ${bundle.amount} item)`,
            1,
            64, { defaultValue: 1 }
        )
    } else {
        form.slider('Berapa jumlah item yang ingin kamu beli?', 1, 64, { defaultValue: 1 })
    }
    form.submitButton('Buy')
    OpenUI.force(player, form).then(r => {
        if (r.canceled && r.cancelationReason == 'UserClosed') return openBuyItem(player, category)
        const times = r.formValues[0]
        if (bundle) {
            const totalItem = times * bundle.amount
            const totalPrice = times * bundle.price
            confirmBundleBuy(player, id, totalItem, totalPrice)
        } else {
            const totalPrice = times * price
            buyItemsConfirm(player, id, totalPrice, times, category, name)
        }
    })
}

/**
 * 
 * @param {Player} player 
 * @param {string} id 
 * @param {number} price 
 */
function buyItemsConfirm(player, id, price, amount, category, name) {
    let form = new MessageFormData()
    form.title('Confirmation')
    form.body(`Apakah kamu yakin ingin melakukan pembayaran?\n\nItem: ${Extra.formatName(id)}\nJumlah: ${amount}\nTotal Harga: ${price}`)
    form.button2('Cancel')
    form.button1('Confirm Payment')
    OpenUI.force(player, form).then(async r => {
        if (r.canceled || r.selection === 1) return player.sendMessage(text('Pembayaran telah dibatalkan').System.fail)
        if (r.selection === 0) {
            let coin = Score.get(player, 'money')
            if (coin >= price) {
                if (category === 'Enchant') {
                    try {
                        const items = itemListBuy[category]
                        for (const item of items) {
                            if (item.name === name) {
                                
                                const book = new ItemStack('minecraft:enchanted_book', 1)
                                book.setLore([
                                    '§0[ENCHANT]',
                                    `§7${item.enchant.id} ${item.enchant.level}`
                                ])
                                
                                giveItemSafely(player, book, amount)
                                
                                Score.remove(player, 'money', price)
                                player.sendMessage(
                                    text(`Kamu berhasil membeli ${amount} ${name} dengan harga ${price} Coins`).System.succ
                                )
                                return;
                            }
                        }
                    } catch (e) {
                        throw new Error(e)
                    }
                } else {
                    const item = new ItemStack(normalizeId(id), 1)
                    giveItemSafely(player, item, amount)
                    
                    Score.remove(player, 'money', price)
                    player.sendMessage(
                        text(`Kamu berhasil membeli ${amount} ${Extra.formatName(id)} dengan harga ${price} Coins.`).System.succ
                    )
                }
            }
        }
    })
}

function confirmBundleBuy(player, id, amount, price) {
    let form = new MessageFormData()
    form.title('Confirmation')
    form.body(
        `Item: ${Extra.formatName(id)}\n` +
        `Jumlah: ${amount}\n` +
        `Harga: ${price} Coins`
    )
    form.button1('Confirm')
    form.button2('Cancel')
    OpenUI.force(player, form).then(r => {
        if (r.canceled || r.selection === 1) return player.sendMessage(text('Pembayaran telah dibatalkan').System.fail)
        let coin = Score.get(player, 'money')
        if (coin < price) {
            return player.sendMessage(text('Coin tidak mencukupi').System.fail)
        }
        const item = new ItemStack(normalizeId(id), 1)
        giveItemSafely(player, item, amount)
        Score.remove(player, 'money', price)
        player.sendMessage(text(`Berhasil membeli ${amount} ${Extra.formatName(id)} seharga ${price} Coin`).System.succ)
    })
}

function normalizeId(id) {
    return id.includes(':') ? id : `minecraft:${id}`
}

function hasEmptySlot(container) {
    for (let i = 0; i < container.size; i++) {
        if (!container.getItem(i)) return true;
    }
    return false;
}

function giveItemSafely(player, itemStack, amount) {
    const inv = player.getComponent(EntityComponentTypes.Inventory).container;
    
    // item non-stackable (totem, enchanted book)
    if (itemStack.maxAmount === 1) {
        for (let i = 0; i < amount; i++) {
            const one = itemStack.clone();
            one.amount = 1;
            
            if (!hasEmptySlot(inv)) {
                player.dimension.spawnItem(one, player.location);
            } else {
                inv.addItem(one);
            }
        }
        return;
    }
    
    // item stackable
    let remaining = amount;
    const maxStack = itemStack.maxAmount;
    
    while (remaining > 0) {
        const give = Math.min(maxStack, remaining);
        const stack = itemStack.clone();
        stack.amount = give;
        
        if (!hasEmptySlot(inv)) {
            player.dimension.spawnItem(stack, player.location);
        } else {
            inv.addItem(stack);
        }
        
        remaining -= give;
    }
}

export function sellItem(player) {
    const coin = Score.get(player, 'money');
    const form = new ActionFormData();
    const actions = [];
    
    form.title('Sell Shop');
    form.body(`Player: ${player.name}\nCoin: ${coin}\n\nPilih kategori item:`);
    
    for (const category of Object.keys(itemListSell)) {
        form.button(category);
        actions.push(() => openSellCategory(player, category));
    }
    
    OpenUI.force(player, form).then(r => {
        if (r.canceled && r.cancelationReason == 'UserClosed') return npcShopMenu(player);
        actions[r.selection]?.();
    });
}


function openSellCategory(player, category) {
    const coin = Score.get(player, 'money');
    const form = new ActionFormData();
    const actions = [];
    
    form.title(`Sell → ${category}`);
    form.body(`Coin: ${coin}\n\nPilih item yang ingin dijual:`);
    
    for (const item of itemListSell[category]) {
        const owned = countItem(player, item.id);
        form.button(
            `${Extra.formatName(item.id)}\n§6Harga: ${item.price} | Kamu punya: ${owned}`,
            item.tex
        );
        actions.push(() => sellItemModal(player, item.id, item.price, category));
    }
    
    OpenUI.force(player, form).then(r => {
        if (r.canceled && r.cancelationReason == 'UserClosed') return sellItem(player);
        actions[r.selection]?.();
    });
}


function sellItemModal(player, id, price, category) {
    const owned = countItem(player, id);
    if (owned <= 0) {
        return player.sendMessage(text('Kamu tidak punya item ini.').System.fail);
    }
    
    const form = new ModalFormData();
    form.title('Sell Item');
    form.slider(
        'Berapa jumlah item yang ingin kamu jual?',
        1,
        owned, { defaultValue: 1 }
    );
    form.submitButton('Sell');
    
    OpenUI.force(player, form).then(r => {
        if (r.canceled && r.cancelationReason == 'UserClosed') return openSellCategory(player, category);
        const amount = r.formValues[0];
        const totalPrice = amount * price;
        
        sellItemConfirm(player, id, amount, totalPrice);
    });
}


function sellItemConfirm(player, id, amount, totalPrice) {
    const form = new MessageFormData();
    form.title('Confirmation');
    form.body(
        `Apakah kamu yakin ingin menjual?\n\n` +
        `Item: ${Extra.formatName(id)}\n` +
        `Jumlah: ${amount}\n` +
        `Total Harga: ${totalPrice} Coin`
    );
    form.button1('Confirm Sell');
    form.button2('Cancel');
    
    OpenUI.force(player, form).then(r => {
        if (r.canceled || r.selection === 1) {
            return player.sendMessage(text('Penjualan dibatalkan.').System.warn);
        }
        
        const owned = countItem(player, id);
        if (owned < amount) {
            return player.sendMessage(text('Item kamu tidak mencukupi.').System.fail);
        }
        
        removeItem(player, id, amount);
        Score.add(player, 'money', totalPrice);
        
        player.sendMessage(
            text(`§aBerhasil menjual ${amount} ${Extra.formatName(id)} ` +
                `dengan harga ${totalPrice} Coin.`).System.succ
        );
    });
}


function countItem(player, id) {
    const inv = player.getComponent(EntityComponentTypes.Inventory).container;
    let total = 0;
    
    for (let i = 0; i < inv.size; i++) {
        const item = inv.getItem(i);
        if (item && matchId(item, id)) {
            total += item.amount;
        }
    }
    return total;
}

function matchId(item, id) {
    return item.typeId === (id.includes(':') ? id : `minecraft:${id}`)
}

function removeItem(player, id, amount) {
    const inv = player.getComponent(EntityComponentTypes.Inventory).container;
    let remaining = amount;
    const targetId = normalizeId(id)
    
    for (let i = 0; i < inv.size && remaining > 0; i++) {
        const item = inv.getItem(i);
        if (!item || item.typeId !== targetId) continue;
        
        if (item.amount <= remaining) {
            remaining -= item.amount;
            inv.setItem(i, null);
        } else {
            item.amount -= remaining;
            inv.setItem(i, item);
            remaining = 0;
        }
    }
}


const itemListBuy = {
    Consumable: [
        { id: 'bread', price: 2, tex: 'textures/items/bread' },
        { id: 'baked_potato', price: 3, tex: 'textures/items/potato_baked' },
        { id: 'cooked_beef', price: 5, tex: 'textures/items/beef_cooked' },
        { id: 'cooked_porkchop', price: 5, tex: 'textures/items/porkchop_cooked' },
        
        { id: 'honey_bottle', price: 8, tex: 'textures/items/honey_bottle' },
        { id: 'milk_bucket', price: 7, tex: 'textures/items/bucket_milk' },
        
        { id: 'golden_carrot', price: 10, tex: 'textures/items/carrot_golden' },
        { id: 'golden_apple', price: 30, tex: 'textures/items/apple_golden' }
    ],
    Cooking: [
    {
        id: 'cc:orange_seeds',
        tex: 'textures/cc/cooking/items/crops/orange.seeds',
        bundle: {
            amount: 10, // isi per pembelian
            price: 11 // harga per pembelian
        }
    },
    {
        id: 'cc:tomato_seeds',
        tex: 'textures/cc/cooking/items/crops/tomato.seeds',
        bundle: {
            amount: 10,
            price: 15
        }
    },
    {
        id: 'cc:cabbage_seeds',
        tex: 'textures/cc/cooking/items/crops/cabbage.seeds',
        bundle: {
            amount: 10,
            price: 15
        }
    },
    {
        id: 'cc:pineapple_seeds',
        tex: 'textures/cc/cooking/items/crops/pineapple.seeds',
        bundle: {
            amount: 10,
            price: 15
        }
    },
    {
        id: 'cc:grape_seeds',
        tex: 'textures/cc/cooking/items/crops/grape.seeds',
        bundle: {
            amount: 10,
            price: 15
        }
    },
    {
        id: 'cc:cauliflower_seeds',
        tex: 'textures/cc/cooking/items/crops/cauliflower.seeds',
        bundle: {
            amount: 10,
            price: 15
        }
    },
        {
        id: 'cc:lemon_seeds',
        tex: 'textures/cc/cooking/items/crops/lemon.seeds',
        bundle: {
            amount: 10,
            price: 15
        }
    },
    {
        id: 'cc:corn_seeds',
        tex: 'textures/cc/cooking/items/crops/corn.seeds',
        bundle: {
            amount: 10,
            price: 15
        }
    },
    {
        id: 'cc:broccoli_seeds',
        tex: 'textures/cc/cooking/items/crops/broccoli.seeds',
        bundle: {
            amount: 10,
            price: 15
        }
    },
    {
        id: 'cc:bell_pepper_seeds',
        tex: 'textures/cc/cooking/items/crops/bell_pepper.seeds',
        bundle: {
            amount: 10,
            price: 15
        }
    },
    {
        id: 'cc:banana_seeds',
        tex: 'textures/cc/cooking/items/crops/banana.seeds',
        bundle: {
            amount: 10,
            price: 15
        }
    },
    {
        id: 'cc:blue_berries',
        tex: 'textures/cc/cooking/items/crops/blue_berries',
        bundle: {
            amount: 5,
            price: 6
        }
    },
    {
        id: 'cc:strawberry',
        tex: 'textures/cc/cooking/items/crops/strawberry',
        bundle: {
            amount: 5,
            price: 6
        }
    },
    {
        id: 'cc:garlic',
        tex: 'textures/cc/cooking/items/crops/garlic',
        bundle: {
            amount: 10,
            price: 14
        }
    },
    {
        id: 'cc:onion',
        tex: 'textures/cc/cooking/items/crops/onion',
        bundle: {
            amount: 10,
            price: 14
        }
    },
    {
        id: 'cc:rice',
        tex: 'textures/cc/cooking/items/crops/rice',
        bundle: {
            amount: 5,
            price: 6
        }
    }
    ],
    Material: [
        { id: 'iron_ingot', price: 20, tex: 'textures/items/iron_ingot' },
        { id: 'gold_ingot', price: 24, tex: 'textures/items/gold_ingot' },
        { id: 'quartz', price: 15, tex: 'textures/items/quartz' },
        { id: 'amethyst_shard', price: 25, tex: 'textures/items/amethyst_shard' },
        { id: 'diamond', price: 70, tex: 'textures/items/diamond' },
        { id: 'netherite_scrap', price: 180, tex: 'textures/items/netherite_scrap' },
        { id: 'obsidian', price: 25, tex: 'textures/blocks/obsidian' },
        { id: 'coal_block', price: 25, tex: 'textures/blocks/coal_block' }
    ],
    
    Enchant: [
    {
        name: 'Efficiency V',
        id: 'enchanted_book',
        price: 220,
        tex: 'textures/items/book_enchanted',
        enchant: { id: 'efficiency', level: 5 }
    },
    {
        name: 'Unbreaking III',
        id: 'enchanted_book',
        price: 170,
        tex: 'textures/items/book_enchanted',
        enchant: { id: 'unbreaking', level: 3 }
    },
    {
        name: 'Sharpness V',
        id: 'enchanted_book',
        price: 215,
        tex: 'textures/items/book_enchanted',
        enchant: { id: 'sharpness', level: 5 }
    },
    {
        name: 'Protection IV',
        id: 'enchanted_book',
        price: 180,
        tex: 'textures/items/book_enchanted',
        enchant: { id: 'protection', level: 4 }
    },
    {
        name: 'Fortune III',
        id: 'enchanted_book',
        price: 235,
        tex: 'textures/items/book_enchanted',
        enchant: { id: 'fortune', level: 3 }
    },
    {
        name: 'Mending',
        id: 'enchanted_book',
        price: 150,
        tex: 'textures/items/book_enchanted',
        enchant: { id: 'mending', level: 1 }
    },
    {
        name: 'Silk Touch',
        id: 'enchanted_book',
        price: 175,
        tex: 'textures/items/book_enchanted',
        enchant: { id: 'silk_touch', level: 1 }
    },
    {
        name: 'Looting III',
        id: 'enchanted_book',
        price: 225,
        tex: 'textures/items/book_enchanted',
        enchant: { id: 'looting', level: 3 }
    }],
    Miscellaneous: [
        { id: 'totem_of_undying', price: 145, tex: 'textures/items/totem' },
        { id: 'experience_bottle', price: 15, tex: 'textures/items/experience_bottle' }
    ],
    Vegetation: [
        { id: 'oak_sapling', price: 5, tex: 'textures/blocks/sapling_oak' },
        { id: 'spruce_sapling', price: 5, tex: 'textures/blocks/sapling_spruce' },
        { id: 'dark_oak_sapling', price: 5, tex: 'textures/blocks/sapling_roofed_oak' },
        { id: 'cherry_sapling', price: 5, tex: 'textures/blocks/cherry_sapling' }
    ]
}


const itemListSell = {
    Mob_Drop: [
        { id: 'rotten_flesh', price: 2, tex: 'textures/items/rotten_flesh' },
        { id: 'bone', price: 4, tex: 'textures/items/bone' },
        { id: 'string', price: 3, tex: 'textures/items/string' },
        { id: 'spider_eye', price: 4, tex: 'textures/items/spider_eye' }
    ],
    
    Material: [
        { id: 'copper_ingot', price: 2, tex: 'textures/items/copper_ingot' },
        { id: 'iron_ingot', price: 6, tex: 'textures/items/iron_ingot' },
        { id: 'gold_ingot', price: 8, tex: 'textures/items/gold_ingot' },
        { id: 'amethyst_shard', price: 11, tex: 'textures/items/amethyst_shard' },
        { id: 'redstone', price: 2, tex: 'textures/items/redstone_dust' },
        { id: 'lapis_lazuli', price: 2, tex: 'textures/items/dye_powder_blue' },
        { id: 'diamond', price: 22, tex: 'textures/items/diamond' },
        { id: 'emerald', price: 20, tex: 'textures/items/emerald' },
        { id: 'echo_shard', price: 35, tex: 'textures/items/echo_shard' },
        { id: 'nether_star', price: 100, tex: 'textures/items/nether_star' },
        { id: 'obsidian', price: 20, tex: 'textures/blocks/obsidian' }
    ],
    
    Farming: [
        { id: 'wheat', price: 3, tex: 'textures/items/wheat' },
        { id: 'carrot', price: 2, tex: 'textures/items/carrot' },
        { id: 'sugar_cane', price: 4, tex: 'textures/items/reeds' },
        
        { id: 'cc:corn', price: 5, tex: 'textures/cc/cooking/items/crops/corn' },
        { id: 'cc:tomato', price: 5, tex: 'textures/cc/cooking/items/crops/tomato' },
        { id: 'cc:banana', price: 5, tex: 'textures/cc/cooking/items/crops/banana' },
        { id: 'cc:broccoli', price: 5, tex: 'textures/cc/cooking/items/crops/broccoli' }
    ],
    
    Food: [
    {
        id: 'honey_bottle',
        price: 4,
        tex: 'textures/items/honey_bottle'
    }],
    
    Animal_Drop: [
        { id: 'feather', price: 2, tex: 'textures/items/feather' },
        { id: 'leather', price: 3, tex: 'textures/items/leather' },
        { id: 'rabbit_foot', price: 8, tex: 'textures/items/rabbit_foot' },
        
        { id: 'cc:deer_antler', price: 10, tex: 'textures/cc/animals/items/deer.antler' },
        { id: 'cc:shark_tooth', price: 30, tex: 'textures/cc/animals/items/shark.tooth' },
        { id: 'cc:scorpion_tail', price: 35, tex: 'textures/cc/animals/items/scorpion_tail' }
    ]
}