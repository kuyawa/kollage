// LOGIN

var xumm = null

async function xummHandler(state){
  Message('XUMM wallet connected')
  console.log('STATE', state)
  let connected = false
  if(state.me.account){
    let account = state.me.account
    let network = state.me.networkType
    let usertoken = state.jwt
    if(state.me.networkEndpoint.startsWith('wss://xls20')){
      let network = 'NFT-DEVNET'
    }
    // get user from registry
    let userid = ''
    let username = ''
    let avatar = 'noavatar.jpg'
    let user = await api.get('/api/user/'+account)
    console.log('USER', user)
    if(!user || user.error){
      let data = {
        account: account,
        name:    account.substr(0,10),
        tagline: 'A new user',
        avatar:  avatar
      }
      let result = await api.post('/api/user', data)
      console.log('CREATE', result)
      if(result.success){
        userid   = result.recid
        username = data.name
      }
    } else {
      userid   = user.recid
      username = user.name
      avatar   = user.avatar
    }
    console.log('account',  account)
    console.log('network',  network)
    console.log('userid',   userid)
    console.log('username', username)
    //console.log('usertoken', usertoken)
    $('topAvatar').src = '/avatars/'+avatar
    $('connect').innerHTML = username
    app.utils.setCookie('account',   account)
    app.utils.setCookie('avatar',    avatar)
    app.utils.setCookie('network',   network)
    app.utils.setCookie('userid',    userid)
    app.utils.setCookie('username',  username)
    app.utils.setCookie('usertoken', usertoken)
    app.utils.setCookie('expires',   app.utils.tomorrow())
    connected = true
  }
  if(connected){
    console.log('Connected')
    window.location.href = window.location.origin+'/profile'
  }
}

async function onConnect(){
  console.log('Connect...')
  let state = await xumm.authorize()
  //xummHandler(state)
}

async function onLogout(){
  console.log('Logout...')
  xummLogout()
  app.utils.setCookie('account',   '')
  app.utils.setCookie('avatar',    '')
  app.utils.setCookie('userid',    '')
  app.utils.setCookie('username',  '')
  app.utils.setCookie('usertoken', '')
  app.utils.setCookie('expires',   '')
}

async function xummLogout(){
  let xumm = new XummPkce(session.xummkey)
  xumm.logout()
  Message('XUMM wallet disconnected')
  console.log('Disconnected')
}

async function xummStart(url, chk=false){
  console.log('XUMM start...')
  try {
    if(!url){ url = window.location.origin+'/login?authorized=true' }
    let opts = {implicit:true, redirectUrl:url, rememberJwt:chk}
    xumm = new XummPkce(session.xummkey, opts)
    await xumm.logout()
    xumm.on('error', async (ex) => {
      console.log('XUMM error', ex)
    })
    xumm.on('success', async () => {
      console.log('XUMM started')
      let state = await xumm.state()
      xummHandler(state)
    })
    xumm.on('retrieved', async () => {
      console.log('XUMM retrieved')
      let state = await xumm.state()
      xummHandler(state)
    })
  } catch(ex) {
    console.error(ex)
  }
}

function start(){
  console.log('Login...')
  console.log('Query', window.location.search)
  let url, chk = null
  let query = new URL(window.location.href)
  if(query.searchParams.has('authorized')){
    console.log('Authorized')
    url = window.location.origin+'/profile'
    chk = false
  } else {
    url = window.location.origin+'/login?authorized=true'
    chk = false
  }
  xummStart(url, chk)
}

