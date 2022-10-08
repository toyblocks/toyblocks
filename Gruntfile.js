'use strict';

module.exports = function(grunt) {
  grunt.initConfig({

    clean: ['public/css/vendor', 'public/js/vendor', 'public/css/fonts', 'public/css/vendor/font/'],

    copy: {
      bowerjsdeps: {
        files: [{
          expand: true,
          flatten: true,
          cwd: 'bower_components',
          src: ['jquery/dist/jquery.min.js','jquery/dist/jquery.min.map',
            'bootstrap/dist/js/bootstrap.min.js','bootstrap/dist/js/bootstrap.min.js.map',
            'jqueryui/jquery-ui.min.js',
            'jquery-ui-touch-punch/jquery.ui.touch-punch.min.js',
            'summernote/dist/summernote.min.js',
            'summernote/dist/summernote.min.js.map',
            'jquery-bootpag/lib/jquery.bootpag.min.js',
            'chartjs/Chart.min.js'
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
            'bootstrap/dist/css/bootstrap.min.css.map',
            'bootstrap/dist/css/bootstrap-theme.min.css',
            'bootstrap/dist/css/bootstrap-theme.min.css.map',
            'fontawesome/css/font-awesome.min.css',
            'summernote/dist/summernote.css',
            'summernote/dist/summernote.css.map'
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
          src: ['summernote/dist/font/*',
            'fontawesome/webfonts/*'],
          dest: 'public/css/vendor/font/',
          filter: 'isFile'
        }]
      },
      bowerfont2deps: {
        files: [{
          expand: true,
          flatten: true,
          cwd: 'bower_components',
          src: ['bootstrap/dist/fonts/*'],
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
    'copy:bowerfontdeps',
    'copy:bowerfont2deps'
  ]);
};
