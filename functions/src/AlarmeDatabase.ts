import {  IUser } from './Device'
import { ITrame } from './Trame'
import * as admin from 'firebase-admin'

//utiliser batch en creant id puis une collection trame

export interface IAlarmRecord {
    EIMI: string
    alarme: string
    bipName: string
    date: FirebaseFirestore.Timestamp
    useArea: string | undefined
    user: IUser | undefined
}

export default {
    async addRecord(newRecord:IAlarmRecord){ 
        const lastTenTrames =  await getLastTenTrames(newRecord.EIMI)
        const batch = admin.firestore().batch()
        
        const newALarmeRecord = admin.firestore().collection('Alarms').doc()
        batch.set(newALarmeRecord,newRecord)
        lastTenTrames.forEach(trame => {
            const newTrameDoc = newALarmeRecord.collection('tenLastTrames').doc()
            batch.set(newTrameDoc,trame )
        })
        return batch.commit().then(()=>console.log(`Enregistrement d'une nouvelle alarme réussi`))
    }
}

const getLastTenTrames= async (EIMI:string)=>{
    try {
        const querySnap = <FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData & ITrame>>await admin.firestore().collection(`Devices/${EIMI}/trame`).orderBy('date', 'desc').limit(10).get()
        const arraySnap = querySnap.docs
        return arraySnap.map(snapShot => snapShot.data())
    } catch (error) {
        console.log(`erreur lors de la récuération des 10 dernières trames`)
        throw error
    }
}