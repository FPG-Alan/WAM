import { action } from "mobx"
import request from 'request'
const fs = window.require("fs")
const { dialog } = window.require('electron').remote

const rimraf = window.require("rimraf")
const AdmZip = window.require('adm-zip')

class AddonStore {
    wowPath = ''
    interfacePath = ''
    addonsPath = ''
    backupPath = ''

    constructor() {
        this.data = []
    }

    setup(path) {
        if (!path) {
            path = dialog.showOpenDialog({
                properties: ['openDirectory']
            });
        }
        this.wowPath = path
        this.interfacePath = this.wowPath + '/Interface'
        this.addonsPath = this.wowPath + '/Interface/AddOns'
        this.backupPath = this.wowPath + '/Interface/backup'


        fs.stat(this.backupPath, (err, stats) => {
            // console.log(stats)
            !stats && (fs.mkdir(this.backupPath, () => {
                console.log('create backup folder!')
            }))
        })
        return this.wowPath
    }
    @action list = async () => {
        return await new Promise((resolve, reject) => {
            // resolve({ records: this.records, skip_count: 0, total_count: 4, rawData: {} })
            let addons
            try {
                addons = JSON.parse(fs.readFileSync(this.interfacePath + '/data.json')).addons
            } catch (err) {
                // If the type is not what you want, then just throw the error again.
                if (err.code !== 'ENOENT') throw err;

                // Handle a file-not-found error

                fs.writeFileSync(this.interfacePath + '/data.json', JSON.stringify({
                    addons: []
                }))

                addons = []
            } finally {
                this.data = addons
                resolve(addons)
            }
        })
    }

    @action install = async (addon) => {
        /* return await new Promise((resolve, reject)=> {

        }) */
        let downloadUrl = await getDownloadUrl(addon.path + '/download')
        downloadUrl = 'https://www.curseforge.com/' + downloadUrl
        console.log(downloadUrl)

        await downloadAddon(downloadUrl, addon.name, this.backupPath)


        let zip = new AdmZip(this.backupPath + '/' + addon.name + '.zip')
        zip.extractAllTo(this.backupPath, true);

        rimraf(this.backupPath + '/' + addon.name + '.zip', err => { })
        // first remove old version
        fs.readdirSync(this.backupPath).map(addOnName => {
            // first remove old version

            if (isFolder(this.backupPath + '/' + addOnName)) {
                console.log(addOnName)


                rimraf(this.addonsPath + '/' + addOnName, err => {
                    if (!err) {
                        fs.rename(this.backupPath + '/' + addOnName, this.addonsPath + '/' + addOnName, err => {
                            if (!err) {
                                console.log(addOnName + ' installed!')
                            }
                        })
                    }
                })
            }
            return ''
        })

        return

        // if (downloadInfo === 'success') {
        //     addon.version = lastestVersion

        //     updatedAddons.push(addon)
        // }



    }

}

function getDownloadUrl(url) {
    return new Promise((resolve, reject) => {
        request(url, (err, res, body) => {
            if (err) {
                console.log(err)
                reject(err)
            } else {
                let downloadUrl = body.match(new RegExp(/download__link.+"/))[0].slice(22, -1)
                resolve(downloadUrl)
            }
        })
    })
}

function downloadAddon(url, fileName, folderPath) {
    return new Promise((resolve, reject) => {

        console.log('begin download addon')
        console.log(url)
        let file = fs.createWriteStream(folderPath + '/' + fileName + '.zip')
        request(url, function (error, response, body) {
        }).pipe(file).on('finish', () => {
            resolve('success')
        })
    })

}
function isFolder(filePath) {
    return fs.statSync(filePath).isDirectory()
}

export default new AddonStore()