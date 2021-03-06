var readline = require('readline')
var path = require('path')
var fs = require('fs')
var turf = require('@turf/turf')
var regionData = require('./region.js')
var config = require('./config')

var cityList = regionData.features.map(item => {
  var ft = turf.polygon(item)
  return ft
})

function main(inputFile, outputFile) {
  var readStm = fs.createReadStream(inputFile)
  var writStm = fs.createWriteStream(outputFile)
  var enableWrite = true
  readStm.on('end', ()=> {
    enableWrite = false
  })

  var lineIndex = 0
  var xIndex = 0
  var yIndex = 0
  var len = 0

  var readlineObj = readline.createInterface({
    input: readStm,
    crlfDelay: Infinity
  })

  readlineObj.on('line', (line) => {
    if (line) {
      var values = line.split(config.separate)
      if(lineIndex > 0) {
        if(values.length !== len) {
          console.log(values)
        }
        var x = parseFloat(values[xIndex])
        var y = parseFloat(values[yIndex])
        var code = joinCode(x, y)
        code = code.toString()
        writStm.write(line + ',' + code + '\n')
      } else {
        xIndex = values.indexOf(config.x)
        yIndex = values.indexOf(config.y)
        len = values.length
        if(xIndex < 0 || xIndex < 0) {
          console.log('未识别出x、y坐标列')
          console.log('csv文件需第一列应为列名')
          console.log('请指定csv文件的x坐标列名为lng,y坐标列名为lat，或您也可直接在config.js文件中自定义x、y坐标列的名称')
        }
        writStm.write(line + ',code\n')
      }
    }
    if (enableWrite) {
      lineIndex++
    }
  })
  
  readlineObj.on('close', ()=> {
    console.log('done...')
  })
}

function joinCode(x, y) {
  var point = turf.point([x, y])
  var code = ''
  cityList.forEach(city => {
    var coords = city.geometry.coordinates.geometry.coordinates
    var geo = turf.polygon(coords)
    var r = turf.booleanPointInPolygon(point, geo)
    if(r) {
      code = city.geometry.coordinates.properties.PAC
      return
    }
  })
  return code
}

var cmdList = [
  ['-f', '-f 文件名 '],
  ['-o', '-o 输出文件'],
  ['-c', '-c 114 21']
]

function getParams(argvs) {
  var cmdHeader = cmdList.filter(item => {
    console.log(argvs[0])
    console.log(item[0])
    return item[0] === argvs[0]
  })
  var cmdArg = argvs.slice(1)
  if(cmdHeader.length > 0) {
    return {
      cmd: cmdHeader[0],
      arg: cmdArg
    }
  } else {
    cmdHeader.forEach(item => {
      console.log(item)
    })
    return undefined
  }

  // if(cmd) {
  //   return {
  //     cmd: argvs[0],
  //     arg: argvs.slice(1)
  //   }
  // } else {
  //   cmdHeader.forEach(item => {
  //     console.log(item)
  //   })
  //   return undefined
  // }
}

function toFileTask(args) {
  var inPath = args
  if (!path.isAbsolute(args)) {
    inPath = path.join(__dirname, args)
  }
  var f = fs.statSync(inPath)
  if (f.isFile()) {
    var name = path.basename(inPath)
    var outPath = 'c_' + name
    outPath = path.join(path.dirname(inPath), outPath)
    main(inPath, outPath)
  }
}

function toSingleTask(cmd) {
  var x = parseInt(cmd.arg[0])
  var y = parseInt(cmd.arg[1])
  joinCode(x, y)
}
// var args = process.argv.splice(2)[0]
var cmdArgv = require("minimist")(process.argv.splice(2))

if (cmdArgv.c) {
  var x = cmdArgv.c
  var y = cmdArgv._[0]
  toSingleTask(x, y)
} else if(cmdArgv.f) {
  toFileTask(cmdArgv.f)
}


// if (args) {
//   console.log(args)
//   var inPath = args
//   if (!path.isAbsolute(args)) {
//     inPath = path.join(__dirname, args)
//   }
//   var f = fs.statSync(inPath)
//   if (f.isFile()) {
//     var name = path.basename(inPath)
//     var outPath = 'c_' + name
//     outPath = path.join(path.dirname(inPath), outPath)
//     main(inPath, outPath)
//   }
// }

// main('./testData/dm.csv', './testData/c_test.csv')