import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { DEFAULT_BRAND_DECK, MOCK_SCENES } from "@/constants/mockData";
import { updateProjectPlan } from "@/lib/api";

const STORAGE_KEY = "broll.studio.v3";

const defaultState = {
  ratio: "16:9",
  brand: DEFAULT_BRAND_DECK,
  script: "",
  scenes: MOCK_SCENES,
  exportPreset: "hq",
  completedSteps: {},
  plan: null,
  projectId: null,
  analyzing: false,
  analyzeError: null,
  // Phase 4 — autosave indicator
  savingPlan: false,
  lastSavedAt: null,
};

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...defaultState,
          ...parsed,
          brand: { ...DEFAULT_BRAND_DECK, ...(parsed.brand || {}) },
          analyzing: false,
          analyzeError: null,
          savingPlan: false,
        };
      }
    } catch (e) {
      // ignore
    }
    return defaultState;
  });

  // Persist non-transient state to localStorage
  useEffect(() => {
    try {
      const { analyzing, analyzeError, savingPlan, lastSavedAt, ...persistable } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    } catch (e) {
      // ignore
    }
  }, [state]);

  // ---- Debounced auto-save of plan edits to backend ----
  const saveTimerRef = useRef(null);
  const lastSavedPlanRef = useRef(null);

  useEffect(() => {
    if (!state.projectId || !state.plan) return;
    // Skip if plan hasn't changed since last save
    const serialized = JSON.stringify(state.plan);
    if (serialized === lastSavedPlanRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setState((s) => (s.savingPlan ? s : { ...s, savingPlan: true }));

    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateProjectPlan(state.projectId, state.plan);
        lastSavedPlanRef.current = serialized;
        setState((s) => ({
          ...s,
          savingPlan: false,
          lastSavedAt: new Date().toISOString(),
        }));
      } catch (e) {
        // Silent retry on next change; surface via savingPlan=false
        setState((s) => ({ ...s, savingPlan: false }));
      }
    }, 900);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state.plan, state.projectId]);

  const update = (patch) => setState((s) => ({ ...s, ...patch }));
  const updateBrand = (patch) =>
    setState((s) => ({ ...s, brand: { ...s.brand, ...patch } }));
  const markStepDone = (id) =>
    setState((s) => ({
      ...s,
      completedSteps: { ...s.completedSteps, [id]: true },
    }));
  const reset = () => setState(defaultState);
  const resetBrand = () =>
    setState((s) => ({ ...s, brand: { ...DEFAULT_BRAND_DECK } }));

  const setPlan = (record) => {
    const newPlan = record?.plan || null;
    lastSavedPlanRef.current = newPlan ? JSON.stringify(newPlan) : null;
    setState((s) => ({
      ...s,
      plan: newPlan,
      projectId: record?.id || s.projectId,
      analyzing: false,
      analyzeError: null,
      lastSavedAt: new Date().toISOString(),
    }));
  };

  // Local edit helpers (auto-saved by the effect above)
  const updatePlan = (patch) =>
    setState((s) => (s.plan ? { ...s, plan: { ...s.plan, ...patch } } : s));

  const updateScene = (order, patch) =>
    setState((s) => {
      if (!s.plan) return s;
      const scenes = s.plan.scenes.map((sc) =>
        sc.order === order ? { ...sc, ...patch } : sc,
      );
      return { ...s, plan: { ...s.plan, scenes } };
    });

  const reorderScene = (order, direction) =>
    setState((s) => {
      if (!s.plan) return s;
      const scenes = [...s.plan.scenes];
      const idx = scenes.findIndex((sc) => sc.order === order);
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (idx < 0 || target < 0 || target >= scenes.length) return s;
      [scenes[idx], scenes[target]] = [scenes[target], scenes[idx]];
      // renumber
      const renum = scenes.map((sc, i) => ({ ...sc, order: i + 1 }));
      return { ...s, plan: { ...s.plan, scenes: renum } };
    });

  const replaceScene = (order, newScene) =>
    setState((s) => {
      if (!s.plan) return s;
      const scenes = s.plan.scenes.map((sc) =>
        sc.order === order ? { ...newScene, order } : sc,
      );
      return { ...s, plan: { ...s.plan, scenes } };
    });

  const setAnalyzing = (v) =>
    setState((s) => ({ ...s, analyzing: v, analyzeError: v ? null : s.analyzeError }));
  const setAnalyzeError = (err) =>
    setState((s) => ({ ...s, analyzing: false, analyzeError: err }));

  return (
    <ProjectContext.Provider
      value={{
        state,
        update,
        updateBrand,
        markStepDone,
        reset,
        resetBrand,
        setPlan,
        updatePlan,
        updateScene,
        reorderScene,
        replaceScene,
        setAnalyzing,
        setAnalyzeError,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
};
