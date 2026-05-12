import {deleteFolderInApp} from "@/utils/deleteFolder";
import {findMatchingULDirectory} from "@/utils/readJsonNew";

export async function deleteULbuilding(userName, buildingId) {
    const ULdir = await findMatchingULDirectory(userName);
    const deletePath = '_doc/' + `${ULdir}/building/${buildingId}`;
    deleteFolderInApp(deletePath)
}