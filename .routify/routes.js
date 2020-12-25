
/**
 * @sveltech/routify 1.9.10
 * File generated Fri Dec 25 2020 17:19:11 GMT+0200 (Eastern European Standard Time)
 */

export const __version = "1.9.10"
export const __timestamp = "2020-12-25T15:19:11.597Z"

//buildRoutes
import { buildClientTree } from "@sveltech/routify/runtime/buildRoutes"

//imports


//options
export const options = {}

//tree
export const _tree = {
  "name": "root",
  "filepath": "/",
  "root": true,
  "ownMeta": {},
  "absolutePath": "src/pages",
  "children": [
    {
      "isFile": true,
      "isDir": false,
      "file": "_fallback.svelte",
      "filepath": "/_fallback.svelte",
      "name": "_fallback",
      "ext": "svelte",
      "badExt": false,
      "absolutePath": "/home/timo/Github/Death/src/pages/_fallback.svelte",
      "importPath": "../src/pages/_fallback.svelte",
      "isLayout": false,
      "isReset": false,
      "isIndex": false,
      "isFallback": true,
      "isPage": false,
      "ownMeta": {},
      "meta": {
        "preload": false,
        "prerender": true,
        "precache-order": false,
        "precache-proximity": true,
        "recursive": true
      },
      "path": "/_fallback",
      "id": "__fallback",
      "component": () => import('../src/pages/_fallback.svelte').then(m => m.default)
    },
    {
      "isFile": true,
      "isDir": false,
      "file": "_layout.svelte",
      "filepath": "/_layout.svelte",
      "name": "_layout",
      "ext": "svelte",
      "badExt": false,
      "absolutePath": "/home/timo/Github/Death/src/pages/_layout.svelte",
      "importPath": "../src/pages/_layout.svelte",
      "isLayout": true,
      "isReset": false,
      "isIndex": false,
      "isFallback": false,
      "isPage": false,
      "ownMeta": {},
      "meta": {
        "preload": false,
        "prerender": true,
        "precache-order": false,
        "precache-proximity": true,
        "recursive": true
      },
      "path": "/",
      "id": "__layout",
      "component": () => import('../src/pages/_layout.svelte').then(m => m.default)
    },
    {
      "isFile": true,
      "isDir": false,
      "file": "christianity.md",
      "filepath": "/christianity.md",
      "name": "christianity",
      "ext": "md",
      "badExt": false,
      "absolutePath": "/home/timo/Github/Death/src/pages/christianity.md",
      "importPath": "../src/pages/christianity.md",
      "isLayout": false,
      "isReset": false,
      "isIndex": false,
      "isFallback": false,
      "isPage": true,
      "ownMeta": {},
      "meta": {
        "frontmatter": {
          "title": "Mitä elämässäni tapahtuu juuri nyt?",
          "summary": "Tältä sivulta löydät tiivistelmän mihin keskityn ammatillisesti ja henkilökohtaisessa elämässä.",
          "desc": "Tervetuloa tutustumaan minuun tarkemmin. Tältä sivulta löydät kattavasti kaiken mikä on minulle tärkeää tällä hetkellä ammatillisesti ja henkilökohtaisessa elämässä.",
          "layout": "article",
          "img": "timo",
          "language": "fi"
        },
        "preload": false,
        "prerender": true,
        "precache-order": false,
        "precache-proximity": true,
        "recursive": true
      },
      "path": "/christianity",
      "id": "_christianity",
      "component": () => import('../src/pages/christianity.md').then(m => m.default)
    },
    {
      "isFile": false,
      "isDir": true,
      "file": "fi",
      "filepath": "/fi",
      "name": "fi",
      "ext": "",
      "badExt": false,
      "absolutePath": "/home/timo/Github/Death/src/pages/fi",
      "children": [
        {
          "isFile": true,
          "isDir": false,
          "file": "index.svelte",
          "filepath": "/fi/index.svelte",
          "name": "index",
          "ext": "svelte",
          "badExt": false,
          "absolutePath": "/home/timo/Github/Death/src/pages/fi/index.svelte",
          "importPath": "../src/pages/fi/index.svelte",
          "isLayout": false,
          "isReset": false,
          "isIndex": true,
          "isFallback": false,
          "isPage": true,
          "ownMeta": {},
          "meta": {
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/fi/index",
          "id": "_fi_index",
          "component": () => import('../src/pages/fi/index.svelte').then(m => m.default)
        },
        {
          "isFile": true,
          "isDir": false,
          "file": "kristinusko.md",
          "filepath": "/fi/kristinusko.md",
          "name": "kristinusko",
          "ext": "md",
          "badExt": false,
          "absolutePath": "/home/timo/Github/Death/src/pages/fi/kristinusko.md",
          "importPath": "../src/pages/fi/kristinusko.md",
          "isLayout": false,
          "isReset": false,
          "isIndex": false,
          "isFallback": false,
          "isPage": true,
          "ownMeta": {},
          "meta": {
            "frontmatter": {
              "title": "Kristinusko",
              "summary": "Kuolema odottaa meitä kaikkia, mutta mitä meille oikeasti tapahtuu kuollessa ja voiko kuollutta herättää henkiin? Voiko uskonnot tarjota meille ikuista elämää?",
              "layout": "article",
              "language": "fi",
              "pub": [
                10,
                "Apr"
              ],
              "published": "2020-04-12T01:06:14+03:00",
              "modified": "2020-04-12T01:16:53+03:00"
            },
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/fi/kristinusko",
          "id": "_fi_kristinusko",
          "component": () => import('../src/pages/fi/kristinusko.md').then(m => m.default)
        },
        {
          "isFile": true,
          "isDir": false,
          "file": "kuolema.md",
          "filepath": "/fi/kuolema.md",
          "name": "kuolema",
          "ext": "md",
          "badExt": false,
          "absolutePath": "/home/timo/Github/Death/src/pages/fi/kuolema.md",
          "importPath": "../src/pages/fi/kuolema.md",
          "isLayout": false,
          "isReset": false,
          "isIndex": false,
          "isFallback": false,
          "isPage": true,
          "ownMeta": {},
          "meta": {
            "frontmatter": {
              "title": "Mikä on kuolema?",
              "summary": "Kuolema odottaa meitä kaikkia, mutta mitä meille oikeasti tapahtuu kuollessa ja voiko kuollutta herättää henkiin? Voiko uskonnot tarjota meille ikuista elämää?",
              "layout": "article",
              "language": "fi",
              "pub": [
                10,
                "Apr"
              ],
              "published": "2020-04-10T01:06:14+03:00",
              "modified": "2020-04-10T01:16:53+03:00"
            },
            "preload": false,
            "prerender": true,
            "precache-order": false,
            "precache-proximity": true,
            "recursive": true
          },
          "path": "/fi/kuolema",
          "id": "_fi_kuolema",
          "component": () => import('../src/pages/fi/kuolema.md').then(m => m.default)
        }
      ],
      "isLayout": false,
      "isReset": false,
      "isIndex": false,
      "isFallback": false,
      "isPage": false,
      "ownMeta": {},
      "meta": {
        "preload": false,
        "prerender": true,
        "precache-order": false,
        "precache-proximity": true,
        "recursive": true
      },
      "path": "/fi"
    },
    {
      "isFile": true,
      "isDir": false,
      "file": "index.svelte",
      "filepath": "/index.svelte",
      "name": "index",
      "ext": "svelte",
      "badExt": false,
      "absolutePath": "/home/timo/Github/Death/src/pages/index.svelte",
      "importPath": "../src/pages/index.svelte",
      "isLayout": false,
      "isReset": false,
      "isIndex": true,
      "isFallback": false,
      "isPage": true,
      "ownMeta": {},
      "meta": {
        "preload": false,
        "prerender": true,
        "precache-order": false,
        "precache-proximity": true,
        "recursive": true
      },
      "path": "/index",
      "id": "_index",
      "component": () => import('../src/pages/index.svelte').then(m => m.default)
    },
    {
      "isFile": true,
      "isDir": false,
      "file": "is-death-reversible.md",
      "filepath": "/is-death-reversible.md",
      "name": "is-death-reversible",
      "ext": "md",
      "badExt": false,
      "absolutePath": "/home/timo/Github/Death/src/pages/is-death-reversible.md",
      "importPath": "../src/pages/is-death-reversible.md",
      "isLayout": false,
      "isReset": false,
      "isIndex": false,
      "isFallback": false,
      "isPage": true,
      "ownMeta": {},
      "meta": {
        "frontmatter": {
          "title": "A Study of Death",
          "summary": "A study of death; what happens in death and what different religions promise after death. Is there life after death?",
          "layout": "article",
          "language": "en"
        },
        "preload": false,
        "prerender": true,
        "precache-order": false,
        "precache-proximity": true,
        "recursive": true
      },
      "path": "/is-death-reversible",
      "id": "_isDeathReversible",
      "component": () => import('../src/pages/is-death-reversible.md').then(m => m.default)
    }
  ],
  "isLayout": false,
  "isReset": false,
  "isIndex": false,
  "isFallback": false,
  "meta": {
    "preload": false,
    "prerender": true,
    "precache-order": false,
    "precache-proximity": true,
    "recursive": true
  },
  "path": "/"
}


export const {tree, routes} = buildClientTree(_tree)

