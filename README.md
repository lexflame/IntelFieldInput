# intelField

`intelField` is a configurable jQuery plugin that turns a regular text input
into an editable field with a dropdown and optional controls for managing a
group of inputs.

## Layout modes

Initialize several inputs as one group by selecting them together and setting
`layout.groupInputs` to `true`.

```js
$(".route-field").intelField({
  layout: {
    mode: "joined-row",
    groupInputs: true,
    columns: 5
  },
  behavior: {
    minFields: 1,
    maxFields: 5
  }
});
```

Available modes:

- `joined-row`: 1-5 input segments look like one control with separators.
- `separate-row`: separate controls in one horizontal wrapping block.
- `separate-column`: separate controls stacked vertically.

`columns` controls the preferred number of columns for `separate-row`.
The horizontal layouts adapt on narrow screens.

### Double-click editing

```js
$(".joined-field").intelField({
  startMode: "view",
  layout: { mode: "joined-row", groupInputs: true },
  behavior: {
    allowAdd: false,
    allowRemove: false,
    editOnDblClick: true,
    viewOnBlur: true,
    borderlessView: true
  }
});
```

The field stays borderless and readonly until double-clicked. Selection or
focus loss saves the value and returns it to view mode.

`borderlessView` is disabled by default and should be enabled explicitly only
for controls whose surrounding layout provides the required background.

## AJAX items

Load `jquery.intel-field.ajax.js` after the core plugin. It adds remote item
loading, debounce, request cancellation, caching, and response transformation.

```js
$("#remote-project").intelField({
  search: { enabled: true, minChars: 2 },
  ajax: {
    enabled: true,
    url: "/api/projects",
    method: "GET",
    queryParam: "q",
    delay: 250,
    cache: true,
    localFilter: false,
    transformResponse: function (response) {
      return response.items;
    }
  }
});
```

Methods: `loadItems(query, data)`, `reloadItems(query, data)`, and
`abortLoad()`. Events: `ajaxloadstart`, `ajaxload`, `ajaxerror`, and
`ajaxloadend`, all with the `intelfield:` prefix.

## PHP framework connectors

Load `jquery.intel-field.connectors.js` after the AJAX module. It includes
`bitrix`, `laravel`, `codeigniter`, and `yii` adapters.

```js
$("#remote-project").intelFieldWithConnector("laravel", {
  search: { enabled: true, minChars: 2 }
}, {
  url: "/api/intel-field/projects"
});
```

Create an AJAX configuration manually when more customization is required:

```js
var ajax = $.intelFieldConnectors.create("yii", {
  url: "/project/intel-field"
});

$("#project").intelField({ ajax: ajax });
```

Connectors add conventional CSRF values and normalize these response formats:
an array, `{ items: [] }`, `{ data: [] }`, or `{ data: { items: [] } }`.

## Context search

```js
$("#person-search").intelField({
  startMode: "edit",
  items: people,
  search: {
    enabled: true,
    minChars: 1,
    openOnFocus: false,
    noResultsText: "Nothing found",
    selectFirstOnEnter: true,
    matcher: function (item, query) {
      return item.text.toLowerCase().includes(query.toLowerCase());
    }
  }
});
```

By default search checks the item label, text, and optional `keywords` value.
It publishes `intelfield:search` and calls `onSearch` with `query` and
`resultCount`.

## Include

```html
<link rel="stylesheet" href="jquery.intel-field.css">
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="jquery.intel-field.js"></script>
```

Optional remote-data modules:

```html
<script src="jquery.intel-field.ajax.js"></script>
<script src="jquery.intel-field.connectors.js"></script>
<script src="jquery.intel-field.node.js"></script>
<script src="jquery.intel-field.vue.js"></script>
<link rel="stylesheet" href="jquery.intel-field.datetime.css">
<script src="jquery.intel-field.datetime.js"></script>
```

See `NODE_VUE_CONNECTORS.md` for Node.js API and Vue 3 integration examples.

## Date and time pickers

The optional date/time module adds a themed calendar and a sequential clock
picker. Load its CSS and JavaScript after the core plugin.

