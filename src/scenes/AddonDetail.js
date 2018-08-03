import React, { Component } from 'react'
import { Carousel, Spin } from 'antd'
import { observable } from 'mobx'
import { observer } from 'mobx-react'

import { getFullDescription, getScreenShots } from '../utils'

import './style.css'

@observer
export default class AddonDetail extends Component {
    @observable loading = true

    descriptionHTML = ''
    screenList = []

    componentWillMount() {
        console.log(this.props.addon)
        this.getData(this.props.addon)
    }

    componentWillReceiveProps(nextProps){
        
        this.loading = true
        this.screenList = []
        this.getData(nextProps.addon)
    }

    getData = (addon) => {
        Promise.all([getFullDescription(addon.path), getScreenShots(addon.path + '/screenshots')]).then(data => {
            console.log(data)
            this.descriptionHTML = data[0].content
            this.screenList.push(...data[1].screenshots)

            this.screenList = this.screenList.map(src=>src.replace('/thumbnails', '').replace('/310/172', ''))
            this.loading = false
        })


    }
    render() {
        console.log(typeof(this.screenList))
        return <Spin spinning={this.loading} style={{height: 360}}>
            {!this.loading && <Carousel >
                {this.screenList.map((src, index) => (<div key={index}><img src={src} alt=''/></div>))}
            </Carousel>}
            {!this.loading && <div dangerouslySetInnerHTML={{ __html: this.descriptionHTML }}></div>}
        </Spin>
    }
}