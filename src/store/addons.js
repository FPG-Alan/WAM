import { action } from "mobx"
import request from 'request'
// import progress from 'request-progress'
// const progress = window.require('progress-stream');
const fs = window.require("fs")
const { dialog } = window.require('electron').remote

const rimraf = window.require("rimraf")
const AdmZip = window.require('adm-zip')

// addon state: ['NEW', 'UPDATED', 'OOD']

class AddonStore {
    dataStuffed = false

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
            if (!this.dataStuffed) {
                this.stuffData()
            }

            resolve(this.data)
        })
    }

    @action install = async (addon, version, installState, updateState) => {

        updateState && updateState({
            message: 'getting download url...',
            state: {}
        })
        let downloadUrl = await getDownloadUrl(addon.path + '/download')
        downloadUrl = 'https://www.curseforge.com/' + downloadUrl

        await downloadAddon(downloadUrl, addon.name, this.backupPath, updateState)


        updateState && updateState({
            message: 'installing',
            state: {}
        })
        let zip = new AdmZip(this.backupPath + '/' + addon.name + '.zip')
        zip.extractAllTo(this.backupPath, true);

        rimraf(this.backupPath + '/' + addon.name + '.zip', err => { })
        // first remove old version
        let addOnGroup = [], allChildAddon = fs.readdirSync(this.backupPath), installed = 0
        allChildAddon.map((addOnName, index) => {
            // first remove old version
            if (isFolder(this.backupPath + '/' + addOnName)) {
                rimraf(this.addonsPath + '/' + addOnName, err => {
                    if (!err) {
                        fs.rename(this.backupPath + '/' + addOnName, this.addonsPath + '/' + addOnName, err => {
                            if (!err) {
                                addOnGroup.push(addOnName)
                                console.log(addOnName + ' installed!')
                                installed++

                                if (installed === allChildAddon.length) {

                                    console.log(addOnGroup)



                                    if (installState === 'NEW') {
                                        this.data.push({
                                            name: addon.name,
                                            version: version,
                                            path: addon.path,
                                            group: addOnGroup,
                                            update_time: addon.updateAt,
                                            update_timestamp: addon.updateTimeStamp
                                        })
                                    } else {
                                        Object.assign(this.data.filter(old => old.name === addon.name)[0], {
                                            name: addon.name,
                                            version: version,
                                            path: addon.path,
                                            group: addOnGroup,
                                            update_time: addon.updateAt
                                        })
                                    }



                                    syncData(this.data, this.interfacePath + '/data.json')


                                    updateState && updateState({
                                        message: 'done',
                                        state: {}
                                    })

                                }
                            }
                        })
                    }
                })

            } else {
                installed++
            }
            return ''
        })
        return
    }

    @action delete = async (addon) => {
        return await new Promise((resolve, reject) => {
            for (let i = 0, l = this.data.length; i < l; i++) {
                if (addon.name === this.data[i].name) {
                    // first delete all addons
                    for (let j = 0, k = this.data[i].group.length; j < k; j++) {
                        rimraf(this.addonsPath + '/' + this.data[i].group[j], err => { console.log(err) })
                    }

                    // then delete data
                    this.data.splice(i, 1)

                    syncData(this.data, this.interfacePath + '/data.json')
                    resolve(this.data)
                    break;
                }
            }
        })
    }

    getState = (addon, version) => {
        if (!this.dataStuffed) {
            this.stuffData()
        }

        let state = 'NEW'
        if (this.data.length === 0) {
            return state
        }
        for (let i = 0, l = this.data.length; i < l; i++) {
            if (this.data[i].name === addon.name) {
                if (this.data[i].version === version) {
                    state = 'UPDATED'
                    break
                } else {
                    state = 'OOD'
                    break
                }
            }
        }

        if (addon.name === 'Deadly Boss Mods (DBM)') {
            console.log('get state: ' + state)
        }
        return state
    }

    stuffData = () => {
        let addons
        try {
            addons = JSON.parse(fs.readFileSync(this.interfacePath + '/data.json')).addons
        } catch (err) {
            // If the type is not what you want, then just throw the error again.
            console.log(err.toString())
            if (err.toString() === 'SyntaxError: Unexpected end of JSON input' || err.code === 'ENOENT') {
                fs.writeFileSync(this.interfacePath + '/data.json', JSON.stringify({
                    addons: []
                }))

                addons = []
            } else {
                throw err;
            }
        } finally {
            this.data = addons || []
            this.dataStuffed = true
        }
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

function downloadAddon(url, fileName, folderPath, updateState) {
    return new Promise((resolve, reject) => {
        console.log(url)
        let file = fs.createWriteStream(folderPath + '/' + fileName + '.zip')
        // let total_bytes, received_bytes

        /* let str = progress({
            time: 100,
        }); */

        /* str.on('progress', function (progress) {
            updateState && updateState({
                message: 'donwloading',
                state: progress
            })
        }); */
        request(url).on('response', data => {
        }).on('data', chunk => {
        }).on('end', () => {
            resolve('success')
        }).pipe(file)
    })

}
function isFolder(filePath) {
    return fs.statSync(filePath).isDirectory()
}
function syncData(data, dataPath) {
    console.log('syncing data ...')

    fs.writeFileSync(dataPath, JSON.stringify({
        addons: data
    }))
}

export default new AddonStore()