import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { getCalendar } from "./calendar"; // ⬅️ import the calendar httpAction

const http = httpRouter();

// Keep existing auth routes
auth.addHttpRoutes(http);

// Add calendar subscription endpoint
http.route({
  path: "/calendar.ics",
  method: "GET",
  handler: getCalendar,
});

export default http;