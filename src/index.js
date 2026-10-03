import isBlob from 'is-blob'

function blobToBase64 (blob, cb) {
  if (typeof window === 'undefined' || typeof window.FileReader !== 'function') {
    return cb(new Error('no fileReader object available'))
  }

  if (!isBlob(blob)) {
    return cb(new Error('provided argument is not blob'))
  }

  let reader
  let finished = false

  function done (error, result) {
    if (finished) return
    finished = true
    cb(error, result)
  }

  try {
    reader = new window.FileReader()

    reader.onloadend = function () {
      done(reader.error || null, reader.result)
    }
    reader.onerror = function () {
      done(reader.error || new Error('failed to read blob'))
    }
    reader.onabort = function () {
      done(new Error('blob reading aborted'))
    }

    reader.readAsDataURL(blob)
  } catch (error) {
    // A synchronous reader can invoke the callback during readAsDataURL.
    if (finished) throw error
    done(error)
  }
}

export default blobToBase64
