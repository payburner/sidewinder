"use strict";var precacheConfig=[["/index.html","d444d0c9f90a066eeacde2948672a7aa"],["/static/css/main.2d8431aa.css","02e5830232eea25e4a44ce55c8c11219"],["/static/js/main.895e1f7c.js","a57ff120242ecc83686def81d5414fcb"],["/static/media/bitso.13f27217.svg","13f272173ca1095ac1e9aa60b23195e5"],["/static/media/bitstamp.d364edf4.png","d364edf40e67c5d073044c0afe900dc0"],["/static/media/fontawesome-webfont3e6e.acf3dcb7.svg","acf3dcb7ff752b5296ca23ba2c7c2606"],["/static/media/fontawesome-webfont3e6e.d41d8cd9.eot","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/fontawesome-webfont3e6e.d41d8cd9.ttf","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/fontawesome-webfont3e6e.d41d8cd9.woff","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/fontawesome-webfont3e6e.d41d8cd9.woff2","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/fontawesome-webfontd41d.d41d8cd9.eot","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/la-brands-400.0113b89d.svg","0113b89d2925af361e58337f3f6d3b43"],["/static/media/la-brands-400.d41d8cd9.eot","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/la-brands-400.d41d8cd9.ttf","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/la-brands-400.d41d8cd9.woff","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/la-brands-400.d41d8cd9.woff2","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/la-regular-400.d41d8cd9.eot","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/la-regular-400.d41d8cd9.ttf","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/la-regular-400.d41d8cd9.woff","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/la-regular-400.d41d8cd9.woff2","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/la-regular-400.e055e4ac.svg","e055e4aca39eddb792b5fa17c7cd2193"],["/static/media/la-solid-900.4b729628.svg","4b7296284752d9ecf4fe5112f7e79595"],["/static/media/la-solid-900.d41d8cd9.eot","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/la-solid-900.d41d8cd9.ttf","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/la-solid-900.d41d8cd9.woff","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/la-solid-900.d41d8cd9.woff2","d41d8cd98f00b204e9800998ecf8427e"],["/static/media/roboto-latin-100.5cb7edfc.woff","5cb7edfceb233100075dc9a1e12e8da3"],["/static/media/roboto-latin-100.7370c367.woff2","7370c3679472e9560965ff48a4399d0b"],["/static/media/roboto-latin-100italic.f8b1df51.woff2","f8b1df51ba843179fa1cc9b53d58127a"],["/static/media/roboto-latin-100italic.f9e8e590.woff","f9e8e590b4e0f1ff83469bb2a55b8488"],["/static/media/roboto-latin-300.b00849e0.woff","b00849e00f4c2331cddd8ffb44a6720b"],["/static/media/roboto-latin-300.ef7c6637.woff2","ef7c6637c68f269a882e73bcb57a7f6a"],["/static/media/roboto-latin-300italic.14286f3b.woff2","14286f3ba79c6627433572dfa925202e"],["/static/media/roboto-latin-300italic.4df32891.woff","4df32891a5f2f98a363314f595482e08"],["/static/media/roboto-latin-400.479970ff.woff2","479970ffb74f2117317f9d24d9e317fe"],["/static/media/roboto-latin-400.60fa3c06.woff","60fa3c0614b8fb2f394fa29944c21540"],["/static/media/roboto-latin-400italic.51521a2a.woff2","51521a2a8da71e50d871ac6fd2187e87"],["/static/media/roboto-latin-400italic.fe65b833.woff","fe65b8335ee19dd944289f9ed3178c78"],["/static/media/roboto-latin-500.020c97dc.woff2","020c97dc8e0463259c2f9df929bb0c69"],["/static/media/roboto-latin-500.87284894.woff","87284894879f5b1c229cb49c8ff6decc"],["/static/media/roboto-latin-500italic.288ad9c6.woff","288ad9c6e8b43cf02443a1f499bdf67e"],["/static/media/roboto-latin-500italic.db4a2a23.woff2","db4a2a231f52e497c0191e8966b0ee58"],["/static/media/roboto-latin-700.2735a3a6.woff2","2735a3a69b509faf3577afd25bdf552e"],["/static/media/roboto-latin-700.adcde98f.woff","adcde98f1d584de52060ad7b16373da3"],["/static/media/roboto-latin-700italic.81f57861.woff","81f57861ed4ac74741f5671e1dff2fd9"],["/static/media/roboto-latin-700italic.da0e7178.woff2","da0e717829e033a69dec97f1e155ae42"],["/static/media/roboto-latin-900.9b3766ef.woff2","9b3766ef4a402ad3fdeef7501a456512"],["/static/media/roboto-latin-900.bb1e4dc6.woff","bb1e4dc6333675d11ada2e857e7f95d7"],["/static/media/roboto-latin-900italic.28f91510.woff","28f9151055c950874d2c6803a39b425b"],["/static/media/roboto-latin-900italic.ebf6d164.woff2","ebf6d1640ccddb99fb49f73c052c55a8"]],cacheName="sw-precache-v3-sw-precache-webpack-plugin-"+(self.registration?self.registration.scope:""),ignoreUrlParametersMatching=[/^utm_/],addDirectoryIndex=function(e,t){var a=new URL(e);return"/"===a.pathname.slice(-1)&&(a.pathname+=t),a.toString()},cleanResponse=function(t){return t.redirected?("body"in t?Promise.resolve(t.body):t.blob()).then(function(e){return new Response(e,{headers:t.headers,status:t.status,statusText:t.statusText})}):Promise.resolve(t)},createCacheKey=function(e,t,a,c){var d=new URL(e);return c&&d.pathname.match(c)||(d.search+=(d.search?"&":"")+encodeURIComponent(t)+"="+encodeURIComponent(a)),d.toString()},isPathWhitelisted=function(e,t){if(0===e.length)return!0;var a=new URL(t).pathname;return e.some(function(e){return a.match(e)})},stripIgnoredUrlParameters=function(e,a){var t=new URL(e);return t.hash="",t.search=t.search.slice(1).split("&").map(function(e){return e.split("=")}).filter(function(t){return a.every(function(e){return!e.test(t[0])})}).map(function(e){return e.join("=")}).join("&"),t.toString()},hashParamName="_sw-precache",urlsToCacheKeys=new Map(precacheConfig.map(function(e){var t=e[0],a=e[1],c=new URL(t,self.location),d=createCacheKey(c,hashParamName,a,/\.\w{8}\./);return[c.toString(),d]}));function setOfCachedUrls(e){return e.keys().then(function(e){return e.map(function(e){return e.url})}).then(function(e){return new Set(e)})}self.addEventListener("install",function(e){e.waitUntil(caches.open(cacheName).then(function(c){return setOfCachedUrls(c).then(function(a){return Promise.all(Array.from(urlsToCacheKeys.values()).map(function(t){if(!a.has(t)){var e=new Request(t,{credentials:"same-origin"});return fetch(e).then(function(e){if(!e.ok)throw new Error("Request for "+t+" returned a response with status "+e.status);return cleanResponse(e).then(function(e){return c.put(t,e)})})}}))})}).then(function(){return self.skipWaiting()}))}),self.addEventListener("activate",function(e){var a=new Set(urlsToCacheKeys.values());e.waitUntil(caches.open(cacheName).then(function(t){return t.keys().then(function(e){return Promise.all(e.map(function(e){if(!a.has(e.url))return t.delete(e)}))})}).then(function(){return self.clients.claim()}))}),self.addEventListener("fetch",function(t){if("GET"===t.request.method){var e,a=stripIgnoredUrlParameters(t.request.url,ignoreUrlParametersMatching),c="index.html";(e=urlsToCacheKeys.has(a))||(a=addDirectoryIndex(a,c),e=urlsToCacheKeys.has(a));var d="/index.html";!e&&"navigate"===t.request.mode&&isPathWhitelisted(["^(?!\\/__).*"],t.request.url)&&(a=new URL(d,self.location).toString(),e=urlsToCacheKeys.has(a)),e&&t.respondWith(caches.open(cacheName).then(function(e){return e.match(urlsToCacheKeys.get(a)).then(function(e){if(e)return e;throw Error("The cached response that was expected is missing.")})}).catch(function(e){return console.warn('Couldn\'t serve response for "%s" from cache: %O',t.request.url,e),fetch(t.request)}))}});