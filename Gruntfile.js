'use strict';

module.exports = function(grunt) {
  grunt.initConfig({

    clean: ['public/css/vendor', 'public/js/vendor', 'public/css/fonts'],

    copy: {
      bowerjsdeps: {
        files: [
          {expand: true,
           flatten: true,
           src: ['bower_components/jquery/dist/jquery.min.js',
                 'bower_components/bootstrap/dist/js/bootstrap.min.js',
                 'bower_components/jqueryui/ui/minified/jquery-ui.min.js',
                 'bower_components/jquery-ui-touch-punch/jquery.ui.touch-punch.min.js'],
           dest: 'public/js/vendor/',
           filter: 'isFile'}
        ]
      },
      bowercssdeps: {
        files: [
          {expand: true,
           flatten: true,
           src: ['bower_components/bootstrap/dist/css/bootstrap.min.css',
                 'bower_components/bootstrap/dist/css/bootstrap-theme.min.css'],
           dest: 'public/css/vendor/',
           filter: 'isFile'}
        ]
      },
      bowerfontdeps: {
        files: [
          {expand: true,
           flatten: true,
           src: ['bower_components/bootstrap/dist/fonts/*'],
           dest: 'public/css/fonts/',
           filter: 'isFile'}
        ]
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('init', ['clean',
                              'copy:bowerjsdeps',
                              'copy:bowercssdeps',
                              'copy:bowerfontdeps']);
};
