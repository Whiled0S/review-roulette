import { Scene } from "./components/Experience/Scene";
import { Overlay } from "./components/UI/Overlay";
import "./App.css";

const App = () => {
  return (
    <div className="app-container">
      <div className="scene-container">
        <Scene />
      </div>
      <div className="overlay-container">
        <Overlay />
      </div>
    </div>
  );
};

export default App;
