import React, { Component, Fragment } from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import XLSX from 'xlsx';

import { Form, Input, Tooltip, Icon, Cascader, Select, Row, Col, Checkbox, Button, AutoComplete, Progress, Upload, message } from 'antd';
import stores from '../store';
import { getVersion } from '../utils';

// import { writeFile, readFile, DocumentDirectoryPath } from 'react-native-fs';

const { dialog } = window.require('electron').remote;
const fs = window.require('fs');
const rp = require('request-promise');
const cheerio = require('cheerio');

const { Option } = Select;
const AutoCompleteOption = AutoComplete.Option;
const Store = window.require('electron-store');
const presist = new Store();
const store = stores.addons;
// const APIKEY = 'aaoIwhHr8ajrPvhom5@ddd';

console.log(XLSX);

// apikey:aaoIwhHr8ajrPvhom5@ddd
@observer
class ShortUrl extends Component {
  allData = {};
  path = '';
  sum = 0;
  frequence = 350;
  key = 'aaoIwhHr8ajrPvhom5@ddd';

  tmpData = [];

  @observable showFlushBtn = false;
  @observable setEnable = true;
  @observable current = 0;
  @observable showProgress = false;
  handleGetFile = (file, fileList) => {
    this.setEnable = false;
    this.name = file.name;
    fs.readFile(file.path, (err, res) => {
      /* parse file */
      this.path = file.path;
      var data = new Uint8Array(res);
      var workbook = XLSX.read(data, { type: 'array' });

      this.allData = workbook.Sheets;

      this.beginWork();
    });
    return false;
  };
  beginWork = async () => {
    let all_new_sheet = [];
    Object.entries(this.allData).map(v => {
      this.sum += XLSX.utils.sheet_to_json(v[1], { header: 1 }).filter(d => d.length > 0).length;
    });
    this.showProgress = true;
    // console.log('total sum: ' + this.sum);

    for (let key in this.allData) {
      var data = XLSX.utils.sheet_to_json(this.allData[key], { header: 1 });
      let altData = await this.doWorkForSheet(key, data);
      var worksheet = XLSX.utils.aoa_to_sheet(altData);
      all_new_sheet.push({
        ws: worksheet,
        name: key
      });
    }
    const wb = XLSX.utils.book_new();
    all_new_sheet.forEach(wsData => {
      XLSX.utils.book_append_sheet(wb, wsData.ws, wsData.name);
    });

    const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const path = this.path.split('.');
    fs.writeFile(path[0] + '_convert.' + path[1], new Uint8Array(wbout), err => {
      this.showProgress = false;

      message.success('complete');

      this.setEnable = true;
      this.showFlushBtn = false;
    });
  };

  doWorkForSheet = async (sheetName, sheetData) => {
    for (let i = 0, l = sheetData.length; i < l; i++) {
      if (sheetData[i].length > 0) {
        let singleData = [];
        singleData.push(sheetData[i][0]);
        try {
          let shortUrl = await this.getShortUrl(sheetData[i][0]);
          if (shortUrl && shortUrl.error === '') {
            singleData.push(shortUrl.url);
          } else {
            message.error((shortUrl && shortUrl.error) || 'get short url error');
          }
          this.current++;
          this.tmpData.push(singleData);
        } catch (e) {
          message.error(e.toString());
          this.current++;
          this.tmpData.push(singleData);
        }
        if (this.current > 0) {
          this.showFlushBtn = true;
        }
      }
    }
    return this.tmpData;
  };

  getShortUrl = async longUrl => {
    if (longUrl && longUrl !== '') {
      const data = await rp({
        uri: `http://api.ft12.com/api.php?format=json&url=${encodeURIComponent(longUrl)}&apikey=${this.key}`,
        json: true // Automatically parses the JSON string in the response
      });
      await new Promise(resolve => {
        setTimeout(resolve, 350);
      });
      return data;
    }
    return;
  };
  handleFlush = () => {
    if (this.tmpData.length > 0) {
      var worksheet = XLSX.utils.aoa_to_sheet(this.tmpData);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, worksheet, 'break');

      const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const path = this.path.split('.');
      fs.writeFile(path[0] + '_convert_break.' + path[1], new Uint8Array(wbout), err => {
        // this.showProgress = false;

        message.success('complete');

        // this.setEnable = true;
        // this.showFlushBtn = false;
      });
    }
  };
  render() {
    const { getFieldDecorator } = this.props.form;

    return (
      <div style={{ height: '100vh', position: 'relative' }}>
        <p>
          <span>Frequence: </span>
          <Input
            onChange={e => {
              this.frequence = e.target.value;
            }}
            disabled={!this.setEnable}
            defaultValue={350}
          />
          <Button
            disabled={!this.setEnable}
            type="primary"
            onClick={e => {
              message.success('alt frequence to ' + this.frequence);
            }}
          >
            Submit
          </Button>
          <br />
          <span>Key: </span>
          <Input
            onChange={e => {
              this.key = e.target.value;
            }}
            disabled={!this.setEnable}
            defaultValue={'aaoIwhHr8ajrPvhom5@ddd'}
          />
          <Button
            disabled={!this.setEnable}
            type="primary"
            onClick={e => {
              message.success('alt key to ' + this.key);
            }}
          >
            Submit
          </Button>
        </p>
        <div style={{ position: 'relative', height: 200, width: '100%', top: 10 }}>
          <Upload.Dragger beforeUpload={this.handleGetFile}>
            <div className="empty-upload">
              <p>
                <Icon type="inbox" />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
            </div>
          </Upload.Dragger>
        </div>
        {this.showProgress && (
          <div style={{ position: 'relative', top: 30 }}>
            <Progress percent={Math.round((this.current / this.sum) * 100)} />
            <p>
              {this.current}/{this.sum}
            </p>
          </div>
        )}

        {this.showFlushBtn && (
          <Button type="primary" onClick={this.handleFlush} style={{ marginTop: 30 }}>
            Stop && Flush All Data
          </Button>
        )}
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

const WrappedRegistrationForm = Form.create({ name: 'register' })(ShortUrl);
export default WrappedRegistrationForm;
