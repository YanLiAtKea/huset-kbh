// build main filter on the left
fetch("https://onestepfurther.nu/cms/wp-json/wp/v2/categories")
    .then(e=>e.json())
    .then(getMajorTypes);

function getMajorTypes(allCategories){
    let ul = document.querySelector(".type-filter");
    allCategories.forEach(category => {
        let li = document.createElement("li");
        let a = document.createElement("a");
        if(category.parent === 12 || category.id === 33){ // include general events and board game events
            if (category.name.indexOf("event")>-1){ // remove unnecessary text
                a.textContent = category.name.slice(0, -5);
            } else {
                a.textContent = category.name;
            }
                a.href="index.html?category="+category.id;
            li.appendChild(a);
            ul.appendChild(li);
        }
    })
}

// get lists of all event
let template = document.querySelector("template").content;
let eventList = document.querySelector(".eventList");
let lookingForData = false;
let pageNr = 1;
let urlParams = new URLSearchParams(window.location.search);

function loadList(){
    lookingForData = true;
    let categoryId = urlParams.get("category");
    let fetchLink = "http://onestepfurther.nu/cms/wp-json/wp/v2/posts?_embed&per_page=3&page=" + pageNr;
    if (categoryId){
        fetchLink += "&categories=" + categoryId;
    }
    fetch(fetchLink)
        .then(e=>e.json())
        .then(listAllEventsInPages);
    fetchLink.get
}


function listAllEventsInPages(allEvents){
    // don't know how to get "X-WP-Total" of post count, so can't calculate when there is no more post to display. Use this as temperary solution, but this still gives one error
    if(!allEvents.length){ // as set above, length should usually be 3
        clearInterval(checkBottom);
    }

    lookingForData = false;
    allEvents.forEach(showSingleEvent);
    function showSingleEvent(singleEvent){
        if (singleEvent.categories.indexOf(12)>-1 || singleEvent.categories.indexOf(10)<0){ // exclude the category of board games
            let clone = template.cloneNode(true);
            clone.querySelector('h2').innerHTML = singleEvent.acf["major_type"]; // use innerHTML cuz title include html entities and tags
            clone.querySelector('h1').innerHTML = singleEvent.title.rendered;
            if(singleEvent._embedded["wp:featuredmedia"]){
                clone.querySelector('.featuredImg').setAttribute("src", singleEvent._embedded["wp:featuredmedia"][0].media_details.sizes.medium.source_url)
            }
            let acfs = Object.keys(singleEvent.acf);// get the list of all custom fields keys
            acfs.forEach(getSpecialCustomField);
            function getSpecialCustomField(cf){
                if (cf !== "major_type" && cf !== "date-start" && cf !== "date-end" && cf !== "hour_program-start" && cf !== "minute_program-start" && cf !== "hour_entrance" && cf !== "minute-entrance" && cf !== "location" && cf !== "description"){
                    let cfName = cf;
                    let p = document.createElement('p');
                    p.className = "p-cf, " + cfName; // for styling
                    let index = acfs.indexOf(cf);
                    p.textContent = cfName + ": " + Object.values(singleEvent.acf)[index]; // get corresponding value of each key and assign the value to the p
                    if (Object.values(singleEvent.acf)[index]) {
                        clone.querySelector('.singleEvent').appendChild(p); // only append when has value
                    }
                }
            }
            eventList.appendChild(clone);
        }
    }
}

loadList();

//found this stuff online
let checkBottom = setInterval(function(){
  if(bottomVisible() && lookingForData===false){
      console.log('load next page');
    pageNr++;
    loadList();
  }
}, 700)

function bottomVisible() {
  const scrollY = window.scrollY
  const visible = document.documentElement.clientHeight
  const pageHeight = document.documentElement.scrollHeight
  const bottomOfPage = visible + scrollY >= pageHeight
  return bottomOfPage || pageHeight < visible
}

// date filter
let date = new Date();
document.querySelector('.month').textContent = date.getMonth() + 1;
let day = document.createElement("span");
day.className = "day";
for(i=1; i<32; i++){
    day.textContent = i;
    document.querySelector('.month').appendChild(day);
}
