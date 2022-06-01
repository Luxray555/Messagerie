let socket = io();

let listGroupeDoc = document.querySelector('.listGrp');

let resetGroupeList = (list) => {
    listGroupeDoc.innerHTML = "";
    for(i=0;i<list.length;i++){
        let element = document.createElement('li');
        let buttonelem = document.createElement('button');
        element.appendChild(buttonelem);
        buttonelem.textContent = list[i]['nom'];
        buttonelem.id = list[i]['idGroupe'];
        buttonelem.addEventListener('click',() => {
            window.location.href = window.location.href.replace("Groupe","")+'?groupe='+buttonelem.id;
        })
        listGroupeDoc.appendChild(element);
    }
}

socket.on('sessionPseudo',(sess) =>{
    document.querySelector('h1').innerHTML = sess;
})
socket.on('listGroupeInformation',(listGroupe) => {
    resetGroupeList(listGroupe);
})