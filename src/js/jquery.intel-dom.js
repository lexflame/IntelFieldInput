/* jquery.intelDom.js | shared createElement helpers for intel plugins */
(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["jquery"], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory(require("jquery"));
  } else {
    factory(window.jQuery);
  }
}(function ($) {
  "use strict";

  if (!$) {
    throw new Error("intelDom requires jQuery");
  }

  function setAttribute(element, name, value) {
    if (value === null || value === undefined || value === false) {
      return;
    }
    if (name === "class" || name === "className") {
      element.className = String(value);
    } else if (name === "text") {
      element.textContent = String(value);
    } else if (name === "value") {
      element.value = String(value);
      element.setAttribute("value", String(value));
      element.setAttribute("data-value", String(value));
    } else if (name === "checked" || name === "disabled" || name === "readonly" || name === "multiple" || name === "selected") {
      element[name] = Boolean(value);
      if (value) {
        element.setAttribute(name, name);
      }
    } else if (name === "dataset" && typeof value === "object") {
      $.each(value, function (dataName, dataValue) {
        element.setAttribute("data-" + dataName.replace(/[A-Z]/g, function (letter) {
          return "-" + letter.toLowerCase();
        }), String(dataValue));
      });
    } else if (name === "style" && typeof value === "object") {
      $.each(value, function (property, propertyValue) {
        element.style[property] = propertyValue;
      });
    } else {
      element.setAttribute(name, String(value));
    }
  }

  function append(element, children) {
    $.each(children == null ? [] : ($.isArray(children) ? children : [children]), function (_, child) {
      if (child === null || child === undefined || child === false) {
        return;
      }
      if (child.jquery) {
        $.each(child.toArray(), function (_, node) { element.appendChild(node); });
      } else if (child.nodeType) {
        element.appendChild(child);
      } else {
        element.appendChild(document.createTextNode(String(child)));
      }
    });
    return element;
  }

  function create(tagName, attributes, children) {
    var element = document.createElement(tagName);
    $.each(attributes || {}, function (name, value) {
      setAttribute(element, name, value);
    });
    append(element, children);
    return $(element);
  }

  function wrap($target, tagName, attributes) {
    var $wrapper = create(tagName, attributes);
    $target.before($wrapper);
    $wrapper.append($target);
    return $wrapper;
  }

  $.intelDom = {
    create: create,
    append: append,
    setAttribute: setAttribute,
    wrap: wrap
  };

  return $.intelDom;
}));
