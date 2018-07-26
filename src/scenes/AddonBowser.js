import React, { Component, Fragment } from 'react'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import request from 'request'
import { Spin, TreeSelect, Input, Table, List, Avatar, Divider, Drawer, Progress, Button } from 'antd';
import stores from '../store'
import config from '../config'
import { getVersion } from '../utils'

const cheerio = require('cheerio')
const shell = window.require('electron').shell


const TreeNode = TreeSelect.TreeNode;
const Search = Input.Search;
const store = stores.addons
@observer
export default class AddonBowser extends Component {
    @observable loading = true
    @observable selectedCat = 'All'
    @observable detailInfovisible = false

    allCatgories = []
    nowList = []
    totalPages = 0
    currentPath = ''
    searchState = false

    componentWillMount() {
        this.loading = true
        this.getData('https://www.curseforge.com/wow/addons')
    }
    getData = (path, isSearch) => {
        this.loading = true
        console.log(path)
        request(path, (err, res, body) => {
            isSearch && (this.searchState = true)

            console.log(body)
            this.currentPath = path
            let $ = cheerio.load(body)

            this.allCatgories.length === 0 && !isSearch && (this.allCatgories = this.getAllCat($))
            this.totalPages = this.getTotalPages($, isSearch)


            this.getNowList($, isSearch).then(data => {
                this.nowList = data
                this.loading = false
            })



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
    async getNowList($, isSearch) {
        let result = []

        let list = $('li.project-list-item')

        for (let i = 0, l = list.length; i < l; i++) {
            let tempItem = $(list[i])
            let itemInfo = {
                name: tempItem.find('.list-item__details .list-item__title').text().trim(),
                path: config.provider + tempItem.find('.list-item__details >a').attr('href'),
                avatar: tempItem.find('.list-item__avatar img').attr('src'),
                description: tempItem.find('.list-item__details .list-item__description p').text(),
                downloadCount: tempItem.find('.count--download').text(),
                createAt: tempItem.find('.date--created .standard-datetime').text(),
                updateAt: tempItem.find('.date--updated .standard-datetime').text(),
                updateTimeStamp: tempItem.find('.date--updated .standard-datetime').attr('data-epoch')
            }

            result.push(itemInfo)
        }
        return result
    }
    getTotalPages = ($, isSearch = false) => {
        let totalPages = 1
        if (isSearch) {
            let totalNum = $('li.b-tab-item >a')
            if (totalNum.length !== 0) {
                totalNum = totalNum.text().match(/\(([^)]*)\)/)[1]
                totalPages = Math.ceil(totalNum / 20)
            }

        } else {
            let allPage = $('li.b-pagination-item')
            if (allPage.length !== 0) {
                totalPages = $(allPage[allPage.length - 2]).find('a').text()
                console.log($(allPage[allPage.length - 2]).find('a'))
            }
        }
        return totalPages
    }
    handleChangeCat = (value, label, extra) => {
        console.log(value, label, extra)
        if (value.indexOf('cat__') === -1) {
            let pathArr = value.split('__')
            let path = 'https://www.curseforge.com/wow/addons'
            if (pathArr.length === 1) {
                path += ('/' + pathArr[0])
                this.selectedCat = pathArr[0]
            } else {
                path += ('/' + pathArr[0] + '/' + pathArr[1])
                this.selectedCat = pathArr[1]
            }

            this.getData(path)
        }
    }
    handleSearchChange = (searchStr) => {
        let path = 'https://www.curseforge.com/wow/addons/search?search=' + searchStr
        this.getData(path, true)
    }
    handlePageChange = (page, pageSize) => {
        if (this.searchState) {
            this.getData(this.currentPath.split('&')[0] + '&wow-addons-page=' + page, this.searchState)
        } else {
            this.getData(this.currentPath.split('?')[0] + '?page=' + page, this.searchState)
        }
    }
    handleOpenDetail = (item) => {
        this.detailInfovisible = true
    }
    handleDetailInfoClose = () => {
        this.detailInfovisible = false
    }

    render() {
        return <div style={{ height: '100vh', position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <Spin spinning={this.loading} style={{ alignSelf: 'center' }}>
                <TreeSelect
                    showSearch
                    style={{ width: 300 }}
                    value={this.selectedCat}
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    onChange={this.handleChangeCat}
                >
                    {this.allCatgories.map(cat => {
                        if (!cat.subcat) {
                            return (<TreeNode value={cat.name} title={cat.name} key={cat.name} />)
                        } else {
                            return (<TreeNode value={'cat__' + cat.name} title={cat.name} key={cat.name}>
                                {cat.subcat.map(subcat => (<TreeNode value={cat.name + "__" + subcat.name} title={subcat.name} key={subcat.name} isLeaf={true} />))}
                            </TreeNode>)
                        }
                    })}
                </TreeSelect>

                <Search
                    placeholder="search"
                    onSearch={this.handleSearchChange}
                    style={{ width: 200 }}
                />
                <List
                    itemLayout="vertical"
                    size="large"
                    pagination={{
                        onChange: this.handlePageChange,
                        pageSize: 20,
                        total: this.totalPages * 20
                    }}
                    dataSource={this.nowList}
                    renderItem={item => (
                        <AddonDetail item={item} handleOpenDetail={this.handleOpenDetail} />
                    )}
                />
                <Drawer
                    width={'calc(100vw - 80px)'}
                    placement="right"
                    closable={true}
                    onClose={this.handleDetailInfoClose}
                    visible={this.detailInfovisible}
                >
                    <p>Detail info</p>
                </Drawer>

            </Spin>
        </div>
    }
}

@observer
class AddonDetail extends Component {
    @observable downloading = false
    @observable version = ''
    @observable size = ''
    @observable versionReady = false

    @observable stateObj = { value: 'NEW' } //NEW, UPDATED, OOD

    componentWillMount() {
        // get version
        getVersion(this.props.item.path + '/files').then(data => {
            this.version = data.version
            this.size = data.size

            this.versionReady = true

            this.stateObj.value = store.getState(this.props.item, this.version)

            if (this.props.item.name === 'Deadly Boss Mods (DBM)') {
                console.log(this.stateObj.value)
            }
        })
    }

    handleUpdateState = (addon) => {
        this.downloading = true
        store.install(addon, this.version, this.stateObj.value, this.updateInstallState)
    }

    handleExternalLink = (url) => {
        shell.openExternal(url)
    }
    handleOpenDetail = () => {
        this.props.handleOpenDetail(this.props.item)
    }
    updateInstallState = (update) => {
        if (update.message === 'done') {
            this.stateObj.value = store.getState(this.props.item, this.version)
            setTimeout(() => {
                this.downloading = false
            }, 1000);
        }
    }
    render() {
        const { item } = this.props
        const actions = [<Button type="primary" disabled={!this.versionReady || this.stateObj.value === 'UPDATED'} loading={this.downloading} onClick={e => { this.handleUpdateState(item) }}>{this.stateObj.value === 'NEW' ? 'Install' : (this.stateObj.value === 'UPDATED' ? 'Installed' : 'Update')}</Button>, <Button type="primary" onClick={this.handleOpenDetail}>More</Button>]


        return <List.Item
            key={item.name}
            actions={actions}
            extra={<img width={100} alt="logo" src={item.avatar || 'https://www.curseforge.com/Content/2-0-6779-25044/Skins/CurseForge/images/anvilBlack.png'} style={{position:'relative', top:'50%', transform:'translateY(-50%)'}}/>}
        >
            <List.Item.Meta
                title={<a href="javascript:;" onClick={e => { this.handleExternalLink(item.path) }}>{item.name}</a>}
                description={<AddonDes data={item} version={this.version} />}
            />
            {item.description}
        </List.Item>
    }
}

class AddonDes extends Component {
    render() {
        const { data, version } = this.props
        return <div style={{ fontSize: '11px' }}>
            <span>Download: {data.downloadCount}</span>
            <Divider type="vertical" />
            <span>Update: {data.updateAt}</span>
            <Divider type="vertical" />
            <span>Create: {data.createAt}</span>
            <Divider type="vertical" />
            <span>Version: {version || ''}</span>
        </div>
    }
}