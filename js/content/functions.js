function formatMoney(amount, decimalCount = 2, decimal = ".", thousands = ",") {
  try {
    decimalCount = Math.abs(decimalCount);
    decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

    const negativeSign = amount < 0 ? "-" : "";

    let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
    let j = (i.length > 3) ? i.length % 3 : 0;

    return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
  } catch (e) {
    console.log(e)
  }
};

function show_loading(){
	jQuery('#wrap-loading').show();
	jQuery('#persen-loading').html('');
	jQuery('#persen-loading').attr('persen', '');
	jQuery('#persen-loading').attr('total', '');
}

function hide_loading(){
	jQuery('#wrap-loading').hide();
	jQuery('#persen-loading').html('');
	jQuery('#persen-loading').attr('persen', '');
	jQuery('#persen-loading').attr('total', '');
}

function pesan_loading(pesan, loading=false){
	if(loading){
		pesan = 'LOADING...<br>'+pesan;
	}
	jQuery('#persen-loading').html(pesan);
	console.log(pesan);
}

function run_script(command, data=false){
	postMessage({
		command: command,
		data: data
	}, '*');
}

function capitalizeFirstLetter(string) {
  	return string.charAt(0).toUpperCase() + string.slice(1);
}

function relayAjax(options, retries=20, delay=5000, timeout=1800000){
	options.timeout = timeout;
	options.cache = false;
	if(options.length){
		var start = options.url.split('start=');
		if(start.length >= 2){
			start = +(start[1].split('&')[0]);
		}else{
			options.url += '&start=0';
			start = 0;
			options.all_data = [];
			options.success2 = options.success;
		}
		var _length = options.url.split('length=');
		if(_length.length <= 1){
			options.url += '&length='+options.length;
		}
		pesan_loading('GET DATATABLE start='+start, true);
		options.success = function(items){
			items.data.map(function(b, i){
				options.all_data.push(b);
			});
			if(options.all_data.length >= items.recordsTotal){
				items.data = options.all_data;
				options.success2(items);
			}else{
				var newstart = options.all_data.length - 1;
				options.url = options.url.replace('&start='+start, '&start='+newstart);
				setTimeout(function(){
	                relayAjax(options);
	            }, 1000);
			}
		};
	}
    jQuery.ajax(options)
    .fail(function(jqXHR, exception){
    	// console.log('jqXHR, exception', jqXHR, exception);
    	if(
    		jqXHR.status != '0' 
    		&& jqXHR.status != '503'
    		&& jqXHR.status != '500'
    	){
    		if(jqXHR.responseJSON){
    			options.success(jqXHR.responseJSON);
    		}else{
    			options.success(jqXHR.responseText);
    		}
    	}else if (retries > 0) {
            console.log('Koneksi error. Coba lagi '+retries, options);
            var new_delay = Math.random() * (delay/1000);
            setTimeout(function(){ 
                relayAjax(options, --retries, delay, timeout);
            }, new_delay * 1000);
        } else {
            alert('Capek. Sudah dicoba berkali-kali error terus. Maaf, berhenti mencoba.');
        }
    });
}

function intervalSession(no){
	if(!_token){
		return;
	}else{
		if(!no){
			no = 0;
		}
		relayAjax({
			url: config.siks_url + '/dashboard',
			success: function(html){
				no++;
				// console.log('Interval session per 60s ke '+no);
				setTimeout(function(){
					intervalSession(no);
				}, 60000);
			}
		});
	}
}

function get_token(){
	_token = false;
	for(var i in localStorage){ 
	    var item = localStorage.getItem(i);
	    if(item){
	        item = JSON.parse(item);
	        if(item.authReducer){
		        item = JSON.parse(item.authReducer);
		        _token = 'Bearer '+item.token;
	        }
	    }
	}
	console.log('_token', _token);
}

function send_token_lokal(hide_alert=false) {
	if(!hide_alert){
		show_loading();
	}
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
	if(hide_alert){
		data.message.content.return = false;
	}
	chrome.runtime.sendMessage(data, function(response) {
	    console.log('responeMessage', response);
	});
}

function en(e){
    var t=CryptoJS.lib.WordArray.random(16),
    r=CryptoJS.enc.Base64.parse(config.key_encrypt),
    u={
        iv:t,
        mode:CryptoJS.mode.CBC,
        padding:CryptoJS.pad.Pkcs7
    },
    a=CryptoJS.AES.encrypt(e,r,u);
    a=a.toString();
    var n={
        iv:t=CryptoJS.enc.Base64.stringify(t),
        value:a,
        mac:CryptoJS.HmacSHA256(t+a,r).toString()
    };
    return n=JSON.stringify(n),
    n=CryptoJS.enc.Utf8.parse(n),
    CryptoJS.enc.Base64.stringify(n);
}

function de(e){
    var t,
    r=null===(t=config.key_encrypt)?void 0:t.toString(),
    u=atob(e),
    a=JSON.parse(u),
    n=CryptoJS.enc.Base64.parse(a.iv),
    c=a.value,
    l=CryptoJS.enc.Base64.parse(r||"");
    return CryptoJS.AES.decrypt(c,l,{iv:n}).toString(CryptoJS.enc.Utf8);
}

function sendOtp(otp){
	var data_post = en(JSON.stringify({
    	username: config.user,
    	otp: otp,
    	type:"sendotp"
    }));
	var data = {
	    message:{
	        type: "get-url",
	        content: {
			    url: config.api_siks_url+'user/matchingotp',
			    type: 'post',
			    data: { data: data_post },
    			return: true
			}
	    }
	};

	chrome.runtime.sendMessage(data, function(response) {
	    console.log('responeMessage', response);
	});
}