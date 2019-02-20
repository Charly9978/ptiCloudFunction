const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();

exports.alarmFunction = functions.firestore.document('Devices/{deviceId}/trame/{trameId}').onCreate((snap, context) => {

    const promises = [];


    const trames = snap.ref.parent
    const device = snap.ref.parent.parent
    const devices = device.parent
    const EIMI = device.id;

    const data = snap.data();
    const alarme = data.alarme;
    const inCharge = data.inCharge;
    const date = data.date;
    const levelBattery = data.levelBattery;

    const lastConnectionDate = new Date();

    const utilisationsColl = snap.ref.firestore.collection('Utilisations');
    const alarmColl = snap.ref.firestore.collection('Alarms');

    // on vérifie si une alarme est présente et on enregistre si c'est le cas dans la base 'alarme' et modifie le status 'alarme' et 'lastalarme' du device
    //l'alarme n'est pas pris en compte si no motion alors le bip est en cours de charge
    if (alarme.length > 0 && !(alarme[0] === "motion" && inCharge)) {

        const alarmRecord = {
            date,
            EIMI,
            alarme
        };

        const promiseAlarme = alarmColl.add(alarmRecord);
        promises.push(promiseAlarme);
    }

    // on récupère les informations enregistrées dans le device

    device.get().then((doc) => {
        let message='';
        const dateLastAlarme = doc.data().lastAlarme.date;
        const dateInChargeStatus = doc.data().inCharge.date;
        const inChargeStatus = doc.data().inCharge.status;

        // on met à jour le niveau de batterie du device
        const levelBatteryPromise = device.update({
            "levelBattery":levelBattery,
            "lastConnectionDate":lastConnectionDate,
            "lostConnection":false
        })
        promises.push(levelBatteryPromise);
        message += 'nouvel enregistrement du niveau de batterie et de la dernière connection';

        //on enregistre la nouvelle alarme si celle-ci existe et si sa date est supérieure à la dernier date d'alarme enregistrée
        //l'alarme n'est pas pris en compte si no motion alors le bip est en cours de charge
        if (dateLastAlarme < date && (alarme.length > 0 && !(alarme[0] === "motion" && inCharge))) {
            const promiseNewStatusAlarme = device.update({
                "alarme.date": date,
                "alarme.type": alarme[0],
                "lastAlarme.date": date,
                "lastAlarme.type": alarme[0]
            });
            promises.push(promiseNewStatusAlarme);
            message += ` nouvel enregistrement status alarme`;
        }

        //on enregistre le nouvel status de la charge si celui-ci est différent du dernier enregistrement dans device

        if (dateInChargeStatus < date && inChargeStatus !== inCharge) {
            const promiseNewInChargeStatus = device.update({
                "inCharge.date": date,
                "inCharge.status": inCharge
            });
            promises.push(promiseNewInChargeStatus);
            // et enregsitre également dans la database "utilisation"
            const promiseNewInCharge = utilisationsColl.add({
                date,EIMI,inCharge
            });
            promises.push(promiseNewInCharge);
            message += ` nouvel enregistrement status inCharge`;
        }
        return message
    }).then(mess => console.log(mess)).catch(err => console.log(err));


    // on vérifie le nombre d'enregsitrement dans la trame et on limite sa quantité à 100 en virant les plus anciens
    trames.orderBy('date','asc').get().then((querySnap)=>{
        const size = querySnap.size;
        let messDelete =""
        if(size>100){
            const nbr = size-30;
            snapArray = querySnap.docs;
            for(let i=0;i<nbr;i++){
                let promiseDelete = snapArray[i].ref.delete();
                promises.push(promiseDelete);
            }
            messDelete +=` ${nbr} enregistrement(s) effacé(s)`

        }
        return messDelete
    }).then(mess => console.log(mess)).catch(err => console.log(err));

    return Promise.all(promises)


})


