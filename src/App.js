import React, { Component } from 'react';
// import { TitleBar } from 'react-desktop/macOs';
import { observable } from 'mobx'

import { InstalledAddons, AddonBowser } from './scenes'

import { observer } from 'mobx-react'
import './App.css';

import { Layout, Menu, Icon } from 'antd';

import logo from './assets/logo.jpg'

const {Content, Sider } = Layout;

// import request from 'request'



@observer
class App extends Component {
  @observable hasConfig = false
  @observable menuKey = 'installed'

  menuClick = (menu) => {
   this.menuKey = menu.key
  }
  externalMenuJump = (key) => {
    this.menuKey = key
  }
  render() {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          // collapsible
          // collapsed={true}
          defaultCollapsed={true}
          // onCollapse={this.onCollapse}
        >
          <div className="logo" ><img src={logo} style={{width: '100%'}} alt="logo"/></div>
          <Menu theme="dark" defaultSelectedKeys={[this.menuKey]} mode="inline" onClick={this.menuClick}>
            <Menu.Item key="all">
              <Icon type="pie-chart" />
              <span>所有插件</span>
            </Menu.Item>
            <Menu.Item key="installed">
              <Icon type="desktop" />
              <span>我的插件</span>
            </Menu.Item>
          </Menu>
        </Sider>

        <Layout>
          <Content style={{ margin: '0 16px' }}>
            {/* <Breadcrumb style={{ margin: '16px 0' }}>
              <Breadcrumb.Item>User</Breadcrumb.Item>
              <Breadcrumb.Item>Bill</Breadcrumb.Item>
            </Breadcrumb>
            <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
              Bill is a cat.
            </div> */}

            {this.menuKey === 'all' && <AddonBowser externalMenuJump={this.externalMenuJump}/>}
            {this.menuKey === 'installed' && <InstalledAddons externalMenuJump={this.externalMenuJump}/>}
          </Content>
          {/* <Footer style={{ textAlign: 'center' }}>
            WoW addons manager@2018 by YY
          </Footer> */}
        </Layout>
      </Layout>
    );
  }
}

export default App;
