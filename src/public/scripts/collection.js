function reset(txt, warn, btn, off, err) {
  Message(txt,warn); 
  Button(btn||'SAVE',off);
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

async function onSave(){
  Message('Saving collection, wait a moment...')
  let resp, info
  let now = new Date()
  let exp = new Date(session.expires||'0')
  if(!session.account){ Message('Login with your XUMM wallet first',1); return; }
  if(exp<now){ Message('Session expired, login with your XUMM wallet again',1); return; }
  if(!$('name').value){ Message('Collection name is required',1); return; }
  if(!$('desc').value){ Message('Collection description is required',1); return; }
  let file = $('artwork-file').files[0]
  if(!file){ Message('Image is required, select a jpg or png max 2000x2000',1); return; }
  let ext = null
  switch(file.type){
    case 'image/jpg':
    case 'image/jpeg': ext = '.jpg'; break
    case 'image/png':  ext = '.png'; break
  }
  if(!ext){ Message('Only JPG and PNG images are allowed'); return; }
  Button('WAIT',1)

  // Upload image to server
  // Server uploads to aws and ipfs
  Message('Uploading image, wait a moment...')
  let id   = app.utils.random.string() // To avoid collisions
  let name = id+ext
  let data = new FormData()
  data.append('name', name)
  data.append('perm', false)
  data.append('file', file)
  info = await api.upload('/api/artwork', data) // upload to server
  if(!info.success){ return reset('Error uploading image',1,0,1,info?.error) }
  console.log('UPLOAD', info)
  let image = info.image
  let record = {
    name:        $('name').value,
    description: $('desc').value,
    userid:      session.userid,
    image:       image,
    taxon:       app.utils.random.number(9),
    nftcount:    0,
    inactive:    false
  }
  console.log('RECORD', record)
  // Save collection to registry
  info = await api.post('/api/collection/new', record)
  if(!info.success){ Message('Error saving collection',1); return }
  Message('Collection created!')
  Button('DONE',1)
}

// END