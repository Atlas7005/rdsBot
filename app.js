require("dotenv").config();
const { Client, Intents, MessageAttachment }  = require("discord.js");
const utils = require("./utils");
const fs = require("fs");
const { schedule } = require("node-cron");

const client = new Client({ intents: new Intents(32767) });

client.on("ready", async () => {
    utils.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity("Drift Events", { type:"COMPETING" });
    utils.checkCounts(client);
    utils.serverCheck(client);
    schedule("*/2 * * * *", () => {
        utils.checkCounts(client);
        utils.serverCheck(client);
    }).start();
});

client.on("messageCreate", async message => {
    if (message.author.bot) return;
    
    const msgArr = message.content.split(" ");
    const command = msgArr[0].toLowerCase();
    const args = msgArr.slice(1);

    switch(command) {
        case "!ping":
            message.channel.sendTyping();
            message.channel.send("xd");
            break;
        case "!emit": {
            if(!message.member.permissions.has("ADMINISTRATOR")) return;
            client.emit(args[0], message.mentions.members.first() || message.member);
            break;
        }
        case "!clear": {
            if(!message.member.permissions.has("MANAGE_MESSAGES")) return;
            message.channel.messages.fetch({ limit: parseInt(args[0]) }).then(messages => {
                message.channel.bulkDelete(messages).then(() => {
                    message.channel.send(`Cleared ${messages.size} messages.`).then(msg => setTimeout(() => msg.delete(), 3000));
                });
            });
            break;
        }
        case "!embed": {
            if(!message.member.permissions.has("ADMINISTRATOR")) return;
            const msg = fs.readFileSync("./txt/"+args[0].toLowerCase()+".txt", "utf8");
            message.mentions.channels.first().send({
                embeds: [{
                    title: args[0].toLowerCase().charAt(0).toUpperCase() + args[0].toLowerCase().slice(1),
                    description: msg,
                    color: 0x6203fc,
                    timestamp: new Date(),
                    footer: {
                        text: "Ruby Drift School",
                        iconURL: message.guild.iconURL({ size: 256 })
                    }
                }]
            }).then(() => message.delete());
            break;
        }
        default:
            break;
    }
});

client.on("guildMemberAdd", async member => {
    utils.checkCounts(client);
    const channel = member.guild.channels.cache.find(ch => ch.name === "join-leave");
    // const channel = member.guild.channels.cache.find(ch => ch.name === "bot-test");
    if (!channel) return;
    var image = await utils.genImage("welcome", member);
    channel.send({ files: [ new MessageAttachment(image, "welcome.png")]});
});

client.on("guildMemberRemove", async member => {
    utils.checkCounts(client);
    const channel = member.guild.channels.cache.find(ch => ch.name === "join-leave");
    // const channel = member.guild.channels.cache.find(ch => ch.name === "bot-test");
    if (!channel) return;
    var image = await utils.genImage("goodbye", member);
    channel.send({ files: [ new MessageAttachment(image, "goodbye.png")]});
});

client.login(process.env.token);