define(function (require) {
  function Dom() {
    var self = this;

    self.htmlToElement = function(html) {
      var template = document.createElement('template');
      template.innerHTML = html;
      return template.content.firstChild;
    };

    self.htmlToElements = function(html) {
      var template = document.createElement('template');
      template.innerHTML = html;
      return template.content.childNodes;
    };

    self.onReady = function(fn) {
      if (document.readyState != 'loading'){
        fn();
      } else {
        document.addEventListener('DOMContentLoaded', fn);
      }
    };

    self.getElementById = function(id) {
      return document.getElementById(id);
    };

    self.appendChild = function(parent_element, child_element) {
      parent_element.appendChild( child_element );
    };

    self.empty = function(element) {
      element.innerHTML = '';
    };

    self.appendChildHtml = function(parent_element, child_html ) {
      var child_element = self.htmlToElement( child_html );
      self.appendChild( parent_element, child_element );
    };
  };

  return new Dom();
});
