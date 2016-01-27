#!/usr/bin/env node

var spawn = require('child_process').spawn;

exports.rtmp = function() {
  var child = null;
  /**
   * Download a rtmp video.
   * @param  {object} config {
        src: Video Url,
        target: Path to Save the Video,
        onProgress: function (data) {
        },
        onExit: function (data) {
        },
        onError: function (error) {
        }
      }
   * @return {[type]}        [description]
   */
  var download = function(config) {

    child = spawn('rtmpdump', ['-r', config.src, '-o', config.target]);


    // Match something like
    // 33733.764 kB / 597.76 sec (99.9%)
    var dataRegex = /(\d+\.\d+).kB.\/.(\d+\.\d+).sec/m;

    //Did an Error occur?
    var error = /ERROR/i;

    //Has the download completed?
    var complete = /Download.complete/i;

    child.stderr.on('data', function(data) {
      //onProgress
      if (dataRegex.test(data)) {
        if (typeof config.onProgress === 'function') {
          config.onProgress(getData(data));
        }
      }

      if (error.test(data)) {
        if (typeof config.onError === 'function') {
          config.onError(data);
        }
      }

      if (complete.test(data)) {
        if (typeof config.onExit === 'function') {
          var info = getData(data);
          if (info && info.hasOwnProperty('percent')) {
            delete info.percent;
          }
          config.onExit(info);
        }
      }
    });

    function stop() {
      if (child) {
        child.kill();
      }
    }

    /**
     * Extracts the information out of a rtmp dump line.
     * @param  {string} data One Line of rtmp dump output.
     * It looks like: 33733.764 kB / 597.76 sec (99.9%)
     * @return {object} {
          kbLoaded: kbLoaded,
          secondsLoaded: secondsLoaded,
          percent: percent
        }
     */
    function getData(data) {

      var result = dataRegex.exec(data),
        kbLoaded, secondsLoaded, percent, info = null;

      if (Array.isArray(result) && result.length > 2) {
        kbLoaded = parseFloat(result[1]);
        secondsLoaded = parseFloat(result[2]);
        info = {
          kbLoaded: kbLoaded,
          secondsLoaded: secondsLoaded
        };
      }

      return info;
    }

  }

  return {
    download: download,
    stop: stop
  }

}
