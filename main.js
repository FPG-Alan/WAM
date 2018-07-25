const { app, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')

const argv = process.argv.slice(2)


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        // titleBarStyle: 'hiddenInset',
        // frame: false,
        autoHideMenuBar: true,
        fullscreenable: false,
        webPreferences: {
            javascript: true,
            plugins: true,
            nodeIntegration: true, // 不集成 Nodejs
            webSecurity: false,
            // preload: path.join(__dirname, './public/renderer.js') // 但预加载的 js 文件内仍可以使用 Nodejs 的 API
        }
    })

    // and load the index.html of the app.
    if (argv && argv[1] == 'dev') {
        win.loadURL("http://localhost:3000/")
        win.webContents.openDevTools()
    } else if (argv && argv[1] == 'build') {
        // window 加载build好的html.
        win.loadFile('./build/index.html')
    }
    // win.loadFile('./build/index.html')
    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})