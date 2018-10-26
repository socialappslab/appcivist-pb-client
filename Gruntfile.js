module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n',
        mangle: false,
        compress: {
          drop_console: true
        }
      },
      build: {
        src: 'app/js/app.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      },
      dist: {
        files: {
          './dist/scripts/app.js': ['./dist/scripts/app.js'],
          './dist/scripts/ui.js': ['./dist/scripts/ui.js']
        }
      }
    },
    jshint: {
      src: ['app/js/', 'test/e2e/', 'test/unit/']
    },
    sass: {
      dist: { // Target
        options: { // Target options
          style: 'expanded',
          noCache: true
        },
        files: { // Dictionary of files
          'app/css/app.css': 'stylesheets/main.scss', // 'destination': 'source'
          'app/css/app.v2.css': 'app/v2/stylesheets/main.scss',
          'app/css/common.css': 'app/v2/stylesheets/common.scss'
        }
      }
    },
    haml: {
      dist: {
        files: [{
          expand: true,
          cwd: "app/views",
          src: '**/*.haml',
          dest: 'public',


          ext: '.html'
        }]
      }
    },
    connect: {
      server: {
        options: {
          port: 8000
        }
      }
    },
    watch: {
      options: { livereload: true },
      html: {
        files: ["index.html"]
      },
      js: {
        files: ["app/*.js", "app/**/*.js", "app/v2/**/*.js"],
        tasks: ['babel']
      },
      sass: {
        files: ['**/*.scss'],
        tasks: ['sass'],
      },
      haml: {
        files: ['app/views/**/*.haml'],
        tasks: ['haml']
      },
      css: {
        files: ['app/css/app.css'],
        tasks: []
      }
    },
    clean: {
      src: [
        'dist/*', 'app/css/app.css', 'app/css/app.css.map',
        'app/css/app.v2.css', 'app/css/app.v2.css.map',
        'app/css/common.css', 'app/fonts/*'
      ],
      dist: {
        files: [{
          dot: true,
          src: ['.tmp', './dist/*']
        }]
      }
    },
    htmlmin: {
      dist: {
        options: {},
        files: [{
          expand: true,
          cwd: './dist',
          src: '{,*/}*.html',
          dest: './dist'
        }]
      },
    },
    useminPrepare: {
      html: './index.html',
      options: {
        dest: './dist/',
        flow: {
          steps: {
            js: ['concat'],
            css: ['cssmin']
          },
          post: []
        }
      }
    },
    usemin: {
      html: ['./dist/**/*.html'],
      css: ['./dist/styles/**/*.css'],
      options: {
        dirs: ['./dist']
      }
    },
    cssmin: {
      options: {
        keepSpecialComments: '0'
      },
      dist: {
        files: [{
          cwd: './dist',
          expand: true,
          src: '**/*.css',
          dest: './dist/'
        }]
      }
    },
    concat: {
      options: {
        separator: grunt.util.linefeed + ';' + grunt.util.linefeed
      },
      dist: {}
    },
    copy: {
      dev: {
        files: [{
          expand: true,
          dot: true,
          cwd: './node_modules/bootstrap-sass/assets/fonts/bootstrap/',
          dest: './app/fonts/bootstrap/',
          src: [
            '**/*',
          ]
        }]
      },
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '.',
          dest: './dist/',
          src: [
            'favicon.ico',
            'assets/**/*',
            'index.html',
            'app/**/*.html',
            'bower_components/vex/dist/css/vex.css',
            'bower_components/vex/dist/css/vex-theme-plain.css',
            'bower_components/appcivist-patterns/dist/css/**/*',
            'bower_components/appcivist-patterns/dist/fonts/**/*',
            'bower_components/appcivist-patterns/dist/images/**/*',
            'bower_components/ng-notify/dist/ng-notify.min.css',
            'bower_components/github-fork-ribbon-css/gh-fork-ribbon.css',
            'bower_components/github-fork-ribbon-css/gh-fork-ribbon.ie.css',
            'bower_components/tinymce/plugins/**/*',
            'bower_components/tinymce/themes/**/*',
            'stylesheets/**/*',
            'app/css/app.css',
            'app/css/app.v2.css',
            'app/css/common.css',
            'bower_components/angular-i18n/**/*.js'
          ]
        }, {
          expand: true,
          dot: true,
          cwd: './node_modules/bootstrap-sass/assets/fonts/bootstrap/',
          dest: './app/fonts/bootstrap/',
          src: [
            '**/*',
          ]
        }, {
          expand: true,
          dot: true,
          cwd: './stylesheets/font',
          dest: './dist/font/',
          src: [
            '**/*',
          ]
        }, {
          expand: true,
          dot: true,
          cwd: './bower_components/appcivist-patterns/dist/fonts',
          dest: './dist/fonts/',
          src: [
            '**/*',
          ]
        }, {
          expand: true,
          dot: true,
          cwd: './app/fonts/bootstrap',
          dest: './dist/fonts/',
          src: [
            '**/*',
          ]
        }, {
          cwd: './bower_components/tinymce/',
          src: ['plugins/**', 'themes/**',
            'skins/**'],
          dest: './dist/scripts',
          filter: 'isFile',
          expand: true
        }, {
          expand: true,
          dot: true,
          cwd: './bower_components/appcivist-patterns/dist/images',
          dest: './dist/images/',
          src: [
            '**/*',
          ]
        }, {
          cwd: './bower_components/raven-js/',
          src: ['dist/**', 'dist/plugins/**'],
          dest: './dist/scripts',
          filter: 'isFile',
          expand: true
        }]
      }
    },

    jsdoc: {
      dist: {
        src: ['app/v2/**/*.js', 'app/app.js', 'app/services/**/*.js', 'app/env.js', 'README.md'],
        options: {
          destination: 'docs',
          plugins: [
            'plugins/markdown'
          ]
        }
      }
    },

    babel: {
      options: {
        sourceMap: true,
        presets: ['es2015']
      },
      dist: {
        files: [{
          expand: true,
          cwd: '.',
          src: ['app/env.js', 'app/**/*.js', 'app/v2/components/**/*.js'],
          dest: 'dist'
        }]
      }
    }
  });

  // Default task(s).
  grunt.registerTask('default', ['uglify', 'haml']);
  grunt.registerTask('build', [
    'clean:dist', 'sass', 'babel:dist', 'useminPrepare', 'copy:dist', 'cssmin', 'concat', 'usemin', 'uglify:dist'
  ]);

  // Server tasks
  grunt.registerTask('server', ['clean', 'copy:dev', 'sass', 'babel:dist', 'uglify:build', 'jshint', 'haml', 'connect', 'watch']);
};
