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
 
    self.getElementsByClassName = function(parent_element, class_name) {
      return parent_element.getElementsByClassName( class_name );
    }; 

    self.appendChild = function(parent_element, child_element) {
      if (child_element) {
        parent_element.appendChild( child_element );
      }
    };

    self.empty = function(element) {
      element.innerHTML = '';
    };

    self.appendChildHtml = function(parent_element, child_html ) {
      var child_element = self.htmlToElement( child_html );
      self.appendChild( parent_element, child_element );
    };
  
    self.getAttribute = function( element, attribute_name ) {
      return element.getAttribute( attribute_name );
    };

    self.setAttribute = function( element, attribute_name, value ) {
      return element[ attribute_name ] = value;
    };

    self.removeAttribute = function( element, attribute_name ) {
      element.removeAttribute( attribute_name );
    };

    self.addClass = function( element, class_name ) {
      if (element.classList) {
        element.classList.add(class_name);
      } else {
        element.className += ' ' + class_name;
      }
    };

    self.removeClass = function( element, class_name ) {
      if (element.classList) {
        element.classList.remove(class_name);
      } else {
        element.className = element.className.replace(new RegExp('(^|\\b)' + class_name.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
      }
    };

    self.hide = function( element ) {
      element.style.display = 'none';
    };

    self.show = function( element ) {
      element.style.display = '';
    };

    self.setChildHtml = function( parent_element, child_html ) {
      self.empty( parent_element );
      self.appendChildHtml( parent_element, child_html );
    };

    self.forEach = function( elements, func ) {
      Array.prototype.forEach.call( elements, func );
    };

    self.addClickListenerPreventDefault = function( element, func ) {
      element.addEventListener('click', function( event ) {
        event.preventDefault();
        func( event );
      }, false);
    };

    self.getInnerText = function( element ) {
      return element.innerText;
    };

  };

  return new Dom();
});
