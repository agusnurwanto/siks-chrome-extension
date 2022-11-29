get_token();

// untuk menjaga session
intervalSession();

var loading = ''
	+'<div id="wrap-loading">'
        +'<div class="lds-hourglass"></div>'
        +'<div id="persen-loading"></div>'
    +'</div>';
if(jQuery('#wrap-loading').length == 0){
	jQuery('body').prepend(loading);
}

var pusher = new Pusher(config.pusher_id, {
  cluster: config.cluster
});

var channel = pusher.subscribe('my-channel');
channel.bind('my-event', function(data) {
  	console.log('from pusher!', JSON.stringify(data));
	if(data.action == 'require_login'){
		localStorage.clear();
		window.location = config.siks_url+'login';
	}else if(data.action == 'login_captcha'){
		jQuery('input[name="captcha"]').val(data.captcha);
		jQuery('form button').eq(2).click();
		setTimeout(function(){
			get_token();
			send_token_lokal();
		}, 5000)
	}
});

var current_url = window.location.href;
if(current_url.indexOf('/login') != -1){
	setTimeout(function(){
		show_loading();
		pesan_loading('SEND CAPTCHA TO LOKAL', true);
		var captcha = jQuery('img[alt="captcha"]').attr('src');
		var data = {
		    message:{
		        type: "get-url",
		        content: {
				    url: config.url_server_lokal,
				    type: 'post',
				    data: { 
						action: 'set_captcha',
						captcha: captcha,
						api_key: config.api_key
					},
	    			return: true
				}
		    }
		};
		chrome.runtime.sendMessage(data, function(response) {
		    console.log('responeMessage', response);
		});
	}, 3000);
}

jQuery('.css-nb2z2f>.MuiTypography-root').after('<button id="update-lokal" style="padding: 7px 10px;">UPDATE TOKEN APLIKASI LOKAL</button>');
jQuery('#update-lokal').on('click', function(e){
	e.preventDefault();
	send_token_lokal();
});