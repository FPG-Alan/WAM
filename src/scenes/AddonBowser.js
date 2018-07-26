import React, { Component, Fragment } from 'react'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import request from 'request'
import { Spin, TreeSelect, Input, List, Divider } from 'antd';
import stores from '../store'

const cheerio = require('cheerio')
const shell = window.require('electron').shell


const TreeNode = TreeSelect.TreeNode;
const Search = Input.Search;
const store = stores.addons

const provider = 'https://www.curseforge.com/'
// const WebView = require('react-electron-web-view')
@observer
export default class AddonBowser extends Component {
    @observable loading = true
    // @observable updating = false

    @observable selectedCat = 'All'
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

            this.currentPath = path
            let $ = cheerio.load(body)

            this.allCatgories.length === 0 && !isSearch && (this.allCatgories = this.getAllCat($))
            this.nowList = this.getNowList($, isSearch)
            this.totalPages = this.getTotalPages($, isSearch)


            this.loading = false
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

            return ''
        })

        return data
    }
    getNowList = ($, isSearch) => {
        let result = []

        $('li.project-list-item').map((index, item) => {
            let tempItem = $(item)
            result.push({
                name: tempItem.find('.list-item__details .list-item__title').text().trim(),
                path: provider + tempItem.find('.list-item__details >a').attr('href'),
                avatar: tempItem.find('.list-item__avatar img').attr('src'),
                description: tempItem.find('.list-item__details .list-item__description p').text(),
                downloadCount: tempItem.find('.count--download').text(),
                createAt: tempItem.find('.date--created .standard-datetime').text(),
                updateAt: tempItem.find('.date--updated .standard-datetime').text(),
            })

            return ''
        })


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
    handleInstall = (addon) => {
        console.log(addon)
        store.install(addon)
    }
    handleExternalLink = (url) => {
        shell.openExternal(url)
    }
    render() {
        /* const columns = [{
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: 150,
            // sorter: (a, b) => a.name.length - b.name.length,
            // sortOrder: sortedInfo.columnKey === 'name' && sortedInfo.order,
        }, {
            title: 'Dwonload',
            dataIndex: 'downloadCount',
            key: 'downloadCount',
            width: 150,
            // sorter: (a, b) => a.downloadCount - b.downloadCount,
            // sortOrder: sortedInfo.columnKey === 'downloadCount' && sortedInfo.order,
        }, {
            title: 'Lastest Update',
            dataIndex: 'updateAt',
            key: 'updateAt',
            width: 150,
        }, {
            title: 'Action',
            key: 'action',
            render: (text, record) => (
                <span>
                    <a href="javascript:;" onClick={this.handleInstall}>Install</a>

                </span>
            ),
        }]; */
        // return <WebView src="https://www.curseforge.com/wow/addons" />
        return <div style={{ height: '100vh', position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <Spin spinning={this.loading} style={{ alignSelf: 'center' }}>
                <TreeSelect
                    showSearch
                    style={{ width: 300 }}
                    value={this.selectedCat}
                    dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                    // placeholder="All catalogue"
                    // allowClear
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

                {/* <Table columns={columns} dataSource={this.nowList} pagination={{ pageSize: 20, total: this.totalPages * 20, onChange: this.handlePageChange }} scroll={{ y: 340 }} loading={this.updating} /> */}

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
                        <List.Item
                            key={item.name}
                            actions={[<a onClick={e=>{this.handleInstall(item)}}>Install</a>]}
                            extra={<img width={100} alt="logo" src={item.avatar || 'https://www.curseforge.com/Content/2-0-6779-25044/Skins/CurseForge/images/anvilBlack.png'} />}
                        >
                            <List.Item.Meta
                                // avatar={<Avatar src={item.avatar} />}
                                title={<a onClick={e => { this.handleExternalLink(item.path) }}>{item.name}</a>}
                                description={<AddonDes data={item} />}
                            />
                            {item.description}
                        </List.Item>
                    )}
                />,
            </Spin>
        </div>
    }
}

class AddonDes extends Component {
    render() {
        const { downloadCount, createAt, updateAt } = this.props.data
        return <Fragment>
            <span>Download: {downloadCount}</span>
            <Divider type="vertical" />
            <span>Update: {updateAt}</span>
            <Divider type="vertical" />
            <span>Create: {createAt}</span>
        </Fragment>
    }
}