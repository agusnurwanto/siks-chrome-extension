if(typeof _token == 'undefined'){
	_token = false;
	for(var i in localStorage){ 
	    var item = localStorage.getItem(i);
	    if(item){
	        item = JSON.parse(item);
	        item = JSON.parse(item.authReducer);
	        _token = 'Bearer '+item.token;
	    }
	}
	console.log('_token', _token);
}

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
var current_url = window.location.href;

jQuery('.css-nb2z2f>.MuiTypography-root').after('<button id="update-lokal" style="padding: 7px 10px;">UPDATE TOKEN APLIKASI LOKAL</button>');
jQuery('#update-lokal').on('click', function(e){
	e.preventDefault();
	show_loading();
	pesan_loading('SEND TOKEN TO LOKAL', true);
	var data = {
	    message:{
	        type: "get-url",
	        content: {
			    url: config.url_server_lokal,
			    type: 'post',
			    data: { 
					action: 'set_token',
					token: _token,
					api_key: config.api_key
				},
    			return: true
			}
	    }
	};
	chrome.runtime.sendMessage(data, function(response) {
	    console.log('responeMessage', response);
	});
});