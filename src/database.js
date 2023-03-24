// DATABASE

const postgres = require('pg')
const dbconn   = process.env.DATABASE
if(!dbconn){ console.error('DATASERVER NOT AVAILABLE') }
const dbp = new postgres.Pool({ connectionString: dbconn })


class DataServer {
  async connect() {}
  async disconnect() {}

  async insert(sql, params, key) {
    var dbc, res, recid, data = null
    try {
      dbc = await dbp.connect()
      res = await dbc.query(sql, params)
      if(res.rowCount>0) { 
        recid = key?res.rows[0][key]:0
        data  = { status:'OK', id: recid }
      }
    } catch(ex) {
      console.error('DB-ERROR on new record:', ex.message)
      data = { error: ex.message }
    } finally {
      if (dbc) { dbc.release() }
    }
    return data
  }

  async update(sql, params) {
    var dbc, res, data = null
    try {
      dbc = await dbp.connect()
      res = await dbc.query(sql, params)
      if(res.rowCount>0) {
        data = res.rowCount
      } else { 
        data = 0
      }
    } catch(ex) {
      console.error('DB-ERROR updating records:', ex.message)
      data = { error: ex.message }
    } finally {
      if (dbc) { dbc.release() }
    }
    return data
  }

  async delete(sql, params) {
    var dbc, res, data = null
    try {
      dbc = await dbp.connect()
      res = await dbc.query(sql, params)
      if(res.rowCount>0) {
        data = res.rowCount
      } else { 
        data = 0
      }
    } catch(ex) {
      console.error('DB-ERROR deleting records:', ex.message)
      data = { error: ex.message }
    } finally {
      if (dbc) { dbc.release() }
    }
    return data
  }

  async query(sql, params) {
    var dbc, res, data = null
    try {
      dbc = await dbp.connect()
      res = await dbc.query(sql, params)
      if(res.rows.length>0) { 
        data = res.rows
      } else {
        data = []
      }
    } catch(ex) {
      console.error('DB-ERROR in query:', ex.message)
      data = { error: ex.message }
    } finally {
      if (dbc) { dbc.release() }
    }
    return data
  }

  async queryObject(sql, params) {
    var dbc, res, data = null
    try {
      dbc = await dbp.connect()
      res = await dbc.query(sql, params)
      if(res.rows.length>0) { 
        data = res.rows[0]
      }
    } catch(ex) {
      console.error('DB-ERROR getting data object:', ex.message)
      data = { error: ex.message }
    } finally {
      if (dbc) { dbc.release() }
    }
    return data
  }

  async queryValue(sql, params) {
    var dbc, res, data = null
    try {
      dbc = await dbp.connect()
      res = await dbc.query(sql, params)
      if(res.rows.length>0) { 
        data = res.rows[0].value // Select should have field as value
      }
    } catch(ex) {
      console.error('DB-ERROR getting data value:', ex.message)
      data = { error: ex.message }
    } finally {
      if (dbc) { dbc.release() }
    }
    return data
  }
}


const DS = new DataServer()


//---- USERS

async function newUser(rec) {
  let sql = 'insert into users(account, name, namex, tagline, avatar, email) values($1, $2, $3, $4, $5, $6) returning recid'
  let par = [rec.account, rec.name, rec.name.toLowerCase(), rec.tagline, rec.avatar, rec.email]
  let dat = await DS.insert(sql, par, 'recid')
  return dat
}

async function updateUser(rec) {
  let sql = 'update users set name=$1, namex=$2, tagline=$3, avatar=$4, email=$5 where recid = $6'
  let par = [rec.name, rec.name.toLowerCase(), rec.tagline, rec.avatar, rec.email, rec.recid]
  let dat = await DS.update(sql, par)
  return dat
}

async function getUserByAccount(account) {
  let sql = 'select * from users where account=$1'
  let par = [account]
  let dat = await DS.queryObject(sql, par)
  return dat
}

async function getUserByName(name) {
  let sql = 'select * from users where namex=$1'
  let par = [name.toLowerCase()]
  let dat = await DS.queryObject(sql, par)
  return dat
}

async function getUsers(page=1, limit=100) {
  let offset = (page-1)*limit
  let sql = 'select * from users '+
            'where not inactive '+
            'order by created desc '+
            'limit $1 offset $2'
  let par = [limit, offset]
  let dat = await DS.query(sql, par)
  return dat
}


//---- COLLECTIONS

async function newCollection(rec) {
  let sql = 'insert into collections(userid,name,description,image,taxon,nftcount,inactive) '+
            'values($1, $2, $3, $4, $5, $6, $7) returning recid'
  let par = [rec.userid,rec.name,rec.description,rec.image,rec.taxon,rec.nftcount,rec.inactive]
  let dat = await DS.insert(sql, par, 'recid')
  return dat
}

