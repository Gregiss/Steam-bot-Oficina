var fs = require("fs"),
ReadLine = require("readline"),
SteamCommunity = require("steamcommunity");
const community = new SteamCommunity();
const rl = ReadLine.createInterface({
	"input": process.stdin,
	"output": process.stdout
});

const config = JSON.parse(fs.readFileSync("config.json"));

const colors = {
	general: "\x1b[37m",
	login: "\x1b[36m",
	loggedIn: "\x1b[33m",
	connectedToGC: "\x1b[35m",
	success: "\x1b[32m",
	error: "\x1b[31m"
};

config.accounts = require("./accounts.json");

var account = JSON.parse(fs.readFileSync("./accounts.json"));

var log = console.log;
console.log = function() {  
    var first_parameter = arguments[0];
    var other_parameters = Array.prototype.slice.call(arguments, 1);
    function formatConsoleDate(date) {
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();
        var hour = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        var milliseconds = date.getMilliseconds();
        return "[" + ((day < 10) ? "0" + day : day) +
        "-" + ((month < 10) ? "0" + month : month) +
        "-" + ((year < 10) ? "0" + year : year) +
        " " + ((hour < 10) ? "0" + hour : hour) +
        ":" + ((minutes < 10) ? "0" + minutes : minutes) +
        ":" + ((seconds < 10) ? "0" + seconds : seconds) +
        "." + ("00" + milliseconds).slice(-3) + "] ";
    }
    log.apply(console, [formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
}

var indice = 0;
console.log("Iniciando esse incrivel bot :3...");
console.log(colors.general + "Encontramos " + config.accounts.length + " contas");
if (config.winauth_usage) {
    var SteamAuth = require("steamauth");
    SteamAuth.Sync(function(error) {
        var auth = new SteamAuth(config.winauth_data);
        auth.once("ready", function() {
            config.steam_credentials.authCode = config.steam_credentials.twoFactorCode = auth.calculateCode();
            steamLogin();
        });
    });
} else {
    steamLogin();
}

var qtsContas = config.user_all_accounts;

if(config.user_all_accounts == 0){
	qtsContas = config.accounts.length;
} 
if(qtsContas > config.accounts.length){
		console.log("Voce está usando um numero invalido, mudamos para a quantidade de contas " + config.accounts.length );
		qtsContas = config.accounts.length;
}

console.log("Você está usando " + qtsContas);

var done = 0;
function steamLogin() {
    if(indice <= qtsContas){
    	accountParse = {
	    "steam_credentials": {
	        "accountName": account[indice].accountName,
	        "password": account[indice].password
	    },
	    "winauth_usage": false,
	    "winauth_data": {
	        "deviceid": "IF_USAGE_YOUR_WINAUTH_DEVICE_ID",
	        "shared_secret": "IF_USAGE_YOUR_WINAUTH_SHARED_SECRET",
	        "identity_secret": "IF_USAGE_YOUR_WINAUTH_IDENTITY_SECRET"
	    }
	};
        community.login(accountParse.steam_credentials, function(err, sessionID, cookies) {
		if (err) {
			if (err.message == 'SteamGuardMobile') {
				console.log("This account already has two-factor authentication enabled");
				return;
			}
			if (err.message == 'SteamGuard') {
				console.log("An email has been sent to your address at " + err.emaildomain);
				rl.question("Steam Guard Code: ", function(code) {
                    config.steam_credentials.authCode = code;
                    indice++;
					steamLogin();
				});
				return;
			}
			if (err.message == 'CAPTCHA') {
				console.log(err.captchaurl);
				rl.question("CAPTCHA: ", function(captchaInput) {
					config.steam_credentials.captcha = captchaInput;
                    steamLogin();
				});
				return;
			}
			console.log(err);
			process.exit();
			return;
		}
		console.log("Aguarde um momento :)");
		console.log("Logado com o usuario " + accountParse.steam_credentials.accountName);
        var formdata = {
            id: config.workshopid,
            appid: config.workshop_idgame,
            sessionid: sessionID
        }
        setTimeout(function() {
            community.httpRequestPost("https://steamcommunity.com/sharedfiles/subscribe", {
                formData: formdata,
                followAllRedirects: true
            }, function(error, response, data) {
                if (error) {
                    console.log(error);
                }
                done++;
                console.log("Se inscreveu em " + done + "/" + config.accounts.length);
                if (done >= qtsContas) {
                    console.log("Tudo pronto!")
                } else{
                    steamLogin();
                }
            });
        }, 400);
        indice++;
                
    });
}
}