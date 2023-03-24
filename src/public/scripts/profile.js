function onImageError(evt){
  console.log('Image error', evt)
  evt.target.src='/avatars/noavatar.jpg'
}

function onImagePreview(evt){
  console.log('Preview', evt)
  let file = evt.target.files[0]
  let reader = new FileReader()
  reader.onload = function(e)  {
      $('avatar-image').src = e.target.result
      $('topAvatar').src = e.target.result
  }
  reader.readAsDataURL(file)
}

async function Upload(file, ext){
  console.log('Uploading file', file)
  try {
    let id   = app.utils.random.string() // To avoid collisions
    let name = id+ext
    let type = file.type
    let data = new FormData()
    data.append('name', name)
    data.append('file', file)
    let resp = await fetch('/api/avatar', {method: 'POST', body: data});
    let info = await resp.json();
    console.log('Upload', info)
    if(info.success) {
      console.log('Upload success!')
    } else {
      console.error('Upload failed!')
    }
    return info
  } catch(ex) {
    console.error(ex)
    return {success:false, error:ex.message}
  }
}

async function onSave(){
  Message('Saving profile, wait a moment...')
  // Validate image, name, description, price, royalties
  if(!session.account){ Message('Login with your XUMM wallet first',1); return; }
  if(!$('name').value){ Message('User name is required',1); return; }
  if(!$('desc').value){ Message('Description is required',1); return; }
  let file = $('avatar-file').files[0]
  if(!file && !session.user.avatar){ Message('Avatar is required, select a jpg or png max 500x500',1); return; }
  let name = $('name').value
  if(!name || name=='' || name.length>20 || !(/^[a-z0-9]+$/i).test(name)){ 
    Message('User name is invalid, only chars and numbers, max 20',1); 
    return;
  }
  let avatar = session.user.avatar
  if(file){
    let ext = null
    switch(file.type){
      case 'image/jpg':
      case 'image/jpeg': ext = '.jpg'; break
      case 'image/png':  ext = '.png'; break
      //case 'text/plain': ext = '.txt'; break
    }
    if(!ext){ Message('Only JPG and PNG images are allowed'); Button('SAVE'); return }
    // Upload image to AWS
    Button('WAIT',1)
    Message('Uploading avatar, wait a moment...')
    let info = await Upload(file, ext)
    if(!info.success){ Message('Error uploading image',1); Button('SAVE'); return }
    console.log('INFO', info)
    avatar = info.name
  }

  let profile = {
    recid: session.user.recid,
    avatar: avatar,
    name: $('name').value,
    tagline: $('desc').value,
    email: $('mail').value
  }
  let data = await api.put('/api/user', profile)
  console.log('Profile Resp', data)
  if(!data.success){
    Message('Error saving profile',1);
    Button('SAVE');
    console.log('ERROR:', data.error)
    return
  }
  app.utils.setCookie('avatar', profile.avatar || '')
  app.utils.setCookie('username', profile.name || '')
  Message('Profile saved!')
  Button('DONE',1)
}

async function logout() {
  let opts = {rememberJwt:false}
  let xumm = new XummPkce(session.xummkey, opts)
  await xumm.logout()
  //Message('XUMM wallet disconnected')
  console.log('Disconnected')
  app.utils.setCookie('account', '')
  app.utils.setCookie('avatar', '')
  app.utils.setCookie('userid', '')
  app.utils.setCookie('username', '')
  app.utils.setCookie('usertoken', '')
  window.location.href='/'
}

