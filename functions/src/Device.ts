
export interface IAlarme {
    date: FirebaseFirestore.Timestamp
    type: string
}

export interface IInCharge {
    date: FirebaseFirestore.Timestamp
    status: boolean
}

export interface IUser {
    company: string | null
    date: FirebaseFirestore.Timestamp | null
    name: string | null
    tel: string | null
    useArea: string | null
}

export interface IDevice {
    alarme?: IAlarme
    inCharge?: IInCharge
    lastAlarme?: IAlarme
    lastConnectionDate?: FirebaseFirestore.Timestamp
    levelBattery?: number
    lostConnection?: boolean
    name: string
    telBip: string
    useArea?: string
    user?: IUser
}

export interface INewDatas {
    alarme?: IAlarme | undefined,
    levelBattery: number,
    lastConnectionDate: FirebaseFirestore.Timestamp
    inCharge: IInCharge
    lastAlarme?: IAlarme
}


export default class Device {

    private _refDevice: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData & IDevice>
    private _device: IDevice
    private _isValidAlarm: boolean = false
    private _isANewUsing: boolean = false
    private _id: string


    constructor(refDevice: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData & IDevice>) {
        this._refDevice = refDevice
        this._id = refDevice.id
        this._device = {
            name: '',
            telBip: ''
        }
    }

    get isValidAlarm() {
        return this._isValidAlarm
    }


    get isANewUsing() {
        return this._isANewUsing
    }


    get id() {
        return this._id
    }


    get name() {
        return this._device.name
    }


    get user() {
        return this._device.user
    }


    get useArea() {
        return this._device.useArea
    }

    get inCharge() {
        return this._device.inCharge
    }

    get alarme() {
        return this._device.alarme
    }

    async fetchDeviceDatas(){
        try {
            const snapShotDevice = await this._refDevice.get()
            const deviceData = <FirebaseFirestore.DocumentData & IDevice>snapShotDevice.data()
            this._device.name = deviceData.name
            this._device.useArea = deviceData.useArea
            this._device.user = deviceData.user
            this._device.lastAlarme = deviceData.lastAlarme
            this._device.inCharge = deviceData.inCharge 
            
        } catch (error) {
            console.log('problème lors de la récupération des datas du device', error)
        }
    }

    updateDevice(newDatas: INewDatas) {
        let message = ''

        if (newDatas.alarme !== undefined && (this._device.lastAlarme === undefined || newDatas.alarme.date.seconds > this._device.lastAlarme.date.seconds)) {
            this._isValidAlarm = true
            newDatas.lastAlarme = newDatas.alarme
            message += 'nouvelle alarme valide'
        } else {
            delete newDatas.alarme
            message += 'sans alarme valide'
        }

        if (this._device.inCharge !== undefined) {
            if(newDatas.inCharge.date.seconds < this._device.inCharge.date.seconds || newDatas.inCharge.status === this._device.inCharge.status ){
                delete newDatas.inCharge
                message += ', status de charge inchangé'
            }
            else if (newDatas.inCharge.status === true) {
                this._isANewUsing = true
                message +=" , nouveau status inCharge avec enregistrement d'utilisation"  
            }else{
                message +=' , nouveau status inCharge'
            }
        }

        return this._refDevice.update(newDatas).then(()=>console.log(`Mise à jour du device ${this._device.name} avec ${message}`))
    }


    async limitNbrOfTrames(maxNumberOfTrames: number) {
            const querySnapshot = await this._refDevice.collection('trame').orderBy('date', 'desc').get()
            const nbrOfTrames = querySnapshot.size
            if (nbrOfTrames > maxNumberOfTrames) {
                const trameToDelete: Promise<FirebaseFirestore.WriteResult>[] = []
                querySnapshot.docs
                    .filter((snapShot, index) => index > maxNumberOfTrames - 1)
                    .forEach((snapShot) => {
                        trameToDelete.push(snapShot.ref.delete())
                    })
                return trameToDelete
            }else{
                return
            }
    }

}