export const EXAMPLE_BASELINE = `{
  "user": {
    "id": 42,
    "name": "Mladen",
    "address": { "city": "Belgrade" }
  },
  "price": 99.99,
  "active": true,
  "tags": ["customer"]
}`;

export const EXAMPLE_UPDATED = `{
  "user": {
    "id": 43,
    "displayName": "Marko",
    "address": null
  },
  "price": "99.99",
  "active": false,
  "tags": ["customer", "premium"],
  "permissions": ["read"]
}`;
