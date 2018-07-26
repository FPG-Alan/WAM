import request from 'request'


const cheerio = require('cheerio')

export const getVersion = async (path) => {
    let $ = await getPage(path)

    return {
        version: $($('.project-file-list__item')[0]).find('.project-file__name .full').text(),
        size: $($('.project-file-list__item')[0]).find('.project-file__size .file__size').text()
    } 
}

export const getFullDescription = async (path) => {
    let $ = await getPage(path)

    return {
        content : $('.project__description').html()
    }
}

export const getScreenShots = async (path) => {
    let $ = await getPage(path)
    return {
        screenshots: $('.screenshot__item img').map((index, imgNode)=>$(imgNode).attr('src'))
    }
}

function getPage(path){
    return new Promise((resolve, reject) => {
        request(path, (err, res, body) => {
            if(err){
                reject(err)
            }else{
                resolve(cheerio.load(body))
            }
        })
    })
}