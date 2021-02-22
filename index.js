const FtpClient   = require('ftp');
const fs          = require('fs');
const request     = require('request');
const https       = require('https');
const convert     = require('xml-js');
const c           = new FtpClient();
const {Mail}      = require('./middlewares/mail.js');
const configGlobal = require('./config/global.json');
const configFtp   = require('./config/ftp.json');

// Connexion au FTP.

c.connect(configFtp[configGlobal.environment]);

// Mail

var mail = new Mail("kitville@jcdecaux.com", "proserratomas@gmail.com");

// Obtenir la liste des villes

async function getVilles()
{
    return new Promise((resolve, reject) => {
        c.get(configFtp.path[configGlobal.environment] + 'villes.json', function(err, stream) {
            var content = '';

            stream.on('data', function(chunk) {
                content += chunk.toString();
            });

            stream.on('end', function() {
                if(content.length == 0) return resolve(false);

                resolve(content);
            });
        });
    });
}

// Routeur

async function datas(ville, type)
{
    if(type == 'HDF')
    {
        if(ville == 'Lille')
        {
            var data  = await getDatas(ville);
        }
    }
    if (type == 'GE')
    {

        if(ville == 'Thionville')
        {
            var data = await getDatasThionville(ville);
        }
    }

    if(type == 'NA')
    {
        if(ville == 'La Rochelle')
        {
            var data  = await getDatasRochelle(ville);
        }
    }

    if(type == 'ARA')
    {
        if(ville == 'Grenoble')
        {
            var data  = await getDatasGrenoble(ville);
        }
    }

    if(data !== false) {
        // Création du dossier.

        await createFolder(ville);

        // Ajout du XML dans le nouveau dossier.

        var addtoFolder = await addToFolder(ville, data);

        if(addToFolder)
            console.log('Le fichier à été ajouté.');
        else
            console.log('Une erreur est survenue.');
    }
}

// Obtenir le XML de la météo.

async function getDatas(villes)
{
    return new Promise((resolve, reject) => {
        request({
                url: "https://services8.arcgis.com/rxZzohbySMKHTNcy/arcgis/rest/services/ind_hdf_agglo/FeatureServer/0/query?where=lib_zone%20%3D%20'" + villes + "'&outFields=*&returnGeometry=false&orderByFields=date_ech DESC&outSR=4326&f=json",
                method: 'GET',
                //proxy: 'http://proxyrelay.jcd.priv:8000'
            }, function(error, response, body) {
            if(error) {
                resolve(false);

                mail.sendMail(villes + " : Erreur lors du call API", "Une erreur est survenue lors du call API.");
            } else {
                var json = JSON.parse(body);

                if(json.code === 401) {
                    mail.sendMail(villes + " : Erreur lors du call API", "IP non autorisée.");
                }

                resolve(body);
            }
        });
    });
}

// Obtenir le XML

function getDatasRochelle(villes)
{
    return new Promise((resolve, reject) => {
        request({
                url: 'https://opendata.atmo-na.org/feedxml/indice/17300/',
                method: 'GET',
                //proxy: 'http://proxyrelay.jcd.priv:8000'
            }, function(error, response, body) {
            if(error) {
                resolve(false);

                mail.sendMail(villes + " : Erreur lors du call API", "Une erreur est survenue lors du call API.");
            } else {
                var json = convert.xml2json(body, {compact: true, spaces: 4});

                if(json.code === 401) {
                    mail.sendMail(villes + " : Erreur lors du call API", "IP non autorisée.");
                }

                resolve(json);
            }
        });
    });
}

// Obtenir informations

function getDatasGrenoble(villes)
{
    return new Promise((resolve, reject) => {
        request({
                url: "https://api.atmo-aura.fr/communes/38185/indices?api_token=2a0264e054905a3c9f9f46248be1e1c6",
                method: 'GET',
                //proxy: 'http://proxyrelay.jcd.priv:8000'
            }, function(error, response, body) {
            if(error) {
                resolve(false);

                mail.sendMail(villes + " : Erreur lors du call API", "Une erreur est survenue lors du call API.");
            } else {
                var json = JSON.parse(body);

                if(json.error) {
                    if(json.error.code === 400) {
                        mail.sendMail(villes + " : Lien non valide. ", "L'url ne fonctionne pas.");
                    }

                }


                resolve(body);
            }
        });
    });
}

// Data Thionville

function getDatasThionville(villes)
{
	return new Promise((resolve, reject) => {
        request({
                url: "https://services.atmo-grandest.eu/widget/feedxml/57672",
                method: 'GET',
                //proxy: 'http://proxyrelay.jcd.priv:8000'
            }, function(error, response, body) {
            if(error) {
                resolve(false);

                mail.sendMail(villes + " : Erreur lors du call API", "Une erreur est survenue lors du call API.");
            } else {
                var json = convert.xml2json(body, {compact: true, spaces: 4});

                if(json.error) {
                    if(json.error.code === 400) {
                        mail.sendMail(villes + " : Erreur lors du call API", "Une erreur est survenue lors du call API.");
                    }
                }

                resolve(json);
            }
        });
    });
}

// Création du dossier

async function createFolder(folder)
{
    c.mkdir(configFtp.path[configGlobal.environment] + folder, function(err, resp) {
        if(err) return console.log('Le dossier ' + folder + ' dossier existe déjà.');
        if(resp) return console.log('Le dossier ' + folder + ' à été crée.');
    });
}

// Ajout du XML dans le dossier.

async function addToFolder(folder, data)
{
    // Objet date

    var date   = new Date();

    // Mise en variable de jour/mois/année

    var day    = date.getDate();
    var month  = (date.getMonth() + 1);
    var year   = date.getFullYear();

    // Si élement en dessous de 10 on rajoute un 0 (format)

    if(day < 10) day = '0' + day;
    if(month < 10) month = '0' + month;

    // On ajoute le fichier dans le dossier lui correspondant.

    c.put(data, configFtp.path[configGlobal.environment] + folder + '/air-' + day + month + year + '.json', function(err, resp) {
        if(err) return false;
        if(resp) return true;
    });
}

c.on('ready', async() => {

    var villes = await getVilles();

    if(!villes) return console.log('error while loading cities');

    var json = JSON.parse(villes);

    for (let i = 0; i < json.villes.length; i++)
    {
        // Variables

        var string = json.villes[i];
        var ville  = string.split(' - ')[0];
        var region = string.split(' - ')[1];

        await datas(ville, region);
    }

    c.end();
});
