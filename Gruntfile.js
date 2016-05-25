module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({

    clean: ["dist"],

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
        files: ['src/**/*', 'plugin.json'],
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
      }
    }

    //mochaTest: {
    //  test: {
    //    options: {
    //      reporter: 'spec'
    //    },
    //    src: ['dist/test/spec/test-main.js', 'dist/test/spec/*_spec.js']
    //  }
    //}
  });

  grunt.registerTask('default', ['clean', 'copy:statics', 'copy:meta', 'babel']);
};
