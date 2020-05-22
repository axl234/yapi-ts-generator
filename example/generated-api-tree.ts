import { IJimuApiOption } from "@jimengio/api-base";
import { Id, EApiKind } from "../src/types";
import { insertPublicHost } from "../src/configs";
import {
  ajaxGet,
  ajaxDelete,
  ajaxPost,
  ajaxPut,
  hooksGet,
  hooksPost,
  hooksPut,
  hooksDelete,
  dynamicGet,
  dynamicPost,
  dynamicPut,
  dynamicDelete,
} from "../src/funcs";

/** Generated by generator */

export let genSeedApiTree = {
  user: {
    info: {
      /** 更新用户信息 */
      POST: (body: IApiBodyPost_UserInfo, opts?: IJimuApiOption) =>
        ajaxPost<IApiResultPost_UserInfo>(insertPublicHost("/user/info"), `/user/info`, body, {}, opts),
      /** 更新用户信息 */
      usePOST: () => hooksPost<IApiResultPost_UserInfo, IApiBodyPost_UserInfo>(insertPublicHost("/user/info"), `/user/info`),
      /** 更新用户信息 */
      dynamicPOST: () => dynamicPost<IApiResultPost_UserInfo, IApiBodyPost_UserInfo, {}, {}>(EApiKind.public, "/user/info"),
    },
    me: {
      /** 用户信息 */
      GET: (q?: IApiQuery_UserMe, opts?: IJimuApiOption) => ajaxGet<IApiResultGet_UserMe>(insertPublicHost("/user/me"), `/user/me`, q, opts),
      /** 用户信息 */
      useGET: (q?: IApiQuery_UserMe, opts?: IJimuApiOption) =>
        hooksGet<IApiResultGet_UserMe, IApiQuery_UserMe>(insertPublicHost("/user/me"), `/user/me`, q, opts),
      /** 用户信息 */
      dynamicGET: () => dynamicGet<IApiResultGet_UserMe, IApiQuery_UserMe, {}>(EApiKind.public, "/user/me"),
    },
  },
};

export interface IApiBodyPost_UserInfo {
  name: string;
  gender: string;
}
export interface IApiQuery_UserMe {
  /** 包含详细信息 */
  withPosition?: any;
}
export interface IApiResultGet_UserMe {
  id: string;
  name: string;
  position?: { id?: string; name?: string };
}
export interface IApiResultPost_UserInfo {
  id: string;
  name: string;
}