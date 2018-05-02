let interval = setInterval(switchLogo, 300);
let firstImg = 1;
function switchLogo(){
    if(firstImg<=3){
        document.querySelector('.letters').setAttribute('src', 'img/logo-letter/'+firstImg+'.png');
        firstImg++;
    } else {
        clearInterval(interval);
    }
}
setTimeout(moveTri, 2400);
let left = 150; // setting in the css
function moveTri(){
    let interval2 = setInterval(toR, 600);
    function toR(){
        left += 30;
        if(left<400){
            document.querySelector('.tri').style.left = left + "px";
        } else {
            clearInterval(interval2);
        }
    }
}




