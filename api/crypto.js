const nodeCrypto = require('crypto');

const crypto = {
    algorithm: 'aes-256-ctr',
    privateKey: '64LxK9m5DfjYOh3Y',
    decrypt: function (password) {
        var decipher = nodeCrypto.createDecipher(this.algorithm, this.privateKey);
        var dec = decipher.update(password, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    },
    encrypt: function (password) {
        var cipher = nodeCrypto.createCipher(this.algorithm, this.privateKey);
        var crypted = cipher.update(password, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    }
};


module.exports = crypto;