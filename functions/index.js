const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();

exports.alarmFunction = functions.firestore.document('Devices/{deviceId}/trame/{trameId}').onCreate((snap, context) => {

    const promises = [];


    const trames = snap.ref.parent
    const device = snap.ref.parent.parent
    const EIMI = device.id;

    const data = snap.data();
    const alarme = data.alarme;
    const inCharge = data.inCharge;
    const date = data.date;

    const utilisationsColl = snap.ref.firestore.collection('Utilisations');
    const alarmColl = snap.ref.firestore.collection('Alarms');

    // on vérifie si une alarme est présente et on enregistre si c'est le cas dans la base 'alarme' et modifie le status 'alarme' et 'lastalarme' du device

    if (alarme.length > 0) {

        const alarmRecord = {
            date,
            EIMI,
            alarme
        };

        const promiseAlarme = alarmColl.add(alarmRecord);
        promises.push(promiseAlarme);
    }

    device.get().then((doc) => {
        let message='';
        const dateLastAlarme = doc.data().lastAlarme.date;
        const dateInChargeStatus = doc.data().inCharge.date;
        const inChargeStatus = doc.data().inCharge.status
        if (dateLastAlarme.toDate() < date.toDate() && alarme.length > 0) {
            const promiseNewStatusAlarme = device.update({
                "alarme.date": date,
                "alarme.type": alarme[0],
                "lastAlarme.date": date,
                "lastAlarme.type": alarme[0]
            });
            promises.push(promiseNewStatusAlarme);
            message += ` nouvel enregistrement status alarme`;
        }
        if (dateInChargeStatus.toDate() < date.toDate() && inChargeStatus !== inCharge) {
            const promiseNewInChargeStatus = device.update({
                "inCharge.date": date,
                "inCharge.status": inCharge
            });
            promises.push(promiseNewInChargeStatus);
            const promiseNewInCharge = utilisationsColl.add({
                date,EIMI,inCharge
            });
            promises.push(promiseNewInCharge);
            message += ` nouvel enregistrement status inCharge`;
        }
        return message
    }).then(mess => console.log(mess)).catch(err => console.log(err));

    trames.orderBy('date','asc').get().then((querySnap)=>{
        const size = querySnap.size;
        if(size>100){
            const nbr = size-30;
            snapArray = querySnap.docs;
            for(let i=0;i<nbr;i++){
                let promiseDelete = snapArray[i].ref.delete();
                promises.push(promiseDelete);
            }
            message +=` ${nbr} enregistrement(s) effacé(s)`

        }
        return message
    }).then(mess => console.log(mess)).catch(err => console.log(err));

    return Promise.all(promises)


})


