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

/////////// load event list in pages///////////
let template = document.querySelector("template.singleEvent").content;
let eventList = document.querySelector(".eventList");
let lookingForData = false;
let pageNr = 1;
let urlParams = new URLSearchParams(window.location.search);
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

}
function showSingleEvent(singleEvent){
        if (singleEvent.categories.indexOf(12)>-1 || singleEvent.categories.indexOf(10)<0){ // exclude the category of board games in the DB, which are not events
            let clone = template.cloneNode(true);
            clone.querySelector('h2').innerHTML = singleEvent.acf["major_type"]; // use innerHTML cuz title include html entities and tags
            clone.querySelector('h1').innerHTML = singleEvent.title.rendered;
            clone.querySelector('span.hide').textContent = singleEvent.id;
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
    clickOnSingleEvent();
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
for(let month = 1; month<13; month++){
    for(let i=1; i<32; i++){
        let day = document.createElement("span");
        day.textContent = i;
        day.classList.add('day');
        if(month<10 && i<10){ // in order to match event later, add "d" cuz class can't start with a number
            day.classList.add('d0' + month + '0' + i);
        } else if(month<10 && i>10){
            day.classList.add('d0' + month + i);
        }if(month>10 && i>10){
            day.classList.add('d' + month + i);
        }
        document.querySelector('.month:nth-of-type(' + month + ') .days').appendChild(day);
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

/////////// show events on calender ///////////
// fetch all events and highlight the dates having at least one event
// ??? how to exclude one category, ie. including all other categories, of posts in the url???
fetch("https://onestepfurther.nu/cms/wp-json/wp/v2/posts?_embed&per_page=50")
    .then(e=>e.json()).then(getEventDates);
function getEventDates(eventDates){
    eventDates.forEach(matchDate);
    function matchDate(d){
        let eventStartDate;
        let eventEndDate;
        if(d.acf["date-start"]){ // use this to exclude board games, which don't have event start time
            eventStartDate = d.acf["date-start"].slice(4,8); // not working on year for this project, so only need the last digits in form of mmdd
            document.querySelector('.d'+ eventStartDate).classList.add('match');
        }
        if(d.acf["date-start"] && d.acf["date-end"]){ // for events that is held over multiple days
            eventStartDate = d.acf["date-start"].slice(4,8);
            eventEndDate = d.acf["date-end"].slice(4,8);
            let startNr = parseInt(eventStartDate, 10);
            let endNr = parseInt(eventEndDate, 10);
            for(let i = startNr; i<=endNr; i++){
                if(i<1000){
                    i ="0" + i;
                } else {
                    i = i.toString();
                }
                document.querySelector('.d'+ i).classList.add('match');
            }
        }
    }
}
// click on date in calendar to see event(s) on that day & event that is held over multiple days including the clicked day
let allDays = document.querySelectorAll('.day');
allDays.forEach(clickOnDay);
function clickOnDay(d){
    d.addEventListener('click', filterByDate);
    function filterByDate(){
        let clickedDate = d.className.slice(5, 9); // get the date in format mmdd
        fetch("https://onestepfurther.nu/cms/wp-json/wp/v2/posts?_embed&per_page=50")
            .then(e=>e.json()).then(lookForDate);
        let newEventList = document.createElement('div');
        function lookForDate(es){
            es.forEach(matchDate);
            function matchDate(e){
                if(e.acf["date-start"] && (e.acf["date-start"].slice(4) == clickedDate)){
                    updateEventList();
                }
                else if(e.acf["date-start"] && e.acf["date-end"]){ // for the case that an event is held over multiple days, which means the clicked date may not necessarily be the same as the starting date
                    let postId = e.id;
                    let startNr = parseInt(e.acf["date-start"].slice(4,8), 10);
                    let endNr = parseInt(e.acf["date-end"].slice(4,8), 10);
                    let clickedDateNr = parseInt(clickedDate, 10);
                    if((startNr <= clickedDateNr) && (clickedDateNr <= endNr)){
                        updateEventList();
                    }
                }
                function updateEventList(){
                    // overwrite current eventlist with matched event(s)
                    let template2 = document.querySelector('template.singleEventOnDate').content;
                    let clone2 = template2.cloneNode(true);
                    clone2.querySelector('h1').innerHTML = e.title.rendered;
                    clone2.querySelector('h2').innerHTML = e.acf["major_type"];
                    clone2.querySelector('span.hide').textContent = e.id;
                    if(e._embedded["wp:featuredmedia"]){
                        clone2.querySelector('.featuredImg').setAttribute("src", e._embedded["wp:featuredmedia"][0].media_details.sizes.medium.source_url)
                    }
                    let acfs = Object.keys(e.acf);// get the list of all custom fields keys
                    acfs.forEach(getSpecialCustomField);
                    function getSpecialCustomField(cf){
                        // get event details
                        if (cf !== "major_type" && cf !== "date-start" && cf !== "date-end" && cf !== "hour_program-start" && cf !== "minute_program-start" && cf !== "hour_entrance" && cf !== "minute-entrance" && cf !== "description"){
                            let cfName = cf;
                            let p = document.createElement('p');
                            p.className = "p-cf, " + cfName; // for styling
                            let index = acfs.indexOf(cf);
                            p.textContent = cfName + ": " + Object.values(e.acf)[index]; // get corresponding value of each key and assign the value to the p
                            if (Object.values(e.acf)[index]) {
                                clone2.querySelector('.singleEventOnDate').appendChild(p); // only append when has value
                            }
                        }
                    }
                    newEventList.appendChild(clone2);
                    eventList.innerHTML = newEventList.innerHTML;
                    lookingForData = true;
                    clickOnSingleEvent();
                }
            }
        }
    }
}

/////////// click on individual post ///////////
function clickOnSingleEvent(){
    let allSingleEvents = document.querySelectorAll('.singleEvent');
    let allSingleEventsOnDate = document.querySelectorAll('.singleEventOnDate');
    allSingleEvents.forEach(treatSingleEvent);
    allSingleEventsOnDate.forEach(treatSingleEvent);
    function treatSingleEvent(singleEvent){
        singleEvent.addEventListener('click', displaySingleEvent);
        function displaySingleEvent(){
            window.location.href = "https://onestepfurther.nu/semester2/huset-kbh/single-event.html?id=" + singleEvent.querySelector('span.hide').textContent;
        }
    }
}
