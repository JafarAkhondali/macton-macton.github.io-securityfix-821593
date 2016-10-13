// Place third party dependencies in the lib folder
//
// Configure loading modules from the lib directory,
// except 'app' ones, 
requirejs.config({
    baseUrl: 'js/lib',
    paths: {
      app: '../app',
      ace: '//cdnjs.cloudflare.com/ajax/libs/ace/1.2.5/'
    },
    shim: {
      termlib:  {
        exports: 'Terminal'
      },
      fpsmeter:  {
        exports: 'FPSMeter'
      },
      termlib_parser:  {
        exports: 'Parser'
      },
    }
});

// Load the main app module to start the app
requirejs(['app/main']);
