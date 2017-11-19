const nodeCrypto = require('crypto');
const fs = require('fs');
const jimp = require("jimp");

module.exports = {

    uuidv4: function () {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b => (b ^ nodeCrypto.rng(1)[0] % 16 >> b / 4).toString(16));
    },

    createFilename: function (path, extension) {
        return new Promise(resolve => {
            let filename = path + this.uuidv4() + "." + extension;
    
            fs.stat(filename, (err, stat) => { 
                if (stat != undefined && stat.isFile()) {
                    return this.createFilename().then(filename => {
                        resolve(filename);
                    });
                }else{
                    return resolve(filename);
                }
            }); 
        });
    },

    savePicture: function (picurePath, base64Data) {
        return new Promise((resolve, reject) => {
            if (base64Data === undefined && base64Data !== ""){
                return resolve("");
            }

            let imageType = base64Data.match(/data:image\/([a-zA-Z0-9-.+]+).*,.*/)[1];       
            base64Data = base64Data.replace(/^data:image\/\w+;base64,/, '');

            this.createFilename(picurePath, imageType).then(filename => {

                jimp.read(Buffer.from(base64Data, 'base64'), (err, image) => {
                    if (err) {
                        return reject(err);
                    }
                    
                    image
                        .cover(400, 400, jimp.HORIZONTAL_ALIGN_CENTER | jimp.VERTICAL_ALIGN_MIDDLE)
                        .write(filename, (err) => {
                            if (err) {
                                return reject(err);
                            }

                            resolve(filename.substring(filename.lastIndexOf("/") + 1));
                        });
                });

            });

        });
        
    }
    
};