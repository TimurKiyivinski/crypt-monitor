module.exports = {
  seconds: val => val * 1000,
  pointArr: (size, filler) => Array(size).fill(filler),
  flatten: arr => [].concat(...arr)
}
