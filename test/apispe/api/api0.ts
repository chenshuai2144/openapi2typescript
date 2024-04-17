// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

/** Run Template API POST /agent/runtemplate */
export async function postAgentRuntemplate(options?: { [key: string]: any }) {
  return request<{ message?: any }>('/agent/runtemplate', {
    method: 'POST',
    ...(options || {}),
  });
}

/** Active Licence API POST /licence/active */
export async function postLicenceActive(body: {}, file?: File, options?: { [key: string]: any }) {
  const formData = new FormData();

  if (file) {
    formData.append('file', file);
  }

  Object.keys(body).forEach((ele) => {
    const item = (body as any)[ele];

    if (item !== undefined && item !== null) {
      if (typeof item === 'object' && !(item instanceof File)) {
        if (item instanceof Array) {
          item.forEach((f) => formData.append(ele, f || ''));
        } else {
          formData.append(ele, JSON.stringify(item));
        }
      } else {
        formData.append(ele, item);
      }
    }
  });

  return request<{ message?: any }>('/licence/active', {
    method: 'POST',
    data: formData,
    requestType: 'form',
    ...(options || {}),
  });
}

/** Show Licence API GET /licence/info */
export async function getLicenceInfo(options?: { [key: string]: any }) {
  return request<{ message?: any }>('/licence/info', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Show machine code API GET /licence/machinecode */
export async function getLicenceMachinecode(options?: { [key: string]: any }) {
  return request<{ message?: any }>('/licence/machinecode', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Licence Test API GET /licence/test */
export async function getLicenceTest(options?: { [key: string]: any }) {
  return request<{ message?: any }>('/licence/test', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Create one Mydata for user (Folders,Files, & APIDataFeeds) POST /mydata/create */
export async function postMydataCreate(
  body: {
    /** The type of data to create ('folder', 'file', 'api_data_feed'). */
    type: string;
    /** Name of the folder or API data feed. Required for 'folder' and 'api_data_feed'. */
    name?: string;
    /** Name of the folder to upload files into. Required for 'file'. */
    folder_name?: string;
    /** Permission setting for the folder. Defaults to 'private' if not specified. */
    permission?: string;
    /** Boolean flag to set the folder as searchable. */
    is_searchable?: boolean;
    /** API code for the API data feed. Required for 'api_data_feed'. */
    api_code?: string;
  },
  options?: { [key: string]: any },
) {
  return request<{ message?: any }>('/mydata/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: body,
    ...(options || {}),
  });
}

/** Delete one Mydata for user (Folders,Files, & APIDataFeeds) DELETE /mydata/delete */
export async function deleteMydataOpenApiDelete(options?: { [key: string]: any }) {
  return request<{ message?: any }>('/mydata/delete', {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** List all mydata (Folders,Files, & APIDataFeeds) GET /mydata/list */
export async function getMydataList(options?: { [key: string]: any }) {
  return request<{ message?: any }>('/mydata/list', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Search one Mydata for its name or tags. GET /mydata/search */
export async function getMydataSearch(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getMydataSearchParams,
  options?: { [key: string]: any },
) {
  return request<any>('/mydata/search', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Update one Mydata for user (Folders,Files, & APIDataFeeds) GET /mydata/update */
export async function getMydataUpdate(options?: { [key: string]: any }) {
  return request<{ message?: any }>('/mydata/update', {
    method: 'GET',
    ...(options || {}),
  });
}

/** Update one Mydata for user (Folders,Files, & APIDataFeeds) POST /mydata/update */
export async function postMydataUpdate(options?: { [key: string]: any }) {
  return request<{ message?: any }>('/mydata/update', {
    method: 'POST',
    ...(options || {}),
  });
}
