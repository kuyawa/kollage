let fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
let xrpl  = require('xrpl')

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

async function ripplePost(data, url) {
  if(!url){ url = process.env.RPCURL }
  console.warn('POST', url)
  try {
    let opt = {
      method: 'post',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(data)
    }
    let resp = await fetch(url, opt)
    let info = await resp.json()
    return info
  } catch(ex) {
    console.error(ex)
    return {error:ex.message}
  }
}

async function submitAndWait(tx, key, url) {
  try {
    console.warn('TX', tx)
    let info = await ripplePost({method:'account_info', params:[{account:tx.Account}]}, url)
    if(info.error){ return {success:false, error:info.error} }
    console.warn('Info', info)
    tx.Sequence = info.result.account_data.Sequence
    let walt = xrpl.Wallet.fromSeed(key)
    let blob = walt.sign(tx)
    let hash = blob.hash // txid
    console.warn('TXID', hash)
    let resp = await ripplePost({method:'submit', params:[{tx_blob:blob.tx_blob}]}, url)
    if(resp.result.error){
      console.error('ERROR', resp)
      return {success:false, error:resp.result.error}
    }
    if(resp.result.accepted && resp.result.status=='success'){
      console.warn('SUBMITTED')
      let txid = resp.result.tx_json.hash
      let cntr = 0
      let data = null
      do { // wait for confirmation
        cntr += 1
        await sleep(2000)
        data = await ripplePost({method:'tx', params:[{transaction:txid}]}, url)
        console.warn(cntr, 'confirmed', data.result.validated)
        if(data.result.status='success' && data.result.validated){
          console.warn('CONFIRMED', txid)
          return {success:true, validated:true, txid:txid, tx:data}
        }
      } while(cntr < 10)
      console.warn('TIMEOUT')
      return {success:true, validated:false, txid:txid, tx:data}
    } else {
      console.warn('FAIL', resp)
      return {success:false, error:'Transaction failure'}
    }
  } catch(ex) {
    console.error('ERROR:', ex)
    return {success:false, error:ex.message}
  }
}


module.exports = {
  sleep,
  ripplePost,
  submitAndWait
}

// END