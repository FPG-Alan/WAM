import React, { Component, Fragment } from 'react'
import { observable } from 'mobx'
import { observer } from 'mobx-react'

import { Button, Spin } from 'antd'
import stores from '../store'





const Store = window.require('electron-store');
const presist = new Store();
const store = stores.addons


@observer
export default class InstalledAddons extends Component {
    @observable configed = false
    @observable loading = true
    wowPath = ''
    addons = []
    

    componentWillMount() {
        if (this.wowPath = presist.get('wow_path')) {
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
        store.list().then(data=>{
            this.addons = data
            this.loading = false
        })
    }

    handleJumpToBrowser = () => {
        this.props.externalMenuJump('all')
    }
    render() {
        return <div style={{ height: '100vh', position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {!this.configed && <div >
                <span>You have not config a wow path</span> 
                <Button type="primary" onClick={this.handleSetup}>Browser</Button>
            </div>}

            {this.configed && <Spin spinning={this.loading} style={{ alignSelf: 'center' }}>
                {!this.loading && this.addons.length === 0 && <p>no addons found, <a onClick={this.handleJumpToBrowser}>go to pick some!</a></p>}
            </Spin>}
        </div>
    }
}