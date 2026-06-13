/* jquery.intelField.js | configurable input/select jQuery plugin */
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
    throw new Error("intelField requires jQuery and jquery.intel-dom.js");
  }

  var pluginName = "intelField";
  var dataKey = "plugin_" + pluginName;
  var instanceCounter = 0;

  var defaults = {
    items: [],
    startMode: "auto",
    emptyText: "Нет вариантов",
    layout: {
      mode: "separate-column",
      groupInputs: false,
      columns: 5
    },
    search: {
      enabled: false,
      minChars: 0,
      openOnFocus: true,
      noResultsText: "Ничего не найдено",
      selectFirstOnEnter: true,
      matcher: null
    },
    behavior: {
      allowSelect: true,
      allowOpen: false,
      allowEdit: true,
      allowApply: true,
      allowClear: true,
      allowAdd: true,
      allowPrepend: true,
      allowRemove: true,
      applyOnSelect: true,
      autoSaveOnSelect: true,
      autoSaveOnBlur: true,
      editOnDblClick: false,
      openOnDblClick: false,
      viewOnBlur: true,
      borderlessView: false,
      readonlyOnView: true,
      outerControlsInView: false,
      closeOnOutsideClick: true,
      enterApplies: true,
      escapeAction: "cancel",
      minFields: 1,
      maxFields: Infinity,
      removeLast: "clear",
      focusNewField: true,
      requireValue: false,
      disabled: false
    },
    appearance: {
      theme: "dark",
      size: "medium",
      className: "",
      accentColor: null,
      backgroundColor: null,
      textColor: null,
      borderColor: null,
      borderRadius: null
    },
    buttons: {
      select: { icon: "\u25BC", title: "Открыть список" },
      open: { icon: "\uD83D\uDCC2", title: "Открыть" },
      edit: { icon: "\u270E", title: "Изменить" },
      apply: { icon: "\u2713", title: "Сохранить" },
      clear: { icon: "\u00D7", title: "Очистить" },
      prepend: { icon: "+", title: "Добавить перед текущим" },
      remove: { icon: "\u00D7", title: "Удалить" },
      add: { icon: "+", title: "Добавить после текущего" }
    },
    valueFormatter: function (item) {
      var label = item.label || item.type || "";
      var text = item.text || item.name || item.value || "";
      return $.trim(label + " " + text);
    },
    itemLabel: function (item) {
      return item.label || item.type || "";
    },
    itemText: function (item) {
      return item.text || item.name || item.value || "";
    },
    validate: null,
    onInit: null,
    onInput: null,
    onChange: null,
    onSelect: null,
    onSave: null,
    onApply: null,
    onModeChange: null,
    onAdd: null,
    onRemove: null,
    onOpenAction: null,
    onOpen: null,
    onClose: null,
    onSearch: null,
    onInvalid: null
  };

  function normalizeLayoutMode(mode) {
    var modes = ["joined-row", "separate-row", "separate-column"];
    return $.inArray(mode, modes) === -1 ? "separate-column" : mode;
  }

  function mergeOptions(target, source) {
    $.each(source || {}, function (key, value) {
      if ($.isArray(value)) {
        target[key] = value.slice();
      } else if ($.isPlainObject(value)) {
        if (!$.isPlainObject(target[key])) {
          target[key] = {};
        }
        mergeOptions(target[key], value);
      } else {
        target[key] = value;
      }
    });
    return target;
  }

  function updateGroupState($group) {
    if (!$group || !$group.length) {
      return;
    }
    var $items = $group.children(".intel-field__item");
    $group.attr("data-field-count", $items.length);
    $group.toggleClass(
      "intel-field-group--all-view",
      $items.length > 0 && $items.filter(".intel-field__item--view").length === $items.length
    );
    $items.removeClass("intel-field__item--first intel-field__item--last");
    $items.first().addClass("intel-field__item--first");
    $items.last().addClass("intel-field__item--last");
    updateDynamicRemoveButtons($group);
  }

  function updateDynamicRemoveButtons($group) {
    if (!$group || !$group.length) {
      return;
    }

    var fieldCount = $group.children(".intel-field__item").length;
    $group.find(".intel-field__input").each(function () {
      var instance = $(this).data(dataKey);
      if (!instance) {
        return;
      }
      var disabled = instance.options.behavior.disabled || fieldCount <= instance.options.behavior.minFields;
      instance.$item.find(".intel-field__button--remove")
        .prop("disabled", disabled)
        .attr("aria-disabled", disabled ? "true" : "false");
    });
  }

  function IntelField(element, options, group) {
    this.id = ++instanceCounter;
    this.namespace = ".intelField" + this.id;
    this.$input = $(element);
    this.options = $.extend(true, {}, defaults, options);
    this.$group = group || null;
    this.$item = null;
    this.$main = null;
    this.$actions = null;
    this.$outerActions = null;
    this.$menu = null;
    this.$searchEmpty = null;
    this.mode = null;
    this.isOpen = false;
    this.destroyed = false;
    this.blurTimer = null;
    this.original = {
      className: this.$input.attr("class") || "",
      readonly: this.$input.prop("readonly"),
      disabled: this.$input.prop("disabled")
    };
    this.originalMarker = document.createComment("intelField-origin");
    this.$input.after(this.originalMarker);
    this.appliedValue = this.$input.val();
    this.editStartValue = this.appliedValue;
    $.intelDom.setAttribute(this.$input[0], "data-value", this.appliedValue == null ? "" : this.appliedValue);

    this.options.layout.mode = normalizeLayoutMode(this.options.layout.mode);
    if (this.options.layout.mode === "joined-row") {
      this.options.behavior.maxFields = Math.min(Number(this.options.behavior.maxFields) || 5, 5);
    }

    this._build();
    this._bind();
    this._setInitialMode();
    this.setDisabled(this.options.behavior.disabled || this.original.disabled);
    this._emit("init", { instance: this }, "onInit");
  }

  IntelField.prototype._build = function () {
    if (!this.$group || !this.$group.length) {
      this.$group = $.intelDom.wrap(this.$input, "div", { "class": "intel-field-group" });
    }

    this.$main = $.intelDom.wrap(this.$input, "div", { "class": "intel-field__main" });
    var $row = $.intelDom.wrap(this.$main, "div", { "class": "intel-field__row" });
    this.$item = $.intelDom.wrap($row, "div", { "class": "intel-field__item" });
    if (!this.$item.parent().is(this.$group)) {
      this.$item.appendTo(this.$group);
    }
    this.$input.addClass("intel-field__input").attr("autocomplete", this.$input.attr("autocomplete") || "off");

    this._applyAppearance();
    this._renderControls();
    this._renderMenu();
    updateGroupState(this.$group);
  };

  IntelField.prototype._renderControls = function () {
    var behavior = this.options.behavior;
    this.$actions = $.intelDom.create("div", { "class": "intel-field__actions" });
    this.$outerActions = $.intelDom.create("div", { "class": "intel-field__outer-actions" });

    if (behavior.allowSelect) {
      this.$actions.append(this._button("select"));
    }
    if (behavior.allowOpen) {
      this.$actions.append(this._button("open"));
    }
    if (behavior.allowEdit) {
      this.$actions.append(this._button("edit"));
    }
    if (behavior.allowApply) {
      this.$actions.append(this._button("apply"));
    }
    if (behavior.allowClear) {
      this.$actions.append(this._button("clear"));
    }
    if (behavior.allowPrepend) {
      this.$actions.append(this._button("prepend"));
    }
    if (behavior.allowRemove) {
      (this.options.layout.mode === "joined-row" ? this.$actions : this.$outerActions).append(this._button("remove"));
    }
    if (behavior.allowAdd) {
      (this.options.layout.mode === "joined-row" ? this.$actions : this.$outerActions).append(this._button("add"));
    }

    if (this.$actions.children().length) {
      this.$main.append(this.$actions);
    }
    if (this.$outerActions.children().length) {
      this.$item.find(".intel-field__row").append(this.$outerActions);
    }

    this.$item.toggleClass("intel-field__item--outer-in-view", behavior.outerControlsInView);
  };

  IntelField.prototype._button = function (action) {
    var config = this.options.buttons[action] || {};
    return $.intelDom.create("button", {
      type: "button",
      "class": "intel-field__button intel-field__button--" + action,
      "data-action": action,
      title: config.title || action,
      "aria-label": config.title || action,
      "aria-expanded": action === "select" ? "false" : null
    }, $.intelDom.create("span", {
      "class": "intel-field__icon",
      "aria-hidden": "true",
      text: config.icon || ""
    }));
  };

  IntelField.prototype._getItems = function () {
    var items = $.isFunction(this.options.items) ? this.options.items.call(this.$input[0], this) : this.options.items;
    return $.isArray(items) ? items : [];
  };

  IntelField.prototype._renderMenu = function () {
    var self = this;
    var items = this._getItems();
    var menuId = "intel-field-menu-" + this.id;
    this.$searchEmpty = null;

    this.$menu = $.intelDom.create("ul", {
      "class": "intel-field__menu",
      id: menuId,
      role: "listbox",
      "aria-label": this.options.buttons.select.title
    });

    if (!items.length) {
      this.$menu.append($.intelDom.create("li", {
        "class": "intel-field__empty",
        text: this.options.emptyText
      }));
    } else {
      $.each(items, function (index, item) {
        var $option = $.intelDom.create("li", {
          "class": "intel-field__option",
          role: "option",
          tabindex: "-1",
          "data-index": index
        });
        $option.append($.intelDom.create("span", {
          "class": "intel-field__option-label",
          text: self.options.itemLabel.call(self.$input[0], item, index)
        }));
        $option.append($.intelDom.create("span", {
          "class": "intel-field__option-text",
          text: self.options.itemText.call(self.$input[0], item, index)
        }));
        self.$menu.append($option);
      });

      this.$searchEmpty = $.intelDom.create("li", {
        "class": "intel-field__empty intel-field__search-empty",
        text: this.options.search.noResultsText
      }).hide();
      this.$menu.append(this.$searchEmpty);
    }

    this.$main.append(this.$menu);
    this.$input.attr({
      "aria-controls": menuId,
      "aria-haspopup": "listbox"
    });
  };

  IntelField.prototype._applyAppearance = function () {
    var appearance = this.options.appearance;
    var layout = this.options.layout;
    var managedClasses = [
      "intel-field-group--dark",
      "intel-field-group--light",
      "intel-field-group--small",
      "intel-field-group--medium",
      "intel-field-group--large",
      "intel-field-group--layout-joined-row",
      "intel-field-group--layout-separate-row",
      "intel-field-group--layout-separate-column",
      "intel-field-group--search"
    ].join(" ");
    var previousAppearanceClass = this.$group.data("intelFieldAppearanceClass") || "";

    this.$group
      .addClass("intel-field-group")
      .removeClass(managedClasses)
      .removeClass(previousAppearanceClass)
      .addClass("intel-field-group--" + appearance.theme)
      .addClass("intel-field-group--" + appearance.size)
      .addClass("intel-field-group--layout-" + normalizeLayoutMode(layout.mode))
      .toggleClass("intel-field-group--search", Boolean(this.options.search.enabled));

    if (appearance.className) {
      this.$group.addClass(appearance.className);
    }
    this.$group.data("intelFieldAppearanceClass", appearance.className || "");

    var variables = {
      "--intel-field-accent": appearance.accentColor,
      "--intel-field-bg": appearance.backgroundColor,
      "--intel-field-text": appearance.textColor,
      "--intel-field-border": appearance.borderColor,
      "--intel-field-radius": appearance.borderRadius,
      "--intel-field-columns": Math.max(1, Math.min(Number(layout.columns) || 5, 5))
    };
    $.each(variables, function (name, value) {
      if (value !== null && value !== undefined && value !== "") {
        this.$group[0].style.setProperty(name, value);
      } else {
        this.$group[0].style.removeProperty(name);
      }
    }.bind(this));
  };

  IntelField.prototype._bind = function () {
    var self = this;

    this.$item.on("click" + this.namespace, "[data-action]", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (self.$item.hasClass("intel-field__item--disabled")) {
        return;
      }
      self._handleAction($(this).data("action"));
    });

    this.$item.on("dblclick" + this.namespace, function (event) {
      if (!self.options.behavior.editOnDblClick || self.$item.hasClass("intel-field__item--disabled")) {
        return;
      }
      if ($(event.target).closest(".intel-field__menu, .intel-field__button").length) {
        return;
      }
      event.preventDefault();
      self.setMode("edit", true);
      if (self.options.behavior.openOnDblClick) {
        self.open();
      }
    });

    this.$item.on("click" + this.namespace, ".intel-field__option", function (event) {
      event.preventDefault();
      event.stopPropagation();
      self.select(Number($(this).attr("data-index")));
    });

    this.$input.on("input" + this.namespace, function () {
      self.$input.attr("data-value", self.$input.val() == null ? "" : self.$input.val());
      self.$item.removeClass("intel-field__item--invalid");
      if (self.options.search.enabled) {
        self.search(self.value());
      }
      self._emit("input", { value: self.value(), instance: self }, "onInput");
    });

    this.$input.on("focus" + this.namespace, function () {
      if (self.blurTimer) {
        clearTimeout(self.blurTimer);
        self.blurTimer = null;
      }
      if (self.options.search.enabled && self.options.search.openOnFocus) {
        self.search(self.value());
      }
    });

    this.$input.on("blur" + this.namespace, function () {
      if (!self.options.behavior.autoSaveOnBlur) {
        return;
      }
      self.blurTimer = setTimeout(function () {
        self.blurTimer = null;
        if (self.destroyed || self.$item.hasClass("intel-field__item--disabled")) {
          return;
        }
        var activeElement = document.activeElement;
        if (activeElement && (activeElement === self.$item[0] || $.contains(self.$item[0], activeElement))) {
          return;
        }
        self.close();
        if (self.save("blur") && self.options.behavior.editOnDblClick && self.options.behavior.viewOnBlur) {
          self.setMode("view");
        }
      }, 0);
    });

    this.$item.on("click" + this.namespace, function (event) {
      event.stopPropagation();
    });

    this.$menu.on("focusin" + this.namespace, ".intel-field__option", function () {
      self.$menu.find(".intel-field__option").removeClass("intel-field__option--active");
      $(this).addClass("intel-field__option--active");
    });

    this.$input.on("keydown" + this.namespace, function (event) {
      self._handleKeydown(event);
    });

    this.$menu.on("keydown" + this.namespace, ".intel-field__option", function (event) {
      self._handleMenuKeydown(event, $(this));
    });

    $(document).on("click" + this.namespace, function () {
      if (self.options.behavior.closeOnOutsideClick) {
        self.close();
      }
    });
  };

  IntelField.prototype._handleAction = function (action) {
    var actions = {
      select: function () { this.toggle(); },
      open: function () { this.openAction(); },
      edit: function () { this.setMode("edit", true); },
      apply: function () { this.apply(); },
      clear: function () { this.clear(); },
      prepend: function () { this.add("before"); },
      remove: function () { this.remove(); },
      add: function () { this.add("after"); }
    };
    if (actions[action]) {
      actions[action].call(this);
    }
  };

  IntelField.prototype.openAction = function () {
    var payload = {
      value: this.value(),
      input: this.$input[0],
      instance: this
    };
    this._emit("actionopen", payload, "onOpenAction");
    return this;
  };

  IntelField.prototype._handleKeydown = function (event) {
    if (event.key === "ArrowDown" && this.options.behavior.allowSelect) {
      event.preventDefault();
      this.open();
      this._visibleOptions().first().trigger("focus");
      return;
    }

    if (event.key === "Enter" && this.mode === "edit" && this.options.behavior.enterApplies) {
      event.preventDefault();
      if (this.options.search.enabled && this.isOpen && this.options.search.selectFirstOnEnter) {
        var $active = this._visibleOptions().filter(".intel-field__option--active");
        var $target = $active.length ? $active.first() : this._visibleOptions().first();
        if ($target.length) {
          this.select(Number($target.attr("data-index")));
          return;
        }
      }
      this.apply();
      return;
    }

    if (event.key === "Escape") {
      if (this.isOpen) {
        this.close();
      } else if (this.options.behavior.escapeAction === "cancel" && this.mode === "edit") {
        this.value(this.editStartValue, false);
        this.setMode("view");
      }
    }
  };

  IntelField.prototype._handleMenuKeydown = function (event, $current) {
    var $options = this._visibleOptions();
    var index = $options.index($current);

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      index += event.key === "ArrowDown" ? 1 : -1;
      index = Math.max(0, Math.min(index, $options.length - 1));
      $options.eq(index).trigger("focus");
    } else if (event.key === "Enter") {
      event.preventDefault();
      this.select(Number($current.attr("data-index")));
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      this.$input.trigger("focus");
    }
  };

  IntelField.prototype._visibleOptions = function () {
    return this.$menu.find(".intel-field__option").filter(function () {
      return $(this).css("display") !== "none";
    });
  };

  IntelField.prototype._matchesSearch = function (item, query, index) {
    if ($.isFunction(this.options.search.matcher)) {
      return this.options.search.matcher.call(this.$input[0], item, query, index, this) !== false;
    }
    var label = this.options.itemLabel.call(this.$input[0], item, index);
    var text = this.options.itemText.call(this.$input[0], item, index);
    var keywords = item && item.keywords ? item.keywords : "";
    var haystack = String(label + " " + text + " " + keywords).toLocaleLowerCase();
    return haystack.indexOf(query.toLocaleLowerCase()) !== -1;
  };

  IntelField.prototype.search = function (query) {
    if (!this.options.search.enabled) {
      return this;
    }

    query = $.trim(query == null ? "" : String(query));
    var minChars = Math.max(0, Number(this.options.search.minChars) || 0);
    var items = this._getItems();
    var self = this;
    var visibleCount = 0;

    this.$menu.find(".intel-field__option").each(function () {
      var $option = $(this);
      var index = Number($option.attr("data-index"));
      var visible = query.length >= minChars && self._matchesSearch(items[index], query, index);
      $option.toggle(visible).removeClass("intel-field__option--active");
      if (visible) {
        visibleCount += 1;
      }
    });

    if (this.$searchEmpty) {
      this.$searchEmpty.toggle(query.length >= minChars && visibleCount === 0);
    }

    if (query.length >= minChars) {
      this.open();
    } else {
      this.close();
    }

    this._emit("search", {
      query: query,
      resultCount: visibleCount,
      instance: this
    }, "onSearch");
    return this;
  };

  IntelField.prototype._setInitialMode = function () {
    var mode = this.options.startMode;
    if (mode === "auto") {
      mode = this.value() ? "view" : "edit";
    }
    this.setMode(mode === "view" ? "view" : "edit");
  };

  IntelField.prototype.setMode = function (mode, focus) {
    if (mode !== "view" && mode !== "edit") {
      return this;
    }
    if (mode === "edit" && !this.options.behavior.allowEdit && this.mode !== null) {
      return this;
    }

    var previousMode = this.mode;
    this.mode = mode;
    this.close();
    this.$item
      .toggleClass("intel-field__item--view", mode === "view")
      .toggleClass("intel-field__item--edit", mode === "edit")
      .toggleClass("intel-field__item--dblclick-edit", this.options.behavior.editOnDblClick)
      .toggleClass("intel-field__item--borderless-view", this.options.behavior.borderlessView);

    if (mode === "view" && this.options.behavior.readonlyOnView) {
      this.$input.prop("readonly", true);
    } else {
      this.$input.prop("readonly", false);
      this.editStartValue = this.value();
    }

    if (focus && mode === "edit") {
      this.$input.trigger("focus");
      var input = this.$input[0];
      if (input.setSelectionRange) {
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }

    if (previousMode !== mode) {
      this._emit("modechange", { mode: mode, previousMode: previousMode, instance: this }, "onModeChange");
    }
    updateGroupState(this.$group);
    return this;
  };

  IntelField.prototype.setItems = function (items) {
    var self = this;
    this.options.items = $.isArray(items) ? items : [];
    this.close();
    if (this.$menu) {
      this.$menu.off(this.namespace).remove();
    }
    this._renderMenu();
    this.$menu.on("keydown" + this.namespace, ".intel-field__option", function (event) {
      self._handleMenuKeydown(event, $(this));
    });
    return this;
  };

  IntelField.prototype.open = function () {
    if (this.mode === "view" || this.isOpen || !this.options.behavior.allowSelect || this.$item.hasClass("intel-field__item--disabled")) {
      return this;
    }
    $(document).trigger("intelField:closeAll", [this]);
    this.isOpen = true;
    this.$item.addClass("intel-field__item--open");
    this.$actions.find('[data-action="select"]').attr("aria-expanded", "true");
    this._emit("open", { instance: this }, "onOpen");
    return this;
  };

  IntelField.prototype.close = function () {
    if (!this.isOpen) {
      return this;
    }
    this.isOpen = false;
    this.$item.removeClass("intel-field__item--open");
    this.$actions.find('[data-action="select"]').attr("aria-expanded", "false");
    this._emit("close", { instance: this }, "onClose");
    return this;
  };

  IntelField.prototype.toggle = function () {
    return this.isOpen ? this.close() : this.open();
  };

  IntelField.prototype.select = function (index) {
    var item = this._getItems()[index];
    if (item === undefined) {
      return this;
    }
    var value = this.options.valueFormatter.call(this.$input[0], item, index, this);
    this.value(value, true);
    this._emit("select", { item: item, index: index, value: value, instance: this }, "onSelect");
    if (this.options.behavior.applyOnSelect) {
      this.apply(item, "select");
    } else {
      if (this.options.behavior.autoSaveOnSelect) {
        this.save("select", item);
      }
      this.close();
      this.$input.trigger("focus");
    }
    return this;
  };

  IntelField.prototype._isValid = function (value) {
    var valid = !this.options.behavior.requireValue || $.trim(value) !== "";
    if (valid && $.isFunction(this.options.validate)) {
      valid = this.options.validate.call(this.$input[0], value, this) !== false;
    }
    return valid;
  };

  IntelField.prototype.save = function (source, selectedItem) {
    var value = this.value();
    if (value === this.appliedValue) {
      return true;
    }

    if (!this._isValid(value)) {
      this.$item.addClass("intel-field__item--invalid");
      this._emit("invalid", { value: value, source: source || "api", instance: this }, "onInvalid");
      return false;
    }

    this.$item.removeClass("intel-field__item--invalid");
    var previousValue = this.appliedValue;
    this.appliedValue = value;
    this.editStartValue = value;
    this._emit("save", {
      value: value,
      previousValue: previousValue,
      source: source || "api",
      item: selectedItem,
      instance: this
    }, "onSave");
    return true;
  };

  IntelField.prototype.apply = function (selectedItem, source) {
    if (!this.save(source || "apply", selectedItem)) {
      this.$input.trigger("focus");
      return false;
    }

    var value = this.value();
    this.setMode("view");
    this._emit("apply", {
      value: value,
      source: source || "apply",
      item: selectedItem,
      instance: this
    }, "onApply");
    return true;
  };

  IntelField.prototype.clear = function () {
    this.value("", true);
    this.close();
    if (this.mode === "edit") {
      this.$input.trigger("focus");
    }
    return this;
  };

  IntelField.prototype.value = function (value, notify) {
    if (arguments.length === 0) {
      return this.$input.val();
    }
    var previousValue = this.$input.val();
    this.$input.val(value == null ? "" : value);
    this.$input.attr("data-value", this.$input.val());
    if (notify !== false && previousValue !== this.$input.val()) {
      this.$input.trigger("change");
      this._emit("change", { value: this.$input.val(), previousValue: previousValue, instance: this }, "onChange");
    }
    return this;
  };

  IntelField.prototype.add = function (position) {
    var behavior = this.options.behavior;
    var instances = this._groupInstances();
    if (instances.length >= behavior.maxFields) {
      return null;
    }

    var $newInput = $.intelDom.create("input", {
      type: this.$input.attr("type") || "text",
      name: this.$input.attr("name"),
      placeholder: this.$input.attr("placeholder"),
      "class": this.original.className,
      value: ""
    });
    $.each(this.$input[0].attributes, function (_, attribute) {
      if (attribute.name.indexOf("data-") === 0) {
        $newInput.attr(attribute.name, attribute.value);
      }
    });
    var newOptions = $.extend(true, {}, this.options, { startMode: "edit" });
    var newInstance = new IntelField($newInput, newOptions, this.$group);
    $newInput.data(dataKey, newInstance);

    if (position === "before") {
      newInstance.$item.insertBefore(this.$item);
    } else {
      newInstance.$item.insertAfter(this.$item);
    }

    updateGroupState(this.$group);

    if (behavior.focusNewField) {
      newInstance.$input.trigger("focus");
    }
    this._emit("add", { position: position, input: $newInput[0], instance: newInstance, source: this }, "onAdd");
    return newInstance;
  };

  IntelField.prototype.remove = function () {
    var instances = this._groupInstances();
    var behavior = this.options.behavior;
    if (instances.length <= behavior.minFields) {
      if (behavior.removeLast === "clear") {
        this.clear();
        this.setMode("edit", true);
      }
      return false;
    }

    var payload = { value: this.value(), input: this.$input[0], instance: this };
    this._emit("remove", payload, "onRemove");
    var $group = this.$group;
    this.destroy(true);
    this.$item.remove();
    updateGroupState($group);
    return true;
  };

  IntelField.prototype._groupInstances = function () {
    var instances = [];
    this.$group.find(".intel-field__input").each(function () {
      var instance = $(this).data(dataKey);
      if (instance) {
        instances.push(instance);
      }
    });
    return instances;
  };

  IntelField.prototype.setDisabled = function (disabled) {
    disabled = Boolean(disabled);
    this.options.behavior.disabled = disabled;
    this.$input.prop("disabled", disabled);
    this.$item.toggleClass("intel-field__item--disabled", disabled);
    this.$item.find(".intel-field__button").prop("disabled", disabled);
    updateGroupState(this.$group);
    if (disabled) {
      this.close();
    }
    return this;
  };

  IntelField.prototype.setTheme = function (theme) {
    this.options.appearance.theme = theme === "light" ? "light" : "dark";
    this._applyAppearance();
    updateGroupState(this.$group);
    return this;
  };

  IntelField.prototype.refresh = function () {
    this.close();
    this.$actions.remove();
    this.$outerActions.remove();
    this.$menu.remove();
    this._applyAppearance();
    this._renderControls();
    this._renderMenu();
    this.setMode(this.mode || "edit");
    this.setDisabled(this.options.behavior.disabled);
    updateGroupState(this.$group);
    return this;
  };

  IntelField.prototype.option = function (name, value) {
    if (arguments.length === 0) {
      return $.extend(true, {}, this.options);
    }
    if (typeof name === "string" && arguments.length === 1) {
      return this._getOption(name);
    }
    if (typeof name === "object") {
      this.options = mergeOptions(this.options, name);
    } else {
      this._setOption(name, value);
    }
    return this.refresh();
  };

  IntelField.prototype._getOption = function (path) {
    return path.split(".").reduce(function (current, key) {
      return current == null ? undefined : current[key];
    }, this.options);
  };

  IntelField.prototype._setOption = function (path, value) {
    var keys = path.split(".");
    var target = this.options;
    $.each(keys.slice(0, -1), function (_, key) {
      target[key] = target[key] || {};
      target = target[key];
    });
    target[keys[keys.length - 1]] = value;
  };

  IntelField.prototype._emit = function (name, payload, callbackName) {
    this.$input.trigger("intelfield:" + name, [payload]);
    if ($.isFunction(this.options[callbackName])) {
      this.options[callbackName].call(this.$input[0], payload, this);
    }
  };

  IntelField.prototype.destroy = function (preserveItem) {
    if (this.destroyed) {
      return;
    }
    this.close();
    this.destroyed = true;
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
      this.blurTimer = null;
    }
    this.$item.off(this.namespace);
    this.$input.off(this.namespace).removeData(dataKey);
    this.$menu.off(this.namespace);
    $(document).off(this.namespace);

    if (preserveItem) {
      return;
    }

    var $group = this.$group;
    this.$input
      .attr("class", this.original.className)
      .prop("readonly", this.original.readonly)
      .prop("disabled", this.original.disabled)
      .removeAttr("aria-controls aria-haspopup");
    if (this.originalMarker && this.originalMarker.parentNode) {
      $(this.originalMarker).before(this.$input);
      $(this.originalMarker).remove();
    } else {
      $group.before(this.$input);
    }
    this.$item.remove();
    if (!$group.find(".intel-field__item").length) {
      $group.remove();
    }
  };

  $(document).on("intelField:closeAll", function (_, except) {
    $(".intel-field__input").each(function () {
      var instance = $(this).data(dataKey);
      if (instance && instance !== except) {
        instance.close();
      }
    });
  });

  $.fn[pluginName] = function (option) {
    var args = Array.prototype.slice.call(arguments, 1);
    var returnValue = this;
    var hasReturnValue = false;
    var $sharedGroup = null;
    var isInitialization = typeof option === "object" || option === undefined;
    var requestedLayout = option && option.layout ? option.layout : {};
    var layoutMode = normalizeLayoutMode(requestedLayout.mode);

    if (isInitialization && this.length > 1 && requestedLayout.groupInputs) {
      if (layoutMode === "joined-row" && this.length > 5) {
        throw new Error("intelField joined-row layout supports from 1 to 5 inputs");
      }
      $sharedGroup = $.intelDom.create("div", { "class": "intel-field-group" });
      $sharedGroup.insertBefore(this.first());
    }

    this.each(function () {
      var $element = $(this);
      var instance = $element.data(dataKey);

      if (!instance && (typeof option === "object" || option === undefined)) {
        instance = new IntelField(this, option || {}, $sharedGroup);
        $element.data(dataKey, instance);
        updateGroupState(instance.$group);
      } else if (instance && typeof option === "object") {
        instance.option(option);
      }

      if (instance && typeof option === "string") {
        if (option.charAt(0) === "_" || !$.isFunction(instance[option])) {
          throw new Error("Unknown intelField method: " + option);
        }
        var result = instance[option].apply(instance, args);
        if (result !== instance && result !== undefined && !hasReturnValue) {
          returnValue = result;
          hasReturnValue = true;
          return false;
        }
      }
    });

    return returnValue;
  };

  $.fn[pluginName].defaults = defaults;
  $.fn[pluginName].Constructor = IntelField;

  return IntelField;
}));
