import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const client = axios.create({
  baseURL: API,
  timeout: 90_000, // LLM call can take a while
});

export const analyzeScript = async ({ script, brand, ratio }) => {
  const { data } = await client.post("/projects/analyze", { script, brand, ratio });
  return data;
};

export const listProjects = async () => {
  const { data } = await client.get("/projects");
  return data;
};

export const getProject = async (id) => {
  const { data } = await client.get(`/projects/${id}`);
  return data;
};

export const updateProjectPlan = async (id, plan) => {
  const { data } = await client.put(`/projects/${id}`, { plan });
  return data;
};

export const regenerateScene = async (id, order, sceneScriptText) => {
  const { data } = await client.post(
    `/projects/${id}/scenes/${order}/regenerate`,
    sceneScriptText ? { sceneScriptText } : {},
  );
  return data;
};

export const regenerateFullPlan = async (id) => {
  const { data } = await client.post(`/projects/${id}/regenerate`);
  return data;
};
