import InterviewPracticeBot from '@/components/InterviewPracticeBot'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">studiemeister</h1>
                <p className="text-xs text-gray-500">AI Interview Training</p>
              </div>
            </div>
            <button className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              + Nieuwe cursus aanmaken
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-pink-600 rounded-2xl mb-6 shadow-lg">
            <span className="text-3xl">👋</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welkom bij Sollicitatietraining
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Oefen je sollicitatievaardigheden met AI-powered gesprekssimulaties en krijg professionele feedback
          </p>
        </div>

        {/* Main Application */}
        <div className="max-w-5xl mx-auto">
          <InterviewPracticeBot />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 Studiemeister - Powered by Gemini AI</p>
            <p className="mt-1">Bouw zelfvertrouwen voor je volgende carrièrestap</p>
          </div>
        </div>
      </footer>
    </div>
  )
}