async function getCollections(page=1, limit=100) {
  let offset = (page-1)*limit
  let sql = 'select c.*, u.name as author '+
            'from collections c '+
            'left outer join users u on c.userid = u.recid '+
            'where not c.inactive '+
            'order by c.created desc '+
            'limit $1 offset $2'
  let par = [limit, offset]
  let dat = await DS.query(sql, par)
  return dat
}

async function getCollectionById(id) {
  let sql = 'select c.*, u.name as author '+
            'from collections c '+
            'left outer join users u on c.userid = u.recid '+
            'where c.collectionid = $1'
  let par = [id]
  let dat = await DS.queryObject(sql, par)
  return dat
}

async function getCollectionByTaxon(taxon) {
  let sql = 'select c.*, u.name as author '+
            'from collections c '+
            'left outer join users u on c.userid = u.recid '+
            'where c.taxon = $1'
  let par = [taxon]
  let dat = await DS.queryObject(sql, par)
  return dat
}

async function getCollectionsByUser(userid) {
  let sql = 'select * from collections where userid=$1'
  let par = [userid]
  let dat = await DS.query(sql, par)
  return dat
}


//---- ARTWORKS

async function newArtwork(rec) {
  let sql = 'insert into artworks(userid,collectionid,taxon,name,description,media,image,artwork,metadata,masterid,tokenid,royalties,beneficiary,forsale,original,copies,sold,price,tags,likes,views,inactive) '+
            'values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) returning recid'
  let par = [rec.userid,rec.collectionid,rec.taxon,rec.name,rec.description,rec.media,rec.image,rec.artwork,rec.metadata,rec.masterid,rec.tokenid,rec.royalties,rec.beneficiary,rec.forsale,rec.original,rec.copies,rec.sold,rec.price,rec.tags,rec.likes,rec.views,rec.inactive]
  let dat = await DS.insert(sql, par, 'recid')
  return dat
}

async function getArtworks(page=1, limit=100) {
  let offset = (page-1)*limit
  let sql = 'select a.*, c.name as collection, u.name as author '+
            'from artworks a '+
            'left outer join collections c on a.collectionid = c.recid '+
            'left outer join users u on a.userid = u.recid '+
            'where a.original=true and a.inactive=false '+
            'order by a.created desc '+
            'limit $1 offset $2'
  let par = [limit, offset]
  let dat = await DS.query(sql, par)
  return dat
}

async function getArtworksByCollection(id) {
  let sql = 'select a.*, c.name as collection, u.name as author' +
            '  from artworks a' +
            '  left outer join collections c on a.collectionid = c.recid' +
            '  left outer join users u on a.userid = u.recid' +
            '  where a.collectionid = $1'
  let par = [id]
  let dat = await DS.query(sql, par)
  return dat
}

async function getArtworksByTaxon(id) {
  let sql = 'select a.*, c.name as collection, u.name as author' +
            '  from artworks a' +
            '  left outer join collections c on a.collectionid = c.recid' +
            '  left outer join users u on a.userid = u.recid' +
            '  where a.taxon = $1'
  let par = [id]
  let dat = await DS.query(sql, par)
  return dat
}

async function getArtworksByUser(userid) {
  let sql = 'select a.*, c.name as collection, u.name as author' +
            '  from artworks a' +
            '  left outer join collections c on a.collectionid = c.recid' +
            '  left outer join users u on a.userid = u.recid' +
            '  where a.userid = $1'
  let par = [userid]
  let dat = await DS.query(sql, par)
  return dat
}

async function getOriginalArtworksByUser(userid) {
  let sql = 'select a.*, c.name as collection, u.name as author' +
            '  from artworks a' +
            '  left outer join collections c on a.collectionid = c.recid' +
            '  left outer join users u on a.userid = u.recid' +
            '  where a.userid = $1 and a.original = true and a.inactive = false'
  let par = [userid]
  let dat = await DS.query(sql, par)
  return dat
}

async function getAcquiredArtworksByUser(userid) {
  let sql = 'select a.*, c.name as collection, u.name as author' +
            '  from artworks a' +
            '  left outer join collections c on a.collectionid = c.recid' +
            '  left outer join users u on a.userid = u.recid' +
            '  where a.userid = $1 and a.original = false and a.inactive = false'
  let par = [userid]
  let dat = await DS.query(sql, par)
  return dat
}

async function getArtworkById(id) {
  let sql = 'select a.*, c.name as collection, u.name as author' +
            '  from artworks a' +
            '  left outer join collections c on a.collectionid = c.recid' +
            '  left outer join users u on a.userid = u.recid' +
            '  where a.recid = $1'
  let par = [id]
  let dat = await DS.queryObject(sql, par)
  return dat
}

