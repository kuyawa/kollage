async function reset(txt, warn, btn, off, err) {
  Message(txt,warn); 
  Button(btn||'BUY NFT',off);
  if(err){ console.log('ERROR:', err) }
}

async function onBuy(){
  let timer = new Date().getTime()
  let info = null
  let tokenId = $('tokenId').value
  console.log('BUYING', tokenId)
  console.log('NFT:', nft) // stored in nfts view
  console.log('Timer:', timer)

  // CHECK NFT author and buyer not the same
  if(!session.account){ Message('Login with your XUMM wallet first',1); return; }
  if(!session.userid){ Message('Login with your XUMM wallet first',1); return; }
  console.log('Author/Session:', nft.userid, session.userid)
  if(nft.userid == session.userid){
    Message('Author can not buy own token')
    return
  }

  console.log('Timer:', new Date().getTime()-timer); timer = new Date().getTime()
  Message('Buying NFT, wait a moment...')

  // Upload metadata to ARWEAVE
  console.log('Timer:', new Date().getTime()-timer); timer = new Date().getTime()
  Message('Uploading metadata, wait a moment...')
  let rare = (nft.sold+1) + '/' + (nft.copies||'Unlimited')
  let meta = {
    name:         nft.name,
    description:  nft.description,
    image:        nft.artwork,
    rarity:       rare
  }
  console.log('METADATA:', meta)
  info = await api.post('/api/metadata', meta)
  console.log('RESP:', info)
  if(!info.success){ return reset('Error uploading metadata',1,0,1,info?.error) }
  nft.metadata = info.uri

  // NFT NEW OWNER
  nft.created  = new Date().toJSON().replace('T', ' ')
  nft.userid   = session.userid
  nft.forsale  = false
  nft.original = false
  nft.copies   = 1
  nft.sold     = 0
  nft.likes    = 0
  nft.views    = 0

  // Mint NFT on server
  console.log('Timer:', new Date().getTime()-timer); timer = new Date().getTime()
  Message('Minting NFT, wait a moment...')
  let mint = {metadata:nft.metadata, taxon:nft.taxon}
  console.log('NEW NFT:', mint)
  info = await api.post('/api/nft/mint', mint)
  console.log('RESP:', info)
  if(!info.success){ return reset('Error minting NFT',1,0,1,info?.error) }
  if(!nft.masterid){
    nft.masterid = nft.tokenid
  }
  nft.tokenid = info.tokenId

  // Save NFT to DB
  console.log('Timer:', new Date().getTime()-timer); timer = new Date().getTime()
  Message('Saving NFT, wait a moment...')
  console.log('SAVE NFT:', nft)
  info = await api.post('/api/nft/save', nft)
  console.log('RESP:', info)
  if(!info.success){ return reset('Error saving NFT',1,0,1,info?.error) }
  nft.id = info.nftId

  // Create sell offer
  console.log('Timer:', new Date().getTime()-timer); timer = new Date().getTime()
  Message('Creating Sell Offer, wait a moment...')
  let offer = {
    type:          0,
    sellerid:      session.minterid,
    collectionid:  nft.collectionid,
    artworkid:     nft.id,
    masterid:      nft.masterid,
    tokenid:       nft.tokenid,
    price:         nft.price,
    royalties:     nft.royalties,
    beneficiary:   nft.beneficiary,
    buyerid:       session.userid,
    buyer:         session.account,
    rarity:        meta.rarity,
    wallet:        session.account,
    offerid:       null,
    status:        0     // 0.created 1.accepted 2.declined
  }
  console.log('OFFER:', offer)
  info = await api.post('/api/offer/sell', offer)
  console.log('RESP:', info)
  if(!info.success){ return reset('Error creating offer',1,0,1,info?.error) }
  offer.offerid = info.offerId

  // Save offer to DB
  console.log('Timer:', new Date().getTime()-timer); timer = new Date().getTime()
  Message('Saving offer, wait a moment...')
  console.log('SAVE OFFER:', offer)
  info = await api.post('/api/offer/save', offer)
  console.log('RESP:', info)
  if(!info.success){ return reset('Error saving offer',1,0,1,info?.error) }
  offer.recid = info.recId

  // Send offer to client for signing
  Message('Offer created, check your XUMM wallet and accept the offer!')
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
    info = await api.post('/api/offer/update', {recid:offer.recid, status:2})
    console.log('RESP:', info)
    return reset('Error accepting offer',1,0,1,signed?.error) 
  }
  console.log('OFFER ACCEPTED')
  info = await api.post('/api/offer/update', {recid:offer.recid, status:1, artworkid:offer.artworkid})
  console.log('RESP:', info)
  console.log('Timer:', new Date().getTime()-timer)

  Message(`Offer accepted, NFT transferred - <a href="/nft/${nft.tokenid}">VIEW</a>`)
  Button('DONE',1)
}

async function onSell(){
  let price = $('sellPrice').value
  console.log('Sell', nft.tokenid, 'for', price, 'XRP')
  // create sell offer
  // add offer to db
  // add offer to nft view
}

async function onStopSell(){
  console.log('Stop Sell', nft.tokenid)
  // cancel offer
}

function selectPage(evt, pageId) {
  let tabs = document.getElementsByClassName('tab')
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove('active')
  }
  evt.currentTarget.classList.add('active')

  let pages = document.getElementsByClassName('page')
  for (let i = 0; i < pages.length; i++) {
    pages[i].classList.add('hidden')
  }
  document.getElementById(pageId).classList.remove('hidden')
}

// END