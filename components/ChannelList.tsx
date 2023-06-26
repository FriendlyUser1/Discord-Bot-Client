import { getChannels } from "@/util/discord";
import { APIChannel } from "discord-api-types/v10";
import styles from "@/styles/channel.module.css";

function getDmChannels() {
	return [];
}

export default async function ChannelList({
	serverId,
	channels,
	dmChannel,
}: {
	serverId: string;
	channels: APIChannel[] | null;
	dmChannel: boolean;
}) {
	// if (!channels)
	// 	channels =
	// 		serverId === "me" ? getDmChannels() : await getChannels(serverId);

	return <nav className={styles.channelList}></nav>;
}
