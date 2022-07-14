module.exports = function (grunt) {
    const through = require('through2')
    const sass = require('sass')
    require('load-grunt-tasks')(grunt)
    grunt.loadNpmTasks('grunt-execute')
    grunt.loadNpmTasks('grunt-contrib-copy')

    const platform = grunt.option('platform')
    const buildPath = `build/${platform}`

    const baseFileMap = {
        ui: {
            '<%= dirs.public.js %>/base.js': ['<%= dirs.src.js %>/ui/base/index.es6.js']
        },
        sass: {
            '<%= dirs.public.css %>/base.css': ['<%= dirs.src.scss %>/base/base.scss'],
            '<%= dirs.public.css %>/popup.css': ['<%= dirs.src.scss %>/popup.scss']
        }
    }

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        dirs: {
            cache: '.cache',
            src: {
                js: 'shared/js',
                scss: 'shared/scss'
            },
            data: 'shared/data',
            public: {
                js: `${buildPath}/public/js`,
                css: `${buildPath}/public/css`
            }
        },

        browserify: {
            options: {
                transform: [
                    ['babelify'],
                    [(file) => {
                        return through(function (buf, enc, next) {
                            this.push(buf.toString('utf8').replace(/\$ENVIRONMENT/g, platform))
                            next()
                        })
                    }]
                ]
            },
            ui: {
                files: baseFileMap.ui
            }
        },

        sass: {
            options: {
                implementation: sass
            },
            dist: {
                files: baseFileMap.sass
            }
        },

        copy: {
            html: {
                expand: true,
                cwd: 'shared',
                src: 'html/**',
                dest: `${buildPath}/`,
                options: {
                    process: (content) => content.replace(/\$ENVIRONMENT/g, platform)
                }
            },
            images: {
                expand: true,
                cwd: 'shared',
                src: 'img/**',
                dest: `${buildPath}/`
            }

        }
    })

    grunt.registerTask('build', 'Build project(s)css, templates, js', ['sass', 'browserify:ui', 'copy:html', 'copy:images'])
    grunt.registerTask('default', 'build')
}
