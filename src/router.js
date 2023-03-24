const fetch  = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs     = require('fs')
const path   = require('path')
const crypto = require('crypto');
const xrpl   = require('xrpl'); 
const api    = require('./api.js');
const db     = require('./database.js'); 
const upload = require('./uploader.js'); 
const utils  = require('./utils.js'); 
const {Xumm} = require('xumm'); 


function hit(req,txt=''){ 
  console.warn(new Date().toJSON().substr(5,14).replace('T',' '), req.path, txt) 
  //console.warn('MEM', process.memoryUsage())
}

async function index(req, res){ 
  hit(req)
  try {
    let session = utils.getSession(req)
    let cols = await db.getCollections(1,10)
    let nfts = await db.getArtworks(1,10)
    let arts = await db.getUsers(1,10)
    res.render('index', {session, cols, nfts, arts, utils})
  } catch(ex) {
    console.error(new Date(), 'Server error', ex.message)
    return res.status(500).render('servererror', {session})
  }
}

async function faq(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  res.render('faq', {session})
}

async function deeplink(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  res.render('deeplink', {session})
}

async function login(req, res){
  hit(req)
  let session = utils.getSession(req)
  console.warn('Login', req.query)
  if(req.query.authorized){
    console.warn('Logged in')
  }
  res.render('login', {session})
}

async function profile(req, res){
  hit(req)
  let session = utils.getSession(req)
  if(!session.account){ return res.redirect('/login') }
  let user = await db.getUserByAccount(session.account)
  if(!user){ return res.render('notfound', {session}) }
  let cols = await db.getCollectionsByUser(user.recid)
  let arts = await db.getOriginalArtworksByUser(user.recid)
  let nfts = await db.getAcquiredArtworksByUser(user.recid)
  //let nfts = await db.getOffersByBuyer(user.recid)
  session.user = user
  //console.warn('user',user)
  //console.warn('cols',cols)
  //console.warn('arts',arts)
  //console.warn('nfts',nfts)
  res.render('profile', {session, user, cols, arts, nfts, utils})
}

async function profileView(req, res){
  hit(req)
  let session = utils.getSession(req)
  let name = req.params.id
  //console.warn('User:', name)
  let user = await db.getUserByName(name)
  if(!user){ return res.render('notfound', {session}) }
  let cols  = await db.getCollectionsByUser(user.recid)
  let arts  = await db.getOriginalArtworksByUser(user.recid)
  let nfts  = await db.getAcquiredArtworksByUser(user.recid)
  let sold  = await db.getOffersBySeller(user.recid)
  let total = await db.getOffersBySellerTotal(user.recid)
  session.user = user
  //console.warn('user',user)
  //console.warn('cols',cols)
  //console.warn('arts',arts)
  //console.warn('nfts',nfts)
  res.render('profile-view', {session, user, cols, arts, nfts, sold, total, utils})
}

async function artists(req, res){
  hit(req)
  let session = utils.getSession(req)
  session.page = req.query.page || 0
  let list = await db.getUsers()
  res.render('artists', {session, list, utils})
}

async function mint(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  if(!session.account){ return res.redirect('/login') }
  let cols = await db.getCollectionsByUser(session.userid)
  if(!cols || cols.length<1) {
    cols = [{recid: 1, taxon: '123456789', name: 'Public Collection'}]
  }
  res.render('mint', {session, cols})
}

async function collection(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  let collection = await db.getCollectionByTaxon(req.params.id)
  let artworks = await db.getArtworksByCollection(collection.recid)
  //console.warn('COL', collection)
  //console.warn('ART', artworks)
  res.render('collection', {session, collection, artworks, utils})
}

async function collections(req, res){
  hit(req)
  let session = utils.getSession(req)
  let list = await db.getCollections()
  res.render('collections', {session, list, utils})
}

async function collectionNew(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  if(!session.account){ return res.redirect('/login') }
  res.render('collection-new', {session})
}

async function nftView(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  let nft = await db.getArtworkByToken(req.params.id)
  let offersSell = await db.getSellOffersByToken(req.params.id)
  let offersBuy  = await db.getBuyOffersByToken(req.params.id)
  res.render('nft', {session, nft, offersSell, offersBuy, utils})
}

async function market(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  let nfts = await db.getArtworks()
  res.render('market', {session, nfts, utils})
}

async function marketSearch(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  session.query = req.params.query
  let nfts = await db.searchArtworks(req.params.query)
  res.render('market', {session, nfts, utils})
}

async function terms(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  res.render('terms', {session})
}

async function privacy(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  res.render('privacy', {session})
}

async function support(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  res.render('support', {session})
}


//---- XAPP

