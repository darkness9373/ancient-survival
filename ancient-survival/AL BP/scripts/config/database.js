import { WorldDatabase, PlayerDatabase } from "../extension/Database"


export function getData(player) {
    return {
        warpGlobal: new WorldDatabase('Warp'),
        warpPrivate: new PlayerDatabase(player, 'Warp'),
        chatPrefix: new WorldDatabase('Prefix'),
        rank: new PlayerDatabase(player, 'Rank'),
        rankLevel: new PlayerDatabase(player, 'RankLevel'),
        rankList: new PlayerDatabase(player, 'RankList')
    }
}