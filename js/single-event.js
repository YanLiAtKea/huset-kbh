let urlParams = new URLSearchParams(window.location.search);
let id = urlParams.get("id");
fetch("https://onestepfurther.nu/cms/wp-json/wp/v2/posts/" + id + "?_embed")
  .then(e=>e.json())
  .then(showSingleEvent)
function showSingleEvent(singleEvent){
    document.querySelector(".post h1").innerHTML = singleEvent.title.rendered;

    if(singleEvent._embedded["wp:featuredmedia"]){
        let featuredImg = document.createElement('img');
        featuredImg.setAttribute("src", singleEvent._embedded["wp:featuredmedia"][0].media_details.sizes.medium.source_url)
        document.querySelector(".post").appendChild(featuredImg);
    }
    let acfKeys = Object.keys(singleEvent.acf);// get the list of all custom fields keys
    acfKeys.forEach(getSpecialCustomField);
    function getSpecialCustomField(acfKey){
        // get event details
        let cfName = acfKey;
        let index = acfKeys.indexOf(acfKey);
        let cfValue = Object.values(singleEvent.acf)[index];
        if (cfName == "major_type" && cfValue.indexOf(" ")>-1){ // display event type icon of this event, based on event type value
            cfValue = cfValue.replace(/\s+/g, '-');
            document.querySelector('img.' + cfValue).classList.remove('hide');
        } else if (cfName == "major_type" && cfValue.indexOf(" ")<0){
            document.querySelector('img.' + cfValue).classList.remove('hide');
        } else if(cfName == "title"){
            let p = document.createElement('p');
            p.classList.add('movieTitle');
            p.textContent = cfValue;
            document.querySelector(".post").insertBefore(p, document.querySelector(".post").childNodes[6]); // for movie event, insert movie title right after featured img
        } else if (cfName == "price" && cfValue == "0"){
            let p = document.createElement('p');
            p.textContent = "FREE";
            document.querySelector(".post").appendChild(p);
        } else if (cfName == "price" && cfValue !== "0"){
            let p = document.createElement('p');
            p.textContent = "Price: " + cfValue + " Kr.";
            document.querySelector(".post").appendChild(p);
        }


        else if (cfName == "language" && cfValue.length>1){
            let langSpan = document.createElement('span');
            langSpan.className = "lang";
            let langImg = document.createElement('img');
            langImg.setAttribute('src', " ");
            langImg.setAttribute('alt', "langIcon");
            document.querySelector('.post').appendChild(langImg);
            for (let i=0; i<cfValue.length; i++){
                let span = document.createElement('span');
                span.textContent = cfValue[i] + "  ";
                document.querySelector(".post").appendChild(langSpan);
                document.querySelector(".post span.lang").appendChild(span);
            }
            document.querySelector(".post span.lang").textContent = document.querySelector(".post span.lang").textContent.replace(/\s+/, ' / ');
        } else if (cfName == "language" && cfValue.length ==1 ){
            let langSpan = document.createElement('span');
            langSpan.className = "lang";
            let langImg = document.createElement('img');
            langImg.setAttribute('src', " ");
            langImg.setAttribute('alt', "langIcon");
            document.querySelector('.post').appendChild(langImg);
            let span = document.createElement('span');
            span.textContent = cfValue;
            document.querySelector(".post").appendChild(span);
        } else if(cfName == "buy_ticket" && cfValue.indexOf('http')>-1){
            let a = document.createElement('a');
            a.classList.add('blockA');
            a.href = cfValue;
            a.target = "_blank";
            a.textContent = "Buy ticket Online";
            document.querySelector(".post").appendChild(a);
        } else if(cfName == "buy_ticket" && cfValue.indexOf('http')<0){
            let p = document.createElement('p');
            p.textContent = cfValue;
            document.querySelector(".post").appendChild(p);
        } else if (cfName == "extra_link_name" && cfValue.indexOf(',')<0){
            let a = document.createElement('a');
            a.classList.add('blockA');
            a.target = "_blank";
            a.textContent = cfValue;
            a.href = Object.values(singleEvent.acf)[index+1]; // the next key is the url, not the value of current key
            document.querySelector(".post").appendChild(a);
        } else if (cfName == "extra_link_name" && cfValue.indexOf(',')>-1){
            let nrOfExtraLink = cfValue.split(',').length;
            for(let i=0; i<nrOfExtraLink; i++){
                let a = document.createElement('a');
                a.classList.add('blockA');
                a.target = "_blank";
                a.textContent = cfValue.split(',')[i];
                a.href = Object.values(singleEvent.acf)[index+1].split(',')[i];
                document.querySelector(".post").appendChild(a);
            }
        } else if (cfName == "availability" && cfValue !== "available"){
            let p = document.createElement('p');
            p.textContent = "Sold-Out";
            p.classList.add('red');
            document.querySelector(".post").appendChild(p);
        } else if (cfValue == "available") {
            // won't add anything
        }
        else if(cfName == "extra_info" && cfValue.indexOf('Forsalg')>-1) {
            let p = document.createElement('p');
            p.textContent = cfValue.replace('Forsalg', "Presale").replace('gebyr', 'fee');
            document.querySelector(".post").appendChild(p);
        } else if(cfName == "extra_info" && cfValue && cfValue.indexOf('Forsalg')<0) {
            let p = document.createElement('p');
            p.classList.add('extraInfo');
            p.textContent = "***: " + cfValue;
            document.querySelector(".post").appendChild(p);
        } else if(cfName == "description" && cfValue){
            let p = document.createElement('p');
            p.classList.add('extraInfo');
            p.classList.add('desc');
            p.innerHTML = cfValue;
            document.querySelector(".post").appendChild(p);
        } else if(cfName == "location"){
            // don't show location as text
        } else if(cfName == "release_year"){
            let p = document.createElement('p');
            p.textContent = "(" + cfValue + ")";
            document.querySelector(".post").insertBefore(p, document.querySelector(".post").childNodes[6]);
        } else if(cfName == "duration"){
            let p = document.createElement('p');
            p.textContent = cfValue + "Min.";
            document.querySelector(".post").insertBefore(p, document.querySelector(".post").childNodes[8]);
        } else if(cfName == "genre"){
            let p = document.createElement('p');
            p.innerHTML = "<p class='cfP'>Genre: </p><p>" + cfValue + "</p>";
            document.querySelector(".post").insertBefore(p, document.querySelector(".post").childNodes[6]);
        } else if(cfName == "director"){
            let p = document.createElement('p');
            p.innerHTML = "<p class='cfP'>Directed by: </p><p>" + cfValue + "</p>";
            document.querySelector(".post").insertBefore(p, document.querySelector(".post").childNodes[9]);
        } else if(cfName == "date-start" || cfName == "minute_program-start" ||cfName == "hour_program-start" || cfName == "hour_entrance" || cfName == "minute-entrance"){
            // don't show these
        } else if(cfName !== "extra_link_url" ) { // url is set to href of external link name above, no need to show url as text on the page
            let p = document.createElement('p');
            p.className = "p-cf, " + cfName; // for styling
            p.textContent = cfName + ": " + Object.values(singleEvent.acf)[index]; // get corresponding value of each key and assign the value to the p
            if (Object.values(singleEvent.acf)[index]) { // only append when has value
                document.querySelector(".post").appendChild(p);
            }
        }
    }
}

