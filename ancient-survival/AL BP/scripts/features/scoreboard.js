import { world, system } from '@minecraft/server'
import { PlayerDatabase } from '../extension/Database'
import Score from '../extension/Score'
import Extra from '../extension/Extra'
import { playtime } from './timeplayed'
import { ModalFormData } from '@minecraft/server-ui';
import OpenUI from '../extension/OpenUI'
import { text } from '../config/text';
import { RANK_CONFIG, PROGRESS_CONFIG } from '../config/system';



/* =========================
   PLACEHOLDER ENGINE
========================= */
function getPlaceholder(text, data) {
    for (const item of data) {
        for (const key in item) {
            const holder = new RegExp('@' + key, 'g')
            text = text.replace(holder, item[key])
        }
    }
    return text
}

/* =========================
   SCOREBOARD TEMPLATE
========================= */
const board = {
    Line: [
        '@BLANK',
        '     §2§lAncient Survival§r     ',
        '@BLANK',
        ' > Name: @NAME§r',
        ' > Rank: @RANK§r',
        ' > Gold: §6@GOLD§r',
        ' > Silver: §7@SILVER§r',
        ' > Ping: @PING',
        ' > Total Gacha: @GACHA',
        '@BLANK',
        ' > Time Played: @TIMEPLAYED',
        ' > Daily Login: @DAILY',
        ' > Online: @ONLINE player(s)',
        '@BLANK'
    ]
}

/* =========================
   MAIN SCOREBOARD LOOP
========================= */
system.runInterval(() => {
    const online = world.getPlayers().length
    
    for (const player of world.getPlayers()) {
        const rnk = new PlayerDatabase(player, 'Rank').get() ?? 'Member'
        const prog = new PlayerDatabase(player, 'RankProgress').get() ?? 'Peasant'
        const rankShow = 
            RANK_CONFIG[rnk].show ??
            PROGRESS_CONFIG[prog].show ??
            '§l§bMember§r'
        const ping = Score.get(player, 'ping') ?? 0
        const pingShow = ping >= 100 ? `§e${ping}ms§r` : `§a${ping}ms§r`;
        const data = [{
            NAME: player.name,
            RANK: rankShow,
            GOLD: Extra.metricNumber(Score.get(player, 'gold') ?? 0),
            PING: pingShow,
            ONLINE: online,
            TIMEPLAYED: playtime(Score.get(player, 'timePlayed') ?? 0),
            DEATH: Score.get(player, 'death') ?? 0,
            BLANK: ' ',
            BREAK: makeLine('—', 15),
            SILVER: Extra.metricNumber(Score.get(player, 'silver') ?? 0),
            GACHA: Score.get(player, 'gacha') ?? 0,
            DAILY: new PlayerDatabase(player, "LoginDayCount").get() ?? 1
        }]
        const scr = new PlayerDatabase(player, 'Scoreboard').get() ?? 'show';
        if (scr === 'hide') return;
        player.onScreenDisplay.setTitle(
            getPlaceholder(board.Line.join('\n'), data)
        )
    }
}, 5)

/* =========================
   PING SIMULATION
========================= */
system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const start = Date.now()
        
        system.run(() => {
            const ping = Date.now() - start
            Score.set(player, 'ping', ping)
        })
    }
}, 60)

function makeLine(value, length) {
    let line = ''
    for (let i = 0; i < length; i++) {
        line += value
    }
    return line;
}