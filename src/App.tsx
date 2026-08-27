function App() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0b1220",
      color: "white",
      fontFamily: "Arial, sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>
          NGAO Sentinel
        </h1>

        <p style={{ color: "#94a3b8", fontSize: "18px" }}>
          Security Operations Platform
        </p>

        <div style={{
          marginTop: "30px",
          padding: "12px 24px",
          border: "1px solid #334155",
          borderRadius: "8px",
          display: "inline-block",
          color: "#22c55e",
        }}>
          ● System Online
        </div>
      </div>
    </div>
  );
}

export default App;