module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

    clean: ["dist", ".build"],

    copy: {
      statics: {
        cwd: 'src',
        expand: true,
        src: ['img/*', 'partials/*'],
        dest: 'dist'
      },
      meta: {
        expand: true,
        src: [ 'plugin.json', 'README.md' ],
        dest: 'dist'
      }
    },

    watch: {
      all: {
        files: ['src/**/*', 'test/*.js', 'plugin.json'],
        tasks: ['default'],
        options: {spawn: false}
      }
    },

    babel: {
      options: {
        sourceMap: true,
        presets:  ['es2015']
      },
      dist: {
        options: {
          plugins: ['transform-es2015-modules-systemjs', 'transform-es2015-for-of']
        },
        files: [{
          cwd: 'src',
          expand: true,
          src: ['**/*.js'],
          dest: 'dist',
          ext:'.js'
        }]
      },
      test: {
        files: [{
          cwd: '.',
          expand: true,
          flatten: true,
          src: ['src/datasource.js', 'src/query.js', 'test/*.js'],
          dest: '.build/test',
          ext:'.js'
        }]
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          clearRequireCache: true
        },
        src: ['.build/test/*_spec.js']
      }
    }
  });

  grunt.registerTask('test', ['babel:test', 'mochaTest']);
  grunt.registerTask('build', ['copy:statics', 'copy:meta', 'test', 'babel:dist']);
  grunt.registerTask('default', ['clean', 'build']);
};
