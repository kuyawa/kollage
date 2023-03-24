let Arweave = require('arweave')

// Uploads buffer data to Arweave
// Can be a file or text as metadata
// Data must be passed as buffer of bytes
// Text can be read as Buffer.from(text)
// File can be read as fs.readFileSync(path)
// Mime type is required text/plain image/jpeg image/png
async function arweave(bytes, mimeType) {
  try {
    if(!process.env.ARWEAVE_KEY){ return {success:false, error:'Arweave key is missing'} }
    let keyText = process.env.ARWEAVE_KEY
    let secretKey = JSON.parse(keyText)
    let options = {
      protocol: 'https',  // Network protocol http or https
      host: 'arweave.net',// Hostname or IP address for a Arweave host
      port: 443,          // Port
      timeout: 20000,     // Network request timeouts in milliseconds
      logging: false      // Enable network request logging
    }
    let arweave = Arweave.init(options)
    let tx = await arweave.createTransaction({ data: bytes }, secretKey)
    tx.addTag('Content-Type', mimeType)
    await arweave.transactions.sign(tx, secretKey)
    console.log('URI: https://arweave.net/'+tx.id)
    console.log('Uploading...')
    let uploader = await arweave.transactions.getUploader(tx)
    while(!uploader.isComplete) {
      await uploader.uploadChunk()
      console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`)
    }
    console.log('Done')
    //return 'https://arweave.net/'+tx.id
    return {success:true, cid:tx.id}
  } catch(ex) {
    console.error(ex)
    return {success:false, error:'Error uploading data'}
  }
}

module.exports = { arweave }