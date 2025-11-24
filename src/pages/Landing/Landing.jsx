import { useNavigate } from "react-router-dom";
import './Landing.css'

export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
      <div className="landing-container">
        
        <button 
          className="big-action-btn primary" 
          onClick={() => navigate("/create/paste")}
        >
          <div className="icon-wrapper">📝</div>
          <h2>Create Paste</h2>
        </button>

        <button 
          className="big-action-btn secondary" 
          onClick={() => navigate("/create/image")}
        >
          <div className="icon-wrapper">🖼️</div>
          <h2>Upload Image</h2>
        </button>

      </div>
    </>
  )
}