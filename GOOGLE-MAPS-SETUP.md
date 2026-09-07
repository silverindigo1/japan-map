# Google Maps in the Japan 2026 app

The app runs on its built-in map until a Maps JavaScript API key is saved. With a key it renders Google Maps (English labels) underneath your pins.

## 1. Create the key (about 15 minutes, on a computer)
1. Go to https://console.cloud.google.com/google/maps-apis/start and sign in with your Google account.
2. Create a project (any name, for example "Japan map") and enable billing when prompted. A card is required; the free monthly allowance covers this app many times over.
3. Enable the API: APIs & Services > Library > "Maps JavaScript API" > Enable. Enable nothing else.
4. Keys & Credentials > Create credentials > API key. Copy the key.
5. Click the key name and restrict it:
   - Application restrictions: Websites, add `https://YOURNAME.github.io/*` (your GitHub Pages address). Add `http://localhost/*` only if you test on a computer.
   - API restrictions: Restrict key, select only "Maps JavaScript API".
   - Save.
6. Cap spending: Google Maps Platform > Quotas > Maps JavaScript API > "Map loads per day" > set 500. Two phones on a trip use a few dozen per day.

## 2. Put the key in the app
Either
- open the app on the phone, List > Backup > Google Maps > paste key > "Save key and switch". The key is stored on that phone only; repeat on the second phone. Or
- open `index.html`, find `var GOOGLE_MAPS_KEY='';` near the top of the script, paste the key between the quotes, re-upload. Then every install has it.

Google Maps only loads over https from the address the key allows. Inside Claude the app keeps the built-in map.

## 3. If the map stays on the built-in version
- Status line under the key field says what happened.
- "Google rejected this key": billing not enabled, API not enabled, or the site is not in the key's website list.
- "cannot load in this view": you are inside Claude or offline.
- Remove key returns to the built-in map at any time.
