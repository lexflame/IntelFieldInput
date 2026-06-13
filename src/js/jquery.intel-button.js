/* jquery.intelButton.js | configurable jQuery button primitives */
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

  if (!$ || !$.intelDom) {
    throw new Error("intelButton requires jQuery and jquery.intel-dom.js");
  }

  var pluginName = "intelButton";
  var dataKey = "plugin_" + pluginName;
  var instanceCounter = 0;
  var variants = ["text", "split-play", "checkbox", "reveal-play", "reveal-document", "async-save", "async-transfer"];
  var defaults = {
    variant: "text",
    theme: "dark",
    size: "medium",
    disabled: false,
    checked: false,
    playText: "Play",
    playTitle: "\u0417\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u044c",
    checkTitle: "\u0412\u044b\u0431\u0440\u0430\u0442\u044c",
    documentTitle: "\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c",
    loadingText: "\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435",
    completeText: "\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c",
    completeBehavior: null,
    loadingDuration: 0,
    menu: {
      enabled: false,
      items: [],
      closeOnSelect: true,
      placement: "bottom-end"
    },
    onClick: null,
    onPlay: null,
    onCheck: null,
    onDocument: null,
    onMenuToggle: null,
    onMenuSelect: null,
    onComplete: null,
    onError: null,
    onEdit: null
  };

  function IntelButton(element, options) {
    this.id = ++instanceCounter;
    this.namespace = ".intelButton" + this.id;
    this.$button = $(element);
    this.options = $.extend(true, {}, defaults, options || {});
    this.$root = null;
    this.$control = null;
    this.$play = null;
    this.$loader = null;
    this.$menu = null;
    this.menuOpen = false;
    this.state = "idle";
    this.original = {
      className: this.$button.attr("class") || "",
      html: this.$button.html(),
      disabled: this.$button.prop("disabled")
    };
    $.intelDom.setAttribute(this.$button[0], "data-value", this.$button.text());
    this._build();
    this._bind();
    this.setTheme(this.options.theme);
    this.setChecked(this.options.checked, false);
    this.setDisabled(this.options.disabled || this.original.disabled);
  }

  IntelButton.prototype._normalizeVariant = function (variant) {
    return $.inArray(variant, variants) === -1 ? "text" : variant;
  };

  IntelButton.prototype._isAsync = function () {
    return this.options.variant === "async-save" || this.options.variant === "async-transfer";
  };

  IntelButton.prototype._completeBehavior = function () {
    if (this.options.completeBehavior) {
      return this.options.completeBehavior;
    }
    return this.options.variant === "async-transfer" ? "hide" : "edit";
  };

  IntelButton.prototype._controlButton = function (type, title) {
    return $.intelDom.create("button", {
      type: "button",
      "class": "intel-button__control intel-button__control--" + type,
      title: title,
      "aria-label": title
    }, $.intelDom.create("span", {
      "class": "intel-button__control-icon intel-button__control-icon--" + type,
      "aria-hidden": "true"
    }));
  };

  IntelButton.prototype._menuEnabled = function () {
    var menu = this.options.menu || {};
    return this.options.variant === "reveal-play" && menu.enabled && $.isArray(menu.items) && menu.items.length;
  };

  IntelButton.prototype._buildMenu = function () {
    var self = this;
    this.$menu = $.intelDom.create("div", {
      "class": "intel-button__menu intel-button__menu--" + this.options.menu.placement,
      role: "menu",
      "aria-hidden": "true"
    });
    $.each(this.options.menu.items, function (index, item) {
      var normalized = item && typeof item === "object" ? item : { text: item, value: item };
      var text = normalized.text == null ? normalized.label : normalized.text;
      var value = normalized.value == null ? text : normalized.value;
      self.$menu.append($.intelDom.create("button", {
        type: "button",
        "class": "intel-button__menu-item",
        role: "menuitem",
        "data-index": index,
        "data-value": value,
        disabled: Boolean(normalized.disabled),
        text: text
      }));
    });
    this.$root.append(this.$menu);
    this.$control.attr({ "aria-haspopup": "menu", "aria-expanded": "false" });
  };

  IntelButton.prototype._build = function () {
    var variant = this._normalizeVariant(this.options.variant);
    this.options.variant = variant;
    this.$button.addClass("intel-button__primary");
    this.$root = $.intelDom.wrap(this.$button, "div", {
      "class": "intel-button intel-button--" + variant
    }).addClass("intel-button--" + this.options.size);

    if (variant === "checkbox") {
      this.$control = this._controlButton("checkbox", this.options.checkTitle);
      this.$control.attr("role", "checkbox");
      this.$root.prepend(this.$control);
    } else if (variant === "reveal-play") {
      this.$control = this._controlButton("play", this.options.playTitle);
      this.$root.append(this.$control);
    } else if (variant === "reveal-document") {
      this.$control = this._controlButton("document", this.options.documentTitle);
      this.$root.prepend(this.$control);
    } else if (variant === "split-play" || variant === "async-save" || variant === "async-transfer") {
      this.$control = this._controlButton(variant === "async-transfer" ? "double-play" : "play", this.options.playTitle);
      if (variant === "split-play" && this.options.playText) {
        this.$control.append($.intelDom.create("span", {
          "class": "intel-button__control-text",
          text: this.options.playText
        }));
      }
      this.$root.append(this.$control);
    }

    this.$play = this.$control;
    if (this._menuEnabled()) {
      this._buildMenu();
    }
    if (this._isAsync()) {
      this.$loader = $.intelDom.create("span", {
        "class": "intel-button__loader",
        role: "status"
      }, [
        $.intelDom.create("span", { "class": "intel-button__spinner", "aria-hidden": "true" }),
        $.intelDom.create("span", { "class": "intel-button__loader-text", text: this.options.loadingText })
      ]);
      this.$root.append(this.$loader);
    }
  };

  IntelButton.prototype._payload = function (action, extra) {
    return $.extend({
      action: action,
      button: this.$button[0],
      instance: this
    }, extra || {});
  };

  IntelButton.prototype._emit = function (name, payload, callback) {
    this.$button.trigger("intelbutton:" + name, [payload]);
    if ($.isFunction(callback)) {
      return callback.call(this.$button[0], payload, this);
    }
    return undefined;
  };

  IntelButton.prototype._bind = function () {
    var self = this;
    this.$button.on("click" + this.namespace, function (event) {
      if (self.options.disabled || self.state === "loading") {
        event.preventDefault();
        return;
      }
      if (self.options.variant === "checkbox") {
        event.preventDefault();
        self.toggleChecked();
        return;
      }
      if (self._menuEnabled()) {
        event.preventDefault();
        self.toggleMenu();
        return;
      }
      if (self._isAsync() && self.state === "complete" && self._completeBehavior() === "edit") {
        self._emit("edit", self._payload("edit"), self.options.onEdit || self.options.onClick);
        return;
      }
      if (self._isAsync()) {
        event.preventDefault();
        self._runAsync();
        return;
      }
      self._emit("click", self._payload("click"), self.options.onClick);
    });

    if (this.$control) {
      this.$control.on("click" + this.namespace, function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (self.options.disabled || self.state === "loading") {
          return;
        }
        if (self.options.variant === "checkbox") {
          self.toggleChecked();
        } else if (self.options.variant === "reveal-document") {
          self._emit("document", self._payload("document"), self.options.onDocument);
        } else if (self._menuEnabled()) {
          self.toggleMenu();
          self._emit("play", self._payload("play"), self.options.onPlay);
        } else if (self._isAsync()) {
          self._runAsync();
        } else {
          self._emit("play", self._payload("play"), self.options.onPlay);
        }
      });
    }

    if (this.$menu) {
      this.$menu.on("click" + this.namespace, ".intel-button__menu-item", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (self.options.disabled || $(this).prop("disabled")) {
          return;
        }
        var index = Number($(this).attr("data-index"));
        var item = self.options.menu.items[index];
        var normalized = item && typeof item === "object" ? item : { text: item, value: item };
        var value = normalized.value == null ? (normalized.text == null ? normalized.label : normalized.text) : normalized.value;
        $.intelDom.setAttribute(self.$button[0], "data-value", value);
        var payload = self._payload("menu-select", { item: normalized, value: value, index: index });
        self._emit("select", payload, normalized.onSelect || self.options.onMenuSelect);
        if (self.options.menu.closeOnSelect) {
          self.closeMenu();
        }
      });
      $(document).on("click" + this.namespace, function (event) {
        if (self.menuOpen && !self.$root.is(event.target) && !self.$root.has(event.target).length) {
          self.closeMenu();
        }
      }).on("keydown" + this.namespace, function (event) {
        if (event.key === "Escape" && self.menuOpen) {
          self.closeMenu();
          self.$control.trigger("focus");
        }
      });
    }
  };

  IntelButton.prototype.openMenu = function (notify) {
    if (!this.$menu || this.options.disabled) {
      return this;
    }
    this.menuOpen = true;
    this.$root.addClass("intel-button--menu-open");
    this.$menu.attr("aria-hidden", "false");
    this.$control.attr("aria-expanded", "true");
    if (notify !== false) {
      this._emit("menu-toggle", this._payload("menu-toggle", { open: true }), this.options.onMenuToggle);
    }
    return this;
  };

  IntelButton.prototype.closeMenu = function (notify) {
    if (!this.$menu) {
      return this;
    }
    this.menuOpen = false;
    this.$root.removeClass("intel-button--menu-open");
    this.$menu.attr("aria-hidden", "true");
    this.$control.attr("aria-expanded", "false");
    if (notify !== false) {
      this._emit("menu-toggle", this._payload("menu-toggle", { open: false }), this.options.onMenuToggle);
    }
    return this;
  };

  IntelButton.prototype.toggleMenu = function () {
    return this.menuOpen ? this.closeMenu() : this.openMenu();
  };

  IntelButton.prototype._runAsync = function () {
    var self = this;
    var payload = this._payload("play");
    this.setLoading(true);
    var result;
    try {
      result = this._emit("play", payload, this.options.onPlay);
    } catch (error) {
      this.fail(error);
      return this;
    }

    if (result && $.isFunction(result.then)) {
      result.then(function (value) {
        self.complete(value);
      }, function (error) {
        self.fail(error);
      });
    } else if (Number(this.options.loadingDuration) > 0) {
      setTimeout(function () {
        self.complete(result);
      }, Number(this.options.loadingDuration));
    } else {
      this.complete(result);
    }
    return this;
  };

  IntelButton.prototype.setChecked = function (checked, notify) {
    this.options.checked = Boolean(checked);
    this.$root.toggleClass("intel-button--checked", this.options.checked);
    if (this.$control && this.options.variant === "checkbox") {
      this.$control.attr("aria-checked", this.options.checked ? "true" : "false");
    }
    if (notify !== false && this.options.variant === "checkbox") {
      var payload = this._payload("check", { checked: this.options.checked });
      this._emit("change", payload, this.options.onCheck);
    }
    return this;
  };

  IntelButton.prototype.toggleChecked = function () {
    return this.setChecked(!this.options.checked);
  };

  IntelButton.prototype.setLoading = function (loading) {
    if (!this._isAsync()) {
      return this;
    }
    this.state = loading ? "loading" : "idle";
    this.$root
      .toggleClass("intel-button--loading", loading)
      .removeClass("intel-button--complete intel-button--error")
      .attr("aria-busy", loading ? "true" : "false");
    this.$button.prop("disabled", Boolean(loading) || this.options.disabled);
    if (this.$control) {
      this.$control.prop("disabled", Boolean(loading) || this.options.disabled);
    }
    return this;
  };

  IntelButton.prototype.complete = function (value, notify) {
    if (!this._isAsync()) {
      return this;
    }
    this.state = "complete";
    this.$root
      .removeClass("intel-button--loading intel-button--error")
      .addClass("intel-button--complete")
      .attr("aria-busy", "false");
    var behavior = this._completeBehavior();
    if (behavior === "edit") {
      this.$button
        .prop("disabled", this.options.disabled)
        .text(this.options.completeText)
        .attr("data-value", this.options.completeText);
    } else if (behavior === "hide") {
      this.$root.addClass("intel-button--hidden").attr("aria-hidden", "true");
    } else if (behavior === "reset") {
      this.reset();
    } else {
      this.$button.prop("disabled", this.options.disabled);
    }
    if (this.$control) {
      this.$control.prop("disabled", this.options.disabled);
    }
    if (notify !== false) {
      this._emit("complete", this._payload("complete", { value: value }), this.options.onComplete);
    }
    return this;
  };

  IntelButton.prototype.fail = function (error) {
    if (!this._isAsync()) {
      return this;
    }
    this.state = "idle";
    this.$root
      .removeClass("intel-button--loading intel-button--complete")
      .addClass("intel-button--error")
      .attr("aria-busy", "false");
    this.$button.prop("disabled", this.options.disabled);
    if (this.$control) {
      this.$control.prop("disabled", this.options.disabled);
    }
    this._emit("error", this._payload("error", { error: error }), this.options.onError);
    return this;
  };

  IntelButton.prototype.reset = function () {
    this.state = "idle";
    this.closeMenu(false);
    this.$root
      .removeClass("intel-button--loading intel-button--complete intel-button--error intel-button--hidden")
      .attr({ "aria-busy": "false", "aria-hidden": "false" });
    this.$button.html(this.original.html).attr("data-value", this.$button.text());
    this.setDisabled(this.options.disabled);
    return this;
  };

  IntelButton.prototype.setTheme = function (theme) {
    this.options.theme = theme === "light" ? "light" : "dark";
    this.$root
      .removeClass("intel-button--dark intel-button--light")
      .addClass("intel-button--" + this.options.theme);
    return this;
  };

  IntelButton.prototype.setDisabled = function (disabled) {
    this.options.disabled = Boolean(disabled);
    if (this.options.disabled) {
      this.closeMenu(false);
    }
    this.$root.toggleClass("intel-button--disabled", this.options.disabled);
    this.$button.prop("disabled", this.options.disabled || this.state === "loading");
    if (this.$control) {
      this.$control.prop("disabled", this.options.disabled || this.state === "loading");
    }
    return this;
  };

  IntelButton.prototype.destroy = function () {
    this.$button.off(this.namespace).removeData(dataKey);
    $(document).off(this.namespace);
    if (this.$control) {
      this.$control.off(this.namespace).remove();
    }
    if (this.$loader) {
      this.$loader.remove();
    }
    if (this.$menu) {
      this.$menu.off(this.namespace).remove();
    }
    this.$root.before(this.$button);
    this.$root.remove();
    this.$button
      .attr("class", this.original.className)
      .html(this.original.html)
      .prop("disabled", this.original.disabled);
  };

  $.fn[pluginName] = function (option) {
    var args = Array.prototype.slice.call(arguments, 1);
    var returnValue = this;
    var hasReturnValue = false;

    this.each(function () {
      var $element = $(this);
      var instance = $element.data(dataKey);
      if (!instance && (typeof option === "object" || option === undefined)) {
        instance = new IntelButton(this, option || {});
        $element.data(dataKey, instance);
      }
      if (instance && typeof option === "string") {
        if (option.charAt(0) === "_" || !$.isFunction(instance[option])) {
          throw new Error("Unknown intelButton method: " + option);
        }
        var result = instance[option].apply(instance, args);
        if (result !== instance && result !== undefined && !hasReturnValue) {
          returnValue = result;
          hasReturnValue = true;
        }
      }
    });
    return returnValue;
  };

  $.fn[pluginName].defaults = defaults;
  $.fn[pluginName].Constructor = IntelButton;
  return IntelButton;
}));
