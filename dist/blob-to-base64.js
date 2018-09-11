(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.blobToBase64 = factory());
}(this, (function () { 'use strict';

/* globals Blob */
'use strict';
var toString = Object.prototype.toString;

var isBlob = function (x) {
	return x instanceof Blob || toString.call(x) === '[object Blob]';
};

function blobToBase64 (blob, cb) {
  if (!window.FileReader) {
    cb(new Error('no fileReader object available'));
  }

  if (!isBlob(blob)) {
    cb(new Error('provided argument is not blob'));
  }

  var reader = new window.FileReader();
  reader.readAsDataURL(blob);

  reader.onloadend = function () {
    cb(null, reader.result);
  };
}

return blobToBase64;

})));
