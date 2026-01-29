const Maintenance = () => {
  return (
    <div className="min-h-screen-dvh flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 text-white px-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold mb-4">🚧 Maintenance Mode</h1>
        <p className="text-white/90 mb-6">
          We’re currently performing system maintenance.
          <br />
          Please check back shortly.
        </p>
      </div>
    </div>
  );
};

export default Maintenance;
