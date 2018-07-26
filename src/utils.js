import request from 'request'
import { resolve } from 'url';


const cheerio = require('cheerio')

export const getVersion = (path) => {
    return new Promise((resolve, reject) => {
        request(path, (err, res, body) => {
            let $ = cheerio.load(body)

            let version = $($('.project-file-list__item')[0]).find('.project-file__name .full').text()
            let size = $($('.project-file-list__item')[0]).find('.project-file__size .file__size').text()

            resolve({
                version, size
            })
        })
    })
    
}