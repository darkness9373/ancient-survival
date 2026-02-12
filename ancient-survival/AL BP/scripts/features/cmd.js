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
import { sendMoney } from './money';
import { tpaCommand, tpAcceptCommand, tpDenyCommand } from './tpa'
import { inspectMenu } from './inspect';
import { banMenu } from './ban';
import { openUnbanMenu } from './unban';



system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
    customCommandRegistry.registerEnum(
        'as:objectives',
        ['money', 'killMob', 'killMonster', 'timePlayed']
    )
    customCommandRegistry.registerEnum(
        'as:scoreboard',
        ['show', 'hide']
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
        } else {
            score.set('hide')
            player.sendMessage(text(`Scoreboard dinonaktifkan!!`).System.fail)
            system.run(() => player.onScreenDisplay.setTitle(''))
        }
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:sendcoin',
        description: 'Send coin you have to other players',
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
        system.run(() => sendMoney(player))
    })
    customCommandRegistry.registerCommand(
    {
        name: 'as:inspect',
        description: 'Inspecting the specified player data',
        permissionLevel: CommandPermissionLevel.GameDirectors,
        cheatsRequired: true
    }, (origin) => {
        const player = origin.sourceEntity
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
})

/* ================= HELPER ================= */

function isAdmin(player) {
    return player.hasTag('admin')
}

function noAdmin(player) {
    player.sendMessage(
        text('Menu ini hanya bisa diakses oleh Admin!!').System.warn
    )
}