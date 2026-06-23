import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProjectProvider } from "@/context/ProjectContext";
import { Toaster } from "@/components/ui/sonner";

import RatioSelection from "@/pages/RatioSelection";
import BrandDeck from "@/pages/BrandDeck";
import ScriptInput from "@/pages/ScriptInput";
import AnalysisReview from "@/pages/AnalysisReview";
import VideoPreview from "@/pages/VideoPreview";
import Export from "@/pages/Export";

function App() {
  return (
    <div className="App">
      <ProjectProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/ratio" replace />} />
            <Route path="/ratio" element={<RatioSelection />} />
            <Route path="/brand" element={<BrandDeck />} />
            <Route path="/script" element={<ScriptInput />} />
            <Route path="/analysis" element={<AnalysisReview />} />
            <Route path="/preview" element={<VideoPreview />} />
            <Route path="/export" element={<Export />} />
            <Route path="*" element={<Navigate to="/ratio" replace />} />
          </Routes>
          <Toaster theme="dark" position="bottom-right" />
        </BrowserRouter>
      </ProjectProvider>
    </div>
  );
}

export default App;
