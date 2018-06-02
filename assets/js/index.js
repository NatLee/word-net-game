var ary = [];

$.ajaxSettings.async = false;

expire_days = 365;
var d = new Date();
d.setTime(d.getTime() + (expire_days * 24 * 60 * 60 * 1000));
var expires = "expires=" + d.toGMTString();

//USER NAME
var userName = document.getElementById("userName").value
var cookieUserName;
try{
    cookieUserName = document.cookie.split('userName=')[1].split(';')[0];
    if(cookieUserName){
        userName = cookieUserName;
        document.getElementById("userName").value = userName;
    }
}catch(err){
    swal("請輸入你的名字！", "框框可以滑條下方找到：）","info");
}

//COUNT
var count;
try{
  count = document.cookie.split('count=')[1].split(';')[0];
  document.getElementById('count').innerHTML = count;
}catch(err){
  if(!count || count=='NaN' || count=='NAN'){
    count = 0;
    document.getElementById('count').innerHTML = count;
  }else if(count>=0){
    document.getElementById('count').innerHTML = count;
  }
}

//Get text
var textJsonUrl = 'https://spreadsheets.google.com/feeds/list/1YvvLFdpnt-w-JQe7z5R-Gda39jN-wSOEYyCvRxKZnZw/o429udt/public/full?alt=json';
var json = $.get(textJsonUrl);
var obj = JSON.parse(json.responseText);
var list = obj['feed']['entry']
var randNumber = Math.random() * list.length
var intRandomNumber = parseInt(randNumber)
var text = list[intRandomNumber]['gsx\$textdata']['\$t'];
document.getElementById('text').innerHTML = text;

$( "#slider-range-max" ).slider({
  range: "max",
  min: -100000,
  max: 100000,
  value: 0,
  slide: function( event, ui ) {
  	$( "#score" ).val( ui.value );
  }});

function clickEvent(e) {

    swal({
        title: '你確定嗎？',
        text: "一旦按下OK，此次結果將會送出。",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#49be2c',
        cancelButtonColor: '#d33',
        confirmButtonText: 'OK'
    }).then((result) => {
        if (result.value) {
            ary = [];
            var googleForm = 'https://docs.google.com/forms/u/2/d/e/1FAIpQLSdFdrcjmr3yrpMdQ5C9SQ_1PMZU-LcmdZDBtmD5xXD7Vg0tVQ/formResponse?';
            var entryUserName = 'entry.1306234642=';
            var entryText = 'entry.404300076=';
            var entryScore = 'entry.43544314=';

            userName = document.getElementById("userName").value;
						score = ($("#slider-range-max").slider("option", "value")/100000).toString();

            var sendUser = entryUserName + userName;
            var sentText = entryText + text;
						var sentScore = entryScore + score;
						var sendGoogleForm = googleForm + sendUser + '&' + sentText + '&' + sentScore
            $.get(sendGoogleForm);

            document.cookie = "userName=" + userName + ";" + expires;
            document.cookie = "count=" + (parseInt(count) + 1) + ";" + expires;
            swal({
                title: '已送出',
                text: '送出成功！請繼續努力！',
                type: 'success',
                timer: 1500,
                onOpen: () => {
                    swal.showLoading()
                }
            }).then((value) => {
                location.reload();
            });
        }
    })
}

function detailsEvent(e) {
    swal({
        title: '這是個說明',
        text: '按照你的感受來拉動滑條評分！YEE！',
        type: 'warning',
        width: 600,
        padding: '3em',
        background: '#fff url(https://sweetalert2.github.io/images/trees.png)',
        backdrop: `
        rgba(0,0,123,0.4)
        url("https://sweetalert2.github.io/images/nyan-cat.gif")
        center left
        no-repeat
        `
    })
}
