/**
 * Gulpfile.js
 *
 * @author Villem Alango <villem.alango@gmail.com>
 */

/* eslint no-console:0  */
/* globals __dirname */

'use strict';

var JS     = '*.js', S = '**';
//  Directories we want to process ... eslint or otherwise
var JSDIRS = ['lib', 'tests'];
//  eslint rule file name
var LRULES = '.eslintrc';

var lintOptions = {useEslintrc: true};

var gulp    = require('gulp')
  , path    = require('path')
  , log     = console.log.bind(console, '#')
  , runners = []
  , sep     = path.sep
  , homeDir = __dirname
  , allJs   = [S, JS].join(sep)
  ;

var linter;

var jsPaths = JSDIRS.map(function js(p) {
  return [homeDir, p, allJs].join(sep);
}).concat(homeDir + sep + JS);

function runLinter(fspec) {
  return gulp.src(fspec)
             .pipe(linter(lintOptions))
             .pipe(linter.formatEach());
}

function watchSourcesFor(runner) {

  if (runners.push(runner) === 1) {
    //  Run gulp.watch only on the 1-st call.
    gulp.watch(jsPaths, function b(ev) {
      var fn, i;

      if (ev.type !== 'deleted') {
        log('changed:', ev.path); // Give user a hint we've reacted.

        for (i = 0; (fn = runners[i]) !== undefined; i += 1) {
          console.log(ev.path);
          fn(ev.path);
        }
      }
    });
  }
}

function watchRulefiles(name, runner) {

  var rulePaths = JSDIRS.map(function ru(p) {
    return [homeDir, p, '**', name].join(sep);
  }).concat([homeDir, name].join(sep));

  gulp.watch(rulePaths, function d(ev) {
    var p = ev.path;
    p     = p.substr(0, p.length - name.length - 1);
    log('changed:' + name, p);
    runner(p === homeDir ? jsPaths : p + sep + allJs);
  });
}

function tester(spec) {
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

  GJC.initModuleLoaderHack(GJCoptions);

  return gulp.src(spec)
             .pipe(jasmine(jasmineOptions))
             .on('end', GJC.collectIstanbulCoverage(GJCoptions));
}

// ==================  Tasks  ===================

function runAndWatch(runner, rules) {

  jsPaths.forEach(function f(p) {
    runner(p);
  });
  watchSourcesFor(runner);
  watchRulefiles(rules, runner);
}

/*
 * Linter task.
 */
gulp.task('lint', function e() {
  linter = require('gulp-eslint');
  runAndWatch(runLinter, LRULES);
});

gulp.task('test', function t() {
  return tester('tests/**/*Spec.js');
});

gulp.task('build', function t() {
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
gulp.task('default', ['test', 'lint']);
