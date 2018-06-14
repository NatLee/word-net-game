$.ajaxSettings.async = false;

//USER NAME
var userName = localStorage['userName'];
if(!userName){
    swal({
        title: "歡迎",
        text: "請先輸入姓名，使用方法可以在下方說明按鈕中找到！：）",
        type: "info",
        confirmButtonText: '好的'
    });
}else{
    document.getElementById("userName").value = userName;
}

//COUNT
var count = localStorage['count'];
if(!count){
    count = 0;
}else{
    document.getElementById('count').innerHTML = count;
    if(count != 0 && count%100 == 0){
        swal({
            title: '恭喜',
            text: '離下一個一百又更近一步了呢！',
            type: 'warning'
        })
    }
}

//Get text

var text = $.get('https://word-net-flask.herokuapp.com/')
if(!text.responseText){
  var textJsonUrl = 'https://spreadsheets.google.com/feeds/list/1YvvLFdpnt-w-JQe7z5R-Gda39jN-wSOEYyCvRxKZnZw/o429udt/public/full?alt=json';
  var json = $.get(textJsonUrl);
  var obj = JSON.parse(json.responseText);
  var list = obj['feed']['entry']
  var randNumber = Math.random() * list.length
  var intRandomNumber = parseInt(randNumber)
  var text = list[intRandomNumber]['gsx\$textdata']['\$t'];
}

document.getElementById('text').innerHTML = text.responseText;

// Set slider
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
        confirmButtonText: 'OK',
        cancelButtonText: '不要',
    }).then((result) => {
        if (result.value) {
            var googleForm = 'https://docs.google.com/forms/u/2/d/e/1FAIpQLSdFdrcjmr3yrpMdQ5C9SQ_1PMZU-LcmdZDBtmD5xXD7Vg0tVQ/formResponse?';
            var entryUserName = 'entry.1306234642=';
            var entryText = 'entry.404300076=';
            var entryScore = 'entry.43544314=';

            userName = document.getElementById("userName").value;
		 score = ($("#slider-range-max").slider("option", "value")/100000).toString();

            var sendUser = entryUserName + userName;
            var sentText = entryText + text.responseText;
		 var sentScore = entryScore + score;
		 var sendGoogleForm = googleForm + sendUser + '&' + sentText + '&' + sentScore;
            $.get(sendGoogleForm);

            localStorage['userName'] = userName
            localStorage['count'] = parseInt(count)+1
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
        } else if(result.dismiss === swal.DismissReason.cancel){
            swal({
                title: '已取消',
                text: '請確認後再按送出。',
                type: 'error'
            })
        }
    })
}

function detailsEvent(e) {
    swal.mixin({
        confirmButtonText: 'Next &rarr;',
        showCancelButton: true,
        progressSteps: ['1', '2', '3']
    }).queue([
        {
            title: '第一步',
            text: '請先填入你的名字。',
            imageUrl: 'images/1.gif',
            imageWidth: 400,
            imageHeight: 200
        },
        {
            title: '第二步',
            text: '觀察句子並憑感受拉動滑條。',
            imageUrl: 'images/2.gif',
            imageWidth: 400,
            imageHeight: 200
        },
        {
            title: '第三步',
            text: '按下送出的按鈕。',
            imageUrl: 'images/3.gif',
            imageWidth: 400,
            imageHeight: 200
        }
    ]).then((result) => {
        if (result.value) {
            swal({
                title: 'All done!',
                text: '做得好！我們可以開始了！',
                type: 'success',
                confirmButtonText: 'Go！',
                backdrop: `
                rgba(0,0,123,0.4)
                url("https://sweetalert2.github.io/images/nyan-cat.gif")
                top left
                no-repeat
                `
            })
        }
    })

}
