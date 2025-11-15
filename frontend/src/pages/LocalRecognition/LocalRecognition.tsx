import React from "react";
import LocalRecognitionWidget from "../../Components/LocalRecognitionWidget/LocalRecognitionWidget";
import "./LocalRecognition.css";

export default function LocalRecognitionPage() {
  return (
    <div className="local-recognition-page">
      <div className="page-container">
        <div className="page-content">
          <LocalRecognitionWidget />
        </div>
      </div>
    </div>
  );
}
