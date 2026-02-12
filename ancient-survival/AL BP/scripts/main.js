import { system, world } from '@minecraft/server'
import './features/_load'
import './cancelAtt'


system.beforeEvents.watchdogTerminate.subscribe(data => {
    data.cancel = true;
})