
// Date: Sun, 24 Sep 2023
// Author: LafTools Team <work7z@outlook.com>
// Description:
// Copyright (C) 2023 - Present, https://codegen.cc
// License: AGPLv3

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import _ from "lodash";
import { PayloadListData, PayloadValueData } from "../../constants";
import { url } from "inspector";
import { getHeaders } from "../request";
import { URL_AUTH_GET_FINDPW, URL_AUTH_GET_SIGNIN, URL_AUTH_GET_SIGNOUT, URL_AUTH_GET_SIGNUP } from "../constants/api_constants";
import AlertUtils from "@/utils/AlertUtils";

export let withPrefixOpenAPI = (url: string): string => {
  return "/open" + url;
};


const URL_PREFIX_LOCAL = '/v3'
export type SignInCredentials = {
  signed: boolean;
  signature: string | null;
};
export type AsyncCreateResponse<T> = {
  message?: string; // normal message
  error?: string; // error
  data?: T;
};

export let verifyResponse = (response: AsyncCreateResponse<any> | undefined): boolean => {
  if (!response || response.error) {
    if (response) {
      AlertUtils.alertErr(response.error)
    }
    return false;
  } else {
    return true;
  }
}


export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    // Fill in your own server starting URL here
    baseUrl: URL_PREFIX_LOCAL,
    prepareHeaders(headers, api) {
      let headers_New = getHeaders();
      _.forEach(headers_New, (x, d, n) => {
        if (!_.isNil(x)) {
          headers.set(d, x);
        }
      });
      return headers;
    },
    validateStatus: (response, result) => {
      let errorHandler = () => {
        AlertUtils.alertErr("抱歉，网络不稳定，请稍后重试")
      }
      let errors = _.get(result, "errors");
      if (!_.isEmpty(errors)) {
        errorHandler()
        return false;
      }
      let shouldOk = response && response.status === 200
      if (!shouldOk) {
        errorHandler()
      }
      return shouldOk;
    },
  }),
  endpoints: (build) => ({
    sayHelloWorld: build.query<string, void>({
      query: () => {
        return {
          url: "/hello-world",
          method: "GET",
        };
      },
    }),
    // auth
    signIn: build.query<AsyncCreateResponse<SignInCredentials>, {
      userAcctId: string,
      password: string,
      rememberMe: boolean,
    }>({
      query: (obj) => {
        return {
          method: "POST",
          url: URL_AUTH_GET_SIGNIN,
          body: obj,
        };
      },
    }),
    signUp: build.query<AsyncCreateResponse<SignInCredentials>, {
      preview: boolean,
      userAcctId: string,
      password: string,
      email: string,
      confirmPassword: string,
      rememberMe: boolean,
    }>({
      query: (obj) => {
        return {
          method: "POST",
          url: URL_AUTH_GET_SIGNUP,
          body: obj
        };
      },
    }),
    signOut: build.query<AsyncCreateResponse<any>, { username: string; password: string }>({
      query: (obj) => {
        return {
          method: "POST",
          url: URL_AUTH_GET_SIGNOUT,
          body: obj
        };
      },
    }),
    findPw: build.query<AsyncCreateResponse<any>, { username: string; password: string }>({
      query: (obj) => {
        return {
          method: "POST",
          url: URL_AUTH_GET_FINDPW,
          data: obj,
        };
      },
    }),
  }),
});



export default apiSlice;
