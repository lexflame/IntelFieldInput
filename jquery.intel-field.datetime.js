/* jquery.intelField.datetime.js | themed date and clock pickers */
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
    throw new Error("intelField date/time requires jquery.intel-field.js");
  }

  var dataKey = "plugin_intelField";
  var pickerCounter = 0;
  var dateDefaults = {
    locale: "ru-RU",
    format: "DD.MM.YYYY",
    weekStartsOn: 1,
    min: null,
    max: null,
    initialDate: null,
    closeOnSelect: true,
    saveOnSelect: true,
    readonlyInput: true,
    todayText: "Сегодня",
    buttons: {
      select: { icon: "▣", title: "Открыть календарь" }
    }
  };
  var timeDefaults = {
    format: "HH:mm",
    minuteStep: 5,
    initialTime: null,
    closeOnSelect: true,
    saveOnSelect: true,
    readonlyInput: true,
    hourText: "Выберите час",
    minuteText: "Выберите минуты",
    buttons: {
      select: { icon: "◷", title: "Открыть выбор времени" }
    }
  };

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function validDate(date) {
    return date instanceof Date && !Number.isNaN(date.getTime());
  }

  function dateOnly(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function parseDate(value, format) {
    if (validDate(value)) {
      return dateOnly(value);
    }
    if (!value) {
      return null;
    }
    var text = String(value).trim();
    var match;
    if (format === "YYYY-MM-DD") {
      match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
      return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
    }
    match = /^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/.exec(text);
    return match ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])) : null;
  }

  function formatDate(date, format) {
    return String(format || "DD.MM.YYYY")
      .replace("YYYY", date.getFullYear())
      .replace("MM", pad(date.getMonth() + 1))
      .replace("DD", pad(date.getDate()));
  }

  function parseTime(value) {
    if (value && typeof value === "object" && value.hour != null) {
      return {
        hour: clamp(Number(value.hour) || 0, 0, 23),
        minute: clamp(Number(value.minute) || 0, 0, 59)
      };
    }
    var match = /^(\d{1,2}):(\d{1,2})$/.exec(String(value || "").trim());
    if (!match) {
      return null;
    }
    return {
      hour: clamp(Number(match[1]), 0, 23),
      minute: clamp(Number(match[2]), 0, 59)
    };
  }

  function formatTime(time) {
    return pad(time.hour) + ":" + pad(time.minute);
  }

  function coreOptions(options, pickerOptions) {
    return $.extend(true, {
      startMode: "edit",
      items: [],
      behavior: {
        allowSelect: true,
        allowEdit: false,
        allowApply: false,
        allowClear: true,
        allowAdd: false,
        allowPrepend: false,
        allowRemove: false,
        applyOnSelect: false,
        autoSaveOnBlur: true
      },
      buttons: {
        select: pickerOptions.buttons.select
      }
    }, options || {});
  }

  function Picker(instance, type, options) {
    this.id = ++pickerCounter;
    this.instance = instance;
    this.type = type;
    this.options = options;
    this.namespace = ".intelFieldPicker" + this.id;
    this.$panel = null;
    this.selectedDate = null;
    this.viewDate = null;
    this.time = null;
    this.timeStep = "hour";
    this._init();
  }

  Picker.prototype._init = function () {
    var value = this.instance.value();
    this.instance.$group.addClass("intel-field-group--picker intel-field-group--picker-" + this.type);
    this.instance.$menu.addClass("intel-field__menu--picker").empty();
    this.$panel = $("<li>", {
      "class": "intel-field-picker intel-field-picker--" + this.type
    });
    this.instance.$menu.append(this.$panel);

    if (this.options.readonlyInput) {
      this.instance.$input.prop("readonly", true).attr("inputmode", "none");
    }

    if (this.type === "date") {
      this.selectedDate = parseDate(value, this.options.format) || parseDate(this.options.initialDate, this.options.format);
      this.viewDate = this.selectedDate || dateOnly(new Date());
      this._renderCalendar();
    } else {
      this.time = parseTime(value) || parseTime(this.options.initialTime) || { hour: 12, minute: 0 };
      this._renderClock();
    }
    this._bind();
  };

  Picker.prototype._bind = function () {
    var self = this;
    this.$panel.on("click" + this.namespace, "[data-picker-action]", function (event) {
      event.preventDefault();
      event.stopPropagation();
      var $target = $(this);
      var action = $target.attr("data-picker-action");
      if (action === "previous-month") {
        self.viewDate = new Date(self.viewDate.getFullYear(), self.viewDate.getMonth() - 1, 1);
        self._renderCalendar();
      } else if (action === "next-month") {
        self.viewDate = new Date(self.viewDate.getFullYear(), self.viewDate.getMonth() + 1, 1);
        self._renderCalendar();
      } else if (action === "today") {
        self._selectDate(dateOnly(new Date()));
      } else if (action === "date") {
        self._selectDate(new Date(Number($target.attr("data-date"))));
      } else if (action === "hour") {
        self.time.hour = Number($target.attr("data-value"));
        self.timeStep = "minute";
        self._renderClock();
      } else if (action === "minute") {
        self.time.minute = Number($target.attr("data-value"));
        self._selectTime();
      } else if (action === "show-hours") {
        self.timeStep = "hour";
        self._renderClock();
      } else if (action === "show-minutes") {
        self.timeStep = "minute";
        self._renderClock();
      }
    });
  };

  Picker.prototype._dateRange = function () {
    return {
      min: parseDate(this.options.min, this.options.format),
      max: parseDate(this.options.max, this.options.format)
    };
  };

  Picker.prototype._dateAllowed = function (date) {
    var range = this._dateRange();
    var value = dateOnly(date).getTime();
    return (!range.min || value >= dateOnly(range.min).getTime()) &&
      (!range.max || value <= dateOnly(range.max).getTime());
  };

  Picker.prototype._renderCalendar = function () {
    var locale = this.options.locale || "ru-RU";
    var year = this.viewDate.getFullYear();
    var month = this.viewDate.getMonth();
    var monthTitle = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(year, month, 1));
    var weekStart = Number(this.options.weekStartsOn) === 0 ? 0 : 1;
    var weekdays = [];
    var referenceSunday = new Date(2024, 0, 7);
    for (var weekdayIndex = 0; weekdayIndex < 7; weekdayIndex += 1) {
      var dayIndex = (weekdayIndex + weekStart) % 7;
      weekdays.push(new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(referenceSunday.getFullYear(), referenceSunday.getMonth(), referenceSunday.getDate() + dayIndex)));
    }

    var firstDay = new Date(year, month, 1);
    var offset = (firstDay.getDay() - weekStart + 7) % 7;
    var gridStart = new Date(year, month, 1 - offset);
    var today = dateOnly(new Date()).getTime();
    var selected = this.selectedDate ? dateOnly(this.selectedDate).getTime() : null;
    var days = [];
    for (var index = 0; index < 42; index += 1) {
      var date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
      var timestamp = date.getTime();
      var classes = "intel-field-calendar__day";
      if (date.getMonth() !== month) {
        classes += " intel-field-calendar__day--outside";
      }
      if (timestamp === today) {
        classes += " intel-field-calendar__day--today";
      }
      if (timestamp === selected) {
        classes += " intel-field-calendar__day--selected";
      }
      days.push($("<button>", {
        type: "button",
        "class": classes,
        "data-picker-action": "date",
        "data-date": timestamp,
        disabled: !this._dateAllowed(date),
        text: date.getDate()
      }));
    }

    this.$panel.empty().append(
      $('<div class="intel-field-calendar__header"></div>').append(
        $('<button type="button" class="intel-field-calendar__nav" data-picker-action="previous-month" aria-label="Предыдущий месяц">‹</button>'),
        $("<div>", { "class": "intel-field-calendar__title", text: monthTitle }),
        $('<button type="button" class="intel-field-calendar__nav" data-picker-action="next-month" aria-label="Следующий месяц">›</button>')
      ),
      $("<div>", { "class": "intel-field-calendar__weekdays" }).append($.map(weekdays, function (day) {
        return $("<span>", { text: day });
      })),
      $("<div>", { "class": "intel-field-calendar__grid" }).append(days),
      $("<button>", {
        type: "button",
        "class": "intel-field-calendar__today",
        "data-picker-action": "today",
        text: this.options.todayText
      })
    );
  };

  Picker.prototype._selectDate = function (date) {
    if (!validDate(date) || !this._dateAllowed(date)) {
      return;
    }
    this.selectedDate = dateOnly(date);
    this.viewDate = this.selectedDate;
    var value = formatDate(this.selectedDate, this.options.format);
    this.instance.value(value, true);
    this.instance._emit("dateselect", { date: new Date(this.selectedDate.getTime()), value: value, instance: this.instance }, "onDateSelect");
    if (this.options.saveOnSelect) {
      this.instance.save("date");
    }
    this._renderCalendar();
    if (this.options.closeOnSelect) {
      this.instance.close();
    }
  };

  Picker.prototype._clockValues = function () {
    if (this.timeStep === "hour") {
      var hours = [];
      for (var hour = 0; hour < 24; hour += 1) {
        hours.push({ value: hour, label: pad(hour), ring: hour < 12 ? "outer" : "inner" });
      }
      return hours;
    }
    var minutes = [];
    var step = clamp(Number(this.options.minuteStep) || 5, 1, 30);
    for (var minute = 0; minute < 60; minute += step) {
      minutes.push({ value: minute, label: pad(minute), ring: "outer" });
    }
    return minutes;
  };

  Picker.prototype._renderClock = function () {
    var self = this;
    var values = this._clockValues();
    var outerCount = values.filter(function (item) { return item.ring === "outer"; }).length;
    var innerCount = values.filter(function (item) { return item.ring === "inner"; }).length;
    var outerIndex = 0;
    var innerIndex = 0;
    var $dial = $('<div class="intel-field-clock__dial"></div>');
    $.each(values, function (_, item) {
      var ringCount = item.ring === "inner" ? innerCount : outerCount;
      var ringIndex = item.ring === "inner" ? innerIndex++ : outerIndex++;
      var angle = (ringIndex / ringCount) * Math.PI * 2 - Math.PI / 2;
      var radius = item.ring === "inner" ? 31 : 44;
      var left = 50 + Math.cos(angle) * radius;
      var top = 50 + Math.sin(angle) * radius;
      var activeValue = self.timeStep === "hour" ? self.time.hour : self.time.minute;
      $dial.append($("<button>", {
        type: "button",
        "class": "intel-field-clock__number intel-field-clock__number--" + item.ring + (item.value === activeValue ? " intel-field-clock__number--active" : ""),
        "data-picker-action": self.timeStep,
        "data-value": item.value,
        text: item.label
      }).css({ left: left + "%", top: top + "%" }));
    });
    $dial.append('<span class="intel-field-clock__center" aria-hidden="true"></span>');

    this.$panel.empty().append(
      $('<div class="intel-field-clock__display"></div>').append(
        $("<button>", {
          type: "button",
          "class": "intel-field-clock__display-part" + (this.timeStep === "hour" ? " is-active" : ""),
          "data-picker-action": "show-hours",
          text: pad(this.time.hour)
        }),
        '<span class="intel-field-clock__separator">:</span>',
        $("<button>", {
          type: "button",
          "class": "intel-field-clock__display-part" + (this.timeStep === "minute" ? " is-active" : ""),
          "data-picker-action": "show-minutes",
          text: pad(this.time.minute)
        })
      ),
      $("<div>", {
        "class": "intel-field-clock__hint",
        text: this.timeStep === "hour" ? this.options.hourText : this.options.minuteText
      }),
      $dial
    );
  };

  Picker.prototype._selectTime = function () {
    var value = formatTime(this.time);
    this.instance.value(value, true);
    this.instance._emit("timeselect", {
      hour: this.time.hour,
      minute: this.time.minute,
      value: value,
      instance: this.instance
    }, "onTimeSelect");
    if (this.options.saveOnSelect) {
      this.instance.save("time");
    }
    if (this.options.closeOnSelect) {
      this.instance.close();
    }
    this.timeStep = "hour";
    this._renderClock();
  };

  Picker.prototype.destroy = function () {
    if (this.$panel) {
      this.$panel.off(this.namespace);
    }
    this.instance.$group.removeClass("intel-field-group--picker intel-field-group--picker-" + this.type);
    this.instance.$input.removeAttr("inputmode");
  };

  function initialize(elements, type, options) {
    var pickerDefaults = type === "date" ? dateDefaults : timeDefaults;
    var pickerOptions = $.extend(true, {}, pickerDefaults, options && options.picker ? options.picker : {});
    var pluginOptions = coreOptions(options, pickerOptions);
    delete pluginOptions.picker;

    return elements.each(function () {
      var $input = $(this);
      $input.intelField(pluginOptions);
      var instance = $input.data(dataKey);
      if (instance.picker) {
        instance.picker.destroy();
      }
      instance.options[type + "Picker"] = pickerOptions;
      instance.picker = new Picker(instance, type, pickerOptions);
    });
  }

  $.fn.intelFieldDate = function (options) {
    return initialize(this, "date", options || {});
  };

  $.fn.intelFieldTime = function (options) {
    return initialize(this, "time", options || {});
  };

  var originalDestroy = $.fn.intelField.Constructor.prototype.destroy;
  $.fn.intelField.Constructor.prototype.destroy = function (preserveItem) {
    if (this.picker) {
      this.picker.destroy();
      this.picker = null;
    }
    return originalDestroy.call(this, preserveItem);
  };

  return Picker;
}));
