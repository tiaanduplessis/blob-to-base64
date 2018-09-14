import isBlob from 'is-blob';

function blobToBase64 (blob, cb) {
  if (!window.FileReader) {
    cb(new Error('no fileReader object available'));
  }

  if (!isBlob(blob)) {
    cb(new Error('provided argument is not blob'));
  }

  var reader = new window.FileReader();
  
  reader.onloadend = function () {
    cb(null, reader.result);
  };
  
  reader.readAsDataURL(blob);
}

export default blobToBase64;
