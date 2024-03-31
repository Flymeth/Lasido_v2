//! Not useful at this point
//? See https://discordjs.guide/sharding

const { ShardingManager } = require("discord.js");
const path = require("node:path");
require("dotenv").config();

const manager = new ShardingManager(path.join(__dirname, "./dist/_main.js"), { token: process.env.TOKEN })
manager.on("shardCreate", shard => console.log(`Shard #${shard.id} has been created.`))

manager.spawn()