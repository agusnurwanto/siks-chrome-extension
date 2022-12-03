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
		var data = {
		    message:{
		        type: "get-url",
		        content: {
				    url: config.api_siks_url+'user/login',
				    type: 'post',
				    data: {
				    	email: config.user,
				    	password: config.password,
				    	captcha: data.captcha,
				    	key: data.key
				    },
	    			return: true
				}
		    }
		};

		chrome.runtime.sendMessage(data, function(response) {
		    console.log('responeMessage', response);
		});
	}
});

var current_url = window.location.href;
if(current_url.indexOf('/login') != -1){
	pesan_loading('SEND CAPTCHA TO LOKAL', true);
	var data = {
	    message:{
	        type: "get-url",
	        content: {
			    url: config.api_siks_url+'user/get-captcha',
			    type: 'GET',
    			return: true
			}
	    }
	};
	chrome.runtime.sendMessage(data, function(response) {
	    console.log('responeMessage', response);
	});
}

jQuery('.css-nb2z2f>.MuiTypography-root').after('<button id="update-lokal" style="padding: 7px 10px;">UPDATE TOKEN APLIKASI LOKAL</button>');
jQuery('#update-lokal').on('click', function(e){
	e.preventDefault();
	send_token_lokal();
});