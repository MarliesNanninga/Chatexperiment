import InterviewPracticeBot from '@/components/InterviewPracticeBot'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">studiemeister</h1>
            </div>
            <button className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              + Nieuwe cursus aanmaken
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
            Welkom bij Sollicitatietraining 👋
          </h2>
          <p className="text-gray-600">
            Oefen je sollicitatievaardigheden met AI-powered gesprekssimulaties
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <InterviewPracticeBot />
        </div>
      </div>
    </div>
  )
}