#!/usr/bin/env node

`use strict`;
const puppeteer     = require('puppeteer');
const http = require('http')
function createServer() {
    http.createServer(function(req, res) {
        let reqMethod = req.method.toUpperCase();
        if (reqMethod === 'POST') {
            if (req.url === '/drawioex/convertToSvg') {
                let str = '';//定义一个空字符串存储数据
                // post的数据传送方式是分段传送的
                req.on('data', function (data) {
                    //每传送一段数据就进行数据的拼接
                    str += data; 
                });
                req.on('end', function () {
                    exportFiles(str, res)
                });
            } else {
                res.end('404 not found')
            }
        } else {
            res.end('method ' + reqMethod + ' not support')
        }
    }).listen('3000')
}

async function exportFiles(xml, res) {
    
    const nonDebugMode = true
    const browser = await puppeteer.launch({headless: nonDebugMode, args: ['--no-sandbox', '--disable-web-security']});
    const format = 'svg'
    try {
        const browserPage = await browser.newPage();
        await browserPage.goto(`file://${__dirname}/export.html`);
        return await exportFile(xml, format, browserPage, res)
    } catch (error) {
        console.log(error);
        process.exit(1);
    } finally {
        if (nonDebugMode) {
            await browser.close();
        }
    }
}

async function exportFile(xml, format, browserPage, res) {
    const fileContent = xml
    if (xml) {
        const results =
            await browserPage.evaluate((fileContent, format, embedImages) => {
                return Promise.all(exportImage(fileContent, format, embedImages));
            }, await fileContent, format);
        const writings =
            results.map((result, index) => {
                res.end(result.data)
            });
        return Promise.all(writings);
    } else {
        res.end('未传入xml文件')
    }
}

try {
    createServer()
} catch(error) {
    console.error(error.message);
    process.exit(1);
}