```js
$("#date").intelFieldDate({
  appearance: { theme: "light", accentColor: "#7c3aed" },
  picker: {
    locale: "ru-RU",
    format: "DD.MM.YYYY",
    min: "01.01.2026",
    max: "31.12.2027"
  }
});

$("#time").intelFieldTime({
  picker: {
    initialTime: "12:00",
    minuteStep: 5
  }
});
```

Date selection emits `intelfield:dateselect`; completed time selection emits
`intelfield:timeselect`. Both update the input and use the standard `save()`
flow with sources `date` and `time`.

```html
<input id="project" name="project[]" placeholder="Select a project">
```

```js
$("#project").intelField({
  items: [
    { label: "Project:", text: "Website", value: "website" },
    { label: "Project:", text: "Mobile app", value: "mobile" }
  ],
  behavior: {
    applyOnSelect: true,
    maxFields: 5
  },
  appearance: {
    theme: "dark",
    size: "medium",
    accentColor: "#6574e8"
  }
});
```

## Main options

- `items`: array or function returning dropdown item objects.
- `startMode`: `auto`, `view`, or `edit`.
- `emptyText`: text shown when `items` is empty.
- `layout`: group mode, collection grouping, and preferred column count.
- `search`: contextual filtering and keyboard selection settings.
- `behavior`: enables actions and changes input behavior.
- `appearance`: theme, size, custom class, colors, and border radius.
- `buttons`: icon and title for every control.
- `valueFormatter(item)`: creates the input value from a selected item.
- `itemLabel(item)` and `itemText(item)`: format dropdown columns.
- `validate(value, instance)`: return `false` to reject apply.

### Behavior options

`allowSelect`, `allowEdit`, `allowApply`, `allowClear`, `allowAdd`,
`allowPrepend`, `allowRemove`, `applyOnSelect`, `readonlyOnView`,
`outerControlsInView`, `closeOnOutsideClick`, `enterApplies`, `escapeAction`,
`autoSaveOnSelect`, `autoSaveOnBlur`, `minFields`, `maxFields`, `removeLast`,
`focusNewField`, `editOnDblClick`, `viewOnBlur`, `borderlessView`,
`requireValue`, and `disabled`.

## Automatic saving

Automatic saving is enabled by default for selection and focus loss. It saves
only when the value differs from the last saved value.

```js
$("#project").intelField({
  behavior: {
    autoSaveOnSelect: true,
    autoSaveOnBlur: true,
    applyOnSelect: false
  },
  onSave: function (event) {
    console.log(event.value, event.previousValue, event.source);
  }
});
```

`event.source` is `select`, `blur`, `apply`, or `api`. `save()` does not change
the edit/view mode. `apply()` saves and then switches the field to view mode.

### Appearance options

- `theme`: `dark` or `light`.
- `size`: `small`, `medium`, or `large`.
- `className`: extra class for the generated group.
- `accentColor`, `backgroundColor`, `textColor`, `borderColor`.
- `borderRadius`: any valid CSS length.

## Methods

```js
var $field = $("#project").intelField(options);

$field.intelField("value");
$field.intelField("value", "Project: Website");
$field.intelField("setMode", "edit", true);
$field.intelField("open");
$field.intelField("close");
$field.intelField("save", "api");
$field.intelField("add", "after");
$field.intelField("remove");
$field.intelField("setDisabled", true);
$field.intelField("setTheme", "light");
$field.intelField("option", "appearance.theme", "light");
$field.intelField("option", { behavior: { allowClear: false } });
$field.intelField("refresh");
$field.intelField("destroy");
```

## Events and callbacks

Every callback also has a jQuery event with the `intelfield:` prefix:

`init`, `input`, `change`, `select`, `save`, `apply`, `modechange`, `add`, `remove`,
`open`, `close`, and `invalid`.

```js
$("#project").on("intelfield:select", function (event, data) {
  console.log(data.item, data.value);
});
```

The matching callback option is named `onSelect`, `onApply`, `onAdd`, and so
on. See `intelField.html` for complete examples.
