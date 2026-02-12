import { system, world } from '@minecraft/server'
import './features/_load'



system.beforeEvents.watchdogTerminate.subscribe(data => {
    data.cancel = true;
})