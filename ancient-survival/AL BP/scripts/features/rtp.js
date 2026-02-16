import { world } from "@minecraft/server";
import { ModalFormData } from '@minecraft/server-ui';
import Tag from '../extension/Tag';
import OpenUI from '../extension/OpenUI';

// =======================
// 📌 FORM RTP
// =======================
export function showRtpForm(player) {
    const form = new ModalFormData()
        .title("Random Teleport")
        .slider("Pilih Radius", 100, 5000, {
            step: 100,
            defaultValue: 1000
        });

    OpenUI.force(player, form).then(async res => {
        if (res.canceled) return;

        const radius = res.formValues[0];
        player.runCommand(
          `spreadplayers ~ ~ 8 ${radius} @s`
        )
        Tag.add(player, 'on_rtp')
    });
}