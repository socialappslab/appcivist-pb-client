module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      src: ['dist', 'app/css/app.css', 'app/css/app.css.map']
    },
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
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-haml');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-exec');

  // Default task(s).
  grunt.registerTask('default', ['uglify', "haml"]);

  // Server tasks
  grunt.registerTask('server', ['clean', 'sass', 'uglify', 'jshint', 'haml', 'connect', 'watch']);
};
