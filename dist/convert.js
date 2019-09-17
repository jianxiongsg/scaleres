var imgsize = require("image-size");
var sharp = require("sharp");
var fs = require("fs");
var path = require('path');
function convertRes(srcFolder, params) {
    if (params instanceof Array) {
        for (let i = 0; i < params.length; ++i) {
            demote(srcFolder, params[i]);
        }
        return;
    }
    if (params instanceof Object) {
        demote(srcFolder, params);
    }
}
function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    }
    else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}
module.exports = {
    convertRes: convertRes,
    mkdirsSync: mkdirsSync
};
function demote(srcFolder, param) {
    console.log(param);
    if (!param.scale || !param.toFolder) {
        console.error("请传入正确的参数");
        return;
    }
    let scale = param.scale;
    let toFolder = param.toFolder;
    if (!fs.existsSync(toFolder)) {
        mkdirsSync(toFolder);
    }
    function finder(filepath) {
        let files = fs.readdirSync(filepath);
        let toPath = path.join(toFolder, filepath.slice(srcFolder.length));
        if (!fs.existsSync(toPath)) {
            mkdirsSync(toPath);
        }
        files.forEach((val, index) => {
            var fPath = path.join(filepath, val);
            var stats = fs.statSync(fPath);
            if (stats.isDirectory()) {
                finder(fPath);
            }
            ;
            if (stats.isFile()) {
                let filename = getFileName(fPath);
                let extname = path.extname(filename);
                if (extname === ".png") {
                    resizeImg(fPath, toPath, scale);
                }
                if (extname === ".json") {
                    if (filename.indexOf("tex") !== -1) {
                        resizeTexJson(fPath, toPath, scale);
                    }
                    else if (filename.indexOf("ske") !== -1) {
                        resizeSkeJson(fPath, toPath, scale);
                    }
                    else {
                        resizeJson(fPath, toPath, scale);
                    }
                }
            }
            ;
        });
    }
    finder(srcFolder);
}
function getFileName(path) {
    var pos1 = path.lastIndexOf('/');
    var pos2 = path.lastIndexOf('\\');
    var pos = Math.max(pos1, pos2);
    if (pos < 0)
        return path;
    else
        return path.substring(pos + 1);
}
function convertFrameAnim(jsonpath, imgpath, toPath, scale) {
    if (!fs.existsSync(toPath)) {
        mkdirsSync(toPath);
    }
    resizeImg(imgpath, toPath, scale);
    resizeJson(jsonpath, toPath, scale);
}
function convertSkeAnim(skeJsonPath, texJsonPath, texImgPath, toPath, scale) {
    if (!fs.existsSync(toPath)) {
        mkdirsSync(toPath);
    }
    resizeImg(texImgPath, toPath, scale);
    resizeSkeJson(skeJsonPath, toPath, scale);
    resizeTexJson(texJsonPath, toPath, scale);
}
function resizeSkeJson(src, dst, scale) {
    fs.readFile(src, 'utf-8', function (err, str) {
        obj = JSON.parse(str);
        let armatures = obj.armature;
        for (let i = 0; i < armatures.length; ++i) {
            let aabb = armatures[i].aabb;
            aabb.width *= scale;
            aabb.height *= scale;
            aabb.x *= scale;
            aabb.y *= scale;
            updateSkeAnimaions(armatures[i].animation, scale);
            updateSkeBone(armatures[i].bone, scale);
            updateSkeSkins(armatures[i].skin, scale);
        }
        let objStr = JSON.stringify(obj);
        let toPath = path.resolve(dst, getFileName(src));
        console.log(toPath);
        fs.writeFile(toPath, objStr, function (err) {
            if (!err) {
                console.log("文件写入成功", toPath);
            }
            else {
                console.error("文件写入失败", err);
            }
        });
    });
}
function updateSkeBone(bones, scale) {
    for (let i = 0; i < bones.length; ++i) {
        let transform = bones[i].transform;
        if (bones[i].name === "root") {
            transform.scX = transform.scX ? transform.scX * 1 / scale : 1 / scale;
            transform.scY = transform.scY ? transform.scY * 1 / scale : 1 / scale;
        }
        if (bones[i].length) {
            bones[i].length = Math.ceil(bones[i].length * scale);
        }
        if (transform.x) {
            transform.x *= scale;
        }
        if (transform.y) {
            transform.y *= scale;
        }
    }
    return bones;
}
function updateSkeAnimaions(animations, scale) {
    for (let i = 0; i < animations.length; ++i) {
        let bones = animations[i].bone;
        for (let j = 0; j < bones.length; ++j) {
            let translateFrame = bones[j].translateFrame;
            translateFrame.forEach((tf) => {
                if (tf.x)
                    tf.x *= scale;
                if (tf.y)
                    tf.y *= scale;
            });
        }
    }
    return animations;
}
function updateSkeSkins(skins, scale) {
    for (let i = 0; i < skins.length; ++i) {
        let slots = skins[i].slot;
        slots.forEach((s) => {
            let display = s.display;
            display.forEach((d) => {
                if (d.transform.x) {
                    d.transform.x *= scale;
                }
                if (d.transform.y) {
                    d.transform.y *= scale;
                }
            });
        });
    }
    return skins;
}
function resizeTexJson(src, dst, scale) {
    fs.readFile(src, 'utf-8', function (err, str) {
        obj = JSON.parse(str);
        obj.width = Math.ceil(obj.width * scale);
        obj.height = Math.ceil(obj.height * scale);
        let subTextures = obj.SubTexture;
        for (let i = 0; i < subTextures.length; ++i) {
            subTextures[i].width *= scale;
            subTextures[i].height *= scale;
            subTextures[i].x *= scale;
            subTextures[i].y *= scale;
        }
        var objStr = JSON.stringify(obj);
        let toPath = path.resolve(dst, getFileName(src));
        fs.writeFile(toPath, objStr, function (err) {
            if (!err) {
                console.log("文件写入成功", toPath);
            }
            else {
                console.error("文件写入失败", err);
            }
        });
    });
}
function resizeJson(src, dst, scale) {
    fs.readFile(src, 'utf-8', function (err, str) {
        obj = JSON.parse(str);
        let meta = obj.meta;
        let frames = obj.frames;
        meta.size = { w: meta.size.w * scale, h: meta.size.h * scale };
        for (let n in frames) {
            frames[n].frame.x *= scale;
            frames[n].frame.y *= scale;
            frames[n].frame.w *= scale;
            frames[n].frame.h *= scale;
            frames[n].spriteSourceSize.x *= scale;
            frames[n].spriteSourceSize.y *= scale;
            frames[n].spriteSourceSize.w *= scale;
            frames[n].spriteSourceSize.h *= scale;
            frames[n].sourceSize.w *= scale;
            frames[n].sourceSize.h *= scale;
        }
        var objStr = JSON.stringify(obj);
        let toPath = path.resolve(dst, getFileName(src));
        fs.writeFile(toPath, objStr, function (err) {
            if (!err) {
                console.log("文件写入成功", toPath);
            }
            else {
                console.error("文件写入失败", err);
            }
        });
    });
}
function resizeImg(src, dst, scale) {
    return new Promise((resolve, reject) => {
        imgsize(src, (err, info) => {
            if (err) {
                console.log(err);
                reject();
                return;
            }
            let toPath = path.resolve(dst, getFileName(src));
            sharp(src).resize(clampNum(info.width * scale), clampNum(info.height * scale)).toFile(toPath, (err2) => {
                if (err2) {
                    console.error("文件写入失败", err2);
                    reject();
                    return;
                }
                console.log("文件写入成功", toPath);
                resolve();
            });
        });
    });
}
function clampNum(v) {
    if (v < 1) {
        return 1;
    }
    return Math.ceil(v);
}
