import {
    saveBridgeImages,
    setFrontPhoto
} from "@/utils/writeNew";
import {
    getFrontPhoto, getUDFrontPhoto, readBridgeUDImage
} from "@/utils/readJsonNew.js";
export async function setFrontPhotoCommited(userName, buildingId){
    const data = await getFrontPhoto(userName, buildingId);
    data.commitType = 1;
    await setFrontPhoto(userName, buildingId, data);
}
export async function setFrontPhotoUnCommited(userName, buildingId){
    const data = await getFrontPhoto(userName, buildingId);
    data.commitType = 0;
    await setFrontPhoto(userName, buildingId, data);
}
export async function isPhotoCommmitted(userName, buildingId){
    try{
        const data = await getFrontPhoto(userName, buildingId);
        return data.commitType;
    }catch (e){
        return 2;
    }
}

export async function copyFrontPhoto(userName, buildingId){
    try{
        const UDData = await getUDFrontPhoto(userName, buildingId);
        const ULdata = {
            frontLeft: [],
            frontRight: [],
            sideLeft: [],
            sideRight: [],
            commitType: 2 //0未提交 1已提交 2没存图片
        };
        UDData.frontLeft = await readBridgeUDImage(userName, buildingId, UDData.frontLeft);
        UDData.frontRight = await readBridgeUDImage(userName, buildingId, UDData.frontRight);
        UDData.sideLeft = await readBridgeUDImage(userName, buildingId, UDData.sideLeft);
        UDData.sideRight = await readBridgeUDImage(userName, buildingId, UDData.sideRight);
        ULdata.frontLeft = await saveBridgeImages(userName, buildingId, UDData.frontLeft);
        ULdata.frontRight = await saveBridgeImages(userName, buildingId, UDData.frontRight);
        ULdata.sideLeft = await saveBridgeImages(userName, buildingId, UDData.sideLeft);
        ULdata.sideRight = await saveBridgeImages(userName, buildingId, UDData.sideRight);
        await setFrontPhoto(userName, buildingId, ULdata);
    }catch (e) {
        const ULdata = {
            frontLeft: [],
            frontRight: [],
            sideLeft: [],
            sideRight: [],
            commitType: 2 //0未提交 1已提交 2没存图片
        };
        await setFrontPhoto(userName, buildingId, ULdata);
    }
}