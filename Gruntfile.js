module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            src: ['dist','app/css/app.css','app/css/app.css.map']
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
            src: ['app/js/','test/e2e/','test/unit/']
        },
        sass: {
            dist: {                            // Target
                options: {                       // Target options
                    style: 'expanded',
                    noCache: true
                },
                files: {                         // Dictionary of files
                    'app/css/app.css': 'app/css/app.scss'       // 'destination': 'source'
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-connect');

    // Default task(s).
    grunt.registerTask('default', ['uglify']);

    // Server tasks
    grunt.registerTask('server', ['connect','clean']);

};