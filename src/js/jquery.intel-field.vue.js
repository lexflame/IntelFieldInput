/* jquery.intelField.vue.js | Vue 3 component and directive connector */
(function (factory) {
  if (typeof define === "function" && define.amd) {
    define(["jquery"], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory(require("jquery"));
  } else {
    window.IntelFieldVue = factory(window.jQuery);
  }
}(function ($) {
  "use strict";

  if (!$ || !$.fn.intelField) {
    throw new Error("intelField Vue connector requires jquery.intel-field.js");
  }

  var vueInstanceCounter = 0;
  var directiveDataKey = "intelFieldVueDirective";
  var forwardedEvents = [
    "input",
    "change",
    "select",
    "save",
    "apply",
    "search",
    "open",
    "close",
    "invalid",
    "ajaxloadstart",
    "ajaxload",
    "ajaxerror",
    "ajaxloadend"
  ];

  function cloneOptions(options) {
    return $.extend(true, {}, options || {});
  }

  function eventName(name) {
    return "intelfield:" + name;
  }

  function dispatchNative(element, name, detail) {
    var event;
    if (typeof window.CustomEvent === "function") {
      event = new window.CustomEvent("intel-field-" + name, {
        bubbles: true,
        detail: detail
      });
    } else {
      event = document.createEvent("CustomEvent");
      event.initCustomEvent("intel-field-" + name, true, false, detail);
    }
    element.dispatchEvent(event);
  }

  function directiveOptions(binding) {
    var value = binding && binding.value;
    if (value && value.options) {
      return value.options;
    }
    return value || {};
  }

  function directiveModelValue(binding) {
    var value = binding && binding.value;
    return value && Object.prototype.hasOwnProperty.call(value, "modelValue") ? value.modelValue : undefined;
  }

  function bindDirectiveEvents(element, state, binding) {
    var $element = state.$element;
    $.each(forwardedEvents, function (_, name) {
      $element.on(eventName(name) + state.namespace, function (event, payload) {
        if (name === "change") {
          element.dispatchEvent(new window.Event("input", { bubbles: true }));
        }
        dispatchNative(element, name, payload);
        var value = state.binding && state.binding.value;
        if (value && $.isFunction(value.onEvent)) {
          value.onEvent(name, payload, element);
        }
        if (value && name === "save" && $.isFunction(value.onSave)) {
          value.onSave(payload, element);
        }
      });
    });
  }

  var directive = {
    mounted: function (element, binding) {
      if (!element || String(element.tagName).toLowerCase() !== "input") {
        throw new Error("v-intel-field must be used on an input element");
      }
      var state = {
        $element: $(element),
        namespace: ".intelFieldVueDirective" + (++vueInstanceCounter),
        binding: binding
      };
      element[directiveDataKey] = state;
      var modelValue = directiveModelValue(binding);
      if (modelValue !== undefined) {
        state.$element.val(modelValue == null ? "" : modelValue);
      }
      state.$element.intelField(cloneOptions(directiveOptions(binding)));
      bindDirectiveEvents(element, state, binding);
    },
    updated: function (element, binding) {
      var state = element[directiveDataKey];
      if (!state) {
        return;
      }
      state.binding = binding;
      var modelValue = directiveModelValue(binding);
      if (modelValue !== undefined && state.$element.intelField("value") !== String(modelValue == null ? "" : modelValue)) {
        state.$element.intelField("value", modelValue, false);
      }
      if (binding.value !== binding.oldValue) {
        state.$element.intelField("option", cloneOptions(directiveOptions(binding)));
      }
    },
    beforeUnmount: function (element) {
      var state = element[directiveDataKey];
      if (!state) {
        return;
      }
      state.$element.off(state.namespace);
      state.$element.intelField("destroy");
      delete element[directiveDataKey];
    }
  };

  function createComponent(VueApi, installOptions) {
    return {
      name: "IntelField",
      inheritAttrs: false,
      props: {
        modelValue: {
          type: [String, Number],
          default: ""
        },
        options: {
          type: Object,
          default: function () { return {}; }
        },
        name: { type: String, default: null },
        type: { type: String, default: "text" },
        placeholder: { type: String, default: null },
        disabled: { type: Boolean, default: false },
        autocomplete: { type: String, default: "off" }
      },
      emits: [
        "update:modelValue",
        "input",
        "change",
        "select",
        "save",
        "apply",
        "search",
        "open",
        "close",
        "invalid",
        "ajaxloadstart",
        "ajaxload",
        "ajaxerror",
        "ajaxloadend"
      ],
      data: function () {
        return {
          intelFieldNamespace: ".intelFieldVueComponent" + (++vueInstanceCounter),
          intelFieldReady: false,
          syncingModel: false
        };
      },
      mounted: function () {
        var self = this;
        var $input = $(this.$refs.input);
        var options = $.extend(true, {}, installOptions.defaults || {}, this.options || {});
        options.behavior = $.extend({}, options.behavior || {}, { disabled: this.disabled });
        $input.val(this.modelValue == null ? "" : this.modelValue);
        $input.intelField(options);
        $.each(forwardedEvents, function (_, name) {
          $input.on(eventName(name) + self.intelFieldNamespace, function (event, payload) {
            var value = $input.intelField("value");
            if (name === "input" || name === "change") {
              self.syncingModel = true;
              self.$emit("update:modelValue", value);
              self.syncingModel = false;
            }
            self.$emit(name, payload);
          });
        });
        this.intelFieldReady = true;
      },
      beforeUnmount: function () {
        if (!this.intelFieldReady) {
          return;
        }
        var $input = $(this.$refs.input);
        $input.off(this.intelFieldNamespace);
        $input.intelField("destroy");
        this.intelFieldReady = false;
      },
      watch: {
        modelValue: function (value) {
          if (!this.intelFieldReady || this.syncingModel) {
            return;
          }
          var normalized = value == null ? "" : String(value);
          var $input = $(this.$refs.input);
          if ($input.intelField("value") !== normalized) {
            $input.intelField("value", normalized, false);
          }
        },
        options: {
          deep: true,
          handler: function (value) {
            if (this.intelFieldReady) {
              $(this.$refs.input).intelField("option", cloneOptions(value));
            }
          }
        },
        disabled: function (value) {
          if (this.intelFieldReady) {
            $(this.$refs.input).intelField("setDisabled", value);
          }
        }
      },
      methods: {
        getInstance: function () {
          return this.intelFieldReady ? $(this.$refs.input).data("plugin_intelField") : null;
        },
        call: function (method) {
          var args = Array.prototype.slice.call(arguments, 1);
          return $(this.$refs.input).intelField.apply($(this.$refs.input), [method].concat(args));
        }
      },
      render: function () {
        return VueApi.h("input", $.extend({}, this.$attrs, {
          ref: "input",
          type: this.type,
          name: this.name,
          placeholder: this.placeholder,
          autocomplete: this.autocomplete,
          disabled: this.disabled,
          value: this.modelValue
        }));
      }
    };
  }

  var plugin = {
    install: function (app, options) {
      options = options || {};
      var VueApi = options.Vue || (typeof window !== "undefined" ? window.Vue : null);
      if (!VueApi || !$.isFunction(VueApi.h)) {
        throw new Error("IntelFieldVue requires the Vue 3 runtime API");
      }
      app.component(options.componentName || "IntelField", createComponent(VueApi, options));
      app.directive(options.directiveName || "intel-field", directive);
    },
    directive: directive,
    createComponent: createComponent
  };

  return plugin;
}));
