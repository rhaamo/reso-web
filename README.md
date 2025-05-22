# Reso-WEB

This is an Electron/VueJS app to chat and manage inventory and whatnot for resonite.

<p float="left">
<img src="./screenshot1.png" height="300px"/>
<img src="./screenshot2.png" height="300px"/>
<img src="./screenshot3.png" height="200px"/>
</p>

## Features

- Chats
  - [x] List users with status
  - [x] Send messages
  - [x] Receive them
  - [x] Realtime updates
  - [ ] Handle non-Text messages
  - [ ] Change own status
  - [ ] Show in which session the user is active
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

- TODO
  - [ ] Move more stuff into store/hub
  - [ ] Create a store/hubSessions to handle sessions standalone
  - [ ] Dropdown in navbar to change user status
  - [ ] Notifications (toast & native)
  - [ ] Mark messages as read
  - User settings
    - [ ] Notifications native
    - [ ] Notifications toast
    - [ ] Default Online Status

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
