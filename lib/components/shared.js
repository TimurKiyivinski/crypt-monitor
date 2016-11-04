module.exports = {
  seconds: val => val * 1000,
  pointArr: (size, filler) => Array(size).fill(filler),
  filterMap: (map, filter) => {
    const data = {}
    filter.map(key => {
      data[key] = map[key]
    })
    return data
  },
  flatten: arr => [].concat(...arr),
  flattenMap: (map) => {
    return Object.keys(map)
      .map(key => map[key])
  },
  mergeMap: (a, b) => {
    const c = {}
    Object.keys(a).map(key => c[key] = a[key])
    Object.keys(b).map(key => c[key] = b[key])
    return c
  },
  jsonThen: (data, callback, failCallback) => {
    try {
      const json = JSON.parse(data)
      callback(json)
    } catch (e) {
      if (typeof (failCallback) === 'function') {
        failCallback(e)
      } else {
        console.log(e)
      }
    }
  }
}
