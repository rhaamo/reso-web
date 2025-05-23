# Reso-WEB

This is an Electron/VueJS app to chat and manage inventory and whatnot for resonite.

<p float="left">
<img src="./screenshot1.png" height="300px"/>
<img src="./screenshot2.png" height="300px"/>
<img src="./screenshot3.png" height="200px"/>
</p>

## Features

- Chats
  - Can send and receive messages, with realtime updates.
  - Can also listen to audio message and view Session invites and Request.
  - Can broadcast your own status (not tested if that really works yet tho :p)
- Inventory
  - Basic browsing, and getting `resdb:///` link of objects.
- Sessions
  - Listing of sessions with text formatting
  - Session details with users, 3D Sphere Viewer, master, etc.
  - `go.resonite.com` and `ressession:///` links

## TODO / Unsupported

- Chats
  - Handle `Object` messages
  - Sending `Audio` messages
  - Showing in which world the contact is
  - Mark messages as read
- Inventory
  - Get Object resdb:/// links
  - Browse public dirs
  - Download asset
  - Upload asset
- Worlds
  - Basic listing
  - Filtering
  - Pagination
- Global
  - Notifications (native & inapp)

## Build or something

- git clone
- install nodejs + yarn
- yarn install

- dev:
  - `yarn dev`
- build windows:
  - `yarn run build:win`
- build mac (untested):
  - `yarn run build:mac`
- build linux (untested):
  - `yarn run build:linux`

## Special mention

To Resonite for not having any CORS to permits us to make apps from the browser :| https://github.com/Yellow-Dog-Man/Resonite-Issues/issues/3537

So the whole APIs are usable only through a custom proxy, a full-native (non-browser) app, or with electron web security disabled, yay,,,
