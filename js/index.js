let firstLoad = true;
let firstPostLoad = false;
if(firstLoad == true && window.location.href.indexOf('category') < 0){
    console.log('show ani');
    showLoadingAnimation();
} else {
    endLoadingAnimation();
}
function showLoadingAnimation(){
    console.log('show animation');
    document.querySelector('.verti-icon').classList.remove('hide');
    document.querySelector('main').classList.add('hide-main');
    document.querySelector('.by-type').classList.add('hide');
    document.querySelector('.by-date').classList.add('hide');
    document.querySelector('.dark-green').classList.add('load');
    document.querySelector('.purple').classList.add('load');
    document.querySelector('.pink').classList.add('load');
    document.querySelector('.tri').classList.remove('hide')
}

function endLoadingAnimation(){
    firstLoad = false;
    let hideAniTimeout1 = setTimeout(hideAni1, 1450);
    function hideAni1(){
        document.querySelector('.verti-icon').classList.add('hide');
        document.querySelector('.tri').classList.add('hide');
    }
    setTimeout(function(){ document.querySelector('main').classList.remove('hide-main');
    }, 1500);
    let hideAniTimmeout2 = setTimeout(hideAni2, 1700);
    function hideAni2(){
        document.querySelector('.dark-green').classList.remove('load');
        document.querySelector('.purple').classList.remove('load');
        document.querySelector('.pink').classList.remove('load');
        document.querySelector('.by-type').classList.remove('hide');
        document.querySelector('.by-date').classList.remove('hide');
        document.querySelector('.current-type').classList.remove('hide');
        document.querySelector('.by-date').classList.remove('hide');
        clearTimeout(hideAniTimmeout2);
    }
}


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
        //let icon = document.createElement('img');
        let p = document.createElement('p');
        //icon.classList.add('hide');
        a.classList.add('major-category');
        if(category.parent === 12 || category.id === 33){ // include general events and board game events, not the board game posts
            if (category.name.indexOf("event")>-1){ // remove unnecessary text in the WP (in the WP these texts are useful as they help avoid condusion in similar categories)
                p.textContent = category.name.slice(0, -5);
                p.className = category.name.slice(0, -5);
            } else {
                p.textContent = category.name;
                p.className = category.name;
            }
            a.href="index.html?category="+category.id;
            cateArray.push(category.id); // so later can match category id in url, which shows which type is clicked, with which li is clicked. read few lines below
            //icon.classList.add('type-icon');
            //icon.src = "img/" + category.id + ".png";
            a.appendChild(p);
            //a.appendChild(icon);
            li.appendChild(a);
            ul.appendChild(li);
        }
    })
    // move the "other" category to the last position of the list
    let other = document.querySelector('.Other');
    other.parentElement.parentElement.parentElement.appendChild(other.parentElement.parentElement);
    // also change the array of the category so the clicked=chosen function below, which is based on matching indexing in array, still workd
    let otherSIndex = cateArray.indexOf(11); // use 11 instead of '11' as it'a number inside a array, not a string
    cateArray.splice(otherSIndex, 1); // not slice!
    cateArray.push(11);
    // when one type is chosen, highlight that type and show sub-categories or tags
    // can't use click a type as eventlistener and change the "chosen" one's class, because page will be reloaded after each click, the selector will be no longer available
    if(window.location.href.indexOf('?category')>-1){
        document.querySelector('.all-types a').classList.remove('chosen');
        let allTypes = document.querySelectorAll('.major-category');
//        let allTypeIcons = document.querySelectorAll('.type-icon');
        let cateId = window.location.href.split('=')[1];
        for(let i=0; i<cateArray.length; i++){
            if(cateId == cateArray[i]){
                allTypes[i].classList.add('chosen');
                updateCurrentType();
//                allTypeIcons[i].classList.remove('hide');
            }
        }
    }
    getGenreFilter();
}
function getGenreFilter(){
    let categoryId = urlParams.get("category");
    let fetchLink = "https://onestepfurther.nu/cms/wp-json/wp/v2/posts/?_embed&categories=" + categoryId;
    if(categoryId && categoryId !=='33' && categoryId !== '11'){ //exclude "board game" type and "other" type, since they don't have genre set up
        fetch(fetchLink)
            .then(e=>e.json())
            .then(generateGenreList);
    }
    function generateGenreList(allPostWithinType){
        let genres = [];
        allPostWithinType.forEach(getGenre);
        function getGenre(p) {
            let genre = p.acf.genre;
            if(genre && genres.indexOf(genre)<0){ // so no duplicate genre
                genres.push(genre);
            } else if (!genre){ // if a post has no genre set, then sort this in the "other" sub cate
                genres.push('other');
            }
        }
        let genreLine = document.createElement('p');
        genreLine.classList.add('genre-line');
        genres.forEach(addGenreAsSubCate);
        function addGenreAsSubCate(g){
            let a = document.createElement('a');
            genreLine.innerHTML += "<a class='genre-sub'>- " + g + "</a>";
        }
        document.querySelector('.chosen').parentElement.appendChild(genreLine);
    }
}
function updateCurrentType(){
    document.querySelector('.current-type').textContent = document.querySelector('.chosen p').textContent;
    document.querySelector('aside').classList.add('narrow');
}

