import { IUser } from './Device'
import * as admin from 'firebase-admin'

export interface IUsingRecord {
    EIMI: string
    bipName: string
    beginDate: FirebaseFirestore.Timestamp
    endDate: FirebaseFirestore.Timestamp
    duree: string
    time: number
    user: IUser | null
    useArea: string | null
}



export default {
     addRecord (usingRecord: IUsingRecord) {
        usingRecord.time = usingRecord.endDate.seconds - usingRecord.beginDate.seconds
        usingRecord.duree = getDureeInString(usingRecord.time)
        console.log('usingRecord: ',usingRecord)

        return admin.firestore().collection('Utilisations').add(usingRecord).then(()=>console.log(`Enregistrement d'une nouvelle utilisation réussi`))

    }
}



const getDureeInString =  (timeInSecond: number): string => {
    const s = timeInSecond % 60
    const seconds = s < 10 ? "0" + s : s
    const m = ((timeInSecond - s) % 3600) / 60
    const minutes = m < 10 ? "0" + m : m
    const h = (timeInSecond - m * 60 - s) % (3600 * 24) / 3600
    const heures = h < 10 ? "0" + h : h
    const j = (timeInSecond - h * 3600 - m * 60 - s) / (3600 * 24)
    if (j === 0) {
        return `${heures}:${minutes}:${seconds}`
    } else {
        return `${j} jour(s) et ${heures}:${minutes}:${seconds}`
    }
}
