

let fs = require("fs");
let path = require('path');
let cv = require('./convert');
let src = '.scalecfg';

function start(){
    if (!fs.existsSync(src)) {
        console.log("file not found with",src);
        let newobj = {
            srcFolder:"./cdn",
            params:[
                {
                    scale:0.25,
                    toFolder:"./src/assets/025"
                },
                {
                    scale:0.75,
                    toFolder:"./src/assets/075"
                },
                {
                    scale:1,
                    toFolder:"./src/assets/100"
                }
            ]
        }
        fs.writeFile(src,JSON.stringify(newobj),function(err){
            if(!err){
                console.log("创建文件",src);
            }
        });
        return;
    }
    fs.readFile(src,'utf-8', function(err,objstr){
        let scalecfg = JSON.parse(objstr);
        cv.convertRes(scalecfg.srcFolder,scalecfg.params);
    })
}

start();



