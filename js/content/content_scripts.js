// console.log('run content_script.js');

function injectScript(file, node, _type) {
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement('script');
    if(_type){
    	s.setAttribute('type', _type);
    }else{
    	s.setAttribute('type', 'text/javascript');
    }
    s.setAttribute('src', file);
    th.insertBefore(s, th.firstChild);
}
injectScript( chrome.runtime.getURL('/content_message.js'), 'html');
injectScript( chrome.runtime.getURL('/config.js'), 'html');
injectScript( chrome.runtime.getURL('/js/jquery.min.js'), 'html');
injectScript( chrome.runtime.getURL('/js/content/content_inject.js'), 'html');
injectScript( chrome.runtime.getURL('/js/crypto-js.min.js'), 'html');
injectScript( chrome.runtime.getURL('/js/content/functions.js'), 'html');
window.data_temp_onmessage = {};

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
	if(request.continue){
		if(typeof data_temp_onmessage[request.continue] == 'undefined'){
			data_temp_onmessage[request.continue] = [];
		}
		data_temp_onmessage[request.continue].push(request.data.data);
		if(request.no >= request.length){
			request.data.data = data_temp_onmessage[request.continue];
		}else{
			return;
		}
	}
	console.log('sender, request', sender, request);
	if(request.type == 'response-fecth-url'){
		var res = request.data;
		var _alert = true;
		var cek_hide_loading = true;
		if(res.action == 'set_captcha'){
			_alert = false;
		}else if(request.url.indexOf('user/get-captcha') != -1){
			_alert = false;
			var captcha = JSON.parse(de(res));
			var data = {
			    message:{
			        type: "get-url",
			        content: {
					    url: config.url_server_lokal,
					    type: 'post',
					    data: { 
							action: 'set_captcha',
							captcha: captcha.data.img,
							key: captcha.data.key,
							api_key: config.api_key
						},
		    			return: true
					}
			    }
			};
			chrome.runtime.sendMessage(data, function(response) {
			    console.log('responeMessage', response);
			});
		}else if(request.url.indexOf('user/login') != -1){
			_alert = false;
			var data = {
			    message:{
			        type: "get-url",
			        content: {
					    url: config.url_server_lokal,
					    type: 'post',
					    data: { 
							action: 'send_message',
							action_pusher: 'get_otp',
							api_key: config.api_key
						},
		    			return: true
					}
			    }
			};
			chrome.runtime.sendMessage(data, function(response) {
			    console.log('responeMessage', response);
			});
			pesan_loading('GET OTP!', true);
		}else if(request.url.indexOf('user/matchingotp') != -1){
			_alert = false;
			var token = JSON.parse(de(res));
			if(token.data.token){
				_token = 'Bearer '+token.data.token;
				send_token_lokal(true);
			}
		}else if(res.action == 'singkronisasi_dtks'){
			_alert = false;
			cek_hide_loading = false;
			continue_dtks(continue_dtks_next_data);
		}
		if(cek_hide_loading){
			hide_loading();
		}
		if(_alert){
			alert(res.message);
		}
	}
	return sendResponse("THANKS from content_script!");
});