async function xapp(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  console.warn('XAPP:', req.url)
  console.warn('QUERY:', req.query)
  let token = req.query.xAppToken
  let theme = req.query.xAppStyle
  if(token){
    console.warn('OTT:', token)
    let url = 'https://xumm.app/api/v1/platform/xapp/ott/'+token
    let opt = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'X-API-Key': process.env.XUMM_KEY,
        'X-API-Secret': process.env.XUMM_SEC
      }
    }
    let txt = await fetch(url, opt)
    let jsn = await txt.json()
    //console.warn('JSON:', jsn)
    let account = jsn.account
    let network = jsn.nodetype
    let userid  = jsn.user
    //let xumm = new Xumm(process.env.XUMM_KEY, process.env.XUMM_SEC)
    //let pong = await xumm.ping()
    //console.warn('PONG', pong)
  }
  res.render('xapp/xapp', {session})
}

async function xappCollections(req, res){
  hit(req)
  let session = utils.getSession(req)
  let list = await db.getCollections()
  res.render('xapp/collections', {session, list, utils})
}

async function xappCollection(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  let collection = await db.getCollectionByTaxon(req.params.id)
  let artworks = await db.getArtworksByCollection(collection.recid)
  //console.warn('COL', collection)
  //console.warn('ART', artworks)
  res.render('xapp/collection', {session, collection, artworks, utils})
}

async function xappMarket(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  let nfts = await db.getArtworks()
  res.render('xapp/market', {session, nfts, utils})
}

async function xappArtists(req, res){
  hit(req)
  let session = utils.getSession(req)
  session.page = req.query.page || 0
  let list = await db.getUsers()
  res.render('xapp/artists', {session, list, utils})
}

async function xappNftView(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  let nft = await db.getArtworkByToken(req.params.id)
  let offersSell = await db.getSellOffersByToken(req.params.id)
  let offersBuy  = await db.getBuyOffersByToken(req.params.id)
  res.render('xapp/nft', {session, nft, offersSell, offersBuy, utils})
}

async function xappProfileView(req, res){
  hit(req)
  let session = utils.getSession(req)
  let name = req.params.id
  //console.warn('User:', name)
  let user = await db.getUserByName(name)
  if(!user){ return res.render('notfound', {session}) }
  let cols  = await db.getCollectionsByUser(user.recid)
  let arts  = await db.getOriginalArtworksByUser(user.recid)
  let nfts  = await db.getAcquiredArtworksByUser(user.recid)
  let sold  = await db.getOffersBySeller(user.recid)
  let total = await db.getOffersBySellerTotal(user.recid)
  session.user = user
  //console.warn('user',user)
  //console.warn('cols',cols)
  //console.warn('arts',arts)
  //console.warn('nfts',nfts)
  res.render('xapp/profile-view', {session, user, cols, arts, nfts, sold, total, utils})
}


//---- API

async function apiTest(req, res){ 
  hit(req)
  res.end('{"success":true}')
}

async function apiSearch(req, res){ 
  hit(req)
  let data = await db.searchArtworks(req.params.query)
  res.end(JSON.stringify(data))
}

async function apiUserGet(req, res){ 
  hit(req)
  let acct = req.params.id
  let user = await db.getUserByAccount(acct)
  res.end(JSON.stringify(user))
}

async function apiUserNew(req, res){ 
  hit(req)
  let data = req.body
  let info = await db.newUser(data)
  if(!info || info.error){
    let msg = info?.error||'Error creating user'
    return res.end(JSON.stringify({success:false, error:msg}))
  }
  return res.end(JSON.stringify({success:true, recid:info.id}))
}

async function apiUserSet(req, res){ 
  hit(req)
  let session = utils.getSession(req)
  let data = req.body
  //console.warn('USER', data)
  if(data.recid!=session.userid){ return res.end(JSON.stringify({success:false, error:'Error updating user info'})) }
  let info = await db.updateUser(data)
  if(!info || info.error){
    let msg = info?.error||'Error updating user'
    return res.end(JSON.stringify({success:false, error:msg}))
  }
  return res.end(JSON.stringify({success:true, recid:info}))
}

async function apiAvatar(req, res){ 
  hit(req)
  let name = req.body?.name
  let file = req.files?.file
  if(!file){ return res.status(500).end(JSON.stringify({success:false, error:'Avatar is required'})) }
  //console.warn('File', file)
  try {
    let folder = path.join(__dirname, 'public/avatars/')
    let filePath = folder+name
    console.warn('Uploading', file.name, 'as', name)
    file.mv(filePath, function(err) {
      if(err){ 
        console.error('Error:', err)
        return res.status(500).end(JSON.stringify({error:err})) 
      }
      console.warn('OK')
      return res.end(JSON.stringify({success:true, name:name}))
    })
  } catch(ex) {
    console.error(ex)
    res.end(JSON.stringify({success:false, error:ex.message}))
  }
}

