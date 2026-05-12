/**
 * 离线同步元数据：每条 document_store 记录对应服务端合并维度（offline_uuid 等）。
 *
 * 同步语义（与 writeUlBridgeDocument / writeUdDocument 一致，供后续「上行」实现对照）：
 * - 「修改」：同一 (doc_type, doc_id) 再次写入即整包 payload 覆盖，已包含对原有数据的编辑；上行时应推送
 *   最新整包 JSON（或后端约定的增量 DTO），并携带 offline_uuid 做幂等。
 * - 「删除」：业务上走 markUlBridgeDocumentDeleted / markUdDocumentDeleted，保留 payload、offline_deleted=1、
 *   is_offline_data=1，上行时需单独通知服务端删除或 tombstone，不能仅依赖「未出现在列表」推断删除。
 * - 「新增」：新 doc_id（如新年份 disease）或首写即 INSERT；与修改共用同一套 UPSERT 与 offline 字段。
 *
 * 附件（桥梁图 / 病害图）：payload 内一般为路径或 URL；二进制文件应与 JSON 分队列上传/下载，见 writeNew.js
 * 中 saveBridgeImages / saveDiseaseImages（plus.downloader、本地 copy）；联网后用 uni.uploadFile 或 OSS 等
 * 由后端提供签名 URL 后再回填路径到对应 document 的 payload。
 */

import { v4 as uuidv4 } from 'uuid'

/** RFC4122 v4，使用 uuid 库（crypto.getRandomValues），避免手写 Math.random 碰撞风险 */
export function randomOfflineUuid() {
	return uuidv4()
}
