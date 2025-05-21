# Reso-WEB

This is an Electron/VueJS app to chat and manage inventory and whatnot for resonite.

<p float="left">
<img src="./screenshot1.png" height="300px"/>
<img src="./screenshot2.png" height="300px"/>
</p>

## Features

- Chats
  - [x] List users with status
  - [x] Send messages
  - [x] Receive them
  - [x] Realtime updates
  - [ ] Handle non-Text messages
  - [ ] Realtime notifications
  - [ ] Change own status
- Sessions
  - [x] List with details
  - [ ] Pagination
  - [ ] Realtime update of sessions (add/delete/update)
  - [ ] Generate go.resonite links ?
- Inventory
  - [x] Basic listing
  - [ ] Get Object resdb:/// links
  - [ ] Browse public dirs
  - [ ] Download asset
  - [ ] Upload asset
- Worlds
  - [ ] Basic listing
  - [ ] Filtering
  - [ ] Pagination

## Build or something

- git clone
- install nodejs + yarn
- yarn install
- yarn dev
- idk

## Special mention

To Resonite for not having any CORS to permits us to make apps from the browser :| https://github.com/Yellow-Dog-Man/Resonite-Issues/issues/3537

So the whole APIs are usable only through a custom proxy, a full-native (non-browser) app, or with electron web security disabled, yay,,,
