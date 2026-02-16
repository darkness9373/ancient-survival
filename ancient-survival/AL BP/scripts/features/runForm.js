import OpenUI from "../extension/OpenUI";
import { npcShopMenu, buyItem, sellItem } from "./npc";
import { showRtpForm } from './rtp';
import { teleportToLobby } from './last';

OpenUI.entity('shop', npcShopMenu)
OpenUI.entity('buy', buyItem)
OpenUI.entity('sell', sellItem)
OpenUI.entity('rtp', showRtpForm)
OpenUI.entity('lobby', teleportToLobby)