/////////// load event list in pages///////////
let template = document.querySelector("template.singleEvent").content;
let eventList = document.querySelector(".eventList");
let lookingForData = false;
let pageNr = 1;
let urlParams = new URLSearchParams(window.location.search);

loadList();
function loadList(){
    document.querySelector('.current-type').textContent = "loading ...";
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
    endLoadingAnimation();

    updateCurrentType();
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
            clone.querySelector('.event-type-icon').setAttribute('src', "img/" + singleEvent.categories[1] +"-black.png");
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
            if (cf !== "major_type" && cf !== "date-start" && cf !== "date-end" && cf !== "hour_program-start" && cf !== "minute_program-start" && cf !== "hour_entrance" && cf !== "minute-entrance" && cf !== "location" && cf !== "extra_link_name" && cf !== "extra_link_url" && cf !== "release_year"  && cf !== "game_played"){ // don't display these in the list view WITHIN any category
                let index = acfs.indexOf(cf);
                let cfValue = Object.values(singleEvent.acf)[index];
                let p = document.createElement('p');

                if(cf == "availability" && cfValue == "available"){
                    // don't show any thing in this cased
                } else if(cf == "availability" && cfValue !== "available") {
                    p.classList.add('red');
                    p.textContent = "Currently sold-Out";
                } else if(cf == "price" && cfValue == "0"){
                    p.textContent = "FREE";
                } else if(cf == "price" && cfValue !== "0") {
                    p.textContent = "Price: " + cfValue + " Kr.";
                } else if(cf == "extra_info" && cfValue.indexOf('Forsalg')>-1) {
                    p.textContent = cfValue.replace('Forsalg', "Presale").replace('gebyr', 'fee');
                } else if(cf == "extra_info" && cfValue && cfValue.indexOf('Forsalg')<0) {
                    p.className = "read-more";
                    if(cfValue.length<200){ // if the text of extra info is not too long
                        p.textContent = "!!! " + cfValue;
                    } else {
                        p.textContent = "... extra info ...";
                    }
                } else if(cf == "buy_ticket"){
                    if(Object.values(singleEvent.acf)[index].indexOf('http')>-1){
                        let a = document.createElement('a');
                        a.classList.add('blockA');
                        a.target = "_blank";
                        a.href = cfValue;
                        a.textContent = "Buy ticket online";
                        clone.querySelector('.singleEvent').appendChild(a);
                    } else if(Object.values(singleEvent.acf)[index].indexOf('KØB')>-1) {
                        p.textContent = " Buy ticket at the entrance";
                    } else {
                        p.textContent = cfValue;
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
                    p.className= 'read-more';
                    p.textContent = "... read more ...";
                } else if(cf == "duration" && cfValue){
                    p.className = "p-cf, " + cf; // for styling
                    p.innerHTML = "<p class='cfP'>" + cf + ": </p><p>" + cfValue + " min.</p>";
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
                    let cfValue = Object.values(singleEvent.acf)[index];
                    let p = document.createElement('p');
                    p.className = "p-cf, " + cf; // for styling
                    p.innerHTML = "<p class='cfP'>" + cf + ": </p><p>" + cfValue + "</p>";
                    //p.textContent = cfName + ": " + cfValue; // get corresponding value of each key and assign the value to the p
                    if (Object.values(singleEvent.acf)[index]) {
                        clone.querySelector('.singleEvent').appendChild(p); // only append when has value
                    }
                }
                clone.querySelector('.singleEvent').appendChild(p);
                firstPostLoad = true;
            }
        }
        eventList.appendChild(clone);
    }

    clickOnSingleEvent();
}


