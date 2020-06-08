
import {IAlarme, IInCharge, IDevice} from './Device'

export interface ITrame{
    GPSChipFailed:boolean
    GPSfixed: boolean
    GSMLocating: boolean
    alarme: string []
    alt: number
    availableSatellite: number
    date: FirebaseFirestore.Timestamp
    dir: string
    fixedSatellite: number
    inCharge: boolean
    levelBattery: number
    position: FirebaseFirestore.GeoPoint
    speed: number
    turnOn: boolean
}

export default class Trame {

    private _trame: ITrame
    private _refDevice: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData & IDevice>

    constructor(snap:FirebaseFirestore.DocumentSnapshot){
        this._trame = <FirebaseFirestore.DocumentData & ITrame>snap.data()
        this._refDevice = <FirebaseFirestore.DocumentReference <FirebaseFirestore.DocumentData & IDevice>>(snap.ref.parent.parent)
    }

    get inCharge():IInCharge{
        return {
            status: this._trame.inCharge,
            date: this._trame.date 
        }
    }

    get levelBattery(){
        return this._trame.levelBattery
    }

    get alarme():IAlarme | undefined{
        if(this._trame.alarme.length>0){
            return {type: this._trame.alarme[0], date: this._trame.date}
        }else{
            return
        }
    }

    get refDevice(){
        return this._refDevice
    }
}