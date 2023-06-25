import { APIGuild } from "discord-api-types/v10";

const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!DISCORD_APP_ID || !DISCORD_BOT_TOKEN) {
	throw new Error("Environment variables are not properly configured");
}

const baseURL = "https://discord.com/api/v10";
const headers = { Authorization: `Bot ${DISCORD_BOT_TOKEN}` };

export const getGuilds: () => Promise<APIGuild[]> = () =>
	fetch(`${baseURL}/users/@me/guilds`, { headers: headers }).then((res) =>
		res.json()
	);
