import { getObjectUL } from "./readUL";
import { setObject } from "./writeNew";
import {useObject} from "@/store/object";
export async function setCommit0(username, buildingId){
	const objectData = useObject();
	const data = objectData.getData();
	data.commit = 0;
	objectData.setData(data);
	await setObject(username, buildingId, data);
}
export async function setCommit1(username, buildingId){
	const objectData = useObject();
	const data = objectData.getData();
	data.commit = 1;
	objectData.setData(data);
	await setObject(username, buildingId, data);
}
export async function readCommit(username, buildingId){
	const data = await getObjectUL(username,buildingId)
	return data.commit;
}