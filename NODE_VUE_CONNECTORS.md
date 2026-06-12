# Node.js and Vue connectors

## Node.js API connector

Load the files in this order:

```html
<script src="jquery.js"></script>
<script src="jquery.intel-field.js"></script>
<script src="jquery.intel-field.ajax.js"></script>
<script src="jquery.intel-field.connectors.js"></script>
<script src="jquery.intel-field.node.js"></script>
```

The connector names `node`, `nodejs`, `express`, `nestjs`, and `fastify` use
the same configurable adapter.

```js
$("#project").intelFieldWithConnector("express", {
  search: {
    enabled: true,
    minChars: 2
  }
}, {
  url: "/api/projects/search",
  method: "GET",
  token: function () {
    return sessionStorage.getItem("access_token");
  },
  responsePath: "results",
  mapItem: function (project) {
    return {
      value: project.id,
      label: "Project:",
      text: project.name
    };
  }
});
```

Supported options:

- `url`, `method`, `queryParam`, `dataType`, `data`, and `headers`.
- `token` and `tokenType` for an `Authorization` header.
- `csrfToken`, `csrfMeta`, `csrfCookie`, and `csrfHeader`.
- `withCredentials` for cookie-based sessions and CORS.
- `responsePath` for custom JSON envelopes.
- `mapItem(item, index)` for converting API records to intelField items.
- `pageParam`, `page`, `limitParam`, and `limit` for pagination parameters.
- `requestOptions`, `buildData`, and `transformResponse` for full control.

Common response envelopes are recognized automatically: `items`, `results`,
`data`, `data.items`, `data.results`, `payload.items`, and `payload.results`.

### Express endpoint example

```js
app.get("/api/projects/search", async (req, res) => {
  const projects = await findProjects(req.query.q || "");
  res.json({
    results: projects.map(project => ({
      id: project.id,
      name: project.name
    }))
  });
});
```

## Vue 3 connector

The connector follows Vue 3 application plugins, directive lifecycle hooks,
and the `modelValue` / `update:modelValue` component contract.

```html
<script src="vue.global.js"></script>
<script src="jquery.js"></script>
<script src="jquery.intel-field.js"></script>
<script src="jquery.intel-field.vue.js"></script>
```

```js
const app = Vue.createApp({
  data() {
    return {
      project: "",
      fieldOptions: {
        items: [
          { label: "Project:", text: "Website" },
          { label: "Project:", text: "Mobile" }
        ]
      }
    };
  }
});

app.use(IntelFieldVue, {
  Vue: Vue,
  componentName: "IntelField",
  directiveName: "intel-field"
});

app.mount("#app");
```

Component usage:

```html
<intel-field
  v-model="project"
  :options="fieldOptions"
  placeholder="Select project"
  @save="handleSave"
  @ajaxload="handleLoaded"
/>
```

The component forwards input, change, select, save, apply, search, open,
close, invalid, and AJAX events. Its exposed `call(method, ...args)` method
provides access to the jQuery plugin API.

Directive usage on a native input:

```html
<input
  v-model="project"
  v-intel-field="{
    options: fieldOptions,
    modelValue: project,
    onSave: handleSave
  }"
>
```

The directive dispatches native `intel-field-*` custom events and destroys
the jQuery plugin in `beforeUnmount`.
