import {
  type ActionFunctionArgs,
  type EntryContext,
  type LoaderFunctionArgs,
  type RouterContextProvider,
  ServerRouter,
  type ServerInstrumentation,
} from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { getAppContext } from "~/lib/appContext";

export const streamTimeout = 10_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: RouterContextProvider,
) {
  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
    },
  );
  shellRendered = true;

  // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("X-App-Version", routerContext.manifest.version);
  responseHeaders.set("Content-Type", "text/html; charset=utf-8");
  getAppContext(loadContext).measurer.appendServerTimingHeaders(responseHeaders);

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

export function handleDataRequest(
  response: Response,
  { context }: LoaderFunctionArgs | ActionFunctionArgs,
) {
  getAppContext(context).measurer.appendServerTimingHeaders(response.headers);
  return response;
}

function sanitizeRouteId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "-");
}

const logging: ServerInstrumentation = {
  route({ instrument, id }) {
    const sanitizedId = sanitizeRouteId(id);
    instrument({
      middleware: async (fn, { context }) => {
        await getAppContext(context).measurer.time(
          `middleware-${sanitizedId}`,
          fn,
        );
      },
      loader: async (fn, { context }) => {
        await getAppContext(context).measurer.time(
          `loader-${sanitizedId}`,
          fn,
        );
      },
      action: async (fn, { context }) => {
        await getAppContext(context).measurer.time(
          `action-${sanitizedId}`,
          fn,
        );
      },
    });
  },
};

export const instrumentations = [logging];