async function apiArtwork(req, res){ 
  hit(req)
  let name = req.body?.name
  let file = req.files?.file
  let perm = req.body?.perm || false
  if(!file){ return res.status(500).end(JSON.stringify({success:false, error:'Artwork is required'})) }
  //console.warn('File', file)
  try {
    let folder = path.join(__dirname, 'public/artworks/')
    let filePath = folder+name
    console.warn('Uploading', file.name, 'as', name)
    //file.mv(filePath, function(err) {
    //   if(err){ 
    //     console.error('Error:', err)
    //     return res.status(500).end(JSON.stringify({error:err})) 
    //   }
    //   console.warn('OK')
    //   let artwork = ''
    //   if(perm){
    //     artwork = await upload.arweave(file.data, file.mimetype)
    //   }
    //   return res.end(JSON.stringify({success:true, image:name, artwork:artwork}))
    // })
    let ok = await file.mv(filePath)
    let artwork = ''
    if(perm){
      console.warn('Uploading to arweave...')
      let resp = await upload.arweave(file.data, file.mimetype)
      if(resp.error){ return res.status(500).end(JSON.stringify({success:false, error:'Error uploading artwork'})) }
      artwork = 'ar:'+resp.cid
    }
    return res.end(JSON.stringify({success:true, image:name, artwork:artwork}))
  } catch(ex) {
    console.error(ex)
    res.end(JSON.stringify({success:false, error:ex.message}))
  }
}

async function apiMetadata(req, res){ 
  hit(req)
  //console.warn('BODY', req.body)
  let meta = JSON.stringify(req.body, null, 2)
  try {
    console.warn('Uploading metadata to arweave...')
    let resp = await upload.arweave(meta, 'text/plain')
    if(resp.error){ return res.status(500).end(JSON.stringify({success:false, error:'Error uploading metadata'})) }
    let uri = 'ar:'+resp.cid
    return res.end(JSON.stringify({success:true, uri:uri}))
  } catch(ex) {
    console.error(ex)
    return res.end(JSON.stringify({success:false, error:ex.message}))
  }
}

async function apiNftMint(req, res){ 
  hit(req)
  let uri    = req.body?.metadata
  let taxon  = req.body?.taxon
  if(!uri){ return res.status(500).end(JSON.stringify({success:false, error:'URI metadata is required'})) }
  console.warn('Minting...')
  try {
    let wallet   = xrpl.Wallet.fromSeed(process.env.MINTER_KEY)
    let account  = wallet.classicAddress
    let issuer   = process.env.ISSUER_ACCT
    let nftUri   = xrpl.convertStringToHex(uri)
    let nftTaxon = parseInt(taxon)
    let flags    = xrpl.NFTokenMintFlags.tfBurnable + xrpl.NFTokenMintFlags.tfOnlyXRP + xrpl.NFTokenMintFlags.tfTransferable
    let trxFee   = '12'
    let xfrFee   = 10000 // 10%
    let tx = {
      TransactionType: 'NFTokenMint',
      Account:         account,
      Issuer:          issuer,
      URI:             nftUri,   // uri to metadata
      NFTokenTaxon:    nftTaxon, // id for all nfts minted by us
      Flags:           flags,    // burnable, onlyXRP, transferable
      Fee:             trxFee,
      TransferFee:     xfrFee
    }
    let resp = await api.submitAndWait(tx, process.env.MINTER_KEY)
    //console.warn('Result:', resp)
    if(resp.success){
      let tokenId = utils.findToken(resp.tx)
      if(!tokenId){
        console.warn('TokenId not found')
        return res.end(JSON.stringify({success:false, error:'TokenId not found while minting'}))
      }
      console.warn('TokenId:', tokenId)
      return res.end(JSON.stringify({success:true, tokenId:tokenId}))
    } else {
      return res.end(JSON.stringify({success:false, error:'Error minting NFT'}))
    }
  } catch(ex) {
    console.error(ex)
    return res.end(JSON.stringify({success:false, error:ex.message}))
  }
}

async function apiNftSave(req, res){ 
  hit(req)
  let nft = req.body
  console.warn('Saving NFT', nft.tokenid)
  //console.warn('NFT', nft)
  try {
    let info = await db.newArtwork(nft)
    if(!info || info.error){
      let msg = info?.error||'Error saving nft'
      return res.end(JSON.stringify({success:false, error:msg}))
    }
    return res.end(JSON.stringify({success:true, nftId:info.id}))
  } catch(ex) {
    console.error(ex)
    return res.end(JSON.stringify({success:false, error:ex.message}))
  }
}

