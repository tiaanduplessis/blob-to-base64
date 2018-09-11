import isBlob from 'is-blob'

function blobToBase64 (blob, cb) {
  if (!window.FileReader) {
    cb(new Error('no fileReader object available'))
  }

  if (!isBlob(blob)) {
    cb(new Error('provided argument is not blob'))
  }

  const reader = new window.FileReader()
  reader.readAsDataURL(blob)

  reader.onloadend = function () {
    cb(null, reader.result)
  }
}

export default blobToBase64
