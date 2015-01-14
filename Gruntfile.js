'use strict';

module.exports = function(grunt) {
  grunt.initConfig({

    clean: ['public/css/vendor', 'public/js/vendor', 'public/css/fonts'],

    copy: {
      bowerjsdeps: {
        files: [{
          expand: true,
          flatten: true,
          cwd: 'bower_components',
          src: ['jquery/dist/jquery.min.js',
            'bootstrap/dist/js/bootstrap.min.js',
            'jqueryui/jquery-ui.min.js',
            'jquery-ui-touch-punch/jquery.ui.touch-punch.min.js',
            'summernote/dist/summernote.min.js',
            'jquery-bootpag/lib/jquery.bootpag.min.js',
            'jquery-flot/jquery.flot.js'
          ],
          dest: 'public/js/vendor/',
          filter: 'isFile'
        }]
      },
      bowercssdeps: {
        files: [{
          expand: true,
          flatten: true,
          cwd: 'bower_components',
          src: ['bootstrap/dist/css/bootstrap.min.css',
            'bootstrap/dist/css/bootstrap-theme.min.css',
            'fontawesome/css/font-awesome.min.css',
            'summernote/dist/summernote.css'
          ],
          dest: 'public/css/vendor/',
          filter: 'isFile'
        }]
      },
      bowerfontdeps: {
        files: [{
          expand: true,
          flatten: true,
          cwd: 'bower_components',
          src: ['bootstrap/dist/fonts/*',
            'fontawesome/fonts/*'],
          dest: 'public/css/fonts/',
          filter: 'isFile'
        }]
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('init', ['clean',
    'copy:bowerjsdeps',
    'copy:bowercssdeps',
    'copy:bowerfontdeps'
  ]);
};
