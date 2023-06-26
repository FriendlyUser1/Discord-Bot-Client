import { APIChannel, APIGuild } from "discord-api-types/v10";

const DISCORD_APP_ID = process.env.DISCORD_APP_ID;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!DISCORD_APP_ID || !DISCORD_BOT_TOKEN) {
	throw new Error("Environment variables are not properly configured");
}

const request = async (path: string) => {
	try {
		const values = await fetch(`https://discord.com/api/v10${path}`, {
			headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
		}).then((res) => res.json());

		if (values.retry_after)
			throw `Rate Limited, try again after ${values.retry_after} seconds`;

		return values;
	} catch (err) {
		console.error(err);
		return [];
	}
};

export async function getServers(): Promise<APIGuild[]> {
	return await request("/users/@me/guilds");
}

export async function getChannels(serverId: string): Promise<APIChannel[]> {
	return await request(`/guilds/${serverId}/channels`);
}
