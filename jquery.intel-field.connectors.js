/* jquery.intelField.connectors.js | PHP framework AJAX adapters */
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

  if (!$ || !$.fn.intelField || !$.fn.intelField.defaults.ajax) {
    throw new Error("intelField connectors require jquery.intel-field.ajax.js");
  }

  var connectors = {};

  function metaContent(name) {
    var element = document.querySelector('meta[name="' + name + '"]');
    return element ? element.getAttribute("content") : null;
  }

  function responseItems(response) {
    if ($.isArray(response)) {
      return response;
    }
    if (response && $.isArray(response.items)) {
      return response.items;
    }
    if (response && response.data && $.isArray(response.data.items)) {
      return response.data.items;
    }
    if (response && $.isArray(response.data)) {
      return response.data;
    }
    return [];
  }

  function mergeData(base, extra, query, instance) {
    var value = $.isFunction(extra) ? extra.call(instance ? instance.$input[0] : null, query, instance) : extra;
    return $.extend({}, value || {}, base || {});
  }

  connectors.bitrix = function (options) {
    options = options || {};
    return {
      enabled: true,
      url: options.url || "/bitrix/services/main/ajax.php",
      method: options.method || "POST",
      queryParam: options.queryParam || "q",
      data: function (query, instance) {
        var data = mergeData({}, options.data, query, instance);
        if (options.action) {
          data.action = options.action;
        }
        if (window.BX && $.isFunction(window.BX.bitrix_sessid)) {
          data.sessid = window.BX.bitrix_sessid();
        }
        return data;
      },
      transformResponse: options.transformResponse || responseItems
    };
  };

  connectors.laravel = function (options) {
    options = options || {};
    return {
      enabled: true,
      url: options.url,
      method: options.method || "GET",
      queryParam: options.queryParam || "q",
      data: options.data || {},
      headers: function () {
        return $.extend({
          "X-CSRF-TOKEN": options.csrfToken || metaContent("csrf-token") || "",
          "X-Requested-With": "XMLHttpRequest"
        }, options.headers || {});
      },
      transformResponse: options.transformResponse || responseItems
    };
  };

  connectors.codeigniter = function (options) {
    options = options || {};
    return {
      enabled: true,
      url: options.url,
      method: options.method || "POST",
      queryParam: options.queryParam || "q",
      data: function (query, instance) {
        var data = mergeData({}, options.data, query, instance);
        var tokenName = options.csrfTokenName || metaContent("csrf-token-name");
        var token = options.csrfToken || metaContent("csrf-token");
        if (tokenName && token) {
          data[tokenName] = token;
        }
        return data;
      },
      headers: $.extend({ "X-Requested-With": "XMLHttpRequest" }, options.headers || {}),
      transformResponse: options.transformResponse || responseItems
    };
  };

  connectors.yii = function (options) {
    options = options || {};
    return {
      enabled: true,
      url: options.url,
      method: options.method || "GET",
      queryParam: options.queryParam || "q",
      data: options.data || {},
      headers: function () {
        var token = options.csrfToken;
        if (!token && window.yii && $.isFunction(window.yii.getCsrfToken)) {
          token = window.yii.getCsrfToken();
        }
        token = token || metaContent("csrf-token") || "";
        return $.extend({
          "X-CSRF-Token": token,
          "X-Requested-With": "XMLHttpRequest"
        }, options.headers || {});
      },
      transformResponse: options.transformResponse || responseItems
    };
  };

  $.intelFieldConnectors = {
    register: function (name, factory) {
      if (!name || !$.isFunction(factory)) {
        throw new Error("Connector name and factory are required");
      }
      connectors[String(name).toLowerCase()] = factory;
      return this;
    },
    create: function (name, options) {
      var factory = connectors[String(name).toLowerCase()];
      if (!factory) {
        throw new Error("Unknown intelField connector: " + name);
      }
      return factory(options || {});
    },
    names: function () {
      return Object.keys(connectors);
    }
  };

  $.fn.intelFieldWithConnector = function (name, pluginOptions, connectorOptions) {
    var options = $.extend(true, {}, pluginOptions || {});
    options.ajax = $.extend(true, {}, $.intelFieldConnectors.create(name, connectorOptions), options.ajax || {});
    return this.intelField(options);
  };

  return $.intelFieldConnectors;
}));
