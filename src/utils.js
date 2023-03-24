// UI Utils

function available(sold,qty) {
  if(!qty){ return 'Unlimited' }
  return (qty-sold)+'/'+qty
}

function dateBase(date) {
  return (new Date(date)).toJSON().replace('T', ' ').substr(0,16)
}

function dateLong(date) {
  var opt = {
    weekday: "long",
    day:     "numeric",
    month:   "long",
    year:    "numeric"
  }
  return (new Date(date)).toLocaleDateString('en', opt)
}

function dateShort(date) {
  var opt = {
    time:    "none",
    weekday: "long",
    day:     "numeric",
    month:   "short",
    year:    "numeric"
  }
  return (new Date(date)).toLocaleDateString('en', opt)
}

function dateTime(date) {
  var opt = {
    hour:    "2-digit",
    minute:  "2-digit",
    weekday: "long",
    day:     "numeric",
    month:   "short",
    year:    "numeric"
  }
  return (new Date(date)).toLocaleDateString('en', opt)
}

function findOffer(txInfo){
  for (var i = 0; i < txInfo.result.meta.AffectedNodes.length; i++) {
    let node = txInfo.result.meta.AffectedNodes[i]
    if(node.CreatedNode && node.CreatedNode.LedgerEntryType=='NFTokenOffer'){
      return node.CreatedNode.LedgerIndex
    }
  }
}

function findToken(txInfo){
  let found = null
  for (var i=0; i<txInfo.result.meta.AffectedNodes.length; i++) {
    let node = txInfo.result.meta.AffectedNodes[i]
    if(node.ModifiedNode && node.ModifiedNode.LedgerEntryType=='NFTokenPage'){
      let m = node.ModifiedNode.FinalFields.NFTokens.length
      let n = node.ModifiedNode.PreviousFields.NFTokens.length
      for (var j=0; j<m; j++) {
        let tokenId = node.ModifiedNode.FinalFields.NFTokens[j].NFToken.NFTokenID
        found = tokenId
        for (var k=0; k<n; k++) {
          if(tokenId==node.ModifiedNode.PreviousFields.NFTokens[k].NFToken.NFTokenID){
            found = null
            break
          }
        }
        if(found){ break }
      }
    }
    if(found){ break }
  }
  return found
}

function getSession(req) {
  let session = {
    explorer:  process.env.EXPLORER,
    gateway:   process.env.GATEWAY,
    issuer:    process.env.ISSUER_ACCT,
    minter:    process.env.MINTER_ACCT,
    minterid:  process.env.MINTER_ID,
    network:   process.env.NETWORK,
    rpcurl:    process.env.RPCURL,
    wssurl:    process.env.WSSURL,
    xummkey:   process.env.XUMM_KEY,
    theme:     req.cookies.theme || 'DARK',
    account:   req.cookies.account,
    avatar:    req.cookies.avatar,
    userid:    req.cookies.userid,
    username:  req.cookies.username,
    usertoken: req.cookies.usertoken,
    expires:   req.cookies.expires
  }
  let now = new Date()
  let exp = new Date(session.expires||'0')
  if(exp<now){ 
    session.account = ''
    session.avatar = ''
    session.userid = ''
    session.username = ''
    session.usertoken = ''
    session.expires = ''
  }
  return session
}

function offerStatus(status, type) {
  switch(status){
    case 0: return 'open';     break
    case 1: return 'accepted'; break
    case 2: return 'rejected'; break
  }
  return 'Unknown'
}

function plural(cnt, sng, plr) {
  if(!plr){ plr = sng+'s' }
  return cnt + ' ' + (cnt==1?sng:plr)
}

async function randomAddress() {
    let buf = await crypto.randomBytes(20)
    let adr = '0x'+buf.toString('hex')
    return adr
}

function randomString(len=10){
    let ret = ''
    const chars = 'abcdefghijklmnopqrstuvwxyz'
    for (let i=0; i<len; ++i) {
        ret += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return ret
}

function rarity(qty) {
  if(qty==0){  return 'Unlimited' }
  if(qty==1){  return 'Unique' }
  if(qty<10){  return 'Legendary' }
  if(qty<100){ return 'Rare' }
  return 'Common'

}

function timeAgo(date) {
  var seconds = Math.floor((new Date() - date) / 1000)
  var interval = seconds / 31536000
  if (interval > 1) {
    let n = Math.floor(interval)
    return  n + ' year' + (n==1?'':'s')
  }
  interval = seconds / 2592000
  if (interval > 1) {
    let n = Math.floor(interval)
    return n + ' month' + (n==1?'':'s')
  }
  interval = seconds / 86400
  if (interval > 1) {
    let n = Math.floor(interval)
    return n + ' day' + (n==1?'':'s')
  }
  interval = seconds / 3600
  if (interval > 1) {
    let n = Math.floor(interval)
    return n + ' hour' + (n==1?'':'s')
  }
  interval = seconds / 60
  if (interval > 1) {
    let n = Math.floor(interval)
    return n + ' minute' + (n==1?'':'s')
  }
  interval = seconds
  let n = Math.floor(interval)
  if(n<5){ return 'seconds' }
  return n + ' second' + (n==1?'':'s')
}


module.exports = {
  dateBase,
  dateLong,
  dateShort,
  dateTime,
  findOffer,
  findToken,
  getSession,
  offerStatus,
  plural,
  randomAddress,
  randomString,
  rarity,
  timeAgo,
}

// END