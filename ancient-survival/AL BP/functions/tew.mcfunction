# kasih resistance terus selama RTP
execute as @a[tag=on_rtp] run effect @s resistance 1 255 true

# kalau sudah ada block di bawah kaki → selesai RTP
execute as @a[tag=on_rtp] at @s unless block ~ ~-1 ~ air run tag @s remove on_rtp