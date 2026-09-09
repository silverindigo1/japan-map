/* Caches the app shell so the app opens without a connection. Live services are never cached. Map tiles are kept as a small fallback cache. */
var VERSION='v43';
var SHELL_CACHE='japan-map-shell-'+VERSION;
var TILE_CACHE='japan-map-tiles-v1';
var SHELL=[
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/5.7.1/maplibre-gl.css',
  'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/5.7.1/maplibre-gl.js'
];
var TILE_LIMIT=600;
var LIVE=['arcgisonline.com','tiles.openfreemap.org','nominatim.openstreetmap.org','open-meteo.com','frankfurter','wikipedia.org','wikidata.org','supabase.co','project-osrm.org','google.com','googleapis.com','gstatic.com','ggpht.com'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(SHELL_CACHE).then(function(c){
    /* the CDN files are fetched with CORS so their status is readable and a bad copy is never stored */
    return Promise.all(SHELL.map(function(u){
      var req=new Request(u,{mode:u.indexOf('http')===0?'cors':'same-origin',cache:'reload'});
      return fetch(req).then(function(res){if(!res.ok)throw new Error('bad '+u);return c.put(req,res);});
    }));
  }));
  /* do not skipWaiting here: the page decides when to switch, so a user mid-edit is not reloaded */
});

self.addEventListener('message',function(e){
  if(e.data&&e.data.type==='skip')self.skipWaiting();
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==SHELL_CACHE&&k!==TILE_CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}).then(function(){
    return self.clients.matchAll({type:'window'}).then(function(cs){cs.forEach(function(c){c.postMessage({type:'updated',version:VERSION});});});
  }));
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
  for(var i=0;i<LIVE.length;i++){if(url.indexOf(LIVE[i])>-1)return;}
  if(url.indexOf('tile.openstreetmap.org')>-1){
    e.respondWith(
      fetch(e.request).then(function(res){
        if(res&&res.ok){var copy=res.clone();caches.open(TILE_CACHE).then(function(c){c.put(e.request,copy);}).then(trimTiles);}
        return res;
      }).catch(function(){return caches.match(e.request).then(function(h){return h||new Response('',{status:504});});})
    );
    return;
  }
  var isShell=url.indexOf(self.location.origin)===0||url.indexOf('cdnjs.cloudflare.com')>-1;
  if(!isShell)return;
  if(e.request.mode==='navigate'||url.indexOf('index.html')>-1||/\/$/.test(url.split('?')[0])){
    /* the page itself: network first so an update is picked up, cache when offline */
    e.respondWith(fetch(e.request).then(function(res){if(res&&res.ok){var copy=res.clone();caches.open(SHELL_CACHE).then(function(c){c.put(e.request,copy);});}return res;}).catch(function(){return caches.match('./index.html').then(function(h){return h||caches.match('./');});}));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit)return hit;
      return fetch(e.request).then(function(res){
        if(res&&res.ok){var copy=res.clone();caches.open(SHELL_CACHE).then(function(c){c.put(e.request,copy);});}
        return res;
      });
    })
  );
});
