const Formidable = require('formidable');
const Promise = require('bluebird');

class Parser {
  static parse(request) {
    return new Promise(function(resolve, reject) {
      let formidable = new Formidable.IncomingForm();
      formidable.parse(request, function(err, fields, files) {
        if(err) {
          reject(err);
        } else {
          resolve({fields, files});
        }
      });
    });
  }
}

module.exports = Parser;
