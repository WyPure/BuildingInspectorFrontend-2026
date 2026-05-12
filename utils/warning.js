import { getObjectUL } from "./readUL";
import { setObject } from "./writeNew";
import {useObject} from '@/store/object.js'
export async function setWarning(username, buildingId){
	const ObjectData = useObject()
	const data = ObjectData.getData()
	data.warning = true;
	await setObject(username, buildingId, data);
}
export async function readWarning(username, buildingId){
	const ObjectData = useObject()
	const data = ObjectData.getData()
	if(data.warning === true){
		return true;
	}else{
		return false;
	}
}
export async function resetWarning(username, buildingId){
	const ObjectData = useObject()
	const data = ObjectData.getData()
	data.warning = false;
	await setObject(username, buildingId, data);
}