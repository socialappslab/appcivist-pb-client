module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'app/js/app.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    jshint: {
      src: ['app/js/', 'test/e2e/', 'test/unit/']
    },
    sass: {
      dist: {                            // Target
        options: {                       // Target options
          style: 'expanded',
          noCache: true
        },
        files: {                         // Dictionary of files
          'app/css/app.css': 'stylesheets/main.scss'       // 'destination': 'source'
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
        options: { port: 8000 }
      }
    },
    watch: {
      options: { livereload: true },
      html: {
        files: ["index.html"]
      },
      js: {
        files: ["app/*.js", "app/**/*.js"]
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
      src: ['dist', 'app/css/app.css', 'app/css/app.css.map'],
      dist: {
        files: [
          {
            dot: true,
            src: ['.tmp', './dist/*']
          }
        ]
      },
      server: '.tmp'
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
    uglify: {
      options: {
        mangle: false,
        compress: {
          drop_console: true
        }
      },
      dist: {
        files: {
          './dist/scripts/app.js': ['./dist/scripts/app.js'],
          './dist/scripts/ui.js': ['./dist/scripts/ui.js']
        }

      }
    },
    copy: {
      dist: {
        files: [
          {
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
              'bower_components/appcivist-patterns/dist/{css,fonts,images}/**/*',
              'bower_components/ng-notify/dist/ng-notify.min.css',
              'bower_components/appcivist-patterns/dist/images/file-icon.png',
              'stylesheets/**/*',
              'app/css/app.css'
            ]
          }
        ]
      }
    }
  });

  // Default task(s).
  grunt.registerTask('default', ['uglify', 'haml']);
  grunt.registerTask('build', [
    'clean:dist', 'sass', 'useminPrepare', 'copy:dist', 'cssmin', 'concat', 'uglify', 'usemin'
  ]);

  // Server tasks
  grunt.registerTask('server', ['clean', 'sass', 'uglify', 'jshint', 'haml', 'connect', 'watch']);
};
