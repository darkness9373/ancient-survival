import { world, system, Player, CustomCommandParamType, CommandPermissionLevel } from '@minecraft/server'
import Score from '../extension/Score'
import { PlayerDatabase } from '../extension/Database'
import { npcShopMenu, summonNpc } from './npc'
import { getData } from '../config/database'
import { warpUI } from './warp'
import { makeRedeem, claimRedeem } from './redeem'
import { addRankForm, setRank } from './rank'
import { healPlayer } from './heal'
import { foodPlayer } from './food'
import { text } from '../config/text'
import { checkpointCommand } from './last';
import { sendGold, sendSilver } from './money';
import { tpaCommand, tpAcceptCommand, tpDenyCommand } from './tpa'
import { inspectMenu } from './inspect';
import { banMenu } from './ban';
import { openUnbanMenu } from './unban';
import { addCustomRankForm, CustomRankColor } from './customrank';
import { topupUI } from './topup';
import { LOBBY_POS } from './last';
import { showRtpForm } from './rtp';


system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
    customCommandRegistry.registerEnum(
        'as:objectives',
        ['gold', 'killMob', 'killMonster', 'timePlayed', 'daily', 'silver']
    )
    customCommandRegistry.registerEnum(
        'as:scoreboard',
        ['show', 'hide']
    )
    customCommandRegistry.registerEnum(
        'as:pvp',
        ['on', 'off']
    )
    customCommandRegistry.registerCommand(
    {
        name: 'as:add',
        description: 'Add score to objectives',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        mandatoryParameters: [
        {
            name: 'as:objectives',
            type: CustomCommandParamType.Enum
        },
        {
            name: 'value',
            type: CustomCommandParamType.Integer
        }],
        cheatsRequired: true
    }, (origin, objective, value) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        if (objective === 'daily') {
            const db = new PlayerDatabase(player, 'LoginDayCount')
            db.set(Number(db.get() ?? 1) + value)
        }
        Score.add(player, objective, value)
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:set',
        description: 'Set objective value',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true,
        mandatoryParameters: [
        {
            name: 'as:objectives',
            type: CustomCommandParamType.Enum
        },
        {
            name: 'value',
            type: CustomCommandParamType.Integer
        }]
    }, (origin, objective, value) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        if (objective === 'daily') {
            const db = new PlayerDatabase(player, 'LoginDayCount')
            db.set(value)
        }
        Score.set(player, objective, value)
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:remove',
        description: 'Remove score from objective',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true,
        mandatoryParameters: [
        {
            name: 'as:objectives',
            type: CustomCommandParamType.Enum
        },
        {
            name: 'value',
            type: CustomCommandParamType.Integer
        }]
    }, (origin, objective, value) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        if (objective === 'daily') {
            const db = new PlayerDatabase(player, 'LoginDayCount')
            db.set(Number(db.get() ?? 1) - value)
        }
        Score.remove(player, objective, value)
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:get',
        description: 'Get a value from objectives',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true,
        mandatoryParameters: [
        {
            name: 'as:objectives',
            type: CustomCommandParamType.Enum
        }]
    }, (origin, objective) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        if (objective === 'daily') {
            const db = new PlayerDatabase(player, 'LoginDayCount')
            return player.sendMessage(text(`Objective\n > ${objective}\n > ${db.get() ?? 1}`).System.deff)
        }
        player.sendMessage(text(`Objective\n > ${objective}\n > ${Score.get(player, objective)}`).System.deff)
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:shop',
        description: 'Open the shop',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => npcShopMenu(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:spawnnpc',
        description: 'Summon original or custom NPC',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => summonNpc(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:warp',
        description: 'Open the system menu',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => warpUI(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:mkredeem',
        description: 'Open a form to create redeem code',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => makeRedeem(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:redeem',
        description: 'Open form to insert redeem code',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => claimRedeem(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:addrank',
        description: 'Add Rank to a specific player',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => addRankForm(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:heal',
        description: 'Restores 100% health instantly',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => healPlayer(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:food',
        description: 'Instantly restores 100% hunger',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => foodPlayer(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:tpa',
        description: 'Request teleport to a random player',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => tpaCommand(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:tpaccept',
        description: 'Open form to insert redeem code',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => tpAcceptCommand(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:tpdeny',
        description: 'Open form to insert redeem code',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => tpDenyCommand(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:setrank',
        description: 'Set rank you have to be displayed',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => setRank(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:checkpoint',
        description: 'Teleport to the last place before going offline',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => checkpointCommand(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:board',
        description: 'Show or hide scoreboard',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true,
        optionalParameters: [
        {
            name: 'as:scoreboard',
            type: CustomCommandParamType.Enum
        }]
    }, (origin, show) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        const score = new PlayerDatabase(player, 'Scoreboard')
        if (show === 'show') {
            score.set('show')
            player.sendMessage(text(`Scoreboard diaktifkan!!`).System.succ)
        } else if (show === 'hide') {
            score.set('hide')
            player.sendMessage(text(`Scoreboard dinonaktifkan!!`).System.fail)
            system.run(() => player.onScreenDisplay.setTitle(''))
        } else {
            player.sendMessage(
                text('Gunakan: show/hide').System.fail
            )
        }
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:sendgold',
        description: 'Send Gold you have to other players',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => sendGold(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:sendsilver',
        description: 'Send Silver you have to other players',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => sendSilver(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:inspect',
        description: 'Inspecting the specified player data',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        system.run(() => inspectMenu(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:ban',
        description: 'Ban players',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return
        system.run(() => banMenu(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:unban',
        description: 'Unban players',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return
        system.run(() => openUnbanMenu(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:banlist',
        description: 'Show a list of banned players',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return
        return player.sendMessage('§6In Progress')
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:pvp',
        description: 'Turn PVP mode on or off',
        permissionLevel: CommandPermissionLevel.Any,
        mandatoryParameters: [
        {
            name: 'as:pvp',
            type: CustomCommandParamType.Enum
        }],
        cheatsRequired: true
    }, (origin, objective) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return;
        if (player.hasTag('on_arena')) return player.sendMessage(text('Tidak bisa mengubah mode PvP di dalam arena').System.fail)
        if (objective === 'on') {
            if (player.hasTag('pvp')) return player.sendMessage(text('Mode PvP sudah aktif').System.warn)
            player.sendMessage(text('PvP mode diaktifkan').System.succ)
            system.run(() => player.addTag('pvp'))
        }
        if (objective === 'off') {
            if (!player.hasTag('pvp')) return player.sendMessage(text('Mode PvP sudah nonaktif').System.warn)
            player.sendMessage(text('PvP mode dinonaktifkan').System.succ)
            system.run(() => player.removeTag('pvp'))
        }
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:addcustomrank',
        description: 'Add Custom Rank to a player',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return
        system.run(() => addCustomRankForm(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:topup',
        description: 'Send gold to players who want to top up',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return
        system.run(() => topupUI(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:lobby',
        description: 'Teleport to lobby',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return
        system.run(() => {
            player.tryTeleport({
                x: LOBBY_POS.x,
                y: LOBBY_POS.y,
                z: LOBBY_POS.z
            }, {
                dimension: world.getDimension(LOBBY_POS.dimension),
                keepVelocity: false
            })
            player.sendMessage(text('Berhasil teleport ke Lobby').System.succ)
        })
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:customrank',
        description: 'Edit Custom Rank Color',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return
        system.run(() => CustomRankColor(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:rtp',
        description: 'Teleport to random location',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        if (!(player instanceof Player)) return
        system.run(() => showRtpForm(player))
    })
})