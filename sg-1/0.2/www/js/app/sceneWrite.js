define(function (require) {

  var scene = require('./scene');
  var fs    = require('./fs');
  var env   = require('./env');
  var path  = require('path');

  var sceneWrite = {
    clear: function() {
      sceneWrite.hideTitleCard();
      sceneWrite.showFolders();
      sceneWrite.enableFolders();
      sceneWrite.updateFolders();

      sceneWrite.clearLine();
      sceneWrite.hideBack();
      sceneWrite.hideNextLine();
      sceneWrite.clearTitle();
    },
 
    showFolders: function() {
      scene.isFoldersDirty     = true;
      scene.isFoldersVisible   = true;
    },

    hideFolders: function() {
      scene.isFoldersDirty     = true;
      scene.isFoldersVisible   = false;
    },

    showTitleCard: function() {
      scene.isTitleCardDirty   = true;
      scene.isTitleCardVisible = true;
    },

    hideTitleCard: function() {
      scene.isTitleCardDirty   = true;
      scene.isTitleCardVisible = false;
    },
   
    updateFolders: function() {
      scene.isFoldersDirty = true;
      scene.folders        = fs.ls( env.cwd ).map( function( child_name ) {
        var target_path = path.resolve( env.cwd, child_name );
        return {
          name: child_name,
          link: target_path,
          permissions: fs.getPermissions( target_path )
        };
      });
    },

    disableFolders: function() {
      scene.isFoldersDirty    = true;
      scene.isFoldersEnabled  = false;
    },

    enableFolders: function() {
      scene.isFoldersDirty    = true;
      scene.isFoldersEnabled  = true;
    },

    updateTitleCard: function( text ) {
      scene.isTitleCardDirty = true;
      scene.titleCard        = text;
    },
 
    clearLine: function() {
      sceneWrite.updateLine('','');
    },

    updateLine: function( speaker, line, lineClass ) {
      scene.speaker     = speaker;
      scene.line        = line;
      scene.lineClass   = lineClass;
      scene.isLineDirty = true;
    },

    showNextLine: function() {
      scene.isNextLineVisible = true;
      scene.isNextLineDirty   = true;
    },

    hideNextLine: function() {
      scene.isNextLineVisible = false;
      scene.isNextLineDirty   = true;
    },

    showBack: function() {
      scene.isBackVisible = true;
      scene.isBackDirty   = true;
    },

    hideBack: function() {
      scene.isBackVisible = false;
      scene.isBackDirty   = true;
    },

    updateTitle: function( title ) {
      scene.title        = title;
      scene.isTitleDirty = true;
    },

    clearTitle: function() {
      sceneWrite.updateTitle('');
    },
  };

  return sceneWrite;
});
