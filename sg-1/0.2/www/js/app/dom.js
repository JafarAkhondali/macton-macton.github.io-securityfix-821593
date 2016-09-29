define(function (require) {
  var log = require('./log');

  var dom = {

    htmlToElement: function(html) {
      var template = document.createElement('template');
      template.innerHTML = html;
      var element = template.content.firstChild;
      if ( element == null ) {
        log.err('HTML element not created from: \'' + html + '\'');
      }
      return element;
    },

    htmlToElements: function(html) {
      var template = document.createElement('template');
      template.innerHTML = html;
      var elements = template.content.childNodes;
      if ( elements == null ) {
        log.err('HTML elements not created from: \'' + html + '\'');
      }
      return elements;
    },

    onReady: function(fn) {
      if (document.readyState != 'loading'){
        fn();
      } else {
        document.addEventListener('DOMContentLoaded', fn);
      }
    },

    getElementById: function(id) {
      return document.getElementById(id);
    },
 
    getElementsByClassName: function(parent_element, class_name) {
      return parent_element.getElementsByClassName( class_name );
    }, 

    appendChild: function(parent_element, child_element) {
      if (child_element) {
        parent_element.appendChild( child_element );
      }
    },

    empty: function(element) {
      if ( element == null ) {
        log.err('HTML element null');
      }
      element.innerHTML = '';
    },

    appendChildHtml: function(parent_element, child_html ) {
      var child_element = dom.htmlToElement( child_html );
      dom.appendChild( parent_element, child_element );
    },
  
    getAttribute: function( element, attribute_name ) {
      return element.getAttribute( attribute_name );
    },

    setAttribute: function( element, attribute_name, value ) {
      return element[ attribute_name ] = value;
    },

    removeAttribute: function( element, attribute_name ) {
      element.removeAttribute( attribute_name );
    },

    addClass: function( element, class_name ) {
      if (element.classList) {
        element.classList.add(class_name);
      } else {
        element.className += ' ' + class_name;
      }
    },

    removeClass: function( element, class_name ) {
      if (element.classList) {
        element.classList.remove(class_name);
      } else {
        element.className = element.className.replace(new RegExp('(^|\\b)' + class_name.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
      }
    },

    hide: function( element ) {
      element.style.display = 'none';
    },

    show: function( element ) {
      element.style.display = '';
    },

    setChildHtml: function( parent_element, child_html ) {
      dom.empty( parent_element );
      dom.appendChildHtml( parent_element, child_html );
    },

    forEach: function( elements, func ) {
      Array.prototype.forEach.call( elements, func );
    },

    addClickListenerPreventDefault: function( element, func ) {
      element.addEventListener('click', function( event ) {
        event.preventDefault();
        func( event );
      }, false);
    },

    getInnerText: function( element ) {
      return element.innerText;
    },

  };

  return dom;
});
