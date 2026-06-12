# PHP connector endpoints

The JavaScript connectors are defined in `jquery.intel-field.connectors.js`.
Each endpoint receives the search text in `q` by default and should return one
of these JSON formats:

```json
{
  "items": [
    { "value": "15", "label": "Project:", "text": "Website" }
  ]
}
```

`{ "data": { "items": [] } }`, `{ "data": [] }`, and a plain array are also
accepted. Use `queryParam` or `transformResponse` when an endpoint has another
contract.

## Bitrix

```js
$("#project").intelFieldWithConnector("bitrix", pluginOptions, {
  action: "vendor:module.project.search"
});
```

The adapter uses `/bitrix/services/main/ajax.php`, sends `action`, `q`, and the
current `sessid` from `BX.bitrix_sessid()`. A custom `url` may be supplied for
a regular Bitrix AJAX handler.

## Laravel

```js
$("#project").intelFieldWithConnector("laravel", pluginOptions, {
  url: "/api/intel-field/projects",
  method: "GET"
});
```

The adapter reads the token from `<meta name="csrf-token">` and sends it as
`X-CSRF-TOKEN`. The route/controller should return `response()->json()` using
one of the supported response formats.

## CodeIgniter

```js
$("#project").intelFieldWithConnector("codeigniter", pluginOptions, {
  url: "/intel-field/projects",
  csrfTokenName: "csrf_test_name",
  csrfToken: window.csrfToken
});
```

The CSRF token is sent as a request parameter. Alternatively expose
`csrf-token-name` and `csrf-token` meta tags. The controller should return a
JSON response containing `items`.

## Yii

```js
$("#project").intelFieldWithConnector("yii", pluginOptions, {
  url: "/project/intel-field"
});
```

The adapter uses `yii.getCsrfToken()` when available, otherwise the
`csrf-token` meta tag, and sends `X-CSRF-Token`. The controller action should
return JSON with an `items` array.

## Shared options

All connectors accept `url`, `method`, `queryParam`, `data`, `headers`, and
`transformResponse`. Values in the plugin's `ajax` object override connector
defaults:

```js
$("#project").intelFieldWithConnector("laravel", {
  ajax: {
    delay: 400,
    cache: false
  }
}, {
  url: "/api/projects"
});
```
