/////////// build main filter of major categorr on the left ///////////
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

/////////// load lists of all event ///////////
let template = document.querySelector(".singleEvent").content;
let eventList = document.querySelector(".eventList");
let lookingForData = false;
let pageNr = 1;
let urlParams = new URLSearchParams(window.location.search);

/////////// load event list in pages///////////
loadList();
function loadList(){
    lookingForData = true;
    let categoryId = urlParams.get("category");
    let fetchLink = "https://onestepfurther.nu/cms/wp-json/wp/v2/posts?_embed&per_page=3&page=" + pageNr;
    if (categoryId){
        fetchLink += "&categories=" + categoryId;
    }
    fetch(fetchLink)
        .then(e=>e.json())
        .then(listAllEventsInPages);
}
function listAllEventsInPages(allEvents){
    // ??? don't know how to get "X-WP-Total" of post count, so can't calculate when there is no more post to display. Use this as temperary solution, but this still gives one error
    if(!allEvents.length){ // as set above, length should usually be 3
        clearInterval(checkBottom);
    }
    lookingForData = false;
    allEvents.forEach(showSingleEvent);
    function showSingleEvent(singleEvent){
        if (singleEvent.categories.indexOf(12)>-1 || singleEvent.categories.indexOf(10)<0){ // exclude the category of board games in the DB, which are not events
            let clone = template.cloneNode(true);
            clone.querySelector('h2').innerHTML = singleEvent.acf["major_type"]; // use innerHTML cuz title include html entities and tags
            clone.querySelector('h1').innerHTML = singleEvent.title.rendered;
            if(singleEvent._embedded["wp:featuredmedia"]){
                clone.querySelector('.featuredImg').setAttribute("src", singleEvent._embedded["wp:featuredmedia"][0].media_details.sizes.medium.source_url)
            }
            let acfs = Object.keys(singleEvent.acf);// get the list of all custom fields keys
            acfs.forEach(getSpecialCustomField);
            function getSpecialCustomField(cf){
                // get event details
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


/////////// generate calendar ///////////
let currentMonth = new Date().getMonth()+1;
let months = document.querySelectorAll('.month');
// set month to current month by dafault
months.forEach(checkCurrentMonth);
function checkCurrentMonth(m){
    if(m.querySelector("span:nth-of-type(2)").textContent == currentMonth){
        m.classList.remove('hide');
    }
}
// generate days and put in each month
for(let month = 0; month<12; month++){
    for(let i=1; i<32; i++){
        let day = document.createElement("span");
        day.textContent = i;
        day.classList.add('day');
        let actualMonth = month+1;
        document.querySelector('.month:nth-of-type(' + actualMonth + ') .days').appendChild(day);
    }
}
// hide days not exsiting on certain months
checkCorrectDaysNumber();
function checkCorrectDaysNumber (){
    document.querySelector(".month:nth-of-type(2) .day:nth-of-type(29)").classList.add("hide");
    document.querySelector(".month:nth-of-type(2) .day:nth-of-type(30)").classList.add("hide");
    document.querySelector(".month:nth-of-type(2) .day:nth-of-type(31)").classList.add("hide");
    document.querySelector(".month:nth-of-type(4) .day:nth-of-type(31)").classList.add("hide");
    document.querySelector(".month:nth-of-type(6) .day:nth-of-type(31)").classList.add("hide");
    document.querySelector(".month:nth-of-type(9) .day:nth-of-type(31)").classList.add("hide");
    document.querySelector(".month:nth-of-type(11) .day:nth-of-type(31)").classList.add("hide");
}
// change month by +/-
let minusMonth = document.querySelector('.minusMonth');
let plusMonth = document.querySelector('.plusMonth');
let currentShownMonth;
minusMonth.addEventListener('click', function(){
    currentShownMonth = document.querySelector('.month:not(.hide)');
    if(currentShownMonth.querySelector('span:nth-of-type(2)').textContent >1){
        currentShownMonth.classList.add('hide');
        currentShownMonth.previousElementSibling.classList.remove('hide');
    } else {
        document.querySelector('.month:nth-of-type(1)').classList.add('hide');
        document.querySelector('.month:nth-of-type(12)').classList.remove('hide');
    }
})
plusMonth.addEventListener('click', function(){
    currentShownMonth = document.querySelector('.month:not(.hide)');
    if(currentShownMonth.querySelector('span:nth-of-type(2)').textContent <12){
        currentShownMonth.classList.add('hide');
        currentShownMonth.nextElementSibling.classList.remove('hide');
    } else {
        document.querySelector('.month:nth-of-type(12)').classList.add('hide');
        document.querySelector('.month:nth-of-type(1)').classList.remove('hide');
    }
})

/*
let dates = document.querySelectorAll('.days span');
let monthToCheck;
let dayToCheck;
dates.forEach(checkEventByDate);
function checkEventByDate(d){
    d.addEventListener('click', clickOnDate);
    function clickOnDate(){
        if(document.querySelector('.month span:nth-of-type(2)').textContent<10){
            monthToCheck = "0" + document.querySelector('.month span:nth-of-type(2)').textContent;
        } else {
            monthToCheck = document.querySelector('.month span:nth-of-type(2)').textContent;
        }
        if(d.textContent < 10){
            dayToCheck = "0" + d.textContent;
        } else {
            dayToCheck = d.textContent;
        }
        let dateToCheck = "2018" + monthToCheck + dayToCheck;
        fetch("https://onestepfurther.nu/cms/wp-json/wp/v2/posts?_embed&per_page=50")
            .then(e=>e.json())
            .then(gotAllEvents);
        function gotAllEvents(events){
            events.forEach(matchDate);
            function matchDate(e){
                if(e.acf["date-start"]){
                let startDate = e.acf["date-start"];
//                let startMonth = startDate[4]+startDate[5];
//                let startDay = startDate[6]+startDate[7];
//                if(startDay === dateToCheck && startMonth === monthToCheck){
                if(startDate === dateToCheck){
                    let matchLink = "http://onestepfurther.nu/cms/wp-json/wp/v2/posts?_embed&acf['date-start']=" + startDate;
                    fetch(matchLink).then(e=>e.json()).then(listMatches);
                    function listMatches(matches){
                            console.log(matches);
                    }
                }

                }
            }
        }
    }
}
*/
