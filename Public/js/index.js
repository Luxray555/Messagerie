//Js animation
let btnList = document.querySelector('.mobileUserListBtn');
let listUserDoc = document.querySelector('.listUser');
btnList.addEventListener('click',() => {
    if(btnList.classList.contains('open')){
        listUserDoc.classList.remove('open');
        btnList.classList.remove('open');
    }else{
        listUserDoc.classList.add('open');
        btnList.classList.add('open');
    }
})





//initialise connection server communication
let socket = io();

let form = document.getElementById('form');
let input = document.getElementById('input');
let listMessage = document.getElementById('messages');
let listLiUser = document.querySelectorAll('.listUser li');
let listUser;

let createUser = (sck) => {
    let user = document.createElement('li');
    user.textContent = sck;
    listUserDoc.appendChild(user);
}
input.addEventListener('focus',() => {
    socket.emit('focusUser',socket.id);
})
input.addEventListener('blur',() => {
    socket.emit('blurUser',socket.id);
})
socket.on('sFocusUser',(sck) => {
    for(i=0;i<listLiUser.length;i++){
        console.log(listLiUser[i].innerHTML);
        if(listLiUser[i].innerHTML == listUser[sck]['pseudo']){
            listLiUser[i].classList.add('talking');
        }
    }
})
socket.on('sBlurUser',(sck) => {
    for(i=0;i<listLiUser.length;i++){
        console.log(listLiUser[i].innerHTML);
        if(listLiUser[i].innerHTML == listUser[sck]['pseudo']){
            listLiUser[i].classList.remove('talking');
        }
    }
})

socket.on('userInteraction',(list) => {
    listUser = list;
    listUserDoc.innerHTML="";
    for(key in listUser){
        createUser(listUser[key]['pseudo']);
    }
    listLiUser = document.querySelectorAll('.listUser li');
})

socket.on('connect',()=>{
    socket.on('last messages',(msg) =>{
        for(i=0;i<msg.length;i++){
            addMessage(msg[i]['user']+' : '+msg[i]['message']);
        }
    })
});
socket.on("disconnect", () => {
    for(i=0;i<listUser.length;i++){
        if(listUser[i]==socket.id){
            listUserDoc.removeChild(listUserDoc[i]);
        }
    }
});


let addMessage = (msg) => {
    let message = document.createElement('li');
    message.textContent = msg;
    listMessage.appendChild(message);
    listMessage.scrollTo(0, document.body.scrollHeight);
}

let send = () => {
    let message = document.getElementById('m').value;
    socket.emit('chat message', message);
    console.log('send');
}

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
      socket.emit('chat message', input.value);
      input.value = '';
      input.blur();
    }
  });

socket.on('chat message', function(msg) {
    addMessage(msg);
});

