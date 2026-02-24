
// This is a placeholder for the tutor's main dashboard.
// In later phases, this route will be protected, requiring a valid session.
export default function TutorDashboard() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800">Welcome, Tutor!</h1>
        <p className="mt-2 text-lg text-gray-600">You have successfully logged in.</p>
      </div>
    </main>
  );
}
