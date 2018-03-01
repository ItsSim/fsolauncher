const {
	app,
	dialog,
	BrowserWindow,
	shell,
	Tray,
	Menu
} = require('electron')

const oslocale = require('os-locale')
const fs = require('fs')
const ini = require('ini')
const UIText = require('./FSOLauncher_UI/UIText.json')

//require('electron-reload')(__dirname);

let FSOLauncher = require('./FSOLauncher/FSOLauncher')

// Launcher title
process.title = 'FreeSO Launcher Beta'

// Launcher version
global.version = '1.3.3'

let Window = null
let tray = null
let options = {}

global.willQuit = false

let code = oslocale.sync().substring(0, 2)

global.locale = UIText.hasOwnProperty(code) ?
	UIText[code] : UIText['en']

global.locale.LVERSION = global.version

require('electron-pug')({
	pretty: true
}, global.locale)

PreCheckConfiguration()

let conf = ini.parse(
	require('fs').readFileSync('FSOLauncher.ini', 'utf-8')
)

/**
 * Check if launcher configuration file exists.
 * If it doesn't, create it with the default settings.
 */
function PreCheckConfiguration() {
	try {
		let stats = fs.statSync('FSOLauncher.ini')
	} catch (e) {
		let defaultConfiguration = {
			Launcher: {
				Theme: 'open_beta',
				DesktopNotifications: '1',
				Persistence: '1'
			},
			Game: {
				GraphicsMode: 'ogl',
				Language: 'en',
				TTS: '0'
			}
		}

		fs.writeFileSync('FSOLauncher.ini', ini.stringify(defaultConfiguration), 'utf-8')
	}
}
/**
 * Creates a new Electron BrowserWindow.
 */
function CreateWindow() {
	tray = new Tray('beta.ico')

	let width = 1100
	let height = 675

	options['minWidth'] = width
	options['minHeight'] = height
	options['maxWidth'] = width
	options['maxHeight'] = height
	options['center'] = true
	options['maximizable'] = false
	options['width'] = width
	options['height'] = height
	options['show'] = false
	options['resizable'] = false
	options['title'] = 'FreeSO Launcher'
	options['icon'] = 'beta.ico'

	Window = new BrowserWindow(options)

	Window.setMenu(null)
	//Window.openDevTools({mode:'detach'})
	Window.loadURL('file://' + __dirname + '/FSOLauncher_UI/FSOLauncher.pug')

	FSOLauncher = new FSOLauncher(Window, conf)

	const trayTemplate = [{
		label: global.locale.TRAY_LABEL_1,
		click: () => {
			FSOLauncher.onPlay()
		}
	}, {
		type: "separator"
	}, {
		label: global.locale.TRAY_LABEL_2,
		click: () => {
			const notify = require('electron-notify')
			global.willQuit = true
			notify.closeAll()
			Window.close()
		}
	}];

	const ContextMenu = Menu.buildFromTemplate(trayTemplate)

	tray.setToolTip('FreeSO Launcher ' + global.version)
	tray.setContextMenu(ContextMenu)

	tray.on('click', () => {
		Window.isVisible() ? Window.hide() : Window.show()
	})

	Window.on('closed', () => {
		Window = null
	})

	Window.once('ready-to-show', () => {
		Window.show()
	})

	Window.on('close', e => {
		if (!global.willQuit && FSOLauncher.conf.Launcher.Persistence === '1') {
			e.preventDefault()
			Window.minimize()
		} else {
			const notify = require('electron-notify')
			notify.closeAll()
		}
	})

	Window.webContents.on('new-window', (e, url) => {
		e.preventDefault()
		shell.openExternal(url)
	})
}

app.on('ready', CreateWindow)

app.on('before-quit', function () {
	tray.destroy()
})

app.on('window-all-closed', () => {
	app.quit()
})

app.on('activate', () => {
	null === Window && CreateWindow()
})

let shouldQuit = app.makeSingleInstance((a, b) => {
	Window && (Window.show(), Window.focus())
})

shouldQuit && app.quit()