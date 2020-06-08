import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin'
import AlarmeDatabase, {IAlarmRecord} from './AlarmeDatabase'
import UsingDataBase,{IUsingRecord} from './UsingDataBase'
 

import Trame from './Trame'
import Device, { IAlarme, IInCharge } from './Device'


admin.initializeApp()


exports.onNewTrame = functions.firestore.document('Devices/{deviceId}/trame/{trameId}').onCreate(async (snap,context)=>{
      
      const promises: Promise<any>[] = []

      const trame = new Trame(snap)

      const device = new Device(trame.refDevice)

      await device.fetchDeviceDatas()

      const newDatas = {
            levelBattery: trame.levelBattery,
            lastConnectionDate: admin.firestore.Timestamp.now(),
            alarme: trame.alarme,
            inCharge: trame.inCharge
      } 


      promises.push( device.updateDevice(newDatas))

      if(device.isValidAlarm) {

            const newAlarmRecord: IAlarmRecord ={
                  EIMI: device.id,
                  alarme: (<IAlarme>newDatas.alarme).type,
                  bipName: device.name,
                  date: (<IAlarme>newDatas.alarme).date,
                  useArea: device.useArea,
                  user: device.user
            }
            
            promises.push(AlarmeDatabase.addRecord(newAlarmRecord))
            
      }

      if(device.isANewUsing) {

            const newUsingRecord: IUsingRecord={
                  EIMI: device.id,
                  bipName: device.name,
                  beginDate: (<IInCharge>device.inCharge).date,
                  endDate: newDatas.inCharge.date,
                  duree:'',
                  time: 0,
                  useArea: device.useArea?device.useArea:null,
                  user: device.user?device.user:null
            }

            promises.push(UsingDataBase.addRecord(newUsingRecord))
      }   

      
      const promisesLimitNbrOfTrame = await device.limitNbrOfTrames(60)

      if(promisesLimitNbrOfTrame) promises.concat(promisesLimitNbrOfTrame)


      try {
            await Promise.all(promises)        
      } catch (error) {
            console.log(error)
      }
}
)
