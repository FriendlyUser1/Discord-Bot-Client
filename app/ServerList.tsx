import ServerItem from "./ServerItem";
import { getGuilds } from "@/services/discord";
import styles from "./server.module.css";

async function getServers() {
	try {
		const servers = await getGuilds();
		return servers;
	} catch (err) {
		console.error(err);
		return [];
	}
}

export default async function ServerList({
	selected,
}: {
	selected: string | null;
}) {
	const servers = await getServers();

	return (
		<nav className={styles.serverList}>
			<ul>
				<ServerItem
					server={{ name: "DMs", icon: "defaultIcon", id: "@me" }}
					selected={selected}
				/>
				{servers.map((server) => (
					<ServerItem server={server} key={server.id} selected={selected} />
				))}
			</ul>
		</nav>
	);
}
