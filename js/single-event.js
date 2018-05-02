let urlParams = new URLSearchParams(window.location.search);
let id = urlParams.get("id");
fetch("https://onestepfurther.nu/cms/wp-json/wp/v2/posts/" + id + "?_embed")
  .then(e=>e.json())
  .then(updateEventList)

function updateEventList(e){

    // overwrite current eventlist with matched event(s)
    let clone2 = document.querySelector('.singleEventPage');
    clone2.querySelector('h2').innerHTML = e.acf["major_type"]; // use innerHTML cuz title include html entities and tags
    clone2.querySelector('h1').innerHTML = e.title.rendered;
    if(e._embedded["wp:featuredmedia"]){
        clone2.querySelector('.featuredImg-small').setAttribute("src", e._embedded["wp:featuredmedia"][0].media_details.sizes.medium.source_url);
        clone2.querySelector('.featuredImg-small').setAttribute("alt", "featured image of event"); // not working???
    }
    console.log(e.acf.location)
    let acfs = Object.keys(e.acf);// get the list of all custom fields keys
    acfs.forEach(getSpecialCustomField);
    function getSpecialCustomField(cf){

        let index = acfs.indexOf(cf);
        let cfValue = Object.values(e.acf)[index];
        // get event details
        if (cf !== "location" && cf !== "major_type" && cf !== "date-start" && cf !== "date-end" && cf !== "hour_program-start" && cf !== "minute_program-start" && cf !== "hour_entrance" && cf !== "minute-entrance" && cf !== "extra_link_url" && cf !== "game_played"){ // don't deal with these for hand-in
            let p = document.createElement('p');
            if(cf){p.classList.add(cf)};
            if(cf == "description" && cfValue.length < 300){ // display only the full text of short descriptions
                p.classList.add('extra-margin');
                p.textContent = cfValue;
            } else if (cf == "description" && cfValue.length >= 300){
                p.classList.add('quick-view');
                p.innerHTML = "<p class='normal-text underline event-details'>Event details:</p>" + cfValue;
            } else if(cf == "availability" && cfValue == "available"){
            // don't show any thing in this cased
            } else if(cf == "availability" && cfValue !== "available") {
                p.classList.add('red');
                p.textContent = "Currently sold-Out";
            } else if(cf == "price" && cfValue == "0"){
                p.classList.add('cfP');
                p.textContent = "FREE";
            } else if(cf == "price" && cfValue !== "0") {
                p.textContent = "Price: " + cfValue + " Kr.";
            } else if(cf == "extra_info" && cfValue.indexOf('Forsalg')>-1) {
                p.textContent = cfValue.replace('Forsalg', "Presale").replace('gebyr', 'fee');
            } else if(cf == "extra_info" && cfValue && cfValue.indexOf('Forsalg')<0) {
                p.className = "read-more";
                p.textContent = cfValue;
            } else if(cf == "buy_ticket"){
                if(cfValue.indexOf('http')>-1){
                    let a = document.createElement('a');
                    a.classList.add(cf);
                    a.target = "_blank";
                    a.href = cfValue;
                    a.textContent = "Buy ticket online";
                    clone2.appendChild(a);
                } else if(cfValue.indexOf('KØB')>-1) {
                    p.textContent = " Buy ticket at the entrance";
                } else {
                    p.textContent = cfValue;
                }
            } else if(cf == "language" && cfValue.length>1){
                let langSpan = document.createElement('span');
                langSpan.className = "lang normal-text";
                let langImg = document.createElement('img');
                langImg.setAttribute('src', "img/lang-icon_50.png");
                langImg.setAttribute('alt', "langIcon");
                langImg.classList.add('lang-icon');
                clone2.appendChild(langImg);
                clone2.appendChild(langSpan);
                langSpan.textContent
                for (let i=0; i<cfValue.length; i++){
                    langSpan.textContent += cfValue[i];
                    langSpan.textContent += " ";
                }
                clone2.querySelector('span.lang').textContent = clone2.querySelector('span.lang').textContent.replace(/\s+/g, ' / ').slice(0, -2); // remove the last /
            } else if(cf == "language" && cfValue.length ==1 ){
                let langSpan = document.createElement('span');
                langSpan.className = "lang";
                let langImg = document.createElement('img');
                langImg.setAttribute('src', "img/lang-icon_50.png");
                langImg.setAttribute('alt', "langIcon");
                langImg.classList.add('lang-icon');
                clone2.appendChild(langImg);
                let span = document.createElement('span');
                span.textContent = cfValue;
                clone2.appendChild(span);
            } else if(cf == "price_to_rent_the_game" || cf == "type_of_game"){
            } else if(cf == "duration" && cfValue){
                p.className = "cfP, " + cf; // for styling
                p.innerHTML = "<p class='cfP'>" + cf + ": </p><p>" + cfValue + " min.</p>";
            } else if (cf == "extra_link_name" && cfValue.indexOf(',')<0){
                let a = document.createElement('a');
                a.classList.add(cf);
                a.classList.add('blockA');
                a.classList.add('extra-margin');
                a.target = "_blank";
                a.textContent = cfValue;
                a.href = Object.values(e.acf)[index+1]; // the next key is the url, not the value of current key
                clone2.appendChild(a);
            } else if (cf == "extra_link_name" && cfValue.indexOf(',')>-1){
                let nrOfExtraLink = cfValue.split(',').length;
                for(let i=0; i<nrOfExtraLink; i++){
                    let a = document.createElement('a');
                    a.classList.add('blockA');
                    a.classList.add('cfP');
                    a.target = "_blank";
                    a.textContent = cfValue.split(',')[i];
                    a.href = Object.values(e.acf)[index+1].split(',')[i];
                    clone2.appendChild(a);
                }
            } else if (cf == "related_event" && cfValue){
                p.className = "related-event p-cf " + cf; // for styling
                let pInnerHTML = "<p class='cfP'>" + cf + ": </p>";
                for(let i= 0; i<cfValue.length; i++){
                    pInnerHTML += "<p><span>➝ </span><a class='inline' href='single-event.html?id=";
                    pInnerHTML += cfValue[i]["ID"];
                    pInnerHTML += "'>"
                    pInnerHTML += cfValue[i]["post_title"].split('-')[0];
                    pInnerHTML += "</a></p>"
                }
                p.innerHTML = pInnerHTML;
            } else {
                let p = document.createElement('p');
                let index = acfs.indexOf(cf);
                p.className = "p-cf, " + cf; // for styling
                p.innerHTML = "<p class='cfP'>" + cf + ": </p><p>" + cfValue + "</p>";
                if (Object.values(e.acf)[index]) {
                    clone2.appendChild(p); // only append when has value
                }
            }
            clone2.appendChild(p);
        }
    }
    document.querySelector('.singleEventPage').appendChild(document.querySelector('.extra_link_name'));
    if(document.querySelector('.related-event')){
        document.querySelector('.singleEventPage').appendChild(document.querySelector('.related-event'));
    }
    if(document.querySelector('.event-details')){
        document.querySelector('.description').nextElementSibling.className = "rm";
        document.querySelector('.description').nextElementSibling.textContent = "... ⥮ ...";
        document.querySelector('.rm').addEventListener('click', toggleDesc);
        function toggleDesc(){
            document.querySelector('.description').classList.toggle('long');
        }
    }
}