async function apiOfferSell(req, res){ 
  hit(req)
  let offer = req.body
  console.warn('Offer:', offer.tokenid)
  console.warn('Buyer:', offer.buyer)
  console.warn('Price:', offer.price)
  try {
    let expiry = null
    let drops = xrpl.xrpToDrops(offer.price||0)
    if(offer.expiry){ 
      expiry = isoTimeToRippleTime(offer.expiry) // must be Ripple epoch
      console.warn('Expires:', expiry)
    }
    let wallet  = xrpl.Wallet.fromSeed(process.env.MINTER_KEY)
    let account = wallet.classicAddress
    let trxFee  = '12'
    console.warn('Seller:', account)
    let tx = {
      TransactionType: 'NFTokenCreateOffer',
      Account:         account,
      NFTokenID:       offer.tokenid,
      Destination:     offer.buyer,
      Amount:          drops,  // Zero if it is a transfer
      Flags:           xrpl.NFTokenCreateOfferFlags.tfSellNFToken, // sell offer
      Fee:             trxFee,
    }
    let resp = await api.submitAndWait(tx, process.env.MINTER_KEY)
    //console.warn('Result:', resp)
    if(resp.success){
      let offerId = utils.findOffer(resp.tx)
      console.warn('OfferId', offerId)
      return res.end(JSON.stringify({success: true, offerId:offerId}))
    } else {
      return res.end(JSON.stringify({success: false, error:'Failure creating sell offer'}))
    }
  } catch(ex) {
    console.error(ex)
    return res.end(JSON.stringify({success: false, error:'Error creating sell offer'}))
  }
}

async function apiOfferBuy(req, res){ 
  hit(req)
  let offer = req.body
  try {
    // TODO: tx sell offer
    let offerId = '123456'
    return res.end(JSON.stringify({success:true, offerId:offerId}))
  } catch(ex) {
    console.error(ex)
    return res.end(JSON.stringify({success:false, error:ex.message}))
  }
}

async function apiOfferSave(req, res){ 
  hit(req)
  let offer = req.body
  try {
    let data = await db.newOffer(offer)
    return res.end(JSON.stringify({success:true, recid:data.id}))
  } catch(ex) {
    console.error(ex)
    return res.end(JSON.stringify({success:false, error:ex.message}))
  }
}

async function apiOfferUpdate(req, res){ 
  hit(req)
  let offer = req.body
  if(offer.status == 1){
    db.artworkSold(offer.artworkid)
  }
  try {
    let data = await db.updateOffer(offer)
    return res.end(JSON.stringify({success:true}))
  } catch(ex) {
    console.error(ex)
    return res.end(JSON.stringify({success:false, error:ex.message}))
  }
}

async function apiCollections(req, res){ 
  hit(req)
  try {
    let data = await db.getCollections()
    return res.end(JSON.stringify({success:true, data:data}))
  } catch(ex) {
    console.error(ex)
    return res.end(JSON.stringify({success:false, error:ex.message}))
  }
}

async function apiCollectionNew(req, res){ 
  hit(req)
  try {
    let data = await db.newCollection(req.body)
    return res.end(JSON.stringify({success:true, data:data}))
  } catch(ex) {
    console.error(ex)
    return res.end(JSON.stringify({success:false, error:ex.message}))
  }
}

async function apiCollectionGet(req, res){ 
  hit(req)
  let id = req.params.id
  try {
    let data = await db.getCollectionById(id)
    return res.end(JSON.stringify({success:true, data:data}))
  } catch(ex) {
    console.error(ex)
    return res.end(JSON.stringify({success:false, error:ex.message}))
  }
}


//---- UTILS

async function apiCatchAll(req, res){ 
  hit(req, 'not found')
  res.status(404).end('{"error":"Resource not found"}')
}

async function notFound(req, res){ 
  hit(req, 'not found')
  let session = utils.getSession(req)
  res.status(404).render('notfound', {session})
}

module.exports = {
  index,
  login,
  profile,
  profileView,
  artists,
  collection,
  collections,
  collectionNew,
  mint,
  nftView,
  market,
  marketSearch,
  faq,
  terms,
  privacy,
  support,
  deeplink,
  xapp,
  xappCollections,
  xappCollection,
  xappMarket,
  xappArtists,
  xappNftView,
  xappProfileView,
  apiTest,
  apiSearch,
  apiUserGet,
  apiUserNew,
  apiUserSet,
  apiAvatar,
  apiArtwork,
  apiMetadata,
  apiCollections,
  apiCollectionNew,
  apiCollectionGet,
  apiNftMint,
  apiNftSave,
  apiOfferSell,
  apiOfferBuy,
  apiOfferSave,
  apiOfferUpdate,
  apiCatchAll,
  notFound
}

// END