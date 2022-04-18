const { drawCard } = require("discord-welcome-card");
const { query } = require("gamedig");
const servers = require("./servers.json");
const { writeFileSync } = require("fs");

module.exports = {
    async genImage(type = "welcome", member) {
        return await drawCard({
            theme: "circuit",
            text: {
                title: type == "welcome" ? "Welcome to Ruby Drift School!" : "Hope you enjoyed your stay!",
                text: member.user.tag,
                subtitle: type == "welcome" ? `${this.ordinalSuffix((await this.checkCounts(member.client)).members.size)} member.` : "Hope you come again!",
                color: "#fff"
            },
            avatar: {
                image: member.user.displayAvatarURL({ format: "png", size: 512 }),
                outlineWidth: 4,
                outlineColor: "#6203fc"
            },
            background: "https://i.imgur.com/2mHa3Hz.png",
            blur: 2,
            border: false,
            rounded: true
        });
    },
    ordinalSuffix(i) {
        var j = i % 10,
        k = i % 100;
        if (j == 1 && k != 11) {
            return i + "st";
        }
        if (j == 2 && k != 12) {
            return i + "nd";
        }
        if (j == 3 && k != 13) {
            return i + "rd";
        }
        return i + "th";
    },
    async checkCounts(client) {
        var members = await client.guilds.cache.get("965335804815761469").members.fetch();
        members = members.filter(m => !m.user.bot);
        var instructors = members.filter(m => m.roles.cache.has("965614196937080872"));
        var students = members.filter(m => m.roles.cache.has("965556192455843850"));

        // Total Members Channel
        client.channels.cache.get("965556148759568395").setName(`Total Members: ${members.size}`);
        // Total Instructors Channel
        client.channels.cache.get("965614625141956690").setName(`Total Instructors: ${instructors.size}`);
        // Total Students Channel
        client.channels.cache.get("965614001394446336").setName(`Total Students: ${students.size}`);

        // Logging
        this.log(`Refreshed Member Counts: ${members.size}`);

        return { members, instructors, students };
    },
    async serverCheck(client) {
        var messages = await client.channels.cache.get("965571491120971796").messages.fetch({ limit: 100 });
        var lastMessage = messages.last();
        var srvs = servers.map(async server => {
            var result = await query({
                type: "assettocorsa",
                host: server.ip,
                port: server.port
            });
            return {
                server,
                result
            };
        });

        srvs = await Promise.all(srvs);

        var embed = {
            title: "Servers",
            description: "This is all of our servers currently running.",
            fields: srvs.map(server => {
                var { server, result } = server;
                return {
                    name: server.name,
                    value: `${result.players.length}/${result.maxplayers} players.\nMap: ${server.map}\nCar Pack: ${this.parsePack(server.cars)}\n\n**[Join](https://acstuff.ru/s/q:race/online/join?ip=${server.ip}&httpPort=${server.port})**`,
                    inline: true
                };
            }),
            color: 0x6203fc,
            timestamp: new Date(),
            footer: {
                text: "Ruby Drift School",
                iconURL: client.user.displayAvatarURL({ size: 256 })
            }
        }

        this.log(`Refreshed Servers: ${srvs.length} - Total Players: ${srvs.map(server => server.result.players.length).reduce((a, b) => a + b)}/${srvs.map(server => server.result.maxplayers).reduce((a, b) => a + b)}`);

        return lastMessage ? lastMessage.edit({ embeds: [embed] }) : client.channels.cache.get("965571491120971796").send({ embeds: [embed] });
    },
    parsePack(pack) {
        switch(pack) {
            case "WDTS":
                return "[WDTS](https://files.acstuff.ru/shared/cczR/WDT_StreetPack_11.zip)";
            case "WDT":
                return "[WDT](https://files.acstuff.ru/shared/tiCD/WDTCarPack2021.zip)";
            default:
                return pack;
        }
    },
    parseMap(map) {
        switch(map) {
            case "EK Tsukuba":
                return "[EK Tsukuba](https://sharemods.com/g4s5pavow9oe/ek_tsukuba_fruits_line.rar.html)";
            case "Sunrise Circuit":
                return "[Sunrise Circuit](https://www.racedepartment.com/downloads/90s-golden-drift-spot-project-sunrise-circuit-tsukuruma-circuit-nasu-driving-palette-nasu.39709/)";
            default:
                return map;
        }
    },
    log(...args) {
        var text = `[${new Date().toLocaleString()}] ${args.join(" ")}`;
        writeFileSync(`${__dirname}/log.txt`, `${text}\n`, { flag: "a" });
        console.log(text);

        return text;
    }
}