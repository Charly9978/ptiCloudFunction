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
    
    // on récupère les informations enregistrées dans le device
    
    device.get().then((doc) => {
        let message='';
        const dateLastAlarme = doc.data().lastAlarme.date;
        console.log(dateLastAlarme);
        const dateInChargeStatus = doc.data().inCharge.date;
        console.log(dateInChargeStatus);
        const inChargeStatus = doc.data().inCharge.status;
        const bipName= doc.data().name;
        const useArea = doc.data().useArea;
        const user = doc.data().user
        
        // on met à jour le niveau de batterie du device
        const levelBatteryPromise = device.update({
            "levelBattery":levelBattery,
            "lastConnectionDate":lastConnectionDate,
            "lostConnection":false
        })
        promises.push(levelBatteryPromise);
        message += 'nouvel enregistrement du niveau de batterie et de la dernière connection';
        
        //on enregistre la nouvelle alarme dans la base d'historique des alarmes si celle-ci existe. Si sa date est supérieure à la dernier date d'alarme enregistrée, on l'enregistre également dans le status du device
        //l'alarme n'est pas pris en compte si no motion alors le bip est en cours de charge
        if (alarme.length > 0 && !(alarme[0] === "motion" && inCharge)) {
            
            const alarmRecord = {
                date,
                EIMI,
                bipName,
                alarme,
                user,
                useArea            };
        
            const promiseAlarme = alarmColl.add(alarmRecord);
            promises.push(promiseAlarme);
            message += ` nouvel enregistrement dans historique alarme`;

            if(dateLastAlarme < date){
                const promiseNewStatusAlarme = device.update({
                    "alarme.date": date,
                    "alarme.type": alarme[0],
                    "lastAlarme.date": date,
                    "lastAlarme.type": alarme[0]
                });
                promises.push(promiseNewStatusAlarme);
                message += ` nouvel enregistrement status alarme`;
            }
        }

        //on enregistre le nouvel status de la charge si celui-ci est différent du dernier enregistrement dans device

        if (dateInChargeStatus < date && inChargeStatus !== inCharge) {
            const promiseNewInChargeStatus = device.update({
                "inCharge.date": date,
                "inCharge.status": inCharge
            });
            promises.push(promiseNewInChargeStatus);
            
            // et enregsitre également dans la database "utilisation" la durée d'utilisation si l'appareil retour en charge

            if(inCharge === true){
                const time= date-dateInChargeStatus;
                const duree = getDuree(time);

                const promiseNewInCharge = utilisationsColl.add({
                    date:dateInChargeStatus,EIMI,bipName,time,duree
                });
                promises.push(promiseNewInCharge);

            }
            message += ` nouvel enregistrement status inCharge`;
        }
        return message
    }).then(mess => console.log(mess)).catch(err => console.log(err));


    // on vérifie le nombre d'enregsitrement dans la trame et on limite sa quantité à 100 en virant les plus anciens
    trames.orderBy('date','asc').get().then((querySnap)=>{
        const size = querySnap.size;
        let messDelete =""
        if(size>100){
            const nbr = size-100;
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
    
    
    function getDuree(t){
        t=t/1000
        const s = t%60
        const seconds = s<10?"0"+s:s 
        const m = ((t-s)%3600)/60
        const minutes = m<10?"0"+m:m
        const h = (t-m*60-s)%(3600*24)/3600
        const heures = h<10?"0"+h:h
        const j = (t-h*3600-m*60-s)/(3600*24)
        if(j===0){
        return `${heures}:${minutes}:${seconds}`
        }else{
            return `${j} jour(s) et ${heures}:${minutes}:${seconds}`
        }
    }
    


})