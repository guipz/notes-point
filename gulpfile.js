var gulp = require('gulp');
var sass = require('gulp-sass')(require('sass'));

const path = 'notes_point/website/static/website/css/custom/*.scss';

gulp.task('sass', function(cb) {
  gulp
    .src(path)
    .pipe(sass().on('error', sass.logError))
    .pipe(
      gulp.dest(function(f) {
        return f.base;
      })
    );
  cb();
});

gulp.task(
  'default',
  gulp.series('sass', function(cb) {
    gulp.watch(path, gulp.series('sass'));
    cb();
  })
);