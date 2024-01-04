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
	_authReducer = false;
	for(var i in localStorage){ 
	    var item = localStorage.getItem(i);
	    if(item){
	        item = JSON.parse(item);
	        if(item.authReducer){
		        item = JSON.parse(item.authReducer);
		        // _token = 'Bearer '+item.token;
		        _token = item.token;
		        _authReducer = item;
	        }
	    }
	}
	console.log('_token _authReducer', _token, _authReducer);
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

function backup_data_dtks_all(){
	var selected = [];
	jQuery('#konfirmasi-desa tbody tr input[type="checkbox"]').map(function(i, b){
		var checkbox = jQuery(b);
		if(checkbox.is(':checked')){
			var id_kec = checkbox.attr('id_kec');
			if(
				id_kec != '' 
				&& typeof id_kec != 'undefined'
			){
				var tr = checkbox.closest('tr');
				selected.push({
					kecamatan: tr.find('td').eq(1).text(),
					desa_kelurahan: tr.find('td').eq(2).text(),
					id_kec: id_kec,
					id_desa: checkbox.val()
				});
			};
		}
	});
	if(selected.length == 0){
		alert("Pilih desa dulu!");
	}else{
		console.log('selected', selected);
		var last = selected.length-1;
		selected.reduce(function(sequence, nextData){
            return sequence.then(function(current_data){
                return new Promise(function(resolve_reduce, reject_reduce){
                	pesan_loading('Get data DTKS '+JSON.stringify(current_data));
                	backup_data_dtks(0, 300, current_data)
                	.then(function(){
                		resolve_reduce(nextData);
                	});
                })
                .catch(function(e){
                    console.log(e);
                    return Promise.resolve(nextData);
                });
            })
            .catch(function(e){
                console.log(e);
                return Promise.resolve(nextData);
            });
        }, Promise.resolve(selected[last]))
        .then(function(){
            jQuery('#wrap-loading').hide();
            alert('Success backup data DTKS!');
        })
        .catch(function(e){
            console.log(e);
            jQuery('#wrap-loading').hide();
            alert('Error!');
        });
	}
}

function backup_data_dtks(page=0, per_page=300, options){
	return new Promise(function(resolve, reduce){
		jQuery('#wrap-loading').show();
	    var param_encrypt = false;
	    if(options.prop_capil){
	    	var data = {
			    "no_prop": options.prop_capil,
			    "no_kab": options.kab_capil,
			    "no_kec": options.kec_capil,
			    "no_kel": options.kel_capil,
			    "is_disabilitas": "",
			    "filter_meninggal": "0",
			    "filter_gis": "",
			    "page": page,
			    "per_page": per_page,
			    "nokk": "",
			    "nik": "",
			    "psnoka": "",
			    "nama": "",
			    "umur_start": "NaN",
			    "umur_end": "NaN"
			}
	    }else{
		    var data = {
		        "no_prop" : _authReducer.profile.prop_capil,
		        "no_kab" : _authReducer.profile.kab_capil,
		        "no_kec" : options.id_kec.replace(_authReducer.profile.kab_tugas, ''),
		        "no_kel" : options.id_desa.replace(options.id_kec, ''),
		        "is_disabilitas" : "",
		        "filter_meninggal" : "0",
		        "filter_gis" : "",
		        "page" : page,
		        "per_page" : per_page,
		        "nokk" : "",
		        "nik" : "",
		        "psnoka" : "",
		        "nama" : ""
		    };
	    }
	    param_encrypt = en(JSON.stringify(data));

	    new Promise(function(resolve2, reject2){
	    	if(page == 0){
	    		relayAjax({
					url: config.api_siks_url+'viewbnba/bnba-list-count',
					type: 'post',
					data: {
						data: param_encrypt
					},
					beforeSend: function (xhr) {
					    xhr.setRequestHeader("Authorization", _token);
					},
					success: function(ret){
						ret = JSON.parse(de(ret));
						options.total = ret.data.total;
	    				resolve2();
					}
				});
	    	}else{
	    		resolve2();
	    	}
	    }).then(function(){
		    relayAjax({
				url: config.api_siks_url+'viewbnba/bnba-list',
				type: 'post',
				data: {
					data: param_encrypt
				},
				beforeSend: function (xhr) {
				    xhr.setRequestHeader("Authorization", _token);
				},
				success: function(ret){
					// console.log('ret success', ret, de(ret));
					ret = JSON.parse(de(ret));
					var data_all = [];
			        var data_sementara = [];
			        var max = per_page;
			        ret.data.data.map(function(b, i){
			            data_sementara.push(b);
			            if(data_sementara.length%max == 0){
			                data_all.push(data_sementara);
			                data_sementara = [];
			            }
			        });
			        if(data_sementara.length > 0){
			            data_all.push(data_sementara);
			        }
			        var last = data_all.length - 1;
			        data_all.reduce(function(sequence, nextData){
			            return sequence.then(function(current_data){
			                return new Promise(function(resolve_reduce, reject_reduce){
			                	var current_data2 = {
			                		meta: options,
			                		page: page,
			                		data: current_data
			                	};
			                	pesan_loading('kirim data ke lokal '+JSON.stringify(options)+'. Halaman = '+page);
								var data = {
								    message:{
								        type: "get-url",
								        content: {
										    url: config.url_server_lokal,
										    type: 'post',
										    data: { 
												action: 'singkronisasi_dtks',
												api_key: config.api_key,
												data: current_data2
											},
							    			return: true
										}
								    }
								};
								chrome.runtime.sendMessage(data, function(response) {
								    console.log('responeMessage', response);
								});
								
								window.continue_dtks = resolve_reduce;
								window.continue_dtks_next_data = nextData;
			                })
			                .catch(function(e){
			                    console.log(e);
			                    return Promise.resolve(nextData);
			                });
			            })
			            .catch(function(e){
			                console.log(e);
			                return Promise.resolve(nextData);
			            });
			        }, Promise.resolve(data_all[last]))
			        .then(function(data_last){
						var page_before = per_page*page;
						if(options.total > ret.data.data.length+page_before){
							backup_data_dtks(page+1, per_page, options)
							.then(function(){
								resolve();
							});
						}else{
							resolve();
						}
			        })
			        .catch(function(e){
			            console.log(e);
			            resolve();
			        });
				}
			});
	    })
	});
}