import React, { Component, Fragment } from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';

import { Form, Input, Tooltip, Icon, Cascader, Select, Row, Col, Checkbox, Button, AutoComplete, Progress } from 'antd';
import stores from '../store';
import { getVersion } from '../utils';
const { dialog } = window.require('electron').remote;
const fs = window.require('fs');
const rp = require('request-promise');
const cheerio = require('cheerio');

const { Option } = Select;
const AutoCompleteOption = AutoComplete.Option;
const Store = window.require('electron-store');
const presist = new Store();
const store = stores.addons;

@observer
class DownloadImages extends Component {
  @observable path = '';
  @observable boardID = '';
  total = 0;
  current = 0;
  @observable downloading = false;
  @observable downloadPer = 0;

  handleSetup = () => {
    this.path = dialog.showOpenDialog({
      properties: ['openDirectory']
    });
  };
  handleUrlChange = e => {
    this.boardID = e.target.value;
  };
  handleStartDonwload = async e => {
    if (this.path !== '' && this.boardID !== '') {
      this.downloading = true;
      this.startDownload();
    }
  };
  startDownload = async (start = -1, limit = -1) => {
    let data = await model.getPins(this.boardID, start, limit);

    if (data && data.board.pins.length > 0) {
      if (this.total === 0) {
        this.total = data.board.pin_count || 0;
      }
      model.downloadImage(data.board.pins, this.path);
      this.current += data.board.pins.length;
      if (this.total !== 0) {
        this.downloadPer = Math.floor((this.current / this.total) * 100);
      }
      // delay 3s
      setTimeout(this.startDownload, 3000, data.board.pins[data.board.pins.length - 1].pin_id, 50);
    } else {
      this.downloading = false;
    }
  };
  render() {
    const { getFieldDecorator } = this.props.form;

    return (
      <div style={{ height: '100vh', position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <Form onSubmit={this.handleSubmit} style={{ width: '100%' }}>
          <Form.Item label="Target URL">
            {getFieldDecorator('url', {
              rules: [
                {
                  required: true,
                  message: 'Please input target url'
                }
              ]
            })(<Input onChange={this.handleUrlChange} />)}
          </Form.Item>
          <Form.Item label="download path">
            {this.path === '' && (
              <Button type="primary" onClick={this.handleSetup}>
                Browser
              </Button>
            )}
            {this.path !== '' && <span>{this.path}</span>}
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" onClick={this.handleStartDonwload} loading={this.downloading}>
              {(this.downloading && 'Downloading') || 'Start'}
            </Button>
          </Form.Item>
          {this.downloading && <Progress percent={this.downloadPer} />}
          <Button
            onClick={e => {
              this.total = 0;
              this.downloadPer = 0;
            }}
          >
            Clear
          </Button>
        </Form>
      </div>
    );
  }
}

const model = {
  async getPins(boardID, start, limit) {
    let targetUri = boardID;
    if (start !== -1 && limit !== -1) {
      targetUri += '?max=' + start + '&limit=' + limit;
    }
    const data = await rp({
      uri: targetUri,
      headers: {
        'X-Request': 'JSON',
        'X-Requested-With': 'XMLHttpRequest'
      },
      json: true // Automatically parses the JSON string in the response
    });
    return data;
  },
  // getUrl(data) {
  //   let list = [];
  //   const $ = cheerio.load(data.res); //将html转换为可操作的节点
  //   $("#pins li a")
  //     .children()
  //     .each(async (i, e) => {
  //       let obj = {
  //         name: e.attribs.alt, //图片网页的名字，后面作为文件夹名字
  //         url: e.parent.attribs.href //图片网页的url
  //       };
  //       list.push(obj); //输出目录页查询出来的所有链接地址
  //     });
  //   return list;
  // },
  // getTitle(obj) {
  //   downloadPath = depositPath + obj.name;
  //   if (!fs.existsSync(downloadPath)) {//查看是否存在这个文件夹
  //     fs.mkdirSync(downloadPath);//不存在就建文件夹
  //     console.log(`${obj.name}文件夹创建成功`);
  //     return true;
  //   } else {
  //     console.log(`${obj.name}文件夹已经存在`);
  //     return false;
  //   }
  // },
  // getImagesNum(res, name) {
  //   if (res) {
  //     let $ = cheerio.load(res);
  //     let len = $(".pagenavi")
  //       .find("a")
  //       .find("span").length;
  //     if (len == 0) {
  //       fs.rmdirSync(`${depositPath}${name}`);//删除无法下载的文件夹
  //       return 0;
  //     }
  //     let pageIndex = $(".pagenavi")
  //       .find("a")
  //       .find("span")[len - 2].children[0].data;
  //     return pageIndex;//返回图片总数
  //   }
  // },
  //下载相册照片
  async downloadImage(pins, path) {
    pins.map(async (pin, index) => {
      let headers = {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        Host: 'i.meizitu.net',
        Pragma: 'no-cache',
        'Proxy-Connection': 'keep-alive',
        Referer: 'http://huaban.com/boards/' + pin.board_id,
        'Upgrade-Insecure-Requests': 1,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.19 Safari/537.36'
      };
      await rp({
        uri: 'http://img.hb.aicdn.com/' + pin.file.key,
        resolveWithFullResponse: true,
        headers
      }).pipe(fs.createWriteStream(`${path}/${pin.pin_id}.jpg`));
    });
  }
};

const WrappedRegistrationForm = Form.create({ name: 'register' })(DownloadImages);
export default WrappedRegistrationForm;
