import React, { Component } from 'react'
import { observable } from 'mobx'
import { observer } from 'mobx-react'

import { Button, Spin, Table } from 'antd'
import stores from '../store'
import { getVersion } from '../utils'





const Store = window.require('electron-store');
const presist = new Store();
const store = stores.addons


@observer
export default class InstalledAddons extends Component {
    @observable configed = false
    @observable loading = true
    @observable addons = []
    wowPath = ''



    componentWillMount() {
        this.wowPath = presist.get('wow_path')
        if (this.wowPath) {
            this.configed = true
            store.setup(this.wowPath)
            this.getData()
        }
        console.log(this.wowPath)
    }
    handleSetup = () => {
        presist.set('wow_path', store.setup())
        this.configed = true
        this.getData()
    }

    getData = () => {
        store.list().then(data => {
            this.addons = data
            this.loading = false
        })
    }

    handleJumpToBrowser = () => {
        this.props.externalMenuJump('all')
    }

    handleDeleteAddon = (addon) => {
        store.delete(addon).then(data => {
            this.addons = data
        })
    }
    render() {
        const rowSelection = {
            onChange: (selectedRowKeys, selectedRows) => {
                console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
            },
            getCheckboxProps: record => ({
                name: record.name,
            }),
        }

        const columns = [{
            title: 'Name',
            dataIndex: 'name',

            render: str => <a href="">{str}</a>
        }, {
            title: 'Version',
            dataIndex: 'version',
        }, {
            title: 'Update Time',
            dataIndex: 'update_time'
        }, {
            title: 'Actions',
            render: (addon) => (<Fragment><UpdateAction data={addon} /> <Button type="primary" onClick={e => { this.handleDeleteAddon(addon) }} style={{width: '81px'}}>Delete</Button></Fragment>)
        }]
        return <div style={{ height: '100vh', position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {!this.configed && <div >
                <span>You have not config a wow path</span>
                <Button type="primary" onClick={this.handleSetup}>Browser</Button>
            </div>}

            {this.configed && <Spin spinning={this.loading} style={{ alignSelf: 'center' }}>
                {!this.loading && this.addons.length === 0 && <p>no addons found, <a onClick={this.handleJumpToBrowser}>go to pick some!</a></p>}

                {!this.loading && this.addons.length > 0 && <Table rowSelection={rowSelection} columns={columns} dataSource={this.addons} rowKey={record => record.name} />}
            </Spin>}
        </div>
    }
}

@observer
class UpdateAction extends Component {
    @observable loading = true
    @observable downloading = false
    @observable stateObj = { value: 'NEW' } //NEW, UPDATED, OOD

    version = ''
    componentWillMount() {
        let addon = this.props.data
        getVersion(addon.path + '/files').then(data => {
            this.stateObj.value = store.getState(addon, data.version)
            this.version = data.version
            this.loading = false
        })
    }
    handleUpdate = () => {
        this.downloading = true
        store.install(this.props.data, this.version, this.stateObj.value, this.updateInstallState)
    }
    updateInstallState = (update) => {
        if (update.message === 'done') {
            this.stateObj.value = store.getState(this.props.data, this.version)
            setTimeout(() => {
                this.downloading = false
            }, 1000);
        }
    }
    render() {
        return <Spin spinning={this.loading}>
                {this.stateObj.value === 'OOD' &&<Button type="primary" style={{marginBottom: 10}} loading={this.downloading} onClick={this.handleUpdate}>Update</Button>}
            </Spin>
    }
}