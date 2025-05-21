# Reso-WEB

This should be an app to chat and manage inventory and whatnot for resonite.

<p float="left">
<img src="./screenshot1.png" height="300px"/>
<img src="./screenshot2.png" height="300px"/>
</p>

## Features

- Can list users (no status)
- Can fetch an user messages history
- List sessions
  - Filtering, session details modal with 3D Sphere Preview
- Inventory
  - Can list your inventory and browse it (except for Links)

## It's broken :(

Anything using SignalR doesn't work, Sessions Updates are received, but nothing sent seems to be accepted, so no statues at all, sending messages, status refresh etc...

```js
// All .send or .invoke on the SignalR thingy ends up with:
// {"type":3,"invocationId":"4","result":null}
// so idk... but we receive correctly the session updates
// it's just that anything send to it just seems to silently fail

// example:
// TX: {"arguments":[],"invocationId":"0","target":"InitializeStatus","type":1}
// RX: {"type":3,"invocationId":"0","result":null}
// ReCon send:
// {type: 1, invocationId: 38c6f633-ef56-45cc-884c-63577d161b08, target: InitializeStatus, arguments: []}
```

## Build or something

- git clone
- install nodejs + yarn
- yarn install
- yarn dev
- idk

## Special mention

To Resonite for not having any CORS to permits us to make apps from the browser :| https://github.com/Yellow-Dog-Man/Resonite-Issues/issues/3537

So the whole APIs are usable only through a custom proxy, or with electron web security disabled, yay,,,
