/* jquery.intelField.ajax.js | optional remote items loader */
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

  if (!$ || !$.fn.intelField || !$.fn.intelField.Constructor) {
    throw new Error("intelField AJAX requires jquery.intel-field.js");
  }

  var Constructor = $.fn.intelField.Constructor;
  var originalBind = Constructor.prototype._bind;
  var originalSearch = Constructor.prototype.search;
  var originalOpen = Constructor.prototype.open;
  var originalDestroy = Constructor.prototype.destroy;

  $.extend(true, $.fn.intelField.defaults, {
    ajax: {
      enabled: false,
      url: null,
      method: "GET",
      dataType: "json",
      queryParam: "q",
      delay: 250,
      minChars: null,
      loadOnInit: false,
      loadOnOpen: false,
      loadOnSearch: true,
      localFilter: false,
      cache: true,
      loadingText: "Загрузка...",
      data: {},
      headers: {},
      requestOptions: {},
      buildData: null,
      transformResponse: null
    },
    onAjaxLoadStart: null,
    onAjaxLoad: null,
    onAjaxError: null,
    onAjaxLoadEnd: null
  });

  function ajaxOptions(instance) {
    return instance.options.ajax || {};
  }

  function resolveOption(value, instance, query, extraData) {
    return $.isFunction(value) ? value.call(instance.$input[0], query, instance, extraData) : value;
  }

  Constructor.prototype._setAjaxLoading = function (loading) {
    this.$item.toggleClass("intel-field__item--loading", loading);
    if (!this.$menu || !this.$menu.length) {
      return this;
    }
    this.$menu.find(".intel-field__loading").remove();
    if (loading) {
      this.$menu.prepend($("<li>", {
        "class": "intel-field__empty intel-field__loading",
        text: ajaxOptions(this).loadingText || "Загрузка..."
      }));
    }
    return this;
  };

  Constructor.prototype._normalizeAjaxItems = function (response) {
    var options = ajaxOptions(this);
    if ($.isFunction(options.transformResponse)) {
      return options.transformResponse.call(this.$input[0], response, this);
    }
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
  };

  Constructor.prototype.abortLoad = function () {
    if (this.ajaxTimer) {
      clearTimeout(this.ajaxTimer);
      this.ajaxTimer = null;
    }
    if (this.ajaxRequest && this.ajaxRequest.readyState !== 4) {
      this.ajaxRequest.abort();
    }
    this.ajaxRequest = null;
    this._setAjaxLoading(false);
    return this;
  };

  Constructor.prototype.loadItems = function (query, extraData) {
    var self = this;
    var options = ajaxOptions(this);
    var deferred = $.Deferred();

    if (!options.enabled || !options.url) {
      return deferred.reject({ message: "intelField AJAX is disabled or url is missing" }).promise();
    }

    query = $.trim(query == null ? "" : String(query));
    this.ajaxCache = this.ajaxCache || {};
    var cacheKey = query + "|" + JSON.stringify(extraData || {});
    if (options.cache && Object.prototype.hasOwnProperty.call(this.ajaxCache, cacheKey)) {
      this.setItems(this.ajaxCache[cacheKey]);
      if (this.options.search.enabled && query) {
        if (options.localFilter) {
          this._ajaxApplyingItems = true;
          originalSearch.call(this, query);
          this._ajaxApplyingItems = false;
        } else {
          this.open();
        }
      }
      this._emit("ajaxload", {
        query: query,
        items: this.ajaxCache[cacheKey],
        cached: true,
        instance: this
      }, "onAjaxLoad");
      return deferred.resolve(this.ajaxCache[cacheKey]).promise();
    }

    this.abortLoad();
    var requestId = (this.ajaxRequestId || 0) + 1;
    this.ajaxRequestId = requestId;
    var baseData = resolveOption(options.data, this, query, extraData) || {};
    var data = $.extend({}, baseData, extraData || {});
    if (options.queryParam) {
      data[options.queryParam] = query;
    }
    if ($.isFunction(options.buildData)) {
      data = options.buildData.call(this.$input[0], query, data, this) || data;
    }

    var requestOptions = $.extend(true, {}, options.requestOptions, {
      url: resolveOption(options.url, this, query, extraData),
      method: options.method || "GET",
      dataType: options.dataType || "json",
      data: data,
      headers: resolveOption(options.headers, this, query, extraData) || {}
    });

    this._setAjaxLoading(true);
    this._emit("ajaxloadstart", { query: query, data: data, instance: this }, "onAjaxLoadStart");

    var request = $.ajax(requestOptions);
    this.ajaxRequest = request;
    request
      .done(function (response) {
        if (self.destroyed || self.ajaxRequestId !== requestId) {
          return;
        }
        var items = self._normalizeAjaxItems(response);
        if (!$.isArray(items)) {
          items = [];
        }
        if (options.cache) {
          self.ajaxCache[cacheKey] = items;
        }
        self.setItems(items);
        if (self.options.search.enabled && query && options.localFilter) {
          self._ajaxApplyingItems = true;
          originalSearch.call(self, query);
          self._ajaxApplyingItems = false;
        } else if (self.options.search.enabled && query) {
          self.open();
          self._emit("search", {
            query: query,
            resultCount: items.length,
            remote: true,
            instance: self
          }, "onSearch");
        }
        self._emit("ajaxload", {
          query: query,
          items: items,
          response: response,
          cached: false,
          instance: self
        }, "onAjaxLoad");
        deferred.resolve(items, response);
      })
      .fail(function (xhr, status, error) {
        if (status !== "abort") {
          self._emit("ajaxerror", {
            query: query,
            xhr: xhr,
            status: status,
            error: error,
            instance: self
          }, "onAjaxError");
          deferred.reject(xhr, status, error);
        } else {
          deferred.reject(xhr, status, error);
        }
      })
      .always(function () {
        if (self.ajaxRequest === request) {
          self.ajaxRequest = null;
          self._setAjaxLoading(false);
          self._emit("ajaxloadend", { query: query, instance: self }, "onAjaxLoadEnd");
        }
      });

    return deferred.promise();
  };

  Constructor.prototype.reloadItems = function (query, extraData) {
    this.ajaxCache = {};
    return this.loadItems(query == null ? this.value() : query, extraData);
  };

  Constructor.prototype._scheduleAjaxLoad = function (query) {
    var self = this;
    var options = ajaxOptions(this);
    var minChars = options.minChars == null ? this.options.search.minChars : options.minChars;
    if ($.trim(query).length < Math.max(0, Number(minChars) || 0)) {
      this.abortLoad();
      return this;
    }
    if (this.ajaxTimer) {
      clearTimeout(this.ajaxTimer);
    }
    this.ajaxTimer = setTimeout(function () {
      self.ajaxTimer = null;
      self.loadItems(query);
    }, Math.max(0, Number(options.delay) || 0));
    return this;
  };

  Constructor.prototype.search = function (query) {
    var result = originalSearch.call(this, query);
    var options = ajaxOptions(this);
    if (options.enabled && options.loadOnSearch && !this._ajaxApplyingItems) {
      this._scheduleAjaxLoad(query);
    }
    return result;
  };

  Constructor.prototype.open = function () {
    var result = originalOpen.call(this);
    var options = ajaxOptions(this);
    if (options.enabled && options.loadOnOpen && !this.ajaxLoadedOnce) {
      this.ajaxLoadedOnce = true;
      this.loadItems(this.options.search.enabled ? this.value() : "");
    }
    return result;
  };

  Constructor.prototype._bind = function () {
    originalBind.call(this);
    var self = this;
    var options = ajaxOptions(this);
    if (options.enabled && options.loadOnInit) {
      setTimeout(function () {
        if (!self.destroyed) {
          self.loadItems("");
        }
      }, 0);
    }
  };

  Constructor.prototype.destroy = function (preserveItem) {
    this.abortLoad();
    return originalDestroy.call(this, preserveItem);
  };

  return Constructor;
}));
