/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as assessmentGrades from "../assessmentGrades.js";
import type * as assessmentTasks from "../assessmentTasks.js";
import type * as assessments from "../assessments.js";
import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as http from "../http.js";
import type * as serverUtils from "../serverUtils.js";
import type * as subjects from "../subjects.js";
import type * as users from "../users.js";
import type * as validation from "../validation.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  assessmentGrades: typeof assessmentGrades;
  assessmentTasks: typeof assessmentTasks;
  assessments: typeof assessments;
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  http: typeof http;
  serverUtils: typeof serverUtils;
  subjects: typeof subjects;
  users: typeof users;
  validation: typeof validation;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
