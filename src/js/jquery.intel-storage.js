/* jquery.intelStorage.js | LocalStorage extension for intelField and intelButton */
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

  if (!$ || !window.localStorage) {
    throw new Error("intelStorage requires jQuery and LocalStorage");
  }

  var defaults = {
    enabled: false,
    namespace: "intel-ui",
    key: null,
    restore: true,
    saveOnInput: true,
    saveOnChange: true,
    serialize: JSON.stringify,
    deserialize: JSON.parse
  };

  function merge(options) {
    return $.extend(true, {}, defaults, options || {});
  }

  function storageKey(options, fallback) {
    return options.namespace + ":" + (options.key || fallback);
  }

  function read(options, fallback) {
    var raw = window.localStorage.getItem(storageKey(options, fallback));
    if (raw === null) {
      return null;
    }
    try {
      return options.deserialize(raw);
    } catch (_) {
      return null;
    }
  }

  function write(options, fallback, value) {
    window.localStorage.setItem(storageKey(options, fallback), options.serialize(value));
    return value;
  }

  function remove(options, fallback) {
    window.localStorage.removeItem(storageKey(options, fallback));
  }

  function elementKey($element, prefix) {
    return $element.attr("data-storage-key") || $element.attr("id") || $element.attr("name") || (prefix + "-anonymous");
  }

  function installFieldExtension() {
    if (!$.fn.intelField || !$.fn.intelField.Constructor || $.fn.intelField.Constructor.prototype._intelStorageInstalled) {
      return;
    }
    $.extend(true, $.fn.intelField.defaults, { storage: defaults });
    var Constructor = $.fn.intelField.Constructor;
    var originalBind = Constructor.prototype._bind;
    var originalDestroy = Constructor.prototype.destroy;

    Constructor.prototype._bind = function () {
      var self = this;
      var options = merge(this.options.storage);
      var fallback = elementKey(this.$input, "field");
      if (options.enabled && options.restore) {
        var stored = read(options, fallback);
        if (stored && stored.value !== undefined) {
          this.value(stored.value, false);
          this.appliedValue = this.value();
          this.editStartValue = this.value();
        }
      }
      originalBind.call(this);
      if (!options.enabled) {
        return;
      }
      this.$input.on("intelfield:save.intelStorage intelfield:change.intelStorage", function () {
        write(options, fallback, { value: self.value() });
      });
      if (options.saveOnInput) {
        this.$input.on("input.intelStorage", function () {
          write(options, fallback, { value: self.value() });
        });
      }
    };

    Constructor.prototype.destroy = function (preserveItem) {
      this.$input.off(".intelStorage");
      return originalDestroy.call(this, preserveItem);
    };
    Constructor.prototype._intelStorageInstalled = true;
  }

  function installButtonExtension() {
    if (!$.fn.intelButton || !$.fn.intelButton.Constructor || $.fn.intelButton.Constructor.prototype._intelStorageInstalled) {
      return;
    }
    $.extend(true, $.fn.intelButton.defaults, { storage: defaults });
    var Constructor = $.fn.intelButton.Constructor;
    var originalBind = Constructor.prototype._bind;
    var originalDestroy = Constructor.prototype.destroy;

    Constructor.prototype._bind = function () {
      var self = this;
      var options = merge(this.options.storage);
      var fallback = elementKey(this.$button, "button");
      originalBind.call(this);
      if (!options.enabled) {
        return;
      }
      if (options.restore) {
        var stored = read(options, fallback);
        if (stored) {
          if (stored.checked !== undefined) {
            this.setChecked(stored.checked, false);
          }
          if (stored.state === "complete") {
            this.complete(stored.value, false);
          }
          if (stored.menuOpen) {
            this.openMenu(false);
          }
        }
      }
      this.$button.on("intelbutton:change.intelStorage intelbutton:complete.intelStorage intelbutton:edit.intelStorage intelbutton:menu-toggle.intelStorage intelbutton:select.intelStorage", function () {
        write(options, fallback, {
          checked: self.options.checked,
          state: self.state,
          menuOpen: self.menuOpen
        });
      });
    };

    Constructor.prototype.destroy = function () {
      this.$button.off(".intelStorage");
      return originalDestroy.call(this);
    };
    Constructor.prototype._intelStorageInstalled = true;
  }

  function snapshotExample($example) {
    var groups = [];
    $example.find(".intel-field-group").each(function () {
      groups.push($(this).find(".intel-field__input").map(function () {
        return $(this).val();
      }).get());
    });
    var buttons = [];
    $example.find(".intel-button__primary").each(function () {
      var instance = $(this).data("plugin_intelButton");
      buttons.push(instance ? {
        checked: instance.options.checked,
        state: instance.state,
        menuOpen: instance.menuOpen
      } : null);
    });
    return {
      light: $example.hasClass("example--light"),
      groups: groups,
      buttons: buttons,
      logs: $example.find(".event-log").map(function () { return $(this).text(); }).get()
    };
  }

  function applyTheme($example, light) {
    var theme = light ? "light" : "dark";
    $example.toggleClass("example--light", light);
    $example.find(".intel-field__input").each(function () {
      $(this).intelField("setTheme", theme);
    });
    $example.find(".intel-button__primary").each(function () {
      $(this).intelButton("setTheme", theme);
    });
    var $switch = $example.find(".example__theme-switch");
    $switch.attr({
      "data-example-theme": theme,
      "aria-label": "\u041f\u0435\u0440\u0435\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u043f\u0440\u0438\u043c\u0435\u0440 \u043d\u0430 " + (light ? "\u0442\u0435\u043c\u043d\u0443\u044e" : "\u0441\u0432\u0435\u0442\u043b\u0443\u044e") + " \u0442\u0435\u043c\u0443"
    });
    $switch.find(".example__theme-icon").text(light ? "\u25d0" : "\u2600");
    $switch.find(".example__theme-label").text(light ? "\u0422\u0435\u043c\u043d\u0430\u044f \u0442\u0435\u043c\u0430" : "\u0421\u0432\u0435\u0442\u043b\u0430\u044f \u0442\u0435\u043c\u0430");
  }

  function restoreExample($example, state) {
    applyTheme($example, Boolean(state.light));
    $example.find(".intel-field-group").each(function (groupIndex) {
      var values = state.groups[groupIndex] || [];
      var $group = $(this);
      while ($group.find(".intel-field__input").length < values.length) {
        var $last = $group.find(".intel-field__input").last();
        if (!$last.length || !$last.data("plugin_intelField")) {
          break;
        }
        $last.intelField("add", "after");
      }
      while ($group.find(".intel-field__input").length > values.length && values.length > 0) {
        var $extra = $group.find(".intel-field__input").last();
        if (!$extra.data("plugin_intelField")) {
          break;
        }
        $extra.intelField("remove");
      }
      $group.find(".intel-field__input").each(function (inputIndex) {
        if (values[inputIndex] !== undefined) {
          $(this).intelField("value", values[inputIndex], false);
        }
      });
    });
    $example.find(".intel-button__primary").each(function (index) {
      var instance = $(this).data("plugin_intelButton");
      var buttonState = state.buttons[index];
      if (!instance || !buttonState) {
        return;
      }
      instance.setChecked(buttonState.checked, false);
      if (buttonState.state === "complete") {
        instance.complete(undefined, false);
      }
      if (buttonState.menuOpen) {
        instance.openMenu(false);
      }
    });
    $example.find(".event-log").each(function (index) {
      if (state.logs[index] !== undefined) {
        $(this).text(state.logs[index]);
      }
    });
  }

  function bindContainer(selector, options) {
    options = merge($.extend({ key: "examples" }, options || {}));
    var $container = $(selector);
    var fallback = options.key || "examples";
    var timer = null;

    if (!$container.length) {
      throw new Error("intelLocalStorage.bindContainer target not found");
    }

    function save() {
      var state = $container.find(".example").map(function () {
        return snapshotExample($(this));
      }).get();
      write(options, fallback, state);
      return state;
    }

    function scheduleSave() {
      clearTimeout(timer);
      timer = setTimeout(save, 30);
    }

    if (options.restore) {
      var stored = read(options, fallback);
      if ($.isArray(stored)) {
        $container.find(".example").each(function (index) {
          if (stored[index]) {
            restoreExample($(this), stored[index]);
          }
        });
      }
    }

    $container.on([
      "input.intelStorage",
      "change.intelStorage",
      "click.intelStorage",
      "intelfield:save.intelStorage",
      "intelfield:add.intelStorage",
      "intelfield:remove.intelStorage",
      "intelbutton:change.intelStorage",
      "intelbutton:complete.intelStorage",
      "intelbutton:edit.intelStorage",
      "intelbutton:menu-toggle.intelStorage",
      "intelbutton:select.intelStorage"
    ].join(" "), scheduleSave);

    var observer = typeof MutationObserver === "function" ? new MutationObserver(scheduleSave) : null;
    if (observer) {
      observer.observe($container[0], { childList: true, subtree: true });
    }

    return {
      save: save,
      restore: function () {
        var state = read(options, fallback);
        if ($.isArray(state)) {
          $container.find(".example").each(function (index) {
            if (state[index]) {
              restoreExample($(this), state[index]);
            }
          });
        }
      },
      clear: function () {
        clearTimeout(timer);
        remove(options, fallback);
      },
      destroy: function () {
        clearTimeout(timer);
        if (observer) {
          observer.disconnect();
        }
        $container.off(".intelStorage");
      }
    };
  }

  installFieldExtension();
  installButtonExtension();

  $.intelLocalStorage = {
    defaults: defaults,
    read: function (key, options) { return read(merge(options), key); },
    write: function (key, value, options) { return write(merge(options), key, value); },
    remove: function (key, options) { return remove(merge(options), key); },
    bindContainer: bindContainer,
    installFieldExtension: installFieldExtension,
    installButtonExtension: installButtonExtension
  };

  return $.intelLocalStorage;
}));
