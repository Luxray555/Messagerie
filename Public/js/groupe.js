let socket = io();

let listGroupeDoc = document.querySelector('.listGrp');
let resetGroupeList = (list) => {
    for(i=0;i<list.length;i++){
        if(listGroupeDoc.querySelectorAll("li")[i] != undefined){
            let spanelem = document.createElement('span');
            spanelem.textContent = " (" + list[i]["persons"] + ")";
            listGroupeDoc.querySelectorAll("li")[i].querySelector("button").removeChild(document.querySelectorAll(".listGrp li")[i].querySelector('button span'));
            listGroupeDoc.querySelectorAll("li")[i].querySelector("button").appendChild(spanelem);
        }else{
            let element = document.createElement('li');
            let buttonelem = document.createElement('button');
            let spanelem = document.createElement('span');
            element.appendChild(buttonelem);
            buttonelem.textContent = list[i]['nom'];
            spanelem.textContent = " (" + list[i]["persons"] + ")";
            buttonelem.appendChild(spanelem);
            buttonelem.id = list[i]['id'];
            buttonelem.addEventListener('click',() => {
                window.location.href = window.location.href.replace("Groupe","")+'?groupe='+buttonelem.id;
            })
            listGroupeDoc.appendChild(element);
        }
    }
}

socket.on('sessionPseudo',(sess) =>{
    document.querySelector('h1').innerHTML = sess;
})
socket.on('listGroupeInformation',(listGroupe) => {
    console.log("new");
    resetGroupeList(listGroupe);
})