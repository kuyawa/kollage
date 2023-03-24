// Common utils

function $(id){ return document.getElementById(id) }

function Message(text, warn){
  console.log(text)
  if(warn){ text = '<warn>'+text+'</warn>' }
  let msg = document.getElementById('message')
  if(msg){ msg.innerHTML = text }
}

function Button(text, disabled){
  let button = document.getElementById('actionButton')
  if(button){ 
    button.innerHTML = text 
    button.setAttribute('disabled', disabled?'disabled':'')
  }
}


class Utils {
  setCookie = function(name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    let path = '; path=/';
    document.cookie = `${name}=${value}${expires}${path}`;
    //document.cookie = name + '=' + (value || '') + expires + '; path=/';
  }

  getCookie = function(name) {
    let value = null;
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') { c = c.substring(1, c.length); }
      if (c.indexOf(nameEQ) == 0) { value = c.substring(nameEQ.length, c.length); break; }
    }
    return value;
  }

  copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(function() {
        console.log('Copying to clipboard was successful!');
    }, function(err) {
        console.error('Could not copy to clipboard:', err);
    });
  }

  changeTheme = function(evt) {
    console.log('Prev theme', document.body.dataset.theme)
    let theme = document.body.dataset.theme=='dark'?'lite':'dark'
    document.body.dataset.theme = theme
    document.getElementById('text-theme').innerHTML = theme=='dark'?'Lite Mode':'Dark Mode'
    this.setCookie('theme', theme)
    console.log('Changed theme to', theme)
    evt.stopPropagation()
    evt.preventDefault()
    return false
  }

  setTheme = function() {
    let theme = this.getCookie('theme')
    console.log('Theme', theme)
    if(!theme){
      theme = 'dark'
      this.setCookie('theme', theme)
    }
    document.body.dataset.theme = theme
    document.getElementById('text-theme').innerHTML = theme=='dark'?'Lite Mode':'Dark Mode'
  }

  random = {
    number: function(len=10){
      let ret = '';
      const chars = '0123456789';
      for (let i=0; i<len; ++i) {
          ret += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return ret;
    },
    string: function(len=10){
      let ret = '';
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      for (let i=0; i<len; ++i) {
          ret += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return ret;
    },
    address: function(){
      let buf = crypto.getRandomValues(new Uint8Array(20));
      let adr = '0x'+Array.from(buf).map(x=>{return x.toString(16).padStart(2,'0')}).join('');
      return adr;
    }
  }

  tomorrow = function() {
    let now = new Date()
    let tomorrow = new Date(now.setDate(now.getDate() + 1))
    return tomorrow.toJSON()
  }

  sign = async function(tx, userToken) {
    console.log('SIGN TX', tx)
    try {
      let {XummSdkJwt} = require('xumm-sdk')
      if(!XummSdkJwt){ return {success:false, error:'XUMM wallet not found'} }
      let xumm = new XummSdkJwt(userToken)
      if(!xumm){ return {success:false, error:'Login with XUMM wallet first'} }
      let {created, resolved} = await xumm.payload.createAndSubscribe(tx, function (payloadEvent) {
        if(typeof payloadEvent.data.signed !== 'undefined') {
          console.log('EVENT>', payloadEvent)
          console.log('DATA>', payloadEvent.data)
          return payloadEvent.data  // Resolved value of the `resolved` property
        }
        console.log('DATA?', payloadEvent.data) // check progress
      })
      //console.log('C', created)
      //console.log('R', resolved)
      let payloadId = created?.uuid
      console.log('PAYLOADID', payloadId)
      if(payloadId){ 
        let outcome = await resolved
        console.log('OUTCOME', outcome)
        console.log('SIGNED', outcome?.signed)
        if(outcome.signed){
          console.log('TXID', outcome?.txid)
          return {success:true, payloadId:payloadId, transactionId:outcome?.txid}
        } else {
          return {success:false, error:'User declined signature'}
        }
      } else {
        console.error('NO PAYLOAD ID')
        return {success:false, error:'Error signing transaction'}
      }
    } catch(ex) {
      console.error('ERROR:', ex)
      return {success:false, error:ex.message}
    }
  }
}


// Fetch from server
class Api {
  async get(url){
    try {
      let resp = await fetch(url)
      let info = await resp.json()
      return info
    } catch(ex) {
      console.error(ex)
      return {success:false, error:ex.error}
    }
  }
  async post(url, data){
    try {
      let options = {
        method: 'POST', 
        headers: {'content-type':'application/json'}, 
        body: JSON.stringify(data)
      }
      let resp = await fetch(url, options)
      let info = await resp.json()
      return info
    } catch(ex) {
      console.error(ex)
      return {success:false, error:ex.error}
    }
  }
  async put(url, data){
    try {
      let options = {
        method: 'PUT', 
        headers: {'content-type':'application/json'}, 
        body: JSON.stringify(data)
      }
      let resp = await fetch(url, options)
      let info = await resp.json()
      return info
    } catch(ex) {
      console.error(ex)
      return {success:false, error:ex.error}
    }
  }
  async delete(url){
    // Not used
    return {success:false, error:'Delete is not available'}
  }
  async upload(url, data){
    try {
      let options = {
        method: 'POST',
        body: data
      }
      let resp = await fetch(url, options)
      let info = await resp.json()
      return info
    } catch(ex) {
      console.error(ex)
      return {success:false, error:ex.error}
    }
  }
}


class App {
  name = 'KOLLAGE'
  version = '1.0.0'
  utils = new Utils()

  init = function() {
    console.log(app.name, app.version)
    console.log('App started')
    this.utils.setTheme()
  }

  search = async function() {
    let query = $('searchText').value
    console.log('Search', query)
    if(!query || query.trim().length==0){ return }
    //let results = await api.get('/api/search/'+query)
    //console.log('Results', results)
    window.location.href = '/market/'+query
  }
}

window.api = new Api()
window.app = new App()
app.init()

if(window.start){
  window.onload = start
}

// END