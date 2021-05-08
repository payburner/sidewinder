const fs = require('fs');

export default class FileUtil {

    constructor( ) {

    }

    parseFile( path ) {
        return new Promise(function(resolve, reject) {
            var s = fs.createReadStream( path );
            var lines = '';
            s.on('data', function (buf) {
                lines += buf.toString();
            });
            s.on('end', function () {
                resolve(JSON.parse(lines));
            });
        });
    }

    readFile( path ) {
        return new Promise(function(resolve, reject) {
            var s = fs.createReadStream( path );
            var lines = '';
            s.on('data', function (buf) {
                lines += buf.toString();
            });
            s.on('end', function () {
                resolve(  lines );
            });
        });
    }
}