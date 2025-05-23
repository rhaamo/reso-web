import Axios from 'axios'

const API = 'https://api.resonite.com'

// TODO handle thoses four better maybe ?
// Probably move the MACHINEID and UID into the userStore and keep them in localstorage
const MACHINEID = GenerateRandomMachineId()
const KEY =
  'oi+ISZuYtMYtpruYHLQLPkXgPaD+IcaRNXPI7b3Z0iYe5+AcccouLYFI9vloMmYEYDlE1PhDL52GsddfxgQeK4Z_hem84t1OXGUdScFkLSMhJA2te86LBL_rFL4JjO4F_hHHIJH1Gm1IYVuvBQjpb89AJ0D6eamd7u4MxeWeEVE='

const COMPAT = 'VSjZ/wzHcTkTha7/1/JUjQ=='

function getRandomBytes(n) {
  var crypto = self.crypto || self.msCrypto,
    QUOTA = 65536
  var a = new Uint8Array(n)
  for (var i = 0; i < n; i += QUOTA) {
    crypto.getRandomValues(a.subarray(i, i + Math.min(n - i, QUOTA)))
  }
  return a
}

function GenerateRandomMachineId() {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_'
  for (let i = 0; i < 128; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

async function GenerateUID() {
  const data = `resonet-${btoa(getRandomBytes(16))}`
  //result = CryptoJS.createHash('sha256').update(data).digest('hex').toUpperCase();
  const resBuffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  const resArray = Array.from(new Uint8Array(resBuffer))
  return resArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Login with User and Password (+TOTP if any)
const loginUserPassword = async (username, password, totp) => {
  const loginData = {
    username: username,
    authentication: {
      $type: 'password',
      password: password
    },
    rememberMe: true, // we want 30days token
    secretMachineId: MACHINEID
  }

  return Axios.post(`${API}/userSessions`, JSON.stringify(loginData), {
    headers: {
      'Content-Type': 'application/json',
      UID: await GenerateUID(),
      TOTP: totp ?? null
    },
    withCredentials: false
  })
}

// TODO Extend token life https://github.com/Lexevolution/mvcontact-bot/blob/main/index.js#L201

const logout = (userId, token) => {
  return Axios.delete(`${API}/userSessions/${userId}/${token}`, {
    headers: {
      Authorization: `res ${userId}:${token}`
    }
  })
}

// Return your contact list
const fetchContacts = (userId, token) => {
  // ?lastStatusUpdate=${lastStatusUpdate.toUtc().toIso8601String()}
  return Axios.get(`${API}/users/${userId}/contacts`, {
    headers: {
      Authorization: `res ${userId}:${token}`
    }
  })
}

const fetchContact = (userId, contactUserId, token) => {
  return Axios.get(`${API}/users/${userId}/contacts/${contactUserId}`, {
    headers: {
      Authorization: `res ${userId}:${token}`
    }
  })
}

// Fetch one user informations
const fetchUser = (userId) => {
  return Axios.get(`${API}/users/${userId}` + (userId.startsWith('U-') ? '' : '?byusername=true'))
}

const getUserMessages = (
  ownUserId,
  token,
  fromUserId,
  fromTime,
  maxItems = 50,
  unreadOnly = false
) => {
  let params = {
    maxItems: maxItems,
    unread: unreadOnly
  }
  if (fromTime !== null) {
    params.fromTime = fromTime
  }
  if (fromUserId !== null) {
    params.user = fromUserId
  }
  return Axios.get(`${API}/users/${ownUserId}/messages`, {
    params: params,
    headers: {
      Authorization: `res ${ownUserId}:${token}`
    }
  })
}

const getAssetsDomainUrl = (resdb) => {
  // Get only the hash
  let hash = resdb.replace('resdb:///', '').replace('resdb://', '').split('.')[0]
  return `https://assets.resonite.com/${hash}`
}

const getSessions = (userId, token, filterSettings) => {
  // Filtering: name, includeEnded, includeIncompatible, hostName, minActiveUsers, includeEmptyHeadless
  return Axios.get(`${API}/sessions`, {
    headers: {
      Authorization: `res ${userId}:${token}`
    },
    params: filterSettings
  })
}

const getSession = (userId, token, sessionId) => {
  return Axios.get(`${API}/sessions/${sessionId}`, {
    headers: {
      Authorization: `res ${userId}:${token}`
    }
  })
}

const getUserRecordsAt = (userId, token, path) => {
  return Axios.get(`${API}/users/${userId}/records?path=${path}`, {
    headers: {
      Authorization: `res ${userId}:${token}`
    }
  })
}

const getUserRecord = (userId, token, recordId) => {
  return Axios.get(`${API}/users/${userId}/records/${recordId}`, {
    headers: {
      Authorization: `res ${userId}:${token}`
    }
  })
}

const getGroupRecordByPath = (groupId, path) => {
  return Axios.get(`${API}/groups/${groupId}/records/${path}`)
}

const getGroupRecordsAt = (groupId, path) => {
  return Axios.get(`${API}/groups/${groupId}/records?path=${path}`)
}

const getStorageQuota = (userId, token) => {
  return Axios.get(`${API}/users/${userId}/storage`, {
    headers: {
      Authorization: `res ${userId}:${token}`
    }
  })
}

const saveUserProfileValue = (userId, token, values) => {
  // Known values fields:
  // iconUrl (a resdb:/// link)
  // tagline (string)
  // description (string)
  // displayBadges (list, probably the badges you can assign to yourself with the bot, like hearing issues etc.)

  // /!\ BEWARE /!\
  // You need to send EVERYTHING back because there is no PATCH support
  // if you send only tagline, everything else will be removed
  // you have to get the whole thing, update it, send it back :(
  return Axios.put(`${API}/users/${userId}/profile`, values, {
    headers: {
      Authorization: `res ${userId}:${token}`
    }
  })
}

const onlineStats = (userId, token) => {
  return Axios.get(`${API}/stats/onlineStats`, {
    headers: {
      Authorization: `res ${userId}:${token}`
    }
  })
}

const resoniteApiClient = {
  API,
  MACHINEID,
  KEY,
  COMPAT,
  loginUserPassword,
  logout,
  fetchContacts,
  fetchContact,
  fetchUser,
  getUserMessages,
  getAssetsDomainUrl,
  getSessions,
  getSession,
  getUserRecordsAt,
  getUserRecord,
  getGroupRecordByPath,
  getGroupRecordsAt,
  getStorageQuota,
  saveUserProfileValue,
  onlineStats
}

export default resoniteApiClient
