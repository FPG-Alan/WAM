import React, { Component } from 'react'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import request from 'request'
import { Spin } from 'antd';

const cheerio = require('cheerio')
// const WebView = require('react-electron-web-view')
@observer
export default class AddonBowser extends Component {
    @observable loading = true
    allCatgories = []
    nowList = []
    componentWillMount() {
        this.getData()
    }
    getData = () => {
        this.loading = true
        request('https://www.curseforge.com/wow/addons', (err, res, body) => {
            // console.log(body)
            let $ = cheerio.load(body)

            this.allCatgories = this.getAllCat($)
            this.nowList = this.getNowList($)

            this.loading = false

            console.log(this.allCatgories)
        })
    }
    getAllCat = ($) => {
        let all = $('li.tier-holder li a').map((index, item) => $(item).attr('href'))
        let cat = [], data = []
        all.map((index, item) => {
            let tmpArr = item.split('/')
            if (tmpArr.length === 4) {
                cat.push(tmpArr[3])
                data.push({
                    name: tmpArr[3],
                    path: item
                })
            } else {
                !data[data.length - 1]['subcat'] && (data[data.length - 1]['subcat'] = [])

                data[data.length - 1]['subcat'].push({
                    name: tmpArr[4],
                    path: item
                })
            }
        })

        return data
    }
    getNowList = ($) => {
        return []
    }
    render() {
        // return <WebView src="https://www.curseforge.com/wow/addons" />
        return <div style={{ height: "calc(100vh - 69px)", top: '10px', position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <Spin spinning={this.loading} style={{ alignSelf: 'center' }}>

            </Spin>
        </div>
    }
}