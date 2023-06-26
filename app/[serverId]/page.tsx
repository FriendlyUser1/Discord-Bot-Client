import ChannelList from "@/components/ChannelList";
import ServerList from "@/components/ServerList";
import { getServers } from "@/util/discord";

export const dynamicParams = false;

const servers = await getServers();

export async function generateStaticParams() {
	return servers
		.map((server) => ({ serverId: server.id }))
		.concat([{ serverId: "me" }]);
}

export default function ServerPage({
	params,
}: {
	params: { serverId: string };
}) {
	return (
		<div className="app-container">
			<ServerList selected={params.serverId} servers={servers} />
			<ChannelList
				serverId={params.serverId}
				channels={null}
				dmChannel={params.serverId === "me"}
			/>
		</div>
	);
}