/////////// load next page of posts when reaching the bottom of the page
let checkBottom = setInterval(function(){
  if(bottomVisible() && lookingForData===false){
      updateCurrentType;
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

/////////// click to expand "by type" ///////////
document.querySelector('.by-type').addEventListener('click', showCategoryList);
function showCategoryList(){
    document.querySelector('.current-type').classList.add('hide');
    document.querySelector('img.dark-green').classList.add('big');
    document.querySelector('.type-filter').classList.add('expand-type-filter');
    document.querySelector('aside').classList.remove('narrow');
    document.querySelector('aside').classList.add('tilt');
    document.querySelector('.type-filter').classList.remove('hide');
    closeDateFilter();
}

/////////// click on "close by type" ///////////
document.querySelector('.close-by-type').addEventListener('click', closeTypeFilter);
function closeTypeFilter(){
    document.querySelector('.current-type').classList.remove('hide');
    document.querySelector('img.dark-green').classList.remove('big');
    document.querySelector('.type-filter').classList.remove('expand-type-filter');
    document.querySelector('aside').classList.remove('tilt');
    document.querySelector('aside').classList.add('narrow');
    document.querySelector('.type-filter').classList.add('hide');
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
    let hint = document.createElement('p');
    hint.className = "hint";
    hint.innerHTML = " * date in highlighted color has event(s) registered already";
    document.querySelector('.month:nth-of-type(' + month + ') .days').appendChild(hint);
}

// assign days of the week
auto();
function auto(){
    let gridStarts = [2];
    let NrOfDaysInEachMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // only working on this year, so no leap year considered
    let offsets = [];
    NrOfDaysInEachMonth.forEach(getOffset);
    function getOffset(nD){
        offsets.push(nD%7);
    }
    for(let i = 0; i<12; i++){
        if(gridStarts[i] + offsets[i]<=7){
            gridStarts.push(gridStarts[i] + offsets[i]);
        } else {
            gridStarts.push(gridStarts[i] + offsets[i] - 7);
        }
    }
    let monthsToAssign = document.querySelectorAll('.days .day:nth-of-type(1)');
    for(i=1; i<12; i++){
        monthsToAssign[i].style.gridColumnStart = gridStarts[i];
    }
}


// for the defalt shown month, a loading event animation need to be shown, in case filter events on dates takes too long
document.querySelector('.month:not(.hide) .hint').innerHTML = "<p class='loading-dots'>. . . . . . .</p> checking the events";
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

// click to expand calender filter
let datePicked; // need this to handle the collapse calender result. If no date with event is clicked, collapse calender won't change the underlying page content. If a date with event is clicked, the underlying page will display events on that day, the type filter should be hiden in this case, otherwise user might think they can further filter the results by type

document.querySelector('.by-date').addEventListener('click', showCalender);
function showCalender(){
    datePicked = false;
    document.querySelector('img.dark-green').classList.remove('big');
    closeTypeFilter();
    document.querySelector('img.purple').classList.add('big');
    document.querySelector('.calendar').classList.add('expand');
    document.querySelector('.date-filter').classList.remove('hide');
    document.querySelector('.by-date').classList.add('hide');
}


// click to collapse calender
document.querySelector('.close-calender').addEventListener('click', closeDateFilter);
function collapseCalender(){
    closeDateFilter();
    if (datePicked == true){
        if (document.querySelector('.chosen')){
            document.querySelector('.chosen').classList.remove('chosen');
//            document.querySelectorAll('.type-icon').forEach(function(ti){ti.classList.add('hide')});
        }
        document.querySelector('.by-type').addEventListener('click', showCategoryList);
        function showCategoryList(){
            document.querySelector('.type-filter').classList.remove('hide');
        }
    } else {
        document.querySelector('.type-filter').classList.remove('hide');
    }
}
function closeDateFilter(){
    document.querySelector('img.purple').classList.remove('big');
    document.querySelector('.by-date').classList.remove('hide');
    document.querySelector('.date-filter').classList.add('hide');
    document.querySelector('.calendar').classList.remove('expand');
}

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
            document.querySelector('.d' + eventStartDate).classList.add('id' + d.id);
            document.querySelector('.d' + eventStartDate).classList.add('match');
        document.querySelector('.month:not(.hide) .hint').textContent = " * date in highlighted color has event(s) registered already";
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
                document.querySelector('.d' + i).classList.add('id' + d.id);
                document.querySelector('.d'+ i).classList.add('match');
        document.querySelector('.month:not(.hide) .hint').textContent = " * date in highlighted color has event(s) registered already";
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
        if(d.className.indexOf('match')<0){ // check if it's a day with match. if not give hint
            //??? can't set var allDays above to select all .match, which would mean only checking on days with match. don't know why it doesn't work, classes are in, should work....
            document.querySelector('.month:not(.hide) .hint').textContent = " No event on that day";
            setTimeout(function(){document.querySelector('.month:not(.hide) .hint').textContent = " * date in highlighted color has event(s) registered already";
}, 1300);
        } else { // click on day with match
            if(document.querySelector('.chosen')){ // the first click on matched day should clear chosen, from the second click on matched day on, there will be no more .chosen. so check existance first
                document.querySelector('.chosen').classList.remove('chosen'); // cuz an event based on a date is chose and this event may not be of the same type of the current type displayed, so need to remove this info to avoid confusion
                document.querySelector('.current-type').classList.add('hide'); // this line shows which was last picked as chosen type, need to be removed as well
                if(document.querySelector('.genre-line')){
                    document.querySelector('.genre-line').remove(); // inside there could be a line of genre, need to be removed as well.
                }
            }
            window.scrollTo(0,0); // because a filter by date still runs on the same page, if the page was already scrolled to the middle, this scrolling down also affects the date search result, user might not realise that they are reading from the middle of the page
            document.querySelector('.triangle').setAttribute('src', "img/triangle_purple_300.png");
            document.querySelector('.month:not(.hide) .hint').textContent = " * date in highlighted color has event(s) registered already";     // whenever a day is clicked, reset hint to this
            document.querySelectorAll('.singleEvent').forEach(function(e){e.classList.add('match-day-clicked')});
            document.querySelectorAll('.singleEventOnDate').forEach(function(e){e.classList.add('match-day-clicked')});
        }
        // find matching event(s)
        let newEventList = document.createElement('div');
        let idS = d.classList;
        for(i=0; i<idS.length; i++){
            if(idS[i].indexOf('id')>-1){
                let id = idS[i].slice(2);
                fetch("https://onestepfurther.nu/cms/wp-json/wp/v2/posts/" + id + "?_embed")
                    .then(e=>e.json()).then(updateEventList);
                function updateEventList(e){
                    datePicked = true; // usded for different treatments regarding what to display after calender is collapsed
                    // overwrite current eventlist with matched event(s)
                    let template2 = document.querySelector('template.singleEventOnDate').content;
                    let clone2 = template2.cloneNode(true);
                    clone2.querySelector('h2').innerHTML = e.acf["major_type"]; // use innerHTML cuz title include html entities and tags
                        if(e.categories.length>1){ // for the root cate, which is event, there is no icon designed. need to find the "actual" indicidual category
                            clone2.querySelector('.event-type-icon').setAttribute('src', "img/" + e.categories[1] +"-black.png");
                        } else {
                            clone2.querySelector('.event-type-icon').setAttribute('src', "img/" + e.categories[0] +"-black.png");
                        }
                    clone2.querySelector('h1').innerHTML = e.title.rendered;
                    clone2.querySelector('span.hide').textContent = e.id;
                    if(e._embedded["wp:featuredmedia"]){
                        clone2.querySelector('.featuredImg').setAttribute("src", e._embedded["wp:featuredmedia"][0].media_details.sizes.medium.source_url);
                        clone2.querySelector('.featuredImg').setAttribute("alt", "featured image of event"); // not working???
                    }
                    let acfs = Object.keys(e.acf);// get the list of all custom fields keys
                    acfs.forEach(getSpecialCustomField);
                    function getSpecialCustomField(cf){
                        let index = acfs.indexOf(cf);
                        let cfValue = Object.values(e.acf)[index];
                        // get event details
                        if (cf !== "major_type" && cf !== "date-start" && cf !== "date-end" && cf !== "hour_program-start" && cf !== "minute_program-start" && cf !== "hour_entrance" && cf !== "minute-entrance" && cf !== "extra_link_url" && cf !== "game_played"){ // don't deal with these for hand-in
                            let p = document.createElement('p');
                            if(cf == "description" && cfValue.length < 200){ // display only the full text of short descriptions
                                p.classList.add('extra-margin');
                                p.textContent = cfValue;
                            } else if (cf == "description" && cfValue.length >= 200){
                                p.classList.add('extra-margin');
                                p.textContent = "... read more ...";
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
                                p.textContent = "... extra info ...";
                            } else if(cf == "buy_ticket"){
                                if(cfValue.indexOf('http')>-1){
                                    let a = document.createElement('a');
                                    a.classList.add('blockA');
                                    a.target = "_blank";
                                    a.href = cfValue;
                                    a.textContent = "Buy ticket online";
                                    clone2.querySelector('.singleEventOnDate').appendChild(a);
                                } else if(cfValue.indexOf('KØB')>-1) {
                                    p.textContent = " Buy ticket at the entrance";
                                } else {
                                    p.textContent = cfValue;
                                }
                            } else if(cf == "language" && cfValue.length>1){
                                let langSpan = document.createElement('span');
                                langSpan.className = "lang";
                                let langImg = document.createElement('img');
                                langImg.setAttribute('src', "img/lang-icon_50.png");
                                langImg.setAttribute('alt', "langIcon");
                                langImg.classList.add('lang-icon');
                                clone2.querySelector('.singleEventOnDate').appendChild(langImg);
                                for (let i=0; i<cfValue.length; i++){
                                    let span = document.createElement('span');
                                    span.textContent = cfValue[i] + "  ";
                                    clone2.querySelector('.singleEventOnDate').appendChild(langSpan);
                                    clone2.querySelector('.singleEventOnDate span.lang').appendChild(span);
                                }
                                clone2.querySelector('.singleEventOnDate span.lang').textContent = clone2.querySelector('.singleEventOnDate span.lang').textContent.replace(/\s+/, ' / ');
                            } else if(cf == "language" && cfValue.length ==1 ){
                                let langSpan = document.createElement('span');
                                langSpan.className = "lang";
                                let langImg = document.createElement('img');
                                langImg.setAttribute('src', "img/lang-icon_50.png");
                                langImg.setAttribute('alt', "langIcon");
                                langImg.classList.add('lang-icon');
                                clone2.querySelector('.singleEventOnDate').appendChild(langImg);
                                let span = document.createElement('span');
                                span.textContent = cfValue;
                                clone2.querySelector('.singleEventOnDate').appendChild(span);
                            } else if(cf == "price_to_rent_the_game" || cf == "type_of_game"){
                            } else if(cf == "description"){
                                p.className= 'read-more';
                                p.textContent = "... read more ...";
                            } else if(cf == "duration" && cfValue){
                                p.className = "cfP, " + cf; // for styling
                                p.innerHTML = "<p class='cfP'>" + cf + ": </p><p>" + cfValue + " min.</p>";
                            } else if (cf == "location") {
                                p.className = "cfP " + cf; // for styling
                                p.innerHTML = "<p class='cfP'><img class='location' src='img/location.png' alt='location icon'>" + cfValue + "</p>";
                            } else if (cf == "extra_link_name" && cfValue.indexOf(',')<0){
                                let a = document.createElement('a');
                                a.classList.add('blockA');
                                a.classList.add('extra-margin');
                                a.target = "_blank";
                                a.textContent = cfValue;
                                a.href = Object.values(e.acf)[index+1]; // the next key is the url, not the value of current key
                                clone2.querySelector(".singleEventOnDate").appendChild(a);
                            } else if (cf == "extra_link_name" && cfValue.indexOf(',')>-1){
                                let nrOfExtraLink = cfValue.split(',').length;
                                for(let i=0; i<nrOfExtraLink; i++){
                                    let a = document.createElement('a');
                                    a.classList.add('blockA');
                                    a.classList.add('cfP');
                                    a.target = "_blank";
                                    a.textContent = cfValue.split(',')[i];
                                    a.href = Object.values(e.acf)[index+1].split(',')[i];
                                    clone2.querySelector(".singleEventOnDate").appendChild(a);
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
                                    clone2.querySelector('.singleEventOnDate').appendChild(p); // only append when has value
                                }
                            }
                            clone2.querySelector('.singleEventOnDate').appendChild(p);
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







