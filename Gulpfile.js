/**
 * Gulpfile.js
 *
 * @author Villem Alango <villem.alango@gmail.com>
 * @created 26.06.15 23:44
 */

/* jshint node: true */

'use strict';

//  Directories we want to process ... jshint or otherwise
var SOURCES = ['.'];
//  Stuff we don't want to touch
var IGNORE = ['**/*.min.js', 'node_modules', 'reports',
  'examples/node/node_modules'];
//  jshint options file name
var HINTRC = '.jshintrc';

var gulp     = require('gulp')
  , GJC      = require('gulp-jsx-coverage')
  , path     = require('path')
  , ignorer  = require('gulp-ignore')
  , jshint   = require('gulp-jshint')
  , jasmine  = require('gulp-jasmine')
  , stylish  = require('jshint-stylish')
  , rename   = require('gulp-rename')
  , uglify   = require('gulp-uglify')
    /* globals console: false  */
  , debug    = console.log.bind(console, '#')
  ;
var sep        = path.sep
  , basePath   = __dirname
  , allJs      = ['**', '*.js'].join(sep)
  , ruleLength = HINTRC.length
  , sources, rules, excludes
  ;

/**
 * Create an array of absolute paths combined with filename
 * @param {Array<string>} directories
 * @param {string} filename
 * @returns {Array<string>}
 */
var compose = function (directories, filename) {
  return directories.map(function (p) {
    var r = [basePath, p];

    /\.js$/.test(p) || r.push(filename);
    r = path.normalize(r.join(sep));
    return r;
  });
};

//  Initialize the paths
sources = compose(SOURCES, allJs);
rules = compose(SOURCES, '**' + sep + HINTRC);
excludes = compose(IGNORE, allJs);

// JSHINT
// @link(https://www.npmjs.com/package/gulp-jshint)
// @link(http://jshint.com/docs/)
// NB: unless `lookup` option is set to false,
// linter will search for ".jshintrc" in the file's directory and then
// climb upwards.

function hinter(fspec, opt_options) {
  return gulp.src(fspec)
    .pipe(ignorer.exclude(excludes))
    .pipe(jshint(opt_options))
    .pipe(jshint.reporter(stylish));
}

// ==================  Tasks  ===================

/*
 Watch for source file changes.
 NB: this does not detect new file creation!
 */
gulp.task('watch', function () {
  //debug('=== watch ===');
  gulp.watch(sources, function (ev) {
    if (ev.type !== 'deleted') {
      debug('watch:', ev.path);
      hinter(ev.path);
    }
  });
});

/*
 When .jshintrc file is changed, run jshint for affected directories.
 */
gulp.task('hint-watch', function () {
  //debug('=== hint-watch ===');
  gulp.watch(rules, function (ev) {
    var p = ev.path;
    p = p.substr(0, p.length - ruleLength) + allJs;
    debug('hwatch:', p);
    hinter(p);
  });
});

/*
 Run-once jshint task.
 */
gulp.task('hint', function () {
  hinter(sources);
});

gulp.task('test', function () {
  var GJCoptions = {
    istanbul: {
      coverageVariable: '__MY_TEST_COVERAGE__', // skipping this result in exception
      includeUntested:  true,
      exclude:          /node_modules|tests/
    },
    coverage: {
      reporters: ['lcov'],
      directory: 'reports/coverage-node'
    }
  };
  var jasmineOptions = {verbose: true};
  GJC.initIstanbulHook(GJCoptions); // Refer to previous gulp-jsx-coverage options

  return gulp.src('tests/**/*Spec.js')
    .pipe(jasmine(jasmineOptions))
    .on('end', GJC.colloectIstanbulCoverage(GJCoptions));
});

gulp.task('compress', function () {
  // @link(https://github.com/sindresorhus/gulp-jasmine)
  // options: verbose:false, includeStackTrace:false, reporter: obj/array
  return gulp.src('./lib/eventist.js')
    .pipe(uglify(/*{preserveComments:'some'}*/))
    .pipe(rename('eventist.min.js'))
    .pipe(gulp.dest('./lib'));
});

// Define the default task as a sequence of the above tasks
gulp.task('default', ['hint', 'watch', 'hint-watch']);
