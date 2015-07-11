// Karma configuration
// Generated on Wed Apr 29 2015 21:24:37 GMT+0300 (EEST)
// @link(https://github.com/karma-runner/karma-coverage)

/* jshint node: true */
module.exports = function (config) {

  'use strict';

  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // list of files / patterns to load in the browser
    files: [
      {pattern: 'lib/**/*.js', included: false},
      {pattern: 'tests/**/*Spec.js', included: false},
      'tests/test-main.js'
    ],

    // list of files to exclude
    exclude: [],

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'requirejs'],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {'lib/**/*.js': ['coverage']},

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    coverageReporter: {
      /*instrumenterOptions: {
       istanbul: { noCompact: true }
       },*/
      dir:       'reports/coverage-browser',
      reporters: [
        // Empty subdir forces each browser to create it's own.
        {type: 'html', subdir: ''},
        {type: 'lcov', subdir: '.'}
      ]
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'/*, 'Firefox'*/],
    //browsers: ['PhantomJS'],

    phantomjsLauncher: {
      // Have PhantomJS exit if a ResourceError is encountered (useful if karma exits without killing phantom)
      exitOnResourceError: true
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
