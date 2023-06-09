const { src, dest, watch, series, parallel } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const concat = require("gulp-concat");
const terser = require("gulp-terser");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const replace = require("gulp-replace");
const browsersync = require("browser-sync").create();
// dest() được sử dụng để chỉ dẫn đến thư mục đích
// src() được sử dụng chỉ định các tệp cần chạy gulp
// watch() theo dõi sự thay đổi và chạy tệp khi có sự thay đổi đó
// series() được sự dụng để chạy các tác vụ một cách có tuần tự
// parallel() được sự dụng để chạy các tác vụ 1 cách đồng thời
// gulp-concat: sử dụng để nối nhiều tệp thành 1 tệp duy nhất
// gulp-terser: sự dụng để nén tệp js
// autoprefixer - gulp-postcss - cssnano: được sử dụng để xử lý css bằng PostCSS
// gulp-replace: tìm kiếm và thay thế nội dung trong các file - (tránh cache trên trình duyệt)
// browser-sync: cung cấp khả năng tự động reload web khi mã nguồi thay đổi

const files = {
  scssPath: "src/scss/**/*.scss",
  jsPath: "src/js/**/*.js",
};

// Sass task: compiles the style.scss file into style.css
function scssTask() {
  return src(files.scssPath, { sourcemaps: true }) // set source and turn on sourcemaps
    .pipe(sass()) // compile SCSS to CSS
    .pipe(postcss([autoprefixer(), cssnano()])) // PostCSS plugins
    .pipe(dest("dist", { sourcemaps: "." })); // put final CSS in dist folder with sourcemap
}
// JS task: concatenates and uglifies JS files to script.js
function jsTask() {
  return src(
    [
      files.jsPath,
      //,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
    ],
    { sourcemaps: true }
  )
    .pipe(concat("main.js"))
    .pipe(terser())
    .pipe(dest("dist", { sourcemaps: "." }));
}
// Cachebust
function cacheBustTask() {
  var cbString = new Date().getTime();
  return src(["index.html"])
    .pipe(replace(/cb=\d+/g, "cb=" + cbString))
    .pipe(dest("."));
}
// Browsersync to spin up a local server
function browserSyncServe(cb) {
  // initializes browsersync server
  browsersync.init({
    server: {
      baseDir: ".",
    },
    notify: {
      styles: {
        top: "auto",
        bottom: "0",
      },
    },
  });
  cb();
}
function browserSyncReload(cb) {
  // reloads browsersync server
  browsersync.reload();
  cb();
}
// Watch task: watch SCSS and JS files for changes
// If any change, run scss and js tasks simultaneously
function watchTask() {
  watch(
    [files.scssPath, files.jsPath],
    { interval: 1000, usePolling: true }, //Makes docker work
    series(parallel(scssTask, jsTask), cacheBustTask)
  );
}

// Browsersync Watch task
// Watch HTML file for change and reload browsersync server
// watch SCSS and JS files for changes, run scss and js tasks simultaneously and update browsersync
function bsWatchTask() {
  watch("index.html", browserSyncReload);
  watch(
    [files.scssPath, files.jsPath],
    { interval: 1000, usePolling: true }, //Makes docker work
    series(parallel(scssTask, jsTask), cacheBustTask, browserSyncReload)
  );
}

// Export the default Gulp task so it can be run
// Runs the scss and js tasks simultaneously
// then runs cacheBust, then watch task
exports.default = series(parallel(scssTask, jsTask), cacheBustTask, watchTask);

// Runs all of the above but also spins up a local Browsersync server
// Run by typing in "gulp bs" on the command line
exports.bs = series(
  parallel(scssTask, jsTask),
  cacheBustTask,
  browserSyncServe,
  bsWatchTask
);
