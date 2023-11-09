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

if(config.pusher_id){
	var pusher = new Pusher(config.pusher_id, {
	  cluster: config.cluster
	});
	var channel = pusher.subscribe('my-channel');
	channel.bind('my-event', function(data) {
	  	console.log('from pusher!', JSON.stringify(data));
		if(data.action == 'require_login'){
			if(config.otp){
				sendOtp(config.otp);
			}else{
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
		}else if(data.action == 'login_captcha'){
			var data_post = en(JSON.stringify({
		    	email: config.user,
		    	password: config.password,
		    	captcha: data.captcha,
		    	key: data.key
		    }));
			var data = {
			    message:{
			        type: "get-url",
			        content: {
					    url: config.api_siks_url+'user/login',
					    type: 'post',
					    data: { data: data_post },
		    			return: true
					}
			    }
			};

			chrome.runtime.sendMessage(data, function(response) {
			    console.log('responeMessage', response);
			});
		}else if(data.action == 'send_otp'){
			console.log(data);
			pesan_loading('SUKSES GET OTP = '+data.otp, true);
			sendOtp(data.otp);
		}
	});
}

var modal_desa = ''
  	+'<table id="konfirmasi-desa" style="display: none; width: 100%;">'
      	+'<thead>'
        	+'<tr style="background: #8997bd;">'
          		+'<th class="text-white"><input type="checkbox" id="modal_cek_all"></th>'
          		+'<th class="text-white" width="300">Kecamatan</th>'
          		+'<th class="text-white">Desa</th>'
        	+'</tr>'
      	+'</thead>'
      	+'<tbody></tbody>'
  	+'</table>';
jQuery('.MuiBox-root.css-1hx2chv').prepend(modal_desa);

var current_url = window.location.href;
jQuery('.css-nb2z2f>.MuiTypography-root').after('<button id="update-lokal" style="padding: 7px 10px;">UPDATE TOKEN APLIKASI LOKAL</button><button id="modal-dtks" style="padding: 7px 10px; margin-left: 20px;">Backup DTKS ke DB Lokal</button>');
jQuery('#update-lokal').on('click', function(e){
	e.preventDefault();
	send_token_lokal();
});
jQuery('#modal-dtks').on('click', function(e){
	e.preventDefault();
	jQuery('#wrap-loading').show();
	if(_authReducer.profile.kode_kab){
	    var data = {
	    	"level":"3",
	    	"id_wilayah":_authReducer.profile.kode_kab
	    };
	    var param_encrypt = en(JSON.stringify(data));
		relayAjax({
			url: config.api_siks_url+'wilayah/getwilayah',
			type: 'post',
			data: {
				data: param_encrypt
			},
			beforeSend: function (xhr) {
			    xhr.setRequestHeader("Authorization", _token);
			},
			success: function(ret){
				ret = JSON.parse(de(ret));
				var resolve_all = ret.data.map(function(b, i){
					return new Promise(function(resolve, reject){
					    var data = {
					    	"level":"4",
					    	"id_wilayah":b.id_wilayah
					    };
					    var param_encrypt = en(JSON.stringify(data));
						relayAjax({
							url: config.api_siks_url+'wilayah/getwilayah',
							type: 'post',
							data: {
								data: param_encrypt
							},
							beforeSend: function (xhr) {
							    xhr.setRequestHeader("Authorization", _token);
							},
							success: function(ret2){
								ret2 = JSON.parse(de(ret2));
								resolve({
									kec: b,
									desa: ret2.data
								});
							}
						});
					});
				});
				Promise.all(resolve_all)
				.then(function(data){
					window.data_wilayah = data;
					var body = '';
					data.map(function(b, i){
						body += ''
							+'<tr style="background: #ebbcbc;">'
								+'<td style="text-align: center;"><input class="data-kecamatan" type="checkbox" value="'+b.kec.id_wilayah+'"></td>'
								+'<td colspan="2">'+b.kec.nama_wilayah+'</td>'
							+'</tr>';
						b.desa.map(function(bb, ii){
							body += ''
								+'<tr>'
									+'<td style="text-align: center;"><input type="checkbox" id_kec="'+b.kec.id_wilayah+'" value="'+bb.id_wilayah+'"></td>'
									+'<td>'+b.kec.nama_wilayah+'</td>'
									+'<td>'+bb.nama_wilayah+'</td>'
								+'</tr>';
						});
					});
					body += ''
						+'<tr>'
							+'<td style="text-align: center;" colspan="3"><button id="backup-dtks" style="padding: 7px 10px; background: #f99459;">Proses</button></td>'
						+'</tr>';
					jQuery('#konfirmasi-desa > tbody').html(body);
					jQuery('#konfirmasi-desa').show();
					jQuery('#wrap-loading').hide();
				});
			}
		});
	}else{
		// user petugas kelurahan langsung get data sesuai kelurahannya
		var opsi = {
			provinsi: _authReducer.profile.nama_provinsi,
			kabupaten: _authReducer.profile.nama_kabupaten,
			kecamatan: _authReducer.profile.nama_kecamatan,
			desa_kelurahan: _authReducer.profile.nama_desa,
			id_kec: _authReducer.profile.kec_capil,
			id_desa: _authReducer.profile.kel_capil,
			prop_capil: _authReducer.profile.prop_capil,
			kab_capil: _authReducer.profile.kab_capil,
			kec_capil: _authReducer.profile.kec_capil,
			kel_capil: _authReducer.profile.kel_capil
		};
		pesan_loading('Get data DTKS '+JSON.stringify(opsi));
		backup_data_dtks(0, 300, opsi).then(function(){
			jQuery('#wrap-loading').hide();
            alert('Success backup data DTKS!');
		});
	}
});
jQuery('#modal_cek_all').on('click', function(){
	var cek = jQuery(this).is(':checked');
	jQuery('#konfirmasi-desa tbody tr input[type="checkbox"]').prop('checked', cek);
});
jQuery('#konfirmasi-desa').on('click', '.data-kecamatan', function(){
	var cek = jQuery(this).is(':checked');
	var id_kec = jQuery(this).val();
	jQuery('#konfirmasi-desa tbody tr input[type="checkbox"][id_kec="'+id_kec+'"]').prop('checked', cek);
});
jQuery('#konfirmasi-desa').on('click', '#backup-dtks', function(e){
	e.preventDefault();
	backup_data_dtks_all();
});