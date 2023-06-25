import ServerList from "./ServerList";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Discord Bot Client",
};

export default function Page() {
	return (
		<div className="app-container">
			<ServerList selected={null} />
		</div>
	);
}
