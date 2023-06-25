import ServerItem from "./ServerItem";
import serverStyles from "./server.module.css";

export default function Loading() {
	let servers = [];
	for (let i = 0; i < 10; i++) {
		servers.push(
			<ServerItem
				server={{ name: "", icon: null, id: "" }}
				selected={null}
				key={i}
			/>
		);
	}

	return (
		<div className="app-container">
			<nav className={serverStyles.serverList}>
				<ul>{servers}</ul>
			</nav>
		</div>
	);
}
