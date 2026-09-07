/* Caches the app shell so the app opens without a connection. Map tiles are fetched live and kept only as a small fallback cache. */
var SHELL_CACHE='japan-map-shell-v18';
var TILE_CACHE='japan-map-tiles-v1';
var SHELL=[
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js'
];
var TILE_LIMIT=600;

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(SHELL_CACHE).then(function(c){return c.addAll(SHELL);}).then(function(){return self.skipWaiting();}));
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==SHELL_CACHE&&k!==TILE_CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});

function trimTiles(){
  return caches.open(TILE_CACHE).then(function(c){
    return c.keys().then(function(keys){
      if(keys.length<=TILE_LIMIT)return;
      return Promise.all(keys.slice(0,keys.length-TILE_LIMIT).map(function(k){return c.delete(k);}));
    });
  });
}

self.addEventListener('fetch',function(e){
  var url=e.request.url;
  if(e.request.method!=='GET')return;
  if(url.indexOf('tile.openstreetmap.org')>-1){
    e.respondWith(
      fetch(e.request).then(function(res){
        var copy=res.clone();
        caches.open(TILE_CACHE).then(function(c){c.put(e.request,copy);}).then(trimTiles);
        return res;
      }).catch(function(){return caches.match(e.request);})
    );
    return;
  }
  if(url.indexOf('nominatim.openstreetmap.org')>-1||url.indexOf('open-meteo.com')>-1||url.indexOf('google.com')>-1||url.indexOf('googleapis.com')>-1||url.indexOf('gstatic.com')>-1||url.indexOf('ggpht.com')>-1)return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit)return hit;
      return fetch(e.request).then(function(res){
        if(res&&res.ok&&(url.indexOf(self.location.origin)===0||url.indexOf('cdnjs.cloudflare.com')>-1)){
          var copy=res.clone();
          caches.open(SHELL_CACHE).then(function(c){c.put(e.request,copy);});
        }
        return res;
      });
    })
  );
});
