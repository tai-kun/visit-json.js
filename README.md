# visit-json.js

[![npm latest package](https://img.shields.io/npm/v/visit-json/latest.svg)](https://www.npmjs.com/package/visit-json)
[![Quality](https://github.com/tai-kun/visit-json.js/actions/workflows/Quality.yaml/badge.svg)](https://github.com/tai-kun/visit-json.js/actions/workflows/Quality.yaml)

```ts
import visitJson, { REMOVE } from "visit-json"
// or
import * as json from "visit-json"
const { visit: visitJson, REMOVE } = json

const object = {
  a: {
    b: [
      2,
      "3",
    ],
  },
}
const newObject = visitJson(object, value => {
  if (typeof value === "number") {
    return value + 2
  }

  return REMOVE
})

console.log(newObject)
// {
//   a: {
//     b: [
//       4,
//     ],
//   },
// }
```
