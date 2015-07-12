/**
 * Gulpfile.js
 *
 * @author Villem Alango <villem.alango@gmail.com>
 */

/* jshint node: true */

'use strict';

//  jshint options file name
var HINTRC  = '.jshintrc'
  , JSFILES = '**/*.js'
  , RED     = '\u001B[31m'  // ANSI escape code
  ;
/* globals console: false  */
var debug = console.log.bind(console, '#');

var gulp = require('gulp')
  , path = require('path')
  ;
var basePath   = __dirname
  , ruleLength = HINTRC.length
  , exclusions = ['!**/*.min.js', '!node_modules/**/*.js', '!reports/**/*.js',
      '!examples/node/node_modules/**/*.js']
  , testsDir   = basePath + '/tests/lib/'
  , srcDir     = basePath + '/lib/'
  ;

var only = function (p) {
  var def = exclusions.slice();
  def.unshift(p);
  return def;
};

// JSHINT
// @link(https://www.npmjs.com/package/gulp-jshint)
// @link(http://jshint.com/docs/)
// NB: unless `lookup` option is set to false,
// linter will search for ".jshintrc" in the file's directory and then
// climb upwards.

function hinter(fspec, opt_options) {
  var jshint  = require('gulp-jshint')
    , stylish = require('jshint-stylish')
    ;
  return gulp.src(fspec)
    .pipe(jshint(opt_options))
    .pipe(jshint.reporter(stylish));
}

var tester = function (spec) {
  var GJC            = require('gulp-jsx-coverage')
    , jasmine        = require('gulp-jasmine')
    , GJCoptions     = {
        istanbul: {
          coverageVariable: '__MY_TEST_COVERAGE__', // skiping this result in exception
          includeUntested:  true,
          exclude:          /node_modules|tests/
        },
        coverage: {
          reporters: ['lcov'],
          directory: 'reports/coverage/node'
        }
      }
    , jasmineOptions = {verbose: true, includeStackTrace: true}
    ;
  GJC.initIstanbulHook(GJCoptions);

  return gulp.src(spec)
    .pipe(jasmine(jasmineOptions))
    .on('end', GJC.colloectIstanbulCoverage(GJCoptions));
};

var watcher = function (hint, test) {
  gulp.watch(only(JSFILES), function (ev) {
    var p0, p;
    if (ev.type !== 'deleted') {
      p0 = ev.path;
      if (test) {
        if (p0.indexOf(srcDir) === 0) {
          p = testsDir + path.basename(p0, '.js') + 'Spec.js';
        } else if (p0.indexOf(testsDir) === 0) {
          p = p0;
        }
        p && tester(p);
      }
      hint && hinter(p0);
    }
  });
  // TODO solve the issue#1
  test && debug(RED + 'NB: Use of Karma test runner is recommended, ' +
    'see issue#1 at https://github.com/valango/eventist/ !');
};

// ==================  Tasks  ===================

/*
 Watch for source file changes.
 NB: this does not detect new file creation!
 */
gulp.task('watch', function () {
  watcher(true, true);
});

gulp.task('watch-hint', function () {
  watcher(true, false);
});

gulp.task('watch-test', function () {
  watcher(false, true);
});

/*
 When .jshintrc file is changed, run jshint for affected directories.
 */
gulp.task('hint-watch', function () {
  gulp.watch('**/.jshintrc', function (ev) {
    var p = ev.path;
    p = p.substr(0, p.length - ruleLength) + JSFILES;
    debug('hwatch:', p);
    hinter(only(p));
  });
});

/*
 Run-once jshint task.
 */
gulp.task('hint', function () {
  hinter(only('**/*.js'));
});

gulp.task('test', function () {
  return tester('tests/**/*Spec.js');
});

gulp.task('compress', function () {
  // @link(https://github.com/sindresorhus/gulp-jasmine)
  // options: verbose:false, includeStackTrace:false, reporter: obj/array
  var rename = require('gulp-rename')
    , uglify = require('gulp-uglify')
    ;
  return gulp.src('./lib/eventist.js')
    .pipe(uglify({preserveComments: 'some'}))
    .pipe(rename('eventist.min.js'))
    .pipe(gulp.dest('./lib'));
});

// Define the default task as a sequence of the above tasks
gulp.task('default', ['test', 'hint', 'watch-hint', 'hint-watch']);
