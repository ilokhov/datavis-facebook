var gulp  = require('gulp'),
    connect = require('gulp-connect'),
    minifyCSS = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    autoprefixer  = require('gulp-autoprefixer'),
    useref = require('gulp-useref'),
    uglify = require('gulp-uglify'),
    gulpIf = require('gulp-if'),
    babel = require('gulp-babel'),
    del = require('del');

var paths = {
  src: 'src',
  dist: 'dist'
};

gulp.task('js', function() {
  del.sync(paths.dist + '/js/*');

  return gulp.src(paths.src + '/index.html')
    .pipe(useref())
    .pipe(gulpIf('**/script.min.js', babel({
      presets: ['es2015']
    })))
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulp.dest(paths.dist))
    .pipe(connect.reload());
});

gulp.task('css', function() {
  del.sync(paths.dist + '/css');
  return gulp.src(paths.src + '/css/**/*.css')
    .pipe(autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(minifyCSS())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(paths.dist + '/css'))
    .pipe(connect.reload());
});

gulp.task('data', function() {
  del.sync(paths.dist + '/data');
  return gulp.src(paths.src + '/data/**')
    .pipe(gulp.dest(paths.dist + '/data'))
    .pipe(connect.reload());
});

gulp.task('img', function() {
  del.sync(paths.dist + '/img');
  return gulp.src(paths.src + '/img/**')
    .pipe(gulp.dest(paths.dist + '/img'))
    .pipe(connect.reload());
});

gulp.task('connect', function() {
  connect.server({
    port: 8888,
    root: [paths.dist],
    livereload: true
  });
});

gulp.task('watch', function() {
  gulp.watch([paths.src + '/index.html', paths.src + '/js/**/*.js'], ['js']);
  gulp.watch(paths.src + '/css/**/*.css', ['css']);
  gulp.watch(paths.src + '/data/**', ['data']);
  gulp.watch(paths.src + '/img/**', ['img']);
});

gulp.task('start', ['connect', 'watch']);

gulp.task('default', function() {
  gulp.start('start');
});