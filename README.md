# intelField

[![jQuery](https://img.shields.io/badge/jQuery-3.7%2B-0769AD?logo=jquery&logoColor=white)](https://jquery.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2017%2B-F7DF1E?logo=javascript&logoColor=000)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Vue.js](https://img.shields.io/badge/Vue.js-3-42B883?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![License](https://img.shields.io/badge/License-GPL--3.0-2C3E50)](LICENSE)

Настраиваемый набор jQuery-плагинов для интеллектуальных полей ввода,
контекстного поиска, динамических групп, выбора даты и времени, AJAX-загрузки
данных и кнопочных примитивов.

Основной плагин превращает обычный `<input>` в контрол с режимами просмотра и
редактирования, dropdown-списком, автоматическим сохранением и управлением
группой полей. Дополнительные модули подключаются независимо.

## Поддерживаемые интеграции

**PHP-фреймворки**

[![1C-Bitrix](https://img.shields.io/badge/1C--Bitrix-connector-EF3B39)](PHP_CONNECTORS.md#bitrix)
[![Laravel](https://img.shields.io/badge/Laravel-connector-FF2D20?logo=laravel&logoColor=white)](PHP_CONNECTORS.md#laravel)
[![CodeIgniter](https://img.shields.io/badge/CodeIgniter-connector-EF4223?logo=codeigniter&logoColor=white)](PHP_CONNECTORS.md#codeigniter)
[![Yii](https://img.shields.io/badge/Yii-connector-40B3D8)](PHP_CONNECTORS.md#yii)

**Node.js-фреймворки**

[![Node.js](https://img.shields.io/badge/Node.js-connector-339933?logo=nodedotjs&logoColor=white)](NODE_VUE_CONNECTORS.md#nodejs-api-connector)
[![Express](https://img.shields.io/badge/Express-connector-000000?logo=express&logoColor=white)](NODE_VUE_CONNECTORS.md#nodejs-api-connector)
[![NestJS](https://img.shields.io/badge/NestJS-connector-E0234E?logo=nestjs&logoColor=white)](NODE_VUE_CONNECTORS.md#nodejs-api-connector)
[![Fastify](https://img.shields.io/badge/Fastify-connector-000000?logo=fastify&logoColor=white)](NODE_VUE_CONNECTORS.md#nodejs-api-connector)

## Возможности

- объединение от 1 до 5 полей в один `joined-row` контрол;
- отдельные поля в строку или столбец;
- просмотр без рамки и редактирование по двойному клику;
- dropdown и контекстный поиск с клавиатурной навигацией;
- автоматическое сохранение после выбора и при потере фокуса;
- динамическое добавление и удаление полей;
- произвольные темы, размеры, цвета и иконки действий;
- AJAX-загрузка с debounce, отменой запросов и кэшем;
- коннекторы для PHP- и Node.js-фреймворков;
- Vue 3 компонент и директива с поддержкой `v-model`;
- календарь и последовательный выбор часов/минут;
- объединённый выбор даты и времени;
- обычные и составные кнопки с отдельным действием `Play`.

## Содержание

- [Файлы проекта](#файлы-проекта)
- [Подключение](#подключение)
- [Быстрый старт](#быстрый-старт)
- [Режимы компоновки](#режимы-компоновки)
- [Просмотр и редактирование](#просмотр-и-редактирование)
- [Контекстный поиск](#контекстный-поиск)
- [Автоматическое сохранение](#автоматическое-сохранение)
- [AJAX](#ajax)
- [Коннекторы](#коннекторы)
- [Vue 3](#vue-3)
- [Дата и время](#дата-и-время)
- [Кнопочные примитивы](#кнопочные-примитивы)
- [Опции](#опции)
- [Методы](#методы)
- [События](#события)
- [Демонстрация](#демонстрация)

## Документация по коннекторам
- [Node and Vue - коннекторы](NODE_VUE_CONNECTORS.md)
- [Laravel, Yii, Bitrix, CodeIgniter - коннекторы](PHP_CONNECTORS)

## Файлы проекта

| Файл | Назначение |
| --- | --- |
| `jquery.intel-field.js` | Основной плагин поля ввода |
| `jquery.intel-field.css` | Темы и компоновка основного плагина |
| `jquery.intel-field.ajax.js` | Удалённая загрузка вариантов |
| `jquery.intel-field.connectors.js` | Bitrix, Laravel, CodeIgniter и Yii |
| `jquery.intel-field.node.js` | Node.js, Express, NestJS и Fastify |
| `jquery.intel-field.vue.js` | Vue 3 компонент и директива |
| `jquery.intel-field.datetime.js` | Выбор даты и времени |
| `jquery.intel-field.datetime.css` | Календарь и циферблаты |
| `jquery.intel-button.js` | Плагин кнопочных примитивов |
| `jquery.intel-button.css` | Стили кнопочных примитивов |
| `intelField.html` | Полная интерактивная демонстрация |
| `PHP_CONNECTORS.md` | Контракты PHP endpoint-ов |
| `NODE_VUE_CONNECTORS.md` | Node.js API и Vue 3 интеграция |

## Подключение

Минимальное подключение:

```html
<link rel="stylesheet" href="jquery.intel-field.css">

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="jquery.intel-field.js"></script>
```

Все дополнительные модули подключаются после core в таком порядке:

```html
<link rel="stylesheet" href="jquery.intel-field.css">
<link rel="stylesheet" href="jquery.intel-field.datetime.css">
<link rel="stylesheet" href="jquery.intel-button.css">

<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="jquery.intel-field.js"></script>
<script src="jquery.intel-field.ajax.js"></script>
<script src="jquery.intel-field.connectors.js"></script>
<script src="jquery.intel-field.node.js"></script>
<script src="jquery.intel-field.vue.js"></script>
<script src="jquery.intel-field.datetime.js"></script>
<script src="jquery.intel-button.js"></script>
```

`jquery.intel-field.node.js` требует ранее подключённые AJAX и connectors
модули. `jquery.intel-field.vue.js` требует основной плагин и Vue 3 runtime.

## Быстрый старт

```html
<input id="project" name="project" placeholder="Выберите проект">
```

```js
$("#project").intelField({
  items: [
    { value: "website", label: "Проект:", text: "Сайт" },
    { value: "mobile", label: "Проект:", text: "Мобильное приложение" }
  ],
  appearance: {
    theme: "dark",
    accentColor: "#6574e8"
  },
  onSave: function (event) {
    console.log(event.value, event.previousValue, event.source);
  }
});
```

Элемент dropdown может содержать `value`, `label`, `text`, `name`, `type` и
`keywords`. Итоговую строку формирует `valueFormatter`.

## Режимы компоновки

Для общей группы выберите несколько input-элементов одним jQuery-селектором и
укажите `layout.groupInputs: true`.

| Режим | Описание |
| --- | --- |
| `joined-row` | От 1 до 5 сегментов выглядят как один контрол с разделителями |
| `separate-row` | Отдельные поля располагаются в одной строке с переносом |
| `separate-column` | Отдельные поля располагаются друг под другом |

```js
$(".route-field").intelField({
  layout: {
    mode: "joined-row",
    groupInputs: true
  },
  behavior: {
    minFields: 1,
    maxFields: 5,
    allowAdd: false
  }
});
```

`layout.columns` задаёт желаемое число колонок для `separate-row`.

## Просмотр и редактирование

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

В режиме `view` поле может быть readonly и не иметь рамки. Двойной клик
переводит выбранный сегмент в `edit`; сохранение или потеря фокуса возвращает
его в просмотр.

## Контекстный поиск

```js
$("#person-search").intelField({
  startMode: "edit",
  items: people,
  search: {
    enabled: true,
    minChars: 1,
    openOnFocus: false,
    noResultsText: "Совпадений не найдено",
    selectFirstOnEnter: true,
    matcher: function (item, query) {
      return item.text.toLowerCase().includes(query.toLowerCase());
    }
  }
});
```

По умолчанию поиск проверяет `label`, `text` и `keywords`. Поддерживаются
`ArrowUp`, `ArrowDown`, `Enter` и `Escape`.

### Дополнительное действие «Открыть»

```js
$("#person-search").intelField({
  behavior: { allowOpen: true },
  onOpenAction: function (event) {
    console.log("Открыть объект:", event.value);
  }
});
```

Действие публикует событие `intelfield:actionopen` и не раскрывает dropdown.

## Автоматическое сохранение

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

Сохранение выполняется только при изменении значения. Источник `source` может
быть `select`, `blur`, `apply`, `api`, `date` или `time`.

`save()` сохраняет значение без обязательной смены режима. `apply()` сохраняет
его и переводит поле в `view`.

## AJAX

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
    transformResponse: function (response) {
      return response.items;
    }
  }
});
```

Поддерживаются debounce, отмена активного запроса, кэширование, загрузка при
инициализации/открытии/поиске и пользовательское преобразование ответа.

Основные AJAX-опции: `url`, `method`, `dataType`, `queryParam`, `delay`,
`minChars`, `loadOnInit`, `loadOnOpen`, `loadOnSearch`, `localFilter`, `cache`,
`loadingText`, `data`, `headers`, `requestOptions`, `buildData` и
`transformResponse`.

Методы: `loadItems(query, data)`, `reloadItems(query, data)`, `abortLoad()`.

## Коннекторы

### PHP

```js
$("#remote-project").intelFieldWithConnector("laravel", {
  search: { enabled: true, minChars: 2 }
}, {
  url: "/api/intel-field/projects"
});
```

Доступные имена: `bitrix`, `laravel`, `codeigniter`, `yii`.

```js
var ajaxOptions = $.intelFieldConnectors.create("yii", {
  url: "/project/intel-field"
});

$("#project").intelField({ ajax: ajaxOptions });
```

Принимаются массив и envelope-форматы `{ items: [] }`, `{ data: [] }` и
`{ data: { items: [] } }`. Подробности CSRF и endpoint-контрактов находятся в
[PHP_CONNECTORS.md](PHP_CONNECTORS.md).

### Node.js

```js
$("#project").intelFieldWithConnector("nestjs", {
  search: { enabled: true, minChars: 2 }
}, {
  url: "/api/projects",
  token: function () {
    return sessionStorage.getItem("access_token");
  },
  responsePath: "data.results",
  mapItem: function (project) {
    return { value: project.id, label: "Проект:", text: project.name };
  }
});
```

Псевдонимы одного адаптера: `node`, `nodejs`, `express`, `nestjs`, `fastify`.
Поддерживаются Bearer-токены, cookie-сессии, CSRF, CORS, pagination,
`responsePath`, `mapItem`, `buildData` и произвольные JSON envelope.

Полный список параметров и Express endpoint-пример: [NODE_VUE_CONNECTORS.md](NODE_VUE_CONNECTORS.md).

## Vue 3

```js
const app = Vue.createApp({
  data() {
    return {
      project: "",
      fieldOptions: { items: projects }
    };
  }
});

app.use(IntelFieldVue, {
  Vue: Vue,
  componentName: "IntelField",
  directiveName: "intel-field"
});
```

```html
<intel-field
  v-model="project"
  :options="fieldOptions"
  placeholder="Выберите проект"
  @save="handleSave"
/>
```

Также доступна директива `v-intel-field`. Компонент передаёт события input,
change, select, save, apply, search, open, close, invalid и AJAX-события. Через
exposed-метод `call(method, ...args)` доступен API jQuery-плагина.

## Дата и время

```js
$("#date").intelFieldDate({
  picker: {
    locale: "ru-RU",
    format: "DD.MM.YYYY",
    min: "01.01.2026",
    max: "31.12.2027",
    viewOnSelect: true,
    displayFormatter: function (date, value) {
      var day = new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(date);
      return value + " (" + day + ")";
    }
  }
});

$("#time").intelFieldTime({
  picker: {
    initialTime: "12:00",
    minuteStep: 5,
    viewOnSelect: true,
    displayFormatter: function (time, value) {
      return value + " (день)";
    }
  }
});
```

Дата публикует `intelfield:dateselect`, время — `intelfield:timeselect`.
Payload содержит исходное `value` и форматированное `displayValue`.

Date picker: `locale`, `format`, `weekStartsOn`, `min`, `max`, `initialDate`,
`closeOnSelect`, `saveOnSelect`, `viewOnSelect`, `readonlyInput`,
`displayFormatter`, `todayText`.

Time picker: `format`, `minuteStep`, `initialTime`, `closeOnSelect`,
`saveOnSelect`, `viewOnSelect`, `readonlyInput`, `displayFormatter`, `hourText`,
`minuteText`.

Дата и время могут быть объединены в одну `joined-row` группу, как в примере 5
файла `intelField.html`.

## Кнопочные примитивы

```html
<button id="plain" type="button">Обычная кнопка</button>
<button id="runner" type="button">Запустить сценарий</button>
```

```js
$("#plain").intelButton({
  variant: "text",
  onClick: function () {}
});

$("#runner").intelButton({
  variant: "split-play",
  playText: "Play",
  playTitle: "Запустить",
  onClick: function () {},
  onPlay: function () {}
});
```

Варианты: `text` и `split-play`. Размеры: `small`, `medium`, `large`. Темы:
`dark`, `light`.

Методы: `setTheme(theme)`, `setDisabled(disabled)`, `destroy()`.
События: `intelbutton:click`, `intelbutton:play`.

## Опции

### Основные

| Опция | Назначение |
| --- | --- |
| `items` | Массив вариантов или функция, возвращающая массив |
| `startMode` | `auto`, `view` или `edit` |
| `emptyText` | Текст пустого dropdown |
| `layout` | Режим и параметры группировки |
| `search` | Контекстная фильтрация |
| `behavior` | Доступные действия и поведение поля |
| `appearance` | Тема, размер, цвета и CSS-класс |
| `buttons` | Иконки и title управляющих кнопок |
| `valueFormatter` | Формирует значение из выбранного item |
| `itemLabel`, `itemText` | Формируют колонки dropdown |
| `validate` | Возвращает `false`, если значение недопустимо |

### Behavior

`allowSelect`, `allowOpen`, `allowEdit`, `allowApply`, `allowClear`, `allowAdd`,
`allowPrepend`, `allowRemove`, `applyOnSelect`, `autoSaveOnSelect`,
`autoSaveOnBlur`, `editOnDblClick`, `viewOnBlur`, `borderlessView`,
`readonlyOnView`, `outerControlsInView`, `closeOnOutsideClick`, `enterApplies`,
`escapeAction`, `minFields`, `maxFields`, `removeLast`, `focusNewField`,
`requireValue`, `disabled`.

### Appearance

| Опция | Значения |
| --- | --- |
| `theme` | `dark`, `light` |
| `size` | `small`, `medium`, `large` |
| `className` | Дополнительные классы общей группы |
| `accentColor` | Акцентный CSS-цвет |
| `backgroundColor` | Цвет фона |
| `textColor` | Цвет текста |
| `borderColor` | Цвет границы |
| `borderRadius` | Любая допустимая CSS-длина |

## Методы

```js
var $field = $("#project").intelField(options);

$field.intelField("value");
$field.intelField("value", "Проект: Сайт");
$field.intelField("setItems", items);
$field.intelField("search", "сайт");
$field.intelField("setMode", "edit", true);
$field.intelField("open");
$field.intelField("close");
$field.intelField("toggle");
$field.intelField("save", "api");
$field.intelField("apply");
$field.intelField("clear");
$field.intelField("add", "after");
$field.intelField("remove");
$field.intelField("openAction");
$field.intelField("setDisabled", true);
$field.intelField("setTheme", "light");
$field.intelField("option", "appearance.theme", "light");
$field.intelField("option", { behavior: { allowClear: false } });
$field.intelField("refresh");
$field.intelField("destroy");
```

## События

Каждому callback соответствует jQuery-событие с префиксом `intelfield:`.

| События core | Callback |
| --- | --- |
| `init`, `input`, `change`, `select` | `onInit`, `onInput`, `onChange`, `onSelect` |
| `save`, `apply`, `modechange` | `onSave`, `onApply`, `onModeChange` |
| `add`, `remove`, `actionopen` | `onAdd`, `onRemove`, `onOpenAction` |
| `open`, `close`, `search`, `invalid` | `onOpen`, `onClose`, `onSearch`, `onInvalid` |

Дополнительные события:

- AJAX: `ajaxloadstart`, `ajaxload`, `ajaxerror`, `ajaxloadend`;
- date/time: `dateselect`, `timeselect`;
- buttons: `intelbutton:click`, `intelbutton:play`.

```js
$("#project").on("intelfield:save", function (event, data) {
  console.log(data.value, data.previousValue, data.source);
});
```

## Демонстрация

Откройте `intelField.html`. Страница содержит примеры всех режимов, date/time,
динамических полей, кнопок и переключения светлой/тёмной темы.

## Лицензия

Проект распространяется по лицензии [GNU GPL v3](LICENSE).
