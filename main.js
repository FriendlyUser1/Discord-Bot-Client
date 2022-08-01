const { app, BrowserWindow, ipcMain, Menu } = require("electron"),
	fs = require("fs"),
	path = require("path"),
	Store = require("electron-store"),
	store = new Store();

// config
app.disableHardwareAcceleration();
Store.initRenderer();
ipcMain.handle("getSetting", (event, key) => {
	return store.get(key, true);
});

let mainWindow;

fs.readFile(__dirname + "/token.txt", "utf8", (tokenReadError, token) => {
	if (tokenReadError && tokenReadError.code !== "ENOENT") throw tokenReadError;
	else if (tokenReadError) {
		fs.writeFile(__dirname + "/token.txt", "", (tokenCreateFileError) => {
			if (tokenCreateFileError) throw tokenCreateFileError;

			console.log(
				`Please enter your token in "token.txt"\n  File was not found and has been created`
			);
			process.exit();
		});
	} else if (!token) {
		console.log(`Please enter your token in "token.txt"\n  No data in file`);
		process.exit();
	} else mainApp(token);
});

function mainApp(token) {
	function windowSetup() {
		mainWindow = new BrowserWindow({
			width: 1030,
			height: 800,
			minWidth: 575,
			minHeight: 300,
			icon: __dirname + "/res/icon.png",
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
			},
		});

		// Load app
		mainWindow.loadFile(path.join(__dirname, "index.html"));

		mainWindow.on("closed", () => (mainWindow = null));

		const template = [
			{
				label: "Options",
				submenu: [
					{
						label: "Toggle notifications",
						click() {
							store.set("notifOn", !store.get("notifOn"));
						},
					},
					{
						label: "Quit",
						click() {
							app.quit();
						},
					},
				],
			},
			{
				label: "Advanced options",
				submenu: [
					{
						label: "Open Devtools",
						accelerator: "CmdOrCtrl+Shift+I",
						click() {
							mainWindow.openDevTools();
						},
					},
					{
						label: "Reload",
						accelerator: "CmdOrCtrl+R",
						click() {
							mainWindow.reload();
						},
					},
				],
			},
		];
		Menu.setApplicationMenu(Menu.buildFromTemplate(template));
	}

	ipcMain.on("ready", () => {
		mainWindow.webContents.send("token", token);
	});

	if (app.isReady()) windowSetup();
	app.on("ready", windowSetup);

	// Quit when all windows are closed.
	app.on("window-all-closed", () => {
		// On OS X it is common for applications and their menu bar
		// to stay active until the user quits explicitly with Cmd + Q
		if (process.platform !== "darwin") {
			app.quit();
		}
	});

	app.on("activate", () => {
		// On OS X it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (mainWindow === null) windowSetup();
	});
}
