import ServerItem from "./ServerItem";
import styles from "@/styles/server.module.css";
import { APIGuild } from "discord-api-types/v10";

export default async function ServerList({
	selected,
	servers,
}: {
	selected: string | null;
	servers: APIGuild[];
}) {
	return (
		<nav className={styles.serverList}>
			<ul>
				<ServerItem
					server={{ name: "DMs", icon: "defaultIcon", id: "me" }}
					key="me"
					selected={selected}
				/>
				<div className={styles.listItem}>
					<div className={styles.guildSeparator}></div>
				</div>
				<div>
					{servers.map((server) => (
						<ServerItem server={server} key={server.id} selected={selected} />
					))}
				</div>
			</ul>
		</nav>
	);
}
