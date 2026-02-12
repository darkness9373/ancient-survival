import OpenUI from "../extension/OpenUI";
import { npcShopMenu, buyItem, sellItem } from "./npc";

OpenUI.entity('shop', npcShopMenu)
OpenUI.entity('buy', buyItem)
OpenUI.entity('sell', sellItem)