async function getArtworkByToken(tokenId) {
  let sql = 'select a.*, c.name as collection, u.name as author' +
            '  from artworks a' +
            '  left outer join collections c on a.collectionid = c.recid' +
            '  left outer join users u on a.userid = u.recid' +
            '  where a.tokenid = $1'
  let par = [tokenId]
  let dat = await DS.queryObject(sql, par)
  return dat
}

async function artworkSold(id) {
  let sql = 'update artworks set sold=sold+1 where recid = $1'
  let par = [id]
  let dat = await DS.update(sql, par)
  return dat
}


//---- OFFERS

async function newOffer(rec) {
  let sql = 'insert into offers(type,sellerid,collectionid,artworkid,masterid,tokenid,price,royalties,beneficiary,buyerid,rarity,wallet,offerid,status) '+
            'values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) returning recid'
  let par = [rec.type,rec.sellerid,rec.collectionid,rec.artworkid,rec.masterid,rec.tokenid,rec.price,rec.royalties,rec.beneficiary,rec.buyerid,rec.rarity,rec.wallet,rec.offerid,rec.status]
  let dat = await DS.insert(sql, par, 'recid')
  return dat
}

async function updateOffer(rec) {
  let sql = 'update offers set status=$1 where recid = $2'
  let par = [rec.status, rec.recid]
  let dat = await DS.update(sql, par)
  return dat
}

async function getOffersBySeller(userid) {
  let sql = 'select * from offers where sellerid=$1'
  let par = [userid]
  let dat = await DS.query(sql, par)
  return dat
}

async function getOffersBySellerTotal(userid) {
  let sql = 'select sum(price) as value from offers where sellerid=$1'
  let par = [userid]
  let dat = await DS.queryValue(sql, par)
  return dat
}

async function getOffersByBuyer(userid) {
  let sql = 'select * from offers where buyerid=$1 and price > 0'
  let par = [userid]
  let dat = await DS.query(sql, par)
  return dat
}

async function getOffersByToken(tokenid) {
  let sql = 'select * from offers where tokenid=$1'
  let par = [tokenid]
  let dat = await DS.query(sql, par)
  return dat
}

async function getSellOffersByToken(tokenid) {
  let sql = 'select o.*, s.name as seller, b.name as buyer '+
            'from offers o '+
            'left outer join users s on o.sellerid = s.recid '+
            'left outer join users b on o.buyerid  = b.recid '+
            'where (o.masterid=$1 or o.tokenid=$1) and o.type=0 '+
            'order by o.created desc'
  let par = [tokenid]
  let dat = await DS.query(sql, par)
  return dat
}

async function getBuyOffersByToken(tokenid) {
  let sql = 'select o.*, s.name as seller, b.name as buyer '+
            'from offers o '+
            'left outer join users s on o.sellerid = s.recid '+
            'left outer join users b on o.buyerid  = b.recid '+
            'where (o.masterid=$1 or o.tokenid=$1) and o.type=1 '+
            'order by o.created desc'
  let par = [tokenid]
  let dat = await DS.query(sql, par)
  return dat
}


//---- UTILS

async function searchArtworks(query) {
  let sql = ''
  if(query.length==64){
    sql = 'select * from artworks where tokenid = $1'
    par = [query]
  } else {
    sql = 'select a.*, c.name as collection, u.name as author '+
          'from artworks a '+
          'left outer join collections c on a.collectionid = c.recid '+
          'left outer join users u on a.userid = u.recid '+
          'where lower(a.name) like $1 '+
          'or lower(a.description) like $1 '+
          'or lower(a.tags) like $1 '+
          'or lower(u.name) like $1 '
    par = ['%'+query+'%']
  }
  let dat = await DS.query(sql, par)
  return dat
}



module.exports = {
  // Users
  newUser,
  updateUser,
  getUsers,
  getUserByName,
  getUserByAccount,
  // Collections
  newCollection,
  getCollections,
  getCollectionById,
  getCollectionByTaxon,
  getCollectionsByUser,
  // Artworks
  newArtwork,
  getArtworks,
  getArtworkById,
  getArtworkByToken,
  getArtworksByUser,
  getOriginalArtworksByUser,
  getAcquiredArtworksByUser,
  getArtworksByCollection,
  getArtworksByTaxon,
  artworkSold,
  // Offers
  newOffer,
  updateOffer,
  getOffersBySeller,
  getOffersBySellerTotal,
  getOffersByBuyer,
  getOffersByToken,
  getSellOffersByToken,
  getBuyOffersByToken,
  // Utils
  searchArtworks
}

// END