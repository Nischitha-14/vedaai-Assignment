import { getServerlessApp } from "../src/serverless/createServerlessApp";

export const config = {
  api: {
    bodyParser: false
  },
  maxDuration: 300
};

export default async function handler(request: any, response: any) {
  const { app } = await getServerlessApp();
  return app(request, response);
}
