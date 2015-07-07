/**
 *  Karma main file
 *  configures Require.js
 *  @link(http://karma-runner.github.io/0.12/plus/requirejs.html)
 */

/* jshint sub: true, strict: false */
/* globals window: false, require: false */

var allTestFiles = [];
var TEST_REGEXP = /\/tests\/.+Spec\.js$/;
var paths = {};

//  Path normalization might be a good idea in future, but not now.
var pathToModule = function (path) {
  return path;
};

Object.keys(window.__karma__.files).forEach(function (file) {
  var mod;
  if (file && TEST_REGEXP.test(file)) {
    // Normalize paths to RequireJS module names.
    allTestFiles.push(mod = pathToModule(file));
    //console.log(file, '->', mod);
  }
});

require.config({
  // It makes sense to keep the same relative paths as in app code.
  baseUrl: '/base',

  paths: paths,

  // dynamically load all test files
  deps: allTestFiles,

  // we have to kickoff jasmine, as it is asynchronous
  callback: window.__karma__.start
});
