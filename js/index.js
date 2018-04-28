/////////// build main filter of major category and the sub-categories/tags on the left ///////////
fetch("https://onestepfurther.nu/cms/wp-json/wp/v2/categories")
    .then(e=>e.json())
    .then(getMajorTypes);
function getMajorTypes(allCategories){
    let ul = document.querySelector(".type-filter");
    let cateArray = [];
    allCategories.forEach(category => {
        let li = document.createElement("li");
        let a = document.createElement("a");
        a.classList.add('major-category');
        if(category.parent === 12 || category.id === 33){ // include general events and board game events, not the board game posts
            if (category.name.indexOf("event")>-1){ // remove unnecessary text in the WP (in the WP these texts are useful as they help avoid condusion in similar categories)
                a.textContent = category.name.slice(0, -5);
            } else {
                a.textContent = category.name;
            }
            a.href="index.html?category="+category.id;
            cateArray.push(category.id);
            li.appendChild(a);
            ul.appendChild(li);
        }
    })
    // when one type is chosen, highlight that type and show sub-categories or tags

    // can't use click a type as eventlistener and change the "chosen" one's class, because page will be reloaded after each click, the selector will be no longer available
    if(window.location.href.indexOf('?category')>-1){
        document.querySelector('.all-types a').classList.remove('chosen');
        let allTypes = document.querySelectorAll('.major-category');
        let cateId = window.location.href.split('=')[1];
        for(let i=0; i<cateArray.length; i++){
            if(cateId == cateArray[i]){
                allTypes[i].classList.add('chosen');
            }
        }
    }
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
        if (window.location.href.indexOf('?category')<0){ // only need to show event type (name and icon) in the list that include multiple types, after user has filtered list using type, no need to show category at each each post
            clone.querySelector('h2').innerHTML = singleEvent.acf["major_type"]; // use innerHTML cuz title include html entities and tags
        } else {
            clone.querySelector('.event-type-icon').remove();
        }
        clone.querySelector('h1').innerHTML = singleEvent.title.rendered;
        clone.querySelector('span.hide').textContent = singleEvent.id;
        if(singleEvent._embedded["wp:featuredmedia"]){
            clone.querySelector('.featuredImg').setAttribute("src", singleEvent._embedded["wp:featuredmedia"][0].media_details.sizes.medium.source_url)
        }
        let acfs = Object.keys(singleEvent.acf);// get the list of all custom fields keys
        acfs.forEach(getSpecialCustomField);
        function getSpecialCustomField(cf){
            // get event details
            if (cf !== "major_type" && cf !== "date-start" && cf !== "date-end" && cf !== "hour_program-start" && cf !== "minute_program-start" && cf !== "hour_entrance" && cf !== "minute-entrance" && cf !== "location" && cf !== "extra_link_name" && cf !== "extra_link_url"){ // don't display these in the list view WITHIN any category
                let index = acfs.indexOf(cf);
                let cfValue = Object.values(singleEvent.acf)[index];
                if(cf == "availability" && cfValue == "available"){
                    // don't show any thing in this cased
                } else if(cf == "availability" && cfValue !== "available") {
                    let p = document.createElement('p');
                    p.classList.add('red');
                    p.textContent = "Sold-Out";
                    clone.querySelector('.singleEvent').appendChild(p);
                } else if(cf == "price" && cfValue == "0"){
                    let p = document.createElement('p');
                    p.textContent = "FREE";
                    clone.querySelector('.singleEvent').appendChild(p);
                } else if(cf == "price" && cfValue !== "0") {
                    let p = document.createElement('p');
                    p.textContent = "Normal price: " + cfValue + " Kr.";
                    clone.querySelector('.singleEvent').appendChild(p);
                } else if(cf == "extra_info" && cfValue.indexOf('Forsalg')>-1) {
                    let p = document.createElement('p');
                    p.textContent = cfValue.replace('Forsalg', "Presale").replace('gebyr', 'fee');
                    clone.querySelector('.singleEvent').appendChild(p);
                } else if(cf == "extra_info" && cfValue && cfValue.indexOf('Forsalg')<0) {
                    let p = document.createElement('p');
                    p.textContent = "... extra ...";
                    clone.querySelector('.singleEvent').appendChild(p);
                } else if(cf == "buy_ticket"){
                    if(Object.values(singleEvent.acf)[index].indexOf('http')>-1){
                        let a = document.createElement('a');
                        a.classList.add('blockA');
                        a.target = "_blank";
                        a.href = cfValue;
                        a.textContent = "Buy ticket online";
                        clone.querySelector('.singleEvent').appendChild(a);
                    } else if(Object.values(singleEvent.acf)[index].indexOf('KØB')>-1) {
                        let p = document.createElement('p');
                        p.textContent = " Buy ticket at the entrance";
                        clone.querySelector('.singleEvent').appendChild(p);
                    } else {
                        let p = document.createElement('p');
                        p.textContent = cfValue;
                        clone.querySelector('.singleEvent').appendChild(p);
                    }
                } else if(cf == "language" && cfValue.length>1){
                    let langSpan = document.createElement('span');
                    langSpan.className = "lang";
                    let langImg = document.createElement('img');
                    langImg.setAttribute('src', "img/lang-icon_50.png");
                    langImg.setAttribute('alt', "langIcon");
                    langImg.classList.add('lang-icon');

                    clone.querySelector('.singleEvent').appendChild(langImg);
                    for (let i=0; i<cfValue.length; i++){
                        let span = document.createElement('span');
                        span.textContent = cfValue[i] + "  ";
                        clone.querySelector('.singleEvent').appendChild(langSpan);
                        clone.querySelector('.singleEvent span.lang').appendChild(span);
                    }
                    clone.querySelector('.singleEvent span.lang').textContent = clone.querySelector('.singleEvent span.lang').textContent.replace(/\s+/, ' / ');
                } else if(cf == "language" && cfValue.length ==1 ){
                    let langSpan = document.createElement('span');
                    langSpan.className = "lang";
                    let langImg = document.createElement('img');
                    langImg.setAttribute('src', "img/lang-icon_50.png");
                    langImg.setAttribute('alt', "langIcon");
                    langImg.classList.add('lang-icon');
                    clone.querySelector('.singleEvent').appendChild(langImg);
                    let span = document.createElement('span');
                    span.textContent = cfValue;
                    clone.querySelector('.singleEvent').appendChild(span);
                } else if(cf == "price_to_rent_the_game" || cf == "type_of_game"){
                } else if(cf == "description"){
                    let p = document.createElement('p');
                    p.textContent = "... read more ...";
                    clone.querySelector('.singleEvent').appendChild(p);
                }

                else {
                    let cfName = cf;
                    let cfValue = Object.values(singleEvent.acf)[index];
                    let p = document.createElement('p');
                    p.className = "p-cf, " + cfName; // for styling
                    p.innerHTML = "<p class='cfP'>" + cfName + ": </p><p>" + cfValue + "</p>";
                    //p.textContent = cfName + ": " + cfValue; // get corresponding value of each key and assign the value to the p
                    if (Object.values(singleEvent.acf)[index]) {
                        clone.querySelector('.singleEvent').appendChild(p); // only append when has value
                    }
                }
            }
        }
        eventList.appendChild(clone);
    }
clickOnSingleEvent();
}
/////////// load next page of posts when reaching the bottom of the page
let checkBottom = setInterval(function(){
  if(bottomVisible() && lookingForData===false){
      console.log('load next page');
    pageNr++;
    loadList();
  }
}, 700)
function bottomVisible() {
  const scrollY = window.scrollY
  const visible = document.documentElement.clientHeight;
  const pageHeight = document.documentElement.scrollHeight;
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
            window.location.href = "single-event.html?id=" + singleEvent.querySelector('span.hide').textContent;
        }
    }
}
