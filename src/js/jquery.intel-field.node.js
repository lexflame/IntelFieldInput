/* jquery.intelField.node.js | Node.js API connector */
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

  if (!$ || !$.intelFieldConnectors || !$.isFunction($.intelFieldConnectors.register)) {
    throw new Error("intelField Node.js connector requires jquery.intel-field.connectors.js");
  }

  function readMeta(name) {
    var element = document.querySelector('meta[name="' + name + '"]');
    return element ? element.getAttribute("content") : null;
  }

  function readCookie(name) {
    if (!name || typeof document === "undefined") {
      return null;
    }
    var encodedName = encodeURIComponent(name) + "=";
    var cookies = document.cookie ? document.cookie.split(";") : [];
    for (var index = 0; index < cookies.length; index += 1) {
      var cookie = $.trim(cookies[index]);
      if (cookie.indexOf(encodedName) === 0) {
        return decodeURIComponent(cookie.substring(encodedName.length));
      }
    }
    return null;
  }

  function valueAtPath(source, path) {
    if (!path) {
      return source;
    }
    return String(path).split(".").reduce(function (current, key) {
      return current == null ? undefined : current[key];
    }, source);
  }

  function defaultItems(response, options) {
    if ($.isArray(response)) {
      return response;
    }

    var paths = [];
    if (options.responsePath) {
      paths.push(options.responsePath);
    }
    paths = paths.concat([
      "items",
      "results",
      "data.items",
      "data.results",
      "data",
      "payload.items",
      "payload.results"
    ]);

    for (var index = 0; index < paths.length; index += 1) {
      var value = valueAtPath(response, paths[index]);
      if ($.isArray(value)) {
        return value;
      }
    }
    return [];
  }

  function mapItems(items, options) {
    if (!$.isFunction(options.mapItem)) {
      return items;
    }
    return $.map(items, function (item, index) {
      return options.mapItem(item, index);
    });
  }

  function resolveValue(value, query, instance) {
    return $.isFunction(value) ? value.call(instance ? instance.$input[0] : null, query, instance) : value;
  }

  function createNodeConnector(options) {
    options = options || {};
    var csrfHeader = options.csrfHeader || "X-CSRF-Token";

    return {
      enabled: true,
      url: options.url,
      method: options.method || "GET",
      queryParam: options.queryParam || "q",
      dataType: options.dataType || "json",
      data: function (query, instance) {
        var data = resolveValue(options.data, query, instance) || {};
        data = $.extend({}, data);
        if (options.pageParam && options.page != null) {
          data[options.pageParam] = resolveValue(options.page, query, instance);
        }
        if (options.limitParam && options.limit != null) {
          data[options.limitParam] = resolveValue(options.limit, query, instance);
        }
        return data;
      },
      headers: function (query, instance) {
        var headers = $.extend({
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }, resolveValue(options.headers, query, instance) || {});

        var token = resolveValue(options.token, query, instance);
        if (token) {
          headers.Authorization = (options.tokenType || "Bearer") + " " + token;
        }

        var csrfToken = resolveValue(options.csrfToken, query, instance);
        csrfToken = csrfToken || readMeta(options.csrfMeta || "csrf-token");
        csrfToken = csrfToken || readCookie(options.csrfCookie || "XSRF-TOKEN");
        if (csrfToken && csrfHeader) {
          headers[csrfHeader] = csrfToken;
        }
        return headers;
      },
      requestOptions: $.extend(true, {
        xhrFields: {
          withCredentials: Boolean(options.withCredentials)
        }
      }, options.requestOptions || {}),
      buildData: options.buildData || null,
      transformResponse: options.transformResponse || function (response) {
        return mapItems(defaultItems(response, options), options);
      }
    };
  }

  $.intelFieldConnectors.register("node", createNodeConnector);
  $.intelFieldConnectors.register("nodejs", createNodeConnector);
  $.intelFieldConnectors.register("express", createNodeConnector);
  $.intelFieldConnectors.register("nestjs", createNodeConnector);
  $.intelFieldConnectors.register("fastify", createNodeConnector);

  $.intelFieldNodeConnector = createNodeConnector;

  return createNodeConnector;
}));
