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
import type * as assessments from "../assessments.js";
import type * as auth from "../auth.js";
import type * as authHelpers from "../authHelpers.js";
import type * as calendarEvents from "../calendarEvents.js";
import type * as files from "../files.js";
import type * as grades from "../grades.js";
import type * as http from "../http.js";
import type * as parseSubject from "../parseSubject.js";
import type * as subjects from "../subjects.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";
import type * as validation from "../validation.js";
import type * as weeks from "../weeks.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  assessments: typeof assessments;
  auth: typeof auth;
  authHelpers: typeof authHelpers;
  calendarEvents: typeof calendarEvents;
  files: typeof files;
  grades: typeof grades;
  http: typeof http;
  parseSubject: typeof parseSubject;
  subjects: typeof subjects;
  tasks: typeof tasks;
  users: typeof users;
  validation: typeof validation;
  weeks: typeof weeks;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
