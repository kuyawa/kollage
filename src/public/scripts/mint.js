function reset(txt, warn, btn, off, err) {
  Message(txt,warn); 
  Button(btn||'MINT NFT',off);
  if(err){ console.log('ERROR:', err) }
}

function onImageError(evt){
  console.log('Image error', evt)
  evt.target.src='/artworks/nftnew.jpg'
}

function onImagePreview(evt){
  console.log('Preview', evt)
  let file = evt.target.files[0]
  let reader = new FileReader()
  reader.onload = function(e)  {
      $('artwork-image').src = e.target.result
  }
  reader.readAsDataURL(file)
}

async function onMint(){
  Message('Minting NFT, please wait...')
  let resp, info
  let now = new Date()
  let exp = new Date(session.expires||'0')
  console.log('Session expires on', exp)
  if(!session.account){ Message('Login with your XUMM wallet first',1); return; }
  if(!session.userid){ Message('Login with your XUMM wallet first',1); return; }
  if(exp<now){ Message('Session expired, login with your XUMM wallet again',1); return; }
  if(!$('name').value){ Message('NFT name is required',1); return; }
  if(!$('desc').value){ Message('NFT description is required',1); return; }
  if(!$('price').value){ Message('Price in XRP is required',1); return; }
  let file = $('artwork-file').files[0]
  if(!file){ Message('Image is required, select a jpg or png max 2000x2000',1); return; }
  let ext = null
  switch(file.type){
    case 'image/jpg':
    case 'image/jpeg': ext = '.jpg'; break
    case 'image/png':  ext = '.png'; break
    //case 'text/plain': ext = '.txt'; break
  }
  if(!ext){ Message('Only JPG and PNG images are allowed'); return; }
  Button('WAIT',1)

  // Gather NFT data
  let combo = $('collection')
  let form = {
    collectionId:  combo.value,
    taxon:         combo.options[combo.selectedIndex].getAttribute('key'),
    name:          $('name').value,
    description:   $('desc').value,
    copies:        parseInt($('copies').value||0),
    price:         parseInt($('price').value||1),
    tags:          $('tags').value||''
  }

  // Get collection taxon
  //console.log('COLLECTION:', form.collectionId)
  //info = await api.get('/api/collection/'+form.collectionId)
  //console.log('INFO', info)
  //if(!info.success){ return reset('Error getting collection',1,0,1,info?.error) }
  //let taxon = info.data.taxon
  console.log('TAXON:', form.taxon)

  // Upload image to server and arweave
  let timer = new Date().getTime()
  console.log('Timer:', timer)
  Message('Uploading artwork, wait a moment...')
  let id   = app.utils.random.string() // To avoid collisions
  let name = id+ext
  let data = new FormData()
  data.append('name', name)
  data.append('perm', true) // permanent storage in arweave
  data.append('file', file)
  info = await api.upload('/api/artwork', data) // upload to server and arweave
  if(!info.success){ return reset('Error uploading image',1,0,1,info?.error) }
  console.log('UPLOAD', info)
  let image   = info.image
  let artwork = info.artwork

  let nft = {
    userid:        session.userid,
    collectionid:  form.collectionId,
    taxon:         form.taxon,
    name:          form.name,
    description:   form.description,
    media:         'image',
    image:         image,    // server
    artwork:       artwork,  // arweave
    metadata:      '',
    masterid:      '',
    tokenid:       '',
    royalties:     10,       // 10% fees
    beneficiary:   session.issuer,
    forsale:       true,
    original:      true,
    copies:        (parseInt(form.copies)||0),
    sold:          0,
    price:         (parseInt(form.price)||1),
    tags:          form.tags,
    likes:         0,
    views:         0,
    inactive:      false
  }

  // Upload metadata to ARWEAVE
  console.log('Timer:', new Date().getTime()-timer)
  Message('Uploading metadata, wait a moment...')
  let meta = {
    name:         nft.name,
    description:  nft.description,
    image:        nft.artwork,
    quantity:     nft.copies || 'Unlimited',
    quality:      'Original'     
  }
  console.log('METADATA:', meta)
  info = await api.post('/api/metadata', meta)
  console.log('RESP:', info)
  if(!info.success){ return reset('Error uploading metadata',1,0,1,info?.error) }
  nft.metadata = info.uri

  // Mint NFT on server
  console.log('Timer:', new Date().getTime()-timer)
  Message('Minting NFT, wait a moment...')
  let mint = {metadata:nft.metadata, taxon:nft.taxon}
  console.log('NEW NFT:', mint)
  info = await api.post('/api/nft/mint', mint)
  console.log('RESP:', info)
  if(!info.success){ return reset('Error minting NFT',1,0,1,info?.error) }
  nft.masterid = info.tokenId
  nft.tokenid  = info.tokenId

  // Save NFT to DB
  console.log('Timer:', new Date().getTime()-timer)
  Message('Saving NFT, wait a moment...')
  console.log('SAVE NFT:', nft)
  info = await api.post('/api/nft/save', nft)
  console.log('RESP:', info)
  if(!info.success){ return reset('Error saving NFT',1,0,1,info?.error) }
  nft.id = info.nftId

  // Create sell offer
  console.log('Timer:', new Date().getTime()-timer)
  Message('Creating Sell Offer, wait a moment...')
  let offer = {
    type:          0,
    sellerid:      session.minterid,
    collectionid:  nft.collectionid,
    artworkid:     nft.id,
    masterid:      nft.masterid,
    tokenid:       nft.tokenid,
    price:         0,
    royalties:     nft.royalties,
    beneficiary:   nft.beneficiary,
    buyerid:       session.userid,
    buyer:         session.account,
    offerid:       null,
    status:        0     // 0.created 1.accepted 2.declined
  }
  console.log('OFFER:', offer)
  info = await api.post('/api/offer/sell', offer)
  console.log('RESP:', info)
  if(!info.success){ return reset('Error creating offer',1,0,1,info?.error) }
  offer.offerid = info.offerId

  // Save offer to DB
  console.log('Timer:', new Date().getTime()-timer)
  Message('Saving offer, wait a moment...')
  console.log('SAVE OFFER:', offer)
  info = await api.post('/api/offer/save', offer)
  console.log('RESP:', info)
  if(!info.success){ return reset('Error saving offer',1,0,1,info?.error) }
  let offerId = info.recId

  // Send offer to client for signing
  Message('NFT created, check your XUMM wallet and accept the offer!')
  console.log('SIGN OFFER:', offer.offerid, session.account)
  let accept = {
    user_token: session.usertoken,
    txjson: {
      TransactionType:  'NFTokenAcceptOffer',
      Account:          session.account,
      NFTokenSellOffer: offer.offerid,
    }
  }
  let signed = await app.utils.sign(accept, session.usertoken)
  console.log('OFFER RESP:', signed)

  // update offer status to 1.accepted or 2.declined
  if(!signed.success){ 
    console.log('OFFER DECLINED')
    info = await api.post('/api/offer/update', {recid:offerId, status:2})
    console.log('RESP:', info)
    return reset('Error accepting offer',1,0,1,signed?.error) 
  }
  console.log('OFFER ACCEPTED')
  info = await api.post('/api/offer/update', {recid:offerId, status:1})
  console.log('RESP:', info)

  Message(`Offer accepted, NFT minted - <a href="/nft/${nft.tokenid}">VIEW</a>`)
  Button('DONE',1)
}

// END